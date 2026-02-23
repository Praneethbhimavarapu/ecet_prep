import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import cors from "cors";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Environment Variables with Validation
const MONGO_URL = process.env.MONGO_URL;
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || 'ecet_platform';
const JWT_SECRET = process.env.JWT_SECRET;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PORT = process.env.PORT || 3000;
const CORS_ORIGINS = process.env.CORS_ORIGINS || '*';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

if (!MONGO_URL) {
  throw new Error('MONGO_URL environment variable is required');
}

if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is required');
}

// MongoDB Connection
const client = new MongoClient(MONGO_URL);
let db: any;

async function connectDB() {
  try {
    await client.connect();
    db = client.db(MONGO_DB_NAME);
    console.log("✅ Connected to MongoDB");
    
    // Create indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('test_attempts').createIndex({ user_id: 1 });
    await db.collection('bookmarks').createIndex({ user_id: 1 });
    await db.collection('static_questions').createIndex({ subject: 1 });
    await db.collection('static_questions').createIndex({ is_important: 1 });
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
}

// Gemini AI Setup
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const questionSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      text: { type: Type.STRING, description: "The question text" },
      options: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "Exactly 4 options"
      },
      correctAnswer: { type: Type.INTEGER, description: "Index of correct option (0-3)" },
      explanation: { type: Type.STRING, description: "Detailed beginner-friendly explanation" },
      subject: { type: Type.STRING, description: "The subject of the question" },
      difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] },
      is_important: { type: Type.BOOLEAN, description: "Whether this is a highly probable/important question" }
    },
    required: ["text", "options", "correctAnswer", "explanation", "subject", "difficulty", "is_important"]
  }
};

const app = express();

// Middleware
app.use(cors({
  origin: CORS_ORIGINS === '*' ? '*' : CORS_ORIGINS.split(',')
}));
app.use(express.json());

// Auth Middleware
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Auth Routes
app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.collection('users').insertOne({
      name,
      email,
      password: hashedPassword,
      created_at: new Date()
    });
    
    const user = { id: result.insertedId.toString(), name, email };
    const token = jwt.sign(user, JWT_SECRET);
    res.json({ token, user });
  } catch (err: any) {
    if (err.code === 11000) {
      res.status(400).json({ error: "Email already exists" });
    } else {
      res.status(500).json({ error: "Registration failed" });
    }
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await db.collection('users').findOne({ email });
  
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  
  const userData = { id: user._id.toString(), name: user.name, email: user.email };
  const token = jwt.sign(userData, JWT_SECRET);
  res.json({ token, user: userData });
});

// Gemini Question Generation (Backend Only)
app.post("/api/generate-questions", authenticate, async (req: any, res) => {
  const { subject, count = 30, windowIndex = 0 } = req.body;
  
  try {
    const batchSize = 25;
    let allQuestions: any[] = [];
    const batches = Math.ceil(count / batchSize);

    const getFullMockPrompt = (batchIdx: number, size: number) => {
      let distribution = "";
      let sequenceOrder = "";
      if (windowIndex === 0) {
        distribution = "Math: 12, Physics: 6, Chemistry: 6, CSE (Digital Electronics: 6, Software Eng: 6, CO: 8, Data Structures: 4)";
        sequenceOrder = "1. Math, 2. Physics, 3. Chemistry, 4. Digital Electronics, 5. Software Eng, 6. Computer Organization, 7. Data Structures";
      } else if (windowIndex === 1) {
        distribution = "Math: 13, Physics: 6, Chemistry: 6, CSE (Data Structures: 6, Computer Networks: 6, OS: 7)";
        sequenceOrder = "1. Math, 2. Physics, 3. Chemistry, 4. Data Structures, 5. Computer Networks, 6. Operating Systems";
      } else if (windowIndex === 2) {
        distribution = "Math: 12, Physics: 6, Chemistry: 6, CSE (OS: 3, DBMS: 8, Java: 7)";
        sequenceOrder = "1. Math, 2. Physics, 3. Chemistry, 4. Operating Systems, 5. DBMS, 6. Java/Programming";
      } else if (windowIndex === 3) {
        distribution = "Math: 13, Physics: 7, Chemistry: 7, CSE (Java: 3, Web Tech: 8, Big Data: 6, Android: 6, IoT: 8, Python: 8)";
        sequenceOrder = "1. Math, 2. Physics, 3. Chemistry, 4. Java, 5. Web Tech, 6. Big Data, 7. Android, 8. IoT, 9. Python";
      }

      return `Generate ${size} highly probable and frequently asked multiple-choice questions for the AP ECET 2026 (CSE Branch) exam. 
         These questions should be strictly at the ECET competitive level.
         This is Window ${windowIndex + 1} (Questions ${windowIndex * 50 + 1} to ${(windowIndex + 1) * 50}).
         Batch ${batchIdx + 1}.
         
         SYLLABUS DISTRIBUTION FOR THIS WINDOW: ${distribution}.
         CRITICAL: You MUST generate the questions in the following SUBJECT SEQUENCE: ${sequenceOrder}.
         
         Follow the C-23 Diploma curriculum strictly.
         DISTRIBUTION: The questions MUST be evenly divided among difficulty levels: Easy, Medium, and Hard (ECET-level).
         IMPORTANT: Focus on "Most Probable" and "Very Important" questions that are likely to appear in the 2026 exam.
         For EACH question, provide a step-by-step explanation suitable for a COMPLETE BEGINNER. 
         Explain the concept simply, why the correct answer is right, and why the other options are incorrect.`;
    };

    for (let i = 0; i < batches; i++) {
      const currentBatchSize = Math.min(batchSize, count - allQuestions.length);
      if (currentBatchSize <= 0) break;

      const prompt = subject === 'Full' 
        ? getFullMockPrompt(i, currentBatchSize)
        : `Generate ${currentBatchSize} highly probable and frequently asked multiple-choice questions for the subject "${subject}" specifically for AP ECET 2026 (CSE Branch) preparation.
           These questions should be strictly at the ECET competitive level, focusing on core concepts and common problem patterns found in previous years' papers.
           This is batch ${i + 1} of ${batches}.
           Follow the C-23 Diploma curriculum strictly.
           DISTRIBUTION: The questions MUST be evenly divided among difficulty levels: Easy, Medium, and Hard (ECET-level).
           IMPORTANT: Focus on "Most Probable" and "Very Important" questions that are likely to appear in the 2026 exam.
           For EACH question, provide a step-by-step explanation suitable for a COMPLETE BEGINNER. 
           Explain the concept simply, why the correct answer is right, and why the other options are incorrect.`;

      try {
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: questionSchema
          }
        });

        const text = response.text;
        if (text) {
          const batchQuestions = JSON.parse(text);
          allQuestions = [...allQuestions, ...batchQuestions];
        }
      } catch (error) {
        console.error(`Error in batch ${i + 1}:`, error);
        if (allQuestions.length === 0) throw error;
        break;
      }
    }

    res.json(allQuestions.slice(0, count));
  } catch (error: any) {
    console.error("Question generation error:", error);
    res.status(500).json({ error: "Failed to generate questions", details: error.message });
  }
});

// Test Routes
app.post("/api/tests/save", authenticate, async (req: any, res) => {
  const { test_type, subject, score, total, duration } = req.body;
  
  await db.collection('test_attempts').insertOne({
    user_id: req.user.id,
    test_type,
    subject: subject || null,
    score,
    total,
    duration,
    date: new Date()
  });
  
  res.json({ success: true });
});

app.get("/api/tests/history", authenticate, async (req: any, res) => {
  const history = await db.collection('test_attempts')
    .find({ user_id: req.user.id })
    .sort({ date: -1 })
    .toArray();
  
  res.json(history);
});

app.get("/api/leaderboard", authenticate, async (req: any, res) => {
  const leaderboard = await db.collection('test_attempts').aggregate([
    {
      $group: {
        _id: "$user_id",
        tests_taken: { $sum: 1 },
        total_score: { $sum: "$score" },
        possible_score: { $sum: "$total" }
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user"
      }
    },
    {
      $unwind: "$user"
    },
    {
      $project: {
        id: "$_id",
        name: "$user.name",
        tests_taken: 1,
        total_score: 1,
        possible_score: 1,
        avg_accuracy: {
          $round: [
            { $multiply: [{ $divide: ["$total_score", "$possible_score"] }, 100] },
            1
          ]
        }
      }
    },
    {
      $sort: { avg_accuracy: -1, total_score: -1 }
    },
    {
      $limit: 10
    }
  ]).toArray();
  
  res.json(leaderboard);
});

// Bookmark Routes
app.post("/api/bookmarks", authenticate, async (req: any, res) => {
  const { question_data } = req.body;
  
  await db.collection('bookmarks').insertOne({
    user_id: req.user.id,
    question_data,
    created_at: new Date()
  });
  
  res.json({ success: true });
});

app.get("/api/bookmarks", authenticate, async (req: any, res) => {
  const bookmarks = await db.collection('bookmarks')
    .find({ user_id: req.user.id })
    .toArray();
  
  res.json(bookmarks);
});

app.delete("/api/bookmarks/:id", authenticate, async (req: any, res) => {
  await db.collection('bookmarks').deleteOne({
    _id: new ObjectId(req.params.id),
    user_id: req.user.id
  });
  
  res.json({ success: true });
});

// Static Questions Routes
app.get("/api/questions/important", async (req, res) => {
  const questions = await db.collection('static_questions')
    .aggregate([
      { $match: { is_important: true } },
      { $sample: { size: 20 } }
    ])
    .toArray();
  
  res.json(questions);
});

app.get("/api/questions/static/:subject", async (req, res) => {
  const questions = await db.collection('static_questions')
    .aggregate([
      { $match: { subject: req.params.subject } },
      { $sample: { size: 10 } }
    ])
    .toArray();
  
  res.json(questions);
});

app.post("/api/admin/seed-static", async (req, res) => {
  const { questions } = req.body;
  if (!Array.isArray(questions)) return res.status(400).json({ error: "Invalid data" });

  await db.collection('static_questions').insertMany(questions);
  res.json({ success: true, count: questions.length });
});

app.get("/api/admin/static-count", async (req, res) => {
  const counts = await db.collection('static_questions').aggregate([
    {
      $group: {
        _id: "$subject",
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        subject: "$_id",
        count: 1
      }
    }
  ]).toArray();
  
  res.json(counts);
});

// Vite Setup
async function startServer() {
  await connectDB();
  
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Database: MongoDB`);
    console.log(`🤖 Gemini AI: Enabled`);
  });
}

startServer();

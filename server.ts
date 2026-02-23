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
    await db.collection('test_attempts').createIndex({ date: -1 });
    await db.collection('bookmarks').createIndex({ user_id: 1 });
    await db.collection('static_questions').createIndex({ subject: 1 });
    await db.collection('static_questions').createIndex({ is_important: 1 });
    await db.collection('user_progress').createIndex({ user_id: 1 });
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
    
    // Initialize user progress
    await db.collection('user_progress').insertOne({
      user_id: result.insertedId.toString(),
      total_tests: 0,
      total_score: 0,
      total_possible: 0,
      avg_accuracy: 0,
      subjects_completed: [],
      windows_completed: [],
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

// NEW: Generate Questions with 200-question support and windowed approach
app.post("/api/generate-questions", authenticate, async (req: any, res) => {
  const { subject, count = 30, windowIndex = 0 } = req.body;
  
  try {
    const batchSize = 25;
    let allQuestions: any[] = [];
    const batches = Math.ceil(count / batchSize);

    // Full Mock Test Distribution (200 questions = 100 MPC + 100 CSE Core)
    // 4 Windows × 50 questions each
    const getFullMockPrompt = (batchIdx: number, size: number) => {
      let distribution = "";
      let sequenceOrder = "";
      
      if (windowIndex === 0) {
        // Window 1: 50 questions (Math: 25, Physics: 12, Chemistry: 13)
        distribution = "Math: 25, Physics: 12, Chemistry: 13";
        sequenceOrder = "1. Mathematics (25 questions), 2. Physics (12 questions), 3. Chemistry (13 questions)";
      } else if (windowIndex === 1) {
        // Window 2: 50 questions (Math: 25, Physics: 13, Chemistry: 12)
        distribution = "Math: 25, Physics: 13, Chemistry: 12";
        sequenceOrder = "1. Mathematics (25 questions), 2. Physics (13 questions), 3. Chemistry (12 questions)";
      } else if (windowIndex === 2) {
        // Window 3: 50 questions (Programming in C: 10, Data Structures: 10, Digital Electronics: 10, Computer Organization: 10, Operating Systems: 10)
        distribution = "Programming in C: 10, Data Structures: 10, Digital Electronics: 10, Computer Organization: 10, Operating Systems: 10";
        sequenceOrder = "1. Programming in C (10), 2. Data Structures (10), 3. Digital Electronics (10), 4. Computer Organization (10), 5. Operating Systems (10)";
      } else if (windowIndex === 3) {
        // Window 4: 50 questions (Database Management Systems: 10, Computer Networks: 10, Programming in C: 10, Data Structures: 10, Operating Systems: 10)
        distribution = "Database Management Systems: 10, Computer Networks: 10, Programming in C: 10, Data Structures: 10, Operating Systems: 10";
        sequenceOrder = "1. DBMS (10), 2. Computer Networks (10), 3. Programming in C (10), 4. Data Structures (10), 5. Operating Systems (10)";
      }

      return `Generate ${size} highly probable and frequently asked multiple-choice questions for the AP ECET 2026 (CSE Branch) exam. 
         These questions should be strictly at the ECET competitive level.
         This is Window ${windowIndex + 1} of 4 (Questions ${windowIndex * 50 + 1} to ${(windowIndex + 1) * 50} out of 200 total).
         Batch ${batchIdx + 1}.
         
         SYLLABUS DISTRIBUTION FOR THIS WINDOW: ${distribution}.
         CRITICAL: You MUST generate the questions in the following SUBJECT SEQUENCE: ${sequenceOrder}.
         
         Follow the C-23 Diploma curriculum strictly.
         DISTRIBUTION: The questions MUST be evenly divided among difficulty levels: Easy (30%), Medium (50%), and Hard (20%) at ECET competitive level.
         IMPORTANT: Focus on "Most Probable" and "Very Important" questions that are likely to appear in the 2026 exam.
         For EACH question, provide a step-by-step explanation suitable for a COMPLETE BEGINNER. 
         Start with basic concepts, explain the solution process, why the correct answer is right, and why each incorrect option is wrong.
         Use simple language and avoid jargon where possible.`;
    };

    for (let i = 0; i < batches; i++) {
      const currentBatchSize = Math.min(batchSize, count - allQuestions.length);
      if (currentBatchSize <= 0) break;

      const prompt = subject === 'Full' 
        ? getFullMockPrompt(i, currentBatchSize)
        : `Generate ${currentBatchSize} highly probable and frequently asked multiple-choice questions for the subject "${subject}" specifically for AP ECET 2026 (CSE Branch) preparation.
           These questions should be strictly at the ECET competitive level, focusing on core concepts and common problem patterns found in previous years' papers.
           This is batch ${i + 1} of ${batches}. Generate 30 questions total for subject-wise tests.
           Follow the C-23 Diploma curriculum strictly.
           DISTRIBUTION: Easy (30%), Medium (50%), Hard (20%) at ECET level.
           IMPORTANT: Focus on "Most Probable" and "Very Important" questions that are likely to appear in the 2026 exam.
           For EACH question, provide a step-by-step explanation suitable for a COMPLETE BEGINNER. 
           Start with basic concepts, explain the solution process clearly, why the correct answer is right, and why each incorrect option is wrong.
           Use simple, easy-to-understand language. Avoid complex jargon. Think of explaining to someone learning the concept for the first time.`;

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

// NEW: Generate and store "Most Important Questions" static pool
app.post("/api/admin/generate-important-pool", async (req, res) => {
  const { subject, count = 200 } = req.body;
  
  try {
    const batchSize = 25;
    let allQuestions: any[] = [];
    const batches = Math.ceil(count / batchSize);

    for (let i = 0; i < batches; i++) {
      const currentBatchSize = Math.min(batchSize, count - allQuestions.length);
      if (currentBatchSize <= 0) break;

      const prompt = `Generate ${currentBatchSize} HIGHLY PROBABLE and VERY IMPORTANT multiple-choice questions for the subject "${subject}" specifically for AP ECET 2026 (CSE Branch) exam.
         These are the MOST IMPORTANT questions that are HIGHLY LIKELY to appear in the actual exam.
         Focus on frequently asked topics, common problem patterns, and critical concepts from C-23 Diploma curriculum.
         This is batch ${i + 1} of ${batches} for building a static pool of 200+ most important questions.
         
         DIFFICULTY DISTRIBUTION: Easy (25%), Medium (50%), Hard (25%) - all at ECET competitive level.
         
         For EACH question, provide an EXTREMELY DETAILED explanation suitable for a COMPLETE BEGINNER:
         - Start with the basic concept/formula/principle
         - Break down the solution into simple steps
         - Explain why the correct answer is right with reasoning
         - Explain why EACH incorrect option is wrong
         - Use simple, everyday language
         - Add tips or shortcuts if applicable
         
         Mark is_important as true for ALL questions in this batch.`;

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
        console.error(`Error in important pool batch ${i + 1}:`, error);
        if (allQuestions.length === 0) throw error;
        break;
      }
    }

    // Store in database
    const questionsWithMetadata = allQuestions.map(q => ({
      ...q,
      is_important: true,
      created_at: new Date()
    }));
    
    await db.collection('static_questions').insertMany(questionsWithMetadata);
    
    res.json({ 
      success: true, 
      count: questionsWithMetadata.length,
      subject 
    });
  } catch (error: any) {
    console.error("Important pool generation error:", error);
    res.status(500).json({ error: "Failed to generate important pool", details: error.message });
  }
});

// Test Routes with window tracking
app.post("/api/tests/save", authenticate, async (req: any, res) => {
  const { test_type, subject, score, total, duration, windowIndex } = req.body;
  
  await db.collection('test_attempts').insertOne({
    user_id: req.user.id,
    test_type,
    subject: subject || null,
    score,
    total,
    duration,
    windowIndex: windowIndex || 0,
    date: new Date()
  });
  
  // Update user progress
  const progress = await db.collection('user_progress').findOne({ user_id: req.user.id });
  if (progress) {
    await db.collection('user_progress').updateOne(
      { user_id: req.user.id },
      {
        $set: {
          total_tests: progress.total_tests + 1,
          total_score: progress.total_score + score,
          total_possible: progress.total_possible + total,
          avg_accuracy: ((progress.total_score + score) / (progress.total_possible + total)) * 100,
          last_updated: new Date()
        },
        $addToSet: {
          subjects_completed: subject,
          windows_completed: windowIndex !== undefined ? `${test_type}_${windowIndex}` : null
        }
      }
    );
  }
  
  res.json({ success: true });
});

app.get("/api/tests/history", authenticate, async (req: any, res) => {
  const history = await db.collection('test_attempts')
    .find({ user_id: req.user.id })
    .sort({ date: -1 })
    .limit(100)
    .toArray();
  
  res.json(history);
});

// NEW: Get user progress
app.get("/api/progress", authenticate, async (req: any, res) => {
  const progress = await db.collection('user_progress').findOne({ user_id: req.user.id });
  res.json(progress || {});
});

// NEW: Get friends/comparison leaderboard
app.get("/api/leaderboard", authenticate, async (req: any, res) => {
  const leaderboard = await db.collection('user_progress').aggregate([
    {
      $lookup: {
        from: "users",
        localField: "user_id",
        foreignField: "_id",
        as: "user",
        pipeline: [
          { $project: { name: 1, email: 1 } }
        ]
      }
    },
    {
      $unwind: { path: "$user", preserveNullAndEmptyArrays: true }
    },
    {
      $project: {
        user_id: 1,
        name: { $ifNull: ["$user.name", "Unknown"] },
        total_tests: 1,
        total_score: 1,
        total_possible: 1,
        avg_accuracy: 1
      }
    },
    {
      $sort: { avg_accuracy: -1, total_score: -1 }
    },
    {
      $limit: 50
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
    .limit(200)
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

// Static Questions Routes (Most Important Questions)
app.get("/api/questions/important", async (req, res) => {
  const { subject } = req.query;
  
  const query: any = { is_important: true };
  if (subject && subject !== 'all') {
    query.subject = subject;
  }
  
  const questions = await db.collection('static_questions')
    .find(query)
    .limit(200)
    .toArray();
  
  res.json(questions);
});

app.get("/api/questions/static/:subject", async (req, res) => {
  const questions = await db.collection('static_questions')
    .aggregate([
      { $match: { subject: req.params.subject } },
      { $sample: { size: 30 } }
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
        count: { $sum: 1 },
        important_count: {
          $sum: { $cond: [{ $eq: ["$is_important", true] }, 1, 0] }
        }
      }
    },
    {
      $project: {
        _id: 0,
        subject: "$_id",
        count: 1,
        important_count: 1
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
    console.log(`📊 Database: MongoDB (${MONGO_DB_NAME})`);
    console.log(`🤖 Gemini AI: Enabled`);
  });
}

startServer();

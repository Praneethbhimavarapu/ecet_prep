import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import cors from "cors";
import Groq from "groq-sdk";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Environment Variables with Validation
const MONGO_URL = process.env.MONGO_URL;
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || 'ecet_platform';
const JWT_SECRET = process.env.JWT_SECRET;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const PORT = process.env.PORT || 3000;
const CORS_ORIGINS = process.env.CORS_ORIGINS || '*';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

if (!MONGO_URL) {
  throw new Error('MONGO_URL environment variable is required');
}

if (!GROQ_API_KEY) {
  throw new Error('GROQ_API_KEY environment variable is required');
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

// Groq AI Setup
const groq = new Groq({ apiKey: GROQ_API_KEY });

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

// Generate Questions with Groq (200-question support with windowed approach)
app.post("/api/generate-questions", authenticate, async (req: any, res) => {
  const { subject, count = 30, windowIndex = 0 } = req.body;
  
  try {
    let allQuestions: any[] = [];
    
    // Full Mock Test Distribution (200 questions = 100 MPC + 100 CSE Core)
    // 4 Windows × 50 questions each
    const getFullMockPrompt = (windowIdx: number) => {
      let distribution = "";
      
      if (windowIdx === 0) {
        distribution = "Math: 25, Physics: 12, Chemistry: 13";
      } else if (windowIdx === 1) {
        distribution = "Math: 25, Physics: 13, Chemistry: 12";
      } else if (windowIdx === 2) {
        distribution = "Programming in C: 10, Data Structures: 10, Digital Electronics: 10, Computer Organization: 10, Operating Systems: 10";
      } else if (windowIdx === 3) {
        distribution = "Database Management Systems: 10, Computer Networks: 10, Programming in C: 10, Data Structures: 10, Operating Systems: 10";
      }

      return `Generate EXACTLY ${count} multiple-choice questions for AP ECET 2026 (CSE Branch) exam.
Window ${windowIdx + 1} of 4 (Questions ${windowIdx * 50 + 1}-${(windowIdx + 1) * 50} out of 200).

DISTRIBUTION: ${distribution}

CRITICAL REQUIREMENTS:
- Generate questions in SUBJECT SEQUENCE (all Math together, then Physics, etc.)
- ECET competitive level difficulty
- Easy (30%), Medium (50%), Hard (20%)
- Follow C-23 Diploma curriculum strictly
- Mark most probable questions as is_important: true

For EACH question provide:
- Clear question text
- 4 options (array of strings)
- correctAnswer (index 0-3)
- DETAILED explanation for COMPLETE BEGINNERS:
  * Start with basic concept/formula
  * Step-by-step solution
  * Why correct answer is right
  * Why each wrong answer is incorrect
  * Use simple language, avoid jargon
- subject (exact subject name)
- difficulty (Easy/Medium/Hard)

Return ONLY valid JSON array of question objects. No extra text.`;
    };

    const subjectPrompt = `Generate EXACTLY ${count} multiple-choice questions for "${subject}" for AP ECET 2026 (CSE Branch).

REQUIREMENTS:
- ECET competitive level
- Easy (30%), Medium (50%), Hard (20%)
- C-23 Diploma curriculum
- Most probable/important questions
- Mark critical questions as is_important: true

For EACH question provide:
- Clear question text
- 4 options (array of strings)  
- correctAnswer (index 0-3)
- DETAILED BEGINNER-FRIENDLY explanation:
  * Basic concept first
  * Step-by-step solution
  * Why correct answer is right
  * Why wrong answers are incorrect
  * Simple language
- subject: "${subject}"
- difficulty: Easy/Medium/Hard

Return ONLY valid JSON array. Format:
[{
  "text": "question",
  "options": ["opt1", "opt2", "opt3", "opt4"],
  "correctAnswer": 0,
  "explanation": "detailed explanation",
  "subject": "${subject}",
  "difficulty": "Medium",
  "is_important": false
}]`;

    const prompt = subject === 'Full' ? getFullMockPrompt(windowIndex) : subjectPrompt;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert ECET exam question generator. Generate only valid JSON arrays of questions. No markdown, no extra text."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.8,
      max_tokens: 8000,
      response_format: { type: "json_object" }
    });

    const responseText = completion.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(responseText);
    
    // Handle both array and object with questions array
    allQuestions = Array.isArray(parsed) ? parsed : (parsed.questions || []);

    res.json(allQuestions.slice(0, count));
  } catch (error: any) {
    console.error("Question generation error:", error);
    res.status(500).json({ error: "Failed to generate questions", details: error.message });
  }
});

// Generate "Most Important Questions" static pool
app.post("/api/admin/generate-important-pool", async (req, res) => {
  const { subject, count = 200 } = req.body;
  
  try {
    let allQuestions: any[] = [];
    const batchSize = 50;
    const batches = Math.ceil(count / batchSize);

    for (let i = 0; i < batches; i++) {
      const currentSize = Math.min(batchSize, count - allQuestions.length);
      
      const prompt = `Generate EXACTLY ${currentSize} MOST IMPORTANT multiple-choice questions for "${subject}" - AP ECET 2026 (CSE Branch).

These are HIGHLY PROBABLE questions that will likely appear in the actual exam.

REQUIREMENTS:
- ECET competitive level
- Most frequently asked topics
- Critical concepts from C-23 curriculum
- Easy (25%), Medium (50%), Hard (25%)
- ALL questions must have is_important: true

DETAILED explanations for COMPLETE BEGINNERS:
- Basic concept/formula first
- Step-by-step solution breakdown
- Why correct answer is right
- Why EACH incorrect option is wrong
- Simple everyday language
- Tips/shortcuts if applicable

Return ONLY valid JSON array:
[{
  "text": "question",
  "options": ["opt1", "opt2", "opt3", "opt4"],
  "correctAnswer": 0,
  "explanation": "extremely detailed beginner explanation",
  "subject": "${subject}",
  "difficulty": "Medium",
  "is_important": true
}]`;

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are an expert ECET exam question generator. Generate only valid JSON arrays. No markdown."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        max_tokens: 8000,
        response_format: { type: "json_object" }
      });

      const responseText = completion.choices[0]?.message?.content || "{}";
      const parsed = JSON.parse(responseText);
      const batchQuestions = Array.isArray(parsed) ? parsed : (parsed.questions || []);
      
      allQuestions = [...allQuestions, ...batchQuestions];
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

app.get("/api/progress", authenticate, async (req: any, res) => {
  const progress = await db.collection('user_progress').findOne({ user_id: req.user.id });
  res.json(progress || {});
});

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

// Static Questions Routes
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
    console.log(`🤖 AI: Groq (Llama 3.3 70B)`);
  });
}

startServer();

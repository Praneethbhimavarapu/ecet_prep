import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

// Initialize Database Tables
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS test_attempts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      test_type TEXT NOT NULL,
      subject TEXT,
      score INTEGER NOT NULL,
      total INTEGER NOT NULL,
      duration INTEGER NOT NULL,
      date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      question_data TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS static_questions (
      id SERIAL PRIMARY KEY,
      text TEXT NOT NULL,
      options TEXT NOT NULL,
      correctAnswer INTEGER NOT NULL,
      explanation TEXT NOT NULL,
      subject TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      is_important INTEGER DEFAULT 0
    );
  `);
  console.log("Database initialized!");
}

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "default-secret-key";

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
    const result = await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id",
      [name, email, hashedPassword]
    );
    const id = result.rows[0].id;
    const token = jwt.sign({ id, name, email }, JWT_SECRET);
    res.json({ token, user: { id, name, email } });
  } catch (err: any) {
    if (err.code === "23505") {
      res.status(400).json({ error: "Email already exists" });
    } else {
      res.status(500).json({ error: "Registration failed" });
    }
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

// Test Routes
app.post("/api/tests/save", authenticate, async (req: any, res) => {
  const { test_type, subject, score, total, duration } = req.body;
  await pool.query(
    "INSERT INTO test_attempts (user_id, test_type, subject, score, total, duration) VALUES ($1, $2, $3, $4, $5, $6)",
    [req.user.id, test_type, subject, score, total, duration]
  );
  res.json({ success: true });
});

app.get("/api/tests/history", authenticate, async (req: any, res) => {
  const result = await pool.query(
    "SELECT * FROM test_attempts WHERE user_id = $1 ORDER BY date DESC",
    [req.user.id]
  );
  res.json(result.rows);
});

app.get("/api/leaderboard", authenticate, async (req: any, res) => {
  const result = await pool.query(`
    SELECT 
      u.id, 
      u.name, 
      COUNT(t.id) as tests_taken,
      SUM(t.score) as total_score,
      SUM(t.total) as possible_score,
      ROUND(CAST(SUM(t.score) AS FLOAT) / SUM(t.total) * 100, 1) as avg_accuracy
    FROM users u
    JOIN test_attempts t ON u.id = t.user_id
    GROUP BY u.id
    ORDER BY avg_accuracy DESC, total_score DESC
    LIMIT 10
  `);
  res.json(result.rows);
});

// Bookmark Routes
app.post("/api/bookmarks", authenticate, async (req: any, res) => {
  const { question_data } = req.body;
  await pool.query(
    "INSERT INTO bookmarks (user_id, question_data) VALUES ($1, $2)",
    [req.user.id, JSON.stringify(question_data)]
  );
  res.json({ success: true });
});

app.get("/api/bookmarks", authenticate, async (req: any, res) => {
  const result = await pool.query(
    "SELECT * FROM bookmarks WHERE user_id = $1",
    [req.user.id]
  );
  res.json(result.rows.map((b: any) => ({ ...b, question_data: JSON.parse(b.question_data) })));
});

app.delete("/api/bookmarks/:id", authenticate, async (req: any, res) => {
  await pool.query(
    "DELETE FROM bookmarks WHERE id = $1 AND user_id = $2",
    [req.params.id, req.user.id]
  );
  res.json({ success: true });
});

// Static Questions Routes
app.get("/api/questions/important", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM static_questions WHERE is_important = 1 ORDER BY RANDOM() LIMIT 20"
  );
  res.json(result.rows.map((q: any) => ({ ...q, options: JSON.parse(q.options) })));
});

app.get("/api/questions/static/:subject", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM static_questions WHERE subject = $1 ORDER BY RANDOM() LIMIT 10",
    [req.params.subject]
  );
  res.json(result.rows.map((q: any) => ({ ...q, options: JSON.parse(q.options) })));
});

app.post("/api/admin/seed-static", async (req, res) => {
  const { questions } = req.body;
  if (!Array.isArray(questions)) return res.status(400).json({ error: "Invalid data" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const q of questions) {
      await client.query(
        "INSERT INTO static_questions (text, options, correctAnswer, explanation, subject, difficulty, is_important) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [q.text, JSON.stringify(q.options), q.correctAnswer, q.explanation, q.subject, q.difficulty, q.is_important ? 1 : 0]
      );
    }
    await client.query("COMMIT");
    res.json({ success: true, count: questions.length });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Failed to seed questions" });
  } finally {
    client.release();
  }
});

app.get("/api/admin/static-count", async (req, res) => {
  const result = await pool.query(
    "SELECT subject, COUNT(*) as count FROM static_questions GROUP BY subject"
  );
  res.json(result.rows);
});

// Serve React app in production
app.use(express.static(path.join(__dirname, "dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// Start Server
const PORT = process.env.PORT || 3000;

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error("Failed to initialize database:", err);
  process.exit(1);
});

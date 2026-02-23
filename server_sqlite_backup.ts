import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("ecet.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS test_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    test_type TEXT NOT NULL,
    subject TEXT,
    score INTEGER NOT NULL,
    total INTEGER NOT NULL,
    duration INTEGER NOT NULL,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    question_data TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS static_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    options TEXT NOT NULL,
    correctAnswer INTEGER NOT NULL,
    explanation TEXT NOT NULL,
    subject TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    is_important INTEGER DEFAULT 0
  );
`);

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
    const stmt = db.prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)");
    const info = stmt.run(name, email, hashedPassword);
    const token = jwt.sign({ id: info.lastInsertRowid, name, email }, JWT_SECRET);
    res.json({ token, user: { id: info.lastInsertRowid, name, email } });
  } catch (err: any) {
    if (err.message.includes("UNIQUE constraint failed")) {
      res.status(400).json({ error: "Email already exists" });
    } else {
      res.status(500).json({ error: "Registration failed" });
    }
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

// Test Routes
app.post("/api/tests/save", authenticate, (req: any, res) => {
  const { test_type, subject, score, total, duration } = req.body;
  const stmt = db.prepare(`
    INSERT INTO test_attempts (user_id, test_type, subject, score, total, duration)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(req.user.id, test_type, subject, score, total, duration);
  res.json({ success: true });
});

app.get("/api/tests/history", authenticate, (req: any, res) => {
  const history = db.prepare("SELECT * FROM test_attempts WHERE user_id = ? ORDER BY date DESC").all(req.user.id);
  res.json(history);
});

app.get("/api/leaderboard", authenticate, (req: any, res) => {
  const leaderboard = db.prepare(`
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
  `).all();
  res.json(leaderboard);
});

// Bookmark Routes
app.post("/api/bookmarks", authenticate, (req: any, res) => {
  const { question_data } = req.body;
  const stmt = db.prepare("INSERT INTO bookmarks (user_id, question_data) VALUES (?, ?)");
  stmt.run(req.user.id, JSON.stringify(question_data));
  res.json({ success: true });
});

app.get("/api/bookmarks", authenticate, (req: any, res) => {
  const bookmarks = db.prepare("SELECT * FROM bookmarks WHERE user_id = ?").all(req.user.id);
  res.json(bookmarks.map((b: any) => ({ ...b, question_data: JSON.parse(b.question_data) })));
});

app.delete("/api/bookmarks/:id", authenticate, (req: any, res) => {
  db.prepare("DELETE FROM bookmarks WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id);
  res.json({ success: true });
});

// Static Questions Routes
app.get("/api/questions/important", (req, res) => {
  const questions = db.prepare("SELECT * FROM static_questions WHERE is_important = 1 ORDER BY RANDOM() LIMIT 20").all();
  res.json(questions.map((q: any) => ({ ...q, options: JSON.parse(q.options) })));
});

app.get("/api/questions/static/:subject", (req, res) => {
  const questions = db.prepare("SELECT * FROM static_questions WHERE subject = ? ORDER BY RANDOM() LIMIT 10").all(req.params.subject);
  res.json(questions.map((q: any) => ({ ...q, options: JSON.parse(q.options) })));
});

app.post("/api/admin/seed-static", async (req, res) => {
  const { questions } = req.body;
  if (!Array.isArray(questions)) return res.status(400).json({ error: "Invalid data" });

  const insert = db.prepare(`
    INSERT INTO static_questions (text, options, correctAnswer, explanation, subject, difficulty, is_important)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction((qs) => {
    for (const q of qs) {
      insert.run(q.text, JSON.stringify(q.options), q.correctAnswer, q.explanation, q.subject, q.difficulty, q.is_important ? 1 : 0);
    }
  });

  transaction(questions);
  res.json({ success: true, count: questions.length });
});

app.get("/api/admin/static-count", (req, res) => {
  const counts = db.prepare("SELECT subject, COUNT(*) as count FROM static_questions GROUP BY subject").all();
  res.json(counts);
});

// Vite Setup
async function startServer() {
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

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

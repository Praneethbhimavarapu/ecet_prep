import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import serverless from "serverless-http";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing from environment variables.");
}

const db = createClient(supabaseUrl || "", supabaseKey || "");

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
    const { data, error } = await db
      .from("users")
      .insert([{ name, email, password: hashedPassword }])
      .select()
      .single();

    if (error) throw error;

    const token = jwt.sign({ id: data.id, name, email }, JWT_SECRET);
    res.json({ token, user: { id: data.id, name, email } });
  } catch (err: any) {
    if (err.message?.includes("unique_email") || err.code === "23505") {
      res.status(400).json({ error: "Email already exists" });
    } else {
      console.error(err);
      res.status(500).json({ error: "Registration failed" });
    }
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const { data: user, error } = await db
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (error || !user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

// Test Routes
app.post("/api/tests/save", authenticate, async (req: any, res) => {
  const { test_type, subject, score, total, duration } = req.body;
  const { error } = await db.from("test_attempts").insert([
    {
      user_id: req.user.id,
      test_type,
      subject,
      score,
      total,
      duration,
    },
  ]);

  if (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to save test attempt" });
  }
  res.json({ success: true });
});

app.get("/api/tests/history", authenticate, async (req: any, res) => {
  const { data, error } = await db
    .from("test_attempts")
    .select("*")
    .eq("user_id", req.user.id)
    .order("date", { ascending: false });

  if (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch history" });
  }
  res.json(data);
});

app.get("/api/leaderboard", authenticate, async (req: any, res) => {
  // Complex SQL via rpc if available, or fetch and process
  // For now, let's assume we have an rpc or a simpler approach
  const { data, error } = await db.rpc('get_leaderboard');

  if (error) {
    console.error("Leaderboard RPC error (ensure 'get_leaderboard' function exists in Supabase):", error);
    // Fallback if RPC doesn't exist: fetch all and aggregate (not efficient but makes it work)
    const { data: attempts, error: fetchError } = await db
      .from("test_attempts")
      .select("user_id, score, total, users(name)");

    if (fetchError) return res.status(500).json({ error: "Failed to fetch leaderboard" });

    const stats: Record<number, any> = {};
    attempts.forEach((t: any) => {
      if (!stats[t.user_id]) {
        stats[t.user_id] = { id: t.user_id, name: t.users?.name, tests_taken: 0, total_score: 0, possible_score: 0 };
      }
      stats[t.user_id].tests_taken += 1;
      stats[t.user_id].total_score += t.score;
      stats[t.user_id].possible_score += t.total;
    });

    const leaderboard = Object.values(stats)
      .map((s: any) => ({
        ...s,
        avg_accuracy: Math.round((s.total_score / s.possible_score) * 100 * 10) / 10
      }))
      .sort((a, b) => b.avg_accuracy - a.avg_accuracy || b.total_score - a.total_score)
      .slice(0, 10);

    return res.json(leaderboard);
  }
  res.json(data);
});

// Bookmark Routes
app.post("/api/bookmarks", authenticate, async (req: any, res) => {
  const { question_data } = req.body;
  const { error } = await db.from("bookmarks").insert([
    {
      user_id: req.user.id,
      question_data: JSON.stringify(question_data),
    },
  ]);

  if (error) return res.status(500).json({ error: "Failed to save bookmark" });
  res.json({ success: true });
});

app.get("/api/bookmarks", authenticate, async (req: any, res) => {
  const { data, error } = await db
    .from("bookmarks")
    .select("*")
    .eq("user_id", req.user.id);

  if (error) return res.status(500).json({ error: "Failed to fetch bookmarks" });
  res.json(data.map((b: any) => ({ ...b, question_data: JSON.parse(b.question_data) })));
});

app.delete("/api/bookmarks/:id", authenticate, async (req: any, res) => {
  const { error } = await db
    .from("bookmarks")
    .delete()
    .eq("id", req.params.id)
    .eq("user_id", req.user.id);

  if (error) return res.status(500).json({ error: "Failed to delete bookmark" });
  res.json({ success: true });
});

// Static Questions Routes
app.get("/api/questions/important", async (req, res) => {
  // Supabase doesn't have a direct 'ORDER BY RANDOM()' in the client easily
  // We can use a trick with a random offset or fetch more and shuffle
  const { count } = await db.from("static_questions").select("*", { count: 'exact', head: true }).eq("is_important", true);
  const randomOffset = Math.max(0, Math.floor(Math.random() * (count || 0) - 20));

  const { data, error } = await db
    .from("static_questions")
    .select("*")
    .eq("is_important", true)
    .range(randomOffset, randomOffset + 19);

  if (error) return res.status(500).json({ error: "Failed to fetch important questions" });
  res.json(data.map((q: any) => ({ ...q, options: JSON.parse(q.options) })));
});

app.get("/api/questions/static/:subject", async (req, res) => {
  const { data, error } = await db
    .from("static_questions")
    .select("*")
    .eq("subject", req.params.subject)
    .limit(10); // Simple limit for now

  if (error) return res.status(500).json({ error: "Failed to fetch subject questions" });
  res.json(data.map((q: any) => ({ ...q, options: JSON.parse(q.options) })));
});

app.post("/api/admin/seed-static", async (req, res) => {
  const { questions } = req.body;
  if (!Array.isArray(questions)) return res.status(400).json({ error: "Invalid data" });

  try {
    const { error } = await db.from("static_questions").insert(
      questions.map(q => ({
        text: q.text,
        options: JSON.stringify(q.options),
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        subject: q.subject,
        difficulty: q.difficulty,
        is_important: q.is_important ? true : false
      }))
    );
    if (error) throw error;
    res.json({ success: true, count: questions.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Seeding failed" });
  }
});

app.get("/api/admin/static-count", async (req, res) => {
  // This aggregation is better in SQL but we can process it
  const { data, error } = await db.from("static_questions").select("subject");
  if (error) return res.status(500).json({ error: "Failed to fetch counts" });

  const counts: Record<string, number> = {};
  data.forEach(q => {
    counts[q.subject] = (counts[q.subject] || 0) + 1;
  });

  res.json(Object.entries(counts).map(([subject, count]) => ({ subject, count })));
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

  if (process.env.NETLIFY !== "true") {
    const PORT = 3000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

// Only start the server if not running on Netlify (for local dev)
if (process.env.NETLIFY !== "true") {
  startServer();
}

export const handler = serverless(app);
export default app;

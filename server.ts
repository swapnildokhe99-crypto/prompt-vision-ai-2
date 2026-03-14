import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("videos.db");
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    password TEXT,
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS videos (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    prompt TEXT,
    style TEXT,
    video_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    duration TEXT,
    resolution TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS saved_prompts (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    prompt TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS prompt_history (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    prompt TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS studio_projects (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT,
    timeline TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Middleware to verify JWT
const authenticate = (req: any, res: any, next: any) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    const { email, password, name } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      db.prepare("INSERT INTO users (id, email, password, name) VALUES (?, ?, ?, ?)")
        .run(id, email, hashedPassword, name);
      
      const token = jwt.sign({ id, email, name }, JWT_SECRET, { expiresIn: "7d" });
      res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "none" });
      res.json({ user: { id, email, name } });
    } catch (err) {
      res.status(400).json({ error: "Email already exists" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: "7d" });
    res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "none" });
    res.json({ user: { id: user.id, email: user.email, name: user.name } });
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ success: true });
  });

  app.get("/api/auth/me", authenticate, (req: any, res) => {
    res.json({ user: req.user });
  });

  // API routes
  app.get("/api/videos", authenticate, (req: any, res) => {
    const videos = db.prepare("SELECT * FROM videos WHERE user_id = ? ORDER BY created_at DESC").all(req.user.id);
    res.json(videos);
  });

  app.post("/api/videos", authenticate, (req: any, res) => {
    const { id, prompt, style, video_url, duration, resolution } = req.body;
    db.prepare(
      "INSERT INTO videos (id, user_id, prompt, style, video_url, duration, resolution) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(id, req.user.id, prompt, style, video_url, duration, resolution);

    // Also save to prompt history
    const historyId = Math.random().toString(36).substr(2, 9);
    db.prepare("INSERT INTO prompt_history (id, user_id, prompt) VALUES (?, ?, ?)")
      .run(historyId, req.user.id, prompt);

    res.json({ success: true, id });
  });

  app.delete("/api/videos/:id", authenticate, (req: any, res) => {
    db.prepare("DELETE FROM videos WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id);
    res.json({ success: true });
  });

  app.get("/api/prompts", authenticate, (req: any, res) => {
    const prompts = db.prepare("SELECT * FROM saved_prompts WHERE user_id = ? ORDER BY created_at DESC").all(req.user.id);
    res.json(prompts);
  });

  app.post("/api/prompts", authenticate, (req: any, res) => {
    const { prompt } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    db.prepare("INSERT INTO saved_prompts (id, user_id, prompt) VALUES (?, ?, ?)")
      .run(id, req.user.id, prompt);
    res.json({ success: true, id });
  });

  app.delete("/api/prompts/:id", authenticate, (req: any, res) => {
    db.prepare("DELETE FROM saved_prompts WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id);
    res.json({ success: true });
  });

  app.get("/api/prompt-history", authenticate, (req: any, res) => {
    const history = db.prepare("SELECT * FROM prompt_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 20").all(req.user.id);
    res.json(history);
  });

  app.delete("/api/prompt-history/:id", authenticate, (req: any, res) => {
    db.prepare("DELETE FROM prompt_history WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id);
    res.json({ success: true });
  });

  // Studio Projects routes
  app.get("/api/studio/projects", authenticate, (req: any, res) => {
    const projects = db.prepare("SELECT * FROM studio_projects WHERE user_id = ? ORDER BY updated_at DESC").all(req.user.id);
    res.json(projects);
  });

  app.post("/api/studio/projects", authenticate, (req: any, res) => {
    const { id, name, timeline } = req.body;
    const existing = db.prepare("SELECT id FROM studio_projects WHERE id = ? AND user_id = ?").get(id, req.user.id);
    
    if (existing) {
      db.prepare("UPDATE studio_projects SET name = ?, timeline = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .run(name, JSON.stringify(timeline), id);
    } else {
      db.prepare("INSERT INTO studio_projects (id, user_id, name, timeline) VALUES (?, ?, ?, ?)")
        .run(id, req.user.id, name, JSON.stringify(timeline));
    }
    res.json({ success: true });
  });

  app.delete("/api/studio/projects/:id", authenticate, (req: any, res) => {
    db.prepare("DELETE FROM studio_projects WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id);
    res.json({ success: true });
  });

  // Vite middleware for development
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

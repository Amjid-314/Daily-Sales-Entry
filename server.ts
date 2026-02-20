import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";

const db = new Database("orders.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS drafts (
    id TEXT PRIMARY KEY,
    data TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/draft/:id", (req, res) => {
    const row = db.prepare("SELECT data FROM drafts WHERE id = ?").get(req.params.id);
    if (row) {
      res.json(JSON.parse(row.data));
    } else {
      res.status(404).json({ error: "Draft not found" });
    }
  });

  app.post("/api/draft", (req, res) => {
    const { id, data } = req.body;
    db.prepare("INSERT OR REPLACE INTO drafts (id, data, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)")
      .run(id, JSON.stringify(data));
    res.json({ success: true });
  });

  app.post("/api/submit", (req, res) => {
    const { data } = req.body;
    console.log("Order Submitted:", data);
    // In a real app, we'd save this to a 'submitted_orders' table
    res.json({ success: true, message: "Order submitted successfully" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve("dist/index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

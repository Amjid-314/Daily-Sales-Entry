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

  CREATE TABLE IF NOT EXISTS submitted_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT,
    tsm TEXT,
    town TEXT,
    distributor TEXT,
    order_booker TEXT,
    route TEXT,
    visited_shops INTEGER,
    productive_shops INTEGER,
    category_productive_data TEXT,
    order_data TEXT,
    targets_data TEXT,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

  // Admin Configuration Tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS ob_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      town TEXT,
      distributor TEXT,
      routes TEXT -- JSON array of routes
    );

    CREATE TABLE IF NOT EXISTS brand_targets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand_name TEXT UNIQUE,
      target_ctn REAL DEFAULT 0
    );
  `);

  // Initial Seed Data if empty
  const obCount = db.prepare("SELECT COUNT(*) as count FROM ob_assignments").get() as any;
  if (obCount.count === 0) {
    const seedOBs = [
      { name: "Ali Khan", town: "Central City", distributor: "A1 Traders", routes: JSON.stringify(["Route A1", "Route A2", "Route A3"]) },
      { name: "Zubair Ahmed", town: "East Side", distributor: "East Distributors", routes: JSON.stringify(["East Main", "East Sub", "Industrial Area"]) },
      { name: "Sajid Mehmood", town: "West End", distributor: "West Star", routes: JSON.stringify(["West 1", "West 2", "Market Area"]) }
    ];
    const insertOB = db.prepare("INSERT INTO ob_assignments (name, town, distributor, routes) VALUES (?, ?, ?, ?)");
    seedOBs.forEach(ob => insertOB.run(ob.name, ob.town, ob.distributor, ob.routes));
  }

  const targetCount = db.prepare("SELECT COUNT(*) as count FROM brand_targets").get() as any;
  if (targetCount.count === 0) {
    const brands = ["Match", "Dishwash Bar", "Kite Glow", "Burq Action", "Vero"];
    const insertTarget = db.prepare("INSERT INTO brand_targets (brand_name) VALUES (?)");
    brands.forEach(b => insertTarget.run(b));
  }

  // API Routes for Admin
  app.get("/api/admin/obs", (req, res) => {
    const obs = db.prepare("SELECT * FROM ob_assignments").all();
    res.json(obs.map((ob: any) => ({ ...ob, routes: JSON.parse(ob.routes) })));
  });

  app.post("/api/admin/obs", (req, res) => {
    const { name, town, distributor, routes } = req.body;
    try {
      db.prepare("INSERT OR REPLACE INTO ob_assignments (name, town, distributor, routes) VALUES (?, ?, ?, ?)")
        .run(name, town, distributor, JSON.stringify(routes));
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/admin/obs/:id", (req, res) => {
    db.prepare("DELETE FROM ob_assignments WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/admin/targets", (req, res) => {
    const targets = db.prepare("SELECT * FROM brand_targets").all();
    res.json(targets);
  });

  app.post("/api/admin/targets", (req, res) => {
    const { brand_name, target_ctn } = req.body;
    db.prepare("INSERT OR REPLACE INTO brand_targets (brand_name, target_ctn) VALUES (?, ?)")
      .run(brand_name, target_ctn);
    res.json({ success: true });
  });

  app.get("/api/orders", (req, res) => {
    const rows = db.prepare("SELECT * FROM submitted_orders ORDER BY submitted_at DESC").all();
    res.json(rows.map((row: any) => ({
      ...row,
      order_data: JSON.parse(row.order_data)
    })));
  });

  app.post("/api/submit", (req, res) => {
    const { data } = req.body;
    const { date, tsm, town, distributor, orderBooker, route, visitedShops, productiveShops, categoryProductiveShops, items, targets } = data;
    
    try {
      db.prepare(`
        INSERT INTO submitted_orders (date, tsm, town, distributor, order_booker, route, visited_shops, productive_shops, category_productive_data, order_data, targets_data)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(date, tsm, town, distributor, orderBooker, route, visitedShops, productiveShops, JSON.stringify(categoryProductiveShops), JSON.stringify(items), JSON.stringify(targets));
      
      res.json({ success: true, message: "Order submitted successfully" });
    } catch (err) {
      console.error("Submission error:", err);
      res.status(500).json({ error: "Failed to submit order" });
    }
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

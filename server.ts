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
    ob_contact TEXT,
    route TEXT,
    total_shops INTEGER,
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
      name TEXT,
      contact TEXT UNIQUE,
      town TEXT,
      distributor TEXT,
      tsm TEXT,
      total_shops INTEGER DEFAULT 0,
      routes TEXT -- JSON array of routes
    );
  `);

  // Migration: Add contact and tsm columns if they don't exist
  try { db.exec("ALTER TABLE ob_assignments ADD COLUMN contact TEXT UNIQUE"); } catch (e) {}
  try { db.exec("ALTER TABLE ob_assignments ADD COLUMN tsm TEXT"); } catch (e) {}
  try { db.exec("ALTER TABLE ob_assignments ADD COLUMN total_shops INTEGER DEFAULT 0"); } catch (e) {}
  try { db.exec("ALTER TABLE submitted_orders ADD COLUMN total_shops INTEGER DEFAULT 0"); } catch (e) {}
  try { db.exec("ALTER TABLE submitted_orders ADD COLUMN ob_contact TEXT"); } catch (e) {}

  db.exec(`
    CREATE TABLE IF NOT EXISTS brand_targets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ob_contact TEXT,
      brand_name TEXT,
      target_ctn REAL DEFAULT 0,
      UNIQUE(ob_contact, brand_name)
    );

    CREATE TABLE IF NOT EXISTS app_config (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // Initial Config
  db.prepare("INSERT OR IGNORE INTO app_config (key, value) VALUES (?, ?)").run("total_working_days", "25");

  // Initial Seed Data if empty
  const obCount = db.prepare("SELECT COUNT(*) as count FROM ob_assignments").get() as any;
  if (obCount.count === 0) {
    const seedOBs = [
      { name: "Muhammad Bilal", contact: "P-01", town: "Peshawar", distributor: "Peshawar Dist", tsm: "Muhammad Shoaib", totalShops: 45, routes: JSON.stringify(["Route 1", "Route 2"]) },
      { name: "Khizar Hayat", contact: "P-02", town: "Peshawar", distributor: "Peshawar Dist", tsm: "Muhammad Shoaib", totalShops: 40, routes: JSON.stringify(["Route 1", "Route 2"]) },
      { name: "Adil Khan", contact: "P-03", town: "Peshawar", distributor: "Peshawar Dist", tsm: "Muhammad Shoaib", totalShops: 50, routes: JSON.stringify(["Route 1", "Route 2"]) },
      { name: "Baidar Khan", contact: "P-04", town: "Peshawar", distributor: "Peshawar Dist", tsm: "Muhammad Shoaib", totalShops: 42, routes: JSON.stringify(["Route 1", "Route 2"]) },
      { name: "Muhammad Usman", contact: "P-05", town: "Peshawar", distributor: "Peshawar Dist", tsm: "Muhammad Shoaib", totalShops: 48, routes: JSON.stringify(["Route 1", "Route 2"]) },
      { name: "Ghulam Rasool", contact: "P-06", town: "Peshawar", distributor: "Peshawar Dist", tsm: "Muhammad Shoaib", totalShops: 44, routes: JSON.stringify(["Route 1", "Route 2"]) },
      { name: "Khalid Awan", contact: "P-07", town: "Peshawar", distributor: "Peshawar Dist", tsm: "Muhammad Shoaib", totalShops: 46, routes: JSON.stringify(["Route 1", "Route 2"]) },
      { name: "Shahid", contact: "H-01", town: "Haripur", distributor: "Haripur Dist", tsm: "Muhammad Yousaf", totalShops: 35, routes: JSON.stringify(["Route 1", "Route 2"]) },
      { name: "Shahrukh", contact: "H-02", town: "Haripur", distributor: "Haripur Dist", tsm: "Muhammad Yousaf", totalShops: 38, routes: JSON.stringify(["Route 1", "Route 2"]) },
      { name: "Bilal", contact: "T-01", town: "Taxila", distributor: "Taxila Dist", tsm: "Muhammad Yousaf", totalShops: 40, routes: JSON.stringify(["Route 1", "Route 2"]) },
      { name: "Muneeb", contact: "T-02", town: "Taxila", distributor: "Taxila Dist", tsm: "Muhammad Yousaf", totalShops: 42, routes: JSON.stringify(["Route 1", "Route 2"]) },
      { name: "Kashif", contact: "K-01", town: "Kohat", distributor: "Kohat Dist", tsm: "Noman Paracha", totalShops: 55, routes: JSON.stringify(["Route 1", "Route 2"]) },
      { name: "Bilal", contact: "HG-01", town: "Hangu", distributor: "Hangu Dist", tsm: "Noman Paracha", totalShops: 50, routes: JSON.stringify(["Route 1", "Route 2"]) },
      { name: "Usama", contact: "A-01", town: "Attock", distributor: "Attock Dist", tsm: "Noman Paracha", totalShops: 45, routes: JSON.stringify(["Route 1", "Route 2"]) },
      { name: "Zakaullah", contact: "DI-01", town: "DI Khan", distributor: "DI Khan Dist", tsm: "Ikramullah & Muntazir", totalShops: 48, routes: JSON.stringify(["Route 1", "Route 2"]) },
      { name: "Muntazir", contact: "DI-02", town: "DI Khan", distributor: "DI Khan Dist", tsm: "Ikramullah & Muntazir", totalShops: 45, routes: JSON.stringify(["Route 1", "Route 2"]) },
      { name: "Muhammad Amir", contact: "M-01", town: "Mardan", distributor: "Mardan Dist", tsm: "Muhammad Zeeshan", totalShops: 52, routes: JSON.stringify(["Route 1", "Route 2"]) },
      { name: "Babar", contact: "C-01", town: "Charsadda", distributor: "Charsadda Dist", tsm: "Waheed Jamal", totalShops: 48, routes: JSON.stringify(["Route 1", "Route 2"]) },
      { name: "OB Muzaffarabad", contact: "MUZ-01", town: "Muzaffarabad", distributor: "Muz Dist", tsm: "Qaisar Yousaf", totalShops: 40, routes: JSON.stringify(["Route 1"]) },
      { name: "OB Mansehra", contact: "MAN-01", town: "Mansehra", distributor: "Man Dist", tsm: "Qaisar Yousaf", totalShops: 40, routes: JSON.stringify(["Route 1"]) }
    ];
    const insertOB = db.prepare("INSERT INTO ob_assignments (name, contact, town, distributor, tsm, total_shops, routes) VALUES (?, ?, ?, ?, ?, ?, ?)");
    seedOBs.forEach(ob => insertOB.run(ob.name, ob.contact, ob.town, ob.distributor, ob.tsm, ob.totalShops, ob.routes));
  }

  // API Routes for Admin
  app.get("/api/admin/config", (req, res) => {
    const rows = db.prepare("SELECT * FROM app_config").all();
    const config = rows.reduce((acc: any, row: any) => ({ ...acc, [row.key]: row.value }), {});
    res.json(config);
  });

  app.post("/api/admin/config", (req, res) => {
    const { key, value } = req.body;
    db.prepare("INSERT OR REPLACE INTO app_config (key, value) VALUES (?, ?)").run(key, value.toString());
    res.json({ success: true });
  });

  app.get("/api/admin/obs", (req, res) => {
    const obs = db.prepare("SELECT * FROM ob_assignments").all();
    res.json(obs.map((ob: any) => ({ 
      id: ob.id,
      name: ob.name,
      contact: ob.contact,
      town: ob.town,
      distributor: ob.distributor,
      tsm: ob.tsm,
      totalShops: ob.total_shops,
      routes: JSON.parse(ob.routes) 
    })));
  });

  app.post("/api/admin/obs", (req, res) => {
    const { id, name, contact, town, distributor, tsm, totalShops, routes } = req.body;
    try {
      if (id) {
        db.prepare("UPDATE ob_assignments SET name = ?, contact = ?, town = ?, distributor = ?, tsm = ?, total_shops = ?, routes = ? WHERE id = ?")
          .run(name, contact, town, distributor, tsm, totalShops || 0, JSON.stringify(routes), id);
      } else {
        db.prepare("INSERT INTO ob_assignments (name, contact, town, distributor, tsm, total_shops, routes) VALUES (?, ?, ?, ?, ?, ?, ?)")
          .run(name, contact, town, distributor, tsm, totalShops || 0, JSON.stringify(routes));
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/targets", (req, res) => {
    const { obContact, brandName, targetCtn } = req.body;
    const contact = obContact || req.body.ob_contact;
    const brand = brandName || req.body.brand_name;
    const target = targetCtn !== undefined ? targetCtn : req.body.target_ctn;
    
    try {
      db.prepare("INSERT OR REPLACE INTO brand_targets (ob_contact, brand_name, target_ctn) VALUES (?, ?, ?)")
        .run(contact, brand, target);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/admin/obs/:id", (req, res) => {
    db.prepare("DELETE FROM ob_assignments WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/admin/targets/:ob_contact", (req, res) => {
    const targets = db.prepare("SELECT * FROM brand_targets WHERE ob_contact = ?").all(req.params.ob_contact);
    res.json(targets);
  });

  app.post("/api/admin/reseed", (req, res) => {
    const transaction = db.transaction(() => {
      db.prepare("DELETE FROM ob_assignments").run();
      const seedOBs = [
        // Peshawar - TSM: Muhammad Shoaib
        { name: "Muhammad Bilal", contact: "P-01", town: "Peshawar", distributor: "Peshawar Dist", tsm: "Muhammad Shoaib", totalShops: 45, routes: JSON.stringify(["Route 1"]) },
        { name: "Khizar Hayat", contact: "P-02", town: "Peshawar", distributor: "Peshawar Dist", tsm: "Muhammad Shoaib", totalShops: 40, routes: JSON.stringify(["Route 1"]) },
        { name: "Adil Khan", contact: "P-03", town: "Peshawar", distributor: "Peshawar Dist", tsm: "Muhammad Shoaib", totalShops: 50, routes: JSON.stringify(["Route 1"]) },
        { name: "Baidar Khan", contact: "P-04", town: "Peshawar", distributor: "Peshawar Dist", tsm: "Muhammad Shoaib", totalShops: 42, routes: JSON.stringify(["Route 1"]) },
        { name: "Muhammad Usman", contact: "P-05", town: "Peshawar", distributor: "Peshawar Dist", tsm: "Muhammad Shoaib", totalShops: 48, routes: JSON.stringify(["Route 1"]) },
        { name: "Ghulam Rasool", contact: "P-06", town: "Peshawar", distributor: "Peshawar Dist", tsm: "Muhammad Shoaib", totalShops: 44, routes: JSON.stringify(["Route 1"]) },
        { name: "Khalid Awan", contact: "P-07", town: "Peshawar", distributor: "Peshawar Dist", tsm: "Muhammad Shoaib", totalShops: 46, routes: JSON.stringify(["Route 1"]) },

        // Haripur - TSM: Muhammad Yousaf
        { name: "Shahid", contact: "H-01", town: "Haripur", distributor: "Haripur Dist", tsm: "Muhammad Yousaf", totalShops: 35, routes: JSON.stringify(["Route 1"]) },
        { name: "Shahrukh", contact: "H-02", town: "Haripur", distributor: "Haripur Dist", tsm: "Muhammad Yousaf", totalShops: 38, routes: JSON.stringify(["Route 1"]) },

        // Taxila - TSM: Muhammad Yousaf
        { name: "Bilal", contact: "T-01", town: "Taxila", distributor: "Taxila Dist", tsm: "Muhammad Yousaf", totalShops: 40, routes: JSON.stringify(["Route 1"]) },
        { name: "Muneeb", contact: "T-02", town: "Taxila", distributor: "Taxila Dist", tsm: "Muhammad Yousaf", totalShops: 42, routes: JSON.stringify(["Route 1"]) },

        // Kohat - TSM: Noman Paracha
        { name: "Kashif", contact: "K-01", town: "Kohat", distributor: "Kohat Dist", tsm: "Noman Paracha", totalShops: 55, routes: JSON.stringify(["Route 1"]) },

        // Hangu - TSM: Noman Paracha
        { name: "Bilal", contact: "HG-01", town: "Hangu", distributor: "Hangu Dist", tsm: "Noman Paracha", totalShops: 50, routes: JSON.stringify(["Route 1"]) },

        // Attock - TSM: Noman Paracha
        { name: "Usama", contact: "A-01", town: "Attock", distributor: "Attock Dist", tsm: "Noman Paracha", totalShops: 45, routes: JSON.stringify(["Route 1"]) },

        // Charsadda - TSM: Waheed Jamal
        { name: "Babar", contact: "C-01", town: "Charsadda", distributor: "Charsadda Dist", tsm: "Waheed Jamal", totalShops: 48, routes: JSON.stringify(["Route 1"]) },

        // Mardan - TSM: Muhammad Zeeshan
        { name: "Muhammad Amir", contact: "M-01", town: "Mardan", distributor: "Mardan Dist", tsm: "Muhammad Zeeshan", totalShops: 52, routes: JSON.stringify(["Route 1"]) },

        // DI Khan & Bannu - TSM: Ikramullah
        { name: "Zakaullah", contact: "DI-01", town: "DI Khan", distributor: "DI Khan Dist", tsm: "Ikramullah", totalShops: 48, routes: JSON.stringify(["Route 1"]) },
        { name: "Muntazir", contact: "DI-02", town: "DI Khan", distributor: "DI Khan Dist", tsm: "Ikramullah", totalShops: 45, routes: JSON.stringify(["Route 1"]) },
        { name: "OB Bannu", contact: "BAN-01", town: "Bannu", distributor: "Bannu Dist", tsm: "Ikramullah", totalShops: 40, routes: JSON.stringify(["Route 1"]) },

        // Muzaffarabad & Mansehra - TSM: Qaisar Yousaf
        { name: "OB Muzaffarabad", contact: "MUZ-01", town: "Muzaffarabad", distributor: "Muz Dist", tsm: "Qaisar Yousaf", totalShops: 40, routes: JSON.stringify(["Route 1"]) },
        { name: "OB Mansehra", contact: "MAN-01", town: "Mansehra", distributor: "Man Dist", tsm: "Qaisar Yousaf", totalShops: 40, routes: JSON.stringify(["Route 1"]) }
      ];
      const insertOB = db.prepare("INSERT INTO ob_assignments (name, contact, town, distributor, tsm, total_shops, routes) VALUES (?, ?, ?, ?, ?, ?, ?)");
      seedOBs.forEach(ob => insertOB.run(ob.name, ob.contact, ob.town, ob.distributor, ob.tsm, ob.totalShops, ob.routes));
    });

    try {
      transaction();
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/reset", (req, res) => {
    const transaction = db.transaction(() => {
      db.prepare("DELETE FROM submitted_orders").run();
      db.prepare("DELETE FROM drafts").run();
    });
    try {
      transaction();
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
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
    const { date, tsm, town, distributor, orderBooker, obContact, route, totalShops, visitedShops, productiveShops, categoryProductiveShops, items, targets } = data;
    
    try {
      db.prepare(`
        INSERT INTO submitted_orders (date, tsm, town, distributor, order_booker, ob_contact, route, total_shops, visited_shops, productive_shops, category_productive_data, order_data, targets_data)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(date, tsm, town, distributor, orderBooker, obContact, route, totalShops || 0, visitedShops, productiveShops, JSON.stringify(categoryProductiveShops), JSON.stringify(items), JSON.stringify(targets));
      
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
    
    // Fallback to index.html for SPA in dev mode
    app.get("*", async (req, res, next) => {
      const url = req.originalUrl;
      try {
        const templatePath = path.resolve("index.html");
        const fs = await import("fs");
        let template = fs.readFileSync(templatePath, "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
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

import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { google } from "googleapis";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cron from "node-cron";
import fs from "fs";
import { exec } from "child_process";

const db = new Database("orders.db");
const JWT_SECRET = process.env.JWT_SECRET || "salespulse-secret-key-2026";
const ADMIN_EMAIL = "amjid.bisconni@gmail.com";

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: string;
        name: string;
        contact: string;
      };
    }
  }
}

const CATEGORIES = [
  "Kite Glow",
  "Burq Action",
  "Vero",
  "DWB",
  "Match"
];
const SKUS = [
  // Kite Glow
  { id: "kg-10", name: "Kite Rs 10", category: "Kite Glow", unitsPerCarton: 144, unitsPerDozen: 12, weight_gm_per_pack: 30 },
  { id: "kg-20", name: "Kite Rs 20", category: "Kite Glow", unitsPerCarton: 96, unitsPerDozen: 12, weight_gm_per_pack: 56 },
  { id: "kg-50", name: "Kite Rs 50", category: "Kite Glow", unitsPerCarton: 48, unitsPerDozen: 12, weight_gm_per_pack: 165 },
  { id: "kg-99", name: "Kite Rs 99", category: "Kite Glow", unitsPerCarton: 24, unitsPerDozen: 12, weight_gm_per_pack: 350 },
  { id: "kg-05kg", name: "Kite 0.5kg", category: "Kite Glow", unitsPerCarton: 24, unitsPerDozen: 0, weight_gm_per_pack: 500 },
  { id: "kg-1kg", name: "Kite 1kg", category: "Kite Glow", unitsPerCarton: 12, unitsPerDozen: 0, weight_gm_per_pack: 1000 },
  { id: "kg-2kg", name: "Kite 2kg", category: "Kite Glow", unitsPerCarton: 6, unitsPerDozen: 0, weight_gm_per_pack: 2000 },
  // Burq Action
  { id: "ba-10", name: "Burq Rs 10", category: "Burq Action", unitsPerCarton: 204, unitsPerDozen: 12, weight_gm_per_pack: 40 },
  { id: "ba-20", name: "Burq Rs 20", category: "Burq Action", unitsPerCarton: 96, unitsPerDozen: 12, weight_gm_per_pack: 75 },
  { id: "ba-50", name: "Burq Rs 50", category: "Burq Action", unitsPerCarton: 48, unitsPerDozen: 12, weight_gm_per_pack: 215 },
  { id: "ba-99", name: "Burq Rs 99", category: "Burq Action", unitsPerCarton: 24, unitsPerDozen: 12, weight_gm_per_pack: 430 },
  { id: "ba-1kg", name: "Burq 1kg", category: "Burq Action", unitsPerCarton: 12, unitsPerDozen: 0, weight_gm_per_pack: 1000 },
  { id: "ba-23kg", name: "Burq 2.3kg", category: "Burq Action", unitsPerCarton: 6, unitsPerDozen: 0, weight_gm_per_pack: 2300 },
  // Vero
  { id: "v-5kg", name: "Vero 5kg", category: "Vero", unitsPerCarton: 4, unitsPerDozen: 0, weight_gm_per_pack: 5000 },
  { id: "v-20kg", name: "Vero 20kg", category: "Vero", unitsPerCarton: 1, unitsPerDozen: 0, weight_gm_per_pack: 20000 },
  // DWB
  { id: "dwb-reg", name: "Regular", category: "DWB", unitsPerCarton: 48, unitsPerDozen: 12, weight_gm_per_pack: 50 },
  { id: "dwb-large", name: "Large", category: "DWB", unitsPerCarton: 36, unitsPerDozen: 12, weight_gm_per_pack: 100 },
  { id: "dwb-long", name: "Long Bar", category: "DWB", unitsPerCarton: 36, unitsPerDozen: 12, weight_gm_per_pack: 210 },
  { id: "dwb-super", name: "Super Bar", category: "DWB", unitsPerCarton: 36, unitsPerDozen: 12, weight_gm_per_pack: 240 },
  { id: "dwb-new", name: "New DWB", category: "DWB", unitsPerCarton: 36, unitsPerDozen: 12, weight_gm_per_pack: 50 },
  // Match
  { id: "m-large", name: "Large", category: "Match", unitsPerCarton: 10, unitsPerDozen: 12, weight_gm_per_pack: 50 },
  { id: "m-classic", name: "Classic", category: "Match", unitsPerCarton: 10, unitsPerDozen: 12, weight_gm_per_pack: 50 },
  { id: "m-regular", name: "Regular", category: "Match", unitsPerCarton: 20, unitsPerDozen: 12, weight_gm_per_pack: 50 },
  { id: "m-slim", name: "Slim", category: "Match", unitsPerCarton: 20, unitsPerDozen: 12, weight_gm_per_pack: 50 },
];

function calculateAchievement(orderData: any) {
  const totals: Record<string, number> = {};
  CATEGORIES.forEach(cat => {
    totals[cat] = SKUS
      .filter(sku => sku.category === cat)
      .reduce((sum, sku) => {
        const item = (orderData || {})[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
        const ctn = Number(item.ctn || 0);
        const dzn = Number(item.dzn || 0);
        const pks = Number(item.pks || 0);
        const packs = (ctn * (sku.unitsPerCarton || 0)) + (dzn * (sku.unitsPerDozen || 0)) + pks;
        const cartons = (sku.unitsPerCarton || 0) > 0 ? packs / sku.unitsPerCarton : 0;
        return sum + (isNaN(cartons) ? 0 : cartons);
      }, 0);
  });
  return totals;
}

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS drafts (
    id TEXT PRIMARY KEY,
    data TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS stock_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT,
    tsm TEXT,
    town TEXT,
    distributor TEXT,
    stock_data TEXT,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
    zone TEXT,
    region TEXT,
    nsm TEXT,
    rsm TEXT,
    sc TEXT,
    director TEXT,
    total_shops INTEGER,
    visited_shops INTEGER,
    productive_shops INTEGER,
    category_productive_data TEXT,
    order_data TEXT,
    targets_data TEXT,
    latitude REAL,
    longitude REAL,
    accuracy REAL,
    visit_type TEXT DEFAULT 'A',
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  `);

  // Remove duplicate orders (keep the latest one based on id)
  try {
    db.exec(`
      DELETE FROM submitted_orders 
      WHERE id NOT IN (
        SELECT MAX(id) 
        FROM submitted_orders 
        GROUP BY ob_contact, date
      )
    `);
  } catch (e) {
    console.error("Error removing duplicates:", e);
  }

  // Add unique index for sync consistency
  try {
    db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_submitted_orders_date_ob ON submitted_orders(date, ob_contact)").run();
  } catch (e) {
    console.error("Error creating unique index:", e);
  }

  db.exec(`
  CREATE TABLE IF NOT EXISTS distributors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    town TEXT,
    name TEXT UNIQUE,
    tsm TEXT,
    zone TEXT,
    region TEXT
  );

  CREATE TABLE IF NOT EXISTS national_hierarchy (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    director_sales TEXT,
    nsm_name TEXT,
    rsm_name TEXT,
    sc_name TEXT,
    asm_tsm_name TEXT,
    town_name TEXT,
    distributor_name TEXT,
    distributor_code TEXT,
    ob_name TEXT,
    ob_id TEXT UNIQUE,
    territory_region TEXT,
    target_ctn REAL DEFAULT 0
  );

  -- Cleanup duplicates before adding index
  DELETE FROM submitted_orders 
  WHERE id NOT IN (
    SELECT MIN(id) 
    FROM submitted_orders 
    GROUP BY ob_contact, date
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_ob_date ON submitted_orders (ob_contact, date);

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT,
    name TEXT,
    contact TEXT,
    region TEXT,
    town TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    user_name TEXT,
    role TEXT,
    action TEXT,
    details TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Add columns if they don't exist
try { db.exec("ALTER TABLE national_hierarchy ADD COLUMN target_ctn REAL DEFAULT 0"); } catch (e) {}
try { db.exec("ALTER TABLE national_hierarchy ADD COLUMN sc_name TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE submitted_orders ADD COLUMN latitude REAL"); } catch (e) {}
try { db.exec("ALTER TABLE submitted_orders ADD COLUMN longitude REAL"); } catch (e) {}
try { db.exec("ALTER TABLE submitted_orders ADD COLUMN accuracy REAL"); } catch (e) {}
try { db.exec("ALTER TABLE submitted_orders ADD COLUMN visit_type TEXT DEFAULT 'A'"); } catch (e) {}
try { db.exec("ALTER TABLE submitted_orders ADD COLUMN zone TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE submitted_orders ADD COLUMN region TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE submitted_orders ADD COLUMN nsm TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE submitted_orders ADD COLUMN rsm TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE submitted_orders ADD COLUMN sc TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE submitted_orders ADD COLUMN director TEXT"); } catch (e) {}

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: "Access denied. No token provided." });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token." });
    
    // Normalize role to Title Case for consistent RBAC checks
    if (user && user.role) {
      const r = user.role.trim().toUpperCase();
      if (r === 'SUPER ADMIN') user.role = 'Super Admin';
      else if (r === 'ADMIN') user.role = 'Admin';
      else if (r === 'DIRECTOR') user.role = 'Director';
      else if (r === 'NSM' || r === 'NATIONAL SALES MANAGER') user.role = 'NSM';
      else if (r === 'RSM' || r === 'REGIONAL SALES MANAGER') user.role = 'RSM';
      else if (r === 'SC' || r === 'SALES CONTROLLER' || r === 'SALES COORDINATOR') user.role = 'SC';
      else if (r === 'TSM' || r === 'TERRITORY SALES MANAGER') user.role = 'TSM';
      else if (r === 'ASM' || r === 'AREA SALES MANAGER') user.role = 'ASM';
      else if (r === 'OB' || r === 'ORDER BOOKER') user.role = 'OB';
      else user.role = user.role.trim();
    }
    
    req.user = user;
    next();
  });
};

const authorizeRoles = (...roles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      console.error("authorizeRoles: No user found in request");
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const userRole = (req.user.role || '').trim().toUpperCase();
    const normalizedRoles = roles.map(r => r.trim().toUpperCase());
    
    // Super Admin can access everything
    if (userRole === 'SUPER ADMIN') return next();
    
    if (normalizedRoles.includes(userRole)) return next();

    console.warn(`authorizeRoles: Access denied for user ${req.user.name} (${req.user.email}). Role: ${userRole}, Required: ${normalizedRoles.join(', ')}`);
    return res.status(403).json({ error: `Unauthorized access for role: ${userRole}` });
  };
};

const logAction = (userId: string, userName: string, role: string, action: string, details: any) => {
  try {
    db.prepare("INSERT INTO audit_logs (user_id, user_name, role, action, details) VALUES (?, ?, ?, ?, ?)")
      .run(userId, userName, role, action, JSON.stringify(details));
  } catch (err) {
    console.error("Audit Log Error:", err);
  }
};
try { db.exec("ALTER TABLE users ADD COLUMN email TEXT UNIQUE"); } catch (e) {}
try { db.exec("ALTER TABLE distributors ADD COLUMN zone TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE distributors ADD COLUMN region TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE ob_assignments ADD COLUMN zone TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE ob_assignments ADD COLUMN region TEXT"); } catch (e) {}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // API Routes
  app.get("/api/draft/:id", (req, res) => {
    try {
      const row = db.prepare("SELECT data FROM drafts WHERE id = ?").get(req.params.id);
      if (row) {
        res.json(JSON.parse(row.data));
      } else {
        res.status(404).json({ error: "Draft not found" });
      }
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch draft" });
    }
  });

  app.post("/api/draft", (req, res) => {
    const { id, data } = req.body;
    db.prepare("INSERT OR REPLACE INTO drafts (id, data, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)")
      .run(id, JSON.stringify(data));
    res.json({ success: true });
  });

  app.get("/api/user/profile", authenticateToken, (req, res) => {
    try {
      const user = db.prepare("SELECT id, username, email, role, name, contact, region, town FROM users WHERE id = ?").get(req.user!.id) as any;
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.put("/api/user/profile", authenticateToken, (req, res) => {
    const { name, contact, region, town } = req.body;
    try {
      db.prepare("UPDATE users SET name = ?, contact = ?, region = ?, town = ? WHERE id = ?")
        .run(name, contact, region, town, req.user!.id);
      
      logAction(req.user!.id.toString(), req.user!.name, req.user!.role, "UPDATE_PROFILE", { name, contact, region, town });
      
      res.json({ success: true, message: "Profile updated successfully" });
    } catch (err) {
      console.error("Profile Update Error:", err);
      res.status(500).json({ error: "Failed to update profile" });
    }
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
      zone TEXT,
      region TEXT,
      nsm TEXT,
      rsm TEXT,
      sc TEXT,
      director TEXT,
      total_shops INTEGER DEFAULT 50,
      routes TEXT -- JSON array of routes
    );
  `);

  // Migration: Ensure all columns exist in ob_assignments
  const obCols = ["contact", "tsm", "total_shops", "town", "distributor", "routes", "zone", "region", "nsm", "rsm", "sc", "director"];
  obCols.forEach(col => {
    try { db.exec(`ALTER TABLE ob_assignments ADD COLUMN ${col} ${col === 'total_shops' ? 'INTEGER DEFAULT 50' : 'TEXT'}`); } catch (e) {}
  });

  // Migration: Ensure all columns exist in submitted_orders
  const subCols = [
    "date", "tsm", "town", "distributor", "order_booker", "ob_contact", "route", 
    "total_shops", "visited_shops", "productive_shops", 
    "category_productive_data", "order_data", "targets_data",
    "latitude", "longitude", "accuracy", "visit_type", "submitted_at",
    "zone", "region", "director", "nsm", "rsm"
  ];
  subCols.forEach(col => {
    try { 
      let type = 'TEXT';
      if (col.includes('shops')) type = 'INTEGER DEFAULT 0';
      if (col === 'latitude' || col === 'longitude' || col === 'accuracy') type = 'REAL';
      db.exec(`ALTER TABLE submitted_orders ADD COLUMN ${col} ${type}`); 
    } catch (e) {}
  });
  
  // Force update all existing OBs to 50 shops as per user request
  try {
    db.exec("UPDATE ob_assignments SET total_shops = 50 WHERE total_shops IS NULL OR total_shops = 0");
    db.exec("UPDATE submitted_orders SET total_shops = 50 WHERE total_shops IS NULL OR total_shops = 0");
    
    // Cleanup duplicates in ob_assignments
    db.exec(`
      DELETE FROM ob_assignments 
      WHERE id NOT IN (
        SELECT MIN(id) 
        FROM ob_assignments 
        GROUP BY contact
      )
    `);

    // Delete dummy entries for Usama as requested
    db.prepare("DELETE FROM submitted_orders WHERE order_booker LIKE ?").run("%Usama%");
    
    console.log("Database cleanup completed: Duplicates removed and dummy entries deleted.");
  } catch (e) {
    console.error("Cleanup error:", e);
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS brand_targets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ob_contact TEXT,
      brand_name TEXT,
      target_ctn REAL DEFAULT 0,
      month TEXT,
      UNIQUE(ob_contact, brand_name, month)
    );

    CREATE TABLE IF NOT EXISTS hierarchy_targets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT,
      name TEXT,
      brand_name TEXT,
      target_ctn REAL DEFAULT 0,
      month TEXT,
      UNIQUE(role, name, brand_name, month)
    );

    CREATE TABLE IF NOT EXISTS app_config (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // Migration: Ensure brand_targets has correct UNIQUE constraint and month column
  try {
    const tableInfo = db.prepare("PRAGMA table_info(brand_targets)").all() as any[];
    const hasMonth = tableInfo.some(col => col.name === 'month');
    if (!hasMonth) {
      db.exec("ALTER TABLE brand_targets ADD COLUMN month TEXT");
      const currentMonth = new Date().toISOString().slice(0, 7);
      db.prepare("UPDATE brand_targets SET month = ? WHERE month IS NULL").run(currentMonth);
    }
    
    // Check for unique constraint (simplified check)
    const indexInfo = db.prepare("PRAGMA index_list(brand_targets)").all() as any[];
    const hasCorrectIndex = indexInfo.some(idx => idx.unique === 1 && idx.origin === 'u');
    
    if (!hasCorrectIndex) {
      // Recreate table to ensure correct UNIQUE constraint
      db.exec(`
        CREATE TABLE brand_targets_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          ob_contact TEXT,
          brand_name TEXT,
          target_ctn REAL DEFAULT 0,
          month TEXT,
          UNIQUE(ob_contact, brand_name, month)
        );
        INSERT OR IGNORE INTO brand_targets_new (ob_contact, brand_name, target_ctn, month)
        SELECT ob_contact, brand_name, target_ctn, COALESCE(month, strftime('%Y-%m', 'now')) FROM brand_targets;
        DROP TABLE brand_targets;
        ALTER TABLE brand_targets_new RENAME TO brand_targets;
      `);
    }
  } catch (e) {
    console.error("Migration error for brand_targets:", e);
  }

  // Helper for Sales Data Headers & Rows
  function getSalesDataHeaders() {
    return [
      'Date', 'Director', 'NSM', 'RSM', 'SC', 'ASM/TSM', 'Town', 'Distributor', 'OB Name', 'OB Contact', 'Route', 
      'Zone', 'Region',
      'Total Shops', 'Visited Shops', 'Productive Shops', 'Visit Type',
      ...SKUS.map(sku => `${sku.name} (${sku.category})`),
      ...CATEGORIES.map(cat => `${cat} Prod`),
      'Total Tonnage (Kg)',
      'Submitted At', 'Latitude', 'Longitude', 'Accuracy'
    ];
  }

  function getSalesDataRow(order: any) {
    const isAbsent = order.visit_type === 'Absent';
    const orderData = !isAbsent && typeof order.order_data === 'string' ? JSON.parse(order.order_data) : (order.order_data || {});
    const catProdData = !isAbsent && typeof order.category_productive_data === 'string' ? JSON.parse(order.category_productive_data) : (order.category_productive_data || {});
    const visitTypeMap: Record<string, string> = { 'A': 'Alone', 'V': 'Van Sales', 'RR': 'Route Riding', 'Absent': 'Absent' };
    const visitTypeLabel = visitTypeMap[order.visit_type] || order.visit_type || 'Alone';
    
    let totalTonnageKg = 0;
    const skuColumns = SKUS.map(sku => {
      if (isAbsent) return 0;
      const item = orderData[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
      const totalPacks = (Number(item.ctn || 0) * sku.unitsPerCarton) + (Number(item.dzn || 0) * sku.unitsPerDozen) + Number(item.pks || 0);
      const ctns = sku.unitsPerCarton > 0 ? totalPacks / sku.unitsPerCarton : 0;
      
      // Weight calculation: (Total Packs * Weight per Pack in gm) / 1000 = Kg
      const weightKg = (totalPacks * (sku.weight_gm_per_pack || 0)) / 1000;
      totalTonnageKg += weightKg;
      
      return ctns;
    });

    return [
      order.date, order.director || '', order.nsm || '', order.rsm || '', order.sc || '', order.tsm, order.town, order.distributor, order.order_booker, order.ob_contact, order.route,
      order.zone || '', order.region || '',
      isAbsent ? 0 : order.total_shops, 
      isAbsent ? 0 : order.visited_shops, 
      isAbsent ? 0 : order.productive_shops, 
      visitTypeLabel,
      ...skuColumns,
      ...CATEGORIES.map(cat => isAbsent ? 0 : (catProdData[cat] || 0)),
      totalTonnageKg.toFixed(2),
      order.submitted_at, order.latitude || '', order.longitude || '', order.accuracy || ''
    ];
  }

  // Initial Config - Only insert if not exists
  db.prepare("INSERT OR IGNORE INTO app_config (key, value) VALUES (?, ?)").run("total_working_days", "25");
  
  // Default Pakistani Holidays for 2026
  const pakHolidays2026 = [
    "2026-02-05", // Kashmir Day
    "2026-03-20", "2026-03-21", "2026-03-22", // Eid-ul-Fitr (approx)
    "2026-03-23", // Pakistan Day
    "2026-05-01", // Labor Day
    "2026-05-27", "2026-05-28", "2026-05-29", // Eid-ul-Azha (approx)
    "2026-07-25", "2026-07-26", // Ashura (approx)
    "2026-08-14", // Independence Day
    "2026-09-25", // Eid Milad-un-Nabi (approx)
    "2026-11-09", // Iqbal Day
    "2026-12-25"  // Quaid-e-Azam Day
  ].join(',');
  
  db.prepare("INSERT OR IGNORE INTO app_config (key, value) VALUES (?, ?)").run("holidays", pakHolidays2026);
  
  // Migration: Ensure total_working_days exists
  const hasWorkingDays = db.prepare("SELECT 1 FROM app_config WHERE key = 'total_working_days'").get();
  if (!hasWorkingDays) {
    db.prepare("INSERT INTO app_config (key, value) VALUES (?, ?)").run("total_working_days", "25");
  }
  
  // Migration: If holidays is empty or missing, fill with defaults
  const currentHolidays = db.prepare("SELECT value FROM app_config WHERE key = 'holidays'").get() as any;
  if (!currentHolidays || (currentHolidays.value || '').trim() === '') {
    db.prepare("INSERT OR REPLACE INTO app_config (key, value) VALUES (?, ?)").run("holidays", pakHolidays2026);
  }

  // Helper for PST Time
  function getPSTTimestamp() {
    return new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" });
  }

  function getPSTDate() {
    return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" });
  }

  function calculateTimeGone() {
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const holidaysRow = db.prepare("SELECT value FROM app_config WHERE key = 'holidays'").get() as any;
    const holidaysStr = holidaysRow?.value || '';
    const holidays = holidaysStr.split(',').map((h: string) => h.trim()).filter((h: string) => h);
    
    let totalWorkingDays = 0;
    let workingDaysGone = 0;
    
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      // Format to YYYY-MM-DD local time
      const dateStr = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0')
      ].join('-');
      
      const isSunday = date.getDay() === 0;
      const isHoliday = holidays.includes(dateStr);
      
      if (!isSunday && !isHoliday) {
        totalWorkingDays++;
        if (d <= today) {
          workingDaysGone++;
        }
      }
    }
    
    const timeGonePercent = totalWorkingDays > 0 ? (workingDaysGone / totalWorkingDays) : 0;
    
    return {
      today,
      daysInMonth,
      totalWorkingDays,
      workingDaysGone,
      timeGonePercent
    };
  }

  function formatPrivateKey(key: string): string {
    if (!key) return '';
    
    let formatted = key.trim();
    
    // 1. Handle JSON format if the whole service account was pasted
    if (formatted.startsWith('{')) {
      try {
        const parsed = JSON.parse(formatted);
        if (parsed.private_key) {
          formatted = parsed.private_key;
        }
      } catch (e) {
        // Not valid JSON, continue
      }
    }

    // 2. Remove wrapping quotes and handle escaped newlines
    formatted = formatted.replace(/^["']|["']$/g, '');
    formatted = formatted.replace(/\\n/g, '\n');
    
    // 3. If it looks like a PEM but is all on one line, fix it
    if (formatted.includes('-----BEGIN') && !formatted.includes('\n')) {
       const headerMatch = formatted.match(/(-----BEGIN [^-]+-----)/);
       const footerMatch = formatted.match(/(-----END [^-]+-----)/);
       if (headerMatch && footerMatch) {
         const header = headerMatch[1];
         const footer = footerMatch[1];
         const content = formatted.replace(header, '').replace(footer, '').replace(/\s/g, '');
         const lines = content.match(/.{1,64}/g) || [];
         return `${header}\n${lines.join('\n')}\n${footer}`;
       }
    }
    
    // 4. If it's already a PEM format, ensure it's clean and properly wrapped
    const pemRegex = /(-----BEGIN [^-]+-----)([\s\S]*?)(-----END [^-]+-----)/;
    const match = formatted.match(pemRegex);
    
    if (match) {
      const header = match[1].trim();
      // Remove all whitespace AND literal \n strings from the base64 part
      const content = match[2].replace(/\\n|\s/g, ''); 
      const footer = match[3].trim();
      
      if (content.length > 0) {
        const lines = content.match(/.{1,64}/g) || [];
        return `${header}\n${lines.join('\n')}\n${footer}`;
      }
    }
    
    // 5. If it's just base64, wrap it as a PRIVATE KEY
    const cleanBase64 = formatted.replace(/\\n|\s/g, '');
    if (cleanBase64.length > 500 && /^[A-Za-z0-9+/=]+$/.test(cleanBase64)) {
      const lines = cleanBase64.match(/.{1,64}/g) || [];
      return `-----BEGIN PRIVATE KEY-----\n${lines.join('\n')}\n-----END PRIVATE KEY-----`;
    }
    
    return formatted;
  }

  function getVisibleOBIds(user: any): string[] {
    const { role, name, contact, region } = user;
    const hierarchy = db.prepare("SELECT * FROM national_hierarchy").all() as any[];
    const trimmedName = (name || '').trim().toLowerCase();
    const trimmedRegion = (region || '').trim().toLowerCase();

    if (role === 'Admin' || role === 'Super Admin' || role === 'Director') {
      const assignments = db.prepare("SELECT contact FROM ob_assignments").all() as any[];
      const submissions = db.prepare("SELECT DISTINCT ob_contact FROM submitted_orders").all() as any[];
      const allOBs = new Set([
        ...hierarchy.map(h => h.ob_id), 
        ...assignments.map(a => a.contact),
        ...submissions.map(s => s.ob_contact)
      ]);
      return Array.from(allOBs).filter(id => id);
    } else if (role === 'NSM') {
      return hierarchy.filter(h => (h.nsm_name || '').trim().toLowerCase() === trimmedName).map(h => h.ob_id);
    } else if (role === 'RSM' || role === 'SC') {
      return hierarchy.filter(h => 
        (h.rsm_name || '').trim().toLowerCase() === trimmedName || 
        (h.sc_name || '').trim().toLowerCase() === trimmedName || 
        (h.territory_region || '').trim().toLowerCase() === trimmedRegion
      ).map(h => h.ob_id);
    } else if (role === 'TSM' || role === 'ASM') {
      return hierarchy.filter(h => (h.asm_tsm_name || '').trim().toLowerCase() === trimmedName).map(h => h.ob_id);
    } else if (role === 'OB') {
      return [contact];
    }
    return [];
  }

  function getVisibleDistributors(user: any): string[] {
    const { role, name, contact, region } = user;
    const trimmedName = (name || '').trim().toLowerCase();
    const trimmedRegion = (region || '').trim().toLowerCase();

    if (role === 'Admin' || role === 'Super Admin' || role === 'Director') {
      const dists = db.prepare("SELECT name FROM distributors").all() as any[];
      const hierarchyDists = db.prepare("SELECT DISTINCT distributor_name FROM national_hierarchy").all() as any[];
      const allDists = new Set([...dists.map(d => d.name), ...hierarchyDists.map(h => h.distributor_name)]);
      return Array.from(allDists).filter(d => d);
    } else if (role === 'NSM') {
      const hierarchy = db.prepare("SELECT DISTINCT distributor_name FROM national_hierarchy WHERE LOWER(TRIM(nsm_name)) = ?").all(trimmedName) as any[];
      return hierarchy.map(h => h.distributor_name);
    } else if (role === 'RSM' || role === 'SC') {
      const hierarchy = db.prepare("SELECT DISTINCT distributor_name FROM national_hierarchy WHERE LOWER(TRIM(rsm_name)) = ? OR LOWER(TRIM(sc_name)) = ? OR LOWER(TRIM(territory_region)) = ?").all(trimmedName, trimmedName, trimmedRegion) as any[];
      const dists = db.prepare("SELECT name FROM distributors WHERE LOWER(TRIM(region)) = ?").all(trimmedRegion) as any[];
      return Array.from(new Set([...hierarchy.map(h => h.distributor_name), ...dists.map(d => d.name)])).filter(d => d);
    } else if (role === 'TSM' || role === 'ASM') {
      const hierarchy = db.prepare("SELECT DISTINCT distributor_name FROM national_hierarchy WHERE LOWER(TRIM(asm_tsm_name)) = ?").all(trimmedName) as any[];
      const dists = db.prepare("SELECT name FROM distributors WHERE LOWER(TRIM(tsm)) = ?").all(trimmedName) as any[];
      return Array.from(new Set([...hierarchy.map(h => h.distributor_name), ...dists.map(d => d.name)])).filter(d => d);
    } else if (role === 'OB') {
      const hierarchy = db.prepare("SELECT DISTINCT distributor_name FROM national_hierarchy WHERE ob_id = ?").all(contact) as any[];
      return hierarchy.map(h => h.distributor_name);
    }
    return [];
  }

  async function getGoogleSheetsClient() {
    const configRows = db.prepare("SELECT * FROM app_config").all() as any[];
    const config = configRows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {} as any);
    
    let spreadsheetId = config.google_spreadsheet_id || process.env.GOOGLE_SPREADSHEET_ID;
    if (spreadsheetId) {
      spreadsheetId = spreadsheetId.trim().replace(/^\/+|\/+$/g, '');
    }
    let clientEmail = config.google_service_account_email || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    let privateKeyRaw = config.google_private_key || process.env.GOOGLE_PRIVATE_KEY;
    let tokensRaw = config.google_tokens;

    if (privateKeyRaw) {
      try {
        const parsed = JSON.parse(privateKeyRaw);
        if (parsed.client_email && !clientEmail) {
          clientEmail = parsed.client_email;
          db.prepare("INSERT OR REPLACE INTO app_config (key, value) VALUES (?, ?)").run("google_service_account_email", clientEmail);
        }
        if (parsed.private_key) {
          privateKeyRaw = parsed.private_key;
        }
      } catch (e) {}

      const privateKey = formatPrivateKey(privateKeyRaw);

      console.log("Initializing Google Sheets Client with:", {
        spreadsheetId,
        clientEmail,
        privateKeyLength: privateKey?.length,
        privateKeyStart: privateKey?.substring(0, 30),
        privateKeyEnd: privateKey?.substring(privateKey?.length - 30)
      });

      if (!spreadsheetId) {
        throw new Error("Spreadsheet ID is missing. Please provide the ID of a Google Sheet shared with the Service Account.");
      }
      if (!clientEmail) {
        throw new Error("Service Account Email is missing.");
      }
      if (!privateKey) {
        throw new Error("Private Key is invalid or missing.");
      }

      try {
        const auth = new google.auth.JWT({
          email: clientEmail,
          key: privateKey,
          scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.file']
        });
        const sheets = google.sheets({ version: 'v4', auth });
        return { sheets, spreadsheetId, auth };
      } catch (err: any) {
        console.error("JWT Initialization Error:", err);
        if (err.message.includes("DECODER routines::unsupported")) {
          throw new Error("Invalid Private Key format. Please ensure you copied the entire 'private_key' from the JSON file, including the BEGIN and END headers.");
        }
        if (err.message.includes("invalid_grant: Invalid JWT Signature")) {
          throw new Error("Invalid JWT Signature. This means the Private Key does not match the Service Account Email. Please ensure you are using the correct pair from the same JSON file.");
        }
        throw err;
      }
    } else if (tokensRaw) {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );
      oauth2Client.setCredentials(JSON.parse(tokensRaw));
      const sheets = google.sheets({ version: "v4", auth: oauth2Client });
      
      if (!spreadsheetId) {
        const resource = { properties: { title: "Sales Reporting Data" } };
        const spreadsheet = await sheets.spreadsheets.create({ requestBody: resource, fields: "spreadsheetId" });
        spreadsheetId = spreadsheet.data.spreadsheetId;
        db.prepare("INSERT OR REPLACE INTO app_config (key, value) VALUES (?, ?)").run("google_spreadsheet_id", spreadsheetId);
      }
      
      return { sheets, spreadsheetId, auth: oauth2Client };
    }
    
    return null;
  }

  // Google Sheets Helper
  async function appendToSheet(order: any) {
    try {
      const client = await getGoogleSheetsClient();
      if (!client) {
        console.log("Skipping sync: Google Sheets client could not be initialized");
        return;
      }
      const { sheets, spreadsheetId } = client;

      await ensureSheetsExist(sheets, spreadsheetId);

      const orderData = typeof order.order_data === 'string' ? JSON.parse(order.order_data) : (order.order_data || {});
      const catProdData = typeof order.category_productive_data === 'string' ? JSON.parse(order.category_productive_data) : (order.category_productive_data || {});
      const achievement = calculateAchievement(orderData);
      
      // 1. Append to Sales_Data
      const salesHeaders = getSalesDataHeaders();
      const salesRow = getSalesDataRow(order);

      // Check if headers exist, if not add them
      const salesData = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'Sales_Data!A1:A1' });
      if (!salesData.data.values || salesData.data.values.length === 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: 'Sales_Data!A1',
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [salesHeaders] }
        });
      }

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Sales_Data!A2',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [salesRow] },
      });

      // 2. Refresh summary sheets
      await refreshSummarySheets(sheets, spreadsheetId);

      console.log(`Successfully synced order ${order.id} to Google Sheets`);
    } catch (err) {
      console.error("Google Sheets Sync Error:", err);
    }
  }

  const ensuredSpreadsheets = new Set<string>();

  async function ensureSheetsExist(sheets: any, spreadsheetId: string) {
    if (ensuredSpreadsheets.has(spreadsheetId)) return;
    
    const sheetConfigs: Record<string, string[]> = {
      "Sales_Data": getSalesDataHeaders(),
      "Team_Data": [
        'Director', 'NSM', 'RSM', 'SC', 'ASM/TSM', 'Town', 'Distributor', 'OB Name', 'OB ID', 'Zone', 'Region', 'Total Shops', 'Routes',
        'Kite Glow Target', 'Burq Action Target', 'Vero Target', 'DWB Target', 'Match Target'
      ],
      "Targets_vs_Achievement": [
        'Month', 'Town', 'OB Name', 'OB Contact', 'ASM/TSM', 'Distributor', 
        'Total Working Days', 'Days Gone', 'Time Gone %',
        ...CATEGORIES.flatMap(cat => [`${cat} Target`, `${cat} Till Date Tgt`, `${cat} Ach`, `${cat} %`]), 
        'Total Target', 'Total Till Date Tgt', 'Total Ach', 'Total %'
      ],
      "OB_Route_Performance": ['OB Name', 'Route', 'Total Shops', 'Visited', 'Productive', 'Prod %'],
      "Stocks_Report": ['Date', 'Distributor', 'Town', 'ASM/TSM', 'SKU Name', 'Opening', 'Received', 'Sold', 'Closing'],
      "Current_Stocks": ['Distributor', 'Town', 'SKU Name', 'Current Stock'],
      "Last_Entry_Date": ['OB Name', 'Contact', 'ASM/TSM', 'Distributor', 'Last Submission Date', 'Last Submission Time', 'Total Days Entered'],
      "Visit_Type_Analysis": ['Date', 'OB Name', 'Route', 'Visit Type', 'Total Visits', 'Total Productive', 'Productivity %', 'Avg Achievement (Ctn)'],
      "OB_Performance": ['OB Name', 'OB ID', 'ASM/TSM', 'Distributor', 'Town', 'Total Shops', 'Visited', 'Productive', 'Prod %', 'Total Ach (Ctn)', 'Achievement %'],
      "TSM_Performance": ['TSM Name', 'Total OBs', 'Total Shops', 'Visited', 'Productive', 'Prod %', 'Total Ach (Ctn)'],
      "Product_Config": ['SKU ID', 'SKU Name', 'Category', 'Units Per Carton', 'Units Per Dozen', 'Weight (Kg)'],
      "Users": ['Username', 'Email', 'Role', 'Name', 'Contact', 'Region', 'Town']
    };

    try {
      const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
      const existingSheets = spreadsheet.data.sheets;
      const existingTitles = existingSheets.map((s: any) => s.properties.title);
      
      const missingTitles = Object.keys(sheetConfigs).filter(t => !existingTitles.includes(t));
      
      if (missingTitles.length > 0) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: missingTitles.map(title => ({
              addSheet: { properties: { title } }
            }))
          }
        });
      }

      // Ensure headers for all sheets
      const ranges = Object.keys(sheetConfigs).map(title => `${title}!A1:A1`);
      const res = await sheets.spreadsheets.values.batchGet({
        spreadsheetId,
        ranges
      });

      const valueRanges = res.data.valueRanges || [];
      const titles = Object.keys(sheetConfigs);

      for (let i = 0; i < titles.length; i++) {
        const title = titles[i];
        const headers = sheetConfigs[title];
        const currentHeader = valueRanges[i]?.values;

        if (!currentHeader || currentHeader.length === 0) {
          try {
            await sheets.spreadsheets.values.update({
              spreadsheetId,
              range: `${title}!A1`,
              valueInputOption: "USER_ENTERED",
              requestBody: { values: [headers] }
            });
          } catch (e) {
            console.error(`Error ensuring headers for ${title}:`, e);
          }
        }
      }
      
      ensuredSpreadsheets.add(spreadsheetId);
    } catch (e: any) {
      console.error("ensureSheetsExist Error:", e.message);
      throw e; // Re-throw to handle in caller
    }
  }

  async function refreshSummarySheets(sheets: any, spreadsheetId: string) {
    await ensureSheetsExist(sheets, spreadsheetId);

    const currentMonth = getPSTDate().slice(0, 7);
    const orders = db.prepare("SELECT * FROM submitted_orders WHERE date LIKE ?").all(`${currentMonth}%`) as any[];
    const obs = db.prepare("SELECT * FROM ob_assignments").all() as any[];
    const timeInfo = calculateTimeGone();

    // --- SHEET 2: Targets_vs_Achievement (Town, OB, Brand Wise) ---
    const targetHeaders = [
      'Month', 'Town', 'OB Name', 'OB Contact', 'ASM/TSM', 'Distributor', 
      'Total Working Days', 'Days Gone', 'Time Gone %',
      ...CATEGORIES.flatMap(cat => [`${cat} Target`, `${cat} Till Date Tgt`, `${cat} Ach`, `${cat} %`]), 
      'Total Target', 'Total Till Date Tgt', 'Total Ach', 'Total %'
    ];
    const targetRows: any[] = [];

    // Pre-calculate achievements per OB and Brand for efficiency
    const achievementMap: Record<string, Record<string, number>> = {};
    orders.forEach(order => {
      const obContact = order.ob_contact;
      if (!achievementMap[obContact]) achievementMap[obContact] = {};
      
      const orderData = typeof order.order_data === 'string' ? JSON.parse(order.order_data) : (order.order_data || {});
      const orderAch = calculateAchievement(orderData);
      
      CATEGORIES.forEach(cat => {
        achievementMap[obContact][cat] = (achievementMap[obContact][cat] || 0) + (orderAch[cat] || 0);
      });
    });

    for (const ob of obs) {
      const row = [
        currentMonth,
        ob.town || '',
        ob.name || '',
        ob.contact || '',
        ob.tsm || '',
        ob.distributor || '',
        timeInfo.totalWorkingDays,
        timeInfo.workingDaysGone,
        (timeInfo.timeGonePercent * 100).toFixed(1) + '%'
      ];

      let totalT = 0;
      let totalTillDateT = 0;
      let totalA = 0;

      for (const cat of CATEGORIES) {
        const obTargets = db.prepare("SELECT target_ctn FROM brand_targets WHERE ob_contact = ? AND brand_name = ? AND month = ?").get(ob.contact, cat, currentMonth) as any;
        const target = obTargets ? obTargets.target_ctn : 0;
        const tillDateTarget = target * timeInfo.timeGonePercent;
        const ach = achievementMap[ob.contact]?.[cat] || 0;

        totalT += target;
        totalTillDateT += tillDateTarget;
        totalA += ach;

        row.push(target.toFixed(2));
        row.push(tillDateTarget.toFixed(2));
        row.push(ach.toFixed(2));
        row.push(tillDateTarget > 0 ? ((ach / tillDateTarget) * 100).toFixed(1) + '%' : '0%');
      }

      row.push(totalT.toFixed(2));
      row.push(totalTillDateT.toFixed(2));
      row.push(totalA.toFixed(2));
      row.push(totalTillDateT > 0 ? ((totalA / totalTillDateT) * 100).toFixed(1) + '%' : '0%');

      targetRows.push(row);
    }

    // --- NEW SHEET: OB_Performance ---
    const obPerformanceHeaders = ['OB Name', 'OB ID', 'ASM/TSM', 'Distributor', 'Town', 'Total Shops', 'Visited', 'Productive', 'Prod %', 'Total Ach (Ctn)', 'Achievement %'];
    const obPerformanceRows = obs.map(ob => {
      const obOrders = orders.filter(o => o.ob_contact === ob.contact);
      const visited = obOrders.reduce((sum, o) => sum + (o.visited_shops || 0), 0);
      const productive = obOrders.reduce((sum, o) => sum + (o.productive_shops || 0), 0);
      const ach = achievementMap[ob.contact] ? Object.values(achievementMap[ob.contact]).reduce((a, b) => a + b, 0) : 0;
      
      // Get total target for %
      const obTargets = db.prepare("SELECT SUM(target_ctn) as total FROM brand_targets WHERE ob_contact = ? AND month = ?").get(ob.contact, currentMonth) as any;
      const target = obTargets?.total || 0;
      const tillDateTarget = target * timeInfo.timeGonePercent;

      return [
        ob.name, ob.contact, ob.tsm, ob.distributor, ob.town,
        ob.total_shops || 50, visited, productive,
        visited > 0 ? ((productive / visited) * 100).toFixed(1) + '%' : '0%',
        ach.toFixed(2),
        tillDateTarget > 0 ? ((ach / tillDateTarget) * 100).toFixed(1) + '%' : '0%'
      ];
    }).sort((a: any, b: any) => {
      // Sort by TSM then OB Name
      if (a[2] < b[2]) return -1;
      if (a[2] > b[2]) return 1;
      if (a[0] < b[0]) return -1;
      if (a[0] > b[0]) return 1;
      return 0;
    });

    // --- NEW SHEET: TSM_Performance ---
    const tsmPerformanceHeaders = ['TSM Name', ...CATEGORIES.map(cat => `${cat} Ach`), 'Total Ach', 'Total Target', 'Achievement %'];
    const tsmList = Array.from(new Set(obs.map(ob => ob.tsm).filter(Boolean))) as string[];
    const tsmPerformanceRows = tsmList.map(tsm => {
      const tsmOBs = obs.filter(ob => ob.tsm === tsm);
      const tsmAch: Record<string, number> = {};
      let totalT = 0;
      
      tsmOBs.forEach(ob => {
        CATEGORIES.forEach(cat => {
          tsmAch[cat] = (tsmAch[cat] || 0) + (achievementMap[ob.contact]?.[cat] || 0);
          const obTarget = db.prepare("SELECT target_ctn FROM brand_targets WHERE ob_contact = ? AND brand_name = ? AND month = ?").get(ob.contact, cat, currentMonth) as any;
          totalT += obTarget?.target_ctn || 0;
        });
      });

      const totalA = Object.values(tsmAch).reduce((a, b) => a + b, 0);
      const tillDateTarget = totalT * timeInfo.timeGonePercent;

      return [
        tsm,
        ...CATEGORIES.map(cat => (tsmAch[cat] || 0).toFixed(2)),
        totalA.toFixed(2),
        totalT.toFixed(2),
        tillDateTarget > 0 ? ((totalA / tillDateTarget) * 100).toFixed(1) + '%' : '0%'
      ];
    });

    // --- SHEET 4: Stocks_Report (Log) ---
    const stockHeaders = ['Date', 'ASM/TSM', 'Town', 'Distributor', ...SKUS.map(s => s.name), 'Submitted At'];
    const stockReports = db.prepare("SELECT * FROM stock_reports ORDER BY date DESC, submitted_at DESC").all() as any[];
    const stockRows = stockReports.map(report => {
      const stockData = JSON.parse(report.stock_data || '{}');
      return [
        report.date,
        report.tsm,
        report.town,
        report.distributor,
        ...SKUS.map(sku => {
          const item = stockData[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
          const total = (Number(item.ctn || 0) * sku.unitsPerCarton + Number(item.dzn || 0) * sku.unitsPerDozen + Number(item.pks || 0)) / (sku.unitsPerCarton || 1);
          return total.toFixed(2);
        }),
        report.submitted_at
      ];
    });

    // --- SHEET 4.5: Current_Stocks (Matrix) ---
    // Matrix: Distributors as Rows, SKUs as Columns
    const matrixHeaders = ['Distributor', 'Town', 'ASM/TSM', ...SKUS.map(s => s.name), 'Last Updated'];
    
    // Get latest stock report for each distributor
    const latestStocks = db.prepare(`
      SELECT * FROM stock_reports 
      WHERE id IN (
        SELECT MAX(id) FROM stock_reports GROUP BY distributor
      )
    `).all() as any[];

    const matrixRows = latestStocks.map(report => {
      const stockData = JSON.parse(report.stock_data || '{}');
      return [
        report.distributor,
        report.town,
        report.tsm,
        ...SKUS.map(sku => {
          const item = stockData[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
          const total = (Number(item.ctn || 0) * sku.unitsPerCarton + Number(item.dzn || 0) * sku.unitsPerDozen + Number(item.pks || 0)) / (sku.unitsPerCarton || 1);
          return total.toFixed(2);
        }),
        report.submitted_at
      ];
    });

    // --- SHEET 3: OB_Route_Performance ---
    const performanceHeaders = [
      'Date', 'OB Name', 'Contact', 'Route', 'Total Shops', 'Visited', 'Productive', 'Visit %', 'Prod %',
      ...CATEGORIES.map(cat => `${cat} Ach`),
      'Total Ach', 'Total Target', 'Overall %'
    ];

    // Get all OBs to ensure everyone is listed
    const performanceRows = obs.map(ob => {
      // Find the latest order for this OB to show their current route performance
      // Or better, show all their orders for the month?
      // The user said "not updated by all OB", implying they want to see everyone.
      // Let's find all orders for this OB this month
      const obOrders = orders.filter(o => o.ob_contact === ob.contact);
      
      if (obOrders.length === 0) {
        return [
          ob.name, ob.contact, 'No Entry',
          ob.total_shops || 0, 0, 0,
          '0%', '0%',
          ...CATEGORIES.map(() => '0.00'),
          '0.00', '0.00', '0%'
        ];
      }

      // If they have multiple orders (different routes), we should probably list each?
      // The current logic was mapping over `orders`. Let's keep that but maybe add missing OBs?
      // Actually, mapping over `orders` is better for "Route Performance" specifically.
      // But if an OB hasn't submitted, they are missing.
      // Let's stick to mapping over `orders` but ensure we are getting ALL orders for the month.
      return null; // Placeholder for logic below
    }).filter(Boolean);

    // Re-implementing performanceRows to include all orders AND missing OBs
    const allPerformanceRows: any[] = [];
    
    // 1. Add rows for all actual submissions
    orders.forEach(order => {
      const orderData = typeof order.order_data === 'string' ? JSON.parse(order.order_data) : (order.order_data || {});
      const targetsData = typeof order.targets_data === 'string' ? JSON.parse(order.targets_data) : (order.targets_data || {});
      const ach = calculateAchievement(orderData);
      const totalAch = Object.values(ach).reduce((a: any, b: any) => Number(a) + Number(b), 0);
      const totalTarget = Object.values(targetsData).reduce((a: any, b: any) => Number(a) + Number(b), 0);

      allPerformanceRows.push([
        order.date, order.order_booker, order.ob_contact, order.route,
        order.total_shops, order.visited_shops, order.productive_shops,
        order.total_shops > 0 ? ((order.visited_shops / order.total_shops) * 100).toFixed(1) + '%' : '0%',
        order.visited_shops > 0 ? ((order.productive_shops / order.visited_shops) * 100).toFixed(1) + '%' : '0%',
        ...CATEGORIES.map(cat => Number(ach[cat] || 0).toFixed(2)),
        Number(totalAch).toFixed(2), Number(totalTarget).toFixed(2),
        Number(totalTarget) > 0 ? ((Number(totalAch) / Number(totalTarget)) * 100).toFixed(1) + '%' : '0%'
      ]);
    });

    // 2. Add rows for OBs who haven't submitted anything yet this month
    obs.forEach(ob => {
      const hasSubmitted = orders.some(o => o.ob_contact === ob.contact);
      if (!hasSubmitted) {
        allPerformanceRows.push([
          getPSTDate(), ob.name, ob.contact, 'PENDING',
          ob.total_shops || 0, 0, 0,
          '0%', '0%',
          ...CATEGORIES.map(() => '0.00'),
          '0.00', '0.00', '0%'
        ]);
      }
    });

    // --- SHEET 5: Last_Entry_Date ---
    const lastEntryHeaders = ['OB Name', 'Contact', 'ASM/TSM', 'Distributor', 'Last Submission Date', 'Last Submission Time', 'Total Days Entered'];
    const lastEntries = db.prepare(`
      SELECT ob_assignments.name, ob_assignments.contact, ob_assignments.tsm, ob_assignments.distributor, 
             MAX(submitted_orders.date) as last_date, MAX(submitted_orders.submitted_at) as last_ts,
             COUNT(DISTINCT submitted_orders.date) as total_days
      FROM ob_assignments
      LEFT JOIN submitted_orders ON ob_assignments.contact = submitted_orders.ob_contact
      GROUP BY ob_assignments.contact
    `).all() as any[];
    
    const lastEntryRows = lastEntries.map(e => [
      e.name, e.contact, e.tsm, e.distributor, e.last_date || 'No Entry', e.last_ts || 'No Entry', e.total_days || 0
    ]);

    // --- SHEET 6: Visit_Type_Analysis ---
    const analysisHeaders = ['Date', 'OB Name', 'Route', 'Visit Type', 'Total Visits', 'Total Productive', 'Productivity %', 'Avg Achievement (Ctn)'];
    const visitAnalysis = db.prepare(`
      SELECT 
        date,
        order_booker,
        route,
        CASE 
          WHEN visit_type = 'Absent' THEN 'Absent'
          WHEN visit_type = 'RR' THEN 'Route Riding'
          WHEN visit_type = 'V' THEN 'Van Sales'
          ELSE 'Alone'
        END as visit_type_label,
        visit_type,
        COUNT(*) as total_visits,
        SUM(productive_shops) as total_productive,
        SUM(visited_shops) as total_visited
      FROM submitted_orders
      WHERE date LIKE ?
      GROUP BY date, order_booker, route, visit_type
    `).all(`${currentMonth}%`) as any[];

    const analysisRows = visitAnalysis.map(a => {
      const totalVisited = a.total_visited || 0;
      const totalProductive = a.total_productive || 0;
      const prodPercent = totalVisited > 0 ? ((totalProductive / totalVisited) * 100).toFixed(1) + '%' : '0%';
      
      // Calculate avg achievement for this group
      const groupOrders = orders.filter(o => {
        return o.date === a.date && o.visit_type === a.visit_type && o.route === a.route && o.order_booker === a.order_booker;
      });
      
      const totalAch = groupOrders.reduce((sum, o) => {
        const data = typeof o.order_data === 'string' ? JSON.parse(o.order_data) : (o.order_data || {});
        const ach = calculateAchievement(data);
        return sum + Object.values(ach).reduce((acc, val) => acc + val, 0);
      }, 0);

      const avgAch = groupOrders.length > 0 ? (totalAch / groupOrders.length).toFixed(2) : '0.00';

      return [a.date, a.order_booker, a.route, a.visit_type_label, a.total_visits, totalProductive, prodPercent, avgAch];
    });

    // Consolidated Batch Update for all summary sheets
    try {
      // Clear existing data first to avoid stale rows at the bottom
      await sheets.spreadsheets.values.batchClear({
        spreadsheetId,
        requestBody: {
          ranges: [
            "Targets_vs_Achievement",
            "OB_Performance",
            "TSM_Performance",
            "Stocks_Report",
            "Current_Stocks",
            "OB_Route_Performance",
            "Last_Entry_Date",
            "Visit_Type_Analysis"
          ]
        }
      });

      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
          valueInputOption: "USER_ENTERED",
          data: [
            { range: "Targets_vs_Achievement!A1", values: [targetHeaders, ...targetRows] },
            { range: "OB_Performance!A1", values: [obPerformanceHeaders, ...obPerformanceRows] },
            { range: "TSM_Performance!A1", values: [tsmPerformanceHeaders, ...tsmPerformanceRows] },
            { range: "Stocks_Report!A1", values: [stockHeaders, ...stockRows] },
            { range: "Current_Stocks!A1", values: [matrixHeaders, ...matrixRows] },
            { range: "OB_Route_Performance!A1", values: [performanceHeaders, ...allPerformanceRows] },
            { range: "Last_Entry_Date!A1", values: [lastEntryHeaders, ...lastEntryRows] },
            { range: "Visit_Type_Analysis!A1", values: [analysisHeaders, ...analysisRows] }
          ]
        }
      });
    } catch (err: any) {
      console.error("refreshSummarySheets Error:", err.message || err);
      throw err;
    }
  }

  async function syncAllToSheets() {
    try {
      const client = await getGoogleSheetsClient();
      if (!client) return;
      const { sheets, spreadsheetId } = client;

      await ensureSheetsExist(sheets, spreadsheetId);

      const orders = db.prepare("SELECT * FROM submitted_orders ORDER BY date ASC").all() as any[];

      // 1. Sales_Data (SKU Wise)
      const salesHeaders = getSalesDataHeaders();
      const salesRows = orders.map((order: any) => getSalesDataRow(order));

      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: "Sales_Data",
      });

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "Sales_Data!A1",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [salesHeaders, ...salesRows] },
      });

      await refreshSummarySheets(sheets, spreadsheetId);
    } catch (err) {
      console.error("Global Sync Error:", err);
    }
  }

  // Google OAuth Setup
  const getOAuth2Client = (req: express.Request) => {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers.host;
    const redirectUri = `${protocol}://${host}/api/auth/google/callback`;
    
    return new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );
  };

  // Initial Seed Data if empty
  const obCount = db.prepare("SELECT COUNT(*) as count FROM ob_assignments").get() as any;
  if (obCount.count === 0) {
    const seedOBs = [
      { name: "Muhammad Bilal", contact: "P-01", town: "Peshawar", distributor: "Peshawar Dist", tsm: "Muhammad Shoaib", totalShops: 50, routes: JSON.stringify(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]) },
      { name: "Khizar Hayat", contact: "P-02", town: "Peshawar", distributor: "Peshawar Dist", tsm: "Muhammad Shoaib", totalShops: 50, routes: JSON.stringify(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]) },
      { name: "Adil Khan", contact: "P-03", town: "Peshawar", distributor: "Peshawar Dist", tsm: "Muhammad Shoaib", totalShops: 50, routes: JSON.stringify(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]) },
      { name: "Baidar Khan", contact: "P-04", town: "Peshawar", distributor: "Peshawar Dist", tsm: "Muhammad Shoaib", totalShops: 50, routes: JSON.stringify(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]) },
      { name: "Muhammad Usman", contact: "P-05", town: "Peshawar", distributor: "Peshawar Dist", tsm: "Muhammad Shoaib", totalShops: 50, routes: JSON.stringify(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]) },
      { name: "Ghulam Rasool", contact: "P-06", town: "Peshawar", distributor: "Peshawar Dist", tsm: "Muhammad Shoaib", totalShops: 50, routes: JSON.stringify(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]) },
      { name: "Khalid Awan", contact: "P-07", town: "Peshawar", distributor: "Peshawar Dist", tsm: "Muhammad Shoaib", totalShops: 50, routes: JSON.stringify(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]) },
      { name: "Shahid", contact: "H-01", town: "Haripur", distributor: "Haripur Dist", tsm: "Muhammad Yousaf", totalShops: 50, routes: JSON.stringify(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]) },
      { name: "Shahrukh", contact: "H-02", town: "Haripur", distributor: "Haripur Dist", tsm: "Muhammad Yousaf", totalShops: 50, routes: JSON.stringify(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]) },
      { name: "Bilal", contact: "T-01", town: "Taxila", distributor: "Taxila Dist", tsm: "Muhammad Yousaf", totalShops: 50, routes: JSON.stringify(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]) },
      { name: "Muneeb", contact: "T-02", town: "Taxila", distributor: "Taxila Dist", tsm: "Muhammad Yousaf", totalShops: 50, routes: JSON.stringify(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]) },
      { name: "Kashif", contact: "K-01", town: "Kohat", distributor: "Kohat Dist", tsm: "Noman Paracha", totalShops: 50, routes: JSON.stringify(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]) },
      { name: "Bilal", contact: "HG-01", town: "Hangu", distributor: "Hangu Dist", tsm: "Noman Paracha", totalShops: 50, routes: JSON.stringify(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]) },
      { name: "Usama", contact: "A-01", town: "Attock", distributor: "Attock Dist", tsm: "Noman Paracha", totalShops: 50, routes: JSON.stringify(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]) },
      { name: "Zakaullah", contact: "DI-01", town: "DI Khan", distributor: "DI Khan Dist", tsm: "Ikramullah", totalShops: 50, routes: JSON.stringify(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]) },
      { name: "Muntazir", contact: "DI-02", town: "DI Khan", distributor: "DI Khan Dist", tsm: "Ikramullah", totalShops: 50, routes: JSON.stringify(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]) },
      { name: "Muhammad Amir", contact: "M-01", town: "Mardan", distributor: "Mardan Dist", tsm: "Muhammad Zeeshan", totalShops: 50, routes: JSON.stringify(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]) },
      { name: "Farhan Zeb", contact: "NOW-01", town: "Nowshera", distributor: "Nowshera Dist", tsm: "Muhammad Zeeshan", totalShops: 50, routes: JSON.stringify(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]) },
      { name: "Babar", contact: "C-01", town: "Charsadda", distributor: "Charsadda Dist", tsm: "Waheed Jamal", totalShops: 50, routes: JSON.stringify(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]) },
      { name: "Ghulam Hussain", contact: "MUZ-01", town: "Muzaffarabad", distributor: "Muz Dist", tsm: "Qaisar Yousaf", totalShops: 50, routes: JSON.stringify(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]) },
      { name: "Hashim", contact: "MAN-01", town: "Mansehra", distributor: "Man Dist", tsm: "Qaisar Yousaf", totalShops: 50, routes: JSON.stringify(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]) }
    ];
    const insertOB = db.prepare("INSERT INTO ob_assignments (name, contact, town, distributor, tsm, total_shops, routes) VALUES (?, ?, ?, ?, ?, ?, ?)");
    seedOBs.forEach(ob => insertOB.run(ob.name, ob.contact, ob.town, ob.distributor, ob.tsm, ob.totalShops, ob.routes));
  }

  // Ensure Super Admin User
  const superAdminCheck = db.prepare("SELECT * FROM users WHERE username = 'amjid.admin' OR email = 'amjid.bisconni@gmail.com'").get();
  if (!superAdminCheck) {
    const hashedPass = bcrypt.hashSync("Admin@123", 10);
    db.prepare("INSERT INTO users (username, email, password, role, name) VALUES (?, ?, ?, ?, ?)")
      .run("amjid.admin", "amjid.bisconni@gmail.com", hashedPass, "Super Admin", "Muhammad Amjid");
  }

  // Daily Backup Cron (9:00 AM)
  cron.schedule('0 9 * * *', async () => {
    console.log("Starting daily backup...");
    await performFullBackup();
  });

  async function performFullBackup() {
    const date = new Date().toISOString().split('T')[0];
    const backupDir = path.join(process.cwd(), 'backups', date);
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    const dbPath = path.join(process.cwd(), 'orders.db');
    const dbBackupPath = path.join(backupDir, `orders_${date}.db`);
    if (fs.existsSync(dbPath)) fs.copyFileSync(dbPath, dbBackupPath);

    try {
      const client = await getGoogleSheetsClient();
      if (client && client.auth) {
        const drive = google.drive({ version: 'v3', auth: client.auth });
        
        const folderResponse = await drive.files.create({
          requestBody: { name: `SalesPulse_Backups_${date}`, mimeType: 'application/vnd.google-apps.folder' },
          fields: 'id'
        });
        const folderId = folderResponse.data.id;

        await drive.files.create({
          requestBody: { name: `orders_${date}.db`, parents: [folderId!] },
          media: { mimeType: 'application/x-sqlite3', body: fs.createReadStream(dbBackupPath) }
        });
      }
    } catch (err) {
      console.error("Backup Upload Error:", err);
    }
  }

  // Auth Routes
  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    try {
      if (!username) {
        return res.status(400).json({ error: "Username or email is required" });
      }
      
      let user = db.prepare("SELECT * FROM users WHERE username = ? OR email = ?").get(username, username) as any;
      
      if (!user) {
        // Fallback for first time admin login
        if (username === ADMIN_EMAIL || username.toLowerCase() === 'admin') {
          const role = 'Super Admin';
          const name = 'Admin';
          const hashedPassword = await bcrypt.hash(password || 'Admin@123', 10);
          const info = db.prepare("INSERT INTO users (username, email, role, name, password) VALUES (?, ?, ?, ?, ?)")
            .run(username, username === ADMIN_EMAIL ? username : 'admin@salespulse.local', role, name, hashedPassword);
          user = db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid) as any;
        } else {
          return res.status(401).json({ error: "Invalid credentials" });
        }
      } else {
        // If password is provided, check it. If not, allow login if it's an email-only request
        if (password) {
          if (user.password === 'nopassword' || user.password === '123456' || user.password === 'password123' || user.password === '123') {
             if (password !== user.password) {
               return res.status(401).json({ error: "Invalid credentials" });
             }
          } else {
             const isValid = await bcrypt.compare(password, user.password);
             if (!isValid) {
               return res.status(401).json({ error: "Invalid credentials" });
             }
          }
        }
        // If no password provided, we still allow login as requested by the user
      }

      const token = jwt.sign({ 
        id: user.id, 
        username: user.username, 
        email: user.email,
        role: user.role, 
        name: user.name, 
        contact: user.contact, 
        region: user.region 
      }, JWT_SECRET, { expiresIn: '30d' });
      
      logAction(user.id.toString(), user.name, user.role, "LOGIN_SIMPLE", { username });
      
      res.json({ 
        token, 
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email,
          role: user.role, 
          name: user.name, 
          contact: user.contact, 
          region: user.region 
        } 
      });
    } catch (err) {
      console.error("Login Error:", err);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/register", authenticateToken, authorizeRoles('Admin', 'Super Admin'), async (req, res) => {
    const { username, password, role, name, contact, region, town } = req.body;
    try {
      const pass = password || 'nopassword';
      const hashedPassword = await bcrypt.hash(pass, 10);
      db.prepare("INSERT INTO users (username, password, role, name, contact, region, town) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .run(username, hashedPassword, role, name, contact, region, town);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Registration failed. Username might already exist." });
    }
  });

  app.get("/api/auth/me", authenticateToken, (req: any, res) => {
    res.json(req.user);
  });

  // API Routes for Admin
  app.get("/api/admin/config", authenticateToken, authorizeRoles('Admin', 'Super Admin', 'TSM', 'ASM', 'RSM', 'NSM', 'Director', 'SC', 'OB'), (req, res) => {
    try {
      const rows = db.prepare("SELECT * FROM app_config").all();
      const config = rows.reduce((acc: any, row: any) => ({ ...acc, [row.key]: row.value }), {});
      
      // Fallback to environment variables if not in DB
      if (!config.google_spreadsheet_id && process.env.GOOGLE_SPREADSHEET_ID) {
        config.google_spreadsheet_id = process.env.GOOGLE_SPREADSHEET_ID;
      }
      if (!config.google_service_account_email && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
        config.google_service_account_email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
      }
      if (!config.google_private_key && process.env.GOOGLE_PRIVATE_KEY) {
        config.google_private_key = process.env.GOOGLE_PRIVATE_KEY;
      }
      
      res.json(config);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch config" });
    }
  });

  app.get("/api/admin/users", authenticateToken, authorizeRoles('Admin', 'Super Admin'), (req, res) => {
    try {
      const rows = db.prepare("SELECT id, username, role, name, contact, region, town, created_at FROM users").all();
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.delete("/api/admin/users/:id", authenticateToken, authorizeRoles('Admin', 'Super Admin'), (req, res) => {
    try {
      const { id } = req.params;
      // Prevent deleting the last admin if needed, but let's keep it simple for now
      db.prepare("DELETE FROM users WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  app.post("/api/admin/config", authenticateToken, authorizeRoles('Admin', 'Super Admin'), (req, res) => {
    let { key, value } = req.body;
    
    // If user pastes the entire JSON file into the private key field, extract the email too
    if (key === 'google_private_key' || key === 'google_service_account_email') {
      try {
        const parsed = JSON.parse(value.toString());
        if (parsed.client_email) {
          db.prepare("INSERT OR REPLACE INTO app_config (key, value) VALUES (?, ?)").run('google_service_account_email', parsed.client_email);
          if (key === 'google_service_account_email') {
            value = parsed.client_email;
          }
        }
        if (parsed.private_key) {
          db.prepare("INSERT OR REPLACE INTO app_config (key, value) VALUES (?, ?)").run('google_private_key', parsed.private_key);
          if (key === 'google_private_key') {
            value = parsed.private_key;
          }
        }
      } catch (e) {
        // Not a JSON string, ignore
      }
    }

    db.prepare("INSERT OR REPLACE INTO app_config (key, value) VALUES (?, ?)").run(key, value.toString());
    logAction(req.user.id.toString(), req.user.name, req.user.role, "UPDATE_CONFIG", { key, value });
    
    const rows = db.prepare("SELECT * FROM app_config").all();
    const config = rows.reduce((acc: any, row: any) => ({ ...acc, [row.key]: row.value }), {});
    res.json({ success: true, config });
  });

  app.get("/api/admin/hierarchy-targets", authenticateToken, authorizeRoles('Admin', 'Super Admin', 'TSM', 'ASM', 'RSM', 'NSM', 'Director', 'SC', 'OB'), (req, res) => {
    const month = req.query.month || new Date().toISOString().slice(0, 7);
    try {
      const targets = db.prepare("SELECT * FROM hierarchy_targets WHERE month = ?").all(month);
      res.json(targets);
    } catch (error) {
      console.error("Error fetching hierarchy targets:", error);
      res.status(500).json({ error: "Failed to fetch hierarchy targets" });
    }
  });

  app.post("/api/admin/hierarchy-targets", authenticateToken, authorizeRoles('Admin', 'Super Admin'), (req, res) => {
    const { role, name, brand_name, target_ctn, month } = req.body;
    
    if (!role || !name || !brand_name || target_ctn === undefined || !month) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      db.prepare(`
        INSERT OR REPLACE INTO hierarchy_targets (role, name, brand_name, target_ctn, month) 
        VALUES (?, ?, ?, ?, ?)
      `).run(role, name, brand_name, target_ctn, month);
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving hierarchy target:", error);
      res.status(500).json({ error: "Failed to save hierarchy target" });
    }
  });

  app.get("/api/admin/obs", authenticateToken, authorizeRoles('Admin', 'Super Admin', 'TSM', 'ASM', 'RSM', 'NSM', 'Director', 'SC', 'OB'), (req: any, res) => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const { role, name, contact } = req.user;
      let obs = db.prepare("SELECT * FROM ob_assignments").all() as any[];
      
      // Filter based on role
      if ((role === 'TSM' || role === 'ASM')) {
        const trimmedName = (name || '').trim().toLowerCase();
        obs = obs.filter((ob: any) => {
          const tsmName = (ob.tsm || '').trim().toLowerCase();
          return tsmName === trimmedName || tsmName.includes(trimmedName) || trimmedName.includes(tsmName);
        });
      } else if (role === 'OB') {
        const trimmedContact = (contact || '').trim().toLowerCase();
        obs = obs.filter((ob: any) => {
          const obContact = (ob.contact || '').trim().toLowerCase();
          return obContact === trimmedContact;
        });
      } else if (role === 'RSM' || role === 'SC') {
        const userRegion = db.prepare("SELECT territory_region FROM national_hierarchy WHERE rsm_name = ? OR sc_name = ? LIMIT 1").get(name, name) as any;
        if (userRegion) {
          obs = obs.filter((ob: any) => ob.region === userRegion.territory_region);
        } else {
          obs = [];
        }
      }

      const targets = db.prepare("SELECT * FROM brand_targets WHERE month = ?").all(currentMonth) as any[];
      
      const obsWithTargets = obs.map((ob: any) => {
        const obTargets: Record<string, number> = {};
        targets
          .filter((t: any) => t.ob_contact === ob.contact)
          .forEach((t: any) => {
            obTargets[t.brand_name] = t.target_ctn;
          });
          
        let routes = [];
        try {
          routes = JSON.parse(ob.routes || '[]');
        } catch (e) {
          routes = [];
        }

        return { 
          id: ob.id,
          name: ob.name,
          contact: ob.contact,
          town: ob.town,
          distributor: ob.distributor,
          tsm: ob.tsm,
          total_shops: ob.total_shops,
          routes: Array.isArray(routes) ? routes : [],
          targets: obTargets
        };
      });
      res.json(obsWithTargets);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch OBs" });
    }
  });

  app.post("/api/admin/obs", authenticateToken, authorizeRoles('Admin', 'Super Admin'), (req, res) => {
    const { id, name, contact, town, distributor, tsm, zone, region, total_shops, routes } = req.body;
    const shops = total_shops !== undefined ? total_shops : req.body.totalShops;
    try {
      if (id) {
        const oldOB = db.prepare("SELECT contact FROM ob_assignments WHERE id = ?").get(id) as any;
        db.prepare("UPDATE ob_assignments SET name = ?, contact = ?, town = ?, distributor = ?, tsm = ?, zone = ?, region = ?, total_shops = ?, routes = ? WHERE id = ?")
          .run(name, contact, town, distributor, tsm, zone, region, shops || 0, JSON.stringify(routes), id);
        
        if (oldOB && oldOB.contact !== contact) {
          db.prepare("UPDATE brand_targets SET ob_contact = ? WHERE ob_contact = ?").run(contact, oldOB.contact);
          db.prepare("UPDATE submitted_orders SET ob_contact = ? WHERE ob_contact = ?").run(contact, oldOB.contact);
        }
      } else {
        db.prepare("INSERT OR IGNORE INTO ob_assignments (name, contact, town, distributor, tsm, zone, region, total_shops, routes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
          .run(name, contact, town, distributor, tsm, zone, region, shops || 0, JSON.stringify(routes));
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/targets", authenticateToken, authorizeRoles('Admin', 'Super Admin', 'TSM', 'ASM'), (req, res) => {
    const { obContact, brandName, targetCtn, month } = req.body;
    const contact = obContact || req.body.ob_contact;
    const brand = brandName || req.body.brand_name;
    const target = targetCtn !== undefined ? targetCtn : req.body.target_ctn;
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    
    try {
      db.prepare("INSERT OR REPLACE INTO brand_targets (ob_contact, brand_name, target_ctn, month) VALUES (?, ?, ?, ?)")
        .run(contact, brand, target, targetMonth);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/targets/bulk", authenticateToken, authorizeRoles('Admin', 'Super Admin', 'TSM', 'ASM'), (req, res) => {
    const { targets, month } = req.body;
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    
    try {
      const insert = db.prepare("INSERT OR REPLACE INTO brand_targets (ob_contact, brand_name, target_ctn, month) VALUES (?, ?, ?, ?)");
      const transaction = db.transaction((data) => {
        for (const t of data) {
          insert.run(t.ob_contact, t.brand_name, t.target_ctn, targetMonth);
        }
      });
      transaction(targets);
      res.json({ success: true, count: targets.length });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/admin/obs/delete/:id", authenticateToken, authorizeRoles('Admin', 'Super Admin'), (req, res) => {
    db.prepare("DELETE FROM ob_assignments WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/admin/distributors", authenticateToken, authorizeRoles('Admin', 'Super Admin', 'TSM', 'ASM', 'RSM', 'NSM', 'Director', 'SC', 'OB'), (req: any, res) => {
    try {
      const { role, name } = req.user;
      let dists;
      if (role === 'Super Admin' || role === 'Admin' || role === 'NSM' || role === 'Director') {
        dists = db.prepare("SELECT * FROM distributors").all();
      } else if (role === 'RSM' || role === 'SC') {
        const userRegion = db.prepare("SELECT territory_region FROM national_hierarchy WHERE rsm_name = ? OR sc_name = ? LIMIT 1").get(name, name) as any;
        if (userRegion) {
          dists = db.prepare("SELECT * FROM distributors WHERE region = ?").all(userRegion.territory_region);
        } else {
          dists = [];
        }
      } else if ((role === 'TSM' || role === 'ASM')) {
        
        const trimmedName = (name || '').trim().toLowerCase();
        const allDists = db.prepare("SELECT * FROM distributors").all();
        dists = allDists.filter((d: any) => {
          const tsmName = (d.tsm || '').trim().toLowerCase();
          return tsmName === trimmedName || tsmName.includes(trimmedName) || trimmedName.includes(tsmName);
        });

      } else {
        dists = [];
      }
      res.json(dists);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch distributors" });
    }
  });

  app.post("/api/admin/distributors", authenticateToken, authorizeRoles('Admin', 'Super Admin'), (req, res) => {
    const { id, town, name, tsm, zone, region } = req.body;
    try {
      if (id) {
        const oldDist = db.prepare("SELECT name FROM distributors WHERE id = ?").get(id) as any;
        db.prepare("UPDATE distributors SET town = ?, name = ?, tsm = ?, zone = ?, region = ? WHERE id = ?").run(town, name, tsm, zone, region, id);
        if (oldDist && oldDist.name !== name) {
          db.prepare("UPDATE ob_assignments SET distributor = ? WHERE distributor = ?").run(name, oldDist.name);
        }
      } else {
        db.prepare("INSERT OR REPLACE INTO distributors (town, name, tsm, zone, region) VALUES (?, ?, ?, ?, ?)").run(town, name, tsm, zone, region);
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/admin/distributors/:id", authenticateToken, authorizeRoles('Admin', 'Super Admin'), (req, res) => {
    db.prepare("DELETE FROM distributors WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/admin/distributors/clear", authenticateToken, authorizeRoles('Admin', 'Super Admin'), (req, res) => {
    try {
      db.prepare("DELETE FROM distributors").run();
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/admin/targets/:ob_contact", authenticateToken, authorizeRoles('Admin', 'Super Admin'), (req, res) => {
    const month = req.query.month || new Date().toISOString().slice(0, 7);
    try {
      const targets = db.prepare("SELECT * FROM brand_targets WHERE ob_contact = ? AND month = ?").all(req.params.ob_contact, month);
      res.json(targets);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch targets" });
    }
  });

  // Google Sheets Integration Routes
  app.get("/api/auth/google/url", (req, res) => {
    const oauth2Client = getOAuth2Client(req);
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: ["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive.file"],
      prompt: "consent"
    });
    res.json({ url });
  });

  app.get("/api/auth/google/callback", async (req, res) => {
    const { code } = req.query;
    const oauth2Client = getOAuth2Client(req);
    try {
      const { tokens } = await oauth2Client.getToken(code as string);
      db.prepare("INSERT OR REPLACE INTO app_config (key, value) VALUES (?, ?)").run("google_tokens", JSON.stringify(tokens));
      
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/admin';
              }
            </script>
            <p>Authentication successful. You can close this window.</p>
          </body>
        </html>
      `);
    } catch (err) {
      res.status(500).send("Authentication failed: " + err.message);
    }
  });

  app.get("/api/admin/test-google", authenticateToken, authorizeRoles('Admin', 'Super Admin', 'TSM', 'ASM', 'RSM', 'NSM', 'Director', 'SC', 'OB'), async (req, res) => {
    let spreadsheetId = '';
    try {
      const client = await getGoogleSheetsClient();
      if (!client) {
        return res.status(400).json({ error: "Missing Google configuration (Service Account or OAuth2 required)" });
      }

      const { sheets, spreadsheetId: id } = client;
      spreadsheetId = id;
      
      const response = await sheets.spreadsheets.get({ spreadsheetId });
      
      // Test write access (to catch Viewer-only permissions)
      try {
        const addSheetRes = await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: { requests: [{ addSheet: { properties: { title: "SalesPulse_Test_Write_Access" } } }] }
        });
        const sheetId = addSheetRes.data.replies[0].addSheet.properties.sheetId;
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: { requests: [{ deleteSheet: { sheetId } }] }
        });
      } catch (writeErr: any) {
        if (writeErr.code === 403) {
          throw new Error("Permission denied for writing. Please ensure the Service Account email is shared as an 'Editor' (not just 'Viewer') on the Google Sheet.");
        }
        // Ignore other errors
      }

      res.json({ success: true, title: response.data.properties?.title });
    } catch (err: any) {
      console.error("Google Test Error:", err);
      let message = err.message;
      if (err.code === 404) {
        message = `Spreadsheet not found. Please check the ID and ensure it doesn't have extra slashes. Current ID: ${spreadsheetId}`;
      } else if (err.code === 403) {
        message = "Permission denied. Please ensure the Service Account email is shared as an 'Editor' on the Google Sheet.";
      } else if (message.includes("invalid_grant: Invalid JWT Signature")) {
        message = "Invalid JWT Signature. The Private Key does not match the Service Account Email. Please copy both from the SAME JSON file.";
      }
      res.status(500).json({ error: message });
    }
  });

  app.get("/api/google/status", async (req, res) => {
    try {
      const client = await getGoogleSheetsClient();
      if (client) {
        res.json({ 
          connected: true, 
          method: client.auth instanceof google.auth.OAuth2 ? 'OAuth2' : 'Service Account',
          spreadsheetId: client.spreadsheetId 
        });
      } else {
        res.json({ connected: false, method: 'None', spreadsheetId: null });
      }
    } catch (err) {
      res.json({ connected: false, method: 'Error', spreadsheetId: null, error: (err as any).message });
    }
  });

  app.post("/api/google/sync", async (req, res) => {
    try {
      const client = await getGoogleSheetsClient();
      if (!client) {
        return res.status(400).json({ error: "Not connected to Google" });
      }
      const { sheets, spreadsheetId } = client;

      const result = await performFullSync(sheets, spreadsheetId);

      res.json({ 
        success: true, 
        message: `Master Sync Complete! Pulled ${result.pulledTeam} team, ${result.pulledUsers} users & ${result.pulledSales} sales records.`,
        last_sync_at: result.lastSync
      });
    } catch (err: any) {
      console.error("OAuth Sync Error:", err);
      let message = err.message;
      if (err.code === 404) {
        message = "Spreadsheet not found. Please check the Spreadsheet ID in settings.";
      } else if (err.code === 403) {
        message = "Permission denied. Please ensure the Service Account email is shared as an 'Editor' on the Google Sheet.";
      }
      res.status(500).json({ error: message });
    }
  });

  app.post("/api/admin/reseed", authenticateToken, authorizeRoles('Admin', 'Super Admin'), (req, res) => {
    const transaction = db.transaction(() => {
      db.prepare("DELETE FROM ob_assignments").run();
      db.prepare("DELETE FROM brand_targets").run();
      
      const tsms = [
        "Muhammad Shoaib", "Muhammad Yousaf", "Noman Paracha", "Waheed Jamal", "Muhammad Zeeshan",
        "Ikramullah", "Qaisar Yousaf", "Ahmad Khan", "Zubair Ali", "Sajid Mehmood",
        "Kamran Shah", "Faisal Abbas", "Imran Nazir", "Yasir Arafat", "Usman Ghani",
        "Bilal Ahmed", "Hamza Ali", "Zeeshan Haider", "Asif Iqbal", "Naveed Akhtar",
        "Rashid Khan", "Tariq Aziz", "Sohail Tanvir", "Arshad Nadeem", "Babar Azam",
        "Shaheen Afridi", "Rizwan Ahmed", "Shadab Khan", "Fakhar Zaman", "Haris Rauf",
        "Nasim Shah", "Iftikhar Ahmed", "Khushdil Shah", "Mohammad Nawaz", "Asif Ali",
        "Haider Ali", "Shoaib Malik", "Sarfaraz Ahmed", "Wahab Riaz", "Hasan Ali",
        "Faheem Ashraf", "Imad Wasim", "Azhar Ali", "Shan Masood", "Abid Ali",
        "Fawad Alam", "Yasir Shah", "Nauman Ali", "Sajid Khan", "Zahid Mahmood"
      ];

      const towns = [
        "Peshawar", "Haripur", "Taxila", "Kohat", "Hangu", "Attock", "Charsadda", "Mardan", "Nowshera", "DI Khan",
        "Bannu", "Muzaffarabad", "Mansehra", "Swabi", "Abbottabad", "Swat", "Buner", "Dir", "Chitral", "Malakand",
        "Karak", "Lakki Marwat", "Tank", "Rawalpindi", "Islamabad", "Gujranwala", "Sialkot", "Lahore", "Faisalabad", "Multan",
        "Bahawalpur", "Sargodha", "Jhelum", "Chakwal", "Mianwali", "Bhakkar", "Layyah", "Muzaffargarh", "DG Khan", "Rajanpur",
        "RY Khan", "Sahiwal", "Okara", "Kasur", "Sheikhupura", "Nankana Sahib", "Chiniot", "TTS", "Jhang", "Hafizabad"
      ];

      const seedOBs = [];
      for (let i = 0; i < tsms.length; i++) {
        const tsm = tsms[i];
        const town = towns[i % towns.length];
        const distributor = `${town} Dist`;
        
        // Add 2 OBs per TSM
        for (let j = 1; j <= 2; j++) {
          const obId = `${town.substring(0, 3).toUpperCase()}-${i+1}-${j}`;
          seedOBs.push({
            name: `OB ${town} ${j}`,
            contact: `03${Math.floor(100000000 + Math.random() * 900000000)}`,
            town: town,
            distributor: distributor,
            tsm: tsm,
            totalShops: 40 + Math.floor(Math.random() * 20),
            routes: JSON.stringify(["Route A", "Route B", "Route C", "Route D", "Route E", "Route F"])
          });
        }
      }

      const insertOB = db.prepare("INSERT INTO ob_assignments (name, contact, town, distributor, tsm, total_shops, routes) VALUES (?, ?, ?, ?, ?, ?, ?)");
      const currentMonth = new Date().toISOString().slice(0, 7);
      const insertTarget = db.prepare("INSERT INTO brand_targets (ob_contact, brand_name, target_ctn, month) VALUES (?, ?, ?, ?)");
      
      seedOBs.forEach(ob => {
        insertOB.run(ob.name, ob.contact, ob.town, ob.distributor, ob.tsm, ob.totalShops, ob.routes);
        // Add default targets
        ["Kite Glow", "Burq Action", "Vero", "DWB", "Match"].forEach(brand => {
          insertTarget.run(ob.contact, brand, (Math.random() * 10).toFixed(1), currentMonth);
        });
      });
    });

    try {
      transaction();
      res.json({ success: true, message: "Team re-seeded with 50 TSMs and 50 Towns" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/reset", authenticateToken, authorizeRoles('Admin', 'Super Admin'), (req, res) => {
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

  app.get("/api/orders", authenticateToken, (req: any, res) => {
    try {
      const { ob, tsm, from, to, ob_contact } = req.query;
      const visibleOBIds = getVisibleOBIds(req.user);

      let query = "SELECT * FROM submitted_orders WHERE 1=1";
      const params: any[] = [];

      if (visibleOBIds.length > 0) {
        query += ` AND ob_contact IN (${visibleOBIds.map(() => '?').join(',')})`;
        params.push(...visibleOBIds);
      } else {
        return res.json([]);
      }

      if (ob) {
        query += " AND order_booker = ?";
        params.push(ob);
      }
      if (ob_contact) {
        query += " AND ob_contact = ?";
        params.push(ob_contact);
      }
      if (tsm) {
        query += " AND tsm = ?";
        params.push(tsm);
      }
      if (from) {
        query += " AND date >= ?";
        params.push(from);
      }
      if (to) {
        query += " AND date <= ?";
        params.push(to);
      }

      query += " ORDER BY date DESC, submitted_at DESC";
      
      const rows = db.prepare(query).all(...params);
      res.json(rows.map((row: any) => {
        let orderData = {};
        try {
          orderData = JSON.parse(row.order_data || '{}');
        } catch (e) {
          orderData = {};
        }
        return {
          ...row,
          order_data: orderData
        };
      }));
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.post("/api/stocks", authenticateToken, (req: any, res) => {
    try {
      const { date, tsm, town, distributor, stocks } = req.body;
      if (!stocks) return res.status(400).json({ error: "Missing stock data" });

      const info = db.prepare(`
        INSERT INTO stock_reports (date, tsm, town, distributor, stock_data, submitted_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        date || getPSTDate(),
        tsm || '',
        town || '',
        distributor || '',
        JSON.stringify(stocks),
        getPSTTimestamp()
      );

      logAction(req.user.id.toString(), req.user.name, req.user.role, "SUBMIT_STOCKS", { tsm, date });

      // Async sync to Google Sheets
      const configRows = db.prepare("SELECT * FROM app_config").all() as any[];
      const config = configRows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {} as any);
      if (config.google_spreadsheet_id) {
        syncAllToSheets().catch(console.error);
      }

      res.json({ success: true, message: "Stock report submitted successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to submit stock report" });
    }
  });

  app.get("/api/stocks", authenticateToken, (req: any, res) => {
    try {
      const { from, to, tsm } = req.query;
      const visibleDists = getVisibleDistributors(req.user);

      let query = "SELECT * FROM stock_reports WHERE 1=1";
      const params: any[] = [];

      if (visibleDists.length > 0) {
        const placeholders = visibleDists.map(() => '?').join(',');
        query += ` AND distributor IN (${placeholders})`;
        params.push(...visibleDists);
      } else if (req.user.role !== 'Admin' && req.user.role !== 'Super Admin' && req.user.role !== 'Director') {
        return res.json([]);
      }

      query += " ORDER BY date DESC, submitted_at DESC";
      const rows = db.prepare(query).all(...params);
      res.json(rows);
    } catch (err) {
      console.error("Fetch Stocks Error:", err);
      res.status(500).json({ error: "Failed to fetch stock reports" });
    }
  });

  app.get("/api/check-duplicate", authenticateToken, (req, res) => {
    const { date, ob_contact } = req.query;
    try {
      const row = db.prepare("SELECT id FROM submitted_orders WHERE date = ? AND ob_contact = ?").get(date, ob_contact);
      res.json({ exists: !!row });
    } catch (e) {
      res.status(500).json({ error: "Failed to check duplicate" });
    }
  });

  app.get("/api/daily-status", authenticateToken, (req: any, res) => {
    const { date } = req.query;
    try {
      const { role } = req.user;
      const isAdmin = role === 'Admin' || role === 'Super Admin' || role === 'Director';
      const visibleOBIds = getVisibleOBIds(req.user);
      let allOBs = db.prepare("SELECT * FROM ob_assignments").all() as any[];
      
      if (!isAdmin) {
        if (visibleOBIds.length > 0) {
          allOBs = allOBs.filter(ob => visibleOBIds.includes(ob.contact));
        } else {
          allOBs = [];
        }
      }

      const submissions = db.prepare("SELECT order_booker, ob_contact, visit_type, submitted_at FROM submitted_orders WHERE date = ?").all(date) as any[];
      
      const status = allOBs.map(ob => {
        const submission = submissions.find(s => s.ob_contact === ob.contact);
        return {
          ...ob,
          submitted: !!submission,
          visit_type: submission ? submission.visit_type : 'A',
          submitted_at: submission ? submission.submitted_at : null
        };
      });
      
      res.json(status);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch daily status" });
    }
  });

  app.post("/api/submit", authenticateToken, async (req: any, res) => {
    try {
      const { data } = req.body;
      if (!data) return res.status(400).json({ error: "Missing data" });

      const { 
        date, tsm, town, distributor, orderBooker, obContact, route, 
        zone, region, nsm, rsm, sc, director,
        totalShops, visitedShops, productiveShops, 
        categoryProductiveShops, items, targets,
        latitude, longitude, accuracy, visitType
      } = data;

      // RBAC check: TSM can only submit for their assigned OBs
      const { role } = req.user;
      if ((role === 'TSM' || role === 'ASM') && tsm !== req.user.name) {
        return res.status(403).json({ error: "You can only submit orders for your assigned OBs." });
      }

      // Duplicate check: Overwrite if the user submits again for the same OB on the same date
      // This satisfies the request to "Remove Auto if Date>OB>Submitting Date area Same"
      const existing = db.prepare("SELECT id FROM submitted_orders WHERE ob_contact = ? AND date = ?").get(obContact, date);
      
      const submittedAt = getPSTTimestamp();
      if (existing) {
        db.prepare(`
          UPDATE submitted_orders SET
            tsm=?, town=?, distributor=?, order_booker=?, route=?, 
            zone=?, region=?, nsm=?, rsm=?, sc=?, director=?,
            total_shops=?, visited_shops=?, productive_shops=?, 
            category_productive_data=?, order_data=?, targets_data=?,
            latitude=?, longitude=?, accuracy=?, visit_type=?, submitted_at=?
          WHERE id = ?
        `).run(
          tsm || '', town || '', distributor || '', orderBooker || '', route || '',
          zone || '', region || '', nsm || '', rsm || '', sc || '', director || '',
          totalShops || 0, visitedShops || 0, productiveShops || 0,
          JSON.stringify(categoryProductiveShops || {}), JSON.stringify(items || {}), JSON.stringify(targets || {}),
          latitude || null, longitude || null, accuracy || null, visitType || 'A', submittedAt,
          existing.id
        );
        
        logAction(req.user.id.toString(), req.user.name, req.user.role, "UPDATE_ORDER", { obContact, date, route });
        syncAllToSheets().catch(console.error);

        return res.json({ success: true, message: "Order updated successfully", id: existing.id });
      }
      
      const info = db.prepare(`
        INSERT INTO submitted_orders (
          date, tsm, town, distributor, order_booker, ob_contact, route, 
          zone, region, nsm, rsm, sc, director,
          total_shops, visited_shops, productive_shops, 
          category_productive_data, order_data, targets_data,
          latitude, longitude, accuracy, visit_type, submitted_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        date || getPSTDate(), 
        tsm || '', 
        town || '', 
        distributor || '', 
        orderBooker || '', 
        obContact || '', 
        route || '', 
        zone || '',
        region || '',
        nsm || '',
        rsm || '',
        sc || '',
        director || '',
        totalShops || 0, 
        visitedShops || 0, 
        productiveShops || 0, 
        JSON.stringify(categoryProductiveShops || {}), 
        JSON.stringify(items || {}), 
        JSON.stringify(targets || {}),
        latitude || null, 
        longitude || null, 
        accuracy || null,
        visitType || 'A',
        submittedAt
      );

      logAction(req.user.id.toString(), req.user.name, req.user.role, "SUBMIT_ORDER", { obContact, date, route });

      // Async sync to Google Sheets
      const newOrder = db.prepare("SELECT * FROM submitted_orders WHERE id = ?").get(info.lastInsertRowid);
      appendToSheet(newOrder).catch(console.error);
      
      res.json({ success: true, message: "Order submitted successfully" });
    } catch (err) {
      console.error("Submission error:", err);
      res.status(500).json({ error: "Failed to submit order: " + err.message });
    }
  });

  app.post("/api/admin/distributors/bulk-upload", authenticateToken, authorizeRoles('Admin', 'Super Admin'), (req, res) => {
    const { distributors, clearExisting } = req.body;
    if (!Array.isArray(distributors)) return res.status(400).json({ error: "Invalid data" });

    const transaction = db.transaction(() => {
      if (clearExisting) {
        db.prepare("DELETE FROM distributors").run();
      }

      for (const item of distributors) {
        const { name, town, tsm, zone, region } = item;
        if (!name) continue;
        db.prepare(`
          INSERT INTO distributors (name, town, tsm, zone, region)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(name) DO UPDATE SET
            town=excluded.town,
            tsm=excluded.tsm,
            zone=excluded.zone,
            region=excluded.region
        `).run(name, town, tsm, zone, region);
      }
    });

    try {
      transaction();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/bulk-upload", authenticateToken, (req, res) => {
    const { team, clearExisting } = req.body;
    if (!Array.isArray(team)) return res.status(400).json({ error: "Invalid data" });

    const currentMonth = new Date().toISOString().slice(0, 7);

    const transaction = db.transaction(() => {
      if (clearExisting) {
        db.prepare("DELETE FROM ob_assignments").run();
        db.prepare("DELETE FROM brand_targets").run();
        db.prepare("DELETE FROM distributors").run();
        db.prepare("DELETE FROM national_hierarchy").run();
      }

      for (const item of team) {
        const { 
          name, contact, town, distributor, tsm, zone, region, 
          nsm, rsm, sc, director,
          total_shops, routes, targets 
        } = item;
        
        // 1. Update OB Assignments
        if (contact && name) {
          db.prepare(`
            INSERT INTO ob_assignments (name, contact, town, distributor, tsm, zone, region, nsm, rsm, sc, director, total_shops, routes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(contact) DO UPDATE SET
              name=excluded.name,
              town=excluded.town,
              distributor=excluded.distributor,
              tsm=excluded.tsm,
              zone=excluded.zone,
              region=excluded.region,
              nsm=excluded.nsm,
              rsm=excluded.rsm,
              sc=excluded.sc,
              director=excluded.director,
              total_shops=excluded.total_shops,
              routes=excluded.routes
          `).run(
            name, contact, town, distributor || '', tsm || '', zone || '', region || '', 
            nsm || '', rsm || '', sc || '', director || '',
            total_shops || 50, JSON.stringify(routes || [])
          );

          // 2. Update Brand Targets
          if (targets && typeof targets === 'object') {
            for (const [brand, target] of Object.entries(targets)) {
              db.prepare(`
                INSERT INTO brand_targets (ob_contact, brand_name, target_ctn, month)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(ob_contact, brand_name, month) DO UPDATE SET
                  target_ctn=excluded.target_ctn
              `).run(contact, brand, target, currentMonth);
            }
          }
        }

        // 3. Update Distributors
        if (distributor) {
          db.prepare(`
            INSERT INTO distributors (name, town, tsm, zone, region)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(name) DO UPDATE SET
              town=excluded.town,
              tsm=excluded.tsm,
              zone=excluded.zone,
              region=excluded.region
          `).run(distributor, town || '', tsm || '', zone || '', region || '');
        }

        // 4. Update National Hierarchy (Optional, but keeps it in sync)
        if (contact) {
          db.prepare(`
            INSERT INTO national_hierarchy (
              director_sales, nsm_name, rsm_name, sc_name, asm_tsm_name, 
              town_name, distributor_name, ob_name, ob_id, territory_region
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(ob_id) DO UPDATE SET
              director_sales=excluded.director_sales,
              nsm_name=excluded.nsm_name,
              rsm_name=excluded.rsm_name,
              sc_name=excluded.sc_name,
              asm_tsm_name=excluded.asm_tsm_name,
              town_name=excluded.town_name,
              distributor_name=excluded.distributor_name,
              ob_name=excluded.ob_name,
              territory_region=excluded.territory_region
          `).run(
            director || '', nsm || '', rsm || '', sc || '', tsm || '',
            town || '', distributor || '', name || '', contact, region || ''
          );
        }
      }
    });

    try {
      transaction();
      res.json({ success: true, message: `Processed ${team.length} records` });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // National Hierarchy APIs
  app.get("/api/admin/hierarchy", authenticateToken, authorizeRoles('Admin', 'Super Admin', 'TSM', 'ASM', 'RSM', 'NSM', 'Director', 'SC', 'OB'), (req: any, res) => {
    try {
      const visibleOBIds = getVisibleOBIds(req.user);
      const rows = db.prepare(`SELECT * FROM national_hierarchy WHERE ob_id IN (${visibleOBIds.map(() => '?').join(',')})`).all(...visibleOBIds);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/national/stats", authenticateToken, (req: any, res) => {
    try {
      const { role } = req.user;
      const isAdmin = role === 'Admin' || role === 'Super Admin' || role === 'Director';
      const visibleOBIds = getVisibleOBIds(req.user);
      
      // 1. Get hierarchy to determine visibility
      const hierarchy = db.prepare("SELECT * FROM national_hierarchy").all() as any[];
      const currentMonth = new Date().toISOString().slice(0, 7);
      const brandTargets = db.prepare("SELECT * FROM brand_targets WHERE month = ?").all(currentMonth) as any[];
      
      const enrichedHierarchy = hierarchy.map(h => {
        const obTargets = brandTargets.filter(bt => bt.ob_contact === h.ob_id);
        const targets: Record<string, number> = {};
        obTargets.forEach(bt => {
          const key = `target_${bt.brand_name.toLowerCase().replace(/\s+/g, '_')}`;
          targets[key] = bt.target_ctn;
        });
        return { ...h, ...targets };
      });
      
      if (!isAdmin && visibleOBIds.length === 0) {
        return res.json({ stats: [], hierarchy: [], timeInfo: calculateTimeGone() });
      }

      // 2. Fetch stats for visible OBs
      let stats;
      if (isAdmin) {
        stats = db.prepare("SELECT * FROM submitted_orders").all();
      } else {
        const placeholders = visibleOBIds.map(() => '?').join(',');
        stats = db.prepare(`
          SELECT * FROM submitted_orders 
          WHERE ob_contact IN (${placeholders})
        `).all(...visibleOBIds);
      }

      const timeInfo = calculateTimeGone();

      res.json({
        stats,
        hierarchy: isAdmin ? enrichedHierarchy : enrichedHierarchy.filter(h => visibleOBIds.includes(h.ob_id)),
        timeInfo
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch national stats" });
    }
  });

  app.post("/api/admin/hierarchy/bulk-upload", authenticateToken, (req, res) => {
    const { hierarchy, clearExisting } = req.body;
    if (!Array.isArray(hierarchy)) return res.status(400).json({ error: "Invalid data" });

    const transaction = db.transaction(() => {
      if (clearExisting) {
        db.prepare("DELETE FROM national_hierarchy").run();
      }

      const insert = db.prepare(`
        INSERT INTO national_hierarchy (
          director_sales, nsm_name, rsm_name, sc_name, asm_tsm_name, town_name, 
          distributor_name, distributor_code, ob_name, ob_id, territory_region, target_ctn
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(ob_id) DO UPDATE SET
          director_sales = COALESCE(NULLIF(excluded.director_sales, ''), director_sales),
          nsm_name = COALESCE(NULLIF(excluded.nsm_name, ''), nsm_name),
          rsm_name = COALESCE(NULLIF(excluded.rsm_name, ''), rsm_name),
          sc_name = COALESCE(NULLIF(excluded.sc_name, ''), sc_name),
          asm_tsm_name = COALESCE(NULLIF(excluded.asm_tsm_name, ''), asm_tsm_name),
          town_name = COALESCE(NULLIF(excluded.town_name, ''), town_name),
          distributor_name = COALESCE(NULLIF(excluded.distributor_name, ''), distributor_name),
          distributor_code = COALESCE(NULLIF(excluded.distributor_code, ''), distributor_code),
          ob_name = COALESCE(NULLIF(excluded.ob_name, ''), ob_name),
          territory_region = COALESCE(NULLIF(excluded.territory_region, ''), territory_region),
          target_ctn = COALESCE(NULLIF(excluded.target_ctn, 0), target_ctn)
      `);

      const insertOB = db.prepare(`
        INSERT INTO ob_assignments (
          name, contact, town, distributor, tsm, region, nsm, rsm, sc, director
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(contact) DO UPDATE SET
          name = COALESCE(NULLIF(excluded.name, ''), name),
          town = COALESCE(NULLIF(excluded.town, ''), town),
          distributor = COALESCE(NULLIF(excluded.distributor, ''), distributor),
          tsm = COALESCE(NULLIF(excluded.tsm, ''), tsm),
          region = COALESCE(NULLIF(excluded.region, ''), region),
          nsm = COALESCE(NULLIF(excluded.nsm, ''), nsm),
          rsm = COALESCE(NULLIF(excluded.rsm, ''), rsm),
          sc = COALESCE(NULLIF(excluded.sc, ''), sc),
          director = COALESCE(NULLIF(excluded.director, ''), director)
      `);

      for (const item of hierarchy) {
        insert.run(
          item.director_sales, item.nsm_name, item.rsm_name, item.sc_name, item.asm_tsm_name, item.town_name,
          item.distributor_name, item.distributor_code, item.ob_name, item.ob_id, item.territory_region,
          item.target_ctn || 0
        );
        
        insertOB.run(
          item.ob_name, item.ob_id, item.town_name, item.distributor_name, item.asm_tsm_name,
          item.territory_region, item.nsm_name, item.rsm_name, item.sc_name, item.director_sales
        );
      }
    });

    try {
      transaction();
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/clear-history", authenticateToken, authorizeRoles('Admin', 'Super Admin'), (req, res) => {
    try {
      db.prepare("DELETE FROM submitted_orders").run();
      res.json({ success: true, message: "All sales history has been cleared." });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  async function pullTeamData(sheets: any, spreadsheetId: string) {
    try {
      console.log(`Pulling Team Data from ${spreadsheetId}...`);
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Team_Data!A1:ZZ1000",
      });

      const rows = response.data.values;
      if (!rows || rows.length < 2) {
        console.log("No data found in Team_Data sheet.");
        return { success: false, message: "No data found in 'Team_Data' sheet" };
      }
      console.log(`Found ${rows.length - 1} team rows.`);

      const headers = rows[0];
      const dataRows = rows.slice(1);

      const team = dataRows.map(row => {
        const getVal = (headerNames: string[]) => {
          for (const name of headerNames) {
            const idx = headers.findIndex(h => h.trim().toLowerCase() === name.toLowerCase());
            if (idx > -1 && row[idx] !== undefined) return row[idx];
          }
          return null;
        };

        return {
          name: getVal(['Name', 'OB Name', 'name', 'ob name', 'ob_name'])?.toString().trim() || '',
          contact: getVal(['ID', 'OB ID', 'id', 'Contact', 'contact', 'ob id', 'ob_id'])?.toString().trim() || '',
          town: getVal(['Town', 'town', 'town name'])?.toString().trim() || '',
          distributor: getVal(['Distributor', 'distributor', 'distributor name'])?.toString().trim() || '',
          distributor_code: getVal(['Distributor Code', 'distributor_code', 'dist_code'])?.toString().trim() || '',
          tsm: getVal(['ASM/TSM', 'TSM', 'ASM', 'tsm', 'asm', 'asm/tsm name', 'asm_tsm_name', 'asm / tsm'])?.toString().trim() || '',
          zone: getVal(['Zone', 'zone'])?.toString().trim() || '',
          region: getVal(['Region', 'region', 'territory', 'territory/region'])?.toString().trim() || '',
          nsm: getVal(['NSM', 'nsm', 'nsm name'])?.toString().trim() || '',
          rsm: getVal(['RSM', 'rsm', 'rsm name'])?.toString().trim() || '',
          sc: getVal(['SC', 'sc', 'sc name'])?.toString().trim() || '',
          director: getVal(['Director', 'director', 'director sales'])?.toString().trim() || '',
          total_shops: parseInt(getVal(['Total Shops', 'total_shops', 'shops'])) || 50,
          target_ctn: parseFloat(getVal(['Target Ctn', 'target_ctn', 'target'])) || 0,
          routes: getVal(['Routes', 'routes']) ? getVal(['Routes', 'routes']).split(",").map((r: string) => r.trim()).filter((r: string) => r) : [],
          targets: {
            "Kite Glow": parseFloat(getVal(['Kite Glow Target', 'kite glow', 'kite_glow_target'])) || 0,
            "Burq Action": parseFloat(getVal(['Burq Action Target', 'burq action', 'burq_action_target'])) || 0,
            "Vero": parseFloat(getVal(['Vero Target', 'vero', 'vero_target'])) || 0,
            "DWB": parseFloat(getVal(['DWB Target', 'dwb', 'dwb_target'])) || 0,
            "Match": parseFloat(getVal(['Match Target', 'match', 'match_target'])) || 0
          }
        };
      }).filter(t => t.name && t.contact);

      const currentMonth = new Date().toISOString().slice(0, 7);
      const transaction = db.transaction(() => {
        for (const item of team) {
          db.prepare(`
            INSERT INTO ob_assignments (name, contact, town, distributor, tsm, zone, region, nsm, rsm, sc, director, total_shops, routes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(contact) DO UPDATE SET
              name = COALESCE(NULLIF(excluded.name, ''), name),
              town = COALESCE(NULLIF(excluded.town, ''), town),
              distributor = COALESCE(NULLIF(excluded.distributor, ''), distributor),
              tsm = COALESCE(NULLIF(excluded.tsm, ''), tsm),
              zone = COALESCE(NULLIF(excluded.zone, ''), zone),
              region = COALESCE(NULLIF(excluded.region, ''), region),
              nsm = COALESCE(NULLIF(excluded.nsm, ''), nsm),
              rsm = COALESCE(NULLIF(excluded.rsm, ''), rsm),
              sc = COALESCE(NULLIF(excluded.sc, ''), sc),
              director = COALESCE(NULLIF(excluded.director, ''), director),
              total_shops = COALESCE(NULLIF(excluded.total_shops, 0), total_shops),
              routes = COALESCE(NULLIF(excluded.routes, '[]'), routes)
          `).run(item.name, item.contact, item.town, item.distributor, item.tsm, item.zone, item.region, item.nsm, item.rsm, item.sc || '', item.director, item.total_shops, JSON.stringify(item.routes));

          for (const [brand, target] of Object.entries(item.targets)) {
            db.prepare(`
              INSERT INTO brand_targets (ob_contact, brand_name, target_ctn, month)
              VALUES (?, ?, ?, ?)
              ON CONFLICT(ob_contact, brand_name, month) DO UPDATE SET 
                target_ctn = COALESCE(NULLIF(excluded.target_ctn, 0), target_ctn)
            `).run(item.contact, brand, target, currentMonth);
          }

          // Also update national_hierarchy
          db.prepare(`
            INSERT INTO national_hierarchy (
              director_sales, nsm_name, rsm_name, sc_name, asm_tsm_name, 
              town_name, distributor_name, distributor_code, ob_name, ob_id, territory_region, target_ctn
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(ob_id) DO UPDATE SET
              director_sales = COALESCE(NULLIF(excluded.director_sales, ''), director_sales),
              nsm_name = COALESCE(NULLIF(excluded.nsm_name, ''), nsm_name),
              rsm_name = COALESCE(NULLIF(excluded.rsm_name, ''), rsm_name),
              sc_name = COALESCE(NULLIF(excluded.sc_name, ''), sc_name),
              asm_tsm_name = COALESCE(NULLIF(excluded.asm_tsm_name, ''), asm_tsm_name),
              town_name = COALESCE(NULLIF(excluded.town_name, ''), town_name),
              distributor_name = COALESCE(NULLIF(excluded.distributor_name, ''), distributor_name),
              distributor_code = COALESCE(NULLIF(excluded.distributor_code, ''), distributor_code),
              ob_name = COALESCE(NULLIF(excluded.ob_name, ''), ob_name),
              territory_region = COALESCE(NULLIF(excluded.territory_region, ''), territory_region),
              target_ctn = COALESCE(NULLIF(excluded.target_ctn, 0), target_ctn)
          `).run(
            item.director || '', item.nsm || '', item.rsm || '', item.sc || '', item.tsm || '',
            item.town || '', item.distributor || '', item.distributor_code || '', item.name || '', item.contact, item.region || '', item.target_ctn || 0
          );
        }
      });
      transaction();
      return { success: true, count: team.length };
    } catch (err: any) {
      console.error("Pull Team Error:", err);
      throw err;
    }
  }

  async function pushTeamData(sheets: any, spreadsheetId: string) {
    const obs = db.prepare("SELECT * FROM ob_assignments").all() as any[];
    const currentMonth = new Date().toISOString().slice(0, 7);
    const headers = ['Director', 'NSM', 'RSM', 'SC', 'ASM/TSM', 'Town', 'Distributor', 'OB Name', 'OB ID', 'Zone', 'Region', 'Total Shops', 'Routes', 'Kite Glow Target', 'Burq Action Target', 'Vero Target', 'DWB Target', 'Match Target'];
    
    const rows = obs.map(ob => {
      const targets = db.prepare("SELECT brand_name, target_ctn FROM brand_targets WHERE ob_contact = ? AND month = ?").all(ob.contact, currentMonth) as any[];
      const targetMap = targets.reduce((acc, t) => ({ ...acc, [t.brand_name]: t.target_ctn }), {} as any);
      const routes = JSON.parse(ob.routes || '[]');
      return [
        ob.director || '', ob.nsm || '', ob.rsm || '', ob.sc || '', ob.tsm, ob.town, ob.distributor, ob.name, ob.contact, ob.zone || '', ob.region || '', ob.total_shops, routes.join(", "),
        targetMap["Kite Glow"] || 0, targetMap["Burq Action"] || 0, targetMap["Vero"] || 0, targetMap["DWB"] || 0, targetMap["Match"] || 0
      ];
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "Team_Data!A1",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [headers, ...rows] },
    });
  }

  async function pullUsersData(sheets: any, spreadsheetId: string) {
    try {
      console.log(`Pulling Users Data from ${spreadsheetId}...`);
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Users!A1:ZZ1000",
      });

      const rows = response.data.values;
      if (!rows || rows.length < 2) {
        console.log("No data found in Users sheet.");
        return { success: false, count: 0 };
      }

      const headers = rows[0];
      const dataRows = rows.slice(1);

      const users = dataRows.map(row => {
        const getVal = (headerNames: string[]) => {
          for (const name of headerNames) {
            const idx = headers.findIndex(h => h.trim().toLowerCase() === name.toLowerCase());
            if (idx > -1 && row[idx] !== undefined) return row[idx];
          }
          return null;
        };

        return {
          username: getVal(['Username', 'username']),
          email: getVal(['Email', 'email']),
          role: getVal(['Role', 'role']),
          name: getVal(['Name', 'name']),
          contact: getVal(['Contact', 'contact']),
          region: getVal(['Region', 'region']),
          town: getVal(['Town', 'town'])
        };
      }).filter(u => u.username);

      const transaction = db.transaction(() => {
        for (const user of users) {
          db.prepare(`
            INSERT INTO users (username, email, role, name, contact, region, town, password)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(username) DO UPDATE SET
              email=excluded.email, role=excluded.role, name=excluded.name, 
              contact=excluded.contact, region=excluded.region, town=excluded.town
          `).run(user.username, user.email || '', user.role, user.name, user.contact, user.region, user.town, 'nopassword');
        }
      });
      transaction();
      return { success: true, count: users.length };
    } catch (e) {
      console.error("pullUsersData Error:", e);
      return { success: false, count: 0 };
    }
  }

  async function pushUsersData(sheets: any, spreadsheetId: string) {
    try {
      const users = db.prepare("SELECT username, email, role, name, contact, region, town FROM users").all() as any[];
      const headers = ['Username', 'Email', 'Role', 'Name', 'Contact', 'Region', 'Town'];
      const rows = users.map(u => [u.username, u.email, u.role, u.name, u.contact, u.region, u.town]);

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "Users!A1",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [headers, ...rows] },
      });
    } catch (e) {
      console.error("pushUsersData Error:", e);
    }
  }

  async function pullSalesHistory(sheets: any, spreadsheetId: string) {
    try {
      console.log(`Pulling Sales History from ${spreadsheetId}...`);
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Sales_Data!A1:ZZ", 
      });

      const rows = response.data.values;
      if (!rows || rows.length < 2) {
        console.log("No sales history found in Sales_Data sheet.");
        return { success: true, count: 0 };
      }
      
      const headers = rows[0].map((h: string) => h.trim().toLowerCase());
      const dataRows = rows.slice(1);
      console.log(`Found ${dataRows.length} sales records.`);

      const skuCount = SKUS.length;
      const catCount = CATEGORIES.length;

      const transaction = db.transaction(() => {
        const insertOrder = db.prepare(`
          INSERT INTO submitted_orders (
            date, director, nsm, rsm, sc, tsm, town, distributor, order_booker, ob_contact, route, 
            zone, region,
            total_shops, visited_shops, productive_shops, 
            category_productive_data, order_data, targets_data,
            submitted_at, latitude, longitude, accuracy, visit_type
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const row of dataRows) {
          const getVal = (headerNames: string[]) => {
            for (const name of headerNames) {
              const idx = headers.indexOf(name.toLowerCase());
              if (idx > -1 && row[idx] !== undefined) return row[idx];
            }
            return null;
          };

          const date = getVal(['Date']);
          const obContact = getVal(['OB Contact', 'contact', 'ob_contact']) || getVal(['OB Name', 'order booker name', 'ob_name']);
          if (!date || !obContact) continue;

          const cleanContact = obContact.toString().trim();
          
          let cleanDate = date.toString().trim();
          // Handle DD/MM/YYYY, M/D/YYYY, or DD-MMM-YYYY from Google Sheets
          const dateParts = cleanDate.split(/[-/ ]/);
          if (dateParts.length >= 3) {
            if (dateParts[0].length === 4) {
              cleanDate = `${dateParts[0]}-${dateParts[1].padStart(2, '0')}-${dateParts[2].padStart(2, '0')}`;
            } else if (dateParts[2].length === 4) {
              let dd = dateParts[0];
              let mm = dateParts[1];
              
              // Handle month names (e.g., Mar, Apr)
              const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
              if (isNaN(parseInt(mm))) {
                const mIdx = monthNames.findIndex(m => mm.toLowerCase().startsWith(m));
                if (mIdx > -1) mm = (mIdx + 1).toString();
              } else if (isNaN(parseInt(dd))) {
                const mIdx = monthNames.findIndex(m => dd.toLowerCase().startsWith(m));
                if (mIdx > -1) {
                  mm = (mIdx + 1).toString();
                  dd = dateParts[1];
                }
              }

              if (parseInt(mm) > 12) {
                // It must be MM/DD/YYYY
                const temp = dd;
                dd = mm;
                mm = temp;
              }
              cleanDate = `${dateParts[2]}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
            }
          }

          const cleanRoute = getVal(['Route'])?.toString().trim() || '';

          const visitTypeLabel = getVal(['Visit Type']);
          let visitType = 'A';
          if (visitTypeLabel === 'Absent') visitType = 'Absent';
          else if (visitTypeLabel === 'Route Riding') visitType = 'RR';
          else if (visitTypeLabel === 'Van Sales') visitType = 'V';

          const orderData: Record<string, any> = {};
          SKUS.forEach(sku => {
            const val = parseFloat(getVal([`${sku.name} (${sku.category})`, sku.name])) || 0;
            if (val > 0) {
              orderData[sku.id] = { ctn: val, dzn: 0, pks: 0 };
            }
          });

          const catProdData: Record<string, number> = {};
          CATEGORIES.forEach(cat => {
            catProdData[cat] = parseInt(getVal([`${cat} Prod`])) || 0;
          });

          const zone = getVal(['Zone']) || '';
          const region = getVal(['Region']) || '';
          const submittedAt = getVal(['Submitted At']) || new Date().toISOString();
          const lat = getVal(['Latitude']) || null;
          const lng = getVal(['Longitude']) || null;
          const acc = getVal(['Accuracy']) || null;

          const existing = db.prepare("SELECT id FROM submitted_orders WHERE ob_contact = ? AND date = ?").get(cleanContact, cleanDate) as any;
          
          if (existing) {
            db.prepare(`
              UPDATE submitted_orders SET
                director = ?, nsm = ?, rsm = ?, sc = ?, tsm = ?, town = ?, distributor = ?, order_booker = ?, route = ?,
                zone = ?, region = ?,
                total_shops = ?, visited_shops = ?, productive_shops = ?,
                category_productive_data = ?, order_data = ?, targets_data = ?,
                submitted_at = ?, latitude = ?, longitude = ?, accuracy = ?, visit_type = ?
              WHERE id = ?
            `).run(
              getVal(['Director', 'director sales']) || '', getVal(['NSM', 'nsm name']) || '', getVal(['RSM', 'rsm name']) || '', getVal(['SC', 'sc name']) || '', getVal(['TSM', 'ASM', 'asm/tsm', 'asm / tsm', 'asm_tsm_name']) || '', 
              getVal(['Town', 'town name']) || '', getVal(['Distributor', 'distributor name']) || '', getVal(['OB Name', 'order booker name']) || '', cleanRoute,
              zone, region,
              parseInt(getVal(['Total Shops'])) || 0, parseInt(getVal(['Visited Shops'])) || 0, parseInt(getVal(['Productive Shops'])) || 0,
              JSON.stringify(catProdData), 
              JSON.stringify(orderData),
              JSON.stringify({}), 
              submittedAt,
              lat, lng, acc,
              visitType,
              existing.id
            );
          } else {
            insertOrder.run(
              cleanDate, getVal(['Director', 'director sales']) || '', getVal(['NSM', 'nsm name']) || '', getVal(['RSM', 'rsm name']) || '', getVal(['SC', 'sc name']) || '', getVal(['TSM', 'ASM', 'asm/tsm', 'asm / tsm', 'asm_tsm_name']) || '', 
              getVal(['Town', 'town name']) || '', getVal(['Distributor', 'distributor name']) || '', getVal(['OB Name', 'order booker name']) || '', cleanContact, cleanRoute,
              zone, region,
              parseInt(getVal(['Total Shops'])) || 0, parseInt(getVal(['Visited Shops'])) || 0, parseInt(getVal(['Productive Shops'])) || 0,
              JSON.stringify(catProdData), 
              JSON.stringify(orderData),
              JSON.stringify({}), 
              submittedAt,
              lat, lng, acc,
              visitType
            );
          }
        }
      });
      transaction();
      return { success: true, count: dataRows.length };
    } catch (err: any) {
      console.error("Pull Sales Error:", err);
      throw err;
    }
  }

  async function pullProductConfig(sheets: any, spreadsheetId: string) {
    try {
      console.log(`Pulling Product Config from ${spreadsheetId}...`);
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Product_Config!A1:ZZ100",
      });

      const rows = response.data.values;
      if (!rows || rows.length < 2) return { success: false };

      const headers = rows[0];
      const dataRows = rows.slice(1);

      dataRows.forEach(row => {
        const getVal = (headerNames: string[]) => {
          for (const name of headerNames) {
            const idx = headers.findIndex(h => h.trim().toLowerCase() === name.toLowerCase());
            if (idx > -1 && row[idx] !== undefined) return row[idx];
          }
          return null;
        };

        const id = getVal(['SKU ID', 'id']);
        const weight = parseFloat(getVal(['Weight (Kg)', 'weight'])) || 0;
        const unitsCtn = parseInt(getVal(['Units Per Carton', 'units_per_carton'])) || 0;
        const unitsDzn = parseInt(getVal(['Units Per Dozen', 'units_per_dozen'])) || 0;

        const sku = SKUS.find(s => s.id === id);
        if (sku) {
          if (weight > 0) sku.weight_gm_per_pack = weight;
          if (unitsCtn > 0) sku.unitsPerCarton = unitsCtn;
          if (unitsDzn >= 0) sku.unitsPerDozen = unitsDzn;
        }
      });
      return { success: true };
    } catch (e) {
      console.error("pullProductConfig Error:", e);
      return { success: false };
    }
  }

  async function pushProductConfig(sheets: any, spreadsheetId: string) {
    const headers = ['SKU ID', 'SKU Name', 'Category', 'Units Per Carton', 'Units Per Dozen', 'Weight (Kg)'];
    const rows = SKUS.map(sku => [
      sku.id, sku.name, sku.category, sku.unitsPerCarton, sku.unitsPerDozen, sku.weight_gm_per_pack
    ]);

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "Product_Config!A1",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [headers, ...rows] },
    });
  }

  async function performFullSync(sheets: any, spreadsheetId: string) {
    // 1. Ensure all sheets exist
    const requiredSheets = ["Sales_Data", "Team_Data", "Targets_vs_Achievement", "OB_Route_Performance", "Stocks_Report", "Current_Stocks", "Last_Entry_Date", "Visit_Type_Analysis", "OB_Performance", "TSM_Performance", "Product_Config", "Users"];
    await ensureSheetsExist(sheets, spreadsheetId);

    // 2. Pull Product Config (Weights etc)
    await pullProductConfig(sheets, spreadsheetId);

    // 3. Pull Team Data (Hierarchy & Targets)
    const pullTeamResult = await pullTeamData(sheets, spreadsheetId);

    // 4. Pull Users Data
    const pullUsersResult = await pullUsersData(sheets, spreadsheetId);

    // 5. Pull Sales History
    const pullSalesResult = await pullSalesHistory(sheets, spreadsheetId);

    // 6. Push Local Sales Data
    const orders = db.prepare("SELECT * FROM submitted_orders ORDER BY date ASC").all() as any[];
    const salesHeaders = getSalesDataHeaders();
    const salesRows = orders.map(order => getSalesDataRow(order));

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "Sales_Data!A1",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [salesHeaders, ...salesRows] },
    });

    // 7. Push Product Config (to ensure format is there)
    await pushProductConfig(sheets, spreadsheetId);

    // 8. Push Team Data back
    await pushTeamData(sheets, spreadsheetId);

    // 9. Push Users Data back
    await pushUsersData(sheets, spreadsheetId);

    // 10. Refresh summary sheets
    await refreshSummarySheets(sheets, spreadsheetId);

    // Update Last Sync
    const now = new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" });
    db.prepare("INSERT OR REPLACE INTO app_config (key, value) VALUES (?, ?)").run("last_sync_at", now);

    return {
      pulledTeam: pullTeamResult.count,
      pulledUsers: pullUsersResult.count,
      pulledSales: pullSalesResult.count,
      pushedSales: orders.length,
      lastSync: now
    };
  }

  app.post("/api/admin/master-sync", authenticateToken, async (req, res) => {
    try {
      const client = await getGoogleSheetsClient();
      if (!client) {
        return res.status(400).json({ error: "Google Sheets configuration missing (Service Account or OAuth2 required)." });
      }
      const { sheets, spreadsheetId } = client;

      try {
        // Verify spreadsheet access first
        await sheets.spreadsheets.get({ spreadsheetId });
      } catch (err: any) {
        if (err.code === 404 || err.message.includes("not found")) {
          return res.status(404).json({ error: `Spreadsheet ID '${spreadsheetId}' not found. Please check the ID and ensure the service account is shared as Editor.` });
        }
        throw err;
      }

      const result = await performFullSync(sheets, spreadsheetId);

      res.json({ 
        success: true, 
        message: `Master Sync Complete! Pulled ${result.pulledTeam} team, ${result.pulledUsers} users & ${result.pulledSales} sales records.`,
        last_sync_at: result.lastSync
      });
    } catch (err: any) {
      console.error("Master Sync Error:", err);
      let message = err.message;
      if (err.code === 404) {
        message = "Spreadsheet not found. Please check the Spreadsheet ID in settings.";
      } else if (err.code === 403) {
        message = "Permission denied. Please ensure the Service Account email is shared as an 'Editor' on the Google Sheet.";
      } else if (message.includes("invalid_grant: Invalid JWT Signature")) {
        message = "Invalid JWT Signature. The Private Key does not match the Service Account Email. Please copy both from the SAME JSON file.";
      }
      res.status(500).json({ error: message });
    }
  });

  app.post("/api/admin/sync-team-to-sheets", authenticateToken, authorizeRoles('Admin', 'Super Admin', 'TSM', 'ASM', 'RSM', 'NSM', 'Director', 'SC', 'OB'), async (req, res) => {
    try {
      const client = await getGoogleSheetsClient();
      if (!client) {
        return res.status(400).json({ error: "Google Sheets configuration missing (Service Account or OAuth2 required)" });
      }
      const { sheets, spreadsheetId } = client;

      const obs = db.prepare("SELECT * FROM ob_assignments").all() as any[];
      const currentMonth = new Date().toISOString().slice(0, 7);
      const headers = ['Name', 'ID', 'Town', 'Distributor', 'ASM/TSM', 'Total Shops', 'Routes', 'Kite Glow Target', 'Burq Action Target', 'Vero Target', 'DWB Target', 'Match Target'];
      
      const rows = obs.map(ob => {
        const targets = db.prepare("SELECT brand_name, target_ctn FROM brand_targets WHERE ob_contact = ? AND month = ?").all(ob.contact, currentMonth) as any[];
        const targetMap = targets.reduce((acc, t) => ({ ...acc, [t.brand_name]: t.target_ctn }), {} as any);
        const routes = JSON.parse(ob.routes || '[]');
        return [
          ob.name, ob.contact, ob.town, ob.distributor, ob.tsm, ob.total_shops, routes.join(", "),
          targetMap["Kite Glow"] || 0, targetMap["Burq Action"] || 0, targetMap["Vero"] || 0, targetMap["DWB"] || 0, targetMap["Match"] || 0
        ];
      });

      // Ensure sheet exists or create it
      try {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [{ addSheet: { properties: { title: "Team_Targets" } } }]
          }
        });
      } catch (e) {} // Ignore if sheet already exists

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "Team_Targets!A1",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [headers, ...rows] },
      });

      res.json({ success: true, message: `Exported ${obs.length} team members to 'Team_Targets' sheet` });
    } catch (err: any) {
      console.error("Team Export Error:", err);
      let errorMessage = err.message;
      if (errorMessage.includes("API has not been used") || errorMessage.includes("disabled")) {
        errorMessage = "Google Sheets API is disabled. Please enable it in your Google Cloud Console.";
      }
      res.status(500).json({ error: errorMessage });
    }
  });

  app.post("/api/admin/sync-team-from-sheets", authenticateToken, authorizeRoles('Admin', 'Super Admin', 'TSM', 'ASM', 'RSM', 'NSM', 'Director', 'SC', 'OB'), async (req, res) => {
    try {
      const client = await getGoogleSheetsClient();
      if (!client) {
        return res.status(400).json({ error: "Google Sheets configuration missing (Service Account or OAuth2 required)" });
      }
      const { sheets, spreadsheetId } = client;

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Team_Targets!A1:L1000",
      });

      const rows = response.data.values;
      if (!rows || rows.length < 2) return res.status(400).json({ error: "No data found in 'Team_Targets' sheet" });

      const headers = rows[0];
      const dataRows = rows.slice(1);

      const team = dataRows.map(row => {
        const getVal = (headerNames: string[]) => {
          for (const name of headerNames) {
            const idx = headers.findIndex(h => h.trim().toLowerCase() === name.toLowerCase());
            if (idx > -1 && row[idx] !== undefined) return row[idx];
          }
          return null;
        };

        return {
          name: getVal(['Name', 'name', 'ob name', 'ob_name']),
          contact: getVal(['ID', 'id', 'Contact', 'contact', 'ob id', 'ob_id']),
          town: getVal(['Town', 'town', 'town name']),
          distributor: getVal(['Distributor', 'distributor', 'distributor name']),
          tsm: getVal(['ASM/TSM', 'TSM', 'ASM', 'tsm', 'asm', 'asm/tsm name', 'asm_tsm_name', 'asm / tsm']),
          total_shops: parseInt(getVal(['Total Shops', 'total_shops', 'shops'])) || 50,
          routes: getVal(['Routes', 'routes']) ? getVal(['Routes', 'routes']).split(",").map((r: string) => r.trim()).filter((r: string) => r) : [],
          targets: {
            "Kite Glow": parseFloat(getVal(['Kite Glow Target', 'kite_glow_target', 'kite glow'])) || 0,
            "Burq Action": parseFloat(getVal(['Burq Action Target', 'burq_action_target', 'burq action'])) || 0,
            "Vero": parseFloat(getVal(['Vero Target', 'vero_target', 'vero'])) || 0,
            "DWB": parseFloat(getVal(['DWB Target', 'dwb_target', 'dwb'])) || 0,
            "Match": parseFloat(getVal(['Match Target', 'match_target', 'match'])) || 0
          }
        };
      }).filter(t => t.name && t.contact);

      // Reuse bulk upload logic
      const currentMonth = new Date().toISOString().slice(0, 7);
      const transaction = db.transaction(() => {
        for (const item of team) {
          db.prepare(`
            INSERT INTO ob_assignments (name, contact, town, distributor, tsm, total_shops, routes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(contact) DO UPDATE SET
              name=excluded.name, town=excluded.town, distributor=excluded.distributor, tsm=excluded.tsm, total_shops=excluded.total_shops, routes=excluded.routes
          `).run(item.name, item.contact, item.town, item.distributor, item.tsm, item.total_shops, JSON.stringify(item.routes));

          for (const [brand, target] of Object.entries(item.targets)) {
            db.prepare(`
              INSERT INTO brand_targets (ob_contact, brand_name, target_ctn, month)
              VALUES (?, ?, ?, ?)
              ON CONFLICT(ob_contact, brand_name, month) DO UPDATE SET target_ctn=excluded.target_ctn
            `).run(item.contact, brand, target, currentMonth);
          }
        }
      });
      transaction();

      res.json({ success: true, message: `Imported ${team.length} team members from Google Sheets` });
    } catch (err: any) {
      console.error("Team Import Error:", err);
      let errorMessage = err.message;
      if (errorMessage.includes("API has not been used") || errorMessage.includes("disabled")) {
        errorMessage = "Google Sheets API is disabled. Please enable it in your Google Cloud Console.";
      }
      res.status(500).json({ error: errorMessage });
    }
  });

  app.post("/api/admin/import-from-sheets", authenticateToken, authorizeRoles('Admin', 'Super Admin', 'TSM', 'ASM', 'RSM', 'NSM', 'Director', 'SC', 'OB'), async (req, res) => {
    try {
      const client = await getGoogleSheetsClient();
      if (!client) {
        return res.status(400).json({ error: "Google Sheets configuration missing (Service Account or OAuth2 required)" });
      }
      const { sheets, spreadsheetId } = client;

      // Import OB Assignments and Targets from a sheet named "Team_Data"
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Team_Data!A1:L1000", // Include headers
      });

      const rows = response.data.values;
      if (!rows || rows.length < 2) {
        return res.status(400).json({ error: "No data found in 'Team_Data' sheet." });
      }

      const headers = rows[0];
      const dataRows = rows.slice(1);

      const team = dataRows.map(row => {
        const getVal = (headerNames: string[]) => {
          for (const name of headerNames) {
            const idx = headers.findIndex(h => h.trim().toLowerCase() === name.toLowerCase());
            if (idx > -1 && row[idx] !== undefined) return row[idx];
          }
          return null;
        };

        return {
          name: getVal(['Name', 'name', 'ob name', 'ob_name']),
          contact: getVal(['ID', 'id', 'Contact', 'contact', 'ob id', 'ob_id']),
          town: getVal(['Town', 'town', 'town name']),
          distributor: getVal(['Distributor', 'distributor', 'distributor name']),
          tsm: getVal(['ASM/TSM', 'TSM', 'ASM', 'tsm', 'asm', 'asm/tsm name', 'asm_tsm_name', 'asm / tsm']),
          total_shops: parseInt(getVal(['Total Shops', 'total_shops', 'shops'])) || 50,
          routes: getVal(['Routes', 'routes']) ? getVal(['Routes', 'routes']).split(",").map((r: string) => r.trim()).filter((r: string) => r) : [],
          targets: {
            "Kite Glow": parseFloat(getVal(['Kite Glow Target', 'kite_glow_target', 'kite glow'])) || 0,
            "Burq Action": parseFloat(getVal(['Burq Action Target', 'burq_action_target', 'burq action'])) || 0,
            "Vero": parseFloat(getVal(['Vero Target', 'vero_target', 'vero'])) || 0,
            "DWB": parseFloat(getVal(['DWB Target', 'dwb_target', 'dwb'])) || 0,
            "Match": parseFloat(getVal(['Match Target', 'match_target', 'match'])) || 0
          }
        };
      }).filter(t => t.name && t.contact);

      const transaction = db.transaction(() => {
        // Use INSERT OR REPLACE instead of DELETE to prevent data loss if sync fails partially
        const currentMonth = new Date().toISOString().slice(0, 7);
        
        for (const item of team) {
          db.prepare(`
            INSERT INTO ob_assignments (name, contact, town, distributor, tsm, total_shops, routes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(contact) DO UPDATE SET
              name=excluded.name, town=excluded.town, distributor=excluded.distributor, tsm=excluded.tsm, total_shops=excluded.total_shops, routes=excluded.routes
          `).run(item.name, item.contact, item.town, item.distributor, item.tsm, item.total_shops, JSON.stringify(item.routes));

          for (const [brand, target] of Object.entries(item.targets)) {
            db.prepare(`
              INSERT INTO brand_targets (ob_contact, brand_name, target_ctn, month)
              VALUES (?, ?, ?, ?)
              ON CONFLICT(ob_contact, brand_name, month) DO UPDATE SET target_ctn=excluded.target_ctn
            `).run(item.contact, brand, target, currentMonth);
          }
        }
      });
      transaction();

      res.json({ success: true, message: `Imported ${team.length} team members from 'Team_Data' sheet` });
    } catch (err: any) {
      console.error("Import Error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/sync-sales-from-sheets", authenticateToken, authorizeRoles('Admin', 'Super Admin', 'TSM', 'ASM', 'RSM', 'NSM', 'Director', 'SC', 'OB'), async (req, res) => {
    try {
      const client = await getGoogleSheetsClient();
      if (!client) {
        return res.status(400).json({ error: "Google Sheets configuration missing (Service Account or OAuth2 required)" });
      }
      const { sheets, spreadsheetId } = client;

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Sales_Data!A2:ZZ", 
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        return res.status(400).json({ error: "No data found in 'Sales_Data' sheet." });
      }

      // Headers are: Date, Director, NSM, RSM, TSM, Town, Distributor, OB Name, OB Contact, Route, Zone, Region, Total Shops, Visited Shops, Productive Shops, Visit Type, ...SKUS, ...CATEGORIES_PROD, Total Tonnage, Submitted At, Lat, Lng, Acc
      const skuCount = SKUS.length;
      const catCount = CATEGORIES.length;
      const baseColCount = 16; // Date to Visit Type

      const transaction = db.transaction(() => {
        // Optional: Clear existing history? User might want to append. 
        // Let's append but avoid exact duplicates (same OB, Date, and Submitted At)
        const insertOrder = db.prepare(`
          INSERT INTO submitted_orders (
            date, director, nsm, rsm, tsm, town, distributor, order_booker, ob_contact, route, 
            zone, region,
            total_shops, visited_shops, productive_shops, 
            category_productive_data, order_data, targets_data,
            submitted_at, latitude, longitude, accuracy, visit_type
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const row of rows) {
          const [date, director, nsm, rsm, tsm, town, distributor, obName, obContact, route, zone, region, tShops, vShops, pShops, visitTypeLabel] = row;
          if (!date || !obContact) continue;

          let visitType = 'A';
          if (visitTypeLabel === 'Absent') visitType = 'Absent';
          else if (visitTypeLabel === 'Route Riding') visitType = 'RR';
          else if (visitTypeLabel === 'Van Sales') visitType = 'V';

          // Reconstruct order_data
          const orderData: Record<string, any> = {};
          for (let i = 0; i < skuCount; i++) {
            const sku = SKUS[i];
            const val = parseFloat(row[baseColCount + i]) || 0;
            if (val > 0) {
              orderData[sku.id] = { ctn: val, dzn: 0, pks: 0 };
            }
          }

          // Reconstruct category_productive_data
          const catProdData: Record<string, number> = {};
          for (let i = 0; i < catCount; i++) {
            const cat = CATEGORIES[i];
            catProdData[cat] = parseInt(row[baseColCount + skuCount + i]) || 0;
          }

          const submittedAt = row[baseColCount + skuCount + catCount + 1] || new Date().toISOString();
          const lat = row[baseColCount + skuCount + catCount + 2] || null;
          const lng = row[baseColCount + skuCount + catCount + 3] || null;
          const acc = row[baseColCount + skuCount + catCount + 4] || null;

          // Check for duplicate - use ob_contact, date, and route for better matching
          const existing = db.prepare("SELECT id FROM submitted_orders WHERE ob_contact = ? AND date = ? AND route = ?").get(obContact, date, route);
          if (existing) continue;

          insertOrder.run(
            date, director || '', nsm || '', rsm || '', tsm, town, distributor, obName, obContact, route,
            zone || '', region || '',
            parseInt(tShops) || 0, parseInt(vShops) || 0, parseInt(pShops) || 0,
            JSON.stringify(catProdData), 
            JSON.stringify(orderData),
            JSON.stringify({}), 
            submittedAt,
            lat, lng, acc,
            visitType
          );
        }
      });

      transaction();
      res.json({ success: true, message: `Successfully imported ${rows.length} sales records from Google Sheets.` });
    } catch (err: any) {
      console.error("Import Sales Error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/sync-sheets", authenticateToken, authorizeRoles('Admin', 'Super Admin', 'TSM', 'ASM', 'RSM', 'NSM', 'Director', 'SC', 'OB'), async (req, res) => {
    // Redirect to master sync for simplicity
    return res.redirect(307, "/api/admin/master-sync");
  });

  // API 404 Guard
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `API route ${req.method} ${req.url} not found` });
  });

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Global Error:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
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

  app.get("/api/stocks/export", (req, res) => {
    try {
      const rows = db.prepare("SELECT * FROM stock_reports ORDER BY date DESC, submitted_at DESC").all() as any[];
      const obAssignments = db.prepare("SELECT * FROM ob_assignments").all() as any[];
      
      let csv = "Date,Month,Director,NSM,RSM,Region,TSM,Town,Distributor," + SKUS.map(s => s.name).join(",") + ",Submitted At\n";
      
      rows.forEach(report => {
        const stockData = JSON.parse(report.stock_data || '{}');
        const obInfo = obAssignments.find(ob => ob.distributor === report.distributor) || {};
        const month = report.date ? report.date.slice(0, 7) : '';

        const row = [
          report.date,
          month,
          obInfo.director || '',
          obInfo.nsm || '',
          obInfo.rsm || '',
          obInfo.region || '',
          report.tsm,
          report.town,
          report.distributor,
          ...SKUS.map(sku => {
            const item = stockData[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
            const total = (Number(item.ctn || 0) * sku.unitsPerCarton + Number(item.dzn || 0) * sku.unitsPerDozen + Number(item.pks || 0)) / (sku.unitsPerCarton || 1);
            return total.toFixed(2);
          }),
          report.submitted_at
        ];
        csv += row.join(",") + "\n";
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=stock_reports.csv');
      res.status(200).send(csv);
    } catch (err) {
      res.status(500).json({ error: "Failed to export stock reports" });
    }
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

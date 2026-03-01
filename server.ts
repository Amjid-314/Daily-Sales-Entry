import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { google } from "googleapis";

const db = new Database("orders.db");

const CATEGORIES = [
  "Kite Glow",
  "Burq Action",
  "Vero",
  "DWB",
  "Match"
];
const SKUS = [
  // Kite Glow
  { id: "kg-10", name: "Kite Rs 10", category: "Kite Glow", unitsPerCarton: 144, unitsPerDozen: 12, pricePerCarton: 1440 },
  { id: "kg-20", name: "Kite Rs 20", category: "Kite Glow", unitsPerCarton: 96, unitsPerDozen: 12, pricePerCarton: 1920 },
  { id: "kg-50", name: "Kite Rs 50", category: "Kite Glow", unitsPerCarton: 48, unitsPerDozen: 12, pricePerCarton: 2400 },
  { id: "kg-99", name: "Kite Rs 99", category: "Kite Glow", unitsPerCarton: 24, unitsPerDozen: 12, pricePerCarton: 2376 },
  { id: "kg-05kg", name: "Kite 0.5kg", category: "Kite Glow", unitsPerCarton: 24, unitsPerDozen: 0, pricePerCarton: 3600 },
  { id: "kg-1kg", name: "Kite 1kg", category: "Kite Glow", unitsPerCarton: 12, unitsPerDozen: 0, pricePerCarton: 3600 },
  { id: "kg-2kg", name: "Kite 2kg", category: "Kite Glow", unitsPerCarton: 6, unitsPerDozen: 0, pricePerCarton: 3600 },
  // Burq Action
  { id: "ba-10", name: "Burq Rs 10", category: "Burq Action", unitsPerCarton: 204, unitsPerDozen: 12, pricePerCarton: 2040 },
  { id: "ba-20", name: "Burq Rs 20", category: "Burq Action", unitsPerCarton: 96, unitsPerDozen: 12, pricePerCarton: 1920 },
  { id: "ba-50", name: "Burq Rs 50", category: "Burq Action", unitsPerCarton: 48, unitsPerDozen: 12, pricePerCarton: 2400 },
  { id: "ba-99", name: "Burq Rs 99", category: "Burq Action", unitsPerCarton: 24, unitsPerDozen: 12, pricePerCarton: 2376 },
  { id: "ba-1kg", name: "Burq 1kg", category: "Burq Action", unitsPerCarton: 12, unitsPerDozen: 0, pricePerCarton: 3600 },
  { id: "ba-23kg", name: "Burq 2.3kg", category: "Burq Action", unitsPerCarton: 6, unitsPerDozen: 0, pricePerCarton: 3600 },
  // Vero
  { id: "v-5kg", name: "Vero 5kg", category: "Vero", unitsPerCarton: 4, unitsPerDozen: 0, pricePerCarton: 4000 },
  { id: "v-20kg", name: "Vero 20kg", category: "Vero", unitsPerCarton: 1, unitsPerDozen: 0, pricePerCarton: 16000 },
  // DWB
  { id: "dwb-reg", name: "Regular", category: "DWB", unitsPerCarton: 48, unitsPerDozen: 12, pricePerCarton: 4800 },
  { id: "dwb-large", name: "Large", category: "DWB", unitsPerCarton: 36, unitsPerDozen: 12, pricePerCarton: 5400 },
  { id: "dwb-long", name: "Long Bar", category: "DWB", unitsPerCarton: 36, unitsPerDozen: 12, pricePerCarton: 5400 },
  { id: "dwb-super", name: "Super Bar", category: "DWB", unitsPerCarton: 36, unitsPerDozen: 12, pricePerCarton: 5400 },
  { id: "dwb-new", name: "New DWB", category: "DWB", unitsPerCarton: 36, unitsPerDozen: 12, pricePerCarton: 5400 },
  // Match
  { id: "m-large", name: "Large", category: "Match", unitsPerCarton: 10, unitsPerDozen: 12, pricePerCarton: 1000 },
  { id: "m-classic", name: "Classic", category: "Match", unitsPerCarton: 10, unitsPerDozen: 12, pricePerCarton: 1000 },
  { id: "m-regular", name: "Regular", category: "Match", unitsPerCarton: 20, unitsPerDozen: 12, pricePerCarton: 2000 },
  { id: "m-slim", name: "Slim", category: "Match", unitsPerCarton: 20, unitsPerDozen: 12, pricePerCarton: 2000 },

];

function calculateAchievement(orderData: any) {
  const totals: Record<string, number> = {};
  CATEGORIES.forEach(cat => {
    totals[cat] = SKUS
      .filter(sku => sku.category === cat)
      .reduce((sum, sku) => {
        const item = orderData[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
        const packs = (item.ctn * sku.unitsPerCarton) + (item.dzn * sku.unitsPerDozen) + item.pks;
        return sum + (sku.unitsPerCarton > 0 ? packs / sku.unitsPerCarton : 0);
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
    total_shops INTEGER,
    visited_shops INTEGER,
    productive_shops INTEGER,
    category_productive_data TEXT,
    order_data TEXT,
    targets_data TEXT,
    latitude REAL,
    longitude REAL,
    accuracy REAL,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS distributors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    town TEXT,
    name TEXT UNIQUE,
    tsm TEXT
  );
`);

// Add columns if they don't exist
try { db.exec("ALTER TABLE submitted_orders ADD COLUMN latitude REAL"); } catch (e) {}
try { db.exec("ALTER TABLE submitted_orders ADD COLUMN longitude REAL"); } catch (e) {}
try { db.exec("ALTER TABLE submitted_orders ADD COLUMN accuracy REAL"); } catch (e) {}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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

  // Migration: Ensure all columns exist in ob_assignments
  const obCols = ["contact", "tsm", "total_shops", "town", "distributor", "routes"];
  obCols.forEach(col => {
    try { db.exec(`ALTER TABLE ob_assignments ADD COLUMN ${col} ${col === 'total_shops' ? 'INTEGER DEFAULT 50' : 'TEXT'}`); } catch (e) {}
  });

  // Migration: Ensure all columns exist in submitted_orders
  const subCols = [
    "date", "tsm", "town", "distributor", "order_booker", "ob_contact", "route", 
    "total_shops", "visited_shops", "productive_shops", 
    "category_productive_data", "order_data", "targets_data",
    "latitude", "longitude", "accuracy"
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
      UNIQUE(ob_contact, brand_name)
    );

    CREATE TABLE IF NOT EXISTS app_config (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // Initial Config
  db.prepare("INSERT OR IGNORE INTO app_config (key, value) VALUES (?, ?)").run("total_working_days", "25");
  db.prepare("INSERT OR REPLACE INTO app_config (key, value) VALUES (?, ?)").run("google_spreadsheet_id", "1xdVdlzC1lfJfrH2v_LsOJMgCyRaEJbImMNDd_HvysIA");
  db.prepare("INSERT OR REPLACE INTO app_config (key, value) VALUES (?, ?)").run("google_service_account_email", "sheets-sync@salesappintegration.iam.gserviceaccount.com");
  db.prepare("INSERT OR REPLACE INTO app_config (key, value) VALUES (?, ?)").run("google_private_key", "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDK7Cr/uJugpYCu\n502wYaYlZM896/0XBbRF9xj1NeYpNKjgPMmXwwclLoH4B0GleDUo+Ymr2Dw7x8Oh\naw0imKghRRU2JlpvUwpDytFqvQ5cj9jS/vQgV8dAGXxHvjttI37y+GMmemB8np1t\nZTvh7sqYe/AHAz/lAaxF8vdpwrDq3QmHW7eB5Ztkz8J27tMiJ5Dm5CIKR4MawH0f\nTxoM1Vd+3nOWme63yOPy2woB6MEpdgbWS5hpTmFGeZv1PhdffIcz3QPTzHLyyU54\nHC5i7AiXc8EKQ7cZ0J8FUXB9yp5It0bp3fsiy3+18Y4U76pR8UDlb/o2TQhIVfM0\nvFSt6isfAgMBAAECggEARwcWX+8izj7QBaih2WC8sq8QGVkOfC37dVfx7PbCSt8L\nU34DhDL4P8wBIyuLD1u9o8uApF1qa/RW5hvd+6Oaihavv4X6NqhG2gbWeXmWWtDg\n8K3cDqwa6rVg+o28KE355BsMPY4tUsGEUiPSq5kVYf1TvWimR0boIY3TizniCjrX\nsSu5MPOZkfGaRFyJsyULq8f3LbOQl7XH1GMQE225wbiwHMIGGsGTDOOv2e80hslm\nN6MHbDrlfXwxIbz52stxXy9/iwNvRWutgmlCXZg45D2eXXxr1+flEZ5k2QCH6q0R\n4Ys6T7+Fp4pOZUnsh1ojnS95khYJsmxA9ymDznzvnQKBgQDr8TpFp2T1SeZriduj\nbYhN78m3ZQcoOqW/KHXx5ZPpy186LxhQ2340ddlq7ctqPPYElWsacpoUksugA/oi\ngM80Fbw52aiTEJGqXcioBOfpSqzCOjU8jLqimcO+/huTcVaQbMJ+wYWZhtipUxbq\n5LYBSdCCPwPNGpEEn0c6gOei5QKBgQDcLFY3IPZSsNdhj88mZt5+uOcPR0iCbw03\nR8wIiaoxzqHzJJRcbXNhv+aq9l+F6vSKDnckmUmnehfT73TUbOCaIEFmoe2F7/d+\nzkqnw7m26s+deGSpfyfi+FcZnA8SwFU9bRBfUIeWNlRH93iyjm4QoIyJ69+8CSYi\njk9PWijhswKBgCrc/hsdWAf/zu6GcvJzual/AIRixDQYw3fA3/x8Gq0El144pBA8\nb+cT6dW1MZkxTfhzNKvvWfKW4ItHba/K+tmZgUJ5OljNT8lFlGiBy6fkOxJmBLnl\nTxqvGJKgE15r3rAKMiNZAO5tQvsv7x/pQO9m+4xN6mDejK3sScJlHK/JAoGBAJ2w\ne4c8am9LDNdpQjoEzzH/iC2fJkWU9+gx2eX7gxPtJHyaJFAWa98ErFah4kRtxPrj\n5V0nFGOIxGwcQpap7Cs3EuBI9W9KMP53DW0ed3KUtmHYCnCDC7Q5nVhQN1N8wRAf\nfuxlJtbkznREwANSk24BLubRMwrfmpqBRjhVIJaVAoGAcS8uL5nP/CIQklr1ccYm\nEth+MgJkLmp8QmX89IvntjkuWfmn8YJ0rqS4jxnqJ8FUyAYpmmu3DdsFCul6uoV9\naF6nJNTwcS8WZHdgcLDOt/bNZ7A15SJrjHm8Bnrk9YgxZBCrkEA02QfzcdiUumVA\nLeowuk+ZPShGOhiSycAe6JQ=\n-----END PRIVATE KEY-----");

  // Google Sheets Helper
  async function appendToSheet(order: any) {
    try {
      const configRows = db.prepare("SELECT * FROM app_config").all() as any[];
      const config = configRows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {} as any);
      
      let spreadsheetId = config.google_spreadsheet_id;
      let clientEmail = config.google_service_account_email;
      let privateKeyRaw = config.google_private_key;

      try {
        const parsed = JSON.parse(privateKeyRaw);
        if (parsed.private_key) privateKeyRaw = parsed.private_key;
        if (parsed.client_email && !clientEmail) clientEmail = parsed.client_email;
      } catch (e) {}

      const privateKey = privateKeyRaw?.replace(/\\n/g, '\n');

      if (!spreadsheetId || !clientEmail || !privateKey) {
        console.log("Skipping sync: Google Sheets config incomplete");
        return;
      }

      const auth = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });
      const sheets = google.sheets({ version: 'v4', auth });

      // Ensure Sheets exist
      const sheetTitles = ["Sales_Data", "Targets_vs_Achievement", "OB_Route_Performance", "Stocks_Report"];
      for (const title of sheetTitles) {
        try {
          await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
              requests: [{ addSheet: { properties: { title } } }]
            }
          });
        } catch (e) {}
      }

      const orderData = typeof order.order_data === 'string' ? JSON.parse(order.order_data) : (order.order_data || {});
      const targetsData = typeof order.targets_data === 'string' ? JSON.parse(order.targets_data) : (order.targets_data || {});
      const achievement = calculateAchievement(orderData);
      
      // 1. Append to Sales_Data
      const salesRow = [
        order.date, order.tsm, order.town, order.distributor, order.order_booker, order.ob_contact, order.route,
        order.total_shops, order.visited_shops, order.productive_shops,
        ...SKUS.map(sku => {
          const item = orderData[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
          const totalPacks = (Number(item.ctn || 0) * sku.unitsPerCarton) + (Number(item.dzn || 0) * sku.unitsPerDozen) + Number(item.pks || 0);
          const total = sku.unitsPerCarton > 0 ? totalPacks / sku.unitsPerCarton : 0;
          return total;
        }),
        order.submitted_at,
        order.latitude || '',
        order.longitude || '',
        order.accuracy || ''
      ];

      const salesHeaders = [
        'Date', 'TSM', 'Town', 'Distributor', 'OB Name', 'OB Contact', 'Route', 
        'Total Shops', 'Visited Shops', 'Productive Shops',
        ...SKUS.map(sku => `${sku.name} (${sku.category})`),
        'Submitted At', 'Latitude', 'Longitude', 'Accuracy'
      ];

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

      // 2. Refresh Targets_vs_Achievement & OB_Route_Performance
      // For simplicity and accuracy, we trigger a full refresh of these summary sheets
      await refreshSummarySheets(sheets, spreadsheetId);

      console.log(`Successfully synced order ${order.id} to Google Sheets`);
    } catch (err) {
      console.error("Google Sheets Sync Error:", err);
    }
  }

  async function refreshSummarySheets(sheets: any, spreadsheetId: string) {
    const orders = db.prepare("SELECT * FROM submitted_orders").all() as any[];
    const obs = db.prepare("SELECT * FROM ob_assignments").all() as any[];

    // --- SHEET 2: Targets_vs_Achievement (Town, OB, Brand Wise) ---
    const targetHeaders = ['Town', 'OB Name', 'OB Contact', 'TSM', 'Distributor', ...CATEGORIES.flatMap(cat => [`${cat} Target`, `${cat} Ach`, `${cat} %`]), 'Total Target', 'Total Ach', 'Total %'];
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
        ob.town || '',
        ob.name || '',
        ob.contact || '',
        ob.tsm || '',
        ob.distributor || ''
      ];

      let totalT = 0;
      let totalA = 0;

      for (const cat of CATEGORIES) {
        const obTargets = db.prepare("SELECT target_ctn FROM brand_targets WHERE ob_contact = ? AND brand_name = ?").get(ob.contact, cat) as any;
        const target = obTargets ? obTargets.target_ctn : 0;
        const ach = achievementMap[ob.contact]?.[cat] || 0;

        totalT += target;
        totalA += ach;

        row.push(target.toFixed(2));
        row.push(ach.toFixed(2));
        row.push(target > 0 ? ((ach / target) * 100).toFixed(1) + '%' : '0%');
      }

      row.push(totalT.toFixed(2));
      row.push(totalA.toFixed(2));
      row.push(totalT > 0 ? ((totalA / totalT) * 100).toFixed(1) + '%' : '0%');

      targetRows.push(row);
    }

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "Targets_vs_Achievement!A1",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [targetHeaders, ...targetRows] },
    });

    // --- SHEET 4: Stocks_Report ---
    const stockHeaders = ['Date', 'TSM', 'Town', 'Distributor', ...SKUS.map(s => s.name), 'Submitted At'];
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

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "Stocks_Report!A1",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [stockHeaders, ...stockRows] },
    });

    // --- SHEET 3: OB_Route_Performance ---
    const performanceHeaders = [
      'OB Name', 'Contact', 'Route', 'Total Shops', 'Visited', 'Productive', 'Visit %', 'Prod %',
      ...CATEGORIES.map(cat => `${cat} Ach`),
      'Total Ach', 'Total Target', 'Overall %'
    ];

    const performanceRows = orders.map(order => {
      const orderData = typeof order.order_data === 'string' ? JSON.parse(order.order_data) : (order.order_data || {});
      const targetsData = typeof order.targets_data === 'string' ? JSON.parse(order.targets_data) : (order.targets_data || {});
      const ach = calculateAchievement(orderData);
      const totalAch = Object.values(ach).reduce((a, b) => a + b, 0);
      const totalTarget = Object.values(targetsData).reduce((a: any, b: any) => a + b, 0);

      return [
        order.order_booker, order.ob_contact, order.route,
        order.total_shops, order.visited_shops, order.productive_shops,
        order.total_shops > 0 ? ((order.visited_shops / order.total_shops) * 100).toFixed(1) + '%' : '0%',
        order.visited_shops > 0 ? ((order.productive_shops / order.visited_shops) * 100).toFixed(1) + '%' : '0%',
        ...CATEGORIES.map(cat => (ach[cat] as number).toFixed(2)),
        (totalAch as number).toFixed(2), (totalTarget as number).toFixed(2),
        (totalTarget as number) > 0 ? (((totalAch as number) / (totalTarget as number)) * 100).toFixed(1) + '%' : '0%'
      ];
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "OB_Route_Performance!A1",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [performanceHeaders, ...performanceRows] },
    });
  }

  async function syncAllToSheets() {
    try {
      const configRows = db.prepare("SELECT * FROM app_config").all() as any[];
      const config = configRows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {} as any);
      
      let spreadsheetId = config.google_spreadsheet_id;
      let clientEmail = config.google_service_account_email;
      let privateKeyRaw = config.google_private_key;

      try {
        const parsed = JSON.parse(privateKeyRaw);
        if (parsed.private_key) privateKeyRaw = parsed.private_key;
        if (parsed.client_email && !clientEmail) clientEmail = parsed.client_email;
      } catch (e) {}

      const privateKey = privateKeyRaw?.replace(/\\n/g, '\n');

      if (!spreadsheetId || !clientEmail || !privateKey) return;

      const auth = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });
      const sheets = google.sheets({ version: 'v4', auth });

      // Ensure Sheets exist
      const sheetTitles = ["Sales_Data", "Targets_vs_Achievement", "OB_Route_Performance", "Stocks_Report"];
      for (const title of sheetTitles) {
        try {
          await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
              requests: [{ addSheet: { properties: { title } } }]
            }
          });
        } catch (e) {}
      }

      const orders = db.prepare("SELECT * FROM submitted_orders ORDER BY date ASC").all() as any[];
      
      // --- SHEET 1: Sales_Data (SKU Wise) ---
      const salesHeaders = [
        'Date', 'TSM', 'Town', 'Distributor', 'OB Name', 'OB Contact', 'Route', 
        'Total Shops', 'Visited Shops', 'Productive Shops',
        ...SKUS.map(sku => `${sku.name} (${sku.category})`),
        'Submitted At', 'Latitude', 'Longitude', 'Accuracy'
      ];

      const salesRows = orders.map((order: any) => {
        const orderData = typeof order.order_data === 'string' ? JSON.parse(order.order_data) : (order.order_data || {});
        return [
          order.date, order.tsm, order.town, order.distributor, order.order_booker, order.ob_contact, order.route,
          order.total_shops, order.visited_shops, order.productive_shops,
          ...SKUS.map(sku => {
            const item = orderData[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
            const totalPacks = (Number(item.ctn || 0) * sku.unitsPerCarton) + (Number(item.dzn || 0) * sku.unitsPerDozen) + Number(item.pks || 0);
            const total = sku.unitsPerCarton > 0 ? totalPacks / sku.unitsPerCarton : 0;
            return total;
          }),
          order.submitted_at,
          order.latitude || '',
          order.longitude || '',
          order.accuracy || ''
        ];
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
      { name: "Muhammad Bilal", contact: "P-01", town: "Peshawar", distributor: "Peshawar Dist", tsm: "Muhammad Shoaib", totalShops: 50, routes: JSON.stringify(["Route 1", "Route 2", "Route 3", "Route 4", "Route 5", "Route 6"]) },
      { name: "Khizar Hayat", contact: "P-02", town: "Peshawar", distributor: "Peshawar Dist", tsm: "Muhammad Shoaib", totalShops: 50, routes: JSON.stringify(["Route 1", "Route 2", "Route 3", "Route 4", "Route 5", "Route 6"]) },
      { name: "Adil Khan", contact: "P-03", town: "Peshawar", distributor: "Peshawar Dist", tsm: "Muhammad Shoaib", totalShops: 50, routes: JSON.stringify(["Route 1", "Route 2", "Route 3", "Route 4", "Route 5", "Route 6"]) },
      { name: "Baidar Khan", contact: "P-04", town: "Peshawar", distributor: "Peshawar Dist", tsm: "Muhammad Shoaib", totalShops: 50, routes: JSON.stringify(["Route 1", "Route 2", "Route 3", "Route 4", "Route 5", "Route 6"]) },
      { name: "Muhammad Usman", contact: "P-05", town: "Peshawar", distributor: "Peshawar Dist", tsm: "Muhammad Shoaib", totalShops: 50, routes: JSON.stringify(["Route 1", "Route 2", "Route 3", "Route 4", "Route 5", "Route 6"]) },
      { name: "Ghulam Rasool", contact: "P-06", town: "Peshawar", distributor: "Peshawar Dist", tsm: "Muhammad Shoaib", totalShops: 50, routes: JSON.stringify(["Route 1", "Route 2", "Route 3", "Route 4", "Route 5", "Route 6"]) },
      { name: "Khalid Awan", contact: "P-07", town: "Peshawar", distributor: "Peshawar Dist", tsm: "Muhammad Shoaib", totalShops: 50, routes: JSON.stringify(["Route 1", "Route 2", "Route 3", "Route 4", "Route 5", "Route 6"]) },
      { name: "Shahid", contact: "H-01", town: "Haripur", distributor: "Haripur Dist", tsm: "Muhammad Yousaf", totalShops: 50, routes: JSON.stringify(["Route 1", "Route 2", "Route 3", "Route 4", "Route 5", "Route 6"]) },
      { name: "Shahrukh", contact: "H-02", town: "Haripur", distributor: "Haripur Dist", tsm: "Muhammad Yousaf", totalShops: 50, routes: JSON.stringify(["Route 1", "Route 2", "Route 3", "Route 4", "Route 5", "Route 6"]) },
      { name: "Bilal", contact: "T-01", town: "Taxila", distributor: "Taxila Dist", tsm: "Muhammad Yousaf", totalShops: 50, routes: JSON.stringify(["Route 1", "Route 2", "Route 3", "Route 4", "Route 5", "Route 6"]) },
      { name: "Muneeb", contact: "T-02", town: "Taxila", distributor: "Taxila Dist", tsm: "Muhammad Yousaf", totalShops: 50, routes: JSON.stringify(["Route 1", "Route 2", "Route 3", "Route 4", "Route 5", "Route 6"]) },
      { name: "Kashif", contact: "K-01", town: "Kohat", distributor: "Kohat Dist", tsm: "Noman Paracha", totalShops: 50, routes: JSON.stringify(["Route 1", "Route 2", "Route 3", "Route 4", "Route 5", "Route 6"]) },
      { name: "Bilal", contact: "HG-01", town: "Hangu", distributor: "Hangu Dist", tsm: "Noman Paracha", totalShops: 50, routes: JSON.stringify(["Route 1", "Route 2", "Route 3", "Route 4", "Route 5", "Route 6"]) },
      { name: "Usama", contact: "A-01", town: "Attock", distributor: "Attock Dist", tsm: "Noman Paracha", totalShops: 50, routes: JSON.stringify(["Route 1", "Route 2", "Route 3", "Route 4", "Route 5", "Route 6"]) },
      { name: "Zakaullah", contact: "DI-01", town: "DI Khan", distributor: "DI Khan Dist", tsm: "Ikramullah", totalShops: 50, routes: JSON.stringify(["Route 1", "Route 2", "Route 3", "Route 4", "Route 5", "Route 6"]) },
      { name: "Muntazir", contact: "DI-02", town: "DI Khan", distributor: "DI Khan Dist", tsm: "Ikramullah", totalShops: 50, routes: JSON.stringify(["Route 1", "Route 2", "Route 3", "Route 4", "Route 5", "Route 6"]) },
      { name: "Muhammad Amir", contact: "M-01", town: "Mardan", distributor: "Mardan Dist", tsm: "Muhammad Zeeshan", totalShops: 50, routes: JSON.stringify(["Route 1", "Route 2", "Route 3", "Route 4", "Route 5", "Route 6"]) },
      { name: "Farhan Zeb", contact: "NOW-01", town: "Nowshera", distributor: "Nowshera Dist", tsm: "Muhammad Zeeshan", totalShops: 50, routes: JSON.stringify(["Route 1", "Route 2", "Route 3", "Route 4", "Route 5", "Route 6"]) },
      { name: "Babar", contact: "C-01", town: "Charsadda", distributor: "Charsadda Dist", tsm: "Waheed Jamal", totalShops: 50, routes: JSON.stringify(["Route 1", "Route 2", "Route 3", "Route 4", "Route 5", "Route 6"]) },
      { name: "Ghulam Hussain", contact: "MUZ-01", town: "Muzaffarabad", distributor: "Muz Dist", tsm: "Qaisar Yousaf", totalShops: 50, routes: JSON.stringify(["Route 1", "Route 2", "Route 3", "Route 4", "Route 5", "Route 6"]) },
      { name: "Hashim", contact: "MAN-01", town: "Mansehra", distributor: "Man Dist", tsm: "Qaisar Yousaf", totalShops: 50, routes: JSON.stringify(["Route 1", "Route 2", "Route 3", "Route 4", "Route 5", "Route 6"]) }
    ];
    const insertOB = db.prepare("INSERT INTO ob_assignments (name, contact, town, distributor, tsm, total_shops, routes) VALUES (?, ?, ?, ?, ?, ?, ?)");
    seedOBs.forEach(ob => insertOB.run(ob.name, ob.contact, ob.town, ob.distributor, ob.tsm, ob.totalShops, ob.routes));
  }

  // API Routes for Admin
  app.get("/api/admin/config", (req, res) => {
    try {
      const rows = db.prepare("SELECT * FROM app_config").all();
      const config = rows.reduce((acc: any, row: any) => ({ ...acc, [row.key]: row.value }), {});
      res.json(config);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch config" });
    }
  });

  app.post("/api/admin/config", (req, res) => {
    const { key, value } = req.body;
    db.prepare("INSERT OR REPLACE INTO app_config (key, value) VALUES (?, ?)").run(key, value.toString());
    res.json({ success: true });
  });

  app.get("/api/admin/obs", (req, res) => {
    try {
      const obs = db.prepare("SELECT * FROM ob_assignments").all();
      const targets = db.prepare("SELECT * FROM brand_targets").all();
      
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

  app.post("/api/admin/obs", (req, res) => {
    const { id, name, contact, town, distributor, tsm, total_shops, routes } = req.body;
    const shops = total_shops !== undefined ? total_shops : req.body.totalShops;
    try {
      if (id) {
        db.prepare("UPDATE ob_assignments SET name = ?, contact = ?, town = ?, distributor = ?, tsm = ?, total_shops = ?, routes = ? WHERE id = ?")
          .run(name, contact, town, distributor, tsm, shops || 0, JSON.stringify(routes), id);
      } else {
        db.prepare("INSERT INTO ob_assignments (name, contact, town, distributor, tsm, total_shops, routes) VALUES (?, ?, ?, ?, ?, ?, ?)")
          .run(name, contact, town, distributor, tsm, shops || 0, JSON.stringify(routes));
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

  app.delete("/api/admin/obs/delete/:id", (req, res) => {
    db.prepare("DELETE FROM ob_assignments WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/admin/distributors", (req, res) => {
    try {
      const dists = db.prepare("SELECT * FROM distributors").all();
      res.json(dists);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch distributors" });
    }
  });

  app.post("/api/admin/distributors", (req, res) => {
    const { id, town, name, tsm } = req.body;
    try {
      if (id) {
        db.prepare("UPDATE distributors SET town = ?, name = ?, tsm = ? WHERE id = ?").run(town, name, tsm, id);
      } else {
        db.prepare("INSERT OR REPLACE INTO distributors (town, name, tsm) VALUES (?, ?, ?)").run(town, name, tsm);
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/admin/distributors/:id", (req, res) => {
    db.prepare("DELETE FROM distributors WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/admin/targets/:ob_contact", (req, res) => {
    try {
      const targets = db.prepare("SELECT * FROM brand_targets WHERE ob_contact = ?").all(req.params.ob_contact);
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

  app.get("/api/admin/test-google", async (req, res) => {
    try {
      const configRows = db.prepare("SELECT * FROM app_config").all() as any[];
      const config = configRows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {} as any);
      
      let spreadsheetId = config.google_spreadsheet_id;
      let clientEmail = config.google_service_account_email;
      let privateKeyRaw = config.google_private_key;

      if (!spreadsheetId || !clientEmail || !privateKeyRaw) {
        return res.status(400).json({ error: "Missing Google configuration" });
      }

      const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

      const auth = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
      });
      const sheets = google.sheets({ version: 'v4', auth });
      
      const response = await sheets.spreadsheets.get({ spreadsheetId });
      res.json({ success: true, title: response.data.properties?.title });
    } catch (err: any) {
      console.error("Google Test Error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/google/status", (req, res) => {
    const tokensRow = db.prepare("SELECT value FROM app_config WHERE key = 'google_tokens'").get() as any;
    const sheetIdRow = db.prepare("SELECT value FROM app_config WHERE key = 'google_spreadsheet_id'").get() as any;
    const saEmailRow = db.prepare("SELECT value FROM app_config WHERE key = 'google_service_account_email'").get() as any;
    const saKeyRow = db.prepare("SELECT value FROM app_config WHERE key = 'google_private_key'").get() as any;
    
    const hasSA = saEmailRow?.value && saKeyRow?.value;
    const hasOAuth = !!tokensRow;

    res.json({ 
      connected: hasSA || hasOAuth,
      method: hasSA ? 'Service Account' : (hasOAuth ? 'OAuth2' : 'None'),
      spreadsheetId: sheetIdRow ? sheetIdRow.value : null 
    });
  });

  app.post("/api/google/sync", async (req, res) => {
    const tokensRow = db.prepare("SELECT value FROM app_config WHERE key = 'google_tokens'").get() as any;
    if (!tokensRow) return res.status(401).json({ error: "Not connected to Google" });

    const oauth2Client = getOAuth2Client(req);
    oauth2Client.setCredentials(JSON.parse(tokensRow.value));

    const sheets = google.sheets({ version: "v4", auth: oauth2Client });
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    try {
      let spreadsheetId = (db.prepare("SELECT value FROM app_config WHERE key = 'google_spreadsheet_id'").get() as any)?.value;

      if (!spreadsheetId) {
        const resource = {
          properties: { title: "Sales Reporting Data" },
        };
        const spreadsheet = await sheets.spreadsheets.create({
          requestBody: resource,
          fields: "spreadsheetId",
        });
        spreadsheetId = spreadsheet.data.spreadsheetId;
        db.prepare("INSERT OR REPLACE INTO app_config (key, value) VALUES (?, ?)").run("google_spreadsheet_id", spreadsheetId);
      }

      // Fetch all orders
      const orders = db.prepare("SELECT * FROM submitted_orders ORDER BY date DESC").all();
      
      // Prepare headers
      const headers = [
        'Date', 'TSM', 'Town', 'Distributor', 'OB Name', 'OB Contact', 'Route', 
        'Total Shops', 'Visited Shops', 'Productive Shops',
        ...SKUS.map(sku => `${sku.name} (${sku.category})`),
        'Submitted At'
      ];

      const rows = orders.map((h: any) => {
        const orderData = typeof h.order_data === 'string' ? JSON.parse(h.order_data) : (h.order_data || {});
        return [
          h.date, h.tsm, h.town, h.distributor, h.order_booker, h.ob_contact, h.route,
          h.total_shops, h.visited_shops, h.productive_shops,
          ...SKUS.map(sku => {
            const item = orderData[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
            const totalPacks = (item.ctn * sku.unitsPerCarton) + (item.dzn * sku.unitsPerDozen) + item.pks;
            const total = sku.unitsPerCarton > 0 ? totalPacks / sku.unitsPerCarton : 0;
            return total.toFixed(3);
          }),
          h.submitted_at
        ];
      });

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "Sales_Data!A1",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [headers, ...rows] },
      });

      await refreshSummarySheets(sheets, spreadsheetId);

      res.json({ success: true, spreadsheetId });
    } catch (err) {
      console.error("Sync error:", err);
      res.status(500).json({ error: "Sync failed: " + err.message });
    }
  });

  app.post("/api/admin/reseed", (req, res) => {
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
      const insertTarget = db.prepare("INSERT INTO brand_targets (ob_contact, brand_name, target_ctn) VALUES (?, ?, ?)");
      
      seedOBs.forEach(ob => {
        insertOB.run(ob.name, ob.contact, ob.town, ob.distributor, ob.tsm, ob.totalShops, ob.routes);
        // Add default targets
        ["Kite Glow", "Burq Action", "Vero", "DWB", "Match"].forEach(brand => {
          insertTarget.run(ob.contact, brand, (Math.random() * 10).toFixed(1));
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
    try {
      const { ob, tsm, from, to } = req.query;
      let query = "SELECT * FROM submitted_orders WHERE 1=1";
      const params: any[] = [];

      if (ob) {
        query += " AND order_booker = ?";
        params.push(ob);
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

  app.post("/api/stocks", (req, res) => {
    try {
      const { date, tsm, town, distributor, stocks } = req.body;
      if (!stocks) return res.status(400).json({ error: "Missing stock data" });

      db.prepare(`
        INSERT INTO stock_reports (date, tsm, town, distributor, stock_data)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        date || new Date().toISOString().split('T')[0],
        tsm || '',
        town || '',
        distributor || '',
        JSON.stringify(stocks)
      );

      res.json({ success: true, message: "Stock report submitted successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to submit stock report" });
    }
  });

  app.get("/api/stocks", (req, res) => {
    try {
      const rows = db.prepare("SELECT * FROM stock_reports ORDER BY submitted_at DESC").all();
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch stock reports" });
    }
  });

  app.post("/api/submit", (req, res) => {
    try {
      const { data } = req.body;
      if (!data) return res.status(400).json({ error: "Missing data" });

      const { 
        date, tsm, town, distributor, orderBooker, obContact, route, 
        totalShops, visitedShops, productiveShops, 
        categoryProductiveShops, items, targets,
        latitude, longitude, accuracy
      } = data;
      
      const info = db.prepare(`
        INSERT INTO submitted_orders (
          date, tsm, town, distributor, order_booker, ob_contact, route, 
          total_shops, visited_shops, productive_shops, 
          category_productive_data, order_data, targets_data,
          latitude, longitude, accuracy
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        date || new Date().toISOString().split('T')[0], 
        tsm || '', 
        town || '', 
        distributor || '', 
        orderBooker || '', 
        obContact || '', 
        route || '', 
        totalShops || 0, 
        visitedShops || 0, 
        productiveShops || 0, 
        JSON.stringify(categoryProductiveShops || {}), 
        JSON.stringify(items || {}), 
        JSON.stringify(targets || {}),
        latitude || null,
        longitude || null,
        accuracy || null
      );

      // Async sync to Google Sheets
      const newOrder = db.prepare("SELECT * FROM submitted_orders WHERE id = ?").get(info.lastInsertRowid);
      appendToSheet(newOrder).catch(console.error);
      
      res.json({ success: true, message: "Order submitted successfully" });
    } catch (err) {
      console.error("Submission error:", err);
      res.status(500).json({ error: "Failed to submit order: " + err.message });
    }
  });

  app.post("/api/admin/distributors/bulk-upload", (req, res) => {
    const { distributors, clearExisting } = req.body;
    if (!Array.isArray(distributors)) return res.status(400).json({ error: "Invalid data" });

    const transaction = db.transaction(() => {
      if (clearExisting) {
        db.prepare("DELETE FROM distributors").run();
      }

      for (const item of distributors) {
        const { name, town, tsm } = item;
        if (!name) continue;
        db.prepare(`
          INSERT INTO distributors (name, town, tsm)
          VALUES (?, ?, ?)
          ON CONFLICT(name) DO UPDATE SET
            town=excluded.town,
            tsm=excluded.tsm
        `).run(name, town, tsm);
      }
    });

    try {
      transaction();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/bulk-upload", (req, res) => {
    const { team, clearExisting } = req.body;
    if (!Array.isArray(team)) return res.status(400).json({ error: "Invalid data" });

    const transaction = db.transaction(() => {
      if (clearExisting) {
        db.prepare("DELETE FROM ob_assignments").run();
        db.prepare("DELETE FROM brand_targets").run();
      }

      for (const item of team) {
        const { name, contact, town, distributor, tsm, total_shops, routes, targets } = item;
        
        db.prepare(`
          INSERT INTO ob_assignments (name, contact, town, distributor, tsm, total_shops, routes)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(contact) DO UPDATE SET
            name=excluded.name,
            town=excluded.town,
            distributor=excluded.distributor,
            tsm=excluded.tsm,
            total_shops=excluded.total_shops,
            routes=excluded.routes
        `).run(name, contact, town, distributor, tsm, total_shops || 50, JSON.stringify(routes || []));

        if (targets && typeof targets === 'object') {
          for (const [brand, target] of Object.entries(targets)) {
            db.prepare(`
              INSERT INTO brand_targets (ob_contact, brand_name, target_ctn)
              VALUES (?, ?, ?)
              ON CONFLICT(ob_contact, brand_name) DO UPDATE SET
                target_ctn=excluded.target_ctn
            `).run(contact, brand, target);
          }
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

  app.post("/api/admin/clear-history", (req, res) => {
    try {
      db.prepare("DELETE FROM submitted_orders").run();
      res.json({ success: true, message: "All sales history has been cleared." });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/sync-team-to-sheets", async (req, res) => {
    try {
      const configRows = db.prepare("SELECT * FROM app_config").all() as any[];
      const config = configRows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {} as any);
      
      let spreadsheetId = config.google_spreadsheet_id;
      let clientEmail = config.google_service_account_email;
      let privateKeyRaw = config.google_private_key;

      try {
        const parsed = JSON.parse(privateKeyRaw);
        if (parsed.private_key) privateKeyRaw = parsed.private_key;
        if (parsed.client_email && !clientEmail) clientEmail = parsed.client_email;
      } catch (e) {}

      const privateKey = privateKeyRaw?.replace(/\\n/g, '\n');

      if (!spreadsheetId || !clientEmail || !privateKey) {
        return res.status(400).json({ error: "Google Sheets configuration missing" });
      }

      const auth = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });
      const sheets = google.sheets({ version: 'v4', auth });

      const obs = db.prepare("SELECT * FROM ob_assignments").all() as any[];
      const headers = ['Name', 'ID', 'Town', 'Distributor', 'TSM', 'Total Shops', 'Routes', 'Kite Glow Target', 'Burq Action Target', 'Vero Target', 'DWB Target', 'Match Target'];
      
      const rows = obs.map(ob => {
        const targets = db.prepare("SELECT brand_name, target_ctn FROM brand_targets WHERE ob_contact = ?").all(ob.contact) as any[];
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

  app.post("/api/admin/sync-team-from-sheets", async (req, res) => {
    try {
      const configRows = db.prepare("SELECT * FROM app_config").all() as any[];
      const config = configRows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {} as any);
      
      let spreadsheetId = config.google_spreadsheet_id;
      let clientEmail = config.google_service_account_email;
      let privateKeyRaw = config.google_private_key;

      try {
        const parsed = JSON.parse(privateKeyRaw);
        if (parsed.private_key) privateKeyRaw = parsed.private_key;
        if (parsed.client_email && !clientEmail) clientEmail = parsed.client_email;
      } catch (e) {}

      const privateKey = privateKeyRaw?.replace(/\\n/g, '\n');

      if (!spreadsheetId || !clientEmail || !privateKey) {
        return res.status(400).json({ error: "Google Sheets configuration missing" });
      }

      const auth = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });
      const sheets = google.sheets({ version: 'v4', auth });

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
          name: getVal(['Name', 'name']),
          contact: getVal(['ID', 'id', 'Contact', 'contact']),
          town: getVal(['Town', 'town']),
          distributor: getVal(['Distributor', 'distributor']),
          tsm: getVal(['TSM', 'tsm']),
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
              INSERT INTO brand_targets (ob_contact, brand_name, target_ctn)
              VALUES (?, ?, ?)
              ON CONFLICT(ob_contact, brand_name) DO UPDATE SET target_ctn=excluded.target_ctn
            `).run(item.contact, brand, target);
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

  app.post("/api/admin/import-from-sheets", async (req, res) => {
    try {
      const configRows = db.prepare("SELECT * FROM app_config").all() as any[];
      const config = configRows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {} as any);
      
      let spreadsheetId = config.google_spreadsheet_id;
      let clientEmail = config.google_service_account_email;
      let privateKeyRaw = config.google_private_key;

      try {
        const parsed = JSON.parse(privateKeyRaw);
        if (parsed.private_key) privateKeyRaw = parsed.private_key;
        if (parsed.client_email && !clientEmail) clientEmail = parsed.client_email;
      } catch (e) {}

      const privateKey = privateKeyRaw?.replace(/\\n/g, '\n');

      if (!spreadsheetId || !clientEmail || !privateKey) {
        return res.status(400).json({ error: "Google Sheets configuration missing." });
      }

      const auth = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
      });
      const sheets = google.sheets({ version: 'v4', auth });

      // Import OB Assignments and Targets from a sheet named "Team_Data"
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Team_Data!A2:J", // Assuming headers: Name, ID, Town, Distributor, TSM, Total Shops, Routes, Kite Target, Burq Target, Vero Target...
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        return res.status(400).json({ error: "No data found in 'Team_Data' sheet." });
      }

      const transaction = db.transaction(() => {
        db.prepare("DELETE FROM ob_assignments").run();
        db.prepare("DELETE FROM brand_targets").run();

        for (const row of rows) {
          const [name, contact, town, distributor, tsm, totalShops, routesRaw, kiteT, burqT, veroT, dwbT, matchT] = row;
          if (!name || !contact) continue;

          const routes = routesRaw ? routesRaw.split(",").map((r: string) => r.trim()) : [];
          
          db.prepare(`
            INSERT INTO ob_assignments (name, contact, town, distributor, tsm, total_shops, routes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(name, contact, town, distributor, tsm, parseInt(totalShops) || 50, JSON.stringify(routes));

          const targets: Record<string, string> = {
            "Kite Glow": kiteT,
            "Burq Action": burqT,
            "Vero": veroT,
            "DWB": dwbT,
            "Match": matchT
          };

          for (const [brand, target] of Object.entries(targets)) {
            if (target) {
              db.prepare(`
                INSERT INTO brand_targets (ob_contact, brand_name, target_ctn)
                VALUES (?, ?, ?)
              `).run(contact, brand, parseFloat(target) || 0);
            }
          }
        }
      });

      transaction();
      res.json({ success: true, message: `Successfully imported ${rows.length} team members from Google Sheets.` });
    } catch (err: any) {
      console.error("Import Error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/sync-sheets", async (req, res) => {
    try {
      const configRows = db.prepare("SELECT * FROM app_config").all() as any[];
      const config = configRows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {} as any);
      
      let spreadsheetId = config.google_spreadsheet_id;
      let clientEmail = config.google_service_account_email;
      let privateKeyRaw = config.google_private_key;

      // Try to parse if user pasted the whole JSON
      try {
        const parsed = JSON.parse(privateKeyRaw);
        if (parsed.private_key) privateKeyRaw = parsed.private_key;
        if (parsed.client_email && !clientEmail) clientEmail = parsed.client_email;
      } catch (e) {
        // Not a JSON, use as raw string
      }

      const privateKey = privateKeyRaw?.replace(/\\n/g, '\n');

      if (!spreadsheetId || !clientEmail || !privateKey) {
        return res.status(400).json({ error: "Google Sheets configuration missing in Admin panel. Ensure Spreadsheet ID, Email, and Key are provided." });
      }

      const auth = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });
      const sheets = google.sheets({ version: 'v4', auth });

      // Ensure Sheets exist
      const sheetTitles = ["Sales_Data", "Targets_vs_Achievement", "OB_Route_Performance", "Stocks_Report"];
      for (const title of sheetTitles) {
        try {
          await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
              requests: [{ addSheet: { properties: { title } } }]
            }
          });
        } catch (e) {}
      }

      const orders = db.prepare("SELECT * FROM submitted_orders ORDER BY date ASC").all() as any[];
      
      const salesHeaders = [
        'Date', 'TSM', 'Town', 'Distributor', 'OB Name', 'OB Contact', 'Route', 
        'Total Shops', 'Visited Shops', 'Productive Shops',
        ...SKUS.map(sku => `${sku.name} (${sku.category})`),
        'Submitted At', 'Latitude', 'Longitude', 'Accuracy'
      ];

      const salesRows = orders.map((order: any) => {
        const orderData = typeof order.order_data === 'string' ? JSON.parse(order.order_data) : (order.order_data || {});
        return [
          order.date, order.tsm, order.town, order.distributor, order.order_booker, order.ob_contact, order.route,
          order.total_shops, order.visited_shops, order.productive_shops,
          ...SKUS.map(sku => {
            const item = orderData[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
            const totalPacks = (Number(item.ctn || 0) * sku.unitsPerCarton) + (Number(item.dzn || 0) * sku.unitsPerDozen) + Number(item.pks || 0);
            const total = sku.unitsPerCarton > 0 ? totalPacks / sku.unitsPerCarton : 0;
            return total;
          }),
          order.submitted_at,
          order.latitude || '',
          order.longitude || '',
          order.accuracy || ''
        ];
      });

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "Sales_Data!A1",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [salesHeaders, ...salesRows] },
      });

      await refreshSummarySheets(sheets, spreadsheetId);

      res.json({ success: true, message: `Successfully synced ${orders.length} records and stock reports to Google Sheets` });
    } catch (err: any) {
      console.error("Bulk Sync Error:", err);
      let errorMessage = err.message;
      if (errorMessage.includes("API has not been used") || errorMessage.includes("disabled")) {
        errorMessage = "Google Sheets API is disabled. Please enable it in your Google Cloud Console (check server logs for the link).";
      }
      res.status(500).json({ error: errorMessage });
    }
  });

  // API 404 Guard
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `API route ${req.method} ${req.url} not found` });
  });

  // Global Error Handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Server Error:", err);
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

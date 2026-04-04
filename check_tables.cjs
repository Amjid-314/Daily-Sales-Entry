const Database = require('better-sqlite3');
const db = new Database('orders.db');

try {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log("Tables in orders.db:", JSON.stringify(tables, null, 2));
} catch (e) {
  console.error("Database check failed:", e.message);
}

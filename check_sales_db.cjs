const Database = require('better-sqlite3');
const db = new Database('sales.db');

try {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log("Tables in sales.db:", JSON.stringify(tables, null, 2));
  if (tables.some(t => t.name === 'audit_logs')) {
    const count = db.prepare("SELECT COUNT(*) as count FROM audit_logs").get();
    console.log("Total audit logs in sales.db:", count.count);
  }
} catch (e) {
  console.error("Database check failed:", e.message);
}

const Database = require('better-sqlite3');
const db = new Database('orders.db');

try {
  const count = db.prepare("SELECT COUNT(*) as count FROM audit_logs").get();
  console.log("Total audit logs:", count.count);
  if (count.count > 0) {
    const logs = db.prepare("SELECT * FROM audit_logs LIMIT 10").all();
    console.log("First 10 logs:", JSON.stringify(logs, null, 2));
  }
} catch (e) {
  console.error("Database check failed:", e.message);
}

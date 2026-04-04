const Database = require('better-sqlite3');
const db = new Database('orders.db');

try {
  const seq = db.prepare("SELECT * FROM sqlite_sequence WHERE name='audit_logs'").get();
  console.log("sqlite_sequence for audit_logs:", JSON.stringify(seq, null, 2));
} catch (e) {
  console.error("Database check failed:", e.message);
}

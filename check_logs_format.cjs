const Database = require('better-sqlite3');
const db = new Database('orders.db');

try {
  const logs = db.prepare("SELECT * FROM audit_logs ORDER BY id DESC LIMIT 100").all();
  console.log("Last 100 Audit Logs:", JSON.stringify(logs, null, 2));
} catch (e) {
  console.error("Database check failed:", e.message);
}

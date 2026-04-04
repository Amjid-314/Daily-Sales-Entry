const Database = require('better-sqlite3');
const db = new Database('orders.db');

try {
  // Check for any logs from today (4/4/2026)
  const logs = db.prepare("SELECT * FROM audit_logs WHERE timestamp LIKE '4/4/2026%'").all();
  console.log("Audit Logs for 4/4/2026:", JSON.stringify(logs, null, 2));
} catch (e) {
  console.error("Database check failed:", e.message);
}

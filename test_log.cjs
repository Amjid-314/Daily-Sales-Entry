const Database = require('better-sqlite3');
const db = new Database('orders.db');

try {
  const info = db.prepare("INSERT INTO audit_logs (user_id, user_name, role, action, details) VALUES (?, ?, ?, ?, ?)")
    .run("TEST_ID", "TEST_USER", "Admin", "TEST_ACTION", JSON.stringify({ test: true }));
  console.log("Insert info:", info);
  
  const logs = db.prepare("SELECT * FROM audit_logs").all();
  console.log("Logs after manual insert:", JSON.stringify(logs, null, 2));
} catch (e) {
  console.error("Manual insert failed:", e.message);
}

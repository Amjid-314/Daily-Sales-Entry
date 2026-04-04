const Database = require('better-sqlite3');
const db = new Database('orders.db');

try {
  console.log("--- Recent Submissions (Last 50) ---");
  const submissions = db.prepare('SELECT id, date, tsm, order_booker, submitted_at FROM submitted_orders ORDER BY id DESC LIMIT 50').all();
  console.log(JSON.stringify(submissions, null, 2));

  console.log("\n--- User List (Roles and Names) ---");
  const users = db.prepare('SELECT id, username, name, role FROM users').all();
  console.log(JSON.stringify(users, null, 2));

  console.log("\n--- Audit Logs (Last 50) ---");
  const logs = db.prepare('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 50').all();
  console.log(JSON.stringify(logs, null, 2));

} catch (e) {
  console.error("Check failed:", e.message);
}

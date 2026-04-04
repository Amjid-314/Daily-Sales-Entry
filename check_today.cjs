const Database = require('better-sqlite3');
const db = new Database('orders.db');

const today = '2026-04-04';

console.log("--- Checking Activity for", today, "---");

try {
  const submissions = db.prepare('SELECT COUNT(*) as count FROM submitted_orders WHERE date = ?').get(today);
  console.log("Submissions today:", submissions.count);
  
  const errors = db.prepare("SELECT * FROM audit_logs WHERE timestamp LIKE ? AND action LIKE '%ERROR%'").all(`${today}%`);
  console.log("Errors today:", JSON.stringify(errors, null, 2));
  
  const syncErrors = db.prepare("SELECT * FROM audit_logs WHERE timestamp LIKE ? AND details LIKE '%Sync Error%'").all(`${today}%`);
  console.log("Sync Errors today:", JSON.stringify(syncErrors, null, 2));

} catch (e) {
  console.error("Database check failed:", e.message);
}

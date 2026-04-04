const Database = require('better-sqlite3');
const db = new Database('orders.db');

const yesterday = '2026-04-03';
const today = '2026-04-04';

console.log("--- Checking Activity for", yesterday, "---");

try {
  const submissions = db.prepare('SELECT COUNT(*) as count FROM submitted_orders WHERE date = ?').get(yesterday);
  console.log("Submissions yesterday:", submissions.count);
  
  const errors = db.prepare("SELECT * FROM audit_logs WHERE timestamp LIKE ? AND action LIKE '%ERROR%'").all(`${yesterday}%`);
  console.log("Errors yesterday:", JSON.stringify(errors, null, 2));
  
  const pending = db.prepare("SELECT * FROM pending_commands WHERE status = 'pending'").all();
  console.log("Pending Commands:", JSON.stringify(pending, null, 2));
  
  const syncErrors = db.prepare("SELECT * FROM audit_logs WHERE timestamp LIKE ? AND details LIKE '%Sync Error%'").all(`${yesterday}%`);
  console.log("Sync Errors yesterday:", JSON.stringify(syncErrors, null, 2));

} catch (e) {
  console.error("Database check failed:", e.message);
}

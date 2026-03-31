const Database = require('better-sqlite3');
const db = new Database('orders.db');

try {
  const pending = db.prepare('SELECT * FROM pending_commands').all();
  console.log("Pending Commands:", JSON.stringify(pending, null, 2));
} catch (e) {
  console.error("Error reading pending_commands:", e.message);
}

const yesterday = '2026-03-29';
const today = '2026-03-30';

try {
  const yesterdayStats = db.prepare('SELECT COUNT(*) as count FROM submitted_orders WHERE date = ?').get(yesterday);
  const todayStats = db.prepare('SELECT COUNT(*) as count FROM submitted_orders WHERE date = ?').get(today);
  console.log(JSON.stringify({
    yesterday: { date: yesterday, submissions: yesterdayStats.count },
    today: { date: today, submissions: todayStats.count }
  }, null, 2));
} catch (e) {
  console.error("Error reading submitted_orders:", e.message);
}

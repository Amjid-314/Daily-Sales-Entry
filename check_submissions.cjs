const Database = require('better-sqlite3');
const db = new Database('orders.db');

const yesterday = '2026-04-03';

try {
  const submissions = db.prepare('SELECT * FROM submitted_orders WHERE date = ?').all(yesterday);
  console.log("Submissions yesterday:", JSON.stringify(submissions, null, 2));
} catch (e) {
  console.error("Database check failed:", e.message);
}

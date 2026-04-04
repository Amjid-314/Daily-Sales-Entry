const Database = require('better-sqlite3');
const db = new Database('orders.db');

const yesterday = '2026-04-03';

try {
  const commands = db.prepare("SELECT * FROM audit_logs WHERE timestamp LIKE ? AND action LIKE '%COMMAND%'").all(`${yesterday}%`);
  console.log("Commands yesterday:", JSON.stringify(commands, null, 2));
} catch (e) {
  console.error("Database check failed:", e.message);
}

const Database = require('better-sqlite3');
const db = new Database('orders.db');

const yesterday = '2026-04-03';

try {
  const syncs = db.prepare("SELECT * FROM audit_logs WHERE timestamp LIKE ? AND (action LIKE '%SYNC%' OR action LIKE '%PULL%')").all(`${yesterday}%`);
  console.log("Sync/Pull yesterday:", JSON.stringify(syncs, null, 2));
} catch (e) {
  console.error("Database check failed:", e.message);
}

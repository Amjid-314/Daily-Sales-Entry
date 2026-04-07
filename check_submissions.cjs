const Database = require('better-sqlite3');
const db = new Database('orders.db');
const count = db.prepare("SELECT count(*) as count FROM submitted_orders").get();
console.log(JSON.stringify(count, null, 2));
const recent = db.prepare("SELECT date, count(*) as count FROM submitted_orders GROUP BY date ORDER BY date DESC LIMIT 5").all();
console.log(JSON.stringify(recent, null, 2));

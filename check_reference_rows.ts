import Database from 'better-sqlite3';
const db = new Database('orders.db');
const rows = db.prepare("SELECT * FROM submitted_orders WHERE id BETWEEN 1580 AND 1595").all();
console.log(JSON.stringify(rows, null, 2));
db.close();

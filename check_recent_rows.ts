import Database from 'better-sqlite3';
const db = new Database('orders.db');
const rows = db.prepare("SELECT id, date, ob_contact, submitted_at FROM submitted_orders ORDER BY id DESC LIMIT 20").all();
console.log(JSON.stringify(rows, null, 2));
db.close();

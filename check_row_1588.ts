import Database from 'better-sqlite3';
const db = new Database('orders.db');
const row = db.prepare("SELECT * FROM submitted_orders WHERE id = 1588").get();
console.log(JSON.stringify(row, null, 2));
db.close();

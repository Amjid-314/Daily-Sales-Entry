import Database from 'better-sqlite3';
const db = new Database('orders.db');
console.log(db.prepare('SELECT * FROM tsm_assignments LIMIT 5').all());

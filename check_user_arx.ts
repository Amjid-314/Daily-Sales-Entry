import Database from 'better-sqlite3';
const db = new Database('orders.db');
console.log(db.prepare('SELECT * FROM users WHERE email = ?').get('arx8712@gmail.com'));

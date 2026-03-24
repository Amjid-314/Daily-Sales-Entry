const Database = require('better-sqlite3');
const db = new Database('orders.db');
const users = db.prepare("SELECT * FROM users WHERE name LIKE '%Shahid%' OR username LIKE '%Shahid%'").all();
console.log(users);

const Database = require('better-sqlite3');
const db = new Database('orders.db');
const users = db.prepare("SELECT username, email, role, password FROM users WHERE email IN ('amjid.bisconni@gmail.com', 'ikram.di.khan@gmail.com') OR username = 'amjid.admin'").all();
console.log(JSON.stringify(users, null, 2));

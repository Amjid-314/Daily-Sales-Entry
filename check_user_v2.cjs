const Database = require('better-sqlite3');
const db = new Database('orders.db');
const user = db.prepare("SELECT * FROM users WHERE email = ?").get('amjid.bisconni@gmail.com');
console.log(JSON.stringify(user, null, 2));
const admin = db.prepare("SELECT * FROM users WHERE role = 'Super Admin' OR role = 'Admin'").all();
console.log(JSON.stringify(admin, null, 2));

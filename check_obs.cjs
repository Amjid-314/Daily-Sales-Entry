const Database = require('better-sqlite3');
const db = new Database('orders.db');
const count = db.prepare("SELECT count(*) as count FROM ob_assignments").get();
console.log(JSON.stringify(count, null, 2));

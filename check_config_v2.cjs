const Database = require('better-sqlite3');
const db = new Database('orders.db');
const rows = db.prepare("SELECT * FROM app_config").all();
console.log(JSON.stringify(rows, null, 2));

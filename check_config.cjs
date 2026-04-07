const Database = require('better-sqlite3');
const db = new Database('orders.db');
const config = db.prepare("SELECT * FROM app_config").all();
console.log(JSON.stringify(config, null, 2));

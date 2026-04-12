const Database = require('better-sqlite3');
const db = new Database('orders.db');
const config = db.prepare("SELECT * FROM app_config LIMIT 1").get();
console.log(config);

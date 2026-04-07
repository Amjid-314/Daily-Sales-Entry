const Database = require('better-sqlite3');
const db = new Database('orders.db');
const rows = db.prepare("SELECT key, length(value) as len, substr(value, 1, 20) as start FROM app_config").all();
console.log(JSON.stringify(rows, null, 2));

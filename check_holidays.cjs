const Database = require('better-sqlite3');
const db = new Database('orders.db');
const row = db.prepare("SELECT value FROM app_config WHERE key = 'holidays'").get();
console.log('Holidays:', row?.value);

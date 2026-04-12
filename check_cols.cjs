const Database = require('better-sqlite3');
const db = new Database('orders.db');
const cols = db.prepare("PRAGMA table_info(national_hierarchy)").all();
console.log("national_hierarchy columns:", cols.map(c => c.name));
const usersCols = db.prepare("PRAGMA table_info(users)").all();
console.log("users columns:", usersCols.map(c => c.name));

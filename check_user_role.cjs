const Database = require('better-sqlite3');
const db = new Database('orders.db');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log("Tables:", tables);
try {
  const rows = db.prepare("SELECT * FROM users WHERE email='amjid.bisconni@gmail.com'").all();
  console.log("User:", rows);
} catch (e) {
  console.log(e.message);
}

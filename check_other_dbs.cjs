const Database = require('better-sqlite3');
try {
  const db1 = new Database('sales.db');
  console.log('sales.db:', db1.prepare('SELECT * FROM app_config').all());
} catch (e) { console.log('sales.db error:', e.message); }

try {
  const db2 = new Database('database.sqlite');
  console.log('database.sqlite:', db2.prepare('SELECT * FROM app_config').all());
} catch (e) { console.log('database.sqlite error:', e.message); }

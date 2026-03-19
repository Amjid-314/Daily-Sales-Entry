const Database = require('better-sqlite3');
const db = new Database('orders.db');

db.exec(`
  DELETE FROM ob_assignments;
  DELETE FROM national_hierarchy;
  DELETE FROM users WHERE role != 'Super Admin' AND role != 'Admin';
`);
console.log("Cleared Sales Team and Uploaded Team.");

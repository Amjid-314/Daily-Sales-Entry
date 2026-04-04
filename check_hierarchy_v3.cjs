const Database = require('better-sqlite3');
const db = new Database('orders.db');

try {
  console.log("--- OB IDs starting with TSM- in national_hierarchy ---");
  const tsmAsOB = db.prepare("SELECT * FROM national_hierarchy WHERE ob_id LIKE 'TSM-%'").all();
  console.log(JSON.stringify(tsmAsOB, null, 2));

} catch (e) {
  console.error("Check failed:", e.message);
}

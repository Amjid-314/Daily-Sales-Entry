const Database = require('better-sqlite3');
const db = new Database('orders.db');

try {
  const tsmNames = db.prepare("SELECT DISTINCT name FROM users WHERE role IN ('TSM', 'ASM', 'RSM')").all().map(u => u.name);
  
  console.log("--- TSMs appearing as OBs in national_hierarchy ---");
  const tsmAsOB = db.prepare(`
    SELECT * FROM national_hierarchy 
    WHERE ob_name IN (${tsmNames.map(() => '?').join(',')})
  `).all(...tsmNames);
  console.log(JSON.stringify(tsmAsOB, null, 2));

} catch (e) {
  console.error("Check failed:", e.message);
}

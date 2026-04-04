const Database = require('better-sqlite3');
const db = new Database('orders.db');

try {
  console.log("--- TSMs assigned as OBs to themselves ---");
  const selfAssigned = db.prepare("SELECT * FROM ob_assignments WHERE name = tsm").all();
  console.log(JSON.stringify(selfAssigned, null, 2));

  console.log("\n--- TSMs assigned as OBs to ANYONE ---");
  const tsmNames = db.prepare("SELECT DISTINCT name FROM users WHERE role IN ('TSM', 'ASM', 'RSM')").all().map(u => u.name);
  const tsmAsOB = db.prepare(`
    SELECT * FROM ob_assignments 
    WHERE name IN (${tsmNames.map(() => '?').join(',')})
  `).all(...tsmNames);
  console.log(JSON.stringify(tsmAsOB, null, 2));

} catch (e) {
  console.error("Check failed:", e.message);
}

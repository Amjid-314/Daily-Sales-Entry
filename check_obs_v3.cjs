const Database = require('better-sqlite3');
const db = new Database('orders.db');

try {
  console.log("--- TSMs Registered as OBs ---");
  const tsmOBs = db.prepare("SELECT * FROM ob_assignments WHERE name LIKE '%(TSM)%' OR contact LIKE 'TSM-%'").all();
  console.log(JSON.stringify(tsmOBs, null, 2));

  console.log("\n--- OB Counts per TSM (Excluding TSM-as-OB) ---");
  const counts = db.prepare(`
    SELECT tsm, COUNT(*) as ob_count 
    FROM ob_assignments 
    WHERE name NOT LIKE '%(TSM)%' AND contact NOT LIKE 'TSM-%'
    GROUP BY tsm
  `).all();
  console.log(JSON.stringify(counts, null, 2));

} catch (e) {
  console.error("Check failed:", e.message);
}

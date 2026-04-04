const Database = require('better-sqlite3');
const db = new Database('orders.db');

try {
  console.log("--- OB Assignments Table Schema ---");
  const schema = db.prepare("PRAGMA table_info(ob_assignments)").all();
  console.log(JSON.stringify(schema, null, 2));

  console.log("\n--- OB Assignments Data (Sample) ---");
  const data = db.prepare("SELECT * FROM ob_assignments LIMIT 20").all();
  console.log(JSON.stringify(data, null, 2));

  console.log("\n--- OB Counts per TSM ---");
  const counts = db.prepare(`
    SELECT tsm_name, COUNT(*) as ob_count 
    FROM ob_assignments 
    GROUP BY tsm_name
  `).all();
  console.log(JSON.stringify(counts, null, 2));

} catch (e) {
  console.error("Check failed:", e.message);
}

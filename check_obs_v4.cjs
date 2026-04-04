const Database = require('better-sqlite3');
const db = new Database('orders.db');

try {
  const tsmName = "Muhammad Zeeshan";
  const obs = db.prepare("SELECT * FROM ob_assignments WHERE tsm = ?").all(tsmName);
  console.log(`--- OBs for ${tsmName} ---`);
  console.log(JSON.stringify(obs, null, 2));

  const tsmName2 = "Waheed Jamal";
  const obs2 = db.prepare("SELECT * FROM ob_assignments WHERE tsm = ?").all(tsmName2);
  console.log(`\n--- OBs for ${tsmName2} ---`);
  console.log(JSON.stringify(obs2, null, 2));

} catch (e) {
  console.error("Check failed:", e.message);
}

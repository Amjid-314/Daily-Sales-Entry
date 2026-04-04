const Database = require('better-sqlite3');
const db = new Database('orders.db');

try {
  const tsmNames = [
    "Muhammad Zeeshan",
    "Waheed Jamal",
    "Qaisar Yousaf",
    "Ikramullah",
    "Muhammad Yousaf",
    "Muhammad Shoaib (ASM)"
  ];

  console.log("--- OB Counts per TSM (Requested) ---");
  for (const name of tsmNames) {
    const count = db.prepare("SELECT COUNT(*) as count FROM ob_assignments WHERE tsm = ?").get(name);
    const obs = db.prepare("SELECT name FROM ob_assignments WHERE tsm = ?").all(name);
    console.log(`TSM: ${name}`);
    console.log(`Count: ${count.count}`);
    console.log(`OBs: ${obs.map(o => o.name).join(', ')}`);
    console.log("--------------------");
  }

} catch (e) {
  console.error("Check failed:", e.message);
}

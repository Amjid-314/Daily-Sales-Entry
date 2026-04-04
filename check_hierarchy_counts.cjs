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

  console.log("--- OB Counts in national_hierarchy for April 2026 ---");
  for (const name of tsmNames) {
    const count = db.prepare("SELECT COUNT(*) as count FROM national_hierarchy WHERE asm_tsm_name = ? AND month = '2026-04'").get(name);
    const obs = db.prepare("SELECT ob_name FROM national_hierarchy WHERE asm_tsm_name = ? AND month = '2026-04'").all(name);
    console.log(`TSM: ${name}`);
    console.log(`Count: ${count.count}`);
    console.log(`OBs: ${obs.map(o => o.ob_name).join(', ')}`);
    console.log("--------------------");
  }

} catch (e) {
  console.error("Check failed:", e.message);
}

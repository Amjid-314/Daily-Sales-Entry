const Database = require('better-sqlite3');
const db = new Database('orders.db');

try {
  const tsmName = "Muhammad Shoaib (ASM)";
  const obs = db.prepare("SELECT DISTINCT order_booker, ob_contact FROM submitted_orders WHERE tsm = ?").all(tsmName);
  console.log(`--- OBs in submitted_orders for ${tsmName} ---`);
  console.log(JSON.stringify(obs, null, 2));

} catch (e) {
  console.error("Check failed:", e.message);
}

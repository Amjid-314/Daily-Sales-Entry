const Database = require('better-sqlite3');
const db = new Database('orders.db');

try {
  const tsmNames = db.prepare("SELECT DISTINCT name FROM users WHERE role IN ('TSM', 'ASM', 'RSM')").all().map(u => u.name);
  
  console.log("--- TSMs submitting orders where name comparison might fail ---");
  for (const name of tsmNames) {
    const submissions = db.prepare("SELECT DISTINCT order_booker, tsm, ob_contact FROM submitted_orders WHERE tsm = ?").all(name);
    for (const s of submissions) {
      const obName = (s.order_booker || '').trim().toLowerCase();
      const tsmName = (s.tsm || '').trim().toLowerCase();
      if (obName !== tsmName && (obName.includes(tsmName) || tsmName.includes(obName))) {
        console.log(`Match found for ${name}: OB="${s.order_booker}", TSM="${s.tsm}", Contact="${s.ob_contact}"`);
      }
    }
  }

} catch (e) {
  console.error("Check failed:", e.message);
}

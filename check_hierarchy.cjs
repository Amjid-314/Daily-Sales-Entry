const Database = require('better-sqlite3');
const db = new Database('orders.db');

try {
  console.log("--- National Hierarchy Table Schema ---");
  const schema = db.prepare("PRAGMA table_info(national_hierarchy)").all();
  console.log(JSON.stringify(schema, null, 2));

  console.log("\n--- National Hierarchy Data (Sample) ---");
  const data = db.prepare("SELECT * FROM national_hierarchy LIMIT 20").all();
  console.log(JSON.stringify(data, null, 2));

} catch (e) {
  console.error("Check failed:", e.message);
}

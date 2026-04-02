import Database from "better-sqlite3";
const db = new Database("orders.db");
const rows = db.prepare("SELECT * FROM national_hierarchy WHERE asm_tsm_name LIKE '%Shoaib%'").all();
console.log(JSON.stringify(rows, null, 2));

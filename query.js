import Database from "better-sqlite3";
const db = new Database("orders.db");
const rows = db.prepare("SELECT * FROM ob_assignments WHERE tsm = 'Muhammad Shoaib'").all();
console.log(JSON.stringify(rows, null, 2));

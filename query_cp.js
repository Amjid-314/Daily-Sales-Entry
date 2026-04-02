import Database from "better-sqlite3";
const db = new Database("orders.db");
const rows = db.prepare("SELECT * FROM national_hierarchy WHERE region = 'Central Punjab (FSD)'").all();
console.log(JSON.stringify(rows, null, 2));

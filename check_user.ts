
import Database from 'better-sqlite3';
const db = new Database('orders.db');
const users = db.prepare("SELECT * FROM users").all();
console.log("Users:", JSON.stringify(users, null, 2));
const hierarchy = db.prepare("SELECT * FROM national_hierarchy LIMIT 5").all();
console.log("Hierarchy (First 5):", JSON.stringify(hierarchy, null, 2));

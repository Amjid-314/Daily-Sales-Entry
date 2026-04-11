import Database from 'better-sqlite3';
const db = new Database('orders.db');
console.log("--- USERS TABLE SCHEMA ---");
console.log(db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'").get());
console.log("\n--- FIRST 5 USERS ---");
console.log(db.prepare("SELECT id, username, email, role, name, contact FROM users LIMIT 5").all());
console.log("\n--- TOTAL USERS ---");
console.log(db.prepare("SELECT COUNT(*) as count FROM users").get());

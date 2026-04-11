import Database from 'better-sqlite3';
const db = new Database('orders.db');

const username = 'amjid.bisconni@gmail.com';
let user = db.prepare("SELECT * FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)").get(username, username);

console.log("User found:", user);

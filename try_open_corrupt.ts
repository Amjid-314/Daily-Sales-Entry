import Database from 'better-sqlite3';
try {
    const db = new Database('orders.db.corrupt.1776490578684', { readonly: true });
    console.log("Opened successfully");
    const row = db.prepare("SELECT 1").get();
    console.log(row);
    db.close();
} catch (e) {
    console.log("Error: " + e.message);
}

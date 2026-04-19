import Database from 'better-sqlite3';
try {
    const db = new Database('temp_old.db');
    const row = db.prepare("SELECT COUNT(*) as count FROM submitted_orders").all();
    console.log(row);
    db.close();
} catch (e) {
    console.log("Error: " + e.message);
}

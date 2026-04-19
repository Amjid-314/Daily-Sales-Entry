import Database from 'better-sqlite3';
try {
    const db = new Database('database.sqlite');
    const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='submitted_orders'").get();
    if (tableExists) {
        const count = db.prepare("SELECT COUNT(*) as count FROM submitted_orders").get();
        const lastRow = db.prepare("SELECT id, date, submitted_at FROM submitted_orders ORDER BY id DESC LIMIT 1").get();
        console.log(`database.sqlite: Count: ${count.count}, Last ID: ${lastRow?.id}, Date: ${lastRow?.date}, Time: ${lastRow?.submitted_at}`);
    } else {
        console.log("database.sqlite: No submitted_orders table");
    }
    db.close();
} catch (e) {
    console.log("database.sqlite: Error - " + e.message);
}

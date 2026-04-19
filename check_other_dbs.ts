import Database from 'better-sqlite3';
try {
    const db = new Database('sales.db');
    const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='submitted_orders'").get();
    if (tableExists) {
        const firstRow = db.prepare("SELECT date FROM submitted_orders ORDER BY date ASC LIMIT 1").get();
        const lastRow = db.prepare("SELECT date FROM submitted_orders ORDER BY date DESC LIMIT 1").get();
        const count = db.prepare("SELECT COUNT(*) as count FROM submitted_orders").get();
        console.log(`sales.db: Count: ${count.count}, First: ${firstRow?.date}, Last: ${lastRow?.date}`);
    } else {
        console.log("sales.db: No submitted_orders table");
    }
    db.close();
} catch (e) {
    console.log("sales.db: Error - " + e.message);
}

try {
    const db2 = new Database('data.db');
    const tableExists2 = db2.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='submitted_orders'").get();
    if (tableExists2) {
        const firstRow2 = db2.prepare("SELECT date FROM submitted_orders ORDER BY date ASC LIMIT 1").get();
        const lastRow2 = db2.prepare("SELECT date FROM submitted_orders ORDER BY date DESC LIMIT 1").get();
        const count2 = db2.prepare("SELECT COUNT(*) as count FROM submitted_orders").get();
        console.log(`data.db: Count: ${count2.count}, First: ${firstRow2?.date}, Last: ${lastRow2?.date}`);
    } else {
        console.log("data.db: No submitted_orders table");
    }
    db2.close();
} catch (e) {
    console.log("data.db: Error - " + e.message);
}

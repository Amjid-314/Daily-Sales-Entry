import Database from 'better-sqlite3';
const dbs = ['sales.db', 'data.db', 'orders.db', 'database.sqlite'];
for (const dbName of dbs) {
    try {
        const db = new Database(dbName);
        const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
        console.log(`${dbName} tables:`, tables.map(t => t.name).join(', '));
        db.close();
    } catch (e) {
        console.log(`${dbName}: Error - ${e.message}`);
    }
}

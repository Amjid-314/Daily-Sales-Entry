import Database from 'better-sqlite3';
const db = new Database('orders.db');
const logs = db.prepare("SELECT * FROM audit_logs WHERE action LIKE 'BACKUP_%' ORDER BY id DESC LIMIT 5").all();
console.log(JSON.stringify(logs, null, 2));
db.close();


import Database from 'better-sqlite3';
const db = new Database('orders.db');
const count = db.prepare('SELECT COUNT(*) as count FROM submitted_orders').get().count;
console.log('Total orders:', count);
const assignmentsCount = db.prepare('SELECT COUNT(*) as count FROM ob_assignments').get().count;
console.log('Total assignments:', assignmentsCount);
db.close();

import Database from 'better-sqlite3';

const db = new Database('orders.db');

const duplicates = db.prepare(`
  SELECT date, ob_contact, COUNT(*) as count
  FROM submitted_orders
  GROUP BY date, ob_contact
  HAVING count > 1
`).all();

console.log('Duplicates:', duplicates);

if (duplicates.length > 0) {
  db.exec(`
    DELETE FROM submitted_orders
    WHERE id NOT IN (
      SELECT MIN(id)
      FROM submitted_orders
      GROUP BY date, ob_contact
    )
  `);
  console.log('Deleted duplicates');
}

try {
  db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_submitted_orders_date_ob ON submitted_orders(date, ob_contact)`);
  console.log('Index created');
} catch (e) {
  console.error(e);
}

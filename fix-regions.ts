import Database from 'better-sqlite3';

const db = new Database('orders.db');

console.log('Updating regions in submitted_orders...');
const updateOrders = db.prepare(`
  UPDATE submitted_orders 
  SET region = 'North' 
  WHERE region IN ('Zone North', 'Region KPK', 'KPK')
`);
const orderResult = updateOrders.run();
console.log(`Updated ${orderResult.changes} rows in submitted_orders.`);

console.log('Updating regions in ob_assignments...');
const updateOBs = db.prepare(`
  UPDATE ob_assignments 
  SET region = 'North' 
  WHERE region IN ('Zone North', 'Region KPK', 'KPK')
`);
const obResult = updateOBs.run();
console.log(`Updated ${obResult.changes} rows in ob_assignments.`);

console.log('Updating regions in national_hierarchy...');
const updateHierarchy = db.prepare(`
  UPDATE national_hierarchy 
  SET territory_region = 'North' 
  WHERE territory_region IN ('Zone North', 'Region KPK', 'KPK')
`);
const hierarchyResult = updateHierarchy.run();
console.log(`Updated ${hierarchyResult.changes} rows in national_hierarchy.`);

console.log('Updating regions in users...');
const updateUsers = db.prepare(`
  UPDATE users 
  SET region = 'North' 
  WHERE region IN ('Zone North', 'Region KPK', 'KPK')
`);
const usersResult = updateUsers.run();
console.log(`Updated ${usersResult.changes} rows in users.`);

console.log('Done.');

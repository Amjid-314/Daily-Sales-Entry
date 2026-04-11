
import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');
// Replace submitted_orders with ob_sales, but skip the migration part we already handled
// Actually, replacing all is fine because we already handled the CREATE TABLE and RENAME migration.
// The only place where we want to keep it is in the RENAME command itself, but we already applied that.
content = content.replace(/submitted_orders/g, 'ob_sales');
fs.writeFileSync('server.ts', content);
console.log('Replaced all submitted_orders with ob_sales in server.ts');

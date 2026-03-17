const Database = require('better-sqlite3');
const db = new Database('orders.db');
const email = db.prepare("SELECT value FROM app_config WHERE key = 'google_service_account_email'").get();
const key = db.prepare("SELECT value FROM app_config WHERE key = 'google_private_key'").get();
console.log(JSON.stringify({
  client_email: email ? email.value : '',
  private_key: key ? key.value : ''
}, null, 2));

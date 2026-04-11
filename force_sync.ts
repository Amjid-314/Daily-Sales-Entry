import Database from 'better-sqlite3';
import { google } from 'googleapis';

const db = new Database('orders.db');

async function getGoogleSheetsClient() {
  const configRows = db.prepare("SELECT * FROM app_config").all() as any[];
  const config = configRows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {} as any);
  
  let spreadsheetId = config.google_spreadsheet_id || process.env.GOOGLE_SPREADSHEET_ID;
  if (spreadsheetId) {
    spreadsheetId = spreadsheetId.trim().replace(/^\/+|\/+$/g, '');
  }
  let clientEmail = config.google_service_account_email || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKeyRaw = config.google_private_key || process.env.GOOGLE_PRIVATE_KEY;

  if (privateKeyRaw) {
    let privateKey = privateKeyRaw;
    try {
      const parsed = JSON.parse(privateKeyRaw);
      if (parsed.private_key) privateKey = parsed.private_key;
    } catch(e) {}
    privateKey = privateKey.replace(/\\n/g, '\n');

    const auth = new google.auth.GoogleAuth({
      credentials: { client_email: clientEmail, private_key: privateKey },
      scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.file'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    return { sheets, spreadsheetId };
  }
  return null;
}

async function runSync() {
  const client = await getGoogleSheetsClient();
  if (!client) {
    console.log("No client");
    return;
  }
  const { sheets, spreadsheetId } = client;
  
  console.log("Pulling Users Data...");
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Users!A1:ZZ1000",
  });

  const rows = response.data.values;
  if (!rows || rows.length < 2) {
    console.log("No data found in Users sheet.");
    return;
  }

  const headers = rows[0];
  const dataRows = rows.slice(1);

  const users = dataRows.map(row => {
    const getVal = (headerNames: string[]) => {
      for (const name of headerNames) {
        const idx = headers.findIndex(h => h.trim().toLowerCase() === name.toLowerCase());
        if (idx > -1 && row[idx] !== undefined) return row[idx];
      }
      return null;
    };

    const email = getVal(['Email', 'email'])?.toString().trim();
    const cleanString = (val: any) => val ? val.toString().trim() : val;
    const username = (cleanString(getVal(['Username', 'username'])) || email || '').toLowerCase();

    return {
      username: username,
      email: email,
      role: getVal(['Role', 'role']),
      name: cleanString(getVal(['Name', 'name'])),
      contact: getVal(['Contact', 'contact']),
      region: getVal(['Region', 'region']),
      town: getVal(['Town', 'town'])
    };
  }).filter(u => u.username);

  console.log(`Found ${users.length} users in sheet.`);
  
  const transaction = db.transaction(() => {
    for (const user of users) {
      try {
        const existing = db.prepare("SELECT * FROM users WHERE username = ? OR (email = ? AND email IS NOT NULL)").get(user.username, user.email || null) as any;
        
        if (existing) {
          db.prepare(`
            UPDATE users SET 
              email = ?, role = ?, name = ?, contact = ?, region = ?, town = ?
            WHERE id = ?
          `).run(user.email || null, user.role, user.name, user.contact, user.region, user.town, existing.id);
        } else {
          db.prepare(`
            INSERT INTO users (username, email, role, name, contact, region, town, password)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(user.username, user.email || null, user.role, user.name, user.contact, user.region, user.town, '123456');
        }
      } catch (e) {
        console.error("Failed to insert user:", user, e.message);
      }
    }
  });
  transaction();
  console.log("Sync complete!");
}

runSync().catch(console.error);

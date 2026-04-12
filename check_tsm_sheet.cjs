const { google } = require('googleapis');
const Database = require('better-sqlite3');
const db = new Database('orders.db');
require('dotenv').config();

const configRows = db.prepare("SELECT * FROM app_config").all();
const config = {};
for (const row of configRows) {
  config[row.key] = row.value;
}

function formatPrivateKey(key) {
  if (!key) return '';
  let formatted = key.trim();
  if (formatted.startsWith('{')) {
    try {
      const parsed = JSON.parse(formatted);
      if (parsed.private_key) {
        formatted = parsed.private_key;
      }
    } catch (e) {}
  }
  formatted = formatted.replace(/^["']|["']$/g, '');
  formatted = formatted.replace(/\\n/g, '\n');
  return formatted;
}

async function run() {
  const privateKeyRaw = config.google_private_key || process.env.GOOGLE_PRIVATE_KEY;
  const clientEmail = config.google_service_account_email || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let spreadsheetId = config.google_spreadsheet_id || process.env.GOOGLE_SPREADSHEET_ID;
  if (spreadsheetId && spreadsheetId.endsWith('/')) {
    spreadsheetId = spreadsheetId.slice(0, -1);
  }

  console.log("Spreadsheet ID:", spreadsheetId);

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: formatPrivateKey(privateKeyRaw)
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });

  const sheets = google.sheets({ version: 'v4', auth });
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: 'TSM_Assignments!A1:Z10'
    });
    console.log(res.data.values);
  } catch (e) {
    console.error(e.message);
  }
}
run();

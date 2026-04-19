import { google } from 'googleapis';

async function countRows() {
  const spreadsheetId = (process.env.GOOGLE_SPREADSHEET_ID || '').trim().replace(/^\/+|\/+$/g, '');
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  try {
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'Sales_Data!A1:A5000' });
    const rows = res.data.values || [];
    console.log(`Rows found in A1:A5000: ${rows.length}`);
    for (let i = rows.length - 1; i >= 0; i--) {
        if (rows[i][0]) {
            console.log(`Last non-empty row in A: ${i + 1}`);
            break;
        }
    }
  } catch (err) {
    console.error(`Error:`, err.message);
  }
}

countRows();

import { google } from 'googleapis';

async function findAdil() {
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
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'Sales_Data!A1300:J1421' });
    const rows = res.data.values || [];
    rows.forEach((row, i) => {
      if (row[9] === 'Adil Khan') {
        console.log(`Found Adil Khan at Sheet Row ${1300 + i}`);
      }
    });
  } catch (err) {
    console.error('Error:', err.message);
  }
}

findAdil();

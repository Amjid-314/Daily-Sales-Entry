import { google } from 'googleapis';

async function findSmall() {
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
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'Sales_Data!S2:AZ1421' });
    const rows = res.data.values || [];
    rows.forEach((row, i) => {
      row.forEach((cell, j) => {
        const val = parseFloat(cell.toString().replace(/,/g, ''));
        if (val > 0 && val < 0.02) {
          console.log(`Found tiny value ${val} at Row ${i + 2}, Col ${j + 19}`);
        }
      });
    });
  } catch (err) {
    console.error('Error:', err.message);
  }
}

findSmall();

import { google } from 'googleapis';

async function findRow() {
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
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'Sales_Data!A1350:AZ1421' });
    const rows = res.data.values || [];
    const targetTime = '4/18/2026, 9:31:09 AM';
    
    // Find index of Submitted At column
    const headerRes = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'Sales_Data!A1:AZ1' });
    const headers = headerRes.data.values?.[0] || [];
    const submittedAtIdx = headers.indexOf('Submitted At');
    
    rows.forEach((row, i) => {
      if (row[submittedAtIdx] === targetTime) {
        console.log(`Found row at Sheet Row ${1350 + i}`);
        console.log(JSON.stringify(row, null, 2));
      }
    });
  } catch (err) {
    console.error('Error:', err.message);
  }
}

findRow();

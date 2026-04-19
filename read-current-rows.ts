import { google } from 'googleapis';

async function readRange() {
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
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'Sales_Data!A1380:AZ1421' });
    console.log(`Content of current Sales_Data rows 1380-1421:`);
    console.log(JSON.stringify(res.data.values, null, 2));
  } catch (err) {
    console.error(`Error reading Sales_Data:`, err.message);
  }
}

readRange();

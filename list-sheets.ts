import { google } from 'googleapis';

async function listSheets() {
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
    const res = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetTitles = res.data.sheets?.map(s => s.properties?.title) || [];
    console.log(JSON.stringify(sheetTitles, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

listSheets();

import { google } from 'googleapis';

async function countRows(spreadsheetId: string) {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  try {
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'Sales_Data!A1:A' });
    console.log(`Rows in Backup ${spreadsheetId}: ${res.data.values?.length}`);
  } catch (err) {
    console.error(`Error counting rows:`, err.message);
  }
}

countRows('1WkW0u0sfab5cpAWM5FGWwAgj7IkY0WKsjGsAwemhjBs');

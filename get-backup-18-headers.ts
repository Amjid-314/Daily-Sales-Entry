import { google } from 'googleapis';

async function getBackupCurrentHeaders() {
  const spreadsheetId = '10FBry4Eqv9X62eYOQPm2VmxyArI7hucWyfbuJr0u-s8';
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  try {
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'Sales_Data!A1:AZ1' });
    const headers = res.data.values?.[0] || [];
    headers.forEach((h, i) => console.log(`${i}: ${h}`));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

getBackupCurrentHeaders();

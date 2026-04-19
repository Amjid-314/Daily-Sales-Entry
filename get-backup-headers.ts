import { google } from 'googleapis';

async function getBackupHeaders() {
  const spreadsheetId = '1GZ3NDSlSS3lPIED-pFRpIejpABgU9ThUoVVQh37V1xY';
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  try {
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'Sales_Data!A1:CZ1' });
    const headers = res.data.values?.[0] || [];
    headers.forEach((h, i) => console.log(`${i}: ${h}`));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

getBackupHeaders();

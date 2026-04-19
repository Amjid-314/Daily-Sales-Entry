import { google } from 'googleapis';

async function checkRow3() {
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
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'Sales_Data!S3:S3' });
    console.log(JSON.stringify(res.data.values));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkRow3();

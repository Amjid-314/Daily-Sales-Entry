import { google } from 'googleapis';

async function readLastRows(spreadsheetId: string, sheetName: string) {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  try {
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${sheetName}!A1350:V1362` });
    console.log(`Last rows of ${sheetName} in backup ${spreadsheetId}:`);
    console.log(JSON.stringify(res.data.values, null, 2));
  } catch (err) {
    console.error(`Error reading ${sheetName}:`, err.message);
  }
}

readLastRows('1GZ3NDSlSS3lPIED-pFRpIejpABgU9ThUoVVQh37V1xY', 'Sales_Data');

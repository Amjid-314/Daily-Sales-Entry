import { google } from 'googleapis';

const BACKUP_SHEET_ID = '10FBry4Eqv9X62eYOQPm2VmxyArI7hucWyfbuJr0u-s8';

async function checkRow1390() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  try {
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: BACKUP_SHEET_ID, range: 'Sales_Data!A1390:V1390' });
    console.log(JSON.stringify(res.data.values, null, 2));
  } catch (err) {
    console.error(err);
  }
}

checkRow1390();

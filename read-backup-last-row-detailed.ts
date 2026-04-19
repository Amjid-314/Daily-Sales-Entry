import { google } from 'googleapis';

async function readLastRow(spreadsheetId: string) {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  try {
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'Sales_Data!A1390:V1403' });
    console.log(`Last rows of Backup ${spreadsheetId}:`);
    console.log(JSON.stringify(res.data.values, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

readLastRow('10FBry4Eqv9X62eYOQPm2VmxyArI7hucWyfbuJr0u-s8');

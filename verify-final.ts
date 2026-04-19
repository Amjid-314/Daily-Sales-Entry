import { google } from 'googleapis';

const TARGET_SHEET_ID = '1xdVdlzC1lfJfrH2v_LsOJMgCyRaEJbImMNDd_HvysIA';

async function verifyFinal() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  try {
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: TARGET_SHEET_ID, range: 'Sales_Data!A1390:BP1390' });
    const row = res.data.values?.[0] || [];
    console.log("Row 1390 check:");
    console.log(`Col 21: ${row[20]} (Expected 5.00)`);
    console.log(`Col 22: ${row[21]} (Expected 3.00)`);
    console.log(`Flag: ${row[67]}`);
  } catch (err) {
    console.error(err);
  }
}

verifyFinal();

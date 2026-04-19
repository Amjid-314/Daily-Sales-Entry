import { google } from 'googleapis';

const TARGET_SHEET_ID = '1xdVdlzC1lfJfrH2v_LsOJMgCyRaEJbImMNDd_HvysIA';

async function forceUpdateRow3() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId: TARGET_SHEET_ID,
      range: 'Sales_Data!S3',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [['1.08']] }
    });
    console.log("Row 3 Col S forced to 1.08");
  } catch (err) {
    console.error(err);
  }
}

forceUpdateRow3();

import { google } from 'googleapis';

const BACKUP_17_ID = '1GZ3NDSlSS3lPIED-pFRpIejpABgU9ThUoVVQh37V1xY';
const TARGET_SHEET_ID = '1xdVdlzC1lfJfrH2v_LsOJMgCyRaEJbImMNDd_HvysIA';

async function checkBoundary() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  try {
    const backupRes = await sheets.spreadsheets.values.get({ spreadsheetId: BACKUP_17_ID, range: 'Sales_Data!A1362:AZ1362' });
    const targetRes = await sheets.spreadsheets.values.get({ spreadsheetId: TARGET_SHEET_ID, range: 'Sales_Data!A1362:AZ1362' });

    console.log("Row 1362 Comparison:");
    const bRow = backupRes.data.values?.[0] || [];
    const tRow = targetRes.data.values?.[0] || [];

    for (let j = 18; j <= 40; j++) {
        if (bRow[j] !== tRow[j]) {
            console.log(`Col ${j}: Backup='${bRow[j]}' Target='${tRow[j]}' (MISMATCH!)`);
        } else if (bRow[j] && bRow[j] !== "0" && bRow[j] !== "0.00") {
             console.log(`Col ${j}: '${bRow[j]}' (MATCH)`);
        }
    }
  } catch (err) {
    console.error(err);
  }
}

checkBoundary();

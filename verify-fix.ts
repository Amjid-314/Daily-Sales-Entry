import { google } from 'googleapis';

const TARGET_SHEET_ID = '1xdVdlzC1lfJfrH2v_LsOJMgCyRaEJbImMNDd_HvysIA';

async function verify() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  try {
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: TARGET_SHEET_ID, range: 'Sales_Data!A1:BP1421' });
    const rows = res.data.values || [];

    console.log("Verification:");
    
    // Check Row 3
    console.log("Row 3 check (Kite Rs 10 / index 18):", rows[2][18]); // Should be 1.08
    
    // Check Row 1004 (Col 33 was 118)
    // 118 / 48 (UPC for DWB Regular) = 2.458 -> 2.46
    console.log("Row 1004 Col 33 check:", rows[1003][32]); // index 32 is Col 33
    
    // Check Row 1400 (New row)
    console.log("Row 1400 SKU example:", rows[1399][18]);
    
    // Check Flags
    console.log("Row 3 Flag:", rows[2][67]);
    console.log("Row 1421 Flag:", rows[1420][67]);

  } catch (err) {
    console.error(err);
  }
}

verify();

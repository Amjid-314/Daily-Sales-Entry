import { google } from 'googleapis';

async function checkNorthTargets() {
  const spreadsheetId = (process.env.GOOGLE_SPREADSHEET_ID || '').trim().replace(/^\/+|\/+$/g, '');
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  try {
    const res = await sheets.spreadsheets.values.get({ 
      spreadsheetId, 
      range: 'Team_Data!A1:AZ500' 
    });
    const rows = res.data.values || [];
    const headers = rows[0] || [];
    console.log("Headers:", JSON.stringify(headers));
    
    // Find North Region rows
    const regionIdx = headers.findIndex(h => h.toLowerCase() === 'region');
    const targetIdx = headers.findIndex(h => h.toLowerCase().includes('target'));
    
    const northRows = rows.filter(r => r[regionIdx]?.toLowerCase() === 'north');
    console.log(`Found ${northRows.length} North rows.`);
    northRows.slice(0, 5).forEach(r => console.log(JSON.stringify(r)));
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkNorthTargets();

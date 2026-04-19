import { google } from 'googleapis';

async function backupCurrent() {
  const spreadsheetId = (process.env.GOOGLE_SPREADSHEET_ID || '').trim().replace(/^\/+|\/+$/g, '');
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  const drive = google.drive({ version: 'v3', auth });
  try {
    const res = await drive.files.copy({
      fileId: spreadsheetId,
      requestBody: { name: `Pre_Restore_Backup_${new Date().toISOString()}` },
    });
    console.log(`Current sheet backed up to ${res.data.id}`);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

backupCurrent();

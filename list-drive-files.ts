import { google } from 'googleapis';

async function listFiles() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });

  const drive = google.drive({ version: 'v3', auth });
  const folderId = '1obtuVTe100g6jrvS6ST8-KVUtXYvQVDY';
  
  try {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, createdTime)',
      orderBy: 'createdTime desc'
    });
    console.log('Files found in Drive:');
    res.data.files?.forEach(f => console.log(`- ${f.name} (id: ${f.id}, created: ${f.createdTime})`));
  } catch (err) {
    console.error('Error listing files:', err.message);
  }
}

listFiles();

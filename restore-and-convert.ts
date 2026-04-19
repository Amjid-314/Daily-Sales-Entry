import { google } from 'googleapis';

const BACKUP_SHEET_ID = '1GZ3NDSlSS3lPIED-pFRpIejpABgU9ThUoVVQh37V1xY';
const TARGET_SHEET_ID = '1xdVdlzC1lfJfrH2v_LsOJMgCyRaEJbImMNDd_HvysIA';
const SPLIT_ROW = 1362; // Up to this row (inclusive) is restored from backup

const UPC_MAP: Record<number, number> = {
  18: 144, 19: 96, 20: 48, 21: 24, 22: 24, 23: 12, 24: 6,
  25: 204, 26: 96, 27: 48, 28: 24, 29: 12, 30: 6,
  31: 4, 32: 1,
  33: 48, 34: 36, 35: 36, 36: 36,
  37: 10, 38: 10, 39: 20, 40: 20,
  41: 10, 42: 10, 43: 20, 44: 20,
  45: 10, 46: 10, 47: 20, 48: 10, 49: 10, 50: 10, 51: 10
};

async function run() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  try {
    console.log("Reading data...");
    const backupRes = await sheets.spreadsheets.values.get({ spreadsheetId: BACKUP_SHEET_ID, range: 'Sales_Data!A1:AZ1362' });
    const targetRes = await sheets.spreadsheets.values.get({ spreadsheetId: TARGET_SHEET_ID, range: 'Sales_Data!A1:CZ2000' });

    const backupRows = backupRes.data.values || [];
    const targetRows = targetRes.data.values || [];
    
    console.log(`Backup rows: ${backupRows.length}, Target rows: ${targetRows.length}`);

    const updates: any[] = [];
    const flagUpdates: any[] = [];

    // Ensure headers for CONVERTED_FLAG
    const headers = targetRows[0];
    let flagColIndex = headers.indexOf('CONVERTED_FLAG');
    if (flagColIndex === -1) {
      flagColIndex = headers.length;
      console.log(`Adding CONVERTED_FLAG at index ${flagColIndex}`);
      updates.push({
        range: `Sales_Data!${columnToLetter(flagColIndex + 1)}1`,
        values: [['CONVERTED_FLAG']]
      });
    }

    for (let i = 1; i < targetRows.length; i++) {
        const rowNum = i + 1;
        const targetRow = targetRows[i];
        if (!targetRow || targetRow.length === 0) continue;

        const rowUpdates: any[] = [];
        let converted = false;

        if (rowNum <= SPLIT_ROW) {
            // RESTORE MODE
            const backupRow = backupRows[i];
            if (backupRow) {
                // Map columns 18 to 40 (SKUs in backup)
                for (let j = 18; j <= 40; j++) {
                    const backupVal = backupRow[j] || "0";
                    const targetVal = targetRow[j] || "0";
                    if (backupVal !== targetVal) {
                        rowUpdates.push({ col: j, val: backupVal });
                    }
                }
                converted = true; // Mark as done
            }
        } else {
            // CONVERT MODE
            for (let j = 18; j <= 51; j++) {
                const valStr = (targetRow[j] || "0").toString().replace(/,/g, '');
                const val = parseFloat(valStr);
                const upc = UPC_MAP[j];
                
                if (val > 0 && upc && upc > 0) {
                    // Logic to detect if it's Packs
                    const isPacks = (val >= upc && val % 1 === 0) || (val > 100);
                    if (isPacks) {
                        const convertedVal = (val / upc).toFixed(2);
                        rowUpdates.push({ col: j, val: convertedVal });
                        converted = true;
                    }
                }
            }
        }

        if (rowUpdates.length > 0) {
            rowUpdates.forEach(u => {
                updates.push({
                    range: `Sales_Data!${columnToLetter(u.col + 1)}${rowNum}`,
                    values: [[u.val]]
                });
            });
        }
        
        // Always update flag
        flagUpdates.push({
            range: `Sales_Data!${columnToLetter(flagColIndex + 1)}${rowNum}`,
            values: [[converted ? 'YES' : 'NO']]
        });
    }

    console.log(`Applying ${updates.length} cell updates and ${flagUpdates.length} flag updates...`);
    
    // Batch update in chunks to avoid size limits
    const allUpdates = [...updates, ...flagUpdates];
    const CHUNK_SIZE = 1000;
    for (let i = 0; i < allUpdates.length; i += CHUNK_SIZE) {
        const chunk = allUpdates.slice(i, i + CHUNK_SIZE);
        await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: TARGET_SHEET_ID,
            requestBody: {
                valueInputOption: 'USER_ENTERED',
                data: chunk
            }
        });
        console.log(`Chunk ${Math.floor(i / CHUNK_SIZE) + 1} applied.`);
    }

    console.log("Fix completed successfully!");

  } catch (err) {
    console.error("Error:", err.message);
  }
}

function columnToLetter(column: number) {
  let temp, letter = '';
  while (column > 0) {
    temp = (column - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    column = (column - temp - 1) / 26;
  }
  return letter;
}

run();

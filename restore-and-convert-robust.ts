import { google } from 'googleapis';

const BACKUP_17_ID = '1GZ3NDSlSS3lPIED-pFRpIejpABgU9ThUoVVQh37V1xY';
const BACKUP_18_ID = '10FBry4Eqv9X62eYOQPm2VmxyArI7hucWyfbuJr0u-s8';
const TARGET_SHEET_ID = '1xdVdlzC1lfJfrH2v_LsOJMgCyRaEJbImMNDd_HvysIA';

const SPLIT_17 = 1362;
const SPLIT_18 = 1403;

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
    const [b17Res, b18Res, targetRes] = await Promise.all([
      sheets.spreadsheets.values.get({ spreadsheetId: BACKUP_17_ID, range: 'Sales_Data!A1:AZ1362' }),
      sheets.spreadsheets.values.get({ spreadsheetId: BACKUP_18_ID, range: 'Sales_Data!A1:AZ1403' }),
      sheets.spreadsheets.values.get({ spreadsheetId: TARGET_SHEET_ID, range: 'Sales_Data!A1:BP1421' })
    ]);

    const b17Rows = b17Res.data.values || [];
    const b18Rows = b18Res.data.values || [];
    const targetRows = targetRes.data.values || [];
    
    console.log(`B17: ${b17Rows.length}, B18: ${b18Rows.length}, Target: ${targetRows.length}`);

    const updates: any[] = [];
    const headers = targetRows[0];
    let flagColIndex = headers.indexOf('CONVERTED_FLAG');
    if (flagColIndex === -1) flagColIndex = headers.length;

    for (let i = 1; i < targetRows.length; i++) {
        const rowNum = i + 1;
        const targetRow = targetRows[i] || [];
        if (targetRow.length === 0) continue;

        let converted = false;

        if (rowNum <= SPLIT_17) {
            const bRow = b17Rows[i];
            if (bRow) {
                for (let j = 18; j <= 40; j++) {
                    const val = bRow[j] || "0";
                    updates.push({
                        range: `Sales_Data!${columnToLetter(j + 1)}${rowNum}`,
                        values: [[val]]
                    });
                }
                converted = true;
            }
        } else if (rowNum <= SPLIT_18) {
            const bRow = b18Rows[i];
            if (bRow) {
                for (let j = 18; j <= 51; j++) {
                    const valStr = (bRow[j] || "0").toString().replace(/,/g, '');
                    const val = parseFloat(valStr);
                    const upc = UPC_MAP[j];
                    if (val > 0 && upc) {
                        const isPacks = (val >= upc && val % 1 === 0) || (val > 100);
                        if (isPacks) {
                            updates.push({
                                range: `Sales_Data!${columnToLetter(j + 1)}${rowNum}`,
                                values: [[(val / upc).toFixed(2)]]
                            });
                            converted = true;
                        } else {
                            updates.push({
                                range: `Sales_Data!${columnToLetter(j + 1)}${rowNum}`,
                                values: [[valStr]]
                            });
                        }
                    } else {
                        updates.push({
                            range: `Sales_Data!${columnToLetter(j + 1)}${rowNum}`,
                            values: [["0"]]
                        });
                    }
                }
            }
        } else {
            for (let j = 18; j <= 51; j++) {
                const valStr = (targetRow[j] || "0").toString().replace(/,/g, '');
                const val = parseFloat(valStr);
                const upc = UPC_MAP[j];
                if (val > 0 && upc) {
                    const isPacks = (val >= upc && val % 1 === 0) || (val > 100);
                    if (isPacks) {
                        updates.push({
                            range: `Sales_Data!${columnToLetter(j + 1)}${rowNum}`,
                            values: [[(val / upc).toFixed(2)]]
                        });
                        converted = true;
                    }
                }
            }
        }

        // Set CONVERTED_FLAG
        updates.push({
            range: `Sales_Data!${columnToLetter(flagColIndex + 1)}${rowNum}`,
            values: [[converted ? 'YES' : 'NO']]
        });
    }

    console.log(`Applying ${updates.length} updates...`);
    const CHUNK_SIZE = 5000;
    for (let i = 0; i < updates.length; i += CHUNK_SIZE) {
        const chunk = updates.slice(i, i + CHUNK_SIZE);
        try {
            await sheets.spreadsheets.values.batchUpdate({
                spreadsheetId: TARGET_SHEET_ID,
                requestBody: {
                    valueInputOption: 'USER_ENTERED',
                    data: chunk
                }
            });
            console.log(`Chunk ${Math.floor(i / CHUNK_SIZE) + 1}/${Math.ceil(updates.length / CHUNK_SIZE)} applied.`);
            // Small delay to prevent hitting quota too fast
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (err: any) {
            if (err.message.includes("Quota exceeded")) {
                console.log("Quota hit, waiting 30s...");
                await new Promise(resolve => setTimeout(resolve, 30000));
                i -= CHUNK_SIZE; // Retry this chunk
            } else {
                throw err;
            }
        }
    }

    console.log("Ultimate Fix (Robust) completed successfully!");

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

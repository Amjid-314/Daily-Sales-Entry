import { google } from 'googleapis';
import Database from 'better-sqlite3';
import fs from 'fs';

const DB_PATH = 'orders.db';
const CATEGORIES = ["Kite Glow", "Burq Action", "Vero", "DWB", "Match"];
const SKUS = [
  { id: "kg-10", name: "Kite Rs 10", category: "Kite Glow", unitsPerCarton: 144, unitsPerDozen: 12, pricePerCarton: 1440, weight_gm_per_pack: 30, unit: 'Bags' },
  { id: "kg-20", name: "Kite Rs 20", category: "Kite Glow", unitsPerCarton: 96, unitsPerDozen: 12, pricePerCarton: 1920, weight_gm_per_pack: 56, unit: 'Bags' },
  { id: "kg-50", name: "Kite Rs 50", category: "Kite Glow", unitsPerCarton: 48, unitsPerDozen: 12, pricePerCarton: 2400, weight_gm_per_pack: 165, unit: 'Bags' },
  { id: "kg-99", name: "Kite Rs 99", category: "Kite Glow", unitsPerCarton: 24, unitsPerDozen: 12, pricePerCarton: 2376, weight_gm_per_pack: 350, unit: 'Bags' },
  { id: "kg-05kg", name: "Kite 0.5kg", category: "Kite Glow", unitsPerCarton: 24, unitsPerDozen: 0, pricePerCarton: 3600, weight_gm_per_pack: 500, unit: 'Bags' },
  { id: "kg-1kg", name: "Kite 1kg", category: "Kite Glow", unitsPerCarton: 12, unitsPerDozen: 0, pricePerCarton: 3600, weight_gm_per_pack: 1000, unit: 'Bags' },
  { id: "kg-2kg", name: "Kite 2kg", category: "Kite Glow", unitsPerCarton: 6, unitsPerDozen: 0, pricePerCarton: 3600, weight_gm_per_pack: 2000, unit: 'Bags' },
  { id: "ba-10", name: "Burq Rs 10", category: "Burq Action", unitsPerCarton: 204, unitsPerDozen: 12, pricePerCarton: 2040, weight_gm_per_pack: 40, unit: 'Bags' },
  { id: "ba-20", name: "Burq Rs 20", category: "Burq Action", unitsPerCarton: 96, unitsPerDozen: 12, pricePerCarton: 1920, weight_gm_per_pack: 75, unit: 'Bags' },
  { id: "ba-50", name: "Burq Rs 50", category: "Burq Action", unitsPerCarton: 48, unitsPerDozen: 12, pricePerCarton: 2400, weight_gm_per_pack: 215, unit: 'Bags' },
  { id: "ba-99", name: "Burq Rs 99", category: "Burq Action", unitsPerCarton: 24, unitsPerDozen: 12, pricePerCarton: 2376, weight_gm_per_pack: 430, unit: 'Bags' },
  { id: "ba-1kg", name: "Burq 1kg", category: "Burq Action", unitsPerCarton: 12, unitsPerDozen: 0, pricePerCarton: 3600, weight_gm_per_pack: 1000, unit: 'Bags' },
  { id: "ba-23kg", name: "Burq 2.3kg", category: "Burq Action", unitsPerCarton: 6, unitsPerDozen: 0, pricePerCarton: 3600, weight_gm_per_pack: 2300, unit: 'Bags' },
  { id: "v-5kg", name: "Vero 5kg", category: "Vero", unitsPerCarton: 4, unitsPerDozen: 0, pricePerCarton: 4000, weight_gm_per_pack: 5000, unit: 'Bags' },
  { id: "v-20kg", name: "Vero 20kg", category: "Vero", unitsPerCarton: 1, unitsPerDozen: 0, pricePerCarton: 16000, weight_gm_per_pack: 20000, unit: 'Bags' },
  { id: "dwb-reg", name: "Regular", category: "DWB", unitsPerCarton: 48, unitsPerDozen: 12, pricePerCarton: 4800, weight_gm_per_pack: 50, unit: 'Ctns' },
  { id: "dwb-large", name: "Large", category: "DWB", unitsPerCarton: 36, unitsPerDozen: 12, pricePerCarton: 5400, weight_gm_per_pack: 100, unit: 'Ctns' },
  { id: "dwb-long", name: "Long Bar", category: "DWB", unitsPerCarton: 36, unitsPerDozen: 12, pricePerCarton: 5400, weight_gm_per_pack: 210, unit: 'Ctns' },
  { id: "dwb-super", name: "Super Bar", category: "DWB", unitsPerCarton: 36, unitsPerDozen: 12, pricePerCarton: 5400, weight_gm_per_pack: 240, unit: 'Ctns' },
  { id: "m-ki-l", name: "Kite (L)", category: "Match", unitsPerCarton: 10, unitsPerDozen: 12, pricePerCarton: 1000, weight_gm_per_pack: 50, unit: 'Ctns', grossPerCarton: 5 },
  { id: "m-ki-c", name: "Kite (C)", category: "Match", unitsPerCarton: 10, unitsPerDozen: 12, pricePerCarton: 1000, weight_gm_per_pack: 50, unit: 'Ctns', grossPerCarton: 5 },
  { id: "m-ki-r", name: "Kite (R)", category: "Match", unitsPerCarton: 10, unitsPerDozen: 12, pricePerCarton: 2000, weight_gm_per_pack: 50, unit: 'Ctns', grossPerCarton: 10 },
  { id: "m-ki-s", name: "Kite (S)", category: "Match", unitsPerCarton: 10, unitsPerDozen: 12, pricePerCarton: 2000, weight_gm_per_pack: 50, unit: 'Ctns', grossPerCarton: 10 },
  { id: "m-ol-l", name: "Olympia (L)", category: "Match", unitsPerCarton: 10, unitsPerDozen: 12, pricePerCarton: 1000, weight_gm_per_pack: 50, unit: 'Ctns', grossPerCarton: 5 },
  { id: "m-ol-c", name: "Olympia (C)", category: "Match", unitsPerCarton: 10, unitsPerDozen: 12, pricePerCarton: 1000, weight_gm_per_pack: 50, unit: 'Ctns', grossPerCarton: 5 },
  { id: "m-ol-r", name: "Olympia (R)", category: "Match", unitsPerCarton: 10, unitsPerDozen: 12, pricePerCarton: 2000, weight_gm_per_pack: 50, unit: 'Ctns', grossPerCarton: 10 },
  { id: "m-ol-s", name: "Olympia (S)", category: "Match", unitsPerCarton: 10, unitsPerDozen: 12, pricePerCarton: 2000, weight_gm_per_pack: 50, unit: 'Ctns', grossPerCarton: 10 },
  { id: "m-pa-l", name: "Party (L)", category: "Match", unitsPerCarton: 10, unitsPerDozen: 12, pricePerCarton: 1000, weight_gm_per_pack: 50, unit: 'Ctns', grossPerCarton: 5 },
  { id: "m-pa-c", name: "Party (C)", category: "Match", unitsPerCarton: 10, unitsPerDozen: 12, pricePerCarton: 1000, weight_gm_per_pack: 50, unit: 'Ctns', grossPerCarton: 5 },
  { id: "m-pa-r", name: "Party (R)", category: "Match", unitsPerCarton: 10, unitsPerDozen: 12, pricePerCarton: 2000, weight_gm_per_pack: 50, unit: 'Ctns', grossPerCarton: 10 },
  { id: "m-bi-l", name: "Bird (L)", category: "Match", unitsPerCarton: 10, unitsPerDozen: 12, pricePerCarton: 1000, weight_gm_per_pack: 50, unit: 'Ctns', grossPerCarton: 5 },
  { id: "m-bi-c", name: "Bird (C)", category: "Match", unitsPerCarton: 10, unitsPerDozen: 12, pricePerCarton: 1000, weight_gm_per_pack: 50, unit: 'Ctns', grossPerCarton: 5 },
  { id: "m-ta-l", name: "Tanga (L)", category: "Match", unitsPerCarton: 10, unitsPerDozen: 12, pricePerCarton: 1000, weight_gm_per_pack: 50, unit: 'Ctns', grossPerCarton: 5 },
  { id: "m-ta-c", name: "Tanga (C)", category: "Match", unitsPerCarton: 10, unitsPerDozen: 12, pricePerCarton: 1000, weight_gm_per_pack: 50, unit: 'Ctns', grossPerCarton: 5 },
];

function calculateAchievement(orderData: any) {
  const totals: Record<string, { value: number, unit: string }> = {};
  CATEGORIES.forEach(cat => {
    const catSkus = SKUS.filter(sku => sku.category === cat);
    const unit = catSkus[0]?.unit || 'Ctns';
    const value = catSkus.reduce((sum, sku) => {
      const item = (orderData || {})[sku.id] || { ctn: 0, dzn: 0, pks: 0 };
      const ctn = Number(item.ctn || 0);
      const dzn = Number(item.dzn || 0);
      const pks = Number(item.pks || 0);
      const packs = (ctn * (sku.unitsPerCarton || 0)) + (dzn * (sku.unitsPerDozen || 0)) + pks;
      const cartons = (sku.unitsPerCarton || 0) > 0 ? packs / sku.unitsPerCarton : 0;
      return sum + (isNaN(cartons) ? 0 : cartons);
    }, 0);
    totals[cat] = { value, unit };
  });
  return totals;
}

function getPSTDate() {
  return new Date(new Date().getTime() + (5 * 60 + 0) * 60000).toISOString().slice(0, 10);
}

function calculateTimeGone() {
  const pstDate = new Date(new Date().getTime() + (5 * 60 + 0) * 60000);
  const totalDays = new Date(pstDate.getFullYear(), pstDate.getMonth() + 1, 0).getDate();
  const daysGone = pstDate.getDate();
  
  // Assume 4 Sundays as non-working
  let sundays = 0;
  for (let i = 1; i <= totalDays; i++) {
    if (new Date(pstDate.getFullYear(), pstDate.getMonth(), i).getDay() === 0) sundays++;
  }
  
  let sundaysGone = 0;
  for (let i = 1; i <= daysGone; i++) {
    if (new Date(pstDate.getFullYear(), pstDate.getMonth(), i).getDay() === 0) sundaysGone++;
  }
  
  const totalWorkingDays = totalDays - sundays;
  const workingDaysGone = daysGone - sundaysGone;
  const timeGonePercent = totalWorkingDays > 0 ? workingDaysGone / totalWorkingDays : 0;
  
  return { workingDaysGone, totalWorkingDays, timeGonePercent };
}

async function runSync() {
  const spreadsheetId = (process.env.GOOGLE_SPREADSHEET_ID || '').trim().replace(/^\/+|\/+$/g, '');
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const db = new Database(DB_PATH);

  try {
    console.log("Starting Master Sync...");

    // 1. Pull Team Data (includes North Region targets)
    console.log("Pulling Team Data...");
    const teamRes = await sheets.spreadsheets.values.get({ spreadsheetId, range: "Team_Data!A1:AZ1000" });
    const teamRows = teamRes.data.values || [];
    const teamHeaders = teamRows[0] || [];
    const teamData = teamRows.slice(1);
    const targetMonth = getPSTDate().slice(0, 7);

    db.transaction(() => {
        for (const row of teamData) {
            const getVal = (names: string[]) => {
                for (const n of names) {
                    const idx = teamHeaders.findIndex(h => h.trim().toLowerCase() === n.toLowerCase());
                    if (idx > -1) return row[idx];
                }
                return null;
            };
            const contact = getVal(['ID', 'OB ID', 'Contact'])?.toString().trim();
            if (!contact) continue;

            const targets = {
                "Kite Glow": parseFloat(getVal(['Kite Glow Target'])) || 0,
                "Burq Action": parseFloat(getVal(['Burq Action Target'])) || 0,
                "Vero": parseFloat(getVal(['Vero Target'])) || 0,
                "DWB": parseFloat(getVal(['DWB Target'])) || 0,
                "Match": parseFloat(getVal(['Match Target'])) || 0
            };

            for (const [brand, tVal] of Object.entries(targets)) {
                if (tVal > 0) {
                    db.prepare(`
                      INSERT INTO brand_targets (ob_contact, brand_name, target_ctn, month)
                      VALUES (?, ?, ?, ?)
                      ON CONFLICT(ob_contact, brand_name, month) DO UPDATE SET target_ctn = excluded.target_ctn
                    `).run(contact, brand, tVal, targetMonth);
                }
            }
            
            // Update ob_assignments
            db.prepare(`
                UPDATE ob_assignments SET 
                name = ?, town = ?, distributor = ?, tsm = ?, zone = ?, region = ?, nsm = ?, rsm = ?, sc = ?, director = ?
                WHERE contact = ?
            `).run(
                getVal(['Name', 'OB Name']), getVal(['Town']), getVal(['Distributor']), getVal(['ASM/TSM', 'TSM']), 
                getVal(['Zone']), getVal(['Region']), getVal(['NSM']), getVal(['RSM']), getVal(['SC']), getVal(['Director']),
                contact
            );
        }
    })();

    // 2. Pull Sales History (Pulls FIXED sheet data back to DB)
    console.log("Pulling Sales History (from FIXED sheet)...");
    const salesRes = await sheets.spreadsheets.values.get({ spreadsheetId, range: "Sales_Data!A1:CZ2000" });
    const sRows = salesRes.data.values || [];
    const sHeaders = sRows[0].map((h: string) => h.trim().toLowerCase());
    const sData = sRows.slice(1);

    db.transaction(() => {
        for (const row of sData) {
            const getVal = (names: string[]) => {
                for (const n of names) {
                    const idx = sHeaders.indexOf(n.toLowerCase());
                    if (idx > -1) return row[idx];
                }
                return null;
            };
            const dateRaw = getVal(['Date']);
            const obContact = getVal(['OB Contact', 'contact'])?.toString().trim();
            const route = getVal(['Route'])?.toString().trim() || '';
            if (!dateRaw || !obContact) continue;

            let date = dateRaw.toString().trim();
            const dateParts = date.split(/[-/ ]/);
            if (dateParts.length >= 3) {
                if (dateParts[0].length === 4) {
                    date = `${dateParts[0]}-${dateParts[1].padStart(2, '0')}-${dateParts[2].padStart(2, '0')}`;
                } else if (dateParts[2].length === 4) {
                    let dd = dateParts[0];
                    let mm = dateParts[1];
                    const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
                    if (isNaN(parseInt(mm))) {
                        const mIdx = monthNames.findIndex(m => mm.toLowerCase().startsWith(m));
                        if (mIdx > -1) mm = (mIdx + 1).toString();
                    } else if (isNaN(parseInt(dd))) {
                        const mIdx = monthNames.findIndex(m => dd.toLowerCase().startsWith(m));
                        if (mIdx > -1) { mm = (mIdx + 1).toString(); dd = dateParts[1]; }
                    }
                    if (parseInt(mm) > 12) { const temp = dd; dd = mm; mm = temp; }
                    date = `${dateParts[2]}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
                }
            }

            // Simple convert logic identical to server.ts but safer for fixed decimals
            const orderData: Record<string, any> = {};
            SKUS.forEach(sku => {
                let raw = getVal([`${sku.name} (${sku.category})`, sku.name]);
                let val = parseFloat(raw) || 0;
                const upc = sku.unitsPerCarton || 1;
                const isSuspicious = Number.isInteger(val) && (
                    (val >= upc && upc > 1) || 
                    (val >= 20 && upc >= 24) ||
                    (val % upc === 0 && val > 0) ||
                    (val >= 48 && upc >= 12)
                );
                if (isSuspicious) val = val / upc;
                orderData[sku.id] = { ctn: val, dzn: 0, pks: 0 };
            });

            const catProdData: Record<string, number> = {};
            CATEGORIES.forEach(cat => {
                catProdData[cat] = parseInt(getVal([`${cat} Prod`])) || 0;
            });

            // For historical pull, we update if exists
            const existing = db.prepare("SELECT id FROM submitted_orders WHERE ob_contact = ? AND date = ? AND route = ?").get(obContact, date, route) as any;
            
            if (existing) {
                db.prepare(`
                    UPDATE submitted_orders SET 
                    order_data = ?, category_productive_data = ?, 
                    total_shops = ?, visited_shops = ?, productive_shops = ?
                    WHERE id = ?
                `).run(
                    JSON.stringify(orderData), JSON.stringify(catProdData),
                    parseInt(getVal(['Total Shops'])) || 0, parseInt(getVal(['Visited Shops'])) || 0, parseInt(getVal(['Productive Shops'])) || 0,
                    existing.id
                );
            }
        }
    })();

    // 3. Refresh Summary Sheets
    console.log("Refreshing Summary Sheets...");
    const orders = db.prepare("SELECT * FROM submitted_orders WHERE date LIKE ?").all(`${targetMonth}%`) as any[];
    const obs = db.prepare("SELECT * FROM ob_assignments").all() as any[];
    const timeInfo = calculateTimeGone();

    const achievementMap: Record<string, Record<string, number>> = {};
    orders.forEach(order => {
      const obContact = order.ob_contact;
      if (!achievementMap[obContact]) achievementMap[obContact] = {};
      const oData = JSON.parse(order.order_data);
      const oAch = calculateAchievement(oData);
      CATEGORIES.forEach(cat => {
        achievementMap[obContact][cat] = (achievementMap[obContact][cat] || 0) + (oAch[cat]?.value || 0);
      });
    });

    const targetRows: any[] = [];
    for (const ob of obs) {
      const row = [targetMonth, ob.town, ob.name, ob.contact, ob.tsm, ob.distributor, timeInfo.totalWorkingDays, timeInfo.workingDaysGone, (timeInfo.timeGonePercent * 100).toFixed(1) + '%'];
      let totalT = 0, totalTillDateT = 0, totalA = 0;
      for (const cat of CATEGORIES) {
        const obTarget = db.prepare("SELECT target_ctn FROM brand_targets WHERE ob_contact = ? AND brand_name = ? AND month = ?").get(ob.contact, cat, targetMonth) as any;
        const target = obTarget ? obTarget.target_ctn : 0;
        const tillDateTarget = target * timeInfo.timeGonePercent;
        const ach = achievementMap[ob.contact]?.[cat] || 0;
        if (cat !== 'Match') { totalT += target; totalTillDateT += tillDateTarget; totalA += ach; }
        row.push(target.toFixed(2), tillDateTarget.toFixed(2), ach.toFixed(2), tillDateTarget > 0 ? ((ach / tillDateTarget) * 100).toFixed(1) + '%' : '0%');
      }
      row.push(totalT.toFixed(2), totalTillDateT.toFixed(2), totalA.toFixed(2), totalTillDateT > 0 ? ((totalA / totalTillDateT) * 100).toFixed(1) + '%' : '0%');
      targetRows.push(row);
    }

    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "Targets_vs_Achievement!A2",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: targetRows }
    });

    console.log("Sync and Report Refresh complete!");

  } catch (err) {
    console.error("Sync Error:", err.message);
  }
}

runSync();

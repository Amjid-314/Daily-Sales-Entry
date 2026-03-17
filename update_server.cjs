const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Fix the syntax errors
code = code.replace(/role === 'TSM', 'ASM' \|\| role === 'ASM'/g, "(role === 'TSM' || role === 'ASM')");
code = code.replace(/role === 'TSM', 'ASM'/g, "(role === 'TSM' || role === 'ASM')");
code = code.replace(/req\.user\.role === 'TSM', 'ASM'/g, "(req.user.role === 'TSM' || req.user.role === 'ASM')");

// Fix the exact matches in server.ts for TSM and ASM
// For distributors
code = code.replace(/dists = db\.prepare\("SELECT \* FROM distributors WHERE tsm = \?"\)\.all\(name\);/g, `
        const trimmedName = (name || '').trim().toLowerCase();
        const allDists = db.prepare("SELECT * FROM distributors").all();
        dists = allDists.filter((d: any) => {
          const tsmName = (d.tsm || '').trim().toLowerCase();
          return tsmName === trimmedName || tsmName.includes(trimmedName) || trimmedName.includes(tsmName);
        });
`);

// For orders
code = code.replace(/query \+= " AND \(tsm = \? OR ob_contact LIKE 'TSM-%'\)";\n        params\.push\(name\);/g, `
        // We need to fetch all and filter in memory for fuzzy match, or use LIKE in SQL
        query += " AND (tsm LIKE ? OR tsm LIKE ? OR tsm = ? OR ob_contact LIKE 'TSM-%')";
        params.push('%' + name + '%', name + '%', name);
`);

// For stocks
code = code.replace(/query \+= " AND tsm = \?";\n        params\.push\(name\);/g, `
        query += " AND (tsm LIKE ? OR tsm LIKE ? OR tsm = ?)";
        params.push('%' + name + '%', name + '%', name);
`);

// For daily-status
code = code.replace(/allOBs = allOBs\.filter\(ob => ob\.tsm === req\.user\.name\);/g, `
        const trimmedName = (req.user.name || '').trim().toLowerCase();
        allOBs = allOBs.filter((ob: any) => {
          const tsmName = (ob.tsm || '').trim().toLowerCase();
          return tsmName === trimmedName || tsmName.includes(trimmedName) || trimmedName.includes(tsmName);
        });
`);

// For submit-order
code = code.replace(/if \(\(req\.user\.role === 'TSM' \|\| req\.user\.role === 'ASM'\) && tsm !== req\.user\.name\) \{/g, `
      const trimmedTsm = (tsm || '').trim().toLowerCase();
      const trimmedName = (req.user.name || '').trim().toLowerCase();
      const isMatch = trimmedTsm === trimmedName || trimmedTsm.includes(trimmedName) || trimmedName.includes(trimmedTsm);
      if ((req.user.role === 'TSM' || req.user.role === 'ASM') && !isMatch) {
`);

// For hierarchy
code = code.replace(/rows = db\.prepare\("SELECT \* FROM national_hierarchy WHERE asm_tsm_name = \?"\)\.all\(name\);/g, `
        const trimmedName = (name || '').trim().toLowerCase();
        const allRows = db.prepare("SELECT * FROM national_hierarchy").all();
        rows = allRows.filter((r: any) => {
          const tsmName = (r.asm_tsm_name || '').trim().toLowerCase();
          return tsmName === trimmedName || tsmName.includes(trimmedName) || trimmedName.includes(tsmName);
        });
`);

fs.writeFileSync('server.ts', code);
console.log('server.ts updated');

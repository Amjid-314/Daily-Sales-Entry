const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace userRole === 'TSM'
code = code.replace(/userRole === 'TSM'/g, "(userRole === 'TSM' || userRole === 'ASM')");

// Replace role === 'TSM'
code = code.replace(/role === 'TSM'/g, "(role === 'TSM' || role === 'ASM')");

// Replace normalizedRole === 'TSM'
code = code.replace(/normalizedRole === 'TSM'/g, "(normalizedRole === 'TSM' || normalizedRole === 'ASM')");

// Add ASM to role arrays
code = code.replace(/'TSM', 'OB'/g, "'TSM', 'ASM', 'OB'");
code = code.replace(/'TSM', 'RSM'/g, "'TSM', 'ASM', 'RSM'");
code = code.replace(/'TSM', 'SC'/g, "'TSM', 'ASM', 'SC'");
code = code.replace(/'SC', 'TSM'/g, "'SC', 'TSM', 'ASM'");
code = code.replace(/'DIRECTOR', 'SC', 'TSM'/g, "'DIRECTOR', 'SC', 'TSM', 'ASM'");

// Add ASM to types
code = code.replace(/'Super Admin' \| 'Admin' \| 'TSM' \| 'OB'/g, "'Super Admin' | 'Admin' | 'TSM' | 'ASM' | 'OB'");

// Add ASM to normalizeRole
code = code.replace(/if \(r === 'TSM'\) return 'TSM';/g, "if (r === 'TSM') return 'TSM';\n    if (r === 'ASM') return 'ASM';");

// Add ASM to select options
code = code.replace(/<option value="TSM">TSM<\/option>/g, '<option value="TSM">TSM</option>\n                    <option value="ASM">ASM</option>');

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx updated');

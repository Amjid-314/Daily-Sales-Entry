const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Fix localStorage.clear()
code = code.replace(/localStorage\.clear\(\);/g, "localStorage.removeItem('auth_token');\n    localStorage.removeItem('user_data');");

// Fix MainNavWithRole
code = code.replace(/const MainNavWithRole = \(\) => <MainNav view=\{view\} setView=\{setView\} role=\{userRole\} onLogout=\{handleLogout\} \/>;/g, "");
code = code.replace(/<MainNavWithRole \/>/g, "<MainNav view={view} setView={setView} role={userRole} onLogout={handleLogout} />");

fs.writeFileSync('src/App.tsx', code);
console.log('App.tsx updated');

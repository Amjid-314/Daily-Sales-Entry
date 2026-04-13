const fs = require('fs');
const path = require('path');

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach(function(childItemName) {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

const backupDir = './Backup_2026-04-12_09-20';
fs.mkdirSync(backupDir, { recursive: true });
copyRecursiveSync('./src', path.join(backupDir, 'src'));
fs.copyFileSync('./server.ts', path.join(backupDir, 'server.ts'));
fs.copyFileSync('./package.json', path.join(backupDir, 'package.json'));
fs.copyFileSync('./index.html', path.join(backupDir, 'index.html'));
fs.copyFileSync('./vite.config.ts', path.join(backupDir, 'vite.config.ts'));
fs.copyFileSync('./tsconfig.json', path.join(backupDir, 'tsconfig.json'));
console.log('Backup completed successfully.');

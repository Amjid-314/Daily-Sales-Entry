const jwt = require('jsonwebtoken');
const http = require('http');

const token = jwt.sign({ id: 1, email: 'amjid.bisconni@gmail.com', role: 'Super Admin', name: 'Muhammad Amjid' }, process.env.JWT_SECRET || 'salespulse-secret-key-2026');

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/run-backup',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data));
});

req.end();

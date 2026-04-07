const http = require('http');
const postData = JSON.stringify({ month: '2026-04' });
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/google/sync',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': postData.length
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      console.log(JSON.stringify(JSON.parse(data), null, 2));
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (err) => {
  console.error("Error:", err.message);
});

req.write(postData);
req.end();

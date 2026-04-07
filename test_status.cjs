const fetch = require('node-fetch');
async function checkStatus() {
  try {
    const res = await fetch('http://localhost:3000/api/google/status');
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error fetching status:", err);
  }
}
checkStatus();

import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

const token = jwt.sign({
  id: 1,
  email: 'amjid.bisconni@gmail.com',
  role: 'Super Admin',
  name: 'Muhammad Amjid',
  contact: '03000000000'
}, process.env.JWT_SECRET || "salespulse-secret-key-2026", { expiresIn: '1h' });

async function test() {
  const res = await fetch('http://localhost:3000/api/national/stats', {
    headers: {
      'Authorization': 'Bearer ' + token
    }
  });
  console.log(res.status);
  const data = await res.json();
  console.log("Stats count:", data.stats?.length);
  console.log("Hierarchy count:", data.hierarchy?.length);
}
test();





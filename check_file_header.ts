import fs from 'fs';
const buf = fs.readFileSync('orders.db.corrupt.1776490578684').slice(0, 100);
console.log(buf.toString('hex'));
console.log(buf.toString('utf8'));

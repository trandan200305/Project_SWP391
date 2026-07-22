const fs = require('fs');
let content = fs.readFileSync('src/features/admin/pages/AdminDashboardPage.jsx', 'utf8');

// Replace the emoji and text
content = content.replace(/Cấu hình VNPay/g, 'Cấu hình PayOS');

// Save it back
fs.writeFileSync('src/features/admin/pages/AdminDashboardPage.jsx', content, 'utf8');
console.log('Replaced VNPay in activity logs filter');

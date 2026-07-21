const fs = require('fs');
let content = fs.readFileSync('src/features/admin/pages/AdminDashboardPage.jsx', 'utf8');

// Replace the text globally (case-insensitive) in the JSX strings
content = content.replace(/Truy vấn VNPay/g, 'Truy vấn PayOS');
content = content.replace(/Cấu hình VNPay/g, 'Cấu hình PayOS');

// Save it back
fs.writeFileSync('src/features/admin/pages/AdminDashboardPage.jsx', content, 'utf8');
console.log('Replaced all remaining VNPay strings');

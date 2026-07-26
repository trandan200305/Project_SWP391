const fs = require('fs');
let content = fs.readFileSync('src/features/admin/pages/AdminDashboardPage.jsx', 'utf8');

// Remove the line entirely
content = content.replace(/.*value: 'UPDATE_VNPAY_CONFIG'.*\n?/g, '');

// Save it back
fs.writeFileSync('src/features/admin/pages/AdminDashboardPage.jsx', content, 'utf8');
console.log('Removed UPDATE_VNPAY_CONFIG option entirely from filters');

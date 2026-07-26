const fs = require('fs');
let content = fs.readFileSync('src/features/admin/pages/AdminDashboardPage.jsx', 'utf8');
content = content.replace(
    /adminApi\.getVnpayTransactions\(\)/g,
    "adminApi.getVnpayTransactions(vnpayPage, 10)"
);
fs.writeFileSync('src/features/admin/pages/AdminDashboardPage.jsx', content, 'utf8');
console.log('Fixed pagination arguments');

const fs = require('fs');
let content = fs.readFileSync('src/features/admin/pages/ManagerDashboardPage.jsx', 'utf8');
content = content.replace(
    /Quản lý và đối soát các giao dịch thanh toán từ ví VNPay/g,
    "Quản lý và đối soát các giao dịch thanh toán từ ví PayOS"
);
fs.writeFileSync('src/features/admin/pages/ManagerDashboardPage.jsx', content, 'utf8');

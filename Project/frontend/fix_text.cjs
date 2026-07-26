const fs = require('fs');

function replaceFileContent(filePath, searchRegex, replaceStr) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.match(searchRegex)) {
        content = content.replace(searchRegex, replaceStr);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated', filePath);
    }
}

replaceFileContent('src/features/admin/pages/AdminDashboardPage.jsx', /Cài đặt tham số kết nối VNPay \/ VietQR/g, "Cài đặt tham số kết nối VietQR (PayOS)");
replaceFileContent('src/features/admin/pages/AdminDashboardPage.jsx', /cấu hình kết nối VNPay/g, "cấu hình kết nối PayOS");
replaceFileContent('src/features/admin/pages/AdminDashboardPage.jsx', /Cấu hình Gói Dịch vụ & Cổng Thanh toán \(VNPay \/ PayOS\)/g, "Cấu hình Gói Dịch vụ & Cổng Thanh toán (PayOS)");


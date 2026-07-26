const fs = require('fs');

function replaceUI(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // AdminDashboardPage.jsx text replacements
    content = content.replace(/Cấu hình Cổng Thanh toán VNPay \/ VietQR/g, "Cấu hình Cổng Thanh toán VietQR (PayOS)");
    content = content.replace(/Cấu hình Gói Dịch vụ & Cổng Thanh toán \(VNPay \/ PayOS\)/g, "Cấu hình Gói Dịch vụ & Cổng Thanh toán (PayOS)");
    content = content.replace(/cấu hình kết nối VNPay/g, "cấu hình kết nối PayOS");
    content = content.replace(/cấu hình VNPay/g, "cấu hình PayOS");
    content = content.replace(/giao dịch VNPay/gi, "giao dịch PayOS");
    content = content.replace(/thanh toán VNPay/gi, "thanh toán PayOS");
    content = content.replace(/kết nối VNPay/g, "kết nối PayOS");
    content = content.replace(/<option value="VNPAY">Ví VNPAY<\/option>/g, "");
    content = content.replace(/Thử VNPay/g, "Thử PayOS");
    content = content.replace(/Đối soát giao dịch VNPay/g, "Đối soát giao dịch PayOS");

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated', filePath);
}

replaceUI('src/features/admin/pages/AdminDashboardPage.jsx');
replaceUI('src/features/admin/pages/ManagerDashboardPage.jsx');
replaceUI('src/features/admin/pages/StaffDashboardPage.jsx');


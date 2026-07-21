const fs = require('fs');
const path = require('path');

const walk = function(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.jsx') || file.endsWith('.js')) {
                results.push(file);
            }
        }
    });
    return results;
};

const files = walk('src');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Use regex to avoid strict string match issues with unicode
    const replacements = [
        [/Cấu hình Cổng Thanh toán VNPay \/ VietQR/g, 'Cấu hình Cổng Thanh toán VietQR (PayOS)'],
        [/<option value="VNPAY">Ví VNPAY<\/option>/g, ''],
        [/cấu hình kết nối VNPay/g, 'cấu hình kết nối PayOS'],
        [/Đối soát giao dịch VNPay/g, 'Đối soát giao dịch PayOS'],
        [/thanh toán từ ví VNPay/g, 'thanh toán từ PayOS'],
        [/Mã GD VNPay/g, 'Mã Giao dịch'],
        [/khởi tạo VNPay:/g, 'khởi tạo thanh toán:'],
        [/VNPay Info/g, 'PayOS Info'],
        [/VietQR and VNPay now share/g, 'VietQR (PayOS) now uses'],
        [/Thử VNPay/g, 'Thử PayOS']
    ];

    replacements.forEach(([search, replace]) => {
        if (content.match(search)) {
            content = content.replace(search, replace);
            changed = true;
        }
    });

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Updated', file);
    }
});

const fs = require('fs');

function restoreFinanceHistory(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    if (!content.includes("{ id: 'finance_history', icon: Receipt, label: 'Lịch sử Giao dịch' }")) {
        content = content.replace(
            "{ id: 'finance_banking', icon: Landmark, label: 'Cấu hình Ngân hàng' },",
            "{ id: 'finance_banking', icon: Landmark, label: 'Cấu hình Ngân hàng' },\n                  { id: 'finance_history', icon: Receipt, label: 'Lịch sử Giao dịch' }"
        );
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Restored finance_history tab to AdminDashboardPage.jsx');
    } else {
        console.log('finance_history already exists in AdminDashboardPage.jsx');
    }
}

function restoreFailedTransactions(filePath, label) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes(label)) {
        if (filePath.includes('StaffDashboardPage')) {
            content = content.replace(
                "{ id: 'Refunds', label: 'Hoàn tiền', icon: BadgeDollarSign },",
                "{ id: 'Refunds', label: 'Hoàn tiền', icon: BadgeDollarSign },\n        { id: 'FailedTransactions', label: 'Giao dịch lỗi', icon: AlertTriangle, badge: failedTransactionCount }"
            );
        } else if (filePath.includes('ManagerDashboardPage')) {
             content = content.replace(
                "{ name: 'Refunds', label: 'Hoàn tiền', icon: BadgeDollarSign },",
                "{ name: 'Refunds', label: 'Hoàn tiền', icon: BadgeDollarSign },\n                      { name: 'FailedTransactions', label: 'Giao dịch lỗi', icon: AlertTriangle }"
            );
        }
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Restored FailedTransactions tab to', filePath);
    } else {
        console.log('FailedTransactions already exists in', filePath);
    }
}


restoreFinanceHistory('src/features/admin/pages/AdminDashboardPage.jsx');
restoreFailedTransactions('src/features/admin/pages/StaffDashboardPage.jsx', "{ id: 'FailedTransactions', label: 'Giao dịch lỗi', icon: AlertTriangle, badge: failedTransactionCount }");
restoreFailedTransactions('src/features/admin/pages/ManagerDashboardPage.jsx', "{ name: 'FailedTransactions', label: 'Giao dịch lỗi', icon: AlertTriangle }");



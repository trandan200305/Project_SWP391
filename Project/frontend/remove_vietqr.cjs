const fs = require('fs');
let content = fs.readFileSync('src/features/admin/pages/AdminDashboardPage.jsx', 'utf8');

// 1. Remove the entire "Cấu hình Cổng Thanh toán VietQR (PayOS)" div block
// Let's find the start index of the block
let startPattern = <h3 className="font-bold text-primary text-lg">Cấu hình Cổng Thanh toán VietQR (PayOS)</h3>;
let startIndex = content.indexOf(startPattern);

if (startIndex !== -1) {
    // Backtrack to the start of the <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
    // which contains this h3
    let divStartPattern = <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">;
    let divStartIndex = content.lastIndexOf(divStartPattern, startIndex);
    
    // Find the next block which is "Cấu hình Gói Dịch Vụ"
    let endPattern = <h4 className="font-extrabold text-slate-800 text-[15px]">Cấu hình Gói Dịch Vụ & Cổng Thanh toán;
    let endIndex = content.indexOf(endPattern);
    
    if (divStartIndex !== -1 && endIndex !== -1) {
        // Backtrack from endPattern to find its parent div to make a clean cut
        // We will just cut from divStartIndex to the div just before the endPattern block.
        // Actually, it's safer to find the </div> that closes the VietQR block.
        // The VietQR block ends right before <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        // which contains the next section.
        let nextDivStart = content.lastIndexOf(divStartPattern, endIndex);
        if (nextDivStart > divStartIndex) {
             content = content.substring(0, divStartIndex) + content.substring(nextDivStart);
             console.log("Removed VietQR configuration block successfully.");
        } else {
             console.log("Could not find the end of the VietQR configuration block.");
        }
    }
}

// 2. Remove the "Hiển thị mã VietQR" button
let btnStartPattern = <button \n                                    onClick={() => setShowQrZoomModal(true)};
let btnIndex = content.indexOf("Hiển thị mã VietQR");
if (btnIndex !== -1) {
    // Find the nearest <button before it
    let buttonStart = content.lastIndexOf("<button", btnIndex);
    let buttonEnd = content.indexOf("</button>", btnIndex) + "</button>".length;
    if (buttonStart !== -1 && buttonEnd !== -1) {
        content = content.substring(0, buttonStart) + content.substring(buttonEnd);
        console.log("Removed VietQR button successfully.");
    }
}

fs.writeFileSync('src/features/admin/pages/AdminDashboardPage.jsx', content, 'utf8');


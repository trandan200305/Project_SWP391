const fs = require('fs');
const filePath = 'c:/Users/admin/Downloads/Project_SWP391/Project_SWP391/Project/frontend/src/features/admin/pages/AdminDashboardPage.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const targetString = `          {activeTab === 'dashboard' && (
            <div className="animate-in fade-in duration-300">
              {/* Sub-Tabs Navigation */}
              <div className="flex justify-center mb-8">
                <div className="radio-inputs">
                  <label className="radio">
                    <input type="radio" name="dashboardTab" checked={dashboardSubTab === 'overview'} onChange={() => setDashboardSubTab('overview')} />
                    <span className="name">Tổng quan & Cảnh báo</span>
                  </label>
                  <label className="radio">
                    <input type="radio" name="dashboardTab" checked={dashboardSubTab === 'financials'} onChange={() => setDashboardSubTab('financials')} />
                    <span className="name">Biểu đồ & Tài chính</span>
                  </label>
                  <label className="radio">
                    <input type="radio" name="dashboardTab" checked={dashboardSubTab === 'activity'} onChange={() => setDashboardSubTab('activity')} />
                    <span className="name">Nhật ký Hoạt động</span>
                  </label>
                </div>
              </div>`;

// Account for CRLF
const targetStringCRLF = targetString.replace(/\n/g, '\r\n');

const replacement = `          {activeTab.startsWith('dashboard_') && (
            <div className="animate-in fade-in duration-300">`;

if (content.includes(targetString)) {
    content = content.replace(targetString, replacement);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Replaced using LF');
} else if (content.includes(targetStringCRLF)) {
    content = content.replace(targetStringCRLF, replacement.replace(/\n/g, '\r\n'));
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Replaced using CRLF');
} else {
    console.log('Target string not found');
}

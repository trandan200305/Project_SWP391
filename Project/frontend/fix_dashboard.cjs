const fs = require('fs');
const path = 'src/features/admin/pages/AdminDashboardPage.jsx';
let content = fs.readFileSync(path, 'utf-8');

// 1. Update menuStructure
content = content.replace(
  "{ id: 'dashboard', icon: LayoutDashboard, label: 'Báo cáo Hệ thống' }",
  "{ id: 'dashboard_overview', icon: AlertTriangle, label: 'Tổng quan & Cảnh báo' },\n                  { id: 'dashboard_financials', icon: BadgeDollarSign, label: 'Biểu đồ & Tài chính' },\n                  { id: 'dashboard_activity', icon: Activity, label: 'Nhật ký Hoạt động' }"
);

// 2. Update h1 header
content = content.replace(
  "{activeTab === 'dashboard' && <><Settings className=\"w-6 h-6 text-blue-600\" /> Báo cáo & Thống kê Tổng quan</>}",
  "{activeTab === 'dashboard_overview' && <><AlertTriangle className=\"w-6 h-6 text-blue-600\" /> Tổng quan & Cảnh báo</>}\n              {activeTab === 'dashboard_financials' && <><BadgeDollarSign className=\"w-6 h-6 text-blue-600\" /> Biểu đồ & Tài chính</>}\n              {activeTab === 'dashboard_activity' && <><Activity className=\"w-6 h-6 text-blue-600\" /> Nhật ký Hoạt động</>}"
);

// 3. Update description
content = content.replace(
  "{activeTab === 'dashboard' && 'High-precision tracking of system registrations, escrow transaction distributions, and commissions.'}",
  "{activeTab === 'dashboard_overview' && 'Giám sát các chỉ số tổng quan, tranh chấp và công việc cần xử lý ngay.'}\n              {activeTab === 'dashboard_financials' && 'High-precision tracking of system registrations, escrow transaction distributions, and commissions.'}\n              {activeTab === 'dashboard_activity' && 'Theo dõi các hoạt động mới nhất trên hệ thống theo thời gian thực.'}"
);

// 4. Update refresh button
content = content.replace(
  "{activeTab === 'dashboard' && (\n              <button \n                onClick={loadDashboardData}",
  "{activeTab?.startsWith('dashboard_') && (\n              <button \n                onClick={loadDashboardData}"
);

// 5. Update the main render wrapper
content = content.replace(
  "{activeTab === 'dashboard' && (\n            <div className=\"animate-in fade-in duration-300\">",
  "{activeTab?.startsWith('dashboard_') && (\n            <div className=\"animate-in fade-in duration-300\">"
);

// 6. Remove the radio buttons completely
const subTabsRegex = /\{\/\* Sub-Tabs Navigation \*\/\}(.|\n)*?<\/div>\s*<\/div>/m;
content = content.replace(subTabsRegex, '');

// 7. Update the sub-tab conditions
content = content.replaceAll(
  "{dashboardSubTab === 'overview' && (",
  "{activeTab === 'dashboard_overview' && ("
);
content = content.replaceAll(
  "{dashboardSubTab === 'financials' && (",
  "{activeTab === 'dashboard_financials' && ("
);
content = content.replaceAll(
  "{dashboardSubTab === 'activity' && (",
  "{activeTab === 'dashboard_activity' && ("
);

fs.writeFileSync(path, content, 'utf-8');
console.log('Done replacing!');

const fs = require('fs');
const path = 'c:/Users/admin/Downloads/Project_SWP391/Project_SWP391/Project/frontend/src/features/admin/pages/AdminDashboardPage.jsx';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/\{dashboardSubTab === '([^']+)' && \(/g, '{dashboardSubTab === \ && (<>');
content = content.replace(/\)\}/g, '</>)}');
fs.writeFileSync(path, content);
console.log('Fixed syntax!');

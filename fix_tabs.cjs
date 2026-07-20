const fs = require('fs');

['AdminOverviewTab.jsx', 'AdminFinancialsTab.jsx'].forEach(file => {
  const path = 'c:/Users/admin/Downloads/Project_SWP391/Project_SWP391/Project/frontend/src/features/admin/components/' + file;
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/<\/div>\r?\n(\s*<div className="mt-8 animate-in slide-in-from-bottom-4 duration-500)/, '\n$1');
  fs.writeFileSync(path, content);
  console.log('Fixed', file);
});

const fs = require('fs');
const csvFile = 'Admin_System_Test_Cases.csv';
const mdFile = 'Admin_Test_Cases_Manual_Copy.md';

const content = fs.readFileSync(csvFile, 'utf8');

// Basic CSV parser
function parseCSV(text) {
    let result = [];
    let row = [];
    let inQuotes = false;
    let val = '';
    
    for (let i = 0; i < text.length; i++) {
        let c = text[i];
        if (c === '"') {
            inQuotes = !inQuotes;
        } else if (c === ',' && !inQuotes) {
            row.push(val);
            val = '';
        } else if (c === '\n' && !inQuotes) {
            row.push(val);
            result.push(row);
            row = [];
            val = '';
        } else if (c === '\r' && !inQuotes) {
            // ignore
        } else {
            val += c;
        }
    }
    if (val !== '' || row.length > 0) {
        row.push(val);
        result.push(row);
    }
    return result;
}

const records = parseCSV(content);
// records[0] is header: Test Case ID, Module, Function, Description, Input, Expected Result, Status, Note
records.shift();

let groups = {
    'Auth_Security': [],
    'Staff_Workspaces': [],
    'Manager_Workspaces': [],
    'ROLE ADMIN (Tính năng độc quyền)': []
};

records.forEach(r => {
    if (r.length < 5) return;
    const [tcId, moduleName, func, desc, inputData, expected] = r;
    
    let target = 'ROLE ADMIN (Tính năng độc quyền)';
    if (moduleName === 'Authentication') target = 'Auth_Security';
    else if (moduleName === 'System Admin' && func.includes('Staff')) target = 'Staff_Workspaces';
    else if (moduleName === 'System Admin' && func.includes('Manager')) target = 'Manager_Workspaces';
    else if (moduleName === 'System Admin' && func.includes('Password')) target = 'Auth_Security';

    const mergedDesc = `[${moduleName}] ${func}`;
    const steps = desc.replace(/\n/g, ' <br> ') + (inputData && inputData !== 'N/A' ? ` <br><br> **Input:** ${inputData.replace(/\n/g, ' ')}` : '');
    const exp = expected.replace(/\n/g, ' <br> ');

    groups[target].push(`| ${tcId} | ${mergedDesc} | ${steps} | ${exp} | Admin is logged in | | | |`);
});

let mdContent = `# TỔNG HỢP TEST CASES CHO ROLE ADMIN\n\nBạn hãy mở file Excel của bạn ra, tìm đến các Sheet tương ứng ở dưới đây, copy các bảng này và dán đè (Paste) vào phần nội dung Test Cases nhé.\n\n`;

for (const [groupName, rows] of Object.entries(groups)) {
    if (rows.length === 0) continue;
    mdContent += `## 📋 Dành cho Sheet: **${groupName}**\n\n`;
    mdContent += `*Hãy bôi đen và copy bảng dưới đây (từ cột Test Case ID đến cột Tester) và dán vào dòng trống ở sheet ${groupName}:*\n\n`;
    mdContent += `| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions | Round 1 | Test date | Tester |\n`;
    mdContent += `|---|---|---|---|---|---|---|---|\n`;
    mdContent += rows.join('\n') + '\n\n---\n\n';
}

fs.writeFileSync(mdFile, mdContent, 'utf8');
console.log('Done!');

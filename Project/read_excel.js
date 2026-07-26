const xlsx = require('xlsx');

// read file
const filePath = 'E:\\KYC\\6. Weekly Report\\6. Weekly Report.xlsx';
const workbook = xlsx.readFile(filePath);

// print sheets and a few rows
workbook.SheetNames.forEach((sheetName, idx) => {
    if (idx > 2) return; // just first 3 to get an idea
    console.log(`\n--- Sheet: ${sheetName} ---`);
    const sheet = workbook.Sheets[sheetName];
    const json = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    json.slice(0, 15).forEach((row, rowIndex) => {
        console.log(`Row ${rowIndex}: ${JSON.stringify(row)}`);
    });
});

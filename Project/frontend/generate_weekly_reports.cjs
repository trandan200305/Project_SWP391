const ExcelJS = require('exceljs');
const path = require('path');

const aiReportPath = path.join('c:/Users/admin/Downloads/Project_SWP391/Project_SWP391/Project/Tai_lieu_bao_cao/Template5_AI Usage Report (1).xlsx');
const weeklyReportPath = path.join('c:/Users/admin/Downloads/Project_SWP391/Project_SWP391/Project/Tai_lieu_bao_cao/Template6_Weekly Report.xlsx');

async function generateReports() {
  const aiWb = new ExcelJS.Workbook();
  await aiWb.xlsx.readFile(aiReportPath);

  const weeklyWb = new ExcelJS.Workbook();
  await weeklyWb.xlsx.readFile(weeklyReportPath);

  const templateSheet = weeklyWb.getWorksheet('Wx');
  if (!templateSheet) {
    console.error('Could not find template sheet "Wx".');
    return;
  }

  // Extract data from AI Report
  const weeksData = {};
  for (let i = 1; i <= 10; i++) {
    const sheetName = i === 1 ? '1. Week 1' : i === 2 ? '2. Week 2' : i === 3 ? '3. Week 3' : i === 4 ? '4. Week 4' : i === 5 ? '5. Week 5' : 'Week ' + i;
    const aiSheet = aiWb.getWorksheet(sheetName);
    if (!aiSheet) continue;

    const tasks = [];
    const issues = [];
    aiSheet.eachRow((row, rowNumber) => {
      if (rowNumber < 2) return; // skip header
      if (!row.getCell(1).value) return; // skip empty

      const taskName = row.getCell(3).value; // Task
      const issue = row.getCell(10).value; // Limitation/Issue

      if (taskName) tasks.push(taskName);
      if (issue && issue !== 'Không có hạn chế.') issues.push(issue);
    });
    weeksData[i] = { tasks, issues };
  }

  for (let i = 1; i <= 10; i++) {
    const weekName = 'W' + i;
    
    // Check if sheet exists, if so, delete it
    const existingSheet = weeklyWb.getWorksheet(weekName);
    if (existingSheet) {
      weeklyWb.removeWorksheet(existingSheet.id);
    }

    const newSheet = weeklyWb.addWorksheet(weekName);
    
    // Copy column widths
    for (let c = 1; c <= templateSheet.columnCount; c++) {
      newSheet.getColumn(c).width = templateSheet.getColumn(c).width;
    }

    let currentRowIdx = 1;

    // Helper to write a section
    const writeRow = (values, bold = false, fill = null, alignCenter = false) => {
      const row = newSheet.getRow(currentRowIdx++);
      row.values = values;
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        if (colNumber > 1 && colNumber <= 6 && values[colNumber]) {
          cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
          cell.alignment = { vertical: 'middle', horizontal: alignCenter ? 'center' : 'left', wrapText: true };
          if (bold) cell.font = { bold: true };
          if (fill) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } };
        }
      });
      return row;
    };

    // Header
    newSheet.getCell('B1').value = 'WEEKLY REPORT';
    newSheet.getCell('B1').font = { bold: true, size: 14 };
    newSheet.getCell('B1').alignment = { horizontal: 'center' };
    newSheet.mergeCells('B1:F1');
    currentRowIdx++;

    newSheet.getCell('B2').value = 'Group';
    newSheet.getCell('C2').value = 'SWP391 - Freelance Marketplace (LancerPro)';
    newSheet.getCell('B3').value = 'Week';
    newSheet.getCell('C3').value = 'Tuần ' + i;
    currentRowIdx += 2;

    const data = weeksData[i] || { tasks: [], issues: [] };
    const nextData = weeksData[i + 1] || { tasks: ['Hoàn thiện tài liệu và kiểm thử tổng thể'], issues: [] };

    // I. Status Report
    newSheet.getCell('B' + currentRowIdx).value = 'I. Status Report';
    newSheet.getCell('B' + currentRowIdx).font = { bold: true };
    currentRowIdx++;

    writeRow([null, '#', 'Project Task', 'In-charge', 'Status', 'Notes'], true, 'FFD9D9D9', true);
    
    data.tasks.forEach((task, idx) => {
      writeRow([null, idx + 1, task, 'Admin (Thanh)', 'Done', 'Hoàn thành theo đúng yêu cầu nghiệp vụ']);
    });

    currentRowIdx++;

    // II. Project Issues
    newSheet.getCell('B' + currentRowIdx).value = 'II. Project Issues';
    newSheet.getCell('B' + currentRowIdx).font = { bold: true };
    currentRowIdx++;

    writeRow([null, '#', 'Project Issue', 'Owner', 'Status', 'Notes (Solution, Suggestion, etc.)'], true, 'FFD9D9D9', true);
    
    if (data.issues.length === 0) {
      writeRow([null, 1, 'Không có issue nghiêm trọng', 'Team', 'Resolved', 'Hệ thống vận hành trơn tru']);
    } else {
      data.issues.slice(0, 3).forEach((issue, idx) => { // limit to 3 issues
        writeRow([null, idx + 1, issue.substring(0, 50) + '...', 'Admin (Thanh) & AI', 'Resolved', issue]);
      });
    }

    currentRowIdx++;

    // III. Next Week Plan
    newSheet.getCell('B' + currentRowIdx).value = 'III. Next Week Plan';
    newSheet.getCell('B' + currentRowIdx).font = { bold: true };
    currentRowIdx++;

    writeRow([null, '#', 'Project Task', 'In-charge', 'Deadline', 'Notes (Task Details, etc.)'], true, 'FFD9D9D9', true);
    
    nextData.tasks.slice(0, 4).forEach((task, idx) => {
      writeRow([null, idx + 1, task, 'Admin (Thanh)', 'End of Week', 'Theo kế hoạch Sprint']);
    });

    currentRowIdx++;

    // IV. Other Matters
    newSheet.getCell('B' + currentRowIdx).value = 'IV. Other Project Masters/Suggestions';
    newSheet.getCell('B' + currentRowIdx).font = { bold: true };
    currentRowIdx++;

    writeRow([null, '#', 'Project Matter/Suggestions', 'Raised By', 'Date', 'Notes'], true, 'FFD9D9D9', true);
    writeRow([null, 1, 'Cần tổ chức code review chéo (Cross-review) giữa nhánh Admin và Employer', 'Admin', 'Weekly', 'Đảm bảo không bị conflict khi merge nhánh']);
  }

  await weeklyWb.xlsx.writeFile(weeklyReportPath);
  console.log('Successfully generated Weekly Reports W1 to W10!');
}

generateReports().catch(console.error);

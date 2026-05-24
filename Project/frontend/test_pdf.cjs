const { jsPDF } = require('jspdf');
require('jspdf-autotable');

try {
  const doc = new jsPDF('landscape');
  doc.setFontSize(16);
  doc.text("DANH SACH", 14, 15);
  doc.autoTable({
    head: [['ID', 'Name']],
    body: [['1', 'Minh']],
    startY: 20
  });
  const output = doc.output();
  console.log("PDF length:", output.length);
} catch (e) {
  console.error("ERROR:", e);
}

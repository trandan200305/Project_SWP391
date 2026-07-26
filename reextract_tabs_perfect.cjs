const fs = require('fs');

const sourcePath = 'c:/Users/admin/Downloads/Project_SWP391/Project_SWP391/HEAD_AdminDashboardPage.jsx';
const targetDir = 'c:/Users/admin/Downloads/Project_SWP391/Project_SWP391/Project/frontend/src/features/admin/components/';

const lines = fs.readFileSync(sourcePath, 'utf8').split(/\r?\n/);

const blocks = {
  'AdminOverviewTab.jsx': [
    { start: 3067, end: 3203 }, // ov1: line 3068 to 3203
    { start: 3414, end: 3539 } // ov2: line 3415 to 3539
  ],
  'AdminActivityTab.jsx': [
    { start: 3207, end: 3252 }, // act1: line 3208 to 3252
    { start: 3608, end: 3673 } // act2: line 3609 to 3673
  ],
  'AdminFinancialsTab.jsx': [
    { start: 3256, end: 3411 }, // fin1: line 3257 to 3411
    { start: 3555, end: 3604 } // fin2: line 3556 to 3604
  ]
};

for (const [file, ranges] of Object.entries(blocks)) {
  const fileName = file;
  let fileContent = 'import React from "react";\nimport { Users, Briefcase, FileText, CheckCircle, AlertCircle, ArrowUpRight, Plus, RefreshCw, MoreHorizontal, Download, Filter, ChevronLeft, ChevronRight, Check, X, Shield, Clock, Search, ExternalLink, Zap, Activity, HelpCircle, FileCheck, Eye, Trash2, ArrowRight } from "lucide-react";\n\nexport default function ' + fileName.replace('.jsx', '') + '({\n  dashboardSubTab,\n  setDashboardSubTab,\n  stats,\n  compareMode,\n  setCompareMode,\n  dateRange,\n  setDateRange,\n  revenueChartMode,\n  setRevenueChartMode,\n  revenueTrend,\n  userGrowthTrend,\n  chartWidth,\n  getSvgCoordinates,\n  hoveredPoint,\n  setHoveredPoint,\n  handleMouseMove,\n  activeDisputes,\n  onNavigate,\n  revenueStats,\n  formatCurrency,\n  paymentTransactions,\n  fetchAdminData,\n  auditLogs,\n  auditLogFilter,\n  setAuditLogFilter,\n  setSelectedActivity,\n  getStatusColor,\n  getStatusIcon,\n  formatDate\n}) {\n  return (\n    <>\n';
  
  for (let i = 0; i < ranges.length; i++) {
    const range = ranges[i];
    let block = lines.slice(range.start, range.end).join('\n');
    fileContent += block + '\n';
  }
  
  fileContent += '    </>\n  );\n}\n';
  fs.writeFileSync(targetDir + fileName, fileContent);
  console.log('Written', fileName);
}

const fs = require('fs');

const sourcePath = 'c:/Users/admin/Downloads/Project_SWP391/Project_SWP391/HEAD_AdminDashboardPage.jsx';
const targetDir = 'c:/Users/admin/Downloads/Project_SWP391/Project_SWP391/Project/frontend/src/features/admin/components/';

const lines = fs.readFileSync(sourcePath, 'utf8').split(/\r?\n/);

function extract(startStr, endOffset, name) {
  let startIdx = lines.findIndex(l => l.includes(startStr));
  if (startIdx === -1) throw new Error('Not found ' + startStr);
  // startIdx is the condition {cond && (
  // The actual block starts at startIdx + 1
  
  // Find the closing )}
  let depth = 0;
  let endIdx = -1;
  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    // A naive brace counter wouldn't work easily with JSX, but we know the exact line numbers from earlier:
  }
}

// Just hardcode the exact lines since we found them
const blocks = {
  'AdminOverviewTab.jsx': [
    { start: 3067, end: 3203 },
    { start: 3414, end: 3539 }
  ],
  'AdminActivityTab.jsx': [
    { start: 3207, end: 3252 },
    { start: 3608, end: 3673 }
  ],
  'AdminFinancialsTab.jsx': [
    { start: 3256, end: 3411 },
    { start: 3555, end: 3604 }
  ]
};

for (const [file, ranges] of Object.entries(blocks)) {
  let content = 'import React from "react";\nimport { Users, Briefcase, FileText, CheckCircle, AlertCircle, ArrowUpRight, Plus, RefreshCw, MoreHorizontal, Download, Filter, ChevronLeft, ChevronRight, Check, X, Shield, Clock, Search, ExternalLink, Zap, Activity, HelpCircle, FileCheck, Eye, Trash2, ArrowRight } from "lucide-react";\n\nexport default function ' + file.replace('.jsx', '') + '({\n  dashboardSubTab,\n  setDashboardSubTab,\n  stats,\n  compareMode,\n  setCompareMode,\n  dateRange,\n  setDateRange,\n  revenueChartMode,\n  setRevenueChartMode,\n  revenueTrend,\n  userGrowthTrend,\n  chartWidth,\n  getSvgCoordinates,\n  hoveredPoint,\n  setHoveredPoint,\n  handleMouseMove,\n  activeDisputes,\n  onNavigate,\n  revenueStats,\n  formatCurrency,\n  paymentTransactions,\n  fetchAdminData,\n  auditLogs,\n  auditLogFilter,\n  setAuditLogFilter,\n  setSelectedActivity,\n  getStatusColor,\n  getStatusIcon,\n  formatDate\n}) {\n  return (\n    <>\n';
  
  for (const range of ranges) {
    let block = lines.slice(range.start, range.end).join('\n');
    content += block + '\n';
  }
  
  content += '    </>\n  );\n}\n';
  fs.writeFileSync(targetDir + file, content);
  console.log('Written', file);
}

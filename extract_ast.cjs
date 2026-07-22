const fs = require('fs');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const code = fs.readFileSync('c:/Users/admin/Downloads/Project_SWP391/Project_SWP391/HEAD_AdminDashboardPage.jsx', 'utf8');

const ast = parser.parse(code, {
  sourceType: 'module',
  plugins: ['jsx']
});

const blocks = {
  overview: [],
  activity: [],
  financials: []
};

traverse(ast, {
  LogicalExpression(path) {
    // Look for dashboardSubTab === 'tab' && (...)
    if (path.node.operator === '&&') {
      const left = path.node.left;
      if (left.type === 'BinaryExpression' && left.operator === '===') {
        if (left.left.type === 'Identifier' && left.left.name === 'dashboardSubTab') {
          if (left.right.type === 'StringLiteral') {
            const tabName = left.right.value;
            if (blocks[tabName]) {
              const right = path.node.right;
              blocks[tabName].push(code.substring(right.start, right.end));
            }
          }
        }
      }
    }
  }
});

const targetDir = 'c:/Users/admin/Downloads/Project_SWP391/Project_SWP391/Project/frontend/src/features/admin/components/';

for (const [tab, contents] of Object.entries(blocks)) {
  const fileName = 'Admin' + tab.charAt(0).toUpperCase() + tab.slice(1) + 'Tab.jsx';
  let fileContent = 'import React from "react";\nimport { Users, Briefcase, FileText, CheckCircle, AlertCircle, ArrowUpRight, Plus, RefreshCw, MoreHorizontal, Download, Filter, ChevronLeft, ChevronRight, Check, X, Shield, Clock, Search, ExternalLink, Zap, Activity, HelpCircle, FileCheck, Eye, Trash2, ArrowRight } from "lucide-react";\n\nexport default function ' + fileName.replace('.jsx', '') + '({\n  dashboardSubTab,\n  setDashboardSubTab,\n  stats,\n  compareMode,\n  setCompareMode,\n  dateRange,\n  setDateRange,\n  revenueChartMode,\n  setRevenueChartMode,\n  revenueTrend,\n  userGrowthTrend,\n  chartWidth,\n  getSvgCoordinates,\n  hoveredPoint,\n  setHoveredPoint,\n  handleMouseMove,\n  activeDisputes,\n  onNavigate,\n  revenueStats,\n  formatCurrency,\n  paymentTransactions,\n  fetchAdminData,\n  auditLogs,\n  auditLogFilter,\n  setAuditLogFilter,\n  setSelectedActivity,\n  getStatusColor,\n  getStatusIcon,\n  formatDate\n}) {\n  return (\n    <>\n';
  
  for (const blockContent of contents) {
    fileContent += blockContent + '\n';
  }
  
  fileContent += '    </>\n  );\n}\n';
  fs.writeFileSync(targetDir + fileName, fileContent);
  console.log('Written', fileName, 'with', contents.length, 'blocks');
}

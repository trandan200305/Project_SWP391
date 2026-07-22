const fs = require('fs');

const content = fs.readFileSync('c:/Users/admin/Downloads/Project_SWP391/Project_SWP391/HEAD_AdminDashboardPage.jsx', 'utf8');

// The destructuring we want
const destructure = `  const { pendingVerificationTasks, pendingKycUsers, activeProjectsCount, completedProjectsCount, userGrowthTrend, chartWidth, compareMode, setCompareMode, getSvgCoordinates, hoveredPoint, setHoveredPoint, handleMouseMove, activeDisputes, onNavigate, revenueStats, formatCurrency, paymentTransactions, fetchAdminData, auditLogs, auditLogFilter, setAuditLogFilter, setSelectedActivity, stats, getStatusColor, getStatusIcon, formatDate } = props;`;

const imports = "import React from 'react';\nimport { ShieldAlert, CreditCard, LayoutDashboard, Settings, User, AlertCircle, FileText, CheckCircle2, Search, Filter, Download, ArrowUpRight, ArrowDownRight, Users, Bell, TrendingUp, History, Key, Check, X, Eye, EyeOff, Lock, Unlock, Mail, Phone, Calendar, MapPin, Building2, Link as LinkIcon, Edit3, Trash2, Sliders, ChevronDown, BadgeDollarSign, FileBadge, LogOut, ArrowRight, Home, AlertTriangle, UserCheck, RefreshCw, Sparkles, Plus, MoreHorizontal, FileCheck, CircleDollarSign, ArrowUp, ArrowDown, Activity, DollarSign, Wallet, XCircle } from 'lucide-react';\n\n";

function extractTab(tabName, regex, componentName) {
  let match = content.match(regex);
  if (!match) {
    console.log(`Failed to match ${componentName}`);
    return;
  }
  
  let tabContent = match[1];
  
  // Wrap in fragments
  let componentStr = `${imports}export default function ${componentName}(props) {\n${destructure}\n  return (\n    <>\n${tabContent}\n    </>\n  );\n}\n`;
  
  fs.writeFileSync(`c:/Users/admin/Downloads/Project_SWP391/Project_SWP391/Project/frontend/src/features/admin/components/${componentName}.jsx`, componentStr);
  console.log(`${componentName} extracted successfully`);
}

// 1. Overview Tab
// We need to capture both the grid div and the mt-8 div inside {dashboardSubTab === 'overview' && ( ... )}
// Let's use a regex that matches between `dashboardSubTab === 'overview' && \(` and the next `dashboardSubTab === 'financials'`
let overviewMatch = content.match(/\{dashboardSubTab === 'overview' && \([\s\S]*?\{dashboardSubTab === 'financials' && \(/);
if (overviewMatch) {
  let overviewContent = overviewMatch[0];
  // Remove the wrapper {dashboardSubTab === 'overview' && (
  overviewContent = overviewContent.replace(/\{dashboardSubTab === 'overview' && \(\s*/g, '');
  // Remove the trailing )} for the first block
  overviewContent = overviewContent.replace(/\s*\)\}\s*/g, '\n');
  // Remove the next tab's wrapper at the end
  overviewContent = overviewContent.replace(/\{dashboardSubTab === 'financials' && \(/, '');
  
  let componentStr = `${imports}export default function AdminOverviewTab(props) {\n${destructure}\n  return (\n    <>\n${overviewContent}\n    </>\n  );\n}\n`;
  fs.writeFileSync('c:/Users/admin/Downloads/Project_SWP391/Project_SWP391/Project/frontend/src/features/admin/components/AdminOverviewTab.jsx', componentStr);
}


// 2. Financials Tab
let financialsMatch = content.match(/\{dashboardSubTab === 'financials' && \([\s\S]*?\{dashboardSubTab === 'activity' && \(/);
if (financialsMatch) {
  let financialsContent = financialsMatch[0];
  financialsContent = financialsContent.replace(/\{dashboardSubTab === 'financials' && \(\s*/g, '');
  financialsContent = financialsContent.replace(/\s*\)\}\s*/g, '\n');
  financialsContent = financialsContent.replace(/\{dashboardSubTab === 'activity' && \(/, '');
  
  let componentStr = `${imports}export default function AdminFinancialsTab(props) {\n${destructure}\n  return (\n    <>\n${financialsContent}\n    </>\n  );\n}\n`;
  fs.writeFileSync('c:/Users/admin/Downloads/Project_SWP391/Project_SWP391/Project/frontend/src/features/admin/components/AdminFinancialsTab.jsx', componentStr);
}

// 3. Activity Tab
let activityMatch = content.match(/\{dashboardSubTab === 'activity' && \([\s\S]*?\)\}\s*<\/main>/);
if (activityMatch) {
  let activityContent = activityMatch[0];
  activityContent = activityContent.replace(/\{dashboardSubTab === 'activity' && \(\s*/g, '');
  activityContent = activityContent.replace(/\s*\)\}\s*<\/main>/, '\n');
  // It has a trailing )} for the first block too!
  // Wait, there are TWO blocks in Activity? Let's assume replace )}\n works.
  activityContent = activityContent.replace(/\n\s*\)\}\s*\n/g, '\n\n');
  
  let componentStr = `${imports}export default function AdminActivityTab(props) {\n${destructure}\n  return (\n    <>\n${activityContent}\n    </>\n  );\n}\n`;
  fs.writeFileSync('c:/Users/admin/Downloads/Project_SWP391/Project_SWP391/Project/frontend/src/features/admin/components/AdminActivityTab.jsx', componentStr);
}

console.log('Extraction complete');

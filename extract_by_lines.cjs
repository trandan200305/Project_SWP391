const fs = require('fs');

const lines = fs.readFileSync('c:/Users/admin/Downloads/Project_SWP391/Project_SWP391/HEAD_AdminDashboardPage.jsx', 'utf8').split(/\r?\n/);

const destructure = `  const { pendingVerificationTasks, pendingKycUsers, activeProjectsCount, completedProjectsCount, userGrowthTrend, chartWidth, compareMode, setCompareMode, getSvgCoordinates, hoveredPoint, setHoveredPoint, handleMouseMove, activeDisputes, onNavigate, revenueStats, formatCurrency, paymentTransactions, fetchAdminData, auditLogs, auditLogFilter, setAuditLogFilter, setSelectedActivity, stats, getStatusColor, getStatusIcon, formatDate } = props;`;

const imports = "import React from 'react';\nimport { ShieldAlert, CreditCard, LayoutDashboard, Settings, User, AlertCircle, FileText, CheckCircle2, Search, Filter, Download, ArrowUpRight, ArrowDownRight, Users, Bell, TrendingUp, History, Key, Check, X, Eye, EyeOff, Lock, Unlock, Mail, Phone, Calendar, MapPin, Building2, Link as LinkIcon, Edit3, Trash2, Sliders, ChevronDown, BadgeDollarSign, FileBadge, LogOut, ArrowRight, Home, AlertTriangle, UserCheck, RefreshCw, Sparkles, Plus, MoreHorizontal, FileCheck, CircleDollarSign, ArrowUp, ArrowDown, Activity, DollarSign, Wallet, XCircle } from 'lucide-react';\n\n";

function writeComponent(name, chunks) {
  let innerJSX = chunks.map(chunk => chunk.join('\n')).join('\n');
  let componentStr = `${imports}export default function ${name}(props) {\n${destructure}\n  return (\n    <>\n${innerJSX}\n    </>\n  );\n}\n`;
  fs.writeFileSync(`c:/Users/admin/Downloads/Project_SWP391/Project_SWP391/Project/frontend/src/features/admin/components/${name}.jsx`, componentStr);
  console.log(`Wrote ${name}.jsx`);
}

// 3067 is index 3066 `{dashboardSubTab === 'overview' && (`
// ends at index 3204 `)}`
const overview1 = lines.slice(3067, 3204);
// 3414 is index 3413 `{dashboardSubTab === 'overview' && (`
// ends at index 3553 `)}`
const overview2 = lines.slice(3414, 3553);
writeComponent('AdminOverviewTab', [overview1, overview2]);

// 3207 is index 3206 `{dashboardSubTab === 'activity' && (`
// ends at index 3254 `)}`
const activity1 = lines.slice(3207, 3254);
// 3608 is index 3607 `{dashboardSubTab === 'activity' && (`
// ends at index 3673 `)}`
const activity2 = lines.slice(3608, 3673);
writeComponent('AdminActivityTab', [activity1, activity2]);

// 3256 is index 3255 `{dashboardSubTab === 'financials' && (`
// ends at index 3412 `)}`
const financials1 = lines.slice(3256, 3412);
// 3555 is index 3554 `{dashboardSubTab === 'financials' && (`
// ends at index 3606 `)}`
const financials2 = lines.slice(3555, 3606);
writeComponent('AdminFinancialsTab', [financials1, financials2]);

console.log('Done');

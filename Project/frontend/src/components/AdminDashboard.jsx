import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, ShieldAlert, BadgeDollarSign, Settings, 
  Search, Bell, UserCheck, AlertTriangle, CheckCircle2, Ban, 
  Lock, Unlock, Eye, X, Check, HeartPulse, HelpCircle, LogOut, 
  ArrowUpRight, ArrowDownRight, Calendar, Info, Sliders, Sparkles, RefreshCw, Download,
  ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight
} from 'lucide-react';

export default function AdminDashboard({ user, onNavigateToHome }) {
  // Tabs: 'dashboard' | 'users' | 'moderation' | 'finance' | 'cms'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('30days'); // '7days' | '30days' | '365days'
  
  // Advanced User Filter States
  const [userStatusFilter, setUserStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'LOCKED' | 'BANNED' | 'OFFLINE'
  const [userTimeFilterType, setUserTimeFilterType] = useState('ALL'); // 'ALL' | '8HOURS' | 'CUSTOM'
  const [userTimeStart, setUserTimeStart] = useState('');
  const [userTimeEnd, setUserTimeEnd] = useState('');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [activeOnlineChecked, setActiveOnlineChecked] = useState(true);
  const [activeOfflineChecked, setActiveOfflineChecked] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Real States fetched from SQL Server Database via Spring Boot API
  const [stats, setStats] = useState({
    totalUsers: 1284,
    activeProjects: 452,
    totalRevenue: 128500.0,
    activeDisputes: 18,
    pendingWithdrawals: 2,
    usersGrowthPercent: 12.0,
    projectsGrowthPercent: 5.0,
    revenueGrowthPercent: 8.2
  });

  const [users, setUsers] = useState([]);
  const [pendingProjects, setPendingProjects] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLogFilter, setAuditLogFilter] = useState('ALL');
  const [userGrowthTrend, setUserGrowthTrend] = useState([]);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [feeRate, setFeeRate] = useState(10.0);

  // System & CMS States (Real Data from DB)
  const [jobCategories, setJobCategories] = useState([]);
  const [kycRequests, setKycRequests] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [reports, setReports] = useState([]);
  const [articles, setArticles] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [seoConfigs, setSeoConfigs] = useState([]);
  const [activeCmsTab, setActiveCmsTab] = useState('seo'); // 'seo' | 'categories' | 'kyc' | 'disputes' | 'reports' | 'articles' | 'tickets'

  // Financial Control states
  const [compareMode, setCompareMode] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [chartWidth, setChartWidth] = useState(600);
  
  // Loading & Action states
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingFee, setIsUpdatingFee] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [banReason, setBanReason] = useState('');
  const [activeUserForAction, setActiveUserForAction] = useState(null);
  const [actionType, setActionType] = useState('');

  // Toast notification state
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }; // 'lock' | 'ban'

  // 1. Fetch statistics based on period
  const fetchStats = (period) => {
    fetch(`http://localhost:8080/api/admin/stats?period=${period}`)
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error('Error fetching stats:', err));
  };

  // 2. Fetch platform fee config
  const fetchFeeConfig = () => {
    fetch('http://localhost:8080/api/admin/fee-config')
      .then(res => res.json())
      .then(data => setFeeRate(data.fee))
      .catch(err => console.error('Error loading fee config:', err));
  };

  // 3. Update Platform Fee Rate (UC-30)
  const handleUpdateFeeConfig = (newFee) => {
    setIsUpdatingFee(true);
    const headers = { 'Content-Type': 'application/json' };
    if (user?.id) headers['X-Admin-Id'] = user.id.toString();

    fetch(`http://localhost:8080/api/admin/fee-config?fee=${newFee}`, {
      method: 'POST',
      headers: headers
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setFeeRate(data.fee);
          fetchStats(selectedPeriod); // Re-calculate dynamic revenues based on new fee multiplier
          // Refresh audit logs
          fetch('http://localhost:8080/api/admin/audit-logs')
            .then(res => res.json())
            .then(logs => { if (Array.isArray(logs)) setAuditLogs(logs); });
        }
        setIsUpdatingFee(false);
      })
      .catch(err => {
        console.error('Error updating fee:', err);
        setIsUpdatingFee(false);
      });
  };

  // 4. Fetch all dashboard data & charts
  const loadDashboardData = () => {
    setIsLoading(true);
    fetchStats(selectedPeriod);
    fetchFeeConfig();

    // Fetch User Growth Trend series
    fetch('http://localhost:8080/api/admin/charts/user-growth')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setUserGrowthTrend(data); })
      .catch(err => console.error('Error user growth chart:', err));

    // Fetch Revenue Trend series
    fetch('http://localhost:8080/api/admin/charts/revenue')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setRevenueTrend(data); })
      .catch(err => console.error('Error revenue chart:', err));

    // Fetch audit logs
    fetch('http://localhost:8080/api/admin/audit-logs')
      .then(res => res.json())
      .then(data => {
        setAuditLogs(Array.isArray(data) ? data : []);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error audit logs:', err);
        setIsLoading(false);
      });
  };

  // Trigger loading when tab or period changes
  useEffect(() => {
    loadDashboardData();
    
    if (activeTab === 'users') {
      setIsLoading(true);
      fetch('http://localhost:8080/api/admin/users')
        .then(res => res.json())
        .then(data => {
          setUsers(Array.isArray(data) ? data : []);
          setIsLoading(false);
        })
        .catch(err => console.error('Error users:', err));
    } else if (activeTab === 'moderation') {
      setIsLoading(true);
      fetch('http://localhost:8080/api/admin/projects/pending')
        .then(res => res.json())
        .then(data => {
          setPendingProjects(Array.isArray(data) ? data : []);
          setIsLoading(false);
        })
        .catch(err => console.error('Error projects:', err));
    } else if (activeTab === 'finance') {
      setIsLoading(true);
      fetch('http://localhost:8080/api/admin/withdrawals')
        .then(res => res.json())
        .then(data => {
          setWithdrawals(Array.isArray(data) ? data : []);
          setIsLoading(false);
        })
        .catch(err => console.error('Error withdrawals:', err));
    } else if (activeTab === 'cms') {
      setIsLoading(true);
      Promise.all([
        fetch('http://localhost:8080/api/admin/job-categories').then(res => res.json()),
        fetch('http://localhost:8080/api/admin/kyc-requests').then(res => res.json()),
        fetch('http://localhost:8080/api/admin/disputes').then(res => res.json()),
        fetch('http://localhost:8080/api/admin/reports').then(res => res.json()),
        fetch('http://localhost:8080/api/admin/articles').then(res => res.json()),
        fetch('http://localhost:8080/api/admin/tickets').then(res => res.json()),
        fetch('http://localhost:8080/api/admin/seo-configs').then(res => res.json())
      ]).then(([categories, kyc, disps, reps, arts, ticks, seo]) => {
        setJobCategories(Array.isArray(categories) ? categories : []);
        setKycRequests(Array.isArray(kyc) ? kyc : []);
        setDisputes(Array.isArray(disps) ? disps : []);
        setReports(Array.isArray(reps) ? reps : []);
        setArticles(Array.isArray(arts) ? arts : []);
        setTickets(Array.isArray(ticks) ? ticks : []);
        setSeoConfigs(Array.isArray(seo) ? seo : []);
        setIsLoading(false);
      }).catch(err => { console.error('Error loading CMS data:', err); setIsLoading(false); });
    }
  }, [activeTab, selectedPeriod]);

  // Reset pagination page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [userStatusFilter, activeOnlineChecked, activeOfflineChecked, userTimeFilterType, userTimeStart, userTimeEnd, searchQuery]);

  // Handle User Security Status Action
  const handleUserStatusChange = (userId, role, newStatus) => {
    const reasonParam = encodeURIComponent(banReason || 'Yêu cầu từ Admin');
    const headers = {};
    if (user?.id) headers['X-Admin-Id'] = user.id.toString();

    fetch(`http://localhost:8080/api/admin/users/${userId}/status?role=${role}&status=${newStatus}&reason=${reasonParam}`, {
      method: 'PUT',
      headers: headers
    })
      .then(res => res.json())
      .then(data => {
        if (data.success === false) {
          // Backend từ chối (VD: tài khoản Admin được bảo vệ)
          showToast(data.message || 'Hành động bị từ chối bởi hệ thống.', 'error');
        } else {
          showToast(data.message || 'Thao tác thành công!', 'success');
        }
        fetch('http://localhost:8080/api/admin/users')
          .then(res => res.json())
          .then(data => { if (Array.isArray(data)) setUsers(data); });
        loadDashboardData();
        setActiveUserForAction(null);
        setBanReason('');
      })
      .catch(err => {
        console.error(err);
        showToast('Lỗi kết nối máy chủ.', 'error');
      });
  };

  // Handle Moderation Action (Approve/Reject)
  const handleProjectAction = (projectId, approve, reason = '') => {
    const reasonParam = encodeURIComponent(reason);
    const headers = {};
    if (user?.id) headers['X-Admin-Id'] = user.id.toString();

    fetch(`http://localhost:8080/api/admin/projects/${projectId}/moderate?approve=${approve}&reason=${reasonParam}`, {
      method: 'PUT',
      headers: headers
    })
      .then(res => res.json())
      .then(() => {
        fetch('http://localhost:8080/api/admin/projects/pending')
          .then(res => res.json())
          .then(data => setPendingProjects(data));
        loadDashboardData();
      })
      .catch(err => console.error(err));
  };

  // Handle Finance Processing (Approve/Reject withdrawal)
  const handleWithdrawalAction = (withdrawalId, approve) => {
    const status = approve ? 'APPROVED' : 'REJECTED';
    const headers = {};
    if (user?.id) headers['X-Admin-Id'] = user.id.toString();

    fetch(`http://localhost:8080/api/admin/withdrawals/${withdrawalId}/process?status=${status}`, {
      method: 'PUT',
      headers: headers
    })
      .then(res => res.json())
      .then(() => {
        fetch('http://localhost:8080/api/admin/withdrawals')
          .then(res => res.json())
          .then(data => setWithdrawals(data));
        loadDashboardData();
      })
      .catch(err => console.error(err));
  };

  // Calculate coordinates for SVG line charts dynamically
  const getSvgCoordinates = (data, field, width = 600, height = 160, globalMax = null) => {
    if (!data || data.length === 0) return '';
    const maxVal = globalMax || Math.max(...data.map(d => d[field] || 1));
    const minVal = 0;
    const range = maxVal - minVal;
    
    return data.map((d, index) => {
      const x = (index / (data.length - 1)) * (width - 60) + 30;
      const y = height - ((d[field] - minVal) / range) * (height - 40) - 20;
      return `${x},${y}`;
    }).join(' ');
  };

  // Handle mouse moves over SVG area chart to render high-precision hover tooltips
  const handleMouseMove = (e) => {
    const svgRect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - svgRect.left;
    const index = Math.round((mouseX - 30) / ((svgRect.width - 60) / (userGrowthTrend.length - 1)));
    if (index >= 0 && index < userGrowthTrend.length) {
      setHoveredPoint({
        ...userGrowthTrend[index],
        x: (index / (userGrowthTrend.length - 1)) * (chartWidth - 60) + 30,
        index
      });
    }
  };

  return (
    <div className="h-screen bg-slate-100 flex font-sans antialiased text-slate-800 overflow-hidden">
      
      {/* Sidebar Navigation - iOS Settings Card layout */}
      <aside className="w-64 bg-slate-50 border-r border-slate-200/80 flex flex-col justify-between p-4 shrink-0">
        <div className="space-y-5">
          <div className="px-1">
            <div className="flex items-center gap-2 text-primary font-extrabold text-[20px] font-display">
              <ShieldAlert className="w-5 h-5 text-blue-600 animate-pulse" />
              <span>vLance Admin</span>
            </div>
            <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mt-1 pl-7">System Control Panel</p>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Settings</p>
            
            <nav className="space-y-2">
              {/* TAB 1: DASHBOARD CARD */}
              <div 
                onClick={() => setActiveTab('dashboard')}
                className={`rounded-xl p-3 flex items-center gap-3 transition-all cursor-pointer shadow-sm ${
                  activeTab === 'dashboard' 
                    ? 'bg-white border-2 border-blue-500 shadow-md scale-[1.02]' 
                    : 'bg-white hover:bg-slate-50 border border-slate-200/75 hover:scale-[1.01]'
                }`}
              >
                <div className="w-8.5 h-8.5 rounded-lg bg-blue-500 flex items-center justify-center text-white shadow-sm shrink-0">
                  <LayoutDashboard className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 text-[12.5px]">Overview Dashboard</p>
                  <p className="text-[10px] text-slate-400 truncate">Real-time stats and metrics</p>
                </div>
              </div>

              {/* TAB 2: USER MANAGEMENT CARD */}
              <div 
                onClick={() => setActiveTab('users')}
                className={`rounded-xl p-3 flex items-center gap-3 transition-all cursor-pointer shadow-sm ${
                  activeTab === 'users' 
                    ? 'bg-white border-2 border-indigo-500 shadow-md scale-[1.02]' 
                    : 'bg-white hover:bg-slate-50 border border-slate-200/75 hover:scale-[1.01]'
                }`}
              >
                <div className="w-8.5 h-8.5 rounded-lg bg-indigo-500 flex items-center justify-center text-white shadow-sm shrink-0">
                  <Users className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 text-[12.5px]">User Management</p>
                  <p className="text-[10px] text-slate-400 truncate">Lock, ban, or unlock accounts</p>
                </div>
              </div>

              {/* TAB 3: PROJECT MODERATION CARD */}
              <div 
                onClick={() => setActiveTab('moderation')}
                className={`rounded-xl p-3 flex items-center gap-3 transition-all cursor-pointer relative shadow-sm ${
                  activeTab === 'moderation' 
                    ? 'bg-white border-2 border-emerald-500 shadow-md scale-[1.02]' 
                    : 'bg-white hover:bg-slate-50 border border-slate-200/75 hover:scale-[1.01]'
                }`}
              >
                <div className="w-8.5 h-8.5 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-sm shrink-0">
                  <ShieldAlert className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 text-[12.5px]">Project Moderation</p>
                  <p className="text-[10px] text-slate-400 truncate">Review and approve jobs</p>
                </div>
                {pendingProjects.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-extrabold w-4.5 h-4.5 flex items-center justify-center rounded-full shadow-sm animate-bounce">
                    {pendingProjects.length}
                  </span>
                )}
              </div>

              {/* TAB 4: FINANCE CONTROL CARD */}
              <div 
                onClick={() => setActiveTab('finance')}
                className={`rounded-xl p-3 flex items-center gap-3 transition-all cursor-pointer relative shadow-sm ${
                  activeTab === 'finance' 
                    ? 'bg-white border-2 border-amber-500 shadow-md scale-[1.02]' 
                    : 'bg-white hover:bg-slate-50 border border-slate-200/75 hover:scale-[1.01]'
                }`}
              >
                <div className="w-8.5 h-8.5 rounded-lg bg-amber-500 flex items-center justify-center text-white shadow-sm shrink-0">
                  <BadgeDollarSign className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 text-[12.5px]">Finance Control</p>
                  <p className="text-[10px] text-slate-400 truncate">Withdrawals & platform fees</p>
                </div>
                {withdrawals.filter(w => w.status === 'PENDING').length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[9px] font-extrabold w-4.5 h-4.5 flex items-center justify-center rounded-full shadow-sm">
                    {withdrawals.filter(w => w.status === 'PENDING').length}
                  </span>
                )}
              </div>

              {/* TAB 5: CMS SETTINGS CARD */}
              <div 
                onClick={() => setActiveTab('cms')}
                className={`rounded-xl p-3 flex items-center gap-3 transition-all cursor-pointer shadow-sm ${
                  activeTab === 'cms' 
                    ? 'bg-white border-2 border-cyan-500 shadow-md scale-[1.02]' 
                    : 'bg-white hover:bg-slate-50 border border-slate-200/75 hover:scale-[1.01]'
                }`}
              >
                <div className="w-8.5 h-8.5 rounded-lg bg-cyan-500 flex items-center justify-center text-white shadow-sm shrink-0">
                  <Settings className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 text-[12.5px]">CMS Settings</p>
                  <p className="text-[10px] text-slate-400 truncate">SEO and configurations</p>
                </div>
              </div>
            </nav>
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-slate-200/50 p-3 rounded-xl border border-slate-200 space-y-1.5">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Database Status</p>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              <span className="text-[11.5px] font-bold text-slate-700">SQL Server Connected</span>
            </div>
            <p className="text-[9px] text-slate-400">Latency: <span className="font-mono font-bold text-emerald-600">12ms</span></p>
          </div>
          
          <div className="pt-3 border-t border-slate-200/60">
            <button 
              onClick={onNavigateToHome}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl font-bold text-[12.5px] transition-all"
            >
              <LogOut className="w-4.5 h-4.5" />
              <span>Exit Admin</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="flex-grow flex flex-col min-w-0 bg-slate-50">
        
        {/* Main Header with dynamic control elements */}
        <header className="bg-white border-b border-slate-200 h-20 px-8 flex justify-between items-center shrink-0">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-primary flex items-center gap-2">
              {activeTab === 'dashboard' && 'Financial & Performance Dashboard'}
              {activeTab === 'users' && 'User Account Control'}
              {activeTab === 'moderation' && 'Job Escrow Moderation'}
              {activeTab === 'finance' && 'Liquidation & Finance Control'}
              {activeTab === 'cms' && 'SEO & Policy Config'}
            </h1>
            <p className="text-body-sm text-muted">
              {activeTab === 'dashboard' && 'High-precision tracking of system registrations, escrow transaction distributions, and commissions.'}
              {activeTab === 'users' && 'Lock, ban, or unlock system user accounts.'}
              {activeTab === 'moderation' && 'Approve or reject projects awaiting moderation.'}
              {activeTab === 'finance' && 'Supervise withdrawal requests and platform fees.'}
              {activeTab === 'cms' && 'Manage policy pages, SEO metadata, and system flags.'}
            </p>
          </div>

          {activeTab === 'dashboard' && (
            <div className="flex items-center gap-4 animate-in fade-in duration-200">
              <button 
                onClick={loadDashboardData}
                className="p-2.5 text-slate-400 hover:text-slate-600 rounded-xl border border-slate-200 hover:bg-slate-50 bg-white shadow-sm"
                title="Refresh Data"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          )}
        </header>

        {/* Dynamic Panels */}
        <div className="flex-grow p-8 overflow-y-auto overflow-x-hidden space-y-8 min-w-0">
          
          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === 'dashboard' && (
            <>
              {/* KPI metrics row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-body-sm text-muted font-bold">Tổng User mới</span>
                    <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-0.5">
                      <ArrowUpRight className="w-3 h-3" /> +{stats.usersGrowthPercent}%
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-3xl font-extrabold text-primary font-mono">{stats.totalUsers}</p>
                    <p className="text-[11px] text-muted mt-1">Đăng ký trong kỳ chọn</p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-body-sm text-muted font-bold">Dự án In Progress</span>
                    <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-0.5">
                      <ArrowUpRight className="w-3 h-3" /> +{stats.projectsGrowthPercent}%
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-3xl font-extrabold text-primary font-mono">{stats.activeProjects}</p>
                    <p className="text-[11px] text-muted mt-1">Hoạt động trong cơ sở dữ liệu</p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between ring-2 ring-emerald-500/20 bg-emerald-50/5">
                  <div className="flex justify-between items-start">
                    <span className="text-body-sm text-muted font-bold">Doanh thu tháng (GMV)</span>
                    <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-0.5">
                      <ArrowUpRight className="w-3 h-3" /> +{stats.revenueGrowthPercent}%
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-3xl font-extrabold text-emerald-600 font-mono">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.totalRevenue)}
                    </p>
                    <p className="text-[11px] text-muted mt-1">Tổng hoa hồng & phí dịch vụ</p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-body-sm text-muted font-bold">Tranh chấp đang mở</span>
                    <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-0.5">
                      <ArrowDownRight className="w-3 h-3" /> -2%
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-3xl font-extrabold text-primary font-mono">{stats.activeDisputes}</p>
                    <p className="text-[11px] text-muted mt-1">Chờ Admin hòa giải</p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-body-sm text-muted font-bold">Yêu cầu rút tiền</span>
                    <span className="bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold">
                      Chờ duyệt
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-3xl font-extrabold text-primary font-mono">{stats.pendingWithdrawals}</p>
                    <p className="text-[11px] text-muted mt-1">Yêu cầu thanh toán escrow</p>
                  </div>
                </div>
              </div>

              {/* Dynamic Platform Fee Controller - High-end control panel */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="space-y-1 w-full md:w-auto">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-primary text-[16px]">Cấu hình Hoa hồng Dịch vụ Escrow (Platform Fee Config)</h3>
                  </div>
                  <p className="text-body-sm text-slate-500">Thiết lập trực tiếp mức hoa hồng nền tảng thu của mỗi cột mốc dự án. Thay đổi sẽ lưu ngay vào DB và tự tính toán doanh thu tương lai.</p>
                </div>

                <div className="flex items-center gap-6 w-full md:w-auto justify-end">
                  <div className="flex items-center gap-3">
                    <input 
                      type="range" 
                      min="5" 
                      max="25" 
                      step="0.5"
                      value={feeRate} 
                      onChange={e => setFeeRate(parseFloat(e.target.value))}
                      className="w-48 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <span className="font-mono font-extrabold text-lg text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl min-w-[70px] text-center border border-blue-100">
                      {feeRate.toFixed(1)}%
                    </span>
                  </div>

                  <button 
                    onClick={() => handleUpdateFeeConfig(feeRate)}
                    disabled={isUpdatingFee}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-body-sm px-5 py-2.5 rounded-xl transition-all shadow-md shadow-blue-600/10 flex items-center gap-2"
                  >
                    {isUpdatingFee ? 'Đang cập nhật...' : 'Áp Dụng Config'}
                  </button>
                </div>
              </div>

              {/* Advanced Interactive SVG Area Chart & Bar Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. High-precision SVG Area Chart */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-primary text-body-md">Biểu đồ Tăng Trưởng Tài Khoản Mới</h3>
                      <p className="text-[11px] text-slate-400">So sánh hiệu suất đăng ký thực tế với chu kỳ trước</p>
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={compareMode} 
                          onChange={e => setCompareMode(e.target.checked)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-[12px] font-bold text-slate-500">So sánh chu kỳ trước</span>
                      </label>

                      <button className="text-[12px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 border border-slate-200 bg-slate-50 px-2.5 py-1 rounded-lg">
                        <Download className="w-3.5 h-3.5" /> CSV
                      </button>
                    </div>
                  </div>

                  {/* SVG Chart area with Hover Interactive Guide line & Tooltip */}
                  <div className="relative h-64 border border-slate-100 rounded-xl bg-slate-50/50 p-4">
                    {/* Y-Axis guide lines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-slate-300 text-[10px] p-6 pl-12">
                      <div className="border-b border-slate-200/50 w-full pb-1 text-right">1,200 users</div>
                      <div className="border-b border-slate-200/50 w-full pb-1 text-right">800 users</div>
                      <div className="border-b border-slate-200/50 w-full pb-1 text-right">400 users</div>
                      <div className="w-full text-right">0</div>
                    </div>

                    <svg 
                      className="w-full h-full relative z-10 cursor-crosshair" 
                      viewBox="0 0 600 160"
                      onMouseMove={handleMouseMove}
                      onMouseLeave={() => setHoveredPoint(null)}
                    >
                      {/* Compare line dashed (if active) */}
                      {compareMode && userGrowthTrend.length > 0 && (
                        <polyline
                          fill="none"
                          stroke="#94A3B8"
                          strokeWidth="2"
                          strokeDasharray="4,4"
                          points={getSvgCoordinates(userGrowthTrend, 'compareValue', chartWidth, 160, Math.max(...userGrowthTrend.map(d => Math.max(d.value || 0, d.compareValue || 0))))}
                        />
                      )}

                      {/* Main Registration Line */}
                      {userGrowthTrend.length > 0 && (
                        <>
                          {/* Gradient Area Fill */}
                          <path
                            d={`M 30,140 L ${getSvgCoordinates(userGrowthTrend, 'value', chartWidth, 160, Math.max(...userGrowthTrend.map(d => Math.max(d.value || 0, d.compareValue || 0))))} L ${((userGrowthTrend.length - 1) / (userGrowthTrend.length - 1)) * (chartWidth - 60) + 30},140 Z`}
                            fill="url(#area-gradient)"
                            opacity="0.12"
                          />
                          {/* Line */}
                          <polyline
                            fill="none"
                            stroke="#2563EB"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={getSvgCoordinates(userGrowthTrend, 'value', chartWidth, 160, Math.max(...userGrowthTrend.map(d => Math.max(d.value || 0, d.compareValue || 0))))}
                          />
                        </>
                      )}

                      {/* Interactive Hover Guide line & Points */}
                      {hoveredPoint && (
                        <>
                          <line 
                            x1={hoveredPoint.x} 
                            y1="10" 
                            x2={hoveredPoint.x} 
                            y2="140" 
                            stroke="#3B82F6" 
                            strokeWidth="1.5" 
                            strokeDasharray="2,2" 
                          />
                          <circle 
                            cx={hoveredPoint.x} 
                            cy={160 - ((hoveredPoint.value / Math.max(...userGrowthTrend.map(d => d.value))) * 120) - 20} 
                            r="6" 
                            fill="#2563EB" 
                            stroke="#FFFFFF" 
                            strokeWidth="2" 
                          />
                        </>
                      )}

                      {/* Gradient definition */}
                      <defs>
                        <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563EB" />
                          <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                    </svg>

                    {/* Interactive High-Precision Floating Tooltip */}
                    {hoveredPoint && (
                      <div 
                        className="absolute bg-slate-900 text-white rounded-xl p-3 text-body-sm shadow-xl border border-slate-700 pointer-events-none z-20 flex flex-col gap-1"
                        style={{
                          left: `${(hoveredPoint.x / chartWidth) * 90}%`,
                          top: '15px'
                        }}
                      >
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tháng {hoveredPoint.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          <span className="font-extrabold font-mono text-lg">{hoveredPoint.value} users</span>
                        </div>
                        {compareMode && (
                          <div className="flex items-center gap-2 pt-1 border-t border-slate-800 text-[11px] text-slate-400">
                            <span className="w-2 h-2 rounded-full bg-slate-500" />
                            <span>Kỳ trước: <strong className="text-white font-mono">{hoveredPoint.compareValue}</strong></span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between text-muted font-bold text-[11px] mt-2 px-8">
                    {userGrowthTrend.map((pt, i) => (
                      <span key={i}>Tháng {pt.label}</span>
                    ))}
                  </div>
                </div>

                {/* 2. SVG Financial Revenue Bar Chart */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-primary text-body-md">Doanh Thu Theo Quý</h3>
                      <p className="text-[11px] text-slate-400">Phí thu được tích hợp từ DB</p>
                    </div>
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                      Tối ưu Escrow
                    </span>
                  </div>

                  <div className="h-64 flex items-end justify-around gap-6 pt-6 relative border border-slate-100 rounded-xl bg-slate-50/50 p-4">
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-slate-300 text-[10px] p-6 pl-10">
                      <div className="border-b border-slate-200/50 w-full pb-1" />
                      <div className="border-b border-slate-200/50 w-full pb-1" />
                      <div className="border-b border-slate-200/50 w-full pb-1" />
                      <div className="w-full" />
                    </div>

                    {revenueTrend.map((pt, index) => {
                      const maxVal = Math.max(...revenueTrend.map(d => d.value || 1));
                      const percentHeight = (pt.value / maxVal) * 80;
                      return (
                        <div key={index} className="flex flex-col justify-end items-center gap-3 relative z-10 w-full group h-full">
                          <div 
                            className="bg-blue-100 w-10 hover:bg-blue-600 rounded-t-lg transition-all duration-300 shadow-sm cursor-pointer relative"
                            style={{ height: `${percentHeight}%` }}
                          >
                            {/* Bar hover tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 text-white rounded-lg px-2.5 py-1 text-[10px] font-mono font-bold opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg whitespace-nowrap">
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(pt.value)}
                            </div>
                          </div>
                          <span className="text-[11px] font-extrabold text-slate-500">{pt.label}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-body-sm">
                    <span className="text-muted">Doanh thu cao nhất:</span>
                    <span className="font-extrabold text-emerald-600">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Math.max(...revenueTrend.map(d => d.value || 0)))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent System Activity Log List */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="font-bold text-primary text-body-md">Nhật Ký Hoạt Động Hệ Thống Gần Nhất (Audit)</h3>
                  <div className="flex items-center gap-4">
                    <select 
                      value={auditLogFilter}
                      onChange={(e) => setAuditLogFilter(e.target.value)}
                      className="text-body-sm font-medium border border-slate-200 text-slate-600 rounded-lg px-3 py-1.5 outline-none focus:border-blue-500 bg-white hover:bg-slate-50 transition-colors"
                    >
                      <option value="ALL">Tất cả chức năng</option>
                      <option value="USER_MANAGEMENT">Tài khoản & Người dùng</option>
                      <option value="PROJECTS">Kiểm duyệt Dự án</option>
                      <option value="FINANCE">Quản lý Tài chính</option>
                      <option value="SYSTEM">Hệ thống</option>
                    </select>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-400 font-bold text-[11px] uppercase tracking-wider">
                        <th className="p-4 pl-6">Thời gian</th>
                        <th className="p-4">Actor</th>
                        <th className="p-4">Nghiệp vụ chi tiết</th>
                        <th className="p-4">Trạng thái</th>
                        <th className="p-4 text-center">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {auditLogs
                        .filter(log => auditLogFilter === 'ALL' || log.module === auditLogFilter)
                        .slice(0, 15).map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors text-body-sm">
                          <td className="p-4 pl-6 text-slate-500 font-medium">
                            {new Date(log.timestamp).toLocaleString('vi-VN', {
                                day: '2-digit', month: '2-digit', year: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                            })}
                          </td>
                          <td className="p-4 font-bold text-primary">{log.source}</td>
                          <td className="p-4 text-slate-600 max-w-[350px] break-words whitespace-pre-wrap leading-relaxed">{log.detail}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              log.status === 'Approved' || log.status === 'Verified' ? 'bg-emerald-50 text-emerald-700' :
                              log.status === 'Critical' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <button 
                              onClick={() => setSelectedActivity(log)}
                              className="text-slate-400 hover:text-blue-600 rounded-lg p-1.5 hover:bg-slate-100 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: USER MANAGEMENT */}
          {activeTab === 'users' && (() => {
            // Advanced Filters Logic with clean date parsing
            const filteredUsers = users.filter(user => {
              const matchesSearch = searchQuery === '' || 
                user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.name.toLowerCase().includes(searchQuery.toLowerCase());

              let matchesStatus = true;
              if (userStatusFilter !== 'ALL') {
                if (userStatusFilter === 'OFFLINE') {
                  if (!user.lastLogin) {
                    matchesStatus = true;
                  } else {
                    const cleanStr = user.lastLogin.split('.')[0];
                    const lastLoginTime = new Date(cleanStr).getTime();
                    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000); // 5 minutes threshold
                    matchesStatus = lastLoginTime < fiveMinutesAgo;
                  }
                } else if (userStatusFilter === 'ACTIVE') {
                  if (user.status !== 'ACTIVE') {
                    matchesStatus = false;
                  } else {
                    let isUserOnline = false;
                    if (user.lastLogin) {
                      const cleanStr = user.lastLogin.split('.')[0];
                      const lastLoginTime = new Date(cleanStr).getTime();
                      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
                      isUserOnline = lastLoginTime >= fiveMinutesAgo;
                    }
                    if (isUserOnline) {
                      matchesStatus = activeOnlineChecked;
                    } else {
                      matchesStatus = activeOfflineChecked;
                    }
                  }
                } else {
                  matchesStatus = user.status === userStatusFilter;
                }
              }

              let matchesTime = true;
              if (userTimeFilterType === '8HOURS') {
                if (!user.lastLogin) {
                  matchesTime = false;
                } else {
                  const cleanStr = user.lastLogin.split('.')[0];
                  const lastLoginTime = new Date(cleanStr).getTime();
                  const eightHoursAgo = Date.now() - (8 * 60 * 60 * 1000);
                  matchesTime = lastLoginTime >= eightHoursAgo;
                }
              } else if (userTimeFilterType === 'CUSTOM') {
                if (!user.lastLogin) {
                  matchesTime = false;
                } else {
                  const cleanStr = user.lastLogin.split('.')[0];
                  const lastLoginTime = new Date(cleanStr).getTime();
                  if (userTimeStart) {
                    const startTime = new Date(userTimeStart + 'T00:00:00').getTime();
                    matchesTime = matchesTime && (lastLoginTime >= startTime);
                  }
                  if (userTimeEnd) {
                    const endTime = new Date(userTimeEnd + 'T23:59:59').getTime();
                    matchesTime = matchesTime && (lastLoginTime <= endTime);
                  }
                }
              }

              return matchesSearch && matchesStatus && matchesTime;
            });

            // Email Suggestions Autocomplete matches
            const emailSuggestions = searchQuery.trim() !== '' ? users
              .filter(u => u.email.toLowerCase().includes(searchQuery.toLowerCase()) && u.email.toLowerCase() !== searchQuery.toLowerCase())
              .map(u => u.email)
              .filter((value, index, self) => self.indexOf(value) === index)
              .slice(0, 5) : [];

            return (
              <div className="space-y-6">
                {/* CSS styles exactly replicating the morphing and clip-path transitions from user request */}
                <style>{`
                  .filter-main {
                    font-weight: 800;
                    color: white;
                    background-image: linear-gradient(to right, #2563eb, #4f46e5);
                    padding: 4px 16px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    height: 2.75rem;
                    width: 12.5rem;
                    position: relative;
                    cursor: pointer;
                    justify-content: space-between;
                    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
                    transition: all 0.3s ease;
                  }

                  .filter-main:hover {
                    box-shadow: 0 6px 16px rgba(37, 99, 235, 0.25);
                    transform: translateY(-1px);
                  }

                  .filter-bar {
                    display: flex;
                    height: 14px;
                    width: 18px;
                    flex-direction: column;
                    gap: 3px;
                    justify-content: center;
                  }

                  .filter-bar-list {
                    display: block;
                    width: 100%;
                    height: 2px;
                    border-radius: 50px;
                    background-color: white;
                    transition: all 0.4s ease;
                    position: relative;
                  }

                  /* Checkbox morphing - NOT checked represents OPEN menu */
                  .filter-inp:not(:checked) ~ .filter-main .filter-top {
                    transform-origin: top right;
                    transform: translateY(-0.5px) rotate(-45deg) scaleX(0.9);
                  }

                  .filter-inp:not(:checked) ~ .filter-main .filter-middle {
                    transform: translateX(-50%);
                    opacity: 0;
                  }

                  .filter-inp:not(:checked) ~ .filter-main .filter-bottom {
                    transform-origin: bottom right;
                    transform: translateY(0.5px) rotate(45deg) scaleX(0.9);
                  }

                  .filter-menu-container {
                    background-color: white;
                    color: #1e293b;
                    font-weight: 400;
                    border: 1px solid #e2e8f0;
                    border-radius: 16px;
                    position: absolute;
                    width: 48rem;
                    right: 0;
                    top: 130%;
                    overflow: hidden;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
                    z-index: 9999 !important;
                    padding: 24px;
                    cursor: default;
                  }

                  .filter-item-list {
                    --delay: 0.15s;
                    --trdelay: 0.08s;
                  }

                  .filter-item-list:nth-child(1) {
                    transition-delay: var(--delay);
                  }
                  .filter-item-list:nth-child(2) {
                    transition-delay: calc(var(--delay) + var(--trdelay));
                  }
                  .filter-item-list:nth-child(3) {
                    transition-delay: calc(var(--delay) + (var(--trdelay) * 2));
                  }
                `}</style>

                {/* Advanced Filter Panel */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="font-bold text-primary text-lg">Danh sách Tài khoản Người dùng</h3>
                      <p className="text-[12px] text-slate-400 mt-1">Kết quả khớp điều kiện: <span className="font-bold text-blue-600">{filteredUsers.length}</span> / {users.length} tài khoản</p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                      {/* Search Input with Autocomplete Suggestions */}
                      <div className="relative flex-grow md:flex-grow-0 md:w-80">
                        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 flex items-center gap-2.5 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all shadow-sm">
                          <Search className="w-4 h-4 text-slate-400" />
                          <input 
                            type="text" 
                            placeholder="Tìm kiếm Email hoặc Tên..." 
                            className="bg-transparent border-none text-body-sm outline-none w-full font-medium placeholder-slate-400"
                            value={searchQuery}
                            onChange={e => {
                              setSearchQuery(e.target.value);
                              setShowSuggestions(true);
                            }}
                            onFocus={() => setShowSuggestions(true)}
                          />
                          {searchQuery && (
                            <button 
                              onClick={() => { setSearchQuery(''); setShowSuggestions(false); }}
                              className="text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 transition-all"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Autocomplete Dropdown list */}
                        {showSuggestions && emailSuggestions.length > 0 && (
                          <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-150 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 animate-in slide-in-from-top-2 duration-150">
                            {emailSuggestions.map((email, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  setSearchQuery(email);
                                  setShowSuggestions(false);
                                }}
                                className="w-full text-left px-4 py-2.5 hover:bg-blue-50/50 hover:text-blue-700 text-body-sm transition-all flex items-center gap-2 font-medium"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                {email}
                              </button>
                            ))}
                          </div>
                        )}
                        {showSuggestions && searchQuery && emailSuggestions.length === 0 && (
                          <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-150 rounded-xl shadow-lg z-50 p-3 text-center text-slate-400 text-body-xs font-medium">
                            Không có gợi ý email khớp
                          </div>
                        )}
                      </div>

                      {/* Customized Filter Button with the morphing Hamburger animations from User Checkbox */}
                      <div className="relative">
                        {/* Checkbox placed outside label so section can be a sibling */}
                        <input 
                          className="filter-inp" 
                          id="filter-toggle"
                          type="checkbox" 
                          checked={!showFilterMenu}
                          onChange={e => setShowFilterMenu(!e.target.checked)}
                          style={{ display: 'none' }}
                        />
                        <label className="filter-main" htmlFor="filter-toggle">
                          Bộ lọc nâng cao
                          <div className="filter-bar">
                            <span className="filter-top filter-bar-list" />
                            <span className="filter-middle filter-bar-list" />
                            <span className="filter-bottom filter-bar-list" />
                          </div>
                        </label>

                        {/* Slide down expandable filters panel - OUTSIDE label to prevent nested label conflicts */}
                        {showFilterMenu && (
                          <section className="filter-menu-container" style={{ clipPath: 'inset(0% 0% 0% 0% round 16px)', opacity: 1 }} onClick={e => e.stopPropagation()}>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                              
                              {/* Item 1: Status selection */}
                              <div className="filter-item-list space-y-2">
                                <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider block">Trạng thái tài khoản</span>
                                <div className="grid grid-cols-1 gap-1.5">
                                  {[
                                    { value: 'ALL', label: 'Tất cả' },
                                    { value: 'ACTIVE', label: 'Active (Hoạt động)' },
                                    { value: 'LOCKED', label: 'Locked (Đang khóa)' },
                                    { value: 'BANNED', label: 'Banned (Bị cấm)' },
                                    { value: 'OFFLINE', label: 'Offline (Ngoại tuyến)' }
                                  ].map(status => (
                                    <div key={status.value} className="space-y-1">
                                      <button
                                        type="button"
                                        onClick={() => setUserStatusFilter(status.value)}
                                        className={`w-full px-3.5 py-2.5 rounded-xl text-left font-semibold text-body-sm transition-all border flex items-center gap-2.5 ${
                                          userStatusFilter === status.value
                                            ? 'bg-blue-50/75 border-blue-500 text-blue-700 shadow-sm'
                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                      >
                                        <span className={`w-2 h-2 rounded-full ${
                                          status.value === 'ACTIVE' ? 'bg-emerald-500' :
                                          status.value === 'LOCKED' ? 'bg-amber-500' :
                                          status.value === 'BANNED' ? 'bg-rose-500' :
                                          status.value === 'OFFLINE' ? 'bg-slate-400' :
                                          'bg-blue-500'
                                        }`}></span>
                                        {status.label}
                                      </button>
                                      
                                      {status.value === 'ACTIVE' && userStatusFilter === 'ACTIVE' && (
                                        <div className="pl-6 pr-2 py-2 mt-1 bg-slate-50 border border-slate-100 rounded-xl space-y-2 animate-in slide-in-from-top-1 duration-200">
                                          <label className="flex items-center gap-2.5 cursor-pointer text-[11px] font-bold text-slate-600 select-none">
                                            <input 
                                              type="checkbox"
                                              checked={activeOnlineChecked}
                                              onChange={e => setActiveOnlineChecked(e.target.checked)}
                                              className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                            />
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            Đang trực tuyến (Online)
                                          </label>
                                          <label className="flex items-center gap-2.5 cursor-pointer text-[11px] font-bold text-slate-600 select-none">
                                            <input 
                                              type="checkbox"
                                              checked={activeOfflineChecked}
                                              onChange={e => setActiveOfflineChecked(e.target.checked)}
                                              className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                            />
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                            Ngoại tuyến (Offline)
                                          </label>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Item 2: Time Selection */}
                              <div className="filter-item-list space-y-2">
                                <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider block">Đăng nhập lần cuối</span>
                                <div className="flex flex-col gap-1.5">
                                  {[
                                    { value: 'ALL', label: 'Tất cả thời gian' },
                                    { value: '8HOURS', label: 'Hoạt động 8 tiếng trước' },
                                    { value: 'CUSTOM', label: 'Lọc theo khoảng ngày...' }
                                  ].map(timeOpt => (
                                    <button
                                      key={timeOpt.value}
                                      onClick={() => setUserTimeFilterType(timeOpt.value)}
                                      className={`px-3.5 py-2.5 rounded-xl text-left font-semibold text-body-sm transition-all border flex justify-between items-center ${
                                        userTimeFilterType === timeOpt.value
                                          ? 'bg-blue-50/75 border-blue-500 text-blue-700 shadow-sm'
                                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                      }`}
                                    >
                                      {timeOpt.label}
                                      {userTimeFilterType === timeOpt.value && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                                      )}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Item 3: Custom date ranges */}
                              <div className="filter-item-list space-y-2">
                                <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider block">Chọn khoảng ngày</span>
                                <div className={`p-4 rounded-2xl border transition-all duration-300 ${
                                  userTimeFilterType === 'CUSTOM'
                                    ? 'bg-blue-50/20 border-blue-200'
                                    : 'bg-slate-50/50 border-slate-200 opacity-60 pointer-events-none'
                                }`}>
                                  <div className="space-y-3">
                                    <div className="flex flex-col gap-1">
                                      <span className="text-[11px] font-bold text-slate-400">TỪ NGÀY</span>
                                      <input 
                                        type="date" 
                                        value={userTimeStart}
                                        onChange={e => setUserTimeStart(e.target.value)}
                                        className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-body-xs font-semibold outline-none focus:border-blue-500 w-full"
                                      />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                      <span className="text-[11px] font-bold text-slate-400">ĐẾN NGÀY</span>
                                      <input 
                                        type="date" 
                                        value={userTimeEnd}
                                        onChange={e => setUserTimeEnd(e.target.value)}
                                        className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-body-xs font-semibold outline-none focus:border-blue-500 w-full"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>

                            </div>

                            {/* Reset Button inside filters panel */}
                            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setUserStatusFilter('ALL');
                                  setUserTimeFilterType('ALL');
                                  setUserTimeStart('');
                                  setUserTimeEnd('');
                                  setSearchQuery('');
                                }}
                                className="px-4 py-2 hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-body-sm font-bold transition-all shadow-sm"
                              >
                                Đặt lại bộ lọc
                              </button>
                            </div>
                          </section>
                        )}
                      </div>

                    </div>
                  </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto min-w-0">
                    <table className="w-full text-left border-collapse table-fixed">
                      <thead>
                        <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-400 font-bold text-[11px] uppercase tracking-wider">
                          <th className="px-3 py-3.5 pl-5 w-[80px]">ID</th>
                          <th className="px-3 py-3.5 w-[140px]">Tên hiển thị</th>
                          <th className="px-3 py-3.5 w-[180px]">Email</th>
                          <th className="px-3 py-3.5 w-[95px]">Vai trò</th>
                          <th className="px-3 py-3.5 w-[95px]">Trạng thái</th>
                          <th className="px-3 py-3.5 w-[170px]">Đăng nhập cuối</th>
                          <th className="px-3 py-3.5 w-[100px]">Ngày gia nhập</th>
                          <th className="px-3 py-3.5 text-center w-[140px]">Hành động bảo mật</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(() => {
                          const totalPages = Math.ceil(filteredUsers.length / 20);
                          const paginatedUsers = filteredUsers.slice((currentPage - 1) * 20, currentPage * 20);

                          if (paginatedUsers.length === 0) {
                            return (
                              <tr>
                                <td colSpan="8" className="p-12 text-center text-slate-400 font-medium">
                                  Không tìm thấy người dùng nào khớp điều kiện lọc nâng cao
                                </td>
                              </tr>
                            );
                          }

                          return paginatedUsers.map((user) => (
                            <tr key={`${user.role}-${user.id}`} className="hover:bg-slate-50/50 transition-colors text-[12.5px]">
                              <td className="px-3 py-3 pl-5 text-slate-500 font-mono font-bold whitespace-nowrap w-[80px]">
                                #{user.id}
                              </td>
                              <td className="px-3 py-3 font-bold text-primary truncate whitespace-nowrap w-[140px]" title={user.name}>{user.name}</td>
                              <td className="px-3 py-3 text-slate-600 truncate whitespace-nowrap w-[180px]" title={user.email}>{user.email}</td>
                              <td className="px-3 py-3 font-medium whitespace-nowrap w-[95px]">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                                  user.role === 'FREELANCER' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-purple-50 text-purple-700 border border-purple-100'
                                }`}>
                                  {user.role}
                                </span>
                              </td>
                              <td className="px-3 py-3 whitespace-nowrap w-[95px]">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                  user.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                  user.status === 'LOCKED' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                  'bg-rose-50 text-rose-700 border border-rose-100'
                                }`}>
                                  {user.status}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-slate-600 font-mono text-[11px] whitespace-nowrap w-[170px]">
                                <div className="flex items-center gap-1.5">
                                  {(() => {
                                    if (!user.lastLogin) {
                                      return (
                                        <>
                                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                          <span className="text-slate-400">Chưa từng đăng nhập</span>
                                        </>
                                      );
                                    }
                                    const cleanStr = user.lastLogin.split('.')[0];
                                    const lastLoginTime = new Date(cleanStr).getTime();
                                    const isOnline = Date.now() - lastLoginTime < (5 * 60 * 1000);
                                    return (
                                      <>
                                        <span className={`w-2 h-2 rounded-full relative flex`}>
                                          {isOnline && (
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                          )}
                                          <span className={`relative inline-flex rounded-full h-2 w-2 ${isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                        </span>
                                        <span className={isOnline ? 'font-bold text-emerald-600' : 'text-slate-600'}>
                                          {new Date(cleanStr).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <span className={`text-[8.5px] px-1 py-0.5 rounded-full font-sans font-extrabold ${isOnline ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'}`}>
                                          {isOnline ? 'ON' : 'OFF'}
                                        </span>
                                      </>
                                    );
                                  })()}
                                </div>
                              </td>
                              <td className="px-3 py-3 text-slate-500 whitespace-nowrap w-[100px]">{user.joined}</td>
                              <td className="px-3 py-3 text-center whitespace-nowrap w-[140px]">
                                <div className="flex justify-center gap-1">
                                  {user.isProtectedAdmin ? (
                                    <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded-xl font-bold text-[11px] flex items-center gap-1">
                                      <ShieldAlert className="w-3 h-3" /> Được bảo vệ
                                    </span>
                                  ) : user.status === 'ACTIVE' ? (
                                    <>
                                      <button 
                                        onClick={() => { setActiveUserForAction(user); setActionType('lock'); }}
                                        className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-1 rounded-xl font-bold text-[11px] flex items-center gap-0.5 transition-all"
                                      >
                                        <Lock className="w-3 h-3" /> Khóa
                                      </button>
                                      <button 
                                        onClick={() => { setActiveUserForAction(user); setActionType('ban'); }}
                                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-1.5 py-1 rounded-xl font-bold text-[11px] flex items-center gap-0.5 transition-all"
                                      >
                                        <Ban className="w-3 h-3" /> Cấm
                                      </button>
                                    </>
                                  ) : (
                                    <button 
                                      onClick={() => handleUserStatusChange(user.id, user.role, 'ACTIVE')}
                                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-xl font-bold text-[11px] flex items-center gap-1 transition-all"
                                    >
                                      <Unlock className="w-3 h-3" /> Mở khóa
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>

                  {/* Gorgeous Premium Pagination Controls Component */}
                  {(() => {
                    const totalPages = Math.ceil(filteredUsers.length / 20);
                    return (
                      <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <span className="text-body-sm font-semibold text-slate-500">
                          Hiển thị từ <span className="font-mono text-primary font-bold">{filteredUsers.length === 0 ? 0 : (currentPage - 1) * 20 + 1}</span> đến{' '}
                          <span className="font-mono text-primary font-bold">
                            {Math.min(currentPage * 20, filteredUsers.length)}
                          </span>{' '}
                          trong tổng số <span className="font-mono text-blue-600 font-bold">{filteredUsers.length}</span> thành viên
                        </span>

                        {totalPages > 1 && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setCurrentPage(1)}
                              disabled={currentPage === 1}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-all shadow-sm flex items-center justify-center"
                              title="Trang đầu (<<)"
                            >
                              <ChevronsLeft className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                              disabled={currentPage === 1}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-all shadow-sm flex items-center justify-center"
                              title="Trang trước (<)"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            
                            <span className="px-3 py-1 rounded-lg bg-blue-50/70 border border-blue-100 text-blue-700 text-body-sm font-extrabold font-mono">
                              Trang {currentPage} / {totalPages}
                            </span>

                            <button
                              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                              disabled={currentPage === totalPages}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-all shadow-sm flex items-center justify-center"
                              title="Trang sau (>)"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setCurrentPage(totalPages)}
                              disabled={currentPage === totalPages}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-all shadow-sm flex items-center justify-center"
                              title="Trang cuối (>>)"
                            >
                              <ChevronsRight className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })()}

          {/* TAB 3: PROJECT MODERATION */}
          {activeTab === 'moderation' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="font-bold text-primary text-body-md mb-2">Đang Chờ Kiểm Duyệt Dự Án (Pending Review)</h3>
                <p className="text-body-sm text-slate-500">Các tin đăng tuyển dụng mới từ doanh nghiệp cần Admin phê duyệt nội dung trước khi xuất bản công khai.</p>
              </div>

              <div className="grid grid-cols-1 gap-5">
                {pendingProjects.length === 0 ? (
                  <div className="bg-white p-12 rounded-2xl text-center border border-slate-200 shadow-sm">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                    <h4 className="font-bold text-primary text-lg">Sạch sẽ!</h4>
                    <p className="text-slate-500 mt-2">Không còn dự án nào đang chờ kiểm duyệt.</p>
                  </div>
                ) : (
                  pendingProjects.map((project) => (
                    <div key={project.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded text-[11px] font-bold">{project.type || 'N/A'}</span>
                          <span className="text-[12px] text-slate-400">Gửi lúc {project.createdAt ? new Date(project.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
                        </div>
                        <h4 className="font-display font-bold text-lg text-primary">{project.title}</h4>
                        <p className="text-body-sm text-slate-600">Đăng bởi: <span className="font-bold text-slate-800">{project.clientName || 'N/A'}</span> • Ngân sách: <span className="font-bold text-emerald-600">{project.budget ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(project.budget) : 'Thỏa thuận'}</span></p>
                      </div>

                      <div className="flex gap-2 w-full md:w-auto">
                        <button 
                          onClick={() => handleProjectAction(project.id, true)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-body-sm transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/10 flex-grow md:flex-grow-0 justify-center"
                        >
                          <Check className="w-4 h-4" /> Duyệt
                        </button>
                        <button 
                          onClick={() => {
                            const reason = prompt('Nhập lý do từ chối kiểm duyệt dự án:');
                            if (reason !== null) handleProjectAction(project.id, false, reason);
                          }}
                          className="border border-rose-200 text-rose-700 hover:bg-rose-50 px-5 py-2.5 rounded-xl font-bold text-body-sm transition-all flex items-center gap-1.5 flex-grow md:flex-grow-0 justify-center"
                        >
                          <X className="w-4 h-4" /> Từ chối
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: FINANCE CONTROL */}
          {activeTab === 'finance' && (
            <div className="space-y-8">
              {/* Withdrawal Request Board */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                  <h3 className="font-bold text-primary text-body-md">Yêu cầu rút tiền đang chờ duyệt (Withdrawal Escrow)</h3>
                  <p className="text-body-sm text-slate-500 mt-1">Xác nhận chuyển tiền cho các freelancer sau khi họ hoàn tất dự án an toàn.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-400 font-bold text-[11px] uppercase tracking-wider">
                        <th className="p-4 pl-6">ID</th>
                        <th className="p-4">Freelancer</th>
                        <th className="p-4">Số tiền yêu cầu</th>
                        <th className="p-4">Thông tin ngân hàng</th>
                        <th className="p-4">Ngày yêu cầu</th>
                        <th className="p-4">Trạng thái</th>
                        <th className="p-4 text-center">Hành động duyệt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {withdrawals.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="p-8 text-center text-slate-400">Không có yêu cầu rút tiền nào</td>
                        </tr>
                      ) : (
                        withdrawals.map((w) => (
                          <tr key={w.id} className="hover:bg-slate-50/50 transition-colors text-body-sm">
                            <td className="p-4 pl-6 text-slate-500">#{w.id}</td>
                            <td className="p-4 font-bold text-primary">{w.userEmail || w.userName || 'N/A'}</td>
                            <td className="p-4 font-extrabold text-emerald-600">{w.amount ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(w.amount) : '0 ₫'}</td>
                            <td className="p-4 font-mono text-[12px]">{w.bankName ? `${w.bankName}` : 'N/A'}</td>
                            <td className="p-4 text-slate-500">{w.createdAt ? new Date(w.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}</td>
                            <td className="p-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                w.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' :
                                w.status === 'REJECTED' ? 'bg-rose-50 text-rose-700' :
                                'bg-amber-50 text-amber-700'
                              }`}>
                                {w.status}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              {w.status === 'PENDING' ? (
                                <div className="flex justify-center gap-2">
                                  <button 
                                    onClick={() => handleWithdrawalAction(w.id, true)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-bold text-[12px] transition-all flex items-center gap-0.5"
                                  >
                                    <Check className="w-3.5 h-3.5" /> Approve
                                  </button>
                                  <button 
                                    onClick={() => handleWithdrawalAction(w.id, false)}
                                    className="border border-rose-200 text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg font-bold text-[12px] transition-all flex items-center gap-0.5"
                                  >
                                    <X className="w-3.5 h-3.5" /> Từ chối
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[12px] text-slate-400 font-medium">Đã xử lý</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CMS & SYSTEM MANAGEMENT */}
          {activeTab === 'cms' && (
            <div className="space-y-6">
              {/* CMS Sub-navigation */}
              <div className="flex flex-wrap gap-2 pb-4 border-b border-slate-200">
                {[
                  { id: 'seo', label: 'Cấu hình Hệ thống' },
                  { id: 'categories', label: 'Danh mục Việc làm', count: jobCategories.length },
                  { id: 'kyc', label: 'Duyệt KYC', count: kycRequests.length },
                  { id: 'disputes', label: 'Tranh chấp', count: disputes.length },
                  { id: 'reports', label: 'Báo cáo vi phạm', count: reports.length },
                  { id: 'articles', label: 'Bài viết CMS', count: articles.length },
                  { id: 'tickets', label: 'Hỗ trợ Tickets', count: tickets.length }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveCmsTab(tab.id)}
                    className={`px-4 py-2 rounded-xl text-body-sm font-bold transition-all flex items-center gap-2 ${
                      activeCmsTab === tab.id 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {tab.label}
                    {tab.count !== undefined && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                        activeCmsTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* System Configs Sub-tab */}
              {activeCmsTab === 'seo' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="font-bold text-primary text-body-md border-b border-slate-100 pb-2">Thiết lập cấu hình SEO (UC-42)</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-[12px] font-bold text-slate-500 uppercase block mb-1">Meta Title trang chủ</label>
                        <input type="text" defaultValue={seoConfigs.length > 0 ? seoConfigs[0].meta_title : "vLance - Thuê Freelancer Việt Nam Uy Tín Số 1"} className="w-full border border-slate-200 rounded-lg p-2.5 text-body-sm outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="text-[12px] font-bold text-slate-500 uppercase block mb-1">Meta Description trang chủ</label>
                        <textarea rows="3" defaultValue={seoConfigs.length > 0 ? seoConfigs[0].meta_description : "Sàn thương mại điện tử về dịch vụ tự do..."} className="w-full border border-slate-200 rounded-lg p-2.5 text-body-sm outline-none focus:border-blue-500 resize-none" />
                      </div>
                      <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-body-sm px-4 py-2.5 rounded-xl shadow-md transition-all">Lưu cấu hình SEO</button>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="font-bold text-primary text-body-md border-b border-slate-100 pb-2">Cấu hình phí dịch vụ Escrow (UC-30)</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-700">Mức phí nền tảng hiện tại</p>
                          <p className="text-[12px] text-slate-500">Phí thu trên mỗi cột mốc hoàn thành</p>
                        </div>
                        <span className="font-extrabold text-2xl text-blue-600 bg-blue-50 px-4 py-2 rounded-xl">{feeRate.toFixed(1)}%</span>
                      </div>
                      <div>
                        <label className="text-[12px] font-bold text-slate-500 uppercase block mb-1">Thay đổi % phí mới</label>
                        <input 
                          type="number" 
                          value={feeRate} 
                          onChange={e => setFeeRate(parseFloat(e.target.value))}
                          min="5" 
                          max="25" 
                          className="w-full border border-slate-200 rounded-lg p-2.5 text-body-sm outline-none focus:border-blue-500" 
                        />
                      </div>
                      <button 
                        onClick={() => handleUpdateFeeConfig(feeRate)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-body-sm px-4 py-2.5 rounded-xl shadow-md transition-all"
                      >
                        Áp dụng phí mới
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Dynamic DB Data Tables (Mock UI for Real Data arrays) */}
              {activeCmsTab !== 'seo' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-200 bg-slate-50">
                    <h3 className="font-bold text-primary text-body-md uppercase tracking-wider">
                      Database Records: {activeCmsTab}
                    </h3>
                  </div>
                  <div className="p-6">
                    {(() => {
                      const data = 
                        activeCmsTab === 'categories' ? jobCategories :
                        activeCmsTab === 'kyc' ? kycRequests :
                        activeCmsTab === 'disputes' ? disputes :
                        activeCmsTab === 'reports' ? reports :
                        activeCmsTab === 'articles' ? articles : tickets;
                      
                      if (data.length === 0) {
                        return <p className="text-center text-slate-400 py-8">Chưa có dữ liệu trong Database cho mục này.</p>;
                      }

                      // Dynamic table rendering based on first object keys
                      const headers = Object.keys(data[0]);
                      return (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-100 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider">
                                {headers.map(h => <th key={h} className="p-3">{h.replace(/_/g, ' ')}</th>)}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {data.map((row, i) => (
                                <tr key={i} className="hover:bg-slate-50 transition-colors text-body-sm">
                                  {headers.map(h => (
                                    <td key={h} className="p-3 text-slate-700 max-w-[200px] truncate">
                                      {String(row[h] !== null ? row[h] : 'NULL')}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

      </main>

      {/* MODAL 1: AUDIT LOG DETAIL PREVIEW */}
      {selectedActivity && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h4 className="font-bold text-primary text-lg">Chi Tiết Hoạt Động Nhật Ký</h4>
              <button 
                onClick={() => setSelectedActivity(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Thời Gian</span>
                <span className="text-body-md font-medium text-slate-800">{selectedActivity.timestamp}</span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Nguồn Hoạt Động (Actor)</span>
                <span className="text-body-md font-bold text-blue-600">{selectedActivity.source}</span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Chi Tiết Nghiệp Vụ</span>
                <span className="text-body-md text-slate-600 block bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                  {selectedActivity.detail}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Trạng Thế Hệ Thống</span>
                <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-extrabold mt-1 uppercase ${
                  selectedActivity.status === 'Approved' || selectedActivity.status === 'Verified' ? 'bg-emerald-100 text-emerald-800' :
                  selectedActivity.status === 'Critical' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-800'
                }`}>
                  {selectedActivity.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: USER SECURE ACTION */}
      {activeUserForAction && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h4 className="font-bold text-primary text-lg">
                {actionType === 'lock' ? 'Khóa Tài Khoản Người Dùng' : 'Cấm Tài Khoản Vĩnh Viễn'}
              </h4>
              <button 
                onClick={() => setActiveUserForAction(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-body-sm text-slate-500">
                Xác nhận thay đổi bảo mật cho tài khoản của <span className="font-bold text-slate-800">{activeUserForAction.name}</span> ({activeUserForAction.email}).
              </p>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Nhập lý do bảo mật (Bắt buộc)</label>
                <textarea 
                  rows="3" 
                  placeholder="Gian lận thanh toán, spam tin..." 
                  className="w-full border border-slate-200 rounded-xl p-3 text-body-sm outline-none focus:border-blue-500 resize-none"
                  value={banReason}
                  onChange={e => setBanReason(e.target.value)}
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button 
                  onClick={() => setActiveUserForAction(null)}
                  className="border border-slate-200 text-slate-600 px-4 py-2 rounded-xl font-bold text-body-sm hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button 
                  disabled={!banReason.trim()}
                  onClick={() => handleUserStatusChange(activeUserForAction.id, activeUserForAction.role, actionType === 'lock' ? 'LOCKED' : 'BANNED')}
                  className={`px-5 py-2 rounded-xl font-bold text-body-sm text-white shadow-md transition-all ${
                    !banReason.trim() 
                      ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                      : actionType === 'lock' 
                        ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/10' 
                        : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/10'
                  }`}
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[100] max-w-md px-5 py-4 rounded-2xl shadow-2xl border flex items-start gap-3 animate-in slide-in-from-bottom-4 duration-300 ${
          toast.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
            toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
          }`}>
            {toast.type === 'success' 
              ? <CheckCircle2 className="w-4 h-4 text-white" />
              : <AlertTriangle className="w-4 h-4 text-white" />
            }
          </div>
          <div className="flex-grow">
            <p className="font-bold text-[13px]">{toast.type === 'success' ? 'Thành công' : 'Thao tác bị từ chối'}</p>
            <p className="text-[12px] opacity-80 mt-0.5 leading-relaxed">{toast.message}</p>
          </div>
          <button onClick={() => setToast(null)} className="text-current opacity-40 hover:opacity-100 shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

    </div>
  );
}

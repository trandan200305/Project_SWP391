import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, ShieldAlert, BadgeDollarSign, Settings, 
  Search, Bell, UserCheck, AlertTriangle, CheckCircle2, Ban, 
  Lock, Unlock, Eye, X, Check, HeartPulse, HelpCircle, LogOut, 
  ArrowUpRight, ArrowDownRight, Calendar, Info, Sliders, Sparkles, RefreshCw, Download
} from 'lucide-react';

export default function AdminDashboard({ onNavigateToHome }) {
  // Tabs: 'dashboard' | 'users' | 'moderation' | 'finance' | 'cms'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('30days'); // '7days' | '30days' | '365days'
  
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
  const [userGrowthTrend, setUserGrowthTrend] = useState([]);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [feeRate, setFeeRate] = useState(10.0);

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
  const [actionType, setActionType] = useState(''); // 'lock' | 'ban'

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
    fetch(`http://localhost:8080/api/admin/fee-config?fee=${newFee}`, {
      method: 'POST'
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setFeeRate(data.fee);
          fetchStats(selectedPeriod); // Re-calculate dynamic revenues based on new fee multiplier
          // Refresh audit logs
          fetch('http://localhost:8080/api/admin/audit-logs')
            .then(res => res.json())
            .then(logs => setAuditLogs(logs));
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
      .then(data => setUserGrowthTrend(data))
      .catch(err => console.error('Error user growth chart:', err));

    // Fetch Revenue Trend series
    fetch('http://localhost:8080/api/admin/charts/revenue')
      .then(res => res.json())
      .then(data => setRevenueTrend(data))
      .catch(err => console.error('Error revenue chart:', err));

    // Fetch audit logs
    fetch('http://localhost:8080/api/admin/audit-logs')
      .then(res => res.json())
      .then(data => {
        setAuditLogs(data);
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
          setUsers(data);
          setIsLoading(false);
        })
        .catch(err => console.error('Error users:', err));
    } else if (activeTab === 'moderation') {
      setIsLoading(true);
      fetch('http://localhost:8080/api/admin/projects/pending')
        .then(res => res.json())
        .then(data => {
          setPendingProjects(data);
          setIsLoading(false);
        })
        .catch(err => console.error('Error projects:', err));
    } else if (activeTab === 'finance') {
      setIsLoading(true);
      fetch('http://localhost:8080/api/admin/withdrawals')
        .then(res => res.json())
        .then(data => {
          setWithdrawals(data);
          setIsLoading(false);
        })
        .catch(err => console.error('Error withdrawals:', err));
    }
  }, [activeTab, selectedPeriod]);

  // Handle User Security Status Action
  const handleUserStatusChange = (userId, newStatus) => {
    const reasonParam = encodeURIComponent(banReason || 'Yêu cầu từ Admin');
    fetch(`http://localhost:8080/api/admin/users/${userId}/status?status=${newStatus}&reason=${reasonParam}`, {
      method: 'PUT'
    })
      .then(res => res.json())
      .then(() => {
        fetch('http://localhost:8080/api/admin/users')
          .then(res => res.json())
          .then(data => setUsers(data));
        loadDashboardData();
        setActiveUserForAction(null);
        setBanReason('');
      })
      .catch(err => console.error(err));
  };

  // Handle Moderation Action (Approve/Reject)
  const handleProjectAction = (projectId, approve, reason = '') => {
    const reasonParam = encodeURIComponent(reason);
    fetch(`http://localhost:8080/api/admin/projects/${projectId}/moderate?approve=${approve}&reason=${reasonParam}`, {
      method: 'PUT'
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
    fetch(`http://localhost:8080/api/admin/withdrawals/${withdrawalId}/process?status=${status}`, {
      method: 'PUT'
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
  const getSvgCoordinates = (data, field, width = 600, height = 160) => {
    if (!data || data.length === 0) return '';
    const maxVal = Math.max(...data.map(d => d[field] || 1));
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
    <div className="min-h-screen bg-slate-100 flex font-sans antialiased text-slate-800">
      
      {/* Sidebar Navigation - iOS Settings Card layout */}
      <aside className="w-80 bg-slate-50 border-r border-slate-200/80 flex flex-col justify-between p-6 shrink-0">
        <div className="space-y-6">
          <div className="px-2">
            <div className="flex items-center gap-2.5 text-primary font-extrabold text-2xl font-display">
              <ShieldAlert className="w-6 h-6 text-blue-600 animate-pulse" />
              <span>vLance Admin</span>
            </div>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1 pl-8">System Control Panel</p>
          </div>

          <div className="space-y-3">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-2">Settings</p>
            
            <nav className="space-y-3">
              {/* TAB 1: DASHBOARD CARD */}
              <div 
                onClick={() => setActiveTab('dashboard')}
                className={`rounded-2xl p-4 flex items-center gap-4 transition-all cursor-pointer shadow-sm ${
                  activeTab === 'dashboard' 
                    ? 'bg-white border-2 border-blue-500 shadow-md scale-[1.02]' 
                    : 'bg-white hover:bg-slate-50 border border-slate-200/75 hover:scale-[1.01]'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-sm shrink-0">
                  <LayoutDashboard className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 text-[14px]">Overview Dashboard</p>
                  <p className="text-[11px] text-slate-400 truncate">Real-time stats and metrics</p>
                </div>
              </div>

              {/* TAB 2: USER MANAGEMENT CARD */}
              <div 
                onClick={() => setActiveTab('users')}
                className={`rounded-2xl p-4 flex items-center gap-4 transition-all cursor-pointer shadow-sm ${
                  activeTab === 'users' 
                    ? 'bg-white border-2 border-indigo-500 shadow-md scale-[1.02]' 
                    : 'bg-white hover:bg-slate-50 border border-slate-200/75 hover:scale-[1.01]'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white shadow-sm shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 text-[14px]">User Management</p>
                  <p className="text-[11px] text-slate-400 truncate">Lock, ban, or unlock accounts</p>
                </div>
              </div>

              {/* TAB 3: PROJECT MODERATION CARD */}
              <div 
                onClick={() => setActiveTab('moderation')}
                className={`rounded-2xl p-4 flex items-center gap-4 transition-all cursor-pointer relative shadow-sm ${
                  activeTab === 'moderation' 
                    ? 'bg-white border-2 border-emerald-500 shadow-md scale-[1.02]' 
                    : 'bg-white hover:bg-slate-50 border border-slate-200/75 hover:scale-[1.01]'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-sm shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 text-[14px]">Project Moderation</p>
                  <p className="text-[11px] text-slate-400 truncate">Review and approve jobs</p>
                </div>
                {pendingProjects.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-extrabold w-5 h-5 flex items-center justify-center rounded-full shadow-sm animate-bounce">
                    {pendingProjects.length}
                  </span>
                )}
              </div>

              {/* TAB 4: FINANCE CONTROL CARD */}
              <div 
                onClick={() => setActiveTab('finance')}
                className={`rounded-2xl p-4 flex items-center gap-4 transition-all cursor-pointer relative shadow-sm ${
                  activeTab === 'finance' 
                    ? 'bg-white border-2 border-amber-500 shadow-md scale-[1.02]' 
                    : 'bg-white hover:bg-slate-50 border border-slate-200/75 hover:scale-[1.01]'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-sm shrink-0">
                  <BadgeDollarSign className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 text-[14px]">Finance Control</p>
                  <p className="text-[11px] text-slate-400 truncate">Withdrawals & platform fees</p>
                </div>
                {withdrawals.filter(w => w.status === 'PENDING').length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-[10px] font-extrabold w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
                    {withdrawals.filter(w => w.status === 'PENDING').length}
                  </span>
                )}
              </div>

              {/* TAB 5: CMS SETTINGS CARD */}
              <div 
                onClick={() => setActiveTab('cms')}
                className={`rounded-2xl p-4 flex items-center gap-4 transition-all cursor-pointer shadow-sm ${
                  activeTab === 'cms' 
                    ? 'bg-white border-2 border-cyan-500 shadow-md scale-[1.02]' 
                    : 'bg-white hover:bg-slate-50 border border-slate-200/75 hover:scale-[1.01]'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-500 flex items-center justify-center text-white shadow-sm shrink-0">
                  <Settings className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 text-[14px]">CMS Settings</p>
                  <p className="text-[11px] text-slate-400 truncate">SEO and configurations</p>
                </div>
              </div>
            </nav>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-200/50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Database Status</p>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
              <span className="text-[12px] font-bold text-slate-700">SQL Server Connected</span>
            </div>
            <p className="text-[9px] text-slate-400">Response Latency: <span className="font-mono font-bold text-emerald-600">12ms</span></p>
          </div>
          
          <div className="pt-4 border-t border-slate-200/60 space-y-1">
            <button 
              onClick={onNavigateToHome}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-rose-600 hover:bg-rose-50 rounded-xl font-bold text-body-sm transition-all"
            >
              <LogOut className="w-5 h-5" />
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

          <div className="flex items-center gap-4">
            {/* Real-time date control filter representing "tối ưu quyền điều khiển" */}
            <div className="bg-white border border-slate-200 rounded-xl p-1.5 flex items-center gap-1 shadow-sm">
              <button 
                onClick={() => setSelectedPeriod('7days')}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all ${
                  selectedPeriod === '7days' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                7 Ngày
              </button>
              <button 
                onClick={() => setSelectedPeriod('30days')}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all ${
                  selectedPeriod === '30days' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                30 Ngày
              </button>
              <button 
                onClick={() => setSelectedPeriod('365days')}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all ${
                  selectedPeriod === '365days' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                1 Năm
              </button>
            </div>
            
            <button 
              onClick={loadDashboardData}
              className="p-2.5 text-slate-400 hover:text-slate-600 rounded-xl border border-slate-200 hover:bg-slate-50 bg-white shadow-sm"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Dynamic Panels */}
        <div className="flex-grow p-8 overflow-y-auto space-y-8">
          
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
                          points={getSvgCoordinates(userGrowthTrend, 'compareValue', chartWidth, 160)}
                        />
                      )}

                      {/* Main Registration Line */}
                      {userGrowthTrend.length > 0 && (
                        <>
                          {/* Gradient Area Fill */}
                          <path
                            d={`M 30,140 L ${getSvgCoordinates(userGrowthTrend, 'value', chartWidth, 160)} L ${((userGrowthTrend.length - 1) / (userGrowthTrend.length - 1)) * (chartWidth - 60) + 30},140 Z`}
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
                            points={getSvgCoordinates(userGrowthTrend, 'value', chartWidth, 160)}
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
                        <div key={index} className="flex flex-col items-center gap-3 relative z-10 w-full group">
                          <div 
                            className="bg-blue-100 w-10 hover:bg-blue-600 rounded-t-lg transition-all duration-300 shadow-sm cursor-pointer relative"
                            style={{ height: `${percentHeight}%` }}
                          >
                            {/* Bar hover tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 text-white rounded-lg px-2.5 py-1 text-[10px] font-mono font-bold opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg">
                              ${(pt.value / 1000).toFixed(1)}k
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
                  <button className="text-secondary font-bold text-body-sm hover:underline">Xem Tất Cả Hoạt Động</button>
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
                      {auditLogs.slice(0, 8).map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors text-body-sm">
                          <td className="p-4 pl-6 text-slate-500 font-medium">{log.timestamp}</td>
                          <td className="p-4 font-bold text-primary">{log.source}</td>
                          <td className="p-4 text-slate-600">{log.detail}</td>
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
          {activeTab === 'users' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-bold text-primary text-body-md">Danh sách Tài khoản Người dùng</h3>
                <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 flex items-center gap-2">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Lọc tài khoản..." 
                    className="bg-transparent border-none text-body-sm outline-none"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-400 font-bold text-[11px] uppercase tracking-wider">
                      <th className="p-4 pl-6">ID</th>
                      <th className="p-4">Tên hiển thị</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Vai trò</th>
                      <th className="p-4">Trạng thái</th>
                      <th className="p-4">Ngày gia nhập</th>
                      <th className="p-4 text-center">Hành động bảo mật</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase())).map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/50 transition-colors text-body-sm">
                        <td className="p-4 pl-6 text-slate-500">#{user.id}</td>
                        <td className="p-4 font-bold text-primary">{user.name}</td>
                        <td className="p-4 text-slate-600">{user.email}</td>
                        <td className="p-4 font-medium">{user.role}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            user.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' :
                            user.status === 'LOCKED' ? 'bg-amber-50 text-amber-700' :
                            'bg-rose-50 text-rose-700'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500">{user.joined}</td>
                        <td className="p-4 text-center flex justify-center gap-2">
                          {user.status === 'ACTIVE' ? (
                            <>
                              <button 
                                onClick={() => { setActiveUserForAction(user); setActionType('lock'); }}
                                className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-xl font-bold text-[12px] flex items-center gap-1 transition-all"
                              >
                                <Lock className="w-3.5 h-3.5" /> Khóa
                              </button>
                              <button 
                                onClick={() => { setActiveUserForAction(user); setActionType('ban'); }}
                                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-xl font-bold text-[12px] flex items-center gap-1 transition-all"
                              >
                                <Ban className="w-3.5 h-3.5" /> Banned
                              </button>
                            </>
                          ) : (
                            <button 
                              onClick={() => handleUserStatusChange(user.id, 'ACTIVE')}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-4 py-1.5 rounded-xl font-bold text-[12px] flex items-center gap-1 transition-all"
                            >
                              <Unlock className="w-3.5 h-3.5" /> Mở khóa
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

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
                          <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded text-[11px] font-bold">{project.category}</span>
                          <span className="text-[12px] text-slate-400">Gửi lúc {project.submitted}</span>
                        </div>
                        <h4 className="font-display font-bold text-lg text-primary">{project.title}</h4>
                        <p className="text-body-sm text-slate-600">Đăng bởi: <span className="font-bold text-slate-800">{project.client}</span> • Ngân sách: <span className="font-bold text-emerald-600">{project.budget}</span></p>
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
                            <td className="p-4 font-bold text-primary">{w.user}</td>
                            <td className="p-4 font-extrabold text-emerald-600">{w.amount}</td>
                            <td className="p-4 font-mono text-[12px]">{w.bank}</td>
                            <td className="p-4 text-slate-500">{w.requested}</td>
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

          {/* TAB 5: CMS SETTINGS */}
          {activeTab === 'cms' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-primary text-body-md border-b border-slate-100 pb-2">Thiết lập cấu hình SEO (UC-42)</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[12px] font-bold text-slate-500 uppercase block mb-1">Meta Title trang chủ</label>
                    <input type="text" defaultValue="vLance - Thuê Freelancer Việt Nam Uy Tín Số 1" className="w-full border border-slate-200 rounded-lg p-2.5 text-body-sm outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="text-[12px] font-bold text-slate-500 uppercase block mb-1">Meta Description trang chủ</label>
                    <textarea rows="3" defaultValue="Sàn thương mại điện tử về dịch vụ tự do (freelance) lớn nhất Việt Nam giúp kết nối các dự án công nghệ, thiết kế, marketing chất lượng cao." className="w-full border border-slate-200 rounded-lg p-2.5 text-body-sm outline-none focus:border-blue-500 resize-none" />
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
                  onClick={() => handleUserStatusChange(activeUserForAction.id, actionType === 'lock' ? 'LOCKED' : 'BANNED')}
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

    </div>
  );
}

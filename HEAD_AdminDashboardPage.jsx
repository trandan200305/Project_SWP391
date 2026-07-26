import React, { useState, useEffect, useMemo } from 'react';
import { adminApi } from '../api/adminApi.js';
import { 
  LayoutDashboard, Users, ShieldAlert, BadgeDollarSign, Settings, 
  Search, Bell, UserCheck, AlertTriangle, CheckCircle2, Ban, 
  Lock, Unlock, Eye, X, Check, HeartPulse, HelpCircle, LogOut, Key, 
  ArrowUpRight, ArrowDownRight, Calendar, Info, Sliders, Sparkles, RefreshCw, Download, FileText,
  ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Home, Clock, XCircle, History, ArrowRight,
  User, Edit3, MessageSquare, Shield, ChevronDown, QrCode, Save, Zap, Plus, MoreHorizontal, Activity
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const VIETQR_BANKS = [
  { code: 'Techcombank', name: 'Ng├ón h├áng Kß╗╣ Th╞░╞íng Viß╗çt Nam', short: 'Techcombank' },
  { code: 'Vietcombank', name: 'Ng├ón h├áng TMCP Ngoß║íi Th╞░╞íng Viß╗çt Nam', short: 'Vietcombank' },
  { code: 'MBBank', name: 'Ng├ón h├áng TMCP Qu├ón ─æß╗Öi', short: 'MBBank' },
  { code: 'BIDV', name: 'Ng├ón h├áng TMCP ─Éß║ºu t╞░ v├á Ph├ít triß╗ân Viß╗çt Nam', short: 'BIDV' },
  { code: 'Agribank', name: 'Ng├ón h├áng N├┤ng nghiß╗çp v├á Ph├ít triß╗ân N├┤ng th├┤n Viß╗çt Nam', short: 'Agribank' },
  { code: 'VietinBank', name: 'Ng├ón h├áng TMCP C├┤ng Th╞░╞íng Viß╗çt Nam', short: 'VietinBank' },
  { code: 'VPBank', name: 'Ng├ón h├áng TMCP Viß╗çt Nam Thß╗ïnh V╞░ß╗úng', short: 'VPBank' },
  { code: 'ACB', name: 'Ng├ón h├áng TMCP ├ü Ch├óu', short: 'ACB' },
  { code: 'Sacombank', name: 'Ng├ón h├áng TMCP S├ái G├▓n Th╞░╞íng T├¡n', short: 'Sacombank' },
  { code: 'TPBank', name: 'Ng├ón h├áng TMCP Ti├¬n Phong', short: 'TPBank' },
  { code: 'HDBank', name: 'Ng├ón h├áng TMCP Ph├ít triß╗ân TP.HCM', short: 'HDBank' },
  { code: 'VIB', name: 'Ng├ón h├áng TMCP Quß╗æc tß║┐ Viß╗çt Nam', short: 'VIB' },
  { code: 'SeABank', name: 'Ng├ón h├áng TMCP ─É├┤ng Nam ├ü', short: 'SeABank' },
  { code: 'OCB', name: 'Ng├ón h├áng TMCP Ph╞░╞íng ─É├┤ng', short: 'OCB' },
  { code: 'MSB', name: 'Ng├ón h├áng TMCP H├áng Hß║úi Viß╗çt Nam', short: 'MSB' }
];

export default function AdminDashboard({ user, onNavigateToHome, onNavigate, onLogout }) {
  
  const [activeTab, setActiveTab] = useState('home');
  const [dashboardSubTab, setDashboardSubTab] = useState('overview');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('30days'); 
  
  
  const [userStatusFilter, setUserStatusFilter] = useState('ALL'); 
  const [userTimeFilterType, setUserTimeFilterType] = useState('ALL'); 
  const [userTimeStart, setUserTimeStart] = useState('');
  const [userTimeEnd, setUserTimeEnd] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [activeOnlineChecked, setActiveOnlineChecked] = useState(true);
  const [activeOfflineChecked, setActiveOfflineChecked] = useState(true);
  
  const [selectedRoleTab, setSelectedRoleTab] = useState('ALL');
  const [filterEmployer, setFilterEmployer] = useState(true);
  const [filterManager, setFilterManager] = useState(true);
  const [filterStaff, setFilterStaff] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createRole, setCreateRole] = useState('MANAGER');
  const [createForm, setCreateForm] = useState({
    email: '',
    password: '',
    displayName: '',
    fullName: '',
    phone: '',
    departmentId: '',
    specialization: '',
    managerId: ''
  });
  const [managersList, setManagersList] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [departmentSessions, setDepartmentSessions] = useState([]);
  const [departmentLogs, setDepartmentLogs] = useState([]);
  const [showCreateDeptModal, setShowCreateDeptModal] = useState(false);
  const [deptForm, setDeptForm] = useState({ name: '', code: '', description: '' });
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferTargetMember, setTransferTargetMember] = useState(null);
  const [transferForm, setTransferForm] = useState({ toDepartmentId: '', reason: '' });
  const [departmentTransfers, setDepartmentTransfers] = useState([]);
  const [deptDetailTab, setDeptDetailTab] = useState('sessions');
  const [verificationTasksList, setVerificationTasksList] = useState([]);
  const [selectedVerificationTask, setSelectedVerificationTask] = useState(null);
  const [showSignoffModal, setShowSignoffModal] = useState(false);
  const [signoffForm, setSignoffForm] = useState({ status: 'APPROVED', note: '', departmentCode: 'FIN' });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [customNewPassword, setCustomNewPassword] = useState('');
  
  
  const [stats, setStats] = useState({
    totalUsers: 1284,
    activeProjects: 452,
    totalRevenue: 128500.0,
    activeDisputes: 18,
    pendingWithdrawals: 2,
    usersGrowthPercent: 12.0,
    projectsGrowthPercent: 5.0,
    revenueGrowthPercent: 8.2,
    instantRevenue: 0.0
  });

  const [users, setUsers] = useState([]);
  const [pendingProjects, setPendingProjects] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLogFilter, setAuditLogFilter] = useState('ALL');
  const [userGrowthTrend, setUserGrowthTrend] = useState([]);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [feeRate, setFeeRate] = useState(10.0);
  const [servicePackages, setServicePackages] = useState([]);
  const [isUpdatingPackages, setIsUpdatingPackages] = useState(false);
  const [isEditingPackages, setIsEditingPackages] = useState(false);
  const [tempPackages, setTempPackages] = useState([]);

  
  const [jobCategories, setJobCategories] = useState([]);
  const [kycRequests, setKycRequests] = useState([]);
  const [profileRequests, setProfileRequests] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [reports, setReports] = useState([]);
  const [articles, setArticles] = useState([]);
  const [tickets, setTickets] = useState([]);

  // VNPay Finance & Integration Settings State
  const [vnpayConfig, setVnpayConfig] = useState({
    tmnCode: '',
    hashSecret: '',
    vnpUrl: '',
    returnUrl: '',
    bankName: '',
    bankAccountNo: '',
    bankAccountName: '',
    isActive: true
  });
  const [vnpayTransactions, setVnpayTransactions] = useState([]);
  const [vnpayPage, setVnpayPage] = useState(0);
  const [vnpayTotalPages, setVnpayTotalPages] = useState(1);
  const [vnpayLoading, setVnpayLoading] = useState(false);
  const [vnpaySaving, setVnpaySaving] = useState(false);
  const [vnpaySuccessMessage, setVnpaySuccessMessage] = useState('');
  const [vnpayErrorMessage, setVnpayErrorMessage] = useState('');
  const [vnpaySubTab, setVnpaySubTab] = useState('config'); // 'config' | 'logs'
  const [showVnpayConfirmModal, setShowVnpayConfirmModal] = useState(false);
  const [showVnpayEditConfirmModal, setShowVnpayEditConfirmModal] = useState(false);
  const [isEditingVnpay, setIsEditingVnpay] = useState(false);
  const [tempVnpayConfig, setTempVnpayConfig] = useState(null);
  const [showQrZoomModal, setShowQrZoomModal] = useState(false);
  const [showInvoicePreviewModal, setShowInvoicePreviewModal] = useState(false);

  // VNPay Query/Refund/VietQR States
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundTxn, setRefundTxn] = useState(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [isRefunding, setIsRefunding] = useState(false);
  
  const [selectedTxnDetails, setSelectedTxnDetails] = useState(null);
  const [testCheckoutUrl, setTestCheckoutUrl] = useState(null);
  const [payosCheckoutUrl, setPayosCheckoutUrl] = useState(null);
  const [currentPayosTxnRef, setCurrentPayosTxnRef] = useState(null);

  // Financial Dashboard States
  const [paymentTimeFilter, setPaymentTimeFilter] = useState('H├┤m nay');
  const [donutHoverState, setDonutHoverState] = useState(null);
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupError, setLookupError] = useState(null);
  const [isLookingUp, setIsLookingUp] = useState(false);

  const [seoConfigs, setSeoConfigs] = useState([]);
  const [activeCmsTab, setActiveCmsTab] = useState('seo'); 

  const [allVnpayTransactions, setAllVnpayTransactions] = useState([]);

  useEffect(() => {
    // Fetch all transactions once for the dashboard to calculate accurate stats
    const fetchAllVnpay = async () => {
      try {
        const res = await adminApi.getVnpayTransactions(0, 1000);
        setAllVnpayTransactions(res.content || []);
      } catch (e) {
        console.error('Failed to fetch all vnpay txns for dashboard:', e);
      }
    };
    fetchAllVnpay();
  }, []);

  // --- Financial Dashboard Helper & Data ---
  const paymentStats = useMemo(() => {
    let totalRevenue = 0;
    let completedOrders = 0;
    let statuses = { SUCCESS: 0, FAILED: 0, PENDING: 0 };
    
    const now = new Date();
    const isSameDay = (d1, d2) => d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();

    const filteredTxns = allVnpayTransactions.filter(txn => {
      if (!txn.createdAt) return false;
      const d = new Date(txn.createdAt);
      if (paymentTimeFilter === 'H├┤m nay') return isSameDay(d, now);
      if (paymentTimeFilter === 'H├┤m qua') {
        const y = new Date(now); y.setDate(now.getDate() - 1);
        return isSameDay(d, y);
      }
      if (paymentTimeFilter === 'Tuß║ºn n├áy') {
        const start = new Date(now); start.setDate(now.getDate() - now.getDay());
        return d >= start;
      }
      if (paymentTimeFilter === 'Th├íng n├áy') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (paymentTimeFilter === 'Th├íng tr╞░ß╗¢c') {
        let lm = now.getMonth() - 1; let y = now.getFullYear();
        if (lm < 0) { lm = 11; y--; }
        return d.getMonth() === lm && d.getFullYear() === y;
      }
      if (paymentTimeFilter === 'N─âm n├áy') return d.getFullYear() === now.getFullYear();
      if (paymentTimeFilter === 'N─âm tr╞░ß╗¢c') return d.getFullYear() === now.getFullYear() - 1;
      return true;
    });

    filteredTxns.forEach(txn => {
      if (txn.status === 'SUCCESS') {
        totalRevenue += (txn.amount || 0);
        completedOrders += 1;
        statuses.SUCCESS += 1;
      } else if (txn.status === 'FAILED' || txn.status === 'CANCELLED' || txn.status === 'REFUNDED') {
        statuses.FAILED += 1;
      } else {
        statuses.PENDING += 1;
      }
    });

    const totalTxns = filteredTxns.length || 1; 
    const donutData = [
      { id: 'SUCCESS', name: '─É├ú thanh to├ín', value: statuses.SUCCESS, color: '#34d399', percent: (statuses.SUCCESS / totalTxns) * 100 },
      { id: 'FAILED', name: 'Hß╗ºy', value: statuses.FAILED, color: '#a7f3d0', percent: (statuses.FAILED / totalTxns) * 100 },
      { id: 'PENDING', name: 'Chß╗¥ thanh to├ín', value: statuses.PENDING, color: '#047857', percent: (statuses.PENDING / totalTxns) * 100 }
    ];

    return { totalRevenue, completedOrders, donutData, totalTxns: filteredTxns.length };
  }, [allVnpayTransactions, paymentTimeFilter]);

  const handleDonutMouseMove = (e, slice) => {
    setDonutHoverState({
      x: e.clientX,
      y: e.clientY,
      data: slice
    });
  };

  const [compareMode, setCompareMode] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [chartWidth, setChartWidth] = useState(600);
  
  
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingFee, setIsUpdatingFee] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [banReasons, setBanReasons] = useState([]);
  const [adminPin, setAdminPin] = useState('');
  const [activeUserForAction, setActiveUserForAction] = useState(null);
  const [actionType, setActionType] = useState('');
  const [testPackageType, setTestPackageType] = useState('MEDIUM');

  
  const [toast, setToast] = useState({ message: '', type: 'success', visible: false });

  const handleTestVnpay = async (pkgType) => {
    const actualPkgType = pkgType || testPackageType;
    setIsLoading(true);
    try {
      const res = await adminApi.createTestVnpayUrl(null, actualPkgType);
      if (res && res.url) {
        window.open(res.url, '_blank');
      } else if (res && res.paymentUrl) {
        window.open(res.paymentUrl, '_blank');
      } else {
        showToast('Kh├┤ng tß║ío ─æ╞░ß╗úc URL thanh to├ín VNPay', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Lß╗ùi tß║ío URL thanh to├ín VNPay.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestPayos = async (pkgType) => {
    const actualPkgType = pkgType || testPackageType;
    setIsLoading(true);
    try {
      const res = await adminApi.createPayosUrl(null, actualPkgType);
      if (res && res.paymentUrl) {
        setPayosCheckoutUrl(res.paymentUrl);
        setCurrentPayosTxnRef(res.txnRef);
      } else {
        showToast('Kh├┤ng tß║ío ─æ╞░ß╗úc URL thanh to├ín PayOS', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Lß╗ùi tß║ío URL thanh to├ín PayOS.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelPayos = async () => {
    if (currentPayosTxnRef) {
      try {
        await adminApi.cancelPayosTransaction(currentPayosTxnRef);
        showToast('─É├ú hß╗ºy giao dß╗ïch v├á v├┤ hiß╗çu h├│a QR code PayOS th├ánh c├┤ng', 'success');
      } catch (err) {
        console.error('Lß╗ùi khi hß╗ºy giao dß╗ïch PayOS:', err);
      }
      setCurrentPayosTxnRef(null);
    }
    setPayosCheckoutUrl(null);
  };


  const showToast = (message, type = 'success') => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 2500);
  }; 

  
  const fetchStats = (period) => {
    adminApi.getStats(period)
      .then(data => setStats(data))
      .catch(err => console.error('Error fetching stats:', err));
  };

  const fetchFeeConfig = () => {
    adminApi.getFeeConfig()
      .then(data => setFeeRate(data.fee))
      .catch(err => console.error('Error loading fee config:', err));
  };

  const handleUpdateFeeConfig = (newFee) => {
    setIsUpdatingFee(true);
    adminApi.updateFeeConfig(newFee)
      .then(data => {
        if (data.success) {
          setFeeRate(data.fee);
          fetchStats(selectedPeriod); 
          
          adminApi.getAuditLogs()
            .then(logs => { if (Array.isArray(logs)) setAuditLogs(logs); });
        }
        setIsUpdatingFee(false);
      })
      .catch(err => {
        console.error('Error updating fee:', err);
        setIsUpdatingFee(false);
      });
  };

  const handleUpdatePackages = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsUpdatingPackages(true);
    const pricesMap = {};
    servicePackages.forEach(pkg => {
      pricesMap[pkg.packageType] = parseFloat(pkg.price);
    });
    
    adminApi.updateServicePackages(pricesMap, user?.id || 1)
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setServicePackages(data);
          showToast('Cß║¡p nhß║¡t bß║úng gi├í c├íc g├│i dß╗ïch vß╗Ñ th├ánh c├┤ng!', 'success');
        }
        setIsUpdatingPackages(false);
      })
      .catch(err => {
        console.error('Error updating packages:', err);
        showToast('Lß╗ùi cß║¡p nhß║¡t bß║úng gi├í g├│i dß╗ïch vß╗Ñ.', 'error');
        setIsUpdatingPackages(false);
      });
  };

  const handleCreateUser = (e) => {
    e.preventDefault();
    if (!createForm.email) {
      showToast('Vui l├▓ng nhß║¡p Email!', 'error');
      return;
    }
    if (!createForm.departmentId) {
      showToast('Vui l├▓ng chß╗ìn Khoa/Ph├▓ng ban!', 'error');
      return;
    }
    if (createForm.phone && !/^0\d{9}$/.test(createForm.phone)) {
      showToast('Sß╗æ ─æiß╗çn thoß║íi kh├┤ng hß╗úp lß╗ç! Vui l├▓ng nhß║¡p 10 chß╗» sß╗æ bß║»t ─æß║ºu bß║▒ng 0.', 'error');
      return;
    }
    if (createForm.citizenId && !/^\d{12}$/.test(createForm.citizenId)) {
      showToast('C─ân c╞░ß╗¢c c├┤ng d├ón kh├┤ng hß╗úp lß╗ç! Vui l├▓ng nhß║¡p ─æ├║ng 12 chß╗» sß╗æ.', 'error');
      return;
    }

    setIsLoading(true);
    adminApi.inviteStaffOrManager(
      createForm.email, 
      createRole, 
      createForm.departmentId, 
      createForm.managerId, 
      createForm.fullName, 
      createForm.phone, 
      createForm.citizenId, 
      createForm.displayName
    )
      .then(data => {
        setIsLoading(false);
        if (data.success === false) {
          showToast(data.message || 'Lß╗ùi khi tß║ío t├ái khoß║ún.', 'error');
        } else {
          showToast(data.message || '─É├ú tß║ío t├ái khoß║ún th├ánh c├┤ng!', 'success');
          setShowCreateModal(false);

          if (data.generatedPassword) {
            setCreatedCredentials({
              email: data.generatedEmail || createForm.email,
              password: data.generatedPassword,
              role: data.role || createRole,
              department: data.department || '',
              setupLink: data.setupLink,
              status: data.status || 'PENDING',
              userId: data.userId || null
            });
          }
          setCreateForm({
            email: '',
            password: '',
            displayName: '',
            fullName: '',
            phone: '',
            departmentId: '',
            specialization: '',
            managerId: ''
          });
          refreshUsers();
        }
      })
      .catch(err => {
        setIsLoading(false);
        console.error(err);
        showToast('Lß╗ùi kß║┐t nß╗æi m├íy chß╗º.', 'error');
      });
  };

  const handleViewCredentials = (role, userId) => {
    if (role !== 'MANAGER' && role !== 'STAFF') return;
    setIsLoading(true);
    adminApi.getUserCredentials(role, userId)
      .then(data => {
        setIsLoading(false);
        if (data.success) {
          setCustomNewPassword('');
          setCreatedCredentials({
            email: data.email,
            password: data.password,
            role: data.role,
            department: data.department,
            setupLink: data.setupLink,
            status: data.status,
            userId: userId
          });
        } else {
          showToast(data.message || 'Kh├┤ng thß╗â tß║úi th├┤ng tin t├ái khoß║ún.', 'error');
        }
      })
      .catch(err => {
        setIsLoading(false);
        showToast('C├│ lß╗ùi xß║úy ra khi kß║┐t nß╗æi m├íy chß╗º.', 'error');
      });
  };

  const handleRegeneratePassword = (role, userId) => {
    if (!window.confirm('Bß║ín c├│ chß║»c chß║»n muß╗æn cß║Ñp lß║íi mß║¡t khß║⌐u tß║ím thß╗¥i mß╗¢i cho t├ái khoß║ún n├áy? Mß║¡t khß║⌐u c┼⌐ sß║╜ kh├┤ng sß╗¡ dß╗Ñng ─æ╞░ß╗úc nß╗»a.')) {
      return;
    }
    setIsLoading(true);
    adminApi.regenerateUserPassword(role, userId)
      .then(data => {
        setIsLoading(false);
        if (data.success) {
          setCustomNewPassword('');
          showToast(data.message || '─É├ú cß║Ñp lß║íi mß║¡t khß║⌐u mß╗¢i!', 'success');
          setCreatedCredentials({
            email: data.email,
            password: data.password,
            role: data.role,
            department: data.department,
            setupLink: data.setupLink,
            status: data.status,
            userId: userId
          });
        } else {
          showToast(data.message || 'Kh├┤ng thß╗â cß║Ñp lß║íi mß║¡t khß║⌐u.', 'error');
        }
      })
      .catch(err => {
        setIsLoading(false);
        showToast('C├│ lß╗ùi xß║úy ra khi kß║┐t nß╗æi m├íy chß╗º.', 'error');
      });
  };

  const handleSaveCustomPassword = (role, userId) => {
    if (!customNewPassword || !customNewPassword.trim()) {
      showToast('Vui l├▓ng nhß║¡p mß║¡t khß║⌐u mß╗¢i!', 'error');
      return;
    }
    setIsLoading(true);
    adminApi.changeUserPasswordDirectly(role, userId, customNewPassword)
      .then(data => {
        setIsLoading(false);
        if (data.success) {
          showToast(data.message || '─Éß║╖t lß║íi mß║¡t khß║⌐u th├ánh c├┤ng!', 'success');
          setCustomNewPassword('');
          setCreatedCredentials(null);
          refreshUsers();
        } else {
          showToast(data.message || 'Kh├┤ng thß╗â ─æß║╖t lß║íi mß║¡t khß║⌐u.', 'error');
        }
      })
      .catch(err => {
        setIsLoading(false);
        console.error(err);
        showToast('C├│ lß╗ùi xß║úy ra khi kß║┐t nß╗æi m├íy chß╗º.', 'error');
      });
  };

  const handleSelectDepartment = (dept) => {
    setSelectedDepartment(dept);
    if (dept) {
      adminApi.getDepartmentSessions(dept.departmentId)
        .then(data => setDepartmentSessions(Array.isArray(data) ? data : []))
        .catch(err => console.error(err));
      adminApi.getDepartmentLogs(dept.departmentId)
        .then(data => setDepartmentLogs(Array.isArray(data) ? data : []))
        .catch(err => console.error(err));
      adminApi.getDepartmentTransfers(dept.departmentId)
        .then(data => setDepartmentTransfers(Array.isArray(data) ? data : []))
        .catch(err => console.error(err));
    } else {
      setDepartmentSessions([]);
      setDepartmentLogs([]);
      setDepartmentTransfers([]);
    }
  };

  const handleCreateDepartment = (e) => {
    e.preventDefault();
    if (!deptForm.name.trim() || !deptForm.code.trim()) {
      showToast('Vui l├▓ng nhß║¡p ─æß║ºy ─æß╗º t├¬n v├á m├ú khoa!', 'error');
      return;
    }
    setIsLoading(true);
    adminApi.createDepartment(deptForm)
      .then(res => {
        setIsLoading(false);
        showToast('Tß║ío khoa/ph├▓ng ban mß╗¢i th├ánh c├┤ng!', 'success');
        setShowCreateDeptModal(false);
        setDeptForm({ name: '', code: '', description: '' });
        adminApi.getDepartments()
          .then(data => { if (Array.isArray(data)) setDepartmentsList(data); });
      })
      .catch(err => {
        setIsLoading(false);
        console.error(err);
        showToast('C├│ lß╗ùi xß║úy ra khi tß║ío khoa.', 'error');
      });
  };

  const handleOpenTransferModal = (member) => {
    setTransferTargetMember(member);
    const currentDeptId = member.departmentId;
    const firstOtherDept = departmentsList.find(d => d.departmentId !== currentDeptId);
    setTransferForm({
      toDepartmentId: firstOtherDept ? firstOtherDept.departmentId.toString() : '',
      reason: ''
    });
    setShowTransferModal(true);
  };

  const handleExecuteTransfer = (e) => {
    e.preventDefault();
    if (!transferTargetMember || !transferForm.toDepartmentId) return;
    
    setIsLoading(true);
    const payload = {
      userType: transferTargetMember.role,
      userId: transferTargetMember.id,
      toDepartmentId: parseInt(transferForm.toDepartmentId, 10),
      adminId: user ? user.id : 1,
      reason: transferForm.reason
    };
    
    adminApi.transferDepartmentMember(payload)
      .then(res => {
        setIsLoading(false);
        if (res.success || res.transfer) {
          showToast(res.message || '─Éiß╗üu chuyß╗ân nh├ón sß╗▒ th├ánh c├┤ng!', 'success');
          setShowTransferModal(false);

          refreshUsers();

          if (selectedDepartment) {
            handleSelectDepartment(selectedDepartment);
          }
        } else {
          showToast(res.message || 'Lß╗ùi khi ─æiß╗üu chuyß╗ân.', 'error');
        }
      })
      .catch(err => {
        setIsLoading(false);
        console.error(err);
        showToast(err.response?.data?.message || 'C├│ lß╗ùi xß║úy ra khi gß╗ìi API ─æiß╗üu chuyß╗ân.', 'error');
      });
  };

  const handleSubmitTaskSignoff = (e) => {
    e.preventDefault();
    if (!selectedVerificationTask) return;

    setIsLoading(true);
    adminApi.submitTaskSignoff(selectedVerificationTask.taskId, signoffForm, 'admin@lancerpro.com')
      .then(res => {
        setIsLoading(false);
        if (res.success === false) {
          showToast(res.message || 'Lß╗ùi khi k├╜ duyß╗çt t├íc vß╗Ñ.', 'error');
        } else {
          showToast(res.message || 'K├╜ duyß╗çt t├íc vß╗Ñ th├ánh c├┤ng!', 'success');
          setShowSignoffModal(false);
          setSelectedVerificationTask(null);

          adminApi.getVerificationTasks()
            .then(data => { if (Array.isArray(data)) setVerificationTasksList(data); });
        }
      })
      .catch(err => {
        setIsLoading(false);
        console.error(err);
        showToast('C├│ lß╗ùi xß║úy ra khi k├╜ duyß╗çt.', 'error');
      });
  };

  const fetchVnpayConfig = async () => {
    try {
      const data = await adminApi.getVnpayConfig();
      if (data) {
        setVnpayConfig(data);
        if (data.tmnCode || data.hashSecret) {
          setIsEditingVnpay(false);
        } else {
          setIsEditingVnpay(true);
        }
      } else {
        setIsEditingVnpay(true);
      }
    } catch (err) {
      console.error("Error loading VNPay config:", err);
      setIsEditingVnpay(true);
    }
  };

  const fetchVnpayTransactions = async (pageArg = vnpayPage) => {
    const page = typeof pageArg === 'number' ? pageArg : vnpayPage;
    try {
      setVnpayLoading(true);
      const data = await adminApi.getVnpayTransactions(page);
      if (data && data.content) {
        setVnpayTransactions(data.content);
        setVnpayTotalPages(data.totalPages || 1);
        setVnpayPage(page);
      } else if (Array.isArray(data)) {
        setVnpayTransactions(data);
      }
    } catch (err) {
      console.error("Error loading VNPay transactions:", err);
    } finally {
      setVnpayLoading(false);
    }
  };

  const handleQueryTransaction = async (txnId, txnRef) => {
    try {
      showToast("─Éang truy vß║Ñn...", "success");
      let res;
      if (!String(txnRef).includes('_')) {
        // PayOS
        res = await adminApi.queryPayosTransaction(txnRef);
      } else {
        // VNPay
        res = await adminApi.queryVnpayTransaction(txnId);
      }

      if (res && res.success) {
        showToast(res.message || "Trß║íng th├íi giao dß╗ïch: Th├ánh c├┤ng. ─É├ú ─æß╗ông bß╗Ö!", "success");
      } else {
        showToast(res?.message || "Giao dß╗ïch ch╞░a thanh to├ín hoß║╖c c├│ lß╗ùi xß║úy ra.", "error");
      }
      fetchVnpayTransactions();
    } catch (err) {
      showToast(err.message || "Lß╗ùi truy vß║Ñn giao dß╗ïch.", "error");
    }
  };

  const handleOpenRefundModal = (txn) => {
    setRefundTxn(txn);
    setRefundAmount(txn.amount);
    setRefundReason('');
    setShowRefundModal(true);
  };

  const handleCloseRefundModal = () => {
    setShowRefundModal(false);
    setRefundTxn(null);
  };

  const handleRefundSubmit = async () => {
    if (!refundAmount || isNaN(refundAmount) || refundAmount <= 0) {
      showToast("Sß╗æ tiß╗ün ho├án kh├┤ng hß╗úp lß╗ç.", "error");
      return;
    }
    if (!refundReason.trim()) {
      showToast("Vui l├▓ng nhß║¡p l├╜ do ho├án tiß╗ün.", "error");
      return;
    }
    setIsRefunding(true);
    try {
      const res = await adminApi.refundVnpayTransaction(refundTxn.id, {
        amount: parseFloat(refundAmount),
        reason: refundReason
      });
      if (res && res.success) {
        showToast("Y├¬u cß║ºu ho├án tiß╗ün ─æ├ú ─æ╞░ß╗úc gß╗¡i tß╗¢i VNPAY.", "success");
        handleCloseRefundModal();
        fetchVnpayTransactions();
      } else {
        showToast(res?.message || "Lß╗ùi ho├án tiß╗ün.", "error");
      }
    } catch (err) {
      showToast(err.message || "Lß╗ùi ho├án tiß╗ün.", "error");
    } finally {
      setIsRefunding(false);
    }
  };

  const handleLookupBank = async () => {
    if (!vnpayConfig?.bankName || !vnpayConfig?.bankAccountNo) {
      showToast("Vui l├▓ng chß╗ìn ng├ón h├áng v├á nhß║¡p sß╗æ t├ái khoß║ún tr╞░ß╗¢c khi kiß╗âm tra.", "error");
      return;
    }
    setIsLookingUp(true);
    setLookupError(null);
    setLookupResult(null);
    try {
      const res = await adminApi.lookupBankAccount(vnpayConfig.bankName, vnpayConfig.bankAccountNo);
      if (res && res.success && res.data && res.data.accountName) {
        setLookupResult(res.data.accountName);
        setVnpayConfig({ ...vnpayConfig, bankAccountName: res.data.accountName });
        showToast("─É├ú lß║Ñy ─æ╞░ß╗úc t├¬n chß╗º t├ái khoß║ún: " + res.data.accountName, "success");
      } else {
        setLookupError(res?.message || "Kh├┤ng t├¼m thß║Ñy th├┤ng tin t├ái khoß║ún.");
        showToast(res?.message || "Kh├┤ng t├¼m thß║Ñy th├┤ng tin t├ái khoß║ún.", "error");
      }
    } catch (err) {
      setLookupError(err.message || "Lß╗ùi tra cß╗⌐u t├ái khoß║ún.");
      showToast(err.message || "Lß╗ùi tra cß╗⌐u t├ái khoß║ún.", "error");
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleStartEditVnpay = () => {
    setShowVnpayEditConfirmModal(true);
  };

  const confirmStartEditVnpay = () => {
    setShowVnpayEditConfirmModal(false);
    setTempVnpayConfig({ ...vnpayConfig });
    setIsEditingVnpay(true);
  };

  const handleCancelEditVnpay = () => {
    if (tempVnpayConfig) {
      setVnpayConfig({ ...tempVnpayConfig });
    }
    setIsEditingVnpay(false);
  };

  const handleSaveVnpayConfig = (e) => {
    e.preventDefault();
    setShowVnpayConfirmModal(true);
  };

  const confirmSaveVnpayConfig = async () => {
    setShowVnpayConfirmModal(false);
    setVnpaySaving(true);
    setVnpaySuccessMessage('');
    setVnpayErrorMessage('');
    try {
      const data = await adminApi.saveVnpayConfig(vnpayConfig);
      if (data) {
        setVnpaySuccessMessage("─É├ú l╞░u cß║Ñu h├¼nh kß║┐t nß╗æi VNPay th├ánh c├┤ng!");
        showToast("Cß║¡p nhß║¡t cß║Ñu h├¼nh VNPay th├ánh c├┤ng!", "success");
        const freshConfig = await adminApi.getVnpayConfig();
        if (freshConfig) setVnpayConfig(freshConfig);
        setIsEditingVnpay(false);
      }
    } catch (err) {
      setVnpayErrorMessage(err.message || "Lß╗ùi l╞░u cß║Ñu h├¼nh VNPay");
      showToast("Lß╗ùi cß║¡p nhß║¡t cß║Ñu h├¼nh VNPay", "error");
    } finally {
      setVnpaySaving(false);
    }
  };

  const handleReconcile = async (txnId) => {
    if (!window.confirm("Bß║ín c├│ chß║»c chß║»n muß╗æn duyß╗çt thß╗º c├┤ng giao dß╗ïch n├áy v├á k├¡ch hoß║ít dß╗▒ ├ín t╞░╞íng ß╗⌐ng?")) return;
    try {
      setIsLoading(true);
      const res = await adminApi.reconcileVnpayTransaction(txnId);
      if (res) {
        if (res.success) {
          showToast(res.message, "success");
          fetchVnpayTransactions();
        } else {
          showToast(res.message, "error");
        }
      }
    } catch (err) {
      showToast(err.message || "Lß╗ùi ─æß╗æi so├ít giao dß╗ïch", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchServicePackages = () => {
    adminApi.getServicePackages()
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setServicePackages(data);
        }
      })
      .catch(err => console.error('Error loading service packages:', err));
  };

  const handleEditPackages = () => {
    setTempPackages(JSON.parse(JSON.stringify(servicePackages)));
    setIsEditingPackages(true);
  };

  const handleSavePackages = async () => {
    try {
      setIsUpdatingPackages(true);
      const res = await adminApi.updateServicePackages(tempPackages);
      if (Array.isArray(res) && res.length > 0) {
        setServicePackages(res);
        setIsEditingPackages(false);
        showToast('Cß║¡p nhß║¡t bß║úng gi├í th├ánh c├┤ng', 'success');
      }
    } catch (err) {
      console.error('Error updating packages:', err);
      showToast('Lß╗ùi cß║¡p nhß║¡t bß║úng gi├í', 'error');
    } finally {
      setIsUpdatingPackages(false);
    }
  };

  const loadDashboardData = () => {
    setIsLoading(true);
    fetchStats(selectedPeriod);
    fetchFeeConfig();
    fetchServicePackages();

    adminApi.getUserGrowth()
      .then(data => { if (Array.isArray(data)) setUserGrowthTrend(data); })
      .catch(err => console.error('Error user growth chart:', err));

    adminApi.getRevenueGrowth()
      .then(data => { if (Array.isArray(data)) setRevenueTrend(data); })
      .catch(err => console.error('Error revenue chart:', err));

    adminApi.getAuditLogs()
      .then(data => {
        setAuditLogs(Array.isArray(data) ? data : []);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error audit logs:', err);
        setIsLoading(false);
      });
  };

  const fetchUsers = () => {
    setIsLoading(true);
    adminApi.getUsers({
      page: currentPage,
      size: pageSize,
      role: selectedRoleTab,
      search: searchQuery,
      status: userStatusFilter,
      timeFilter: userTimeFilterType,
      timeStart: userTimeStart,
      timeEnd: userTimeEnd,
      filterEmployer,
      filterManager,
      filterStaff,
      activeOnlineChecked,
      activeOfflineChecked
    })
      .then(res => {
        if (res && res.content) {
          setUsers(res.content);
          setTotalPages(res.totalPages || 0);
          setTotalElements(res.totalElements || 0);
          if (res.size) setPageSize(res.size);
        } else {
          setUsers([]);
          setTotalPages(0);
          setTotalElements(0);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  };

  const refreshUsers = () => {
    if (activeTab === 'users') {
      fetchUsers();
    } else {
      adminApi.getUsers()
        .then(data => { if (Array.isArray(data)) setUsers(data); })
        .catch(err => console.error(err));
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [
    currentPage,

    selectedRoleTab,
    searchQuery,
    userStatusFilter,
    userTimeFilterType,
    userTimeStart,
    userTimeEnd,
    filterEmployer,
    filterManager,
    filterStaff,
    activeOnlineChecked,
    activeOfflineChecked
  ]);

  useEffect(() => {
    loadDashboardData();
    
    if (activeTab === 'users' || activeTab === 'departments') {
      if (activeTab === 'users') {
        fetchUsers();
      } else {
        setIsLoading(true);
        adminApi.getUsers()
          .then(data => {
            setUsers(Array.isArray(data) ? data : []);
            setIsLoading(false);
          })
          .catch(err => console.error(err));
      }
      adminApi.getManagers()
        .then(data => { if (Array.isArray(data)) setManagersList(data); })
        .catch(err => console.error('Error managers:', err));
      adminApi.getDepartments()
        .then(data => { if (Array.isArray(data)) setDepartmentsList(data); })
        .catch(err => console.error('Error departments:', err));
      adminApi.getVerificationTasks()
        .then(data => { if (Array.isArray(data)) setVerificationTasksList(data); })
        .catch(err => console.error('Error verification tasks:', err));
    } else if (activeTab === 'cms') {
      setIsLoading(true);
      Promise.all([
        adminApi.getJobCategories(),
        adminApi.getKycRequests(),
        adminApi.getProfileRequests(),
        adminApi.getDisputes(),
        adminApi.getReports(),
        adminApi.getArticles(),
        adminApi.getTickets(),
        adminApi.getSeoConfigs()
      ]).then(([categories, kyc, pReqs, disps, reps, arts, ticks, seo]) => {
        setJobCategories(Array.isArray(categories) ? categories : []);
        setKycRequests(Array.isArray(kyc) ? kyc : []);
        setProfileRequests(Array.isArray(pReqs) ? pReqs : []);
        setDisputes(Array.isArray(disps) ? disps : []);
        setReports(Array.isArray(reps) ? reps : []);
        setArticles(Array.isArray(arts) ? arts : []);
        setTickets(Array.isArray(ticks) ? ticks : []);
        setSeoConfigs(Array.isArray(seo) ? seo : []);
        setIsLoading(false);
      }).catch(err => { console.error('Error loading CMS data:', err); setIsLoading(false); });
    } else if (activeTab === 'vnpay') {
      setIsLoading(true);
      Promise.all([
        adminApi.getVnpayConfig(),
        adminApi.getVnpayTransactions()
      ]).then(([config, txns]) => {
        if (config) {
          setVnpayConfig(config);
          if (config.tmnCode || config.hashSecret) {
            setIsEditingVnpay(false);
          } else {
            setIsEditingVnpay(true);
          }
        } else {
          setIsEditingVnpay(true);
        }
        if (txns && txns.content) {
          setVnpayTransactions(txns.content);
          setVnpayTotalPages(txns.totalPages || 1);
        } else {
          setVnpayTransactions(Array.isArray(txns) ? txns : []);
        }
        setIsLoading(false);
      }).catch(err => {
        console.error('Error loading VNPay data:', err);
        setIsEditingVnpay(true);
        setIsLoading(false);
      });
    }
  }, [activeTab, selectedPeriod]);

  
  useEffect(() => {
    setCurrentPage(1);
  }, [
    userStatusFilter,
    activeOnlineChecked,
    activeOfflineChecked,
    userTimeFilterType,
    userTimeStart,
    userTimeEnd,
    searchQuery,
    selectedRoleTab,
    filterEmployer,
    filterManager,
    filterStaff
  ]);

  
  const handleUserStatusChange = (userId, role, newStatus) => {
    if (newStatus !== 'ACTIVE') {
      if (banReasons.length === 0) {
        showToast('Vui l├▓ng chß╗ìn ├¡t nhß║Ñt 1 l├╜ do vi phß║ím.', 'error');
        return;
      }
      if (!adminPin || adminPin.trim() === '') {
        showToast('Vui l├▓ng nhß║¡p m├ú PIN x├íc nhß║¡n.', 'error');
        return;
      }
    }

    const reasonStr = banReasons.length > 0 ? banReasons.join(', ') : 'Y├¬u cß║ºu tß╗½ Admin';
    const reasonParam = encodeURIComponent(reasonStr);

    adminApi.updateUserStatus(userId, role, newStatus, reasonParam, adminPin, user?.id)
      .then(data => {
        if (data.success === false) {
          showToast(data.message || 'H├ánh ─æß╗Öng bß╗ï tß╗½ chß╗æi bß╗ƒi hß╗ç thß╗æng.', 'error');
        } else {
          showToast(data.message || 'Thao t├íc th├ánh c├┤ng!', 'success');
          refreshUsers();
          loadDashboardData();
          setActiveUserForAction(null);
          setBanReasons([]);
          setAdminPin('');
        }
      })
      .catch(err => {
        console.error(err);
        showToast('Lß╗ùi kß║┐t nß╗æi m├íy chß╗º.', 'error');
      });
  };

  
  const handleProjectAction = (projectId, approve, reason = '') => {
    const reasonParam = encodeURIComponent(reason);
    adminApi.moderateProject(projectId, approve, reasonParam, user?.id)
      .then(() => {
        adminApi.getPendingProjects()
          .then(data => setPendingProjects(data));
        loadDashboardData();
      })
      .catch(err => console.error(err));
  };

  const handleProfileRequestAction = (requestId, approve, reason = '') => {
    const reasonParam = encodeURIComponent(reason);
    adminApi.moderateProfileRequest(requestId, approve, reasonParam, user?.id)
      .then(res => {
        if (res.success) {
          showToast(res.message || 'Thao t├íc th├ánh c├┤ng.', 'success');
        } else {
          showToast(res.message || 'Thao t├íc thß║Ñt bß║íi.', 'error');
        }
        adminApi.getProfileRequests()
          .then(data => setProfileRequests(Array.isArray(data) ? data : []));
      })
      .catch(err => {
        console.error(err);
        showToast('Lß╗ùi kß║┐t nß╗æi m├íy chß╗º.', 'error');
      });
  };

  
  const handleWithdrawalAction = (withdrawalId, approve) => {
    const status = approve ? 'APPROVED' : 'REJECTED';
    let reason = null;
    if (status === 'REJECTED') {
      reason = window.prompt("Nhß║¡p l├╜ do tß╗½ chß╗æi y├¬u cß║ºu r├║t tiß╗ün n├áy (bß║»t buß╗Öc):");
      if (reason === null) return; // user cancelled
      if (!reason.trim()) {
        alert("Vui l├▓ng nhß║¡p l├╜ do tß╗½ chß╗æi.");
        return;
      }
    }
    adminApi.processWithdrawal(withdrawalId, status, user?.id, reason)
      .then(() => {
        adminApi.getWithdrawals()
          .then(data => setWithdrawals(data));
        loadDashboardData();
      })
      .catch(err => console.error(err));
  };

  
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

  const handleDownloadUsers = async (format, usersList) => {
    let fileHandle = null;
    let fallbackMode = false;
    const defaultFileName = `LancerPro_Users_${new Date().getTime()}.${format === 'PDF' ? 'pdf' : 'xls'}`;
    const description = format === 'PDF' ? 'PDF Document' : 'Excel Document';
    const mimeType = format === 'PDF' ? 'application/pdf' : 'application/vnd.ms-excel';
    const ext = format === 'PDF' ? '.pdf' : '.xls';

    try {
      if (window.showSaveFilePicker) {
        
        fileHandle = await window.showSaveFilePicker({
          suggestedName: defaultFileName,
          types: [{ description, accept: { [mimeType]: [ext] } }],
        });
      } else {
        fallbackMode = true;
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setToast({ title: 'Lß╗ùi', message: 'Kh├┤ng thß╗â mß╗ƒ hß╗Öp thoß║íi l╞░u file: ' + err.message, type: 'error' });
      }
      return; 
    }

    setToast({ title: '─Éang xß╗¡ l├╜', message: `─Éang khß╗ƒi tß║ío file ${format}, vui l├▓ng ─æß╗úi...`, type: 'success' });

    let finalBlob = null;

    if (format === 'PDF') {
      const doc = new jsPDF('landscape');
      
      try {
        const fontUrl = "https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf";
        const fontRes = await fetch(fontUrl);
        const fontBuffer = await fontRes.arrayBuffer();
        const base64String = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.readAsDataURL(new Blob([fontBuffer]));
        });
        doc.addFileToVFS('Roboto-Regular.ttf', base64String);
        doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
        doc.setFont('Roboto');
      } catch (e) {
        console.warn("Could not load custom font, falling back to basic font.");
      }

      doc.setFontSize(16);
      doc.text("DANH S├üCH T├ÇI KHOß║óN NG╞»ß╗£I D├ÖNG - LancerPro", 14, 15);
      
      const tableColumn = ["ID", "T├¬n hiß╗ân thß╗ï", "Email", "Vai tr├▓", "Trß║íng th├íi", "─É─âng nhß║¡p cuß╗æi", "Ng├áy gia nhß║¡p"];
      const tableRows = [];

      usersList.forEach(user => {
        let loginStr = 'Ch╞░a ─æ─âng nhß║¡p';
        if (user.lastLogin) {
          const cleanStr = user.lastLogin.split('.')[0];
          loginStr = new Date(cleanStr).toLocaleString('vi-VN');
        }
        tableRows.push([
          user.id,
          user.name || '',
          user.email || '',
          user.role,
          user.status,
          loginStr,
          user.joined || ''
        ]);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 20,
        theme: 'grid',
        styles: { font: 'Roboto', fontSize: 9 },
        headStyles: { fillColor: [51, 65, 85], textColor: 255, fontStyle: 'normal' }
      });
      
      finalBlob = doc.output('blob');
    } else {
      
      let excelHTML = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <style>
            table { border-collapse: collapse; font-family: Arial, sans-serif; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; vertical-align: middle; }
            th { background-color: #f8fafc; font-weight: bold; color: #334155; }
          </style>
        </head>
        <body>
          <table>
            <thead>
              <tr>
                <th style="width: 60px;">ID</th>
                <th style="width: 180px;">T├¬n hiß╗ân thß╗ï</th>
                <th style="width: 250px;">Email</th>
                <th style="width: 120px;">Vai tr├▓</th>
                <th style="width: 100px;">Trß║íng th├íi</th>
                <th style="width: 180px;">─É─âng nhß║¡p cuß╗æi</th>
                <th style="width: 120px;">Ng├áy gia nhß║¡p</th>
              </tr>
            </thead>
            <tbody>`;
      
      usersList.forEach(user => {
        let loginStr = 'Ch╞░a ─æ─âng nhß║¡p';
        if (user.lastLogin) {
          const cleanStr = user.lastLogin.split('.')[0];
          loginStr = new Date(cleanStr).toLocaleString('vi-VN');
        }

        excelHTML += `
              <tr>
                <td>${user.id}</td>
                <td>${(user.name || '').replace(/</g, '&lt;')}</td>
                <td>${(user.email || '').replace(/</g, '&lt;')}</td>
                <td style="font-weight: bold;">${user.role}</td>
                <td>${user.status}</td>
                <td>${loginStr}</td>
                <td>${user.joined || ''}</td>
              </tr>`;
      });

      excelHTML += `
            </tbody>
          </table>
        </body>
      </html>`;
      
      finalBlob = new Blob([excelHTML], { type: 'application/vnd.ms-excel' });
    }

    try {
      if (fileHandle) {
        const writable = await fileHandle.createWritable();
        await writable.write(finalBlob);
        await writable.close();
        setToast({ title: 'Th├ánh c├┤ng', message: `─É├ú l╞░u file v├áo m├íy: ${defaultFileName}`, type: 'success' });
      } else if (fallbackMode) {
        const url = URL.createObjectURL(finalBlob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', defaultFileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setToast({ title: 'Th├ánh c├┤ng', message: `─É├ú tß║úi xuß╗æng file: ${defaultFileName}`, type: 'success' });
      }
    } catch (err) {
      setToast({ title: 'Lß╗ùi', message: 'Kh├┤ng thß╗â l╞░u nß╗Öi dung file. Chi tiß║┐t: ' + err.message, type: 'error' });
    }
  };

  return (
    <div className="h-screen bg-slate-100 flex font-sans antialiased text-slate-800 overflow-hidden">
      <style>{`
        /* PROFILE CUSTOM HOVER DROPDOWN STYLE */
        .profile-menu-wrapper {
          position: relative;
        }

        .profile-menu-wrapper::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          height: 20px;
          z-index: 98;
        }

        .profile-menu-dropdown {
          background-color: #1e293b; /* Dark slate */
          border: 1px solid #334155; /* Slate border */
          border-radius: 16px;
          position: absolute;
          width: 280px;
          right: 0;
          top: calc(100% + 6px);
          overflow: hidden;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05) inset;
          z-index: 9999 !important;
          padding: 8px;
          cursor: default;
          clip-path: inset(0% 0% 100% 0% round 16px);
          opacity: 0;
          pointer-events: none;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .profile-menu-wrapper:hover .profile-menu-dropdown {
          clip-path: inset(0% 0% 0% 0% round 16px);
          opacity: 1;
          pointer-events: auto;
        }

        .profile-menu-item {
          --delay: 0.1s;
          --trdelay: 0.05s;
          transform: translateY(-15px);
          opacity: 0;
          transition: transform 0.4s ease, opacity 0.4s ease;
        }

        .profile-menu-wrapper:hover .profile-menu-item {
          transform: translateY(0);
          opacity: 1;
        }

        .profile-menu-wrapper:hover .profile-menu-item:nth-child(1) { transition-delay: var(--delay); }
        .profile-menu-wrapper:hover .profile-menu-item:nth-child(2) { transition-delay: calc(var(--delay) + var(--trdelay)); }
        .profile-menu-wrapper:hover .profile-menu-item:nth-child(3) { transition-delay: calc(var(--delay) + (var(--trdelay) * 2)); }
        .profile-menu-wrapper:hover .profile-menu-item:nth-child(4) { transition-delay: calc(var(--delay) + (var(--trdelay) * 3)); }
        .profile-menu-wrapper:hover .profile-menu-item:nth-child(5) { transition-delay: calc(var(--delay) + (var(--trdelay) * 4)); }
        .profile-menu-wrapper:hover .profile-menu-item:nth-child(6) { transition-delay: calc(var(--delay) + (var(--trdelay) * 5)); }

        /* Dark theme typography and border overrides */
        .profile-menu-dropdown .border-b {
          border-color: #334155 !important;
        }

        .profile-menu-dropdown .bg-slate-100 {
          background-color: #334155 !important;
        }

        .profile-menu-dropdown p.text-slate-400 {
          color: #94a3b8 !important;
        }

        .profile-menu-dropdown p.text-slate-800 {
          color: #f1f5f9 !important;
        }

        .profile-menu-btn {
          color: #cbd5e1 !important;
          background-color: transparent !important;
          white-space: nowrap !important;
        }

        .profile-menu-btn:hover {
          color: #ffffff !important;
          background-color: rgba(255, 255, 255, 0.08) !important;
        }

        .profile-menu-btn.profile-menu-active {
          color: #34d399 !important; /* emerald-400 */
          background-color: rgba(16, 185, 129, 0.15) !important;
        }

        .profile-menu-btn.text-rose-600 {
          color: #f87171 !important; /* rose-400 */
        }

        .profile-menu-btn.text-rose-600:hover {
          color: #ffffff !important;
          background-color: rgba(239, 68, 68, 0.2) !important;
        }

        /* ORBITAL SELECTOR INDICATOR FOR PROFILE MENU ITEMS */
        .profile-menu-circle {
          width: 12px;
          height: 12px;
          background-color: transparent;
          border: 1.5px solid #475569; /* Slate border */
          border-radius: 50%;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.3s ease;
        }

        .profile-menu-circle::before {
          content: "";
          position: absolute;
          width: 4px;
          height: 4px;
          background: #3b82f6;
          border-radius: 50%;
          transform: scale(0);
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .profile-menu-circle::after {
          content: "";
          position: absolute;
          width: 18px;
          height: 18px;
          border: 1.5px solid transparent;
          border-radius: 50%;
          border-top-color: #3b82f6;
          opacity: 0;
          transform: scale(0.8);
          transition: all 0.3s ease;
        }

        .profile-menu-btn:hover .profile-menu-circle {
          border-color: #3b82f6;
          transform: scale(1.1);
        }

        .profile-menu-btn:hover .profile-menu-circle::before {
          transform: scale(1);
        }

        .profile-menu-btn:hover .profile-menu-circle::after {
          opacity: 1;
          transform: scale(1.3);
          animation: profile-orbit 2s infinite linear;
        }

        /* Active states */
        .profile-menu-btn.profile-menu-active .profile-menu-circle {
          border-color: #34d399;
          transform: scale(1.0);
        }

        .profile-menu-btn.profile-menu-active .profile-menu-circle::before {
          transform: scale(1);
          background-color: #34d399;
        }

        .profile-menu-btn.profile-menu-active .profile-menu-circle::after {
          opacity: 1;
          transform: scale(1.3);
          border-top-color: #34d399;
          animation: profile-orbit 2s infinite linear;
          box-shadow: 0 0 8px rgba(52, 211, 153, 0.4);
        }

        @keyframes profile-orbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
                <style>{`
                  .filter-main {
                    font-weight: 800;
                    color: white;
                    background-image: linear-gradient(to right, #2563eb, #4f46e5);
                    padding: 4px 16px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    height: 38px;
                    width: 100%;
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
                  .filter-wrapper:hover .filter-top {
                    transform-origin: top right;
                    transform: translateY(-0.5px) rotate(-45deg) scaleX(0.9);
                  }

                  .filter-wrapper:hover .filter-middle {
                    transform: translateX(-50%);
                    opacity: 0;
                  }

                  .filter-wrapper:hover .filter-bottom {
                    transform-origin: bottom right;
                    transform: translateY(0.5px) rotate(45deg) scaleX(0.9);
                  }

                  .filter-wrapper::after {
                    content: '';
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    height: 20px;
                    z-index: 98;
                  }

                  .filter-menu-container {
                    background-color: white;
                    color: #1e293b;
                    font-weight: 400;
                    border: 1px solid #e2e8f0;
                    border-radius: 16px;
                    position: absolute;
                    width: 44rem;
                    right: 0;
                    top: calc(100% + 10px);
                    overflow: hidden;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
                    z-index: 99 !important;
                    padding: 20px;
                    cursor: default;
                    clip-path: inset(10% 50% 90% 50% round 16px);
                    opacity: 0;
                    pointer-events: none;
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                  }

                  .filter-wrapper:hover .filter-menu-container {
                    clip-path: inset(0% 0% 0% 0% round 16px);
                    opacity: 1;
                    pointer-events: auto;
                  }

                  .filter-item-list {
                    --delay: 0.15s;
                    --trdelay: 0.08s;
                    transform: translateY(30px);
                    opacity: 0;
                    transition: transform 0.4s ease, opacity 0.4s ease;
                  }

                  .filter-wrapper:hover .filter-item-list {
                    transform: translateY(0);
                    opacity: 1;
                  }

                  .filter-wrapper:hover .filter-item-list:nth-child(1) { transition-delay: var(--delay); }
                  .filter-wrapper:hover .filter-item-list:nth-child(2) { transition-delay: calc(var(--delay) + var(--trdelay)); }
                  .filter-wrapper:hover .filter-item-list:nth-child(3) { transition-delay: calc(var(--delay) + (var(--trdelay) * 2)); }

                  @keyframes clipDown {
                    0% {
                      clip-path: inset(0 0 100% 0 round 12px);
                      opacity: 0;
                      transform: translateY(-5px);
                    }
                    100% {
                      clip-path: inset(0 0 0 0 round 12px);
                      opacity: 1;
                      transform: translateY(0);
                    }
                  }

                  .clip-down-animation {
                    animation: clipDown 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                  }

                  /* DEPARTMENT CUSTOM HOVER DROPDOWN STYLE */
                  .dept-main {
                    font-weight: 600;
                    color: #334155;
                    background-color: white;
                    border: 1px solid #cbd5e1;
                    padding: 8px 16px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    height: 44px;
                    width: 100%;
                    position: relative;
                    cursor: pointer;
                    justify-content: space-between;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                    transition: all 0.3s ease;
                  }

                  .dept-main:hover {
                    border-color: #3b82f6;
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.08);
                  }

                  .dept-main.selected-active {
                    background-color: #eff6ff;
                    border-color: #3b82f6;
                    color: #1d4ed8;
                  }

                  .dept-bar {
                    display: flex;
                    height: 12px;
                    width: 16px;
                    flex-direction: column;
                    gap: 3px;
                    justify-content: center;
                  }

                  .dept-bar-list {
                    display: block;
                    width: 100%;
                    height: 2px;
                    border-radius: 50px;
                    background-color: #64748b;
                    transition: all 0.4s ease;
                    position: relative;
                  }

                  .dept-main.selected-active .dept-bar-list {
                    background-color: #3b82f6;
                  }

                  .dept-wrapper:hover .dept-top {
                    transform-origin: top right;
                    transform: translateY(-0.5px) rotate(-45deg) scaleX(0.9);
                  }

                  .dept-wrapper:hover .dept-middle {
                    transform: translateX(-50%);
                    opacity: 0;
                  }

                  .dept-wrapper:hover .dept-bottom {
                    transform-origin: bottom right;
                    transform: translateY(0.5px) rotate(45deg) scaleX(0.9);
                  }

                  /* Invisible bridge to prevent mouse leaving gap */
                  .dept-wrapper::after {
                    content: '';
                    position: absolute;
                    bottom: 100%;
                    left: 0;
                    right: 0;
                    height: 15px;
                    z-index: 98;
                  }

                  .dept-menu-container {
                    background-color: white;
                    color: #1e293b;
                    font-weight: 400;
                    border: 1px solid #e2e8f0;
                    border-radius: 16px;
                    position: absolute;
                    width: 100%;
                    left: 0;
                    bottom: calc(100% + 6px);
                    overflow: hidden;
                    box-shadow: 0 -20px 25px -5px rgba(0, 0, 0, 0.1), 0 -8px 10px -6px rgba(0, 0, 0, 0.1);
                    z-index: 999 !important;
                    padding: 12px;
                    cursor: default;
                    clip-path: inset(90% 50% 10% 50% round 16px);
                    opacity: 0;
                    pointer-events: none;
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                  }

                  .dept-wrapper:hover .dept-menu-container {
                    clip-path: inset(0% 0% 0% 0% round 16px);
                    opacity: 1;
                    pointer-events: auto;
                  }

                  /* Bank specific wrapper that opens downwards */
                  .bank-wrapper {
                    position: relative;
                    width: 100%;
                  }

                  .bank-wrapper:hover .dept-top {
                    transform-origin: top right;
                    transform: translateY(-0.5px) rotate(-45deg) scaleX(0.9);
                  }

                  .bank-wrapper:hover .dept-middle {
                    transform: translateX(-50%);
                    opacity: 0;
                  }

                  .bank-wrapper:hover .dept-bottom {
                    transform-origin: bottom right;
                    transform: translateY(0.5px) rotate(45deg) scaleX(0.9);
                  }

                  .bank-wrapper::after {
                    content: '';
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    height: 15px;
                    z-index: 98;
                  }

                  .bank-menu-container {
                    background-color: white;
                    color: #1e293b;
                    font-weight: 400;
                    border: 1px solid #e2e8f0;
                    border-radius: 16px;
                    position: absolute;
                    width: 100%;
                    left: 0;
                    top: calc(100% + 6px);
                    overflow: hidden;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
                    z-index: 999 !important;
                    padding: 12px;
                    cursor: default;
                    clip-path: inset(10% 50% 90% 50% round 16px);
                    opacity: 0;
                    pointer-events: none;
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                  }

                  .bank-wrapper:hover .bank-menu-container {
                    clip-path: inset(0% 0% 0% 0% round 16px);
                    opacity: 1;
                    pointer-events: auto;
                  }

                  .bank-wrapper:hover .dept-item-list {
                    opacity: 1;
                    transform: translateY(0);
                  }

                  .dept-item-list {
                    --delay: 0.15s;
                    --trdelay: 0.08s;
                    transform: translateY(30px);
                    opacity: 0;
                    transition: transform 0.4s ease, opacity 0.4s ease;
                  }

                  .dept-wrapper:hover .dept-item-list {
                    transform: translateY(0);
                    opacity: 1;
                  }

                  .dept-wrapper:hover .dept-item-list:nth-child(1) { transition-delay: var(--delay); }
                  .dept-wrapper:hover .dept-item-list:nth-child(2) { transition-delay: calc(var(--delay) + var(--trdelay)); }
                  .dept-wrapper:hover .dept-item-list:nth-child(3) { transition-delay: calc(var(--delay) + (var(--trdelay) * 2)); }
                  .dept-wrapper:hover .dept-item-list:nth-child(4) { transition-delay: calc(var(--delay) + (var(--trdelay) * 3)); }
                  .dept-wrapper:hover .dept-item-list:nth-child(5) { transition-delay: calc(var(--delay) + (var(--trdelay) * 4)); }
                  .dept-wrapper:hover .dept-item-list:nth-child(6) { transition-delay: calc(var(--delay) + (var(--trdelay) * 5)); }
                  .dept-wrapper:hover .dept-item-list:nth-child(7) { transition-delay: calc(var(--delay) + (var(--trdelay) * 6)); }
                  .dept-wrapper:hover .dept-item-list:nth-child(8) { transition-delay: calc(var(--delay) + (var(--trdelay) * 7)); }
                  .dept-wrapper:hover .dept-item-list:nth-child(9) { transition-delay: calc(var(--delay) + (var(--trdelay) * 8)); }
                  .dept-wrapper:hover .dept-item-list:nth-child(10) { transition-delay: calc(var(--delay) + (var(--trdelay) * 9)); }
                  .dept-wrapper:hover .dept-item-list:nth-child(11) { transition-delay: calc(var(--delay) + (var(--trdelay) * 10)); }
                  .dept-wrapper:hover .dept-item-list:nth-child(12) { transition-delay: calc(var(--delay) + (var(--trdelay) * 11)); }
                  .dept-wrapper:hover .dept-item-list:nth-child(13) { transition-delay: calc(var(--delay) + (var(--trdelay) * 12)); }
                  .dept-wrapper:hover .dept-item-list:nth-child(14) { transition-delay: calc(var(--delay) + (var(--trdelay) * 13)); }
                  .dept-wrapper:hover .dept-item-list:nth-child(15) { transition-delay: calc(var(--delay) + (var(--trdelay) * 14)); }
                  
                  .bank-wrapper:hover .dept-item-list:nth-child(1) { transition-delay: var(--delay); }
                  .bank-wrapper:hover .dept-item-list:nth-child(2) { transition-delay: calc(var(--delay) + var(--trdelay)); }
                  .bank-wrapper:hover .dept-item-list:nth-child(3) { transition-delay: calc(var(--delay) + (var(--trdelay) * 2)); }
                  .bank-wrapper:hover .dept-item-list:nth-child(4) { transition-delay: calc(var(--delay) + (var(--trdelay) * 3)); }
                  .bank-wrapper:hover .dept-item-list:nth-child(5) { transition-delay: calc(var(--delay) + (var(--trdelay) * 4)); }
                  .bank-wrapper:hover .dept-item-list:nth-child(6) { transition-delay: calc(var(--delay) + (var(--trdelay) * 5)); }
                  .bank-wrapper:hover .dept-item-list:nth-child(7) { transition-delay: calc(var(--delay) + (var(--trdelay) * 6)); }
                  .bank-wrapper:hover .dept-item-list:nth-child(8) { transition-delay: calc(var(--delay) + (var(--trdelay) * 7)); }
                  .bank-wrapper:hover .dept-item-list:nth-child(9) { transition-delay: calc(var(--delay) + (var(--trdelay) * 8)); }
                  .bank-wrapper:hover .dept-item-list:nth-child(10) { transition-delay: calc(var(--delay) + (var(--trdelay) * 9)); }
                  .bank-wrapper:hover .dept-item-list:nth-child(11) { transition-delay: calc(var(--delay) + (var(--trdelay) * 10)); }
                  .bank-wrapper:hover .dept-item-list:nth-child(12) { transition-delay: calc(var(--delay) + (var(--trdelay) * 11)); }
                  .bank-wrapper:hover .dept-item-list:nth-child(13) { transition-delay: calc(var(--delay) + (var(--trdelay) * 12)); }
                  .bank-wrapper:hover .dept-item-list:nth-child(14) { transition-delay: calc(var(--delay) + (var(--trdelay) * 13)); }
                  .bank-wrapper:hover .dept-item-list:nth-child(15) { transition-delay: calc(var(--delay) + (var(--trdelay) * 14)); }

                  /* ORBITAL RADIO PICK FOR DEPARTMENT ITEMS */
                  .dept-radio-label {
                    display: flex;
                    align-items: center;
                    cursor: pointer;
                    position: relative;
                    user-select: none;
                    width: 100%;
                    padding: 10px 14px;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    background: white;
                    transition: all 0.3s ease;
                  }

                  .dept-radio-label:hover {
                    background: #f8fafc;
                    border-color: #cbd5e1;
                  }

                  .dept-radio-label.dept-selected {
                    background: linear-gradient(135deg, #eff6ff, #dbeafe);
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.08);
                  }

                  .dept-radio-input {
                    display: none;
                  }

                  .dept-radio-custom {
                    width: 20px;
                    height: 20px;
                    background-color: transparent;
                    border: 2px solid #94a3b8;
                    border-radius: 50%;
                    margin-right: 14px;
                    position: relative;
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                  }

                  .dept-radio-custom::before {
                    content: "";
                    position: absolute;
                    width: 8px;
                    height: 8px;
                    background: #94a3b8;
                    border-radius: 50%;
                    transform: scale(0);
                    transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
                  }

                  .dept-radio-custom::after {
                    content: "";
                    position: absolute;
                    width: 30px;
                    height: 30px;
                    border: 2px solid transparent;
                    border-radius: 50%;
                    border-top-color: #3b82f6;
                    opacity: 0;
                    transform: scale(0.8);
                    transition: all 0.4s ease;
                  }

                  .dept-radio-label:hover .dept-radio-custom {
                    transform: scale(1.1);
                    border-color: #64748b;
                  }

                  .dept-radio-label.dept-selected .dept-radio-custom {
                    border-color: #3b82f6;
                    transform: scale(0.9);
                  }

                  .dept-radio-label.dept-selected .dept-radio-custom::before {
                    transform: scale(1);
                    background-color: #3b82f6;
                  }

                  .dept-radio-label.dept-selected .dept-radio-custom::after {
                    opacity: 1;
                    transform: scale(1.3);
                    animation: dept-orbit 2.5s infinite linear;
                    box-shadow: 0 0 20px rgba(59, 130, 246, 0.4), 0 0 50px rgba(59, 130, 246, 0.1);
                  }

                  .dept-radio-text {
                    font-size: 13px;
                    font-weight: 600;
                    color: #475569;
                    transition: all 0.3s ease;
                    flex: 1;
                    min-width: 0;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                  }

                  .dept-radio-label:hover .dept-radio-text {
                    color: #1e293b;
                  }

                  .dept-radio-label.dept-selected .dept-radio-text {
                    color: #1d4ed8;
                    font-weight: 700;
                  }

                  .dept-radio-code {
                    font-size: 10px;
                    font-family: ui-monospace, monospace;
                    font-weight: 700;
                    padding: 2px 8px;
                    border-radius: 6px;
                    background: #f1f5f9;
                    color: #64748b;
                    flex-shrink: 0;
                    margin-left: 8px;
                    transition: all 0.3s ease;
                  }

                  .dept-radio-label.dept-selected .dept-radio-code {
                    background: #dbeafe;
                    color: #1d4ed8;
                  }

                  @keyframes dept-orbit {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                  }

                  /* SCROLL INDICATORS FOR DEPT LIST */
                  .dept-scroll-wrapper {
                    position: relative;
                  }

                  .dept-scroll-fade-top,
                  .dept-scroll-fade-bottom {
                    position: absolute;
                    left: 0;
                    right: 6px;
                    height: 44px;
                    pointer-events: none;
                    z-index: 2;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 2px;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                  }

                  .dept-scroll-fade-top {
                    top: -2px;
                    background: linear-gradient(to bottom, rgba(255,255,255,1) 40%, rgba(255,255,255,0.6) 70%, transparent);
                    border-radius: 12px 12px 0 0;
                  }

                  .dept-scroll-fade-bottom {
                    bottom: -2px;
                    background: linear-gradient(to top, rgba(255,255,255,1) 40%, rgba(255,255,255,0.6) 70%, transparent);
                    border-radius: 0 0 12px 12px;
                  }

                  .dept-scroll-fade-top.visible,
                  .dept-scroll-fade-bottom.visible {
                    opacity: 1;
                  }

                  .dept-scroll-chevron {
                    width: 22px;
                    height: 22px;
                    color: #3b82f6;
                    filter: drop-shadow(0 1px 3px rgba(59,130,246,0.4));
                  }

                  .dept-scroll-hint {
                    font-size: 9px;
                    font-weight: 700;
                    color: #93c5fd;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                  }

                  .dept-scroll-fade-top .dept-scroll-chevron {
                    animation: dept-bounce-up 1s ease-in-out infinite;
                  }

                  .dept-scroll-fade-bottom .dept-scroll-chevron {
                    animation: dept-bounce-down 1s ease-in-out infinite;
                  }

                  @keyframes dept-bounce-up {
                    0%, 100% { transform: translateY(6px); opacity: 0.3; }
                    50% { transform: translateY(-8px); opacity: 1; }
                  }

                  @keyframes dept-bounce-down {
                    0%, 100% { transform: translateY(-6px); opacity: 0.3; }
                    50% { transform: translateY(8px); opacity: 1; }
                  }

                  /* Fancy Date Input */
                  .fancy-date-input {
                    position: relative;
                    background-color: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 10px;
                    padding: 8px 12px;
                    font-size: 13px;
                    font-weight: 600;
                    color: #334155;
                    width: 100%;
                    outline: none;
                    transition: all 0.2s ease;
                    cursor: pointer;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
                  }
                  .fancy-date-input:focus, .fancy-date-input:hover {
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                  }
                  .fancy-date-input::-webkit-calendar-picker-indicator {
                    cursor: pointer;
                    opacity: 0.6;
                    transition: opacity 0.2s;
                    padding: 5px;
                  }
                  .fancy-date-input::-webkit-calendar-picker-indicator:hover {
                    opacity: 1;
                  }

                  @media print {
                    body * {
                      visibility: hidden;
                    }
                    .print-section, .print-section * {
                      visibility: visible;
                    }
                    .print-section {
                      position: absolute;
                      left: 0;
                      top: 0;
                      width: 100%;
                      border: none !important;
                      box-shadow: none !important;
                    }
                    /* Hide the actions column in print */
                    .print-section th:last-child,
                    .print-section td:last-child {
                      display: none !important;
                    }
                  }

                  /* FANCY DOWNLOAD BUTTONS */
                  .fancy-download-btn {
                    --width: 90px;
                    --height: 38px;
                    --tooltip-height: 30px;
                    --tooltip-width: 80px;
                    --gap-between-tooltip-to-button: 10px;
                    --button-color: #2563eb;
                    --tooltip-color: #fff;
                    width: var(--width);
                    height: var(--height);
                    background: var(--button-color);
                    position: relative;
                    text-align: center;
                    border-radius: 0.75rem;
                    font-family: inherit;
                    transition: background 0.3s;
                    cursor: pointer;
                    box-shadow: 0 4px 6px -1px rgb(37 99 235 / 0.1);
                  }
                  .fancy-download-btn.pdf {
                    --button-color: #e11d48;
                    box-shadow: 0 4px 6px -1px rgb(225 29 72 / 0.1);
                  }
                  .fancy-download-btn.excel {
                    --button-color: #059669;
                    box-shadow: 0 4px 6px -1px rgb(5 150 105 / 0.1);
                  }
                  .fancy-download-btn::before {
                    position: absolute;
                    content: attr(data-tooltip);
                    width: var(--tooltip-width);
                    height: var(--tooltip-height);
                    background-color: var(--tooltip-color);
                    font-size: 0.75rem;
                    font-weight: bold;
                    color: #1e293b;
                    border-radius: 0.375rem;
                    line-height: var(--tooltip-height);
                    bottom: calc(var(--height) + var(--gap-between-tooltip-to-button) + 10px);
                    left: calc(50% - var(--tooltip-width) / 2);
                    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
                    z-index: 50;
                  }
                  .fancy-download-btn::after {
                    position: absolute;
                    content: '';
                    width: 0;
                    height: 0;
                    border: 6px solid transparent;
                    border-top-color: var(--tooltip-color);
                    left: calc(50% - 6px);
                    bottom: calc(100% + var(--gap-between-tooltip-to-button) - 6px);
                    z-index: 50;
                  }
                  .fancy-download-btn::after, .fancy-download-btn::before {
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                  }
                  .fancy-download-btn .text {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 13px;
                    font-weight: 700;
                  }
                  .fancy-download-btn .button-wrapper, .fancy-download-btn .text, .fancy-download-btn .icon {
                    overflow: hidden;
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    left: 0;
                    color: #fff;
                  }
                  .fancy-download-btn .text { top: 0; }
                  .fancy-download-btn .text, .fancy-download-btn .icon {
                    transition: top 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                  }
                  .fancy-download-btn .icon {
                    top: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                  }
                  .fancy-download-btn:hover { filter: brightness(1.1); transform: translateY(-2px); }
                  .fancy-download-btn:active { transform: translateY(0) scale(0.95); }
                  .fancy-download-btn:hover .text { top: -100%; }
                  .fancy-download-btn:hover .icon { top: 0; }
                  .fancy-download-btn:hover:before, .fancy-download-btn:hover:after {
                    opacity: 1; visibility: visible;
                  }
                  .fancy-download-btn:hover:after {
                    bottom: calc(var(--height) + var(--gap-between-tooltip-to-button) - 12px);
                  }
                  .fancy-download-btn:hover:before {
                    bottom: calc(var(--height) + var(--gap-between-tooltip-to-button));
                  }

                  /* iOS Checkbox Styles */
                  .ios-checkbox {
                    --checkbox-size: 20px;
                    --checkbox-color: #3b82f6;
                    --checkbox-bg: #dbeafe;
                    --checkbox-border: #93c5fd;

                    position: relative;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    user-select: none;
                    -webkit-tap-highlight-color: transparent;
                  }

                  .ios-checkbox input {
                    display: none;
                  }

                  .checkbox-wrapper {
                    position: relative;
                    width: var(--checkbox-size);
                    height: var(--checkbox-size);
                    border-radius: 6px;
                    transition: transform 0.2s ease;
                  }

                  .checkbox-bg {
                    position: absolute;
                    inset: 0;
                    border-radius: 6px;
                    border: 2px solid var(--checkbox-border);
                    background: white;
                    transition: all 0.2s ease;
                  }

                  .checkbox-icon {
                    position: absolute;
                    inset: 0;
                    margin: auto;
                    width: 80%;
                    height: 80%;
                    color: white;
                    transform: scale(0);
                    transition: all 0.2s ease;
                  }

                  .check-path {
                    stroke-dasharray: 40;
                    stroke-dashoffset: 40;
                    transition: stroke-dashoffset 0.3s ease 0.1s;
                  }

                  .ios-checkbox input:checked + .checkbox-wrapper .checkbox-bg {
                    background: var(--checkbox-color);
                    border-color: var(--checkbox-color);
                  }

                  .ios-checkbox input:checked + .checkbox-wrapper .checkbox-icon {
                    transform: scale(1);
                  }

                  .ios-checkbox input:checked + .checkbox-wrapper .check-path {
                    stroke-dashoffset: 0;
                  }

                  .ios-checkbox:hover .checkbox-wrapper {
                    transform: scale(1.05);
                  }

                  .ios-checkbox:active .checkbox-wrapper {
                    transform: scale(0.95);
                  }

                  .ios-checkbox input:focus + .checkbox-wrapper .checkbox-bg {
                    box-shadow: 0 0 0 4px var(--checkbox-bg);
                  }

                  .ios-checkbox.blue {
                    --checkbox-color: #3b82f6;
                    --checkbox-bg: #dbeafe;
                    --checkbox-border: #93c5fd;
                  }

                  .ios-checkbox.emerald {
                    --checkbox-color: #10b981;
                    --checkbox-bg: #d1fae5;
                    --checkbox-border: #6ee7b7;
                  }
                  
                  .ios-checkbox.purple {
                    --checkbox-color: #8b5cf6;
                    --checkbox-bg: #ede9fe;
                    --checkbox-border: #c4b5fd;
                  }

                  @keyframes ios-bounce {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                  }

                   .ios-checkbox input:checked + .checkbox-wrapper {
                    animation: ios-bounce 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                  }

                  /* PREMIUM SLIDING RADIO INPUTS TABS */
                  /* USER CHOSEN RADIO INPUTS TABS WITH PARTICLE EFFECT */
                  .radio-inputs {
                    position: relative;
                    display: flex;
                    flex-wrap: wrap;
                    border-radius: 1rem;
                    background: linear-gradient(145deg, #e6e6e6, #ffffff);
                    box-sizing: border-box;
                    box-shadow:
                      5px 5px 15px rgba(0, 0, 0, 0.15),
                      -5px -5px 15px rgba(255, 255, 255, 0.8);
                    padding: 0.5rem;
                    width: 380px;
                    max-width: 100%;
                    font-size: 13px;
                    gap: 0.5rem;
                  }

                  .radio-inputs .radio {
                    flex: 1 1 auto;
                    text-align: center;
                    position: relative;
                  }

                  .radio-inputs .radio input {
                    display: none;
                  }

                  .radio-inputs .radio .name {
                    display: flex;
                    cursor: pointer;
                    align-items: center;
                    justify-content: center;
                    border-radius: 0.7rem;
                    border: none;
                    padding: 0.5rem 0;
                    color: #2d3748;
                    font-weight: 600;
                    font-family: inherit;
                    background: linear-gradient(145deg, #ffffff, #e6e6e6);
                    box-shadow:
                      3px 3px 6px rgba(0, 0, 0, 0.1),
                      -3px -3px 6px rgba(255, 255, 255, 0.7);
                    transition: all 0.2s ease;
                    overflow: hidden;
                    height: 34px;
                  }

                  .radio-inputs .radio input:checked + .name {
                    background: linear-gradient(145deg, #3b82f6, #2563eb);
                    color: white;
                    font-weight: 600;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
                    box-shadow:
                      inset 2px 2px 5px rgba(0, 0, 0, 0.2),
                      inset -2px -2px 5px rgba(255, 255, 255, 0.1),
                      3px 3px 8px rgba(59, 130, 246, 0.3);
                    transform: translateY(2px);
                  }

                  /* Hover effect */
                  .radio-inputs .radio:hover .name {
                    background: linear-gradient(145deg, #f0f0f0, #ffffff);
                    transform: translateY(-1px);
                    box-shadow:
                      4px 4px 8px rgba(0, 0, 0, 0.1),
                      -4px -4px 8px rgba(255, 255, 255, 0.8);
                  }

                  .radio-inputs .radio:hover input:checked + .name {
                    transform: translateY(1px);
                  }

                  /* Animation */
                  .radio-inputs .radio input:checked + .name {
                    animation: select 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                  }

                  /* Particles */
                  .radio-inputs .radio .name::before,
                  .radio-inputs .radio .name::after {
                    content: "";
                    position: absolute;
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    opacity: 0;
                    pointer-events: none;
                  }

                  .radio-inputs .radio input:checked + .name::before,
                  .radio-inputs .radio input:checked + .name::after {
                    animation: particles 0.8s ease-out forwards;
                  }

                  .radio-inputs .radio .name::before {
                    background: #60a5fa;
                    box-shadow: 0 0 6px #60a5fa;
                    top: -10px;
                    left: 50%;
                    transform: translateX(-50%);
                  }

                  .radio-inputs .radio .name::after {
                    background: #93c5fd;
                    box-shadow: 0 0 8px #93c5fd;
                    bottom: -10px;
                    left: 50%;
                    transform: translateX(-50%);
                  }

                  /* Sparkles */
                  .radio-inputs .radio .name::after {
                    content: "";
                    position: absolute;
                    inset: 0;
                    z-index: -1;
                    background: radial-gradient(
                      circle at var(--x, 50%) var(--y, 50%),
                      rgba(59, 130, 246, 0.3) 0%,
                      transparent 50%
                    );
                    opacity: 0;
                    transition: opacity 0.3s;
                  }

                  .radio-inputs .radio input:checked + .name::after {
                    opacity: 1;
                    animation: sparkle-bg 1s ease-out forwards;
                  }

                  /* Multiple particles */
                  .radio-inputs .radio input:checked + .name {
                    overflow: visible;
                  }

                  .radio-inputs .radio input:checked + .name::before {
                    box-shadow:
                      0 0 6px #60a5fa,
                      10px -10px 0 #60a5fa,
                      -10px -10px 0 #60a5fa;
                    animation: multi-particles-top 0.8s ease-out forwards;
                  }

                  .radio-inputs .radio input:checked + .name::after {
                    box-shadow:
                      0 0 8px #93c5fd,
                      10px 10px 0 #93c5fd,
                      -10px 10px 0 #93c5fd;
                    animation: multi-particles-bottom 0.8s ease-out forwards;
                  }

                  @keyframes select {
                    0% {
                      transform: scale(0.95) translateY(2px);
                    }
                    50% {
                      transform: scale(1.05) translateY(-1px);
                    }
                    100% {
                      transform: scale(1) translateY(2px);
                    }
                  }

                  @keyframes multi-particles-top {
                    0% {
                      opacity: 1;
                      transform: translateX(-50%) translateY(0) scale(1);
                    }
                    40% {
                      opacity: 0.8;
                    }
                    100% {
                      opacity: 0;
                      transform: translateX(-50%) translateY(-20px) scale(0);
                      box-shadow:
                        0 0 6px transparent,
                        20px -20px 0 transparent,
                        -20px -20px 0 transparent;
                    }
                  }

                  @keyframes multi-particles-bottom {
                    0% {
                      opacity: 1;
                      transform: translateX(-50%) translateY(0) scale(1);
                    }
                    40% {
                      opacity: 0.8;
                    }
                    100% {
                      opacity: 0;
                      transform: translateX(-50%) translateY(20px) scale(0);
                      box-shadow:
                        0 0 8px transparent,
                        20px 20px 0 transparent,
                        -20px 20px 0 transparent;
                    }
                  }

                  @keyframes sparkle-bg {
                    0% {
                      opacity: 0;
                      transform: scale(0.2);
                    }
                    50% {
                      opacity: 1;
                    }
                    100% {
                      opacity: 0;
                      transform: scale(2);
                    }
                  }

                  /* Ripple effect */
                  .radio-inputs .radio .name::before {
                    content: "";
                    position: absolute;
                    inset: 0;
                    border-radius: inherit;
                    background: radial-gradient(
                      circle at var(--x, 50%) var(--y, 50%),
                      rgba(255, 255, 255, 0.5) 0%,
                      transparent 50%
                    );
                    opacity: 0;
                    transition: opacity 0.3s;
                  }

                  .radio-inputs .radio input:checked + .name::before {
                    animation: ripple 0.8s ease-out;
                  }

                  @keyframes ripple {
                    0% {
                      opacity: 1;
                      transform: scale(0.2);
                    }
                    50% {
                      opacity: 0.5;
                    }
                    100% {
                      opacity: 0;
                      transform: scale(2.5);
                    }
                  }

                  /* Glowing border */
                  .radio-inputs .radio input:checked + .name {
                    position: relative;
                  }

                  .radio-inputs .radio input:checked + .name::after {
                    content: "";
                    position: absolute;
                    inset: -2px;
                    border-radius: inherit;
                    background: linear-gradient(
                      45deg,
                      rgba(59, 130, 246, 0.5),
                      rgba(37, 99, 235, 0.5)
                    );
                    -webkit-mask:
                      linear-gradient(#fff 0 0) content-box,
                      linear-gradient(#fff 0 0);
                    -webkit-mask-composite: xor;
                    mask-composite: exclude;
                    animation: border-glow 1.5s ease-in-out infinite alternate;
                  }

                  @keyframes border-glow {
                    0% {
                      opacity: 0.5;
                    }
                    100% {
                      opacity: 1;
                    }
                  }
                `}</style>

      
      {}
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col justify-between p-5 shrink-0">
        <div className="space-y-8 flex-1 overflow-y-auto overflow-x-hidden">
          {/* Top Logo Section */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#0f4c5c] rounded-[8px] flex items-center justify-center text-white shadow-sm">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-slate-800 text-[15px] tracking-tight">vLance Admin</span>
            </div>
            <div className="w-6 h-6 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors">
              <ChevronsLeft className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>

          <div className="space-y-6">
            {/* OVERVIEW Section */}
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 flex justify-between items-center">
                <span>Overview</span>
              </p>
              
              {[
                { id: 'home', icon: Home, label: 'Trang chß╗º' },
                { id: 'dashboard', icon: LayoutDashboard, label: 'B├ío c├ío & Thß╗æng k├¬' }
              ].map(item => (
                <div 
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-2 flex items-center gap-3 rounded-lg cursor-pointer transition-colors ${
                    activeTab === item.id ? 'bg-[#0f4c5c]/10' : 'hover:bg-slate-50'
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-[#0f4c5c]' : 'text-slate-400'}`} />
                  <span className={`text-[13px] ${activeTab === item.id ? 'font-semibold text-[#0f4c5c]' : 'font-medium text-slate-600'}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            {/* MANAGEMENT Section */}
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 flex justify-between items-center">
                <span>Management</span>
              </p>
              
              {[
                { id: 'users', icon: Users, label: 'Ng╞░ß╗¥i d├╣ng' },
                { id: 'departments', icon: Sliders, label: 'Ph├▓ng ban / Khoa' }
              ].map(item => (
                <div 
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-2 flex items-center gap-3 rounded-lg cursor-pointer transition-colors ${
                    activeTab === item.id ? 'bg-[#0f4c5c]/10' : 'hover:bg-slate-50'
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-[#0f4c5c]' : 'text-slate-400'}`} />
                  <span className={`text-[13px] ${activeTab === item.id ? 'font-semibold text-[#0f4c5c]' : 'font-medium text-slate-600'}`}>
                    {item.label}
                  </span>
                  {item.id === 'users' && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-rose-500"></span>}
                </div>
              ))}
            </div>

            {/* FINANCE Section */}
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 flex justify-between items-center">
                <span>Finance</span>
              </p>
              
              {[
                { id: 'vnpay', icon: BadgeDollarSign, label: 'Giao dß╗ïch VNPay' }
              ].map(item => (
                <div 
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-2 flex items-center gap-3 rounded-lg cursor-pointer transition-colors ${
                    activeTab === item.id ? 'bg-[#0f4c5c]/10' : 'hover:bg-slate-50'
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-[#0f4c5c]' : 'text-slate-400'}`} />
                  <span className={`text-[13px] ${activeTab === item.id ? 'font-semibold text-[#0f4c5c]' : 'font-medium text-slate-600'}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
            
            {/* SYSTEM Section */}
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 flex justify-between items-center">
                <span>System</span>
              </p>
              
              {[
                { id: 'cms', icon: Settings, label: 'Cß║Ñu h├¼nh (CMS)' }
              ].map(item => (
                <div 
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-2 flex items-center gap-3 rounded-lg cursor-pointer transition-colors ${
                    activeTab === item.id ? 'bg-[#0f4c5c]/10' : 'hover:bg-slate-50'
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-[#0f4c5c]' : 'text-slate-400'}`} />
                  <span className={`text-[13px] ${activeTab === item.id ? 'font-semibold text-[#0f4c5c]' : 'font-medium text-slate-600'}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-1 mt-6 pt-4 border-t border-slate-100">
          <div className="px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-slate-400" />
              <span className="text-[13px] font-medium text-slate-600">Pro Mode</span>
            </div>
            <div className="w-8 h-4 bg-emerald-500 rounded-full relative cursor-pointer">
              <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow-sm"></div>
            </div>
          </div>
          
          <div className="px-2 pt-2">
            <div className="flex items-center gap-3 p-2 bg-slate-50/80 hover:bg-slate-100 cursor-pointer rounded-xl transition-colors">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-lg object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-xs">
                  {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'A'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-slate-800 truncate leading-tight">{user?.displayName || user?.email || 'Admin'}</p>
                <p className="text-[10px] font-medium text-slate-400 truncate leading-tight">Admin System</p>
              </div>
              <ChevronsRight className="w-3.5 h-3.5 text-slate-400 shrink-0 transform rotate-90" />
            </div>
          </div>
        </div>
      </aside>

      {}
      <main className="flex-grow flex flex-col min-w-0 bg-slate-50">
        
        {}
        <header className="bg-white border-b border-slate-200 h-20 px-8 flex justify-between items-center shrink-0">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-primary flex items-center gap-3">
              {activeTab === 'home' && <><Home className="w-6 h-6 text-blue-600" /> Hß╗ç thß╗æng Quß║ún trß╗ï LancerPro</>}
              {activeTab === 'dashboard' && <><Settings className="w-6 h-6 text-blue-600" /> B├ío c├ío & Thß╗æng k├¬ Tß╗òng quan</>}
              {activeTab === 'users' && <><Users className="w-6 h-6 text-indigo-600" /> User Account Control</>}
              {activeTab === 'departments' && <><Sliders className="w-6 h-6 text-indigo-600" /> Quß║ún l├╜ Khoa / Ph├▓ng Ban</>}
              {activeTab === 'cms' && <><Settings className="w-6 h-6 text-cyan-600" /> SEO & Policy Config</>}
              {activeTab === 'vnpay' && <><BadgeDollarSign className="w-6 h-6 text-emerald-600" /> Cß║Ñu h├¼nh & Giao dß╗ïch VNPay</>}
            </h1>
            <p className="text-body-sm text-muted mt-1 ml-9">
              {activeTab === 'home' && 'Tß╗òng quan dß╗ïch vß╗Ñ v├á lß╗æi tß║»t truy cß║¡p nhanh v├áo c├íc ph├ón hß╗ç nghiß╗çp vß╗Ñ.'}
              {activeTab === 'dashboard' && 'High-precision tracking of system registrations, escrow transaction distributions, and commissions.'}
              {activeTab === 'users' && 'Lock, ban, or unlock system user accounts.'}
              {activeTab === 'departments' && 'Quß║ún l├╜ c├íc khoa chuy├¬n m├┤n, gi├ím s├ít phi├¬n l├ám viß╗çc v├á nhß║¡t k├╜ thao t├íc.'}
              {activeTab === 'cms' && 'Manage policy pages, SEO metadata, and system flags.'}
              {activeTab === 'vnpay' && 'Quß║ún l├╜ tham sß╗æ kß║┐t nß╗æi VNPay v├á ─æß╗æi so├ít c├íc giao dß╗ïch ─æ├│ng ph├¡ nß╗ün tß║úng cß╗ºa nh├á tuyß╗ân dß╗Ñng.'}
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {activeTab === 'dashboard' && (
              <button 
                onClick={loadDashboardData}
                className="p-2.5 text-slate-400 hover:text-slate-600 rounded-xl border border-slate-200 hover:bg-slate-50 bg-white shadow-sm transition-all duration-200 active:scale-95 hover:shadow-md mr-2"
                title="Refresh Data"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            
            
            <div className="profile-menu-wrapper pl-4 border-l border-slate-200">
              <div 
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-slate-200/80 bg-slate-50/40 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm transition-all duration-300 cursor-pointer group"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-[13px] font-bold text-slate-850 leading-tight truncate max-w-[150px]" title={user?.displayName || user?.email}>
                    {user?.displayName || user?.email}
                  </p>
                  <div className="flex justify-end mt-0.5">
                    <span className="inline-flex items-center text-[9px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100/60 leading-none">
                      {user?.role || "ADMIN"}
                    </span>
                  </div>
                </div>
                
                <div className="relative">
                  {user?.avatarUrl ? (
                    <img 
                      src={user.avatarUrl} 
                      alt="Avatar" 
                      className="w-9 h-9 rounded-full object-cover border-2 border-blue-500/85 shadow-sm transition-transform duration-300 group-hover:scale-105" 
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white text-sm border-2 border-white shadow-sm transition-transform duration-300 group-hover:scale-105">
                      {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'A'}
                    </div>
                  )}
                  
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                </div>
                
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-300 group-hover:rotate-180" />
              </div>

              <div className="profile-menu-dropdown">
                <div className="profile-menu-item px-3 py-2 border-b border-slate-50 mb-1">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest text-left">
                    T├ái khoß║ún
                  </p>
                  <p
                    className="text-sm font-bold text-slate-800 truncate text-left"
                    title={user?.email}
                  >
                    {user?.email || user?.displayName}
                  </p>
                </div>

                <div className="profile-menu-item">
                  <button
                    onClick={() => {
                      if (onNavigate) onNavigate("edit_profile");
                    }}
                    className={`profile-menu-btn w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition-all mt-1 ${
                      activeTab === 'edit_profile'
                        ? 'profile-menu-active text-emerald-600 bg-emerald-50'
                        : 'text-slate-650 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <span className="profile-menu-circle" />
                    <Edit3 className="w-4 h-4" /> Sß╗¡a th├┤ng tin c├í nh├ón
                  </button>
                </div>

                <div className="profile-menu-item">
                  <button
                    onClick={() => {
                      if (onNavigate) onNavigate("preferences");
                    }}
                    className={`profile-menu-btn w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition-all mt-1 ${
                      activeTab === 'preferences'
                        ? 'profile-menu-active text-emerald-600 bg-emerald-50'
                        : 'text-slate-650 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <span className="profile-menu-circle" />
                    <Settings className="w-4 h-4" /> C├ái ─æß║╖t chung
                  </button>
                </div>

                {user?.role !== "STAFF" && user?.role !== "MANAGER" && (
                  <div className="profile-menu-item">
                    <button
                      onClick={() => {
                        if (onNavigate) onNavigate("messenger");
                      }}
                      className={`profile-menu-btn w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition-all mt-1 ${
                        activeTab === 'messenger'
                          ? 'profile-menu-active text-emerald-600 bg-emerald-50'
                          : 'text-slate-650 hover:text-indigo-600 hover:bg-indigo-50'
                      }`}
                    >
                      <span className="profile-menu-circle" />
                      <MessageSquare className="w-4 h-4" /> Tin nhß║»n
                    </button>
                  </div>
                )}

                <div className="profile-menu-item">
                  <button
                    onClick={() => {
                      setActiveTab("home");
                      if (onNavigate) onNavigate("admin");
                    }}
                    className={`profile-menu-btn w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold rounded-xl transition-all mt-1 ${
                      activeTab === 'home' || activeTab === 'dashboard'
                        ? 'profile-menu-active text-emerald-600 bg-emerald-50'
                        : 'text-slate-650 hover:text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    <span className="profile-menu-circle" />
                    <Shield className="w-4 h-4" /> {user?.role === "ADMIN" ? "Dashboard Admin" : user?.role === "MANAGER" ? "Dashboard Manager" : "Dashboard Staff"}
                  </button>
                </div>

                <div className="h-[1px] bg-slate-100 my-1 mx-2" />

                <div className="profile-menu-item">
                  <button
                    onClick={() => {
                      if (onLogout) {
                        onLogout();
                      } else {
                        localStorage.clear();
                        window.location.reload();
                      }
                    }}
                    className="profile-menu-btn w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                  >
                    <span className="profile-menu-circle" />
                    <LogOut className="w-4 h-4" /> ─É─âng xuß║Ñt
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {}
        <div className="flex-grow p-8 overflow-y-auto overflow-x-hidden space-y-8 min-w-0">
          
          {}
          {activeTab === 'home' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {}
              <div className="bg-gradient-to-r from-teal-500 to-cyan-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                  <h2 className="text-3xl font-bold font-display mb-2">Hß╗ç thß╗æng Quß║ún trß╗ï LancerPro</h2>
                  <p className="text-teal-50 mb-8 max-w-lg text-sm">Trung t├óm ─æiß╗üu h├ánh nß╗ün tß║úng viß╗çc l├ám tß╗▒ do. Vui l├▓ng chß╗ìn ph├ón hß╗ç nghiß╗çp vß╗Ñ b├¬n d╞░ß╗¢i ─æß╗â bß║»t ─æß║ºu c├┤ng viß╗çc h├áng ng├áy.</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                      <p className="text-3xl font-bold">{stats.totalUsers}</p>
                      <p className="text-[11px] font-bold text-teal-100 uppercase tracking-wider mt-1">Ng╞░ß╗¥i d├╣ng</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                      <p className="text-3xl font-bold">{stats.activeProjects}</p>
                      <p className="text-[11px] font-bold text-teal-100 uppercase tracking-wider mt-1">Dß╗▒ ├ín in-progress</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                      <p className="text-3xl font-bold">{pendingProjects.length}</p>
                      <p className="text-[11px] font-bold text-teal-100 uppercase tracking-wider mt-1">Dß╗▒ ├ín chß╗¥ duyß╗çt</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                      <p className="text-3xl font-bold">{stats.pendingWithdrawals}</p>
                      <p className="text-[11px] font-bold text-teal-100 uppercase tracking-wider mt-1">Y├¬u cß║ºu r├║t tiß╗ün</p>
                    </div>
                  </div>
                </div>
                
                {}
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-cyan-400/20 rounded-full blur-2xl"></div>
              </div>

              {}
              <div>
                <div className="flex items-center gap-2 mb-6 text-slate-700">
                  <LayoutDashboard className="w-5 h-5 text-blue-600" />
                  <h3 className="text-xl font-bold">Dß╗ïch vß╗Ñ Quß║ún l├╜ Nghiß╗çp vß╗Ñ</h3>
                  <span className="text-sm font-normal text-slate-500 ml-2">Chß╗ìn nghiß╗çp vß╗Ñ ─æß╗â bß║»t ─æß║ºu c├┤ng viß╗çc h├áng ng├áy</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {}
                  <div 
                    onClick={() => setActiveTab('dashboard')}
                    className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all duration-300 hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <LayoutDashboard className="w-6 h-6" />
                      </div>
                      <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider">HOß║áT ─Éß╗ÿNG</span>
                    </div>
                    <h4 className="text-lg font-bold text-slate-800 mb-2">B├ío c├ío & Thß╗æng k├¬</h4>
                    <p className="text-sm text-slate-500 mb-6 line-clamp-2">Xem biß╗âu ─æß╗ô t─âng tr╞░ß╗ƒng, doanh thu GMV, tß╗╖ lß╗ç chuyß╗ân ─æß╗òi v├á c├íc chß╗ë sß╗æ t├ái ch├¡nh.</p>
                    <p className="text-xs font-bold text-emerald-600">Dß╗» liß╗çu theo thß╗¥i gian thß╗▒c</p>
                  </div>

                  {}
                  <div 
                    onClick={() => setActiveTab('users')}
                    className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-rose-300 transition-all duration-300 hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Users className="w-6 h-6" />
                      </div>
                      <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider">HOß║áT ─Éß╗ÿNG</span>
                    </div>
                    <h4 className="text-lg font-bold text-slate-800 mb-2">Quß║ún l├╜ Ng╞░ß╗¥i d├╣ng</h4>
                    <p className="text-sm text-slate-500 mb-6 line-clamp-2">Kh├│a/mß╗ƒ kh├│a t├ái khoß║ún, ban v─⌐nh viß╗àn, xem lß╗ïch sß╗¡ truy cß║¡p cß╗ºa hß╗ç thß╗æng.</p>
                    <p className="text-xs font-bold text-rose-600">{stats.totalUsers} ng╞░ß╗¥i d├╣ng</p>
                  </div>

                  {}
                  <div 
                    onClick={() => setActiveTab('cms')}
                    className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-violet-300 transition-all duration-300 hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Settings className="w-6 h-6" />
                      </div>
                      <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider">HOß║áT ─Éß╗ÿNG</span>
                    </div>
                    <h4 className="text-lg font-bold text-slate-800 mb-2">Cß║Ñu h├¼nh & SEO</h4>
                    <p className="text-sm text-slate-500 mb-6 line-clamp-2">Quß║ún l├╜ danh mß╗Ñc kß╗╣ n─âng, cß║Ñu h├¼nh nß╗ün tß║úng, tß╗æi ╞░u SEO v├á quß║ún l├╜ khiß║┐u nß║íi.</p>
                    <p className="text-xs font-bold text-violet-600">Truy cß║¡p cß║Ñu h├¼nh</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {}
          {activeTab === 'dashboard' && (
            <div className="animate-in fade-in duration-300">
              {/* Sub-Tabs Navigation */}
              <div className="flex justify-center mb-8">
                <div className="radio-inputs">
                  <label className="radio">
                    <input type="radio" name="dashboardTab" checked={dashboardSubTab === 'overview'} onChange={() => setDashboardSubTab('overview')} />
                    <span className="name">Tß╗òng quan & Cß║únh b├ío</span>
                  </label>
                  <label className="radio">
                    <input type="radio" name="dashboardTab" checked={dashboardSubTab === 'financials'} onChange={() => setDashboardSubTab('financials')} />
                    <span className="name">Biß╗âu ─æß╗ô & T├ái ch├¡nh</span>
                  </label>
                  <label className="radio">
                    <input type="radio" name="dashboardTab" checked={dashboardSubTab === 'activity'} onChange={() => setDashboardSubTab('activity')} />
                    <span className="name">Nhß║¡t k├╜ Hoß║ít ─æß╗Öng</span>
                  </label>
                </div>
              </div>

              {/* TOP BANNER */}
              <div className="bg-[#0f4c5c] rounded-[24px] p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center text-white mb-8 shadow-[0_4px_20px_rgb(15,76,92,0.15)]">
                <div>
                  <p className="text-teal-100/80 font-medium text-[13px] mb-1.5">Total Balance</p>
                  <div className="flex items-baseline gap-3">
                    <h2 className="text-3xl md:text-[40px] font-bold tracking-tight">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.totalRevenue || 0)}
                    </h2>
                    <span className="text-emerald-400 text-sm font-semibold flex items-center gap-0.5">
                      <ArrowUpRight className="w-4 h-4" /> {stats.revenueGrowthPercent || 0}%
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 mt-6 md:mt-0">
                  <button className="bg-emerald-400 hover:bg-emerald-500 text-slate-900 font-bold py-2.5 px-5 rounded-xl transition-colors flex items-center gap-2 text-sm shadow-sm">
                    <Plus className="w-4 h-4" /> Add
                  </button>
                  <button className="bg-white/10 hover:bg-white/20 text-white font-semibold py-2.5 px-5 rounded-xl transition-colors flex items-center gap-2 text-sm backdrop-blur-sm">
                    <ArrowUpRight className="w-4 h-4" /> Send
                  </button>
                  <button className="bg-white/10 hover:bg-white/20 text-white font-semibold py-2.5 px-5 rounded-xl transition-colors flex items-center gap-2 text-sm backdrop-blur-sm">
                    <RefreshCw className="w-4 h-4" /> Request
                  </button>
                  <button className="bg-white/10 hover:bg-white/20 text-white font-semibold p-2.5 rounded-xl transition-colors flex items-center justify-center backdrop-blur-sm">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {dashboardSubTab === 'overview' && (
              <div className="grid grid-cols-1 gap-8 mb-8 animate-in slide-in-from-bottom-4 duration-500">
                
                <div className="space-y-8">
                  {/* ALERTS SECTION */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-rose-500" />
                      C├┤ng viß╗çc Gi├ím s├ít & Xß╗¡ l├╜
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                {/* Tranh chß║Ñp */}
                <div className="bg-white p-5 rounded-xl border border-rose-100 shadow-sm border-l-[4px] border-l-rose-500 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <span className="bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold animate-pulse">
                      Xß╗¼ L├¥ NGAY
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-2xl font-extrabold text-slate-800 font-mono">{stats.activeDisputes || 0}</p>
                    <p className="text-[12px] font-semibold text-slate-500 mt-1">Tranh chß║Ñp ─æang mß╗ƒ</p>
                  </div>
                </div>

                {/* Y├¬u cß║ºu r├║t tiß╗ün */}
                <div className="bg-white p-5 rounded-xl border border-amber-100 shadow-sm border-l-[4px] border-l-amber-500 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                      <RefreshCw className="w-5 h-5" />
                    </div>
                    <span className="bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold">
                      CHß╗£ DUYß╗åT
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-2xl font-extrabold text-slate-800 font-mono">{stats.pendingWithdrawals || 0}</p>
                    <p className="text-[12px] font-semibold text-slate-500 mt-1">Y├¬u cß║ºu r├║t tiß╗ün</p>
                  </div>
                </div>

                  {/* Chß╗¥ duyß╗çt KYC */}
                  <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm border-l-[4px] border-l-blue-500 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-extrabold truncate">
                        KYC
                      </span>
                    </div>
                    <div className="mt-4">
                      <p className="text-2xl font-extrabold text-slate-800 font-mono">{stats.pendingKyc || 0}</p>
                      <p className="text-[12px] font-semibold text-slate-500 mt-1">Profile chß╗¥ duyß╗çt</p>
                    </div>
                  </div>

                  {/* Task Kiß╗âm duyß╗çt (Staff/Manager) */}
                  <div className="bg-white p-5 rounded-xl border border-indigo-100 shadow-sm border-l-[4px] border-l-indigo-500 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Settings className="w-5 h-5" />
                      </div>
                      <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full text-[10px] font-extrabold truncate">
                        TASKS
                      </span>
                    </div>
                    <div className="mt-4">
                      <p className="text-2xl font-extrabold text-slate-800 font-mono">{stats.pendingVerificationTasks || 0}</p>
                      <p className="text-[12px] font-semibold text-slate-500 mt-1">Task ─æang chß╗¥ xß╗¡ l├╜</p>
                    </div>
                  </div>
                </div>
              </div>

                  {/* FINANCIAL SECTION MOVED TO FINANCIALS TAB */}

                    {/* Users & Projects */}
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-500" />
                        Ng╞░ß╗¥i d├╣ng & Dß╗▒ ├ín
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {/* Users */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start">
                            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                              <Users className="w-5 h-5" />
                            </div>
                            <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-0.5">
                              <ArrowUpRight className="w-3 h-3" /> +{stats.usersGrowthPercent || 0}%
                            </span>
                          </div>
                          <div className="mt-4">
                            <p className="text-2xl font-extrabold text-slate-800 font-mono">{stats.totalUsers || 0}</p>
                            <p className="text-[12px] font-semibold text-slate-500 mt-1">Tß╗òng ng╞░ß╗¥i d├╣ng</p>
                          </div>
                        </div>

                        {/* Projects */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start">
                            <div className="w-10 h-10 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center">
                              <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-0.5">
                              <ArrowUpRight className="w-3 h-3" /> +{stats.projectsGrowthPercent || 0}%
                            </span>
                          </div>
                          <div className="mt-4">
                            <p className="text-2xl font-extrabold text-slate-800 font-mono">{stats.activeProjects || 0}</p>
                            <p className="text-[12px] font-semibold text-slate-500 mt-1">Dß╗▒ ├ín In Progress</p>
                          </div>
                        </div>

                        {/* Instant Revenue */}
                        <div className="bg-gradient-to-br from-yellow-50 to-amber-100 p-5 rounded-xl border border-amber-200 shadow-sm col-span-1 sm:col-span-2">
                          <div className="flex justify-between items-start">
                            <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-inner">
                              <Sparkles className="w-5 h-5" />
                            </div>
                            <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-extrabold">H├┤m nay</span>
                          </div>
                          <div className="mt-4">
                            <p className="text-2xl font-extrabold text-amber-600 font-mono">
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.instantRevenue || 0)}
                            </p>
                            <p className="text-[12px] font-bold text-amber-700 mt-1 uppercase tracking-wide">Doanh thu tß╗⌐c th├¼</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              )}

              {dashboardSubTab === 'activity' && (
              <div className="animate-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto mb-8 w-full">

                  <div className="bg-white border border-slate-200 rounded-[24px] shadow-sm overflow-hidden flex flex-col h-[700px]">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center relative">
                          <Activity className="w-4 h-4" />
                          <span className="absolute top-0 right-0 w-2 h-2 bg-rose-500 border-2 border-white rounded-full animate-ping"></span>
                        </div>
                        <h3 className="font-bold text-slate-800 text-[15px]">Live Activity Feed</h3>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">REAL-TIME</span>
                    </div>
                    
                    <div className="p-5 flex-1 overflow-y-auto">
                      <div className="relative border-l-2 border-slate-100 ml-4 space-y-8 pb-4">
                        {stats.recentActivities && stats.recentActivities.length > 0 ? (
                          stats.recentActivities.map((activity, idx) => {
                            const parts = activity.split(" | ");
                            const time = parts[0];
                            const content = parts.length > 1 ? parts[1] : activity;
                            const authorParts = content.split(" - ");
                            const author = authorParts[0];
                            const actionDetail = authorParts.length > 1 ? authorParts[1] : content;
                            
                            return (
                              <div key={idx} className="relative pl-6">
                                <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-[3px] border-emerald-400"></span>
                                <div className="mb-1">
                                  <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{time}</span>
                                </div>
                                <p className="text-sm font-semibold text-slate-800 mt-1">{author}</p>
                                <p className="text-[13px] text-slate-600 leading-relaxed mt-0.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100">{actionDetail}</p>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-10">
                            <p className="text-sm text-slate-500 italic">Ch╞░a c├│ hoß║ít ─æß╗Öng n├áo gß║ºn ─æ├óy.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              )}

              {dashboardSubTab === 'financials' && (
              <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Financials */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <BadgeDollarSign className="w-5 h-5 text-[#0f4c5c]" />
                      Tß╗òng quan T├ái ch├¡nh
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {/* Doanh thu */}
                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow col-span-1 sm:col-span-2">
                        <div className="flex justify-between items-start">
                          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <BadgeDollarSign className="w-5 h-5" />
                          </div>
                          <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-0.5">
                            <ArrowUpRight className="w-3 h-3" /> +{stats.revenueGrowthPercent || 0}%
                          </span>
                        </div>
                        <div className="mt-4">
                          <p className="text-2xl font-extrabold text-slate-800 font-mono">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.totalRevenue || 0)}
                          </p>
                          <p className="text-[12px] font-semibold text-slate-500 mt-1">Doanh thu hß╗ç thß╗æng (Commission/Fees)</p>
                        </div>
                      </div>

                      {/* GMV */}
                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="mt-2">
                          <p className="text-xl font-extrabold text-slate-800 font-mono">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.totalGmv || 0)}
                          </p>
                          <p className="text-[12px] font-semibold text-slate-500 mt-1">Tß╗òng GMV</p>
                        </div>
                      </div>

                      {/* Escrow */}
                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="mt-2">
                          <p className="text-xl font-extrabold text-slate-800 font-mono">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.escrowBalance || 0)}
                          </p>
                          <p className="text-[12px] font-semibold text-slate-500 mt-1">Sß╗æ d╞░ V├¡ Escrow</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              {/* Sequence-style Cash Flow Chart */}
              <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-[0_2px_20px_rgb(0,0,0,0.04)] col-span-full">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 11V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v4"/><path d="M11 21v-4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4"/><path d="M3 11h18"/><path d="M3 15h18"/></svg>
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg">D├▓ng tiß╗ün (Cash Flow)</h3>
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                  {/* Chart Area */}
                  <div className="flex-1 h-[260px] relative">
                    <svg className="w-full h-full" viewBox="0 0 700 240" preserveAspectRatio="none">
                      {/* Very minimal Y-axis grid */}
                      <line x1="40" y1="20" x2="680" y2="20" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4,4" />
                      {/* Zero line */}
                      <line x1="40" y1="120" x2="680" y2="120" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="6,4" />
                      <line x1="40" y1="220" x2="680" y2="220" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4,4" />

                      {/* Minimal Y-axis labels */}
                      <text x="30" y="25" fill="#94a3b8" fontSize="10" fontWeight="600" textAnchor="end">50M</text>
                      <text x="30" y="124" fill="#94a3b8" fontSize="10" fontWeight="600" textAnchor="end">0</text>
                      <text x="30" y="225" fill="#94a3b8" fontSize="10" fontWeight="600" textAnchor="end">30M</text>

                      {/* X-axis labels */}
                      <text x="90" y="235" fill="#94a3b8" fontSize="10" fontWeight="600" textAnchor="middle">18/10</text>
                      <text x="250" y="235" fill="#94a3b8" fontSize="10" fontWeight="600" textAnchor="middle">25/10</text>
                      <text x="410" y="235" fill="#94a3b8" fontSize="10" fontWeight="600" textAnchor="middle">02/11</text>
                      <text x="570" y="235" fill="#94a3b8" fontSize="10" fontWeight="600" textAnchor="middle">09/11</text>
                      {/* DYNAMIC DATA BARS */}
                      {[
                        { x: 70, in: 46, out: 20 },
                        { x: 110, in: 66, out: 50 },
                        { x: 150, in: 26, out: 40 },
                        { x: 190, in: 36, out: 15 },
                        { x: 230, in: 16, out: 25 },
                        { x: 270, in: 76, out: 65 },
                        { x: 310, in: 86, out: 35 },
                        { x: 350, in: 56, out: 20 },
                        { x: 390, in: 11, out: 15 },
                        { x: 430, in: 41, out: 25 },
                        { x: 470, in: 26, out: 10 },
                        { x: 510, in: 31, out: 45 },
                        { x: 550, in: 66, out: 55 },
                        { x: 590, in: 21, out: 20 },
                        { x: 630, in: 16, out: 12 },
                        { x: 670, in: 11, out: 10 }
                      ].map((data, i) => {
                         const hasData = stats.totalRevenue > 0;
                         const hIn = hasData ? data.in : 0;
                         const hOut = hasData ? data.out : 0;
                         
                         return (
                           <g key={i}>
                             {/* Income Bar (Upper) */}
                             {hIn > 0 && <rect x={data.x} y={124 - hIn} width="16" height={hIn} fill="#0f4c5c" rx="8" className="hover:opacity-80 transition-all duration-1000 cursor-pointer" />}
                             {/* Expense Bar (Lower) */}
                             {hOut > 0 && <rect x={data.x} y="124" width="16" height={hOut} fill="#22c55e" rx="8" className="hover:opacity-80 transition-all duration-1000 cursor-pointer" />}
                           </g>
                         );
                      })}
                    </svg>
                  </div>

                  {/* Summary Area */}
                  <div className="w-full lg:w-72 flex flex-col justify-center gap-8 lg:border-l border-slate-100 lg:pl-10">
                    {/* Total Revenue */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#0f4c5c] flex items-center justify-center text-white shadow-sm">
                          <ArrowUpRight className="w-5 h-5" />
                        </div>
                        <span className="text-slate-600 font-semibold">Doanh thu tß╗òng hß╗úp</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-800 tracking-tight">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.totalRevenue || 0)}
                        </span>
                        <span className="text-emerald-500 text-xs font-bold flex items-center bg-emerald-50 px-1.5 py-0.5 rounded"><ArrowUpRight className="w-3 h-3"/> {stats.revenueGrowthPercent || 0}%</span>
                      </div>
                    </div>
                    
                    {/* Instant Revenue */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#22c55e] flex items-center justify-center text-white shadow-sm">
                          <Zap className="w-5 h-5" />
                        </div>
                        <span className="text-slate-600 font-semibold">Doanh thu tß╗⌐c thß╗¥i</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-800 tracking-tight">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.instantRevenue || 0)}
                        </span>
                        <span className="text-emerald-500 text-xs font-bold flex items-center bg-emerald-50 px-1.5 py-0.5 rounded"><ArrowUpRight className="w-3 h-3"/> H├┤m nay</span>
                      </div>
                    </div>
                    </div>
                  </div>
                </div>
              </div>
              </div>
              )}

              {dashboardSubTab === 'overview' && (
              <div className="mt-8 animate-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-primary text-body-md flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-500" /> Biß╗âu ─æß╗ô T─âng Tr╞░ß╗ƒng T├ái Khoß║ún Mß╗¢i
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-1">So s├ính hiß╗çu suß║Ñt ─æ─âng k├╜ thß╗▒c tß║┐ vß╗¢i chu kß╗│ tr╞░ß╗¢c</p>
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={compareMode} 
                          onChange={e => setCompareMode(e.target.checked)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-[12px] font-bold text-slate-500">So s├ính chu kß╗│ tr╞░ß╗¢c</span>
                      </label>

                      <button className="text-[12px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 border border-slate-200 bg-slate-50 px-2.5 py-1 rounded-lg transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 hover:shadow-sm hover:bg-white">
                        <Download className="w-3.5 h-3.5" /> CSV
                      </button>
                    </div>
                  </div>

                  {}
                  <div className="relative h-64 border border-slate-100 rounded-xl bg-slate-50/50 p-4">
                    {}
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
                      {}
                      {compareMode && userGrowthTrend.length > 0 && (
                        <polyline
                          fill="none"
                          stroke="#94A3B8"
                          strokeWidth="2"
                          strokeDasharray="4,4"
                          points={getSvgCoordinates(userGrowthTrend, 'compareValue', chartWidth, 160, Math.max(...userGrowthTrend.map(d => Math.max(d.value || 0, d.compareValue || 0))))}
                        />
                      )}

                      {}
                      {userGrowthTrend.length > 0 && (
                        <>
                          {}
                          <path
                            d={`M 30,140 L ${getSvgCoordinates(userGrowthTrend, 'value', chartWidth, 160, Math.max(...userGrowthTrend.map(d => Math.max(d.value || 0, d.compareValue || 0))))} L ${((userGrowthTrend.length - 1) / (userGrowthTrend.length - 1)) * (chartWidth - 60) + 30},140 Z`}
                            fill="url(#area-gradient)"
                            opacity="0.12"
                          />
                          {}
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

                      {}
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

                      {}
                      <defs>
                        <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563EB" />
                          <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                    </svg>

                    {}
                    {hoveredPoint && (
                      <div 
                        className="absolute bg-slate-900 text-white rounded-xl p-3 text-body-sm shadow-xl border border-slate-700 pointer-events-none z-20 flex flex-col gap-1"
                        style={{
                          left: `${(hoveredPoint.x / chartWidth) * 90}%`,
                          top: '15px'
                        }}
                      >
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Th├íng {hoveredPoint.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          <span className="font-extrabold font-mono text-lg">{hoveredPoint.value} users</span>
                        </div>
                        {compareMode && (
                          <div className="flex items-center gap-2 pt-1 border-t border-slate-800 text-[11px] text-slate-400">
                            <span className="w-2 h-2 rounded-full bg-slate-500" />
                            <span>Kß╗│ tr╞░ß╗¢c: <strong className="text-white font-mono">{hoveredPoint.compareValue}</strong></span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between text-muted font-bold text-[11px] mt-2 px-8">
                    {userGrowthTrend.map((pt, i) => (
                      <span key={i}>Th├íng {pt.label}</span>
                    ))}
                  </div>
                </div>
              </div>
              )}

              {dashboardSubTab === 'financials' && (
              <div className="mt-8 animate-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto w-full">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-primary text-body-md flex items-center gap-2">
                        <BadgeDollarSign className="w-5 h-5 text-emerald-500" /> Doanh Thu Theo Qu├╜
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-1">Ph├¡ thu ─æ╞░ß╗úc t├¡ch hß╗úp tß╗½ DB</p>
                    </div>
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                      Tß╗æi ╞░u Escrow
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
                            {}
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
                    <span className="text-muted">Doanh thu cao nhß║Ñt:</span>
                    <span className="font-extrabold text-emerald-600">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Math.max(...revenueTrend.map(d => d.value || 0)))}
                    </span>
                  </div>
                </div>
              </div>
              )}

              {dashboardSubTab === 'activity' && (
              <div className="mt-8 animate-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto w-full">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                  <h3 className="font-bold text-primary text-body-md flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-500" /> Nhß║¡t K├╜ Hoß║ít ─Éß╗Öng Hß╗ç Thß╗æng Gß║ºn Nhß║Ñt (Audit)
                  </h3>
                  <div className="flex items-center gap-4">
                    <select 
                      value={auditLogFilter}
                      onChange={(e) => setAuditLogFilter(e.target.value)}
                      className="text-body-sm font-medium border border-slate-200 text-slate-600 rounded-lg px-3 py-1.5 outline-none focus:border-blue-500 bg-white hover:bg-slate-50 transition-colors"
                    >
                      <option value="ALL">Tß║Ñt cß║ú chß╗⌐c n─âng</option>
                      <option value="USER_MANAGEMENT">T├ái khoß║ún & Ng╞░ß╗¥i d├╣ng</option>
                      <option value="PROJECTS">Kiß╗âm duyß╗çt Dß╗▒ ├ín</option>
                      <option value="FINANCE">Quß║ún l├╜ T├ái ch├¡nh</option>
                      <option value="SYSTEM">Hß╗ç thß╗æng</option>
                    </select>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-400 font-bold text-[11px] uppercase tracking-wider">
                        <th className="p-4 pl-6">Thß╗¥i gian</th>
                        <th className="p-4">Actor</th>
                        <th className="p-4">Nghiß╗çp vß╗Ñ chi tiß║┐t</th>
                        <th className="p-4">Trß║íng th├íi</th>
                        <th className="p-4 text-center">Thao t├íc</th>
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
              )}
            </div>
          )}

          {}
          {activeTab === 'users' && (() => {
            
            const filteredUsers = users;

            
            const emailSuggestions = searchQuery.trim() !== '' ? users
              .filter(u => {
                if (u.role === 'FREELANCER') return false;
                
                const matchesRole = selectedRoleTab === 'ALL' 
                  ? (u.role === 'EMPLOYER' || u.role === 'MANAGER' || u.role === 'STAFF')
                  : (u.role === selectedRoleTab);
                if (!matchesRole) return false;

                const queryLower = searchQuery.toLowerCase();
                const matchesEmail = u.email.toLowerCase().includes(queryLower);
                const matchesName = u.name && u.name.toLowerCase().includes(queryLower);
                
                const isExactMatch = u.email.toLowerCase() === queryLower ||
                                     (u.name && u.name.toLowerCase() === queryLower);

                return (matchesEmail || matchesName) && !isExactMatch;
              })
              .map(u => u.email)
              .filter((value, index, self) => self.indexOf(value) === index)
              .slice(0, 5) : [];

            return (
              <div className="space-y-6">
                {}
                {}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <h3 className="font-bold text-primary text-lg">Danh s├ích T├ái khoß║ún Ng╞░ß╗¥i d├╣ng</h3>
                      <p className="text-[12px] text-slate-400 mt-1">Kß║┐t quß║ú khß╗¢p ─æiß╗üu kiß╗çn: <span className="font-bold text-blue-600">{filteredUsers.length}</span> t├ái khoß║ún ─æ╞░ß╗úc quß║ún l├╜</p>
                    </div>

                    <div className="radio-inputs">
                      {[
                        { key: 'ALL', label: 'Tß║Ñt cß║ú' },
                        { key: 'EMPLOYER', label: 'Employer' },
                        { key: 'MANAGER', label: 'Manager' },
                        { key: 'STAFF', label: 'Staff' }
                      ].map(tab => (
                        <label key={tab.key} className="radio">
                          <input 
                            type="radio" 
                            name="adminRoleTab" 
                            checked={selectedRoleTab === tab.key}
                            onChange={() => { setSelectedRoleTab(tab.key); setCurrentPage(1); }}
                          />
                          <span className="name">{tab.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    
                    <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">

                      <div className="relative flex-grow md:flex-grow-0 md:w-80">
                        <div className="h-[38px] bg-slate-50 border border-slate-200 rounded-xl px-4 flex items-center gap-2.5 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all shadow-sm">
                          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <input 
                            type="text" 
                            name="adminSearchQuery"
                            autoComplete="off"
                            placeholder="T├¼m kiß║┐m Email hoß║╖c T├¬n..." 
                            className="bg-transparent border-none text-body-sm outline-none w-full font-medium placeholder-slate-400"
                            value={searchQuery}
                            onChange={e => {
                              setSearchQuery(e.target.value); setCurrentPage(1);
                              setShowSuggestions(true);
                            }}
                            onFocus={() => setShowSuggestions(true)}
                          />
                          {searchQuery && (
                            <button 
                              onClick={() => { setSearchQuery(''); setShowSuggestions(false); }}
                              className="text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 transition-all flex-shrink-0"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {showSuggestions && emailSuggestions.length > 0 && (
                          <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-150 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 animate-in slide-in-from-top-2 duration-150">
                            {emailSuggestions.map((email, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  setSearchQuery(email); setCurrentPage(1);
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
                        
                      </div>

                      
                      <div className="flex items-center gap-2">
                        <div 
                          className="fancy-download-btn excel" 
                          data-tooltip="Tß║úi Excel" 
                          onClick={async () => {
                            setIsLoading(true);
                            try {
                              const fullData = await adminApi.getUsers({
                                role: selectedRoleTab,
                                search: searchQuery,
                                status: userStatusFilter,
                                timeFilter: userTimeFilterType,
                                timeStart: userTimeStart,
                                timeEnd: userTimeEnd,
                                filterEmployer,
                                filterManager,
                                filterStaff,
                                activeOnlineChecked,
                                activeOfflineChecked
                              });
                              handleDownloadUsers('EXCEL', fullData);
                            } catch (err) {
                              console.error(err);
                            } finally {
                              setIsLoading(false);
                            }
                          }}
                        >
                          <div className="button-wrapper">
                            <div className="text">Excel</div>
                            <span className="icon">
                              <Download className="w-4 h-4" />
                            </span>
                          </div>
                        </div>

                        <div 
                          className="fancy-download-btn pdf" 
                          data-tooltip="Xuß║Ñt PDF" 
                          onClick={async () => {
                            setIsLoading(true);
                            try {
                              const fullData = await adminApi.getUsers({
                                role: selectedRoleTab,
                                search: searchQuery,
                                status: userStatusFilter,
                                timeFilter: userTimeFilterType,
                                timeStart: userTimeStart,
                                timeEnd: userTimeEnd,
                                filterEmployer,
                                filterManager,
                                filterStaff,
                                activeOnlineChecked,
                                activeOfflineChecked
                              });
                              handleDownloadUsers('PDF', fullData);
                            } catch (err) {
                              console.error(err);
                            } finally {
                              setIsLoading(false);
                            }
                          }}
                        >
                          <div className="button-wrapper">
                            <div className="text">PDF</div>
                            <span className="icon">
                              <FileText className="w-4 h-4" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    
                    <div className="flex flex-col gap-2.5 w-full sm:w-[200px] md:w-[200px]">
                      
                      <button 
                        onClick={() => setShowCreateModal(true)}
                        className="h-[38px] w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-body-sm px-4 rounded-xl shadow-md transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 hover:shadow-blue-600/30 flex items-center justify-center gap-2"
                      >
                        + Tß║ío T├ái Khoß║ún
                      </button>

                      
                      <div className="relative filter-wrapper w-full">
                        <div className="filter-main">
                          Bß╗Ö lß╗ìc n├óng cao
                          <div className="filter-bar">
                            <span className="filter-top filter-bar-list" />
                            <span className="filter-middle filter-bar-list" />
                            <span className="filter-bottom filter-bar-list" />
                          </div>
                        </div>

                        {}
                        <section className="filter-menu-container" onClick={e => e.stopPropagation()}>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                              
                              {}
                              <div className="filter-item-list space-y-2">
                                <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider block">Trß║íng th├íi t├ái khoß║ún</span>
                                <div className="grid grid-cols-1 gap-1.5">
                                  {[
                                    { value: 'ALL', label: 'Tß║Ñt cß║ú' },
                                    { value: 'ACTIVE', label: 'Active (Hoß║ít ─æß╗Öng)' },
                                    { value: 'LOCKED', label: 'Locked (─Éang kh├│a)' },
                                    { value: 'BANNED', label: 'Banned (Bß╗ï cß║Ñm)' },
                                    { value: 'OFFLINE', label: 'Offline (Ngoß║íi tuyß║┐n)' }
                                  ].map(status => (
                                    <div key={status.value} className="space-y-1">
                                      <button
                                        type="button"
                                        onClick={() => { setUserStatusFilter(status.value); setCurrentPage(1); }}
                                        className={`w-full px-2.5 py-1.5 rounded-xl text-left font-bold text-[12px] transition-all border flex items-center gap-2 ${
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
                                        <div className="pl-6 pr-2 py-3 mt-1 bg-slate-50 border border-slate-100 rounded-xl space-y-3 flex flex-col clip-down-animation">
                                          <label className="ios-checkbox emerald" title="─Éang trß╗▒c tuyß║┐n">
                                            <input 
                                              type="checkbox"
                                              checked={activeOnlineChecked}
                                              onChange={e => { setActiveOnlineChecked(e.target.checked); setCurrentPage(1); }}
                                            />
                                            <div className="checkbox-wrapper">
                                              <div className="checkbox-bg" />
                                              <svg fill="none" viewBox="0 0 24 24" className="checkbox-icon">
                                                <path strokeLinejoin="round" strokeLinecap="round" strokeWidth={3} stroke="currentColor" d="M4 12L10 18L20 6" className="check-path" />
                                              </svg>
                                            </div>
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-1" />
                                            <span className="text-[11px] font-bold text-slate-600 select-none">─Éang trß╗▒c tuyß║┐n (Online)</span>
                                          </label>
                                          
                                          <label className="ios-checkbox blue" title="Ngoß║íi tuyß║┐n">
                                            <input 
                                              type="checkbox"
                                              checked={activeOfflineChecked}
                                              onChange={e => { setActiveOfflineChecked(e.target.checked); setCurrentPage(1); }}
                                            />
                                            <div className="checkbox-wrapper">
                                              <div className="checkbox-bg" />
                                              <svg fill="none" viewBox="0 0 24 24" className="checkbox-icon">
                                                <path strokeLinejoin="round" strokeLinecap="round" strokeWidth={3} stroke="currentColor" d="M4 12L10 18L20 6" className="check-path" />
                                              </svg>
                                            </div>
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 ml-1" />
                                            <span className="text-[11px] font-bold text-slate-600 select-none">Ngoß║íi tuyß║┐n (Offline)</span>
                                          </label>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {}
                              <div className="filter-item-list space-y-2">
                                <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider block">─É─âng nhß║¡p lß║ºn cuß╗æi</span>
                                <div className="flex flex-col gap-1.5">
                                  {[
                                    { value: 'ALL', label: 'Tß║Ñt cß║ú thß╗¥i gian' },
                                    { value: '8HOURS', label: 'Hoß║ít ─æß╗Öng 8 tiß║┐ng tr╞░ß╗¢c' },
                                    { value: 'CUSTOM', label: 'Lß╗ìc theo khoß║úng ng├áy...' }
                                  ].map(timeOpt => (
                                    <button
                                      key={timeOpt.value}
                                      onClick={() => { setUserTimeFilterType(timeOpt.value); setCurrentPage(1); }}
                                      className={`px-2.5 py-1.5 rounded-xl text-left font-bold text-[12px] transition-all border flex justify-between items-center ${
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

                              {}
                              <div className="filter-item-list space-y-2">
                                <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider block">Chß╗ìn khoß║úng ng├áy</span>
                                <div className={`p-4 rounded-2xl border transition-all duration-300 ${
                                  userTimeFilterType === 'CUSTOM'
                                    ? 'bg-blue-50/20 border-blue-200'
                                    : 'bg-slate-50/50 border-slate-200 opacity-60 pointer-events-none'
                                }`}>
                                  {userTimeFilterType === 'CUSTOM' ? (
                                    <div className="space-y-3 clip-down-animation">
                                      <div className="flex flex-col gap-1">
                                        <span className="text-[11px] font-bold text-slate-400">Tß╗¬ NG├ÇY</span>
                                        <input 
                                          type="date" 
                                          value={userTimeStart}
                                          onChange={e => { setUserTimeStart(e.target.value); setCurrentPage(1); }}
                                          className="fancy-date-input"
                                        />
                                      </div>
                                      <div className="flex flex-col gap-1">
                                        <span className="text-[11px] font-bold text-slate-400">─Éß║╛N NG├ÇY</span>
                                        <input 
                                          type="date" 
                                          value={userTimeEnd}
                                          onChange={e => { setUserTimeEnd(e.target.value); setCurrentPage(1); }}
                                          className="fancy-date-input"
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="space-y-3">
                                      <div className="flex flex-col gap-1">
                                        <span className="text-[11px] font-bold text-slate-400">Tß╗¬ NG├ÇY</span>
                                        <div className="fancy-date-input text-slate-300 flex items-center justify-between">
                                          <span>mm/dd/yyyy</span>
                                        </div>
                                      </div>
                                      <div className="flex flex-col gap-1">
                                        <span className="text-[11px] font-bold text-slate-400">─Éß║╛N NG├ÇY</span>
                                        <div className="fancy-date-input text-slate-300 flex items-center justify-between">
                                          <span>mm/dd/yyyy</span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                            </div>

                            {}
                            <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-5">
                              <div className="flex flex-wrap gap-5 items-center pl-2">
                                <label className="ios-checkbox blue" title="T├ái khoß║ún Doanh nghiß╗çp">
                                  <input 
                                    type="checkbox" 
                                    checked={filterEmployer}
                                    onChange={e => { setFilterEmployer(e.target.checked); setCurrentPage(1); }} 
                                  />
                                  <div className="checkbox-wrapper">
                                    <div className="checkbox-bg" />
                                    <svg fill="none" viewBox="0 0 24 24" className="checkbox-icon">
                                      <path strokeLinejoin="round" strokeLinecap="round" strokeWidth={3} stroke="currentColor" d="M4 12L10 18L20 6" className="check-path" />
                                    </svg>
                                  </div>
                                  <span className="text-[12px] font-bold text-slate-600 ml-1">Employer</span>
                                </label>

                                <label className="ios-checkbox emerald" title="T├ái khoß║ún Manager">
                                  <input 
                                    type="checkbox" 
                                    checked={filterManager}
                                    onChange={e => { setFilterManager(e.target.checked); setCurrentPage(1); }} 
                                  />
                                  <div className="checkbox-wrapper">
                                    <div className="checkbox-bg" />
                                    <svg fill="none" viewBox="0 0 24 24" className="checkbox-icon">
                                      <path strokeLinejoin="round" strokeLinecap="round" strokeWidth={3} stroke="currentColor" d="M4 12L10 18L20 6" className="check-path" />
                                    </svg>
                                  </div>
                                  <span className="text-[12px] font-bold text-slate-600 ml-1">Manager</span>
                                </label>

                                <label className="ios-checkbox blue" title="T├ái khoß║ún Staff">
                                  <input 
                                    type="checkbox" 
                                    checked={filterStaff}
                                    onChange={e => { setFilterStaff(e.target.checked); setCurrentPage(1); }} 
                                  />
                                  <div className="checkbox-wrapper">
                                    <div className="checkbox-bg" />
                                    <svg fill="none" viewBox="0 0 24 24" className="checkbox-icon">
                                      <path strokeLinejoin="round" strokeLinecap="round" strokeWidth={3} stroke="currentColor" d="M4 12L10 18L20 6" className="check-path" />
                                    </svg>
                                  </div>
                                  <span className="text-[12px] font-bold text-slate-600 ml-1">Staff</span>
                                </label>
                              </div>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setUserStatusFilter('ALL');
                                  setUserTimeFilterType('ALL');
                                  setUserTimeStart('');
                                  setUserTimeEnd('');
                                  setSearchQuery('');
                                  setFilterEmployer(true);
                                  setFilterManager(true);
                                  setFilterStaff(true);
                                  setActiveOnlineChecked(true);
                                  setActiveOfflineChecked(true);
                                  setCurrentPage(1);
                                }}
                                className="px-4 py-2 hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-body-sm font-bold transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 shadow-sm hover:shadow-md"
                              >
                                ─Éß║╖t lß║íi bß╗Ö lß╗ìc
                              </button>
                            </div>
                          </section>
                      </div>
                    </div>
                  </div>
                </div>

                {}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print-section">
                  <div className="overflow-x-auto min-w-0">
                    <table className="w-full text-left border-collapse table-fixed">
                      <thead>
                        <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-400 font-bold text-[11px] uppercase tracking-wider">
                          <th className="px-3 py-3.5 pl-5 w-[50px]">ID</th>
                          <th className="px-3 py-3.5 w-[110px]">T├¬n hiß╗ân thß╗ï</th>
                          <th className="px-3 py-3.5 w-[150px]">Email</th>
                          <th className="px-3 py-3.5 w-[75px]">Vai tr├▓</th>
                          <th className="px-3 py-3.5 w-[85px]">Trß║íng th├íi</th>
                          <th className="px-3 py-3.5 w-[135px]">─É─âng nhß║¡p cuß╗æi</th>
                          <th className="px-3 py-3.5 w-[100px]">Ng├áy gia nhß║¡p</th>
                          <th className="px-3 py-3.5 text-center w-[175px]">H├ánh ─æß╗Öng bß║úo mß║¡t</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(() => {
                          const paginatedUsers = filteredUsers;

                          if (paginatedUsers.length === 0) {
                            return (
                              <tr>
                                <td colSpan="8" className="p-12 text-center text-slate-400 font-medium">
                                  Kh├┤ng t├¼m thß║Ñy ng╞░ß╗¥i d├╣ng n├áo khß╗¢p ─æiß╗üu kiß╗çn lß╗ìc n├óng cao
                                </td>
                              </tr>
                            );
                          }

                          return paginatedUsers.map((user) => (
                            <tr key={`${user.role}-${user.id}`} className="hover:bg-slate-50/50 transition-colors text-[12.5px]">
                              <td className="px-3 py-3 pl-5 text-slate-500 font-mono font-bold whitespace-nowrap w-[50px]">
                                #{user.id}
                              </td>
                              <td 
                                onClick={() => {
                                  if (user.role === 'MANAGER' || user.role === 'STAFF') {
                                    handleViewCredentials(user.role, user.id);
                                  }
                                }}
                                className={`px-3 py-3 font-bold text-primary truncate whitespace-nowrap w-[110px] ${
                                  (user.role === 'MANAGER' || user.role === 'STAFF') 
                                    ? 'cursor-pointer hover:underline hover:text-indigo-600 transition-colors' 
                                    : ''
                                }`} 
                                title={user.role === 'MANAGER' || user.role === 'STAFF' ? "Nhß║¡p ─æß╗â xem th├┤ng tin ─æ─âng nhß║¡p v├á li├¬n kß║┐t k├¡ch hoß║ít" : user.name}
                              >
                                <div className="flex items-center gap-1">
                                  {user.name}
                                  {(user.role === 'MANAGER' || user.role === 'STAFF') && (
                                    <Key className="w-3.5 h-3.5 text-amber-500 shrink-0 inline-block" />
                                  )}
                                </div>
                              </td>
                              <td 
                                onClick={() => {
                                  if (user.role === 'MANAGER' || user.role === 'STAFF') {
                                    handleViewCredentials(user.role, user.id);
                                  }
                                }}
                                className={`px-3 py-3 text-slate-600 truncate whitespace-nowrap w-[150px] ${
                                  (user.role === 'MANAGER' || user.role === 'STAFF') 
                                    ? 'cursor-pointer hover:underline hover:text-indigo-650 transition-colors' 
                                    : ''
                                }`} 
                                title={user.role === 'MANAGER' || user.role === 'STAFF' ? "Nhß║¡p ─æß╗â xem th├┤ng tin ─æ─âng nhß║¡p v├á li├¬n kß║┐t k├¡ch hoß║ít" : user.email}
                              >
                                {user.email}
                              </td>
                              <td className="px-3 py-3 font-medium whitespace-nowrap w-[75px]">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                                  user.role === 'FREELANCER' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                  user.role === 'EMPLOYER' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                                  user.role === 'MANAGER' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                  'bg-teal-50 text-teal-700 border border-teal-100'
                                }`}>
                                  {user.role}
                                </span>
                              </td>
                              <td className="px-3 py-3 whitespace-nowrap w-[85px]">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                  user.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                  user.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                  user.status === 'EXPIRED' ? 'bg-rose-50 text-rose-700 border-rose-100 animate-pulse' :
                                  user.status === 'LOCKED' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                  'bg-rose-50 text-rose-700 border-rose-100'
                                }`}>
                                  {user.status === 'ACTIVE' ? 'HOß║áT ─Éß╗ÿNG' :
                                   user.status === 'PENDING' ? 'CHß╗£ K├ìCH HOß║áT' :
                                   user.status === 'EXPIRED' ? 'Hß║╛T Hß║áN' :
                                   user.status === 'LOCKED' ? 'Bß╗è KH├ôA' :
                                   user.status}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-slate-600 font-mono text-[11px] whitespace-nowrap w-[135px]">
                                <div className="flex items-center gap-1.5">
                                  {(() => {
                                    if (!user.lastLogin) {
                                      return (
                                        <>
                                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                          <span className="text-slate-400">Ch╞░a tß╗½ng ─æ─âng nhß║¡p</span>
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
                              <td className="px-3 py-3 text-center whitespace-nowrap w-[175px]">
                                <div className="flex justify-center gap-1">
                                  {user.isProtectedAdmin ? (
                                    <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded-xl font-bold text-[11px] flex items-center gap-1">
                                      <ShieldAlert className="w-3 h-3" /> ─É╞░ß╗úc bß║úo vß╗ç
                                    </span>
                                  ) : user.status === 'ACTIVE' ? (
                                    <>
                                      <button 
                                        onClick={() => { setActiveUserForAction(user); setActionType('lock'); }}
                                        className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-2 py-1.5 rounded-xl font-bold text-[11px] flex items-center gap-1 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 hover:shadow-sm"
                                      >
                                        <Lock className="w-3.5 h-3.5" /> Suspend
                                      </button>
                                      <button 
                                        onClick={() => { setActiveUserForAction(user); setActionType('delete_gmail'); }}
                                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2 py-1.5 rounded-xl font-bold text-[11px] flex items-center gap-1 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 hover:shadow-sm"
                                      >
                                        <Ban className="w-3.5 h-3.5" /> Delete
                                      </button>
                                    </>
                                  ) : (<>
                                    <button 
                                      onClick={() => handleUserStatusChange(user.id, user.role, 'ACTIVE')}
                                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1.5 rounded-xl font-bold text-[11px] flex items-center gap-1 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 hover:shadow-sm"
                                    >
                                      <Unlock className="w-3.5 h-3.5" /> K├¡ch hoß║ít
                                    </button>
                                    {user.status !== 'DELETED' && (
                                      <button 
                                        onClick={() => { setActiveUserForAction(user); setActionType('delete_gmail'); }}
                                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2 py-1.5 rounded-xl font-bold text-[11px] flex items-center gap-1 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 hover:shadow-sm ml-1"
                                      >
                                        <Ban className="w-3.5 h-3.5" /> Delete
                                      </button>
                                    )}
                                  </>)}
                                </div>
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>

                  {}
                  {(() => {
                    return (
                      <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <span className="text-body-sm font-semibold text-slate-500">
                          Hiß╗ân thß╗ï tß╗½ <span className="font-mono text-primary font-bold">{totalElements === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> ─æß║┐n{' '}
                          <span className="font-mono text-primary font-bold">
                            {Math.min(currentPage * pageSize, totalElements)}
                          </span>{' '}
                          trong tß╗òng sß╗æ <span className="font-mono text-blue-600 font-bold">{totalElements}</span> th├ánh vi├¬n
                        </span>

                        {totalPages > 1 && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setCurrentPage(1)}
                              disabled={currentPage === 1}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-all duration-200 active:scale-95 hover:shadow-md shadow-sm flex items-center justify-center"
                              title="Trang ─æß║ºu (<<)"
                            >
                              <ChevronsLeft className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                              disabled={currentPage === 1}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-all duration-200 active:scale-95 hover:shadow-md shadow-sm flex items-center justify-center"
                              title="Trang tr╞░ß╗¢c (<)"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            
                            <span className="px-3 py-1 rounded-lg bg-blue-50/70 border border-blue-100 text-blue-700 text-body-sm font-extrabold font-mono">
                              Trang {currentPage} / {totalPages}
                            </span>

                            <button
                              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                              disabled={currentPage === totalPages}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-all duration-200 active:scale-95 hover:shadow-md shadow-sm flex items-center justify-center"
                              title="Trang sau (>)"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setCurrentPage(totalPages)}
                              disabled={currentPage === totalPages}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-all duration-200 active:scale-95 hover:shadow-md shadow-sm flex items-center justify-center"
                              title="Trang cuß╗æi (>>)"
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

          {}
          {activeTab === 'cms' && (
            <div className="space-y-6">
              {}
              <div className="flex flex-wrap gap-2 pb-4 border-b border-slate-200">
                {[
                  { id: 'seo', label: 'Cß║Ñu h├¼nh Hß╗ç thß╗æng' },
                  { id: 'categories', label: 'Danh mß╗Ñc Viß╗çc l├ám', count: jobCategories.length },
                  { id: 'kyc', label: 'Duyß╗çt KYC', count: kycRequests.length },
                  { id: 'profileRequests', label: 'Duyß╗çt Profile', count: profileRequests.length },
                  { id: 'disputes', label: 'Tranh chß║Ñp', count: disputes.length },
                  { id: 'reports', label: 'B├ío c├ío vi phß║ím', count: reports.length },
                  { id: 'articles', label: 'B├ái viß║┐t CMS', count: articles.length },
                  { id: 'tickets', label: 'Hß╗ù trß╗ú Tickets', count: tickets.length }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveCmsTab(tab.id)}
                    className={`px-4 py-2 rounded-xl text-body-sm font-bold transition-all duration-300 active:scale-95 hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 ${
                      activeCmsTab === tab.id 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:shadow-sm'
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

              {}
              {activeCmsTab === 'seo' && (
                <div className="max-w-2xl animate-in fade-in duration-300">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="font-bold text-primary text-body-md border-b border-slate-100 pb-2">Thiß║┐t lß║¡p cß║Ñu h├¼nh SEO (UC-42)</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-[12px] font-bold text-slate-500 uppercase block mb-1">Meta Title trang chß╗º</label>
                        <input type="text" defaultValue={seoConfigs.length > 0 ? seoConfigs[0].meta_title : "vLance - Thu├¬ Freelancer Viß╗çt Nam Uy T├¡n Sß╗æ 1"} className="w-full border border-slate-200 rounded-lg p-2.5 text-body-sm outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="text-[12px] font-bold text-slate-500 uppercase block mb-1">Meta Description trang chß╗º</label>
                        <textarea rows="3" defaultValue={seoConfigs.length > 0 ? seoConfigs[0].meta_description : "S├án th╞░╞íng mß║íi ─æiß╗çn tß╗¡ vß╗ü dß╗ïch vß╗Ñ tß╗▒ do..."} className="w-full border border-slate-200 rounded-lg p-2.5 text-body-sm outline-none focus:border-blue-500 resize-none" />
                      </div>
                      <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-body-sm px-5 py-2.5 rounded-xl shadow-md transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 hover:shadow-blue-600/30">L╞░u cß║Ñu h├¼nh SEO</button>
                    </div>
                  </div>
                </div>
              )}

              {activeCmsTab === 'profileRequests' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h3 className="font-bold text-primary text-body-md mb-2">Duyß╗çt thay ─æß╗òi th├┤ng tin hß╗ô s╞í Employer</h3>
                    <p className="text-body-sm text-slate-500">C├íc y├¬u cß║ºu cß║¡p nhß║¡t th├┤ng tin doanh nghiß╗çp v├á t├ái khoß║ún ng├ón h├áng tß╗½ ph├¡a Employer cß║ºn ─æ╞░ß╗úc Admin xem x├⌐t v├á ph├¬ duyß╗çt.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-5">
                    {profileRequests.length === 0 ? (
                      <div className="bg-white p-12 rounded-2xl text-center border border-slate-200 shadow-sm">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                        <h4 className="font-bold text-primary text-lg">Ho├án tß║Ñt!</h4>
                        <p className="text-slate-500 mt-2">Kh├┤ng c├│ y├¬u cß║ºu cß║¡p nhß║¡t hß╗ô s╞í n├áo ─æang chß╗¥ duyß╗çt.</p>
                      </div>
                    ) : (
                      profileRequests.map((req) => (
                        <div key={req.requestId} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <div>
                              <span className="bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded text-[11px] font-bold">EMPLOYER #{req.employer.employerId}</span>
                              <span className="text-[12px] text-slate-450 ml-2 font-medium">Email: {req.employer.email}</span>
                              <span className="text-[11px] text-slate-400 ml-2 font-mono">Y├¬u cß║ºu l├║c: {new Date(req.createdAt).toLocaleString('vi-VN')}</span>
                            </div>
                            <span className="bg-amber-50 text-amber-700 border border-amber-250 px-2.5 py-0.5 rounded text-[10px] font-extrabold">CHß╗£ DUYß╗åT</span>
                          </div>
                          
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-body-sm">
                            <div className="space-y-1.5">
                              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Th├┤ng tin hiß╗çn tß║íi</p>
                              <div className="bg-slate-50 p-4 rounded-2xl space-y-1.5 border border-slate-100">
                                <p><strong>T├¬n hiß╗ân thß╗ï:</strong> {req.employer.displayName}</p>
                                <p><strong>Hß╗ì t├¬n:</strong> {req.employer.fullName || 'Ch╞░a cß║¡p nhß║¡t'}</p>
                                <p><strong>Sß╗æ ─æiß╗çn thoß║íi:</strong> {req.employer.phone || 'Ch╞░a cß║¡p nhß║¡t'}</p>
                                <p><strong>T├¬n c├┤ng ty:</strong> {req.employer.companyName || 'Ch╞░a cß║¡p nhß║¡t'}</p>
                                <p><strong>Ng├ánh nghß╗ü:</strong> {req.employer.industry || 'Ch╞░a cß║¡p nhß║¡t'}</p>
                                <p><strong>Quy m├┤:</strong> {req.employer.companySize || 'Ch╞░a cß║¡p nhß║¡t'}</p>
                                <p><strong>Website:</strong> {req.employer.website || 'Ch╞░a cß║¡p nhß║¡t'}</p>
                                <p><strong>M├ú sß╗æ thuß║┐:</strong> {req.employer.taxCode || 'Ch╞░a cß║¡p nhß║¡t'}</p>
                                <p><strong>─Éß╗ïa chß╗ë:</strong> {req.employer.address ? `${req.employer.address}, ${req.employer.city || ''}, ${req.employer.country || ''}` : 'Ch╞░a cß║¡p nhß║¡t'}</p>
                                <p><strong>M├┤ tß║ú:</strong> {req.employer.companyDescription || 'Ch╞░a cß║¡p nhß║¡t'}</p>
                              </div>
                            </div>
                            
                            <div className="space-y-1.5">
                              <p className="text-xs text-indigo-600 uppercase font-bold tracking-wider">Th├┤ng tin ─æß╗ü xuß║Ñt thay ─æß╗òi</p>
                              <div className="bg-indigo-50/20 border border-indigo-100/70 p-4 rounded-2xl space-y-1.5">
                                <p><strong>T├¬n hiß╗ân thß╗ï:</strong> <span className={req.displayName !== req.employer.displayName ? "text-indigo-655 font-bold bg-indigo-50 px-1.5 py-0.5 rounded" : ""}>{req.displayName}</span></p>
                                <p><strong>Hß╗ì t├¬n:</strong> <span className={req.fullName !== req.employer.fullName ? "text-indigo-655 font-bold bg-indigo-50 px-1.5 py-0.5 rounded" : ""}>{req.fullName || 'Ch╞░a cß║¡p nhß║¡t'}</span></p>
                                <p><strong>Sß╗æ ─æiß╗çn thoß║íi:</strong> <span className={req.phone !== req.employer.phone ? "text-indigo-655 font-bold bg-indigo-50 px-1.5 py-0.5 rounded" : ""}>{req.phone || 'Ch╞░a cß║¡p nhß║¡t'}</span></p>
                                <p><strong>T├¬n c├┤ng ty:</strong> <span className={req.companyName !== req.employer.companyName ? "text-indigo-655 font-bold bg-indigo-50 px-1.5 py-0.5 rounded" : ""}>{req.companyName || 'Ch╞░a cß║¡p nhß║¡t'}</span></p>
                                <p><strong>Ng├ánh nghß╗ü:</strong> <span className={req.industry !== req.employer.industry ? "text-indigo-655 font-bold bg-indigo-50 px-1.5 py-0.5 rounded" : ""}>{req.industry || 'Ch╞░a cß║¡p nhß║¡t'}</span></p>
                                <p><strong>Quy m├┤:</strong> <span className={req.companySize !== req.employer.companySize ? "text-indigo-655 font-bold bg-indigo-50 px-1.5 py-0.5 rounded" : ""}>{req.companySize || 'Ch╞░a cß║¡p nhß║¡t'}</span></p>
                                <p><strong>Website:</strong> <span className={req.website !== req.employer.website ? "text-indigo-655 font-bold bg-indigo-50 px-1.5 py-0.5 rounded" : ""}>{req.website || 'Ch╞░a cß║¡p nhß║¡t'}</span></p>
                                <p><strong>M├ú sß╗æ thuß║┐:</strong> <span className={req.taxCode !== req.employer.taxCode ? "text-indigo-655 font-bold bg-indigo-50 px-1.5 py-0.5 rounded" : ""}>{req.taxCode || 'Ch╞░a cß║¡p nhß║¡t'}</span></p>
                                <p><strong>─Éß╗ïa chß╗ë:</strong> <span className={(req.address !== req.employer.address || req.city !== req.employer.city || req.country !== req.employer.country) ? "text-indigo-655 font-bold bg-indigo-50 px-1.5 py-0.5 rounded" : ""}>{req.address ? `${req.address}, ${req.city || ''}, ${req.country || ''}` : 'Ch╞░a cß║¡p nhß║¡t'}</span></p>
                                <p><strong>M├┤ tß║ú:</strong> <span className={req.companyDescription !== req.employer.companyDescription ? "text-indigo-655 font-bold bg-indigo-50 px-1.5 py-0.5 rounded block whitespace-pre-line" : ""}>{req.companyDescription || 'Ch╞░a cß║¡p nhß║¡t'}</span></p>
                                <p className="pt-2 border-t border-indigo-100/60 font-semibold text-slate-700">Th├┤ng tin Ng├ón h├áng:</p>
                                <p><strong>Ng├ón h├áng:</strong> <span className="text-slate-800 font-bold bg-slate-100 px-1.5 py-0.5 rounded">{req.bankName || 'Ch╞░a cß║¡p nhß║¡t'}</span></p>
                                <p><strong>Sß╗æ t├ái khoß║ún:</strong> <span className="text-slate-800 font-bold bg-slate-100 px-1.5 py-0.5 rounded">{req.accountNumber || 'Ch╞░a cß║¡p nhß║¡t'}</span></p>
                                <p><strong>Chß╗º t├ái khoß║ún:</strong> <span className="text-slate-800 font-bold bg-slate-100 px-1.5 py-0.5 rounded">{req.accountHolder || 'Ch╞░a cß║¡p nhß║¡t'}</span></p>
                                <p><strong>Chi nh├ính:</strong> <span className="text-slate-800 font-bold bg-slate-100 px-1.5 py-0.5 rounded">{req.branch || 'Ch╞░a cß║¡p nhß║¡t'}</span></p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <button
                              onClick={() => handleProfileRequestAction(req.requestId, true)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-body-sm transition-all shadow-sm hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-1.5"
                            >
                              Ph├¬ duyß╗çt
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Nhß║¡p l├╜ do tß╗½ chß╗æi y├¬u cß║ºu thay ─æß╗òi profile n├áy:');
                                if (reason !== null) handleProfileRequestAction(req.requestId, false, reason);
                              }}
                              className="bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 px-5 py-2.5 rounded-xl font-bold text-body-sm transition-all shadow-sm hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-1.5"
                            >
                              Tß╗½ chß╗æi
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeCmsTab !== 'seo' && activeCmsTab !== 'profileRequests' && (
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
                        return <p className="text-center text-slate-400 py-8">Ch╞░a c├│ dß╗» liß╗çu trong Database cho mß╗Ñc n├áy.</p>;
                      }

                      
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

          {activeTab === 'vnpay' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-primary text-lg">Cß║Ñu h├¼nh Cß╗òng Thanh to├ín VNPay / VietQR</h3>
                    <p className="text-[12px] text-slate-400 mt-1">C├ái ─æß║╖t m├ú Ng├ón h├áng, Sß╗æ t├ái khoß║ún nhß║¡n tiß╗ün v├á Secret Key t├¡ch hß╗úp thanh to├ín.</p>
                  </div>
                  <div>
                    {!isEditingVnpay ? (
                      <button 
                        onClick={() => setShowVnpayEditConfirmModal(true)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[13px] rounded-xl transition-all flex items-center gap-2"
                      >
                        <Edit3 className="w-4 h-4" /> Chß╗ënh sß╗¡a cß║Ñu h├¼nh
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            setVnpayConfig(tempVnpayConfig || vnpayConfig);
                            setIsEditingVnpay(false);
                          }}
                          className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-[13px] rounded-xl transition-all"
                        >
                          Hß╗ºy
                        </button>
                        <button 
                          onClick={handleSaveVnpayConfig}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[13px] rounded-xl transition-all shadow-sm flex items-center gap-2"
                        >
                          <Save className="w-4 h-4" /> L╞░u cß║Ñu h├¼nh
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[12px] font-bold text-slate-700 mb-1.5 uppercase tracking-wide">M├ú Ng├ón h├áng (Bank Name)</label>
                      <select 
                        value={vnpayConfig?.bankName || ''}
                        onChange={(e) => setVnpayConfig({...vnpayConfig, bankName: e.target.value})}
                        disabled={!isEditingVnpay}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed uppercase"
                      >
                        <option value="">Chß╗ìn ng├ón h├áng...</option>
                        <option value="VNPAY">V├¡ VNPAY</option>
                        <option value="NCB">NCB - Ng├ón h├áng Quß╗æc D├ón</option>
                        <option value="VISA">Thß║╗ Quß╗æc tß║┐ VISA</option>
                        <option value="MASTERCARD">Thß║╗ Quß╗æc tß║┐ MasterCard</option>
                        <option value="JCB">Thß║╗ Quß╗æc tß║┐ JCB</option>
                        <option value="VCB">Vietcombank</option>
                        <option value="TECHCOMBANK">Techcombank</option>
                        <option value="MB">MBBank</option>
                        <option value="ACB">ACB</option>
                        <option value="VPBANK">VPBank</option>
                        <option value="BIDV">BIDV</option>
                        <option value="CTG">VietinBank</option>
                        <option value="VIB">VIB</option>
                        <option value="TPBANK">TPBank</option>
                        <option value="HDBANK">HDBank</option>
                        <option value="SACOMBANK">Sacombank</option>
                        <option value="MSB">MSB</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Sß╗æ T├ái khoß║ún (Bank Account No)</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={vnpayConfig?.bankAccountNo || ''}
                          onChange={(e) => setVnpayConfig({...vnpayConfig, bankAccountNo: e.target.value})}
                          disabled={!isEditingVnpay}
                          placeholder="VD: 1234567890"
                          className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                        {isEditingVnpay && (
                          <button
                            onClick={handleLookupBank}
                            disabled={isLookingUp || !vnpayConfig?.bankName || !vnpayConfig?.bankAccountNo}
                            className="px-4 py-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-[13px] rounded-xl transition-all whitespace-nowrap disabled:opacity-50"
                          >
                            {isLookingUp ? '─Éang d├▓...' : 'Kiß╗âm tra'}
                          </button>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-slate-700 mb-1.5 uppercase tracking-wide">T├¬n Chß╗º T├ái khoß║ún</label>
                      <input 
                        type="text" 
                        value={vnpayConfig?.bankAccountName || ''}
                        onChange={(e) => setVnpayConfig({...vnpayConfig, bankAccountName: e.target.value.toUpperCase()})}
                        disabled={!isEditingVnpay}
                        placeholder="Tß╗▒ ─æß╗Öng ─æiß╗ün khi bß║Ñm Kiß╗âm tra"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed uppercase"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">


                    <div className="flex items-center gap-3 pt-6">
                      <div className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${vnpayConfig?.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
                           onClick={() => isEditingVnpay && setVnpayConfig({...vnpayConfig, isActive: !vnpayConfig.isActive})}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${vnpayConfig?.isActive ? 'translate-x-6' : 'translate-x-0'}`}></div>
                      </div>
                      <span className="text-[13px] font-medium text-slate-600">
                        {vnpayConfig?.isActive ? 'Cß╗òng thanh to├ín ─æang hoß║ít ─æß╗Öng' : 'Tß║ím kh├│a cß╗òng thanh to├ín'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sandbox Test Area */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Sliders className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-[15px]">Cß║Ñu h├¼nh G├│i Dß╗ïch Vß╗Ñ & Cß╗òng Thanh to├ín (VNPay / PayOS)</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">Quß║ún l├╜ gi├í tiß╗ün v├á chß╗ìn g├│i ─æß╗â tß║ío li├¬n kß║┐t thanh to├ín thß╗¡ nghiß╗çm.</p>
                    </div>
                  </div>
                  <div>
                    {!isEditingPackages ? (
                      <button 
                        onClick={handleEditPackages}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[12px] rounded-lg transition-all"
                      >
                        Chß╗ënh sß╗¡a gi├í
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setIsEditingPackages(false)}
                          disabled={isUpdatingPackages}
                          className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-[12px] rounded-lg transition-all disabled:opacity-50"
                        >
                          Hß╗ºy
                        </button>
                        <button 
                          onClick={handleSavePackages}
                          disabled={isUpdatingPackages}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[12px] rounded-lg transition-all shadow-sm shadow-blue-600/20 disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {isUpdatingPackages && <RefreshCw className="w-3 h-3 animate-spin" />}
                          L╞░u bß║úng gi├í
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {servicePackages.length === 0 ? (
                    Array(3).fill(0).map((_, i) => (
                      <div key={i} className="rounded-2xl border border-slate-200 p-6 bg-white animate-pulse shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                          <div className="h-6 w-28 bg-slate-200 rounded-lg"></div>
                          <div className="h-5 w-16 bg-slate-100 rounded-full"></div>
                        </div>
                        <div className="h-8 w-32 bg-slate-200 rounded-lg mb-2"></div>
                        <div className="h-4 w-40 bg-slate-100 rounded mb-6"></div>
                        <div className="space-y-3">
                          <div className="h-4 w-full bg-slate-100 rounded"></div>
                          <div className="h-4 w-3/4 bg-slate-100 rounded"></div>
                        </div>
                      </div>
                    ))
                  ) : (
                    servicePackages.map((pkg) => {
                    const isSelected = testPackageType === pkg.packageType;
                    let pkgTitle = 'G├│i Trung b├¼nh';
                    let pkgClass = 'border-slate-200 hover:border-slate-350 hover:bg-slate-50/30';
                    let badgeColor = 'bg-slate-100 text-slate-600';
                    const postLimit = pkg.postLimit || (pkg.packageType === 'PREMIUM' ? 40 : pkg.packageType === 'REGULAR' ? 10 : 20);
                    const durationDays = pkg.durationDays || 30;
                    let pkgDuration = `${postLimit} b├ái / ${durationDays} ng├áy`;

                    if (pkg.packageType === 'REGULAR') {
                      pkgTitle = 'G├│i Th╞░ß╗¥ng';
                      if (isSelected) {
                        pkgClass = 'border-indigo-500 bg-indigo-50/10 ring-2 ring-indigo-500/10';
                      }
                      badgeColor = 'bg-indigo-50 text-indigo-700';
                    } else if (pkg.packageType === 'PREMIUM') {
                      pkgTitle = 'G├│i Cao cß║Ñp';
                      if (isSelected) {
                        pkgClass = 'border-amber-500 bg-amber-50/10 ring-2 ring-amber-500/10';
                      }
                      badgeColor = 'bg-amber-50 text-amber-700';
                    } else { // MEDIUM
                      if (isSelected) {
                        pkgClass = 'border-emerald-500 bg-emerald-50/10 ring-2 ring-emerald-500/10';
                      }
                      badgeColor = 'bg-emerald-50 text-emerald-700';
                    }

                    return (
                      <div 
                        key={pkg.packageType}
                        onClick={() => setTestPackageType(pkg.packageType)}
                        className={`border rounded-2xl p-4 cursor-pointer transition-all duration-300 flex flex-col justify-between ${pkgClass}`}
                      >
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${badgeColor}`}>
                              {pkg.packageType}
                            </span>
                            {isEditingPackages ? (
                              <div className="flex gap-1 items-center">
                                <input
                                  type="number"
                                  className="w-10 border border-slate-300 rounded px-1 py-0.5 text-[10px] font-semibold text-slate-700 text-center focus:outline-none focus:border-blue-500"
                                  value={tempPackages.find(p => p.packageType === pkg.packageType)?.postLimit || ''}
                                  onChange={(e) => {
                                    const val = e.target.value === '' ? '' : Number(e.target.value);
                                    setTempPackages(prev => prev.map(p => p.packageType === pkg.packageType ? { ...p, postLimit: val } : p));
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  title="Sß╗æ b├ái"
                                />
                                <span className="text-[10px] text-slate-400 font-semibold">b├ái /</span>
                                <input
                                  type="number"
                                  className="w-10 border border-slate-300 rounded px-1 py-0.5 text-[10px] font-semibold text-slate-700 text-center focus:outline-none focus:border-blue-500"
                                  value={tempPackages.find(p => p.packageType === pkg.packageType)?.durationDays || ''}
                                  onChange={(e) => {
                                    const val = e.target.value === '' ? '' : Number(e.target.value);
                                    setTempPackages(prev => prev.map(p => p.packageType === pkg.packageType ? { ...p, durationDays: val } : p));
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  title="Sß╗æ ng├áy"
                                />
                                <span className="text-[10px] text-slate-400 font-semibold">ng├áy</span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-semibold">{pkgDuration}</span>
                            )}
                          </div>
                          <h5 className="font-bold text-slate-800 text-[14px]">{pkgTitle}</h5>
                        </div>
                        <div className="mt-4 flex justify-between items-end">
                          <div>
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">Gi├í g├│i</span>
                            {isEditingPackages ? (
                              <input
                                type="number"
                                className="w-full mt-1 border border-slate-300 rounded-md px-2 py-1 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                                value={tempPackages.find(p => p.packageType === pkg.packageType)?.price ?? ''}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setTempPackages(prev => prev.map(p => p.packageType === pkg.packageType ? { ...p, price: val } : p));
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <p className="text-md font-extrabold text-slate-900 mt-0.5 font-mono">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(pkg.price)}
                              </p>
                            )}
                          </div>
                          {isSelected && (
                            <span className="text-[10px] font-extrabold uppercase tracking-wide bg-emerald-100/60 text-emerald-800 px-2 py-0.5 rounded-md">
                              Γ£ô Chß╗ìn
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  }))}
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button 
                    onClick={() => setShowQrZoomModal(true)}
                    disabled={isLoading}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-95 transition-all flex items-center gap-2"
                  >
                    Hiß╗ân thß╗ï m├ú VietQR ({testPackageType})
                  </button>
                  <button 
                    onClick={() => setShowInvoicePreviewModal(true)}
                    disabled={isLoading}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-600/10 hover:shadow-rose-600/20 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" /> Xem mß║½u H├│a ─æ╞ín ({testPackageType})
                  </button>
                  <button 
                    onClick={() => handleTestPayos()}
                    disabled={isLoading}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-2"
                  >
                    Tß║ío thanh to├ín PayOS ({testPackageType})
                  </button>
                </div>
              </div>

              {/* === FINANCIAL DASHBOARD BLOCK === */}
              <div className="bg-[#242424] rounded-2xl p-6 shadow-sm mb-6 animate-in fade-in duration-300">
                {/* Time Filters */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {['H├┤m qua', 'H├┤m nay', 'Tuß║ºn n├áy', 'Th├íng n├áy', 'Th├íng tr╞░ß╗¢c', 'N─âm n├áy', 'N─âm tr╞░ß╗¢c'].map(filter => (
                    <button
                      key={filter}
                      onClick={() => setPaymentTimeFilter(filter)}
                      className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                        paymentTimeFilter === filter 
                          ? 'bg-[#00b86b] text-white border border-[#00b86b]' 
                          : 'bg-transparent text-gray-300 border border-gray-600 hover:border-gray-400'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                  <button className="px-4 py-1.5 rounded-full text-xs font-medium text-gray-300 bg-transparent border border-gray-600 hover:border-gray-400 flex items-center gap-1">
                    T├╣y chß╗ënh <ChevronDown className="w-3 h-3" />
                  </button>
                </div>

                {/* Top Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-[#00b86b] rounded-xl p-5 flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                    <div className="absolute -top-4 -right-10 w-24 h-24 bg-black/10 rounded-full blur-xl"></div>
                    <span className="text-white/90 text-sm font-medium mb-3">Tß╗òng doanh thu {paymentTimeFilter.toLowerCase()}</span>
                    <span className="text-white text-2xl font-bold tracking-tight">
                      {new Intl.NumberFormat('vi-VN').format(paymentStats.totalRevenue)} VND
                    </span>
                  </div>
                  <div className="bg-[#e8f5e9] rounded-xl p-5 flex flex-col justify-center">
                    <span className="text-slate-700 text-sm font-medium mb-3">Tß╗òng ─æ╞ín ho├án th├ánh {paymentTimeFilter.toLowerCase()}</span>
                    <span className="text-[#00b86b] text-xl font-bold">
                      {paymentStats.completedOrders} ─æ╞ín h├áng
                    </span>
                  </div>
                </div>

                {/* Bottom Panels */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 relative">
                  {/* Left: Channels */}
                  <div className="bg-[#2c2c2c] border border-gray-700/50 rounded-xl p-5">
                    <h4 className="text-gray-300 text-sm font-medium mb-5">Thu theo k├¬nh thanh to├ín</h4>
                    <div className="bg-[#383838] rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center shrink-0 border border-gray-600">
                          <img src="/lancer-channel.jpg" alt="Channel" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-gray-300 text-sm">K├¬nh: <span className="text-white font-medium">lancer</span></span>
                      </div>
                      <span className="text-white font-bold text-sm">
                        {new Intl.NumberFormat('vi-VN').format(paymentStats.totalRevenue)} VND
                      </span>
                    </div>
                  </div>

                  {/* Right: Pie Chart */}
                  <div className="bg-[#2c2c2c] border border-gray-700/50 rounded-xl p-5 flex flex-col">
                    <h4 className="text-gray-300 text-sm font-medium mb-2">Thß╗æng k├¬ trß║íng th├íi ─æ╞ín h├áng</h4>
                    <div className="flex-1 flex flex-col items-center justify-center relative min-h-[220px]">
                      {(() => {
                        const radius = 70;
                        const circumference = 2 * Math.PI * radius;
                        let currentOffset = 0;
                        
                        return (
                          <svg width="220" height="220" viewBox="0 0 220 220" className="relative z-10 -rotate-90">
                            {/* Inner Circle Background */}
                            <circle cx="110" cy="110" r={radius} fill="none" stroke="#383838" strokeWidth="40" />
                            
                            {/* Chart Slices & Text */}
                            {(() => {
                               let currentOffset = 0;
                               return paymentStats.donutData.map((slice) => {
                                 if (slice.value === 0) return null;
                                 const dash = (slice.percent / 100) * circumference;
                                 const offset = currentOffset;
                                 
                                 const startPercent = Math.abs(offset) / circumference;
                                 const endPercent = (Math.abs(offset) + dash) / circumference;
                                 const midPercent = (startPercent + endPercent) / 2;
                                 
                                 const angle = midPercent * 2 * Math.PI;
                                 const textR = radius;
                                 const tx = 110 + textR * Math.cos(angle);
                                 const ty = 110 + textR * Math.sin(angle);
                                 
                                 currentOffset -= dash;
                                 
                                 return (
                                   <g key={slice.id}>
                                     <circle
                                       cx="110"
                                       cy="110"
                                       r={radius}
                                       fill="none"
                                       stroke={slice.color}
                                       strokeWidth="40"
                                       strokeDasharray={`${dash} ${circumference}`}
                                       strokeDashoffset={offset}
                                       className="transition-all duration-300 cursor-pointer hover:opacity-80"
                                       onMouseMove={(e) => handleDonutMouseMove(e, slice)}
                                       onMouseLeave={() => setDonutHoverState(null)}
                                     />
                                     {slice.percent > 5 && (
                                       <text 
                                         x={tx} 
                                         y={ty} 
                                         textAnchor="middle" 
                                         fill="#fff" 
                                         fontSize="11" 
                                         fontWeight="bold"
                                         className="pointer-events-none"
                                         transform={`rotate(90 ${tx} ${ty})`}
                                         style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.5)' }}
                                       >
                                         {slice.percent.toFixed(1)}%
                                       </text>
                                     )}
                                   </g>
                                 );
                               });
                            })()}
                            
                            {/* Inner Donut Text */}
                            <g transform="rotate(90 110 110)">
                              <text x="110" y="105" textAnchor="middle" fill={donutHoverState ? donutHoverState.data.color : "#fff"} fontSize="12" fontWeight="600">
                                {donutHoverState ? donutHoverState.data.name : 'Tß╗òng ─æ╞ín h├áng'}
                              </text>
                              <text x="110" y="125" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="bold">
                                {donutHoverState ? donutHoverState.data.value : paymentStats.totalTxns}
                              </text>
                            </g>
                          </svg>
                        );
                      })()}

                      {/* Tooltip (Light Theme) */}
                      {donutHoverState && (
                        <div 
                          className="fixed z-[9999] bg-white rounded-lg shadow-xl p-3 pointer-events-none transform -translate-x-1/2 -translate-y-[120%] min-w-[150px] border border-gray-100 transition-opacity duration-150"
                          style={{ left: donutHoverState.x + 'px', top: donutHoverState.y + 'px' }}
                        >
                          <p className="text-gray-900 font-bold text-sm mb-1.5">{donutHoverState.data.name}</p>
                          <p className="text-gray-600 text-xs mb-0.5">Sß╗æ l╞░ß╗úng: <span className="font-semibold text-gray-800">{donutHoverState.data.value} ─æ╞ín h├áng</span></p>
                          <p className="text-gray-600 text-xs mb-0.5">Tß╗╖ lß╗ç: <span className="font-semibold text-gray-800">{donutHoverState.data.percent.toFixed(1)}%</span></p>
                          <p className="text-gray-600 text-xs">Tß╗òng tiß╗ün: <span className="font-semibold text-gray-800">{donutHoverState.data.id === 'SUCCESS' ? new Intl.NumberFormat('vi-VN').format(paymentStats.totalRevenue) : '0'} VND</span></p>
                        </div>
                      )}

                      {/* Chart Legend */}
                      <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
                        {paymentStats.donutData.map(slice => (
                          <div key={slice.id} className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: slice.color }}></span>
                            <span className="text-gray-300 text-xs">{slice.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-primary text-[17px]">Nhß║¡t K├╜ Giao Dß╗ïch</h3>
                    <p className="text-[12px] text-slate-500 mt-1">Danh s├ích ─æß╗æi so├ít v├á duyß╗çt h├│a ─æ╞ín cho Employer ─æ─âng dß╗▒ ├ín tuyß╗ân dß╗Ñng.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => fetchVnpayTransactions(0)}
                      className="p-2.5 text-slate-400 hover:text-slate-655 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all duration-200 bg-white"
                      title="Tß║úi lß║íi giao dß╗ïch"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                  {vnpayLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-450 space-y-3">
                      <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
                      <p className="text-body-sm font-semibold">─Éang tß║úi nhß║¡t k├╜ giao dß╗ïch...</p>
                    </div>
                  ) : vnpayTransactions.length === 0 ? (
                    <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl">
                      <BadgeDollarSign className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium">Ch╞░a c├│ giao dß╗ïch thanh to├ín n├áo ─æ╞░ß╗úc thß╗▒c hiß╗çn.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider font-extrabold">
                            <th className="p-3">M├ú GD / Order Info</th>
                            <th className="p-3">Employer / Dß╗ïch vß╗Ñ</th>
                            <th className="p-3">Sß╗æ tiß╗ün</th>
                            <th className="p-3">Thß╗¥i gian</th>
                            <th className="p-3">Cß╗òng GD / VNP No.</th>
                            <th className="p-3 text-center">Trß║íng th├íi</th>
                            <th className="p-3 text-center">H├ánh ─æß╗Öng</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {vnpayTransactions.map(txn => (
                            <tr key={txn.id} className="hover:bg-slate-50/50 transition-colors text-body-sm">
                              <td className="p-3">
                                <span className="font-bold text-slate-800 font-mono text-[12px] block">#{txn.txnRef || txn.vnpTxnRef || 'N/A'}</span>
                                <span className="text-[11px] text-slate-450 leading-normal block max-w-[150px] truncate" title={txn.orderInfo || 'Th├┤ng tin thanh to├ín'}>
                                  {txn.orderInfo || (txn.packageType ? `Thanh to├ín G├│i ${txn.packageType}` : `Thanh to├ín Dß╗▒ ├ín #${txn.projectId}`)}
                                </span>
                              </td>
                              <td className="p-3">
                                <span className="font-semibold text-slate-700 block">Employer ID: {txn.employerId}</span>
                                {txn.packageType ? (
                                  <span className="text-[11.5px] text-indigo-600 font-medium block">G├│i: {txn.packageType}</span>
                                ) : (
                                  <span className="text-[11.5px] text-slate-500 block">Dß╗▒ ├ín: ID #{txn.projectId || 'N/A'}</span>
                                )}
                              </td>
                              <td className="p-3">
                                <span className="font-bold text-emerald-600">
                                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(txn.amount || 0)}
                                </span>
                              </td>
                              <td className="p-3 text-slate-550 text-body-xs font-medium">
                                {txn.status === 'SUCCESS' ? new Date(txn.updatedAt || txn.createdAt).toLocaleString('vi-VN') : 'Ch╞░a thanh to├ín'}
                              </td>
                              <td className="p-3 font-mono text-body-xs">
                                <span className="block font-semibold text-slate-700">{txn.bankCode || 'PayOS / VNPay'}</span>
                                <span className="block text-slate-450 text-[10px]">M├ú NH: {txn.vnpTransactionNo || 'Ch╞░a ghi nhß║¡n'}</span>
                              </td>
                              <td className="p-3 text-center">
                                <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold border ${
                                  txn.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                  txn.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                  'bg-rose-50 text-rose-700 border-rose-200'
                                }`}>
                                  {txn.status}
                                </span>
                              </td>
                              <td className="p-3 text-center flex items-center justify-center gap-2">
                                <button
                                  onClick={() => setSelectedTxnDetails(txn)}
                                  className="px-2.5 py-1.5 bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 font-bold rounded-lg text-[11px] transition-all active:scale-95 whitespace-nowrap"
                                >
                                  Chi tiß║┐t
                                </button>
                                <button
                                  onClick={() => handleQueryTransaction(txn.id, txn.txnRef || txn.vnpTxnRef)}
                                  className="px-2.5 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 font-bold rounded-lg text-[11px] transition-all active:scale-95 whitespace-nowrap"
                                  title="Truy vß║Ñn VNPay"
                                >
                                  Truy vß║Ñn
                                </button>
                                
                                {txn.status === 'SUCCESS' && (
                                  <button
                                    onClick={() => handleOpenRefundModal(txn)}
                                    className="px-2.5 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 font-bold rounded-lg text-[11px] transition-all active:scale-95 whitespace-nowrap"
                                    title="Ho├án tiß╗ün giao dß╗ïch n├áy"
                                  >
                                    Ho├án tiß╗ün
                                  </button>
                                )}

                                </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      
                      {/* Pagination Controls */}
                      {vnpayTotalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
                          <span className="text-xs text-slate-500 font-semibold">
                            Trang {vnpayPage + 1} / {vnpayTotalPages}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => fetchVnpayTransactions(vnpayPage - 1)}
                              disabled={vnpayPage === 0 || vnpayLoading}
                              className="px-3 py-1 bg-white border border-slate-200 rounded text-slate-600 hover:bg-slate-50 disabled:opacity-50 text-xs font-bold"
                            >
                              Trang tr╞░ß╗¢c
                            </button>
                            <button
                              onClick={() => fetchVnpayTransactions(vnpayPage + 1)}
                              disabled={vnpayPage >= vnpayTotalPages - 1 || vnpayLoading}
                              className="px-3 py-1 bg-white border border-slate-200 rounded text-slate-600 hover:bg-slate-50 disabled:opacity-50 text-xs font-bold"
                            >
                              Trang sau
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
            </div>
          )}

          {activeTab === 'departments' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              
              
              {!selectedDepartment ? (
                <div className="space-y-6">
                  
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="font-bold text-primary text-[18px]">Danh S├ích Khoa / Ph├▓ng Ban</h3>
                      <p className="text-body-sm text-slate-500 mt-1">Danh s├ích ph├▓ng ban trß╗▒c thuß╗Öc hß╗ç thß╗æng. Mß╗ùi ph├▓ng ban hß╗ù trß╗ú tß╗æi ─æa 5 Managers v├á bß║»t buß╗Öc c├│ tß╗æi thiß╗âu 1 Manager & 1 Staff.</p>
                    </div>
                  </div>

                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {departmentsList.map(dept => {

                      const deptUsers = users.filter(u => u.departmentId === dept.departmentId && !u.isDeleted);
                      const managersCount = deptUsers.filter(u => u.role === 'MANAGER').length;
                      const staffCount = deptUsers.filter(u => u.role === 'STAFF').length;

                      return (
                        <div 
                          key={dept.departmentId}
                          className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 p-6 flex flex-col justify-between"
                        >
                          <div className="space-y-4">
                            <div className="flex justify-between items-start">
                              <span className="bg-indigo-50 text-indigo-700 font-extrabold text-[12px] px-3 py-1 rounded-lg">
                                {dept.code}
                              </span>
                              <div className="flex flex-col items-end text-slate-500 font-bold text-[12px] gap-1">
                                <div className="flex items-center gap-1.5">
                                  <Users className="w-3.5 h-3.5 text-purple-500" />
                                  <span>{managersCount}/5 Managers</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Users className="w-3.5 h-3.5 text-blue-500" />
                                  <span>{staffCount} Staffs</span>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-display font-bold text-lg text-primary">{dept.name}</h4>
                              <p className="text-body-sm text-slate-500 mt-2 line-clamp-2 min-h-[40px]">
                                {dept.description || 'Ch╞░a c├│ m├┤ tß║ú chi tiß║┐t cho khoa n├áy.'}
                              </p>
                            </div>

                            
                            <div className="space-y-1.5 pt-2">
                              {managersCount === 1 && (
                                <div className="flex items-center gap-1.5 text-[11px] text-amber-600 bg-amber-50 px-2 py-1 rounded-lg font-semibold">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  <span>Cß║únh b├ío: Chß╗ë c├▓n 1 Manager!</span>
                                </div>
                              )}
                              {staffCount === 1 && (
                                <div className="flex items-center gap-1.5 text-[11px] text-amber-600 bg-amber-50 px-2 py-1 rounded-lg font-semibold">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  <span>Cß║únh b├ío: Chß╗ë c├▓n 1 Staff!</span>
                                </div>
                              )}
                              {managersCount === 0 && (
                                <div className="flex items-center gap-1.5 text-[11px] text-rose-600 bg-rose-50 px-2 py-1 rounded-lg font-semibold animate-pulse">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  <span>Lß╗ùi: Thiß║┐u Manager! (Cß║ºn tß╗æi thiß╗âu 1)</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="pt-6 border-t border-slate-100 mt-6 flex justify-between items-center">
                            <span className="text-[12px] text-slate-400">ID Khoa: {dept.departmentId}</span>
                            <button
                              onClick={() => handleSelectDepartment(dept)}
                              className="text-indigo-600 hover:text-indigo-700 font-bold text-body-sm flex items-center gap-1 group"
                            >
                              Xem chi tiß║┐t <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 mt-8">
                    <div>
                      <h3 className="font-bold text-primary text-[18px] flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-indigo-650" /> Li├¬n Kß║┐t Kiß╗âm Chß╗⌐ng Li├¬n Khoa
                      </h3>
                      <p className="text-body-sm text-slate-500 mt-1">
                        Quy tr├¼nh ph├¬ duyß╗çt li├¬n kß║┐t giß╗»a c├íc khoa chuy├¬n m├┤n ─æß╗æi vß╗¢i c├íc giao dß╗ïch t├ái ch├¡nh v├á y├¬u cß║ºu nhß║íy cß║úm.
                      </p>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider">
                            <th className="p-4">T├íc Vß╗Ñ</th>
                            <th className="p-4">Loß║íi T├íc Vß╗Ñ</th>
                            <th className="p-4">Trß║íng Th├íi</th>
                            <th className="p-4">Tiß║┐n ─Éß╗Ö K├╜ Duyß╗çt</th>
                            <th className="p-4 text-center">H├ánh ─Éß╗Öng</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {verificationTasksList.length === 0 ? (
                            <tr>
                              <td colSpan="5" className="text-center text-slate-400 py-8 text-body-sm">
                                Kh├┤ng c├│ t├íc vß╗Ñ kiß╗âm chß╗⌐ng li├¬n khoa n├áo ─æang chß╗¥ duyß╗çt.
                              </td>
                            </tr>
                          ) : (
                            verificationTasksList.map(task => {
                              const reqDepts = task.requiredDepartments.split(',');
                              return (
                                <tr key={task.taskId} className="hover:bg-slate-55 transition-all duration-200 text-body-sm">
                                  <td className="p-4">
                                    <div className="font-bold text-slate-800">{task.title}</div>
                                    <div className="text-[12px] text-slate-400 mt-0.5">{task.description}</div>
                                    <div className="text-[11px] text-slate-500 font-mono mt-1">ID T├íc vß╗Ñ: #{task.taskId} | Ref ID: #{task.referenceId}</div>
                                  </td>
                                  <td className="p-4">
                                    <span className="font-mono text-[11.5px] bg-slate-150 text-slate-700 px-2 py-0.5 rounded font-bold">
                                      {task.taskType}
                                    </span>
                                  </td>
                                  <td className="p-4">
                                    <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full ${
                                      task.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' :
                                      task.status === 'REJECTED' ? 'bg-rose-50 text-rose-700' :
                                      'bg-amber-50 text-amber-700'
                                    }`}>
                                      {task.status === 'APPROVED' ? '─É├ú th├┤ng qua' :
                                       task.status === 'REJECTED' ? 'Bß╗ï tß╗½ chß╗æi' : '─Éang xß╗¡ l├╜'}
                                    </span>
                                  </td>
                                  <td className="p-4">
                                    <div className="flex flex-wrap gap-2.5">
                                      {reqDepts.map(dept => {
                                        const signoff = task.signoffs?.find(s => s.departmentCode === dept);
                                        let badgeColor = 'bg-slate-50 text-slate-500 border border-slate-200';
                                        let icon = <Clock className="w-3.5 h-3.5 text-slate-400" />;
                                        let statusText = 'Chß╗¥ duyß╗çt';
                                        
                                        if (signoff) {
                                          if (signoff.status === 'APPROVED') {
                                            badgeColor = 'bg-emerald-50 text-emerald-700 border border-emerald-100';
                                            icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
                                            statusText = `Duyß╗çt bß╗ƒi ${signoff.verifierEmail}`;
                                          } else {
                                            badgeColor = 'bg-rose-50 text-rose-700 border border-rose-100';
                                            icon = <XCircle className="w-3.5 h-3.5 text-rose-600" />;
                                            statusText = `Tß╗½ chß╗æi bß╗ƒi ${signoff.verifierEmail}`;
                                          }
                                        }

                                        return (
                                          <div 
                                            key={dept} 
                                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold ${badgeColor}`}
                                            title={statusText}
                                          >
                                            {icon}
                                            <span>{dept}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </td>
                                  <td className="p-4 text-center">
                                    {task.status === 'PENDING' ? (
                                      <button
                                        onClick={() => {
                                          setSelectedVerificationTask(task);
                                          setShowSignoffModal(true);
                                        }}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-[12px] font-bold px-4 py-2 rounded-xl transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-95 shadow-sm"
                                      >
                                        K├╜ duyß╗çt
                                      </button>
                                    ) : (
                                      <span className="text-slate-400 text-[12px] font-medium">-</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                
                <div className="space-y-6">
                  
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => handleSelectDepartment(null)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-xl transition-all duration-200 active:scale-95"
                        title="Quay lß║íi danh s├ích"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-primary text-[20px]">{selectedDepartment.name}</h3>
                          <span className="bg-indigo-100 text-indigo-700 font-extrabold text-[12px] px-2.5 py-0.5 rounded-md">
                            {selectedDepartment.code}
                          </span>
                        </div>
                        <p className="text-body-sm text-slate-500 mt-1">{selectedDepartment.description || 'Kh├┤ng c├│ m├┤ tß║ú.'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleSelectDepartment(selectedDepartment)}
                        className="bg-white border border-slate-200 text-slate-650 hover:bg-slate-50 p-2.5 rounded-xl text-body-sm font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                      >
                        <RefreshCw className="w-4 h-4" /> L├ám mß╗¢i dß╗» liß╗çu
                      </button>
                    </div>
                  </div>

                  
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    
                    
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col min-h-[400px]">
                      <h4 className="font-bold text-primary text-body-md border-b border-slate-100 pb-3 flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-650" /> Th├ánh Vi├¬n Khoa ({users.filter(u => u.departmentId === selectedDepartment.departmentId).length})
                      </h4>
                      <div className="divide-y divide-slate-100 overflow-y-auto flex-grow max-h-[500px] mt-4 pr-1">
                        {users.filter(u => u.departmentId === selectedDepartment.departmentId).length === 0 ? (
                          <p className="text-center text-slate-400 py-12 text-body-sm">Khoa n├áy ch╞░a c├│ Manager hay Staff n├áo.</p>
                        ) : (
                          users.filter(u => u.departmentId === selectedDepartment.departmentId).map(member => (
                            <div key={member.id} className="py-3.5 flex justify-between items-start gap-4">
                              <div className="min-w-0 space-y-1">
                                <p className="font-bold text-slate-800 text-body-sm truncate">{member.name}</p>
                                <p className="text-[12px] text-slate-400 truncate">{member.email}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                                    member.role === 'MANAGER' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
                                  }`}>
                                    {member.role}
                                  </span>
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                    member.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' :
                                    member.status === 'INVITED' ? 'bg-amber-50 text-amber-700' :
                                    'bg-rose-50 text-rose-700'
                                  }`}>
                                    {member.status}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2 shrink-0">
                                <span className="text-[10px] text-slate-400 whitespace-nowrap">Gia nhß║¡p: {member.joined || 'N/A'}</span>
                                <button
                                  onClick={() => handleOpenTransferModal(member)}
                                  className="text-indigo-600 hover:text-white hover:bg-indigo-600 text-[11px] font-bold border border-indigo-200 hover:border-indigo-600 px-2.5 py-1 rounded-lg transition-all active:scale-95 flex items-center gap-1 bg-indigo-50/50 shadow-sm"
                                >
                                  <RefreshCw className="w-3 h-3" /> ─Éiß╗üu chuyß╗ân
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col min-h-[400px]">
                      <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setDeptDetailTab('sessions')}
                            className={`px-3 py-1 rounded-xl text-body-sm font-bold transition-all ${
                              deptDetailTab === 'sessions' 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            Phi├¬n L├ám Viß╗çc ({departmentSessions.length})
                          </button>
                          <button
                            onClick={() => setDeptDetailTab('logs')}
                            className={`px-3 py-1 rounded-xl text-body-sm font-bold transition-all ${
                              deptDetailTab === 'logs' 
                                ? 'bg-amber-50 text-amber-700 border border-amber-100 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            Nhß║¡t K├╜ Thao T├íc ({departmentLogs.length})
                          </button>
                        </div>
                      </div>

                      <div className="divide-y divide-slate-100 overflow-y-auto flex-grow max-h-[500px] mt-4 pr-1">
                        {deptDetailTab === 'sessions' ? (
                          departmentSessions.length === 0 ? (
                            <p className="text-center text-slate-400 py-12 text-body-sm">Ch╞░a c├│ phi├¬n l├ám viß╗çc n├áo ─æ╞░ß╗úc ghi nhß║¡n.</p>
                          ) : (
                            departmentSessions.map(session => (
                              <div key={session.sessionId} className="py-3.5 space-y-1">
                                <div className="flex justify-between items-start gap-4">
                                  <span className="font-bold text-slate-800 text-body-sm truncate">{session.userEmail}</span>
                                  <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                                    session.userRole === 'MANAGER' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
                                  }`}>
                                    {session.userRole}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-[12px] text-slate-500">
                                  <span>IP: <span className="font-mono">{session.ipAddress || 'N/A'}</span></span>
                                  <span className={`font-bold ${session.status === 'ACTIVE' ? 'text-emerald-600' : 'text-slate-400'}`}>
                                    {session.status}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-400 flex flex-col gap-0.5 pt-1">
                                  <div>Bß║»t ─æß║ºu: {new Date(session.loginAt).toLocaleString('vi-VN')}</div>
                                  {session.logoutAt && <div>Kß║┐t th├║c: {new Date(session.logoutAt).toLocaleString('vi-VN')}</div>}
                                </div>
                              </div>
                            ))
                          )
                        ) : (
                          departmentLogs.length === 0 ? (
                            <p className="text-center text-slate-400 py-12 text-body-sm">Ch╞░a c├│ nhß║¡t k├╜ hoß║ít ─æß╗Öng n├áo.</p>
                          ) : (
                            departmentLogs.map(log => (
                              <div key={log.logId} className="py-3.5 space-y-1.5">
                                <div className="flex justify-between items-start gap-4">
                                  <div className="min-w-0">
                                    <span className="font-bold text-slate-800 text-[12.5px] block truncate">{log.userEmail}</span>
                                    <span className="text-[10px] text-slate-400 font-mono">Role: {log.userRole}</span>
                                  </div>
                                  <span className="text-[11px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded">
                                    {log.action}
                                  </span>
                                </div>
                                <p className="text-body-sm text-slate-650 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                  {log.description}
                                </p>
                                <div className="text-[10px] text-slate-400 text-right">
                                  {new Date(log.timestamp).toLocaleString('vi-VN')}
                                </div>
                              </div>
                            ))
                          )
                        )}
                      </div>
                    </div>

                    
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col min-h-[400px]">
                      <h4 className="font-bold text-primary text-body-md border-b border-slate-100 pb-3 flex items-center gap-2">
                        <History className="w-5 h-5 text-indigo-650" /> Lß╗ïch Sß╗¡ ─Éiß╗üu Chuyß╗ân ({departmentTransfers.length})
                      </h4>
                      <div className="divide-y divide-slate-100 overflow-y-auto flex-grow max-h-[500px] mt-4 pr-1">
                        {departmentTransfers.length === 0 ? (
                          <p className="text-center text-slate-400 py-12 text-body-sm">Ch╞░a c├│ lß╗ïch sß╗¡ ─æiß╗üu chuyß╗ân n├áo.</p>
                        ) : (
                          departmentTransfers.map(transfer => {
                            const isIncoming = transfer.toDepartment.departmentId === selectedDepartment.departmentId;
                            return (
                              <div key={transfer.transferId} className="py-3.5 space-y-1.5">
                                <div className="flex justify-between items-start gap-4">
                                  <div className="min-w-0">
                                    <span className="font-bold text-slate-800 text-[12.5px] block truncate">{transfer.userDisplayName || 'Kh├┤ng r├╡ t├¬n'}</span>
                                    <span className="text-[10px] text-slate-400 font-mono block truncate">{transfer.userEmail}</span>
                                    <span className="bg-slate-100 text-slate-600 text-[9px] font-bold px-1.5 py-0.5 rounded">
                                      {transfer.userType}
                                    </span>
                                  </div>
                                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
                                    isIncoming 
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                      : 'bg-rose-50 text-rose-700 border border-rose-100'
                                  }`}>
                                    {isIncoming ? 'Nhß║¡n v├áo' : 'Chuyß╗ân ─æi'}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 text-[12px] font-semibold text-slate-700 bg-slate-50 px-2 py-1 rounded-md">
                                  <span>{transfer.fromDepartment.code}</span>
                                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{transfer.toDepartment.code}</span>
                                </div>

                                {transfer.reason && (
                                  <p className="text-body-sm text-slate-600 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100 italic">
                                    "{transfer.reason}"
                                  </p>
                                )}

                                <div className="text-[10px] text-slate-400 text-right">
                                  {new Date(transfer.transferredAt).toLocaleString('vi-VN')}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              )}

            </div>
          )}

        </div>

      </main>

      {}
      <div className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 transition-all duration-300 ease-in-out ${selectedActivity ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
        <div className={`bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden transition-all duration-300 ease-out transform ${selectedActivity ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}`}>
          <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h4 className="font-bold text-primary text-lg">Chi Tiß║┐t Hoß║ít ─Éß╗Öng Nhß║¡t K├╜</h4>
            <button 
              onClick={() => setSelectedActivity(null)}
              className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-200 transition-all duration-200 hover:rotate-90 active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Thß╗¥i Gian</span>
              <span className="text-body-md font-medium text-slate-800">{selectedActivity?.timestamp}</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Nguß╗ôn Hoß║ít ─Éß╗Öng (Actor)</span>
              <span className="text-body-md font-bold text-blue-600">{selectedActivity?.source}</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Chi Tiß║┐t Nghiß╗çp Vß╗Ñ</span>
              <span className="text-body-md text-slate-600 block bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                {selectedActivity?.detail}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Trß║íng Thß║┐ Hß╗ç Thß╗æng</span>
              <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-extrabold mt-1 uppercase ${
                selectedActivity?.status === 'Approved' || selectedActivity?.status === 'Verified' ? 'bg-emerald-100 text-emerald-800' :
                selectedActivity?.status === 'Critical' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-800'
              }`}>
                {selectedActivity?.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {}
      <div className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 transition-all duration-300 ease-in-out ${activeUserForAction ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
        <div className={`bg-white rounded-3xl w-full max-w-md shadow-2xl border-t-[6px] overflow-hidden transition-all duration-300 ease-out transform ${
          activeUserForAction ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        } ${
          actionType === 'lock' ? 'border-amber-500 shadow-amber-500/20' : 'border-rose-500 shadow-rose-500/20'
        }`}>
          <div className={`p-6 border-b flex justify-between items-center ${
            actionType === 'lock' ? 'bg-amber-50/50 border-amber-100' : 'bg-rose-50/50 border-rose-100'
          }`}>
            <h4 className={`font-bold text-lg flex items-center gap-2 ${
              actionType === 'lock' ? 'text-amber-700' : 'text-rose-700'
            }`}>
              {actionType === 'lock' ? <Lock className="w-5 h-5" /> : <Ban className="w-5 h-5" />}
              {actionType === 'lock' ? 'Suspend User Account' : actionType === 'delete_gmail' ? 'Delete User Account' : 'Ban Account Permanently'}
            </h4>
            <button 
              onClick={() => { setActiveUserForAction(null); setBanReasons([]); setAdminPin(''); }}
              className={`p-2 rounded-full transition-all duration-200 hover:rotate-90 active:scale-95 ${
                actionType === 'lock' ? 'text-amber-500 hover:text-amber-700 hover:bg-amber-100' : 'text-rose-500 hover:text-rose-700 hover:bg-rose-100'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 space-y-5">
            <p className="text-body-sm text-slate-500">
              {activeUserForAction?.role === 'MANAGER' || activeUserForAction?.role === 'STAFF' ? (
                <>
                  X├íc nhß║¡n cß║¡p nhß║¡t trß║íng th├íi hoß║ít ─æß╗Öng cho nh├ón sß╗▒:<br/>
                  <span className="font-bold text-slate-800">{activeUserForAction?.name}</span> ({activeUserForAction?.email} - <span className="text-indigo-600 font-bold">{activeUserForAction?.role}</span>).
                </>
              ) : (
                <>
                  X├íc nhß║¡n thay ─æß╗òi bß║úo mß║¡t cho t├ái khoß║ún:<br/>
                  <span className="font-bold text-slate-800">{activeUserForAction?.name}</span> ({activeUserForAction?.email}).
                </>
              )}
            </p>
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase block mb-2">
                {activeUserForAction?.role === 'MANAGER' || activeUserForAction?.role === 'STAFF' ? 'CHß╗îN L├¥ DO H├ÇNH CH├ìNH (Bß║«T BUß╗ÿC)' : 'CHß╗îN L├¥ DO Bß║óO Mß║¼T (Bß║«T BUß╗ÿC)'}
              </label>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  if (activeUserForAction?.role === 'MANAGER' || activeUserForAction?.role === 'STAFF') {
                    if (actionType === 'lock') {
                      return [
                        "Tß║ím ng╞░ng c├┤ng t├íc / Nghß╗ë ph├⌐p d├ái hß║ín",
                        "─Éiß╗üu chuyß╗ân c├┤ng t├íc / Thay ─æß╗òi nhiß╗çm vß╗Ñ",
                        "Y├¬u cß║ºu bß║úo mß║¡t / Kiß╗âm tra t├ái khoß║ún",
                        "Tß║ím kh├│a quyß╗ün truy cß║¡p",
                        "Kh├íc"
                      ];
                    } else {
                      return [
                        "Nghß╗ë viß╗çc / Chß║Ñm dß╗⌐t hß╗úp ─æß╗ông lao ─æß╗Öng",
                        "Thu hß╗ôi v─⌐nh viß╗àn quyß╗ün truy cß║¡p",
                        "Thay ─æß╗òi nh├ón sß╗▒ ph├▓ng ban",
                        "Kh├íc"
                      ];
                    }
                  } else {
                    return [
                      "Gian lß║¡n thanh to├ín",
                      "Spam tin nhß║»n / dß╗▒ ├ín",
                      "─É─âng nß╗Öi dung phß║ún cß║úm",
                      "Lß╗½a ─æß║úo chiß║┐m ─æoß║ít t├ái sß║ún",
                      "Vi phß║ím ─æiß╗üu khoß║ún dß╗ïch vß╗Ñ",
                      "Kh├íc"
                    ];
                  }
                })().map(reason => (
                  <button
                    key={reason}
                    onClick={() => {
                      if (banReasons.includes(reason)) {
                        setBanReasons(banReasons.filter(r => r !== reason));
                      } else {
                        setBanReasons([...banReasons, reason]);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-full text-[11.5px] font-bold transition-all duration-200 ${
                      banReasons.includes(reason)
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 scale-105'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase block mb-2">M├â PIN X├üC NHß║¼N Cß╗ªA ADMIN</label>
              <input 
                type="text" 
                style={{ WebkitTextSecurity: 'disc' }}
                autoComplete="new-password"
                placeholder="Nhß║¡p m├ú PIN gß╗ôm 6 sß╗æ" 
                maxLength={6}
                className="w-full border border-slate-200 rounded-xl p-3 text-body-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-mono tracking-[0.2em]"
                value={adminPin}
                onChange={e => setAdminPin(e.target.value)}
              />
            </div>

            <div className="flex gap-3 justify-end pt-3">
              <button 
                onClick={() => { setActiveUserForAction(null); setBanReasons([]); setAdminPin(''); }}
                className="border border-slate-200 text-slate-600 px-5 py-2.5 rounded-xl font-bold text-body-sm hover:bg-slate-100 transition-all duration-200 active:scale-95"
              >
                Cancel
              </button>
              <button 
                disabled={banReasons.length === 0 || !adminPin.trim()}
                onClick={() => handleUserStatusChange(activeUserForAction?.id, activeUserForAction?.role, actionType === 'lock' ? 'LOCKED' : actionType === 'delete_gmail' ? 'DELETED' : 'BANNED')}
                className={`px-6 py-2.5 rounded-xl font-bold text-body-sm text-white transition-all duration-300 ${
                  actionType === 'lock'
                    ? (banReasons.length === 0 || !adminPin.trim() ? 'bg-amber-400 cursor-not-allowed opacity-70' : 'bg-amber-600 hover:bg-amber-700 shadow-md shadow-amber-600/10 hover:shadow-amber-600/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-95')
                    : (banReasons.length === 0 || !adminPin.trim() ? 'bg-rose-400 cursor-not-allowed opacity-70' : 'bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/10 hover:shadow-rose-600/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-95')
                }`}
              >
                Confirm {actionType === 'lock' ? 'Suspend' : actionType === 'delete_gmail' ? 'Delete' : 'Ban'}
              </button>
            </div>
          </div>
        </div>
      </div>

      
      <div className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 transition-all duration-300 ease-in-out ${showCreateModal ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
        <div className={`bg-white rounded-3xl w-full max-w-lg shadow-2xl border-t-[6px] border-blue-600 overflow-visible transition-all duration-300 ease-out transform ${
          showCreateModal ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        }`}>
          <div className="p-6 border-b flex justify-between items-center bg-blue-50/30 border-blue-100 rounded-t-3xl">
            <h4 className="font-bold text-lg flex items-center gap-2 text-blue-800">
              + Mß╗¥i Nh├ón Sß╗▒ Quß║ún Trß╗ï / Vß║¡n H├ánh
            </h4>
            <button 
              onClick={() => setShowCreateModal(false)}
              className="p-2 rounded-full transition-all duration-200 hover:rotate-90 active:scale-95 text-blue-500 hover:text-blue-700 hover:bg-blue-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleCreateUser} className="p-6 space-y-4">
            
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase block mb-2">Vai Tr├▓ T├ái Khoß║ún</label>
              <div className="radio-inputs" style={{ width: '100%' }}>
                <label className="radio">
                  <input 
                    type="radio" 
                    name="createRoleTab" 
                    checked={createRole === 'MANAGER'}
                    onChange={() => setCreateRole('MANAGER')}
                  />
                  <span className="name">Manager (Quß║ún L├╜)</span>
                </label>
                <label className="radio">
                  <input 
                    type="radio" 
                    name="createRoleTab" 
                    checked={createRole === 'STAFF'}
                    onChange={() => setCreateRole('STAFF')}
                  />
                  <span className="name">Staff (Nh├ón Vi├¬n)</span>
                </label>
              </div>
            </div>

            
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Email Ng╞░ß╗¥i Nhß║¡n Lß╗¥i Mß╗¥i <span className="text-rose-500">*</span></label>
              <input 
                type="email" 
                required
                autoComplete="one-time-code"
                placeholder="nhap@lancerpro.com" 
                className="w-full border border-slate-200 rounded-xl p-3 text-body-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                value={createForm.email}
                onChange={e => setCreateForm({ ...createForm, email: e.target.value })}
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Hß╗ç thß╗æng sß║╜ gß╗¡i email tß╗▒ ─æß╗Öng k├¿m li├¬n kß║┐t k├¡ch hoß║ít. Ng╞░ß╗¥i nhß║¡n sß║╜ tß╗▒ ─æß║╖t mß║¡t khß║⌐u cß╗ºa ri├¬ng hß╗ì.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Hß╗ì v├á T├¬n <span className="text-rose-500">*</span></label>
                <input 
                  type="text" 
                  required
                  placeholder="Nguyß╗àn V─ân A" 
                  className="w-full border border-slate-300 p-2 text-sm outline-none focus:border-slate-400"
                  value={createForm.fullName}
                  onChange={e => setCreateForm({ ...createForm, fullName: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">T├¬n Hiß╗ân Thß╗ï <span className="text-rose-500">*</span></label>
                <input 
                  type="text" 
                  required
                  placeholder="Nguyen A" 
                  className="w-full border border-slate-300 p-2 text-sm outline-none focus:border-slate-400"
                  value={createForm.displayName}
                  onChange={e => setCreateForm({ ...createForm, displayName: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Sß╗æ ─æiß╗çn thoß║íi <span className="text-rose-500">*</span></label>
                <input 
                  type="text" 
                  required
                  placeholder="0912345678" 
                  className="w-full border border-slate-300 p-2 text-sm outline-none focus:border-slate-400"
                  value={createForm.phone}
                  onChange={e => setCreateForm({ ...createForm, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Sß╗æ CCCD / CMND <span className="text-rose-500">*</span></label>
                <input 
                  type="text" 
                  required
                  placeholder="001012345678" 
                  className="w-full border border-slate-300 p-2 text-sm outline-none focus:border-slate-400"
                  value={createForm.citizenId}
                  onChange={e => setCreateForm({ ...createForm, citizenId: e.target.value })}
                />
              </div>
            </div>

            
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase block mb-2">Khoa / Ph├▓ng Ban <span className="text-rose-500">*</span></label>
              <div className="dept-wrapper relative w-full">
                {(() => {
                  const selectedDept = departmentsList.find(d => String(d.departmentId) === String(createForm.departmentId));
                  return (
                    <>
                      <div className={`dept-main ${selectedDept ? 'selected-active' : ''}`}>
                        <span className="text-body-sm font-semibold truncate">
                          {selectedDept ? `${selectedDept.name} (${selectedDept.code})` : '-- Chß╗ìn Khoa/Ph├▓ng Ban --'}
                        </span>
                        <div className="dept-bar">
                          <span className="top dept-bar-list dept-top" />
                          <span className="middle dept-bar-list dept-middle" />
                          <span className="bottom dept-bar-list dept-bottom" />
                        </div>
                      </div>

                      <div className="dept-menu-container">
                        <div className="dept-scroll-wrapper">
                          
                          {departmentsList.length > 4 && (
                            <div className="dept-scroll-fade-top" id="deptScrollTop">
                              <svg className="dept-scroll-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                            </div>
                          )}
                          <div
                            className="max-h-[240px] overflow-y-auto overscroll-contain pr-1 space-y-2 no-scrollbar"
                            id="deptScrollList"
                            onScroll={(e) => {
                              const el = e.target;
                              const topIndicator = document.getElementById('deptScrollTop');
                              const bottomIndicator = document.getElementById('deptScrollBottom');
                              if (topIndicator) {
                                topIndicator.classList.toggle('visible', el.scrollTop > 8);
                              }
                              if (bottomIndicator) {
                                bottomIndicator.classList.toggle('visible', el.scrollTop + el.clientHeight < el.scrollHeight - 8);
                              }
                            }}
                            ref={(el) => {
                              if (el) {
                                requestAnimationFrame(() => {
                                  const bottomIndicator = document.getElementById('deptScrollBottom');
                                  if (bottomIndicator && el.scrollHeight > el.clientHeight) {
                                    bottomIndicator.classList.add('visible');
                                  }
                                });
                              }
                            }}
                          >
                            {departmentsList.map((d, index) => {
                              const isSelected = String(createForm.departmentId) === String(d.departmentId);
                              return (
                                <div key={d.departmentId} className="dept-item-list">
                                  <label
                                    className={`dept-radio-label ${isSelected ? 'dept-selected' : ''}`}
                                    onClick={() => setCreateForm({ ...createForm, departmentId: d.departmentId })}
                                  >
                                    <input type="radio" name="deptPick" className="dept-radio-input" checked={isSelected} readOnly />
                                    <span className="dept-radio-custom" />
                                    <span className="dept-radio-text">{d.name}</span>
                                    <span className="dept-radio-code">{d.code}</span>
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                          
                          {departmentsList.length > 4 && (
                            <div className="dept-scroll-fade-bottom" id="deptScrollBottom">
                              <svg className="dept-scroll-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>



            
            <div className="flex gap-3 justify-end pt-3">
              <button 
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="border border-slate-200 text-slate-650 px-5 py-2.5 rounded-xl font-bold text-body-sm hover:bg-slate-100 transition-all duration-200 active:scale-95"
              >
                Hß╗ºy
              </button>
              <button 
                type="submit"
                disabled={isLoading}
                className={`bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-body-sm shadow-md transition-all duration-300 flex items-center justify-center gap-2 ${
                  isLoading 
                    ? 'opacity-60 cursor-not-allowed' 
                    : 'shadow-blue-600/10 hover:shadow-blue-600/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-95'
                }`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    ─Éang gß╗¡i...
                  </>
                ) : (
                  'Gß╗¡i lß╗¥i mß╗¥i'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      
      <div className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1001] flex items-center justify-center p-4 transition-all duration-300 ease-in-out ${createdCredentials ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
        <div className={`bg-white rounded-3xl w-full max-w-md shadow-2xl border-t-[6px] border-emerald-500 overflow-hidden transition-all duration-300 ease-out transform ${
          createdCredentials ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        }`}>
          <div className="p-6 border-b flex justify-between items-center bg-emerald-50/30 border-emerald-100 rounded-t-3xl">
            <h4 className="font-bold text-lg flex items-center gap-2 text-emerald-800">
              <CheckCircle2 className="w-5 h-5" /> Th├┤ng Tin T├ái Khoß║ún Nh├ón Sß╗▒
            </h4>
            <button 
              onClick={() => setCreatedCredentials(null)}
              className="p-2 rounded-full transition-all duration-200 hover:rotate-90 active:scale-95 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {createdCredentials && (
            <div className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="text-[11px] font-extrabold text-amber-700 uppercase">Chß╗ë d├ánh cho Admin</span>
                </div>
                <p className="text-[12px] text-amber-700 leading-relaxed">
                  Mß║¡t khß║⌐u n├áy <strong>kh├┤ng ─æ╞░ß╗úc gß╗¡i tß╗▒ ─æß╗Öng</strong> d╞░ß╗¢i dß║íng v─ân bß║ún thuß║ºn cho ng╞░ß╗¥i ─æ╞░ß╗úc mß╗¥i. Admin sß╗¡ dß╗Ñng th├┤ng tin n├áy ─æß╗â quß║ún l├╜, hoß║╖c cung cß║Ñp/sao ch├⌐p li├¬n kß║┐t k├¡ch hoß║ít b├¬n d╞░ß╗¢i cho ng╞░ß╗¥i d├╣ng tß╗▒ thiß║┐t lß║¡p.
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-200">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Vai tr├▓</span>
                    <span className="font-bold text-slate-800 text-body-sm">{createdCredentials.role === 'MANAGER' ? 'Manager (Quß║ún L├╜)' : 'Staff (Nh├ón Vi├¬n)'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Trß║íng th├íi</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                      createdCredentials.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      createdCredentials.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      createdCredentials.status === 'EXPIRED' ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse' :
                      'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                      {createdCredentials.status === 'PENDING' ? 'CHß╗£ K├ìCH HOß║áT' : 
                       createdCredentials.status === 'ACCEPTED' ? '─É├â THIß║╛T Lß║¼P' : 
                       createdCredentials.status === 'EXPIRED' ? 'Hß║╛T Hß║áN (Cß║ªN GIA Hß║áN)' : 
                       createdCredentials.status}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Ph├▓ng ban</span>
                  <span className="font-bold text-slate-800 text-body-sm">{createdCredentials.department || 'Ch╞░a ph├ón bß╗ò'}</span>
                </div>
                <hr className="border-slate-200" />
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">T├ái khoß║ún (Email)</span>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="bg-white border border-slate-300 px-3 py-1.5 rounded-lg text-body-sm font-mono font-bold text-blue-700 flex-grow overflow-x-auto">{createdCredentials.email}</code>
                    <button
                      type="button"
                      onClick={() => { navigator.clipboard.writeText(createdCredentials.email); showToast('─É├ú sao ch├⌐p email!', 'success'); }}
                      className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[11px] font-bold hover:bg-blue-100 transition-all active:scale-95"
                    >Copy</button>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    {createdCredentials.status === 'ACCEPTED' ? 'Mß║¡t khß║⌐u hiß╗çn tß║íi (tß╗▒ sinh)' : 'Mß║¡t khß║⌐u tß║ím thß╗¥i'}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="bg-white border border-slate-300 px-3 py-1.5 rounded-lg text-body-sm font-mono font-bold text-rose-600 flex-grow tracking-wider overflow-x-auto">
                      {createdCredentials.password || '(Trß╗æng/─É├ú thay ─æß╗òi)'}
                    </code>
                    <button
                      type="button"
                      onClick={() => { 
                        if (createdCredentials.password) {
                          navigator.clipboard.writeText(createdCredentials.password); 
                          showToast('─É├ú sao ch├⌐p mß║¡t khß║⌐u!', 'success'); 
                        } else {
                          showToast('Mß║¡t khß║⌐u trß╗æng!', 'error');
                        }
                      }}
                      className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-[11px] font-bold hover:bg-rose-100 transition-all active:scale-95"
                    >Copy</button>
                  </div>
                </div>

                {createdCredentials.status === 'EXPIRED' && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-800 text-[11.5px] font-semibold leading-relaxed">
                   <strong>Li├¬n kß║┐t mß╗¥i ─æ├ú hß║┐t hß║ín!</strong> Ng╞░ß╗¥i d├╣ng kh├┤ng thß╗â k├¡ch hoß║ít t├ái khoß║ún bß║▒ng li├¬n kß║┐t n├áy nß╗»a. Thß╗▒c hiß╗çn <strong>"Cß║Ñp lß║íi mß║¡t khß║⌐u mß╗¢i"</strong> ph├¡a d╞░ß╗¢i ─æß╗â <strong>tß║ío li├¬n kß║┐t mß╗¥i mß╗¢i ho├án to├án</strong> (v├┤ hiß╗çu h├│a li├¬n kß║┐t c┼⌐) v├á gia hß║ín th├¬m 24 giß╗¥.
                  </div>
                )}

                {createdCredentials.setupLink && createdCredentials.status === 'PENDING' && (
                  <>
                    <hr className="border-slate-200" />
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Li├¬n kß║┐t thiß║┐t lß║¡p t├ái khoß║ún</span>
                      <div className="flex items-center gap-2 mt-1">
                        <input 
                          type="text"
                          readOnly 
                          value={createdCredentials.setupLink}
                          className="bg-white border border-slate-300 px-3 py-1.5 rounded-lg text-[11px] font-mono text-indigo-700 flex-grow overflow-ellipsis whitespace-nowrap"
                        />
                        <button
                          type="button"
                          onClick={() => { 
                            navigator.clipboard.writeText(createdCredentials.setupLink); 
                            showToast('─É├ú sao ch├⌐p li├¬n kß║┐t k├¡ch hoß║ít!', 'success'); 
                          }}
                          className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[11px] font-bold hover:bg-indigo-100 transition-all active:scale-95 whitespace-nowrap"
                        >Copy Link</button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleRegeneratePassword(createdCredentials.role, createdCredentials.userId)}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl font-bold text-xs shadow-md transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 flex items-center justify-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Cß║Ñp lß║íi mß║¡t khß║⌐u mß╗¢i
                </button>
                <button
                  type="button"
                  onClick={() => setCreatedCredentials(null)}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-md transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
                >
                  ─É├│ng
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {}
      
      <div className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 transition-all duration-300 ease-in-out ${showTransferModal ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
        <div className={`bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden transition-all duration-300 ease-out transform ${showTransferModal ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}`}>
          <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h4 className="font-bold text-primary text-lg flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-indigo-650" /> ─Éiß╗üu Chuyß╗ân Ph├▓ng Ban
            </h4>
            <button 
              onClick={() => setShowTransferModal(false)}
              className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-200 transition-all duration-200 hover:rotate-90 active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {transferTargetMember && (
            <form onSubmit={handleExecuteTransfer} className="p-6 space-y-4">
              <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50 space-y-2">
                <div>
                  <label className="text-[10px] font-bold text-indigo-500 uppercase block">Nh├ón vi├¬n cß║ºn chuyß╗ân</label>
                  <span className="font-bold text-slate-800 text-body-sm">{transferTargetMember.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-indigo-500 uppercase block">Vai tr├▓</label>
                    <span className="font-semibold text-slate-600 text-body-xs">{transferTargetMember.role}</span>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-indigo-500 uppercase block">Khoa hiß╗çn tß║íi</label>
                    <span className="font-bold text-slate-700 text-body-xs">
                      {departmentsList.find(d => d.departmentId === transferTargetMember.departmentId)?.name || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Chß╗ìn khoa / ph├▓ng ban ─æ├¡ch <span className="text-rose-500">*</span></label>
                <select 
                  required
                  className="w-full border border-slate-200 rounded-xl p-3 text-body-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-semibold"
                  value={transferForm.toDepartmentId}
                  onChange={e => setTransferForm({ ...transferForm, toDepartmentId: e.target.value })}
                >
                  {departmentsList
                    .filter(d => d.departmentId !== transferTargetMember.departmentId)
                    .map(d => (
                      <option key={d.departmentId} value={d.departmentId}>
                        {d.code} - {d.name}
                      </option>
                    ))
                  }
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">L├╜ do ─æiß╗üu chuyß╗ân <span className="text-rose-500">*</span></label>
                <textarea 
                  rows="3"
                  required
                  placeholder="Nhß║¡p l├╜ do ─æiß╗üu chuyß╗ân nh├ón vi├¬n n├áy..." 
                  className="w-full border border-slate-200 rounded-xl p-3 text-body-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium resize-none"
                  value={transferForm.reason}
                  onChange={e => setTransferForm({ ...transferForm, reason: e.target.value })}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-body-sm px-5 py-3 rounded-xl flex-grow transition-all duration-300 shadow-md shadow-indigo-650/15"
                >
                  X├íc nhß║¡n ─æiß╗üu chuyß╗ân
                </button>
                <button 
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="bg-white border border-slate-200 text-slate-650 hover:bg-slate-50 font-bold text-body-sm px-5 py-3 rounded-xl transition-all"
                >
                  Hß╗ºy
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      
      <div className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 transition-all duration-300 ease-in-out ${showSignoffModal ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
        <div className={`bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden transition-all duration-300 ease-out transform ${showSignoffModal ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}`}>
          <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h4 className="font-bold text-primary text-lg flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-indigo-650" /> K├╜ Duyß╗çt T├íc Vß╗Ñ Li├¬n Khoa
            </h4>
            <button 
              onClick={() => setShowSignoffModal(false)}
              className="text-slate-400 hover:text-slate-650 p-2 rounded-full hover:bg-slate-200 transition-all duration-200 hover:rotate-90 active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {selectedVerificationTask && (
            <form onSubmit={handleSubmitTaskSignoff} className="p-6 space-y-4">
              <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50 space-y-1">
                <p className="text-[11px] font-extrabold text-indigo-700 uppercase">Th├┤ng tin t├íc vß╗Ñ gß╗æc</p>
                <h5 className="font-bold text-slate-800 text-body-sm">{selectedVerificationTask.title}</h5>
                <p className="text-[12px] text-slate-500 leading-relaxed">{selectedVerificationTask.description}</p>
                <div className="text-[11px] font-mono text-slate-400 pt-1">
                  ID: #{selectedVerificationTask.taskId} | Loß║íi: {selectedVerificationTask.taskType}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Khoa thß╗▒c hiß╗çn k├╜ duyß╗çt <span className="text-rose-500">*</span></label>
                <select 
                  className="w-full border border-slate-200 rounded-xl p-3 text-body-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                  value={signoffForm.departmentCode}
                  onChange={e => setSignoffForm({ ...signoffForm, departmentCode: e.target.value })}
                >
                  <option value="FIN">Ph├▓ng T├ái ch├¡nh (Finance - FIN)</option>
                  <option value="MOD">Ph├▓ng Kiß╗âm duyß╗çt (Moderation - MOD)</option>
                  <option value="DIS">Ph├▓ng Tranh chß║Ñp (Dispute Resolution - DIS)</option>
                  <option value="CS">Ph├▓ng Hß╗ù trß╗ú (Customer Support - CS)</option>
                  <option value="IT">Ph├▓ng Kß╗╣ thuß║¡t (IT & Development - IT)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Quyß║┐t ─æß╗ïnh kiß╗âm chß╗⌐ng <span className="text-rose-500">*</span></label>
                <select 
                  className="w-full border border-slate-200 rounded-xl p-3 text-body-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                  value={signoffForm.status}
                  onChange={e => setSignoffForm({ ...signoffForm, status: e.target.value })}
                >
                  <option value="APPROVED">Chß║Ñp thuß║¡n (APPROVED)</option>
                  <option value="REJECTED">Tß╗½ chß╗æi & Hß╗ºy t├íc vß╗Ñ (REJECTED)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Ghi ch├║ kiß╗âm duyß╗çt</label>
                <textarea 
                  rows="3"
                  placeholder="Ghi r├╡ l├╜ do ph├¬ duyß╗çt hoß║╖c tß╗½ chß╗æi ─æß╗â l╞░u v├áo hß╗ç thß╗æng..." 
                  className="w-full border border-slate-200 rounded-xl p-3 text-body-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium resize-none"
                  value={signoffForm.note}
                  onChange={e => setSignoffForm({ ...signoffForm, note: e.target.value })}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-body-sm px-5 py-3 rounded-xl flex-grow transition-all duration-300 shadow-md shadow-indigo-650/15"
                >
                  X├íc nhß║¡n K├╜ duyß╗çt
                </button>
                <button 
                  type="button"
                  onClick={() => setShowSignoffModal(false)}
                  className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-body-sm px-5 py-3 rounded-xl transition-all"
                >
                  Hß╗ºy
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* VNPay Confirmation Modal */}
      <div className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 transition-all duration-300 ease-in-out ${showVnpayConfirmModal ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
        <div className={`bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl transition-all duration-300 ${
          showVnpayConfirmModal ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        }`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">X├íc nhß║¡n L╞░u Cß║Ñu H├¼nh</h3>
              <p className="text-body-sm text-slate-500">Thao t├íc n├áy ß║únh h╞░ß╗ƒng ─æß║┐n to├án hß╗ç thß╗æng</p>
            </div>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-2xl mb-6">
            <p className="text-body-sm text-slate-600 leading-relaxed">
              Bß║ín c├│ chß║»c chß║»n muß╗æn l╞░u c├íc thay ─æß╗òi tham sß╗æ VNPay n├áy kh├┤ng? Viß╗çc sai lß╗çch th├┤ng tin <span className="font-bold text-slate-800">Terminal Code</span> hoß║╖c <span className="font-bold text-slate-800">Hash Secret</span> c├│ thß╗â l├ám gi├ín ─æoß║ín hß╗ç thß╗æng thanh to├ín cß╗ºa hß╗ç thß╗æng.
            </p>
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <button 
              type="button"
              onClick={() => setShowVnpayConfirmModal(false)}
              className="border border-slate-200 text-slate-650 px-5 py-2.5 rounded-xl font-bold text-body-sm hover:bg-slate-100 transition-all duration-200 active:scale-95"
            >
              Hß╗ºy
            </button>
            <button 
              type="button"
              onClick={confirmSaveVnpayConfig}
              className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-xl font-bold text-body-sm shadow-md shadow-amber-500/20 transition-all duration-200 active:scale-95"
            >
              X├íc nhß║¡n L╞░u
            </button>
          </div>
        </div>
      </div>

      {/* VNPay Edit Confirmation Modal */}
      <div className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 transition-all duration-300 ease-in-out ${showVnpayEditConfirmModal ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
        <div className={`bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl transition-all duration-300 ${
          showVnpayEditConfirmModal ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        }`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Mß╗ƒ kh├│a Cß║Ñu H├¼nh</h3>
              <p className="text-body-sm text-slate-500">Thao t├íc n├áy cho ph├⌐p chß╗ënh sß╗¡a tham sß╗æ</p>
            </div>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-2xl mb-6">
            <p className="text-body-sm text-slate-600 leading-relaxed">
              Bß║ín c├│ chß║»c chß║»n muß╗æn mß╗ƒ kh├│a v├á chß╗ënh sß╗¡a cß║Ñu h├¼nh kß║┐t nß╗æi VNPay kh├┤ng? Vui l├▓ng cß║⌐n thß║¡n khi thay ─æß╗òi c├íc th├┤ng sß╗æ kß║┐t nß╗æi thanh to├ín cß╗ºa hß╗ç thß╗æng.
            </p>
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <button 
              type="button"
              onClick={() => setShowVnpayEditConfirmModal(false)}
              className="border border-slate-200 text-slate-650 px-5 py-2.5 rounded-xl font-bold text-body-sm hover:bg-slate-100 transition-all duration-200 active:scale-95"
            >
              Hß╗ºy
            </button>
            <button 
              type="button"
              onClick={confirmStartEditVnpay}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-body-sm shadow-md shadow-blue-600/20 transition-all duration-200 active:scale-95"
            >
              X├íc nhß║¡n Chß╗ënh sß╗¡a
            </button>
          </div>
        </div>
      </div>
              {/* VietQR Zoom Modal */}
      <div className={`fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 transition-all duration-300 ease-in-out ${showQrZoomModal ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
        <div className={`bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl transition-all duration-300 flex flex-col items-center relative ${
          showQrZoomModal ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        }`}>
          <button 
            type="button"
            onClick={() => setShowQrZoomModal(false)}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 shrink-0 transition-all p-1.5 hover:bg-slate-100 rounded-full active:scale-95"
            title="─É├│ng"
          >
            <X className="w-5 h-5" />
          </button>
          
          {(() => {
            const currentAmount = isEditingPackages 
              ? (tempPackages.find(p => p.packageType === testPackageType)?.price || 0) 
              : (servicePackages?.find(p => p.packageType === testPackageType)?.price || 0);
            
            return (
              <>
                <div className="text-center w-full pb-3 border-b border-slate-100 mb-5">
                  <h3 className="font-bold text-slate-800 text-lg">M├ú VietQR Thß╗¡ Nghiß╗çm ({testPackageType})</h3>
                  <p className="text-body-sm text-slate-500">{vnpayConfig.bankAccountName || 'Ch╞░a c├│ t├¬n'}</p>
                  <p className="text-body-xs font-mono text-slate-400 mt-0.5">{vnpayConfig.bankName} - {vnpayConfig.bankAccountNo}</p>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-150 inline-block shadow-lg">
                  <img 
                    src={`https://img.vietqr.io/image/${vnpayConfig.bankName}-${vnpayConfig.bankAccountNo}-compact2.png?amount=${currentAmount}&addInfo=TEST_VERIFY_${testPackageType}&accountName=${encodeURIComponent(vnpayConfig.bankAccountName || '')}`} 
                    alt="VietQR Zoomed Preview" 
                    className="w-96 h-96 object-contain mx-auto"
                  />
                </div>

                <div className="mt-5 text-center text-body-xs text-slate-450 leading-relaxed max-w-sm">
                  Qu├⌐t m├ú tr├¬n bß║▒ng ß╗⌐ng dß╗Ñng Ng├ón h├áng cß╗ºa bß║ín ─æß╗â kiß╗âm tra t├ái khoß║ún thß╗Ñ h╞░ß╗ƒng. Sß╗æ tiß╗ün thanh to├ín: <span className="font-bold text-slate-700 text-[14px]">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(currentAmount)}</span>.
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* Invoice Preview Modal */}
      <div className={`fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 transition-all duration-300 ease-in-out ${showInvoicePreviewModal ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
        <div className={`bg-white rounded-xl w-full max-w-4xl p-0 shadow-2xl transition-all duration-300 flex flex-col relative ${
          showInvoicePreviewModal ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        }`}>
          <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-slate-50 rounded-t-xl">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-rose-600"/> Mß║½u H├│a ─É╞ín ─Éiß╗çn Tß╗¡ (MISA Simulation)</h3>
            <button 
              type="button"
              onClick={() => setShowInvoicePreviewModal(false)}
              className="text-slate-400 hover:text-slate-700 shrink-0 transition-all p-1.5 hover:bg-slate-200 rounded-full active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-8 overflow-y-auto max-h-[80vh] bg-white">
            {(() => {
              const currentAmount = isEditingPackages 
                ? (tempPackages.find(p => p.packageType === testPackageType)?.price || 0) 
                : (servicePackages?.find(p => p.packageType === testPackageType)?.price || 0);
              
              // Giß║ú ─æß╗ïnh gi├í trß╗ï hiß╗çn tß║íi l├á ─É├â BAO Gß╗ÆM VAT 8% hoß║╖c VAT l├á ri├¬ng biß╗çt. 
              // Trong b├ái to├ín n├áy, ta t├¡nh VAT 8% t├ích tß╗½ Tß╗òng tiß╗ün thanh to├ín (th╞░ß╗¥ng gi├í b├ín = Gi├í tr╞░ß╗¢c thuß║┐ + VAT)
              // V├¡ dß╗Ñ tß╗òng tiß╗ün 50.000 => Gi├í tr╞░ß╗¢c thuß║┐ = 50.000 / 1.08
              const taxRate = 0.08;
              const preTaxAmount = Math.round(currentAmount / (1 + taxRate));
              const taxAmount = currentAmount - preTaxAmount;
              
              const formatVND = (val) => new Intl.NumberFormat('vi-VN').format(val);

              return (
                <div className="border border-red-500 p-8 rounded-md mx-auto relative font-sans text-slate-900 max-w-3xl" style={{backgroundImage: 'radial-gradient(#fecaca 1px, transparent 1px)', backgroundSize: '20px 20px', backgroundColor: 'white'}}>
                  
                  {/* Watermark fake */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                    <span className="text-[120px] font-bold text-red-500 transform -rotate-45">Mß║¬U</span>
                  </div>

                  {/* Header H├│a ─æ╞ín */}
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-1/3">
                      <div className="w-24 h-24 bg-red-50 border-2 border-red-200 flex items-center justify-center text-red-500 font-bold mb-2">
                        LOGO
                      </div>
                    </div>
                    <div className="w-1/3 text-center">
                      <h2 className="text-xl font-bold text-red-600 mb-1">H├ôA ─É╞áN GI├ü TRß╗è GIA T─éNG</h2>
                      <p className="text-sm italic text-slate-600">(Bß║ún thß╗â hiß╗çn cß╗ºa h├│a ─æ╞ín ─æiß╗çn tß╗¡)</p>
                      <p className="text-sm text-slate-800 mt-2">Ng├áy 14 th├íng 07 n─âm 2026</p>
                    </div>
                    <div className="w-1/3 text-right text-sm">
                      <p>Mß║½u sß╗æ: <span className="font-semibold">1</span></p>
                      <p>K├╜ hiß╗çu: <span className="font-semibold">C26TMA</span></p>
                      <p>Sß╗æ: <span className="font-bold text-red-600 text-lg">0001234</span></p>
                    </div>
                  </div>

                  <hr className="border-t-2 border-red-500 mb-6" />

                  {/* Seller Info */}
                  <div className="mb-6 space-y-1 text-sm">
                    <p><span className="font-semibold">─É╞ín vß╗ï b├ín h├áng:</span> C├öNG TY TNHH LANCERPRO VIß╗åT NAM</p>
                    <p><span className="font-semibold">M├ú sß╗æ thuß║┐:</span> 0101234567</p>
                    <p><span className="font-semibold">─Éß╗ïa chß╗ë:</span> Tß║ºng 3, T├▓a nh├á FPT, Khu CNC H├▓a Lß║íc, Thß║ích Thß║Ñt, H├á Nß╗Öi</p>
                    <p><span className="font-semibold">─Éiß╗çn thoß║íi:</span> 024.1234.5678 <span className="ml-8 font-semibold">Sß╗æ t├ái khoß║ún:</span> {vnpayConfig.bankAccountNo} ({vnpayConfig.bankName})</p>
                  </div>

                  <hr className="border-t border-dashed border-red-300 mb-6" />

                  {/* Buyer Info */}
                  <div className="mb-6 space-y-1 text-sm">
                    <p><span className="font-semibold">Hß╗ì t├¬n ng╞░ß╗¥i mua h├áng:</span> NGUYß╗äN V─éN A</p>
                    <p><span className="font-semibold">T├¬n ─æ╞ín vß╗ï:</span> C├öNG TY TNHH DEMO KH├üCH H├ÇNG</p>
                    <p><span className="font-semibold">M├ú sß╗æ thuß║┐:</span> 0109876543</p>
                    <p><span className="font-semibold">─Éß╗ïa chß╗ë:</span> Quß║¡n 1, Th├ánh phß╗æ Hß╗ô Ch├¡ Minh</p>
                    <p><span className="font-semibold">H├¼nh thß╗⌐c thanh to├ín:</span> Chuyß╗ân khoß║ún (VietQR)</p>
                  </div>

                  {/* Table */}
                  <table className="w-full border-collapse border border-red-500 text-sm mb-4">
                    <thead>
                      <tr className="bg-red-50 font-semibold text-center">
                        <td className="border border-red-500 p-2">STT</td>
                        <td className="border border-red-500 p-2">T├¬n H├áng H├│a, Dß╗ïch vß╗Ñ</td>
                        <td className="border border-red-500 p-2">─ÉVT</td>
                        <td className="border border-red-500 p-2">Sß╗æ l╞░ß╗úng</td>
                        <td className="border border-red-500 p-2">─É╞ín gi├í</td>
                        <td className="border border-red-500 p-2">Th├ánh tiß╗ün</td>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-red-500 p-2 text-center">1</td>
                        <td className="border border-red-500 p-2 font-medium">G├│i dß╗ïch vß╗Ñ ─æ─âng tin tuyß╗ân dß╗Ñng {testPackageType}</td>
                        <td className="border border-red-500 p-2 text-center">G├│i</td>
                        <td className="border border-red-500 p-2 text-center">1</td>
                        <td className="border border-red-500 p-2 text-right">{formatVND(preTaxAmount)}</td>
                        <td className="border border-red-500 p-2 text-right font-semibold">{formatVND(preTaxAmount)}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Totals */}
                  <div className="flex justify-end mb-6 text-sm">
                    <div className="w-1/2 space-y-2">
                      <div className="flex justify-between">
                        <span>Cß╗Öng tiß╗ün h├áng:</span>
                        <span className="font-semibold">{formatVND(preTaxAmount)} ─æ</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Thuß║┐ suß║Ñt GTGT (8%):</span>
                        <span className="font-semibold">{formatVND(taxAmount)} ─æ</span>
                      </div>
                      <div className="flex justify-between text-base font-bold text-red-600 mt-2 border-t border-red-200 pt-2">
                        <span>Tß╗òng cß╗Öng tiß╗ün thanh to├ín:</span>
                        <span>{formatVND(currentAmount)} ─æ</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex justify-between text-center pt-8 mb-4 text-sm">
                    <div className="w-1/3">
                      <p className="font-semibold">Ng╞░ß╗¥i mua h├áng</p>
                      <p className="italic text-slate-500 text-xs">(K├╜, ghi r├╡ hß╗ì t├¬n)</p>
                    </div>
                    <div className="w-1/3">
                      <p className="font-semibold">Ng╞░ß╗¥i b├ín h├áng</p>
                      <p className="italic text-slate-500 text-xs">(K├╜, ghi r├╡ hß╗ì t├¬n)</p>
                      <div className="mt-8 border-2 border-red-500 text-red-500 font-bold p-2 inline-block rounded-md rotate-[-5deg]">
                        ─É├â K├¥ ─ÉIß╗åN Tß╗¼
                      </div>
                    </div>
                  </div>
                  
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* VNPay Refund Modal */}
      <div className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 transition-all duration-300 ease-in-out ${showRefundModal ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
        <div className={`bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl transition-all duration-300 ${
          showRefundModal ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        }`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center shrink-0">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Ho├án tiß╗ün Giao dß╗ïch</h3>
              <p className="text-body-sm text-slate-500">#{refundTxn?.vnpTransactionNo}</p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-body-sm font-bold text-slate-700 mb-1">Sß╗æ tiß╗ün ho├án (VND)</label>
              <input
                type="number"
                value={refundAmount}
                onChange={e => setRefundAmount(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-body-sm font-bold text-slate-700 mb-1">L├╜ do ho├án tiß╗ün</label>
              <textarea
                value={refundReason}
                onChange={e => setRefundReason(e.target.value)}
                placeholder="Nhß║¡p l├╜ do ho├án tiß╗ün..."
                rows="3"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 resize-none"
              ></textarea>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button 
              type="button"
              onClick={handleCloseRefundModal}
              disabled={isRefunding}
              className="border border-slate-200 text-slate-650 px-5 py-2.5 rounded-xl font-bold text-body-sm hover:bg-slate-100 transition-all duration-200 active:scale-95 disabled:opacity-50"
            >
              Hß╗ºy
            </button>
            <button 
              type="button"
              onClick={handleRefundSubmit}
              disabled={isRefunding}
              className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-xl font-bold text-body-sm shadow-md shadow-amber-500/20 transition-all duration-200 active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              {isRefunding && <RefreshCw className="w-4 h-4 animate-spin" />}
              {isRefunding ? '─Éang gß╗¡i...' : 'X├íc nhß║¡n'}
            </button>
          </div>
        </div>
      </div>


      {/* TRANSACTION DETAILS MODAL */}
      <div className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 transition-all duration-300 ease-in-out ${selectedTxnDetails ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
        <div className={`bg-white rounded-3xl w-full max-w-md p-5 shadow-2xl transition-all duration-300 ${
          selectedTxnDetails ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        }`}>
          <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-3">
            <div className="w-10 h-10 bg-slate-50 text-slate-500 rounded-full flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Chi tiß║┐t giao dß╗ïch</h3>
              <p className="text-[11px] text-slate-500">Th├┤ng tin ─æß╗æi so├ít hß╗ç thß╗æng</p>
            </div>
          </div>

          {selectedTxnDetails && (
            <div className="space-y-2 mb-5">
              <div className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-xl">
                <span className="text-xs text-slate-500 whitespace-nowrap mr-2">Cß╗òng thanh to├ín:</span>
                <span className="font-bold text-slate-700 text-sm text-right">{!String(selectedTxnDetails.txnRef || selectedTxnDetails.vnpTxnRef).includes('_') ? 'PayOS' : 'VNPAY'}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-xl">
                <span className="text-xs text-slate-500 whitespace-nowrap mr-2">M├ú tham chiß║┐u:</span>
                <span className="font-bold text-slate-700 text-sm text-right">{selectedTxnDetails.txnRef || selectedTxnDetails.vnpTxnRef}</span>
              </div>
              <div className="flex flex-col bg-slate-50 px-3 py-2 rounded-xl gap-0.5">
                <span className="text-xs text-slate-500">M├ú giao dß╗ïch NH:</span>
                <span className="font-mono font-bold text-slate-700 text-xs break-all leading-tight">
                  {selectedTxnDetails.vnpTransactionNo || 'Ch╞░a ghi nhß║¡n'}
                </span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-xl">
                <span className="text-xs text-slate-500 whitespace-nowrap mr-2">Dß╗▒ ├ín ID:</span>
                <span className="font-bold text-slate-700 text-sm text-right">{selectedTxnDetails.projectId || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-xl">
                <span className="text-xs text-slate-500">Nh├á tuyß╗ân dß╗Ñng ID:</span>
                <span className="font-bold text-slate-700 text-sm">{selectedTxnDetails.employerId}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-xl">
                <span className="text-xs text-slate-500">Sß╗æ tiß╗ün:</span>
                <span className="font-bold text-emerald-600 text-sm">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedTxnDetails.amount || 0)}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-xl">
                <span className="text-xs text-slate-500">Thß╗¥i gian tß║ío:</span>
                <span className="font-bold text-slate-700 text-sm">{selectedTxnDetails.createdAt ? new Date(selectedTxnDetails.createdAt).toLocaleString('vi-VN') : '-'}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-xl">
                <span className="text-xs text-slate-500">Trß║íng th├íi:</span>
                <span className="font-bold text-sm">
                  {selectedTxnDetails.status === 'SUCCESS' ? <span className="text-emerald-600">─É├ú thanh to├ín</span> :
                   selectedTxnDetails.status === 'FAILED' ? <span className="text-rose-600">Thß║Ñt bß║íi</span> :
                   selectedTxnDetails.status === 'REFUNDED' ? <span className="text-amber-600">─É├ú ho├án tiß╗ün</span> :
                   selectedTxnDetails.status === 'CANCELLED' ? <span className="text-slate-500">─É├ú hß╗ºy / Hß║┐t hß║ín</span> :
                   <span className="text-blue-600">─Éang xß╗¡ l├╜</span>}
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button 
              onClick={() => setSelectedTxnDetails(null)}
              className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 rounded-xl font-bold text-sm transition-all duration-200 active:scale-95"
            >
              ─É├│ng
            </button>
          </div>
        </div>
      </div>


      {payosCheckoutUrl && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000
        }}>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', textAlign: 'center', width: '900px', maxWidth: '95%', height: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: '#1a1a1a', fontSize: '20px', fontWeight: 'bold' }}>Thanh to├ín thß╗¡ nghiß╗çm PayOS</h3>
              <button onClick={handleCancelPayos} style={{ padding: '8px 15px', cursor: 'pointer', background: '#e2e8f0', color: '#333', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>
                ─É├│ng
              </button>
            </div>
            
            <div style={{ flex: 1, background: '#f8f9fa', borderRadius: '8px', overflow: 'hidden' }}>
              <iframe 
                src={payosCheckoutUrl} 
                style={{ width: '100%', height: '100%', border: 'none' }} 
                title="PayOS Checkout"
              />
            </div>
          </div>
        </div>
      )}

      <div className={`fixed top-6 right-6 z-[99999] max-w-sm w-full bg-white px-5 py-4 rounded-xl shadow-2xl border border-slate-100 flex items-center gap-4 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
        toast.visible 
          ? 'translate-x-0 opacity-100 visible' 
          : 'translate-x-12 opacity-0 invisible pointer-events-none'
      }`}>
        {}
        <div className={`absolute left-0 top-0 bottom-0 w-2 rounded-l-xl ${
          toast?.type === 'success' ? 'bg-emerald-400' : 
          toast?.type === 'warning' ? 'bg-amber-400' : 'bg-rose-400'
        }`} />
        
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
          toast?.type === 'success' ? 'bg-emerald-50 text-emerald-500' : 
          toast?.type === 'warning' ? 'bg-amber-50 text-amber-500' : 'bg-rose-50 text-rose-500'
        }`}>
          {toast?.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : 
           toast?.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />
          }
        </div>
        
        <div className="flex-grow pr-2">
          <p className={`font-bold text-[14.5px] ${
            toast?.type === 'success' ? 'text-emerald-600' : 
            toast?.type === 'warning' ? 'text-amber-600' : 'text-rose-600'
          }`}>
            {toast?.type === 'success' ? 'Th├ánh c├┤ng' : 
             toast?.type === 'warning' ? 'Cß║únh b├ío' : 'Thao t├íc thß║Ñt bß║íi'}
          </p>
          <p className="text-[13px] text-slate-500 mt-0.5 leading-relaxed">{toast?.message}</p>
        </div>
        
        <button onClick={() => setToast(prev => ({ ...prev, visible: false }))} className="text-slate-400 hover:text-slate-700 shrink-0 transition-all p-1.5 hover:bg-slate-100 rounded-full active:scale-95">
          <X className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}


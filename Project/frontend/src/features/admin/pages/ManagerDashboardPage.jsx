import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, CheckSquare, MessageSquare, ShieldAlert, UserCheck, 
  BadgeDollarSign, Gavel, FileText, Settings, Search, HelpCircle, 
  Grid, Plus, ArrowRight, ArrowUpRight, ArrowDownRight, MoreVertical, Filter, 
  Check, X, Send, Eye, ShieldCheck, AlertCircle, Clock, ChevronRight,
  TrendingUp, Activity, User, LogOut, CheckCircle2, AlertTriangle, Paperclip, XCircle,
  Users, UserPlus, Move, Zap, Calendar, Download, Edit3, Shield, ChevronDown, ArrowLeftRight, Bell
} from 'lucide-react';
import NotificationDropdown from '../components/NotificationDropdown.jsx';
import { adminApi } from '../api/adminApi.js';
import { messengerApi } from '../../messenger/api/messengerApi.js';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export default function ManagerDashboardPage({ user, onNavigateToHome, onNavigate, onLogout }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  const brandName = "FelanPro";
  const brandSub = "Manager Console";
  const currentRole = "MANAGER";
  const normalizeRole = (role) => String(role || '').toUpperCase();
  const normalizeId = (id) => String(id ?? '');
  const isCustomerMessage = (message) =>
    ['EMPLOYER', 'FREELANCER', 'CLIENT'].includes(normalizeRole(message?.senderRole));
  const isOwnSupportMessage = (message) => {
    return !isCustomerMessage(message);
  };
  const publishSupportReadReceipt = (ticketId) => {
    if (!ticketId || !stompClientRef.current?.connected) return;

    stompClientRef.current.publish({
      destination: '/app/chat.read',
      body: JSON.stringify({
        ticketId,
        readerRole: normalizeRole(currentRole),
        readerId: user?.id
      })
    });
  };
  
  
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [sectionsOpen, setSectionsOpen] = useState({
    taskManagement: true,
    moderation: true,
    finance: true,
    system: true
  });
  const toggleSection = (section) => {
    setSectionsOpen(prev => ({ ...prev, [section]: !prev[section] }));
  };
  
  
  const [searchQuery, setSearchQuery] = useState('');
  const [taskFilter, setTaskFilter] = useState('ALL');
  const [chartPeriod, setChartPeriod] = useState('7days');
  const [hoveredPoint, setHoveredPoint] = useState(null);
  
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showManageModal, setShowManageModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  
  
  const [toast, setToast] = useState({ message: '', type: 'success', show: false });
  const showToast = (message, type = 'success') => {
    setToast({ message, type, show: true });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  // Manager Own Department Transfer States
  const [showTransferRequestModal, setShowTransferRequestModal] = useState(false);
  const [transferRequestTargetDeptId, setTransferRequestTargetDeptId] = useState('');
  const [transferRequestReason, setTransferRequestReason] = useState('');
  const [myProfile, setMyProfile] = useState(null);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [isSubmittingTransferRequest, setIsSubmittingTransferRequest] = useState(false);

  
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeProjects: 0,
    totalRevenue: 0.0,
    activeDisputes: 0,
    pendingWithdrawals: 0,
    usersGrowthPercent: 0.0,
    projectsGrowthPercent: 0.0,
    revenueGrowthPercent: 0.0
  });

  const [tasks, setTasks] = useState([]);
  const [supportChats, setSupportChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [kycRequests, setKycRequests] = useState([]);
  const [moderationItems, setModerationItems] = useState([]);
  const [escalationCases, setEscalationCases] = useState([]);
  const [selectedModerationItem, setSelectedModerationItem] = useState(null);
  const [showModerationModal, setShowModerationModal] = useState(false);
  const [violationReports, setViolationReports] = useState([]);
  const [reportFilter, setReportFilter] = useState('ALL');
  const [reportTypeFilter, setReportTypeFilter] = useState('ALL');
  const [reportSearch, setReportSearch] = useState('');

  // Finance states
  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawalFilter, setWithdrawalFilter] = useState('ALL');
  const [vnpayTxns, setVnpayTxns] = useState([]);
  const [vnpayFilter, setVnpayFilter] = useState('ALL');
  const [financeSearch, setFinanceSearch] = useState('');
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeNote, setDisputeNote] = useState('');
  const [selectedAssignStaffEmail, setSelectedAssignStaffEmail] = useState("");
  const [showAssignStaffDrawer, setShowAssignStaffDrawer] = useState(false);
  const [queueTab, setQueueTab] = useState('ALL');
  const [queueSearch, setQueueSearch] = useState('');
  const [moderationView, setModerationView] = useState('queue');
  const [userGrowthTrend, setUserGrowthTrend] = useState([]);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const stompClientRef = useRef(null);
  const subscriptionRef = useRef(null);
  const selectedChatIdRef = useRef(null);
  const messagesEndRef = useRef(null);

  
  const [staffList, setStaffList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [supportStats, setSupportStats] = useState({
    total: 0,
    inProgress: 0,
    pending: 0,
    waitingUser: 0,
    inProgressPercent: 0,
    pendingPercent: 0,
    waitingUserPercent: 0
  });

  const [createForm, setCreateForm] = useState({
    taskType: 'KYC_VERIFICATION',
    title: '',
    requiredDepartments: 'CS',
    description: '',
    referenceId: '',
    assignedToEmail: ''
  });
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'STAFF',
    departmentId: ''
  });

  const [transferForm, setTransferForm] = useState({
    memberId: '',
    targetDepartmentCode: 'MOD'
  });

  const [chatSearch, setChatSearch] = useState('');
  const [replyText, setReplyText] = useState('');
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({
    title: '',
    message: '',
    confirmText: 'Xác nhận',
    cancelText: 'Hủy',
    type: 'danger',
    onConfirm: null
  });
  const [supportSubTab, setSupportSubTab] = useState('unclaimed'); 
  const [deletedChats, setDeletedChats] = useState([]);
  const [staffSubTab, setStaffSubTab] = useState('list');
  const [transferRequests, setTransferRequests] = useState([]);
  const [transferFilter, setTransferFilter] = useState('ALL');
  const [showTransferRejectModal, setShowTransferRejectModal] = useState(false);
  const [rejectRequestId, setRejectRequestId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedTransferRequest, setSelectedTransferRequest] = useState(null);
  const [showTransferDetailModal, setShowTransferDetailModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportActionLoading, setReportActionLoading] = useState(false);

  // Resolve manager's active department & ID
  const activeDeptId = (() => {
    if (myProfile?.departmentId) return myProfile.departmentId;
    if (user?.departmentId) return user.departmentId;
    // Fallback: match by parsing the email prefix (e.g. manager.mod@... -> MOD, manager.cs@... -> CS)
    const email = String(user?.email || '').toLowerCase();
    let code = 'ALL';
    if (email.startsWith('manager.mod') || email.startsWith('staff.moderation')) code = 'MOD';
    else if (email.startsWith('manager.dis')) code = 'DIS';
    else if (email.startsWith('manager.cs')) code = 'CS';
    else if (email.startsWith('manager.it')) code = 'IT';
    
    if (code !== 'ALL') {
      const match = departments.find(d => String(d.code).toUpperCase() === code);
      if (match) return match.id;
    }
    return null;
  })();

  const activeDeptCode = (() => {
    if (activeDeptId) {
      const match = departments.find(d => d.id === activeDeptId);
      if (match) return String(match.code).toUpperCase();
    }
    // Fallback directly to email prefix
    const email = String(user?.email || '').toLowerCase();
    if (email.startsWith('manager.mod') || email.startsWith('staff.moderation')) return 'MOD';
    if (email.startsWith('manager.dis')) return 'DIS';
    if (email.startsWith('manager.cs')) return 'CS';
    if (email.startsWith('manager.it')) return 'IT';
    return 'ALL';
  })();

  // Helper helper to get staff department code
  const getStaffDeptCode = (s) => {
    if (s.departmentCode) return s.departmentCode;
    if (s.departmentId) {
      const match = departments.find(d => d.id === s.departmentId);
      if (match) return String(match.code).toUpperCase();
    }
    return '';
  };

  const fetchMyProfile = () => {
    if (!user?.id) return;
    adminApi.getManagerProfile(user.id)
      .then(data => {
        if (data) {
          setMyProfile(data);
        }
      })
      .catch(err => console.error("Error fetching manager profile:", err));
  };

  useEffect(() => {
    fetchMyProfile();
  }, [user?.id]);

  useEffect(() => {
    if (showTransferRequestModal) {
      fetchMyProfile();
      adminApi.getDepartments()
        .then(data => {
          if (Array.isArray(data)) {
            setDepartmentsList(data);
          }
        })
        .catch(err => console.error("Error fetching departments:", err));
    }
  }, [showTransferRequestModal]);

  const handleTransferRequestSubmit = (e) => {
    e.preventDefault();
    if (!transferRequestTargetDeptId || !user?.id) return;

    setIsSubmittingTransferRequest(true);
    const payload = {
      userType: 'MANAGER',
      userId: user.id,
      toDepartmentId: parseInt(transferRequestTargetDeptId, 10),
      reason: transferRequestReason
    };

    adminApi.transferDepartmentMember(payload)
      .then(res => {
        setIsSubmittingTransferRequest(false);
        if (res.success !== false) {
          showToast('Điều chuyển phòng ban thành công!', 'success');
          setShowTransferRequestModal(false);
          setTransferRequestReason('');
          setTransferRequestTargetDeptId('');
          fetchMyProfile();
        } else {
          showToast(res.message || 'Điều chuyển thất bại.', 'error');
        }
      })
      .catch(err => {
        setIsSubmittingTransferRequest(false);
        showToast(err.response?.data?.message || 'Có lỗi xảy ra khi thực hiện điều chuyển.', 'error');
      });
  };

  const handleClaimDispute = () => {
    if (!selectedDispute) return;
    const rawId = selectedDispute.raw?.id || selectedDispute.idRaw || selectedDispute.id || 1;
    const disputeTitle = selectedDispute.raw?.projectTitle || selectedDispute.title || 'Tranh chấp hợp đồng';
    const clientName = selectedDispute.raw?.clientName || 'Client';
    const freelancerName = selectedDispute.raw?.freelancerName || 'Freelancer';
    const amount = selectedDispute.raw?.amount || 0;
    const reason = selectedDispute.raw?.reason || disputeNote || 'Tranh chấp chưa có thông tin chi tiết';

    const existingTask = tasks.find(
      (t) =>
        t.taskType === 'DISPUTE_RESOLUTION' &&
        Number(t.referenceId) === Number(rawId),
    );

    let apiCall;
    if (existingTask) {
      apiCall = adminApi.claimVerificationTask(
        existingTask.taskId,
        user?.email || 'manager@gmail.com',
      );
    } else {
      const taskPayload = {
        taskType: 'DISPUTE_RESOLUTION',
        referenceId: rawId,
        title: `Xử lý Khiếu nại / Tranh chấp: ${disputeTitle}`,
        description: `Bên Client (Thuê): ${clientName}. Bên Freelancer: ${freelancerName}. Số tiền tranh chấp: ${amount.toLocaleString('vi-VN')} VND. Nội dung: ${reason}`,
        requiredDepartments: activeDeptCode || 'DIS',
        status: 'IN_PROGRESS',
        assignedToEmail: user?.email,
      };
      apiCall = adminApi.createVerificationTask(taskPayload);
    }

    apiCall
      .then((res) => {
        if (res.success !== false) {
          showToast(
            'Đã tiếp nhận khiếu nại thành công! Nhiệm vụ hiện đã được chuyển vào mục "Công việc của tôi".',
            'success',
          );
          fetchTasks();
          setShowDisputeModal(false);
          setSelectedDispute(null);
          setDisputeNote('');
          setActiveTab('Tasks');
        } else {
          showToast(res.message || 'Thao tác thất bại.', 'error');
        }
      })
      .catch((err) => {
        console.error(err);
        showToast('Lỗi kết nối máy chủ.', 'error');
      });
  };

  const handleAssignDisputeToStaff = (targetStaffEmail) => {
    if (!selectedDispute) return;
    if (!targetStaffEmail) {
      showToast('Vui lòng chọn nhân viên để phân công!', 'error');
      return;
    }
    const rawId = selectedDispute.raw?.id || selectedDispute.idRaw || selectedDispute.id || 1;
    const disputeTitle = selectedDispute.raw?.projectTitle || selectedDispute.title || 'Tranh chấp hợp đồng';
    const clientName = selectedDispute.raw?.clientName || 'Client';
    const freelancerName = selectedDispute.raw?.freelancerName || 'Freelancer';
    const amount = selectedDispute.raw?.amount || 0;
    const reason = selectedDispute.raw?.reason || 'Tranh chấp chưa có thông tin chi tiết';

    const existingTask = tasks.find(
      (t) =>
        t.taskType === 'DISPUTE_RESOLUTION' &&
        Number(t.referenceId) === Number(rawId),
    );

    let apiCall;
    if (existingTask) {
      apiCall = adminApi.claimVerificationTask(
        existingTask.taskId,
        targetStaffEmail,
      );
    } else {
      const taskPayload = {
        taskType: 'DISPUTE_RESOLUTION',
        referenceId: rawId,
        title: `Xử lý Khiếu nại / Tranh chấp: ${disputeTitle}`,
        description: `Bên Client (Thuê): ${clientName}. Bên Freelancer: ${freelancerName}. Số tiền tranh chấp: ${amount.toLocaleString('vi-VN')} VND. Nội dung: ${reason}`,
        requiredDepartments: activeDeptCode || 'DIS',
        status: 'IN_PROGRESS',
        assignedToEmail: targetStaffEmail,
      };
      apiCall = adminApi.createVerificationTask(taskPayload);
    }

    apiCall
      .then((res) => {
        if (res.success !== false) {
          showToast(
            `Đã phân công nhiệm vụ cho nhân viên ${targetStaffEmail} thành công!`,
            'success',
          );
          fetchTasks();
          setShowDisputeModal(false);
          setSelectedDispute(null);
          setShowAssignStaffDrawer(false);
          setSelectedAssignStaffEmail('');
        } else {
          showToast(res.message || 'Phân công thất bại.', 'error');
        }
      })
      .catch((err) => {
        console.error(err);
        showToast('Lỗi kết nối máy chủ.', 'error');
      });
  };

  const getSidebarItems = () => {
    const common = [
      { id: 'Dashboard', label: 'Bảng điều khiển', icon: LayoutDashboard }
    ];

    const openDisputeCount = escalationCases.filter(
      (esc) => esc.raw?.status === 'OPEN' || esc.raw?.status === 'PENDING'
    ).length;

    const pendingTasksCount = tasks.filter(
      (t) => t.status === 'Pending' || t.status === 'IN_PROGRESS' || t.status === 'Escalated'
    ).length;

    if (activeDeptCode === 'MOD') {
      common.push(
        { id: 'Tasks', label: 'Nhiệm vụ kiểm duyệt', icon: CheckSquare, badge: pendingTasksCount },
        { id: 'Moderation', label: 'Hàng đợi kiểm duyệt', icon: Gavel, badge: moderationItems.filter(i => i.status === 'Pending').length },
        { id: 'Reports', label: 'Báo cáo vi phạm', icon: FileText, badge: violationReports.filter(r => r.status === 'Chờ xử lý').length },
        { id: 'KYC', label: 'Xác thực KYC', icon: UserCheck, badge: kycRequests.filter(r => r.status === 'Pending').length },
        { id: 'ModHistory', label: 'Lịch sử hoạt động', icon: Clock }
      );
    } else if (activeDeptCode === 'DIS') {
      common.push(
        { id: 'Disputes', label: 'Tranh chấp Freelancer - Employer', icon: ShieldAlert, badge: openDisputeCount },
        { id: 'PaymentComplaints', label: 'Khiếu nại thanh toán', icon: BadgeDollarSign },

      );
    } else if (activeDeptCode === 'FIN') {
      common.push(
        { id: 'Tasks', label: 'Nhiệm vụ tài chính', icon: CheckSquare, badge: pendingTasksCount },
        { id: 'Withdrawals', label: 'Quản lý Rút tiền', icon: BadgeDollarSign, badge: withdrawals.filter(w => w.statusRaw === 'PENDING').length },
        { id: 'PaymentComplaints', label: 'Khiếu nại thanh toán', icon: BadgeDollarSign },
        { id: 'FailedTransactions', label: 'Đối soát VNPay', icon: Activity },
        { id: 'ModHistory', label: 'Lịch sử hoạt động', icon: Clock }
      );
    } else if (activeDeptCode === 'CS') {
      common.push(
        { id: 'Tasks', label: 'Nhiệm vụ CSKH', icon: CheckSquare, badge: pendingTasksCount },
        { id: 'Support', label: 'Hỗ trợ khách hàng', icon: MessageSquare, badge: supportChats.reduce((sum, c) => sum + (c.unread || 0), 0) },
        { id: 'ModHistory', label: 'Lịch sử hoạt động', icon: Clock }
      );
    } else {
      // General Manager / ALL
      common.push(
        { id: 'Tasks', label: 'Nhiệm vụ phòng ban', icon: CheckSquare, badge: pendingTasksCount },
        { id: 'Disputes', label: 'Giải quyết tranh chấp', icon: ShieldAlert, badge: openDisputeCount },
        { id: 'PaymentComplaints', label: 'Khiếu nại thanh toán', icon: BadgeDollarSign },
        { id: 'Moderation', label: 'Hàng đợi kiểm duyệt', icon: Gavel },
        { id: 'Reports', label: 'Báo cáo vi phạm', icon: FileText },
        { id: 'KYC', label: 'Xác thực KYC', icon: UserCheck },
        { id: 'Support', label: 'Hỗ trợ khách hàng', icon: MessageSquare },
        { id: 'ModHistory', label: 'Lịch sử hoạt động', icon: Clock }
      );
    }

    // Always include Staff Management for their department
    const deptStaffCount = activeDeptCode === 'ALL' ? staffList.length : staffList.filter(s => s.departmentId === activeDeptId).length;
    common.push(
      { id: 'Staff Management', label: 'Quản lý nhân sự', icon: Users, badge: deptStaffCount }
    );

    return common;
  };

  const supportSubTabRef = useRef(supportSubTab);
  useEffect(() => {
    supportSubTabRef.current = supportSubTab;
  }, [supportSubTab]);

  
  useEffect(() => {
    selectedChatIdRef.current = selectedChatId;
  }, [selectedChatId]);

  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  
  useEffect(() => {
    const socket = new SockJS('http://localhost:8080/api/ws');
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
    });

    client.onConnect = (frame) => {
      console.log('[STOMP] Connected (Manager)', frame);
      setSocketConnected(true);

      
      client.subscribe('/topic/admin', (message) => {
        const received = JSON.parse(message.body);
        console.log('[STOMP] /topic/admin (Manager)', received);

        
        if (received.senderRole !== 'SYSTEM' && received.messageText) {
          
          if (received.ticketId === selectedChatIdRef.current) {
            setChatMessages(prev => {
              const isDuplicate = prev.some(
                m => (m.id && m.id === received.id) || (m.messageId && m.messageId === received.messageId)
              );
              if (isDuplicate) return prev;
              return [...prev, received];
            });
            if (isCustomerMessage(received)) {
              publishSupportReadReceipt(received.ticketId);
            }
          }
        }
        
        if (received.type === 'TRANSFER_REQUEST_SUBMITTED') {
          fetchTransferRequests();
        }

        fetchSupportChats();
        if (supportSubTabRef.current === 'deleted') {
          fetchDeletedSupportChats();
        }
      });
    };

    client.onDisconnect = () => {
      console.log('[STOMP] Disconnected (Manager)');
      setSocketConnected(false);
    };

    client.onStompError = (frame) => {
      console.error('[STOMP] Error (Manager)', frame);
    };

    client.activate();
    stompClientRef.current = client;

    return () => {
      try {
        client.deactivate();
      } catch (e) {}
    };
  }, []);

  
  const fetchStats = () => {
    adminApi.getStats(chartPeriod)
      .then(data => {
        if (data) setStats(data);
      })
      .catch(err => console.error('Error fetching stats:', err));
  };
  const fetchTasks = () => {
    adminApi.getVerificationTasks()
      .then(data => {
        if (Array.isArray(data)) {
          const mapped = data.map(t => {
            const reqDepts = t.requiredDepartments?.split(',') || ['CS'];
            const firstDept = reqDepts[0] || 'CS';
            
            let displayStatus = 'Pending';
            if (t.status === 'APPROVED') displayStatus = 'Manager đã ký duyệt';
            else if (t.status === 'REJECTED') displayStatus = 'Rejected';
            else if (t.status === 'IN_PROGRESS') displayStatus = 'In Progress';
            else if (t.status === 'ESCALATED') displayStatus = 'Escalated';

            return {
              id: `#TSK-${t.taskId}`,
              taskId: t.taskId,
              type: t.taskType || 'Verification Request',
              title: t.title || 'Verification Request',
              user: t.assignedToEmail || t.verifierEmail || `Dept: ${firstDept}`,
              assignedToEmail: t.assignedToEmail || null,
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(t.assignedToEmail || t.verifierEmail || firstDept)}&background=006b2c&color=fff`,
              priority: t.taskType === 'Payment Processing' ? 'High' : t.taskType === 'Dispute Resolution' ? 'High' : 'Medium',
              status: displayStatus,
              deadline: t.status === 'APPROVED' ? 'Manager đã ký duyệt' : 'Pending Review',
              description: t.description || 'No description provided.',
              requiredDepartments: t.requiredDepartments,
              signoffs: t.signoffs,
              referenceId: t.referenceId
            };
          });
          setTasks(mapped);
        }
      })
      .catch(err => console.error('Error fetching tasks:', err));
  };
  const fetchKycRequests = () => {
    adminApi.getKycRequests()
      .then(data => {
        if (Array.isArray(data)) {
          const mapped = data.map(r => ({
            id: `KYC-00${r.id}`,
            idRaw: r.id,
            name: r.userName,
            email: r.userEmail,
            role: r.userRole || 'FREELANCER',
            docType: 'CCCD/ID Card',
            subDate: r.submittedAt ? r.submittedAt.substring(0, 10) : '',
            docUrl: r.idCard || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&fit=crop',
            status: r.status === 'APPROVED' ? 'Approved' : r.status === 'REJECTED' ? 'Rejected' : 'Pending'
          }));
          setKycRequests(mapped);
        }
      })
      .catch(err => console.error('Error fetching kyc:', err));
  };
  const fetchModerationItems = () => {
    Promise.all([
      adminApi.getProfileRequests().catch(() => []),
      adminApi.getPendingProjects().catch(() => [])
    ]).then(([profilesData, projectsData]) => {
      let mapped = [];

      if (Array.isArray(profilesData)) {
        mapped = [...mapped, ...profilesData.map(pr => ({
          id: `PROF-${pr.requestId}`,
          idRaw: pr.requestId,
          title: `Cập nhật hồ sơ: ${pr.companyName || pr.displayName || 'Employer'}`,
          type: 'PROFILE',
          author: pr.displayName || 'Employer',
          detail: `Yêu cầu cập nhật hồ sơ công ty. ${pr.companyDescription ? 'Có thay đổi mô tả.' : ''}`,
          reason: 'Cập nhật hồ sơ',
          subDate: pr.createdAt ? String(pr.createdAt).substring(0, 10) : new Date().toISOString().substring(0, 10),
          status: pr.status === 'PENDING' ? 'Pending' : 'Processed',
          rawRequest: pr
        }))];
      }

      if (Array.isArray(projectsData)) {
        mapped = [...mapped, ...projectsData.map(p => ({
          id: `PROJ-${p.id}`,
          idRaw: p.id,
          title: p.title || 'Dự án chưa đặt tên',
          type: 'PROJECT',
          author: p.employerName || p.clientName || 'Employer',
          detail: p.description || '',
          reason: 'Dự án mới',
          subDate: p.createdAt ? String(p.createdAt).substring(0, 10) : new Date().toISOString().substring(0, 10),
          status: 'Pending',
          rawProject: p
        }))];
      }

      setModerationItems(mapped);
    }).catch(err => console.error('Error fetching moderation items:', err));
  };
  const fetchSupportChats = () => {
    messengerApi.getTickets()
      .then(data => {
        if (Array.isArray(data)) {
          const total = data.length;
          let inProgress = 0;
          let pending = 0;
          let waitingUser = 0;

          data.forEach(t => {
            const hasReplied = t.has_admin_replied || t.hasAdminReplied;
            const unread = t.unread_count !== undefined ? t.unread_count : (t.unreadCount !== undefined ? t.unreadCount : 0);
            if (!hasReplied) {
              pending++;
            } else if (unread > 0) {
              pending++;
            } else {
              if ((t.ticket_id || t.ticketId) % 2 === 0) {
                inProgress++;
              } else {
                waitingUser++;
              }
            }
          });

          const inProgressPercent = total > 0 ? Math.round((inProgress / total) * 100) : 0;
          const pendingPercent = total > 0 ? Math.round((pending / total) * 100) : 0;
          const waitingUserPercent = total > 0 ? Math.max(0, 100 - inProgressPercent - pendingPercent) : 0;

          setSupportStats({
            total,
            inProgress,
            pending,
            waitingUser,
            inProgressPercent,
            pendingPercent,
            waitingUserPercent
          });

          const formatted = data.map(ticket => ({
            ...ticket,
            id: ticket.ticket_id || ticket.ticketId,
            name: ticket.sender_name || `Ticket #${ticket.ticket_id || ticket.ticketId}`,
            avatar: ticket.sender_avatar || ticket.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(ticket.sender_name || 'C')}&background=006b2c&color=fff`,
            lastMessage: ticket.last_message || 'Chưa có tin nhắn',
            time: (ticket.last_message_time || ticket.last_message_at) ? new Date(ticket.last_message_time || ticket.last_message_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '',
            unread: ticket.unread_count || 0
          }));
          setSupportChats(formatted);
        }
      })
      .catch(err => console.error('Error fetching support chats:', err));
  };

  const fetchDeletedSupportChats = () => {
    messengerApi.getDeletedTickets()
      .then(data => {
        if (Array.isArray(data)) {
          const formatted = data.map(ticket => ({
            ...ticket,
            id: ticket.ticket_id || ticket.ticketId,
            name: ticket.sender_name || `Ticket #${ticket.ticket_id || ticket.ticketId}`,
            avatar: ticket.sender_avatar || ticket.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(ticket.sender_name || 'C')}&background=006b2c&color=fff`,
            lastMessage: ticket.last_message || 'Chưa có tin nhắn',
            time: (ticket.last_message_time || ticket.last_message_at) ? new Date(ticket.last_message_time || ticket.last_message_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '',
            unread: ticket.unread_count || 0
          }));
          setDeletedChats(formatted);
        }
      })
      .catch(err => console.error('Error fetching deleted support chats:', err));
  };

  const fetchTrends = () => {
    adminApi.getUserGrowth()
      .then(data => {
        if (Array.isArray(data)) setUserGrowthTrend(data);
      })
      .catch(err => console.error('Error user growth:', err));

    adminApi.getRevenueGrowth()
      .then(data => {
        if (Array.isArray(data)) setRevenueTrend(data);
      })
      .catch(err => console.error('Error revenue growth:', err));
  };

  const fetchStaffAndDepartments = () => {
    adminApi.getStaff()
      .then(data => {
        if (Array.isArray(data)) setStaffList(data);
      })
      .catch(err => console.error(err));

    adminApi.getDepartments()
      .then(data => {
        if (Array.isArray(data)) {
          setDepartments(data);
          if (data.length > 0) {
            setInviteForm(prev => ({ ...prev, departmentId: data[0].id }));
          }
        }
      })
      .catch(err => console.error(err));
  };

  const fetchTransferRequests = () => {
    adminApi.getTransferRequests()
      .then(data => {
        if (Array.isArray(data)) {
          setTransferRequests(data);
        }
      })
      .catch(err => console.error("Error fetching transfer requests:", err));
  };

  const parseReason = (reasonText) => {
    const data = {
      reason: '',
      desiredDept: '',
      desiredPosition: '',
      startDate: '',
      transferType: '',
      skills: '',
      achievements: '',
      attachment: ''
    };
    if (!reasonText) return data;

    const lines = reasonText.split('\n');
    lines.forEach(line => {
      if (line.startsWith('Lý do điều chuyển: ')) {
        data.reason = line.substring('Lý do điều chuyển: '.length);
      } else if (line.startsWith('Phòng ban mong muốn: ')) {
        data.desiredDept = line.substring('Phòng ban mong muốn: '.length);
      } else if (line.startsWith('Vị trí mong muốn: ')) {
        data.desiredPosition = line.substring('Vị trí mong muốn: '.length);
      } else if (line.startsWith('Ngày mong muốn bắt đầu: ')) {
        data.startDate = line.substring('Ngày mong muốn bắt đầu: '.length);
      } else if (line.startsWith('Loại điều chuyển: ')) {
        data.transferType = line.substring('Loại điều chuyển: '.length);
      } else if (line.startsWith('Kỹ năng liên quan & kinh nghiệm trước đây: ')) {
        data.skills = line.substring('Kỹ năng liên quan & kinh nghiệm trước đây: '.length);
      } else if (line.startsWith('Thành tích nổi bật & lý do bạn phù hợp: ')) {
        data.achievements = line.substring('Thành tích nổi bật & lý do bạn phù hợp: '.length);
      } else if (line.startsWith('Tệp đính kèm: ')) {
        data.attachment = line.substring('Tệp đính kèm: '.length);
      }
    });

    if (!data.reason && !data.desiredDept && !data.desiredPosition) {
      data.reason = reasonText;
    }
    return data;
  };

  const executeTransferRequestAction = (requestId, status, reason) => {
    const adminId = user?.id || 1;
    adminApi.approveTransferRequest(requestId, status, reason, adminId)
      .then(res => {
        if (res.success || res.success !== false) {
          showToast(res.message || 'Xử lý đơn điều chuyển thành công!', 'success');
          fetchTransferRequests();
          fetchStaffAndDepartments();

          // Dispatch real-time notification event to immediately update notification bell
          window.dispatchEvent(new CustomEvent('newNotification', {
            detail: {
              title: status === 'APPROVED' ? 'Yêu cầu bàn giao & Điều chuyển phòng ban' : 'Đơn điều chuyển bị từ chối',
              message: status === 'APPROVED'
                ? 'Đã gửi yêu cầu bàn giao công việc & duyệt đơn điều chuyển cho staff.'
                : `Đơn điều chuyển #${requestId} đã bị từ chối.`,
              createdAt: new Date().toISOString()
            }
          }));
        } else {
          showToast(res.message || 'Lỗi khi xử lý đơn điều chuyển.', 'error');
        }
      })
      .catch(err => {
        console.error(err);
        showToast(err.response?.data?.message || 'Không thể kết nối máy chủ.', 'error');
      });
  };

  const handleApproveTransferRequest = (requestId, approve) => {
    if (!approve) {
      setRejectRequestId(requestId);
      setRejectReason('');
      setShowTransferRejectModal(true);
    } else {
      const req = transferRequests.find(r => r.requestId === requestId) || selectedTransferRequest;
      const staffEmail = req?.userEmail || '';
      const staffName = req?.userDisplayName || staffEmail || 'Nhân viên';

      const unfinishedCount = tasks.filter(t => {
        const isAssigned = (t.assignedToEmail && t.assignedToEmail.toLowerCase() === staffEmail.toLowerCase()) ||
                           (t.assignedTo && t.assignedTo.toLowerCase() === staffEmail.toLowerCase());
        const isFinished = t.status === 'Completed' || t.status === 'Manager đã ký duyệt' || t.status === 'Approved' || t.status === 'Rejected';
        return isAssigned && !isFinished;
      }).length;

      setConfirmConfig({
        title: unfinishedCount > 0 ? '⚠️ Cảnh báo bàn giao công việc' : 'Xác nhận duyệt điều chuyển',
        message: unfinishedCount > 0
          ? `Nhân viên ${staffName} (${staffEmail}) hiện đang có ${unfinishedCount} công việc CHƯA HOÀN THÀNH.\n\nYêu cầu staff cần bàn giao lại toàn bộ công việc cho phòng ban trước khi điều chuyển.\n\nBạn có chắc chắn muốn gửi yêu cầu bàn giao và tiếp tục duyệt điều chuyển này không?`
          : `Nhân viên ${staffName} hiện có 0 công việc dở dang (đã hoàn thành toàn bộ công việc).\n\nBạn có chắc chắn muốn DUYỆT yêu cầu điều chuyển này không?`,
        confirmText: unfinishedCount > 0 ? 'Gửi yêu cầu bàn giao' : 'Xác nhận Duyệt',
        cancelText: 'Hủy',
        type: unfinishedCount > 0 ? 'danger' : 'success',
        onConfirm: () => {
          setShowConfirmModal(false);
          executeTransferRequestAction(requestId, 'APPROVED', '');
        }
      });
      setShowConfirmModal(true);
    }
  };

  const submitTransferRejection = () => {
    if (!rejectReason || !rejectReason.trim()) {
      showToast("Vui lòng nhập lý do từ chối.", "error");
      return;
    }
    const reqId = rejectRequestId;
    const reasonText = rejectReason.trim();
    setShowTransferRejectModal(false);
    setRejectReason('');
    setRejectRequestId(null);
    executeTransferRequestAction(reqId, 'REJECTED', reasonText);
  };

  const fetchReports = () => {
    adminApi.getReports().then(data => {
      if (Array.isArray(data)) {
        setViolationReports(data.map(r => ({
          id: `RPT-${r.id}`,
          idRaw: r.id,
          target: r.targetType,
          targetId: r.targetId,
          reporter: r.reporterName,
          accused: r.reportedName,
          severity: r.severity === 'HIGH' ? 'Cao' : r.severity === 'LOW' ? 'Thấp' : 'Trung bình',
          type: r.targetType === 'PROJECT' ? 'Dự án' : 'Hồ sơ',
          status:
            r.status === "PENDING"
              ? "Chờ xử lý"
              : r.status === "ESCALATED"
                ? "Đã chuyển cấp"
                : "Đã xử lý",
          evidence: r.reason + (r.evidence ? ` - Link: ${r.evidence}` : ''),
          reason: r.reason,
          evidenceUrl: r.evidence
        })));
      }
    }).catch(console.error);
  };

  const handleManagerResolveReport = (report, status) => {
    const rawId = report.idRaw || (report.id ? String(report.id).replace('RPT-', '') : report.id);
    const adminId = user?.id || 1;
    setReportActionLoading(true);
    adminApi.resolveReport(rawId, status, adminId)
      .then(res => {
        setReportActionLoading(false);
        if (res.success !== false) {
          showToast(status === 'RESOLVED' ? 'Đã phê duyệt và ký duyệt báo cáo thành công!' : 'Đã từ chối báo cáo thành công!', 'success');
          fetchReports();
          setSelectedReport(null);
        } else {
          showToast(res.message || 'Lỗi khi xử lý báo cáo.', 'error');
        }
      })
      .catch(err => {
        setReportActionLoading(false);
        console.error(err);
        showToast('Có lỗi xảy ra khi xử lý báo cáo.', 'error');
      });
  };

  const fetchDisputes = () => {
    adminApi.getDisputes()
      .then(data => {
        if (Array.isArray(data)) {
          setEscalationCases(data.map(d => ({
            id: `ESC-${d.id}`,
            title: d.reason || 'Tranh chấp dự án',
            owner: d.clientName,
            priority: d.priority === 'HIGH' ? 'Khẩn cấp' : 'Cao',
            raw: d
          })));
        }
      })
      .catch(err => console.error('Error fetching disputes:', err));
  };

  const fetchWithdrawals = () => {
    adminApi.getWithdrawals().then(data => {
      if (Array.isArray(data)) {
        setWithdrawals(data.map(w => ({
          id: w.id,
          amount: w.amount,
          status: w.status === 'PENDING' ? 'Chờ xử lý' : w.status === 'APPROVED' ? 'Đã duyệt' : 'Đã từ chối',
          statusRaw: w.status,
          reason: w.reason || '',
          date: w.createdAt ? new Date(w.createdAt).toLocaleString('vi-VN') : '',
          user: w.userName || 'Không rõ',
          email: w.userEmail || '',
          bank: w.bankName || 'N/A',
          account: w.accountNumber || 'N/A'
        })));
      }
    }).catch(console.error);
  };

  const handleWithdrawalAction = (id, status, reason = null) => {
    const adminId = user?.id || 1;
    let confirmMsg = `Bạn có chắc chắn muốn DUYỆT yêu cầu rút tiền này?`;
    
    if (status === 'REJECTED') {
      confirmMsg = `Bạn có chắc chắn muốn TỪ CHỐI yêu cầu rút tiền này?`;
      if (!reason) {
        reason = window.prompt("Nhập lý do từ chối yêu cầu rút tiền này (bắt buộc):");
        if (reason === null) return; // user cancelled
        if (!reason.trim()) {
          showToast("Vui lòng nhập lý do từ chối.", "error");
          return;
        }
      }
    }

    if (window.confirm(confirmMsg)) {
      adminApi.processWithdrawal(id, status, adminId, reason)
        .then(res => {
          if (res.success) {
            showToast(res.message, 'success');
            fetchWithdrawals();
            fetchStats(); // Update stats count
            setShowWithdrawalModal(false);
            setSelectedWithdrawal(null);
          } else {
            showToast(res.message, 'error');
          }
        }).catch(err => {
          console.error(err);
          showToast('Có lỗi xảy ra khi xử lý rút tiền.', 'error');
        });
    }
  };

  const fetchVnpayTransactions = () => {
    adminApi.getVnpayTransactions().then(data => {
      if (Array.isArray(data)) {
        setVnpayTxns(data.map(t => ({
          id: t.id,
          txnRef: t.txnRef,
          amount: t.amount,
          status: t.status, // SUCCESS, FAILED, PENDING
          vnpTxnNo: t.vnpTransactionNo || 'N/A',
          date: t.createdAt ? new Date(t.createdAt).toLocaleString('vi-VN') : '',
          employerId: t.employerId,
          projectId: t.projectId
        })));
      }
    }).catch(console.error);
  };

  const handleResolveDispute = (status) => {
    if (!selectedDispute || !selectedDispute.raw) return;
    const adminId = user?.id || 1;
    adminApi.resolveDispute(selectedDispute.raw.id, status, disputeNote, adminId)
      .then(res => {
        if (res.success) {
          showToast(res.message || 'Đã xử lý tranh chấp thành công.', 'success');
          setShowDisputeModal(false);
          setSelectedDispute(null);
          setDisputeNote('');
          fetchDisputes(); // Refresh list
          fetchStats(); // Refresh stats count
        } else {
          showToast(res.message || 'Lỗi xử lý tranh chấp.', 'error');
        }
      })
      .catch(err => console.error('Error resolving dispute:', err));
  };

  
  useEffect(() => {
    fetchStats();
    fetchTasks();
    fetchKycRequests();
    fetchModerationItems();
    fetchSupportChats();
    fetchTrends();
    fetchStaffAndDepartments();
    fetchDisputes();
    fetchReports();
    fetchWithdrawals();
    fetchVnpayTransactions();
    fetchTransferRequests();
  }, [chartPeriod]);

  useEffect(() => {
    const handleOpenDetail = (e) => {
      const { requestId } = e.detail;
      const found = transferRequests.find(r => r.requestId === requestId);
      if (found) {
        setSelectedTransferRequest(found);
        setShowTransferDetailModal(true);
        setActiveTab('Staff Management');
        setStaffSubTab('requests');
      } else {
        adminApi.getTransferRequests()
          .then(data => {
            if (Array.isArray(data)) {
              setTransferRequests(data);
              const foundAgain = data.find(r => r.requestId === requestId);
              if (foundAgain) {
                setSelectedTransferRequest(foundAgain);
                setShowTransferDetailModal(true);
                setActiveTab('Staff Management');
                setStaffSubTab('requests');
              }
            }
          });
      }
    };
    window.addEventListener('openTransferRequestDetail', handleOpenDetail);
    return () => window.removeEventListener('openTransferRequestDetail', handleOpenDetail);
  }, [transferRequests]);

  useEffect(() => {
    const handleTransferUpdate = () => {
      fetchTransferRequests();
      fetchStaffAndDepartments();
    };
    window.addEventListener('transferRequestUpdated', handleTransferUpdate);
    window.addEventListener('newNotification', handleTransferUpdate);

    const intervalId = setInterval(() => {
      fetchTransferRequests();
      fetchStaffAndDepartments();
    }, 5000);

    return () => {
      window.removeEventListener('transferRequestUpdated', handleTransferUpdate);
      window.removeEventListener('newNotification', handleTransferUpdate);
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const handleOpenProfileDetail = (e) => {
      const { requestId } = e.detail;
      // Navigate to Moderation queue and filter by PROFILE
      setActiveTab('Moderation');
      setQueueTab('PROFILE');
      showToast('Đã chuyển đến hàng đợi kiểm duyệt hồ sơ', 'success');

      // Open the modal if the item is already loaded in moderationItems
      if (Array.isArray(moderationItems)) {
        const found = moderationItems.find(item => item.type === 'PROFILE' && item.idRaw === requestId);
        if (found) {
          setSelectedModerationItem(found);
          setShowModerationModal(true);
        }
      }
    };

    window.addEventListener('openProfileRequestDetail', handleOpenProfileDetail);
    return () => window.removeEventListener('openProfileRequestDetail', handleOpenProfileDetail);
  }, [moderationItems]);  
  useEffect(() => {
    if (!selectedChatId) return;
    setIsLoading(true);
    messengerApi.getMessages(selectedChatId)
      .then(data => {
        setChatMessages(data || []);
        publishSupportReadReceipt(selectedChatId);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, [selectedChatId]);

  useEffect(() => {
    if (!selectedChatId || !socketConnected) return;
    publishSupportReadReceipt(selectedChatId);
  }, [selectedChatId, socketConnected]);

  
  useEffect(() => {
    if (!selectedChatId || !stompClientRef.current || !socketConnected) return;

    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }

    subscriptionRef.current = stompClientRef.current.subscribe(`/topic/ticket.${selectedChatId}`, (message) => {
      const received = JSON.parse(message.body);
      if (received.senderRole === "SYSTEM") {
        fetchSupportChats();
        if (supportSubTabRef.current === 'deleted') {
          fetchDeletedSupportChats();
        }
        return;
      }
      if (received.messageText) {
        setChatMessages(prev => {
          if (prev.some(m => m.id === received.id || m.messageId === received.messageId)) return prev;
          return [...prev, received];
        });
        if (isCustomerMessage(received)) {
          publishSupportReadReceipt(selectedChatId);
        }
        fetchSupportChats();
      }
    });

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [selectedChatId, socketConnected]);

  const handleCreateTaskSubmit = (e) => {
    e.preventDefault();
    if (!createForm.title.trim()) return;

    const payload = {
      taskType: createForm.taskType,
      referenceId: parseInt(createForm.referenceId || "1", 10),
      title: createForm.title.trim(),
      description: createForm.description.trim(),
      requiredDepartments: createForm.requiredDepartments,
      assignedToEmail: createForm.assignedToEmail || null
    };

    adminApi.createVerificationTask(payload)
      .then(res => {
        if (res.success) {
          showToast('Tác vụ xác thực đã được tạo thành công!', 'success');
          fetchTasks();
          setShowCreateModal(false);
          setCreateForm({
            taskType: 'KYC_VERIFICATION',
            title: '',
            requiredDepartments: 'CS',
            description: '',
            referenceId: '',
            assignedToEmail: ''
          });
        } else {
          showToast(res.message || 'Lỗi khi tạo tác vụ.', 'error');
        }
      })
      .catch(err => {
        console.error(err);
        showToast('Không thể kết nối máy chủ.', 'error');
      });
  };

  
  const handleInviteStaff = (e) => {
    e.preventDefault();
    if (!inviteForm.email.trim()) return;

    adminApi.inviteStaffOrManager(inviteForm.email.trim(), inviteForm.role, inviteForm.departmentId, user?.id || 1)
      .then(res => {
        if (res.success !== false) {
          showToast('Đã gửi lời mời thành viên thành công!', 'success');
          fetchStaffAndDepartments();
          setShowInviteModal(false);
          setInviteForm(prev => ({ ...prev, email: '' }));
        } else {
          showToast(res.message || 'Lỗi khi gửi lời mời.', 'error');
        }
      })
      .catch(err => {
        console.error(err);
        showToast('Lỗi máy chủ.', 'error');
      });
  };

  
  const handleTransferStaff = (e) => {
    e.preventDefault();
    if (!transferForm.memberId) return;

    adminApi.transferDepartmentMember({
      memberId: parseInt(transferForm.memberId, 10),
      memberRole: 'STAFF',
      targetDepartmentCode: transferForm.targetDepartmentCode
    })
      .then(res => {
        if (res.success !== false) {
          showToast('Đã chuyển phòng ban cho Staff thành công!', 'success');
          fetchStaffAndDepartments();
          setShowTransferModal(false);
        } else {
          showToast(res.message || 'Giao dịch chuyển thất bại.', 'error');
        }
      })
      .catch(err => {
        console.error(err);
        showToast('Lỗi máy chủ.', 'error');
      });
  };

  
  const handleUpdateTaskStatus = (id, newStatus) => {
    if (!selectedTask) return;
    
    const reqDepts = selectedTask.requiredDepartments?.split(',') || ['CS'];
    const deptCode = reqDepts[0] || 'CS';

    setIsLoading(true);
    adminApi.submitTaskSignoff(selectedTask.taskId, {
      status: (newStatus === 'Completed' || newStatus === 'Manager đã ký duyệt') ? 'APPROVED' : 'PENDING',
      note: `Ký duyệt trạng thái ${newStatus} bởi Manager`,
      departmentCode: deptCode
    }, user?.email || 'manager@gmail.com')
      .then(res => {
        setIsLoading(false);
        if (res.success === false) {
          showToast(res.message || 'Lỗi khi ký duyệt tác vụ.', 'error');
        } else {
          showToast('Ký duyệt tác vụ thành công!', 'success');
          fetchTasks();
          setShowManageModal(false);
          setSelectedTask(null);
        }
      })
      .catch(err => {
        setIsLoading(false);
        console.error(err);
        showToast('Có lỗi xảy ra khi ký duyệt tác vụ.', 'error');
      });
  };

  const handleAssignTask = (taskId, staffEmail) => {
    setIsLoading(true);
    adminApi.claimVerificationTask(taskId, staffEmail)
      .then(res => {
        setIsLoading(false);
        if (res.success) {
          showToast('Phân công công việc thành công!', 'success');
          fetchTasks();
          setShowManageModal(false);
          setSelectedTask(null);
        } else {
          showToast(res.message || 'Lỗi khi phân công.', 'error');
        }
      })
      .catch(err => {
        setIsLoading(false);
        console.error(err);
        showToast('Lỗi kết nối máy chủ.', 'error');
      });
  };

  
  const handleSendChat = (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedChatId || !stompClientRef.current?.connected) return;

    const payload = {
      ticketId: selectedChatId,
      senderId: user.id,
      senderRole: 'MANAGER',
      senderName: user.name,
      senderAvatar: user.avatar || '',
      messageText: replyText.trim(),
      attachments: []
    };

    stompClientRef.current.publish({
      destination: '/app/chat.send',
      body: JSON.stringify(payload)
    });

    setReplyText('');
  };

  const handleSelectSupportChat = (chat) => {
    const isUnclaimed = !(chat.assigned_staff_id || chat.assignedStaffId);

    if (supportSubTab === 'unclaimed' && isUnclaimed) {
      setConfirmConfig({
        title: 'Tiếp nhận khiếu nại',
        message: `Anh có muốn tiếp nhận khiếu nại của ${chat.name || 'người dùng này'} không?`,
        confirmText: 'Đồng ý',
        cancelText: 'Không',
        type: 'success',
        onConfirm: () => {
          messengerApi.claimTicket(chat.id, user?.id)
            .then(() => {
              setSupportChats(prev => prev.map(item =>
                item.id === chat.id
                  ? { ...item, assigned_staff_id: user?.id, assignedStaffId: user?.id }
                  : item
              ));
              setSupportSubTab('claimed');
              setSelectedChatId(chat.id);
              setShowConfirmModal(false);
              showToast('Đã tiếp nhận khiếu nại.', 'success');
              fetchSupportChats();
            })
            .catch(err => {
              console.error('Failed to claim support ticket', err);
              showToast('Không thể tiếp nhận khiếu nại. Vui lòng thử lại.', 'error');
              setShowConfirmModal(false);
            });
        }
      });
      setShowConfirmModal(true);
      return;
    }

    setSelectedChatId(chat.id);
  };

  
  const handleBlockUser = (days) => {
    const activeChat = (supportSubTab === 'deleted' ? deletedChats : supportChats).find(c => c.id === selectedChatId);
    if (!activeChat) return;

    let confirmTitle = '';
    let confirmMsg = '';
    let confirmBtn = 'Xác nhận';
    let confirmType = 'warning';

    if (days === 0) {
      confirmTitle = 'Xác nhận gỡ chặn';
      confirmMsg = 'Anh có chắc muốn gỡ chặn người dùng này không?';
      confirmBtn = 'Gỡ chặn';
      confirmType = 'success';
    } else if (days === -1) {
      confirmTitle = 'Xác nhận chặn vĩnh viễn';
      confirmMsg = 'Anh có chắc muốn chặn vĩnh viễn người dùng này khỏi chat hỗ trợ không?';
      confirmBtn = 'Chặn vĩnh viễn';
      confirmType = 'danger';
    } else {
      confirmTitle = `Xác nhận chặn ${days} ngày`;
      confirmMsg = `Anh có chắc muốn chặn người dùng này trong ${days} ngày không?`;
      confirmBtn = 'Chặn người dùng';
      confirmType = 'warning';
    }

    setConfirmConfig({
      title: confirmTitle,
      message: confirmMsg,
      confirmText: confirmBtn,
      cancelText: 'Hủy',
      type: confirmType,
      onConfirm: () => {
        messengerApi.blockUser(activeChat.id, days)
          .then(() => {
            showToast(days === 0 ? 'Đã gỡ chặn người dùng.' : 'Đã chặn người dùng.', days === 0 ? 'success' : 'error');
            fetchSupportChats();
            if (supportSubTab === 'deleted') {
              fetchDeletedSupportChats();
            }
            setShowUserInfo(false);
            setShowConfirmModal(false);
          })
          .catch(err => {
            console.error('Failed to block user', err);
            showToast('Failed to change block status.', 'error');
            setShowConfirmModal(false);
          });
      }
    });
    setShowConfirmModal(true);
  };

  
  const handleDeleteTicket = () => {
    const activeChat = (supportSubTab === 'deleted' ? deletedChats : supportChats).find(c => c.id === selectedChatId);
    if (!activeChat) return;

    setConfirmConfig({
      title: 'Xóa hội thoại',
      message: 'Anh có chắc muốn xóa hội thoại hỗ trợ này không? Hội thoại sẽ được chuyển vào thùng rác.',
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      type: 'danger',
      onConfirm: () => {
        messengerApi.deleteTicket(activeChat.id)
          .then(() => {
            showToast('Đã xóa hội thoại.', 'success');
            fetchSupportChats();
            fetchDeletedSupportChats();
            setSelectedChatId(null);
            setShowUserInfo(false);
            setShowConfirmModal(false);
          })
          .catch(err => {
            console.error('Failed to delete ticket', err);
            showToast('Failed to delete conversation.', 'error');
            setShowConfirmModal(false);
          });
      }
    });
    setShowConfirmModal(true);
  };

  
  const handleRestoreTicket = () => {
    const activeChat = (supportSubTab === 'deleted' ? deletedChats : supportChats).find(c => c.id === selectedChatId);
    if (!activeChat) return;

    setConfirmConfig({
      title: 'Khôi phục hội thoại',
      message: 'Anh có chắc muốn khôi phục hội thoại hỗ trợ này không?',
      confirmText: 'Khôi phục',
      cancelText: 'Hủy',
      type: 'success',
      onConfirm: () => {
        messengerApi.restoreTicket(activeChat.id)
          .then(() => {
            showToast('Đã khôi phục hội thoại.', 'success');
            fetchSupportChats();
            fetchDeletedSupportChats();
            setSelectedChatId(null);
            setShowUserInfo(false);
            setShowConfirmModal(false);
          })
          .catch(err => {
            console.error('Failed to restore ticket', err);
            showToast('Failed to restore conversation.', 'error');
            setShowConfirmModal(false);
          });
      }
    });
    setShowConfirmModal(true);
  };

  
  const handleKycAction = (idRaw, approve, role) => {
    adminApi.moderateKycRequest(idRaw, approve, role)
      .then(res => {
        if (res.success) {
          showToast(approve ? 'Đã duyệt yêu cầu KYC!' : 'Đã từ chối yêu cầu KYC!', approve ? 'success' : 'error');
          fetchKycRequests();
        } else {
          showToast(res.message || 'Thao tác thất bại.', 'error');
        }
      })
      .catch(err => {
        console.error(err);
        showToast('Lỗi kết nối máy chủ.', 'error');
      });
  };

  
  const handleModAction = (item, approve) => {
    const adminId = user?.id || 1;
    let apiCall;
    const reason = approve ? 'Phê duyệt hợp lệ' : 'Không đáp ứng tiêu chuẩn kiểm duyệt';

    if (item.type === 'PROJECT') {
      apiCall = adminApi.moderateProject(item.idRaw, approve, reason, adminId);
    } else if (item.type === 'PROFILE') {
      apiCall = adminApi.moderateProfileRequest(item.idRaw, approve, reason, adminId);
    } else if (item.type === 'WITHDRAWAL') {
      const status = approve ? 'COMPLETED' : 'REJECTED'; 
      apiCall = adminApi.processWithdrawal(item.idRaw, status, adminId);
    } else if (item.type === 'GIG') {
      apiCall = adminApi.moderateGig(item.idRaw, approve, reason, adminId);
    } else if (item.type === 'REVIEW') {
      const status = approve ? 'RESOLVED' : 'DISMISSED';
      apiCall = adminApi.resolveReport(item.idRaw, status, adminId);
    } else {
      apiCall = Promise.resolve({ success: true, message: approve ? 'Đã phê duyệt mục (Demo)' : 'Đã từ chối mục (Demo)' });
    }

    apiCall
      .then(res => {
        if (res.success) {
          showToast(res.message || (approve ? 'Đã phê duyệt thành công!' : 'Đã từ chối thành công!'), approve ? 'success' : 'error');
          fetchModerationItems();
        } else {
          showToast(res.message || 'Thao tác thất bại.', 'error');
        }
      })
      .catch(err => {
        console.error(err);
        showToast('Lỗi kết nối máy chủ.', 'error');
      });
  };

  
  const filteredTasks = tasks.filter(t => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query ||
                          String(t.id || "").toLowerCase().includes(query) || 
                          String(t.type || "").toLowerCase().includes(query) || 
                          String(t.user || "").toLowerCase().includes(query) ||
                          String(t.author || "").toLowerCase().includes(query) ||
                          String(t.title || "").toLowerCase().includes(query) ||
                          String(t.description || "").toLowerCase().includes(query);
    
    if (taskFilter === 'ALL') return matchesSearch;
    return matchesSearch && String(t.status || "").toLowerCase() === taskFilter.toLowerCase();
  });

  
  const countAssigned = tasks.length;
  const countPending = tasks.filter(t => t.status === 'Pending').length;
  const countCompleted = tasks.filter(t => t.status === 'Manager đã ký duyệt').length;
  const countOverdue = tasks.filter(t => t.status === 'In Progress').length;

  
  const activeChartData = userGrowthTrend.length > 0 
    ? userGrowthTrend 
    : [
        { label: 'Mon', value: 12 },
        { label: 'Tue', value: 19 },
        { label: 'Wed', value: 15 },
        { label: 'Thu', value: 25 },
        { label: 'Fri', value: 22 },
        { label: 'Sat', value: 30 },
        { label: 'Sun', value: 28 }
      ];
  const chartHeight = 180;
  const chartWidth = 580;
  const paddingX = 40;
  const paddingY = 30;

  const points = activeChartData.map((d, i) => {
    const x = paddingX + (i * (chartWidth - paddingX * 2)) / (activeChartData.length - 1);
    const maxVal = Math.max(...activeChartData.map(item => item.value || 1), 30);
    const val = d.value || 0;
    const y = chartHeight - paddingY - (val * (chartHeight - paddingY * 2)) / maxVal;
    return { x, y, day: d.label, completion: val };
  });

  
  let smoothCurvePath = '';
  if (points.length > 0) {
    smoothCurvePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const controlX = (current.x + next.x) / 2;
      smoothCurvePath += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
    }
  }

  
  const areaPath = smoothCurvePath 
    ? `${smoothCurvePath} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`
    : '';

  
  const openChats = supportChats.filter(c => !(c.blocked_until && new Date(c.blocked_until) > new Date()));
  const claimedChats = openChats.filter(c => c.assigned_staff_id || c.assignedStaffId);
  const unclaimedChats = openChats.filter(c => !(c.assigned_staff_id || c.assignedStaffId));
  const blockedChats = supportChats.filter(c => c.blocked_until && new Date(c.blocked_until) > new Date());
  const displayedChats = (() => {
    let base;
    if (supportSubTab === 'deleted') base = deletedChats;
    else if (supportSubTab === 'blocked') base = blockedChats;
    else if (supportSubTab === 'claimed') base = claimedChats;
    else base = unclaimedChats;
    if (!chatSearch.trim()) return base;
    return base.filter(c => c.name?.toLowerCase().includes(chatSearch.toLowerCase()) || c.lastMessage?.toLowerCase().includes(chatSearch.toLowerCase()));
  })();

  
  const activeChat = (supportSubTab === 'deleted' ? deletedChats : supportChats).find(c => c.id === selectedChatId) || null;

  
  const totalCircumference = 314.16;
  const pInProg = supportStats.total > 0 ? (supportStats.inProgress / supportStats.total) : 0.54;
  const pPend = supportStats.total > 0 ? (supportStats.pending / supportStats.total) : 0.28;
  const pWait = supportStats.total > 0 ? (supportStats.waitingUser / supportStats.total) : 0.18;

  const lenInProgress = totalCircumference * pInProg;
  const lenPending = totalCircumference * pPend;
  const lenWaitingUser = totalCircumference * pWait;

  const offsetInProgress = 0;
  const offsetPending = -lenInProgress;
  const offsetWaitingUser = -(lenInProgress + lenPending);

  const displayTotal = supportStats.total;
  const displayInProgressPercent = supportStats.total > 0 ? supportStats.inProgressPercent : 54;
  const displayPendingPercent = supportStats.total > 0 ? supportStats.pendingPercent : 28;
  const displayStaffWorkload = staffList.map((s, idx) => {
    const mockNames = ["Elena Kostic", "Marcus Webb", "Jia Song"];
    const mockRoles = ["Senior Analyst", "Ops Lead", "Developer"];
    const mockTasks = [12, 8, 15];
    const mockProgress = [70, 50, 90];
    const mockEfficiency = ["98%", "94%", "89%"];
    const mockTrends = ["up", "up", "neutral"];
    
    return {
      name: s.name || s.fullName || mockNames[idx % 3],
      role: s.role || mockRoles[idx % 3],
      email: s.email,
      activeTasks: mockTasks[idx % 3],
      progress: mockProgress[idx % 3],
      efficiency: mockEfficiency[idx % 3],
      trend: mockTrends[idx % 3],
      avatar: s.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name || s.email)}&background=${idx % 2 === 0 ? '006b2c' : 'ba1a1a'}&color=fff`
    };
  });

  const finalWorkloadList = displayStaffWorkload.length > 0 ? displayStaffWorkload.slice(0, 3) : [
    { name: "Elena Kostic", role: "Senior Analyst", activeTasks: 12, progress: 70, efficiency: "98%", trend: "up", avatar: "https://ui-avatars.com/api/?name=Elena+Kostic&background=006b2c&color=fff" },
    { name: "Marcus Webb", role: "Ops Lead", activeTasks: 8, progress: 50, efficiency: "94%", trend: "up", avatar: "https://ui-avatars.com/api/?name=Marcus+Webb&background=006b2c&color=fff" },
    { name: "Jia Song", role: "Developer", activeTasks: 15, progress: 90, efficiency: "89%", trend: "neutral", avatar: "https://ui-avatars.com/api/?name=Jia+Song&background=ba1a1a&color=fff" }
  ];
  const selectedTaskMatchingItem = selectedTask ? moderationItems.find(item => 
    String(item.idRaw) === String(selectedTask.referenceId) &&
    (selectedTask.type === 'PROJECT_MODERATION' ? item.type === 'PROJECT' : item.type === 'PROFILE')
  ) : null;

  return (
    <div className="flex h-screen bg-[#f9f9ff] text-[#141b2b] font-sans antialiased overflow-hidden">
      
      
      <style>{`
        :root {
          --primary: #006b2c;
          --on-primary: #ffffff;
          --primary-container: #00873a;
          --on-primary-container: #f7fff2;
          --secondary: #006e2f;
          --on-secondary: #ffffff;
          --tertiary: #0058be;
          --background: #f9f9ff;
          --on-background: #141b2b;
          --surface: #ffffff;
          --outline-variant: #bdcaba;
          --surface-container-low: #f1f3ff;
          --surface-container-high: #e1e8fd;
        }
        .text-display-lg {
          font-size: 36px;
          font-weight: 700;
          line-height: 44px;
          letter-spacing: -0.02em;
        }
        .text-headline-lg {
          font-size: 24px;
          font-weight: 600;
          line-height: 32px;
          letter-spacing: -0.01em;
        }
        .text-title-md {
          font-size: 18px;
          font-weight: 600;
          line-height: 24px;
        }
        .text-body-lg {
          font-size: 16px;
          font-weight: 400;
          line-height: 24px;
        }
        .text-body-sm {
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
        }
        .text-label-md {
          font-size: 12px;
          font-weight: 600;
          line-height: 16px;
          letter-spacing: 0.05em;
        }
        .card-level-1 {
          background-color: #ffffff;
          border: 1px solid #e1e8fd;
          border-radius: 0.75rem;
          transition: all 0.25s ease;
        }
        .card-level-1:hover {
          box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.04);
          border-color: #bdcaba;
          transform: translateY(-2px);
        }
         .scrollbar-hidden::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hidden {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

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
          background-color: #ffffff; /* White background */
          border: 1px solid #e1e8fd; /* Light border matching dashboard */
          border-radius: 16px;
          position: absolute;
          width: 280px;
          right: 0;
          top: calc(100% + 6px);
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.02);
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

        /* Light theme typography and border overrides */
        .profile-menu-dropdown .border-b {
          border-color: #e9edff !important;
        } 

        .profile-menu-dropdown .bg-slate-100 {
          background-color: #e9edff !important;
        }

        .profile-menu-dropdown p.text-slate-400 {
          color: #6e7b6c !important; /* Muted slate green */
        }

        .profile-menu-dropdown p.text-slate-800 {
          color: #141b2b !important; /* Dark text matching theme */
        }

        .profile-menu-btn {
          color: #3e4a3d !important; /* Dark slate green */
          background-color: transparent !important;
          white-space: nowrap !important;
        }

        .profile-menu-btn:hover {
          color: #006b2c !important; /* Brand green */
          background-color: #f7fff2 !important; /* Light green hover background */
        }

        .profile-menu-btn.profile-menu-active {
          color: #006b2c !important;
          background-color: #f7fff2 !important;
        }

        .profile-menu-btn.text-rose-600 {
          color: #ba1a1a !important; /* Red */
        }

        .profile-menu-btn.text-rose-600:hover {
          color: #ba1a1a !important;
          background-color: #ffdad6 !important; /* Light red hover */
        }

        /* ORBITAL SELECTOR INDICATOR FOR PROFILE MENU ITEMS */
        .profile-menu-circle {
          width: 12px;
          height: 12px;
          background-color: transparent;
          border: 1.5px solid #bdcaba; /* Light green/slate border */
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
          background: #006b2c; /* Brand green */
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
          border-top-color: #006b2c; /* Brand green */
          opacity: 0;
          transform: scale(0.8);
          transition: all 0.3s ease;
        }

        .profile-menu-btn:hover .profile-menu-circle {
          border-color: #006b2c;
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
          border-color: #006b2c;
          transform: scale(1.0);
        }

        .profile-menu-btn.profile-menu-active .profile-menu-circle::before {
          transform: scale(1);
          background-color: #006b2c;
        }

        .profile-menu-btn.profile-menu-active .profile-menu-circle::after {
          opacity: 1;
          transform: scale(1.3);
          border-top-color: #006b2c;
          animation: profile-orbit 2s infinite linear;
          box-shadow: 0 0 8px rgba(0, 107, 44, 0.4);
        }

        @keyframes profile-orbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      
      {toast.show && (
        <div className="fixed top-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl animate-bounce bg-white border border-[#e1e8fd] max-w-sm">
          {toast.type === 'success' ? (
            <div className="w-8 h-8 rounded-full bg-[#f7fff2] flex items-center justify-center text-[#006b2c]">
              <Check className="w-5 h-5" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#ffdad6] flex items-center justify-center text-[#ba1a1a]">
              <AlertCircle className="w-5 h-5" />
            </div>
          )}
          <div>
            <p className="text-body-sm font-bold text-[#141b2b]">{toast.message}</p>
          </div>
        </div>
      )}

      
      <aside className="w-[260px] bg-white border-r border-[#e1e8fd] flex flex-col justify-between shrink-0 h-full">
        <div className="flex flex-col h-full overflow-hidden">
          
          <div className="p-6 border-b border-[#e9edff]">
            <span className="font-sans text-xl font-extrabold tracking-tight text-[#006b2c] block">
              {brandName}
            </span>
            <p className="text-[10px] text-[#6e7b6c] font-bold uppercase tracking-wider mt-0.5">
              ADMIN CONSOLE
            </p>
          </div>

          
          <div className="flex-1 overflow-y-auto py-4 px-3 space-y-4 scrollbar-hidden">
            <p className="text-[10px] font-bold text-[#6e7b6c] uppercase tracking-wider px-3 mb-1">Workspace</p>
            <nav className="space-y-1">
              {getSidebarItems().map((item) => {
                const IconComp = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-body-sm font-semibold transition-all duration-200 group relative ${
                      isActive 
                        ? 'bg-[#f7fff2] text-[#006b2c]' 
                        : 'text-[#3e4a3d] hover:bg-[#f1f3ff] hover:text-[#141b2b]'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-[20%] bottom-[20%] w-[3px] bg-[#006b2c] rounded-r-full" />
                    )}
                    <div className="flex items-center gap-3">
                      <IconComp className={`w-[18px] h-[18px] stroke-[2.2] transition-colors ${
                        isActive ? 'text-[#006b2c]' : 'text-[#6e7b6c] group-hover:text-[#141b2b]'
                      }`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 transition-colors ${
                        isActive ? 'bg-white text-[#006b2c]' : 'bg-[#e9edff] text-[#141b2b] group-hover:bg-[#d0dbff]'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        
        <div className="p-4 border-t border-[#e1e8fd] bg-[#f9f9ff]">
          <button 
            onClick={() => setShowCreateModal(true)}
            className="w-full flex items-center justify-center gap-2 bg-[#006b2c] hover:bg-[#00873a] text-white py-2.5 rounded-lg font-bold text-body-sm shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo công việc mới</span>
          </button>
        </div>
      </aside>

      
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        
        <header className="h-[64px] bg-white border-b border-[#e1e8fd] px-6 flex items-center justify-between shrink-0 z-10">
          <div className="w-80 relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-[#6e7b6c]">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Tìm kiếm công việc, nhân sự hoặc tranh chấp..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#f1f3ff] border-none text-[#141b2b] placeholder-[#6e7b6c] pl-10 pr-4 py-2 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-[#006b2c]/30 focus:bg-white border border-transparent transition-all"
            />
          </div>

          <div className="flex items-center gap-5">
            <div className="flex items-center gap-3">
              <NotificationDropdown userId={user?.id} role={user?.role} />
              <button className="p-2 text-[#6e7b6c] hover:text-[#141b2b] hover:bg-[#f1f3ff] rounded-lg transition-colors">
                <HelpCircle className="w-5 h-5" />
              </button>
              <button className="p-2 text-[#6e7b6c] hover:text-[#141b2b] hover:bg-[#f1f3ff] rounded-lg transition-colors">
                <Grid className="w-5 h-5" />
              </button>
            </div>

            <div className="h-8 w-[1px] bg-[#e1e8fd]" />

            <div className="flex items-center gap-3">
              <div className="profile-menu-wrapper">
                <div 
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-[#bdcaba]/60 bg-slate-50/40 hover:bg-slate-50 hover:border-emerald-600/40 hover:shadow-sm transition-all duration-300 cursor-pointer group"
                >
                  <div className="flex flex-col text-right sm:block hidden">
                    <span className="text-[13px] font-bold text-[#141b2b] leading-tight truncate max-w-[150px] block" title={user?.displayName || user?.email}>
                      {user?.displayName || user?.email || "Quản lý"}
                    </span>
                    <div className="flex justify-end mt-0.5">
                      <span className="inline-flex items-center text-[9px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100/60 leading-none">
                        {(user?.role || "QUẢN LÝ") + (myProfile?.departmentName ? ` / ${myProfile.departmentName}` : '')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="relative">
                    {user?.avatarUrl || user?.avatar ? (
                      <img
                        src={user?.avatarUrl || user?.avatar}
                        alt="Avatar"
                        className="w-9 h-9 rounded-full border-2 border-emerald-500/85 object-cover shadow-sm transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-bold text-white text-sm border-2 border-white shadow-sm transition-transform duration-300 group-hover:scale-105">
                        {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'Q'}
                      </div>
                    )}
                    
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                  </div>
                  
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-300 group-hover:rotate-180" />
                </div>

                <div className="profile-menu-dropdown">
                  <div className="profile-menu-item px-3 py-2 border-b border-slate-50 mb-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest text-left">
                      Tài khoản
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
                        if (onNavigate) onNavigate("preferences");
                      }}
                      className={`profile-menu-btn w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition-all mt-1 ${
                        activeTab === 'preferences'
                          ? 'profile-menu-active text-emerald-600 bg-emerald-50'
                          : 'text-slate-650 hover:text-blue-600 hover:bg-blue-50'
                      }`}
                    >
                      <Settings className="w-4 h-4" /> Cài đặt chung
                    </button>
                  </div>

                  <div className="profile-menu-item">
                    <button
                      onClick={() => {
                        setShowTransferRequestModal(true);
                      }}
                      className="profile-menu-btn w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition-all mt-1 text-slate-650 hover:text-emerald-600 hover:bg-emerald-50"
                    >
                      <ArrowLeftRight className="w-4 h-4" /> Yêu cầu điều chuyển
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
                        <MessageSquare className="w-4 h-4" /> Tin nhắn
                      </button>
                    </div>
                  )}



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
                      <LogOut className="w-4 h-4" /> Đăng xuất
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        
        <div className="flex-1 overflow-y-auto p-6 bg-[#f9f9ff]">
          
          
          {activeTab === 'Dashboard' && (
            <div className="space-y-6 max-w-7xl mx-auto pb-10">
              
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-headline-lg text-[#141b2b] font-extrabold tracking-tight">Tổng quan vận hành</h1>
                  <p className="text-body-sm text-[#6e7b6c] mt-1">Ghi nhận hiệu suất vận hành thời gian thực của phòng ban.</p>
                </div>
              </div>

              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                
                
                <div className="bg-white border border-[#e1e8fd] p-5 rounded-xl flex flex-col justify-between min-h-[140px] card-level-1">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-lg bg-[#f7fff2] text-[#006b2c] flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-[#006b2c] flex items-center gap-0.5">
                      +2 tuần này
                    </span>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs font-bold text-[#6e7b6c] uppercase tracking-wider">TỔNG NHÂN SỰ</p>
                    <h2 className="text-3xl font-extrabold text-[#141b2b] mt-1">{staffList.length}</h2>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-[#f1f3ff] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#006b2c] h-full" style={{ width: `${(staffList.filter(s => s.status === 'ACTIVE').length / (staffList.length || 1)) * 100}%` }}></div>
                    </div>
                    <p className="text-[10px] text-[#6e7b6c] font-semibold mt-1">
                      {staffList.filter(s => s.status === 'ACTIVE').length} Đang hoạt động
                    </p>
                  </div>
                </div>

                
                <div className="bg-white border border-[#e1e8fd] p-5 rounded-xl flex flex-col justify-between min-h-[140px] card-level-1">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-lg bg-[#f1f3ff] text-[#0058be] flex items-center justify-center">
                      <CheckSquare className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-[#ba1a1a] flex items-center gap-0.5">
                      -4% so với hôm qua
                    </span>
                  </div>
                  <div className="mt-2 flex justify-between items-end">
                    <div>
                      <p className="text-xs font-bold text-[#6e7b6c] uppercase tracking-wider">CÔNG VIỆC CHỜ XỬ LÝ</p>
                      <h2 className="text-3xl font-extrabold text-[#141b2b] mt-1">
                        {tasks.filter(t => t.status === 'Pending').length}
                      </h2>
                    </div>
                    <div className="flex items-end gap-1.5 h-8">
                      <div className="w-3 bg-[#e1e8fd] h-[40%] rounded-sm" />
                      <div className="w-3 bg-[#e1e8fd] h-[60%] rounded-sm" />
                      <div className="w-3 bg-[#e1e8fd] h-[80%] rounded-sm" />
                      <div className="w-3 bg-[#0058be] h-[100%] rounded-sm" />
                      <div className="w-3 bg-[#e1e8fd] h-[50%] rounded-sm" />
                    </div>
                  </div>
                </div>

                
                <div className="bg-white border border-[#e1e8fd] p-5 rounded-xl flex flex-col justify-between min-h-[140px] card-level-1">
                  <div className="w-10 h-10 rounded-lg bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div className="mt-2">
                    <p className="text-xs font-bold text-[#6e7b6c] uppercase tracking-wider">CHUYỂN CẤP</p>
                    <h2 className="text-3xl font-extrabold text-[#141b2b] mt-1">
                      {tasks.filter(t => t.priority === 'High' && t.status !== 'Manager đã ký duyệt').length}
                    </h2>
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-xs font-bold text-[#ba1a1a]">
                    <TrendingUp className="w-3.5 h-3.5 text-[#ba1a1a]" />
                    <span>Khẩn cấp</span>
                  </div>
                </div>

                
                <div className="bg-white border border-[#e1e8fd] p-5 rounded-xl flex flex-col justify-between min-h-[140px] card-level-1">
                  <div className="w-10 h-10 rounded-lg bg-[#f7fff2] text-[#006b2c] flex items-center justify-center">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div className="mt-2">
                    <p className="text-xs font-bold text-[#6e7b6c] uppercase tracking-wider">THỜI GIAN XỬ LÝ TB</p>
                    <h2 className="text-3xl font-extrabold text-[#141b2b] mt-1">2.4h</h2>
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-xs font-bold text-[#006b2c]">
                    <Zap className="w-3.5 h-3.5 text-[#006b2c]" />
                    <span>Tối ưu</span>
                  </div>
                </div>

              </div>

              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                
                <div className="lg:col-span-2 bg-white border border-[#e1e8fd] p-6 rounded-xl min-h-[320px] flex flex-col justify-between card-level-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-body-lg font-bold text-[#141b2b]">Hiệu suất Làm việc Nhân sự</h3>
                      <p className="text-xs text-[#6e7b6c]">Trung bình số lượng công việc và ticket đã xử lý theo đội ngũ.</p>
                    </div>
                    <button className="p-1.5 hover:bg-[#f1f3ff] rounded-lg text-[#6e7b6c] transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex-1 mt-6 flex items-center justify-center">
                    <svg width="100%" height="200" viewBox="0 0 400 200" className="overflow-visible select-none">
                      
                      <line x1="40" y1="20" x2="380" y2="20" stroke="#f1f3ff" strokeWidth="1" />
                      <line x1="40" y1="60" x2="380" y2="60" stroke="#f1f3ff" strokeWidth="1" />
                      <line x1="40" y1="100" x2="380" y2="100" stroke="#f1f3ff" strokeWidth="1" />
                      <line x1="40" y1="140" x2="380" y2="140" stroke="#f1f3ff" strokeWidth="1" />
                      <line x1="40" y1="170" x2="380" y2="170" stroke="#e1e8fd" strokeWidth="1.5" />

                      
                      <text x="30" y="24" textAnchor="end" className="text-[9px] fill-[#6e7b6c] font-bold">100%</text>
                      <text x="30" y="64" textAnchor="end" className="text-[9px] fill-[#6e7b6c] font-bold">75%</text>
                      <text x="30" y="104" textAnchor="end" className="text-[9px] fill-[#6e7b6c] font-bold">50%</text>
                      <text x="30" y="144" textAnchor="end" className="text-[9px] fill-[#6e7b6c] font-bold">25%</text>

                      
                      
                      <rect x="65" y="130" width="24" height="40" rx="4" fill="url(#bar-grad-1)" />
                      
                      <rect x="130" y="40" width="24" height="130" rx="4" fill="url(#bar-grad-1)" />
                      
                      <rect x="195" y="100" width="24" height="70" rx="4" fill="url(#bar-grad-1)" />
                      
                      <rect x="260" y="120" width="24" height="50" rx="4" fill="url(#bar-grad-1)" />
                      
                      <rect x="325" y="60" width="24" height="110" rx="4" fill="url(#bar-grad-2)" />

                      
                      <text x="77" y="188" textAnchor="middle" className="text-[10px] fill-[#6e7b6c] font-bold">DEV</text>
                      <text x="142" y="188" textAnchor="middle" className="text-[10px] fill-[#6e7b6c] font-bold">OPS</text>
                      <text x="207" y="188" textAnchor="middle" className="text-[10px] fill-[#6e7b6c] font-bold">SALES</text>
                      <text x="272" y="188" textAnchor="middle" className="text-[10px] fill-[#6e7b6c] font-bold">HR</text>
                      <text x="337" y="188" textAnchor="middle" className="text-[10px] fill-[#6e7b6c] font-bold">SUP</text>

                      <defs>
                        <linearGradient id="bar-grad-1" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#006b2c" />
                          <stop offset="100%" stopColor="#62df7d" />
                        </linearGradient>
                        <linearGradient id="bar-grad-2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0058be" />
                          <stop offset="100%" stopColor="#adc6ff" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </div>

                
                <div className="bg-white border border-[#e1e8fd] p-6 rounded-xl flex flex-col justify-between min-h-[320px] card-level-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-body-lg font-bold text-[#141b2b]">Khối lượng Công việc Phòng ban</h3>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-[#6e7b6c]">
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 bg-[#006b2c] rounded-full" /> Đã sử dụng
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 bg-[#f1f3ff] rounded-full" /> Còn lại
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4 mt-4 flex-1 flex flex-col justify-around">
                    
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-[#141b2b] mb-1.5">
                        <span>Vận hành cốt lõi</span>
                        <span>88%</span>
                      </div>
                      <div className="w-full bg-[#f1f3ff] h-2.5 rounded-full overflow-hidden">
                        <div className="bg-[#006b2c] h-full" style={{ width: '88%' }} />
                      </div>
                    </div>

                    
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-[#141b2b] mb-1.5">
                        <span>Đảm bảo chất lượng</span>
                        <span>64%</span>
                      </div>
                      <div className="w-full bg-[#f1f3ff] h-2.5 rounded-full overflow-hidden">
                        <div className="bg-[#006b2c] h-full" style={{ width: '64%' }} />
                      </div>
                    </div>

                    
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-[#141b2b] mb-1.5">
                        <span>Hỗ trợ khách hàng</span>
                        <span className="text-[#ba1a1a]">92%</span>
                      </div>
                      <div className="w-full bg-[#f1f3ff] h-2.5 rounded-full overflow-hidden">
                        <div className="bg-[#ba1a1a] h-full" style={{ width: '92%' }} />
                      </div>
                    </div>

                    
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-[#141b2b] mb-1.5">
                        <span>Hậu cần</span>
                        <span>45%</span>
                      </div>
                      <div className="w-full bg-[#f1f3ff] h-2.5 rounded-full overflow-hidden">
                        <div className="bg-[#006b2c] h-full" style={{ width: '45%' }} />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                
                <div className="bg-white border border-[#e1e8fd] p-6 rounded-xl lg:col-span-2 card-level-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-4 border-b border-[#e1e8fd]">
                      <h3 className="text-body-lg font-bold text-[#141b2b]">Tải công việc Nhân sự</h3>
                      <button 
                        onClick={() => setActiveTab('Staff Management')}
                        className="text-xs font-bold text-[#006b2c] hover:underline"
                      >
                        Xem danh sách
                      </button>
                    </div>

                    <div className="overflow-x-auto mt-4">
                      <table className="min-w-full divide-y divide-[#e9edff] text-left">
                        <thead>
                          <tr>
                            <th className="pb-3 text-[11px] font-bold text-[#6e7b6c] uppercase tracking-wider">Nhân viên</th>
                            <th className="pb-3 text-[11px] font-bold text-[#6e7b6c] uppercase tracking-wider text-center">Việc đang làm</th>
                            <th className="pb-3 text-[11px] font-bold text-[#6e7b6c] uppercase tracking-wider">Tiến độ tải</th>
                            <th className="pb-3 text-[11px] font-bold text-[#6e7b6c] uppercase tracking-wider text-right">Hiệu suất</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e9edff]">
                          {finalWorkloadList.map((item, idx) => (
                            <tr key={idx} className="hover:bg-[#f7fff2]/30 transition-colors">
                              <td className="py-3.5 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  <img 
                                    src={item.avatar} 
                                    alt={item.name} 
                                    className="w-9 h-9 rounded-full object-cover border border-[#bdcaba]" 
                                  />
                                  <div>
                                    <h4 className="text-body-sm font-bold text-[#141b2b]">{item.name}</h4>
                                    <p className="text-[10px] font-semibold text-[#6e7b6c]">{item.role}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 whitespace-nowrap text-center text-body-sm font-bold text-[#141b2b]">
                                {String(item.activeTasks).padStart(2, '0')}
                              </td>
                              <td className="py-3.5 whitespace-nowrap">
                                <div className="w-32 bg-[#f1f3ff] h-2 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full ${item.trend === 'neutral' ? 'bg-[#ba1a1a]' : 'bg-[#006b2c]'}`}
                                    style={{ width: `${item.progress}%` }} 
                                  />
                                </div>
                              </td>
                              <td className="py-3.5 whitespace-nowrap text-right text-body-sm font-bold text-[#006b2c]">
                                <div className="flex items-center justify-end gap-1">
                                  {item.trend === 'up' ? (
                                    <TrendingUp className="w-3.5 h-3.5 text-[#006b2c]" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5 text-[#6e7b6c]" />
                                  )}
                                  <span className={item.trend === 'neutral' ? 'text-[#ba1a1a]' : 'text-[#006b2c]'}>
                                    {item.efficiency}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                
                <div className="bg-white border border-[#e1e8fd] p-6 rounded-xl flex flex-col justify-between relative card-level-1">
                  <div>
                    <h3 className="text-body-lg font-bold text-[#141b2b] pb-4 border-b border-[#e1e8fd]">Trường hợp Chuyển cấp gần đây</h3>
                    
                    <div className="space-y-4 mt-4">
                      
                      <div className="bg-[#f9f9ff] border border-[#e1e8fd] p-4 rounded-xl relative">
                        <div className="flex items-center justify-between">
                          <span className="bg-[#ba1a1a] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
                            Khẩn cấp
                          </span>
                          <span className="text-[10px] font-bold text-[#6e7b6c]">14:22 PM</span>
                        </div>
                        <h4 className="text-body-sm font-bold text-[#141b2b] mt-2">Tranh chấp thanh toán #8821</h4>
                        <p className="text-xs text-[#3e4a3d] mt-1 line-clamp-2">
                          Nhà tuyển dụng phản ánh chưa nhận được tiền sau khi nghiệm thu cột mốc thành công...
                        </p>
                        <div className="flex items-center justify-between mt-3.5">
                          <div className="flex -space-x-1.5">
                            <img src="https://ui-avatars.com/api/?name=Client&background=0058be&color=fff" alt="User 1" className="w-5.5 h-5.5 rounded-full border border-white" />
                            <img src="https://ui-avatars.com/api/?name=Lancer&background=006b2c&color=fff" alt="User 2" className="w-5.5 h-5.5 rounded-full border border-white" />
                          </div>
                          <button 
                            onClick={() => {
                              setActiveTab('Disputes');
                              showToast('Chuyển tới chi tiết tranh chấp...', 'success');
                            }}
                            className="text-xs font-bold text-[#006b2c] hover:underline"
                          >
                            Xem & Xử lý
                          </button>
                        </div>
                      </div>

                      
                      <div className="bg-[#f9f9ff] border border-[#e1e8fd] p-4 rounded-xl relative">
                        <div className="flex items-center justify-between">
                          <span className="bg-[#293040] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
                            Trung bình
                          </span>
                          <span className="text-[10px] font-bold text-[#6e7b6c]">11:05 AM</span>
                        </div>
                        <h4 className="text-body-sm font-bold text-[#141b2b] mt-2">Báo cáo vi phạm điều khoản #7742</h4>
                        <p className="text-xs text-[#3e4a3d] mt-1 line-clamp-2">
                          Người dùng bị báo cáo do cố tình giao dịch ngoài hệ thống nhiều lần...
                        </p>
                        <div className="flex items-center justify-between mt-3.5">
                          <div className="flex">
                            <img src="https://ui-avatars.com/api/?name=User&background=bdcaba&color=000" alt="User 1" className="w-5.5 h-5.5 rounded-full border border-white" />
                          </div>
                          <button 
                            onClick={() => {
                              setActiveTab('Moderation');
                              showToast('Chuyển tới hàng đợi kiểm duyệt...', 'success');
                            }}
                            className="text-xs font-bold text-[#006b2c] hover:underline"
                          >
                            Xem xét
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  
                  <button 
                    onClick={() => setShowCreateModal(true)}
                    className="absolute bottom-6 right-6 w-11 h-11 bg-[#006b2c] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#00873a] transition-all hover:scale-105 active:scale-95"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          )}

          
          {activeTab === 'Staff Management' && (() => {
            const deptStaffList = activeDeptCode === 'ALL'
              ? staffList
              : staffList.filter(s => s.departmentId === activeDeptId);

            const deptTransferRequests = transferRequests.filter((r) => {
              if (activeDeptCode === 'ALL') return true;

              // Check if the staff member belongs to this department's staff list
              const isStaffInMyDept = deptStaffList.some(
                (s) =>
                  (s.email && r.userEmail && String(s.email).toLowerCase() === String(r.userEmail).toLowerCase()) ||
                  (s.id && r.userId && String(s.id) === String(r.userId)) ||
                  (s.staffId && r.userId && String(s.staffId) === String(r.userId))
              );

              if (isStaffInMyDept) return true;

              // Fallback: Check if fromDepartment matches and email doesn't belong to another department
              const currentCode = String(activeDeptCode || 'DIS').toUpperCase();
              const currentId = activeDeptId ? String(activeDeptId) : null;
              const email = String(r.userEmail || '').toLowerCase();

              if (currentCode === 'DIS' && (email.includes('moderation') || email.includes('staff.mod') || email.includes('staff.cs') || email.includes('staff.it'))) {
                return false;
              }

              if (currentId && String(r.fromDepartmentId) === currentId) {
                return true;
              }

              const fromCode = String(r.fromDepartmentCode || r.fromDeptCode || r.fromCode || '').toUpperCase();
              if (fromCode && fromCode === currentCode) {
                return true;
              }

              const fromName = String(r.fromDepartmentName || r.fromDepartment || '').toLowerCase();
              let targetKeywords = [];
              if (currentCode === 'DIS') targetKeywords = ['tranh chấp', 'dispute', 'khiếu nại'];
              else if (currentCode === 'MOD') targetKeywords = ['kiểm duyệt', 'moderation'];
              else if (currentCode === 'FIN') targetKeywords = ['tài chính', 'finance'];
              else if (currentCode === 'CS') targetKeywords = ['hỗ trợ', 'customer support', 'cs'];

              return targetKeywords.some(kw => fromName.includes(kw));
            });

            return (
              <div className="space-y-6 max-w-7xl mx-auto">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-headline-lg font-extrabold text-[#141b2b]">Quản lý Nhân sự & Điều chuyển</h1>
                    <p className="text-body-sm text-[#3e4a3d] mt-1">Danh sách nhân viên phòng ban và xử lý các đơn xin điều chuyển công việc.</p>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setShowTransferModal(true)}
                      className="px-4 py-2 bg-white border border-[#e1e8fd] text-[#141b2b] rounded-lg text-body-sm font-bold shadow-sm hover:bg-[#f1f3ff] transition-all flex items-center gap-2"
                    >
                      <Move className="w-4 h-4" />
                      <span>Điều chuyển Nhân sự</span>
                    </button>
                    <button 
                      onClick={() => setShowInviteModal(true)}
                      className="px-4 py-2 bg-[#006b2c] hover:bg-[#00873a] text-white rounded-lg text-body-sm font-bold shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Mời Nhân sự Mới</span>
                    </button>
                  </div>
                </div>

                {/* Sub-tabs Filter */}
                <div className="flex border-b border-[#e1e8fd] gap-6 text-sm font-semibold">
                  <button
                    onClick={() => setStaffSubTab('list')}
                    className={`pb-3 transition-colors relative ${
                      staffSubTab === 'list' ? 'text-[#006b2c] border-b-2 border-[#006b2c] font-bold' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Nhân sự hiện tại ({deptStaffList.length})
                  </button>
                  <button
                    onClick={() => setStaffSubTab('requests')}
                    className={`pb-3 transition-colors relative flex items-center gap-1.5 ${
                      staffSubTab === 'requests' ? 'text-[#006b2c] border-b-2 border-[#006b2c] font-bold' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Đơn xin điều chuyển ({deptTransferRequests.length})
                    {deptTransferRequests.filter(r => r.status === 'PENDING').length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    )}
                  </button>
                </div>

                {staffSubTab === 'list' ? (
                  <div className="card-level-1 p-6 bg-white shadow-sm rounded-2xl border border-[#e1e8fd]">
                    <table className="min-w-full divide-y divide-[#e9edff] text-left">
                      <thead>
                        <tr className="bg-[#f9f9ff]">
                          <th className="px-6 py-3.5 text-label-md text-[#6e7b6c] uppercase tracking-wider">Mã nhân sự</th>
                          <th className="px-6 py-3.5 text-label-md text-[#6e7b6c] uppercase tracking-wider">Họ và tên</th>
                          <th className="px-6 py-3.5 text-label-md text-[#6e7b6c] uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3.5 text-label-md text-[#6e7b6c] uppercase tracking-wider">Phòng ban</th>
                          <th className="px-6 py-3.5 text-label-md text-[#6e7b6c] uppercase tracking-wider">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e9edff] bg-white">
                        {deptStaffList.map((staff) => (
                          <tr key={staff.id || staff.staffId} className="hover:bg-[#f7fff2]/30 transition-colors">
                            <td className="px-6 py-4 text-body-sm font-bold text-[#006b2c]">#STF-{staff.id || staff.staffId}</td>
                            <td className="px-6 py-4 text-body-sm font-bold text-[#141b2b]">{staff.email ? staff.email.split('@')[0] : (staff.name || staff.fullName || 'Nhân viên')}</td>
                            <td className="px-6 py-4 text-body-sm text-[#3e4a3d]">{staff.email}</td>
                            <td className="px-6 py-4 text-body-sm text-[#3e4a3d] font-semibold">{staff.departmentName || 'Tổng bộ'}</td>
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-[#f7fff2] text-[#006b2c] border border-emerald-100">
                                Đang hoạt động
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  (() => {
                    const getTransferStatusInfo = (req) => {
                      const status = req?.status;
                      const isHandoverDone = req?.handoverSubmitted || status === 'COMPLETED' || status === 'HANDOVER_COMPLETED';

                      if (status === 'PENDING') {
                        return { key: 'PENDING', label: 'Chờ xử lý', colorClass: 'bg-amber-50 text-amber-700 border-amber-200' };
                      }
                      if (status === 'PENDING_HANDOVER' || (status === 'APPROVED' && !isHandoverDone)) {
                        return { key: 'PENDING_HANDOVER', label: 'Chờ bàn giao', colorClass: 'bg-orange-50 text-orange-800 border-orange-200' };
                      }
                      if (status === 'COMPLETED' || status === 'HANDOVER_COMPLETED' || (status === 'APPROVED' && isHandoverDone)) {
                        return { key: 'COMPLETED', label: 'Hoàn thành', colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
                      }
                      if (status === 'REJECTED') {
                        return { key: 'REJECTED', label: 'Đã từ chối', colorClass: 'bg-rose-50 text-rose-700 border-rose-200' };
                      }
                      return { key: status || 'PENDING', label: status || 'Chờ xử lý', colorClass: 'bg-slate-50 text-slate-700 border-slate-200' };
                    };

                    const matchesTransferTab = (req, tabValue) => {
                      if (tabValue === 'ALL') return true;
                      const info = getTransferStatusInfo(req);
                      return info.key === tabValue;
                    };

                    const filteredRequests = deptTransferRequests.filter(r => matchesTransferTab(r, transferFilter));
                    return (
                      <div className="card-level-1 p-6 bg-white shadow-sm rounded-2xl border border-[#e1e8fd]">
                        {/* Filter buttons */}
                        <div className="mb-6 flex flex-wrap gap-2 items-center justify-between border-b border-slate-100 pb-5">
                          <div className="flex flex-wrap gap-2">
                            {[
                              { label: 'Tất cả', value: 'ALL' },
                              { label: 'Chờ xử lý', value: 'PENDING' },
                              { label: 'Chờ bàn giao', value: 'PENDING_HANDOVER' },
                              { label: 'Hoàn thành', value: 'COMPLETED' },
                              { label: 'Đã từ chối', value: 'REJECTED' }
                            ].map(tab => {
                              const count = deptTransferRequests.filter(r => matchesTransferTab(r, tab.value)).length;
                              return (
                                <button
                                  key={tab.value}
                                  onClick={() => setTransferFilter(tab.value)}
                                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                                    transferFilter === tab.value
                                      ? 'bg-[#eaf4eb] text-[#006b2c] shadow-sm border border-[#006b2c]/20'
                                      : 'bg-slate-50 text-slate-550 border border-slate-200/60 hover:bg-slate-100/70'
                                  }`}
                                >
                                  {tab.label}
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                                    transferFilter === tab.value
                                      ? 'bg-[#006b2c] text-white'
                                      : 'bg-slate-200 text-slate-650'
                                  }`}>
                                    {count}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <table className="min-w-full divide-y divide-[#e9edff] text-left">
                        <thead>
                          <tr className="bg-[#f9f9ff]">
                            <th className="px-6 py-3.5 text-label-md text-[#6e7b6c] uppercase tracking-wider">Mã đơn</th>
                            <th className="px-6 py-3.5 text-label-md text-[#6e7b6c] uppercase tracking-wider">Nhân viên</th>
                            <th className="px-6 py-3.5 text-label-md text-[#6e7b6c] uppercase tracking-wider">Phòng ban đi</th>
                            <th className="px-6 py-3.5 text-label-md text-[#6e7b6c] uppercase tracking-wider">Phòng ban đến</th>
                            <th className="px-6 py-3.5 text-label-md text-[#6e7b6c] uppercase tracking-wider">Ngày gửi</th>
                            <th className="px-6 py-3.5 text-label-md text-[#6e7b6c] uppercase tracking-wider">Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e9edff] bg-white">
                          {filteredRequests.length === 0 ? (
                            <tr>
                              <td colSpan="6" className="text-center py-8 text-slate-400 font-bold">
                                Không tìm thấy yêu cầu điều chuyển nào phù hợp.
                              </td>
                            </tr>
                          ) : (
                            filteredRequests.map((req) => (
                              <tr
                                key={req.requestId}
                                onClick={() => {
                                  setSelectedTransferRequest(req);
                                  setShowTransferDetailModal(true);
                                }}
                                className="hover:bg-[#f7fff2]/60 transition-colors cursor-pointer group"
                              >
                                <td className="px-6 py-4">
                                  <span className="text-body-sm font-extrabold text-[#006b2c] group-hover:underline">
                                    #REQ-{req.requestId}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex flex-col">
                                    <span className="text-body-sm font-bold text-[#141b2b]">{req.userDisplayName || 'Nhân viên'}</span>
                                    <span className="text-[11px] text-slate-400 font-mono mt-0.5">{req.userEmail}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-body-sm text-[#3e4a3d] font-semibold">
                                  {req.fromDepartment || 'Chưa rõ'}
                                </td>
                                <td className="px-6 py-4 text-body-sm text-[#006b2c] font-bold">
                                  {req.toDepartment || 'Chưa rõ'}
                                </td>
                                <td className="px-6 py-4 text-body-sm text-[#6e7b6c] font-semibold">
                                  {req.createdAt ? new Date(req.createdAt).toLocaleDateString('vi-VN') : ''}
                                </td>
                                <td className="px-6 py-4">
                                  {(() => {
                                    const info = getTransferStatusInfo(req);
                                    return (
                                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${info.colorClass}`}>
                                        {info.label}
                                      </span>
                                    );
                                  })()}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  );
                })()
              )}
              </div>
            )})()}
          {activeTab === 'Support' && (() => {
            const matchesChatSearch = (c) => c.name.toLowerCase().includes(chatSearch.toLowerCase());
            const openChats = supportChats.filter(c => !(c.blocked_until && new Date(c.blocked_until) > new Date()));
            const claimedChats = openChats.filter(c => normalizeId(c.assigned_staff_id || c.assignedStaffId) === normalizeId(user?.id));
            const unclaimedChats = openChats.filter(c => !(c.assigned_staff_id || c.assignedStaffId));
            const blockedChats = supportChats.filter(c => c.blocked_until && new Date(c.blocked_until) > new Date());
            const displayedChats = supportSubTab === 'claimed'
              ? claimedChats.filter(matchesChatSearch)
              : supportSubTab === 'unclaimed'
                ? unclaimedChats.filter(matchesChatSearch)
                : supportSubTab === 'blocked'
                  ? blockedChats.filter(matchesChatSearch)
                  : deletedChats.filter(matchesChatSearch);

            const activeChat = (supportSubTab === 'deleted' ? deletedChats : supportChats).find(c => c.id === selectedChatId);

            const handleClaimTicket = async () => {
              try {
                if (!user?.id || !selectedChatId) return;
                await messengerApi.claimTicket(selectedChatId, user.id);
                showToast("Đã tiếp nhận hội thoại thành công", "success");
              } catch (err) {
                console.error("Failed to claim support ticket", err);
                showToast("Không thể tiếp nhận hội thoại", "error");
              }
            };

            return (
              <div className="max-w-6xl mx-auto h-[calc(100vh-140px)] flex flex-col">
                <div className="mb-4">
                  <h1 className="text-headline-lg font-extrabold text-[#141b2b]">Trung tâm hỗ trợ</h1>
                  <p className="text-body-sm text-[#3e4a3d] mt-1">Hỗ trợ khách hàng và tư vấn tranh chấp trực tiếp.</p>
                </div>

                
                <div className="flex-1 bg-white border border-[#e1e8fd] rounded-xl flex overflow-hidden shadow-sm">
                  
                  
                  <div className="w-[320px] border-r border-[#e1e8fd] flex flex-col bg-white shrink-0">
                    <div className="p-4 border-b border-[#e1e8fd] space-y-3">
                      <div className="relative">
                        <span className="absolute inset-y-0 left-3 flex items-center text-[#6e7b6c]">
                          <Search className="w-4 h-4" />
                        </span>
                        <input
                          type="text"
                          placeholder="Tìm liên hệ..."
                          value={chatSearch}
                          onChange={(e) => setChatSearch(e.target.value)}
                          className="w-full bg-[#f1f3ff] border-none placeholder-[#6e7b6c] pl-10 pr-4 py-2 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-[#006b2c]/30 focus:bg-white border transition-all"
                        />
                      </div>

                      
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => { setSupportSubTab('unclaimed'); setSelectedChatId(null); }}
                          className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all border text-center ${
                            supportSubTab === 'unclaimed'
                              ? 'bg-[#006b2c] text-white border-[#006b2c] shadow-sm shadow-[#006b2c]/10'
                              : 'bg-[#f1f3ff] text-[#3e4a3d] border-transparent hover:bg-[#e1e8fd]'
                          }`}
                        >
                          Chưa tiếp nhận ({unclaimedChats.length})
                        </button>
                        <button
                          onClick={() => { setSupportSubTab('claimed'); setSelectedChatId(null); }}
                          className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all border text-center ${
                            supportSubTab === 'claimed'
                              ? 'bg-[#006b2c] text-white border-[#006b2c] shadow-sm shadow-[#006b2c]/10'
                              : 'bg-[#f1f3ff] text-[#3e4a3d] border-transparent hover:bg-[#e1e8fd]'
                          }`}
                        >
                          Đã tiếp nhận ({claimedChats.length})
                        </button>
                        <button
                          onClick={() => { setSupportSubTab('blocked'); setSelectedChatId(null); }}
                          className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all border text-center ${
                            supportSubTab === 'blocked'
                              ? 'bg-[#ba1a1a] text-white border-[#ba1a1a] shadow-sm'
                              : 'bg-[#f1f3ff] text-[#3e4a3d] border-transparent hover:bg-[#e1e8fd]'
                          }`}
                        >
                          Đã chặn ({blockedChats.length})
                        </button>
                        <button
                          onClick={() => { setSupportSubTab('deleted'); setSelectedChatId(null); fetchDeletedSupportChats(); }}
                          className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all border text-center ${
                            supportSubTab === 'deleted'
                              ? 'bg-slate-700 text-white border-slate-700 shadow-sm'
                              : 'bg-[#f1f3ff] text-[#3e4a3d] border-transparent hover:bg-[#e1e8fd]'
                          }`}
                        >
                          Đã xóa
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-[#e9edff] scrollbar-hidden">
                      {displayedChats.map((chat) => (
                        <button
                          key={chat.id}
                          onClick={() => handleSelectSupportChat(chat)}
                          className={`w-full text-left p-4 flex gap-3 transition-colors ${
                            selectedChatId === chat.id 
                              ? 'bg-[#f7fff2]/50 border-l-[3px] border-[#006b2c]' 
                              : 'hover:bg-[#f9f9ff]'
                          }`}
                        >
                          <img src={chat.avatar} alt={chat.name} className="w-10 h-10 rounded-full object-cover border border-[#bdcaba] shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="text-body-sm font-bold text-[#141b2b] truncate">{chat.name}</h4>
                              <span className="text-[10px] text-[#6e7b6c] font-bold">{chat.time}</span>
                            </div>
                            <p className="text-xs text-[#3e4a3d] truncate mt-1">{chat.lastMessage}</p>
                          </div>
                          {chat.unread > 0 && (
                            <span className="w-5 h-5 rounded-full bg-[#006b2c] text-white text-[10px] font-extrabold flex items-center justify-center shrink-0">
                              {chat.unread}
                            </span>
                          )}
                        </button>
                      ))}
                      {displayedChats.length === 0 && (
                        <div className="p-8 text-center text-slate-400 text-xs">
                          Không có hội thoại hỗ trợ nào.
                        </div>
                      )}
                    </div>
                  </div>

                  
                  {!activeChat ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#f9f9ff]">
                      <div className="w-16 h-16 bg-emerald-50 text-[#006b2c] rounded-2xl flex items-center justify-center mb-4 border border-[#bdcaba]">
                        <MessageSquare className="w-7 h-7" />
                      </div>
                      <h4 className="text-body-lg font-bold text-[#141b2b] mb-1">Chọn một hội thoại</h4>
                      <p className="text-body-sm text-[#6e7b6c] max-w-xs leading-relaxed">
                        Choose a chat from the contact list on the left to start live support messaging and user moderation.
                      </p>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col bg-[#f9f9ff] min-w-0">
                      
                      
                      <div className="px-6 py-4 bg-white border-b border-[#e1e8fd] flex items-center justify-between shrink-0">
                        <div 
                          className="flex items-center gap-3 cursor-pointer hover:bg-[#f9f9ff] p-1.5 rounded-lg transition-all"
                          onClick={() => setShowUserInfo(!showUserInfo)}
                        >
                          <img src={activeChat.avatar} alt={activeChat.name} className="w-10 h-10 rounded-full object-cover border border-[#bdcaba]" />
                          <div>
                            <h4 className="text-body-sm font-bold text-[#141b2b]">{activeChat.name}</h4>
                            <span className="text-[10px] font-bold text-[#6e7b6c] flex items-center gap-1">
                              {activeChat.blocked_until && new Date(activeChat.blocked_until) > new Date() ? (
                                <span className="text-rose-600">Đã chặn</span>
                              ) : (
                                <>
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setShowUserInfo(!showUserInfo)}
                            className={`p-2 rounded-lg transition-colors border border-[#e1e8fd] hover:bg-[#f1f3ff] ${
                              showUserInfo ? 'bg-[#f1f3ff] text-[#141b2b]' : 'bg-white text-[#6e7b6c]'
                            }`}
                          >
                            <User className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setShowUserInfo(!showUserInfo)}
                            className="p-2 text-[#6e7b6c] hover:text-[#ba1a1a] hover:bg-[#ffdad6] rounded-lg transition-colors border border-[#e1e8fd] bg-white"
                          >
                            <ShieldAlert className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      
                      <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {Array.isArray(chatMessages) && chatMessages.map((m, idx) => {
                          const isMe = isOwnSupportMessage(m);
                          const msgTime = m.sentAt ? new Date(m.sentAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';
                          return (
                            <div key={m.messageId || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                {m.messageText &&
                                  m.messageText.trim() !== "" &&
                                  !(
                                    m.attachments &&
                                    m.attachments.length > 0 &&
                                    (m.messageText === "[Hình ảnh]" || m.messageText === "[Tệp đính kèm]")
                                  ) && (
                                  <div className={`px-4 py-2.5 rounded-2xl text-body-sm leading-relaxed ${
                                    isMe 
                                      ? 'bg-[#006b2c] text-white rounded-tr-none' 
                                      : 'bg-white border border-[#e1e8fd] text-[#141b2b] rounded-tl-none shadow-sm'
                                  }`}>
                                    {m.messageText}
                                  </div>
                                )}
                                
                                {/* Attachments rendering */}
                                {m.attachments && m.attachments.length > 0 && (
                                  <div className={`mt-2 flex flex-col gap-2 ${isMe ? "items-end" : "items-start"}`}>
                                    {m.attachments.map((att, attIdx) => {
                                      const isImg = /\.(jpg|jpeg|png|gif|webp)$/i.test(att.fileUrl || "");
                                      if (isImg) {
                                        return (
                                          <a key={attIdx} href={att.fileUrl} target="_blank" rel="noopener noreferrer" className="block max-w-xs md:max-w-md overflow-hidden rounded-xl border border-slate-200">
                                            <img src={att.fileUrl} alt={att.fileName || "Image"} className="w-full h-auto object-cover max-h-60" />
                                          </a>
                                        );
                                      }
                                      return (
                                        <a key={attIdx} href={att.fileUrl} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-3 p-3 rounded-xl border ${isMe ? "bg-white/10 border-white/20 text-white hover:bg-white/20" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"} transition-all`}>
                                          <div className={`p-2 rounded-lg ${isMe ? "bg-white/20" : "bg-slate-100"}`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold truncate max-w-[150px]">{att.fileName}</p>
                                            <p className={`text-[10px] ${isMe ? "text-emerald-100" : "text-slate-500"}`}>{(att.fileSize / 1024).toFixed(1)} KB</p>
                                          </div>
                                        </a>
                                      );
                                    })}
                                  </div>
                                )}
                                
                                <span className="text-[10px] text-[#6e7b6c] font-bold mt-1 px-1">{msgTime}</span>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>

                      
                      {activeChat.blocked_until && new Date(activeChat.blocked_until) > new Date() ? (
                        <div className="flex items-center justify-center p-4 bg-slate-100 border-t border-[#e1e8fd] h-[76px] shrink-0">
                          <AlertCircle className="w-5 h-5 text-rose-500 mr-2 shrink-0" />
                          <span className="text-xs font-bold text-slate-600">
                            This user is currently suspended from chat.
                          </span>
                        </div>
                      ) : !(activeChat.assigned_staff_id || activeChat.assignedStaffId) ? (
                        <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border-t border-[#e1e8fd] h-[76px] shrink-0">
                          <button 
                            onClick={handleClaimTicket}
                            className="px-6 py-2 bg-[#006b2c] hover:bg-[#00873a] text-white rounded-lg text-sm font-bold shadow-md transition-all flex items-center gap-2"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Nhận hỗ trợ hội thoại này
                          </button>
                        </div>
                      ) : normalizeId(activeChat.assigned_staff_id || activeChat.assignedStaffId) !== normalizeId(user?.id) ? (
                        <div className="flex items-center justify-center p-4 bg-slate-100 border-t border-[#e1e8fd] h-[76px] shrink-0">
                          <AlertCircle className="w-5 h-5 text-amber-500 mr-2 shrink-0" />
                          <span className="text-xs font-bold text-slate-600">
                            Hội thoại này đang được xử lý bởi quản lý/nhân viên khác.
                          </span>
                        </div>
                      ) : (
                        <form onSubmit={handleSendChat} className="p-4 bg-white border-t border-[#e1e8fd] flex items-center gap-3 shrink-0">
                          <button type="button" className="p-2 text-[#6e7b6c] hover:text-[#141b2b] rounded-lg hover:bg-[#f1f3ff] transition-all">
                            <Paperclip className="w-5 h-5" />
                          </button>
                          <input
                            type="text"
                            placeholder="Nhập tin nhắn trả lời..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            className="flex-1 bg-[#f1f3ff] border-none text-[#141b2b] placeholder-[#6e7b6c] px-4 py-2.5 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-[#006b2c]/30 focus:bg-white border transition-all"
                          />
                          <button
                            type="submit"
                            className="p-2.5 bg-[#006b2c] text-white rounded-lg hover:bg-[#00873a] transition-all shadow-md"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </form>
                      )}

                    </div>
                  )}

                  
                  {showUserInfo && activeChat && (
                    <div className="w-80 border-l border-[#e1e8fd] bg-white flex flex-col h-full shrink-0 overflow-y-auto animate-in slide-in-from-right duration-200">
                      <div className="p-6 border-b border-[#e9edff] flex flex-col items-center">
                        <div className="relative mb-4">
                          <img
                            src={activeChat.avatar}
                            alt="User avatar"
                            className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md"
                          />
                        </div>
                        <h3 className="font-bold text-title-md text-[#141b2b] mb-1">{activeChat.name}</h3>
                        <p className="text-xs text-[#6e7b6c] font-semibold mb-3">{activeChat.sender_email || activeChat.senderEmail || 'No email provided'}</p>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider ${
                          activeChat.sender_role === 'EMPLOYER' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                        }`}>
                          {activeChat.sender_role || 'CLIENT'}
                        </span>
                      </div>

                      <div className="p-6 flex flex-col gap-6">
                        
                        <div>
                          <h4 className="text-[10px] font-bold text-[#6e7b6c] uppercase tracking-wider mb-3">Account Information</h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center bg-[#f9f9ff] p-3 rounded-xl border border-[#e1e8fd]">
                              <span className="text-xs font-semibold text-[#3e4a3d]">Status</span>
                              {(() => {
                                const status = activeChat.sender_status;
                                if (status === 'LOCKED' || status === 'locked') return <span className="text-xs font-bold text-amber-600">Locked</span>;
                                if (status === 'BANNED' || status === 'banned') return <span className="text-xs font-bold text-rose-600">Banned</span>;
                                return <span className="text-xs font-bold text-emerald-600">Active</span>;
                              })()}
                            </div>
                            <div className="flex justify-between items-center bg-[#f9f9ff] p-3 rounded-xl border border-[#e1e8fd]">
                              <span className="text-xs font-semibold text-[#3e4a3d]">Member Since</span>
                              <span className="text-xs font-bold text-[#141b2b]">
                                {activeChat.sender_created_at ? new Date(activeChat.sender_created_at).toLocaleDateString('vi-VN') : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>

                        
                        <div>
                          <h4 className="text-[10px] font-bold text-[#6e7b6c] uppercase tracking-wider mb-3">Moderation Actions</h4>
                          
                          
                          <div className="flex flex-col gap-2 mb-4">
                            {activeChat.blocked_until && new Date(activeChat.blocked_until) > new Date() ? (
                              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                <p className="text-xs font-semibold text-amber-800 mb-2">
                                  Suspended until: <br />
                                  {new Date(activeChat.blocked_until).toLocaleString('vi-VN')}
                                </p>
                                <button
                                  onClick={() => handleBlockUser(0)}
                                  className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all"
                                >
                                  Unblock Now
                                </button>
                              </div>
                            ) : (
                              <div className="bg-[#f9f9ff] border border-[#e1e8fd] rounded-xl p-3">
                                <p className="text-xs font-semibold text-[#3e4a3d] mb-2">Suspend User Chat</p>
                                <div className="grid grid-cols-2 gap-2">
                                  <button onClick={() => handleBlockUser(1)} className="py-1.5 bg-white border border-[#e1e8fd] hover:border-amber-400 hover:bg-amber-50 text-slate-700 rounded-lg text-xs font-bold transition-all">1 Day</button>
                                  <button onClick={() => handleBlockUser(3)} className="py-1.5 bg-white border border-[#e1e8fd] hover:border-amber-400 hover:bg-[#bdcaba] text-slate-700 rounded-lg text-xs font-bold transition-all">3 Days</button>
                                  <button onClick={() => handleBlockUser(7)} className="py-1.5 bg-white border border-[#e1e8fd] hover:border-amber-400 hover:bg-amber-50 text-slate-700 rounded-lg text-xs font-bold transition-all">7 Days</button>
                                  <button onClick={() => handleBlockUser(-1)} className="py-1.5 bg-white border border-[#e1e8fd] hover:border-rose-400 hover:bg-rose-50 text-rose-600 rounded-lg text-xs font-bold transition-all">Permanent</button>
                                </div>
                              </div>
                            )}
                          </div>

                          
                          {supportSubTab === 'deleted' ? (
                            <button
                              onClick={handleRestoreTicket}
                              className="w-full py-2.5 bg-emerald-50 hover:bg-[#f7fff2] text-[#006b2c] border border-[#bdcaba] rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
                            >
                              Khôi phục hội thoại
                            </button>
                          ) : (
                            <button
                              onClick={handleDeleteTicket}
                              className="w-full py-2.5 bg-rose-50 hover:bg-[#ffdad6] text-[#ba1a1a] border border-[#ffdad6] rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
                            >
                              Xóa hội thoại
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            );
          })()}

          
          {activeTab === 'Moderation' && (() => {
            const pendingItems = moderationItems.filter(item => {
              if (item.status !== 'Pending') return false;
              const hasTask = tasks.some(t => 
                t.status !== 'Manager đã ký duyệt' && 
                t.status !== 'Rejected' && 
                String(t.referenceId) === String(item.idRaw) &&
                (item.type === 'PROFILE' ? t.type === 'PROFILE_MODERATION' : t.type === 'PROJECT_MODERATION')
              );
              return !hasTask;
            });
            const processedItems = moderationItems.filter(item => item.status !== 'Pending');
            const escalatedModerationTasks = tasks.filter(t => 
              t.status === 'Escalated' && 
              (t.type === 'PROJECT_MODERATION' || t.type === 'GIG_MODERATION' || t.type === 'PROFILE_MODERATION')
            );

            const moderationTabs = [
              { id: 'queue', label: 'Hàng đợi', count: pendingItems.length },
              { id: 'escalation', label: 'Chuyển cấp', count: escalatedModerationTasks.length }
            ];

            const filteredPendingItems = pendingItems.filter(item => {
              if (queueTab !== 'ALL' && item.type !== queueTab) return false;
              if (queueSearch) {
                const lowerSearch = queueSearch.toLowerCase();
                return (item.title?.toLowerCase().includes(lowerSearch) || 
                        item.author?.toLowerCase().includes(lowerSearch) ||
                        item.reason?.toLowerCase().includes(lowerSearch));
              }
              return true;
            });

            return (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                <div>
                  <h1 className="text-headline-lg font-extrabold text-[#141b2b]">Kiểm duyệt</h1>
                  <p className="text-body-sm text-[#3e4a3d] mt-1">Xử lý bài đăng, hồ sơ và các trường hợp cần chuyển cấp.</p>
                </div>
                <div className="grid grid-cols-2 gap-2 min-w-[240px]">
                  <div className="bg-white border border-[#e1e8fd] rounded-lg px-3 py-2">
                    <p className="text-[10px] font-bold text-[#6e7b6c] uppercase">Chờ xử lý</p>
                    <p className="text-title-md font-extrabold text-[#141b2b]">{pendingItems.length}</p>
                  </div>
                  <div className="bg-white border border-[#e1e8fd] rounded-lg px-3 py-2">
                    <p className="text-[10px] font-bold text-[#6e7b6c] uppercase">Đã xử lý</p>
                    <p className="text-title-md font-extrabold text-[#006b2c]">{processedItems.length}</p>
                  </div>
                </div>
              </div>

              {/* Sub-tabs Selection */}
              <div className="bg-white border border-[#e1e8fd] rounded-xl p-3">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {moderationTabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setModerationView(tab.id)}
                      className={`px-3 py-2 rounded-lg text-xs font-extrabold transition-all border ${
                        moderationView === tab.id
                          ? 'bg-[#006b2c] text-white border-[#006b2c]'
                          : 'bg-[#f1f3ff] text-[#3e4a3d] border-transparent hover:bg-[#e1e8fd]'
                      }`}
                    >
                      {tab.label} ({tab.count})
                    </button>
                  ))}
                </div>
              </div>

              {moderationView === 'queue' && (
                <div className="card-level-1 bg-white overflow-hidden border border-[#e1e8fd] rounded-xl">
                  <div className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#e9edff]">
                    <div className="flex gap-2 overflow-x-auto">
                      {[
                        { id: 'ALL', label: 'Tất cả' },
                        { id: 'PROFILE', label: 'Hồ sơ' },
                        { id: 'PROJECT', label: 'Dự án' }
                      ].map(qTab => (
                        <button
                          key={qTab.id}
                          onClick={() => setQueueTab(qTab.id)}
                          className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all whitespace-nowrap border ${
                            queueTab === qTab.id
                              ? 'bg-[#141b2b] text-white border-[#141b2b]'
                              : 'bg-transparent text-[#6e7b6c] border-[#bdcaba] hover:bg-[#f1f3ff] hover:text-[#3e4a3d]'
                          }`}
                        >
                          {qTab.label}
                        </button>
                      ))}
                    </div>
                    <div className="w-full md:w-64 relative">
                      <span className="absolute inset-y-0 left-3 flex items-center text-[#6e7b6c]"><Search className="w-4 h-4" /></span>
                      <input type="text" placeholder="Tìm tên, người đăng..." value={queueSearch} onChange={(e) => setQueueSearch(e.target.value)} className="w-full pl-9 pr-3 py-1.5 bg-[#f9f9ff] border border-[#e1e8fd] rounded-full text-xs font-medium text-[#141b2b] focus:outline-none focus:border-[#006b2c] focus:ring-1 focus:ring-[#006b2c]/20 transition-all" />
                    </div>
                  </div>
                  <table className="min-w-full divide-y divide-[#e9edff] text-left">
                    <thead>
                      <tr className="bg-[#f9f9ff]">
                        <th className="px-4 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">Item Details</th>
                        <th className="px-4 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">Author</th>
                        <th className="px-4 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">Flag Reason</th>
                        <th className="px-4 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-right text-label-md text-[#6e7b6c] uppercase tracking-wider">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e9edff] bg-white">
                      {filteredPendingItems.map((item) => (
                        <tr key={item.id} className="hover:bg-[#f7fff2]/30 transition-colors">
                          <td className="px-4 py-4">
                            <div className="min-w-[220px]">
                              <span className="text-[10px] font-bold text-[#006b2c] uppercase tracking-wide bg-[#f7fff2] px-2 py-0.5 rounded">
                                {item.type}
                              </span>
                              <h4 className="text-body-sm font-bold text-[#141b2b] mt-1.5 group cursor-pointer hover:text-[#006b2c] transition-colors" onClick={() => { setSelectedModerationItem(item); setShowModerationModal(true); }}>{item.title}</h4>
                              <p className="text-xs text-[#6e7b6c] mt-0.5 line-clamp-1">{item.detail}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-body-sm font-semibold text-[#141b2b]">{item.author}</td>
                          <td className="px-4 py-4 text-body-sm font-bold text-amber-700">{item.reason}</td>
                          <td className="px-4 py-4 text-body-sm font-bold text-[#3e4a3d]">{item.subDate}</td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.status === 'Approved' ? 'bg-[#f7fff2] text-[#006b2c]' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            {(() => {
                              const isAssigned = tasks.some(t => 
                                t.status !== 'Manager đã ký duyệt' && 
                                t.status !== 'Rejected' && 
                                String(t.referenceId) === String(item.idRaw) &&
                                (item.type === 'PROFILE' ? t.type === 'PROFILE_MODERATION' : t.type === 'PROJECT_MODERATION')
                              );
                              return isAssigned ? (
                                <span className="px-3 py-1.5 bg-slate-100 text-slate-500 text-xs font-bold rounded whitespace-nowrap inline-block">
                                  Đã phân công
                                </span>
                              ) : (
                                <button 
                                  onClick={() => {
                                    setCreateForm(prev => ({
                                      ...prev,
                                      taskType: item.type === 'PROFILE' ? 'PROFILE_MODERATION' : 'PROJECT_MODERATION',
                                      title: item.title,
                                      referenceId: item.idRaw,
                                      description: item.detail,
                                      requiredDepartments: activeDeptCode === 'ALL' ? 'MOD' : activeDeptCode
                                    }));
                                    setShowCreateModal(true);
                                  }} 
                                  className="px-3 py-1.5 bg-[#f1f3ff] text-[#0058be] text-xs font-bold rounded hover:bg-[#e1e8fd] transition-colors whitespace-nowrap"
                                >
                                  Phân công
                                </button>
                              );
                            })()}
                          </td>
                        </tr>
                      ))}
                      {filteredPendingItems.length === 0 && (
                        <tr>
                          <td colSpan="6" className="px-4 py-8 text-center text-[#6e7b6c] text-sm">
                            Không có nội dung nào đang chờ kiểm duyệt.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {moderationView === 'escalation' && (
                <div className="bg-white border border-[#e1e8fd] rounded-xl p-5">
                  <h2 className="text-title-md font-extrabold text-[#141b2b] mb-4">Trường hợp chờ cấp trên quyết định</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {escalatedModerationTasks.map(task => (
                      <div key={task.taskId} className="border border-rose-200 bg-rose-50 rounded-xl p-4">
                        <div className="flex justify-between items-start mb-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            task.priority === 'High' ? 'bg-rose-200 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>{task.priority} Priority</span>
                          <span className="text-xs text-rose-600 font-semibold">#TSK-{task.taskId}</span>
                        </div>
                        <h3 className="text-body-md font-bold text-[#141b2b] mb-2">{task.title}</h3>
                        <p className="text-xs text-[#3e4a3d] mb-4 line-clamp-3">{task.description}</p>
                        <button 
                          className="w-full py-2 bg-white border border-rose-200 text-rose-700 font-bold text-sm rounded-lg hover:bg-rose-100 transition-colors"
                          onClick={() => {
                            setSelectedTask(task);
                            setShowManageModal(true);
                          }}
                        >
                          Xem chi tiết & Xử lý
                        </button>
                      </div>
                    ))}
                    {escalatedModerationTasks.length === 0 && (
                      <div className="col-span-2 text-center py-10 bg-slate-50 rounded-xl border border-dashed border-[#bdcaba]">
                        <p className="text-sm text-[#6e7b6c]">Không có trường hợp kiểm duyệt nào đang chuyển cấp.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            );
          })()}

          
          {activeTab === 'KYC' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div>
                <h1 className="text-headline-lg font-extrabold text-[#141b2b]">Identity KYC Approvals</h1>
                <p className="text-body-sm text-[#3e4a3d] mt-1">Review legal identity verifications for freelancers and employers.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {kycRequests.map((req) => (
                  <div key={req.id} className="card-level-1 p-6 bg-white flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-4 border-b border-[#e9edff]">
                        <div>
                          <span className="text-xs font-bold text-[#6e7b6c]">{req.id}</span>
                          <h3 className="text-body-lg font-bold text-[#141b2b] mt-0.5">{req.name}</h3>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          req.role === 'FREELANCER' ? 'bg-[#f7fff2] text-[#006b2c]' : 'bg-blue-50 text-[#0058be]'
                        }`}>
                          {req.role}
                        </span>
                      </div>

                      <div className="py-4 space-y-2.5">
                        <div className="flex justify-between text-body-sm">
                          <span className="font-semibold text-[#6e7b6c]">Document Type:</span>
                          <span className="font-bold text-[#141b2b]">{req.docType}</span>
                        </div>
                        <div className="flex justify-between text-body-sm">
                          <span className="font-semibold text-[#6e7b6c]">Submit Date:</span>
                          <span className="font-bold text-[#3e4a3d]">{req.subDate}</span>
                        </div>
                        <div className="flex justify-between text-body-sm">
                          <span className="font-semibold text-[#6e7b6c]">Email Address:</span>
                          <span className="font-bold text-[#141b2b]">{req.email}</span>
                        </div>
                        <div className="mt-3">
                          <span className="block text-xs font-semibold text-[#6e7b6c] mb-1">Attached Document Preview:</span>
                          <div className="relative border border-[#e1e8fd] rounded-lg overflow-hidden h-36 bg-slate-50 flex items-center justify-center group">
                            <img src={req.docUrl} alt="KYC Document" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <a href={req.docUrl} target="_blank" rel="noreferrer" className="p-2 bg-white text-slate-800 rounded-full shadow-lg">
                                <Eye className="w-4 h-4" />
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-[#e9edff] pt-4 flex items-center justify-between">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        req.status === 'Approved' ? 'bg-[#f7fff2] text-[#006b2c]' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {req.status}
                      </span>

                      {req.status === 'Pending' ? (
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => handleKycAction(req.idRaw, false, req.role)}
                            className="px-3 py-1.5 bg-white border border-[#ffdad6] hover:bg-[#ffdad6] text-[#ba1a1a] rounded-lg text-xs font-bold transition-all"
                          >
                            Reject
                          </button>
                          <button 
                            onClick={() => handleKycAction(req.idRaw, true, req.role)}
                            className="px-3 py-1.5 bg-[#006b2c] hover:bg-[#00873a] text-white rounded-lg text-xs font-bold transition-all"
                          >
                            Approve Verify
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-[#6e7b6c] font-bold">Processed</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ---------------- TAB: DISPUTES ---------------- */}
          {activeTab === 'Disputes' && (() => {
            const pendingDisputes = escalationCases.filter(esc => esc.raw?.status === 'OPEN' || esc.raw?.status === 'PENDING');
            const resolvedDisputes = escalationCases.filter(esc => esc.raw?.status !== 'OPEN' && esc.raw?.status !== 'PENDING');

            return (
              <div className="space-y-6 max-w-7xl mx-auto">
                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                  <div>
                    <h1 className="text-headline-lg font-extrabold text-[#141b2b]">Xử lý Tranh chấp / Khiếu nại</h1>
                    <p className="text-body-sm text-[#3e4a3d] mt-1">
                      Phân xử số tiền ký quỹ Escrow giữa Client và Freelancer khi xảy ra mâu thuẫn dự án.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 min-w-[240px]">
                    <div className="bg-white border border-[#e1e8fd] rounded-lg px-3 py-2">
                      <p className="text-[10px] font-bold text-[#6e7b6c] uppercase">Chưa giải quyết</p>
                      <p className="text-title-md font-extrabold text-[#ba1a1a]">{pendingDisputes.length}</p>
                    </div>
                    <div className="bg-white border border-[#e1e8fd] rounded-lg px-3 py-2">
                      <p className="text-[10px] font-bold text-[#6e7b6c] uppercase">Đã giải quyết</p>
                      <p className="text-title-md font-extrabold text-[#006b2c]">{resolvedDisputes.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-[#e1e8fd] rounded-xl p-5">
                  <h2 className="text-title-md font-extrabold text-[#141b2b] mb-4">Danh sách Tranh chấp ({escalationCases.length})</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {escalationCases.map(esc => {
                      const isPending = esc.raw?.status === 'OPEN' || esc.raw?.status === 'PENDING';
                      return (
                        <div key={esc.id} className={`border rounded-xl p-4 transition-all hover:shadow-md ${
                          isPending ? 'border-rose-200 bg-rose-50/50' : 'border-[#e1e8fd] bg-white'
                        }`}>
                          <div className="flex justify-between items-start mb-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              esc.priority === 'Khẩn cấp' || esc.priority === 'HIGH'
                                ? 'bg-rose-200 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {esc.priority}
                            </span>
                            <span className="text-xs text-[#6e7b6c] font-semibold">{esc.id}</span>
                          </div>
                          <h3 className="text-body-md font-bold text-[#141b2b] mb-1">{esc.title}</h3>
                          <div className="text-xs text-[#3e4a3d] space-y-1 mb-4">
                            <p>Dự án: <strong className="text-[#141b2b]">{esc.raw?.projectTitle}</strong></p>
                            <p>Client: <strong>{esc.raw?.clientName}</strong> | Freelancer: <strong>{esc.raw?.freelancerName}</strong></p>
                            <p>Số tiền: <strong className="text-rose-600">{(esc.raw?.amount || 0).toLocaleString('vi-VN')} VND</strong></p>
                            <p>Trạng thái: <strong className={isPending ? 'text-rose-600' : 'text-[#006b2c]'}>{isPending ? 'Chưa giải quyết' : 'Đã giải quyết'}</strong></p>
                          </div>
                          {isPending ? (
                            <button 
                              className="w-full py-2 bg-white border border-rose-200 text-rose-700 font-bold text-sm rounded-lg hover:bg-rose-100 transition-colors shadow-sm"
                              onClick={() => {
                                setSelectedDispute(esc);
                                setShowDisputeModal(true);
                              }}
                            >
                              Xem chi tiết & Xử lý
                            </button>
                          ) : (
                            <div className="w-full py-2 bg-slate-50 border border-slate-200 text-slate-500 font-bold text-xs rounded-lg text-center">
                              Kết quả: {esc.raw?.status === 'RESOLVED_CLIENT_FAVOR' ? 'Hoàn tiền Client' : 'Thanh toán Freelancer'}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {escalationCases.length === 0 && (
                      <div className="col-span-2 text-center py-12 text-[#6e7b6c]">
                        Chưa có tranh chấp nào được ghi nhận.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ---------------- TAB: REPORTS (Báo cáo vi phạm) ---------------- */}
          {activeTab === 'Reports' && (() => {
            const severityClass = (severity) => severity === 'Cao' || severity === 'Khẩn cấp' || severity === 'HIGH'
              ? 'bg-[#ffdad6] text-[#ba1a1a] border-[#ffdad6]'
              : 'bg-amber-50 text-amber-700 border-amber-200';

            const filteredReports = violationReports.filter(r => {
              // Status filter
              if (reportFilter !== 'ALL') {
                const isPending = r.status === 'Chờ xử lý' || r.status === 'PENDING';
                const isEscalated = r.status === 'Đã chuyển cấp' || r.status === 'ESCALATED';
                if (reportFilter === 'PENDING' && !isPending) return false;
                if (reportFilter === 'ESCALATED' && !isEscalated) return false;
              }
              // Type filter
              if (reportTypeFilter !== 'ALL') {
                if (reportTypeFilter === 'PROJECT' && r.target !== 'PROJECT') return false;
                if (reportTypeFilter === 'USER' && r.target !== 'USER') return false;
              }
              // Search filter
              if (reportSearch) {
                const searchLower = reportSearch.toLowerCase();
                const matchesTarget = r.target?.toLowerCase().includes(searchLower);
                const matchesReporter = r.reporter?.toLowerCase().includes(searchLower);
                const matchesAccused = r.accused?.toLowerCase().includes(searchLower);
                const matchesEvidence = r.evidence?.toLowerCase().includes(searchLower);
                if (!matchesTarget && !matchesReporter && !matchesAccused && !matchesEvidence) return false;
              }
              return true;
            });

            return (
              <div className="space-y-6 max-w-7xl mx-auto">
                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                  <div>
                    <h1 className="text-headline-lg font-extrabold text-[#141b2b]">Báo cáo vi phạm</h1>
                    <p className="text-body-sm text-[#3e4a3d] mt-1">Xử lý các báo cáo vi phạm bài đăng, hồ sơ và người dùng từ hệ thống.</p>
                  </div>
                </div>

                <div className="bg-white border border-[#e1e8fd] rounded-xl p-5 space-y-4">
                  {/* Filter controls */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#e1e8fd] gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Status filter buttons */}
                      <div className="flex bg-[#f1f3ff] p-1 rounded-lg">
                        {[
                          { key: 'ALL', label: 'Tất cả' },
                          { key: 'PENDING', label: 'Chờ xử lý' },
                          { key: 'ESCALATED', label: 'Đã chuyển cấp' }
                        ].map((btn) => (
                          <button
                            key={btn.key}
                            onClick={() => setReportFilter(btn.key)}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                              reportFilter === btn.key 
                                ? 'bg-white text-[#006b2c] shadow-sm' 
                                : 'text-[#6e7b6c] hover:text-[#141b2b]'
                            }`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>

                      {/* Type filter buttons */}
                      <div className="flex bg-[#f1f3ff] p-1 rounded-lg">
                        {[
                          { key: 'ALL', label: 'Tất cả loại' },
                          { key: 'PROJECT', label: 'Dự án' },
                          { key: 'USER', label: 'Người dùng' }
                        ].map((btn) => (
                          <button
                            key={btn.key}
                            onClick={() => setReportTypeFilter(btn.key)}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                              reportTypeFilter === btn.key 
                                ? 'bg-white text-[#006b2c] shadow-sm' 
                                : 'text-[#6e7b6c] hover:text-[#141b2b]'
                            }`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Search bar */}
                    <div className="w-full md:w-72 relative">
                      <span className="absolute inset-y-0 left-3 flex items-center text-[#6e7b6c]">
                        <Search className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        placeholder="Tìm kiếm báo cáo..."
                        value={reportSearch}
                        onChange={(e) => setReportSearch(e.target.value)}
                        className="w-full bg-[#f1f3ff] border-none placeholder-[#6e7b6c] pl-10 pr-4 py-2 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-[#006b2c]/30 focus:bg-white border transition-all"
                      />
                    </div>
                  </div>

                  {/* Reports list */}
                  <div className="space-y-4">
                    {filteredReports.map(report => (
                      <div key={report.id} className="border border-[#e9edff] rounded-xl p-4 hover:shadow-md transition-shadow bg-white">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-2 py-0.5 bg-[#f1f3ff] text-[#141b2b] rounded text-[10px] font-bold border border-slate-200">
                                {report.type}
                              </span>
                            </div>
                            <h3 className="text-body-lg font-bold text-[#141b2b]">{report.target}</h3>
                          </div>
                          <span className={`text-xs font-bold px-2 py-1 rounded ${
                            report.status === 'Chờ xử lý' || report.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800'
                              : report.status === 'Đã chuyển cấp' || report.status === 'ESCALATED'
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {report.status}
                          </span>
                        </div>
                        <p className="text-sm text-[#3e4a3d] bg-[#f9f9ff] p-3 rounded-lg mb-3">
                          <span className="font-semibold">Bằng chứng / Nội dung:</span> {report.evidence}
                        </p>
                        <div className="flex items-center justify-between text-xs text-[#6e7b6c]">
                          <div className="flex gap-4">
                            <span><strong className="text-[#141b2b]">Người báo cáo:</strong> {report.reporter}</span>
                            <span><strong className="text-[#141b2b]">Bị báo cáo:</strong> {report.accused}</span>
                          </div>
                          {(report.status === 'Chờ xử lý' || report.status === 'PENDING' || report.status === 'Đã chuyển cấp' || report.status === 'ESCALATED') && (
                            <div>
                              {(() => {
                                const isAssigned = tasks.some(t =>
                                  t.status !== 'Manager đã ký duyệt' &&
                                  t.status !== 'Rejected' &&
                                  String(t.referenceId) === String(report.idRaw || report.id) &&
                                  t.taskType === 'REPORT_RESOLUTION'
                                );
                                return isAssigned ? (
                                  <span className="px-3 py-1.5 bg-slate-100 text-slate-500 text-xs font-bold rounded whitespace-nowrap inline-block">
                                    Đã phân công
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setCreateForm({
                                        taskType: 'REPORT_RESOLUTION',
                                        title: `Báo cáo vi phạm: [${report.type || 'Nội dung'}] ${report.target || ''}`,
                                        referenceId: report.idRaw || report.id,
                                        description: `Người báo cáo: ${report.reporter || 'N/A'}. Bị báo cáo: ${report.accused || 'N/A'}. Bằng chứng: ${report.evidence || ''}`,
                                        requiredDepartments: activeDeptCode === 'ALL' ? 'MOD' : activeDeptCode,
                                        assignedToEmail: '',
                                      });
                                      setShowCreateModal(true);
                                    }}
                                    className="px-3.5 py-1.5 bg-[#f1f3ff] text-[#0058be] hover:bg-[#e1e8fd] rounded-lg text-xs font-bold transition-all shadow flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                                  >
                                    <UserPlus className="w-3.5 h-3.5" /> Phân công
                                  </button>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {filteredReports.length === 0 && (
                      <div className="text-center py-12 text-[#6e7b6c]">
                        Chưa có báo cáo vi phạm nào phù hợp với bộ lọc.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ---------------- TAB: WITHDRAWALS (Rút tiền) ---------------- */}
          {activeTab === 'Withdrawals' && (() => {
            const filteredWds = withdrawals.filter(w => {
              if (withdrawalFilter !== 'ALL' && w.statusRaw !== withdrawalFilter) return false;
              if (financeSearch) {
                const term = financeSearch.toLowerCase();
                return w.user.toLowerCase().includes(term) || w.email.toLowerCase().includes(term) || w.bank.toLowerCase().includes(term);
              }
              return true;
            });

            return (
              <div className="space-y-6 max-w-7xl mx-auto">
                <div>
                  <h1 className="text-headline-lg font-extrabold text-[#141b2b]">Quản lý Rút tiền</h1>
                  <p className="text-body-sm text-[#3e4a3d] mt-1">Duyệt và xử lý các yêu cầu rút số dư tài khoản từ Freelancer.</p>
                </div>

                <div className="bg-white border border-[#e1e8fd] rounded-xl p-5 space-y-4">
                  {/* Filters & Actions */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#e1e8fd] gap-4">
                    <div className="flex bg-[#f1f3ff] p-1 rounded-lg">
                      {[
                        { key: 'ALL', label: 'Tất cả' },
                        { key: 'PENDING', label: 'Chờ xử lý' },
                        { key: 'APPROVED', label: 'Đã duyệt' },
                        { key: 'REJECTED', label: 'Đã từ chối' }
                      ].map(tab => (
                        <button
                          key={tab.key}
                          onClick={() => setWithdrawalFilter(tab.key)}
                          className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                            withdrawalFilter === tab.key 
                              ? 'bg-white text-[#006b2c] shadow-sm' 
                              : 'text-[#6e7b6c] hover:text-[#141b2b]'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div className="w-full md:w-72 relative">
                      <span className="absolute inset-y-0 left-3 flex items-center text-[#6e7b6c]">
                        <Search className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        placeholder="Tìm theo tên, email, ngân hàng..."
                        value={financeSearch}
                        onChange={(e) => setFinanceSearch(e.target.value)}
                        className="w-full bg-[#f1f3ff] border-none placeholder-[#6e7b6c] pl-10 pr-4 py-2 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-[#006b2c]/30 focus:bg-white border transition-all"
                      />
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto -mx-5">
                    <table className="min-w-full divide-y divide-[#e9edff] text-left">
                      <thead>
                        <tr className="bg-[#f9f9ff]">
                          <th className="px-5 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">Mã Yêu Cầu</th>
                          <th className="px-5 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">Thành Viên</th>
                          <th className="px-5 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">Thông Tin Tài Khoản</th>
                          <th className="px-5 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider text-right">Số Tiền (VND)</th>
                          <th className="px-5 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">Ngày gửi</th>
                          <th className="px-5 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">Trạng thái</th>
                          <th className="px-5 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e9edff] bg-white">
                        {filteredWds.length > 0 ? (
                          filteredWds.map(w => (
                            <tr 
                              key={w.id} 
                              onClick={() => {
                                setSelectedWithdrawal(w);
                                setShowWithdrawalModal(true);
                              }}
                              className="hover:bg-[#f7fff2]/30 transition-colors cursor-pointer"
                            >
                              <td className="px-5 py-4 whitespace-nowrap text-body-sm font-bold text-[#006b2c]">#{w.id}</td>
                              <td className="px-5 py-4 whitespace-nowrap">
                                <div className="text-body-sm font-bold text-[#141b2b]">{w.user}</div>
                                <div className="text-[11px] text-slate-400 font-normal">{w.email}</div>
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap text-body-sm">
                                <div className="font-semibold text-[#141b2b]">{w.bank}</div>
                                <div className="text-[11px] text-[#3e4a3d]">STK: {w.account}</div>
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap text-body-sm font-extrabold text-rose-600 text-right">
                                {w.amount.toLocaleString('vi-VN')}
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap text-body-sm font-bold text-[#3e4a3d]">{w.date}</td>
                              <td className="px-5 py-4 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  w.statusRaw === 'PENDING'
                                    ? 'bg-amber-100 text-amber-800'
                                    : w.statusRaw === 'APPROVED'
                                      ? 'bg-[#f7fff2] text-[#006b2c]'
                                      : 'bg-[#ffdad6] text-[#ba1a1a]'
                                }`}>
                                  {w.status}
                                </span>
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap text-right text-xs font-bold space-x-2">
                                {w.statusRaw === 'PENDING' ? (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleWithdrawalAction(w.id, 'APPROVED');
                                      }}
                                      className="px-2.5 py-1 bg-[#006b2c] hover:bg-[#00873a] text-white rounded transition-colors"
                                    >
                                      Duyệt
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleWithdrawalAction(w.id, 'REJECTED');
                                      }}
                                      className="px-2.5 py-1 bg-white hover:bg-rose-50 text-[#ba1a1a] border border-rose-200 rounded transition-colors"
                                    >
                                      Từ chối
                                    </button>
                                  </>
                                ) : (
                                  <span className="text-[#6e7b6c] font-normal">N/A</span>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="7" className="text-center py-10 text-[#6e7b6c] text-sm">
                              Không tìm thấy yêu cầu rút tiền nào.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ---------------- TAB: REFUNDS (Hoàn tiền) ---------------- */}
          {activeTab === 'Refunds' && (() => {
            const refundsList = escalationCases.filter(esc => esc.raw?.status === 'RESOLVED_CLIENT_FAVOR');

            return (
              <div className="space-y-6 max-w-7xl mx-auto">
                <div>
                  <h1 className="text-headline-lg font-extrabold text-[#141b2b]">Quản lý Hoàn tiền</h1>
                  <p className="text-body-sm text-[#3e4a3d] mt-1">Lịch sử hoàn trả tiền ký quỹ Escrow về tài khoản Client do tranh chấp được giải quyết.</p>
                </div>

                <div className="bg-white border border-[#e1e8fd] rounded-xl p-5 space-y-4">
                  <h2 className="text-title-md font-extrabold text-[#141b2b]">Danh sách giao dịch hoàn tiền ({refundsList.length})</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {refundsList.map(ref => (
                      <div key={ref.id} className="border border-[#e9edff] rounded-xl p-4 bg-[#f9f9ff] flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-[#006b2c] bg-[#f7fff2] px-2 py-0.5 rounded border border-[#bdcaba]">#{ref.id}</span>
                            <span className="text-xs font-bold text-[#006b2c] bg-emerald-100 px-2 py-0.5 rounded">Đã hoàn tiền</span>
                          </div>
                          <h3 className="text-body-md font-bold text-[#141b2b] mb-1">{ref.title}</h3>
                          <div className="text-xs text-[#3e4a3d] space-y-1">
                            <p>Dự án gốc: <strong className="text-[#141b2b]">{ref.raw?.projectTitle}</strong></p>
                            <p>Nhận hoàn tiền (Client): <strong>{ref.raw?.clientName}</strong></p>
                            <p>Đối tác (Freelancer): <strong>{ref.raw?.freelancerName}</strong></p>
                            <p className="mt-2 text-body-sm font-extrabold text-rose-600">Số tiền hoàn lại: {(ref.raw?.amount || 0).toLocaleString('vi-VN')} VND</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {refundsList.length === 0 && (
                      <div className="col-span-2 text-center py-12 text-[#6e7b6c]">
                        Chưa có lịch sử hoàn tiền nào được ghi nhận.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ---------------- TAB: FAILED TRANSACTIONS (Giao dịch lỗi) ---------------- */}
          {activeTab === 'FailedTransactions' && (() => {
            const filteredTxns = vnpayTxns.filter(t => {
              if (vnpayFilter !== 'ALL' && t.status !== vnpayFilter) return false;
              if (financeSearch) {
                const term = financeSearch.toLowerCase();
                return t.txnRef.toLowerCase().includes(term) || t.vnpTxnNo.toLowerCase().includes(term);
              }
              return true;
            });

            const handleReconcile = (id) => {
              const adminId = user?.id || 1;
              if (window.confirm(`Bạn có chắc muốn tiến hành đối soát và xử lý lại giao dịch #${id}?`)) {
                adminApi.reconcileVnpayTransaction(id, adminId)
                  .then(res => {
                    if (res.success) {
                      showToast(res.message, 'success');
                      fetchVnpayTransactions();
                    } else {
                      showToast(res.message, 'error');
                    }
                  }).catch(err => {
                    console.error(err);
                    showToast('Có lỗi xảy ra khi đối soát giao dịch.', 'error');
                  });
              }
            };

            return (
              <div className="space-y-6 max-w-7xl mx-auto">
                <div>
                  <h1 className="text-headline-lg font-extrabold text-[#141b2b]">Đối soát giao dịch VNPay</h1>
                  <p className="text-body-sm text-[#3e4a3d] mt-1">Quản lý và đối soát các giao dịch thanh toán từ ví VNPay.</p>
                </div>

                <div className="bg-white border border-[#e1e8fd] rounded-xl p-5 space-y-4">
                  {/* Filters */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#e1e8fd] gap-4">
                    <div className="flex bg-[#f1f3ff] p-1 rounded-lg">
                      {[
                        { key: 'ALL', label: 'Tất cả' },
                        { key: 'FAILED', label: 'Giao dịch lỗi (FAILED)' },
                        { key: 'SUCCESS', label: 'Thành công (SUCCESS)' },
                        { key: 'PENDING', label: 'Chờ xử lý (PENDING)' }
                      ].map(tab => (
                        <button
                          key={tab.key}
                          onClick={() => setVnpayFilter(tab.key)}
                          className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                            vnpayFilter === tab.key 
                              ? 'bg-white text-[#006b2c] shadow-sm' 
                              : 'text-[#6e7b6c] hover:text-[#141b2b]'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div className="w-full md:w-72 relative">
                      <span className="absolute inset-y-0 left-3 flex items-center text-[#6e7b6c]">
                        <Search className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        placeholder="Tìm kiếm theo mã giao dịch..."
                        value={financeSearch}
                        onChange={(e) => setFinanceSearch(e.target.value)}
                        className="w-full bg-[#f1f3ff] border-none placeholder-[#6e7b6c] pl-10 pr-4 py-2 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-[#006b2c]/30 focus:bg-white border transition-all"
                      />
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto -mx-5">
                    <table className="min-w-full divide-y divide-[#e9edff] text-left">
                      <thead>
                        <tr className="bg-[#f9f9ff]">
                          <th className="px-5 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">Mã GD</th>
                          <th className="px-5 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">Mã Đối Soát (TxnRef)</th>
                          <th className="px-5 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider text-right">Số Tiền (VND)</th>
                          <th className="px-5 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">Mã GD VNPay</th>
                          <th className="px-5 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">Trạng thái</th>
                          <th className="px-5 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">Thời gian</th>
                          <th className="px-5 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e9edff] bg-white">
                        {filteredTxns.length > 0 ? (
                          filteredTxns.map(t => (
                            <tr key={t.id} className="hover:bg-[#f7fff2]/30 transition-colors">
                              <td className="px-5 py-4 whitespace-nowrap text-body-sm font-bold text-[#141b2b]">#{t.id}</td>
                              <td className="px-5 py-4 whitespace-nowrap text-body-sm font-bold text-[#006b2c]">{t.txnRef}</td>
                              <td className="px-5 py-4 whitespace-nowrap text-body-sm font-extrabold text-emerald-600 text-right">
                                {t.amount.toLocaleString('vi-VN')}
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap text-body-sm text-[#3e4a3d]">{t.vnpTxnNo}</td>
                              <td className="px-5 py-4 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  t.status === 'SUCCESS'
                                    ? 'bg-[#f7fff2] text-[#006b2c]'
                                    : t.status === 'FAILED'
                                      ? 'bg-[#ffdad6] text-[#ba1a1a]'
                                      : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {t.status}
                                </span>
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap text-body-sm font-bold text-[#3e4a3d]">{t.date}</td>
                              <td className="px-5 py-4 whitespace-nowrap text-right text-xs font-bold">
                                {t.status === 'FAILED' ? (
                                  <button
                                    onClick={() => handleReconcile(t.id)}
                                    className="px-3 py-1 bg-white hover:bg-[#006b2c] hover:text-white text-[#006b2c] border border-[#bdcaba] rounded-lg transition-colors"
                                  >
                                    Đối soát lại
                                  </button>
                                ) : (
                                  <span className="text-[#6e7b6c] font-normal">N/A</span>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="7" className="text-center py-10 text-[#6e7b6c] text-sm">
                              Không tìm thấy giao dịch nào.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          
          {/* ---------------- TAB: PAYMENT COMPLAINTS (Khiếu nại thanh toán) ---------------- */}
          {activeTab === "PaymentComplaints" && (
            <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
              <div>
                <h1 className="text-headline-lg font-extrabold text-[#141b2b]">
                  Khiếu nại thanh toán & Nạp/Rút ví
                </h1>
                <p className="text-body-sm text-[#3e4a3d] mt-1">
                  Quản lý các sự cố giao dịch, khiếu nại hoàn tiền và rút tiền của người dùng.
                </p>
              </div>

              <div className="bg-white border border-[#e1e8fd] rounded-xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-[#e1e8fd]">
                  <h2 className="text-title-md font-extrabold text-[#141b2b]">
                    Danh sách Khiếu nại thanh toán ({withdrawals.length})
                  </h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-[#e9edff] text-left">
                    <thead>
                      <tr className="bg-[#f9f9ff]">
                        <th className="px-5 py-3 text-label-md text-[#6e7b6c] uppercase font-extrabold">Mã Yêu Cầu</th>
                        <th className="px-5 py-3 text-label-md text-[#6e7b6c] uppercase font-extrabold">Người gửi</th>
                        <th className="px-5 py-3 text-label-md text-[#6e7b6c] uppercase font-extrabold">Loại giao dịch</th>
                        <th className="px-5 py-3 text-label-md text-[#6e7b6c] uppercase font-extrabold">Số tiền</th>
                        <th className="px-5 py-3 text-label-md text-[#6e7b6c] uppercase font-extrabold">Trạng thái</th>
                        <th className="px-5 py-3 text-label-md text-[#6e7b6c] uppercase font-extrabold text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e9edff] bg-white">
                      {withdrawals.map((w) => (
                        <tr key={`w-${w.id}`} className="hover:bg-[#f9f9ff]">
                          <td className="px-5 py-4 font-mono font-bold text-xs text-[#006b2c]">WDR-{w.id}</td>
                          <td className="px-5 py-4">
                            <p className="font-bold text-sm text-[#141b2b]">{w.user}</p>
                            <p className="text-xs text-[#6e7b6c]">{w.email}</p>
                          </td>
                          <td className="px-5 py-4 text-xs font-bold text-slate-700">Rút tiền về {w.bank}</td>
                          <td className="px-5 py-4 text-sm font-extrabold text-rose-600">{w.amount?.toLocaleString("vi-VN")} VND</td>
                          <td className="px-5 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              w.statusRaw === "APPROVED" ? "bg-emerald-100 text-emerald-800" :
                              w.statusRaw === "REJECTED" ? "bg-rose-100 text-rose-800" :
                              "bg-amber-100 text-amber-800"
                            }`}>
                              {w.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedWithdrawal(w);
                                setShowWithdrawalModal(true);
                              }}
                              className="px-3 py-1.5 bg-[#006b2c] hover:bg-[#00873a] text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                            >
                              Xem chi tiết
                            </button>
                          </td>
                        </tr>
                      ))}
                      {withdrawals.length === 0 && (
                        <tr>
                          <td colSpan="6" className="text-center py-8 text-sm text-[#6e7b6c]">
                            Chưa có khiếu nại thanh toán nào cần xử lý.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ---------------- TAB: DISPUTE HISTORY (Lịch sử xử lý tranh chấp) ---------------- */}
          {activeTab === "DisputeHistory" && (
            <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
              <div>
                <h1 className="text-headline-lg font-extrabold text-[#141b2b]">
                  Lịch sử xử lý tranh chấp
                </h1>
                <p className="text-body-sm text-[#3e4a3d] mt-1">
                  Nhật ký lưu trữ tất cả các ca tranh chấp hợp đồng đã được phân xử hoặc đóng vụ việc.
                </p>
              </div>

              <div className="bg-white border border-[#e1e8fd] rounded-xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-[#e1e8fd]">
                  <h2 className="text-title-md font-extrabold text-[#141b2b]">
                    Lịch sử các vụ tranh chấp ({escalationCases.length})
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {escalationCases.map((esc) => {
                    const statusText =
                      esc.raw?.status === "RESOLVED_CLIENT_FAVOR"
                        ? "Thắng cho Client"
                        : esc.raw?.status === "RESOLVED_FREELANCER_FAVOR"
                        ? "Thắng cho Freelancer"
                        : esc.raw?.status === "CLOSED"
                        ? "Đã đóng khiếu nại"
                        : "Đã xử lý / Đang theo dõi";

                    return (
                      <div
                        key={`hist-${esc.id}`}
                        className="border border-[#e1e8fd] bg-white rounded-xl p-4 transition-all hover:shadow-md space-y-3"
                      >
                        <div className="flex justify-between items-start">
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold uppercase">
                            {statusText}
                          </span>
                          <span className="text-xs text-[#6e7b6c] font-semibold">{esc.id}</span>
                        </div>
                        <div>
                          <h3 className="text-body-md font-bold text-[#141b2b]">{esc.title}</h3>
                          <p className="text-xs text-[#6e7b6c] mt-0.5">
                            Client: <strong className="text-slate-800">{esc.raw?.clientName || "N/A"}</strong> | Freelancer: <strong className="text-slate-800">{esc.raw?.freelancerName || "N/A"}</strong>
                          </p>
                        </div>
                        <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <span className="text-xs text-slate-500 font-bold uppercase">Số tiền:</span>
                          <span className="text-sm font-extrabold text-rose-600">
                            {esc.raw?.amount ? esc.raw.amount.toLocaleString("vi-VN") : "0"} VND
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedDispute(esc);
                            setShowDisputeModal(true);
                          }}
                          className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer text-center"
                        >
                          Xem chi tiết hồ sơ tranh chấp
                        </button>
                      </div>
                    );
                  })}
                  {escalationCases.length === 0 && (
                    <div className="col-span-2 text-center py-12 text-[#6e7b6c] text-sm">
                      Chưa có lịch sử xử lý tranh chấp nào trong hệ thống.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ---------------- TAB: GENERIC FALLBACK ---------------- */}
          {!['Dashboard', 'Tasks', 'Staff Management', 'Support', 'Moderation', 'KYC', 'Disputes', 'Reports', 'Withdrawals', 'Refunds', 'FailedTransactions', 'PaymentComplaints', 'DisputeHistory', 'ModHistory'].includes(activeTab) && (
            <div className="max-w-4xl mx-auto text-center py-16 space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#f7fff2] text-[#006b2c] flex items-center justify-center mx-auto shadow-md">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="text-headline-lg font-extrabold text-[#141b2b]">Mục {activeTab}</h2>
              <p className="text-body-sm text-[#6e7b6c] max-w-md mx-auto">
                Mục <strong>{activeTab}</strong> đang được đồng bộ hóa thông tin tự động từ máy chủ quản trị trung tâm. Vui lòng quay lại sau.
              </p>
              <button 
                onClick={() => setActiveTab('Dashboard')}
                className="px-4 py-2 bg-[#006b2c] hover:bg-[#00873a] text-white rounded-lg text-body-sm font-bold shadow transition-all"
              >
                Quay lại Bảng điều khiển
              </button>
            </div>
          )}

        </div>
      </main>

      
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl border border-[#e1e8fd] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#e9edff]">
              <h3 className="text-title-md font-extrabold text-[#141b2b]">Create Verification Task</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 hover:bg-[#f1f3ff] rounded-lg transition-colors text-[#6e7b6c]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTaskSubmit} className="mt-4 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#6e7b6c] uppercase">Task Type</label>
                <select
                  value={createForm.taskType}
                  onChange={(e) => setCreateForm({ ...createForm, taskType: e.target.value })}
                  className="w-full bg-[#f1f3ff] border border-transparent px-3 py-2 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-[#006b2c]/30 focus:bg-white border-[#e1e8fd]"
                >
                  <option value="KYC_VERIFICATION">KYC Verification</option>
                  <option value="WITHDRAWAL">Withdrawal Approval</option>
                  <option value="DISPUTE_REFUND">Dispute Refund Signoff</option>
                  <option value="PROJECT_MODERATION">Project Moderation</option>
                  <option value="GIG_MODERATION">Gig Moderation</option>
                  <option value="PROFILE_MODERATION">Profile Moderation</option>
                  <option value="REPORT_RESOLUTION">Report Resolution (Báo cáo vi phạm)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#6e7b6c] uppercase">Title</label>
                <input
                  type="text"
                  placeholder="e.g. Duyệt hồ sơ KYC cho Minh Anh"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full bg-[#f1f3ff] border border-transparent px-3 py-2 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-[#006b2c]/30 focus:bg-white border-[#e1e8fd]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#6e7b6c] uppercase">Reference ID (Raw)</label>
                  <input
                    type="number"
                    placeholder="e.g. 1"
                    value={createForm.referenceId}
                    onChange={(e) => setCreateForm({ ...createForm, referenceId: e.target.value })}
                    className="w-full bg-[#f1f3ff] border border-transparent px-3 py-2 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-[#006b2c]/30 focus:bg-white border-[#e1e8fd]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#6e7b6c] uppercase">Target Department</label>
                  <select
                    value={createForm.requiredDepartments}
                    onChange={(e) => setCreateForm({ ...createForm, requiredDepartments: e.target.value })}
                    className="w-full bg-[#f1f3ff] border border-transparent px-3 py-2 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-[#006b2c]/30 focus:bg-white border-[#e1e8fd]"
                  >
                    <option value="CS">CS (Customer Support)</option>
                    <option value="FIN">FIN (Finance)</option>
                    <option value="MOD">MOD (Moderation)</option>
                    <option value="DIS">DIS (Dispute Resolution)</option>
                  </select>
                </div>
              </div>



              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#6e7b6c] uppercase">Description</label>
                <textarea
                  rows="3"
                  placeholder="Task details..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full bg-[#f1f3ff] border border-transparent px-3 py-2 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-[#006b2c]/30 focus:bg-white border-[#e1e8fd]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#6e7b6c] uppercase">Giao việc cho nhân viên (Assign to Staff)</label>
                <select
                  value={createForm.assignedToEmail}
                  onChange={(e) => setCreateForm({ ...createForm, assignedToEmail: e.target.value })}
                  className="w-full bg-[#f1f3ff] border border-transparent px-3 py-2 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-[#006b2c]/30 focus:bg-white border-[#e1e8fd]"
                >
                  <option value="">-- Chưa phân công --</option>
                  {staffList
                    .filter(s => {
                      if (activeDeptCode !== 'ALL' && String(s.departmentId) !== String(activeDeptId)) return false;
                      if (createForm.requiredDepartments) {
                        if (activeDeptCode !== 'ALL') return true; // Manager assigning to own staff
                        
                        const targetDeptMatch = departments.find(d => String(d.code).toUpperCase() === createForm.requiredDepartments);
                        if (targetDeptMatch) {
                          return String(s.departmentId) === String(targetDeptMatch.id);
                        }
                        const staffCode = getStaffDeptCode(s);
                        if (staffCode) return staffCode === createForm.requiredDepartments;
                      }
                      return true;
                    })
                    .map(s => (
                      <option key={s.id || s.staffId} value={s.email}>
                        {s.email ? s.email.split('@')[0] : (s.name || s.fullName || s.email)}
                      </option>
                    ))
                  }
                </select>
              </div>

              <div className="flex gap-3 pt-3 border-t border-[#e9edff]">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-2 rounded-lg bg-slate-100 text-slate-700 font-bold text-body-sm">
                  Đóng
                </button>
                <button type="submit" className="flex-1 py-2 bg-[#006b2c] hover:bg-[#00873a] text-white rounded-lg font-bold text-body-sm shadow">
                  Phân công
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl border border-[#e1e8fd]">
            <div className="flex items-center justify-between pb-3 border-b border-[#e9edff]">
              <h3 className="text-title-md font-extrabold text-[#141b2b]">Invite Department Staff</h3>
              <button onClick={() => setShowInviteModal(false)} className="p-1.5 hover:bg-[#f1f3ff] rounded-lg transition-colors text-[#6e7b6c]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInviteStaff} className="mt-4 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#6e7b6c] uppercase">Staff Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. staff_member@gmail.com"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="w-full bg-[#f1f3ff] border border-transparent px-3 py-2 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-[#006b2c]/30 focus:bg-white border-[#e1e8fd]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#6e7b6c] uppercase">Invite Role</label>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                    className="w-full bg-[#f1f3ff] border border-transparent px-3 py-2 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-[#006b2c]/30 focus:bg-white border-[#e1e8fd]"
                  >
                    <option value="STAFF">Staff Agent</option>
                    <option value="MANAGER">Department Manager</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#6e7b6c] uppercase">Target Department</label>
                  <select
                    value={inviteForm.departmentId}
                    onChange={(e) => setInviteForm({ ...inviteForm, departmentId: e.target.value })}
                    className="w-full bg-[#f1f3ff] border border-transparent px-3 py-2 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-[#006b2c]/30 focus:bg-white border-[#e1e8fd]"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-[#e9edff]">
                <button type="button" onClick={() => setShowInviteModal(false)} className="flex-1 py-2 rounded-lg bg-slate-100 text-slate-700 font-bold text-body-sm">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2 bg-[#006b2c] hover:bg-[#00873a] text-white rounded-lg font-bold text-body-sm shadow">
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl border border-[#e1e8fd]">
            <div className="flex items-center justify-between pb-3 border-b border-[#e9edff]">
              <h3 className="text-title-md font-extrabold text-[#141b2b]">Transfer Department Member</h3>
              <button onClick={() => setShowTransferModal(false)} className="p-1.5 hover:bg-[#f1f3ff] rounded-lg transition-colors text-[#6e7b6c]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransferStaff} className="mt-4 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#6e7b6c] uppercase">Select Staff Member</label>
                <select
                  value={transferForm.memberId}
                  onChange={(e) => setTransferForm({ ...transferForm, memberId: e.target.value })}
                  className="w-full bg-[#f1f3ff] border border-transparent px-3 py-2 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-[#006b2c]/30 focus:bg-white border-[#e1e8fd]"
                  required
                >
                  <option value="">-- Select Member --</option>
                  {staffList.map(s => (
                    <option key={s.id || s.staffId} value={s.id || s.staffId}>{s.name || s.email}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#6e7b6c] uppercase">Target Department Code</label>
                <select
                  value={transferForm.targetDepartmentCode}
                  onChange={(e) => setTransferForm({ ...transferForm, targetDepartmentCode: e.target.value })}
                  className="w-full bg-[#f1f3ff] border border-transparent px-3 py-2 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-[#006b2c]/30 focus:bg-white border-[#e1e8fd]"
                >
                  <option value="MOD">MOD (Moderation)</option>
                  <option value="FIN">FIN (Finance)</option>
                  <option value="DIS">DIS (Dispute Resolution)</option>
                  <option value="CS">CS (Customer Support)</option>
                  <option value="IT">IT (Technical Dept)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-3 border-t border-[#e9edff]">
                <button type="button" onClick={() => setShowTransferModal(false)} className="flex-1 py-2 rounded-lg bg-slate-100 text-slate-700 font-bold text-body-sm">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2 bg-[#006b2c] hover:bg-[#00873a] text-white rounded-lg font-bold text-body-sm shadow">
                  Transfer Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      
      {showManageModal && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] p-6 shadow-2xl flex flex-col justify-between border border-[#e1e8fd] rounded-2xl overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#e9edff]">
                <div>
                  <span className="text-xs font-bold text-[#6e7b6c]">{selectedTask.id}</span>
                  <h3 className="text-title-md font-extrabold text-[#141b2b] mt-0.5">{selectedTask.type}</h3>
                </div>
                <button onClick={() => { setShowManageModal(false); setSelectedTask(null); }} className="p-1.5 hover:bg-[#f1f3ff] rounded-lg transition-colors text-[#6e7b6c]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-6 space-y-4">
                <div className="flex flex-col gap-1.5 bg-[#f1f3ff] p-4 rounded-xl">
                  <label className="text-xs font-bold text-[#6e7b6c] uppercase">Người xử lý (Assignee)</label>
                  <div className="flex items-center gap-3 mt-1">
                    <img 
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(selectedTask.assignedToEmail || selectedTask.user || 'U')}&background=006b2c&color=fff`} 
                      alt="User Avatar" 
                      className="w-10 h-10 rounded-full object-cover border border-[#bdcaba]" 
                    />
                    <select
                      value={selectedTask.assignedToEmail || ''}
                      onChange={(e) => {
                        const newEmail = e.target.value || null;
                        handleAssignTask(selectedTask.taskId, newEmail);
                      }}
                      className="flex-1 bg-white border border-[#bdcaba] px-3 py-1.5 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-[#006b2c]/30"
                    >
                      <option value="">-- Chưa phân công --</option>
                      {staffList
                        .filter(s => {
                          if (activeDeptCode !== 'ALL' && s.departmentId !== activeDeptId) return false;
                          const reqDepts = selectedTask.requiredDepartments?.split(',') || [];
                          return reqDepts.length === 0 || reqDepts.some(d => getStaffDeptCode(s) === d.trim());
                        })
                        .map(s => (
                          <option key={s.id || s.staffId} value={s.email}>
                            {s.name || s.fullName || s.email}
                          </option>
                        ))
                      }
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-body-sm border-b border-[#e9edff] pb-4">
                  <div>
                    <span className="font-semibold text-[#6e7b6c]">Priority:</span>
                    <span className="block mt-1 font-bold text-sm text-[#ba1a1a]">{selectedTask.priority} Priority</span>
                  </div>
                  <div>
                    <span className="font-semibold text-[#6e7b6c]">Required Departments:</span>
                    <span className="block mt-1 font-bold text-[#141b2b]">{selectedTask.requiredDepartments}</span>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold text-[#6e7b6c] uppercase">Task Description</span>
                  <p className="text-body-sm text-[#141b2b] mt-2 leading-relaxed bg-[#f9f9ff] p-3 rounded-lg border border-[#e1e8fd]">
                    {selectedTask.description}
                  </p>
                </div>

                {selectedTaskMatchingItem && (
                  <div className="pt-4 border-t border-[#e9edff] space-y-3">
                    <span className="text-xs font-bold text-[#6e7b6c] uppercase block text-left">Nội dung kiểm duyệt (Content Details)</span>
                    
                    {selectedTaskMatchingItem.type === 'PROFILE' && selectedTaskMatchingItem.rawRequest ? (
                      <div className="space-y-3 text-xs text-left">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                            <p className="font-bold text-slate-500 uppercase pb-1.5 border-b border-slate-200 mb-1.5">Thông tin hiện tại</p>
                            <p><strong>Tên hiển thị:</strong> {selectedTaskMatchingItem.rawRequest.employer?.displayName || 'Chưa cập nhật'}</p>
                            <p><strong>Họ và tên:</strong> {selectedTaskMatchingItem.rawRequest.employer?.fullName || 'Chưa cập nhật'}</p>
                            <p><strong>Số điện thoại:</strong> {selectedTaskMatchingItem.rawRequest.employer?.phone || 'Chưa cập nhật'}</p>
                            <p><strong>Tên công ty:</strong> {selectedTaskMatchingItem.rawRequest.employer?.companyName || 'Chưa cập nhật'}</p>
                            <p><strong>Website:</strong> {selectedTaskMatchingItem.rawRequest.employer?.website || 'Chưa cập nhật'}</p>
                            <p><strong>Quy mô:</strong> {selectedTaskMatchingItem.rawRequest.employer?.companySize || 'Chưa cập nhật'}</p>
                            <p><strong>Ngành nghề:</strong> {selectedTaskMatchingItem.rawRequest.employer?.industry || 'Chưa cập nhật'}</p>
                            <p><strong>Mã số thuế:</strong> {selectedTaskMatchingItem.rawRequest.employer?.taxCode || 'Chưa cập nhật'}</p>
                            <p><strong>Địa chỉ:</strong> {selectedTaskMatchingItem.rawRequest.employer?.address ? `${selectedTaskMatchingItem.rawRequest.employer.address}, ${selectedTaskMatchingItem.rawRequest.employer.city || ''}, ${selectedTaskMatchingItem.rawRequest.employer.country || ''}` : 'Chưa cập nhật'}</p>
                            <p><strong>Mô tả:</strong> {selectedTaskMatchingItem.rawRequest.employer?.companyDescription || 'Chưa cập nhật'}</p>
                          </div>
                          <div className="bg-indigo-50/30 p-3 rounded-xl border border-indigo-100 space-y-1">
                            <p className="font-bold text-indigo-600 uppercase pb-1.5 border-b border-indigo-100 mb-1.5">Thông tin đề xuất mới</p>
                            <p><strong>Tên hiển thị:</strong> <span className={selectedTaskMatchingItem.rawRequest.displayName !== selectedTaskMatchingItem.rawRequest.employer?.displayName ? "text-indigo-650 font-bold" : ""}>{selectedTaskMatchingItem.rawRequest.displayName || 'Chưa cập nhật'}</span></p>
                            <p><strong>Họ và tên:</strong> <span className={selectedTaskMatchingItem.rawRequest.fullName !== selectedTaskMatchingItem.rawRequest.employer?.fullName ? "text-indigo-655 font-bold" : ""}>{selectedTaskMatchingItem.rawRequest.fullName || 'Chưa cập nhật'}</span></p>
                            <p><strong>Số điện thoại:</strong> <span className={selectedTaskMatchingItem.rawRequest.phone !== selectedTaskMatchingItem.rawRequest.employer?.phone ? "text-indigo-655 font-bold" : ""}>{selectedTaskMatchingItem.rawRequest.phone || 'Chưa cập nhật'}</span></p>
                            <p><strong>Tên công ty:</strong> <span className={selectedTaskMatchingItem.rawRequest.companyName !== selectedTaskMatchingItem.rawRequest.employer?.companyName ? "text-indigo-655 font-bold" : ""}>{selectedTaskMatchingItem.rawRequest.companyName || 'Chưa cập nhật'}</span></p>
                            <p><strong>Website:</strong> <span className={selectedTaskMatchingItem.rawRequest.website !== selectedTaskMatchingItem.rawRequest.employer?.website ? "text-indigo-655 font-bold" : ""}>{selectedTaskMatchingItem.rawRequest.website || 'Chưa cập nhật'}</span></p>
                            <p><strong>Quy mô:</strong> <span className={selectedTaskMatchingItem.rawRequest.companySize !== selectedTaskMatchingItem.rawRequest.employer?.companySize ? "text-indigo-655 font-bold" : ""}>{selectedTaskMatchingItem.rawRequest.companySize || 'Chưa cập nhật'}</span></p>
                            <p><strong>Ngành nghề:</strong> <span className={selectedTaskMatchingItem.rawRequest.industry !== selectedTaskMatchingItem.rawRequest.employer?.industry ? "text-indigo-655 font-bold" : ""}>{selectedTaskMatchingItem.rawRequest.industry || 'Chưa cập nhật'}</span></p>
                            <p><strong>Mã số thuế:</strong> <span className={selectedTaskMatchingItem.rawRequest.taxCode !== selectedTaskMatchingItem.rawRequest.employer?.taxCode ? "text-indigo-655 font-bold" : ""}>{selectedTaskMatchingItem.rawRequest.taxCode || 'Chưa cập nhật'}</span></p>
                            <p><strong>Địa chỉ:</strong> <span className={(selectedTaskMatchingItem.rawRequest.address !== selectedTaskMatchingItem.rawRequest.employer?.address || selectedTaskMatchingItem.rawRequest.city !== selectedTaskMatchingItem.rawRequest.employer?.city) ? "text-indigo-655 font-bold" : ""}>{selectedTaskMatchingItem.rawRequest.address ? `${selectedTaskMatchingItem.rawRequest.address}, ${selectedTaskMatchingItem.rawRequest.city || ''}, ${selectedTaskMatchingItem.rawRequest.country || ''}` : 'Chưa cập nhật'}</span></p>
                            <p><strong>Mô tả:</strong> <span className={selectedTaskMatchingItem.rawRequest.companyDescription !== selectedTaskMatchingItem.rawRequest.employer?.companyDescription ? "text-indigo-655 font-bold block whitespace-pre-line" : ""}>{selectedTaskMatchingItem.rawRequest.companyDescription || 'Chưa cập nhật'}</span></p>
                          </div>
                        </div>
                        <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl space-y-1">
                          <p className="font-bold text-slate-700 pb-1 border-b border-slate-200 mb-1">Thông tin ngân hàng đề xuất</p>
                          <p><strong>Ngân hàng:</strong> {selectedTaskMatchingItem.rawRequest.bankName || 'Chưa cập nhật'}</p>
                          <p><strong>Số tài khoản:</strong> {selectedTaskMatchingItem.rawRequest.accountNumber || 'Chưa cập nhật'}</p>
                          <p><strong>Chủ tài khoản:</strong> {selectedTaskMatchingItem.rawRequest.accountHolder || 'Chưa cập nhật'}</p>
                          <p><strong>Chi nhánh:</strong> {selectedTaskMatchingItem.rawRequest.branch || 'Chưa cập nhật'}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 text-left">
                        <p className="text-body-sm font-bold text-[#141b2b]">{selectedTaskMatchingItem.title}</p>
                        <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl text-xs text-slate-850 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
                          {selectedTaskMatchingItem.detail || 'Không có mô tả chi tiết'}
                        </div>
                        {selectedTaskMatchingItem.rawProject && (
                          <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl text-xs space-y-1">
                            <p><strong>Ngân sách:</strong> {selectedTaskMatchingItem.rawProject.budget ? selectedTaskMatchingItem.rawProject.budget.toLocaleString('vi-VN') + ' VNĐ' : 'Liên hệ thỏa thuận'}</p>
                            <p><strong>Hình thức làm việc:</strong> {selectedTaskMatchingItem.rawProject.workType || 'Chưa cập nhật'}</p>
                            <p><strong>Kỹ năng yêu cầu:</strong> {selectedTaskMatchingItem.rawProject.requiredSkills || 'Không yêu cầu'}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-[#e9edff] pt-4 space-y-3">
              {selectedTask.status !== 'Manager đã ký duyệt' ? (
                <>
                  <button 
                    onClick={() => handleUpdateTaskStatus(selectedTask.id, 'Manager đã ký duyệt')}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-body-sm shadow transition-all"
                  >
                    Ký duyệt tác vụ (Approve / Signoff)
                  </button>
                </>
              ) : (
                <div className="p-3 bg-[#f7fff2] border border-[#bdcaba] rounded-lg text-center text-[#006b2c] font-bold text-body-sm">
                  ✓ Manager đã ký duyệt
                </div>
              )}
              <button onClick={() => { setShowManageModal(false); setSelectedTask(null); }} className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-body-sm rounded-lg transition-all">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 sm:p-7 shadow-2xl border border-[#e1e8fd] text-center animate-in fade-in zoom-in-95 duration-200">
            <div className={`mx-auto w-14 h-14 rounded-2xl mb-4 flex items-center justify-center ${
              confirmConfig.type === 'danger' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-extrabold text-[#141b2b] mb-3">{confirmConfig.title}</h3>
            <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl text-sm text-[#3e4a3d] mb-6 whitespace-pre-line text-left leading-relaxed font-medium">
              {confirmConfig.message}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all sm:w-auto cursor-pointer"
              >
                {confirmConfig.cancelText || 'Hủy'}
              </button>
              <button
                onClick={confirmConfig.onConfirm}
                className={`flex-1 px-5 py-2.5 rounded-xl font-extrabold text-sm shadow-md transition-all text-white flex items-center justify-center gap-2 cursor-pointer ${
                  confirmConfig.type === 'danger' ? 'bg-[#ba1a1a] hover:bg-[#93000a]' : 'bg-[#006b2c] hover:bg-[#00873a]'
                }`}
              >
                {confirmConfig.confirmText || 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showTransferRejectModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl border border-[#e1e8fd] animate-in fade-in zoom-in-95 duration-150 text-left">
            <h3 className="text-title-md font-extrabold text-[#141b2b] mb-4">Từ chối đơn điều chuyển</h3>
            <p className="text-body-sm text-[#3e4a3d] mb-3 font-semibold">Vui lòng nhập lý do từ chối đơn điều chuyển này (bắt buộc):</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full min-h-[100px] p-3 border border-slate-200 rounded-lg text-body-sm focus:outline-none focus:border-amber-500 mb-4 resize-none"
              placeholder="Nhập lý do chi tiết..."
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowTransferRejectModal(false);
                  setRejectReason('');
                  setRejectRequestId(null);
                }}
                className="flex-1 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-body-sm transition-all"
              >
                Hủy
              </button>
              <button
                onClick={submitTransferRejection}
                className="flex-1 py-2 rounded-lg font-bold text-body-sm shadow transition-all text-white bg-[#ba1a1a] hover:bg-[#93000a]"
              >
                Từ chối đơn
              </button>
            </div>
          </div>
        </div>
      )}

      {showTransferDetailModal && selectedTransferRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#090d16]/55 backdrop-blur-md px-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl border border-[#e2eafc] flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4.5 bg-gradient-to-r from-slate-50 to-white border-b border-[#e2eafc]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 shadow-sm">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-[17px] font-extrabold text-[#111827] text-left">
                    Chi tiết đơn điều chuyển
                  </h2>
                  <p className="text-[12px] text-slate-400 font-semibold mt-0.5 text-left">
                    Mã số đơn: <span className="text-[#006b2c] font-bold">#REQ-{selectedTransferRequest.requestId}</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowTransferDetailModal(false);
                  setSelectedTransferRequest(null);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6 text-left">
              {/* SECTION 1: THÔNG TIN NHÂN VIÊN & KHỐI LƯỢNG CÔNG VIỆC */}
              <div>
                <h3 className="text-body-md font-extrabold text-[#006b2c] flex items-center gap-2 mb-3.5 border-b border-slate-100 pb-2">
                  <User className="w-4.5 h-4.5" />
                  Thông tin nhân viên & Bàn giao công việc
                </h3>

                {/* Unfinished Work Warning Banner */}
                {(() => {
                  const staffEmail = selectedTransferRequest.userEmail || '';
                  const unfinishedCount = tasks.filter(t => {
                    const isAssigned = (t.assignedToEmail && t.assignedToEmail.toLowerCase() === staffEmail.toLowerCase()) ||
                                       (t.assignedTo && t.assignedTo.toLowerCase() === staffEmail.toLowerCase());
                    const isFinished = t.status === 'Completed' || t.status === 'Manager đã ký duyệt' || t.status === 'Approved' || t.status === 'Rejected';
                    return isAssigned && !isFinished;
                  }).length;

                  return (
                    <div className={`p-3.5 rounded-xl border mb-4 ${
                      unfinishedCount > 0
                        ? 'bg-amber-50/90 border-amber-200 text-amber-900'
                        : 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
                    }`}>
                      <div className="flex items-center gap-2 font-extrabold text-xs mb-1">
                        <AlertTriangle className={`w-4 h-4 ${unfinishedCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`} />
                        <span>TRẠNG THÁI KHỐI LƯỢNG CÔNG VIỆC HIỆN TẠI</span>
                      </div>
                      <p className="text-xs font-semibold leading-relaxed">
                        {unfinishedCount > 0 ? (
                          <>
                            Nhân viên hiện đang có <strong className="text-amber-700 underline text-sm">{unfinishedCount} công việc chưa hoàn thành</strong>. Yêu cầu staff cần bàn giao toàn bộ công việc trước khi tiến hành điều chuyển phòng ban.
                          </>
                        ) : (
                          <>
                            Nhân viên đã hoàn thành tất cả công việc (<strong>0 công việc dở dang</strong>). Đủ điều kiện điều chuyển.
                          </>
                        )}
                      </p>
                    </div>
                  );
                })()}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
                    <span className="text-[10px] font-extrabold text-slate-400 tracking-wider block mb-0.5 uppercase">Mã nhân viên</span>
                    <span className="text-body-sm font-extrabold text-slate-700">FP-{selectedTransferRequest.requestId}</span>
                  </div>
                  <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
                    <span className="text-[10px] font-extrabold text-slate-400 tracking-wider block mb-0.5 uppercase">Họ và tên</span>
                    <span className="text-body-sm font-extrabold text-slate-700">{selectedTransferRequest.userDisplayName || 'Nhân viên'}</span>
                  </div>
                  <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
                    <span className="text-[10px] font-extrabold text-slate-400 tracking-wider block mb-0.5 uppercase">Phòng ban hiện tại</span>
                    <span className="text-body-sm font-extrabold text-emerald-700">{selectedTransferRequest.fromDepartment || 'Chưa rõ'}</span>
                  </div>
                  <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
                    <span className="text-[10px] font-extrabold text-slate-400 tracking-wider block mb-0.5 uppercase">Email liên hệ</span>
                    <span className="text-body-sm font-extrabold text-slate-700">{selectedTransferRequest.userEmail}</span>
                  </div>
                </div>
              </div>

              {/* SECTION 2: THÔNG TIN ĐIỀU CHUYỂN */}
              <div>
                <h3 className="text-body-md font-extrabold text-[#006b2c] flex items-center gap-2 mb-3.5 border-b border-slate-100 pb-2">
                  <ArrowLeftRight className="w-4.5 h-4.5" />
                  Thông tin điều chuyển phòng ban
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50/30 border border-blue-100/50 rounded-xl p-3 shadow-[0_2px_8px_rgba(0,0,0,0.01)] col-span-2">
                    <span className="text-[10px] font-extrabold text-blue-600 tracking-wider block mb-0.5 uppercase">Phòng ban muốn chuyển đến</span>
                    <span className="text-body-sm font-extrabold text-blue-700">{selectedTransferRequest.toDepartment || 'Chưa rõ'}</span>
                  </div>
                  <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
                    <span className="text-[10px] font-extrabold text-slate-400 tracking-wider block mb-0.5 uppercase">Vị trí mong muốn</span>
                    <span className="text-body-sm font-extrabold text-slate-700">{parseReason(selectedTransferRequest.reason).desiredPosition || 'Chưa cung cấp'}</span>
                  </div>
                  <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
                    <span className="text-[10px] font-extrabold text-slate-400 tracking-wider block mb-0.5 uppercase">Ngày mong muốn bắt đầu</span>
                    <span className="text-body-sm font-extrabold text-slate-700">{parseReason(selectedTransferRequest.reason).startDate || 'Chưa cung cấp'}</span>
                  </div>
                  <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 shadow-[0_2px_8px_rgba(0,0,0,0.01)] col-span-2">
                    <span className="text-[10px] font-extrabold text-slate-400 tracking-wider block mb-0.5 uppercase">Loại điều chuyển</span>
                    <span className="text-body-sm font-extrabold text-slate-700">{parseReason(selectedTransferRequest.reason).transferType || 'Chưa cung cấp'}</span>
                  </div>
                </div>
              </div>

              {/* SECTION 3: LÝ DO ĐIỀU CHUYỂN */}
              <div>
                <h3 className="text-body-md font-extrabold text-[#006b2c] flex items-center gap-2 mb-3.5 border-b border-slate-100 pb-2">
                  <FileText className="w-4.5 h-4.5" />
                  Lý do điều chuyển
                </h3>
                <div className="bg-[#fcfdfe] border border-[#e2e8f0]/60 rounded-xl p-4 leading-relaxed text-body-sm text-slate-700 font-medium border-l-4 border-l-[#006b2c] shadow-[0_2px_10px_rgba(0,0,0,0.01)] whitespace-pre-wrap">
                  {parseReason(selectedTransferRequest.reason).reason || 'Không có lý do chi tiết.'}
                </div>
              </div>

              {/* SECTION 4: KỸ NĂNG & KINH NGHIỆM */}
              <div>
                <h3 className="text-body-md font-extrabold text-[#006b2c] flex items-center gap-2 mb-3.5 border-b border-slate-100 pb-2">
                  <Activity className="w-4.5 h-4.5" />
                  Kỹ năng và kinh nghiệm
                </h3>
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 tracking-wider block mb-1 uppercase">Kỹ năng liên quan & Kinh nghiệm trước đây</span>
                    <div className="bg-[#fcfdfe] border border-[#e2e8f0]/60 rounded-xl p-4 leading-relaxed text-body-sm text-slate-700 font-medium border-l-4 border-l-[#006b2c] shadow-[0_2px_10px_rgba(0,0,0,0.01)] whitespace-pre-wrap">
                      {parseReason(selectedTransferRequest.reason).skills || 'Chưa cung cấp'}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 tracking-wider block mb-1 uppercase">Thành tích nổi bật & Lý do phù hợp</span>
                    <div className="bg-[#fcfdfe] border border-[#e2e8f0]/60 rounded-xl p-4 leading-relaxed text-body-sm text-slate-700 font-medium border-l-4 border-l-[#006b2c] shadow-[0_2px_10px_rgba(0,0,0,0.01)] whitespace-pre-wrap">
                      {parseReason(selectedTransferRequest.reason).achievements || 'Chưa cung cấp'}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 5: TỆP ĐÍNH KÈM */}
              <div>
                <h3 className="text-body-md font-extrabold text-[#006b2c] flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
                  <Paperclip className="w-4.5 h-4.5" />
                  Tệp đính kèm
                </h3>
                <div className="bg-slate-50/40 border border-slate-100 rounded-xl p-3.5 flex items-center gap-3 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm shrink-0">
                    <Paperclip className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-body-sm font-bold text-slate-700 truncate">
                      {parseReason(selectedTransferRequest.reason).attachment || 'Không có tệp đính kèm'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-semibold">Định dạng hỗ trợ: PDF, DOCX, PNG, JPG</p>
                  </div>
                </div>
              </div>

              {/* SECTION 6: PHẢN HỒI QUYẾT ĐỊNH */}
              {selectedTransferRequest.status !== 'PENDING' && selectedTransferRequest.decisionNote && (
                <div className="p-4 bg-amber-50/70 border border-amber-100 rounded-xl space-y-1.5 border-l-4 border-l-amber-500">
                  <span className="text-[11px] font-bold text-amber-800 tracking-wider block uppercase">
                    {selectedTransferRequest.status === 'APPROVED' ? 'Ghi chú phê duyệt từ Manager' : 'Lý do từ chối từ Manager'}
                  </span>
                  <p className="text-body-sm text-amber-900 font-bold leading-relaxed">{selectedTransferRequest.decisionNote}</p>
                </div>
              )}

              {/* SECTION 7: NỘI DUNG & GHI CHÚ BÀN GIAO CÔNG VIỆC TỪ STAFF */}
              {(selectedTransferRequest.handoverNotes || selectedTransferRequest.notes || selectedTransferRequest.status === 'COMPLETED' || selectedTransferRequest.handoverSubmitted) && (
                <div className="p-5 bg-emerald-50/90 border border-emerald-200 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-[#006b2c]">
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                    <h3 className="text-base font-extrabold text-emerald-950">
                      Nội dung & Ghi chú Bàn giao Công việc từ Nhân viên
                    </h3>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-emerald-100 text-sm text-slate-800 font-medium whitespace-pre-wrap leading-relaxed shadow-sm">
                    {selectedTransferRequest.handoverNotes || selectedTransferRequest.notes || 'Staff đã hoàn tất xác nhận bàn giao công việc dở dang.'}
                  </div>

                  {(() => {
                    const staffEmail = selectedTransferRequest.userEmail;
                    const staffTasks = tasks.filter(t => {
                      const isAssigned = (t.assignedToEmail && t.assignedToEmail.toLowerCase() === staffEmail?.toLowerCase()) ||
                                         (t.assignedTo && t.assignedTo.toLowerCase() === staffEmail?.toLowerCase());
                      return isAssigned;
                    });

                    if (staffTasks.length === 0) return null;

                    return (
                      <div className="mt-3 space-y-2">
                        <span className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider block">
                          Danh sách các công việc thuộc hồ sơ bàn giao này ({staffTasks.length} nhiệm vụ):
                        </span>
                        <div className="overflow-x-auto rounded-xl border border-emerald-200 bg-white shadow-sm">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-emerald-100/60 text-emerald-900 font-extrabold border-b border-emerald-200">
                              <tr>
                                <th className="px-3.5 py-2.5">Mã Task</th>
                                <th className="px-3.5 py-2.5">Tên công việc</th>
                                <th className="px-3.5 py-2.5">Loại</th>
                                <th className="px-3.5 py-2.5">Trạng thái</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-emerald-100 font-medium text-slate-700">
                              {staffTasks.map(t => (
                                <tr key={t.id} className="hover:bg-emerald-50/50">
                                  <td className="px-3.5 py-2 font-bold text-[#006b2c]">{t.id}</td>
                                  <td className="px-3.5 py-2 font-bold text-slate-900">{t.title}</td>
                                  <td className="px-3.5 py-2">{t.type}</td>
                                  <td className="px-3.5 py-2">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                                      t.status === 'Completed' || t.status === 'Manager đã ký duyệt'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                    }`}>
                                      {t.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4.5 bg-slate-50 border-t border-[#e2eafc] flex justify-between items-center gap-3">
              <button
                onClick={() => {
                  setShowTransferDetailModal(false);
                  setSelectedTransferRequest(null);
                }}
                className="px-4 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-body-sm font-bold transition-all shadow-sm"
              >
                Đóng cửa sổ
              </button>
              
              {selectedTransferRequest.status === 'PENDING' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowTransferDetailModal(false);
                      handleApproveTransferRequest(selectedTransferRequest.requestId, false);
                    }}
                    className="px-4.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-body-sm font-extrabold rounded-lg transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
                  >
                    Từ chối đơn
                  </button>
                  <button
                    onClick={() => {
                      setShowTransferDetailModal(false);
                      handleApproveTransferRequest(selectedTransferRequest.requestId, true);
                    }}
                    className="px-4.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-body-sm font-extrabold rounded-lg transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
                  >
                    Duyệt điều chuyển
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- DISPUTE RESOLUTION MODAL ---------------- */}
      {showDisputeModal && selectedDispute && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl border border-[#e1e8fd] flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e1e8fd]">
              <h2 className="text-title-md font-extrabold text-[#141b2b]">Xử lý Khiếu nại / Tranh chấp</h2>
              <button 
                onClick={() => {
                  setShowDisputeModal(false);
                  setSelectedDispute(null);
                  setDisputeNote('');
                  setShowAssignStaffDrawer(false);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full text-[#6e7b6c] hover:bg-[#f1f4f0]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-4">
              <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl mb-4">
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-bold text-rose-600 uppercase">Ưu tiên: {selectedDispute.priority || 'CAO'}</span>
                  <span className="text-xs text-rose-500 font-medium">{selectedDispute.raw?.createdAt}</span>
                </div>
                <h3 className="text-body-lg font-bold text-[#141b2b]">{selectedDispute.raw?.projectTitle || selectedDispute.title}</h3>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-[#f7fff2] border border-[#d6f2c6] p-3 rounded-lg">
                  <p className="text-xs text-[#3e4a3d] mb-1">Bên Client (Thuê)</p>
                  <p className="font-bold text-[#141b2b]">{selectedDispute.raw?.clientName || 'SunGroup Corp'}</p>
                </div>
                <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg">
                  <p className="text-xs text-[#3e4a3d] mb-1">Bên Freelancer</p>
                  <p className="font-bold text-[#141b2b]">{selectedDispute.raw?.freelancerName || 'Tran Thu Ha'}</p>
                </div>
              </div>

              <div>
                <p className="text-body-sm text-[#3e4a3d] font-bold mb-1">Số tiền đang tranh chấp:</p>
                <p className="text-title-lg text-rose-600 font-extrabold">{(selectedDispute.raw?.amount || 8000000)?.toLocaleString('vi-VN')} VND</p>
              </div>

              <div>
                <p className="text-body-sm text-[#3e4a3d] font-bold mb-1">Nội dung khiếu nại:</p>
                <div className="bg-[#f1f4f0] p-3 rounded-lg text-sm text-[#141b2b]">
                  {selectedDispute.raw?.reason || 'Sản phẩm thiết kế không đúng mô tả thiết kế ban đầu, quá nhiều lỗi'}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#e1e8fd] bg-gray-50 rounded-b-xl flex flex-col gap-3">
              {showAssignStaffDrawer && (
                <div className="bg-white p-3.5 rounded-xl border border-indigo-200 shadow-sm flex flex-col sm:flex-row items-center gap-3 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-bold text-indigo-900 mb-1">
                      Chọn nhân viên để phân công nhiệm vụ:
                    </label>
                    <select
                      value={selectedAssignStaffEmail}
                      onChange={(e) => setSelectedAssignStaffEmail(e.target.value)}
                      className="w-full h-10 rounded-lg border border-indigo-300 bg-indigo-50/50 px-3 text-xs font-bold text-indigo-950 outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="">-- Chọn nhân viên thuộc phòng Tranh chấp --</option>
                      {(() => {
                        const currentDeptCode = activeDeptCode || 'DIS';
                        const filteredStaff = staffList.filter((s) => {
                          const code = String(s.departmentCode || s.deptCode || s.code || '').toUpperCase();
                          const name = String(s.departmentName || s.department || '').toLowerCase();
                          const email = String(s.email || '').toLowerCase();

                          if (currentDeptCode === 'DIS') {
                            return code === 'DIS' || name.includes('tranh chấp') || name.includes('dispute') || email.includes('dispute');
                          } else if (currentDeptCode === 'MOD') {
                            return code === 'MOD' || name.includes('kiểm duyệt') || name.includes('moderation') || email.includes('moderation');
                          } else if (currentDeptCode === 'FIN') {
                            return code === 'FIN' || name.includes('tài chính') || name.includes('finance') || email.includes('finance');
                          } else if (currentDeptCode === 'CS') {
                            return code === 'CS' || name.includes('hỗ trợ') || name.includes('support') || email.includes('support');
                          }
                          return true;
                        });

                        if (filteredStaff.length > 0) {
                          return filteredStaff.map((s) => (
                            <option key={s.id || s.staffId || s.email} value={s.email}>
                              {s.fullName || s.displayName || s.email} ({s.email})
                            </option>
                          ));
                        }

                        return [
                          { email: "staff.dispute@gmail.com", name: "Nhân viên Tranh chấp" },
                          { email: "staff.dispute2@gmail.com", name: "Nhân viên Tranh chấp 2" }
                        ].map((s) => (
                          <option key={s.email} value={s.email}>
                            {s.name} ({s.email})
                          </option>
                        ));
                      })()}
                    </select>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto self-end">
                    <button
                      type="button"
                      onClick={() => setShowAssignStaffDrawer(false)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-all cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAssignDisputeToStaff(selectedAssignStaffEmail)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-lg shadow transition-all cursor-pointer"
                    >
                      Xác nhận phân công
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 w-full">
                <button
                  type="button"
                  onClick={() => setShowAssignStaffDrawer(!showAssignStaffDrawer)}
                  className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  Phân công công việc
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showWithdrawalModal && selectedWithdrawal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl border border-[#e1e8fd] flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e1e8fd]">
              <h2 className="text-title-md font-extrabold text-[#141b2b]">Chi tiết Yêu cầu Rút tiền</h2>
              <button 
                onClick={() => {
                  setShowWithdrawalModal(false);
                  setSelectedWithdrawal(null);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full text-[#6e7b6c] hover:bg-[#f1f4f0]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-4 text-sm">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-[#006b2c] bg-[#f7fff2] px-2 py-0.5 rounded border border-[#bdcaba]">
                  Yêu cầu #{selectedWithdrawal.id}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  selectedWithdrawal.statusRaw === 'PENDING'
                    ? 'bg-amber-100 text-amber-800'
                    : selectedWithdrawal.statusRaw === 'APPROVED'
                      ? 'bg-[#f7fff2] text-[#006b2c]'
                      : 'bg-[#ffdad6] text-[#ba1a1a]'
                }`}>
                  {selectedWithdrawal.status}
                </span>
              </div>

              <div className="border-t border-[#e9edff] pt-3 space-y-3">
                <div>
                  <p className="text-xs text-[#6e7b6c] mb-0.5 font-semibold">Thành viên gửi yêu cầu</p>
                  <p className="font-bold text-[#141b2b]">{selectedWithdrawal.user}</p>
                  <p className="text-xs text-slate-400">{selectedWithdrawal.email}</p>
                </div>

                <div>
                  <p className="text-xs text-[#6e7b6c] mb-0.5 font-semibold">Thông tin tài khoản nhận tiền</p>
                  <div className="bg-[#f9f9ff] border border-[#e9edff] p-3 rounded-lg">
                    <p className="font-bold text-[#141b2b]">{selectedWithdrawal.bank}</p>
                    <p className="text-xs text-[#3e4a3d] font-mono mt-0.5">Số tài khoản: {selectedWithdrawal.account}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-[#6e7b6c] mb-0.5 font-semibold">Thời gian yêu cầu</p>
                  <p className="font-medium text-[#141b2b]">{selectedWithdrawal.date}</p>
                </div>

                {selectedWithdrawal.statusRaw === 'REJECTED' && (
                  <div>
                    <p className="text-xs text-[#6e7b6c] mb-0.5 font-semibold">Lý do từ chối</p>
                    <p className="font-semibold text-rose-600 bg-rose-50 border border-rose-100 p-2.5 rounded-lg">
                      {selectedWithdrawal.reason || 'Không có lý do cụ thể'}
                    </p>
                  </div>
                )}

                <div className="bg-rose-50/50 border border-rose-100/55 p-3 rounded-lg flex justify-between items-center">
                  <span className="text-xs text-rose-800 font-bold uppercase">Số tiền rút:</span>
                  <span className="text-title-md font-extrabold text-rose-600">
                    {selectedWithdrawal.amount.toLocaleString('vi-VN')} VND
                  </span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#e1e8fd] bg-gray-50 rounded-b-xl flex gap-3">
              {selectedWithdrawal.statusRaw === 'PENDING' ? (
                <>
                  <button 
                    onClick={() => handleWithdrawalAction(selectedWithdrawal.id, 'APPROVED')}
                    className="flex-1 py-2 px-3 bg-[#006b2c] hover:bg-[#00873a] text-white font-bold text-sm rounded-lg shadow transition-colors text-center"
                  >
                    Phê duyệt
                  </button>
                  <button 
                    onClick={() => handleWithdrawalAction(selectedWithdrawal.id, 'REJECTED')}
                    className="flex-1 py-2 px-3 bg-white hover:bg-rose-50 text-[#ba1a1a] border border-rose-200 font-bold text-sm rounded-lg shadow transition-colors text-center"
                  >
                    Từ chối
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => {
                    setShowWithdrawalModal(false);
                    setSelectedWithdrawal(null);
                  }}
                  className="w-full py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-sm rounded-lg transition-colors"
                >
                  Đóng
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- DEPARTMENT TRANSFER REQUEST MODAL ---------------- */}
      {showTransferRequestModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl border border-[#e1e8fd] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e1e8fd]">
              <h2 className="text-title-md font-extrabold text-[#141b2b]">Yêu cầu điều chuyển</h2>
              <button 
                onClick={() => setShowTransferRequestModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-[#6e7b6c] hover:bg-[#f1f4f0]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleTransferRequestSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-body-sm text-[#3e4a3d] font-bold mb-1">Họ tên & Email</label>
                <div className="bg-[#f1f4f0] p-3 rounded-lg text-sm text-[#141b2b] font-medium">
                  {user?.displayName || user?.name} ({user?.email})
                </div>
              </div>

              <div>
                <label className="block text-body-sm text-[#3e4a3d] font-bold mb-1">Phòng ban hiện tại</label>
                <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg text-sm text-[#006b2c] font-bold">
                  {myProfile?.departmentName || 'Đang tải...'}
                </div>
              </div>

              <div>
                <label className="block text-body-sm text-[#3e4a3d] font-bold mb-1">Chọn phòng ban chuyển đến</label>
                <select
                  required
                  className="w-full border border-[#e1e8fd] rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#006b2c] bg-white cursor-pointer"
                  value={transferRequestTargetDeptId}
                  onChange={e => setTransferRequestTargetDeptId(e.target.value)}
                >
                  <option value="">-- Chọn phòng ban --</option>
                  {departmentsList
                    .filter(d => d.departmentId !== myProfile?.departmentId)
                    .map(d => (
                      <option key={d.departmentId} value={d.departmentId}>
                        {d.name} ({d.code})
                      </option>
                    ))
                  }
                </select>
              </div>

              <div>
                <label className="block text-body-sm text-[#3e4a3d] font-bold mb-2">Lý do điều chuyển</label>
                <textarea
                  required
                  className="w-full h-24 border border-[#e1e8fd] rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#006b2c] resize-none"
                  placeholder="Nhập lý do chi tiết..."
                  value={transferRequestReason}
                  onChange={e => setTransferRequestReason(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTransferRequestModal(false)}
                  className="flex-1 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-body-sm transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTransferRequest || !transferRequestTargetDeptId}
                  className="flex-1 py-2.5 rounded-lg font-bold text-body-sm shadow transition-all text-white bg-[#006b2c] hover:bg-[#00873a] disabled:opacity-50"
                >
                  {isSubmittingTransferRequest ? 'Đang gửi...' : 'Gửi yêu cầu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- MODERATION DETAIL MODAL ---------------- */}
      {showModerationModal && selectedModerationItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-[#e1e8fd] flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e1e8fd]">
              <h2 className="text-title-md font-extrabold text-[#141b2b]">Chi tiết kiểm duyệt</h2>
              <button 
                onClick={() => {
                  setShowModerationModal(false);
                  setSelectedModerationItem(null);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full text-[#6e7b6c] hover:bg-[#f1f4f0]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-5">
              <div className="flex justify-between items-center mb-1">
                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border bg-indigo-50 text-indigo-700 border-indigo-100">
                  {selectedModerationItem.type}
                </span>
                <span className="text-xs text-[#6e7b6c] font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {selectedModerationItem.subDate}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-[#141b2b] leading-snug">{selectedModerationItem.title}</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold shrink-0">
                    {selectedModerationItem.author ? selectedModerationItem.author.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] text-[#6e7b6c] uppercase font-bold block">Người đăng</span>
                    <span className="text-sm font-extrabold text-slate-800 block truncate">{selectedModerationItem.author}</span>
                  </div>
                </div>

                <div className="bg-amber-50/50 border border-amber-200/60 p-4 rounded-xl flex items-start gap-2.5 text-amber-850">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="text-[11px] text-amber-700 uppercase font-bold block">Lý do kiểm duyệt</span>
                    <span className="text-xs font-bold text-amber-800">{selectedModerationItem.reason}</span>
                  </div>
                </div>
              </div>

              {selectedModerationItem.type === 'PROFILE' && selectedModerationItem.rawRequest ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                      <p className="font-bold text-slate-500 uppercase pb-2 border-b border-slate-200 mb-2">Thông tin hiện tại</p>
                      <p><strong>Tên hiển thị:</strong> {selectedModerationItem.rawRequest.employer?.displayName || 'Chưa cập nhật'}</p>
                      <p><strong>Họ và tên:</strong> {selectedModerationItem.rawRequest.employer?.fullName || 'Chưa cập nhật'}</p>
                      <p><strong>Số điện thoại:</strong> {selectedModerationItem.rawRequest.employer?.phone || 'Chưa cập nhật'}</p>
                      <p><strong>Tên công ty:</strong> {selectedModerationItem.rawRequest.employer?.companyName || 'Chưa cập nhật'}</p>
                      <p><strong>Website:</strong> {selectedModerationItem.rawRequest.employer?.website || 'Chưa cập nhật'}</p>
                      <p><strong>Quy mô:</strong> {selectedModerationItem.rawRequest.employer?.companySize || 'Chưa cập nhật'}</p>
                      <p><strong>Ngành nghề:</strong> {selectedModerationItem.rawRequest.employer?.industry || 'Chưa cập nhật'}</p>
                      <p><strong>Mã số thuế:</strong> {selectedModerationItem.rawRequest.employer?.taxCode || 'Chưa cập nhật'}</p>
                      <p><strong>Địa chỉ:</strong> {selectedModerationItem.rawRequest.employer?.address ? `${selectedModerationItem.rawRequest.employer.address}, ${selectedModerationItem.rawRequest.employer.city || ''}, ${selectedModerationItem.rawRequest.employer.country || ''}` : 'Chưa cập nhật'}</p>
                      <p><strong>Mô tả:</strong> {selectedModerationItem.rawRequest.employer?.companyDescription || 'Chưa cập nhật'}</p>
                    </div>
                    <div className="bg-indigo-50/30 p-4 rounded-xl border border-indigo-100 space-y-1">
                      <p className="font-bold text-indigo-600 uppercase pb-2 border-b border-indigo-100 mb-2">Thông tin đề xuất</p>
                      <p><strong>Tên hiển thị:</strong> <span className={selectedModerationItem.rawRequest.displayName !== selectedModerationItem.rawRequest.employer?.displayName ? "text-indigo-650 font-bold" : ""}>{selectedModerationItem.rawRequest.displayName || 'Chưa cập nhật'}</span></p>
                      <p><strong>Họ và tên:</strong> <span className={selectedModerationItem.rawRequest.fullName !== selectedModerationItem.rawRequest.employer?.fullName ? "text-indigo-655 font-bold" : ""}>{selectedModerationItem.rawRequest.fullName || 'Chưa cập nhật'}</span></p>
                      <p><strong>Số điện thoại:</strong> <span className={selectedModerationItem.rawRequest.phone !== selectedModerationItem.rawRequest.employer?.phone ? "text-indigo-655 font-bold" : ""}>{selectedModerationItem.rawRequest.phone || 'Chưa cập nhật'}</span></p>
                      <p><strong>Tên công ty:</strong> <span className={selectedModerationItem.rawRequest.companyName !== selectedModerationItem.rawRequest.employer?.companyName ? "text-indigo-655 font-bold" : ""}>{selectedModerationItem.rawRequest.companyName || 'Chưa cập nhật'}</span></p>
                      <p><strong>Website:</strong> <span className={selectedModerationItem.rawRequest.website !== selectedModerationItem.rawRequest.employer?.website ? "text-indigo-655 font-bold" : ""}>{selectedModerationItem.rawRequest.website || 'Chưa cập nhật'}</span></p>
                      <p><strong>Quy mô:</strong> <span className={selectedModerationItem.rawRequest.companySize !== selectedModerationItem.rawRequest.employer?.companySize ? "text-indigo-655 font-bold" : ""}>{selectedModerationItem.rawRequest.companySize || 'Chưa cập nhật'}</span></p>
                      <p><strong>Ngành nghề:</strong> <span className={selectedModerationItem.rawRequest.industry !== selectedModerationItem.rawRequest.employer?.industry ? "text-indigo-655 font-bold" : ""}>{selectedModerationItem.rawRequest.industry || 'Chưa cập nhật'}</span></p>
                      <p><strong>Mã số thuế:</strong> <span className={selectedModerationItem.rawRequest.taxCode !== selectedModerationItem.rawRequest.employer?.taxCode ? "text-indigo-655 font-bold" : ""}>{selectedModerationItem.rawRequest.taxCode || 'Chưa cập nhật'}</span></p>
                      <p><strong>Địa chỉ:</strong> <span className={(selectedModerationItem.rawRequest.address !== selectedModerationItem.rawRequest.employer?.address || selectedModerationItem.rawRequest.city !== selectedModerationItem.rawRequest.employer?.city) ? "text-indigo-655 font-bold" : ""}>{selectedModerationItem.rawRequest.address ? `${selectedModerationItem.rawRequest.address}, ${selectedModerationItem.rawRequest.city || ''}, ${selectedModerationItem.rawRequest.country || ''}` : 'Chưa cập nhật'}</span></p>
                      <p><strong>Mô tả:</strong> <span className={selectedModerationItem.rawRequest.companyDescription !== selectedModerationItem.rawRequest.employer?.companyDescription ? "text-indigo-655 font-bold block whitespace-pre-line" : ""}>{selectedModerationItem.rawRequest.companyDescription || 'Chưa cập nhật'}</span></p>
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl text-xs space-y-1">
                    <p className="font-bold text-slate-700 pb-1.5 border-b border-slate-200 mb-1.5">Thông tin tài khoản ngân hàng thụ hưởng đề xuất</p>
                    <p><strong>Tên ngân hàng:</strong> {selectedModerationItem.rawRequest.bankName || 'Chưa cập nhật'}</p>
                    <p><strong>Số tài khoản:</strong> {selectedModerationItem.rawRequest.accountNumber || 'Chưa cập nhật'}</p>
                    <p><strong>Chủ tài khoản:</strong> {selectedModerationItem.rawRequest.accountHolder || 'Chưa cập nhật'}</p>
                    <p><strong>Chi nhánh:</strong> {selectedModerationItem.rawRequest.branch || 'Chưa cập nhật'}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#6e7b6c] uppercase block">Nội dung chi tiết</span>
                  <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl text-sm text-slate-850 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                    {selectedModerationItem.detail || 'Không có mô tả chi tiết'}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-[#e1e8fd] bg-slate-50 flex items-center justify-between rounded-b-2xl">
              <span className="text-xs text-[#6e7b6c] font-bold">Trạng thái hồ sơ</span>
              <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${
                selectedModerationItem.status === 'Pending'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-[#f7fff2] text-[#006b2c]'
              }`}>
                {selectedModerationItem.status === 'Pending' ? 'Đang chờ xử lý' : 'Đã xử lý'}
              </span>
            </div>          </div>
        </div>
      )}

      {/* Manager Report Details & Signoff Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-[#6e7b6c]">
                  {selectedReport.id}
                </span>
                <h3 className="text-xl font-extrabold text-slate-800 mt-0.5">
                  Chi tiết Báo cáo vi phạm
                </h3>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Meta Badges */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-3 py-1 bg-slate-50 text-slate-700 border border-slate-200 rounded-md text-xs font-bold">
                  Đối tượng: {selectedReport.type || selectedReport.target}
                </span>
                <span
                  className={`px-3 py-1 text-xs font-bold border rounded-md ${
                    selectedReport.status === "Đã chuyển cấp" || selectedReport.status === "ESCALATED"
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : selectedReport.status === "Chờ xử lý" || selectedReport.status === "PENDING"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}
                >
                  Trạng thái: {selectedReport.status}
                </span>
              </div>

              {/* Target Content */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                <h4 className="text-xs font-bold text-[#6e7b6c] uppercase block mb-1">
                  Nội dung bị báo cáo
                </h4>
                <p className="text-base font-extrabold text-[#141b2b]">
                  {selectedReport.target || selectedReport.reportedName || "Đối tượng vi phạm"}
                  {selectedReport.targetId && (
                    <span className="text-xs font-normal text-slate-500 ml-2 block sm:inline mt-1 sm:mt-0">
                      (ID: {selectedReport.targetId})
                    </span>
                  )}
                </p>
              </div>

              {/* Evidence / Reason */}
              <div className="bg-rose-50/60 border border-rose-200 p-4 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-rose-800">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Lý do & Bằng chứng báo cáo
                  </span>
                </div>
                <p className="text-sm text-rose-950 whitespace-pre-wrap leading-relaxed">
                  {selectedReport.evidence || selectedReport.reason || "Không có bằng chứng cụ thể"}
                </p>
              </div>

              {/* Parties Involved */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold shrink-0">
                    {selectedReport.reporter
                      ? selectedReport.reporter.charAt(0).toUpperCase()
                      : "R"}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] text-[#6e7b6c] uppercase font-bold block">
                      Người báo cáo
                    </span>
                    <span className="text-sm font-extrabold text-slate-800 block truncate">
                      {selectedReport.reporter || "N/A"}
                    </span>
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 font-bold shrink-0">
                    {selectedReport.accused
                      ? selectedReport.accused.charAt(0).toUpperCase()
                      : "A"}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] text-[#6e7b6c] uppercase font-bold block">
                      Người bị báo cáo
                    </span>
                    <span className="text-sm font-extrabold text-rose-900 block truncate">
                      {selectedReport.accused || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex items-center justify-between gap-3">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-sm rounded-lg transition-colors cursor-pointer"
              >
                Đóng
              </button>

              {(selectedReport.status === "Chờ xử lý" ||
                selectedReport.status === "PENDING" ||
                selectedReport.status === "Đã chuyển cấp" ||
                selectedReport.status === "ESCALATED") && (
                <div className="flex items-center gap-2">
                  {(() => {
                    const isAssigned = tasks.some(t =>
                      t.status !== 'Manager đã ký duyệt' &&
                      t.status !== 'Rejected' &&
                      String(t.referenceId) === String(selectedReport.idRaw || selectedReport.id) &&
                      t.taskType === 'REPORT_RESOLUTION'
                    );
                    return isAssigned ? (
                      <span className="px-3 py-2 bg-slate-100 text-slate-500 text-xs font-bold rounded-lg border border-slate-200">
                        Đã phân công
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          const rep = selectedReport;
                          setSelectedReport(null);
                          setCreateForm({
                            taskType: 'REPORT_RESOLUTION',
                            title: `Báo cáo vi phạm: [${rep.type || 'Nội dung'}] ${rep.target || ''}`,
                            referenceId: rep.idRaw || rep.id,
                            description: `Người báo cáo: ${rep.reporter || 'N/A'}. Bị báo cáo: ${rep.accused || 'N/A'}. Bằng chứng: ${rep.evidence || ''}`,
                            requiredDepartments: activeDeptCode === 'ALL' ? 'MOD' : activeDeptCode,
                            assignedToEmail: '',
                          });
                          setShowCreateModal(true);
                        }}
                        className="px-4 py-2 bg-[#f1f3ff] text-[#0058be] hover:bg-[#e1e8fd] border border-blue-200 font-bold text-sm rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4" /> Phân công cho Staff
                      </button>
                    );
                  })()}
                  <button
                    disabled={reportActionLoading}
                    onClick={() => handleManagerResolveReport(selectedReport, "REJECTED")}
                    className="px-4 py-2 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold text-sm rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" /> Từ chối
                  </button>
                  <button
                    disabled={reportActionLoading}
                    onClick={() => handleManagerResolveReport(selectedReport, "RESOLVED")}
                    className="px-5 py-2 bg-[#006b2c] hover:bg-[#00873a] text-white font-bold text-sm rounded-lg shadow transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Đồng ý ký duyệt & Xử lý
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

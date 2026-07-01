import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, CheckSquare, MessageSquare, ShieldAlert, UserCheck, 
  BadgeDollarSign, Gavel, FileText, Bell, Settings, Search, HelpCircle, 
  Plus, ArrowUpRight, ArrowDownRight, MoreVertical, Filter,
  Check, X, Send, Eye, ShieldCheck, AlertCircle, Clock, ChevronRight,
  TrendingUp, Activity, User, LogOut, CheckCircle2, AlertTriangle, Paperclip,
  XCircle, ShieldBan, ChevronDown, Edit3, Shield, ArrowLeftRight
} from 'lucide-react';
import { adminApi } from '../api/adminApi.js';
import { messengerApi } from '../../messenger/api/messengerApi.js';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import NotificationDropdown from '../components/NotificationDropdown.jsx';

export default function StaffDashboardPage({ user, onNavigateToHome, onNavigate, onLogout }) {
  // Styles & Brand Settings
  const brandName = "FelanPro";
  const brandSub = "Admin Console";
  const currentRole = user?.role || "STAFF";
  const activeDepartmentCodes = ['FIN', 'MOD', 'DIS', 'CS', 'IT'];
  const isActiveDepartment = (department) => activeDepartmentCodes.includes(department?.code);
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
  
  // Tab states
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [sectionsOpen, setSectionsOpen] = useState({
    finance: true,
    moderation: true,
    disputeResolution: true,
    customerSupport: true,
    itDevelopment: true
  });
  const toggleSection = (section) => {
    setSectionsOpen(prev => ({ ...prev, [section]: !prev[section] }));
  };
  
  // Dashboard & Task filters
  const [searchQuery, setSearchQuery] = useState('');
  const [taskFilter, setTaskFilter] = useState('ALL');
  const [chartPeriod, setChartPeriod] = useState('7days');
  const [hoveredPoint, setHoveredPoint] = useState(null);
  
  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showManageModal, setShowManageModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  
  // Notification Toast
  const [toast, setToast] = useState({ message: '', type: 'success', show: false });
  const showToast = (message, type = 'success') => {
    setToast({ message, type, show: true });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  // Department Transfer States
  const [showTransferRequestModal, setShowTransferRequestModal] = useState(false);
  const [transferRequestTargetDeptId, setTransferRequestTargetDeptId] = useState('');
  const [transferRequestReason, setTransferRequestReason] = useState('');
  const [transferRequestDetails, setTransferRequestDetails] = useState({
    desiredPosition: '',
    desiredStartDate: '',
    transferType: 'Yêu cầu cá nhân',
    skills: '',
    achievements: '',
    attachmentName: '',
    confirmed: false
  });
  const [myProfile, setMyProfile] = useState(null);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [isSubmittingTransferRequest, setIsSubmittingTransferRequest] = useState(false);

  // Report filters
  const [reportFilter, setReportFilter] = useState('ALL');
  const [reportTypeFilter, setReportTypeFilter] = useState('ALL');
  const [reportSearch, setReportSearch] = useState('');
  const [kycSearch, setKycSearch] = useState('');

  // Finance states
  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawalFilter, setWithdrawalFilter] = useState('ALL');
  const [vnpayTxns, setVnpayTxns] = useState([]);
  const [vnpayFilter, setVnpayFilter] = useState('ALL');
  const [financeSearch, setFinanceSearch] = useState('');

  // ---------------- REAL DATABASE DATA STATES ----------------
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
  const [showModerationModal, setShowModerationModal] = useState(false);
  const [selectedModerationItem, setSelectedModerationItem] = useState(null);
  const [violationReports, setViolationReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportActionLoading, setReportActionLoading] = useState(false);
  const [escalationCases, setEscalationCases] = useState([]);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [disputeNote, setDisputeNote] = useState('');
  const [warningTemplates, setWarningTemplates] = useState([]);
  const [moderationHistory, setModerationHistory] = useState([]);
  const [moderationView, setModerationView] = useState('queue');
  const [queueTab, setQueueTab] = useState('ALL');
  const [queueSearch, setQueueSearch] = useState('');
  const [selectedQueueItems, setSelectedQueueItems] = useState([]);
  const [userGrowthTrend, setUserGrowthTrend] = useState([]);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [supportStats, setSupportStats] = useState({
    total: 0,
    inProgress: 0,
    pending: 0,
    waitingUser: 0,
    inProgressPercent: 0,
    pendingPercent: 0,
    waitingUserPercent: 0
  });
  const [bugReports, setBugReports] = useState([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const stompClientRef = useRef(null);
  const subscriptionRef = useRef(null);
  const selectedChatIdRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Create task form state
  const [createForm, setCreateForm] = useState({
    type: 'Account Verification',
    user: '',
    priority: 'Medium',
    deadline: '',
    description: ''
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
  const [supportSubTab, setSupportSubTab] = useState('unclaimed'); // 'claimed' | 'unclaimed' | 'blocked' | 'deleted'
  const [deletedChats, setDeletedChats] = useState([]);
  const [confirmCountdown, setConfirmCountdown] = useState(null);
  const [showEscalateReasons, setShowEscalateReasons] = useState(false);
  const [selectedEscalateReason, setSelectedEscalateReason] = useState('');

  const fetchMyProfile = () => {
    if (!user?.id) return;
    adminApi.getStaffProfile(user.id)
      .then(data => {
        if (data) {
          setMyProfile(data);
        }
      })
      .catch(err => console.error("Error fetching staff profile:", err));
  };

  useEffect(() => {
    fetchMyProfile();
  }, [user?.id]);
  
  const fetchBugReports = () => {
    adminApi.getBugReports().then(data => {
      setBugReports(Array.isArray(data) ? data : []);
    }).catch(err => console.error("Error fetching bug reports:", err));
  };

  useEffect(() => {
    if (activeTab === 'SystemBugs') {
      fetchBugReports();
    }
  }, [activeTab]);

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

  const resetTransferRequestForm = () => {
    setTransferRequestReason('');
    setTransferRequestTargetDeptId('');
    setTransferRequestDetails({
      desiredPosition: '',
      desiredStartDate: '',
      transferType: 'Yêu cầu cá nhân',
      skills: '',
      achievements: '',
      attachmentName: '',
      confirmed: false
    });
  };

  const closeTransferRequestModal = () => {
    setShowTransferRequestModal(false);
  };

  const handleTransferRequestSubmit = (e) => {
    e.preventDefault();
    if (!transferRequestTargetDeptId || !user?.id || !transferRequestDetails.confirmed) return;

    setIsSubmittingTransferRequest(true);
    const selectedDepartment = departmentsList.find(d => String(d.departmentId) === String(transferRequestTargetDeptId));
    const structuredReason = [
      `Lý do điều chuyển: ${transferRequestReason}`,
      `Phòng ban mong muốn: ${selectedDepartment?.name || 'Chưa xác định'}${selectedDepartment?.code ? ` (${selectedDepartment.code})` : ''}`,
      `Vị trí mong muốn: ${transferRequestDetails.desiredPosition || 'Chưa cung cấp'}`,
      `Ngày mong muốn bắt đầu: ${transferRequestDetails.desiredStartDate || 'Chưa cung cấp'}`,
      `Loại điều chuyển: ${transferRequestDetails.transferType}`,
      `Kỹ năng liên quan & kinh nghiệm trước đây: ${transferRequestDetails.skills || 'Chưa cung cấp'}`,
      `Thành tích nổi bật & lý do phù hợp: ${transferRequestDetails.achievements || 'Chưa cung cấp'}`,
      `Tệp đính kèm: ${transferRequestDetails.attachmentName || 'Không có'}`
    ].join('\n');

    const payload = {
      userType: 'STAFF',
      userId: user.id,
      toDepartmentId: parseInt(transferRequestTargetDeptId, 10),
      reason: structuredReason
    };

    adminApi.transferDepartmentMember(payload)
      .then(res => {
        setIsSubmittingTransferRequest(false);
        if (res.success !== false) {
          showToast('Điều chuyển phòng ban thành công!', 'success');
          setShowTransferRequestModal(false);
          resetTransferRequestForm();
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

  useEffect(() => {
    if (showConfirmModal && confirmCountdown !== null && confirmCountdown > 0) {
      const timer = setTimeout(() => setConfirmCountdown(confirmCountdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (showConfirmModal && confirmCountdown === 0) {
      setShowConfirmModal(false);
      setConfirmCountdown(null);
    }
  }, [showConfirmModal, confirmCountdown]);

  const supportSubTabRef = useRef(supportSubTab);
  useEffect(() => {
    supportSubTabRef.current = supportSubTab;
  }, [supportSubTab]);

  // Keep selectedChatIdRef in sync so WebSocket callbacks (created at mount) always read the current value
  useEffect(() => {
    selectedChatIdRef.current = selectedChatId;
  }, [selectedChatId]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // 1. WebSocket connection
  useEffect(() => {
    const socket = new SockJS('http://localhost:8080/api/ws');
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
    });

    client.onConnect = (frame) => {
      console.log('[STOMP] Connected (Staff)', frame);
      setSocketConnected(true);

      // Subscribe to global admin topic — handles ALL ticket messages in real time
      client.subscribe('/topic/admin', (message) => {
        const received = JSON.parse(message.body);
        console.log('[STOMP] /topic/admin (Staff)', received);

        // Skip SYSTEM messages (claims, blocks) — they are handled by fetchSupportChats
        if (received.senderRole !== 'SYSTEM' && received.messageText) {
          // If this message belongs to the currently open conversation, add it immediately
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

        // Always refresh sidebar list to update last message / unread badge
        fetchSupportChats();
        if (supportSubTabRef.current === 'deleted') {
          fetchDeletedSupportChats();
        }
      });
    };

    client.onDisconnect = () => {
      console.log('[STOMP] Disconnected (Staff)');
      setSocketConnected(false);
    };

    client.onStompError = (frame) => {
      console.error('[STOMP] Error (Staff)', frame);
    };

    client.activate();
    stompClientRef.current = client;

    return () => {
      try {
        client.deactivate();
      } catch (e) {}
    };
  }, []);

  // 2. Fetch all databases lists
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
            if (t.status === 'APPROVED') displayStatus = 'Completed';
            else if (t.status === 'REJECTED') displayStatus = 'Rejected';
            else if (t.status === 'IN_PROGRESS') displayStatus = 'In Progress';
            else if (t.status === 'ESCALATED') displayStatus = 'Escalated';

            return {
              id: `#TSK-${t.taskId}`,
              taskId: t.taskId,
              type: t.taskType || 'Verification Request',
              title: t.title || 'Verification Request',
              user: t.verifierEmail || `Dept: ${firstDept}`,
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(t.taskType || 'V')}&background=006b2c&color=fff`,
              priority: t.taskType === 'Payment Processing' ? 'High' : t.taskType === 'Dispute Resolution' ? 'High' : 'Medium',
              status: displayStatus,
              deadline: t.status === 'APPROVED' ? 'Completed' : 'Pending Review',
              description: t.description || 'No description provided.',
              requiredDepartments: t.requiredDepartments,
              signoffs: t.signoffs,
              assignedToEmail: t.assignedToEmail || null
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
          const pendingData = data.filter(req => req.status === 'PENDING' || req.status === 'IN_REVIEW' || !req.status || req.status === 'MORE_INFO_REQUIRED');
          setKycRequests(pendingData.map(req => ({
            id: `KYC-${req.userRole === 'EMPLOYER' ? 'EMP' : 'FL'}-${req.id}`,
            idRaw: req.id,
            name: req.userName,
            email: req.userEmail,
            role: req.userRole || 'FREELANCER',
            docType: req.userRole === 'EMPLOYER' ? 'Giấy phép KD & CCCD Đại diện' : 'CCCD/ID Card',
            subDate: req.submittedAt ? req.submittedAt.substring(0, 10) : '',
            subDateFull: req.submittedAt || '',
            docUrls: req.documentUrls && req.documentUrls.length > 0 ? req.documentUrls.filter(url => url !== "") : (req.idCard ? [req.idCard] : []),
            status: req.status === 'APPROVED' ? 'Approved' : req.status === 'REJECTED' ? 'Rejected' : 'Pending'
          })));
        }
      })
      .catch(err => console.error('Error fetching kyc:', err));
  };

  const fetchModerationItems = () => {
    Promise.all([
      adminApi.getPendingProjects().catch(() => []),
      adminApi.getProfileRequests().catch(() => []),
      adminApi.getPendingGigs().catch(() => []),
      adminApi.getReports().catch(() => [])
    ]).then(([projectsData, profilesData, gigsData, reportsData]) => {
      let mapped = [];

      if (Array.isArray(projectsData)) {
        mapped = [...mapped, ...projectsData.map(p => ({
          id: p.id,
          idRaw: p.id,
          title: p.title,
          type: 'PROJECT',
          author: p.clientName || 'Employer',
          detail: p.description,
          reason: 'Dự án mới cần duyệt',
          subDate: p.createdAt ? String(p.createdAt) : '',
          status: 'Pending'
        }))];
      }

      if (Array.isArray(profilesData)) {
        mapped = [...mapped, ...profilesData.map(pr => ({
          id: `PROF-${pr.id || pr.requestId}`,
          idRaw: pr.id || pr.requestId,
          title: `Cập nhật hồ sơ: ${pr.companyName || pr.displayName || 'Employer'}`,
          type: 'PROFILE',
          author: pr.displayName || 'Employer',
          detail: `Yêu cầu cập nhật hồ sơ công ty. ${pr.companyDescription ? 'Có thay đổi mô tả.' : ''}`,
          reason: 'Cập nhật hồ sơ',
          subDate: pr.createdAt ? String(pr.createdAt) : new Date().toISOString(),
          status: pr.status === 'PENDING' ? 'Pending' : 'Processed'
        }))];
      }

      if (Array.isArray(gigsData)) {
        mapped = [...mapped, ...gigsData.map(g => ({
          id: `GIG-${g.id}`,
          idRaw: g.id,
          title: g.title,
          type: 'GIG',
          author: g.freelancerName || 'Freelancer',
          detail: g.description,
          reason: 'Dịch vụ mới',
          subDate: g.createdAt ? String(g.createdAt) : new Date().toISOString(),
          status: 'Pending'
        }))];
      }

      if (Array.isArray(reportsData)) {
        const reviewReports = reportsData.filter(r => r.targetType === 'REVIEW' && r.status === 'PENDING');
        mapped = [...mapped, ...reviewReports.map(r => ({
          id: `REV-${r.id}`,
          idRaw: r.id,
          title: `Đánh giá bị báo cáo: ID #${r.id}`,
          type: 'REVIEW',
          author: r.reporterName || 'User',
          detail: r.reason,
          reason: 'Báo cáo vi phạm',
          subDate: r.createdAt ? String(r.createdAt).substring(0, 10) : new Date().toISOString().substring(0, 10),
          status: 'Pending'
        }))];
      }

      setModerationItems(mapped);
    }).catch(err => console.error('Error fetching moderation items:', err));
  };

  const handleResolveDispute = (status) => {
    if (!selectedDispute) return;
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const adminId = user?.adminId || 1;

    adminApi.resolveDispute(selectedDispute.raw.id, status, disputeNote, adminId)
      .then(res => {
        if (res.success) {
          setToast({ message: res.message, type: 'success', show: true });
          setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
          setShowDisputeModal(false);
          setSelectedDispute(null);
          setDisputeNote('');
          fetchModerationData(); // Refresh list
        } else {
          setToast({ message: res.message, type: 'error', show: true });
          setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
        }
      })
      .catch(err => console.error('Error resolving dispute:', err));
  };

  const fetchModerationData = () => {
    adminApi.getReports().then(data => {
      if (Array.isArray(data)) {
        setViolationReports(data.map(r => ({
          id: `RPT-${r.id}`,
          idRaw: r.id,
          target: r.targetType,
          reporter: r.reporterName,
          accused: r.reportedName,
          severity: r.severity === 'HIGH' ? 'Cao' : r.severity === 'LOW' ? 'Thấp' : 'Trung bình',
          type: r.targetType === 'PROJECT' ? 'Dự án' : 'Hồ sơ',
          status: r.status === 'PENDING' ? 'Chờ xử lý' : 'Đã xử lý',
          evidence: r.reason + (r.evidence ? ` - Link: ${r.evidence}` : '')
        })));
      }
    }).catch(console.error);

    adminApi.getDisputes().then(data => {
      if (Array.isArray(data)) {
        setEscalationCases(data.map(d => ({
          id: `ESC-${d.id}`,
          title: d.reason || 'Tranh chấp dự án',
          owner: d.clientName,
          priority: d.priority === 'HIGH' ? 'Khẩn cấp' : 'Cao',
          raw: d
        })));
      }
    }).catch(console.error);

    adminApi.getWarningTemplates().then(data => {
      if (Array.isArray(data)) {
        setWarningTemplates(data.map(w => w.content));
      }
    }).catch(console.error);

    adminApi.getAuditLogs().then(data => {
      if (Array.isArray(data)) {
        const modLogs = data.filter(log => log.module === 'MODERATION' || log.module === 'PROJECTS' || (log.module === 'USER_MANAGEMENT' && log.status && log.status.startsWith('KYC')) || (log.module === 'FINANCE' && log.status === 'PROCESS_WITHDRAWAL'));
        setModerationHistory(modLogs.slice(0, 100).map(log => ({
          id: `LOG-${log.id}`,
          action: log.status || 'Hành động',
          actor: log.source || 'Staff',
          target: log.detail || 'Không có chi tiết',
          time: new Date(log.timestamp).toLocaleString('vi-VN'),
          result: 'Đã lưu vết'
        })));
      }
    }).catch(console.error);
  };

  const resolveReport = (item, status) => {
    const adminId = user?.id || 1;
    setReportActionLoading(true);
    adminApi.resolveReport(item.id || item.idRaw, status, adminId)
      .then(res => {
        if (res.success) {
          showToast('Thao tác báo cáo thành công', 'success');
          fetchModerationData();
          if (selectedReport && (selectedReport.id === item.id || selectedReport.id === item.idRaw)) {
            setSelectedReport(null);
          }
        } else {
          showToast(res.message || 'Lỗi xử lý báo cáo', 'error');
        }
      })
      .catch(err => {
        console.error(err);
        showToast('Lỗi xử lý báo cáo', 'error');
      })
      .finally(() => {
        setReportActionLoading(false);
      });
  };

  const fetchSupportChats = () => {
    messengerApi.getTickets()
      .then(data => {
        if (Array.isArray(data)) {
          // Calculate stats dynamically
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
            fetchModerationData(); // Reload history for withdrawal
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

  // Mount logic
  useEffect(() => {
    fetchStats();
    fetchTasks();
    fetchKycRequests();
    fetchModerationItems();
    fetchModerationData();
    fetchSupportChats();
    fetchDeletedSupportChats();
    fetchTrends();
    fetchWithdrawals();
    fetchVnpayTransactions();
  }, [chartPeriod]);

  // Listen to new notifications from WebSocket
  useEffect(() => {
    const handleNewNotification = (event) => {
      const notif = event.detail;
      if (notif) {
        if (notif.type === 'TASK') {
          fetchTasks();
          fetchModerationItems();
        }
        if (notif.referenceId && notif.referenceId.startsWith('KYC-')) {
          fetchKycRequests();
        }
      }
    };
    window.addEventListener('newNotification', handleNewNotification);
    return () => window.removeEventListener('newNotification', handleNewNotification);
  }, []);

  // Messages fetch on selection
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

  // Messages websocket subscription
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

  // 3. Handlers with Real DB connection
  const handleCreateTask = (e) => {
    e.preventDefault();
    showToast('Chức năng tạo tác vụ mới yêu cầu quyền quản lý phòng ban cấp cao!', 'error');
    setShowCreateModal(false);
  };

  // Task approval signoff
  const handleUpdateTaskStatus = (id, newStatus) => {
    if (!selectedTask) return;
    
    setIsLoading(true);
    if (newStatus === 'In Progress') {
      adminApi.claimVerificationTask(selectedTask.taskId, user?.email || 'staff@gmail.com')
        .then(res => {
          setIsLoading(false);
          if (res.success === false) {
            showToast(res.message || 'Lỗi khi nhận tác vụ.', 'error');
          } else {
            showToast('Nhận tác vụ thành công!', 'success');
            fetchTasks();
            setShowManageModal(false);
            setSelectedTask(null);
          }
        })
        .catch(err => {
          setIsLoading(false);
          console.error(err);
          showToast('Lỗi hệ thống khi nhận tác vụ.', 'error');
        });
      return;
    }

    const reqDepts = selectedTask.requiredDepartments?.split(',') || ['CS'];
    const deptCode = reqDepts[0] || 'CS';

    adminApi.submitTaskSignoff(selectedTask.taskId, {
      status: newStatus === 'Completed' ? 'APPROVED' : 'PENDING',
      note: `Ký duyệt trạng thái ${newStatus} bởi CS Staff`,
      departmentCode: deptCode
    }, user?.email || 'staff@gmail.com')
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

  // Support chat submit
  const handleSendChat = (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedChatId || !stompClientRef.current?.connected) return;

    const payload = {
      ticketId: selectedChatId,
      senderId: user.id,
      senderRole: user.role,
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

  // Moderation: block user
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

  // Moderation: delete conversation
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

  // Moderation: restore conversation
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

  // KYC Approval
  const handleKycAction = (idRaw, approve, role) => {
    adminApi.moderateKycRequest(idRaw, approve, role, user?.id || 1)
      .then(res => {
        if (res.success) {
          showToast(approve ? 'Đã duyệt yêu cầu KYC!' : 'Đã từ chối yêu cầu KYC!', approve ? 'success' : 'error');
          fetchKycRequests();
          fetchModerationData(); // Reload history for KYC
        } else {
          showToast(res.message || 'Thao tác thất bại.', 'error');
        }
      })
      .catch(err => {
        console.error(err);
        showToast('Lỗi kết nối máy chủ.', 'error');
      });
  };

  // Confirmation prompt for moderation action
  const handleModAction = (item, approve) => {
    setConfirmConfig({
      title: approve ? 'Xác nhận phê duyệt' : 'Xác nhận từ chối',
      message: approve 
        ? `Bạn có chắc chắn muốn PHÊ DUYỆT nội dung: "${item.title}"?`
        : `Bạn có chắc chắn muốn TỪ CHỐI nội dung: "${item.title}"?`,
      type: approve ? 'success' : 'danger',
      confirmText: approve ? 'Phê duyệt' : 'Từ chối',
      onConfirm: () => {
        setShowConfirmModal(false);
        setConfirmCountdown(null);
        executeModAction(item, approve);
      }
    });
    setConfirmCountdown(15);
    setShowConfirmModal(true);
  };

  // Moderation action supporting multiple types
  const executeModAction = (item, approve) => {
    const adminId = user?.id || 1;
    let apiCall;
    const reason = approve ? 'Phê duyệt hợp lệ' : 'Không đáp ứng tiêu chuẩn kiểm duyệt';

    if (item.type === 'PROJECT') {
      apiCall = adminApi.moderateProject(item.idRaw, approve, reason, adminId);
    } else if (item.type === 'PROFILE') {
      apiCall = adminApi.moderateProfileRequest(item.idRaw, approve, reason, adminId);
    } else if (item.type === 'WITHDRAWAL') {
      const status = approve ? 'COMPLETED' : 'REJECTED'; // Depending on backend enums
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
          fetchModerationData(); // Reload history
        } else {
          showToast(res.message || 'Thao tác thất bại.', 'error');
        }
      })
      .catch(err => {
        console.error(err);
        showToast('Lỗi kết nối máy chủ.', 'error');
      });
  };

  const normalizeDepartmentCode = (value) => {
    const normalized = String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase();

    if (!normalized) return '';
    if (normalized.includes('FIN') || normalized.includes('TAI CHINH') || normalized.includes('FINANCE')) return 'FIN';
    if (normalized.includes('MOD') || normalized.includes('KIEM DUYET') || normalized.includes('MODERATION')) return 'MOD';
    if (normalized.includes('DIS') || normalized.includes('TRANH CHAP') || normalized.includes('DISPUTE')) return 'DIS';
    if (normalized.includes('CS') || normalized.includes('HO TRO') || normalized.includes('CUSTOMER SUPPORT') || normalized.includes('SUPPORT')) return 'CS';
    if (normalized.includes('IT') || normalized.includes('KY THUAT') || normalized.includes('DEVELOPMENT')) return 'IT';
    return '';
  };

  const staffDepartmentCode =
    normalizeDepartmentCode(myProfile?.departmentCode) ||
    normalizeDepartmentCode(user?.departmentCode) ||
    normalizeDepartmentCode(user?.department) ||
    normalizeDepartmentCode(myProfile?.departmentName) ||
    normalizeDepartmentCode(user?.departmentName) ||
    normalizeDepartmentCode(myProfile?.specialization) ||
    normalizeDepartmentCode(user?.specialization) ||
    'CS';

  const taskBelongsToCurrentStaff = (task) => {
    if (normalizeRole(currentRole) === 'ADMIN' || normalizeRole(currentRole) === 'MANAGER') return true;
    if (task.assignedToEmail && user?.email && task.assignedToEmail === user.email) return true;

    const requiredDepartments = String(task.requiredDepartments || '')
      .split(',')
      .map(dept => normalizeDepartmentCode(dept.trim()))
      .filter(Boolean);

    return requiredDepartments.length === 0 || requiredDepartments.includes(staffDepartmentCode);
  };

  const myTasks = tasks.filter(taskBelongsToCurrentStaff);
  const pendingTasksCount = myTasks.filter(t => t.status === 'Pending').length;
  const pendingModerationCount = moderationItems.filter(i => i.status === 'Pending').length;
  const pendingKycCount = kycRequests.filter(r => r.status === 'Pending').length;
  const unreadSupportCount = supportChats.reduce((sum, c) => sum + (c.unread || 0), 0);
  const pendingWithdrawalCount = withdrawals.filter(w => w.status === 'PENDING' || w.status === 'Pending').length;
  const failedTransactionCount = vnpayTxns.filter(tx => tx.status === 'FAILED' || tx.status === 'Failed' || tx.status === 'ERROR').length;
  const openDisputeCount = escalationCases.filter(item => item.status !== 'Resolved').length;

  const commonSidebarItems = [
    { id: 'Dashboard', label: 'Bảng điều khiển', icon: LayoutDashboard }
  ];

  const departmentSidebarGroups = {
    FIN: {
      key: 'finance',
      title: 'FINANCE',
      icon: BadgeDollarSign,
      items: [
        { id: 'Tasks', label: 'Công việc của tôi', icon: CheckSquare, badge: pendingTasksCount },
        { id: 'Withdrawals', label: 'Rút tiền', icon: BadgeDollarSign, badge: pendingWithdrawalCount },
        { id: 'Refunds', label: 'Hoàn tiền', icon: BadgeDollarSign },
        { id: 'FailedTransactions', label: 'Giao dịch lỗi', icon: AlertTriangle, badge: failedTransactionCount }
      ]
    },
    MOD: {
      key: 'moderation',
      title: 'MODERATION',
      icon: Gavel,
      items: [
        { id: 'Tasks', label: 'Công việc của tôi', icon: CheckSquare, badge: pendingTasksCount },
        { id: 'Moderation', label: 'Kiểm duyệt', icon: Gavel, badge: pendingModerationCount },
        { id: 'KYC', label: 'Xác thực KYC', icon: UserCheck, badge: pendingKycCount },
        { id: 'ModHistory', label: 'Lịch sử hoạt động', icon: FileText }
      ]
    },
    DIS: {
      key: 'disputeResolution',
      title: 'DISPUTE RESOLUTION',
      icon: ShieldAlert,
      items: [
        { id: 'Tasks', label: 'Công việc của tôi', icon: CheckSquare, badge: pendingTasksCount },
        { id: 'Disputes', label: 'Tranh chấp Freelancer - Employer', icon: ShieldAlert, badge: openDisputeCount },
        { id: 'PaymentComplaints', label: 'Khiếu nại thanh toán', icon: BadgeDollarSign },
        { id: 'DisputeHistory', label: 'Lịch sử xử lý tranh chấp', icon: FileText }
      ]
    },
    CS: {
      key: 'customerSupport',
      title: 'CUSTOMER SUPPORT',
      icon: MessageSquare,
      items: [
        { id: 'Tasks', label: 'Công việc của tôi', icon: CheckSquare, badge: pendingTasksCount },
        { id: 'Support', label: 'Ticket hỗ trợ', icon: MessageSquare, badge: unreadSupportCount },
        { id: 'SupportChat', label: 'Chat hỗ trợ', icon: MessageSquare },
        { id: 'CustomerRequests', label: 'Yêu cầu khách hàng', icon: HelpCircle }
      ]
    },
    IT: {
      key: 'itDevelopment',
      title: 'IT & DEVELOPMENT',
      icon: Activity,
      items: [
        { id: 'Tasks', label: 'Công việc của tôi', icon: CheckSquare, badge: pendingTasksCount },
        { id: 'SystemBugs', label: 'Báo cáo lỗi hệ thống', icon: AlertTriangle },
        { id: 'SystemMonitoring', label: 'Giám sát hệ thống', icon: Activity },
        { id: 'Maintenance', label: 'Quản lý bảo trì', icon: Settings },
        { id: 'InternalTechSupport', label: 'Hỗ trợ kỹ thuật nội bộ', icon: HelpCircle }
      ]
    }
  };

  const activeDepartmentSidebarGroup = departmentSidebarGroups[staffDepartmentCode] || departmentSidebarGroups.CS;
  const visibleSidebarTabIds = [
    ...commonSidebarItems.filter(item => item.id).map(item => item.id),
    ...activeDepartmentSidebarGroup.items.map(item => item.id)
  ];
  const visibleSidebarTabKey = visibleSidebarTabIds.join('|');

  useEffect(() => {
    if (!visibleSidebarTabIds.includes(activeTab)) {
      setActiveTab('Dashboard');
    }
  }, [activeTab, staffDepartmentCode, visibleSidebarTabKey]);

  // Filter tasks based on search query and status filter
  const filteredTasks = tasks.filter(t => {
    if (!taskBelongsToCurrentStaff(t)) return false;

    const matchesSearch = t.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.type.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.user.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (taskFilter === 'ALL') return matchesSearch;
    return matchesSearch && t.status.toLowerCase() === taskFilter.toLowerCase();
  });

  // Calculate stats count
  const countAssigned = myTasks.length;
  const countPending = myTasks.filter(t => t.status === 'Pending').length;
  const countCompleted = myTasks.filter(t => t.status === 'Completed').length;
  const countOverdue = myTasks.filter(t => t.status === 'In Progress' && t.deadline.includes('Today')).length;

  // Chart coordinates calculator
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

  // Smooth curve path (using cubic bezier approximation or simple lines)
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

  // Area under curve path
  const areaPath = smoothCurvePath 
    ? `${smoothCurvePath} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`
    : '';

  // Computed chat lists for support sub-tabs
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

  // Active chat
  const activeChat = (supportSubTab === 'deleted' ? deletedChats : supportChats).find(c => c.id === selectedChatId) || null;

  // Doughnut calculations
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
  const displayWaitingUserPercent = supportStats.total > 0 ? supportStats.waitingUserPercent : 18;

  const renderSidebarItem = (item, compact = false) => {
    const IconComp = item.icon;
    const isActive = item.id && activeTab === item.id;
    const handleClick = () => {
      if (item.onClick) {
        item.onClick();
        return;
      }
      if (item.id) {
        setActiveTab(item.id);
      }
    };

    return (
      <button
        key={item.id || item.label}
        onClick={handleClick}
        className={`w-full flex items-center justify-between px-3 ${compact ? 'py-1.5' : 'py-2'} rounded-lg text-body-sm font-semibold transition-all duration-200 group relative ${
          isActive
            ? 'bg-[#f7fff2] text-[#006b2c]'
            : 'text-[#3e4a3d] hover:bg-[#f1f3ff] hover:text-[#141b2b]'
        }`}
      >
        {isActive && (
          <div className="absolute left-0 top-[20%] bottom-[20%] w-[3px] bg-[#006b2c] rounded-r-full" />
        )}
        <div className={`flex items-center ${compact ? 'gap-2.5' : 'gap-3'} min-w-0`}>
          <IconComp className={`${compact ? 'w-[16px] h-[16px]' : 'w-[18px] h-[18px]'} stroke-[2.2] shrink-0 transition-colors ${
            isActive ? 'text-[#006b2c]' : 'text-[#6e7b6c] group-hover:text-[#141b2b]'
          }`} />
          <span className="truncate">{item.label}</span>
        </div>
      </button>
    );
  };

  const renderSidebarGroup = (group) => {
    const GroupIcon = group.icon;
    const isOpen = sectionsOpen[group.key];

    return (
      <div className="space-y-1">
        <button
          onClick={() => toggleSection(group.key)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-body-sm font-semibold text-[#3e4a3d] hover:bg-[#f1f3ff] hover:text-[#141b2b] transition-all duration-200 group relative"
        >
          <div className="flex items-center gap-3 min-w-0">
            <GroupIcon className="w-[18px] h-[18px] stroke-[2.2] text-[#6e7b6c] group-hover:text-[#141b2b] shrink-0 transition-colors" />
            <span className="truncate">{group.title}</span>
          </div>
          <ChevronDown className={`w-3.5 h-3.5 text-[#6e7b6c] group-hover:text-[#141b2b] shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-0' : '-rotate-90'}`} />
        </button>
        {isOpen && (
          <div className="pl-6 space-y-1 animate-in fade-in duration-200">
            {group.items.map(item => renderSidebarItem(item, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#f9f9ff] text-[#141b2b] font-sans antialiased overflow-hidden">
      
      {/* Brand Style Overrides (Scoped CSS Variables) */}
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
      `}</style>

      {/* Global Toast Alert */}
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

      {/* ---------------- SIDEBAR (260px Fixed) ---------------- */}
      <aside className="w-[260px] bg-white border-r border-[#e1e8fd] flex flex-col justify-between shrink-0 h-full">
        <div className="flex flex-col h-full overflow-hidden">
          {/* Logo Section */}
          <div className="p-6 flex items-center gap-3 border-b border-[#e9edff]">
            <div className="w-9 h-9 rounded-lg bg-[#006b2c] flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-[#006b2c]/20">
              F
            </div>
            <div>
              <span className="font-sans text-xl font-extrabold tracking-tight text-[#006b2c]">
                {brandName}
              </span>
              <p className="text-[10px] text-[#3e4a3d] font-bold uppercase tracking-wider mt-0.5">{brandSub}</p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto py-4 px-3 space-y-4 scrollbar-hidden">
            <p className="text-[10px] font-bold text-[#6e7b6c] uppercase tracking-wider px-3 mb-1">Không gian làm việc</p>
            <nav className="space-y-4">
              <div className="space-y-1">
                {commonSidebarItems.map(item => renderSidebarItem(item))}
              </div>

              {renderSidebarGroup(activeDepartmentSidebarGroup)}

            </nav>
          </div>
        </div>


      </aside>

      {/* ---------------- MAIN CONTAINER ---------------- */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* HEADER (64px Height) */}
        <header className="h-[64px] bg-white border-b border-[#e1e8fd] px-6 flex items-center justify-end shrink-0 z-10">
          
          {/* User profile & Actions */}
          <div className="flex items-center gap-5">
            {/* Top Toolbar Icons */}
            <div className="flex items-center gap-3">
              <NotificationDropdown userId={user?.id} role={user?.role} />
            </div>

            {/* Vertical Divider */}
            <div className="h-8 w-[1px] bg-[#e1e8fd]" />

            {/* Profile widget */}
            <div className="flex items-center gap-3">
              <div className="profile-menu-wrapper">
                <div 
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-[#bdcaba]/60 bg-slate-50/40 hover:bg-slate-50 hover:border-emerald-600/40 hover:shadow-sm transition-all duration-300 cursor-pointer group"
                >
                  <div className="flex flex-col text-right sm:block hidden">
                    <span className="text-[13px] font-bold text-[#141b2b] leading-tight truncate max-w-[150px] block" title={user?.displayName || user?.name || user?.email}>
                      {user?.displayName || user?.name || user?.email || "Nhân viên"}
                    </span>
                    <div className="flex justify-end mt-0.5">
                      <span className="inline-flex items-center text-[9px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded bg-emerald-50 text-[#006b2c] border border-emerald-100/60 leading-none">
                        {currentRole === 'MANAGER' ? `Manager / ${myProfile?.departmentName || 'CS'}` : `Staff / ${myProfile?.departmentName || 'CS'}`}
                      </span>
                    </div>
                  </div>
                  
                  <div className="relative">
                    {user?.avatar || user?.avatarUrl ? (
                      <img
                        src={user?.avatar || user?.avatarUrl}
                        alt="Avatar"
                        className="w-9 h-9 rounded-full border-2 border-emerald-500/85 object-cover shadow-sm transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-bold text-white text-sm border-2 border-white shadow-sm transition-transform duration-300 group-hover:scale-105">
                        {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
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
                      {user?.email || user?.name}
                    </p>
                  </div>



                  <div className="profile-menu-item">
                    <button
                      onClick={() => {
                        if (onNavigate) onNavigate("preferences");
                      }}
                      className="profile-menu-btn w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition-all mt-1 text-slate-650 hover:text-blue-600 hover:bg-blue-50"
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

        {/* CONTENT BODY */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#f9f9ff]">
          
          {/* ---------------- TAB: DASHBOARD ---------------- */}
          {activeTab === 'Dashboard' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              
              {/* Sub-header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-headline-lg text-[#141b2b] font-extrabold tracking-tight">Tổng quan hệ thống</h1>
                  <p className="text-body-sm text-[#3e4a3d] mt-1">Chào mừng trở lại. Dưới đây là tình hình công việc của bạn hôm nay.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button className="px-4 py-2 bg-white border border-[#e1e8fd] text-[#141b2b] rounded-lg text-body-sm font-bold shadow-sm hover:bg-[#f1f3ff] transition-all flex items-center gap-2">
                    <ArrowDownRight className="w-4 h-4" />
                    <span>Xuất dữ liệu</span>
                  </button>
                  <button className="px-4 py-2 bg-[#006b2c] text-white rounded-lg text-body-sm font-bold shadow-sm hover:bg-[#00873a] transition-all flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    <span>Lọc công việc</span>
                  </button>
                </div>
              </div>

              {/* 4 Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                
                {/* Card 1: Assigned Tasks */}
                <div className="card-level-1 p-5 relative overflow-hidden flex flex-col justify-between min-h-[140px]">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-lg bg-[#f7fff2] text-[#006b2c] flex items-center justify-center">
                      <CheckSquare className="w-5 h-5" />
                    </div>
                    <span className="flex items-center gap-0.5 text-xs font-bold text-[#006b2c] bg-[#f7fff2] px-2 py-0.5 rounded-full">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>+5%</span>
                    </span>
                  </div>
                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <p className="text-label-md text-[#6e7b6c] uppercase tracking-wider">Công việc được giao</p>
                      <h2 className="text-display-lg text-[#141b2b] mt-1">{countAssigned}</h2>
                    </div>
                    {/* Tiny sparkline */}
                    <div className="w-24 h-10">
                      <svg viewBox="0 0 100 40" className="w-full h-full text-[#006b2c] overflow-visible">
                        <path d="M 0 35 Q 25 15 50 25 T 100 5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                        <path d="M 0 35 Q 25 15 50 25 T 100 5 L 100 40 L 0 40 Z" fill="currentColor" fillOpacity="0.08" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Card 2: Pending Approval */}
                <div className="card-level-1 p-5 relative overflow-hidden flex flex-col justify-between min-h-[140px]">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#0058be] flex items-center justify-center">
                      <Clock className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-[#0058be] bg-blue-50 px-2 py-0.5 rounded-full">
                      <span>Ổn định</span>
                    </span>
                  </div>
                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <p className="text-label-md text-[#6e7b6c] uppercase tracking-wider">Chờ phê duyệt</p>
                      <h2 className="text-display-lg text-[#141b2b] mt-1">{countPending}</h2>
                    </div>
                    {/* Stable sparkline */}
                    <div className="w-24 h-10">
                      <svg viewBox="0 0 100 40" className="w-full h-full text-[#0058be] overflow-visible">
                        <path d="M 0 20 L 20 22 L 40 18 L 60 21 L 80 19 L 100 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                        <path d="M 0 20 L 20 22 L 40 18 L 60 21 L 80 19 L 100 20 L 100 40 L 0 40 Z" fill="currentColor" fillOpacity="0.08" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Card 3: Completed Today */}
                <div className="card-level-1 p-5 relative overflow-hidden flex flex-col justify-between min-h-[140px]">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-lg bg-[#f7fff2] text-[#006b2c] flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <span className="flex items-center gap-0.5 text-xs font-bold text-[#006b2c] bg-[#f7fff2] px-2 py-0.5 rounded-full">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>+12%</span>
                    </span>
                  </div>
                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <p className="text-label-md text-[#6e7b6c] uppercase tracking-wider">Hoàn thành hôm nay</p>
                      <h2 className="text-display-lg text-[#141b2b] mt-1">{countCompleted}</h2>
                    </div>
                    {/* Up sparkline */}
                    <div className="w-24 h-10">
                      <svg viewBox="0 0 100 40" className="w-full h-full text-[#006b2c] overflow-visible">
                        <path d="M 0 35 L 25 30 L 50 15 L 75 18 L 100 5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                        <path d="M 0 35 L 25 30 L 50 15 L 75 18 L 100 5 L 100 40 L 0 40 Z" fill="currentColor" fillOpacity="0.08" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Card 4: Overdue Tasks */}
                <div className="card-level-1 p-5 relative overflow-hidden flex flex-col justify-between min-h-[140px]">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-lg bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-[#ba1a1a] bg-[#ffdad6] px-2 py-0.5 rounded-full">
                      <span>Khẩn cấp</span>
                    </span>
                  </div>
                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <p className="text-label-md text-[#6e7b6c] uppercase tracking-wider">Quá hạn</p>
                      <h2 className="text-display-lg text-[#ba1a1a] mt-1">{countOverdue}</h2>
                    </div>
                    {/* Alert sparkline */}
                    <div className="w-24 h-10">
                      <svg viewBox="0 0 100 40" className="w-full h-full text-[#ba1a1a] overflow-visible">
                        <path d="M 0 10 L 25 18 L 50 8 L 75 32 L 100 35" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                        <path d="M 0 10 L 25 18 L 50 8 L 75 32 L 100 35 L 100 40 L 0 40 Z" fill="currentColor" fillOpacity="0.08" />
                      </svg>
                    </div>
                  </div>
                </div>

              </div>

              {/* 2 Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Column 1 & 2: Task Completion Area Chart */}
                <div className="lg:col-span-2 card-level-1 p-6 bg-white flex flex-col justify-between min-h-[320px]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-body-lg font-bold text-[#141b2b]">Công việc hoàn thành theo ngày</h3>
                      <p className="text-xs text-[#3e4a3d]">Đánh giá hiệu suất dựa trên các yêu cầu đã xử lý.</p>
                    </div>
                    <select
                      value={chartPeriod}
                      onChange={(e) => {
                        setChartPeriod(e.target.value);
                        setHoveredPoint(null);
                      }}
                      className="bg-[#f1f3ff] border-none text-[#141b2b] text-xs font-bold px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006b2c]/30"
                    >
                      <option value="7days">7 ngày qua</option>
                      <option value="30days">30 ngày qua</option>
                    </select>
                  </div>

                  {/* SVG Chart Area */}
                  <div className="relative mt-6 flex-1 flex items-center justify-center">
                    <svg 
                      width="100%" 
                      height={chartHeight} 
                      viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
                      className="overflow-visible select-none"
                    >
                      {/* Grid Lines */}
                      {[0, 10, 20, 30].map((val) => {
                        const y = chartHeight - paddingY - (val * (chartHeight - paddingY * 2)) / 30;
                        return (
                          <g key={val}>
                            <line x1={paddingX} y1={y} x2={chartWidth - paddingX} y2={y} stroke="#f1f3ff" strokeWidth="1.5" />
                            <text x={paddingX - 10} y={y + 4} textAnchor="end" className="text-[10px] font-bold text-[#6e7b6c] fill-current">
                              {val}
                            </text>
                          </g>
                        );
                      })}

                      {/* Area Under Smooth Curve */}
                      <path d={areaPath} fill="url(#chart-gradient)" />

                      {/* Smooth Curved Line */}
                      <path d={smoothCurvePath} fill="none" stroke="#006b2c" strokeWidth="3" strokeLinecap="round" />

                      {/* Interactive hover points & markers */}
                      {points.map((p, i) => (
                        <g 
                          key={i} 
                          onMouseEnter={() => setHoveredPoint(p)}
                          onMouseLeave={() => setHoveredPoint(null)}
                          className="cursor-pointer"
                        >
                          <circle 
                            cx={p.x} 
                            cy={p.y} 
                            r={hoveredPoint && hoveredPoint.day === p.day ? 6 : 4} 
                            fill={hoveredPoint && hoveredPoint.day === p.day ? '#006b2c' : '#ffffff'} 
                            stroke="#006b2c" 
                            strokeWidth="2.5" 
                            className="transition-all duration-150"
                          />
                        </g>
                      ))}

                      {/* X Axis Labels */}
                      {points.map((p, i) => (
                        <text 
                          key={i} 
                          x={p.x} 
                          y={chartHeight - 10} 
                          textAnchor="middle" 
                          className="text-[11px] font-bold text-[#6e7b6c] fill-current"
                        >
                          {p.day}
                        </text>
                      ))}

                      {/* SVG Gradient definitions */}
                      <defs>
                        <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#006b2c" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#006b2c" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                    </svg>

                    {/* Tooltip Overlay */}
                    {hoveredPoint && (
                      <div 
                        className="absolute bg-white border border-[#bdcaba] rounded-lg p-2.5 shadow-lg pointer-events-none z-10"
                        style={{
                          left: `${(hoveredPoint.x / chartWidth) * 90}%`,
                          top: `${(hoveredPoint.y / chartHeight) * 70}%`,
                        }}
                      >
                        <p className="text-[10px] uppercase font-bold text-[#6e7b6c]">{hoveredPoint.day}</p>
                        <p className="text-body-sm font-extrabold text-[#006b2c] mt-0.5">{hoveredPoint.completion} Tasks Done</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Column 3: Doughnut Support Status Overview */}
                <div className="card-level-1 p-6 bg-white flex flex-col justify-between min-h-[320px]">
                  <div>
                    <h3 className="text-body-lg font-bold text-[#141b2b]">Tổng quan Ticket Hỗ trợ</h3>
                    <p className="text-xs text-[#3e4a3d]">Phân bổ trạng thái các yêu cầu hỗ trợ hiện tại.</p>
                  </div>

                  {/* Doughnut SVG */}
                  <div className="flex-1 flex items-center justify-center my-4 relative">
                    <svg width="150" height="150" viewBox="0 0 150 150">
                      {/* Circumference = 2 * pi * r = 314.16 */}
                      <circle
                        cx="75"
                        cy="75"
                        r="50"
                        fill="transparent"
                        stroke="#006b2c"
                        strokeWidth="16"
                        strokeDasharray={`${lenInProgress} 314`}
                        strokeDashoffset={offsetInProgress}
                        transform="rotate(-90 75 75)"
                        className="hover:stroke-[#00873a] transition-all duration-200 cursor-pointer"
                      />
                      <circle
                        cx="75"
                        cy="75"
                        r="50"
                        fill="transparent"
                        stroke="#0058be"
                        strokeWidth="16"
                        strokeDasharray={`${lenPending} 314`}
                        strokeDashoffset={offsetPending}
                        transform="rotate(-90 75 75)"
                        className="hover:stroke-blue-600 transition-all duration-200 cursor-pointer"
                      />
                      <circle
                        cx="75"
                        cy="75"
                        r="50"
                        fill="transparent"
                        stroke="#6bff8f"
                        strokeWidth="16"
                        strokeDasharray={`${lenWaitingUser} 314`}
                        strokeDashoffset={offsetWaitingUser}
                        transform="rotate(-90 75 75)"
                        className="hover:stroke-[#4ae176] transition-all duration-200 cursor-pointer"
                      />
                      <g className="text-center">
                        <text x="75" y="70" textAnchor="middle" className="text-[10px] font-bold text-[#6e7b6c] fill-current">TỔNG</text>
                        <text x="75" y="90" textAnchor="middle" className="text-title-md font-extrabold text-[#141b2b] fill-current">{displayTotal}</text>
                      </g>
                    </svg>
                  </div>

                  {/* Legends */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-body-sm">
                      <div className="flex items-center gap-2 font-semibold text-[#141b2b]">
                        <span className="w-3 h-3 bg-[#006b2c] rounded-full" />
                        <span>Đang xử lý</span>
                      </div>
                      <span className="font-bold text-[#3e4a3d]">{displayInProgressPercent}%</span>
                    </div>
                    <div className="flex items-center justify-between text-body-sm">
                      <div className="flex items-center gap-2 font-semibold text-[#141b2b]">
                        <span className="w-3 h-3 bg-[#0058be] rounded-full" />
                        <span>Chờ xử lý</span>
                      </div>
                      <span className="font-bold text-[#3e4a3d]">{displayPendingPercent}%</span>
                    </div>
                    <div className="flex items-center justify-between text-body-sm">
                      <div className="flex items-center gap-2 font-semibold text-[#141b2b]">
                        <span className="w-3 h-3 bg-[#6bff8f] rounded-full" />
                        <span>Chờ phản hồi</span>
                      </div>
                      <span className="font-bold text-[#3e4a3d]">{displayWaitingUserPercent}%</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ---------------- TAB: TASKS (Công việc của tôi) ---------------- */}
          {activeTab === 'Tasks' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div>
                <h1 className="text-headline-lg font-extrabold text-[#141b2b]">Công việc của tôi</h1>
                <p className="text-body-sm text-[#3e4a3d] mt-1">Danh sách các nhiệm vụ được Manager phân công cho bạn xử lý.</p>
              </div>

              {/* Data Table: My Assigned Work */}
              <div className="card-level-1 p-6 bg-white">
                <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-[#e1e8fd] gap-4">
                  <h3 className="text-title-md font-extrabold text-[#141b2b]">Nhiệm vụ được giao</h3>
                  
                  {/* Filters & Actions */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Status Tabs */}
                    <div className="flex bg-[#f1f3ff] p-1 rounded-lg">
                      {['ALL', 'Pending', 'In Progress', 'Completed'].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setTaskFilter(tab)}
                          className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                            taskFilter === tab 
                              ? 'bg-white text-[#006b2c] shadow-sm' 
                              : 'text-[#6e7b6c] hover:text-[#141b2b]'
                          }`}
                        >
                          {tab === 'ALL' ? 'Tất cả' : tab === 'Pending' ? 'Chờ xử lý' : tab === 'In Progress' ? 'Đang xử lý' : 'Hoàn thành'}
                        </button>
                      ))}
                    </div>
                    
                    <button className="p-2 text-[#6e7b6c] hover:text-[#141b2b] hover:bg-[#f1f3ff] rounded-lg transition-colors border border-[#e1e8fd]">
                      <Filter className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-[#6e7b6c] hover:text-[#141b2b] hover:bg-[#f1f3ff] rounded-lg transition-colors border border-[#e1e8fd]">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Table container */}
                <div className="overflow-x-auto mt-4 -mx-6">
                  <div className="inline-block min-w-full align-middle px-6">
                    <table className="min-w-full divide-y divide-[#e9edff] text-left">
                      <thead>
                        <tr className="bg-[#f9f9ff]">
                          <th className="px-4 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">Mã CV</th>
                          <th className="px-4 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">Loại</th>
                          <th className="px-4 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">Người dùng</th>
                          <th className="px-4 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">Mức độ</th>
                          <th className="px-4 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">Trạng thái</th>
                          <th className="px-4 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">Hạn chót</th>
                          <th className="px-4 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider text-right sticky right-0 bg-[#f9f9ff]">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e9edff] bg-white">
                        {filteredTasks.length > 0 ? (
                          filteredTasks.map((t) => (
                            <tr key={t.id} className="hover:bg-[#f7fff2]/30 transition-colors group">
                              <td className="px-4 py-4 whitespace-nowrap text-body-sm font-bold text-[#006b2c]">{t.id}</td>
                              <td className="px-4 py-4 whitespace-nowrap text-body-sm font-bold text-[#141b2b]">
                                <div>{t.type}</div>
                                <div className="text-[11px] text-slate-400 font-normal mt-0.5">{t.title}</div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2.5">
                                  <img src={t.avatar} alt={t.user} className="w-6 h-6 rounded-full object-cover border border-[#bdcaba]" />
                                  <span className="text-body-sm font-semibold text-[#141b2b]">{t.user}</span>
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  t.priority === 'High' 
                                    ? 'bg-[#ffdad6] text-[#ba1a1a]' 
                                    : t.priority === 'Medium' 
                                      ? 'bg-amber-100 text-amber-800' 
                                      : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {t.priority}
                                </span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span className="flex items-center gap-1.5 text-body-sm font-semibold">
                                  <span className={`w-2 h-2 rounded-full ${
                                    t.status === 'Completed' 
                                      ? 'bg-emerald-500' 
                                      : t.status === 'In Progress' 
                                        ? 'bg-[#006b2c]' 
                                        : 'bg-blue-500'
                                  }`} />
                                  <span>{t.status}</span>
                                </span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-body-sm font-bold text-[#3e4a3d]">{t.deadline}</td>
                              <td className="px-4 py-4 whitespace-nowrap text-right sticky right-0 bg-white group-hover:bg-[#f7fff2]/30 transition-colors">
                                <button
                                  onClick={() => {
                                    if (t.assignedToEmail && t.assignedToEmail !== (user?.email || 'staff@gmail.com')) {
                                      showToast(`Tác vụ này đang được xử lý bởi nhân viên ${t.assignedToEmail}. Bạn không thể can thiệp!`, 'error');
                                      return;
                                    }
                                    setSelectedTask(t);
                                    setShowManageModal(true);
                                  }}
                                  className="px-3 py-1 bg-white hover:bg-[#006b2c] hover:text-white text-[#006b2c] border border-[#bdcaba] rounded-lg text-xs font-bold transition-all"
                                >
                                  Quản lý
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="7" className="text-center py-8 text-body-sm text-[#6e7b6c] font-semibold">
                              Không tìm thấy công việc nào phù hợp.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}



          {/* ---------------- TAB: SUPPORT (Messenger Chat) ---------------- */}
          {/* ---------------- TAB: SUPPORT (Messenger Chat) ---------------- */}
          {activeTab === 'Support' && (() => {
            const matchesChatSearch = (c) => c.name.toLowerCase().includes(chatSearch.toLowerCase());
            const openChats = supportChats.filter(c => !(c.blocked_until && new Date(c.blocked_until) > new Date()));
            const claimedChats = openChats.filter(c => normalizeId(c.assigned_staff_id || c.assignedStaffId) === normalizeId(user?.id));
            const unclaimedChats = openChats.filter(c => !(c.assigned_staff_id || c.assignedStaffId));
            const blockedChats = supportChats.filter(c => c.blocked_until && new Date(c.blocked_until) > new Date() && normalizeId(c.assigned_staff_id || c.assignedStaffId) === normalizeId(user?.id));
            const myDeletedChats = deletedChats.filter(c => normalizeId(c.assigned_staff_id || c.assignedStaffId) === normalizeId(user?.id));
            const displayedChats = supportSubTab === 'claimed'
              ? claimedChats.filter(matchesChatSearch)
              : supportSubTab === 'unclaimed'
                ? unclaimedChats.filter(matchesChatSearch)
                : supportSubTab === 'blocked'
                  ? blockedChats.filter(matchesChatSearch)
                  : myDeletedChats.filter(matchesChatSearch);

            const activeChat = (supportSubTab === 'deleted' ? deletedChats : supportChats).find(c => c.id === selectedChatId);

            return (
              <div className="max-w-6xl mx-auto h-[calc(100vh-140px)] flex flex-col">
                <div className="mb-4">
                  <h1 className="text-headline-lg font-extrabold text-[#141b2b]">Trung tâm hỗ trợ</h1>
                  <p className="text-body-sm text-[#3e4a3d] mt-1">Hỗ trợ khách hàng và tư vấn tranh chấp trực tiếp.</p>
                </div>

                {/* Chat Split-pane Container */}
                <div className="flex-1 bg-white border border-[#e1e8fd] rounded-xl flex overflow-hidden shadow-sm">
                  
                  {/* Left sidebar: Contact list */}
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

                      {/* Support Sub-tabs */}
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
                          Đã xóa ({myDeletedChats.length})
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

                  {/* Right side: Message thread or placeholder */}
                  {!activeChat ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#f9f9ff]">
                      <div className="w-16 h-16 bg-emerald-50 text-[#006b2c] rounded-2xl flex items-center justify-center mb-4 border border-[#bdcaba]">
                        <MessageSquare className="w-7 h-7" />
                      </div>
                      <h4 className="text-body-lg font-bold text-[#141b2b] mb-1">Chọn một hội thoại</h4>
                      <p className="text-body-sm text-[#6e7b6c] max-w-xs leading-relaxed">
                        Chọn một hội thoại từ danh sách bên trái để bắt đầu nhắn tin hỗ trợ và kiểm duyệt người dùng.
                      </p>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col bg-[#f9f9ff] min-w-0">
                      
                      {/* Thread Header */}
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

                      {/* Messages Bubble Container */}
                      <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {supportSubTab === 'deleted' ? (
                          <div className="flex flex-col items-center justify-center h-full text-slate-400 mt-10">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-50"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                            <p className="text-sm font-medium">Nội dung hội thoại đã bị ẩn vì đã bị xóa.</p>
                          </div>
                        ) : (
                          <>
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
                          </>
                        )}
                      </div>

                      {/* Input panel / block banner */}
                      {supportSubTab === 'deleted' ? (
                        <div className="flex items-center justify-between p-4 bg-slate-100 border-t border-[#e1e8fd] shrink-0">
                          <div className="flex items-center">
                            <AlertCircle className="w-5 h-5 text-slate-500 mr-2 shrink-0" />
                            <span className="text-xs font-bold text-slate-600">
                              Hội thoại này đã bị xóa. Bạn không thể nhắn tin thêm.
                            </span>
                          </div>
                          <button
                            onClick={handleRestoreTicket}
                            className="px-4 py-2 bg-emerald-50 hover:bg-[#f7fff2] text-[#006b2c] border border-[#bdcaba] rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
                          >
                            Khôi phục hội thoại
                          </button>
                        </div>
                      ) : activeChat.blocked_until && new Date(activeChat.blocked_until) > new Date() ? (
                        <div className="flex items-center justify-center p-4 bg-slate-100 border-t border-[#e1e8fd] h-[76px] shrink-0">
                          <AlertCircle className="w-5 h-5 text-rose-500 mr-2 shrink-0" />
                          <span className="text-xs font-bold text-slate-600">
                            Người dùng này hiện đang bị đình chỉ chat.
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

                  {/* User Info / Moderation Sidebar */}
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
                        <p className="text-xs text-[#6e7b6c] font-semibold mb-3">{activeChat.sender_email || activeChat.senderEmail || 'Không có email'}</p>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider ${
                          activeChat.sender_role === 'EMPLOYER' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                        }`}>
                          {activeChat.sender_role || 'CLIENT'}
                        </span>
                      </div>

                      <div className="p-6 flex flex-col gap-6">
                        {/* Account Details */}
                        <div>
                          <h4 className="text-[10px] font-bold text-[#6e7b6c] uppercase tracking-wider mb-3">Thông tin tài khoản</h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center bg-[#f9f9ff] p-3 rounded-xl border border-[#e1e8fd]">
                              <span className="text-xs font-semibold text-[#3e4a3d]">Trạng thái</span>
                              {(() => {
                                const status = activeChat.sender_status;
                                if (status === 'LOCKED' || status === 'locked') return <span className="text-xs font-bold text-amber-600">Bị khóa</span>;
                                if (status === 'BANNED' || status === 'banned') return <span className="text-xs font-bold text-rose-600">Bị cấm</span>;
                                return <span className="text-xs font-bold text-emerald-600">Hoạt động</span>;
                              })()}
                            </div>
                            <div className="flex justify-between items-center bg-[#f9f9ff] p-3 rounded-xl border border-[#e1e8fd]">
                              <span className="text-xs font-semibold text-[#3e4a3d]">Thành viên từ</span>
                              <span className="text-xs font-bold text-[#141b2b]">
                                {activeChat.sender_created_at ? new Date(activeChat.sender_created_at).toLocaleDateString('vi-VN') : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Moderation Actions */}
                        <div>
                          <h4 className="text-[10px] font-bold text-[#6e7b6c] uppercase tracking-wider mb-3">Thao tác kiểm duyệt</h4>
                          
                          {/* Block Status / Options */}
                          <div className="flex flex-col gap-2 mb-4">
                            {activeChat.blocked_until && new Date(activeChat.blocked_until) > new Date() ? (
                              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                <p className="text-xs font-semibold text-amber-800 mb-2">
                                  Bị đình chỉ đến: <br />
                                  {new Date(activeChat.blocked_until).toLocaleString('vi-VN')}
                                </p>
                                <button
                                  onClick={() => handleBlockUser(0)}
                                  className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all"
                                >
                                  Mở khóa ngay
                                </button>
                              </div>
                            ) : (
                              <div className="bg-[#f9f9ff] border border-[#e1e8fd] rounded-xl p-3">
                                <p className="text-xs font-semibold text-[#3e4a3d] mb-2">Đình chỉ chat người dùng</p>
                                <div className="grid grid-cols-2 gap-2">
                                  <button onClick={() => handleBlockUser(1)} className="py-1.5 bg-white border border-[#e1e8fd] hover:border-amber-400 hover:bg-amber-50 text-slate-700 rounded-lg text-xs font-bold transition-all">1 Ngày</button>
                                  <button onClick={() => handleBlockUser(3)} className="py-1.5 bg-white border border-[#e1e8fd] hover:border-amber-400 hover:bg-[#bdcaba] text-slate-700 rounded-lg text-xs font-bold transition-all">3 Ngày</button>
                                  <button onClick={() => handleBlockUser(7)} className="py-1.5 bg-white border border-[#e1e8fd] hover:border-amber-400 hover:bg-amber-50 text-slate-700 rounded-lg text-xs font-bold transition-all">7 Ngày</button>
                                  <button onClick={() => handleBlockUser(-1)} className="py-1.5 bg-white border border-[#e1e8fd] hover:border-rose-400 hover:bg-rose-50 text-rose-600 rounded-lg text-xs font-bold transition-all">Vĩnh viễn</button>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Delete / Restore support ticket */}
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

          {/* ---------------- TAB: MODERATION ---------------- */}
          {activeTab === 'Moderation' && (() => {
            const pendingItems = moderationItems.filter(item => item.status === 'Pending');
            const processedItems = moderationItems.filter(item => item.status !== 'Pending');

            const moderationTabs = [
              { id: 'queue', label: 'Hàng đợi', count: pendingItems.length },
              { id: 'reports', label: 'Báo cáo vi phạm', count: violationReports.length },
              { id: 'actions', label: 'Cảnh báo / Chặn', count: warningTemplates.length },
              { id: 'escalation', label: 'Chuyển cấp', count: escalationCases.length }
            ];
            const statusLabel = (status) => status === 'Approved' ? 'Đã duyệt' : status === 'Rejected' ? 'Đã từ chối' : 'Chờ xử lý';
            const severityClass = (severity) => severity === 'Cao' || severity === 'Khẩn cấp'
              ? 'bg-[#ffdad6] text-[#ba1a1a] border-[#ffdad6]'
              : 'bg-amber-50 text-amber-700 border-amber-200';

            return (
              <div className="space-y-6 max-w-7xl mx-auto">
                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                  <div>
                    <h1 className="text-headline-lg font-extrabold text-[#141b2b]">Kiểm duyệt</h1>
                    <p className="text-body-sm text-[#3e4a3d] mt-1">
                      Xử lý bài đăng, hồ sơ, báo cáo vi phạm và các trường hợp cần chuyển cấp.
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 min-w-[360px]">
                    <div className="bg-white border border-[#e1e8fd] rounded-lg px-3 py-2">
                      <p className="text-[10px] font-bold text-[#6e7b6c] uppercase">Chờ xử lý</p>
                      <p className="text-title-md font-extrabold text-[#141b2b]">{pendingItems.length}</p>
                    </div>
                    <div className="bg-white border border-[#e1e8fd] rounded-lg px-3 py-2">
                      <p className="text-[10px] font-bold text-[#6e7b6c] uppercase">Báo cáo</p>
                      <p className="text-title-md font-extrabold text-[#ba1a1a]">{violationReports.length}</p>
                    </div>
                    <div className="bg-white border border-[#e1e8fd] rounded-lg px-3 py-2">
                      <p className="text-[10px] font-bold text-[#6e7b6c] uppercase">Đã xử lý</p>
                      <p className="text-title-md font-extrabold text-[#006b2c]">{processedItems.length}</p>
                    </div>
                  </div>
                </div>

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

                {moderationView === 'queue' && (() => {
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

                  const formatTimeRelative = (dateString) => {
                    if (!dateString) return 'Vừa xong';
                    const diff = new Date() - new Date(dateString);
                    if (isNaN(diff)) return dateString;
                    const minutes = Math.floor(diff / 60000);
                    if (minutes < 60) return `${minutes} phút trước`;
                    const hours = Math.floor(minutes / 60);
                    if (hours < 24) return `${hours} giờ trước`;
                    return new Date(dateString).toLocaleString('vi-VN');
                  };

                  const handleSelectAll = (e) => {
                    if (e.target.checked) {
                      setSelectedQueueItems(filteredPendingItems.map(i => i.id));
                    } else {
                      setSelectedQueueItems([]);
                    }
                  };

                  const handleSelectItem = (id) => {
                    setSelectedQueueItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
                  };

                  return (
                  <div className="bg-white border border-[#e1e8fd] rounded-xl overflow-hidden shadow-sm">
                    <div className="px-5 py-4 flex flex-col gap-4 border-b border-[#e9edff]">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-title-md font-extrabold text-[#141b2b]">Hàng đợi kiểm duyệt</h2>
                          <p className="text-xs text-[#6e7b6c] mt-0.5">Duyệt, từ chối hoặc yêu cầu chỉnh sửa các nội dung đang chờ.</p>
                        </div>
                        {selectedQueueItems.length > 0 && (
                          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                            <span className="text-xs font-bold text-[#006b2c] mr-2">Đã chọn {selectedQueueItems.length} mục</span>
                            <button onClick={() => { setSelectedQueueItems([]); /* execute action */ }} className="px-3 py-1.5 bg-[#ba1a1a] text-white hover:bg-[#93000a] text-xs font-bold rounded shadow-sm flex items-center gap-1 transition-colors"><X className="w-3.5 h-3.5" /> Từ chối</button>
                            <button onClick={() => { setSelectedQueueItems([]); /* execute action */ }} className="px-3 py-1.5 bg-[#006b2c] text-white hover:bg-[#00873a] text-xs font-bold rounded shadow-sm flex items-center gap-1 transition-colors"><Check className="w-3.5 h-3.5" /> Duyệt hàng loạt</button>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#e9edff] pb-2">
                        <div className="flex gap-2 overflow-x-auto">
                          {[
                            { id: 'ALL', label: 'Tất cả' },
                            { id: 'PROJECT', label: 'Dự án' },
                            { id: 'PROFILE', label: 'Hồ sơ' },
                            { id: 'GIG', label: 'Gói dịch vụ' },
                            { id: 'REVIEW', label: 'Đánh giá' }
                          ].map(qTab => (
                            <button
                              key={qTab.id}
                              onClick={() => setQueueTab(qTab.id)}
                              className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all whitespace-nowrap border ${
                                queueTab === qTab.id
                                  ? 'bg-[#141b2b] text-white border-[#141b2b] shadow-sm'
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
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left">
                        <thead>
                          <tr className="bg-[#f9f9ff] border-b border-[#e9edff]">
                            <th className="px-4 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider w-10">
                              <input type="checkbox" className="w-4 h-4 text-[#006b2c] border-[#bdcaba] rounded focus:ring-[#006b2c]" checked={selectedQueueItems.length > 0 && selectedQueueItems.length === filteredPendingItems.length} onChange={handleSelectAll} />
                            </th>
                            <th className="px-4 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">Nội dung</th>
                            <th className="px-4 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">Người đăng</th>
                            <th className="px-4 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">Lý do</th>
                            <th className="px-4 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">Ngày gửi</th>
                            <th className="px-4 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">Trạng thái</th>
                            <th className="px-4 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider text-right">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e1e8fd] bg-white">
                          {filteredPendingItems.map((item) => (
                            <tr key={item.id} className={`hover:bg-[#f7fff2]/30 transition-colors ${selectedQueueItems.includes(item.id) ? 'bg-[#f7fff2]' : ''}`}>
                              <td className="px-4 py-4">
                                <input type="checkbox" className="w-4 h-4 text-[#006b2c] border-[#bdcaba] rounded focus:ring-[#006b2c]" checked={selectedQueueItems.includes(item.id)} onChange={() => handleSelectItem(item.id)} />
                              </td>
                              <td className="px-4 py-4">
                                <div className="min-w-[240px]">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${item.type === 'PROJECT' ? 'bg-[#e9edff] text-[#141b2b] border-[#bdcaba]' : item.type === 'PROFILE' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-purple-50 text-purple-800 border-purple-200'}`}>
                                    {item.type === 'PROJECT' && <FileText className="w-3 h-3" />}
                                    {item.type === 'PROFILE' && <User className="w-3 h-3" />}
                                    {item.type}
                                  </span>
                                  <h4 className="text-body-sm font-bold text-[#141b2b] mt-2 group cursor-pointer hover:text-[#006b2c] transition-colors" onClick={() => { setSelectedModerationItem(item); setShowModerationModal(true); }}>{item.title}</h4>
                                  <p className="text-xs text-[#6e7b6c] mt-0.5 line-clamp-1" title={item.detail}>{item.detail}</p>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-body-sm font-semibold text-[#141b2b]">{item.author}</td>
                              <td className="px-4 py-4 text-body-sm font-bold text-amber-700">
                                <span className="bg-amber-50 px-2 py-1 rounded text-xs border border-amber-100">{item.reason}</span>
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-[#3e4a3d]">{formatTimeRelative(item.subDate)}</span>
                                  <span className="text-[10px] text-[#6e7b6c] mt-0.5">{item.subDate}</span>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                                  item.status === 'Approved' 
                                    ? 'bg-[#f7fff2] text-[#006b2c]' 
                                    : item.status === 'Rejected' 
                                      ? 'bg-[#ffdad6] text-[#ba1a1a]' 
                                      : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {statusLabel(item.status)}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-right">
                                {item.status === 'Pending' ? (
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button 
                                      onClick={() => handleModAction(item, true)}
                                      className="p-1.5 bg-[#eaf6eb] text-[#006b2c] hover:bg-[#006b2c] hover:text-white rounded shadow-sm transition-all group relative"
                                      title="Duyệt"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <button 
                                      onClick={() => handleModAction(item, false)}
                                      className="p-1.5 border border-[#ffdad6] hover:bg-[#ffdad6] text-[#ba1a1a] rounded transition-all"
                                      title="Từ chối / Chặn"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-xs font-bold text-[#6e7b6c]">Đã xử lý</span>
                                )}
                              </td>
                            </tr>
                          ))}
                          {moderationItems.length === 0 && (
                            <tr>
                              <td colSpan="6" className="px-4 py-8 text-center text-[#6e7b6c] text-sm">
                                Không có nội dung nào đang chờ kiểm duyệt.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );})()}

                {moderationView === 'reports' && (
                  <div className="bg-white border border-[#e1e8fd] rounded-xl p-5">
                    <h2 className="text-title-md font-extrabold text-[#141b2b] mb-4">Báo cáo vi phạm ({violationReports.length})</h2>
                    <div className="space-y-4">
                      {violationReports.map(report => (
                        <div 
                          key={report.id} 
                          className="border border-[#e9edff] rounded-xl p-4 hover:shadow-md transition-all cursor-pointer hover:border-[#bdcaba] bg-white relative"
                          onClick={() => setSelectedReport(report)}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${severityClass(report.severity)}`}>
                                  Mức độ: {report.severity}
                                </span>
                                <span className="px-2 py-0.5 bg-[#f1f3ff] text-[#141b2b] rounded text-[10px] font-bold">
                                  {report.type}
                                </span>
                              </div>
                              <h3 className="text-body-lg font-bold text-[#141b2b]">{report.target}</h3>
                            </div>
                            <span className="text-xs font-bold px-2 py-1 bg-amber-100 text-amber-800 rounded">{report.status}</span>
                          </div>
                          <p className="text-sm text-[#3e4a3d] bg-[#f9f9ff] p-3 rounded-lg mb-3">
                            <span className="font-semibold">Bằng chứng / Nội dung:</span> {report.evidence}
                          </p>
                          <div className="flex items-center justify-between text-xs text-[#6e7b6c]">
                            <div className="flex gap-4">
                              <span><strong className="text-[#141b2b]">Người báo cáo:</strong> {report.reporter}</span>
                              <span><strong className="text-[#141b2b]">Bị báo cáo:</strong> {report.accused}</span>
                            </div>
                            <button 
                              className="text-[#006b2c] font-bold hover:underline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedReport(report);
                              }}
                            >
                              Xử lý báo cáo →
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {moderationView === 'actions' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-[#e1e8fd] rounded-xl p-5">
                      <h2 className="text-title-md font-extrabold text-[#141b2b] mb-4">Mẫu Cảnh Báo</h2>
                      <ul className="space-y-3">
                        {warningTemplates.map((template, idx) => (
                          <li key={idx} className="flex items-start gap-3 p-3 bg-[#f9f9ff] rounded-lg border border-[#e9edff]">
                            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <span className="text-sm text-[#3e4a3d]">{template}</span>
                          </li>
                        ))}
                      </ul>
                      <button className="mt-4 w-full py-2 border-2 border-dashed border-[#bdcaba] text-[#3e4a3d] rounded-xl font-bold hover:bg-[#f9f9ff]">
                        + Thêm mẫu cảnh báo mới
                      </button>
                    </div>
                    <div className="bg-white border border-[#e1e8fd] rounded-xl p-5">
                      <h2 className="text-title-md font-extrabold text-[#ba1a1a] mb-4">Tài Khoản Bị Chặn Gần Đây</h2>
                      <div className="text-center py-10 bg-[#f9f9ff] rounded-lg border border-[#e9edff]">
                        <ShieldBan className="w-10 h-10 text-[#bdcaba] mx-auto mb-2" />
                        <p className="text-sm text-[#6e7b6c]">Không có tài khoản nào bị chặn trong 7 ngày qua.</p>
                      </div>
                    </div>
                  </div>
                )}



                {moderationView === 'escalation' && (
                  <div className="bg-white border border-[#e1e8fd] rounded-xl p-5">
                    <h2 className="text-title-md font-extrabold text-[#141b2b] mb-4">Trường hợp chờ cấp trên quyết định</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {escalationCases.map(esc => (
                        <div key={esc.id} className="border border-rose-200 bg-rose-50 rounded-xl p-4">
                          <div className="flex justify-between items-start mb-2">
                            <span className="px-2 py-0.5 bg-rose-200 text-rose-800 rounded text-[10px] font-bold uppercase">{esc.priority}</span>
                            <span className="text-xs text-rose-600 font-semibold">{esc.id}</span>
                          </div>
                          <h3 className="text-body-md font-bold text-[#141b2b] mb-2">{esc.title}</h3>
                          <p className="text-sm text-[#3e4a3d] mb-4">Người yêu cầu chuyển: <strong>{esc.owner}</strong></p>
                          <button 
                            className="w-full py-2 bg-white border border-rose-200 text-rose-700 font-bold text-sm rounded-lg hover:bg-rose-100 transition-colors"
                            onClick={() => {
                              setSelectedDispute(esc);
                              setShowDisputeModal(true);
                            }}
                          >
                            Xem chi tiết & Xử lý
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            );
          })()}

          {/* ---------------- TAB: KYC ---------------- */}
          {activeTab === 'KYC' && (() => {
            const filteredKyc = kycRequests.filter(req => {
              if (!kycSearch) return true;
              const searchLower = kycSearch.toLowerCase();
              return (
                (req.name && req.name.toLowerCase().includes(searchLower)) ||
                (req.email && req.email.toLowerCase().includes(searchLower)) ||
                (req.id && req.id.toLowerCase().includes(searchLower))
              );
            });

            return (
              <div className="space-y-6 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h1 className="text-headline-lg font-extrabold text-[#141b2b]">Xét duyệt danh tính KYC</h1>
                    <p className="text-body-sm text-[#3e4a3d] mt-1">Kiểm tra thông tin định danh hợp pháp của freelancer và nhà tuyển dụng để duy trì hệ sinh thái an toàn.</p>
                  </div>
                  {/* Search bar */}
                  <div className="w-full md:w-72 relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-[#6e7b6c]">
                      <Search className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="Tìm kiếm theo Tên, Email, Mã..."
                      value={kycSearch}
                      onChange={(e) => setKycSearch(e.target.value)}
                      className="w-full bg-[#f1f3ff] border-none placeholder-[#6e7b6c] pl-10 pr-4 py-2 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-[#006b2c]/30 focus:bg-white border transition-all"
                    />
                  </div>
                </div>

                {/* KYC Request List Grid */}
                {filteredKyc.length === 0 ? (
                  <div className="text-center py-12 bg-white border border-[#e1e8fd] rounded-xl shadow-sm">
                    <AlertCircle className="w-10 h-10 text-[#bdcaba] mx-auto mb-2" />
                    <p className="text-sm text-[#6e7b6c] font-bold">Không tìm thấy yêu cầu xác thực KYC nào khớp.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredKyc.map((req) => (
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
                              <span className="font-semibold text-[#6e7b6c]">Loại giấy tờ:</span>
                              <span className="font-bold text-[#141b2b]">{req.docType}</span>
                            </div>
                            <div className="flex justify-between text-body-sm">
                              <span className="font-semibold text-[#6e7b6c]">Ngày gửi:</span>
                              <span className="font-bold text-[#3e4a3d]">{req.subDate}</span>
                            </div>
                            <div className="flex justify-between text-body-sm">
                              <span className="font-semibold text-[#6e7b6c]">Địa chỉ Email:</span>
                              <span className="font-bold text-[#141b2b]">{req.email}</span>
                            </div>
                            <div className="mt-3">
                              <span className="block text-xs font-semibold text-[#6e7b6c] mb-1">Xem trước tài liệu đính kèm ({req.docUrls?.length || 0}):</span>
                              <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                 {req.docUrls && req.docUrls.length > 0 ? req.docUrls.map((url, i) => (
                                    <div key={i} className="relative border border-[#e1e8fd] rounded-lg overflow-hidden h-36 w-48 flex-shrink-0 bg-slate-50 flex items-center justify-center group">
                                      <img src={url} alt={`KYC Document ${i}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <a href={url} target="_blank" rel="noreferrer" className="p-2 bg-white text-slate-800 rounded-full shadow-lg">
                                          <Eye className="w-4 h-4" />
                                        </a>
                                      </div>
                                    </div>
                                 )) : (
                                    <div className="text-xs text-gray-500 italic py-2">Không có tài liệu nào</div>
                                 )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-[#e9edff] pt-4 flex items-center justify-between">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            req.status === 'Approved' 
                              ? 'bg-[#f7fff2] text-[#006b2c]' 
                              : req.status === 'Rejected' 
                                ? 'bg-[#ffdad6] text-[#ba1a1a]' 
                                : 'bg-amber-100 text-amber-800'
                          }`}>
                            {req.status}
                          </span>

                          {req.status === 'Pending' ? (
                            <div className="flex items-center gap-3">
                              <button 
                                onClick={() => handleKycAction(req.idRaw, false, req.role)}
                                className="px-3 py-1.5 bg-white border border-[#ffdad6] hover:bg-[#ffdad6] text-[#ba1a1a] rounded-lg text-xs font-bold transition-all"
                              >
                                Từ chối
                              </button>
                              <button 
                                onClick={() => handleKycAction(req.idRaw, true, req.role)}
                                className="px-3 py-1.5 bg-[#006b2c] hover:bg-[#00873a] text-white rounded-lg text-xs font-bold transition-all"
                              >
                                Duyệt xác thực
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-[#6e7b6c] font-bold">Đã xử lý</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* ---------------- TAB: MODERATION HISTORY (Lịch sử hoạt động) ---------------- */}
          {activeTab === 'ModHistory' && (() => {
            return (
              <div className="space-y-6 max-w-7xl mx-auto">
                <div>
                  <h1 className="text-headline-lg font-extrabold text-[#141b2b]">Lịch sử hoạt động kiểm duyệt</h1>
                  <p className="text-body-sm text-[#3e4a3d] mt-1">
                    Nhật ký chi tiết các hành động kiểm duyệt dự án, dịch vụ, tài khoản và xác thực KYC của hệ thống.
                  </p>
                </div>

                <div className="bg-white border border-[#e1e8fd] rounded-xl p-6">
                  <div className="space-y-0 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[#bdcaba] before:to-transparent">
                    {moderationHistory.map((log) => {
                      const isRejected = log.target && (log.target.includes('REJECTED') || log.target.includes('Từ chối') || log.target.toLowerCase().includes('yêu cầu bổ sung') || (log.action && log.action.includes('REJECT')));
                      return (
                        <div key={log.id} className={`relative flex items-center justify-between md:justify-normal group is-active ${isRejected ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                          <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shrink-0 md:order-1 shadow-sm z-10 bg-white">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${isRejected ? 'bg-rose-100 text-rose-600 md:translate-x-1/2' : 'bg-emerald-100 text-emerald-600 md:-translate-x-1/2'}`}>
                              <Check className="w-4 h-4" />
                            </div>
                          </div>
                          <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border shadow-sm mb-4 hover:shadow-md transition-shadow ${
                            isRejected 
                              ? 'bg-rose-50/80 border-rose-200 text-rose-900' 
                              : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                          }`}>
                            <div className={`flex items-center justify-between mb-1.5 border-b pb-2 ${isRejected ? 'border-rose-100' : 'border-emerald-100'}`}>
                              <h4 className={`font-bold text-[13px] tracking-wide ${isRejected ? 'text-rose-800' : 'text-emerald-800'}`}>
                                {{
                                  'MODERATE_PROJECT': 'Kiểm duyệt dự án',
                                  'MODERATE_GIG': 'Kiểm duyệt dịch vụ',
                                  'MODERATE_PROFILE': 'Kiểm duyệt hồ sơ',
                                  'KYC_MODERATE': 'Kiểm duyệt KYC',
                                  'KYC_REQUIRE_MORE_INFO': 'Yêu cầu bổ sung KYC',
                                  'PROCESS_WITHDRAWAL': 'Xử lý lệnh rút tiền',
                                  'RESOLVE_DISPUTE': 'Xử lý khiếu nại',
                                  'VERIFY_KYC': 'Xác thực KYC',
                                  'APPROVE_WITHDRAWAL': 'Duyệt lệnh rút tiền',
                                  'SUSPEND_USER': 'Khóa tài khoản',
                                  'UPDATE_CONFIG': 'Cập nhật hệ thống'
                                }[log.action] || log.action?.replace(/_/g, ' ')}
                              </h4>
                              <time className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                                isRejected ? 'text-rose-600 bg-rose-100/60' : 'text-emerald-600 bg-emerald-100/60'
                              }`}>{log.time}</time>
                            </div>
                            <p className={`text-[13px] leading-relaxed mt-2 ${isRejected ? 'text-rose-700' : 'text-emerald-700'}`}>
                              {log.target.split(/(REJECTED|PUBLISHED|Từ chối|yêu cầu bổ sung)/gi).map((part, i) => {
                                const upperPart = part.toUpperCase();
                                if (upperPart === 'REJECTED' || upperPart === 'TỪ CHỐI') {
                                  return <span key={i} className="font-bold text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded">{part}</span>;
                                } else if (upperPart === 'PUBLISHED') {
                                  return <span key={i} className="font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">{part}</span>;
                                } else if (upperPart === 'YÊU CẦU BỔ SUNG') {
                                  return <span key={i} className="font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">{part}</span>;
                                }
                                return part;
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}

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
                if (reportFilter === 'PENDING' && !isPending) return false;
                if (reportFilter === 'RESOLVED' && isPending) return false;
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
                          { key: 'RESOLVED', label: 'Đã xử lý' }
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
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${severityClass(report.severity)}`}>
                                Mức độ: {report.severity}
                              </span>
                              <span className="px-2 py-0.5 bg-[#f1f3ff] text-[#141b2b] rounded text-[10px] font-bold border border-slate-200">
                                {report.type}
                              </span>
                            </div>
                            <h3 className="text-body-lg font-bold text-[#141b2b]">{report.target}</h3>
                          </div>
                          <span className={`text-xs font-bold px-2 py-1 rounded ${
                            report.status === 'Chờ xử lý' || report.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800'
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
                          {(report.status === 'Chờ xử lý' || report.status === 'PENDING') && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Bạn có chắc chắn muốn đánh dấu báo cáo ${report.id} là đã xử lý?`)) {
                                  adminApi.resolveReport(report.id.replace('RPT-', ''), 'RESOLVED', user?.id || 1)
                                    .then(res => {
                                      if (res.success) {
                                        showToast(res.message, 'success');
                                        fetchModerationData();
                                      } else {
                                        showToast(res.message, 'error');
                                      }
                                    }).catch(err => {
                                      console.error(err);
                                      showToast('Có lỗi xảy ra khi xử lý báo cáo.', 'error');
                                    });
                                }
                              }}
                              className="px-3 py-1 bg-white hover:bg-[#006b2c] hover:text-white text-[#006b2c] border border-[#bdcaba] rounded-lg text-xs font-bold transition-all"
                            >
                              Xử lý báo cáo →
                            </button>
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

          {/* ---------------- TAB: SYSTEM BUGS ---------------- */}
          {activeTab === 'SystemBugs' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-display-sm font-extrabold text-[#141b2b]">Báo cáo lỗi hệ thống</h2>
                  <p className="mt-2 text-body-lg text-[#6e7b6c]">Quản lý và xử lý các lỗi hệ thống được người dùng báo cáo</p>
                </div>
                <button className="flex items-center gap-2 rounded-xl bg-[#006b2c] px-5 py-3 text-label-lg font-bold text-white shadow hover:bg-[#00873a] hover:shadow-md transition-all">
                  <Plus className="h-5 w-5" />
                  Tạo báo cáo lỗi
                </button>
              </div>

              <div className="rounded-2xl border border-[#e1e8fd] bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-[#e9edff] text-left">
                    <thead>
                      <tr className="bg-[#f9f9ff]">
                        <th className="px-6 py-4 text-label-md font-extrabold text-[#6e7b6c] uppercase tracking-wider">Mã lỗi</th>
                        <th className="px-6 py-4 text-label-md font-extrabold text-[#6e7b6c] uppercase tracking-wider">Tiêu đề</th>
                        <th className="px-6 py-4 text-label-md font-extrabold text-[#6e7b6c] uppercase tracking-wider">Mô tả</th>
                        <th className="px-6 py-4 text-label-md font-extrabold text-[#6e7b6c] uppercase tracking-wider">Trạng thái</th>
                        <th className="px-6 py-4 text-label-md font-extrabold text-[#6e7b6c] uppercase tracking-wider">Ngày tạo</th>
                        <th className="px-6 py-4 text-label-md font-extrabold text-[#6e7b6c] uppercase tracking-wider text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e9edff] bg-white">
                      {bugReports.length > 0 ? bugReports.map(bug => (
                        <tr key={bug.reportId} className="hover:bg-[#f1f3ff]/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-body-sm font-bold text-[#141b2b]">#{bug.reportId}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-body-sm text-[#3e4a3d] font-bold">{bug.title}</td>
                          <td className="px-6 py-4 text-body-sm text-[#6e7b6c] truncate max-w-xs">{bug.description}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              bug.status === 'RESOLVED' ? 'bg-[#f7fff2] text-[#006b2c]' :
                              bug.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {bug.status || 'OPEN'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-body-sm text-[#6e7b6c]">
                            {bug.createdAt ? new Date(bug.createdAt).toLocaleDateString('vi-VN') : ''}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button 
                              onClick={() => {
                                adminApi.updateBugReportStatus(bug.reportId, 'RESOLVED', user.id).then(() => {
                                  showToast('Đã đánh dấu lỗi thành công.', 'success');
                                  fetchBugReports();
                                });
                              }}
                              className="text-[#006b2c] hover:text-[#00873a] font-bold"
                            >
                              Đánh dấu Resolved
                            </button>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="6" className="text-center py-10 text-[#6e7b6c] text-sm">
                            Chưa có báo cáo lỗi nào
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ---------------- TAB: GENERIC FALLBACK ---------------- */}
          {!['Dashboard', 'Tasks', 'Support', 'Moderation', 'KYC', 'Disputes', 'Reports', 'Withdrawals', 'Refunds', 'FailedTransactions', 'SystemBugs', 'ModHistory'].includes(activeTab) && (
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



      {/* ---------------- DRAWERS/MODAL: MANAGE/VIEW TASK DETAILS ---------------- */}
      {showManageModal && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl p-6 shadow-2xl flex flex-col border border-[#e1e8fd] animate-in zoom-in-95 duration-200">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#e9edff]">
                <div>
                  <span className="text-xs font-bold text-[#6e7b6c]">{selectedTask.id}</span>
                  <h3 className="text-title-md font-extrabold text-[#141b2b] mt-0.5">{selectedTask.type}</h3>
                </div>
                <button 
                  onClick={() => {
                    setShowManageModal(false);
                    setSelectedTask(null);
                  }}
                  className="p-1.5 hover:bg-[#f1f3ff] rounded-lg transition-colors text-[#6e7b6c]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Task Details Info */}
              <div className="py-6 space-y-4">
                <div className="flex items-center gap-3 bg-[#f1f3ff] p-4 rounded-xl">
                  <img src={selectedTask.avatar} alt={selectedTask.assignedToEmail || 'Chưa ai nhận'} className="w-10 h-10 rounded-full object-cover border border-[#bdcaba]" />
                  <div>
                    <h4 className="text-body-sm font-bold text-[#141b2b]">{selectedTask.assignedToEmail ? selectedTask.assignedToEmail : 'Chưa có ai nhận'}</h4>
                    <p className="text-xs text-[#6e7b6c]">Người đang xử lý</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-body-sm border-b border-[#e9edff] pb-4">
                  <div>
                    <span className="font-semibold text-[#6e7b6c]">Mức độ:</span>
                    <span className={`block mt-1 font-bold text-sm ${
                      selectedTask.priority === 'High' ? 'text-[#ba1a1a]' : 'text-[#3e4a3d]'
                    }`}>{selectedTask.priority} Priority</span>
                  </div>
                  <div>
                    <span className="font-semibold text-[#6e7b6c]">Hạn chót:</span>
                    <span className="block mt-1 font-bold text-[#141b2b]">{selectedTask.deadline}</span>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold text-[#6e7b6c] uppercase">Mô tả công việc</span>
                  <p className="text-body-sm text-[#141b2b] mt-2 leading-relaxed bg-[#f9f9ff] p-3 rounded-lg border border-[#e1e8fd]">
                    {selectedTask.description}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-bold text-[#6e7b6c] uppercase">Trạng thái hiện tại</span>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`w-3 h-3 rounded-full ${
                      selectedTask.status === 'Completed' ? 'bg-emerald-500' : 
                      selectedTask.status === 'In Progress' ? 'bg-[#006b2c]' : 
                      selectedTask.status === 'Escalated' ? 'bg-red-500' : 
                      'bg-blue-500'
                    }`} />
                    <span className="text-body-sm font-bold text-[#141b2b]">{selectedTask.status}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions for Task */}
            <div className="border-t border-[#e9edff] pt-4 space-y-3 mt-6">
              {selectedTask.status !== 'Completed' ? (
                <>
                  {selectedTask.status === 'Pending' && (
                    <button 
                      onClick={() => handleUpdateTaskStatus(selectedTask.id, 'In Progress')}
                      disabled={selectedTask.assignedToEmail && selectedTask.assignedToEmail !== (user?.email || 'staff@gmail.com')}
                      className={`w-full py-2.5 rounded-lg font-bold text-body-sm shadow transition-all ${
                        selectedTask.assignedToEmail && selectedTask.assignedToEmail !== (user?.email || 'staff@gmail.com')
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-[#006b2c] hover:bg-[#00873a] text-white'
                      }`}
                    >
                      {selectedTask.assignedToEmail && selectedTask.assignedToEmail !== (user?.email || 'staff@gmail.com')
                        ? 'Đã được nhận bởi ' + selectedTask.assignedToEmail
                        : 'Bắt đầu xử lý'}
                    </button>
                  )}
                  {selectedTask.status === 'In Progress' && selectedTask.assignedToEmail === (user?.email || 'staff@gmail.com') && (
                    <button 
                      onClick={() => handleUpdateTaskStatus(selectedTask.id, 'Completed')}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-body-sm shadow transition-all"
                    >
                      Hoàn thành công việc
                    </button>
                  )}
                  {!showEscalateReasons ? (
                    <button 
                      onClick={() => setShowEscalateReasons(true)}
                      className="w-full py-2.5 bg-white border border-[#ffdad6] hover:bg-[#ffdad6] text-[#ba1a1a] rounded-lg font-bold text-body-sm transition-all"
                    >
                      Báo cáo sự cố / Trì hoãn
                    </button>
                  ) : (
                    <div className="border border-[#ffdad6] bg-[#fff5f4] rounded-lg p-4 space-y-3">
                      <p className="text-body-sm font-bold text-[#ba1a1a]">Chọn lý do chuyển cấp:</p>
                      <div className="space-y-2">
                        {['Hồ sơ có dấu hiệu giả mạo tinh vi', 'Thiếu thẩm quyền để giải quyết', 'Tranh chấp phức tạp cần Manager phân xử', 'Lỗi hệ thống / Bug phần mềm', 'Lý do khác'].map((reason, idx) => (
                          <label key={idx} className="flex items-start gap-2 cursor-pointer">
                            <input 
                              type="radio" 
                              name="escalateReason" 
                              value={reason} 
                              checked={selectedEscalateReason === reason}
                              onChange={(e) => setSelectedEscalateReason(e.target.value)}
                              className="mt-1"
                            />
                            <span className="text-body-sm text-[#3e4a3d]">{reason}</span>
                          </label>
                        ))}
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button 
                          onClick={() => {
                            setShowEscalateReasons(false);
                            setSelectedEscalateReason('');
                          }}
                          className="flex-1 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-bold text-body-sm transition-all"
                        >
                          Hủy
                        </button>
                        <button 
                          onClick={async () => {
                            if (!selectedEscalateReason) {
                              showToast('Vui lòng chọn lý do báo cáo sự cố', 'error');
                              return;
                            }
                            try {
                              const res = await adminApi.escalateVerificationTask(selectedTask.taskId, selectedEscalateReason);
                              if (res.success) {
                                showToast(res.message || 'Đã báo cáo sự cố và chuyển cấp tác vụ!', 'success');
                                setTasks(prev => prev.map(t => 
                                  t.taskId === selectedTask.taskId ? { ...t, status: 'Escalated', assignedToEmail: null } : t
                                ));
                                setShowManageModal(false);
                                setSelectedTask(null);
                                setShowEscalateReasons(false);
                                setSelectedEscalateReason('');
                              } else {
                                showToast(res.message || 'Có lỗi xảy ra', 'error');
                              }
                            } catch (error) {
                              showToast('Lỗi kết nối tới máy chủ', 'error');
                            }
                          }}
                          className="flex-1 py-2 bg-[#ba1a1a] hover:bg-[#93000a] text-white rounded-lg font-bold text-body-sm transition-all"
                        >
                          Xác nhận gửi
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-3 bg-[#f7fff2] border border-[#bdcaba] rounded-lg text-center text-[#006b2c] font-bold text-body-sm">
                  ✓ Công việc đã hoàn thành thành công.
                </div>
              )}
              <button
                onClick={() => {
                  setShowManageModal(false);
                  setSelectedTask(null);
                  setShowEscalateReasons(false);
                  setSelectedEscalateReason('');
                }}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-body-sm rounded-lg transition-all"
              >
                Đóng cửa sổ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- CONFIRMATION MODAL ---------------- */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-xl border border-[#e1e8fd] text-center animate-in fade-in zoom-in-95 duration-150">
            <div className={`mx-auto w-12 h-12 rounded-full mb-4 flex items-center justify-center ${
              confirmConfig.type === 'danger' ? 'bg-[#ffdad6] text-[#ba1a1a]' : 'bg-[#f7fff2] text-[#006b2c]'
            }`}>
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-title-md font-extrabold text-[#141b2b] mb-2">{confirmConfig.title}</h3>
            <p className="text-body-sm text-[#3e4a3d] mb-6">{confirmConfig.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-body-sm transition-all"
              >
                {confirmConfig.cancelText || 'Hủy'}
              </button>
              <button
                onClick={confirmConfig.onConfirm}
                className={`flex-1 py-2 rounded-lg font-bold text-body-sm shadow transition-all text-white ${
                  confirmConfig.type === 'danger' ? 'bg-[#ba1a1a] hover:bg-[#93000a]' : 'bg-[#006b2c] hover:bg-[#00873a]'
                }`}
              >
                {confirmConfig.confirmText || 'Xác nhận'} {confirmCountdown !== null ? `(${confirmCountdown}s)` : ''}
              </button>
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
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full text-[#6e7b6c] hover:bg-[#f1f4f0]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-4">
              <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl mb-4">
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-bold text-rose-600 uppercase">Ưu tiên: {selectedDispute.priority}</span>
                  <span className="text-xs text-rose-500 font-medium">{selectedDispute.raw?.createdAt}</span>
                </div>
                <h3 className="text-body-lg font-bold text-[#141b2b]">{selectedDispute.raw?.projectTitle}</h3>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-[#f7fff2] border border-[#d6f2c6] p-3 rounded-lg">
                  <p className="text-xs text-[#3e4a3d] mb-1">Bên Client (Thuê)</p>
                  <p className="font-bold text-[#141b2b]">{selectedDispute.raw?.clientName}</p>
                </div>
                <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg">
                  <p className="text-xs text-[#3e4a3d] mb-1">Bên Freelancer</p>
                  <p className="font-bold text-[#141b2b]">{selectedDispute.raw?.freelancerName}</p>
                </div>
              </div>

              <div>
                <p className="text-body-sm text-[#3e4a3d] font-bold mb-1">Số tiền đang tranh chấp:</p>
                <p className="text-title-lg text-rose-600 font-extrabold">{selectedDispute.raw?.amount?.toLocaleString('vi-VN')} VND</p>
              </div>

              <div>
                <p className="text-body-sm text-[#3e4a3d] font-bold mb-1">Nội dung khiếu nại:</p>
                <div className="bg-[#f1f4f0] p-3 rounded-lg text-sm text-[#141b2b]">
                  {selectedDispute.raw?.reason || 'Không có mô tả chi tiết'}
                </div>
              </div>

              <div>
                <p className="text-body-sm text-[#3e4a3d] font-bold mb-2">Ghi chú xử lý của bạn (nếu có):</p>
                <textarea
                  className="w-full h-24 border border-[#e1e8fd] rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#006b2c] resize-none"
                  placeholder="Nhập ghi chú hoặc lý do quyết định của bạn..."
                  value={disputeNote}
                  onChange={e => setDisputeNote(e.target.value)}
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#e1e8fd] bg-gray-50 rounded-b-xl flex gap-3 flex-wrap sm:flex-nowrap">
              <button 
                onClick={() => handleResolveDispute('RESOLVED_CLIENT_FAVOR')}
                className="flex-1 py-2 px-3 bg-[#006b2c] hover:bg-[#00873a] text-white font-bold text-sm rounded-lg shadow transition-colors text-center"
              >
                Xử lý cho Client
              </button>
              <button 
                onClick={() => handleResolveDispute('RESOLVED_FREELANCER_FAVOR')}
                className="flex-1 py-2 px-3 bg-[#006b2c] hover:bg-[#00873a] text-white font-bold text-sm rounded-lg shadow transition-colors text-center"
              >
                Xử lý cho Freelancer
              </button>
              <button 
                onClick={() => handleResolveDispute('CLOSED')}
                className="w-full sm:w-auto py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-sm rounded-lg transition-colors"
              >
                Đóng khiếu nại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- MODERATION DETAIL MODAL ---------------- */}
      {showModerationModal && selectedModerationItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl border border-[#e1e8fd] flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
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
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-4">
              <div className="flex justify-between items-center mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#f7fff2] text-[#006b2c]">
                  {selectedModerationItem.type}
                </span>
                <span className="text-xs text-[#6e7b6c] font-medium">{selectedModerationItem.subDate}</span>
              </div>
              <h3 className="text-body-lg font-bold text-[#141b2b]">{selectedModerationItem.title}</h3>
              
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg text-sm">
                <p className="text-[#3e4a3d] mb-1">Người đăng:</p>
                <p className="font-bold text-[#141b2b]">{selectedModerationItem.author}</p>
              </div>

              <div>
                <p className="text-body-sm text-[#3e4a3d] font-bold mb-1">Lý do đưa vào hàng đợi:</p>
                <p className="text-sm font-semibold text-amber-700">{selectedModerationItem.reason}</p>
              </div>

              <div>
                <p className="text-body-sm text-[#3e4a3d] font-bold mb-1">Nội dung chi tiết:</p>
                <div className="bg-[#f1f4f0] p-3 rounded-lg text-sm text-[#141b2b] whitespace-pre-wrap">
                  {selectedModerationItem.detail || 'Không có mô tả chi tiết'}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#e1e8fd] bg-gray-50 rounded-b-xl flex gap-3 flex-wrap sm:flex-nowrap">
              {selectedModerationItem.status === 'Pending' ? (
                <>
                  <button 
                    onClick={() => {
                      handleModAction(selectedModerationItem, true);
                      setShowModerationModal(false);
                    }}
                    className="flex-1 py-2 px-3 bg-[#006b2c] hover:bg-[#00873a] text-white font-bold text-sm rounded-lg shadow transition-colors flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" /> Phê duyệt
                  </button>
                  <button 
                    onClick={() => {
                      handleModAction(selectedModerationItem, false);
                      setShowModerationModal(false);
                    }}
                    className="flex-1 py-2 px-3 bg-[#ba1a1a] hover:bg-[#93000a] text-white font-bold text-sm rounded-lg shadow transition-colors flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" /> Từ chối
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setShowModerationModal(false)}
                  className="w-full py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-sm rounded-lg transition-colors"
                >
                  Đóng cửa sổ
                </button>
              )}
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
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#f7f8f7] px-4 py-8">
          <div className="mx-auto flex min-h-full w-full max-w-[920px] flex-col">
            <div className="mb-8 flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <span className="text-[17px] font-extrabold text-[#009b3a]">FelanPro</span>
                <span className="h-4 w-px bg-[#cfd8cd]" />
                <span className="text-[12px] font-medium text-[#3e4a3d]">HR Terminal</span>
              </div>
              <div className="flex items-center gap-4 text-[#141b2b]">
                <Bell className="h-5 w-5" />
                <HelpCircle className="h-5 w-5" />
                <button
                  type="button"
                  onClick={closeTransferRequestModal}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[#3e4a3d] hover:bg-[#edf4ea]"
                  aria-label="Đóng đơn điều chuyển"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleTransferRequestSubmit} className="rounded-xl border border-[#e5ece2] bg-white p-6 shadow-[0_8px_24px_rgba(20,27,43,0.08)] sm:p-8">
              <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-[28px] font-extrabold leading-tight text-black sm:text-[32px]">Đơn yêu cầu điều chuyển phòng ban</h2>
                  <p className="mt-2 text-[15px] text-[#3e4a3d]">Gửi yêu cầu chuyển sang phòng ban khác</p>
                </div>
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#e8f5e7] px-3 py-1 text-[12px] font-bold text-[#006b2c]">
                  <span className="h-2 w-2 rounded-full bg-[#00a63e]" />
                  Bản nháp
                </span>
              </div>

              <div className="space-y-8">
                <section>
                  <div className="mb-5 flex items-center gap-2 border-b border-[#b9cbb5] pb-3 text-[#009b3a]">
                    <User className="h-5 w-5" />
                    <h3 className="text-[18px] font-extrabold">Thông tin nhân viên</h3>
                  </div>
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-[13px] font-bold text-black">Mã nhân viên</label>
                      <input readOnly value={myProfile?.staffCode || myProfile?.employeeCode || `FP-${user?.id || '----'}`} className="h-12 w-full rounded-lg border border-[#b8d0b2] bg-[#f4fbf1] px-3 text-[14px] text-[#3e4a3d] outline-none" />
                    </div>
                    <div>
                      <label className="mb-2 block text-[13px] font-bold text-black">Họ và tên</label>
                      <input readOnly value={user?.displayName || user?.name || myProfile?.fullName || ''} className="h-12 w-full rounded-lg border border-[#b8d0b2] bg-[#f4fbf1] px-3 text-[14px] text-[#3e4a3d] outline-none" />
                    </div>
                    <div>
                      <label className="mb-2 block text-[13px] font-bold text-black">Phòng ban hiện tại</label>
                      <input readOnly value={myProfile?.departmentName || 'Đang tải...'} className="h-12 w-full rounded-lg border border-[#b8d0b2] bg-[#f4fbf1] px-3 text-[14px] text-[#3e4a3d] outline-none" />
                    </div>
                    <div>
                      <label className="mb-2 block text-[13px] font-bold text-black">Chức vụ hiện tại</label>
                      <input readOnly value={myProfile?.position || myProfile?.title || currentRole} className="h-12 w-full rounded-lg border border-[#b8d0b2] bg-[#f4fbf1] px-3 text-[14px] text-[#3e4a3d] outline-none" />
                    </div>
                    <div>
                      <label className="mb-2 block text-[13px] font-bold text-black">Quản lý hiện tại</label>
                      <input readOnly value={myProfile?.managerName || 'Chưa cập nhật'} className="h-12 w-full rounded-lg border border-[#b8d0b2] bg-[#f4fbf1] px-3 text-[14px] text-[#3e4a3d] outline-none" />
                    </div>
                    <div>
                      <label className="mb-2 block text-[13px] font-bold text-black">Email</label>
                      <input readOnly value={user?.email || ''} className="h-12 w-full rounded-lg border border-[#b8d0b2] bg-[#f4fbf1] px-3 text-[14px] text-[#3e4a3d] outline-none" />
                    </div>
                  </div>
                </section>

                <section>
                  <div className="mb-5 flex items-center gap-2 border-b border-[#b9cbb5] pb-3 text-[#009b3a]">
                    <ArrowLeftRight className="h-5 w-5" />
                    <h3 className="text-[18px] font-extrabold">Thông tin điều chuyển</h3>
                  </div>
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-[13px] font-bold text-black">Phòng ban muốn chuyển đến</label>
                      <select
                        required
                        className="h-12 w-full rounded-lg border border-[#b8d0b2] bg-white px-3 text-[14px] text-[#3e4a3d] outline-none focus:border-[#009b3a] focus:ring-2 focus:ring-[#009b3a]/15"
                        value={transferRequestTargetDeptId}
                        onChange={e => setTransferRequestTargetDeptId(e.target.value)}
                      >
                        <option value="">Chọn phòng ban</option>
                        {departmentsList
                          .filter(d => isActiveDepartment(d) && d.departmentId !== myProfile?.departmentId)
                          .map(d => (
                            <option key={d.departmentId} value={d.departmentId}>
                              {d.name}{d.code ? ` (${d.code})` : ''}
                            </option>
                          ))
                        }
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-[13px] font-bold text-black">Vị trí mong muốn</label>
                      <input
                        value={transferRequestDetails.desiredPosition}
                        onChange={e => setTransferRequestDetails(prev => ({ ...prev, desiredPosition: e.target.value }))}
                        placeholder="Nhập vị trí dự kiến"
                        className="h-12 w-full rounded-lg border border-[#b8d0b2] bg-white px-3 text-[14px] text-[#3e4a3d] outline-none focus:border-[#009b3a] focus:ring-2 focus:ring-[#009b3a]/15"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-[13px] font-bold text-black">Ngày mong muốn bắt đầu</label>
                      <input
                        type="date"
                        value={transferRequestDetails.desiredStartDate}
                        onChange={e => setTransferRequestDetails(prev => ({ ...prev, desiredStartDate: e.target.value }))}
                        className="h-12 w-full rounded-lg border border-[#b8d0b2] bg-white px-3 text-[14px] text-[#3e4a3d] outline-none focus:border-[#009b3a] focus:ring-2 focus:ring-[#009b3a]/15"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-[13px] font-bold text-black">Loại điều chuyển</label>
                      <select
                        value={transferRequestDetails.transferType}
                        onChange={e => setTransferRequestDetails(prev => ({ ...prev, transferType: e.target.value }))}
                        className="h-12 w-full rounded-lg border border-[#b8d0b2] bg-white px-3 text-[14px] text-[#3e4a3d] outline-none focus:border-[#009b3a] focus:ring-2 focus:ring-[#009b3a]/15"
                      >
                        <option>Yêu cầu cá nhân</option>
                        <option>Theo nhu cầu dự án</option>
                        <option>Phát triển nghề nghiệp</option>
                        <option>Khác</option>
                      </select>
                    </div>
                  </div>
                </section>

                <section>
                  <div className="mb-5 flex items-center gap-2 border-b border-[#b9cbb5] pb-3 text-[#009b3a]">
                    <FileText className="h-5 w-5" />
                    <h3 className="text-[18px] font-extrabold">Lý do điều chuyển</h3>
                  </div>
                  <label className="mb-2 block text-[13px] font-bold text-black">Chi tiết lý do</label>
                  <textarea
                    required
                    value={transferRequestReason}
                    onChange={e => setTransferRequestReason(e.target.value)}
                    placeholder="Trình bày lý do bạn muốn chuyển sang phòng ban khác"
                    className="min-h-[110px] w-full rounded-lg border border-[#b8d0b2] bg-white p-3 text-[14px] text-[#3e4a3d] outline-none focus:border-[#009b3a] focus:ring-2 focus:ring-[#009b3a]/15"
                  />
                </section>

                <section>
                  <div className="mb-5 flex items-center gap-2 border-b border-[#b9cbb5] pb-3 text-[#009b3a]">
                    <Activity className="h-5 w-5" />
                    <h3 className="text-[18px] font-extrabold">Kỹ năng và kinh nghiệm</h3>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <label className="mb-2 block text-[13px] font-bold text-black">Kỹ năng liên quan & Kinh nghiệm trước đây</label>
                      <textarea
                        value={transferRequestDetails.skills}
                        onChange={e => setTransferRequestDetails(prev => ({ ...prev, skills: e.target.value }))}
                        placeholder="Liệt kê các kỹ năng phù hợp với vị trí mới..."
                        className="min-h-[92px] w-full rounded-lg border border-[#b8d0b2] bg-white p-3 text-[14px] text-[#3e4a3d] outline-none focus:border-[#009b3a] focus:ring-2 focus:ring-[#009b3a]/15"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-[13px] font-bold text-black">Thành tích nổi bật & Lý do bạn phù hợp</label>
                      <textarea
                        value={transferRequestDetails.achievements}
                        onChange={e => setTransferRequestDetails(prev => ({ ...prev, achievements: e.target.value }))}
                        placeholder="Nêu bật những lý do bạn là ứng viên sáng giá cho vị trí này..."
                        className="min-h-[92px] w-full rounded-lg border border-[#b8d0b2] bg-white p-3 text-[14px] text-[#3e4a3d] outline-none focus:border-[#009b3a] focus:ring-2 focus:ring-[#009b3a]/15"
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <div className="mb-5 flex items-center gap-2 border-b border-[#b9cbb5] pb-3 text-[#009b3a]">
                    <Paperclip className="h-5 w-5" />
                    <h3 className="text-[18px] font-extrabold">Tệp đính kèm</h3>
                  </div>
                  <label className="flex min-h-[170px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#9fbd98] bg-[#edf7ea] px-4 text-center transition-colors hover:bg-[#e4f3df]">
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                      onChange={e => setTransferRequestDetails(prev => ({ ...prev, attachmentName: e.target.files?.[0]?.name || '' }))}
                    />
                    <Paperclip className="mb-4 h-9 w-9 text-[#00a63e]" />
                    <span className="text-[14px] font-medium text-[#3e4a3d]">{transferRequestDetails.attachmentName || 'Kéo và thả tệp vào đây'}</span>
                    <span className="mt-1 text-[13px] text-[#3e4a3d]">Tải lên tài liệu hỗ trợ</span>
                    <span className="mt-4 rounded-full bg-white px-4 py-1 text-[11px] font-bold text-[#6e7b6c]">PDF, DOCX, PNG, JPG</span>
                    <span className="mt-2 text-[11px] italic text-[#3e4a3d]">Không bắt buộc, tối đa 10MB</span>
                  </label>
                </section>

                <label className="flex items-start gap-3 rounded-lg bg-[#edf7ea] p-4 text-[14px] leading-6 text-[#263326]">
                  <input
                    type="checkbox"
                    checked={transferRequestDetails.confirmed}
                    onChange={e => setTransferRequestDetails(prev => ({ ...prev, confirmed: e.target.checked }))}
                    className="mt-1 h-4 w-4 rounded border-[#b8d0b2] text-[#009b3a] focus:ring-[#009b3a]"
                  />
                  <span>Tôi xác nhận rằng các thông tin đã cung cấp là chính xác và hoàn toàn chịu trách nhiệm về tính trung thực của các thông tin này.</span>
                </label>
              </div>

              <div className="mt-9 flex flex-col gap-3 border-t border-[#d7e2d4] pt-6 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeTransferRequestModal}
                  className="h-12 rounded-lg border border-[#9aa69a] bg-white px-7 text-[14px] font-semibold text-[#6e7b6c] transition-colors hover:bg-[#f1f4f0]"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    showToast('Đã lưu bản nháp yêu cầu điều chuyển.', 'success');
                    closeTransferRequestModal();
                  }}
                  className="h-12 rounded-lg border border-[#00a63e] bg-white px-7 text-[14px] font-semibold text-[#009b3a] transition-colors hover:bg-[#edf7ea]"
                >
                  Lưu bản nháp
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTransferRequest || !transferRequestTargetDeptId || !transferRequestDetails.confirmed}
                  className="h-12 rounded-lg bg-[#00a63e] px-8 text-[14px] font-bold text-white shadow-sm transition-colors hover:bg-[#008f36] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmittingTransferRequest ? 'Đang gửi...' : 'Gửi yêu cầu'}
                </button>
              </div>
            </form>

            <div className="mt-9 flex flex-col gap-3 border-t border-[#cfd8cd] px-1 py-5 text-[11px] text-[#263326] sm:flex-row sm:items-center sm:justify-between">
              <span>© 2024 FelanPro HR Systems. High-Efficiency Environment.</span>
              <div className="flex gap-6">
                <span>Privacy Policy</span>
                <span>Terms of Service</span>
                <span>Support</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800">Chi tiết Báo cáo vi phạm</h3>
              <button 
                onClick={() => setSelectedReport(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-3">
                <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                  selectedReport.severity === 'Cao' ? 'bg-rose-100 text-rose-700' :
                  selectedReport.severity === 'Trung bình' ? 'bg-amber-100 text-amber-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  Mức độ: {selectedReport.severity || 'Trung bình'}
                </span>
                <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-bold">
                  Đối tượng: {selectedReport.type || selectedReport.targetType}
                </span>
                <span className={`px-2.5 py-1 text-xs font-bold rounded-md ${
                  selectedReport.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  Trạng thái: {selectedReport.status || 'Pending'}
                </span>
              </div>

              {/* Target Name */}
              <div>
                <h4 className="text-sm font-semibold text-slate-500 mb-1">Nội dung bị báo cáo</h4>
                <p className="text-lg font-bold text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {selectedReport.target || selectedReport.reportedName}
                  {selectedReport.targetId && (
                    <span className="text-sm font-normal text-slate-500 ml-2">(ID: {selectedReport.targetId})</span>
                  )}
                </p>
                {selectedReport.targetId && (
                  <button 
                    className="mt-2 text-sm text-[#006b2c] font-semibold hover:underline flex items-center gap-1"
                    onClick={() => {
                      if (selectedReport.type === 'Hồ sơ' || selectedReport.targetType === 'USER') {
                        // Normally navigate to profile, assuming frontend routes support it
                        alert("Chức năng đang được cập nhật (ID: " + selectedReport.targetId + ")");
                      } else {
                        // Project
                        onNavigate('job_details', { job: { id: selectedReport.targetId } });
                      }
                    }}
                  >
                    Xem trang chi tiết ↗
                  </button>
                )}
              </div>

              {/* Evidence */}
              <div>
                <h4 className="text-sm font-semibold text-slate-500 mb-2">Bằng chứng / Nội dung báo cáo</h4>
                <div className="bg-rose-50 text-rose-900 p-4 rounded-xl border border-rose-100 whitespace-pre-wrap text-sm leading-relaxed">
                  {selectedReport.evidence || selectedReport.reason || 'Không có nội dung'}
                </div>
              </div>

              {/* Users Involved */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h4 className="text-xs font-semibold text-slate-500 mb-1">Người báo cáo</h4>
                  <p className="font-bold text-slate-800">{selectedReport.reporter || selectedReport.reporterName}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h4 className="text-xs font-semibold text-slate-500 mb-1">Bị báo cáo</h4>
                  <p className="font-bold text-slate-800">{selectedReport.accused || selectedReport.reportedName}</p>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex items-center justify-end gap-3">
              <button 
                onClick={() => setSelectedReport(null)}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors"
                disabled={reportActionLoading}
              >
                Đóng
              </button>
              
              {(!selectedReport.status || selectedReport.status === 'Pending') && (
                <>
                  <button 
                    onClick={() => resolveReport(selectedReport, 'REJECTED')}
                    className="px-5 py-2.5 text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors disabled:opacity-50"
                    disabled={reportActionLoading}
                  >
                    Từ chối báo cáo
                  </button>
                  <button 
                    onClick={() => resolveReport(selectedReport, 'RESOLVED')}
                    className="px-5 py-2.5 text-sm font-bold text-white bg-[#006b2c] hover:bg-[#005a24] shadow-sm rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                    disabled={reportActionLoading}
                  >
                    {reportActionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Đánh dấu đã xử lý
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

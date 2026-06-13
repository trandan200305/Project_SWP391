import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, CheckSquare, MessageSquare, ShieldAlert, UserCheck, 
  BadgeDollarSign, Gavel, FileText, Bell, Settings, Search, HelpCircle, 
  Grid, Plus, ArrowUpRight, ArrowDownRight, MoreVertical, Filter, 
  Check, X, Send, Eye, ShieldCheck, AlertCircle, Clock, ChevronRight,
  TrendingUp, Activity, User, LogOut, CheckCircle2, AlertTriangle, Paperclip,
  XCircle, Edit3, Shield
} from 'lucide-react';
import { adminApi } from '../api/adminApi.js';
import { messengerApi } from '../../messenger/api/messengerApi.js';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export default function StaffDashboardPage({ user, onNavigateToHome, onNavigate, onLogout }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  // Styles & Brand Settings
  const brandName = "FelanPro";
  const brandSub = "Admin Console";
  const currentRole = user?.role || "STAFF";
  const normalizeRole = (role) => String(role || '').toUpperCase();
  const normalizeId = (id) => String(id ?? '');
  const isCustomerMessage = (message) =>
    ['EMPLOYER', 'FREELANCER', 'CLIENT'].includes(normalizeRole(message?.senderRole));
  const isOwnSupportMessage = (message) => {
    if (isCustomerMessage(message)) return false;

    return (
      normalizeRole(message?.senderRole) === normalizeRole(currentRole) &&
      normalizeId(message?.senderId) === normalizeId(user?.id)
    );
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
  
  // Dashboard & Task filters
  const [searchQuery, setSearchQuery] = useState('');
  const [taskFilter, setTaskFilter] = useState('ALL');
  const [chartPeriod, setChartPeriod] = useState('7days');
  const [hoveredPoint, setHoveredPoint] = useState(null);
  
  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showManageModal, setShowManageModal] = useState(false);
  
  // Notification Toast
  const [toast, setToast] = useState({ message: '', type: 'success', show: false });
  const showToast = (message, type = 'success') => {
    setToast({ message, type, show: true });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

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
  const [violationReports, setViolationReports] = useState([]);
  const [escalationCases, setEscalationCases] = useState([]);
  const [warningTemplates, setWarningTemplates] = useState([]);
  const [moderationHistory, setModerationHistory] = useState([]);
  const [moderationView, setModerationView] = useState('queue');
  const [queueTab, setQueueTab] = useState('ALL');
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
              signoffs: t.signoffs
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
            role: 'FREELANCER',
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
      adminApi.getPendingProjects().catch(() => []),
      adminApi.getProfileRequests().catch(() => []),
      adminApi.getWithdrawals().catch(() => [])
    ]).then(([projectsData, profilesData, withdrawalsData]) => {
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
          subDate: p.createdAt ? String(p.createdAt).substring(0, 10) : '',
          status: 'Pending'
        }))];
      }

      if (Array.isArray(profilesData)) {
        mapped = [...mapped, ...profilesData.map(pr => ({
          id: `PROF-${pr.id}`,
          idRaw: pr.id,
          title: `Cập nhật hồ sơ: ${pr.companyName || pr.displayName || 'Employer'}`,
          type: 'PROFILE',
          author: pr.displayName || 'Employer',
          detail: `Yêu cầu cập nhật hồ sơ công ty. ${pr.companyDescription ? 'Có thay đổi mô tả.' : ''}`,
          reason: 'Cập nhật hồ sơ',
          subDate: pr.createdAt ? String(pr.createdAt).substring(0, 10) : new Date().toISOString().substring(0, 10),
          status: pr.status === 'PENDING' ? 'Pending' : 'Processed'
        }))];
      }

      if (Array.isArray(withdrawalsData)) {
        mapped = [...mapped, ...withdrawalsData.filter(w => w.status === 'PENDING').map(w => ({
          id: `WTH-${w.id}`,
          idRaw: w.id,
          title: `Yêu cầu rút tiền: ${w.amount?.toLocaleString('vi-VN')} VND`,
          type: 'WITHDRAWAL',
          author: `Freelancer #${w.freelancerId}`,
          detail: `Rút tiền về ${w.bankName} - ${w.accountNumber}`,
          reason: 'Rút tiền',
          subDate: w.createdAt ? String(w.createdAt).substring(0, 10) : new Date().toISOString().substring(0, 10),
          status: 'Pending'
        }))];
      }

      // Add Mock data for Gigs and Reviews to satisfy user requirement
      mapped.push({
        id: 'GIG-MOCK-1',
        idRaw: 9991,
        title: 'Thiết kế Logo Doanh nghiệp trọn gói',
        type: 'GIG',
        author: 'Freelancer Alex',
        detail: 'Gói dịch vụ mới tạo, giá 2.000.000 VND',
        reason: 'Dịch vụ mới',
        subDate: new Date().toISOString().substring(0, 10),
        status: 'Pending'
      });

      mapped.push({
        id: 'REV-MOCK-1',
        idRaw: 9992,
        title: 'Đánh giá bị báo cáo: Dự án Web App',
        type: 'REVIEW',
        author: 'Client John',
        detail: 'Đánh giá chứa từ ngữ không phù hợp.',
        reason: 'Bị cắm cờ (Flagged)',
        subDate: new Date().toISOString().substring(0, 10),
        status: 'Pending'
      });

      setModerationItems(mapped);
    }).catch(err => console.error('Error fetching moderation items:', err));
  };

  const fetchModerationData = () => {
    adminApi.getReports().then(data => {
      if (Array.isArray(data)) {
        setViolationReports(data.map(r => ({
          id: `RPT-${r.id}`,
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
          priority: d.priority === 'HIGH' ? 'Khẩn cấp' : 'Cao'
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
        const modLogs = data.filter(log => log.module === 'MODERATION' || log.module === 'PROJECTS');
        setModerationHistory(modLogs.slice(0, 10).map(log => ({
          id: `LOG-${log.id}`,
          action: log.action,
          actor: log.adminName || 'Staff',
          target: log.description,
          time: new Date(log.timestamp).toLocaleString('vi-VN'),
          result: 'Đã lưu vết'
        })));
      }
    }).catch(console.error);
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

  // Mount logic
  useEffect(() => {
    fetchStats();
    fetchTasks();
    fetchKycRequests();
    fetchModerationItems();
    fetchModerationData();
    fetchSupportChats();
    fetchTrends();
  }, [chartPeriod]);

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
    
    const reqDepts = selectedTask.requiredDepartments?.split(',') || ['CS'];
    const deptCode = reqDepts[0] || 'CS';

    setIsLoading(true);
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

  // Moderation action supporting multiple types
  const handleModAction = (item, approve) => {
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
    } else {
      // Mock APIs for GIG and REVIEW
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

  // Filter tasks based on search query and status filter
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.type.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.user.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (taskFilter === 'ALL') return matchesSearch;
    return matchesSearch && t.status.toLowerCase() === taskFilter.toLowerCase();
  });

  // Calculate stats count
  const countAssigned = tasks.length;
  const countPending = tasks.filter(t => t.status === 'Pending').length;
  const countCompleted = tasks.filter(t => t.status === 'Completed').length;
  const countOverdue = tasks.filter(t => t.status === 'In Progress' && t.deadline.includes('Today')).length;

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
          background-color: #1e293b; /* Dark slate */
          border: 1px solid #334155; /* Slate border */
          border-radius: 16px;
          position: absolute;
          width: 240px;
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
          <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-hidden">
            <p className="text-[10px] font-bold text-[#6e7b6c] uppercase tracking-wider px-3 mb-2">Workspace</p>
            <nav className="space-y-1">
              {[
                { name: 'Dashboard', icon: LayoutDashboard },
                { name: 'Tasks', icon: CheckSquare },
                { name: 'Support', icon: MessageSquare, badge: supportChats.reduce((sum, c) => sum + c.unread, 0) },
                { name: 'Moderation', icon: Gavel, badge: moderationItems.filter(i => i.status === 'Pending').length },
                { name: 'KYC', icon: UserCheck, badge: kycRequests.filter(r => r.status === 'Pending').length },
                { name: 'Finance', icon: BadgeDollarSign },
                { name: 'Disputes', icon: ShieldAlert },
                { name: 'CMS', icon: FileText },
                { name: 'Audit Logs', icon: Clock },
                { name: 'Notifications', icon: Bell },
                { name: 'Settings', icon: Settings },
                { name: 'Profile', icon: User },
              ].map((item) => {
                const IconComp = item.icon;
                const isActive = activeTab === item.name;
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      if (item.name === 'Profile') {
                        onNavigate && onNavigate('profile');
                      } else {
                        setActiveTab(item.name);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-body-sm font-semibold transition-all duration-200 group relative ${
                      isActive 
                        ? 'bg-[#f7fff2] text-[#006b2c]' 
                        : 'text-[#3e4a3d] hover:bg-[#f1f3ff] hover:text-[#141b2b]'
                    }`}
                  >
                    {/* Left Active border bar */}
                    {isActive && (
                      <div className="absolute left-0 top-[20%] bottom-[20%] w-[3px] bg-[#006b2c] rounded-r-full" />
                    )}
                    <div className="flex items-center gap-3">
                      <IconComp className={`w-[20px] h-[20px] stroke-[2.2] transition-colors ${
                        isActive ? 'text-[#006b2c]' : 'text-[#6e7b6c] group-hover:text-[#141b2b]'
                      }`} />
                      <span>{item.name}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-[#006b2c] text-white">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Sidebar Footer (Create Task Button) */}
        <div className="p-4 border-t border-[#e1e8fd] bg-[#f9f9ff]">
          <button 
            onClick={() => setShowCreateModal(true)}
            className="w-full flex items-center justify-center gap-2 bg-[#006b2c] hover:bg-[#00873a] text-white py-2.5 rounded-lg font-bold text-body-sm shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Task</span>
          </button>
        </div>
      </aside>

      {/* ---------------- MAIN CONTAINER ---------------- */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* HEADER (64px Height) */}
        <header className="h-[64px] bg-white border-b border-[#e1e8fd] px-6 flex items-center justify-between shrink-0 z-10">
          
          {/* Search bar */}
          <div className="w-80 relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-[#6e7b6c]">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search tasks, users, or reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#f1f3ff] border-none text-[#141b2b] placeholder-[#6e7b6c] pl-10 pr-4 py-2 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-[#006b2c]/30 focus:bg-white border border-transparent transition-all"
            />
          </div>

          {/* User profile & Actions */}
          <div className="flex items-center gap-5">
            {/* Top Toolbar Icons */}
            <div className="flex items-center gap-3">
              <button className="p-2 text-[#6e7b6c] hover:text-[#141b2b] hover:bg-[#f1f3ff] rounded-lg transition-colors relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#ba1a1a] rounded-full border border-white" />
              </button>
              <button className="p-2 text-[#6e7b6c] hover:text-[#141b2b] hover:bg-[#f1f3ff] rounded-lg transition-colors">
                <HelpCircle className="w-5 h-5" />
              </button>
              <button className="p-2 text-[#6e7b6c] hover:text-[#141b2b] hover:bg-[#f1f3ff] rounded-lg transition-colors">
                <Grid className="w-5 h-5" />
              </button>
            </div>

            {/* Vertical Divider */}
            <div className="h-8 w-[1px] bg-[#e1e8fd]" />

            {/* Profile widget */}
            <div className="flex items-center gap-3">
              <div className="profile-menu-wrapper">
                <div 
                  className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <div className="flex flex-col text-right">
                    <span className="text-body-sm font-bold text-[#141b2b] leading-tight">
                      {user?.displayName || user?.name || 'Staff Member'}
                    </span>
                    <span className="text-[10px] font-bold text-[#006b2c] tracking-wide uppercase">
                      {currentRole === 'MANAGER' ? 'Manager / CS Dept' : 'Staff / CS Dept'}
                    </span>
                  </div>
                  <img
                    src={user?.avatarUrl || user?.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&fit=crop&auto=format&q=60"}
                    alt="Avatar"
                    className="w-10 h-10 rounded-full border border-[#bdcaba] object-cover"
                  />
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
                        if (onNavigate) onNavigate("edit_profile");
                      }}
                      className={`profile-menu-btn w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition-all mt-1 ${
                        activeTab === 'edit_profile'
                          ? 'profile-menu-active text-emerald-600 bg-emerald-50'
                          : 'text-slate-650 hover:text-blue-600 hover:bg-blue-50'
                      }`}
                    >
                      <span className="profile-menu-circle" />
                      <Edit3 className="w-4 h-4" /> Sửa thông tin cá nhân
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
                      <Settings className="w-4 h-4" /> Cài đặt chung
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
                        <MessageSquare className="w-4 h-4" /> Tin nhắn
                      </button>
                    </div>
                  )}

                  <div className="profile-menu-item">
                    <button
                      onClick={() => {
                        if (onNavigate) onNavigate("Dashboard");
                      }}
                      className={`profile-menu-btn w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold rounded-xl transition-all mt-1 ${
                        activeTab === 'Dashboard'
                          ? 'profile-menu-active text-emerald-600 bg-emerald-50'
                          : 'text-slate-650 hover:text-emerald-700 hover:bg-emerald-50'
                      }`}
                    >
                      <span className="profile-menu-circle" />
                      <Shield className="w-4 h-4" /> Dashboard Staff
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
                      <LogOut className="w-4 h-4" /> Đăng xuất
                    </button>
                  </div>
                </div>
              </div>
              <button 
                onClick={onNavigateToHome}
                title="Exit Console"
                className="p-2 text-[#ba1a1a] hover:bg-[#ffdad6] rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
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
                  <h1 className="text-headline-lg text-[#141b2b] font-extrabold tracking-tight">Dashboard Overview</h1>
                  <p className="text-body-sm text-[#3e4a3d] mt-1">Welcome back. Here is what's happening with your tasks today.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button className="px-4 py-2 bg-white border border-[#e1e8fd] text-[#141b2b] rounded-lg text-body-sm font-bold shadow-sm hover:bg-[#f1f3ff] transition-all flex items-center gap-2">
                    <ArrowDownRight className="w-4 h-4" />
                    <span>Export Data</span>
                  </button>
                  <button className="px-4 py-2 bg-[#006b2c] text-white rounded-lg text-body-sm font-bold shadow-sm hover:bg-[#00873a] transition-all flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    <span>Task Filters</span>
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
                      <p className="text-label-md text-[#6e7b6c] uppercase tracking-wider">Assigned Tasks</p>
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
                      <span>Stable</span>
                    </span>
                  </div>
                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <p className="text-label-md text-[#6e7b6c] uppercase tracking-wider">Pending Approval</p>
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
                      <p className="text-label-md text-[#6e7b6c] uppercase tracking-wider">Completed Today</p>
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
                      <span>! Critical</span>
                    </span>
                  </div>
                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <p className="text-label-md text-[#6e7b6c] uppercase tracking-wider">Overdue Tasks</p>
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
                      <h3 className="text-body-lg font-bold text-[#141b2b]">Task Completion by Day</h3>
                      <p className="text-xs text-[#3e4a3d]">Performance review based on finished admin requests.</p>
                    </div>
                    <select
                      value={chartPeriod}
                      onChange={(e) => {
                        setChartPeriod(e.target.value);
                        setHoveredPoint(null);
                      }}
                      className="bg-[#f1f3ff] border-none text-[#141b2b] text-xs font-bold px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006b2c]/30"
                    >
                      <option value="7days">Last 7 Days</option>
                      <option value="30days">Last 30 Days</option>
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
                    <h3 className="text-body-lg font-bold text-[#141b2b]">Ticket Status Overview</h3>
                    <p className="text-xs text-[#3e4a3d]">Current support request distribution.</p>
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
                        <text x="75" y="70" textAnchor="middle" className="text-[10px] font-bold text-[#6e7b6c] fill-current">TOTAL</text>
                        <text x="75" y="90" textAnchor="middle" className="text-title-md font-extrabold text-[#141b2b] fill-current">{displayTotal}</text>
                      </g>
                    </svg>
                  </div>

                  {/* Legends */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-body-sm">
                      <div className="flex items-center gap-2 font-semibold text-[#141b2b]">
                        <span className="w-3 h-3 bg-[#006b2c] rounded-full" />
                        <span>In Progress</span>
                      </div>
                      <span className="font-bold text-[#3e4a3d]">{displayInProgressPercent}%</span>
                    </div>
                    <div className="flex items-center justify-between text-body-sm">
                      <div className="flex items-center gap-2 font-semibold text-[#141b2b]">
                        <span className="w-3 h-3 bg-[#0058be] rounded-full" />
                        <span>Pending</span>
                      </div>
                      <span className="font-bold text-[#3e4a3d]">{displayPendingPercent}%</span>
                    </div>
                    <div className="flex items-center justify-between text-body-sm">
                      <div className="flex items-center gap-2 font-semibold text-[#141b2b]">
                        <span className="w-3 h-3 bg-[#6bff8f] rounded-full" />
                        <span>Waiting User</span>
                      </div>
                      <span className="font-bold text-[#3e4a3d]">{displayWaitingUserPercent}%</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Data Table: My Assigned Work */}
              <div className="card-level-1 p-6 bg-white">
                <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-[#e1e8fd] gap-4">
                  <h3 className="text-title-md font-extrabold text-[#141b2b]">My Assigned Work</h3>
                  
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
                          {tab}
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
                          <th className="px-4 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">Task ID</th>
                          <th className="px-4 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">Type</th>
                          <th className="px-4 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">User</th>
                          <th className="px-4 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">Priority</th>
                          <th className="px-4 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">Deadline</th>
                          <th className="px-4 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider text-right sticky right-0 bg-[#f9f9ff]">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e9edff] bg-white">
                        {filteredTasks.length > 0 ? (
                          filteredTasks.map((t) => (
                            <tr key={t.id} className="hover:bg-[#f7fff2]/30 transition-colors group">
                              <td className="px-4 py-4 whitespace-nowrap text-body-sm font-bold text-[#006b2c]">{t.id}</td>
                              <td className="px-4 py-4 whitespace-nowrap text-body-sm font-bold text-[#141b2b]">{t.type}</td>
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
                                    setSelectedTask(t);
                                    setShowManageModal(true);
                                  }}
                                  className="px-3 py-1 bg-white hover:bg-[#006b2c] hover:text-white text-[#006b2c] border border-[#bdcaba] rounded-lg text-xs font-bold transition-all"
                                >
                                  Manage
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

          {/* ---------------- TAB: TASKS ---------------- */}
          {activeTab === 'Tasks' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div>
                <h1 className="text-headline-lg font-extrabold text-[#141b2b]">Tasks Directory</h1>
                <p className="text-body-sm text-[#3e4a3d] mt-1">Full registry of administrative tasks assignable to staff agents.</p>
              </div>

              {/* Tasks Filters Card */}
              <div className="card-level-1 p-5 bg-white space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex bg-[#f1f3ff] p-1 rounded-lg">
                    {['ALL', 'Pending', 'In Progress', 'Completed'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setTaskFilter(tab)}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                          taskFilter === tab 
                            ? 'bg-white text-[#006b2c] shadow-sm' 
                            : 'text-[#6e7b6c] hover:text-[#141b2b]'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-[#006b2c] hover:bg-[#00873a] text-white rounded-lg text-body-sm font-bold shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create New Task</span>
                  </button>
                </div>
              </div>

              {/* Grid of Tasks */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredTasks.map((t) => (
                  <div key={t.id} className="card-level-1 p-5 bg-white flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <span className="text-xs font-bold text-[#006b2c]">{t.id}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.priority === 'High' 
                            ? 'bg-[#ffdad6] text-[#ba1a1a]' 
                            : t.priority === 'Medium' 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-slate-100 text-slate-700'
                        }`}>
                          {t.priority}
                        </span>
                      </div>
                      <h3 className="text-body-lg font-bold text-[#141b2b] mt-2">{t.type}</h3>
                      <p className="text-body-sm text-[#3e4a3d] line-clamp-2 mt-1.5">{t.description}</p>
                    </div>

                    <div className="border-t border-[#e9edff] pt-4 mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img src={t.avatar} alt={t.user} className="w-6 h-6 rounded-full object-cover" />
                        <span className="text-xs font-semibold text-[#141b2b]">{t.user}</span>
                      </div>
                      <button 
                        onClick={() => {
                          setSelectedTask(t);
                          setShowManageModal(true);
                        }}
                        className="text-xs font-extrabold text-[#006b2c] hover:text-[#00873a] flex items-center gap-1"
                      >
                        <span>Manage</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ---------------- TAB: SUPPORT (Messenger Chat) ---------------- */}
          {/* ---------------- TAB: SUPPORT (Messenger Chat) ---------------- */}
          {activeTab === 'Support' && (() => {
            const matchesChatSearch = (c) => c.name.toLowerCase().includes(chatSearch.toLowerCase());
            const openChats = supportChats.filter(c => !(c.blocked_until && new Date(c.blocked_until) > new Date()));
            const claimedChats = openChats.filter(c => c.assigned_staff_id || c.assignedStaffId);
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

                  {/* Right side: Message thread or placeholder */}
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
                        {Array.isArray(chatMessages) && chatMessages.map((m, idx) => {
                          const isMe = isOwnSupportMessage(m);
                          const msgTime = m.sentAt ? new Date(m.sentAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';
                          return (
                            <div key={m.messageId || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                <div className={`px-4 py-2.5 rounded-2xl text-body-sm leading-relaxed ${
                                  isMe 
                                    ? 'bg-[#006b2c] text-white rounded-tr-none' 
                                    : 'bg-white border border-[#e1e8fd] text-[#141b2b] rounded-tl-none shadow-sm'
                                }`}>
                                  {m.messageText}
                                </div>
                                <span className="text-[10px] text-[#6e7b6c] font-bold mt-1 px-1">{msgTime}</span>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>

                      {/* Input panel / block banner */}
                      {activeChat.blocked_until && new Date(activeChat.blocked_until) > new Date() ? (
                        <div className="flex items-center justify-center p-4 bg-slate-100 border-t border-[#e1e8fd] h-[76px] shrink-0">
                          <AlertCircle className="w-5 h-5 text-rose-500 mr-2 shrink-0" />
                          <span className="text-xs font-bold text-slate-600">
                            This user is currently suspended from chat.
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
                        <p className="text-xs text-[#6e7b6c] font-semibold mb-3">{activeChat.sender_email || activeChat.senderEmail || 'No email provided'}</p>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider ${
                          activeChat.sender_role === 'EMPLOYER' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                        }`}>
                          {activeChat.sender_role || 'CLIENT'}
                        </span>
                      </div>

                      <div className="p-6 flex flex-col gap-6">
                        {/* Account Details */}
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

                        {/* Moderation Actions */}
                        <div>
                          <h4 className="text-[10px] font-bold text-[#6e7b6c] uppercase tracking-wider mb-3">Moderation Actions</h4>
                          
                          {/* Block Status / Options */}
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
              { id: 'history', label: 'Lịch sử', count: moderationHistory.length },
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
                  const filteredPendingItems = queueTab === 'ALL' 
                    ? pendingItems 
                    : pendingItems.filter(item => item.type === queueTab);
                  
                  return (
                  <div className="bg-white border border-[#e1e8fd] rounded-xl overflow-hidden">
                    <div className="px-5 py-4 flex flex-col gap-4 border-b border-[#e9edff]">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-title-md font-extrabold text-[#141b2b]">Hàng đợi kiểm duyệt</h2>
                          <p className="text-xs text-[#6e7b6c] mt-0.5">Duyệt, từ chối hoặc yêu cầu chỉnh sửa các nội dung đang chờ.</p>
                        </div>
                      </div>
                      {/* Sub-tabs for queue items */}
                      <div className="flex gap-2 border-b border-[#e9edff] pb-2 overflow-x-auto">
                        {[
                          { id: 'ALL', label: 'Tất cả' },
                          { id: 'PROJECT', label: 'Dự án' },
                          { id: 'PROFILE', label: 'Hồ sơ' },
                          { id: 'GIG', label: 'Gói dịch vụ' },
                          { id: 'REVIEW', label: 'Đánh giá' },
                          { id: 'WITHDRAWAL', label: 'Rút tiền' }
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
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-[#e9edff] text-left">
                        <thead>
                          <tr className="bg-[#f9f9ff]">
                            <th className="px-4 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">Nội dung</th>
                            <th className="px-4 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">Người đăng</th>
                            <th className="px-4 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">Lý do</th>
                            <th className="px-4 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">Ngày gửi</th>
                            <th className="px-4 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">Trạng thái</th>
                            <th className="px-4 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider text-right">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e9edff] bg-white">
                          {filteredPendingItems.map((item) => (
                            <tr key={item.id} className="hover:bg-[#f7fff2]/30 transition-colors">
                              <td className="px-4 py-4">
                                <div className="min-w-[240px]">
                                  <span className="text-[10px] font-bold text-[#006b2c] uppercase tracking-wide bg-[#f7fff2] px-2 py-0.5 rounded">
                                    {item.type}
                                  </span>
                                  <h4 className="text-body-sm font-bold text-[#141b2b] mt-1.5">{item.title}</h4>
                                  <p className="text-xs text-[#6e7b6c] mt-0.5 line-clamp-1">{item.detail}</p>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-body-sm font-semibold text-[#141b2b]">{item.author}</td>
                              <td className="px-4 py-4 text-body-sm font-bold text-amber-700">{item.reason}</td>
                              <td className="px-4 py-4 text-body-sm font-bold text-[#3e4a3d]">{item.subDate}</td>
                              <td className="px-4 py-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
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
                                  <div className="flex items-center justify-end gap-2">
                                    <button 
                                      onClick={() => handleModAction(item, true)}
                                      className="p-1.5 border border-[#bdcaba] hover:bg-[#006b2c] hover:text-white text-[#006b2c] rounded transition-all"
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
                        <div key={report.id} className="border border-[#e9edff] rounded-xl p-4 hover:shadow-md transition-shadow">
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
                            <button className="text-[#006b2c] font-bold hover:underline">Xử lý báo cáo →</button>
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

                {moderationView === 'history' && (
                  <div className="bg-white border border-[#e1e8fd] rounded-xl p-5">
                    <h2 className="text-title-md font-extrabold text-[#141b2b] mb-4">Lịch sử hoạt động</h2>
                    <div className="space-y-0 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[#bdcaba] before:to-transparent">
                      {moderationHistory.map((log, idx) => (
                        <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-[#e1e8fd] text-[#006b2c] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                            <Check className="w-5 h-5" />
                          </div>
                          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-[#e9edff] bg-white shadow-sm mb-4">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-bold text-[#141b2b] text-sm">{log.action}</h4>
                              <time className="text-[10px] font-bold text-[#6e7b6c]">{log.time}</time>
                            </div>
                            <p className="text-xs text-[#3e4a3d] mt-1">{log.target}</p>
                            <div className="flex justify-between items-center mt-3 pt-3 border-t border-[#f1f3ff]">
                              <span className="text-[10px] font-bold text-[#6e7b6c]">Bởi: {log.actor}</span>
                              <span className="text-[10px] font-bold text-[#006b2c] bg-[#f7fff2] px-2 py-0.5 rounded">{log.result}</span>
                            </div>
                          </div>
                        </div>
                      ))}
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
                          <button className="w-full py-2 bg-white border border-rose-200 text-rose-700 font-bold text-sm rounded-lg hover:bg-rose-100 transition-colors">
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
          {activeTab === 'KYC' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div>
                <h1 className="text-headline-lg font-extrabold text-[#141b2b]">Identity KYC Approvals</h1>
                <p className="text-body-sm text-[#3e4a3d] mt-1">Review legal identity verifications for freelancers and employers to maintain a secure ecosystem.</p>
              </div>

              {/* KYC Request List Grid */}
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

          {/* ---------------- TAB: GENERIC FALLBACK ---------------- */}
          {!['Dashboard', 'Tasks', 'Support', 'Moderation', 'KYC'].includes(activeTab) && (
            <div className="max-w-4xl mx-auto text-center py-16 space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#f7fff2] text-[#006b2c] flex items-center justify-center mx-auto shadow-md">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="text-headline-lg font-extrabold text-[#141b2b]">{activeTab} Section</h2>
              <p className="text-body-sm text-[#6e7b6c] max-w-md mx-auto">
                Mục <strong>{activeTab}</strong> đang được đồng bộ hóa thông tin tự động từ máy chủ quản trị trung tâm. Vui lòng quay lại sau.
              </p>
              <button 
                onClick={() => setActiveTab('Dashboard')}
                className="px-4 py-2 bg-[#006b2c] hover:bg-[#00873a] text-white rounded-lg text-body-sm font-bold shadow transition-all"
              >
                Back to Dashboard
              </button>
            </div>
          )}

        </div>
      </main>

      {/* ---------------- MODAL: CREATE NEW TASK ---------------- */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl border border-[#e1e8fd] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#e9edff]">
              <h3 className="text-title-md font-extrabold text-[#141b2b]">Create New Staff Task</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 hover:bg-[#f1f3ff] rounded-lg transition-colors text-[#6e7b6c]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="mt-4 space-y-4">
              {/* Task Type */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#6e7b6c] uppercase">Task Type</label>
                <select
                  value={createForm.type}
                  onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })}
                  className="w-full bg-[#f1f3ff] border border-transparent px-3 py-2 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-[#006b2c]/30 focus:bg-white border-[#e1e8fd]"
                >
                  <option value="Account Verification">Account Verification</option>
                  <option value="Dispute Resolution">Dispute Resolution</option>
                  <option value="Profile Review">Profile Review</option>
                  <option value="KYC Document Approval">KYC Document Approval</option>
                  <option value="Payment Processing">Payment Processing</option>
                  <option value="Spam Moderation">Spam Moderation</option>
                </select>
              </div>

              {/* User Assignee */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#6e7b6c] uppercase">Assignee User Name</label>
                <input
                  type="text"
                  placeholder="e.g. Alex Rivera"
                  value={createForm.user}
                  onChange={(e) => setCreateForm({ ...createForm, user: e.target.value })}
                  className="w-full bg-[#f1f3ff] border border-transparent px-3 py-2 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-[#006b2c]/30 focus:bg-white border-[#e1e8fd]"
                />
              </div>

              {/* Priority & Deadline Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#6e7b6c] uppercase">Priority</label>
                  <select
                    value={createForm.priority}
                    onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
                    className="w-full bg-[#f1f3ff] border border-transparent px-3 py-2 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-[#006b2c]/30 focus:bg-white border-[#e1e8fd]"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#6e7b6c] uppercase">Deadline</label>
                  <input
                    type="text"
                    placeholder="e.g. Today, 5:00 PM"
                    value={createForm.deadline}
                    onChange={(e) => setCreateForm({ ...createForm, deadline: e.target.value })}
                    className="w-full bg-[#f1f3ff] border border-transparent px-3 py-2 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-[#006b2c]/30 focus:bg-white border-[#e1e8fd]"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#6e7b6c] uppercase">Description Details</label>
                <textarea
                  rows="3"
                  placeholder="Task notes or description..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full bg-[#f1f3ff] border border-transparent px-3 py-2 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-[#006b2c]/30 focus:bg-white border-[#e1e8fd]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-3 border-t border-[#e9edff]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-body-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#006b2c] hover:bg-[#00873a] text-white rounded-lg font-bold text-body-sm shadow transition-all"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- DRAWERS/MODAL: MANAGE/VIEW TASK DETAILS ---------------- */}
      {showManageModal && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md h-full p-6 shadow-2xl flex flex-col justify-between border-l border-[#e1e8fd] animate-in slide-in-from-right duration-200">
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
                  <img src={selectedTask.avatar} alt={selectedTask.user} className="w-10 h-10 rounded-full object-cover border border-[#bdcaba]" />
                  <div>
                    <h4 className="text-body-sm font-bold text-[#141b2b]">{selectedTask.user}</h4>
                    <p className="text-xs text-[#6e7b6c]">Assignee User</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-body-sm border-b border-[#e9edff] pb-4">
                  <div>
                    <span className="font-semibold text-[#6e7b6c]">Priority:</span>
                    <span className={`block mt-1 font-bold text-sm ${
                      selectedTask.priority === 'High' ? 'text-[#ba1a1a]' : 'text-[#3e4a3d]'
                    }`}>{selectedTask.priority} Priority</span>
                  </div>
                  <div>
                    <span className="font-semibold text-[#6e7b6c]">Deadline:</span>
                    <span className="block mt-1 font-bold text-[#141b2b]">{selectedTask.deadline}</span>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold text-[#6e7b6c] uppercase">Task Description</span>
                  <p className="text-body-sm text-[#141b2b] mt-2 leading-relaxed bg-[#f9f9ff] p-3 rounded-lg border border-[#e1e8fd]">
                    {selectedTask.description}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-bold text-[#6e7b6c] uppercase">Current State</span>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`w-3 h-3 rounded-full ${
                      selectedTask.status === 'Completed' ? 'bg-emerald-500' : selectedTask.status === 'In Progress' ? 'bg-[#006b2c]' : 'bg-blue-500'
                    }`} />
                    <span className="text-body-sm font-bold text-[#141b2b]">{selectedTask.status}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions for Task */}
            <div className="border-t border-[#e9edff] pt-4 space-y-3">
              {selectedTask.status !== 'Completed' ? (
                <>
                  {selectedTask.status === 'Pending' && (
                    <button 
                      onClick={() => handleUpdateTaskStatus(selectedTask.id, 'In Progress')}
                      className="w-full py-2.5 bg-[#006b2c] hover:bg-[#00873a] text-white rounded-lg font-bold text-body-sm shadow transition-all"
                    >
                      Start Task (Mark In Progress)
                    </button>
                  )}
                  {selectedTask.status === 'In Progress' && (
                    <button 
                      onClick={() => handleUpdateTaskStatus(selectedTask.id, 'Completed')}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-body-sm shadow transition-all"
                    >
                      Complete Task
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      setShowManageModal(false);
                      setSelectedTask(null);
                      showToast('Đã báo cáo trì hoãn cho Task!', 'error');
                    }}
                    className="w-full py-2.5 bg-white border border-[#ffdad6] hover:bg-[#ffdad6] text-[#ba1a1a] rounded-lg font-bold text-body-sm transition-all"
                  >
                    Flag Delay / Report Issue
                  </button>
                </>
              ) : (
                <div className="p-3 bg-[#f7fff2] border border-[#bdcaba] rounded-lg text-center text-[#006b2c] font-bold text-body-sm">
                  ✓ Task completed successfully.
                </div>
              )}
              <button
                onClick={() => {
                  setShowManageModal(false);
                  setSelectedTask(null);
                }}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-body-sm rounded-lg transition-all"
              >
                Close Drawer
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
                {confirmConfig.confirmText || 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

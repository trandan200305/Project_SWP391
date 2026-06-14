import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, CheckSquare, MessageSquare, ShieldAlert, UserCheck, 
  BadgeDollarSign, Gavel, FileText, Bell, Settings, Search, HelpCircle, 
  Grid, Plus, ArrowUpRight, ArrowDownRight, MoreVertical, Filter, 
  Check, X, Send, Eye, ShieldCheck, AlertCircle, Clock, ChevronRight,
  TrendingUp, Activity, User, LogOut, CheckCircle2, AlertTriangle, Paperclip,
  Users, UserPlus, Move, Zap, Calendar, Download
} from 'lucide-react';
import { adminApi } from '../api/adminApi.js';
import { messengerApi } from '../../messenger/api/messengerApi.js';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export default function ManagerDashboardPage({ user, onNavigateToHome }) {
  // Styles & Brand Settings
  const brandName = "FelanPro";
  const brandSub = "Manager Console";
  const currentRole = "MANAGER";
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
  
  // Filters & query states
  const [searchQuery, setSearchQuery] = useState('');
  const [taskFilter, setTaskFilter] = useState('ALL');
  const [chartPeriod, setChartPeriod] = useState('7days');
  const [hoveredPoint, setHoveredPoint] = useState(null);
  
  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showManageModal, setShowManageModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  
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
  const [queueTab, setQueueTab] = useState('ALL');
  const [userGrowthTrend, setUserGrowthTrend] = useState([]);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const stompClientRef = useRef(null);
  const subscriptionRef = useRef(null);
  const selectedChatIdRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Manager Specific states
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

  // Forms states
  const [createForm, setCreateForm] = useState({
    taskType: 'KYC_VERIFICATION',
    title: '',
    requiredDepartments: 'CS',
    description: '',
    referenceId: ''
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
      console.log('[STOMP] Connected (Manager)', frame);
      setSocketConnected(true);

      // Subscribe to global admin topic — handles ALL ticket messages in real time
      client.subscribe('/topic/admin', (message) => {
        const received = JSON.parse(message.body);
        console.log('[STOMP] /topic/admin (Manager)', received);

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

      // Add Mock data for Gigs and Reviews
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

  // Mount logic
  useEffect(() => {
    fetchStats();
    fetchTasks();
    fetchKycRequests();
    fetchModerationItems();
    fetchSupportChats();
    fetchTrends();
    fetchStaffAndDepartments();
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

  // Manager creates verification task
  const handleCreateTaskSubmit = (e) => {
    e.preventDefault();
    if (!createForm.title.trim()) return;

    const payload = {
      taskType: createForm.taskType,
      referenceId: parseInt(createForm.referenceId || "1", 10),
      title: createForm.title.trim(),
      description: createForm.description.trim(),
      requiredDepartments: createForm.requiredDepartments
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
            referenceId: ''
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

  // Manager invites staff
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

  // Manager transfers staff
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

  // Task approval signoff
  const handleUpdateTaskStatus = (id, newStatus) => {
    if (!selectedTask) return;
    
    const reqDepts = selectedTask.requiredDepartments?.split(',') || ['CS'];
    const deptCode = reqDepts[0] || 'CS';

    setIsLoading(true);
    adminApi.submitTaskSignoff(selectedTask.taskId, {
      status: newStatus === 'Completed' ? 'APPROVED' : 'PENDING',
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

  // Support chat submit
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
  const countOverdue = tasks.filter(t => t.status === 'In Progress').length;

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

  // Smooth curve path
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
          <div className="p-6 border-b border-[#e9edff]">
            <span className="font-sans text-xl font-extrabold tracking-tight text-[#006b2c] block">
              {brandName}
            </span>
            <p className="text-[10px] text-[#6e7b6c] font-bold uppercase tracking-wider mt-0.5">
              ADMIN CONSOLE
            </p>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-hidden">
            <p className="text-[10px] font-bold text-[#6e7b6c] uppercase tracking-wider px-3 mb-2">Workspace</p>
            <nav className="space-y-1">
              {[
                { name: 'Dashboard', icon: LayoutDashboard },
                { name: 'Tasks', icon: CheckSquare },
                { name: 'Staff Management', icon: Users },
                { name: 'Moderation', icon: Gavel, badge: moderationItems.filter(i => i.status === 'Pending').length },
                { name: 'KYC', icon: UserCheck, badge: kycRequests.filter(r => r.status === 'Pending').length },
                { name: 'Finance', icon: BadgeDollarSign },
                { name: 'Disputes', icon: ShieldAlert },
                { name: 'Reports', icon: FileText },
                { name: 'Audit Logs', icon: Activity },
                { name: 'Notifications', icon: Bell },
                { name: 'Settings', icon: Settings },
              ].map((item) => {
                const IconComp = item.icon;
                const isActive = activeTab === item.name;
                return (
                  <button
                    key={item.name}
                    onClick={() => setActiveTab(item.name)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-body-sm font-semibold transition-all duration-200 group relative ${
                      isActive 
                        ? 'bg-[#f7fff2] text-[#006b2c]' 
                        : 'text-[#3e4a3d] hover:bg-[#f1f3ff] hover:text-[#141b2b]'
                    }`}
                  >
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
        
        {/* HEADER */}
        <header className="h-[64px] bg-white border-b border-[#e1e8fd] px-6 flex items-center justify-between shrink-0 z-10">
          <div className="w-80 relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-[#6e7b6c]">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search tasks, staff, or cases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#f1f3ff] border-none text-[#141b2b] placeholder-[#6e7b6c] pl-10 pr-4 py-2 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-[#006b2c]/30 focus:bg-white border border-transparent transition-all"
            />
          </div>

          <div className="flex items-center gap-5">
            <div className="flex items-center gap-3">
              <button className="p-2 text-[#6e7b6c] hover:text-[#141b2b] hover:bg-[#f1f3ff] rounded-lg transition-colors relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ba1a1a] rounded-full border border-white" />
              </button>
              <button className="p-2 text-[#6e7b6c] hover:text-[#141b2b] hover:bg-[#f1f3ff] rounded-lg transition-colors">
                <HelpCircle className="w-5 h-5" />
              </button>
              <button className="p-2 text-[#6e7b6c] hover:text-[#141b2b] hover:bg-[#f1f3ff] rounded-lg transition-colors">
                <Grid className="w-5 h-5" />
              </button>
            </div>

            <div className="h-8 w-[1px] bg-[#e1e8fd]" />

            <div className="flex items-center gap-3">
              <div className="flex flex-col text-right">
                <span className="text-body-sm font-extrabold text-[#141b2b] leading-tight">
                  ManagerStaff
                </span>
                <span className="text-[10px] font-bold text-[#6e7b6c]">
                  Ops Dept • General
                </span>
              </div>
              <img
                src={user?.avatar || "https://ui-avatars.com/api/?name=ManagerStaff&background=006b2c&color=fff"}
                alt="Avatar"
                className="w-10 h-10 rounded-full border border-[#bdcaba] object-cover"
              />
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
            <div className="space-y-6 max-w-7xl mx-auto pb-10">
              
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-headline-lg text-[#141b2b] font-extrabold tracking-tight">Operational Overview</h1>
                  <p className="text-body-sm text-[#6e7b6c] mt-1">Real-time performance monitoring for Department: General</p>
                </div>
                <div className="flex items-center gap-3">
                  <button className="px-4 py-2 bg-white border border-[#e1e8fd] text-[#141b2b] rounded-lg text-body-sm font-bold shadow-sm hover:bg-[#f1f3ff] transition-all flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#6e7b6c]" />
                    <span>Last 24 Hours</span>
                    <ChevronRight className="w-3.5 h-3.5 rotate-90 text-[#6e7b6c]" />
                  </button>
                  <button className="px-4 py-2 bg-[#006b2c] hover:bg-[#00873a] text-white rounded-lg text-body-sm font-bold shadow-sm transition-all flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    <span>Export Report</span>
                  </button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                
                {/* Metric 1: TOTAL STAFF */}
                <div className="bg-white border border-[#e1e8fd] p-5 rounded-xl flex flex-col justify-between min-h-[140px] card-level-1">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-lg bg-[#f7fff2] text-[#006b2c] flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-[#006b2c] flex items-center gap-0.5">
                      +2 this week
                    </span>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs font-bold text-[#6e7b6c] uppercase tracking-wider">Total Staff</p>
                    <h2 className="text-3xl font-extrabold text-[#141b2b] mt-1">{staffList.length}</h2>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-[#f1f3ff] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#006b2c] h-full" style={{ width: `${(staffList.filter(s => s.status === 'ACTIVE').length / (staffList.length || 1)) * 100}%` }}></div>
                    </div>
                    <p className="text-[10px] text-[#6e7b6c] font-semibold mt-1">
                      {staffList.filter(s => s.status === 'ACTIVE').length} Currently Active
                    </p>
                  </div>
                </div>

                {/* Metric 2: PENDING CASES */}
                <div className="bg-white border border-[#e1e8fd] p-5 rounded-xl flex flex-col justify-between min-h-[140px] card-level-1">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-lg bg-[#f1f3ff] text-[#0058be] flex items-center justify-center">
                      <CheckSquare className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-[#ba1a1a] flex items-center gap-0.5">
                      -4% vs yesterday
                    </span>
                  </div>
                  <div className="mt-2 flex justify-between items-end">
                    <div>
                      <p className="text-xs font-bold text-[#6e7b6c] uppercase tracking-wider">Pending Cases</p>
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

                {/* Metric 3: ESCALATED */}
                <div className="bg-white border border-[#e1e8fd] p-5 rounded-xl flex flex-col justify-between min-h-[140px] card-level-1">
                  <div className="w-10 h-10 rounded-lg bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div className="mt-2">
                    <p className="text-xs font-bold text-[#6e7b6c] uppercase tracking-wider">Escalated</p>
                    <h2 className="text-3xl font-extrabold text-[#141b2b] mt-1">
                      {tasks.filter(t => t.priority === 'High' && t.status !== 'Completed').length}
                    </h2>
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-xs font-bold text-[#ba1a1a]">
                    <TrendingUp className="w-3.5 h-3.5 text-[#ba1a1a]" />
                    <span>Urgent</span>
                  </div>
                </div>

                {/* Metric 4: AVG RESOLUTION */}
                <div className="bg-white border border-[#e1e8fd] p-5 rounded-xl flex flex-col justify-between min-h-[140px] card-level-1">
                  <div className="w-10 h-10 rounded-lg bg-[#f7fff2] text-[#006b2c] flex items-center justify-center">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div className="mt-2">
                    <p className="text-xs font-bold text-[#6e7b6c] uppercase tracking-wider">Avg Resolution</p>
                    <h2 className="text-3xl font-extrabold text-[#141b2b] mt-1">2.4h</h2>
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-xs font-bold text-[#006b2c]">
                    <Zap className="w-3.5 h-3.5 text-[#006b2c]" />
                    <span>Optimal</span>
                  </div>
                </div>

              </div>

              {/* 2 Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Staff Performance Bar Chart */}
                <div className="lg:col-span-2 bg-white border border-[#e1e8fd] p-6 rounded-xl min-h-[320px] flex flex-col justify-between card-level-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-body-lg font-bold text-[#141b2b]">Staff Performance</h3>
                      <p className="text-xs text-[#6e7b6c]">Average resolved tickets and cases count by team.</p>
                    </div>
                    <button className="p-1.5 hover:bg-[#f1f3ff] rounded-lg text-[#6e7b6c] transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex-1 mt-6 flex items-center justify-center">
                    <svg width="100%" height="200" viewBox="0 0 400 200" className="overflow-visible select-none">
                      {/* Grid lines */}
                      <line x1="40" y1="20" x2="380" y2="20" stroke="#f1f3ff" strokeWidth="1" />
                      <line x1="40" y1="60" x2="380" y2="60" stroke="#f1f3ff" strokeWidth="1" />
                      <line x1="40" y1="100" x2="380" y2="100" stroke="#f1f3ff" strokeWidth="1" />
                      <line x1="40" y1="140" x2="380" y2="140" stroke="#f1f3ff" strokeWidth="1" />
                      <line x1="40" y1="170" x2="380" y2="170" stroke="#e1e8fd" strokeWidth="1.5" />

                      {/* Y axis labels */}
                      <text x="30" y="24" textAnchor="end" className="text-[9px] fill-[#6e7b6c] font-bold">100%</text>
                      <text x="30" y="64" textAnchor="end" className="text-[9px] fill-[#6e7b6c] font-bold">75%</text>
                      <text x="30" y="104" textAnchor="end" className="text-[9px] fill-[#6e7b6c] font-bold">50%</text>
                      <text x="30" y="144" textAnchor="end" className="text-[9px] fill-[#6e7b6c] font-bold">25%</text>

                      {/* Bars (DEV: 20, OPS: 130, SALES: 60, HR: 40, SUP: 100) */}
                      {/* DEV */}
                      <rect x="65" y="130" width="24" height="40" rx="4" fill="url(#bar-grad-1)" />
                      {/* OPS */}
                      <rect x="130" y="40" width="24" height="130" rx="4" fill="url(#bar-grad-1)" />
                      {/* SALES */}
                      <rect x="195" y="100" width="24" height="70" rx="4" fill="url(#bar-grad-1)" />
                      {/* HR */}
                      <rect x="260" y="120" width="24" height="50" rx="4" fill="url(#bar-grad-1)" />
                      {/* SUP */}
                      <rect x="325" y="60" width="24" height="110" rx="4" fill="url(#bar-grad-2)" />

                      {/* X axis labels */}
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

                {/* Department Workload */}
                <div className="bg-white border border-[#e1e8fd] p-6 rounded-xl flex flex-col justify-between min-h-[320px] card-level-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-body-lg font-bold text-[#141b2b]">Department Workload</h3>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-[#6e7b6c]">
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 bg-[#006b2c] rounded-full" /> Capacity
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 bg-[#f1f3ff] rounded-full" /> Remaining
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4 mt-4 flex-1 flex flex-col justify-around">
                    {/* Core Operations */}
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-[#141b2b] mb-1.5">
                        <span>Core Operations</span>
                        <span>88%</span>
                      </div>
                      <div className="w-full bg-[#f1f3ff] h-2.5 rounded-full overflow-hidden">
                        <div className="bg-[#006b2c] h-full" style={{ width: '88%' }} />
                      </div>
                    </div>

                    {/* Quality Assurance */}
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-[#141b2b] mb-1.5">
                        <span>Quality Assurance</span>
                        <span>64%</span>
                      </div>
                      <div className="w-full bg-[#f1f3ff] h-2.5 rounded-full overflow-hidden">
                        <div className="bg-[#006b2c] h-full" style={{ width: '64%' }} />
                      </div>
                    </div>

                    {/* Customer Support */}
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-[#141b2b] mb-1.5">
                        <span>Customer Support</span>
                        <span className="text-[#ba1a1a]">92%</span>
                      </div>
                      <div className="w-full bg-[#f1f3ff] h-2.5 rounded-full overflow-hidden">
                        <div className="bg-[#ba1a1a] h-full" style={{ width: '92%' }} />
                      </div>
                    </div>

                    {/* Logistics */}
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-[#141b2b] mb-1.5">
                        <span>Logistics</span>
                        <span>45%</span>
                      </div>
                      <div className="w-full bg-[#f1f3ff] h-2.5 rounded-full overflow-hidden">
                        <div className="bg-[#006b2c] h-full" style={{ width: '45%' }} />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Bottom Row - Staff Workload & Recent Escalations */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Staff Workload Table */}
                <div className="bg-white border border-[#e1e8fd] p-6 rounded-xl lg:col-span-2 card-level-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-4 border-b border-[#e1e8fd]">
                      <h3 className="text-body-lg font-bold text-[#141b2b]">Staff Workload</h3>
                      <button 
                        onClick={() => setActiveTab('Staff Management')}
                        className="text-xs font-bold text-[#006b2c] hover:underline"
                      >
                        View Directory
                      </button>
                    </div>

                    <div className="overflow-x-auto mt-4">
                      <table className="min-w-full divide-y divide-[#e9edff] text-left">
                        <thead>
                          <tr>
                            <th className="pb-3 text-[11px] font-bold text-[#6e7b6c] uppercase tracking-wider">Staff Member</th>
                            <th className="pb-3 text-[11px] font-bold text-[#6e7b6c] uppercase tracking-wider text-center">Active Tasks</th>
                            <th className="pb-3 text-[11px] font-bold text-[#6e7b6c] uppercase tracking-wider">Load Progress</th>
                            <th className="pb-3 text-[11px] font-bold text-[#6e7b6c] uppercase tracking-wider text-right">Efficiency</th>
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

                {/* Recent Escalations */}
                <div className="bg-white border border-[#e1e8fd] p-6 rounded-xl flex flex-col justify-between relative card-level-1">
                  <div>
                    <h3 className="text-body-lg font-bold text-[#141b2b] pb-4 border-b border-[#e1e8fd]">Recent Escalations</h3>
                    
                    <div className="space-y-4 mt-4">
                      {/* Escalation 1 */}
                      <div className="bg-[#f9f9ff] border border-[#e1e8fd] p-4 rounded-xl relative">
                        <div className="flex items-center justify-between">
                          <span className="bg-[#ba1a1a] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
                            Urgent
                          </span>
                          <span className="text-[10px] font-bold text-[#6e7b6c]">14:22 PM</span>
                        </div>
                        <h4 className="text-body-sm font-bold text-[#141b2b] mt-2">Payment Dispute #8821</h4>
                        <p className="text-xs text-[#3e4a3d] mt-1 line-clamp-2">
                          Merchant claims funds were not received after successful milestone delivery...
                        </p>
                        <div className="flex items-center justify-between mt-3.5">
                          <div className="flex -space-x-1.5">
                            <img src="https://ui-avatars.com/api/?name=Client&background=0058be&color=fff" alt="User 1" className="w-5.5 h-5.5 rounded-full border border-white" />
                            <img src="https://ui-avatars.com/api/?name=Lancer&background=006b2c&color=fff" alt="User 2" className="w-5.5 h-5.5 rounded-full border border-white" />
                          </div>
                          <button 
                            onClick={() => {
                              setActiveTab('Disputes');
                              showToast('Navigating to dispute details...', 'success');
                            }}
                            className="text-xs font-bold text-[#006b2c] hover:underline"
                          >
                            Take Action
                          </button>
                        </div>
                      </div>

                      {/* Escalation 2 */}
                      <div className="bg-[#f9f9ff] border border-[#e1e8fd] p-4 rounded-xl relative">
                        <div className="flex items-center justify-between">
                          <span className="bg-[#293040] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
                            Medium
                          </span>
                          <span className="text-[10px] font-bold text-[#6e7b6c]">11:05 AM</span>
                        </div>
                        <h4 className="text-body-sm font-bold text-[#141b2b] mt-2">Policy Violation #7742</h4>
                        <p className="text-xs text-[#3e4a3d] mt-1 line-clamp-2">
                          User reported for multiple off-platform payment attempts in chat...
                        </p>
                        <div className="flex items-center justify-between mt-3.5">
                          <div className="flex">
                            <img src="https://ui-avatars.com/api/?name=User&background=bdcaba&color=000" alt="User 1" className="w-5.5 h-5.5 rounded-full border border-white" />
                          </div>
                          <button 
                            onClick={() => {
                              setActiveTab('Moderation');
                              showToast('Navigating to moderation queue...', 'success');
                            }}
                            className="text-xs font-bold text-[#006b2c] hover:underline"
                          >
                            Review Case
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Floating Plus Button */}
                  <button 
                    onClick={() => setShowCreateModal(true)}
                    className="absolute bottom-6 right-6 w-11 h-11 bg-[#006b2c] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#00873a] transition-all hover:scale-105 active:scale-95"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Blue Pending Approvals Banner */}
              <div className="bg-[#0058be] text-white p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 mt-6 shadow-md shadow-[#0058be]/10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="text-body-sm font-bold text-white block">
                      8 Approval Requests Pending
                    </span>
                    <p className="text-[11px] text-white/80 mt-0.5">
                      Budget adjustments and new staff onboarding require your signature.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setActiveTab('KYC');
                    showToast('Opening approval requests queue...', 'success');
                  }}
                  className="bg-white hover:bg-slate-50 text-[#0058be] font-bold text-xs px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
                >
                  Review Queue
                </button>
              </div>

            </div>
          )}

          {/* ---------------- TAB: TASKS ---------------- */}
          {activeTab === 'Tasks' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-headline-lg font-extrabold text-[#141b2b]">Tasks Directory</h1>
                  <p className="text-body-sm text-[#3e4a3d] mt-1">Full registry of administrative verification tasks in LancerPro.</p>
                </div>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-[#006b2c] hover:bg-[#00873a] text-white rounded-lg text-body-sm font-bold shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Task</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredTasks.map((t) => (
                  <div key={t.id} className="card-level-1 p-5 bg-white flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <span className="text-xs font-bold text-[#006b2c]">{t.id}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.priority === 'High' ? 'bg-[#ffdad6] text-[#ba1a1a]' : 'bg-amber-100 text-amber-800'
                        }`}>{t.priority}</span>
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

          {/* ---------------- TAB: STAFF MANAGEMENT ---------------- */}
          {activeTab === 'Staff Management' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-headline-lg font-extrabold text-[#141b2b]">Staff Registry</h1>
                  <p className="text-body-sm text-[#3e4a3d] mt-1">Manage and assign departments for staff members.</p>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowTransferModal(true)}
                    className="px-4 py-2 bg-white border border-[#e1e8fd] text-[#141b2b] rounded-lg text-body-sm font-bold shadow-sm hover:bg-[#f1f3ff] transition-all flex items-center gap-2"
                  >
                    <Move className="w-4 h-4" />
                    <span>Transfer Staff</span>
                  </button>
                  <button 
                    onClick={() => setShowInviteModal(true)}
                    className="px-4 py-2 bg-[#006b2c] hover:bg-[#00873a] text-white rounded-lg text-body-sm font-bold shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Invite Staff Member</span>
                  </button>
                </div>
              </div>

              {/* Staff Table */}
              <div className="card-level-1 p-6 bg-white">
                <table className="min-w-full divide-y divide-[#e9edff] text-left">
                  <thead>
                    <tr className="bg-[#f9f9ff]">
                      <th className="px-4 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">Staff ID</th>
                      <th className="px-4 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">Name</th>
                      <th className="px-4 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">Email</th>
                      <th className="px-4 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e9edff] bg-white">
                    {staffList.map((staff) => (
                      <tr key={staff.id || staff.staffId} className="hover:bg-[#f7fff2]/30 transition-colors">
                        <td className="px-4 py-4 text-body-sm font-bold text-[#006b2c]">#STF-{staff.id || staff.staffId}</td>
                        <td className="px-4 py-4 text-body-sm font-bold text-[#141b2b]">{staff.name || staff.fullName || 'CS Agent'}</td>
                        <td className="px-4 py-4 text-body-sm text-[#3e4a3d]">{staff.email}</td>
                        <td className="px-4 py-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#f7fff2] text-[#006b2c]">
                            ACTIVE
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

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
            const filteredPendingItems = queueTab === 'ALL' 
              ? pendingItems 
              : pendingItems.filter(item => item.type === queueTab);

            return (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div>
                <h1 className="text-headline-lg font-extrabold text-[#141b2b]">Hàng đợi kiểm duyệt</h1>
                <p className="text-body-sm text-[#3e4a3d] mt-1">Duyệt, từ chối hoặc yêu cầu chỉnh sửa các nội dung đang chờ.</p>
              </div>

              {/* Moderation Items Table */}
              <div className="card-level-1 bg-white overflow-hidden border border-[#e1e8fd] rounded-xl">
                <div className="px-6 py-4 flex gap-2 border-b border-[#e9edff] overflow-x-auto">
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
                <table className="min-w-full divide-y divide-[#e9edff] text-left">
                  <thead>
                    <tr className="bg-[#f9f9ff]">
                      <th className="px-4 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">Item Details</th>
                      <th className="px-4 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">Author</th>
                      <th className="px-4 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">Flag Reason</th>
                      <th className="px-4 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider text-right">Actions</th>
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
                            <h4 className="text-body-sm font-bold text-[#141b2b] mt-1.5">{item.title}</h4>
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
                          {item.status === 'Pending' ? (
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => handleModAction(item, false)}
                                className="p-1.5 border border-[#ffdad6] hover:bg-[#ffdad6] text-[#ba1a1a] rounded transition-all"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleModAction(item, true)}
                                className="p-1.5 border border-[#bdcaba] hover:bg-[#006b2c] hover:text-white text-[#006b2c] rounded transition-all"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-[#6e7b6c] font-bold">Processed</span>
                          )}
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
            </div>
          );})()}

          {/* ---------------- TAB: KYC ---------------- */}
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

        </div>
      </main>

      {/* ---------------- MODAL: CREATE NEW TASK ---------------- */}
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

              <div className="flex gap-3 pt-3 border-t border-[#e9edff]">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-2 rounded-lg bg-slate-100 text-slate-700 font-bold text-body-sm">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2 bg-[#006b2c] hover:bg-[#00873a] text-white rounded-lg font-bold text-body-sm shadow">
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- MODAL: INVITE STAFF MEMBER ---------------- */}
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

      {/* ---------------- MODAL: TRANSFER STAFF ---------------- */}
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

      {/* ---------------- DRAWERS: TASK DETAILS ---------------- */}
      {showManageModal && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md h-full p-6 shadow-2xl flex flex-col justify-between border-l border-[#e1e8fd] animate-in slide-in-from-right duration-200">
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
                <div className="flex items-center gap-3 bg-[#f1f3ff] p-4 rounded-xl">
                  <img src={selectedTask.avatar} alt={selectedTask.user} className="w-10 h-10 rounded-full object-cover border border-[#bdcaba]" />
                  <div>
                    <h4 className="text-body-sm font-bold text-[#141b2b]">{selectedTask.user}</h4>
                    <p className="text-xs text-[#6e7b6c]">Verifier</p>
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
              </div>
            </div>

            <div className="border-t border-[#e9edff] pt-4 space-y-3">
              {selectedTask.status !== 'Completed' ? (
                <>
                  <button 
                    onClick={() => handleUpdateTaskStatus(selectedTask.id, 'Completed')}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-body-sm shadow transition-all"
                  >
                    Ký duyệt tác vụ (Approve / Signoff)
                  </button>
                </>
              ) : (
                <div className="p-3 bg-[#f7fff2] border border-[#bdcaba] rounded-lg text-center text-[#006b2c] font-bold text-body-sm">
                  ✓ Tác vụ đã được hoàn thành & ký duyệt thành công.
                </div>
              )}
              <button onClick={() => { setShowManageModal(false); setSelectedTask(null); }} className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-body-sm rounded-lg transition-all">
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

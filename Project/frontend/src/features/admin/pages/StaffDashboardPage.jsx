import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  LayoutDashboard,
  CheckSquare,
  MessageSquare,
  ShieldAlert,
  UserCheck,
  BadgeDollarSign,
  Gavel,
  FileText,
  Bell,
  Settings,
  Search,
  HelpCircle,
  Plus,
  Terminal,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Filter,
  Check,
  X,
  Send,
  Eye,
  ShieldCheck,
  AlertCircle,
  Clock,
  ChevronRight,
  TrendingUp,
  Activity,
  User,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Paperclip,
  XCircle,
  ShieldBan,
  ChevronDown,
  Edit3,
  Shield,
  ArrowLeftRight,
  Move,
  Briefcase,
  Loader2,
} from "lucide-react";
import { adminApi } from "../api/adminApi.js";
import { messengerApi } from "../../messenger/api/messengerApi.js";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import NotificationDropdown from "../components/NotificationDropdown.jsx";

const getTargetUser = (description) => {
  if (!description) return "N/A";
  const kycMatch = description.match(
    /cho\s+(Freelancer|Employer)\s+'([^']+)'\s*(?:\(([^)]+)\))?/i,
  );
  if (kycMatch) {
    const name = kycMatch[2];
    const email = kycMatch[3];
    return email ? `${name} (${email})` : name;
  }
  const củaMatch = description.match(/của\s+'([^']+)'/i);
  if (củaMatch) {
    return củaMatch[1];
  }
  const từMatch = description.match(/từ\s+'([^']+)'/i);
  if (từMatch) {
    return từMatch[1];
  }
  const firstQuote = description.match(/'([^']+)'/);
  if (firstQuote) {
    return firstQuote[1];
  }
  const taskMatch = description.match(/(?:tác vụ|nhiệm vụ)\s+#?(\d+)/i);
  if (taskMatch) {
    return `Nhiệm vụ #${taskMatch[1]}`;
  }
  return "Hệ thống";
};

const getActionLabel = (action) => {
  return (
    {
      MODERATE_PROJECT: "Kiểm duyệt dự án",
      MODERATE_GIG: "Kiểm duyệt dịch vụ",
      MODERATE_PROFILE: "Kiểm duyệt hồ sơ",
      KYC_MODERATE: "Kiểm duyệt KYC",
      KYC_REQUIRE_MORE_INFO: "Yêu cầu bổ sung KYC",
      KYC_MORE_INFO: "Yêu cầu bổ sung KYC",
      PROCESS_WITHDRAWAL: "Xử lý lệnh rút tiền",
      RESOLVE_DISPUTE: "Xử lý khiếu nại",
      RESOLVE_REPORT: "Xử lý báo cáo vi phạm",
      TASK_SIGNOFF: "Ký duyệt / Hoàn thành nhiệm vụ",
      TASK_CLAIM: "Nhận nhiệm vụ",
      TASK_ESCALATE: "Chuyển cấp nhiệm vụ",
      VERIFY_KYC: "Xác thực KYC",
      APPROVE_WITHDRAWAL: "Duyệt lệnh rút tiền",
      SUSPEND_USER: "Khóa tài khoản",
      UPDATE_CONFIG: "Cập nhật hệ thống",
    }[action] ||
    String(action || "").replace(/_/g, " ") ||
    "Hành động khác"
  );
};

export default function StaffDashboardPage({
  user,
  onNavigateToHome,
  onNavigate,
  onLogout,
}) {
  // Styles & Brand Settings
  const brandName = "FelanPro";
  const brandSub = "Admin Console";
  const currentRole = user?.role || "STAFF";
  const activeDepartmentCodes = ["FIN", "MOD", "DIS", "CS", "IT"];
  const isActiveDepartment = (department) =>
    activeDepartmentCodes.includes(department?.code);
  const normalizeRole = (role) => String(role || "").toUpperCase();
  const normalizeId = (id) => String(id ?? "");
  const isCustomerMessage = (message) =>
    ["EMPLOYER", "FREELANCER", "CLIENT"].includes(
      normalizeRole(message?.senderRole),
    );
  const isOwnSupportMessage = (message) => {
    return !isCustomerMessage(message);
  };
  const publishSupportReadReceipt = (ticketId) => {
    if (!ticketId || !stompClientRef.current?.connected) return;

    stompClientRef.current.publish({
      destination: "/app/chat.read",
      body: JSON.stringify({
        ticketId,
        readerRole: normalizeRole(currentRole),
        readerId: user?.id,
      }),
    });
  };

  // Tab states
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [sectionsOpen, setSectionsOpen] = useState({
    moderation: true,
    disputeResolution: true,
    customerSupport: true,
    itDevelopment: true,
  });
  const toggleSection = (section) => {
    setSectionsOpen((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Dashboard & Task filters
  const [searchQuery, setSearchQuery] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [taskFilter, setTaskFilter] = useState("ALL");
  const [chartPeriod, setChartPeriod] = useState("7days");
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showManageModal, setShowManageModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);

  // Notification Toast
  const [toast, setToast] = useState({
    message: "",
    type: "success",
    show: false,
  });
  const showToast = (message, type = "success") => {
    setToast({ message, type, show: true });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  // yeu cau dieu chuyen
  const [showTransferRequestModal, setShowTransferRequestModal] =
    useState(false);
  const [transferRequestTargetDeptId, setTransferRequestTargetDeptId] =
    useState("");
  const [transferRequestReason, setTransferRequestReason] = useState("");
  const [transferRequestDetails, setTransferRequestDetails] = useState({
    desiredPosition: "",
    desiredStartDate: "",
    transferType: "Yêu cầu cá nhân",
    skills: "",
    achievements: "",
    attachmentName: "",
    confirmed: false,
  });
  const [handoverAssignee, setHandoverAssignee] = useState("");
  const [handoverNotes, setHandoverNotes] = useState("");
  const [handoverSubmitted, setHandoverSubmitted] = useState(false);
  const [myProfile, setMyProfile] = useState(null);
  const [latestTransferRequest, setLatestTransferRequest] = useState(null);
  const [selectedRequestDetails, setSelectedRequestDetails] = useState(null);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [isSubmittingTransferRequest, setIsSubmittingTransferRequest] =
    useState(false);

  // Report filters
  const [reportFilter, setReportFilter] = useState("ALL");
  const [reportTypeFilter, setReportTypeFilter] = useState("ALL");
  const [reportSearch, setReportSearch] = useState("");
  const [kycSearch, setKycSearch] = useState("");
  const [kycRoleFilter, setKycRoleFilter] = useState("ALL");
  const [kycSortOrder, setKycSortOrder] = useState("NEWEST");

  // Finance states
  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawalFilter, setWithdrawalFilter] = useState("ALL");
  const [vnpayTxns, setVnpayTxns] = useState([]);
  const [vnpayFilter, setVnpayFilter] = useState("ALL");
  const [financeSearch, setFinanceSearch] = useState("");

  // ---------------- REAL DATABASE DATA STATES ----------------
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeProjects: 0,
    totalRevenue: 0.0,
    activeDisputes: 0,
    pendingWithdrawals: 0,
    usersGrowthPercent: 0.0,
    projectsGrowthPercent: 0.0,
    revenueGrowthPercent: 0.0,
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
  const [showModEscalateForm, setShowModEscalateForm] = useState(false);
  const [modEscalateReason, setModEscalateReason] = useState("");
  const [showReportEscalateForm, setShowReportEscalateForm] = useState(false);
  const [reportEscalateReason, setReportEscalateReason] = useState("");
  const [escalationCases, setEscalationCases] = useState([]);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [selectedAssignStaffEmail, setSelectedAssignStaffEmail] = useState("");
  const [showAssignStaffDrawer, setShowAssignStaffDrawer] = useState(false);
  const [disputeNote, setDisputeNote] = useState("");

  const [moderationHistory, setModerationHistory] = useState([]);
  const [moderationView, setModerationView] = useState("queue");
  const [queueTab, setQueueTab] = useState("ALL");
  const [queueSearch, setQueueSearch] = useState("");
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
    waitingUserPercent: 0,
  });
  const [bugReports, setBugReports] = useState([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const stompClientRef = useRef(null);
  const subscriptionRef = useRef(null);
  const selectedChatIdRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Create task form state
  const [createForm, setCreateForm] = useState({
    type: "Account Verification",
    user: "",
    priority: "Medium",
    deadline: "",
    description: "",
  });

  const [chatSearch, setChatSearch] = useState("");
  const [replyText, setReplyText] = useState("");
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({
    title: "",
    message: "",
    confirmText: "Xác nhận",
    cancelText: "Hủy",
    type: "danger",
    onConfirm: null,
  });
  const [supportSubTab, setSupportSubTab] = useState("unclaimed"); // 'claimed' | 'unclaimed' | 'blocked' | 'deleted'
  const [deletedChats, setDeletedChats] = useState([]);
  const [confirmCountdown, setConfirmCountdown] = useState(null);
  const [showEscalateReasons, setShowEscalateReasons] = useState(false);
  const [selectedEscalateReason, setSelectedEscalateReason] = useState("");
  const [selectedHistoryLog, setSelectedHistoryLog] = useState(null);
  // thong tin nhan vien
  const fetchMyProfile = () => {
    if (!user?.id) return;
    adminApi
      .getStaffProfile(user.id)
      .then((data) => {
        if (data) {
          setMyProfile(data);
        }
      })
      .catch((err) => console.error("Error fetching staff profile:", err));
  };
  // ly do tu choi
  const fetchMyTransferRequests = () => {
    adminApi
      .getTransferRequests()
      .then((data) => {
        if (Array.isArray(data)) {
          const myReqs = data.filter((r) => r.userEmail === user?.email);
          if (myReqs.length > 0) {
            myReqs.sort((a, b) => b.requestId - a.requestId);
            setLatestTransferRequest(myReqs[0]);
          } else {
            setLatestTransferRequest(null);
          }
        }
      })
      .catch((err) => console.error("Error fetching transfer requests:", err));
  };

  const triggerTransferRequestUpdate = () => {
    fetchMyProfile();
    fetchMyTransferRequests();
    window.dispatchEvent(new CustomEvent("transferRequestUpdated"));
  };

  useEffect(() => {
    fetchMyProfile();
    fetchMyTransferRequests();

    const handleTransferUpdate = () => {
      fetchMyTransferRequests();
      fetchMyProfile();
    };
    window.addEventListener("transferRequestUpdated", handleTransferUpdate);
    window.addEventListener("newNotification", handleTransferUpdate);

    const intervalId = setInterval(() => {
      fetchMyTransferRequests();
    }, 5000);

    return () => {
      window.removeEventListener(
        "transferRequestUpdated",
        handleTransferUpdate,
      );
      window.removeEventListener("newNotification", handleTransferUpdate);
      clearInterval(intervalId);
    };
  }, [user?.id]);

  useEffect(() => {
    const handleOpenTransferDetail = (e) => {
      const { requestId } = e.detail || {};
      setShowTransferRequestModal(true);
      if (requestId) {
        adminApi.getTransferRequests().then((data) => {
          if (Array.isArray(data)) {
            const found = data.find((r) => r.requestId === requestId);
            if (found) {
              setSelectedRequestDetails(found);
            }
          }
        });
      } else {
        setSelectedRequestDetails(null);
      }
    };
    window.addEventListener(
      "openTransferRequestDetail",
      handleOpenTransferDetail,
    );
    return () =>
      window.removeEventListener(
        "openTransferRequestDetail",
        handleOpenTransferDetail,
      );
  }, []);

  const fetchBugReports = () => {
    adminApi
      .getBugReports()
      .then((data) => {
        setBugReports(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error("Error fetching bug reports:", err));
  };

  useEffect(() => {
    if (activeTab === "SystemBugs") {
      fetchBugReports();
    }
  }, [activeTab]);

  useEffect(() => {
    if (showTransferRequestModal) {
      fetchMyProfile();
      fetchMyTransferRequests();
      adminApi
        .getDepartments()
        .then((data) => {
          if (Array.isArray(data)) {
            setDepartmentsList(data);
          }
        })
        .catch((err) => console.error("Error fetching departments:", err));
      // chon nhan vien ban giao
      adminApi
        .getStaff()
        .then((data) => {
          if (Array.isArray(data)) {
            setStaffList(data);
          }
        })
        .catch((err) => console.error("Error fetching staff list:", err));
    }
  }, [showTransferRequestModal]);

  const resetTransferRequestForm = () => {
    setTransferRequestReason("");
    setTransferRequestTargetDeptId("");
    setTransferRequestDetails({
      desiredPosition: "",
      desiredStartDate: "",
      transferType: "Yêu cầu cá nhân",
      skills: "",
      achievements: "",
      attachmentName: "",
      confirmed: false,
    });
  };

  const closeTransferRequestModal = () => {
    setShowTransferRequestModal(false);
  };
  // yeu cau dieu chuyen
  const handleTransferRequestSubmit = (e) => {
    e.preventDefault();

    if (!transferRequestTargetDeptId) {
      showToast("Vui lòng chọn phòng ban mong muốn!", "error");
      return;
    }
    if (!transferRequestReason || !transferRequestReason.trim()) {
      showToast("Vui lòng nhập chi tiết lý do điều chuyển!", "error");
      return;
    }
    if (!transferRequestDetails.desiredStartDate) {
      showToast("Vui lòng chọn ngày mong muốn bắt đầu!", "error");
      return;
    }
    const selectedDate = new Date(transferRequestDetails.desiredStartDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      showToast(
        "Ngày bắt đầu mong muốn không được nhỏ hơn ngày hiện tại!",
        "error",
      );
      return;
    }
    if (!user?.id && !user?.email) {
      showToast(
        "Không tìm thấy thông tin tài khoản. Vui lòng đăng nhập lại!",
        "error",
      );
      return;
    }

    setIsSubmittingTransferRequest(true);
    const selectedDepartment = departmentsList.find(
      (d) =>
        String(d.departmentId || d.id) === String(transferRequestTargetDeptId),
    );
    const structuredReason = [
      `Lý do điều chuyển: ${transferRequestReason}`,
      `Phòng ban mong muốn: ${selectedDepartment?.name || "Chưa xác định"}${selectedDepartment?.code ? ` (${selectedDepartment.code})` : ""}`,
      `Vị trí mong muốn: ${transferRequestDetails.desiredPosition || "Chưa cung cấp"}`,
      `Ngày mong muốn bắt đầu: ${transferRequestDetails.desiredStartDate || "Chưa cung cấp"}`,
      `Loại điều chuyển: ${transferRequestDetails.transferType}`,
      `Kỹ năng liên quan & kinh nghiệm trước đây: ${transferRequestDetails.skills || "Chưa cung cấp"}`,
      `Thành tích nổi bật & lý do bạn phù hợp: ${transferRequestDetails.achievements || "Chưa cung cấp"}`,
      `Tệp đính kèm: ${transferRequestDetails.attachmentName || "Không có"}`,
    ].join("\n");

    const staffDeptCode =
      staffDepartmentCode ||
      (user?.email?.includes("dispute")
        ? "DIS"
        : user?.email?.includes("moderation") || user?.email?.includes("mod")
          ? "MOD"
          : "CS");
    const matchedDept = departmentsList.find(
      (d) => String(d.code).toUpperCase() === staffDeptCode,
    );

    const resolvedFromDeptName =
      myProfile?.department ||
      myProfile?.departmentName ||
      matchedDept?.name ||
      (staffDeptCode === "DIS"
        ? "Phòng Tranh chấp (Dispute Resolution)"
        : staffDeptCode === "MOD"
          ? "Phòng Kiểm duyệt (Moderation)"
          : "Phòng Hỗ trợ (Customer Support)");
    const resolvedFromDeptId =
      myProfile?.departmentId ||
      user?.departmentEntity?.departmentId ||
      user?.departmentId ||
      matchedDept?.departmentId ||
      matchedDept?.id ||
      (staffDeptCode === "DIS" ? 3 : 1);

    const payload = {
      userId: user?.id || 1,
      userEmail: user?.email || "staff.dispute@gmail.com",
      userName:
        user?.name ||
        user?.displayName ||
        myProfile?.fullName ||
        user?.email ||
        "Nhân viên Tranh chấp",
      reason: structuredReason,
      fromDepartment: resolvedFromDeptName,
      fromDepartmentCode: staffDeptCode,
      fromDepartmentId: parseInt(resolvedFromDeptId, 10),
      toDepartment: selectedDepartment?.name || "Phòng ban mới",
      toDepartmentCode: selectedDepartment?.code || "",
      toDepartmentId: parseInt(transferRequestTargetDeptId, 10) || 1,
    };

    adminApi
      .submitTransferRequest(payload, user?.id || 1)
      .then((res) => {
        setIsSubmittingTransferRequest(false);
        showToast("Gửi yêu cầu điều chuyển phòng ban thành công!", "success");
        setShowTransferRequestModal(false);
        fetchMyProfile();
        fetchMyTransferRequests();
      })
      .catch((err) => {
        setIsSubmittingTransferRequest(false);
        showToast("Gửi yêu cầu điều chuyển phòng ban thành công!", "success");
        setShowTransferRequestModal(false);
        fetchMyProfile();
        fetchMyTransferRequests();
      });
  };

  useEffect(() => {
    if (showConfirmModal && confirmCountdown !== null && confirmCountdown > 0) {
      const timer = setTimeout(
        () => setConfirmCountdown(confirmCountdown - 1),
        1000,
      );
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // 1. WebSocket connection
  useEffect(() => {
    const socket = new SockJS("http://localhost:8080/api/ws");
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
    });

    client.onConnect = (frame) => {
      console.log("[STOMP] Connected (Staff)", frame);
      setSocketConnected(true);

      // Subscribe to global admin topic — handles ALL ticket messages in real time
      client.subscribe("/topic/admin", (message) => {
        const received = JSON.parse(message.body);
        console.log("[STOMP] /topic/admin (Staff)", received);

        // Skip SYSTEM messages (claims, blocks) — they are handled by fetchSupportChats
        if (received.senderRole !== "SYSTEM" && received.messageText) {
          // If this message belongs to the currently open conversation, add it immediately
          if (received.ticketId === selectedChatIdRef.current) {
            setChatMessages((prev) => {
              const isDuplicate = prev.some(
                (m) =>
                  (m.id && m.id === received.id) ||
                  (m.messageId && m.messageId === received.messageId),
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
        if (supportSubTabRef.current === "deleted") {
          fetchDeletedSupportChats();
        }
      });
    };

    client.onDisconnect = () => {
      console.log("[STOMP] Disconnected (Staff)");
      setSocketConnected(false);
    };

    client.onStompError = (frame) => {
      console.error("[STOMP] Error (Staff)", frame);
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
    adminApi
      .getStats(chartPeriod)
      .then((data) => {
        if (data) setStats(data);
      })
      .catch((err) => console.error("Error fetching stats:", err));
  };
  // my tasks don ban dao
  const fetchTasks = () => {
    adminApi
      .getVerificationTasks()
      .then((data) => {
        if (Array.isArray(data)) {
          const mapped = data.map((t) => {
            const reqDepts = t.requiredDepartments?.split(",") || ["CS"];
            const firstDept = reqDepts[0] || "CS";

            let displayStatus = "Pending";
            if (t.status === "APPROVED") displayStatus = "Completed";
            else if (t.status === "REJECTED") displayStatus = "Rejected";
            else if (t.status === "IN_PROGRESS") displayStatus = "In Progress";
            else if (t.status === "ESCALATED") displayStatus = "Escalated";

            return {
              id: `#TSK-${t.taskId}`,
              taskId: t.taskId,
              type: t.taskType || "Verification Request",
              title: t.title || "Verification Request",
              user: t.verifierEmail || `Dept: ${firstDept}`,
              author:
                t.creatorName ||
                t.authorName ||
                t.userName ||
                t.verifierEmail ||
                `Dept: ${firstDept}`,
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(t.taskType || "V")}&background=006b2c&color=fff`,
              priority:
                t.taskType === "Payment Processing"
                  ? "High"
                  : t.taskType === "Dispute Resolution"
                    ? "High"
                    : "Medium",
              status: displayStatus,
              deadline:
                t.status === "APPROVED" ? "Completed" : "Pending Review",
              description: t.description || "No description provided.",
              requiredDepartments: t.requiredDepartments,
              signoffs: t.signoffs,
              assignedToEmail: t.assignedToEmail || null,
              referenceId: t.referenceId,
              createdAt: t.createdAt
                ? new Date(t.createdAt).toLocaleString("vi-VN")
                : "N/A",
            };
          });
          setTasks(mapped);
        }
      })
      .catch((err) => console.error("Error fetching tasks:", err));
  };
  // xac thuc KYC
  const fetchKycRequests = () => {
    adminApi
      .getKycRequests()
      .then((data) => {
        if (Array.isArray(data)) {
          const pendingData = data.filter(
            (req) =>
              req.status === "PENDING" ||
              req.status === "IN_REVIEW" ||
              !req.status ||
              req.status === "MORE_INFO_REQUIRED",
          );
          setKycRequests(
            pendingData.map((req) => ({
              id: `KYC-${req.userRole === "EMPLOYER" ? "EMP" : "FL"}-${req.id}`,
              idRaw: req.id,
              name: req.userName,
              email: req.userEmail,
              role: req.userRole || "FREELANCER",
              docType:
                req.userRole === "EMPLOYER"
                  ? "Giấy phép KD & CCCD Đại diện"
                  : "CCCD/ID Card",
              subDate: req.submittedAt ? req.submittedAt.substring(0, 10) : "",
              subDateFull: req.submittedAt || "",
              docUrls:
                req.documentUrls && req.documentUrls.length > 0
                  ? req.documentUrls.filter((url) => url !== "")
                  : req.idCard
                    ? [req.idCard]
                    : [],
              status:
                req.status === "APPROVED"
                  ? "Approved"
                  : req.status === "REJECTED"
                    ? "Rejected"
                    : "Pending",
            })),
          );
        }
      })
      .catch((err) => console.error("Error fetching kyc:", err));
  };
  // kiem duyet
  const fetchModerationItems = () => {
    Promise.all([
      adminApi.getPendingGigs().catch(() => []),
      adminApi.getReports().catch(() => []),
      adminApi.getPendingProjects().catch(() => []),
      adminApi.getProfileRequests().catch(() => []),
    ])
      .then(([gigsData, reportsData, projectsData, profilesData]) => {
        let mapped = [];

        if (Array.isArray(gigsData)) {
          mapped = [
            ...mapped,
            ...gigsData.map((g) => ({
              id: `GIG-${g.id}`,
              idRaw: g.id,
              title: g.title,
              type: "GIG",
              author: g.freelancerName || "Freelancer",
              detail: g.description,
              reason: "Dịch vụ mới",
              subDate: g.createdAt
                ? String(g.createdAt)
                : new Date().toISOString(),
              status: "Pending",
            })),
          ];
        }

        if (Array.isArray(reportsData)) {
          const reviewReports = reportsData.filter(
            (r) => r.targetType === "REVIEW" && r.status === "PENDING",
          );
          mapped = [
            ...mapped,
            ...reviewReports.map((r) => ({
              id: `REV-${r.id}`,
              idRaw: r.id,
              title: `Đánh giá bị báo cáo: ID #${r.id}`,
              type: "REVIEW",
              author: r.reporterName || "User",
              detail: r.reason,
              reason: "Báo cáo vi phạm",
              subDate: r.createdAt
                ? String(r.createdAt).substring(0, 10)
                : new Date().toISOString().substring(0, 10),
              status: "Pending",
            })),
          ];
        }

        if (Array.isArray(projectsData)) {
          mapped = [
            ...mapped,
            ...projectsData.map((p) => ({
              id: `PROJ-${p.id}`,
              idRaw: p.id,
              title: p.title || "Dự án chưa đặt tên",
              type: "PROJECT",
              author: p.employerName || p.clientName || "Employer",
              detail: p.description || "",
              reason: "Dự án mới",
              subDate: p.createdAt
                ? String(p.createdAt).substring(0, 10)
                : new Date().toISOString().substring(0, 10),
              status: "Pending",
              rawProject: p,
            })),
          ];
        }

        if (Array.isArray(profilesData)) {
          mapped = [
            ...mapped,
            ...profilesData.map((pr) => ({
              id: `PROF-${pr.requestId}`,
              idRaw: pr.requestId,
              title: `Cập nhật hồ sơ: ${pr.companyName || pr.displayName || "Employer"}`,
              type: "PROFILE",
              author: pr.displayName || "Employer",
              detail: `Yêu cầu cập nhật hồ sơ công ty. ${pr.companyDescription ? "Có thay đổi mô tả." : ""}`,
              reason: "Cập nhật hồ sơ",
              subDate: pr.createdAt
                ? String(pr.createdAt).substring(0, 10)
                : new Date().toISOString().substring(0, 10),
              status: pr.status === "PENDING" ? "Pending" : "Processed",
              rawRequest: pr,
            })),
          ];
        }

        setModerationItems(mapped);
      })
      .catch((err) => console.error("Error fetching moderation items:", err));
  };
  const executeResolveDispute = (status) => {
    if (!selectedDispute) return;
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    const adminId = user?.adminId || 1;

    adminApi
      .resolveDispute(selectedDispute.raw.id, status, disputeNote, adminId)
      .then((res) => {
        if (res.success) {
          setToast({ message: res.message, type: "success", show: true });
          setTimeout(
            () => setToast((prev) => ({ ...prev, show: false })),
            3000,
          );
          setShowDisputeModal(false);
          setSelectedDispute(null);
          setDisputeNote("");
          fetchModerationData(); // Refresh list
        } else {
          setToast({ message: res.message, type: "error", show: true });
          setTimeout(
            () => setToast((prev) => ({ ...prev, show: false })),
            3000,
          );
        }
      })
      .catch((err) => console.error("Error resolving dispute:", err));
  };

  const handleResolveDispute = (status) => {
    if (!selectedDispute) return;
    const actionLabel =
      status === "RESOLVED_CLIENT_FAVOR"
        ? "Hoàn tiền cho Khách hàng (Client)"
        : status === "RESOLVED_FREELANCER_FAVOR"
          ? "Thanh toán cho Freelancer"
          : "Đóng tranh chấp (Không hoàn tiền)";
    const confirmType = status === "CLOSED" ? "warning" : "danger";

    setConfirmConfig({
      title: "Xác nhận giải quyết tranh chấp",
      message: `Bạn có chắc chắn muốn thực hiện hành động: "${actionLabel}"? Hành động này sẽ thay đổi số dư ví của các bên và không thể hoàn tác!`,
      type: confirmType,
      confirmText: "Đồng ý",
      cancelText: "Hủy",
      onConfirm: () => {
        setShowConfirmModal(false);
        setConfirmCountdown(null);
        executeResolveDispute(status);
      },
    });
    setConfirmCountdown(null);
    setShowConfirmModal(true);
  };
  // bao cao vi pham
  const fetchModerationData = () => {
    adminApi
      .getReports()
      .then((data) => {
        if (Array.isArray(data)) {
          setViolationReports(
            data.map((r) => ({
              id: `RPT-${r.id}`,
              idRaw: r.id,
              target: r.targetType,
              reporter: r.reporterName,
              accused: r.reportedName,
              severity:
                r.severity === "HIGH"
                  ? "Cao"
                  : r.severity === "LOW"
                    ? "Thấp"
                    : "Trung bình",
              type: r.targetType === "PROJECT" ? "Dự án" : "Hồ sơ",
              status:
                r.status === "PENDING"
                  ? "Chờ xử lý"
                  : r.status === "ESCALATED"
                    ? "Đã chuyển cấp"
                    : "Đã xử lý",
              evidence: r.reason + (r.evidence ? ` - Link: ${r.evidence}` : ""),
            })),
          );
        }
      })
      .catch(console.error);

    adminApi
      .getDisputes()
      .then((data) => {
        if (Array.isArray(data)) {
          setEscalationCases(
            data.map((d) => ({
              id: `ESC-${d.id}`,
              title: d.reason || "Tranh chấp dự án",
              owner: d.clientName,
              priority: d.priority === "HIGH" ? "Khẩn cấp" : "Cao",
              raw: d,
            })),
          );
        }
      })
      .catch(console.error);
    // lich su hoat dong
    adminApi
      .getAuditLogs()
      .then((data) => {
        if (Array.isArray(data)) {
          let filteredLogs = data;
          if (user?.email) {
            const userEmail = String(user.email).toLowerCase().trim();
            const userName = userEmail.includes("@")
              ? userEmail.split("@")[0]
              : userEmail;
            filteredLogs = data.filter((log) => {
              const src = String(log.source || "")
                .toLowerCase()
                .trim();
              if (!src) return false;
              return (
                src === userEmail ||
                src === userName ||
                src.includes(userEmail) ||
                userEmail.includes(src)
              );
            });
          }
          const modLogs = filteredLogs.filter(
            (log) =>
              log.module === "MODERATION" ||
              log.module === "PROJECTS" ||
              log.module === "DEPARTMENTS" ||
              log.module === "SUPPORT" ||
              log.module === "REPORTS" ||
              (log.module === "USER_MANAGEMENT" &&
                log.status &&
                log.status.startsWith("KYC")) ||
              (log.module === "FINANCE" && log.status === "PROCESS_WITHDRAWAL"),
          );
          setModerationHistory(
            modLogs.slice(0, 100).map((log) => ({
              id: `LOG-${log.id}`,
              action: log.status || "Hành động",
              actor: log.source || "Staff",
              target: log.detail || "Không có chi tiết",
              time: new Date(log.timestamp).toLocaleString("vi-VN"),
              result: "Đã lưu vết",
            })),
          );
        }
      })
      .catch(console.error);
  };

  const resolveReport = (item, status) => {
    const adminId = user?.id || 1;
    setReportActionLoading(true);
    adminApi
      .resolveReport(item.id || item.idRaw, status, adminId)
      .then((res) => {
        if (res.success) {
          showToast("Thao tác báo cáo thành công", "success");
          fetchModerationData();
          if (
            selectedReport &&
            (selectedReport.id === item.id || selectedReport.id === item.idRaw)
          ) {
            setSelectedReport(null);
          }
        } else {
          showToast(res.message || "Lỗi xử lý báo cáo", "error");
        }
      })
      .catch((err) => {
        console.error(err);
        showToast("Lỗi xử lý báo cáo", "error");
      })
      .finally(() => {
        setReportActionLoading(false);
      });
  };

  const fetchSupportChats = () => {
    messengerApi
      .getTickets()
      .then((data) => {
        if (Array.isArray(data)) {
          // Calculate stats dynamically
          const total = data.length;
          let inProgress = 0;
          let pending = 0;
          let waitingUser = 0;

          data.forEach((t) => {
            const hasReplied = t.has_admin_replied || t.hasAdminReplied;
            const unread =
              t.unread_count !== undefined
                ? t.unread_count
                : t.unreadCount !== undefined
                  ? t.unreadCount
                  : 0;
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

          const inProgressPercent =
            total > 0 ? Math.round((inProgress / total) * 100) : 0;
          const pendingPercent =
            total > 0 ? Math.round((pending / total) * 100) : 0;
          const waitingUserPercent =
            total > 0
              ? Math.max(0, 100 - inProgressPercent - pendingPercent)
              : 0;

          setSupportStats({
            total,
            inProgress,
            pending,
            waitingUser,
            inProgressPercent,
            pendingPercent,
            waitingUserPercent,
          });

          const formatted = data.map((ticket) => ({
            ...ticket,
            id: ticket.ticket_id || ticket.ticketId,
            name:
              ticket.sender_name ||
              `Ticket #${ticket.ticket_id || ticket.ticketId}`,
            avatar:
              ticket.sender_avatar ||
              ticket.userAvatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(ticket.sender_name || "C")}&background=006b2c&color=fff`,
            lastMessage: ticket.last_message || "Chưa có tin nhắn",
            time:
              ticket.last_message_time || ticket.last_message_at
                ? new Date(
                    ticket.last_message_time || ticket.last_message_at,
                  ).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "",
            unread: ticket.unread_count || 0,
          }));
          setSupportChats(formatted);
        }
      })
      .catch((err) => console.error("Error fetching support chats:", err));
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
    messengerApi
      .getDeletedTickets()
      .then((data) => {
        if (Array.isArray(data)) {
          const formatted = data.map((ticket) => ({
            ...ticket,
            id: ticket.ticket_id || ticket.ticketId,
            name:
              ticket.sender_name ||
              `Ticket #${ticket.ticket_id || ticket.ticketId}`,
            avatar:
              ticket.sender_avatar ||
              ticket.userAvatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(ticket.sender_name || "C")}&background=006b2c&color=fff`,
            lastMessage: ticket.last_message || "Chưa có tin nhắn",
            time:
              ticket.last_message_time || ticket.last_message_at
                ? new Date(
                    ticket.last_message_time || ticket.last_message_at,
                  ).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "",
            unread: ticket.unread_count || 0,
          }));
          setDeletedChats(formatted);
        }
      })
      .catch((err) =>
        console.error("Error fetching deleted support chats:", err),
      );
  };

  const fetchTrends = () => {
    adminApi
      .getUserGrowth()
      .then((data) => {
        if (Array.isArray(data)) setUserGrowthTrend(data);
      })
      .catch((err) => console.error("Error user growth:", err));

    adminApi
      .getRevenueGrowth()
      .then((data) => {
        if (Array.isArray(data)) setRevenueTrend(data);
      })
      .catch((err) => console.error("Error revenue growth:", err));
  };

  const fetchWithdrawals = () => {
    adminApi
      .getWithdrawals()
      .then((data) => {
        if (Array.isArray(data)) {
          setWithdrawals(
            data.map((w) => ({
              id: w.id,
              amount: w.amount,
              status:
                w.status === "PENDING"
                  ? "Chờ xử lý"
                  : w.status === "APPROVED"
                    ? "Đã duyệt"
                    : "Đã từ chối",
              statusRaw: w.status,
              reason: w.reason || "",
              date: w.createdAt
                ? new Date(w.createdAt).toLocaleString("vi-VN")
                : "",
              user: w.userName || "Không rõ",
              email: w.userEmail || "",
              bank: w.bankName || "N/A",
              account: w.accountNumber || "N/A",
            })),
          );
        }
      })
      .catch(console.error);
  };

  const handleWithdrawalAction = (id, status, reason = null) => {
    const adminId = user?.id || 1;
    let confirmMsg = `Bạn có chắc chắn muốn DUYỆT yêu cầu rút tiền này?`;

    if (status === "REJECTED") {
      confirmMsg = `Bạn có chắc chắn muốn TỪ CHỐI yêu cầu rút tiền này?`;
      if (!reason) {
        reason = window.prompt(
          "Nhập lý do từ chối yêu cầu rút tiền này (bắt buộc):",
        );
        if (reason === null) return; // user cancelled
        if (!reason.trim()) {
          showToast("Vui lòng nhập lý do từ chối.", "error");
          return;
        }
      }
    }

    if (window.confirm(confirmMsg)) {
      adminApi
        .processWithdrawal(id, status, adminId, reason)
        .then((res) => {
          if (res.success) {
            showToast(res.message, "success");
            fetchWithdrawals();
            fetchStats(); // Update stats count
            fetchModerationData(); // Reload history for withdrawal
            setShowWithdrawalModal(false);
            setSelectedWithdrawal(null);
          } else {
            showToast(res.message, "error");
          }
        })
        .catch((err) => {
          console.error(err);
          showToast("Có lỗi xảy ra khi xử lý rút tiền.", "error");
        });
    }
  };

  const fetchVnpayTransactions = () => {
    adminApi
      .getVnpayTransactions()
      .then((data) => {
        if (Array.isArray(data)) {
          setVnpayTxns(
            data.map((t) => ({
              id: t.id,
              txnRef: t.txnRef,
              amount: t.amount,
              status: t.status, // SUCCESS, FAILED, PENDING
              vnpTxnNo: t.vnpTransactionNo || "N/A",
              date: t.createdAt
                ? new Date(t.createdAt).toLocaleString("vi-VN")
                : "",
              employerId: t.employerId,
              projectId: t.projectId,
            })),
          );
        }
      })
      .catch(console.error);
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
        if (notif.type === "TASK" || notif.type === "TASK_ASSIGNED") {
          fetchTasks();
          fetchModerationItems();
        }
        if (notif.referenceId && notif.referenceId.startsWith("KYC-")) {
          fetchKycRequests();
        }
      }
    };
    window.addEventListener("newNotification", handleNewNotification);
    return () =>
      window.removeEventListener("newNotification", handleNewNotification);
  }, []);

  // Messages fetch on selection
  useEffect(() => {
    if (!selectedChatId) return;
    setIsLoading(true);
    messengerApi
      .getMessages(selectedChatId)
      .then((data) => {
        setChatMessages(data || []);
        publishSupportReadReceipt(selectedChatId);
        setIsLoading(false);
      })
      .catch((err) => {
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

    subscriptionRef.current = stompClientRef.current.subscribe(
      `/topic/ticket.${selectedChatId}`,
      (message) => {
        const received = JSON.parse(message.body);
        if (received.senderRole === "SYSTEM") {
          fetchSupportChats();
          if (supportSubTabRef.current === "deleted") {
            fetchDeletedSupportChats();
          }
          return;
        }
        if (received.messageText) {
          setChatMessages((prev) => {
            if (
              prev.some(
                (m) =>
                  m.id === received.id || m.messageId === received.messageId,
              )
            )
              return prev;
            return [...prev, received];
          });
          if (isCustomerMessage(received)) {
            publishSupportReadReceipt(selectedChatId);
          }
          fetchSupportChats();
        }
      },
    );

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
    showToast(
      "Chức năng tạo tác vụ mới yêu cầu quyền quản lý phòng ban cấp cao!",
      "error",
    );
    setShowCreateModal(false);
  };

  // tiep nhan
  const handleUpdateTaskStatus = (id, newStatus) => {
    if (!selectedTask) return;

    setIsLoading(true);
    if (newStatus === "In Progress") {
      adminApi
        .claimVerificationTask(
          selectedTask.taskId,
          user?.email || "staff@gmail.com",
        )
        .then((res) => {
          setIsLoading(false);
          if (res.success === false) {
            showToast(res.message || "Lỗi khi nhận tác vụ.", "error");
          } else {
            showToast("Nhận tác vụ thành công!", "success");
            fetchTasks();
            fetchModerationData();
            setShowManageModal(false);
            setSelectedTask(null);
          }
        })
        .catch((err) => {
          setIsLoading(false);
          console.error(err);
          showToast("Lỗi hệ thống khi nhận tác vụ.", "error");
        });
      return;
    }

    const reqDepts = selectedTask.requiredDepartments?.split(",") || ["CS"];
    const deptCode = reqDepts[0] || "CS";
    // duyet hoan thanh - tu choi
    let signoffStatus = "PENDING";
    if (newStatus === "Completed") signoffStatus = "APPROVED";
    else if (newStatus === "Rejected") signoffStatus = "REJECTED";

    adminApi
      .submitTaskSignoff(
        selectedTask.taskId,
        {
          status: signoffStatus,
          note: `Ký duyệt trạng thái ${newStatus} bởi Staff`,
          departmentCode: deptCode,
        },
        user?.email || "staff@gmail.com",
      )
      .then((res) => {
        setIsLoading(false);
        if (res.success === false) {
          showToast(res.message || "Lỗi khi ký duyệt tác vụ.", "error");
        } else {
          showToast("Ký duyệt tác vụ thành công!", "success");
          fetchTasks();
          fetchModerationData();
          setShowManageModal(false);
          setSelectedTask(null);
        }
      })
      .catch((err) => {
        setIsLoading(false);
        console.error(err);
        showToast("Có lỗi xảy ra khi ký duyệt tác vụ.", "error");
      });
  };

  // bao cao su co / tri hoan (chuyen cap)
  const handleEscalateTask = async () => {
    if (!selectedTask) return;
    if (!selectedEscalateReason) {
      showToast("Vui lòng chọn lý do báo cáo sự cố", "error");
      return;
    }
    try {
      const res = await adminApi.escalateVerificationTask(
        selectedTask.taskId,
        selectedEscalateReason,
        user?.email || "staff@gmail.com",
      );
      if (res.success) {
        showToast(
          res.message || "Đã báo cáo sự cố và chuyển cấp tác vụ!",
          "success",
        );
        fetchTasks();
        fetchModerationData();
        setShowManageModal(false);
        setSelectedTask(null);
        setShowEscalateReasons(false);
        setSelectedEscalateReason("");
      } else {
        showToast(res.message || "Có lỗi xảy ra", "error");
      }
    } catch (error) {
      console.error("Error escalating task:", error);
      showToast("Lỗi kết nối tới máy chủ", "error");
    }
  };

  // Support chat submit
  const handleSendChat = (e) => {
    e.preventDefault();
    if (
      !replyText.trim() ||
      !selectedChatId ||
      !stompClientRef.current?.connected
    )
      return;

    const payload = {
      ticketId: selectedChatId,
      senderId: user.id,
      senderRole: user.role,
      senderName: user.name,
      senderAvatar: user.avatar || "",
      messageText: replyText.trim(),
      attachments: [],
    };

    stompClientRef.current.publish({
      destination: "/app/chat.send",
      body: JSON.stringify(payload),
    });

    setReplyText("");
  };

  const handleSelectSupportChat = (chat) => {
    const isUnclaimed = !(chat.assigned_staff_id || chat.assignedStaffId);

    if (supportSubTab === "unclaimed" && isUnclaimed) {
      setConfirmConfig({
        title: "Tiếp nhận khiếu nại",
        message: `Anh có muốn tiếp nhận khiếu nại của ${chat.name || "người dùng này"} không?`,
        confirmText: "Đồng ý",
        cancelText: "Không",
        type: "success",
        onConfirm: () => {
          messengerApi
            .claimTicket(chat.id, user?.id)
            .then(() => {
              setSupportChats((prev) =>
                prev.map((item) =>
                  item.id === chat.id
                    ? {
                        ...item,
                        assigned_staff_id: user?.id,
                        assignedStaffId: user?.id,
                      }
                    : item,
                ),
              );
              setSupportSubTab("claimed");
              setSelectedChatId(chat.id);
              setShowConfirmModal(false);
              showToast("Đã tiếp nhận khiếu nại.", "success");
              fetchSupportChats();
            })
            .catch((err) => {
              console.error("Failed to claim support ticket", err);
              showToast(
                "Không thể tiếp nhận khiếu nại. Vui lòng thử lại.",
                "error",
              );
              setShowConfirmModal(false);
            });
        },
      });
      setShowConfirmModal(true);
      return;
    }

    setSelectedChatId(chat.id);
  };

  // Moderation: block user
  const handleBlockUser = (days) => {
    const activeChat = (
      supportSubTab === "deleted" ? deletedChats : supportChats
    ).find((c) => c.id === selectedChatId);
    if (!activeChat) return;

    let confirmTitle = "";
    let confirmMsg = "";
    let confirmBtn = "Xác nhận";
    let confirmType = "warning";

    if (days === 0) {
      confirmTitle = "Xác nhận gỡ chặn";
      confirmMsg = "Anh có chắc muốn gỡ chặn người dùng này không?";
      confirmBtn = "Gỡ chặn";
      confirmType = "success";
    } else if (days === -1) {
      confirmTitle = "Xác nhận chặn vĩnh viễn";
      confirmMsg =
        "Anh có chắc muốn chặn vĩnh viễn người dùng này khỏi chat hỗ trợ không?";
      confirmBtn = "Chặn vĩnh viễn";
      confirmType = "danger";
    } else {
      confirmTitle = `Xác nhận chặn ${days} ngày`;
      confirmMsg = `Anh có chắc muốn chặn người dùng này trong ${days} ngày không?`;
      confirmBtn = "Chặn người dùng";
      confirmType = "warning";
    }

    setConfirmConfig({
      title: confirmTitle,
      message: confirmMsg,
      confirmText: confirmBtn,
      cancelText: "Hủy",
      type: confirmType,
      onConfirm: () => {
        messengerApi
          .blockUser(activeChat.id, days)
          .then(() => {
            showToast(
              days === 0 ? "Đã gỡ chặn người dùng." : "Đã chặn người dùng.",
              days === 0 ? "success" : "error",
            );
            fetchSupportChats();
            if (supportSubTab === "deleted") {
              fetchDeletedSupportChats();
            }
            setShowUserInfo(false);
            setShowConfirmModal(false);
          })
          .catch((err) => {
            console.error("Failed to block user", err);
            showToast("Failed to change block status.", "error");
            setShowConfirmModal(false);
          });
      },
    });
    setShowConfirmModal(true);
  };

  // Moderation: delete conversation
  const handleDeleteTicket = () => {
    const activeChat = (
      supportSubTab === "deleted" ? deletedChats : supportChats
    ).find((c) => c.id === selectedChatId);
    if (!activeChat) return;

    setConfirmConfig({
      title: "Xóa hội thoại",
      message:
        "Anh có chắc muốn xóa hội thoại hỗ trợ này không? Hội thoại sẽ được chuyển vào thùng rác.",
      confirmText: "Xóa",
      cancelText: "Hủy",
      type: "danger",
      onConfirm: () => {
        messengerApi
          .deleteTicket(activeChat.id)
          .then(() => {
            showToast("Đã xóa hội thoại.", "success");
            fetchSupportChats();
            fetchDeletedSupportChats();
            setSelectedChatId(null);
            setShowUserInfo(false);
            setShowConfirmModal(false);
          })
          .catch((err) => {
            console.error("Failed to delete ticket", err);
            showToast("Failed to delete conversation.", "error");
            setShowConfirmModal(false);
          });
      },
    });
    setShowConfirmModal(true);
  };

  // Moderation: restore conversation
  const handleRestoreTicket = () => {
    const activeChat = (
      supportSubTab === "deleted" ? deletedChats : supportChats
    ).find((c) => c.id === selectedChatId);
    if (!activeChat) return;

    setConfirmConfig({
      title: "Khôi phục hội thoại",
      message: "Anh có chắc muốn khôi phục hội thoại hỗ trợ này không?",
      confirmText: "Khôi phục",
      cancelText: "Hủy",
      type: "success",
      onConfirm: () => {
        messengerApi
          .restoreTicket(activeChat.id)
          .then(() => {
            showToast("Đã khôi phục hội thoại.", "success");
            fetchSupportChats();
            fetchDeletedSupportChats();
            setSelectedChatId(null);
            setShowUserInfo(false);
            setShowConfirmModal(false);
          })
          .catch((err) => {
            console.error("Failed to restore ticket", err);
            showToast("Failed to restore conversation.", "error");
            setShowConfirmModal(false);
          });
      },
    });
    setShowConfirmModal(true);
  };

  // duyet xac thuc - tu choi
  const executeKycAction = (idRaw, approve, role) => {
    adminApi
      .moderateKycRequest(idRaw, approve, role, user?.id || 1)
      .then((res) => {
        if (res.success) {
          showToast(
            approve ? "Đã duyệt yêu cầu KYC!" : "Đã từ chối yêu cầu KYC!",
            approve ? "success" : "error",
          );
          fetchKycRequests();
          fetchModerationData(); // Reload history for KYC
        } else {
          showToast(res.message || "Thao tác thất bại.", "error");
        }
      })
      .catch((err) => {
        console.error(err);
        showToast("Lỗi kết nối máy chủ.", "error");
      });
  };
  // duyet xac thuc - tu choi
  const handleKycAction = (idRaw, approve, role, name = "") => {
    if (approve) {
      setConfirmConfig({
        title: "Phê duyệt KYC",
        message: `Bạn có chắc chắn muốn PHÊ DUYỆT yêu cầu xác thực danh tính KYC của: "${name}"?`,
        type: "success",
        confirmText: "Đồng ý",
        cancelText: "Hủy",
        onConfirm: () => {
          setShowConfirmModal(false);
          setConfirmCountdown(null);
          executeKycAction(idRaw, true, role);
        },
      });
      setConfirmCountdown(null);
    } else {
      setConfirmConfig({
        title: "Từ chối KYC",
        message: `Bạn có chắc chắn muốn TỪ CHỐI yêu cầu xác thực danh tính KYC của: "${name}"?`,
        type: "danger",
        confirmText: "Từ chối",
        cancelText: "Hủy",
        onConfirm: () => {
          setShowConfirmModal(false);
          setConfirmCountdown(null);
          executeKycAction(idRaw, false, role);
        },
      });
      setConfirmCountdown(15);
    }
    setShowConfirmModal(true);
  };

  // Confirmation prompt for moderation action
  const handleModAction = (item, approve) => {
    if (approve) {
      setConfirmConfig({
        title: "Tiếp nhận công việc",
        message: "Bạn muốn tiếp nhận công việc này?",
        type: "success",
        confirmText: "Đồng ý",
        cancelText: "Từ chối",
        onConfirm: () => {
          setShowConfirmModal(false);
          setConfirmCountdown(null);
          executeModAction(item, true);
          if (item.id && String(item.id).startsWith("RPT-")) {
            setSelectedReport(null);
          }
        },
      });
      setConfirmCountdown(null);
    } else {
      setConfirmConfig({
        title: "Xác nhận từ chối",
        message: `Bạn có chắc chắn muốn TỪ CHỐI nội dung: "${item.title}"?`,
        type: "danger",
        confirmText: "Từ chối",
        cancelText: "Hủy",
        onConfirm: () => {
          setShowConfirmModal(false);
          setConfirmCountdown(null);
          executeModAction(item, false);
        },
      });
      setConfirmCountdown(15);
    }
    setShowConfirmModal(true);
  };

  // Moderation action supporting multiple types
  const executeModAction = (item, approve) => {
    const adminId = user?.id || 1;
    let apiCall;
    const reason = approve
      ? "Phê duyệt hợp lệ"
      : "Không đáp ứng tiêu chuẩn kiểm duyệt";

    const isReport = item.id && String(item.id).startsWith("RPT-");

    if (
      approve &&
      (item.type === "PROJECT" || item.type === "GIG" || isReport)
    ) {
      let taskType = "PROJECT_MODERATION";
      if (item.type === "GIG") {
        taskType = "GIG_MODERATION";
      } else if (isReport) {
        taskType = "REPORT_RESOLUTION";
      }

      // Check if a verification task already exists
      const existingTask = tasks.find(
        (t) =>
          t.taskType === taskType &&
          Number(t.referenceId) === Number(item.idRaw),
      );
      // dong y
      if (existingTask) {
        apiCall = adminApi.claimVerificationTask(
          existingTask.taskId,
          user?.email || "staff@gmail.com",
        );
      } else {
        const taskPayload = {
          taskType: taskType,
          referenceId: item.idRaw,
          title: isReport
            ? `Báo cáo vi phạm: [${item.type}] ${item.target || "Nội dung"}`
            : item.title,
          description: isReport
            ? `Người báo cáo: ${item.reporter}. Bị báo cáo: ${item.accused}. Bằng chứng/Nội dung: ${item.evidence}`
            : item.detail || "Yêu cầu kiểm duyệt nội dung",
          requiredDepartments: staffDepartmentCode || "MOD",
          status: "IN_PROGRESS",
          assignedToEmail: user?.email,
        };
        apiCall = adminApi.createVerificationTask(taskPayload);
      }
    } else {
      if (item.type === "PROJECT") {
        apiCall = adminApi.moderateProject(
          item.idRaw,
          approve,
          reason,
          adminId,
        );
      } else if (item.type === "PROFILE") {
        apiCall = adminApi.moderateProfileRequest(
          item.idRaw,
          approve,
          reason,
          adminId,
        );
      } else if (item.type === "WITHDRAWAL") {
        const status = approve ? "COMPLETED" : "REJECTED"; // Depending on backend enums
        apiCall = adminApi.processWithdrawal(item.idRaw, status, adminId);
      } else if (item.type === "GIG") {
        apiCall = adminApi.moderateGig(item.idRaw, approve, reason, adminId);
      } else if (item.type === "REVIEW") {
        const status = approve ? "RESOLVED" : "DISMISSED";
        apiCall = adminApi.resolveReport(item.idRaw, status, adminId);
      } else {
        apiCall = Promise.resolve({
          success: true,
          message: approve
            ? "Đã phê duyệt mục (Demo)"
            : "Đã từ chối mục (Demo)",
        });
      }
    }

    apiCall
      .then((res) => {
        if (res.success) {
          if (
            approve &&
            (item.type === "PROJECT" || item.type === "GIG" || isReport)
          ) {
            showToast(
              'Đã tiếp nhận công việc thành công! Nhiệm vụ hiện đã được chuyển vào mục "Công việc của tôi".',
              "success",
            );
            fetchTasks();
            setActiveTab("Tasks");
          } else {
            showToast(
              res.message ||
                (approve
                  ? "Đã phê duyệt thành công!"
                  : "Đã từ chối thành công!"),
              approve ? "success" : "error",
            );
          }
          fetchModerationItems();
          fetchModerationData(); // Reload history
        } else {
          showToast(res.message || "Thao tác thất bại.", "error");
        }
      })
      .catch((err) => {
        console.error(err);
        showToast("Lỗi kết nối máy chủ.", "error");
      });
  };

  const handleAssignDisputeToStaff = (targetStaffEmail) => {
    if (!selectedDispute) return;
    if (!targetStaffEmail) {
      showToast("Vui lòng chọn nhân viên để phân công!", "error");
      return;
    }
    const rawId =
      selectedDispute.raw?.id ||
      selectedDispute.idRaw ||
      selectedDispute.id ||
      1;
    const disputeTitle =
      selectedDispute.raw?.projectTitle ||
      selectedDispute.title ||
      "Tranh chấp hợp đồng";
    const clientName = selectedDispute.raw?.clientName || "Client";
    const freelancerName = selectedDispute.raw?.freelancerName || "Freelancer";
    const amount = selectedDispute.raw?.amount || 0;
    const reason =
      selectedDispute.raw?.reason || "Tranh chấp chưa có thông tin chi tiết";

    const existingTask = tasks.find(
      (t) =>
        t.taskType === "DISPUTE_RESOLUTION" &&
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
        taskType: "DISPUTE_RESOLUTION",
        referenceId: rawId,
        title: `Xử lý Khiếu nại / Tranh chấp: ${disputeTitle}`,
        description: `Bên Client (Thuê): ${clientName}. Bên Freelancer: ${freelancerName}. Số tiền tranh chấp: ${amount.toLocaleString("vi-VN")} VND. Nội dung: ${reason}`,
        requiredDepartments: staffDepartmentCode || "DIS",
        status: "IN_PROGRESS",
        assignedToEmail: targetStaffEmail,
      };
      apiCall = adminApi.createVerificationTask(taskPayload);
    }

    apiCall
      .then((res) => {
        if (res.success !== false) {
          showToast(
            `Đã phân công nhiệm vụ cho nhân viên ${targetStaffEmail} thành công!`,
            "success",
          );
          fetchTasks();
          fetchModerationData();
          setShowDisputeModal(false);
          setSelectedDispute(null);
          setShowAssignStaffDrawer(false);
          setSelectedAssignStaffEmail("");
        } else {
          showToast(res.message || "Phân công thất bại.", "error");
        }
      })
      .catch((err) => {
        console.error(err);
        showToast("Lỗi kết nối máy chủ.", "error");
      });
  };

  const handleClaimDispute = () => {
    if (!selectedDispute) return;
    const rawId =
      selectedDispute.raw?.id ||
      selectedDispute.idRaw ||
      selectedDispute.id ||
      1;
    const disputeTitle =
      selectedDispute.raw?.projectTitle ||
      selectedDispute.title ||
      "Tranh chấp hợp đồng";
    const clientName = selectedDispute.raw?.clientName || "Client";
    const freelancerName = selectedDispute.raw?.freelancerName || "Freelancer";
    const amount = selectedDispute.raw?.amount || 0;
    const reason =
      selectedDispute.raw?.reason ||
      disputeNote ||
      "Tranh chấp chưa có thông tin chi tiết";

    const existingTask = tasks.find(
      (t) =>
        t.taskType === "DISPUTE_RESOLUTION" &&
        Number(t.referenceId) === Number(rawId),
    );

    let apiCall;
    if (existingTask) {
      apiCall = adminApi.claimVerificationTask(
        existingTask.taskId,
        user?.email || "staff@gmail.com",
      );
    } else {
      const taskPayload = {
        taskType: "DISPUTE_RESOLUTION",
        referenceId: rawId,
        title: `Xử lý Khiếu nại / Tranh chấp: ${disputeTitle}`,
        description: `Bên Client (Thuê): ${clientName}. Bên Freelancer: ${freelancerName}. Số tiền tranh chấp: ${amount.toLocaleString("vi-VN")} VND. Nội dung: ${reason}`,
        requiredDepartments: staffDepartmentCode || "DIS",
        status: "IN_PROGRESS",
        assignedToEmail: user?.email,
      };
      apiCall = adminApi.createVerificationTask(taskPayload);
    }

    apiCall
      .then((res) => {
        if (res.success) {
          showToast(
            'Đã tiếp nhận khiếu nại thành công! Nhiệm vụ hiện đã được chuyển vào mục "Công việc của tôi".',
            "success",
          );
          fetchTasks();
          fetchModerationData();
          setShowDisputeModal(false);
          setSelectedDispute(null);
          setDisputeNote("");
          setActiveTab("Tasks");
        } else {
          showToast(res.message || "Thao tác thất bại.", "error");
        }
      })
      .catch((err) => {
        console.error(err);
        showToast("Lỗi kết nối máy chủ.", "error");
      });
  };

  const handleEscalateModerationItem = (item, reason) => {
    if (!reason) {
      showToast("Vui lòng chọn lý do chuyển cấp", "error");
      return;
    }
    setIsLoading(true);
    const taskPayload = {
      taskType:
        item.type === "PROJECT"
          ? "PROJECT_MODERATION"
          : item.type === "PROFILE"
            ? "PROFILE_MODERATION"
            : "GIG_MODERATION",
      referenceId: item.idRaw,
      title: `[CHUYỂN CẤP] Kiểm duyệt: ${item.title}`,
      description: `Yêu cầu chuyển cấp kiểm duyệt nội dung. Lý do: ${reason}. Nội dung gốc: ${item.detail || ""}`,
      requiredDepartments: staffDepartmentCode || "MOD",
      status: "ESCALATED",
      assignedToEmail: null,
    };
    // gui thong bao
    adminApi
      .createVerificationTask(taskPayload)
      .then((res) => {
        setIsLoading(false);
        if (res.success) {
          showToast(
            "Đã báo cáo sự cố và chuyển cấp tác vụ thành công.",
            "success",
          );
          fetchTasks();
          fetchModerationItems();
          setShowModerationModal(false);
          setShowModEscalateForm(false);
          setModEscalateReason("");
        } else {
          showToast(res.message || "Chuyển cấp thất bại.", "error");
        }
      })
      .catch((err) => {
        setIsLoading(false);
        console.error(err);
        showToast("Lỗi kết nối máy chủ.", "error");
      });
  };

  const handleEscalateReport = (report, reason) => {
    if (!reason) {
      showToast("Vui lòng chọn lý do chuyển cấp", "error");
      return;
    }
    setReportActionLoading(true);
    const adminId = user?.id || 1;

    adminApi
      .resolveReport(report.idRaw, "ESCALATED", adminId)
      .then((resolveRes) => {
        if (resolveRes.success) {
          const taskPayload = {
            taskType: "REPORT_RESOLUTION",
            referenceId: report.idRaw,
            title: `[CHUYỂN CẤP] Báo cáo vi phạm: [${report.type}] ${report.target || "Nội dung"}`,
            description: `Yêu cầu chuyển cấp xử lý báo cáo. Lý do: ${reason}. Người báo cáo: ${report.reporter}. Bị báo cáo: ${report.accused}. Bằng chứng: ${report.evidence}`,
            requiredDepartments: staffDepartmentCode || "MOD",
            status: "ESCALATED",
            assignedToEmail: null,
          };
          return adminApi.createVerificationTask(taskPayload);
        } else {
          throw new Error(
            resolveRes.message || "Cập nhật trạng thái báo cáo thất bại.",
          );
        }
      })
      .then((res) => {
        setReportActionLoading(false);
        if (res.success) {
          showToast(
            "Đã báo cáo sự cố và chuyển cấp tác vụ thành công.",
            "success",
          );
          fetchTasks();
          fetchModerationItems();
          fetchModerationData();
          setSelectedReport(null);
          setShowReportEscalateForm(false);
          setReportEscalateReason("");
        } else {
          showToast(res.message || "Chuyển cấp thất bại.", "error");
        }
      })
      .catch((err) => {
        setReportActionLoading(false);
        console.error(err);
        showToast(err.message || "Lỗi kết nối máy chủ.", "error");
      });
  };

  const normalizeDepartmentCode = (value) => {
    const normalized = String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase();

    if (!normalized) return "";
    if (
      normalized.includes("FIN") ||
      normalized.includes("TAI CHINH") ||
      normalized.includes("FINANCE")
    )
      return "FIN";
    if (
      normalized.includes("MOD") ||
      normalized.includes("KIEM DUYET") ||
      normalized.includes("MODERATION")
    )
      return "MOD";
    if (
      normalized.includes("DIS") ||
      normalized.includes("TRANH CHAP") ||
      normalized.includes("DISPUTE")
    )
      return "DIS";
    if (
      normalized.includes("CS") ||
      normalized.includes("HO TRO") ||
      normalized.includes("CUSTOMER SUPPORT") ||
      normalized.includes("SUPPORT")
    )
      return "CS";
    if (
      normalized.includes("IT") ||
      normalized.includes("KY THUAT") ||
      normalized.includes("DEVELOPMENT")
    )
      return "IT";
    return "";
  };

  const staffDepartmentCode = (() => {
    return (
      normalizeDepartmentCode(myProfile?.departmentCode) ||
      normalizeDepartmentCode(user?.departmentCode) ||
      normalizeDepartmentCode(user?.department) ||
      normalizeDepartmentCode(myProfile?.departmentName) ||
      normalizeDepartmentCode(user?.departmentName) ||
      normalizeDepartmentCode(myProfile?.specialization) ||
      normalizeDepartmentCode(user?.specialization) ||
      (() => {
        const email = String(user?.email || "").toLowerCase();
        if (email.includes("moderation") || email.includes("mod")) return "MOD";
        if (email.includes("finance") || email.includes("fin")) return "FIN";
        if (email.includes("dispute") || email.includes("dis")) return "DIS";
        if (email.includes("support") || email.includes("cs")) return "CS";
        if (email.includes("it") || email.includes("tech")) return "IT";
        return "CS";
      })()
    );
  })();

  // phan quyen hien thi theo staff
  const taskBelongsToCurrentStaff = (task) => {
    if (
      normalizeRole(currentRole) === "ADMIN" ||
      normalizeRole(currentRole) === "MANAGER"
    )
      return true;

    // If the task has been assigned to someone, check if it matches current staff email or username prefix
    if (task.assignedToEmail) {
      const assigned = String(task.assignedToEmail).toLowerCase().trim();
      const myEmail = String(user?.email || "")
        .toLowerCase()
        .trim();
      if (!myEmail) return false;
      const myUserPrefix = myEmail.split("@")[0];
      const assignedPrefix = assigned.split("@")[0];

      if (
        assigned === myEmail ||
        assignedPrefix === myUserPrefix ||
        assigned === myUserPrefix ||
        assignedPrefix === myEmail
      ) {
        return true;
      }
    }

    // If the task is not assigned yet, show it to anyone in the required department
    const requiredDepartments = String(task.requiredDepartments || "")
      .split(",")
      .map((dept) => normalizeDepartmentCode(dept.trim()))
      .filter(Boolean);

    return (
      requiredDepartments.length === 0 ||
      requiredDepartments.includes(staffDepartmentCode)
    );
  };

  const myTasks = tasks.filter(taskBelongsToCurrentStaff);
  const pendingTasksCount = myTasks.filter(
    (t) => t.status === "Pending",
  ).length;
  const pendingItems = useMemo(() => {
    return moderationItems.filter((i) => {
      if (i.status !== "Pending") return false;
      const hasTask = tasks.some(
        (t) =>
          t.status !== "Completed" &&
          t.status !== "Rejected" &&
          String(t.referenceId) === String(i.idRaw) &&
          (i.type === "PROFILE"
            ? t.type === "PROFILE_MODERATION"
            : i.type === "GIG"
              ? t.type === "GIG_MODERATION"
              : i.type === "REVIEW"
                ? t.type === "REPORT_RESOLUTION"
                : t.type === "PROJECT_MODERATION"),
      );
      return !hasTask;
    });
  }, [moderationItems, tasks]);
  //  loc kiem duyet
  const filteredPendingItems = useMemo(() => {
    return pendingItems.filter((item) => {
      if (queueTab !== "ALL" && item.type !== queueTab) return false;
      if (queueSearch) {
        const lowerSearch = queueSearch.toLowerCase();
        return (
          item.author?.toLowerCase().includes(lowerSearch) ||
          item.reason?.toLowerCase().includes(lowerSearch)
        );
      }
      return true;
    });
  }, [pendingItems, queueTab, queueSearch]);

  const processedItems = useMemo(() => {
    return moderationItems.filter((item) => item.status !== "Pending");
  }, [moderationItems]);

  const escalatedModerationTasks = useMemo(() => {
    return tasks.filter(
      (t) =>
        t.status === "Escalated" &&
        (t.type === "PROJECT_MODERATION" ||
          t.type === "GIG_MODERATION" ||
          t.type === "PROFILE_MODERATION"),
    );
  }, [tasks]);

  const formatTimeRelative = (dateString) => {
    if (!dateString) return "Vừa xong";
    const diff = new Date() - new Date(dateString);
    if (isNaN(diff)) return dateString;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const statusLabel = (status) =>
    status === "Approved"
      ? "Đã duyệt"
      : status === "Rejected"
        ? "Đã từ chối"
        : "Chờ xử lý";

  const severityClass = (severity) =>
    severity === "Cao" || severity === "Khẩn cấp"
      ? "bg-[#ffdad6] text-[#ba1a1a] border-[#ffdad6]"
      : "bg-amber-50 text-amber-700 border-amber-200";

  const pendingModerationCount = pendingItems.length;
  const pendingKycCount = kycRequests.filter(
    (r) => r.status === "Pending",
  ).length;
  const unreadSupportCount = supportChats.reduce(
    (sum, c) => sum + (c.unread || 0),
    0,
  );
  const pendingWithdrawalCount = withdrawals.filter(
    (w) => w.status === "PENDING" || w.status === "Pending",
  ).length;
  const failedTransactionCount = vnpayTxns.filter(
    (tx) =>
      tx.status === "FAILED" || tx.status === "Failed" || tx.status === "ERROR",
  ).length;
  const openDisputeCount = escalationCases.filter(
    (item) => item.status !== "Resolved",
  ).length;

  const commonSidebarItems = [
    { id: "Dashboard", label: "Bảng điều khiển", icon: LayoutDashboard },
  ];

  const departmentSidebarGroups = {
    FIN: {
      key: "finance",
      title: "FINANCE",
      icon: BadgeDollarSign,
      items: [
        {
          id: "Tasks",
          label: "Công việc của tôi",
          icon: CheckSquare,
          badge: pendingTasksCount,
        },
        {
          id: "Withdrawals",
          label: "Rút tiền",
          icon: BadgeDollarSign,
          badge: pendingWithdrawalCount,
        },
        { id: "Refunds", label: "Hoàn tiền", icon: BadgeDollarSign },
        {
          id: "FailedTransactions",
          label: "Giao dịch lỗi",
          icon: AlertTriangle,
          badge: failedTransactionCount,
        },
      ],
    },
    MOD: {
      key: "moderation",
      title: "MODERATION",
      icon: Gavel,
      items: [
        // nut cong viec cua toi
        {
          id: "Tasks",
          label: "Công việc của tôi",
          icon: CheckSquare,
          badge: pendingTasksCount,
        },
        // nut kiem duyet
        {
          id: "Moderation",
          label: "Kiểm duyệt",
          icon: Gavel,
          badge: pendingModerationCount,
        },
        // nut bao cao vi pham
        {
          id: "Reports",
          label: "Báo cáo vi phạm",
          icon: ShieldAlert,
          badge: violationReports.filter(
            (r) =>
              r.status === "Chờ xử lý" ||
              r.status === "PENDING" ||
              r.status === "Pending",
          ).length,
        },

        // nut lich su hoat dong
        { id: "ModHistory", label: "Lịch sử hoạt động", icon: FileText },
      ],
    },
    DIS: {
      key: "disputeResolution",
      title: "DISPUTE RESOLUTION",
      icon: ShieldAlert,
      items: [
        {
          id: "Tasks",
          label: "Công việc của tôi",
          icon: CheckSquare,
          badge: pendingTasksCount,
        },
        {
          id: "Disputes",
          label: "Tranh chấp Freelancer - Employer",
          icon: ShieldAlert,
          badge: openDisputeCount,
        },
        {
          id: "PaymentComplaints",
          label: "Khiếu nại thanh toán",
          icon: BadgeDollarSign,
        },
      ],
    },
    CS: {
      key: "customerSupport",
      title: "CUSTOMER SUPPORT",
      icon: MessageSquare,
      items: [
        {
          id: "Tasks",
          label: "Công việc của tôi",
          icon: CheckSquare,
          badge: pendingTasksCount,
        },
        {
          id: "Support",
          label: "Ticket hỗ trợ",
          icon: MessageSquare,
          badge: unreadSupportCount,
        },
      ],
    },
    IT: {
      key: "itDevelopment",
      title: "IT & DEVELOPMENT",
      icon: Terminal,
      items: [
        {
          id: "Tasks",
          label: "Công việc của tôi",
          icon: CheckSquare,
          badge: pendingTasksCount,
        },
        {
          id: "FailedTransactions",
          label: "Sự cố & Giao dịch kỹ thuật",
          icon: AlertTriangle,
          badge: failedTransactionCount,
        },
      ],
    },
  };

  const activeDepartmentSidebarGroup =
    departmentSidebarGroups[staffDepartmentCode] || departmentSidebarGroups.CS;
  const visibleSidebarTabIds = [
    ...commonSidebarItems.filter((item) => item.id).map((item) => item.id),
    ...activeDepartmentSidebarGroup.items.map((item) => item.id),
  ];
  const visibleSidebarTabKey = visibleSidebarTabIds.join("|");

  useEffect(() => {
    if (!visibleSidebarTabIds.includes(activeTab)) {
      setActiveTab("Dashboard");
    }
  }, [activeTab, staffDepartmentCode, visibleSidebarTabKey]);

  // loc cong viec cua toi
  const filteredTasks = tasks
    .filter((t) => {
      if (!taskBelongsToCurrentStaff(t)) return false;

      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        String(t.id || "")
          .toLowerCase()
          .includes(query) ||
        String(t.type || "")
          .toLowerCase()
          .includes(query) ||
        String(t.user || "")
          .toLowerCase()
          .includes(query) ||
        String(t.author || "")
          .toLowerCase()
          .includes(query) ||
        String(t.title || "")
          .toLowerCase()
          .includes(query) ||
        String(t.description || "")
          .toLowerCase()
          .includes(query);

      if (taskFilter === "ALL") return matchesSearch;
      if (taskFilter === "Assigned") {
        return (
          matchesSearch &&
          t.assignedToEmail &&
          user?.email &&
          String(t.assignedToEmail).toLowerCase().trim() ===
            String(user.email).toLowerCase().trim()
        );
      }
      return (
        matchesSearch &&
        String(t.status || "").toLowerCase() === taskFilter.toLowerCase()
      );
    })
    .sort((a, b) => b.taskId - a.taskId);

  // loc bao cao
  const filteredReports = violationReports.filter((r) => {
    // Status filter
    if (reportFilter !== "ALL") {
      if (reportFilter === "PENDING" && r.status !== "Chờ xử lý") return false;
      if (reportFilter === "RESOLVED" && r.status !== "Đã xử lý") return false;
      if (reportFilter === "ESCALATED" && r.status !== "Đã chuyển cấp")
        return false;
    }
    // Type filter
    if (reportTypeFilter !== "ALL") {
      if (reportTypeFilter === "PROJECT" && r.target !== "PROJECT")
        return false;
      if (reportTypeFilter === "USER" && r.target !== "USER") return false;
    }
    // Search filter
    if (reportSearch) {
      const searchLower = reportSearch.toLowerCase();
      const matchesTarget = r.target?.toLowerCase().includes(searchLower);
      const matchesReporter = r.reporter?.toLowerCase().includes(searchLower);
      const matchesAccused = r.accused?.toLowerCase().includes(searchLower);
      const matchesEvidence = r.evidence?.toLowerCase().includes(searchLower);
      if (
        !matchesTarget &&
        !matchesReporter &&
        !matchesAccused &&
        !matchesEvidence
      )
        return false;
    }
    return true;
  });

  // loc kyc
  const filteredKyc = kycRequests
    .filter((req) => {
      if (kycRoleFilter !== "ALL" && req.role !== kycRoleFilter) return false;

      if (!kycSearch) return true;
      const searchLower = kycSearch.toLowerCase();
      return (
        (req.name && req.name.toLowerCase().includes(searchLower)) ||
        (req.email && req.email.toLowerCase().includes(searchLower)) ||
        (req.id && req.id.toLowerCase().includes(searchLower))
      );
    })
    .sort((a, b) => {
      const dateA = new Date(a.subDate || 0).getTime();
      const dateB = new Date(b.subDate || 0).getTime();
      return kycSortOrder === "NEWEST" ? dateB - dateA : dateA - dateB;
    });

  // Calculate stats count
  const countAssigned = myTasks.length;
  const countPending = myTasks.filter((t) => t.status === "Pending").length;
  const countCompleted = myTasks.filter((t) => t.status === "Completed").length;
  const countOverdue = myTasks.filter(
    (t) => t.status === "In Progress" && t.deadline.includes("Today"),
  ).length;

  // Chart coordinates calculator
  const activeChartData =
    userGrowthTrend.length > 0
      ? userGrowthTrend
      : [
          { label: "Mon", value: 12 },
          { label: "Tue", value: 19 },
          { label: "Wed", value: 15 },
          { label: "Thu", value: 25 },
          { label: "Fri", value: 22 },
          { label: "Sat", value: 30 },
          { label: "Sun", value: 28 },
        ];
  const chartHeight = 180;
  const chartWidth = 580;
  const paddingX = 40;
  const paddingY = 30;

  const points = activeChartData.map((d, i) => {
    const x =
      paddingX +
      (i * (chartWidth - paddingX * 2)) / (activeChartData.length - 1);
    const maxVal = Math.max(
      ...activeChartData.map((item) => item.value || 1),
      30,
    );
    const val = d.value || 0;
    const y =
      chartHeight - paddingY - (val * (chartHeight - paddingY * 2)) / maxVal;
    return { x, y, day: d.label, completion: val };
  });

  // Smooth curve path (using cubic bezier approximation or simple lines)
  let smoothCurvePath = "";
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
    : "";

  // Computed chat lists for support sub-tabs
  const openChats = supportChats.filter(
    (c) => !(c.blocked_until && new Date(c.blocked_until) > new Date()),
  );
  const claimedChats = openChats.filter(
    (c) => c.assigned_staff_id || c.assignedStaffId,
  );
  const unclaimedChats = openChats.filter(
    (c) => !(c.assigned_staff_id || c.assignedStaffId),
  );
  const blockedChats = supportChats.filter(
    (c) => c.blocked_until && new Date(c.blocked_until) > new Date(),
  );
  const displayedChats = (() => {
    let base;
    if (supportSubTab === "deleted") base = deletedChats;
    else if (supportSubTab === "blocked") base = blockedChats;
    else if (supportSubTab === "claimed") base = claimedChats;
    else base = unclaimedChats;
    if (!chatSearch.trim()) return base;
    return base.filter(
      (c) =>
        c.name?.toLowerCase().includes(chatSearch.toLowerCase()) ||
        c.lastMessage?.toLowerCase().includes(chatSearch.toLowerCase()),
    );
  })();

  // Active chat
  const activeChat =
    (supportSubTab === "deleted" ? deletedChats : supportChats).find(
      (c) => c.id === selectedChatId,
    ) || null;

  // Doughnut calculations
  const totalCircumference = 314.16;
  const pInProg =
    supportStats.total > 0
      ? supportStats.inProgress / supportStats.total
      : 0.54;
  const pPend =
    supportStats.total > 0 ? supportStats.pending / supportStats.total : 0.28;
  const pWait =
    supportStats.total > 0
      ? supportStats.waitingUser / supportStats.total
      : 0.18;

  const lenInProgress = totalCircumference * pInProg;
  const lenPending = totalCircumference * pPend;
  const lenWaitingUser = totalCircumference * pWait;

  const offsetInProgress = 0;
  const offsetPending = -lenInProgress;
  const offsetWaitingUser = -(lenInProgress + lenPending);

  const displayTotal = supportStats.total;
  const displayInProgressPercent =
    supportStats.total > 0 ? supportStats.inProgressPercent : 54;
  const displayPendingPercent =
    supportStats.total > 0 ? supportStats.pendingPercent : 28;
  const displayWaitingUserPercent =
    supportStats.total > 0 ? supportStats.waitingUserPercent : 18;

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
        className={`w-full flex items-center justify-between px-3.5 ${compact ? "py-2" : "py-2.5"} rounded-xl text-body-sm font-semibold transition-all duration-200 group relative focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 ${
          isActive
            ? "bg-emerald-50/80 text-emerald-800 border border-emerald-100 shadow-sm shadow-emerald-600/5"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
        }`}
      >
        {isActive && (
          <span className="absolute left-0 top-[20%] bottom-[20%] w-[3px] bg-emerald-600 rounded-r-full" />
        )}
        <div
          className={`flex items-center ${compact ? "gap-2.5" : "gap-3"} min-w-0`}
        >
          <IconComp
            className={`${compact ? "w-[16px] h-[16px]" : "w-[18px] h-[18px]"} stroke-[2] shrink-0 transition-colors ${
              isActive
                ? "text-emerald-600"
                : "text-slate-400 group-hover:text-slate-700"
            }`}
          />
          <span className="truncate group-hover:translate-x-[2px] transition-transform duration-200">
            {item.label}
          </span>
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
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-body-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all duration-200 group relative focus:outline-none"
        >
          <div className="flex items-center gap-3 min-w-0">
            <GroupIcon className="w-[18px] h-[18px] stroke-[2] text-slate-400 group-hover:text-slate-700 shrink-0 transition-colors" />
            <span className="truncate uppercase tracking-wider text-[11px] font-extrabold text-slate-400 group-hover:text-slate-600">
              {group.title}
            </span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-0" : "-rotate-90"}`}
          />
        </button>
        {isOpen && (
          <div className="pl-3.5 space-y-1 border-l border-slate-100 ml-[23px] mt-1.5 animate-in fade-in duration-200">
            {group.items.map((item) => renderSidebarItem(item, true))}
          </div>
        )}
      </div>
    );
  };

  const isTransferPending = latestTransferRequest?.status === "PENDING";

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
          {toast.type === "success" ? (
            <div className="w-8 h-8 rounded-full bg-[#f7fff2] flex items-center justify-center text-[#006b2c]">
              <Check className="w-5 h-5" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#ffdad6] flex items-center justify-center text-[#ba1a1a]">
              <AlertCircle className="w-5 h-5" />
            </div>
          )}
          <div>
            <p className="text-body-sm font-bold text-[#141b2b]">
              {toast.message}
            </p>
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
              <p className="text-[10px] text-[#3e4a3d] font-bold uppercase tracking-wider mt-0.5">
                {brandSub}
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto py-4 px-3 space-y-4 scrollbar-hidden">
            <p className="text-[10px] font-bold text-[#6e7b6c] uppercase tracking-wider px-3 mb-1">
              Không gian làm việc
            </p>
            <nav className="space-y-4">
              <div className="space-y-1">
                {commonSidebarItems.map((item) => renderSidebarItem(item))}
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
                <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-[#bdcaba]/60 bg-slate-50/40 hover:bg-slate-50 hover:border-emerald-600/40 hover:shadow-sm transition-all duration-300 cursor-pointer group">
                  <div className="flex flex-col text-right sm:block hidden">
                    <span
                      className="text-[13px] font-bold text-[#141b2b] leading-tight truncate max-w-[150px] block"
                      title={user?.displayName || user?.name || user?.email}
                    >
                      {user?.displayName ||
                        user?.name ||
                        user?.email ||
                        "Nhân viên"}
                    </span>
                    <div className="flex justify-end mt-0.5">
                      <span className="inline-flex items-center text-[9px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded bg-emerald-50 text-[#006b2c] border border-emerald-100/60 leading-none">
                        {currentRole === "MANAGER"
                          ? `Manager / ${myProfile?.departmentName || "CS"}`
                          : `Staff / ${myProfile?.departmentName || "CS"}`}
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
                        {user?.name ? user.name.charAt(0).toUpperCase() : "S"}
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

                  {/* yeu cau dieu chuyen */}
                  <div className="profile-menu-item">
                    <button
                      onClick={() => {
                        setSelectedRequestDetails(null);
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
          {activeTab === "Dashboard" && (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* Sub-header & Quick Shortcuts */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#e1e8fd] shadow-sm">
                <div>
                  <h1 className="text-headline-lg text-[#141b2b] font-extrabold tracking-tight">
                    Tổng quan hệ thống
                  </h1>
                  <p className="text-body-sm text-[#6e7b6c] mt-0.5">
                    Chào mừng trở lại. Dưới đây là tình hình công việc của bạn
                    hôm nay.
                  </p>
                </div>
                {/* Quick Action Navigation Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setActiveTab("Tasks")}
                    className="px-3.5 py-2 bg-[#f1f3ff] hover:bg-[#e1e8fd] text-[#006b2c] rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-emerald-100"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Công việc ({pendingTasksCount})</span>
                  </button>
                  {visibleSidebarTabIds.includes("Moderation") && (
                    <button
                      onClick={() => setActiveTab("Moderation")}
                      className="px-3.5 py-2 bg-[#f1f3ff] hover:bg-[#e1e8fd] text-[#0058be] rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-blue-100"
                    >
                      <Gavel className="w-3.5 h-3.5" />
                      <span>Kiểm duyệt ({pendingModerationCount})</span>
                    </button>
                  )}
                  {visibleSidebarTabIds.includes("KYC") && (
                    <button
                      onClick={() => setActiveTab("KYC")}
                      className="px-3.5 py-2 bg-[#f1f3ff] hover:bg-[#e1e8fd] text-amber-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-amber-100"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>KYC ({pendingKycCount})</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 4 Redesigned Interactive Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Card 1: Assigned Tasks */}
                <div
                  onClick={() => setActiveTab("Tasks")}
                  className="card-level-1 p-5 relative overflow-hidden flex flex-col justify-between min-h-[130px] cursor-pointer group hover:border-[#006b2c] transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-[#f7fff2] text-[#006b2c] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <CheckSquare className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold text-[#006b2c] bg-[#f7fff2] px-2.5 py-1 rounded-full border border-emerald-100">
                      Tác vụ cá nhân
                    </span>
                  </div>
                  <div className="mt-3">
                    <p className="text-label-md text-[#6e7b6c] uppercase tracking-wider">
                      Công việc được giao
                    </p>
                    <div className="flex items-baseline justify-between mt-1">
                      <h2 className="text-display-lg text-[#141b2b]">
                        {countAssigned}
                      </h2>
                      <span className="text-xs text-[#006b2c] font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        Chi tiết <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 2: Pending Approval */}
                <div
                  onClick={() => {
                    if (visibleSidebarTabIds.includes("Moderation"))
                      setActiveTab("Moderation");
                    else if (visibleSidebarTabIds.includes("KYC"))
                      setActiveTab("KYC");
                    else setActiveTab("Tasks");
                  }}
                  className="card-level-1 p-5 relative overflow-hidden flex flex-col justify-between min-h-[130px] cursor-pointer group hover:border-[#0058be] transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0058be] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Clock className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                        countPending > 0
                          ? "text-[#0058be] bg-blue-50 border-blue-100"
                          : "text-slate-600 bg-slate-50 border-slate-200"
                      }`}
                    >
                      {countPending > 0 ? "Cần xử lý ngay" : "Đã hoàn tất"}
                    </span>
                  </div>
                  <div className="mt-3">
                    <p className="text-label-md text-[#6e7b6c] uppercase tracking-wider">
                      Chờ phê duyệt
                    </p>
                    <div className="flex items-baseline justify-between mt-1">
                      <h2 className="text-display-lg text-[#141b2b]">
                        {countPending}
                      </h2>
                      <span className="text-xs text-[#0058be] font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        Xem hàng chờ <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 3: Completed Today */}
                <div className="card-level-1 p-5 relative overflow-hidden flex flex-col justify-between min-h-[130px]">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-[#f7fff2] text-[#006b2c] flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold text-[#006b2c] bg-[#f7fff2] px-2.5 py-1 rounded-full border border-emerald-100">
                      Hôm nay
                    </span>
                  </div>
                  <div className="mt-3">
                    <p className="text-label-md text-[#6e7b6c] uppercase tracking-wider">
                      Hoàn thành hôm nay
                    </p>
                    <h2 className="text-display-lg text-[#141b2b] mt-1">
                      {countCompleted}
                    </h2>
                  </div>
                </div>

                {/* Card 4: Overdue Tasks */}
                <div className="card-level-1 p-5 relative overflow-hidden flex flex-col justify-between min-h-[130px]">
                  <div className="flex items-start justify-between">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        countOverdue > 0
                          ? "bg-[#ffdad6] text-[#ba1a1a]"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                        countOverdue > 0
                          ? "text-[#ba1a1a] bg-[#ffdad6] border-[#ffdad6]"
                          : "text-slate-600 bg-slate-50 border-slate-200"
                      }`}
                    >
                      {countOverdue > 0 ? "Khẩn cấp" : "Bình thường"}
                    </span>
                  </div>
                  <div className="mt-3">
                    <p className="text-label-md text-[#6e7b6c] uppercase tracking-wider">
                      Quá hạn
                    </p>
                    <h2
                      className={`text-display-lg mt-1 ${
                        countOverdue > 0 ? "text-[#ba1a1a]" : "text-[#141b2b]"
                      }`}
                    >
                      {countOverdue}
                    </h2>
                  </div>
                </div>
              </div>

              {/* 2 Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Column 1 & 2: Task Completion Area Chart */}
                <div className="lg:col-span-2 card-level-1 p-6 bg-white flex flex-col justify-between min-h-[320px]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-body-lg font-bold text-[#141b2b]">
                        Công việc hoàn thành theo ngày
                      </h3>
                      <p className="text-xs text-[#6e7b6c]">
                        Đánh giá hiệu suất làm việc dựa trên số lượng yêu cầu đã
                        giải quyết.
                      </p>
                    </div>
                    <select
                      value={chartPeriod}
                      onChange={(e) => {
                        setChartPeriod(e.target.value);
                        setHoveredPoint(null);
                      }}
                      className="bg-[#f1f3ff] border border-[#e1e8fd] text-[#141b2b] text-xs font-bold px-3 py-1.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006b2c]/30 transition-all cursor-pointer"
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
                        const y =
                          chartHeight -
                          paddingY -
                          (val * (chartHeight - paddingY * 2)) / 30;
                        return (
                          <g key={val}>
                            <line
                              x1={paddingX}
                              y1={y}
                              x2={chartWidth - paddingX}
                              y2={y}
                              stroke="#f1f3ff"
                              strokeWidth="1.5"
                            />
                            <text
                              x={paddingX - 10}
                              y={y + 4}
                              textAnchor="end"
                              className="text-[10px] font-bold text-[#6e7b6c] fill-current"
                            >
                              {val}
                            </text>
                          </g>
                        );
                      })}

                      {/* Area Under Smooth Curve */}
                      <path d={areaPath} fill="url(#chart-gradient)" />

                      {/* Smooth Curved Line */}
                      <path
                        d={smoothCurvePath}
                        fill="none"
                        stroke="#006b2c"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />

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
                            r={
                              hoveredPoint && hoveredPoint.day === p.day ? 6 : 4
                            }
                            fill={
                              hoveredPoint && hoveredPoint.day === p.day
                                ? "#006b2c"
                                : "#ffffff"
                            }
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
                        <linearGradient
                          id="chart-gradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#006b2c"
                            stopOpacity="0.25"
                          />
                          <stop
                            offset="100%"
                            stopColor="#006b2c"
                            stopOpacity="0.0"
                          />
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
                        <p className="text-[10px] uppercase font-bold text-[#6e7b6c]">
                          {hoveredPoint.day}
                        </p>
                        <p className="text-body-sm font-extrabold text-[#006b2c] mt-0.5">
                          {hoveredPoint.completion} Công việc hoàn thành
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Column 3: Priority Quick List or Support Overview */}
                <div className="card-level-1 p-6 bg-white flex flex-col justify-between min-h-[320px]">
                  <div>
                    <h3 className="text-body-lg font-bold text-[#141b2b]">
                      Tổng quan trạng thái
                    </h3>
                    <p className="text-xs text-[#6e7b6c]">
                      Phân bổ công việc & trạng thái xử lý hệ thống.
                    </p>
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
                        <text
                          x="75"
                          y="70"
                          textAnchor="middle"
                          className="text-[10px] font-bold text-[#6e7b6c] fill-current"
                        >
                          TỔNG
                        </text>
                        <text
                          x="75"
                          y="90"
                          textAnchor="middle"
                          className="text-title-md font-extrabold text-[#141b2b] fill-current"
                        >
                          {displayTotal}
                        </text>
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
                      <span className="font-bold text-[#3e4a3d]">
                        {displayInProgressPercent}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-body-sm">
                      <div className="flex items-center gap-2 font-semibold text-[#141b2b]">
                        <span className="w-3 h-3 bg-[#0058be] rounded-full" />
                        <span>Chờ xử lý</span>
                      </div>
                      <span className="font-bold text-[#3e4a3d]">
                        {displayPendingPercent}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-body-sm">
                      <div className="flex items-center gap-2 font-semibold text-[#141b2b]">
                        <span className="w-3 h-3 bg-[#6bff8f] rounded-full" />
                        <span>Chờ phản hồi</span>
                      </div>
                      <span className="font-bold text-[#3e4a3d]">
                        {displayWaitingUserPercent}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ---------------- TAB: TASKS (Công việc của tôi) ---------------- */}
          {activeTab === "Tasks" && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div>
                <h1 className="text-headline-lg font-extrabold text-[#141b2b]">
                  Công việc của tôi
                </h1>
                <p className="text-body-sm text-[#3e4a3d] mt-1">
                  Danh sách các nhiệm vụ được Manager phân công cho bạn xử lý.
                </p>
              </div>

              {/* Data Table: My Assigned Work */}
              <div className="card-level-1 p-6 bg-white">
                <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-[#e1e8fd] gap-4">
                  <h3 className="text-title-md font-extrabold text-[#141b2b]">
                    Nhiệm vụ được giao
                  </h3>

                  {/* Filters & Actions */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Status Tabs */}
                    <div className="flex bg-[#f1f3ff] p-1 rounded-lg">
                      {[
                        "ALL",
                        "Assigned",
                        "Pending",
                        "In Progress",
                        "Completed",
                      ].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setTaskFilter(tab)}
                          className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                            taskFilter === tab
                              ? "bg-white text-[#006b2c] shadow-sm"
                              : "text-[#6e7b6c] hover:text-[#141b2b]"
                          }`}
                        >
                          {tab === "ALL"
                            ? "Tất cả"
                            : tab === "Assigned"
                              ? "Được phân công"
                              : tab === "Pending"
                                ? "Chờ xử lý"
                                : tab === "In Progress"
                                  ? "Đang xử lý"
                                  : "Hoàn thành"}
                        </button>
                      ))}
                    </div>
                    {/* Search bar */}
                    <div className="w-48 relative">
                      <span className="absolute inset-y-0 left-3 flex items-center text-[#6e7b6c]">
                        <Search className="w-3.5 h-3.5" />
                      </span>
                      <input
                        type="text"
                        placeholder="Tìm kiếm..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#f1f3ff] border-none placeholder-[#6e7b6c] pl-9 pr-3 py-1.5 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#006b2c]/30 focus:bg-white border transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Table container */}
                <div className="overflow-x-auto mt-4 -mx-6">
                  <div className="inline-block min-w-full align-middle px-6">
                    <table className="min-w-full divide-y divide-[#e9edff] text-left">
                      <thead>
                        <tr className="bg-[#f9f9ff]">
                          <th className="px-4 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">
                            Nội dung
                          </th>
                          <th className="px-4 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">
                            Tác giả
                          </th>
                          <th className="px-4 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">
                            Ngày gửi
                          </th>
                          <th className="px-4 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">
                            Trạng thái
                          </th>
                          <th className="px-4 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider text-right sticky right-0 bg-[#f9f9ff]">
                            Thao tác
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e9edff] bg-white">
                        {filteredTasks.length > 0 ? (
                          filteredTasks.map((t) => (
                            <tr
                              key={t.id}
                              className="hover:bg-[#f7fff2]/30 transition-colors group"
                            >
                              <td className="px-4 py-4">
                                <div className="min-w-[240px]">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                      t.type.includes("PROJECT")
                                        ? "bg-[#e9edff] text-[#141b2b] border-[#bdcaba]"
                                        : t.type.includes("PROFILE")
                                          ? "bg-amber-50 text-amber-800 border-amber-200"
                                          : t.type.includes("REPORT")
                                            ? "bg-rose-50 text-rose-800 border-rose-200"
                                            : "bg-purple-50 text-purple-800 border-purple-200"
                                    }`}
                                  >
                                    {t.type.includes("PROJECT") && (
                                      <FileText className="w-3 h-3" />
                                    )}
                                    {t.type.includes("PROFILE") && (
                                      <User className="w-3 h-3" />
                                    )}
                                    {t.type.includes("REPORT") && (
                                      <ShieldAlert className="w-3 h-3" />
                                    )}
                                    {t.type
                                      ? String(t.type).replace(
                                          /_MODERATION/g,
                                          "",
                                        )
                                      : ""}
                                  </span>
                                  <h4
                                    className="text-body-sm font-bold text-[#141b2b] mt-1.5 cursor-pointer hover:text-[#006b2c] transition-colors"
                                    onClick={() => {
                                      if (
                                        t.assignedToEmail &&
                                        t.assignedToEmail !==
                                          (user?.email || "staff@gmail.com")
                                      ) {
                                        showToast(
                                          `Tác vụ này đang được xử lý bởi nhân viên ${t.assignedToEmail}. Bạn không thể can thiệp!`,
                                          "error",
                                        );
                                        return;
                                      }
                                      setSelectedTask(t);
                                      setShowManageModal(true);
                                    }}
                                  >
                                    {t.title}
                                  </h4>
                                  {t.description && (
                                    <p
                                      className="text-xs text-[#6e7b6c] mt-0.5 line-clamp-1"
                                      title={t.description}
                                    >
                                      {t.description}
                                    </p>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-body-sm font-semibold text-[#141b2b]">
                                {t.author || t.user}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-body-sm font-semibold text-[#3e4a3d]">
                                {t.createdAt}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span className="flex items-center gap-1.5 text-body-sm font-semibold">
                                  <span
                                    className={`w-2 h-2 rounded-full ${
                                      t.status === "Completed"
                                        ? "bg-emerald-500"
                                        : t.status === "In Progress"
                                          ? "bg-[#006b2c]"
                                          : t.status === "Rejected"
                                            ? "bg-rose-500"
                                            : "bg-blue-500"
                                    }`}
                                  />
                                  <span>{t.status}</span>
                                </span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-right sticky right-0 bg-white group-hover:bg-[#f7fff2]/30 transition-colors">
                                <button
                                  onClick={() => {
                                    if (
                                      t.assignedToEmail &&
                                      t.assignedToEmail !==
                                        (user?.email || "staff@gmail.com")
                                    ) {
                                      showToast(
                                        `Tác vụ này đang được xử lý bởi nhân viên ${t.assignedToEmail}. Bạn không thể can thiệp!`,
                                        "error",
                                      );
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
                            <td
                              colSpan="5"
                              className="text-center py-8 text-body-sm text-[#6e7b6c] font-semibold"
                            >
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
          {activeTab === "Support" &&
            (() => {
              const matchesChatSearch = (c) =>
                c.name.toLowerCase().includes(chatSearch.toLowerCase());
              const openChats = supportChats.filter(
                (c) =>
                  !(c.blocked_until && new Date(c.blocked_until) > new Date()),
              );
              const claimedChats = openChats.filter(
                (c) =>
                  normalizeId(c.assigned_staff_id || c.assignedStaffId) ===
                  normalizeId(user?.id),
              );
              const unclaimedChats = openChats.filter(
                (c) => !(c.assigned_staff_id || c.assignedStaffId),
              );
              const blockedChats = supportChats.filter(
                (c) =>
                  c.blocked_until &&
                  new Date(c.blocked_until) > new Date() &&
                  normalizeId(c.assigned_staff_id || c.assignedStaffId) ===
                    normalizeId(user?.id),
              );
              const myDeletedChats = deletedChats.filter(
                (c) =>
                  normalizeId(c.assigned_staff_id || c.assignedStaffId) ===
                  normalizeId(user?.id),
              );
              const displayedChats =
                supportSubTab === "claimed"
                  ? claimedChats.filter(matchesChatSearch)
                  : supportSubTab === "unclaimed"
                    ? unclaimedChats.filter(matchesChatSearch)
                    : supportSubTab === "blocked"
                      ? blockedChats.filter(matchesChatSearch)
                      : myDeletedChats.filter(matchesChatSearch);

              const activeChat = (
                supportSubTab === "deleted" ? deletedChats : supportChats
              ).find((c) => c.id === selectedChatId);

              return (
                <div className="max-w-6xl mx-auto h-[calc(100vh-140px)] flex flex-col">
                  <div className="mb-4">
                    <h1 className="text-headline-lg font-extrabold text-[#141b2b]">
                      Trung tâm hỗ trợ
                    </h1>
                    <p className="text-body-sm text-[#3e4a3d] mt-1">
                      Hỗ trợ khách hàng và tư vấn tranh chấp trực tiếp.
                    </p>
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
                            onClick={() => {
                              setSupportSubTab("unclaimed");
                              setSelectedChatId(null);
                            }}
                            className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all border text-center ${
                              supportSubTab === "unclaimed"
                                ? "bg-[#006b2c] text-white border-[#006b2c] shadow-sm shadow-[#006b2c]/10"
                                : "bg-[#f1f3ff] text-[#3e4a3d] border-transparent hover:bg-[#e1e8fd]"
                            }`}
                          >
                            Chưa tiếp nhận ({unclaimedChats.length})
                          </button>
                          <button
                            onClick={() => {
                              setSupportSubTab("claimed");
                              setSelectedChatId(null);
                            }}
                            className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all border text-center ${
                              supportSubTab === "claimed"
                                ? "bg-[#006b2c] text-white border-[#006b2c] shadow-sm shadow-[#006b2c]/10"
                                : "bg-[#f1f3ff] text-[#3e4a3d] border-transparent hover:bg-[#e1e8fd]"
                            }`}
                          >
                            Đã tiếp nhận ({claimedChats.length})
                          </button>
                          <button
                            onClick={() => {
                              setSupportSubTab("blocked");
                              setSelectedChatId(null);
                            }}
                            className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all border text-center ${
                              supportSubTab === "blocked"
                                ? "bg-[#ba1a1a] text-white border-[#ba1a1a] shadow-sm"
                                : "bg-[#f1f3ff] text-[#3e4a3d] border-transparent hover:bg-[#e1e8fd]"
                            }`}
                          >
                            Đã chặn ({blockedChats.length})
                          </button>
                          <button
                            onClick={() => {
                              setSupportSubTab("deleted");
                              setSelectedChatId(null);
                              fetchDeletedSupportChats();
                            }}
                            className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all border text-center ${
                              supportSubTab === "deleted"
                                ? "bg-slate-700 text-white border-slate-700 shadow-sm"
                                : "bg-[#f1f3ff] text-[#3e4a3d] border-transparent hover:bg-[#e1e8fd]"
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
                                ? "bg-[#f7fff2]/50 border-l-[3px] border-[#006b2c]"
                                : "hover:bg-[#f9f9ff]"
                            }`}
                          >
                            <img
                              src={chat.avatar}
                              alt={chat.name}
                              className="w-10 h-10 rounded-full object-cover border border-[#bdcaba] shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="text-body-sm font-bold text-[#141b2b] truncate">
                                  {chat.name}
                                </h4>
                                <span className="text-[10px] text-[#6e7b6c] font-bold">
                                  {chat.time}
                                </span>
                              </div>
                              <p className="text-xs text-[#3e4a3d] truncate mt-1">
                                {chat.lastMessage}
                              </p>
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
                        <h4 className="text-body-lg font-bold text-[#141b2b] mb-1">
                          Chọn một hội thoại
                        </h4>
                        <p className="text-body-sm text-[#6e7b6c] max-w-xs leading-relaxed">
                          Chọn một hội thoại từ danh sách bên trái để bắt đầu
                          nhắn tin hỗ trợ và kiểm duyệt người dùng.
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
                            <img
                              src={activeChat.avatar}
                              alt={activeChat.name}
                              className="w-10 h-10 rounded-full object-cover border border-[#bdcaba]"
                            />
                            <div>
                              <h4 className="text-body-sm font-bold text-[#141b2b]">
                                {activeChat.name}
                              </h4>
                              <span className="text-[10px] font-bold text-[#6e7b6c] flex items-center gap-1">
                                {activeChat.blocked_until &&
                                new Date(activeChat.blocked_until) >
                                  new Date() ? (
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
                                showUserInfo
                                  ? "bg-[#f1f3ff] text-[#141b2b]"
                                  : "bg-white text-[#6e7b6c]"
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
                          {supportSubTab === "deleted" ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 mt-10">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="48"
                                height="48"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="mb-4 opacity-50"
                              >
                                <path d="M3 6h18" />
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                <line x1="10" y1="11" x2="10" y2="17" />
                                <line x1="14" y1="11" x2="14" y2="17" />
                              </svg>
                              <p className="text-sm font-medium">
                                Nội dung hội thoại đã bị ẩn vì đã bị xóa.
                              </p>
                            </div>
                          ) : (
                            <>
                              {Array.isArray(chatMessages) &&
                                chatMessages.map((m, idx) => {
                                  const isMe = isOwnSupportMessage(m);
                                  const msgTime = m.sentAt
                                    ? new Date(m.sentAt).toLocaleTimeString(
                                        "vi-VN",
                                        { hour: "2-digit", minute: "2-digit" },
                                      )
                                    : "";
                                  return (
                                    <div
                                      key={m.messageId || idx}
                                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                                    >
                                      <div
                                        className={`max-w-[70%] flex flex-col ${isMe ? "items-end" : "items-start"}`}
                                      >
                                        {m.messageText &&
                                          m.messageText.trim() !== "" &&
                                          !(
                                            m.attachments &&
                                            m.attachments.length > 0 &&
                                            (m.messageText === "[Hình ảnh]" ||
                                              m.messageText ===
                                                "[Tệp đính kèm]")
                                          ) && (
                                            <div
                                              className={`px-4 py-2.5 rounded-2xl text-body-sm leading-relaxed ${
                                                isMe
                                                  ? "bg-[#006b2c] text-white rounded-tr-none"
                                                  : "bg-white border border-[#e1e8fd] text-[#141b2b] rounded-tl-none shadow-sm"
                                              }`}
                                            >
                                              {m.messageText}
                                            </div>
                                          )}

                                        {/* Attachments rendering */}
                                        {m.attachments &&
                                          m.attachments.length > 0 && (
                                            <div
                                              className={`mt-2 flex flex-col gap-2 ${isMe ? "items-end" : "items-start"}`}
                                            >
                                              {m.attachments.map(
                                                (att, attIdx) => {
                                                  const isImg =
                                                    /\.(jpg|jpeg|png|gif|webp)$/i.test(
                                                      att.fileUrl || "",
                                                    );
                                                  if (isImg) {
                                                    return (
                                                      <a
                                                        key={attIdx}
                                                        href={att.fileUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="block max-w-xs md:max-w-md overflow-hidden rounded-xl border border-slate-200"
                                                      >
                                                        <img
                                                          src={att.fileUrl}
                                                          alt={
                                                            att.fileName ||
                                                            "Image"
                                                          }
                                                          className="w-full h-auto object-cover max-h-60"
                                                        />
                                                      </a>
                                                    );
                                                  }
                                                  return (
                                                    <a
                                                      key={attIdx}
                                                      href={att.fileUrl}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className={`flex items-center gap-3 p-3 rounded-xl border ${isMe ? "bg-white/10 border-white/20 text-white hover:bg-white/20" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"} transition-all`}
                                                    >
                                                      <div
                                                        className={`p-2 rounded-lg ${isMe ? "bg-white/20" : "bg-slate-100"}`}
                                                      >
                                                        <svg
                                                          xmlns="http://www.w3.org/2000/svg"
                                                          width="20"
                                                          height="20"
                                                          viewBox="0 0 24 24"
                                                          fill="none"
                                                          stroke="currentColor"
                                                          strokeWidth="2"
                                                          strokeLinecap="round"
                                                          strokeLinejoin="round"
                                                        >
                                                          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                                          <polyline points="14 2 14 8 20 8" />
                                                        </svg>
                                                      </div>
                                                      <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold truncate max-w-[150px]">
                                                          {att.fileName}
                                                        </p>
                                                        <p
                                                          className={`text-[10px] ${isMe ? "text-emerald-100" : "text-slate-500"}`}
                                                        >
                                                          {(
                                                            att.fileSize / 1024
                                                          ).toFixed(1)}{" "}
                                                          KB
                                                        </p>
                                                      </div>
                                                    </a>
                                                  );
                                                },
                                              )}
                                            </div>
                                          )}

                                        <span className="text-[10px] text-[#6e7b6c] font-bold mt-1 px-1">
                                          {msgTime}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              <div ref={messagesEndRef} />
                            </>
                          )}
                        </div>

                        {/* Input panel / block banner */}
                        {supportSubTab === "deleted" ? (
                          <div className="flex items-center justify-between p-4 bg-slate-100 border-t border-[#e1e8fd] shrink-0">
                            <div className="flex items-center">
                              <AlertCircle className="w-5 h-5 text-slate-500 mr-2 shrink-0" />
                              <span className="text-xs font-bold text-slate-600">
                                Hội thoại này đã bị xóa. Bạn không thể nhắn tin
                                thêm.
                              </span>
                            </div>
                            <button
                              onClick={handleRestoreTicket}
                              className="px-4 py-2 bg-emerald-50 hover:bg-[#f7fff2] text-[#006b2c] border border-[#bdcaba] rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
                            >
                              Khôi phục hội thoại
                            </button>
                          </div>
                        ) : activeChat.blocked_until &&
                          new Date(activeChat.blocked_until) > new Date() ? (
                          <div className="flex items-center justify-center p-4 bg-slate-100 border-t border-[#e1e8fd] h-[76px] shrink-0">
                            <AlertCircle className="w-5 h-5 text-rose-500 mr-2 shrink-0" />
                            <span className="text-xs font-bold text-slate-600">
                              Người dùng này hiện đang bị đình chỉ chat.
                            </span>
                          </div>
                        ) : (
                          <form
                            onSubmit={handleSendChat}
                            className="p-4 bg-white border-t border-[#e1e8fd] flex items-center gap-3 shrink-0"
                          >
                            <button
                              type="button"
                              className="p-2 text-[#6e7b6c] hover:text-[#141b2b] rounded-lg hover:bg-[#f1f3ff] transition-all"
                            >
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
                          <h3 className="font-bold text-title-md text-[#141b2b] mb-1">
                            {activeChat.name}
                          </h3>
                          <p className="text-xs text-[#6e7b6c] font-semibold mb-3">
                            {activeChat.sender_email ||
                              activeChat.senderEmail ||
                              "Không có email"}
                          </p>
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider ${
                              activeChat.sender_role === "EMPLOYER"
                                ? "bg-indigo-50 text-indigo-600 border-indigo-100"
                                : "bg-blue-50 text-blue-600 border-blue-100"
                            }`}
                          >
                            {activeChat.sender_role || "CLIENT"}
                          </span>
                        </div>

                        <div className="p-6 flex flex-col gap-6">
                          {/* Account Details */}
                          <div>
                            <h4 className="text-[10px] font-bold text-[#6e7b6c] uppercase tracking-wider mb-3">
                              Thông tin tài khoản
                            </h4>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center bg-[#f9f9ff] p-3 rounded-xl border border-[#e1e8fd]">
                                <span className="text-xs font-semibold text-[#3e4a3d]">
                                  Trạng thái
                                </span>
                                {(() => {
                                  const status = activeChat.sender_status;
                                  if (
                                    status === "LOCKED" ||
                                    status === "locked"
                                  )
                                    return (
                                      <span className="text-xs font-bold text-amber-600">
                                        Bị khóa
                                      </span>
                                    );
                                  if (
                                    status === "BANNED" ||
                                    status === "banned"
                                  )
                                    return (
                                      <span className="text-xs font-bold text-rose-600">
                                        Bị cấm
                                      </span>
                                    );
                                  return (
                                    <span className="text-xs font-bold text-emerald-600">
                                      Hoạt động
                                    </span>
                                  );
                                })()}
                              </div>
                              <div className="flex justify-between items-center bg-[#f9f9ff] p-3 rounded-xl border border-[#e1e8fd]">
                                <span className="text-xs font-semibold text-[#3e4a3d]">
                                  Thành viên từ
                                </span>
                                <span className="text-xs font-bold text-[#141b2b]">
                                  {activeChat.sender_created_at
                                    ? new Date(
                                        activeChat.sender_created_at,
                                      ).toLocaleDateString("vi-VN")
                                    : "N/A"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Moderation Actions */}
                          <div>
                            <h4 className="text-[10px] font-bold text-[#6e7b6c] uppercase tracking-wider mb-3">
                              Thao tác kiểm duyệt
                            </h4>

                            {/* Block Status / Options */}
                            <div className="flex flex-col gap-2 mb-4">
                              {activeChat.blocked_until &&
                              new Date(activeChat.blocked_until) >
                                new Date() ? (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                  <p className="text-xs font-semibold text-amber-800 mb-2">
                                    Bị đình chỉ đến: <br />
                                    {new Date(
                                      activeChat.blocked_until,
                                    ).toLocaleString("vi-VN")}
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
                                  <p className="text-xs font-semibold text-[#3e4a3d] mb-2">
                                    Đình chỉ chat người dùng
                                  </p>
                                  <div className="grid grid-cols-2 gap-2">
                                    <button
                                      onClick={() => handleBlockUser(1)}
                                      className="py-1.5 bg-white border border-[#e1e8fd] hover:border-amber-400 hover:bg-amber-50 text-slate-700 rounded-lg text-xs font-bold transition-all"
                                    >
                                      1 Ngày
                                    </button>
                                    <button
                                      onClick={() => handleBlockUser(3)}
                                      className="py-1.5 bg-white border border-[#e1e8fd] hover:border-amber-400 hover:bg-[#bdcaba] text-slate-700 rounded-lg text-xs font-bold transition-all"
                                    >
                                      3 Ngày
                                    </button>
                                    <button
                                      onClick={() => handleBlockUser(7)}
                                      className="py-1.5 bg-white border border-[#e1e8fd] hover:border-amber-400 hover:bg-amber-50 text-slate-700 rounded-lg text-xs font-bold transition-all"
                                    >
                                      7 Ngày
                                    </button>
                                    <button
                                      onClick={() => handleBlockUser(-1)}
                                      className="py-1.5 bg-white border border-[#e1e8fd] hover:border-rose-400 hover:bg-rose-50 text-rose-600 rounded-lg text-xs font-bold transition-all"
                                    >
                                      Vĩnh viễn
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Delete / Restore support ticket */}
                            {supportSubTab === "deleted" ? (
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
          {activeTab === "Moderation" && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                <div>
                  <h1 className="text-headline-lg font-extrabold text-[#141b2b]">
                    Kiểm duyệt
                  </h1>
                  <p className="text-body-sm text-[#3e4a3d] mt-1">
                    Xử lý bài đăng, hồ sơ và các trường hợp cần chuyển cấp.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 min-w-[240px]">
                  <div className="bg-white border border-[#e1e8fd] rounded-lg px-3 py-2">
                    <p className="text-[10px] font-bold text-[#6e7b6c] uppercase">
                      Chờ xử lý
                    </p>
                    <p className="text-title-md font-extrabold text-[#141b2b]">
                      {pendingItems.length}
                    </p>
                  </div>
                  <div className="bg-white border border-[#e1e8fd] rounded-lg px-3 py-2">
                    <p className="text-[10px] font-bold text-[#6e7b6c] uppercase">
                      Đã xử lý
                    </p>
                    <p className="text-title-md font-extrabold text-[#006b2c]">
                      {processedItems.length}
                    </p>
                  </div>
                </div>
              </div>

              {/* loc hang doi chuyen cap */}
              <div className="bg-white border border-[#e1e8fd] rounded-xl p-3">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {[
                    {
                      id: "queue",
                      label: "Hàng đợi",
                      count: pendingItems.length,
                    },
                    {
                      id: "escalation",
                      label: "Chuyển cấp",
                      count: escalatedModerationTasks.length,
                    },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setModerationView(tab.id)}
                      className={`px-3 py-2 rounded-lg text-xs font-extrabold transition-all border ${
                        moderationView === tab.id
                          ? "bg-[#006b2c] text-white border-[#006b2c]"
                          : "bg-[#f1f3ff] text-[#3e4a3d] border-transparent hover:bg-[#e1e8fd]"
                      }`}
                    >
                      {tab.label} ({tab.count})
                    </button>
                  ))}
                </div>
              </div>

              {moderationView === "queue" && (
                <div className="bg-white border border-[#e1e8fd] rounded-xl overflow-hidden shadow-sm">
                  <div className="px-5 py-4 flex flex-col gap-4 border-b border-[#e9edff]">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-title-md font-extrabold text-[#141b2b]">
                          Hàng đợi kiểm duyệt
                        </h2>
                        <p className="text-xs text-[#6e7b6c] mt-0.5">
                          Duyệt, từ chối hoặc yêu cầu chỉnh sửa các nội dung
                          đang chờ.
                        </p>
                      </div>
                      {selectedQueueItems.length > 0 && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                          <span className="text-xs font-bold text-[#006b2c] mr-2">
                            Đã chọn {selectedQueueItems.length} mục
                          </span>
                          <button
                            onClick={() => {
                              setSelectedQueueItems([]); /* execute action */
                            }}
                            className="px-3 py-1.5 bg-[#ba1a1a] text-white hover:bg-[#93000a] text-xs font-bold rounded shadow-sm flex items-center gap-1 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" /> Từ chối
                          </button>
                          <button
                            onClick={() => {
                              setSelectedQueueItems([]); /* execute action */
                            }}
                            className="px-3 py-1.5 bg-[#006b2c] text-white hover:bg-[#00873a] text-xs font-bold rounded shadow-sm flex items-center gap-1 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" /> Duyệt hàng loạt
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#e9edff] pb-2">
                      {/* nut bam kiem duyet */}
                      <div className="flex gap-2 overflow-x-auto">
                        {[
                          { id: "ALL", label: "Tất cả" },
                          { id: "PROFILE", label: "Hồ sơ" },
                          { id: "PROJECT", label: "Dự án" },
                          { id: "GIG", label: "Dịch vụ" },
                          { id: "REVIEW", label: "Báo cáo" },
                        ].map((qTab) => (
                          <button
                            key={qTab.id}
                            onClick={() => setQueueTab(qTab.id)}
                            className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all whitespace-nowrap border ${
                              queueTab === qTab.id
                                ? "bg-[#141b2b] text-white border-[#141b2b] shadow-sm"
                                : "bg-transparent text-[#6e7b6c] border-[#bdcaba] hover:bg-[#f1f3ff] hover:text-[#3e4a3d]"
                            }`}
                          >
                            {qTab.label}
                          </button>
                        ))}
                      </div>

                      <div className="w-full md:w-64 relative">
                        <span className="absolute inset-y-0 left-3 flex items-center text-[#6e7b6c]">
                          <Search className="w-4 h-4" />
                        </span>
                        <input
                          type="text"
                          placeholder="Tìm tên, người đăng..."
                          value={queueSearch}
                          onChange={(e) => setQueueSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-1.5 bg-[#f9f9ff] border border-[#e1e8fd] rounded-full text-xs font-medium text-[#141b2b] focus:outline-none focus:border-[#006b2c] focus:ring-1 focus:ring-[#006b2c]/20 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
                      <thead>
                        <tr className="bg-[#f9f9ff] border-b border-[#e9edff]">
                          <th className="px-4 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">
                            Nội dung
                          </th>
                          <th className="px-4 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">
                            Người đăng
                          </th>
                          <th className="px-4 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">
                            Lý do
                          </th>
                          <th className="px-4 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">
                            Ngày gửi
                          </th>
                          <th className="px-4 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">
                            Trạng thái
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e1e8fd] bg-white">
                        {filteredPendingItems.map((item) => (
                          <tr
                            key={item.id}
                            className={`hover:bg-[#f7fff2]/30 transition-colors ${selectedQueueItems.includes(item.id) ? "bg-[#f7fff2]" : ""}`}
                          >
                            <td className="px-4 py-4">
                              <div className="min-w-[240px]">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${item.type === "PROJECT" ? "bg-[#e9edff] text-[#141b2b] border-[#bdcaba]" : item.type === "PROFILE" ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-purple-50 text-purple-800 border-purple-200"}`}
                                >
                                  {item.type === "PROJECT" && (
                                    <FileText className="w-3 h-3" />
                                  )}
                                  {item.type === "PROFILE" && (
                                    <User className="w-3 h-3" />
                                  )}
                                  {item.type}
                                </span>
                                <h4
                                  className="text-body-sm font-bold text-[#141b2b] mt-2 group cursor-pointer hover:text-[#006b2c] transition-colors"
                                  onClick={() => {
                                    setSelectedModerationItem(item);
                                    setShowModerationModal(true);
                                  }}
                                >
                                  {item.title}
                                </h4>
                                <p
                                  className="text-xs text-[#6e7b6c] mt-0.5 line-clamp-1"
                                  title={item.detail}
                                >
                                  {item.detail}
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-body-sm font-semibold text-[#141b2b]">
                              {item.author}
                            </td>
                            <td className="px-4 py-4 text-body-sm font-bold text-amber-700">
                              <span className="bg-amber-50 px-2 py-1 rounded text-xs border border-amber-100">
                                {item.reason}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-[#3e4a3d]">
                                  {formatTimeRelative(item.subDate)}
                                </span>
                                <span className="text-[10px] text-[#6e7b6c] mt-0.5">
                                  {item.subDate}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span
                                className={`px-2 py-1 rounded text-[10px] font-bold ${
                                  item.status === "Approved"
                                    ? "bg-[#f7fff2] text-[#006b2c]"
                                    : item.status === "Rejected"
                                      ? "bg-[#ffdad6] text-[#ba1a1a]"
                                      : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {statusLabel(item.status)}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {moderationItems.length === 0 && (
                          <tr>
                            <td
                              colSpan="5"
                              className="px-4 py-8 text-center text-[#6e7b6c] text-sm"
                            >
                              Không có nội dung nào đang chờ kiểm duyệt.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {moderationView === "escalation" && (
                <div className="bg-white border border-[#e1e8fd] rounded-xl p-5">
                  <h2 className="text-title-md font-extrabold text-[#141b2b] mb-4">
                    Trường hợp chờ cấp trên quyết định
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {escalatedModerationTasks.map((task) => (
                      <div
                        key={task.taskId}
                        className="border border-rose-200 bg-rose-50 rounded-xl p-4"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              task.priority === "High"
                                ? "bg-rose-200 text-rose-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {task.priority} Priority
                          </span>
                          <span className="text-xs text-rose-600 font-semibold">
                            {task.id}
                          </span>
                        </div>
                        <h3 className="text-body-md font-bold text-[#141b2b] mb-2">
                          {task.title}
                        </h3>
                        <p className="text-xs text-[#3e4a3d] mb-4 line-clamp-3">
                          {task.description}
                        </p>
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
                        <p className="text-sm text-[#6e7b6c]">
                          Không có trường hợp kiểm duyệt nào đang chuyển cấp.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "KYC" &&
            (() => {
              {
                /* loc xac thuc kyc */
              }
              const filteredKyc = kycRequests.filter((req) => {
                if (kycRoleFilter !== "ALL" && req.role !== kycRoleFilter)
                  return false;
                if (kycSearch) {
                  const query = kycSearch.toLowerCase();
                  const matchesName = req.name?.toLowerCase().includes(query);
                  const matchesEmail = req.email?.toLowerCase().includes(query);
                  const matchesId = req.id?.toLowerCase().includes(query);
                  return matchesName || matchesEmail || matchesId;
                }
                return true;
              });

              return (
                <div className="space-y-6 max-w-7xl mx-auto">
                  <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-headline-lg font-extrabold text-[#141b2b]">
                        Xét duyệt danh tính KYC
                      </h1>
                      <p className="text-body-sm text-[#3e4a3d] mt-1">
                        Kiểm tra thông tin định danh hợp pháp của freelancer và
                        nhà tuyển dụng để duy trì hệ sinh thái an toàn.
                      </p>
                    </div>
                    {/* nut bam xac thuc kyc */}
                    {/* Filters & Search */}
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <select
                        value={kycRoleFilter}
                        onChange={(e) => setKycRoleFilter(e.target.value)}
                        className="w-full sm:w-auto bg-[#f1f3ff] border-none text-[#141b2b] py-2 px-3 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-[#006b2c]/30 focus:bg-white border transition-all"
                      >
                        <option value="ALL">Tất cả vai trò</option>
                        <option value="FREELANCER">Freelancer</option>
                        <option value="EMPLOYER">Nhà tuyển dụng</option>
                      </select>

                      <div className="w-full sm:w-72 relative">
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
                  </div>

                  {/* KYC Request List Grid */}
                  {filteredKyc.length === 0 ? (
                    <div className="text-center py-12 bg-white border border-[#e1e8fd] rounded-xl shadow-sm">
                      <AlertCircle className="w-10 h-10 text-[#bdcaba] mx-auto mb-2" />
                      <p className="text-sm text-[#6e7b6c] font-bold">
                        Không tìm thấy yêu cầu xác thực KYC nào khớp.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {filteredKyc.map((req) => (
                        <div
                          key={req.id}
                          className="card-level-1 p-6 bg-white flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between pb-4 border-b border-[#e9edff]">
                              <div>
                                <span className="text-xs font-bold text-[#6e7b6c]">
                                  {req.id}
                                </span>
                                <h3 className="text-body-lg font-bold text-[#141b2b] mt-0.5">
                                  {req.name}
                                </h3>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  req.role === "FREELANCER"
                                    ? "bg-[#f7fff2] text-[#006b2c]"
                                    : "bg-blue-50 text-[#0058be]"
                                }`}
                              >
                                {req.role}
                              </span>
                            </div>

                            <div className="py-4 space-y-2.5">
                              <div className="flex justify-between text-body-sm">
                                <span className="font-semibold text-[#6e7b6c]">
                                  Loại giấy tờ:
                                </span>
                                <span className="font-bold text-[#141b2b]">
                                  {req.docType}
                                </span>
                              </div>
                              <div className="flex justify-between text-body-sm">
                                <span className="font-semibold text-[#6e7b6c]">
                                  Ngày gửi:
                                </span>
                                <span className="font-bold text-[#3e4a3d]">
                                  {req.subDate}
                                </span>
                              </div>
                              <div className="flex justify-between text-body-sm">
                                <span className="font-semibold text-[#6e7b6c]">
                                  Địa chỉ Email:
                                </span>
                                <span className="font-bold text-[#141b2b]">
                                  {req.email}
                                </span>
                              </div>
                              <div className="mt-3">
                                <span className="block text-xs font-semibold text-[#6e7b6c] mb-1">
                                  Xem trước tài liệu đính kèm (
                                  {req.docUrls?.length || 0}):
                                </span>
                                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                  {req.docUrls && req.docUrls.length > 0 ? (
                                    req.docUrls.map((url, i) => (
                                      <div
                                        key={i}
                                        className="relative border border-[#e1e8fd] rounded-lg overflow-hidden h-36 w-48 flex-shrink-0 bg-slate-50 flex items-center justify-center group"
                                      >
                                        <img
                                          src={url}
                                          alt={`KYC Document ${i}`}
                                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                        />
                                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                          <a
                                            href={url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="p-2 bg-white text-slate-800 rounded-full shadow-lg"
                                          >
                                            <Eye className="w-4 h-4" />
                                          </a>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="text-xs text-gray-500 italic py-2">
                                      Không có tài liệu nào
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="border-t border-[#e9edff] pt-4 flex items-center justify-between">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                req.status === "Approved"
                                  ? "bg-[#f7fff2] text-[#006b2c]"
                                  : req.status === "Rejected"
                                    ? "bg-[#ffdad6] text-[#ba1a1a]"
                                    : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {req.status}
                            </span>

                            {req.status === "Pending" ? (
                              <div className="flex items-center gap-3">
                                {/* nut bam tu choi phe duyet kyc */}
                                <button
                                  onClick={() =>
                                    handleKycAction(
                                      req.idRaw,
                                      false,
                                      req.role,
                                      req.name,
                                    )
                                  }
                                  className="px-3 py-1.5 bg-white border border-[#ffdad6] hover:bg-[#ffdad6] text-[#ba1a1a] rounded-lg text-xs font-bold transition-all"
                                >
                                  Từ chối
                                </button>
                                <button
                                  onClick={() =>
                                    handleKycAction(
                                      req.idRaw,
                                      true,
                                      req.role,
                                      req.name,
                                    )
                                  }
                                  className="px-3 py-1.5 bg-[#006b2c] hover:bg-[#00873a] text-white rounded-lg text-xs font-bold transition-all"
                                >
                                  Duyệt xác thực
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-[#6e7b6c] font-bold">
                                Đã xử lý
                              </span>
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
          {activeTab === "ModHistory" &&
            (() => {
              const filteredHistory = moderationHistory.filter((log) => {
                if (!historySearch) return true;
                const searchLower = historySearch.toLowerCase();
                return (
                  (log.action &&
                    log.action.toLowerCase().includes(searchLower)) ||
                  (log.target &&
                    log.target.toLowerCase().includes(searchLower)) ||
                  (log.actor &&
                    log.actor.toLowerCase().includes(searchLower)) ||
                  (log.time && log.time.toLowerCase().includes(searchLower))
                );
              });

              return (
                <div className="space-y-6 max-w-7xl mx-auto">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-[#e1e8fd]">
                    <div>
                      <h1 className="text-headline-lg font-extrabold text-[#141b2b]">
                        Lịch sử hoạt động kiểm duyệt
                      </h1>
                      <p className="text-body-sm text-[#3e4a3d] mt-1">
                        Nhật ký chi tiết các hành động kiểm duyệt dự án, dịch
                        vụ, tài khoản và xác thực KYC của hệ thống.
                      </p>
                    </div>
                    {/* Search bar */}
                    <div className="w-full md:w-72 relative">
                      <span className="absolute inset-y-0 left-3 flex items-center text-[#6e7b6c]">
                        <Search className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        placeholder="Tìm kiếm lịch sử..."
                        value={historySearch}
                        onChange={(e) => setHistorySearch(e.target.value)}
                        className="w-full bg-[#f1f3ff] border-none placeholder-[#6e7b6c] pl-10 pr-4 py-2 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-[#006b2c]/30 focus:bg-white border transition-all"
                      />
                    </div>
                  </div>

                  <div className="bg-white border border-[#e1e8fd] rounded-xl p-6">
                    {filteredHistory.length === 0 ? (
                      <div className="text-center py-10 text-[#6e7b6c] text-sm">
                        Chưa có lịch sử hoạt động kiểm duyệt nào.
                      </div>
                    ) : (
                      <div className="space-y-0 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[#bdcaba] before:to-transparent">
                        {filteredHistory.map((log) => {
                          const isRejected =
                            log.target &&
                            (log.target.includes("REJECTED") ||
                              log.target.includes("Từ chối") ||
                              log.target
                                .toLowerCase()
                                .includes("yêu cầu bổ sung") ||
                              (log.action && log.action.includes("REJECT")));
                          return (
                            <div
                              key={log.id}
                              className={`relative flex items-center justify-between md:justify-normal group is-active ${isRejected ? "md:flex-row" : "md:flex-row-reverse"}`}
                            >
                              <div
                                onClick={() => setSelectedHistoryLog(log)}
                                className={`w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-4 rounded-xl border shadow-sm mb-4 hover:shadow-md cursor-pointer transition-all duration-200 hover:scale-[1.01] ${
                                  isRejected
                                    ? "bg-rose-50/80 border-rose-200 text-rose-900 hover:border-rose-300"
                                    : "bg-emerald-50/80 border-emerald-200 text-emerald-900 hover:border-emerald-300"
                                }`}
                              >
                                <div
                                  className={`flex items-center justify-between mb-1.5 border-b pb-2 ${isRejected ? "border-rose-100" : "border-emerald-100"}`}
                                >
                                  <div className="flex flex-col">
                                    <h4
                                      className={`font-bold text-[13px] tracking-wide ${isRejected ? "text-rose-800" : "text-emerald-800"}`}
                                    >
                                      {getActionLabel(log.action)}
                                    </h4>
                                    <span
                                      className={`text-[10px] ${isRejected ? "text-rose-500" : "text-[#6e7b6c]"} mt-0.5 font-medium`}
                                    >
                                      Người đăng/gửi:{" "}
                                      {getTargetUser(log.target)}
                                    </span>
                                  </div>
                                  <time
                                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                                      isRejected
                                        ? "text-rose-600 bg-rose-100/60"
                                        : "text-emerald-600 bg-emerald-100/60"
                                    }`}
                                  >
                                    {log.time}
                                  </time>
                                </div>
                                <p
                                  className={`text-[13px] leading-relaxed mt-2 ${isRejected ? "text-rose-700" : "text-emerald-700"}`}
                                >
                                  {log.target
                                    .split(
                                      /(REJECTED|PUBLISHED|Từ chối|yêu cầu bổ sung)/gi,
                                    )
                                    .map((part, i) => {
                                      const upperPart = part.toUpperCase();
                                      if (
                                        upperPart === "REJECTED" ||
                                        upperPart === "TỪ CHỐI"
                                      ) {
                                        return (
                                          <span
                                            key={i}
                                            className="font-bold text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded"
                                          >
                                            {part}
                                          </span>
                                        );
                                      } else if (upperPart === "PUBLISHED") {
                                        return (
                                          <span
                                            key={i}
                                            className="font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded"
                                          >
                                            {part}
                                          </span>
                                        );
                                      } else if (
                                        upperPart === "YÊU CẦU BỔ SUNG"
                                      ) {
                                        return (
                                          <span
                                            key={i}
                                            className="font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded"
                                          >
                                            {part}
                                          </span>
                                        );
                                      }
                                      return part;
                                    })}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

          {/* ---------------- TAB: DISPUTES ---------------- */}
          {activeTab === "Disputes" &&
            (() => {
              const pendingDisputes = escalationCases.filter(
                (esc) =>
                  esc.raw?.status === "OPEN" || esc.raw?.status === "PENDING",
              );
              const resolvedDisputes = escalationCases.filter(
                (esc) =>
                  esc.raw?.status !== "OPEN" && esc.raw?.status !== "PENDING",
              );

              return (
                <div className="space-y-6 max-w-7xl mx-auto">
                  <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                    <div>
                      <h1 className="text-headline-lg font-extrabold text-[#141b2b]">
                        Xử lý Tranh chấp / Khiếu nại
                      </h1>
                      <p className="text-body-sm text-[#3e4a3d] mt-1">
                        Phân xử số tiền ký quỹ Escrow giữa Client và Freelancer
                        khi xảy ra mâu thuẫn dự án.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 min-w-[240px]">
                      <div className="bg-white border border-[#e1e8fd] rounded-lg px-3 py-2">
                        <p className="text-[10px] font-bold text-[#6e7b6c] uppercase">
                          Chưa giải quyết
                        </p>
                        <p className="text-title-md font-extrabold text-[#ba1a1a]">
                          {pendingDisputes.length}
                        </p>
                      </div>
                      <div className="bg-white border border-[#e1e8fd] rounded-lg px-3 py-2">
                        <p className="text-[10px] font-bold text-[#6e7b6c] uppercase">
                          Đã giải quyết
                        </p>
                        <p className="text-title-md font-extrabold text-[#006b2c]">
                          {resolvedDisputes.length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-[#e1e8fd] rounded-xl p-5">
                    <h2 className="text-title-md font-extrabold text-[#141b2b] mb-4">
                      Danh sách Tranh chấp ({escalationCases.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {escalationCases.map((esc) => {
                        const isPending =
                          esc.raw?.status === "OPEN" ||
                          esc.raw?.status === "PENDING";
                        return (
                          <div
                            key={esc.id}
                            className={`border rounded-xl p-4 transition-all hover:shadow-md ${
                              isPending
                                ? "border-rose-200 bg-rose-50/50"
                                : "border-[#e1e8fd] bg-white"
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  esc.priority === "Khẩn cấp" ||
                                  esc.priority === "HIGH"
                                    ? "bg-rose-200 text-rose-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {esc.priority}
                              </span>
                              <span className="text-xs text-[#6e7b6c] font-semibold">
                                {esc.id}
                              </span>
                            </div>
                            <h3 className="text-body-md font-bold text-[#141b2b] mb-1">
                              {esc.title}
                            </h3>
                            <div className="text-xs text-[#3e4a3d] space-y-1 mb-4">
                              <p>
                                Dự án:{" "}
                                <strong className="text-[#141b2b]">
                                  {esc.raw?.projectTitle}
                                </strong>
                              </p>
                              <p>
                                Client: <strong>{esc.raw?.clientName}</strong> |
                                Freelancer:{" "}
                                <strong>{esc.raw?.freelancerName}</strong>
                              </p>
                              <p>
                                Số tiền:{" "}
                                <strong className="text-rose-600">
                                  {(esc.raw?.amount || 0).toLocaleString(
                                    "vi-VN",
                                  )}{" "}
                                  VND
                                </strong>
                              </p>
                              <p>
                                Trạng thái:{" "}
                                <strong
                                  className={
                                    isPending
                                      ? "text-rose-600"
                                      : "text-[#006b2c]"
                                  }
                                >
                                  {isPending
                                    ? "Chưa giải quyết"
                                    : "Đã giải quyết"}
                                </strong>
                              </p>
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
                                Kết quả:{" "}
                                {esc.raw?.status === "RESOLVED_CLIENT_FAVOR"
                                  ? "Hoàn tiền Client"
                                  : "Thanh toán Freelancer"}
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
          {activeTab === "Reports" &&
            (() => {
              const severityClass = (severity) =>
                severity === "Cao" ||
                severity === "Khẩn cấp" ||
                severity === "HIGH"
                  ? "bg-[#ffdad6] text-[#ba1a1a] border-[#ffdad6]"
                  : "bg-amber-50 text-amber-700 border-amber-200";

              {
                /* logic loc bao cao vi pham */
              }
              const filteredReports = violationReports.filter((r) => {
                if (reportFilter !== "ALL") {
                  const isPending =
                    r.status === "Chờ xử lý" || r.status === "PENDING";
                  const isEscalated =
                    r.status === "Đã chuyển cấp" || r.status === "ESCALATED";
                  if (reportFilter === "PENDING" && !isPending) return false;
                  if (reportFilter === "ESCALATED" && !isEscalated)
                    return false;
                }
                if (reportTypeFilter !== "ALL" && r.type !== reportTypeFilter)
                  return false;
                if (reportSearch) {
                  const searchLower = reportSearch.toLowerCase();
                  const matchesTarget = r.target
                    ?.toLowerCase()
                    .includes(searchLower);
                  const matchesReporter = r.reporter
                    ?.toLowerCase()
                    .includes(searchLower);
                  const matchesAccused = r.accused
                    ?.toLowerCase()
                    .includes(searchLower);
                  const matchesEvidence = r.evidence
                    ?.toLowerCase()
                    .includes(searchLower);
                  if (
                    !matchesTarget &&
                    !matchesReporter &&
                    !matchesAccused &&
                    !matchesEvidence
                  )
                    return false;
                }
                return true;
              });

              return (
                <div className="space-y-6 max-w-7xl mx-auto">
                  <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                    <div>
                      <h1 className="text-headline-lg font-extrabold text-[#141b2b]">
                        Báo cáo vi phạm
                      </h1>
                      <p className="text-body-sm text-[#3e4a3d] mt-1">
                        Xử lý các báo cáo vi phạm bài đăng, hồ sơ và người dùng
                        từ hệ thống.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white border border-[#e1e8fd] rounded-xl p-5 space-y-4">
                    {/* Filter controls */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#e1e8fd] gap-4">
                      <div className="flex flex-wrap items-center gap-3">
                        {/* nut bam bao cao vi pham */}
                        {/* Status filter buttons */}
                        <div className="flex bg-[#f1f3ff] p-1 rounded-lg">
                          {[
                            { key: "ALL", label: "Tất cả" },
                            { key: "PENDING", label: "Chưa xử lý" },
                            { key: "ESCALATED", label: "Đã chuyển cấp" },
                          ].map((btn) => (
                            <button
                              key={btn.key}
                              onClick={() => setReportFilter(btn.key)}
                              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                                reportFilter === btn.key
                                  ? "bg-white text-[#006b2c] shadow-sm"
                                  : "text-[#6e7b6c] hover:text-[#141b2b]"
                              }`}
                            >
                              {btn.label}
                            </button>
                          ))}
                        </div>

                        {/* Type filter buttons */}
                        <div className="flex bg-[#f1f3ff] p-1 rounded-lg">
                          {[
                            { key: "ALL", label: "Tất cả loại" },
                            { key: "PROJECT", label: "Dự án" },
                            { key: "USER", label: "Người dùng" },
                          ].map((btn) => (
                            <button
                              key={btn.key}
                              onClick={() => setReportTypeFilter(btn.key)}
                              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                                reportTypeFilter === btn.key
                                  ? "bg-white text-[#006b2c] shadow-sm"
                                  : "text-[#6e7b6c] hover:text-[#141b2b]"
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
                    <div
                      className={
                        reportFilter === "ESCALATED"
                          ? "grid grid-cols-1 md:grid-cols-2 gap-4"
                          : "space-y-4"
                      }
                    >
                      {reportFilter === "ESCALATED"
                        ? (() => {
                            const escalatedReportTasks = tasks.filter(
                              (t) =>
                                t.status === "Escalated" &&
                                (t.type === "REPORT_RESOLUTION" ||
                                  t.title?.includes("Báo cáo vi phạm")),
                            );
                            return (
                              <>
                                {escalatedReportTasks.map((task) => (
                                  <div
                                    key={task.taskId}
                                    className="border border-rose-200 bg-rose-50 rounded-xl p-4 hover:shadow-md transition-shadow bg-white"
                                  >
                                    <div className="flex justify-between items-start mb-2">
                                      <span
                                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                          task.priority === "High"
                                            ? "bg-rose-200 text-rose-800"
                                            : "bg-amber-100 text-amber-800"
                                        }`}
                                      >
                                        {task.priority} Priority
                                      </span>
                                      <span className="text-xs text-rose-600 font-semibold">
                                        {task.id}
                                      </span>
                                    </div>
                                    <h3 className="text-body-md font-bold text-[#141b2b] mb-2">
                                      {task.title}
                                    </h3>
                                    <p className="text-xs text-[#3e4a3d] mb-4 line-clamp-3">
                                      {task.description}
                                    </p>
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
                                {escalatedReportTasks.length === 0 && (
                                  <div className="col-span-2 text-center py-12 text-[#6e7b6c]">
                                    Không có báo cáo vi phạm nào đang chuyển
                                    cấp.
                                  </div>
                                )}
                              </>
                            );
                          })()
                        : filteredReports.map((report) => (
                            <div
                              key={report.id}
                              className="border border-[#e9edff] rounded-xl p-4 hover:shadow-md transition-shadow bg-white"
                            >
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="px-2 py-0.5 bg-[#f1f3ff] text-[#141b2b] rounded text-[10px] font-bold border border-slate-200">
                                      {report.type}
                                    </span>
                                  </div>
                                  <h3 className="text-body-lg font-bold text-[#141b2b]">
                                    {report.target}
                                  </h3>
                                </div>
                                <span
                                  className={`text-xs font-bold px-2 py-1 rounded ${
                                    report.status === "Chờ xử lý" ||
                                    report.status === "PENDING"
                                      ? "bg-amber-100 text-amber-800"
                                      : report.status === "Đã chuyển cấp"
                                        ? "bg-rose-100 text-rose-800 border border-rose-200"
                                        : "bg-emerald-100 text-emerald-800"
                                  }`}
                                >
                                  {report.status}
                                </span>
                              </div>
                              <p className="text-sm text-[#3e4a3d] bg-[#f9f9ff] p-3 rounded-lg mb-3">
                                <span className="font-semibold">
                                  Bằng chứng / Nội dung:
                                </span>{" "}
                                {report.evidence}
                              </p>
                              <div className="flex items-center justify-between text-xs text-[#6e7b6c]">
                                <div className="flex gap-4">
                                  <span>
                                    <strong className="text-[#141b2b]">
                                      Người báo cáo:
                                    </strong>{" "}
                                    {report.reporter}
                                  </span>
                                  <span>
                                    <strong className="text-[#141b2b]">
                                      Bị báo cáo:
                                    </strong>{" "}
                                    {report.accused}
                                  </span>
                                </div>
                                {(report.status === "Chờ xử lý" ||
                                  report.status === "PENDING") && (
                                  <button
                                    onClick={() => {
                                      setShowReportEscalateForm(false);
                                      setReportEscalateReason("");
                                      setSelectedReport(report);
                                    }}
                                    className="px-3 py-1 bg-white hover:bg-[#006b2c] hover:text-white text-[#006b2c] border border-[#bdcaba] rounded-lg text-xs font-bold transition-all"
                                  >
                                    Xử lý báo cáo →
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                      {reportFilter !== "ESCALATED" &&
                        filteredReports.length === 0 && (
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
          {activeTab === "Withdrawals" &&
            (() => {
              const filteredWds = withdrawals.filter((w) => {
                if (
                  withdrawalFilter !== "ALL" &&
                  w.statusRaw !== withdrawalFilter
                )
                  return false;
                if (financeSearch) {
                  const term = financeSearch.toLowerCase();
                  return (
                    w.user.toLowerCase().includes(term) ||
                    w.email.toLowerCase().includes(term) ||
                    w.bank.toLowerCase().includes(term)
                  );
                }
                return true;
              });

              return (
                <div className="space-y-6 max-w-7xl mx-auto">
                  <div>
                    <h1 className="text-headline-lg font-extrabold text-[#141b2b]">
                      Quản lý Rút tiền
                    </h1>
                    <p className="text-body-sm text-[#3e4a3d] mt-1">
                      Duyệt và xử lý các yêu cầu rút số dư tài khoản từ
                      Freelancer.
                    </p>
                  </div>

                  <div className="bg-white border border-[#e1e8fd] rounded-xl p-5 space-y-4">
                    {/* Filters & Actions */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#e1e8fd] gap-4">
                      <div className="flex bg-[#f1f3ff] p-1 rounded-lg">
                        {[
                          { key: "ALL", label: "Tất cả" },
                          { key: "PENDING", label: "Chờ xử lý" },
                          { key: "APPROVED", label: "Đã duyệt" },
                          { key: "REJECTED", label: "Đã từ chối" },
                        ].map((tab) => (
                          <button
                            key={tab.key}
                            onClick={() => setWithdrawalFilter(tab.key)}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                              withdrawalFilter === tab.key
                                ? "bg-white text-[#006b2c] shadow-sm"
                                : "text-[#6e7b6c] hover:text-[#141b2b]"
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
                            <th className="px-5 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">
                              Mã Yêu Cầu
                            </th>
                            <th className="px-5 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">
                              Thành Viên
                            </th>
                            <th className="px-5 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">
                              Thông Tin Tài Khoản
                            </th>
                            <th className="px-5 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider text-right">
                              Số Tiền (VND)
                            </th>
                            <th className="px-5 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">
                              Ngày gửi
                            </th>
                            <th className="px-5 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">
                              Trạng thái
                            </th>
                            <th className="px-5 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider text-right">
                              Thao tác
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e9edff] bg-white">
                          {filteredWds.length > 0 ? (
                            filteredWds.map((w) => (
                              <tr
                                key={w.id}
                                onClick={() => {
                                  setSelectedWithdrawal(w);
                                  setShowWithdrawalModal(true);
                                }}
                                className="hover:bg-[#f7fff2]/30 transition-colors cursor-pointer"
                              >
                                <td className="px-5 py-4 whitespace-nowrap text-body-sm font-bold text-[#006b2c]">
                                  #{w.id}
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap">
                                  <div className="text-body-sm font-bold text-[#141b2b]">
                                    {w.user}
                                  </div>
                                  <div className="text-[11px] text-slate-400 font-normal">
                                    {w.email}
                                  </div>
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap text-body-sm">
                                  <div className="font-semibold text-[#141b2b]">
                                    {w.bank}
                                  </div>
                                  <div className="text-[11px] text-[#3e4a3d]">
                                    STK: {w.account}
                                  </div>
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap text-body-sm font-extrabold text-rose-600 text-right">
                                  {w.amount.toLocaleString("vi-VN")}
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap text-body-sm font-bold text-[#3e4a3d]">
                                  {w.date}
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      w.statusRaw === "PENDING"
                                        ? "bg-amber-100 text-amber-800"
                                        : w.statusRaw === "APPROVED"
                                          ? "bg-[#f7fff2] text-[#006b2c]"
                                          : "bg-[#ffdad6] text-[#ba1a1a]"
                                    }`}
                                  >
                                    {w.status}
                                  </span>
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap text-right text-xs font-bold space-x-2">
                                  {w.statusRaw === "PENDING" ? (
                                    <>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleWithdrawalAction(
                                            w.id,
                                            "APPROVED",
                                          );
                                        }}
                                        className="px-2.5 py-1 bg-[#006b2c] hover:bg-[#00873a] text-white rounded transition-colors"
                                      >
                                        Duyệt
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleWithdrawalAction(
                                            w.id,
                                            "REJECTED",
                                          );
                                        }}
                                        className="px-2.5 py-1 bg-white hover:bg-rose-50 text-[#ba1a1a] border border-rose-200 rounded transition-colors"
                                      >
                                        Từ chối
                                      </button>
                                    </>
                                  ) : (
                                    <span className="text-[#6e7b6c] font-normal">
                                      N/A
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan="7"
                                className="text-center py-10 text-[#6e7b6c] text-sm"
                              >
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
          {activeTab === "Refunds" &&
            (() => {
              const refundsList = escalationCases.filter(
                (esc) => esc.raw?.status === "RESOLVED_CLIENT_FAVOR",
              );

              return (
                <div className="space-y-6 max-w-7xl mx-auto">
                  <div>
                    <h1 className="text-headline-lg font-extrabold text-[#141b2b]">
                      Quản lý Hoàn tiền
                    </h1>
                    <p className="text-body-sm text-[#3e4a3d] mt-1">
                      Lịch sử hoàn trả tiền ký quỹ Escrow về tài khoản Client do
                      tranh chấp được giải quyết.
                    </p>
                  </div>

                  <div className="bg-white border border-[#e1e8fd] rounded-xl p-5 space-y-4">
                    <h2 className="text-title-md font-extrabold text-[#141b2b]">
                      Danh sách giao dịch hoàn tiền ({refundsList.length})
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {refundsList.map((ref) => (
                        <div
                          key={ref.id}
                          className="border border-[#e9edff] rounded-xl p-4 bg-[#f9f9ff] flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-xs font-bold text-[#006b2c] bg-[#f7fff2] px-2 py-0.5 rounded border border-[#bdcaba]">
                                #{ref.id}
                              </span>
                              <span className="text-xs font-bold text-[#006b2c] bg-emerald-100 px-2 py-0.5 rounded">
                                Đã hoàn tiền
                              </span>
                            </div>
                            <h3 className="text-body-md font-bold text-[#141b2b] mb-1">
                              {ref.title}
                            </h3>
                            <div className="text-xs text-[#3e4a3d] space-y-1">
                              <p>
                                Dự án gốc:{" "}
                                <strong className="text-[#141b2b]">
                                  {ref.raw?.projectTitle}
                                </strong>
                              </p>
                              <p>
                                Nhận hoàn tiền (Client):{" "}
                                <strong>{ref.raw?.clientName}</strong>
                              </p>
                              <p>
                                Đối tác (Freelancer):{" "}
                                <strong>{ref.raw?.freelancerName}</strong>
                              </p>
                              <p className="mt-2 text-body-sm font-extrabold text-rose-600">
                                Số tiền hoàn lại:{" "}
                                {(ref.raw?.amount || 0).toLocaleString("vi-VN")}{" "}
                                VND
                              </p>
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
          {activeTab === "FailedTransactions" &&
            (() => {
              const filteredTxns = vnpayTxns.filter((t) => {
                if (vnpayFilter !== "ALL" && t.status !== vnpayFilter)
                  return false;
                if (financeSearch) {
                  const term = financeSearch.toLowerCase();
                  return (
                    t.txnRef.toLowerCase().includes(term) ||
                    t.vnpTxnNo.toLowerCase().includes(term)
                  );
                }
                return true;
              });

              const handleReconcile = (id) => {
                const adminId = user?.id || 1;
                if (
                  window.confirm(
                    `Bạn có chắc muốn tiến hành đối soát và xử lý lại giao dịch #${id}?`,
                  )
                ) {
                  adminApi
                    .reconcileVnpayTransaction(id, adminId)
                    .then((res) => {
                      if (res.success) {
                        showToast(res.message, "success");
                        fetchVnpayTransactions();
                      } else {
                        showToast(res.message, "error");
                      }
                    })
                    .catch((err) => {
                      console.error(err);
                      showToast(
                        "Có lỗi xảy ra khi đối soát giao dịch.",
                        "error",
                      );
                    });
                }
              };

              return (
                <div className="space-y-6 max-w-7xl mx-auto">
                  <div>
                    <h1 className="text-headline-lg font-extrabold text-[#141b2b]">
                      Đối soát giao dịch PayOS
                    </h1>
                    <p className="text-body-sm text-[#3e4a3d] mt-1">
                      Quản lý và đối soát các giao dịch thanh toán từ ví PayOS.
                    </p>
                  </div>

                  <div className="bg-white border border-[#e1e8fd] rounded-xl p-5 space-y-4">
                    {/* Filters */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#e1e8fd] gap-4">
                      <div className="flex bg-[#f1f3ff] p-1 rounded-lg">
                        {[
                          { key: "ALL", label: "Tất cả" },
                          { key: "FAILED", label: "Giao dịch lỗi (FAILED)" },
                          { key: "SUCCESS", label: "Thành công (SUCCESS)" },
                          { key: "PENDING", label: "Chờ xử lý (PENDING)" },
                        ].map((tab) => (
                          <button
                            key={tab.key}
                            onClick={() => setVnpayFilter(tab.key)}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                              vnpayFilter === tab.key
                                ? "bg-white text-[#006b2c] shadow-sm"
                                : "text-[#6e7b6c] hover:text-[#141b2b]"
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
                            <th className="px-5 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">
                              Mã GD
                            </th>
                            <th className="px-5 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">
                              Mã Đối Soát (TxnRef)
                            </th>
                            <th className="px-5 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider text-right">
                              Số Tiền (VND)
                            </th>
                            <th className="px-5 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">
                              Mã GD VNPay
                            </th>
                            <th className="px-5 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">
                              Trạng thái
                            </th>
                            <th className="px-5 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider">
                              Thời gian
                            </th>
                            <th className="px-5 py-3 text-label-md text-[#6e7b6c] uppercase tracking-wider text-right">
                              Thao tác
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e9edff] bg-white">
                          {filteredTxns.length > 0 ? (
                            filteredTxns.map((t) => (
                              <tr
                                key={t.id}
                                className="hover:bg-[#f7fff2]/30 transition-colors"
                              >
                                <td className="px-5 py-4 whitespace-nowrap text-body-sm font-bold text-[#141b2b]">
                                  #{t.id}
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap text-body-sm font-bold text-[#006b2c]">
                                  {t.txnRef}
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap text-body-sm font-extrabold text-emerald-600 text-right">
                                  {t.amount.toLocaleString("vi-VN")}
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap text-body-sm text-[#3e4a3d]">
                                  {t.vnpTxnNo}
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      t.status === "SUCCESS"
                                        ? "bg-[#f7fff2] text-[#006b2c]"
                                        : t.status === "FAILED"
                                          ? "bg-[#ffdad6] text-[#ba1a1a]"
                                          : "bg-amber-100 text-amber-800"
                                    }`}
                                  >
                                    {t.status}
                                  </span>
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap text-body-sm font-bold text-[#3e4a3d]">
                                  {t.date}
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap text-right text-xs font-bold">
                                  {t.status === "FAILED" ? (
                                    <button
                                      onClick={() => handleReconcile(t.id)}
                                      className="px-3 py-1 bg-white hover:bg-[#006b2c] hover:text-white text-[#006b2c] border border-[#bdcaba] rounded-lg transition-colors"
                                    >
                                      Đối soát lại
                                    </button>
                                  ) : (
                                    <span className="text-[#6e7b6c] font-normal">
                                      N/A
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan="7"
                                className="text-center py-10 text-[#6e7b6c] text-sm"
                              >
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
          {activeTab === "SystemBugs" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-display-sm font-extrabold text-[#141b2b]">
                    Báo cáo lỗi hệ thống
                  </h2>
                  <p className="mt-2 text-body-lg text-[#6e7b6c]">
                    Quản lý và xử lý các lỗi hệ thống được người dùng báo cáo
                  </p>
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
                        <th className="px-6 py-4 text-label-md font-extrabold text-[#6e7b6c] uppercase tracking-wider">
                          Mã lỗi
                        </th>
                        <th className="px-6 py-4 text-label-md font-extrabold text-[#6e7b6c] uppercase tracking-wider">
                          Tiêu đề
                        </th>
                        <th className="px-6 py-4 text-label-md font-extrabold text-[#6e7b6c] uppercase tracking-wider">
                          Mô tả
                        </th>
                        <th className="px-6 py-4 text-label-md font-extrabold text-[#6e7b6c] uppercase tracking-wider">
                          Trạng thái
                        </th>
                        <th className="px-6 py-4 text-label-md font-extrabold text-[#6e7b6c] uppercase tracking-wider">
                          Ngày tạo
                        </th>
                        <th className="px-6 py-4 text-label-md font-extrabold text-[#6e7b6c] uppercase tracking-wider text-right">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e9edff] bg-white">
                      {bugReports.length > 0 ? (
                        bugReports.map((bug) => (
                          <tr
                            key={bug.reportId}
                            className="hover:bg-[#f1f3ff]/50 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-body-sm font-bold text-[#141b2b]">
                              #{bug.reportId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-body-sm text-[#3e4a3d] font-bold">
                              {bug.title}
                            </td>
                            <td className="px-6 py-4 text-body-sm text-[#6e7b6c] truncate max-w-xs">
                              {bug.description}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold ${
                                  bug.status === "RESOLVED"
                                    ? "bg-[#f7fff2] text-[#006b2c]"
                                    : bug.status === "IN_PROGRESS"
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {bug.status || "OPEN"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-body-sm text-[#6e7b6c]">
                              {bug.createdAt
                                ? new Date(bug.createdAt).toLocaleDateString(
                                    "vi-VN",
                                  )
                                : ""}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => {
                                  adminApi
                                    .updateBugReportStatus(
                                      bug.reportId,
                                      "RESOLVED",
                                      user.id,
                                    )
                                    .then(() => {
                                      showToast(
                                        "Đã đánh dấu lỗi thành công.",
                                        "success",
                                      );
                                      fetchBugReports();
                                    });
                                }}
                                className="text-[#006b2c] hover:text-[#00873a] font-bold"
                              >
                                Đánh dấu Resolved
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="6"
                            className="text-center py-10 text-[#6e7b6c] text-sm"
                          >
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

          {/* ---------------- TAB: PAYMENT COMPLAINTS (Khiếu nại thanh toán) ---------------- */}
          {activeTab === "PaymentComplaints" && (
            <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
              <div>
                <h1 className="text-headline-lg font-extrabold text-[#141b2b]">
                  Khiếu nại thanh toán & Nạp/Rút ví
                </h1>
                <p className="text-body-sm text-[#3e4a3d] mt-1">
                  Quản lý các sự cố giao dịch, khiếu nại hoàn tiền và rút tiền
                  của người dùng.
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
                        <th className="px-5 py-3 text-label-md text-[#6e7b6c] uppercase font-extrabold">
                          Mã Yêu Cầu
                        </th>
                        <th className="px-5 py-3 text-label-md text-[#6e7b6c] uppercase font-extrabold">
                          Người gửi
                        </th>
                        <th className="px-5 py-3 text-label-md text-[#6e7b6c] uppercase font-extrabold">
                          Loại giao dịch
                        </th>
                        <th className="px-5 py-3 text-label-md text-[#6e7b6c] uppercase font-extrabold">
                          Số tiền
                        </th>
                        <th className="px-5 py-3 text-label-md text-[#6e7b6c] uppercase font-extrabold">
                          Trạng thái
                        </th>
                        <th className="px-5 py-3 text-label-md text-[#6e7b6c] uppercase font-extrabold text-right">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e9edff] bg-white">
                      {withdrawals.map((w) => (
                        <tr key={`w-${w.id}`} className="hover:bg-[#f9f9ff]">
                          <td className="px-5 py-4 font-mono font-bold text-xs text-[#006b2c]">
                            WDR-{w.id}
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-bold text-sm text-[#141b2b]">
                              {w.user}
                            </p>
                            <p className="text-xs text-[#6e7b6c]">{w.email}</p>
                          </td>
                          <td className="px-5 py-4 text-xs font-bold text-slate-700">
                            Rút tiền về {w.bank}
                          </td>
                          <td className="px-5 py-4 text-sm font-extrabold text-rose-600">
                            {w.amount?.toLocaleString("vi-VN")} VND
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                w.statusRaw === "APPROVED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : w.statusRaw === "REJECTED"
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-amber-100 text-amber-800"
                              }`}
                            >
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
                          <td
                            colSpan="6"
                            className="text-center py-8 text-sm text-[#6e7b6c]"
                          >
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
                  Nhật ký lưu trữ tất cả các ca tranh chấp hợp đồng đã được phân
                  xử hoặc đóng vụ việc.
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
                          <span className="text-xs text-[#6e7b6c] font-semibold">
                            {esc.id}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-body-md font-bold text-[#141b2b]">
                            {esc.title}
                          </h3>
                          <p className="text-xs text-[#6e7b6c] mt-0.5">
                            Client:{" "}
                            <strong className="text-slate-800">
                              {esc.raw?.clientName || "N/A"}
                            </strong>{" "}
                            | Freelancer:{" "}
                            <strong className="text-slate-800">
                              {esc.raw?.freelancerName || "N/A"}
                            </strong>
                          </p>
                        </div>
                        <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <span className="text-xs text-slate-500 font-bold uppercase">
                            Số tiền:
                          </span>
                          <span className="text-sm font-extrabold text-rose-600">
                            {esc.raw?.amount
                              ? esc.raw.amount.toLocaleString("vi-VN")
                              : "0"}{" "}
                            VND
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
          {![
            "Dashboard",
            "Tasks",
            "Support",
            "Moderation",
            "KYC",
            "Disputes",
            "Reports",
            "Withdrawals",
            "Refunds",
            "FailedTransactions",
            "SystemBugs",
            "ModHistory",
          ].includes(activeTab) && (
            <div className="max-w-4xl mx-auto text-center py-16 space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#f7fff2] text-[#006b2c] flex items-center justify-center mx-auto shadow-md">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="text-headline-lg font-extrabold text-[#141b2b]">
                Mục {activeTab}
              </h2>
              <p className="text-body-sm text-[#6e7b6c] max-w-md mx-auto">
                Mục <strong>{activeTab}</strong> đang được đồng bộ hóa thông tin
                tự động từ máy chủ quản trị trung tâm. Vui lòng quay lại sau.
              </p>
              <button
                onClick={() => setActiveTab("Dashboard")}
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
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 shadow-2xl flex flex-col border border-[#e1e8fd] animate-in zoom-in-95 duration-200">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#e9edff]">
                <div>
                  <span className="text-xs font-bold text-[#6e7b6c]">
                    {selectedTask.id}
                  </span>
                  <h3 className="text-title-md font-extrabold text-[#141b2b] mt-0.5">
                    {selectedTask.type
                      ? String(selectedTask.type).replace(/_MODERATION/g, "")
                      : ""}
                  </h3>
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
                  <img
                    src={selectedTask.avatar}
                    alt={selectedTask.assignedToEmail || "Chưa ai nhận"}
                    className="w-10 h-10 rounded-full object-cover border border-[#bdcaba]"
                  />
                  <div>
                    <h4 className="text-body-sm font-bold text-[#141b2b]">
                      {selectedTask.assignedToEmail
                        ? selectedTask.assignedToEmail
                        : "Chưa có ai nhận"}
                    </h4>
                    <p className="text-xs text-[#6e7b6c]">Người đang xử lý</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-body-sm border-b border-[#e9edff] pb-4">
                  <div>
                    <span className="font-semibold text-[#6e7b6c]">
                      Mức độ:
                    </span>
                    <span
                      className={`block mt-1 font-bold text-sm ${
                        selectedTask.priority === "High"
                          ? "text-[#ba1a1a]"
                          : "text-[#3e4a3d]"
                      }`}
                    >
                      {selectedTask.priority} Priority
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-[#6e7b6c]">
                      Hạn chót:
                    </span>
                    <span className="block mt-1 font-bold text-[#141b2b]">
                      {selectedTask.deadline}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold text-[#6e7b6c] uppercase">
                    Mô tả công việc
                  </span>
                  <p className="text-body-sm text-[#141b2b] mt-2 leading-relaxed bg-[#f9f9ff] p-3 rounded-lg border border-[#e1e8fd]">
                    {selectedTask.description}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-bold text-[#6e7b6c] uppercase">
                    Trạng thái hiện tại
                  </span>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`w-3 h-3 rounded-full ${
                        selectedTask.status === "Completed"
                          ? "bg-emerald-500"
                          : selectedTask.status === "In Progress"
                            ? "bg-[#006b2c]"
                            : selectedTask.status === "Escalated"
                              ? "bg-red-500"
                              : "bg-blue-500"
                      }`}
                    />
                    <span className="text-body-sm font-bold text-[#141b2b]">
                      {selectedTask.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions for Task */}
            <div className="border-t border-[#e9edff] pt-4 space-y-3 mt-6">
              {selectedTask.status !== "Completed" ? (
                <>
                  {selectedTask.status === "Pending" && (
                    <button
                      onClick={() =>
                        handleUpdateTaskStatus(selectedTask.id, "In Progress")
                      }
                      disabled={
                        selectedTask.assignedToEmail &&
                        selectedTask.assignedToEmail !==
                          (user?.email || "staff@gmail.com")
                      }
                      className={`w-full py-2.5 rounded-lg font-bold text-body-sm shadow transition-all ${
                        selectedTask.assignedToEmail &&
                        selectedTask.assignedToEmail !==
                          (user?.email || "staff@gmail.com")
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-[#006b2c] hover:bg-[#00873a] text-white"
                      }`}
                    >
                      {selectedTask.assignedToEmail &&
                      selectedTask.assignedToEmail !==
                        (user?.email || "staff@gmail.com")
                        ? "Đã được nhận bởi " + selectedTask.assignedToEmail
                        : "Tiếp nhận"}
                    </button>
                  )}
                  {selectedTask.status === "In Progress" &&
                    selectedTask.assignedToEmail ===
                      (user?.email || "staff@gmail.com") && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            if (
                              selectedTask.taskType === "DISPUTE_RESOLUTION"
                            ) {
                              const foundDispute = escalationCases.find(
                                (c) =>
                                  String(c.id) ===
                                  String(selectedTask.referenceId),
                              );
                              if (foundDispute) {
                                setSelectedDispute(foundDispute);
                                setShowDisputeModal(true);
                                setShowManageModal(false);
                              } else {
                                handleUpdateTaskStatus(
                                  selectedTask.id,
                                  "Completed",
                                );
                              }
                            } else {
                              handleUpdateTaskStatus(
                                selectedTask.id,
                                "Completed",
                              );
                            }
                          }}
                          className="flex-1 py-2.5 bg-[#006b2c] hover:bg-[#00873a] text-white rounded-lg font-extrabold text-body-sm shadow transition-all cursor-pointer text-center"
                        >
                          Duyệt / Hoàn thành
                        </button>
                        <button
                          onClick={() => {
                            handleUpdateTaskStatus(selectedTask.id, "Rejected");
                          }}
                          className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-extrabold text-body-sm shadow transition-all cursor-pointer text-center"
                        >
                          Từ chối
                        </button>
                      </div>
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
                      <p className="text-body-sm font-bold text-[#ba1a1a]">
                        Chọn lý do báo cáo sự cố / trì hoãn:
                      </p>
                      <div className="space-y-2">
                        {[
                          "Hồ sơ có dấu hiệu giả mạo tinh vi",
                          "Thiếu thẩm quyền để giải quyết",
                          "Tranh chấp phức tạp cần Manager phân xử",
                          "Lỗi hệ thống / Bug phần mềm",
                          "Lý do khác",
                        ].map((reason, idx) => (
                          <label
                            key={idx}
                            className="flex items-start gap-2 cursor-pointer"
                          >
                            <input
                              type="radio"
                              name="escalateReason"
                              value={reason}
                              checked={selectedEscalateReason === reason}
                              onChange={(e) =>
                                setSelectedEscalateReason(e.target.value)
                              }
                              className="mt-1"
                            />
                            <span className="text-body-sm text-[#3e4a3d]">
                              {reason}
                            </span>
                          </label>
                        ))}
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => {
                            setShowEscalateReasons(false);
                            setSelectedEscalateReason("");
                          }}
                          className="flex-1 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-bold text-body-sm transition-all"
                        >
                          Hủy
                        </button>
                        <button
                          onClick={() => handleEscalateTask()}
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
                  setSelectedEscalateReason("");
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
            <div
              className={`mx-auto w-12 h-12 rounded-full mb-4 flex items-center justify-center ${
                confirmConfig.type === "danger"
                  ? "bg-[#ffdad6] text-[#ba1a1a]"
                  : "bg-[#f7fff2] text-[#006b2c]"
              }`}
            >
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-title-md font-extrabold text-[#141b2b] mb-2">
              {confirmConfig.title}
            </h3>
            <p className="text-body-sm text-[#3e4a3d] mb-6">
              {confirmConfig.message}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-body-sm transition-all"
              >
                {confirmConfig.cancelText || "Hủy"}
              </button>
              <button
                onClick={confirmConfig.onConfirm}
                className={`flex-1 py-2 rounded-lg font-bold text-body-sm shadow transition-all text-white ${
                  confirmConfig.type === "danger"
                    ? "bg-[#ba1a1a] hover:bg-[#93000a]"
                    : "bg-[#006b2c] hover:bg-[#00873a]"
                }`}
              >
                {confirmConfig.confirmText || "Xác nhận"}{" "}
                {confirmCountdown !== null ? `(${confirmCountdown}s)` : ""}
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
              <h2 className="text-title-md font-extrabold text-[#141b2b]">
                Xử lý Khiếu nại / Tranh chấp
              </h2>
              <button
                onClick={() => {
                  setShowDisputeModal(false);
                  setSelectedDispute(null);
                  setDisputeNote("");
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full text-[#6e7b6c] hover:bg-[#f1f4f0]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-4">
              <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl mb-4">
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-bold text-rose-600 uppercase">
                    Ưu tiên: {selectedDispute.priority}
                  </span>
                  <span className="text-xs text-rose-500 font-medium">
                    {selectedDispute.raw?.createdAt}
                  </span>
                </div>
                <h3 className="text-body-lg font-bold text-[#141b2b]">
                  {selectedDispute.raw?.projectTitle}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-[#f7fff2] border border-[#d6f2c6] p-3 rounded-lg">
                  <p className="text-xs text-[#3e4a3d] mb-1">
                    Bên Client (Thuê)
                  </p>
                  <p className="font-bold text-[#141b2b]">
                    {selectedDispute.raw?.clientName}
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg">
                  <p className="text-xs text-[#3e4a3d] mb-1">Bên Freelancer</p>
                  <p className="font-bold text-[#141b2b]">
                    {selectedDispute.raw?.freelancerName}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-body-sm text-[#3e4a3d] font-bold mb-1">
                  Số tiền đang tranh chấp:
                </p>
                <p className="text-title-lg text-rose-600 font-extrabold">
                  {selectedDispute.raw?.amount?.toLocaleString("vi-VN")} VND
                </p>
              </div>

              <div>
                <p className="text-body-sm text-[#3e4a3d] font-bold mb-1">
                  Nội dung khiếu nại:
                </p>
                <div className="bg-[#f1f4f0] p-3 rounded-lg text-sm text-[#141b2b]">
                  {selectedDispute.raw?.reason || "Không có mô tả chi tiết"}
                </div>
              </div>
            </div>

            {(() => {
              const isPendingDispute =
                selectedDispute?.raw?.status === "OPEN" ||
                selectedDispute?.raw?.status === "PENDING" ||
                selectedDispute?.status === "OPEN" ||
                selectedDispute?.status === "PENDING" ||
                selectedDispute?.status === "Pending";
              const isReadOnlyHistory =
                activeTab === "DisputeHistory" || !isPendingDispute;

              return (
                <div className="px-6 py-4 border-t border-[#e1e8fd] bg-gray-50 rounded-b-xl flex flex-col gap-3">
                  {showAssignStaffDrawer && (
                    <div className="bg-white p-3.5 rounded-xl border border-indigo-200 shadow-sm flex flex-col sm:flex-row items-center gap-3 animate-in fade-in zoom-in-95 duration-150">
                      <div className="flex-1 w-full">
                        <label className="block text-xs font-bold text-indigo-900 mb-1">
                          Chọn nhân viên để phân công nhiệm vụ:
                        </label>
                        <select
                          value={selectedAssignStaffEmail}
                          onChange={(e) =>
                            setSelectedAssignStaffEmail(e.target.value)
                          }
                          className="w-full h-10 rounded-lg border border-indigo-300 bg-indigo-50/50 px-3 text-xs font-bold text-indigo-950 outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                          <option value="">
                            -- Chọn nhân viên thuộc phòng Tranh chấp --
                          </option>
                          {(() => {
                            const currentDeptCode =
                              staffDepartmentCode || "DIS";
                            const filteredStaff = staffList.filter((s) => {
                              const code = String(
                                s.departmentCode || s.deptCode || s.code || "",
                              ).toUpperCase();
                              const name = String(
                                s.departmentName || s.department || "",
                              ).toLowerCase();
                              const email = String(s.email || "").toLowerCase();

                              if (currentDeptCode === "DIS") {
                                return (
                                  code === "DIS" ||
                                  name.includes("tranh chấp") ||
                                  name.includes("dispute") ||
                                  email.includes("dispute")
                                );
                              } else if (currentDeptCode === "MOD") {
                                return (
                                  code === "MOD" ||
                                  name.includes("kiểm duyệt") ||
                                  name.includes("moderation") ||
                                  email.includes("moderation")
                                );
                              } else if (currentDeptCode === "FIN") {
                                return (
                                  code === "FIN" ||
                                  name.includes("tài chính") ||
                                  name.includes("finance") ||
                                  email.includes("finance")
                                );
                              } else if (currentDeptCode === "CS") {
                                return (
                                  code === "CS" ||
                                  name.includes("hỗ trợ") ||
                                  name.includes("support") ||
                                  email.includes("support")
                                );
                              }
                              return true;
                            });

                            if (filteredStaff.length > 0) {
                              return filteredStaff.map((s) => (
                                <option
                                  key={s.id || s.staffId || s.email}
                                  value={s.email}
                                >
                                  {s.fullName || s.displayName || s.email} (
                                  {s.email})
                                </option>
                              ));
                            }

                            return [
                              {
                                email: "staff.dispute@gmail.com",
                                name: "Nhân viên Tranh chấp",
                              },
                              {
                                email: "staff.dispute2@gmail.com",
                                name: "Nhân viên Tranh chấp 2",
                              },
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
                          onClick={() =>
                            handleAssignDisputeToStaff(selectedAssignStaffEmail)
                          }
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-lg shadow transition-all cursor-pointer"
                        >
                          Xác nhận phân công
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 w-full">
                    {!isReadOnlyHistory && (
                      <button
                        type="button"
                        onClick={() =>
                          setShowAssignStaffDrawer(!showAssignStaffDrawer)
                        }
                        className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        Phân công công việc
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ---------------- MODERATION DETAIL MODAL ---------------- */}
      {showModerationModal && selectedModerationItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-[#e1e8fd] flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e1e8fd]">
              <h2 className="text-title-md font-extrabold text-[#141b2b]">
                Chi tiết kiểm duyệt
              </h2>
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
                <span
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                    selectedModerationItem.type === "PROJECT"
                      ? "bg-emerald-50 text-[#006b2c] border-emerald-100"
                      : selectedModerationItem.type === "GIG"
                        ? "bg-blue-50 text-blue-700 border-blue-100"
                        : "bg-indigo-50 text-indigo-700 border-indigo-100"
                  }`}
                >
                  {selectedModerationItem.type}
                </span>
                <span className="text-xs text-[#6e7b6c] font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {selectedModerationItem.subDate}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-[#141b2b] leading-snug">
                {selectedModerationItem.title}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold shrink-0">
                    {selectedModerationItem.author
                      ? selectedModerationItem.author.charAt(0).toUpperCase()
                      : "U"}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] text-[#6e7b6c] uppercase font-bold block">
                      Người đăng
                    </span>
                    <span className="text-sm font-extrabold text-slate-800 block truncate">
                      {selectedModerationItem.author}
                    </span>
                  </div>
                </div>

                <div className="bg-amber-50/50 border border-amber-200/60 p-4 rounded-xl flex items-start gap-2.5 text-amber-850">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="text-[11px] text-amber-700 uppercase font-bold block">
                      Lý do kiểm duyệt
                    </span>
                    <span className="text-xs font-bold text-amber-800">
                      {selectedModerationItem.reason}
                    </span>
                  </div>
                </div>
              </div>

              {selectedModerationItem.type === "PROFILE" &&
              selectedModerationItem.rawRequest ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                      <p className="font-bold text-slate-500 uppercase pb-2 border-b border-slate-200 mb-2">
                        Thông tin hiện tại
                      </p>
                      <p>
                        <strong>Tên hiển thị:</strong>{" "}
                        {selectedModerationItem.rawRequest.employer
                          ?.displayName || "Chưa cập nhật"}
                      </p>
                      <p>
                        <strong>Họ và tên:</strong>{" "}
                        {selectedModerationItem.rawRequest.employer?.fullName ||
                          "Chưa cập nhật"}
                      </p>
                      <p>
                        <strong>Số điện thoại:</strong>{" "}
                        {selectedModerationItem.rawRequest.employer?.phone ||
                          "Chưa cập nhật"}
                      </p>
                      <p>
                        <strong>Tên công ty:</strong>{" "}
                        {selectedModerationItem.rawRequest.employer
                          ?.companyName || "Chưa cập nhật"}
                      </p>
                      <p>
                        <strong>Website:</strong>{" "}
                        {selectedModerationItem.rawRequest.employer?.website ||
                          "Chưa cập nhật"}
                      </p>
                      <p>
                        <strong>Quy mô:</strong>{" "}
                        {selectedModerationItem.rawRequest.employer
                          ?.companySize || "Chưa cập nhật"}
                      </p>
                      <p>
                        <strong>Ngành nghề:</strong>{" "}
                        {selectedModerationItem.rawRequest.employer?.industry ||
                          "Chưa cập nhật"}
                      </p>
                      <p>
                        <strong>Mã số thuế:</strong>{" "}
                        {selectedModerationItem.rawRequest.employer?.taxCode ||
                          "Chưa cập nhật"}
                      </p>
                      <p>
                        <strong>Địa chỉ:</strong>{" "}
                        {selectedModerationItem.rawRequest.employer?.address
                          ? `${selectedModerationItem.rawRequest.employer.address}, ${selectedModerationItem.rawRequest.employer.city || ""}, ${selectedModerationItem.rawRequest.employer.country || ""}`
                          : "Chưa cập nhật"}
                      </p>
                      <p>
                        <strong>Mô tả:</strong>{" "}
                        {selectedModerationItem.rawRequest.employer
                          ?.companyDescription || "Chưa cập nhật"}
                      </p>
                    </div>
                    <div className="bg-indigo-50/30 p-4 rounded-xl border border-indigo-100 space-y-1">
                      <p className="font-bold text-indigo-600 uppercase pb-2 border-b border-indigo-100 mb-2">
                        Thông tin đề xuất
                      </p>
                      <p>
                        <strong>Tên hiển thị:</strong>{" "}
                        <span
                          className={
                            selectedModerationItem.rawRequest.displayName !==
                            selectedModerationItem.rawRequest.employer
                              ?.displayName
                              ? "text-indigo-600 font-bold"
                              : ""
                          }
                        >
                          {selectedModerationItem.rawRequest.displayName ||
                            "Chưa cập nhật"}
                        </span>
                      </p>
                      <p>
                        <strong>Họ và tên:</strong>{" "}
                        <span
                          className={
                            selectedModerationItem.rawRequest.fullName !==
                            selectedModerationItem.rawRequest.employer?.fullName
                              ? "text-indigo-600 font-bold"
                              : ""
                          }
                        >
                          {selectedModerationItem.rawRequest.fullName ||
                            "Chưa cập nhật"}
                        </span>
                      </p>
                      <p>
                        <strong>Số điện thoại:</strong>{" "}
                        <span
                          className={
                            selectedModerationItem.rawRequest.phone !==
                            selectedModerationItem.rawRequest.employer?.phone
                              ? "text-indigo-600 font-bold"
                              : ""
                          }
                        >
                          {selectedModerationItem.rawRequest.phone ||
                            "Chưa cập nhật"}
                        </span>
                      </p>
                      <p>
                        <strong>Tên công ty:</strong>{" "}
                        <span
                          className={
                            selectedModerationItem.rawRequest.companyName !==
                            selectedModerationItem.rawRequest.employer
                              ?.companyName
                              ? "text-indigo-600 font-bold"
                              : ""
                          }
                        >
                          {selectedModerationItem.rawRequest.companyName ||
                            "Chưa cập nhật"}
                        </span>
                      </p>
                      <p>
                        <strong>Website:</strong>{" "}
                        <span
                          className={
                            selectedModerationItem.rawRequest.website !==
                            selectedModerationItem.rawRequest.employer?.website
                              ? "text-indigo-600 font-bold"
                              : ""
                          }
                        >
                          {selectedModerationItem.rawRequest.website ||
                            "Chưa cập nhật"}
                        </span>
                      </p>
                      <p>
                        <strong>Quy mô:</strong>{" "}
                        <span
                          className={
                            selectedModerationItem.rawRequest.companySize !==
                            selectedModerationItem.rawRequest.employer
                              ?.companySize
                              ? "text-indigo-600 font-bold"
                              : ""
                          }
                        >
                          {selectedModerationItem.rawRequest.companySize ||
                            "Chưa cập nhật"}
                        </span>
                      </p>
                      <p>
                        <strong>Ngành nghề:</strong>{" "}
                        <span
                          className={
                            selectedModerationItem.rawRequest.industry !==
                            selectedModerationItem.rawRequest.employer?.industry
                              ? "text-indigo-600 font-bold"
                              : ""
                          }
                        >
                          {selectedModerationItem.rawRequest.industry ||
                            "Chưa cập nhật"}
                        </span>
                      </p>
                      <p>
                        <strong>Mã số thuế:</strong>{" "}
                        <span
                          className={
                            selectedModerationItem.rawRequest.taxCode !==
                            selectedModerationItem.rawRequest.employer?.taxCode
                              ? "text-indigo-600 font-bold"
                              : ""
                          }
                        >
                          {selectedModerationItem.rawRequest.taxCode ||
                            "Chưa cập nhật"}
                        </span>
                      </p>
                      <p>
                        <strong>Địa chỉ:</strong>{" "}
                        <span
                          className={
                            selectedModerationItem.rawRequest.address !==
                              selectedModerationItem.rawRequest.employer
                                ?.address ||
                            selectedModerationItem.rawRequest.city !==
                              selectedModerationItem.rawRequest.employer?.city
                              ? "text-indigo-600 font-bold"
                              : ""
                          }
                        >
                          {selectedModerationItem.rawRequest.address
                            ? `${selectedModerationItem.rawRequest.address}, ${selectedModerationItem.rawRequest.city || ""}, ${selectedModerationItem.rawRequest.country || ""}`
                            : "Chưa cập nhật"}
                        </span>
                      </p>
                      <p>
                        <strong>Mô tả:</strong>{" "}
                        <span
                          className={
                            selectedModerationItem.rawRequest
                              .companyDescription !==
                            selectedModerationItem.rawRequest.employer
                              ?.companyDescription
                              ? "text-indigo-600 font-bold block whitespace-pre-line"
                              : ""
                          }
                        >
                          {selectedModerationItem.rawRequest
                            .companyDescription || "Chưa cập nhật"}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl text-xs space-y-1">
                    <p className="font-bold text-slate-700 pb-1.5 border-b border-slate-200 mb-1.5">
                      Thông tin tài khoản ngân hàng thụ hưởng đề xuất
                    </p>
                    <p>
                      <strong>Tên ngân hàng:</strong>{" "}
                      {selectedModerationItem.rawRequest.bankName ||
                        "Chưa cập nhật"}
                    </p>
                    <p>
                      <strong>Số tài khoản:</strong>{" "}
                      {selectedModerationItem.rawRequest.accountNumber ||
                        "Chưa cập nhật"}
                    </p>
                    <p>
                      <strong>Chủ tài khoản:</strong>{" "}
                      {selectedModerationItem.rawRequest.accountHolder ||
                        "Chưa cập nhật"}
                    </p>
                    <p>
                      <strong>Chi nhánh:</strong>{" "}
                      {selectedModerationItem.rawRequest.branch ||
                        "Chưa cập nhật"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#6e7b6c] uppercase block">
                    Nội dung chi tiết
                  </span>
                  <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl text-sm text-slate-850 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                    {selectedModerationItem.detail || "Không có mô tả chi tiết"}
                  </div>
                </div>
              )}

              {showModEscalateForm && (
                <div className="border border-[#ffdad6] bg-[#fff5f4] rounded-lg p-4 space-y-3">
                  <p className="text-body-sm font-bold text-[#ba1a1a]">
                    Chọn lý do báo cáo sự cố / trì hoãn:
                  </p>
                  <div className="space-y-2">
                    {[
                      "Nội dung chứa thông tin nhạy cảm/chính trị",
                      "Nghi ngờ lừa đảo/scam dự án",
                      "Thiếu thông tin xác thực từ chủ dự án",
                      "Cần ý kiến đánh giá từ Manager",
                      "Lý do khác",
                    ].map((reason, idx) => (
                      <label
                        key={idx}
                        className="flex items-start gap-2 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="modEscalateReason"
                          value={reason}
                          checked={modEscalateReason === reason}
                          onChange={(e) => setModEscalateReason(e.target.value)}
                          className="mt-1"
                        />
                        <span className="text-body-sm text-[#3e4a3d]">
                          {reason}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-[#e1e8fd] bg-gray-50 rounded-b-xl flex gap-3 flex-col sm:flex-row">
              {selectedModerationItem.status === "Pending" ||
              selectedModerationItem.status === "ESCALATED" ||
              selectedModerationItem.status === "Đã chuyển cấp" ? (
                showModEscalateForm ? (
                  <div className="flex gap-2 w-full">
                    <button
                      onClick={() => {
                        setShowModEscalateForm(false);
                        setModEscalateReason("");
                      }}
                      className="flex-1 py-2 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-lg transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={() =>
                        handleEscalateModerationItem(
                          selectedModerationItem,
                          modEscalateReason,
                        )
                      }
                      className="flex-1 py-2 px-4 bg-[#ba1a1a] hover:bg-[#93000a] text-white font-bold text-sm rounded-lg shadow transition-colors flex items-center justify-center gap-2"
                    >
                      Xác nhận gửi
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 w-full">
                    {selectedModerationItem.status !== "ESCALATED" &&
                      selectedModerationItem.status !== "Đã chuyển cấp" && (
                        <button
                          onClick={() => setShowModEscalateForm(true)}
                          className="flex-1 py-2 px-4 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold text-sm rounded-lg transition-colors"
                        >
                          Báo cáo sự cố / Trì hoãn
                        </button>
                      )}
                    {/* nut tiep nhan */}
                    <button
                      onClick={() => {
                        handleModAction(selectedModerationItem, true);
                        setShowModerationModal(false);
                      }}
                      className="flex-1 py-2 px-4 bg-[#006b2c] hover:bg-[#00873a] text-white font-bold text-sm rounded-lg shadow transition-colors flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" /> Tiếp nhận
                    </button>
                  </div>
                )
              ) : (
                <button
                  onClick={() => {
                    setShowModerationModal(false);
                    setSelectedModerationItem(null);
                    setShowModEscalateForm(false);
                    setModEscalateReason("");
                  }}
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
              <h2 className="text-title-md font-extrabold text-[#141b2b]">
                Chi tiết Yêu cầu Rút tiền
              </h2>
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
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedWithdrawal.statusRaw === "PENDING"
                      ? "bg-amber-100 text-amber-800"
                      : selectedWithdrawal.statusRaw === "APPROVED"
                        ? "bg-[#f7fff2] text-[#006b2c]"
                        : "bg-[#ffdad6] text-[#ba1a1a]"
                  }`}
                >
                  {selectedWithdrawal.status}
                </span>
              </div>

              <div className="border-t border-[#e9edff] pt-3 space-y-3">
                <div>
                  <p className="text-xs text-[#6e7b6c] mb-0.5 font-semibold">
                    Thành viên gửi yêu cầu
                  </p>
                  <p className="font-bold text-[#141b2b]">
                    {selectedWithdrawal.user}
                  </p>
                  <p className="text-xs text-slate-400">
                    {selectedWithdrawal.email}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-[#6e7b6c] mb-0.5 font-semibold">
                    Thông tin tài khoản nhận tiền
                  </p>
                  <div className="bg-[#f9f9ff] border border-[#e9edff] p-3 rounded-lg">
                    <p className="font-bold text-[#141b2b]">
                      {selectedWithdrawal.bank}
                    </p>
                    <p className="text-xs text-[#3e4a3d] font-mono mt-0.5">
                      Số tài khoản: {selectedWithdrawal.account}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-[#6e7b6c] mb-0.5 font-semibold">
                    Thời gian yêu cầu
                  </p>
                  <p className="font-medium text-[#141b2b]">
                    {selectedWithdrawal.date}
                  </p>
                </div>
                {selectedWithdrawal.statusRaw === "REJECTED" && (
                  <div>
                    <p className="text-xs text-[#6e7b6c] mb-0.5 font-semibold">
                      Lý do từ chối
                    </p>
                    <p className="font-semibold text-rose-600 bg-rose-50 border border-rose-100 p-2.5 rounded-lg">
                      {selectedWithdrawal.reason || "Không có lý do cụ thể"}
                    </p>
                  </div>
                )}

                <div className="bg-rose-50/50 border border-rose-100/55 p-3 rounded-lg flex justify-between items-center">
                  <span className="text-xs text-rose-800 font-bold uppercase">
                    Số tiền rút:
                  </span>
                  <span className="text-title-md font-extrabold text-rose-600">
                    {selectedWithdrawal.amount.toLocaleString("vi-VN")} VND
                  </span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#e1e8fd] bg-gray-50 rounded-b-xl flex gap-3">
              {selectedWithdrawal.statusRaw === "PENDING" ? (
                <>
                  <button
                    onClick={() =>
                      handleWithdrawalAction(selectedWithdrawal.id, "APPROVED")
                    }
                    className="flex-1 py-2 px-3 bg-[#006b2c] hover:bg-[#00873a] text-white font-bold text-sm rounded-lg shadow transition-colors text-center"
                  >
                    Phê duyệt
                  </button>
                  <button
                    onClick={() =>
                      handleWithdrawalAction(selectedWithdrawal.id, "REJECTED")
                    }
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

      {/* ---------------- don dieu chuyen---------------- */}
      {showTransferRequestModal &&
        (() => {
          const targetRequest = selectedRequestDetails || latestTransferRequest;
          return (
            <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#f7f8f7] px-4 py-8">
              <div className="mx-auto flex min-h-full w-full max-w-[920px] flex-col">
                <div className="mb-8 flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[17px] font-extrabold text-[#009b3a]">
                      FelanPro
                    </span>
                    <span className="h-4 w-px bg-[#cfd8cd]" />
                    <span className="text-[12px] font-medium text-[#3e4a3d]">
                      HR Terminal
                    </span>
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

                <form
                  onSubmit={handleTransferRequestSubmit}
                  className="rounded-xl border border-[#e5ece2] bg-white p-6 shadow-[0_8px_24px_rgba(20,27,43,0.08)] sm:p-8"
                >
                  {(() => {
                    const targetRequest =
                      selectedRequestDetails || latestTransferRequest;
                    const isApprovedHandover =
                      targetRequest?.status === "APPROVED";

                    return (
                      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h2 className="text-[28px] font-extrabold leading-tight text-black sm:text-[32px]">
                            {isApprovedHandover
                              ? "Đơn Bàn giao Công việc & Hồ sơ"
                              : "Đơn yêu cầu điều chuyển phòng ban"}
                          </h2>
                          <p className="mt-2 text-[15px] text-[#3e4a3d]">
                            {isApprovedHandover
                              ? "Thực hiện bàn giao công việc trước khi chính thức chuyển sang phòng ban mới"
                              : "Gửi yêu cầu chuyển sang phòng ban khác"}
                          </p>
                        </div>
                        <span
                          className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-[12px] font-bold ${
                            isApprovedHandover
                              ? "bg-amber-100 text-amber-800 border border-amber-300"
                              : targetRequest?.status === "PENDING"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : targetRequest?.status === "REJECTED"
                                  ? "bg-rose-100 text-rose-800 border border-rose-200"
                                  : "bg-[#e8f5e7] text-[#006b2c]"
                          }`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${
                              isApprovedHandover
                                ? "bg-amber-500"
                                : targetRequest?.status === "PENDING"
                                  ? "bg-amber-400"
                                  : targetRequest?.status === "REJECTED"
                                    ? "bg-rose-500"
                                    : "bg-[#00a63e]"
                            }`}
                          />
                          {isApprovedHandover
                            ? "Cần bàn giao"
                            : targetRequest?.status === "PENDING"
                              ? "Đang chờ duyệt"
                              : targetRequest?.status === "REJECTED"
                                ? "Đã từ chối"
                                : "Bản nháp"}
                        </span>
                      </div>
                    );
                  })()}

                  {(() => {
                    const targetRequest =
                      selectedRequestDetails || latestTransferRequest;
                    if (!targetRequest) return null;

                    if (targetRequest.status === "PENDING") {
                      return (
                        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-body-sm font-semibold flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                              <Clock className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-extrabold block text-left">
                                Yêu cầu điều chuyển đang chờ phê duyệt
                              </span>
                              <span className="text-[12px] text-amber-800 font-medium block text-left">
                                Bạn đã gửi đơn chuyển sang phòng ban{" "}
                                {targetRequest.toDepartment}. Vui lòng chờ phản
                                hồi từ Manager.
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmConfig({
                                title: "Hủy đơn xin điều chuyển",
                                message:
                                  "Bạn có chắc muốn HỦY đơn xin điều chuyển đang chờ duyệt này không?",
                                type: "danger",
                                confirmText: "Xác nhận Hủy đơn",
                                cancelText: "Không",
                                onConfirm: () => {
                                  setShowConfirmModal(false);
                                  adminApi
                                    .approveTransferRequest(
                                      targetRequest.requestId,
                                      "REJECTED",
                                      "Nhân viên đã tự hủy đơn xin điều chuyển",
                                      user?.id || 1,
                                    )
                                    .then(() => {
                                      showToast(
                                        "Đã hủy đơn xin điều chuyển thành công.",
                                        "info",
                                      );
                                      setSelectedRequestDetails(null);
                                      setLatestTransferRequest(null);
                                      setShowTransferRequestModal(false);
                                      triggerTransferRequestUpdate();
                                    })
                                    .catch(() => {
                                      showToast(
                                        "Đã hủy đơn xin điều chuyển.",
                                        "info",
                                      );
                                      setSelectedRequestDetails(null);
                                      setLatestTransferRequest(null);
                                      setShowTransferRequestModal(false);
                                      triggerTransferRequestUpdate();
                                    });
                                },
                              });
                              setShowConfirmModal(true);
                            }}
                            className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-[#ba1a1a] border border-rose-200 font-extrabold text-xs rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <XCircle className="w-4 h-4" /> Hủy đơn điều chuyển
                          </button>
                        </div>
                      );
                    }

                    if (targetRequest.status === "APPROVED") {
                      const staffUnfinishedTasks = Array.isArray(tasks)
                        ? tasks.filter(
                            (t) =>
                              t &&
                              t.status !== "Completed" &&
                              t.status !== "Manager đã ký duyệt" &&
                              t.status !== "Rejected",
                          )
                        : [];

                      return (
                        <div className="mb-6 space-y-6">
                          <div className="p-5 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-emerald-950 shadow-sm">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 mt-0.5">
                                <CheckCircle2 className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-base font-extrabold text-emerald-900 text-left">
                                  Đơn điều chuyển đã được Phê duyệt & Yêu cầu
                                  bàn giao công việc
                                </h3>
                                <p className="text-xs text-emerald-800 mt-1 leading-relaxed text-left">
                                  Manager đã chấp thuận đơn điều chuyển của bạn
                                  sang phòng ban{" "}
                                  <strong className="font-extrabold text-emerald-950">
                                    {targetRequest.toDepartment}
                                  </strong>
                                  . Vui lòng hoàn tất biểu mẫu bàn giao bên dưới
                                  trước khi chuyển sang đơn vị mới.
                                </p>
                                {targetRequest.decisionNote && (
                                  <p className="text-xs text-emerald-800 mt-1.5 italic text-left bg-emerald-100/60 p-2 rounded-lg border border-emerald-200/60">
                                    Ghi chú từ Manager: "
                                    {targetRequest.decisionNote}"
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-5 text-left">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                              <div className="flex items-center gap-2 text-[#006b2c]">
                                <FileText className="w-5 h-5" />
                                <h3 className="text-lg font-extrabold">
                                  Đơn Bàn giao Công việc & Hồ sơ
                                </h3>
                              </div>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                  handoverSubmitted
                                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                    : "bg-amber-100 text-amber-800 border-amber-300"
                                }`}
                              >
                                {handoverSubmitted
                                  ? "Đã bàn giao hoàn tất"
                                  : "Cần hoàn tất bàn giao"}
                              </span>
                            </div>

                            <div>
                              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-2">
                                Danh sách công việc chưa hoàn thành cần bàn giao
                                ({staffUnfinishedTasks.length} nhiệm vụ)
                              </label>
                              {staffUnfinishedTasks.length > 0 ? (
                                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                                  <table className="min-w-full divide-y divide-slate-100 text-xs">
                                    <thead className="bg-slate-100/70 font-bold text-slate-600">
                                      <tr>
                                        <th className="px-4 py-2.5 text-left">
                                          Mã công việc
                                        </th>
                                        <th className="px-4 py-2.5 text-left">
                                          Nội dung
                                        </th>
                                        <th className="px-4 py-2.5 text-left">
                                          Loại
                                        </th>
                                        <th className="px-4 py-2.5 text-left">
                                          Trạng thái
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                      {staffUnfinishedTasks.map((t) => (
                                        <tr
                                          key={t.id}
                                          className="hover:bg-slate-50"
                                        >
                                          <td className="px-4 py-2.5 font-bold text-[#006b2c]">
                                            {t.id}
                                          </td>
                                          <td className="px-4 py-2.5 max-w-[240px] truncate">
                                            {t.title}
                                          </td>
                                          <td className="px-4 py-2.5">
                                            {t.type}
                                          </td>
                                          <td className="px-4 py-2.5">
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                              {t.status}
                                            </span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 text-emerald-800 text-xs font-bold">
                                  ✓ Bạn không có công việc nào chưa hoàn thành
                                  (0 nhiệm vụ dở dang).
                                </div>
                              )}
                            </div>

                            <div>
                              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                                Nhân viên tiếp nhận bàn giao công việc{" "}
                                <span className="text-rose-500">*</span>
                              </label>
                              <select
                                disabled={handoverSubmitted}
                                value={handoverAssignee}
                                onChange={(e) =>
                                  setHandoverAssignee(e.target.value)
                                }
                                className="w-full p-3.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-800 outline-none focus:border-[#006b2c] mb-3"
                              >
                                <option value="">
                                  -- Chọn nhân viên tiếp nhận bàn giao --
                                </option>
                                {staffList
                                  .filter((s) => {
                                    if (s.email === user?.email) return false;
                                    const sDeptCode =
                                      normalizeDepartmentCode(
                                        s.departmentCode,
                                      ) ||
                                      normalizeDepartmentCode(s.department) ||
                                      normalizeDepartmentCode(
                                        s.departmentName,
                                      ) ||
                                      (s.email?.includes("moderation") ||
                                      s.email?.includes("mod")
                                        ? "MOD"
                                        : s.email?.includes("dispute") ||
                                            s.email?.includes("dis")
                                          ? "DIS"
                                          : s.email?.includes("support") ||
                                              s.email?.includes("cs")
                                            ? "CS"
                                            : s.email?.includes("finance") ||
                                                s.email?.includes("fin")
                                              ? "FIN"
                                              : s.email?.includes("it") ||
                                                  s.email?.includes("tech")
                                                ? "IT"
                                                : "");
                                    return (
                                      !staffDepartmentCode ||
                                      !sDeptCode ||
                                      sDeptCode === staffDepartmentCode
                                    );
                                  })
                                  .map((s) => (
                                    <option
                                      key={s.id || s.email}
                                      value={s.email}
                                    >
                                      {s.fullName || s.name || s.email} (
                                      {s.email})
                                      {s.department || s.departmentName
                                        ? ` - ${s.department || s.departmentName}`
                                        : ""}
                                    </option>
                                  ))}
                              </select>

                              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                                Nội dung chi tiết & Ghi chú bàn giao công việc{" "}
                                <span className="text-rose-500">*</span>
                              </label>
                              <textarea
                                rows={3}
                                disabled={handoverSubmitted}
                                value={handoverNotes}
                                onChange={(e) =>
                                  setHandoverNotes(e.target.value)
                                }
                                placeholder="Mô tả tiến độ các công việc dở dang, đường dẫn tệp tài liệu, tài khoản giao nhận..."
                                className="w-full p-3.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-800 outline-none focus:border-[#006b2c]"
                              />
                            </div>

                            {!handoverSubmitted ? (
                              <div className="flex flex-col sm:flex-row gap-3">
                                {/* nut khong ban giao */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setConfirmConfig({
                                      title:
                                        "Hủy bàn giao & Hủy đơn điều chuyển",
                                      message:
                                        "Bạn có chắc chắn muốn HỦY đơn xin điều chuyển này không? Sau khi hủy, đơn này sẽ không còn hiệu lực.",
                                      type: "danger",
                                      confirmText: "Xác nhận Hủy đơn",
                                      cancelText: "Không",
                                      onConfirm: () => {
                                        setShowConfirmModal(false);
                                        // khong ban giao: huy don dieu chuyen
                                        adminApi
                                          .approveTransferRequest(
                                            targetRequest.requestId,
                                            "REJECTED",
                                            "Nhân viên đã tự hủy bàn giao & đơn điều chuyển",
                                            user?.id || 1,
                                          )
                                          .then(() => {
                                            showToast(
                                              "Đã hủy đơn xin điều chuyển thành công. Đơn không còn hiệu lực.",
                                              "info",
                                            );
                                            setSelectedRequestDetails(null);
                                            setLatestTransferRequest(null);
                                            setShowTransferRequestModal(false);
                                            triggerTransferRequestUpdate();
                                          })
                                          .catch((err) => {
                                            console.error(err);
                                            showToast(
                                              "Đã hủy đơn xin điều chuyển.",
                                              "info",
                                            );
                                            setSelectedRequestDetails(null);
                                            setLatestTransferRequest(null);
                                            setShowTransferRequestModal(false);
                                            triggerTransferRequestUpdate();
                                          });
                                      },
                                    });
                                    setShowConfirmModal(true);
                                  }}
                                  className="py-3 px-5 bg-rose-50 hover:bg-rose-100 text-[#ba1a1a] border border-rose-200 font-extrabold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer sm:w-auto whitespace-nowrap"
                                >
                                  <XCircle className="w-4 h-4" /> Hủy bàn giao &
                                  Hủy đơn
                                </button>
                                {/* nut xac nhan ban giao */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (
                                      staffUnfinishedTasks.length > 0 &&
                                      !handoverAssignee
                                    ) {
                                      showToast(
                                        "Vui lòng chọn nhân viên tiếp nhận bàn giao công việc.",
                                        "error",
                                      );
                                      return;
                                    }
                                    if (!handoverNotes.trim()) {
                                      showToast(
                                        "Vui lòng điền chi tiết nội dung & ghi chú bàn giao.",
                                        "error",
                                      );
                                      return;
                                    }
                                    const fullNotes = handoverAssignee
                                      ? `[Bàn giao cho: ${handoverAssignee}] ${handoverNotes}`
                                      : handoverNotes;
                                    // xac nhan ban giao: hoan tat dieu chuyen
                                    adminApi
                                      .completeTransferHandover(
                                        targetRequest.requestId,
                                        fullNotes,
                                        user?.id || 1,
                                      )
                                      .then((res) => {
                                        if (
                                          res.success ||
                                          res.success !== false
                                        ) {
                                          setHandoverSubmitted(true);
                                          showToast(
                                            "Đã gửi xác nhận bàn giao công việc thành công! Hệ thống đã chuyển bạn sang phòng ban mới.",
                                            "success",
                                          );
                                          triggerTransferRequestUpdate();
                                        } else {
                                          showToast(
                                            res.message ||
                                              "Không thể hoàn tất điều chuyển.",
                                            "error",
                                          );
                                        }
                                      })
                                      .catch((err) => {
                                        console.error(err);
                                        showToast(
                                          "Lỗi khi gửi xác nhận bàn giao.",
                                          "error",
                                        );
                                      });
                                  }}
                                  className="flex-1 py-3 bg-[#006b2c] hover:bg-[#00873a] text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                                >
                                  <CheckCircle2 className="w-4 h-4" /> Xác nhận
                                  Bàn giao & Hoàn tất Điều chuyển
                                </button>
                              </div>
                            ) : (
                              <div className="p-3.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-center font-extrabold text-xs flex items-center justify-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                                Đã hoàn tất bàn giao công việc & điều chuyển
                                phòng ban thành công!
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }

                    if (targetRequest.status === "REJECTED") {
                      return (
                        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-body-sm font-semibold flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-[#ba1a1a] shrink-0">
                              <AlertCircle className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-extrabold block text-[#ba1a1a] text-left">
                                Yêu cầu điều chuyển đã bị từ chối!
                              </span>
                              <span className="text-[12px] text-rose-800 font-medium block text-left">
                                Đơn xin chuyển sang phòng ban{" "}
                                {targetRequest.toDepartment} không được chấp
                                thuận.
                              </span>
                              {targetRequest.decisionNote && (
                                <p className="text-[12px] text-[#ba1a1a] mt-1 font-bold text-left">
                                  Lý do từ chối: "{targetRequest.decisionNote}"
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRequestDetails(null);
                              setLatestTransferRequest(null);
                              setTransferRequestTargetDeptId("");
                              setTransferRequestReason("");
                              setTransferRequestDetails({
                                desiredPosition: "",
                                desiredStartDate: "",
                                transferType: "Yêu cầu cá nhân",
                                skills: "",
                                achievements: "",
                              });
                            }}
                            className="px-4 py-2 bg-[#009b3a] hover:bg-[#00873a] text-white font-extrabold text-xs rounded-lg shadow transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <Plus className="w-4 h-4" /> Nhập đơn xin điều
                            chuyển mới
                          </button>
                        </div>
                      );
                    }

                    return null;
                  })()}

                  {/* RENDER TRANSFER REQUEST FORM FIELDS IF CREATING OR IN PENDING/REJECTED STATE */}
                  {!(
                    (selectedRequestDetails || latestTransferRequest)
                      ?.status === "APPROVED"
                  ) && (
                    <>
                      <div className="space-y-8 text-left">
                        <section>
                          <div className="mb-5 flex items-center gap-2 border-b border-[#b9cbb5] pb-3 text-[#009b3a]">
                            <User className="h-5 w-5" />
                            <h3 className="text-[18px] font-extrabold">
                              Thông tin nhân viên
                            </h3>
                          </div>
                          <div className="grid gap-5 md:grid-cols-2">
                            <div>
                              <label className="mb-2 block text-[13px] font-bold text-black">
                                Mã nhân viên
                              </label>
                              <input
                                readOnly
                                value={
                                  (
                                    selectedRequestDetails ||
                                    latestTransferRequest
                                  )?.userCode ||
                                  myProfile?.staffCode ||
                                  myProfile?.employeeCode ||
                                  `FP-${user?.id || "----"}`
                                }
                                className="h-12 w-full rounded-lg border border-[#b8d0b2] bg-[#f4fbf1] px-3 text-[14px] text-[#3e4a3d] outline-none"
                              />
                            </div>
                            <div>
                              <label className="mb-2 block text-[13px] font-bold text-black">
                                Họ và tên
                              </label>
                              <input
                                readOnly
                                value={
                                  (
                                    selectedRequestDetails ||
                                    latestTransferRequest
                                  )?.userDisplayName ||
                                  user?.displayName ||
                                  user?.name ||
                                  myProfile?.fullName ||
                                  ""
                                }
                                className="h-12 w-full rounded-lg border border-[#b8d0b2] bg-[#f4fbf1] px-3 text-[14px] text-[#3e4a3d] outline-none"
                              />
                            </div>
                            <div>
                              <label className="mb-2 block text-[13px] font-bold text-black">
                                Email công việc
                              </label>
                              <input
                                readOnly
                                value={
                                  (
                                    selectedRequestDetails ||
                                    latestTransferRequest
                                  )?.userEmail ||
                                  user?.email ||
                                  myProfile?.email ||
                                  ""
                                }
                                className="h-12 w-full rounded-lg border border-[#b8d0b2] bg-[#f4fbf1] px-3 text-[14px] text-[#3e4a3d] outline-none"
                              />
                            </div>
                            <div>
                              <label className="mb-2 block text-[13px] font-bold text-black">
                                Phòng ban hiện tại
                              </label>
                              <input
                                readOnly
                                value={
                                  (
                                    selectedRequestDetails ||
                                    latestTransferRequest
                                  )?.fromDepartment ||
                                  myProfile?.department ||
                                  myProfile?.departmentName ||
                                  "Chưa phân bổ"
                                }
                                className="h-12 w-full rounded-lg border border-[#b8d0b2] bg-[#f4fbf1] px-3 text-[14px] text-[#3e4a3d] outline-none"
                              />
                            </div>
                          </div>
                        </section>

                        <section>
                          <div className="mb-5 flex items-center gap-2 border-b border-[#b9cbb5] pb-3 text-[#009b3a]">
                            <Briefcase className="h-5 w-5" />
                            <h3 className="text-[18px] font-extrabold">
                              Thông tin điều chuyển
                            </h3>
                          </div>
                          <div className="grid gap-5 md:grid-cols-2">
                            <div>
                              <label className="mb-2 block text-[13px] font-bold text-black">
                                Phòng ban muốn chuyển đến{" "}
                                <span className="text-[#ba1a1a]">*</span>
                              </label>
                              {targetRequest &&
                              targetRequest.status !== "REJECTED" ? (
                                <input
                                  readOnly
                                  value={targetRequest.toDepartment || ""}
                                  className="h-12 w-full rounded-lg border border-[#b8d0b2] bg-[#f4fbf1] px-3 text-[14px] font-bold text-[#006b2c] outline-none"
                                />
                              ) : (
                                <select
                                  disabled={isTransferPending}
                                  value={transferRequestTargetDeptId}
                                  onChange={(e) =>
                                    setTransferRequestTargetDeptId(
                                      e.target.value,
                                    )
                                  }
                                  className="h-12 w-full rounded-lg border border-[#b8d0b2] bg-white px-3 text-[14px] text-[#3e4a3d] outline-none focus:border-[#009b3a] focus:ring-2 focus:ring-[#009b3a]/15 disabled:bg-slate-50 disabled:text-[#7f8f7c] disabled:border-[#d0dcd0] disabled:cursor-not-allowed"
                                >
                                  <option value="">Chọn phòng ban</option>
                                  {(Array.isArray(departmentsList)
                                    ? departmentsList
                                    : []
                                  )
                                    .filter(
                                      (d) =>
                                        d.name !==
                                        (myProfile?.department ||
                                          myProfile?.departmentName),
                                    )
                                    .map((dept) => (
                                      <option
                                        key={dept.departmentId || dept.id}
                                        value={dept.departmentId || dept.id}
                                      >
                                        {dept.name}
                                      </option>
                                    ))}
                                </select>
                              )}
                            </div>
                            <div>
                              <label className="mb-2 block text-[13px] font-bold text-black">
                                Vị trí mong muốn
                              </label>
                              <input
                                disabled={
                                  isTransferPending ||
                                  Boolean(
                                    targetRequest &&
                                    targetRequest.status !== "REJECTED",
                                  )
                                }
                                value={
                                  targetRequest &&
                                  targetRequest.status !== "REJECTED"
                                    ? targetRequest.desiredPosition
                                    : transferRequestDetails.desiredPosition
                                }
                                onChange={(e) =>
                                  setTransferRequestDetails((prev) => ({
                                    ...prev,
                                    desiredPosition: e.target.value,
                                  }))
                                }
                                placeholder="Nhập vị trí dự kiến"
                                className="h-12 w-full rounded-lg border border-[#b8d0b2] bg-white px-3 text-[14px] text-[#3e4a3d] outline-none focus:border-[#009b3a] focus:ring-2 focus:ring-[#009b3a]/15 disabled:bg-slate-50 disabled:text-[#7f8f7c] disabled:border-[#d0dcd0] disabled:cursor-not-allowed"
                              />
                            </div>
                            <div>
                              <label className="mb-2 block text-[13px] font-bold text-black">
                                Ngày mong muốn bắt đầu
                              </label>
                              <input
                                disabled={
                                  isTransferPending ||
                                  Boolean(
                                    targetRequest &&
                                    targetRequest.status !== "REJECTED",
                                  )
                                }
                                type={
                                  targetRequest &&
                                  targetRequest.status !== "REJECTED"
                                    ? "text"
                                    : "date"
                                }
                                min={new Date().toISOString().split("T")[0]}
                                value={
                                  targetRequest &&
                                  targetRequest.status !== "REJECTED"
                                    ? targetRequest.desiredStartDate
                                    : transferRequestDetails.desiredStartDate
                                }
                                onChange={(e) =>
                                  setTransferRequestDetails((prev) => ({
                                    ...prev,
                                    desiredStartDate: e.target.value,
                                  }))
                                }
                                className="h-12 w-full rounded-lg border border-[#b8d0b2] bg-white px-3 text-[14px] text-[#3e4a3d] outline-none focus:border-[#009b3a] focus:ring-2 focus:ring-[#009b3a]/15 disabled:bg-slate-50 disabled:text-[#7f8f7c] disabled:border-[#d0dcd0] disabled:cursor-not-allowed"
                              />
                            </div>
                            <div>
                              <label className="mb-2 block text-[13px] font-bold text-black">
                                Loại điều chuyển
                              </label>
                              <input
                                readOnly={Boolean(
                                  targetRequest &&
                                  targetRequest.status !== "REJECTED",
                                )}
                                disabled={isTransferPending}
                                value={
                                  targetRequest &&
                                  targetRequest.status !== "REJECTED"
                                    ? targetRequest.transferType
                                    : transferRequestDetails.transferType
                                }
                                onChange={(e) =>
                                  setTransferRequestDetails((prev) => ({
                                    ...prev,
                                    transferType: e.target.value,
                                  }))
                                }
                                className="h-12 w-full rounded-lg border border-[#b8d0b2] bg-white px-3 text-[14px] text-[#3e4a3d] outline-none focus:border-[#009b3a] focus:ring-2 focus:ring-[#009b3a]/15 disabled:bg-slate-50 disabled:text-[#7f8f7c] disabled:border-[#d0dcd0] disabled:cursor-not-allowed"
                              />
                            </div>
                          </div>
                        </section>

                        <section>
                          <div className="mb-5 flex items-center gap-2 border-b border-[#b9cbb5] pb-3 text-[#009b3a]">
                            <FileText className="h-5 w-5" />
                            <h3 className="text-[18px] font-extrabold">
                              Lý do điều chuyển
                            </h3>
                          </div>
                          <label className="mb-2 block text-[13px] font-bold text-black">
                            Chi tiết lý do
                          </label>
                          <textarea
                            disabled={
                              isTransferPending ||
                              Boolean(
                                targetRequest &&
                                targetRequest.status !== "REJECTED",
                              )
                            }
                            value={
                              targetRequest &&
                              targetRequest.status !== "REJECTED"
                                ? targetRequest.reason
                                : transferRequestReason
                            }
                            onChange={(e) =>
                              setTransferRequestReason(e.target.value)
                            }
                            placeholder="Trình bày lý do bạn muốn chuyển sang phòng ban khác"
                            className="min-h-[110px] w-full rounded-lg border border-[#b8d0b2] bg-white p-3 text-[14px] text-[#3e4a3d] outline-none focus:border-[#009b3a] focus:ring-2 focus:ring-[#009b3a]/15 disabled:bg-slate-50 disabled:text-[#7f8f7c] disabled:border-[#d0dcd0] disabled:cursor-not-allowed"
                          />
                        </section>

                        <section>
                          <div className="mb-5 flex items-center gap-2 border-b border-[#b9cbb5] pb-3 text-[#009b3a]">
                            <Activity className="h-5 w-5" />
                            <h3 className="text-[18px] font-extrabold">
                              Kỹ năng và kinh nghiệm
                            </h3>
                          </div>
                          <div className="space-y-5">
                            <div>
                              <label className="mb-2 block text-[13px] font-bold text-black">
                                Kỹ năng liên quan & Kinh nghiệm trước đây
                              </label>
                              <textarea
                                disabled={
                                  isTransferPending ||
                                  Boolean(
                                    targetRequest &&
                                    targetRequest.status !== "REJECTED",
                                  )
                                }
                                value={
                                  targetRequest &&
                                  targetRequest.status !== "REJECTED"
                                    ? targetRequest.skills
                                    : transferRequestDetails.skills
                                }
                                onChange={(e) =>
                                  setTransferRequestDetails((prev) => ({
                                    ...prev,
                                    skills: e.target.value,
                                  }))
                                }
                                placeholder="Liệt kê các kỹ năng phù hợp với vị trí mới..."
                                className="min-h-[92px] w-full rounded-lg border border-[#b8d0b2] bg-white p-3 text-[14px] text-[#3e4a3d] outline-none focus:border-[#009b3a] focus:ring-2 focus:ring-[#009b3a]/15 disabled:bg-slate-50 disabled:text-[#7f8f7c] disabled:border-[#d0dcd0] disabled:cursor-not-allowed"
                              />
                            </div>
                            <div>
                              <label className="mb-2 block text-[13px] font-bold text-black">
                                Thành tích nổi bật & Lý do bạn phù hợp
                              </label>
                              <textarea
                                disabled={
                                  isTransferPending ||
                                  Boolean(
                                    targetRequest &&
                                    targetRequest.status !== "REJECTED",
                                  )
                                }
                                value={
                                  targetRequest &&
                                  targetRequest.status !== "REJECTED"
                                    ? targetRequest.achievements
                                    : transferRequestDetails.achievements
                                }
                                onChange={(e) =>
                                  setTransferRequestDetails((prev) => ({
                                    ...prev,
                                    achievements: e.target.value,
                                  }))
                                }
                                placeholder="Nêu bật những lý do bạn là ứng viên sáng giá cho vị trí này..."
                                className="min-h-[92px] w-full rounded-lg border border-[#b8d0b2] bg-white p-3 text-[14px] text-[#3e4a3d] outline-none focus:border-[#009b3a] focus:ring-2 focus:ring-[#009b3a]/15 disabled:bg-slate-50 disabled:text-[#7f8f7c] disabled:border-[#d0dcd0] disabled:cursor-not-allowed"
                              />
                            </div>
                          </div>
                        </section>
                      </div>

                      {(!targetRequest ||
                        targetRequest.status === "REJECTED") && (
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
                            disabled={isTransferPending}
                            onClick={() => {
                              showToast(
                                "Đã lưu bản nháp yêu cầu điều chuyển.",
                                "success",
                              );
                              closeTransferRequestModal();
                            }}
                            className="h-12 rounded-lg border border-[#00a63e] bg-white px-7 text-[14px] font-semibold text-[#009b3a] transition-colors hover:bg-[#edf7ea] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Lưu bản nháp
                          </button>
                          <button
                            type="submit"
                            disabled={
                              isSubmittingTransferRequest || isTransferPending
                            }
                            className="h-12 rounded-lg bg-[#00a63e] px-8 text-[14px] font-bold text-white shadow-sm transition-colors hover:bg-[#008f36] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isSubmittingTransferRequest
                              ? "Đang gửi..."
                              : targetRequest?.status === "REJECTED"
                                ? "Gửi lại đơn điều chuyển mới"
                                : "Gửi yêu cầu"}
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {(selectedRequestDetails || latestTransferRequest) && (
                    <div className="mt-6 flex justify-end border-t border-slate-200 pt-5">
                      <button
                        type="button"
                        onClick={closeTransferRequestModal}
                        className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all cursor-pointer"
                      >
                        Đóng
                      </button>
                    </div>
                  )}
                </form>

                <div className="mt-9 flex flex-col gap-3 border-t border-[#cfd8cd] px-1 py-5 text-[11px] text-[#263326] sm:flex-row sm:items-center sm:justify-between">
                  <span>
                    © 2024 FelanPro HR Systems. High-Efficiency Environment.
                  </span>
                  <div className="flex gap-6">
                    <span>Privacy Policy</span>
                    <span>Terms of Service</span>
                    <span>Support</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      {/* Report Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-xl font-extrabold text-slate-800">
                Chi tiết Báo cáo vi phạm
              </h3>
              <button
                onClick={() => {
                  setSelectedReport(null);
                  setShowReportEscalateForm(false);
                  setReportEscalateReason("");
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-3 py-1 bg-slate-50 text-slate-700 border border-slate-200 rounded-md text-xs font-bold">
                  Đối tượng: {selectedReport.type || selectedReport.targetType}
                </span>
                <span
                  className={`px-3 py-1 text-xs font-bold border rounded-md ${
                    selectedReport.status === "Resolved"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                      : "bg-amber-50 text-amber-700 border-amber-100"
                  }`}
                >
                  Trạng thái: {selectedReport.status || "Pending"}
                </span>
              </div>

              {/* Target Name */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                <h4 className="text-xs font-bold text-[#6e7b6c] uppercase block mb-1">
                  Nội dung bị báo cáo
                </h4>
                <p className="text-base font-extrabold text-[#141b2b]">
                  {selectedReport.target || selectedReport.reportedName}
                  {selectedReport.targetId && (
                    <span className="text-xs font-normal text-slate-500 ml-2 block sm:inline mt-1 sm:mt-0">
                      (ID: {selectedReport.targetId})
                    </span>
                  )}
                </p>
                {selectedReport.targetId && (
                  <button
                    className="mt-2 text-xs text-[#006b2c] font-bold hover:underline flex items-center gap-1"
                    onClick={() => {
                      if (
                        selectedReport.type === "Hồ sơ" ||
                        selectedReport.targetType === "USER"
                      ) {
                        alert(
                          "Chức năng đang được cập nhật (ID: " +
                            selectedReport.targetId +
                            ")",
                        );
                      } else {
                        onNavigate("job_details", {
                          job: { id: selectedReport.targetId },
                        });
                      }
                    }}
                  >
                    Xem trang chi tiết ↗
                  </button>
                )}
              </div>

              {/* Evidence */}
              <div className="bg-rose-50/60 border border-rose-200 p-4 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-rose-800">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Lý do & Bằng chứng báo cáo
                  </span>
                </div>
                <p className="text-sm text-rose-950 whitespace-pre-wrap leading-relaxed">
                  {selectedReport.evidence ||
                    selectedReport.reason ||
                    "Không có bằng chứng cụ thể"}
                </p>
              </div>

              {/* Users Involved */}
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
                      {selectedReport.reporter || selectedReport.reporterName}
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
                      {selectedReport.accused || selectedReport.reportedName}
                    </span>
                  </div>
                </div>
              </div>

              {showReportEscalateForm && (
                <div className="border border-[#ffdad6] bg-[#fff5f4] rounded-lg p-4 space-y-3">
                  <p className="text-body-sm font-bold text-[#ba1a1a]">
                    Chọn lý do báo cáo sự cố / trì hoãn:
                  </p>
                  <div className="space-y-2">
                    {[
                      "Tranh chấp phức tạp cần Manager phân xử",
                      "Nghi ngờ báo cáo khống/vu khống",
                      "Mức độ vi phạm nghiêm trọng cần khóa tài khoản vĩnh viễn",
                      "Cần phối hợp với bộ phận Pháp chế/Tài chính",
                      "Lý do khác",
                    ].map((reason, idx) => (
                      <label
                        key={idx}
                        className="flex items-start gap-2 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="reportEscalateReason"
                          value={reason}
                          checked={reportEscalateReason === reason}
                          onChange={(e) =>
                            setReportEscalateReason(e.target.value)
                          }
                          className="mt-1"
                        />
                        <span className="text-body-sm text-[#3e4a3d]">
                          {reason}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex items-center justify-end gap-3">
              {!selectedReport.status ||
              selectedReport.status === "Pending" ||
              selectedReport.status === "Chờ xử lý" ||
              selectedReport.status === "Đã chuyển cấp" ||
              selectedReport.status === "ESCALATED" ? (
                showReportEscalateForm ? (
                  <div className="flex gap-2 w-full">
                    <button
                      onClick={() => {
                        setShowReportEscalateForm(false);
                        setReportEscalateReason("");
                      }}
                      className="flex-1 py-2 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-lg transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={() =>
                        handleEscalateReport(
                          selectedReport,
                          reportEscalateReason,
                        )
                      }
                      className="flex-1 py-2 px-4 bg-[#ba1a1a] hover:bg-[#93000a] text-white font-bold text-sm rounded-lg shadow transition-colors flex items-center justify-center gap-2"
                    >
                      Xác nhận gửi
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 w-full">
                    {selectedReport.status !== "Đã chuyển cấp" &&
                      selectedReport.status !== "ESCALATED" && (
                        <button
                          onClick={() => setShowReportEscalateForm(true)}
                          className="flex-1 py-2 px-4 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold text-sm rounded-lg transition-colors"
                          disabled={reportActionLoading}
                        >
                          Báo cáo sự cố / Trì hoãn
                        </button>
                      )}
                    {/* nut tiep nhan */}
                    <button
                      onClick={() => handleModAction(selectedReport, true)}
                      className="flex-1 py-2 px-4 bg-[#006b2c] hover:bg-[#00873a] text-white font-bold text-sm rounded-lg shadow transition-colors flex items-center justify-center gap-2"
                      disabled={reportActionLoading}
                    >
                      {reportActionLoading && (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      )}
                      <Check className="w-4 h-4" /> Tiếp nhận
                    </button>
                  </div>
                )
              ) : (
                <button
                  onClick={() => {
                    setSelectedReport(null);
                    setShowReportEscalateForm(false);
                    setReportEscalateReason("");
                  }}
                  className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  Đóng
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- HISTORIC LOG DETAIL MODAL ---------------- */}
      {selectedHistoryLog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-[#e1e8fd] flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e1e8fd]">
              <h2 className="text-title-md font-extrabold text-[#141b2b]">
                Chi tiết xử lý
              </h2>
              <button
                onClick={() => setSelectedHistoryLog(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-[#6e7b6c] hover:bg-[#f1f4f0]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-5 text-sm">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-[#006b2c] bg-[#f7fff2] px-2.5 py-0.5 rounded border border-[#bdcaba]">
                  {selectedHistoryLog.id}
                </span>
                <span className="text-xs text-[#6e7b6c] font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {selectedHistoryLog.time}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold shrink-0">
                    {selectedHistoryLog.actor
                      ? selectedHistoryLog.actor.charAt(0).toUpperCase()
                      : "S"}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] text-[#6e7b6c] uppercase font-bold block">
                      Người thực hiện
                    </span>
                    <span className="text-sm font-extrabold text-slate-800 block truncate">
                      {selectedHistoryLog.actor}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-[#006b2c] font-bold shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] text-[#6e7b6c] uppercase font-bold block">
                      Thao tác
                    </span>
                    <span className="inline-flex items-center text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded mt-0.5">
                      {getActionLabel(selectedHistoryLog.action)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-[#6e7b6c] uppercase block">
                  Nội dung chi tiết xử lý
                </span>
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm text-[#141b2b] leading-relaxed whitespace-pre-wrap">
                  {selectedHistoryLog.target || "Không có mô tả chi tiết"}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#e1e8fd] bg-gray-50 rounded-b-2xl flex justify-end">
              <button
                onClick={() => setSelectedHistoryLog(null)}
                className="py-2 px-6 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-sm rounded-lg transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- CONFIRMATION MODAL OVERLAY ---------------- */}
      {showConfirmModal && confirmConfig && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-100 flex flex-col space-y-4 animate-in zoom-in-95 duration-150 relative">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                  confirmConfig.type === "danger"
                    ? "bg-rose-100 text-rose-600"
                    : "bg-amber-100 text-amber-600"
                }`}
              >
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-800">
                  {confirmConfig.title || "Xác nhận hành động"}
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Thông báo từ hệ thống quản lý điều chuyển
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-sm font-semibold text-slate-700 leading-relaxed whitespace-pre-wrap">
                {confirmConfig.message}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-all"
              >
                {confirmConfig.cancelText || "Không, giữ lại đơn"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirmConfig.onConfirm) confirmConfig.onConfirm();
                }}
                className={`flex-1 py-2.5 px-4 text-white font-extrabold text-xs rounded-xl shadow-md transition-all ${
                  confirmConfig.type === "danger"
                    ? "bg-[#ba1a1a] hover:bg-[#93000a]"
                    : "bg-[#006b2c] hover:bg-[#00873a]"
                }`}
              >
                {confirmConfig.confirmText || "Xác nhận Hủy"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

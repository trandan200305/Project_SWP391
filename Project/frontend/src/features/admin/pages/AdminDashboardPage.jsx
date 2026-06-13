import React, { useState, useEffect } from 'react';
import { adminApi } from '../api/adminApi.js';
import { 
  LayoutDashboard, Users, ShieldAlert, BadgeDollarSign, Settings, 
  Search, Bell, UserCheck, AlertTriangle, CheckCircle2, Ban, 
  Lock, Unlock, Eye, X, Check, HeartPulse, HelpCircle, LogOut, 
  ArrowUpRight, ArrowDownRight, Calendar, Info, Sliders, Sparkles, RefreshCw, Download, FileText,
  ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Home, Clock, XCircle, History, ArrowRight,
  User, Edit3, MessageSquare, Shield
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function AdminDashboard({ user, onNavigateToHome, onNavigate, onLogout }) {
  
  const [activeTab, setActiveTab] = useState('home');
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
  
  const [selectedRoleTab, setSelectedRoleTab] = useState('ALL'); // all, employer, manager, staff
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
  const [createdCredentials, setCreatedCredentials] = useState(null); // { email, password, role, department }
  
  
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

  
  const [jobCategories, setJobCategories] = useState([]);
  const [kycRequests, setKycRequests] = useState([]);
  const [profileRequests, setProfileRequests] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [reports, setReports] = useState([]);
  const [articles, setArticles] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [seoConfigs, setSeoConfigs] = useState([]);
  const [activeCmsTab, setActiveCmsTab] = useState('seo'); 

  
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

  
  const [toast, setToast] = useState({ message: '', type: 'success', visible: false });
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

  const handleCreateUser = (e) => {
    e.preventDefault();
    if (!createForm.email) {
      showToast('Vui lòng nhập Email!', 'error');
      return;
    }
    if (!createForm.departmentId) {
      showToast('Vui lòng chọn Khoa/Phòng ban!', 'error');
      return;
    }

    setIsLoading(true);
    adminApi.inviteStaffOrManager(createForm.email, createRole, createForm.departmentId, createForm.managerId)
      .then(data => {
        setIsLoading(false);
        if (data.success === false) {
          showToast(data.message || 'Lỗi khi tạo tài khoản.', 'error');
        } else {
          showToast(data.message || 'Đã tạo tài khoản thành công!', 'success');
          setShowCreateModal(false);
          // Show credentials to admin
          if (data.generatedPassword) {
            setCreatedCredentials({
              email: data.generatedEmail || createForm.email,
              password: data.generatedPassword,
              role: data.role || createRole,
              department: data.department || ''
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
          adminApi.getUsers()
            .then(usersData => { if (Array.isArray(usersData)) setUsers(usersData); });
        }
      })
      .catch(err => {
        setIsLoading(false);
        console.error(err);
        showToast('Lỗi kết nối máy chủ.', 'error');
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
      showToast('Vui lòng nhập đầy đủ tên và mã khoa!', 'error');
      return;
    }
    setIsLoading(true);
    adminApi.createDepartment(deptForm)
      .then(res => {
        setIsLoading(false);
        showToast('Tạo khoa/phòng ban mới thành công!', 'success');
        setShowCreateDeptModal(false);
        setDeptForm({ name: '', code: '', description: '' });
        adminApi.getDepartments()
          .then(data => { if (Array.isArray(data)) setDepartmentsList(data); });
      })
      .catch(err => {
        setIsLoading(false);
        console.error(err);
        showToast('Có lỗi xảy ra khi tạo khoa.', 'error');
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
          showToast(res.message || 'Điều chuyển nhân sự thành công!', 'success');
          setShowTransferModal(false);
          // Refresh users list
          adminApi.getUsers()
            .then(data => { if (Array.isArray(data)) setUsers(data); });
          // Refresh department details if one is selected
          if (selectedDepartment) {
            handleSelectDepartment(selectedDepartment);
          }
        } else {
          showToast(res.message || 'Lỗi khi điều chuyển.', 'error');
        }
      })
      .catch(err => {
        setIsLoading(false);
        console.error(err);
        showToast(err.response?.data?.message || 'Có lỗi xảy ra khi gọi API điều chuyển.', 'error');
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
          showToast(res.message || 'Lỗi khi ký duyệt tác vụ.', 'error');
        } else {
          showToast(res.message || 'Ký duyệt tác vụ thành công!', 'success');
          setShowSignoffModal(false);
          setSelectedVerificationTask(null);
          // Refresh list
          adminApi.getVerificationTasks()
            .then(data => { if (Array.isArray(data)) setVerificationTasksList(data); });
        }
      })
      .catch(err => {
        setIsLoading(false);
        console.error(err);
        showToast('Có lỗi xảy ra khi ký duyệt.', 'error');
      });
  };

  const loadDashboardData = () => {
    setIsLoading(true);
    fetchStats(selectedPeriod);
    fetchFeeConfig();

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

  
  useEffect(() => {
    loadDashboardData();
    
    if (activeTab === 'users' || activeTab === 'departments') {
      setIsLoading(true);
      adminApi.getUsers()
        .then(data => {
          setUsers(Array.isArray(data) ? data : []);
          setIsLoading(false);
        })
        .catch(err => console.error('Error users:', err));
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
        showToast('Vui lòng chọn ít nhất 1 lý do vi phạm.', 'error');
        return;
      }
      if (!adminPin || adminPin.trim() === '') {
        showToast('Vui lòng nhập mã PIN xác nhận.', 'error');
        return;
      }
    }

    const reasonStr = banReasons.length > 0 ? banReasons.join(', ') : 'Yêu cầu từ Admin';
    const reasonParam = encodeURIComponent(reasonStr);

    adminApi.updateUserStatus(userId, role, newStatus, reasonParam, adminPin, user?.id)
      .then(data => {
        if (data.success === false) {
          showToast(data.message || 'Hành động bị từ chối bởi hệ thống.', 'error');
        } else {
          showToast(data.message || 'Thao tác thành công!', 'success');
          adminApi.getUsers()
            .then(usersData => { if (Array.isArray(usersData)) setUsers(usersData); });
          loadDashboardData();
          setActiveUserForAction(null);
          setBanReasons([]);
          setAdminPin('');
        }
      })
      .catch(err => {
        console.error(err);
        showToast('Lỗi kết nối máy chủ.', 'error');
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
          showToast(res.message || 'Thao tác thành công.', 'success');
        } else {
          showToast(res.message || 'Thao tác thất bại.', 'error');
        }
        adminApi.getProfileRequests()
          .then(data => setProfileRequests(Array.isArray(data) ? data : []));
      })
      .catch(err => {
        console.error(err);
        showToast('Lỗi kết nối máy chủ.', 'error');
      });
  };

  
  const handleWithdrawalAction = (withdrawalId, approve) => {
    const status = approve ? 'APPROVED' : 'REJECTED';
    adminApi.processWithdrawal(withdrawalId, status, user?.id)
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
        setToast({ title: 'Lỗi', message: 'Không thể mở hộp thoại lưu file: ' + err.message, type: 'error' });
      }
      return; 
    }

    setToast({ title: 'Đang xử lý', message: `Đang khởi tạo file ${format}, vui lòng đợi...`, type: 'success' });

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
      doc.text("DANH SÁCH TÀI KHOẢN NGƯỜI DÙNG - LancerPro", 14, 15);
      
      const tableColumn = ["ID", "Tên hiển thị", "Email", "Vai trò", "Trạng thái", "Đăng nhập cuối", "Ngày gia nhập"];
      const tableRows = [];

      usersList.forEach(user => {
        let loginStr = 'Chưa đăng nhập';
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
                <th style="width: 180px;">Tên hiển thị</th>
                <th style="width: 250px;">Email</th>
                <th style="width: 120px;">Vai trò</th>
                <th style="width: 100px;">Trạng thái</th>
                <th style="width: 180px;">Đăng nhập cuối</th>
                <th style="width: 120px;">Ngày gia nhập</th>
              </tr>
            </thead>
            <tbody>`;
      
      usersList.forEach(user => {
        let loginStr = 'Chưa đăng nhập';
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
        setToast({ title: 'Thành công', message: `Đã lưu file vào máy: ${defaultFileName}`, type: 'success' });
      } else if (fallbackMode) {
        const url = URL.createObjectURL(finalBlob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', defaultFileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setToast({ title: 'Thành công', message: `Đã tải xuống file: ${defaultFileName}`, type: 'success' });
      }
    } catch (err) {
      setToast({ title: 'Lỗi', message: 'Không thể lưu nội dung file. Chi tiết: ' + err.message, type: 'error' });
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
      
      {}
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
              {}
              <div 
                onClick={() => setActiveTab('home')}
                className={`relative rounded-2xl p-3 flex items-center gap-3.5 transition-all duration-300 ease-out cursor-pointer group ${
                  activeTab === 'home' 
                    ? 'bg-white border border-slate-200 shadow-md' 
                    : 'bg-transparent border border-transparent hover:bg-slate-100/80 hover:shadow-sm hover:translate-x-1.5'
                }`}
              >
                {activeTab === 'home' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-full shadow-sm"></div>}
                <div className="w-10 h-10 rounded-[14px] bg-blue-500 flex items-center justify-center text-white shadow-sm shrink-0 transition-transform duration-300 group-hover:scale-110 group-active:scale-95">
                  <Home className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className={`font-bold text-[14px] transition-colors ${activeTab === 'home' ? 'text-blue-600' : 'text-slate-800'}`}>Home</p>
                  <p className={`text-[12px] truncate mt-0.5 transition-colors ${activeTab === 'home' ? 'text-blue-500 font-medium' : 'text-slate-500'}`}>Trang chủ trung tâm</p>
                </div>
              </div>

              {}
              <div 
                onClick={() => setActiveTab('dashboard')}
                className={`relative rounded-2xl p-3 flex items-center gap-3.5 transition-all duration-300 ease-out cursor-pointer group ${
                  activeTab === 'dashboard' 
                    ? 'bg-white border border-slate-200 shadow-md' 
                    : 'bg-transparent border border-transparent hover:bg-slate-100/80 hover:shadow-sm hover:translate-x-1.5'
                }`}
              >
                {activeTab === 'dashboard' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-500 rounded-r-full shadow-sm"></div>}
                <div className="w-10 h-10 rounded-[14px] bg-emerald-500 flex items-center justify-center text-white shadow-sm shrink-0 transition-transform duration-300 group-hover:scale-110 group-active:scale-95">
                  <LayoutDashboard className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className={`font-bold text-[14px] transition-colors ${activeTab === 'dashboard' ? 'text-emerald-600' : 'text-slate-800'}`}>Dashboard</p>
                  <p className={`text-[12px] truncate mt-0.5 transition-colors ${activeTab === 'dashboard' ? 'text-emerald-500 font-medium' : 'text-slate-500'}`}>Báo cáo & Thống kê</p>
                </div>
              </div>

              {}
              <div 
                onClick={() => setActiveTab('users')}
                className={`relative rounded-2xl p-3 flex items-center gap-3.5 transition-all duration-300 ease-out cursor-pointer group ${
                  activeTab === 'users' 
                    ? 'bg-white border border-slate-200 shadow-md' 
                    : 'bg-transparent border border-transparent hover:bg-slate-100/80 hover:shadow-sm hover:translate-x-1.5'
                }`}
              >
                {activeTab === 'users' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-rose-500 rounded-r-full shadow-sm"></div>}
                <div className="w-10 h-10 rounded-[14px] bg-rose-500 flex items-center justify-center text-white shadow-sm shrink-0 transition-transform duration-300 group-hover:scale-110 group-active:scale-95">
                  <Users className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className={`font-bold text-[14px] transition-colors ${activeTab === 'users' ? 'text-rose-600' : 'text-slate-800'}`}>Users</p>
                  <p className={`text-[12px] truncate mt-0.5 transition-colors ${activeTab === 'users' ? 'text-rose-500 font-medium' : 'text-slate-500'}`}>Quản lý người dùng</p>
                </div>
              </div>

              {/* Departments Tab */}
              <div 
                onClick={() => setActiveTab('departments')}
                className={`relative rounded-2xl p-3 flex items-center gap-3.5 transition-all duration-300 ease-out cursor-pointer group ${
                  activeTab === 'departments' 
                    ? 'bg-white border border-slate-200 shadow-md' 
                    : 'bg-transparent border border-transparent hover:bg-slate-100/80 hover:shadow-sm hover:translate-x-1.5'
                }`}
              >
                {activeTab === 'departments' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-r-full shadow-sm"></div>}
                <div className="w-10 h-10 rounded-[14px] bg-indigo-500 flex items-center justify-center text-white shadow-sm shrink-0 transition-transform duration-300 group-hover:scale-110 group-active:scale-95">
                  <Sliders className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className={`font-bold text-[14px] transition-colors ${activeTab === 'departments' ? 'text-indigo-600' : 'text-slate-800'}`}>Departments</p>
                  <p className={`text-[12px] truncate mt-0.5 transition-colors ${activeTab === 'departments' ? 'text-indigo-500 font-medium' : 'text-slate-500'}`}>Quản lý khoa/phòng ban</p>
                </div>
              </div>

              {}
              <div 
                onClick={() => setActiveTab('cms')}
                className={`relative rounded-2xl p-3 flex items-center gap-3.5 transition-all duration-300 ease-out cursor-pointer group ${
                  activeTab === 'cms' 
                    ? 'bg-white border border-slate-200 shadow-md' 
                    : 'bg-transparent border border-transparent hover:bg-slate-100/80 hover:shadow-sm hover:translate-x-1.5'
                }`}
              >
                {activeTab === 'cms' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-violet-500 rounded-r-full shadow-sm"></div>}
                <div className="w-10 h-10 rounded-[14px] bg-violet-500 flex items-center justify-center text-white shadow-sm shrink-0 transition-transform duration-300 group-hover:scale-110 group-active:scale-95">
                  <Settings className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className={`font-bold text-[14px] transition-colors ${activeTab === 'cms' ? 'text-violet-600' : 'text-slate-800'}`}>CMS Settings</p>
                  <p className={`text-[12px] truncate mt-0.5 transition-colors ${activeTab === 'cms' ? 'text-violet-500 font-medium' : 'text-slate-500'}`}>Cấu hình & SEO</p>
                </div>
              </div>

              {/* Personal Profile */}
              <div 
                onClick={() => onNavigate && onNavigate('profile')}
                className="relative rounded-2xl p-3 flex items-center gap-3.5 transition-all duration-300 ease-out cursor-pointer group bg-transparent border border-transparent hover:bg-slate-100/80 hover:shadow-sm hover:translate-x-1.5"
              >
                <div className="w-10 h-10 rounded-[14px] bg-sky-500 flex items-center justify-center text-white shadow-sm shrink-0 transition-transform duration-300 group-hover:scale-110 group-active:scale-95">
                  <User className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-[14px] transition-colors text-slate-800 group-hover:text-sky-600">Profile</p>
                  <p className="text-[12px] truncate mt-0.5 text-slate-500 group-hover:text-sky-500 font-medium">Thông tin cá nhân</p>
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

      {}
      <main className="flex-grow flex flex-col min-w-0 bg-slate-50">
        
        {}
        <header className="bg-white border-b border-slate-200 h-20 px-8 flex justify-between items-center shrink-0">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-primary flex items-center gap-3">
              {activeTab === 'home' && <><Home className="w-6 h-6 text-blue-600" /> Hệ thống Quản trị LancerPro</>}
              {activeTab === 'dashboard' && <><Settings className="w-6 h-6 text-blue-600" /> Báo cáo & Thống kê Tổng quan</>}
              {activeTab === 'users' && <><Users className="w-6 h-6 text-indigo-600" /> User Account Control</>}
              {activeTab === 'departments' && <><Sliders className="w-6 h-6 text-indigo-600" /> Quản lý Khoa / Phòng Ban</>}
              {activeTab === 'cms' && <><Settings className="w-6 h-6 text-cyan-600" /> SEO & Policy Config</>}
            </h1>
            <p className="text-body-sm text-muted mt-1 ml-9">
              {activeTab === 'home' && 'Tổng quan dịch vụ và lối tắt truy cập nhanh vào các phân hệ nghiệp vụ.'}
              {activeTab === 'dashboard' && 'High-precision tracking of system registrations, escrow transaction distributions, and commissions.'}
              {activeTab === 'users' && 'Lock, ban, or unlock system user accounts.'}
              {activeTab === 'departments' && 'Quản lý các khoa chuyên môn, giám sát phiên làm việc và nhật ký thao tác.'}
              {activeTab === 'cms' && 'Manage policy pages, SEO metadata, and system flags.'}
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
            
            {/* Admin Profile Widget */}
            <div className="profile-menu-wrapper pl-4 border-l border-slate-200">
              <div 
                className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-[13px] font-bold text-slate-800 leading-tight">{user?.displayName || user?.email}</p>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mt-0.5">{user?.role}</p>
                </div>
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="w-9 h-9 rounded-full object-cover border border-slate-200" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-sm border border-blue-200">
                    {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'A'}
                  </div>
                )}
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
                      if (onNavigate) onNavigate("home");
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
                    <LogOut className="w-4 h-4" /> Đăng xuất
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
                  <h2 className="text-3xl font-bold font-display mb-2">Hệ thống Quản trị LancerPro</h2>
                  <p className="text-teal-50 mb-8 max-w-lg text-sm">Trung tâm điều hành nền tảng việc làm tự do. Vui lòng chọn phân hệ nghiệp vụ bên dưới để bắt đầu công việc hàng ngày.</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                      <p className="text-3xl font-bold">{stats.totalUsers}</p>
                      <p className="text-[11px] font-bold text-teal-100 uppercase tracking-wider mt-1">Người dùng</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                      <p className="text-3xl font-bold">{stats.activeProjects}</p>
                      <p className="text-[11px] font-bold text-teal-100 uppercase tracking-wider mt-1">Dự án in-progress</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                      <p className="text-3xl font-bold">{pendingProjects.length}</p>
                      <p className="text-[11px] font-bold text-teal-100 uppercase tracking-wider mt-1">Dự án chờ duyệt</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                      <p className="text-3xl font-bold">{stats.pendingWithdrawals}</p>
                      <p className="text-[11px] font-bold text-teal-100 uppercase tracking-wider mt-1">Yêu cầu rút tiền</p>
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
                  <h3 className="text-xl font-bold">Dịch vụ Quản lý Nghiệp vụ</h3>
                  <span className="text-sm font-normal text-slate-500 ml-2">Chọn nghiệp vụ để bắt đầu công việc hàng ngày</span>
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
                      <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider">HOẠT ĐỘNG</span>
                    </div>
                    <h4 className="text-lg font-bold text-slate-800 mb-2">Báo cáo & Thống kê</h4>
                    <p className="text-sm text-slate-500 mb-6 line-clamp-2">Xem biểu đồ tăng trưởng, doanh thu GMV, tỷ lệ chuyển đổi và các chỉ số tài chính.</p>
                    <p className="text-xs font-bold text-emerald-600">Dữ liệu theo thời gian thực</p>
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
                      <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider">HOẠT ĐỘNG</span>
                    </div>
                    <h4 className="text-lg font-bold text-slate-800 mb-2">Quản lý Người dùng</h4>
                    <p className="text-sm text-slate-500 mb-6 line-clamp-2">Khóa/mở khóa tài khoản, ban vĩnh viễn, xem lịch sử truy cập của hệ thống.</p>
                    <p className="text-xs font-bold text-rose-600">{stats.totalUsers} người dùng</p>
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
                      <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider">HOẠT ĐỘNG</span>
                    </div>
                    <h4 className="text-lg font-bold text-slate-800 mb-2">Cấu hình & SEO</h4>
                    <p className="text-sm text-slate-500 mb-6 line-clamp-2">Quản lý danh mục kỹ năng, cấu hình nền tảng, tối ưu SEO và quản lý khiếu nại.</p>
                    <p className="text-xs font-bold text-violet-600">Truy cập cấu hình</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {}
          {activeTab === 'dashboard' && (
            <>
              {}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
                
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-l-[4px] border-l-blue-500 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                    <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-0.5">
                      <ArrowUpRight className="w-3 h-3" /> +{stats.usersGrowthPercent}%
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-2xl font-extrabold text-slate-800 font-mono">{stats.totalUsers}</p>
                    <p className="text-[12px] font-semibold text-slate-500 mt-1">Tổng người dùng</p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-l-[4px] border-l-emerald-500 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-0.5">
                      <ArrowUpRight className="w-3 h-3" /> +{stats.projectsGrowthPercent}%
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-2xl font-extrabold text-slate-800 font-mono">{stats.activeProjects}</p>
                    <p className="text-[12px] font-semibold text-slate-500 mt-1">Dự án In Progress</p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-l-[4px] border-l-cyan-500 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center">
                      <BadgeDollarSign className="w-5 h-5" />
                    </div>
                    <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-0.5">
                      <ArrowUpRight className="w-3 h-3" /> +{stats.revenueGrowthPercent}%
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-2xl font-extrabold text-slate-800 font-mono">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.totalRevenue)}
                    </p>
                    <p className="text-[12px] font-semibold text-slate-500 mt-1">Doanh thu tháng (GMV)</p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-l-[4px] border-l-violet-500 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-0.5">
                      <ArrowDownRight className="w-3 h-3" /> -2%
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-2xl font-extrabold text-slate-800 font-mono">{stats.activeDisputes}</p>
                    <p className="text-[12px] font-semibold text-slate-500 mt-1">Tranh chấp đang mở</p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-l-[4px] border-l-amber-500 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                      <RefreshCw className="w-5 h-5" />
                    </div>
                    <span className="bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold">
                      Chờ duyệt
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-2xl font-extrabold text-slate-800 font-mono">{stats.pendingWithdrawals}</p>
                    <p className="text-[12px] font-semibold text-slate-500 mt-1">Yêu cầu rút tiền</p>
                  </div>
                </div>
              </div>

              {}
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
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-body-sm px-5 py-2.5 rounded-xl transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 shadow-md shadow-blue-600/10 hover:shadow-blue-600/30 flex items-center gap-2"
                  >
                    {isUpdatingFee ? 'Đang cập nhật...' : 'Áp Dụng Config'}
                  </button>
                </div>
              </div>

              {}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-primary text-body-md flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-500" /> Biểu đồ Tăng Trưởng Tài Khoản Mới
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-1">So sánh hiệu suất đăng ký thực tế với chu kỳ trước</p>
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

                {}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-primary text-body-md flex items-center gap-2">
                        <BadgeDollarSign className="w-5 h-5 text-emerald-500" /> Doanh Thu Theo Quý
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-1">Phí thu được tích hợp từ DB</p>
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
                    <span className="text-muted">Doanh thu cao nhất:</span>
                    <span className="font-extrabold text-emerald-600">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Math.max(...revenueTrend.map(d => d.value || 0)))}
                    </span>
                  </div>
                </div>
              </div>

              {}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                  <h3 className="font-bold text-primary text-body-md flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-500" /> Nhật Ký Hoạt Động Hệ Thống Gần Nhất (Audit)
                  </h3>
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

          {}
          {activeTab === 'users' && (() => {
            
            const filteredUsers = users.filter(user => {
              if (user.role === 'FREELANCER') return false;

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
                    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000); 
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

              let matchesRole = false;
              if (selectedRoleTab === 'ALL') {
                if (filterEmployer && user.role === 'EMPLOYER') matchesRole = true;
                if (filterManager && user.role === 'MANAGER') matchesRole = true;
                if (filterStaff && user.role === 'STAFF') matchesRole = true;
              } else {
                if (user.role === selectedRoleTab) matchesRole = true;
              }

              return matchesSearch && matchesStatus && matchesTime && matchesRole;
            });

            
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
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <h3 className="font-bold text-primary text-lg">Danh sách Tài khoản Người dùng</h3>
                      <p className="text-[12px] text-slate-400 mt-1">Kết quả khớp điều kiện: <span className="font-bold text-blue-600">{filteredUsers.length}</span> tài khoản được quản lý</p>
                    </div>

                    <div className="radio-inputs">
                      {[
                        { key: 'ALL', label: 'Tất cả' },
                        { key: 'EMPLOYER', label: 'Employer' },
                        { key: 'MANAGER', label: 'Manager' },
                        { key: 'STAFF', label: 'Staff' }
                      ].map(tab => (
                        <label key={tab.key} className="radio">
                          <input 
                            type="radio" 
                            name="adminRoleTab" 
                            checked={selectedRoleTab === tab.key}
                            onChange={() => setSelectedRoleTab(tab.key)}
                          />
                          <span className="name">{tab.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* xuất báo cáo, button bên trái */}
                    <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">

                      <div className="relative flex-grow md:flex-grow-0 md:w-80">
                        <div className="h-[38px] bg-slate-50 border border-slate-200 rounded-xl px-4 flex items-center gap-2.5 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all shadow-sm">
                          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <input 
                            type="text" 
                            name="adminSearchQuery"
                            autoComplete="off"
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
                        {/* Suggestion block removed when no matches exist */}
                      </div>

                      {/* Nút xuất báo cáo Excel/PDF (bên trái) */}
                      <div className="flex items-center gap-2">
                        <div className="fancy-download-btn excel" data-tooltip="Tải Excel" onClick={() => handleDownloadUsers('EXCEL', filteredUsers)}>
                          <div className="button-wrapper">
                            <div className="text">Excel</div>
                            <span className="icon">
                              <Download className="w-4 h-4" />
                            </span>
                          </div>
                        </div>

                        <div className="fancy-download-btn pdf" data-tooltip="Xuất PDF" onClick={() => handleDownloadUsers('PDF', filteredUsers)}>
                          <div className="button-wrapper">
                            <div className="text">PDF</div>
                            <span className="icon">
                              <FileText className="w-4 h-4" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Nhóm bên phải: Stack chứa Tạo tài khoản và Bộ lọc nâng cao */}
                    <div className="flex flex-col gap-2.5 w-full sm:w-[200px] md:w-[200px]">
                      {/* Nút Tạo Tài Khoản */}
                      <button 
                        onClick={() => setShowCreateModal(true)}
                        className="h-[38px] w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-body-sm px-4 rounded-xl shadow-md transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 hover:shadow-blue-600/30 flex items-center justify-center gap-2"
                      >
                        + Tạo Tài Khoản
                      </button>

                      {/* Bộ lọc nâng cao */}
                      <div className="relative filter-wrapper w-full">
                        <div className="filter-main">
                          Bộ lọc nâng cao
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
                                          <label className="ios-checkbox emerald" title="Đang trực tuyến">
                                            <input 
                                              type="checkbox"
                                              checked={activeOnlineChecked}
                                              onChange={e => setActiveOnlineChecked(e.target.checked)}
                                            />
                                            <div className="checkbox-wrapper">
                                              <div className="checkbox-bg" />
                                              <svg fill="none" viewBox="0 0 24 24" className="checkbox-icon">
                                                <path strokeLinejoin="round" strokeLinecap="round" strokeWidth={3} stroke="currentColor" d="M4 12L10 18L20 6" className="check-path" />
                                              </svg>
                                            </div>
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-1" />
                                            <span className="text-[11px] font-bold text-slate-600 select-none">Đang trực tuyến (Online)</span>
                                          </label>
                                          
                                          <label className="ios-checkbox blue" title="Ngoại tuyến">
                                            <input 
                                              type="checkbox"
                                              checked={activeOfflineChecked}
                                              onChange={e => setActiveOfflineChecked(e.target.checked)}
                                            />
                                            <div className="checkbox-wrapper">
                                              <div className="checkbox-bg" />
                                              <svg fill="none" viewBox="0 0 24 24" className="checkbox-icon">
                                                <path strokeLinejoin="round" strokeLinecap="round" strokeWidth={3} stroke="currentColor" d="M4 12L10 18L20 6" className="check-path" />
                                              </svg>
                                            </div>
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 ml-1" />
                                            <span className="text-[11px] font-bold text-slate-600 select-none">Ngoại tuyến (Offline)</span>
                                          </label>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {}
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
                                <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider block">Chọn khoảng ngày</span>
                                <div className={`p-4 rounded-2xl border transition-all duration-300 ${
                                  userTimeFilterType === 'CUSTOM'
                                    ? 'bg-blue-50/20 border-blue-200'
                                    : 'bg-slate-50/50 border-slate-200 opacity-60 pointer-events-none'
                                }`}>
                                  {userTimeFilterType === 'CUSTOM' ? (
                                    <div className="space-y-3 clip-down-animation">
                                      <div className="flex flex-col gap-1">
                                        <span className="text-[11px] font-bold text-slate-400">TỪ NGÀY</span>
                                        <input 
                                          type="date" 
                                          value={userTimeStart}
                                          onChange={e => setUserTimeStart(e.target.value)}
                                          className="fancy-date-input"
                                        />
                                      </div>
                                      <div className="flex flex-col gap-1">
                                        <span className="text-[11px] font-bold text-slate-400">ĐẾN NGÀY</span>
                                        <input 
                                          type="date" 
                                          value={userTimeEnd}
                                          onChange={e => setUserTimeEnd(e.target.value)}
                                          className="fancy-date-input"
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="space-y-3">
                                      <div className="flex flex-col gap-1">
                                        <span className="text-[11px] font-bold text-slate-400">TỪ NGÀY</span>
                                        <div className="fancy-date-input text-slate-300 flex items-center justify-between">
                                          <span>mm/dd/yyyy</span>
                                        </div>
                                      </div>
                                      <div className="flex flex-col gap-1">
                                        <span className="text-[11px] font-bold text-slate-400">ĐẾN NGÀY</span>
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
                                <label className="ios-checkbox blue" title="Tài khoản Doanh nghiệp">
                                  <input 
                                    type="checkbox" 
                                    checked={filterEmployer}
                                    onChange={e => setFilterEmployer(e.target.checked)} 
                                  />
                                  <div className="checkbox-wrapper">
                                    <div className="checkbox-bg" />
                                    <svg fill="none" viewBox="0 0 24 24" className="checkbox-icon">
                                      <path strokeLinejoin="round" strokeLinecap="round" strokeWidth={3} stroke="currentColor" d="M4 12L10 18L20 6" className="check-path" />
                                    </svg>
                                  </div>
                                  <span className="text-[12px] font-bold text-slate-600 ml-1">Employer</span>
                                </label>

                                <label className="ios-checkbox emerald" title="Tài khoản Manager">
                                  <input 
                                    type="checkbox" 
                                    checked={filterManager}
                                    onChange={e => setFilterManager(e.target.checked)} 
                                  />
                                  <div className="checkbox-wrapper">
                                    <div className="checkbox-bg" />
                                    <svg fill="none" viewBox="0 0 24 24" className="checkbox-icon">
                                      <path strokeLinejoin="round" strokeLinecap="round" strokeWidth={3} stroke="currentColor" d="M4 12L10 18L20 6" className="check-path" />
                                    </svg>
                                  </div>
                                  <span className="text-[12px] font-bold text-slate-600 ml-1">Manager</span>
                                </label>

                                <label className="ios-checkbox blue" title="Tài khoản Staff">
                                  <input 
                                    type="checkbox" 
                                    checked={filterStaff}
                                    onChange={e => setFilterStaff(e.target.checked)} 
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
                                }}
                                className="px-4 py-2 hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-body-sm font-bold transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 shadow-sm hover:shadow-md"
                              >
                                Đặt lại bộ lọc
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
                          <th className="px-3 py-3.5 w-[110px]">Tên hiển thị</th>
                          <th className="px-3 py-3.5 w-[150px]">Email</th>
                          <th className="px-3 py-3.5 w-[75px]">Vai trò</th>
                          <th className="px-3 py-3.5 w-[85px]">Trạng thái</th>
                          <th className="px-3 py-3.5 w-[135px]">Đăng nhập cuối</th>
                          <th className="px-3 py-3.5 w-[100px]">Ngày gia nhập</th>
                          <th className="px-3 py-3.5 text-center w-[175px]">Hành động bảo mật</th>
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
                              <td className="px-3 py-3 pl-5 text-slate-500 font-mono font-bold whitespace-nowrap w-[50px]">
                                #{user.id}
                              </td>
                              <td className="px-3 py-3 font-bold text-primary truncate whitespace-nowrap w-[110px]" title={user.name}>{user.name}</td>
                              <td className="px-3 py-3 text-slate-600 truncate whitespace-nowrap w-[150px]" title={user.email}>{user.email}</td>
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
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                  user.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                  user.status === 'LOCKED' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                  'bg-rose-50 text-rose-700 border border-rose-100'
                                }`}>
                                  {user.status}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-slate-600 font-mono text-[11px] whitespace-nowrap w-[135px]">
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
                              <td className="px-3 py-3 text-center whitespace-nowrap w-[175px]">
                                <div className="flex justify-center gap-1">
                                  {user.isProtectedAdmin ? (
                                    <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded-xl font-bold text-[11px] flex items-center gap-1">
                                      <ShieldAlert className="w-3 h-3" /> Được bảo vệ
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
                                      <Unlock className="w-3.5 h-3.5" /> Kích hoạt
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
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-all duration-200 active:scale-95 hover:shadow-md shadow-sm flex items-center justify-center"
                              title="Trang đầu (<<)"
                            >
                              <ChevronsLeft className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                              disabled={currentPage === 1}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-all duration-200 active:scale-95 hover:shadow-md shadow-sm flex items-center justify-center"
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
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-all duration-200 active:scale-95 hover:shadow-md shadow-sm flex items-center justify-center"
                              title="Trang sau (>)"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setCurrentPage(totalPages)}
                              disabled={currentPage === totalPages}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-all duration-200 active:scale-95 hover:shadow-md shadow-sm flex items-center justify-center"
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

          {}
          {activeTab === 'cms' && (
            <div className="space-y-6">
              {}
              <div className="flex flex-wrap gap-2 pb-4 border-b border-slate-200">
                {[
                  { id: 'seo', label: 'Cấu hình Hệ thống' },
                  { id: 'categories', label: 'Danh mục Việc làm', count: jobCategories.length },
                  { id: 'kyc', label: 'Duyệt KYC', count: kycRequests.length },
                  { id: 'profileRequests', label: 'Duyệt Profile', count: profileRequests.length },
                  { id: 'disputes', label: 'Tranh chấp', count: disputes.length },
                  { id: 'reports', label: 'Báo cáo vi phạm', count: reports.length },
                  { id: 'articles', label: 'Bài viết CMS', count: articles.length },
                  { id: 'tickets', label: 'Hỗ trợ Tickets', count: tickets.length }
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
                      <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-body-sm px-5 py-2.5 rounded-xl shadow-md transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 hover:shadow-blue-600/30">Lưu cấu hình SEO</button>
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
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-body-sm px-5 py-2.5 rounded-xl shadow-md transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 hover:shadow-blue-600/30"
                      >
                        Áp dụng phí mới
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeCmsTab === 'profileRequests' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h3 className="font-bold text-primary text-body-md mb-2">Duyệt thay đổi thông tin hồ sơ Employer</h3>
                    <p className="text-body-sm text-slate-500">Các yêu cầu cập nhật thông tin doanh nghiệp và tài khoản ngân hàng từ phía Employer cần được Admin xem xét và phê duyệt.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-5">
                    {profileRequests.length === 0 ? (
                      <div className="bg-white p-12 rounded-2xl text-center border border-slate-200 shadow-sm">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                        <h4 className="font-bold text-primary text-lg">Hoàn tất!</h4>
                        <p className="text-slate-500 mt-2">Không có yêu cầu cập nhật hồ sơ nào đang chờ duyệt.</p>
                      </div>
                    ) : (
                      profileRequests.map((req) => (
                        <div key={req.requestId} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <div>
                              <span className="bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded text-[11px] font-bold">EMPLOYER #{req.employer.employerId}</span>
                              <span className="text-[12px] text-slate-450 ml-2 font-medium">Email: {req.employer.email}</span>
                              <span className="text-[11px] text-slate-400 ml-2 font-mono">Yêu cầu lúc: {new Date(req.createdAt).toLocaleString('vi-VN')}</span>
                            </div>
                            <span className="bg-amber-50 text-amber-700 border border-amber-250 px-2.5 py-0.5 rounded text-[10px] font-extrabold">CHỜ DUYỆT</span>
                          </div>
                          
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-body-sm">
                            <div className="space-y-1.5">
                              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Thông tin hiện tại</p>
                              <div className="bg-slate-50 p-4 rounded-2xl space-y-1.5 border border-slate-100">
                                <p><strong>Tên hiển thị:</strong> {req.employer.displayName}</p>
                                <p><strong>Họ tên:</strong> {req.employer.fullName || 'Chưa cập nhật'}</p>
                                <p><strong>Số điện thoại:</strong> {req.employer.phone || 'Chưa cập nhật'}</p>
                                <p><strong>Tên công ty:</strong> {req.employer.companyName || 'Chưa cập nhật'}</p>
                                <p><strong>Ngành nghề:</strong> {req.employer.industry || 'Chưa cập nhật'}</p>
                                <p><strong>Quy mô:</strong> {req.employer.companySize || 'Chưa cập nhật'}</p>
                                <p><strong>Website:</strong> {req.employer.website || 'Chưa cập nhật'}</p>
                                <p><strong>Địa chỉ:</strong> {req.employer.address ? `${req.employer.address}, ${req.employer.city || ''}, ${req.employer.country || ''}` : 'Chưa cập nhật'}</p>
                                <p><strong>Mô tả:</strong> {req.employer.companyDescription || 'Chưa cập nhật'}</p>
                              </div>
                            </div>
                            
                            <div className="space-y-1.5">
                              <p className="text-xs text-indigo-600 uppercase font-bold tracking-wider">Thông tin đề xuất thay đổi</p>
                              <div className="bg-indigo-50/20 border border-indigo-100/70 p-4 rounded-2xl space-y-1.5">
                                <p><strong>Tên hiển thị:</strong> <span className={req.displayName !== req.employer.displayName ? "text-indigo-650 font-bold bg-indigo-50 px-1.5 py-0.5 rounded" : ""}>{req.displayName}</span></p>
                                <p><strong>Họ tên:</strong> <span className={req.fullName !== req.employer.fullName ? "text-indigo-655 font-bold bg-indigo-50 px-1.5 py-0.5 rounded" : ""}>{req.fullName || 'Chưa cập nhật'}</span></p>
                                <p><strong>Số điện thoại:</strong> <span className={req.phone !== req.employer.phone ? "text-indigo-655 font-bold bg-indigo-50 px-1.5 py-0.5 rounded" : ""}>{req.phone || 'Chưa cập nhật'}</span></p>
                                <p><strong>Tên công ty:</strong> <span className={req.companyName !== req.employer.companyName ? "text-indigo-655 font-bold bg-indigo-50 px-1.5 py-0.5 rounded" : ""}>{req.companyName || 'Chưa cập nhật'}</span></p>
                                <p><strong>Ngành nghề:</strong> <span className={req.industry !== req.employer.industry ? "text-indigo-655 font-bold bg-indigo-50 px-1.5 py-0.5 rounded" : ""}>{req.industry || 'Chưa cập nhật'}</span></p>
                                <p><strong>Quy mô:</strong> <span className={req.companySize !== req.employer.companySize ? "text-indigo-655 font-bold bg-indigo-50 px-1.5 py-0.5 rounded" : ""}>{req.companySize || 'Chưa cập nhật'}</span></p>
                                <p><strong>Website:</strong> <span className={req.website !== req.employer.website ? "text-indigo-655 font-bold bg-indigo-50 px-1.5 py-0.5 rounded" : ""}>{req.website || 'Chưa cập nhật'}</span></p>
                                <p><strong>Địa chỉ:</strong> <span className={(req.address !== req.employer.address || req.city !== req.employer.city || req.country !== req.employer.country) ? "text-indigo-655 font-bold bg-indigo-50 px-1.5 py-0.5 rounded" : ""}>{req.address ? `${req.address}, ${req.city || ''}, ${req.country || ''}` : 'Chưa cập nhật'}</span></p>
                                <p><strong>Mô tả:</strong> <span className={req.companyDescription !== req.employer.companyDescription ? "text-indigo-655 font-bold bg-indigo-50 px-1.5 py-0.5 rounded block whitespace-pre-line" : ""}>{req.companyDescription || 'Chưa cập nhật'}</span></p>
                                <p className="pt-2 border-t border-indigo-100/60 font-semibold text-slate-700">Thông tin Ngân hàng:</p>
                                <p><strong>Ngân hàng:</strong> <span className="text-slate-800 font-bold bg-slate-100 px-1.5 py-0.5 rounded">{req.bankName || 'Chưa cập nhật'}</span></p>
                                <p><strong>Số tài khoản:</strong> <span className="text-slate-800 font-bold bg-slate-100 px-1.5 py-0.5 rounded">{req.accountNumber || 'Chưa cập nhật'}</span></p>
                                <p><strong>Chủ tài khoản:</strong> <span className="text-slate-800 font-bold bg-slate-100 px-1.5 py-0.5 rounded">{req.accountHolder || 'Chưa cập nhật'}</span></p>
                                <p><strong>Chi nhánh:</strong> <span className="text-slate-800 font-bold bg-slate-100 px-1.5 py-0.5 rounded">{req.branch || 'Chưa cập nhật'}</span></p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <button
                              onClick={() => handleProfileRequestAction(req.requestId, true)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-body-sm transition-all shadow-sm hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-1.5"
                            >
                              Phê duyệt
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Nhập lý do từ chối yêu cầu thay đổi profile này:');
                                if (reason !== null) handleProfileRequestAction(req.requestId, false, reason);
                              }}
                              className="bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 px-5 py-2.5 rounded-xl font-bold text-body-sm transition-all shadow-sm hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-1.5"
                            >
                              Từ chối
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
                        return <p className="text-center text-slate-400 py-8">Chưa có dữ liệu trong Database cho mục này.</p>;
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

          {/* Departments Management Panel */}
          {activeTab === 'departments' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              
              {/* If no department is selected, display list of departments */}
              {!selectedDepartment ? (
                <div className="space-y-6">
                  {/* Summary Bar */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="font-bold text-primary text-[18px]">Danh Sách Khoa / Phòng Ban</h3>
                      <p className="text-body-sm text-slate-500 mt-1">Danh sách phòng ban trực thuộc hệ thống. Mỗi phòng ban hỗ trợ tối đa 5 Managers và bắt buộc có tối thiểu 1 Manager & 1 Staff.</p>
                    </div>
                  </div>

                  {/* Grid of Department cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {departmentsList.map(dept => {
                      // Dynamically calculate members
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
                                {dept.description || 'Chưa có mô tả chi tiết cho khoa này.'}
                              </p>
                            </div>

                            {/* Warnings */}
                            <div className="space-y-1.5 pt-2">
                              {managersCount === 1 && (
                                <div className="flex items-center gap-1.5 text-[11px] text-amber-600 bg-amber-50 px-2 py-1 rounded-lg font-semibold">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  <span>Cảnh báo: Chỉ còn 1 Manager!</span>
                                </div>
                              )}
                              {staffCount === 1 && (
                                <div className="flex items-center gap-1.5 text-[11px] text-amber-600 bg-amber-50 px-2 py-1 rounded-lg font-semibold">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  <span>Cảnh báo: Chỉ còn 1 Staff!</span>
                                </div>
                              )}
                              {managersCount === 0 && (
                                <div className="flex items-center gap-1.5 text-[11px] text-rose-600 bg-rose-50 px-2 py-1 rounded-lg font-semibold animate-pulse">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  <span>Lỗi: Thiếu Manager! (Cần tối thiểu 1)</span>
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
                              Xem chi tiết <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* LIÊN KẾT KIỂM CHỨNG LIÊN KHOA (CROSS-DEPARTMENT VERIFICATION) */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 mt-8">
                    <div>
                      <h3 className="font-bold text-primary text-[18px] flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-indigo-650" /> Liên Kết Kiểm Chứng Liên Khoa
                      </h3>
                      <p className="text-body-sm text-slate-500 mt-1">
                        Quy trình phê duyệt liên kết giữa các khoa chuyên môn đối với các giao dịch tài chính và yêu cầu nhạy cảm.
                      </p>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider">
                            <th className="p-4">Tác Vụ</th>
                            <th className="p-4">Loại Tác Vụ</th>
                            <th className="p-4">Trạng Thái</th>
                            <th className="p-4">Tiến Độ Ký Duyệt</th>
                            <th className="p-4 text-center">Hành Động</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {verificationTasksList.length === 0 ? (
                            <tr>
                              <td colSpan="5" className="text-center text-slate-400 py-8 text-body-sm">
                                Không có tác vụ kiểm chứng liên khoa nào đang chờ duyệt.
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
                                    <div className="text-[11px] text-slate-500 font-mono mt-1">ID Tác vụ: #{task.taskId} | Ref ID: #{task.referenceId}</div>
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
                                      {task.status === 'APPROVED' ? 'Đã thông qua' :
                                       task.status === 'REJECTED' ? 'Bị từ chối' : 'Đang xử lý'}
                                    </span>
                                  </td>
                                  <td className="p-4">
                                    <div className="flex flex-wrap gap-2.5">
                                      {reqDepts.map(dept => {
                                        const signoff = task.signoffs?.find(s => s.departmentCode === dept);
                                        let badgeColor = 'bg-slate-50 text-slate-500 border border-slate-200';
                                        let icon = <Clock className="w-3.5 h-3.5 text-slate-400" />;
                                        let statusText = 'Chờ duyệt';
                                        
                                        if (signoff) {
                                          if (signoff.status === 'APPROVED') {
                                            badgeColor = 'bg-emerald-50 text-emerald-700 border border-emerald-100';
                                            icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
                                            statusText = `Duyệt bởi ${signoff.verifierEmail}`;
                                          } else {
                                            badgeColor = 'bg-rose-50 text-rose-700 border border-rose-100';
                                            icon = <XCircle className="w-3.5 h-3.5 text-rose-600" />;
                                            statusText = `Từ chối bởi ${signoff.verifierEmail}`;
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
                                        Ký duyệt
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
                /* Detail View of selected Department */
                <div className="space-y-6">
                  {/* Back Navigation Bar */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => handleSelectDepartment(null)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-xl transition-all duration-200 active:scale-95"
                        title="Quay lại danh sách"
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
                        <p className="text-body-sm text-slate-500 mt-1">{selectedDepartment.description || 'Không có mô tả.'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleSelectDepartment(selectedDepartment)}
                        className="bg-white border border-slate-200 text-slate-650 hover:bg-slate-50 p-2.5 rounded-xl text-body-sm font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                      >
                        <RefreshCw className="w-4 h-4" /> Làm mới dữ liệu
                      </button>
                    </div>
                  </div>

                  {/* 3-Column Layout: Members, Sessions/Logs Toggle, Transfer History */}
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    
                    {/* Column 1: Members */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col min-h-[400px]">
                      <h4 className="font-bold text-primary text-body-md border-b border-slate-100 pb-3 flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-650" /> Thành Viên Khoa ({users.filter(u => u.departmentId === selectedDepartment.departmentId).length})
                      </h4>
                      <div className="divide-y divide-slate-100 overflow-y-auto flex-grow max-h-[500px] mt-4 pr-1">
                        {users.filter(u => u.departmentId === selectedDepartment.departmentId).length === 0 ? (
                          <p className="text-center text-slate-400 py-12 text-body-sm">Khoa này chưa có Manager hay Staff nào.</p>
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
                                <span className="text-[10px] text-slate-400 whitespace-nowrap">Gia nhập: {member.joined || 'N/A'}</span>
                                <button
                                  onClick={() => handleOpenTransferModal(member)}
                                  className="text-indigo-600 hover:text-white hover:bg-indigo-600 text-[11px] font-bold border border-indigo-200 hover:border-indigo-600 px-2.5 py-1 rounded-lg transition-all active:scale-95 flex items-center gap-1 bg-indigo-50/50 shadow-sm"
                                >
                                  <RefreshCw className="w-3 h-3" /> Điều chuyển
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Column 2: Toggleable Sessions & Logs */}
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
                            Phiên Làm Việc ({departmentSessions.length})
                          </button>
                          <button
                            onClick={() => setDeptDetailTab('logs')}
                            className={`px-3 py-1 rounded-xl text-body-sm font-bold transition-all ${
                              deptDetailTab === 'logs' 
                                ? 'bg-amber-50 text-amber-700 border border-amber-100 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            Nhật Ký Thao Tác ({departmentLogs.length})
                          </button>
                        </div>
                      </div>

                      <div className="divide-y divide-slate-100 overflow-y-auto flex-grow max-h-[500px] mt-4 pr-1">
                        {deptDetailTab === 'sessions' ? (
                          departmentSessions.length === 0 ? (
                            <p className="text-center text-slate-400 py-12 text-body-sm">Chưa có phiên làm việc nào được ghi nhận.</p>
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
                                  <div>Bắt đầu: {new Date(session.loginAt).toLocaleString('vi-VN')}</div>
                                  {session.logoutAt && <div>Kết thúc: {new Date(session.logoutAt).toLocaleString('vi-VN')}</div>}
                                </div>
                              </div>
                            ))
                          )
                        ) : (
                          departmentLogs.length === 0 ? (
                            <p className="text-center text-slate-400 py-12 text-body-sm">Chưa có nhật ký hoạt động nào.</p>
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

                    {/* Column 3: Transfer History */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col min-h-[400px]">
                      <h4 className="font-bold text-primary text-body-md border-b border-slate-100 pb-3 flex items-center gap-2">
                        <History className="w-5 h-5 text-indigo-650" /> Lịch Sử Điều Chuyển ({departmentTransfers.length})
                      </h4>
                      <div className="divide-y divide-slate-100 overflow-y-auto flex-grow max-h-[500px] mt-4 pr-1">
                        {departmentTransfers.length === 0 ? (
                          <p className="text-center text-slate-400 py-12 text-body-sm">Chưa có lịch sử điều chuyển nào.</p>
                        ) : (
                          departmentTransfers.map(transfer => {
                            const isIncoming = transfer.toDepartment.departmentId === selectedDepartment.departmentId;
                            return (
                              <div key={transfer.transferId} className="py-3.5 space-y-1.5">
                                <div className="flex justify-between items-start gap-4">
                                  <div className="min-w-0">
                                    <span className="font-bold text-slate-800 text-[12.5px] block truncate">{transfer.userDisplayName || 'Không rõ tên'}</span>
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
                                    {isIncoming ? 'Nhận vào' : 'Chuyển đi'}
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
            <h4 className="font-bold text-primary text-lg">Chi Tiết Hoạt Động Nhật Ký</h4>
            <button 
              onClick={() => setSelectedActivity(null)}
              className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-200 transition-all duration-200 hover:rotate-90 active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Thời Gian</span>
              <span className="text-body-md font-medium text-slate-800">{selectedActivity?.timestamp}</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Nguồn Hoạt Động (Actor)</span>
              <span className="text-body-md font-bold text-blue-600">{selectedActivity?.source}</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Chi Tiết Nghiệp Vụ</span>
              <span className="text-body-md text-slate-600 block bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                {selectedActivity?.detail}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Trạng Thế Hệ Thống</span>
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
                  Xác nhận cập nhật trạng thái hoạt động cho nhân sự:<br/>
                  <span className="font-bold text-slate-800">{activeUserForAction?.name}</span> ({activeUserForAction?.email} - <span className="text-indigo-600 font-bold">{activeUserForAction?.role}</span>).
                </>
              ) : (
                <>
                  Xác nhận thay đổi bảo mật cho tài khoản:<br/>
                  <span className="font-bold text-slate-800">{activeUserForAction?.name}</span> ({activeUserForAction?.email}).
                </>
              )}
            </p>
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase block mb-2">
                {activeUserForAction?.role === 'MANAGER' || activeUserForAction?.role === 'STAFF' ? 'CHỌN LÝ DO HÀNH CHÍNH (BẮT BUỘC)' : 'CHỌN LÝ DO BẢO MẬT (BẮT BUỘC)'}
              </label>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  if (activeUserForAction?.role === 'MANAGER' || activeUserForAction?.role === 'STAFF') {
                    if (actionType === 'lock') {
                      return [
                        "Tạm ngưng công tác / Nghỉ phép dài hạn",
                        "Điều chuyển công tác / Thay đổi nhiệm vụ",
                        "Yêu cầu bảo mật / Kiểm tra tài khoản",
                        "Tạm khóa quyền truy cập",
                        "Khác"
                      ];
                    } else {
                      return [
                        "Nghỉ việc / Chấm dứt hợp đồng lao động",
                        "Thu hồi vĩnh viễn quyền truy cập",
                        "Thay đổi nhân sự phòng ban",
                        "Khác"
                      ];
                    }
                  } else {
                    return [
                      "Gian lận thanh toán",
                      "Spam tin nhắn / dự án",
                      "Đăng nội dung phản cảm",
                      "Lừa đảo chiếm đoạt tài sản",
                      "Vi phạm điều khoản dịch vụ",
                      "Khác"
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
              <label className="text-[11px] font-bold text-slate-500 uppercase block mb-2">MÃ PIN XÁC NHẬN CỦA ADMIN</label>
              <input 
                type="text" 
                style={{ WebkitTextSecurity: 'disc' }}
                autoComplete="new-password"
                placeholder="Nhập mã PIN gồm 6 số" 
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

      {/* MODAL MỜI NHÂN SỰ MANAGER / STAFF (INVITATION FLOW) */}
      <div className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 transition-all duration-300 ease-in-out ${showCreateModal ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
        <div className={`bg-white rounded-3xl w-full max-w-lg shadow-2xl border-t-[6px] border-blue-600 overflow-visible transition-all duration-300 ease-out transform ${
          showCreateModal ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        }`}>
          <div className="p-6 border-b flex justify-between items-center bg-blue-50/30 border-blue-100 rounded-t-3xl">
            <h4 className="font-bold text-lg flex items-center gap-2 text-blue-800">
              + Mời Nhân Sự Quản Trị / Vận Hành
            </h4>
            <button 
              onClick={() => setShowCreateModal(false)}
              className="p-2 rounded-full transition-all duration-200 hover:rotate-90 active:scale-95 text-blue-500 hover:text-blue-700 hover:bg-blue-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleCreateUser} className="p-6 space-y-4">
            {/* Vai trò */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase block mb-2">Vai Trò Tài Khoản</label>
              <div className="radio-inputs" style={{ width: '100%' }}>
                <label className="radio">
                  <input 
                    type="radio" 
                    name="createRoleTab" 
                    checked={createRole === 'MANAGER'}
                    onChange={() => setCreateRole('MANAGER')}
                  />
                  <span className="name">Manager (Quản Lý)</span>
                </label>
                <label className="radio">
                  <input 
                    type="radio" 
                    name="createRoleTab" 
                    checked={createRole === 'STAFF'}
                    onChange={() => setCreateRole('STAFF')}
                  />
                  <span className="name">Staff (Nhân Viên)</span>
                </label>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Email Người Nhận Lời Mời <span className="text-rose-500">*</span></label>
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
                Hệ thống sẽ gửi email tự động kèm liên kết kích hoạt. Người nhận sẽ tự điền Họ và tên, SĐT và đặt mật khẩu.
              </p>
            </div>

            {/* Khoa/Phòng ban Selection */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase block mb-2">Khoa / Phòng Ban <span className="text-rose-500">*</span></label>
              <div className="dept-wrapper relative w-full">
                {(() => {
                  const selectedDept = departmentsList.find(d => String(d.departmentId) === String(createForm.departmentId));
                  return (
                    <>
                      <div className={`dept-main ${selectedDept ? 'selected-active' : ''}`}>
                        <span className="text-body-sm font-semibold truncate">
                          {selectedDept ? `${selectedDept.name} (${selectedDept.code})` : '-- Chọn Khoa/Phòng Ban --'}
                        </span>
                        <div className="dept-bar">
                          <span className="top dept-bar-list dept-top" />
                          <span className="middle dept-bar-list dept-middle" />
                          <span className="bottom dept-bar-list dept-bottom" />
                        </div>
                      </div>

                      <div className="dept-menu-container">
                        <div className="dept-scroll-wrapper">
                          {/* Top scroll indicator */}
                          {departmentsList.length > 4 && (
                            <div className="dept-scroll-fade-top" id="deptScrollTop">
                              <svg className="dept-scroll-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                            </div>
                          )}
                          <div
                            className="max-h-[240px] overflow-y-auto pr-1 space-y-2 no-scrollbar"
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
                          {/* Bottom scroll indicator */}
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



            {/* Nút xác nhận */}
            <div className="flex gap-3 justify-end pt-3">
              <button 
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="border border-slate-200 text-slate-650 px-5 py-2.5 rounded-xl font-bold text-body-sm hover:bg-slate-100 transition-all duration-200 active:scale-95"
              >
                Hủy
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
                    Đang gửi...
                  </>
                ) : (
                  'Gửi lời mời'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* MODAL HIỂN THỊ THÔNG TIN TÀI KHOẢN ĐÃ TẠO (CHỈ ADMIN XEM) */}
      <div className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1001] flex items-center justify-center p-4 transition-all duration-300 ease-in-out ${createdCredentials ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
        <div className={`bg-white rounded-3xl w-full max-w-md shadow-2xl border-t-[6px] border-emerald-500 overflow-hidden transition-all duration-300 ease-out transform ${
          createdCredentials ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        }`}>
          <div className="p-6 border-b flex justify-between items-center bg-emerald-50/30 border-emerald-100 rounded-t-3xl">
            <h4 className="font-bold text-lg flex items-center gap-2 text-emerald-800">
              <CheckCircle2 className="w-5 h-5" /> Tài Khoản Đã Được Tạo
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
                  <span className="text-[11px] font-extrabold text-amber-700 uppercase">Chỉ dành cho Admin</span>
                </div>
                <p className="text-[12px] text-amber-700 leading-relaxed">
                  Mật khẩu này <strong>không được gửi</strong> cho người được mời. Admin sử dụng thông tin này để quản lý và kiểm soát hoạt động tài khoản.
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Vai trò</span>
                  <span className="font-bold text-slate-800 text-body-sm">{createdCredentials.role === 'MANAGER' ? 'Manager (Quản Lý)' : 'Staff (Nhân Viên)'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Phòng ban</span>
                  <span className="font-bold text-slate-800 text-body-sm">{createdCredentials.department}</span>
                </div>
                <hr className="border-slate-200" />
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Tài khoản (Email)</span>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="bg-white border border-slate-300 px-3 py-1.5 rounded-lg text-body-sm font-mono font-bold text-blue-700 flex-grow">{createdCredentials.email}</code>
                    <button
                      type="button"
                      onClick={() => { navigator.clipboard.writeText(createdCredentials.email); showToast('Đã sao chép email!', 'success'); }}
                      className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[11px] font-bold hover:bg-blue-100 transition-all active:scale-95"
                    >Copy</button>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Mật khẩu</span>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="bg-white border border-slate-300 px-3 py-1.5 rounded-lg text-body-sm font-mono font-bold text-rose-600 flex-grow tracking-wider">{createdCredentials.password}</code>
                    <button
                      type="button"
                      onClick={() => { navigator.clipboard.writeText(createdCredentials.password); showToast('Đã sao chép mật khẩu!', 'success'); }}
                      className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-[11px] font-bold hover:bg-rose-100 transition-all active:scale-95"
                    >Copy</button>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setCreatedCredentials(null)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-body-sm shadow-md transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
              >
                Đã ghi nhận, đóng
              </button>
            </div>
          )}
        </div>
      </div>

      {}
      {/* MODAL ĐIỀU CHUYỂN NHÂN SỰ (TRANSFER PERSONNEL) */}
      <div className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 transition-all duration-300 ease-in-out ${showTransferModal ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
        <div className={`bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden transition-all duration-300 ease-out transform ${showTransferModal ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}`}>
          <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h4 className="font-bold text-primary text-lg flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-indigo-650" /> Điều Chuyển Phòng Ban
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
                  <label className="text-[10px] font-bold text-indigo-500 uppercase block">Nhân viên cần chuyển</label>
                  <span className="font-bold text-slate-800 text-body-sm">{transferTargetMember.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-indigo-500 uppercase block">Vai trò</label>
                    <span className="font-semibold text-slate-600 text-body-xs">{transferTargetMember.role}</span>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-indigo-500 uppercase block">Khoa hiện tại</label>
                    <span className="font-bold text-slate-700 text-body-xs">
                      {departmentsList.find(d => d.departmentId === transferTargetMember.departmentId)?.name || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Chọn khoa / phòng ban đích <span className="text-rose-500">*</span></label>
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
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Lý do điều chuyển <span className="text-rose-500">*</span></label>
                <textarea 
                  rows="3"
                  required
                  placeholder="Nhập lý do điều chuyển nhân viên này..." 
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
                  Xác nhận điều chuyển
                </button>
                <button 
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="bg-white border border-slate-200 text-slate-650 hover:bg-slate-50 font-bold text-body-sm px-5 py-3 rounded-xl transition-all"
                >
                  Hủy
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* MODAL KÝ DUYỆT TÁC VỤ LIÊN KHOA (SIGNOFF MODAL) */}
      <div className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 transition-all duration-300 ease-in-out ${showSignoffModal ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
        <div className={`bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden transition-all duration-300 ease-out transform ${showSignoffModal ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}`}>
          <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h4 className="font-bold text-primary text-lg flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-indigo-650" /> Ký Duyệt Tác Vụ Liên Khoa
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
                <p className="text-[11px] font-extrabold text-indigo-700 uppercase">Thông tin tác vụ gốc</p>
                <h5 className="font-bold text-slate-800 text-body-sm">{selectedVerificationTask.title}</h5>
                <p className="text-[12px] text-slate-500 leading-relaxed">{selectedVerificationTask.description}</p>
                <div className="text-[11px] font-mono text-slate-400 pt-1">
                  ID: #{selectedVerificationTask.taskId} | Loại: {selectedVerificationTask.taskType}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Khoa thực hiện ký duyệt <span className="text-rose-500">*</span></label>
                <select 
                  className="w-full border border-slate-200 rounded-xl p-3 text-body-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                  value={signoffForm.departmentCode}
                  onChange={e => setSignoffForm({ ...signoffForm, departmentCode: e.target.value })}
                >
                  <option value="FIN">Phòng Tài chính (Finance - FIN)</option>
                  <option value="MOD">Phòng Kiểm duyệt (Moderation - MOD)</option>
                  <option value="DIS">Phòng Tranh chấp (Dispute Resolution - DIS)</option>
                  <option value="CS">Phòng Hỗ trợ (Customer Support - CS)</option>
                  <option value="IT">Phòng Kỹ thuật (IT & Development - IT)</option>
                  <option value="AUD">Phòng Kiểm toán (Audit & Compliance - AUD)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Quyết định kiểm chứng <span className="text-rose-500">*</span></label>
                <select 
                  className="w-full border border-slate-200 rounded-xl p-3 text-body-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                  value={signoffForm.status}
                  onChange={e => setSignoffForm({ ...signoffForm, status: e.target.value })}
                >
                  <option value="APPROVED">Chấp thuận (APPROVED)</option>
                  <option value="REJECTED">Từ chối & Hủy tác vụ (REJECTED)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Ghi chú kiểm duyệt</label>
                <textarea 
                  rows="3"
                  placeholder="Ghi rõ lý do phê duyệt hoặc từ chối để lưu vào hệ thống..." 
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
                  Xác nhận Ký duyệt
                </button>
                <button 
                  type="button"
                  onClick={() => setShowSignoffModal(false)}
                  className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-body-sm px-5 py-3 rounded-xl transition-all"
                >
                  Hủy
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

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
            {toast?.type === 'success' ? 'Thành công' : 
             toast?.type === 'warning' ? 'Cảnh báo' : 'Thao tác thất bại'}
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

// thêm đoạn code mẫu ngắn để trong comment về câu query
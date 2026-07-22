import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
    ArrowLeft,
    BadgeCheck,
    Banknote,
    Building2,
    CheckCircle2,
    Globe2,
    Loader2,
    MapPin,
    Phone,
    Save,
    ShieldCheck,
    UserRound,
    XCircle,
    Briefcase,
    Plus,
    Calendar,
    Clock,
    Sparkles,
    Coins,
    ArrowLeftRight,
    ChevronLeft,
    ChevronRight,
    X,
    Check,
    AlertCircle,
    FileText,
    Search
} from 'lucide-react';
import { contractApi } from '../api/contractApi';
import { getImageUrl, getFilenameFromUrl } from '../utils/imageHelper.js';
import MilestoneSetupModal from '../components/MilestoneSetupModal.jsx';

const emptyForm = {
    displayName: '',
    fullName: '',
    phone: '',
    companyName: '',
    companyLogoUrl: '',
    companyDescription: '',
    website: '',
    address: '',
    city: '',
    country: '',
    companySize: '',
    industry: '',
    taxCode: '',
    billing: {
        bankName: '', accountNumber: '', accountHolder: '', branch: ''
    }
};

export default function EmployerJobsPage({user, onNavigateHome, onNavigate, onUserUpdate, initialStatusFilter}) {
    const [form, setForm] = useState(emptyForm);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState(null);
    const [proposalForAccept, setProposalForAccept] = useState(null);

    
    const [projects, setProjects] = useState([]);
    const [loadingProjects, setLoadingProjects] = useState(false);

    // Search and filter states
    const [statusFilter, setStatusFilter] = useState(initialStatusFilter || 'ALL');
    const [searchQuery, setSearchQuery] = useState('');

    // Pagination states for projects
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);
    const PAGE_SIZE = 5;

    const filteredProjects = projects;
    const paginatedProjects = projects;

    // Reset currentPage when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    // Sync initialStatusFilter when provided
    useEffect(() => {
        if (initialStatusFilter) {
            setStatusFilter(initialStatusFilter);
        }
    }, [initialStatusFilter]);

    // Remove activeTab dependency

    // States for managing projects (edit, close, delete)
    const [editingProject, setEditingProject] = useState(null);
    const [categories, setCategories] = useState([]);
    const [updating, setUpdating] = useState(false);
    const [editForm, setEditForm] = useState({
        title: '',
        categoryId: '',
        projectType: 'FIXED',
        budgetFixed: '',
        budgetMin: '',
        budgetMax: '',
        deadline: '',
        description: ''
    });

    // States for viewing proposals
    const [selectedProjectForProposals, setSelectedProjectForProposals] = useState(null);
    const [proposals, setProposals] = useState([]);
    const [loadingProposals, setLoadingProposals] = useState(false);

    const completion = useMemo(() => {
        const keys = ['fullName', 'phone', 'companyName', 'companyDescription', 'taxCode'];
        const filled = keys.filter((key) => String(form[key] || '').trim()).length;
        return Math.round((filled / keys.length) * 100);
    }, [form]);


    
    useEffect(() => {
        fetch('http://localhost:8080/api/categories')
            .then((res) => {
                if (!res.ok) throw new Error('Không thể tải danh mục.');
                return res.json();
            })
            .then((data) => {
                setCategories(data.filter(c => c.isActive !== false));
            })
            .catch((err) => console.error('Error fetching categories:', err));
    }, []);

    
    useEffect(() => {
        if (editingProject) {
            setEditForm({
                title: editingProject.title || '',
                categoryId: editingProject.category?.categoryId || '',
                projectType: editingProject.projectType || 'FIXED',
                budgetFixed: editingProject.budgetFixed || '',
                budgetMin: editingProject.budgetMin || '',
                budgetMax: editingProject.budgetMax || '',
                deadline: editingProject.deadline || '',
                description: editingProject.description || ''
            });
        }
    }, [editingProject]);

    const handleUpdateProject = async (e) => {
        e.preventDefault();
        if (!editForm.title.trim() || !editForm.categoryId || !editForm.description.trim()) {
            alert('Vui lòng điền đầy đủ các thông tin bắt buộc.');
            return;
        }

        
        if (editForm.projectType === 'RANGE') {
            const minStr = editForm.budgetMin ? String(editForm.budgetMin).trim() : '';
            const maxStr = editForm.budgetMax ? String(editForm.budgetMax).trim() : '';
            
            if (!minStr || !maxStr) {
                alert('Vui lòng điền đầy đủ cả ngân sách tối thiểu và tối đa.');
                return;
            }
            const min = parseFloat(minStr);
            const max = parseFloat(maxStr);
            if (isNaN(min) || isNaN(max) || min <= 0 || max <= 0) {
                alert('Ngân sách tối thiểu và tối đa phải là số dương lớn hơn 0.');
                return;
            }
            if (min > max) {
                alert('Ngân sách tối thiểu không được lớn hơn ngân sách tối đa.');
                return;
            }
        } else if (editForm.projectType === 'FIXED') {
            const fixedStr = editForm.budgetFixed ? String(editForm.budgetFixed).trim() : '';
            if (!fixedStr) {
                alert('Vui lòng nhập ngân sách trọn gói.');
                return;
            }
            const fixed = parseFloat(fixedStr);
            if (isNaN(fixed) || fixed <= 0) {
                alert('Ngân sách cố định phải là số dương lớn hơn 0.');
                return;
            }
        }

        setUpdating(true);
        const payload = {
            categoryId: parseInt(editForm.categoryId),
            title: editForm.title.trim(),
            description: editForm.description.trim(),
            projectType: editForm.projectType,
            budgetFixed: editForm.projectType === 'FIXED' && editForm.budgetFixed ? parseFloat(editForm.budgetFixed) : null,
            budgetMin: editForm.projectType === 'RANGE' && editForm.budgetMin ? parseFloat(editForm.budgetMin) : null,
            budgetMax: editForm.projectType === 'RANGE' && editForm.budgetMax ? parseFloat(editForm.budgetMax) : null,
            deadline: editForm.deadline || null
        };

        try {
            const response = await fetch(`http://localhost:8080/api/projects/${editingProject.projectId}`, {
                method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error('Cập nhật dự án thất bại.');
            const data = await response.json();

            
            setProjects(prev => prev.map(p => p.projectId === data.projectId ? data : p));
            setNotice({type: 'success', message: 'Cập nhật dự án thành công.'});
            setEditingProject(null);
        } catch (err) {
            alert(err.message || 'Lỗi khi cập nhật dự án.');
        } finally {
            setUpdating(false);
        }
    };

    const handleCloseProject = async (projectId) => {
        if (!window.confirm('Bạn có chắc chắn muốn dừng tuyển dụng dự án này?')) return;
        try {
            const response = await fetch(`http://localhost:8080/api/projects/${projectId}/close`, {
                method: 'PUT'
            });
            if (!response.ok) throw new Error('Đóng dự án thất bại.');

            
            setProjects(prev => prev.map(p => p.projectId === projectId ? {...p, status: 'CLOSED'} : p));
            setNotice({type: 'success', message: 'Đã đóng tuyển dụng dự án thành công.'});
        } catch (err) {
            setNotice({type: 'error', message: err.message || 'Lỗi khi đóng dự án.'});
        }
    };

    const handleDeleteProject = async (projectId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa dự án này?')) return;
        try {
            const response = await fetch(`http://localhost:8080/api/projects/${projectId}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Xóa dự án thất bại.');

            
            setProjects(prev => prev.filter(p => p.projectId !== projectId));
            setNotice({type: 'success', message: 'Đã xóa dự án thành công.'});
        } catch (err) {
            setNotice({type: 'error', message: err.message || 'Lỗi khi xóa dự án.'});
        }
    };
    
    const handlePayProject = async (projectId) => {
        try {
            const project = projects.find(p => p.projectId === projectId);
            const response = await fetch(`http://localhost:8080/payment/create-url?projectId=${projectId}`, {
                method: 'POST'
            });
            if (!response.ok) {
                const payErr = await response.text();
                throw new Error(payErr || 'Không thể tạo cổng thanh toán.');
            }
            const payData = await response.json();
            if (payData.paymentUrl) {
                if (onNavigate) {
                    onNavigate('checkout', { 
                      projectId: projectId, 
                      paymentUrl: payData.paymentUrl, 
                      amount: payData.amount, 
                      txnRef: payData.txnRef,
                      bankName: payData.bankName,
                      bankAccountNo: payData.bankAccountNo,
                      bankAccountName: payData.bankAccountName,
                      projectTitle: project?.title || 'Dự án LancerPro',
                      servicePackage: project?.servicePackage
                    });
                } else {
                    window.location.href = payData.paymentUrl;
                }
            } else {
                throw new Error('Không nhận được URL thanh toán từ máy chủ.');
            }
        } catch (err) {
            alert('Lỗi khởi tạo cổng thanh toán: ' + err.message);
        }
    };

    const handleManageProgress = async (projectId) => {
        try {
            const contractDetails = await contractApi.getContractByProjectId(projectId, user.id);
            if (contractDetails && contractDetails.contractId) {
                onNavigate('contract_details', { contractId: contractDetails.contractId });
            } else {
                setNotice({type: 'error', message: 'Không tìm thấy thông tin hợp đồng cho dự án này.'});
            }
        } catch (err) {
            setNotice({type: 'error', message: err.message || 'Lỗi khi lấy thông tin hợp đồng.'});
        }
    };

    const handleProjectTitleClick = async (proj) => {
        try {
            const contractDetails = await contractApi.getContractByProjectId(proj.projectId, user.id);
            if (contractDetails && contractDetails.contractId) {
                onNavigate('contract_details', { contractId: contractDetails.contractId });
                return;
            }
        } catch (err) {
            console.error("Error fetching contract details:", err);
        }

        // Hiển thị thông báo rõ ràng nếu dự án chưa bắt đầu (chưa có Freelancer nhận việc)
        if (proj.status === 'PUBLISHED' || proj.status === 'PENDING' || proj.status === 'DRAFT' || proj.status === 'PENDING_PAYMENT') {
            const statusLabel = proj.status === 'PUBLISHED' ? 'Đang tuyển' : proj.status === 'PENDING' ? 'Chờ duyệt' : proj.status === 'PENDING_PAYMENT' ? 'Chờ thanh toán' : 'Bản nháp';
            const confirmViewDetails = window.confirm(
                `Dự án này chưa được giao cho Freelancer (Trạng thái: ${statusLabel}), nên chưa có tiến độ công việc để hiển thị.\n\nBạn có muốn chuyển sang trang xem Chi tiết công việc tuyển dụng của dự án không?`
            );
            if (!confirmViewDetails) return;
        } else {
            alert("Không tìm thấy thông tin hợp đồng / tiến độ công việc cho dự án này trên hệ thống.");
            return;
        }

        const mappedJob = {
            ...proj,
            id: proj.projectId,
            employerId: proj.client?.employerId || user?.id,
            employerName: proj.client?.displayName || user?.name
        };
        if (onNavigate) onNavigate('job_details', { job: mappedJob });
    };

    const handleViewProposals = (projectId) => {
        setSelectedProjectForProposals(projectId);
        setLoadingProposals(true);
        const userId = user?.id || user?.employerId || user?.userId;
        const role = user?.role || 'EMPLOYER';
        fetch(`http://localhost:8080/api/proposals/project/${projectId}?userId=${userId}&role=${role}`)
            .then((res) => {
                if (!res.ok) throw new Error('Không thể tải danh sách báo giá.');
                return res.json();
            })
            .then((data) => {
                setProposals(data || []);
            })
            .catch((err) => {
                console.error(err);
                alert(err.message || 'Lỗi khi tải danh sách báo giá.');
            })
            .finally(() => setLoadingProposals(false));
    };

    const handleAcceptProposal = async (proposalId) => {
        if (!window.confirm('Bạn có chắc chắn muốn tuyển dụng Freelancer này? Trạng thái dự án sẽ chuyển sang Đang thực hiện.')) return;
        try {
            const response = await fetch(`http://localhost:8080/api/proposals/${proposalId}/accept?employerId=${user.id}`, {
                method: 'POST'
            });
            if (!response.ok) {
                const msg = await response.text();
                throw new Error(msg || 'Chấp nhận báo giá thất bại.');
            }
            alert('Tuyển dụng Freelancer thành công! Hợp đồng đã được ký kết và bắt đầu thực hiện.');
            setSelectedProjectForProposals(null);
            fetchProjects();
        } catch (err) {
            alert(err.message || 'Lỗi khi chấp nhận báo giá.');
        }
    };

    // Fetch employer's projects
    const fetchProjects = () => {
        if (!user?.id) return;
        setLoadingProjects(true);
        fetch(`http://localhost:8080/api/projects/employer/${user.id}/paginated?page=${currentPage - 1}&size=${PAGE_SIZE}&status=${statusFilter}&search=${encodeURIComponent(searchQuery)}`)
            .then((res) => {
                if (!res.ok) throw new Error('Không thể tải danh sách dự án.');
                return res.json();
            })
            .then((data) => {
                setProjects(data.content || []);
                setTotalPages(data.totalPages || 1);
                setTotalElements(data.totalElements || 0);
            })
            .catch((err) => {
                console.error(err);
            })
            .finally(() => setLoadingProjects(false));
    };

    useEffect(() => {
        if (user?.id && user?.role === 'EMPLOYER') {
            fetchProjects();
        }
    }, [user, currentPage, statusFilter, searchQuery]);

    useEffect(() => {
        if (!user?.id || user?.role !== 'EMPLOYER') {
            setLoading(false);
            return;
        }

        fetch(`http://localhost:8080/api/employers/${user.id}/profile`)
            .then((res) => {
                if (!res.ok) throw new Error('Không tìm thấy hồ sơ employer.');
                return res.json();
            })
            .then((data) => {
                setForm({
                    displayName: data.displayName || user.name || '',
                    fullName: data.fullName || '',
                    phone: data.phone || '',
                    companyName: data.companyName || '',
                    companyLogoUrl: data.companyLogoUrl || '',
                    companyDescription: data.companyDescription || '',
                    website: data.website || '',
                    address: data.address || '',
                    city: data.city || '',
                    country: data.country || '',
                    companySize: data.companySize || '',
                    industry: data.industry || '',
                    taxCode: data.taxCode || '',
                    billing: {
                        bankName: data.billing?.bank_name || data.billing?.bankName || '',
                        accountNumber: data.billing?.account_number || data.billing?.accountNumber || '',
                        accountHolder: data.billing?.account_holder || data.billing?.accountHolder || '',
                        branch: data.billing?.branch || ''
                    }
                });
            })
            .catch((error) => {
                setNotice({type: 'error', message: error.message || 'Không thể tải hồ sơ công ty.'});
            })
            .finally(() => setLoading(false));
    }, [user]);

    const updateField = (field, value) => {
        setForm((prev) => ({...prev, [field]: value}));
    };

    const updateBilling = (field, value) => {
        setForm((prev) => ({
            ...prev, billing: {
                ...prev.billing, [field]: value
            }
        }));
    };
    const validateForm = () => {
        if (!form.displayName || form.displayName.trim().length < 3 || form.displayName.trim().length > 50) {
            setNotice({type: 'error', message: 'Tên hiển thị phải từ 3 đến 50 ký tự.'});
            return false;
        }
        if (form.fullName && (form.fullName.trim().length < 3 || form.fullName.trim().length > 50)) {
            setNotice({type: 'error', message: 'Họ và tên người đại diện phải từ 3 đến 50 ký tự.'});
            return false;
        }

        const phoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/;
        if (form.phone && !phoneRegex.test(form.phone.trim())) {
            setNotice({
                type: 'error',
                message: 'Số điện thoại không hợp lệ (phải gồm 10 số và bắt đầu bằng 03, 05, 07, 08 hoặc 09).'
            });
            return false;
        }

        const urlRegex = /^(https?:\/\/)?([a-zA-Z0-9][-a-zA-Z0-9]*\.)*[a-zA-Z0-9][-a-zA-Z0-9]*(:\d+)?(\/.*)?$/;
        if (form.website && !urlRegex.test(form.website.trim())) {
            setNotice({type: 'error', message: 'Địa chỉ Website không hợp lệ (ví dụ: https://company.com).'});
            return false;
        }

        // Validate MST (Tax Code)
        const taxCodeRegex = /^[0-9]{10}$|^[0-9]{13}$|^[0-9]{10}-[0-9]{3}$/;
        if (form.taxCode && !taxCodeRegex.test(form.taxCode.trim())) {
            setNotice({type: 'error', message: 'Mã số thuế không hợp lệ. Mã số thuế phải gồm 10 hoặc 13 chữ số.'});
            return false;
        }

        // Validate Quy mô công ty
        const companySizeRegex = /^(Hơn\s+|Dưới\s+)?([1-9][0-9]*)(\s*-\s*[1-9][0-9]*)?(\s*\+)?(\s*(nhân viên|người))?$/i;
        if (form.companySize && !companySizeRegex.test(form.companySize.trim())) {
            setNotice({type: 'error', message: 'Quy mô công ty không hợp lệ (ví dụ: 10-50, 50+, Hơn 100 nhân viên).'});
            return false;
        }

        // 6. Xác thực tài khoản ngân hàng (Nếu nhập 1 trường thì các trường chính khác bắt buộc nhập)
        const {bankName, accountNumber, accountHolder, branch} = form.billing;
        if (bankName || accountNumber || accountHolder || branch) {
            if (!bankName.trim() || !accountNumber.trim() || !accountHolder.trim()) {
                setNotice({
                    type: 'error',
                    message: 'Nếu cập nhật thông tin thanh toán, vui lòng điền đầy đủ: Ngân hàng, Số tài khoản và Chủ tài khoản.'
                });
                return false;
            }

            // Số tài khoản chỉ được phép chứa số và tối đa 30 ký tự
            const numRegex = /^[0-9]+$/;
            if (!numRegex.test(accountNumber.trim())) {
                setNotice({type: 'error', message: 'Số tài khoản ngân hàng chỉ được phép chứa các chữ số.'});
                return false;
            }
            if (accountNumber.trim().length > 30) {
                setNotice({type: 'error', message: 'Số tài khoản ngân hàng tối đa 30 ký tự.'});
                return false;
            }

            // Chủ tài khoản bắt buộc là chữ và tối đa 150 ký tự
            const nameRegex = /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂÂÊÔƠƯưăâêôơư\s]+$/;
            if (!nameRegex.test(accountHolder.trim())) {
                setNotice({type: 'error', message: 'Tên chủ tài khoản chỉ được phép chứa các chữ cái và khoảng trắng.'});
                return false;
            }
            if (accountHolder.trim().length > 150) {
                setNotice({type: 'error', message: 'Tên chủ tài khoản tối đa 150 ký tự.'});
                return false;
            }

            // Chi nhánh tối đa 100 ký tự
            if (branch && branch.trim().length > 100) {
                setNotice({type: 'error', message: 'Chi nhánh ngân hàng tối đa 100 ký tự.'});
                return false;
            }
        }
        return true; 
    };
    const handleSubmit = async (event) => {
        event.preventDefault();

        // 1. Kiểm tra validation phía client
        if (!validateForm()) {
            window.scrollTo({top: 0, behavior: 'smooth'});
            return;
        }

        setSaving(true);
        setNotice(null);

        try {
            const response = await fetch(`http://localhost:8080/api/employers/${user.id}/profile`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(form)
            });

            const data = await response.json();

            if (!response.ok || data.success === false) {
                throw new Error(data.message || 'Cập nhật thất bại.');
            }

            // 2. Không cần gọi onUserUpdate ở đây vì thông tin mới chưa được Admin duyệt.
            // Chỉ cần hiển thị thông báo thành công và cuộn lên đầu trang.
            setNotice({type: 'success', message: data.message});
            window.scrollTo({top: 0, behavior: 'smooth'});

        } catch (error) {
            setNotice({type: 'error', message: error.message || 'Không thể lưu thay đổi.'});
        } finally {
            setSaving(false);
        }
    };


    if (user?.role !== 'EMPLOYER') {
        return (<div className="min-h-screen bg-slate-100 flex items-center justify-center px-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md text-center shadow-level-1">
                <XCircle className="w-12 h-12 text-rose-500 mx-auto mb-4"/>
                <h1 className="text-xl font-extrabold text-slate-900">Chỉ dành cho Employer</h1>
                <p className="text-sm text-slate-500 mt-2">Tài khoản hiện tại không có quyền cập nhật hồ sơ công
                    ty.</p>
                <button
                    type="button"
                    onClick={onNavigateHome}
                    className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800"
                >
                    <ArrowLeft className="w-4 h-4"/>
                    Về trang chủ
                </button>
            </div>
        </div>);
    }

        return (
        <div className="pt-28 pb-16 bg-slate-50 min-h-screen font-sans antialiased text-slate-900">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                            Quản lý dự án
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Xem danh sách dự án, theo dõi trạng thái duyệt và quản lý báo giá từ freelancer.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => onNavigate('post_job')}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-blue-600/10"
                    >
                        <Plus className="w-4 h-4" /> Đăng dự án mới
                    </button>
                </div>

                {notice && (
                    <div className={`mb-6 p-4 rounded-xl border flex items-center gap-2 text-sm font-bold transition-all ${
                        notice.type === 'success' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                        {notice.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        {notice.message}
                    </div>
                )}

                {/* Main Content Card */}
                <div ref={projectListRef} className="bg-white border border-slate-200 rounded-2xl shadow-level-1 overflow-hidden">
                    <div className="p-6">
                        {loadingProjects ? (
                            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
                                <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
                                <span className="text-sm font-semibold">Đang tải danh sách dự án...</span>
                            </div>
                        ) : projects.length === 0 && statusFilter === 'ALL' && !searchQuery ? (
                            <div className="border border-dashed border-slate-200 rounded-2xl p-12 text-center bg-slate-50/50">
                                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-4">
                                    <Briefcase className="w-6 h-6" />
                                </div>
                                <h4 className="font-bold text-slate-800 mb-1">Chưa có dự án nào</h4>
                                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
                                    Bạn chưa đăng dự án nào. Hãy bắt đầu tìm kiếm freelancer bằng cách đăng dự án mới.
                                </p>
                                <button
                                    onClick={() => onNavigate('post_job')}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors"
                                >
                                    Đăng dự án đầu tiên
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Search & Filter Bar */}
                                <div className="space-y-4 mb-6 pb-6 border-b border-slate-100">
                                    <div className="relative">
                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                        <input
                                            type="text"
                                            placeholder="Tìm kiếm dự án theo tên, mô tả hoặc lĩnh vực..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-550/10"
                                        />
                                        {searchQuery && (
                                            <button 
                                                onClick={() => setSearchQuery('')}
                                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-2 items-center">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-2">Trạng thái:</span>
                                        {[
                                            { value: 'ALL',             label: 'Tất cả' },
                                            { value: 'PUBLISHED',       label: 'Đang tuyển' },
                                            { value: 'IN_PROGRESS',     label: 'Đang làm' },
                                                                                                                                    { value: 'CLOSED',          label: 'Đã đóng' },
                                        ].map(item => {
                                            const isActive = statusFilter === item.value;
                                            return (
                                                <button
                                                    key={item.value}
                                                    type="button"
                                                    onClick={() => {
                                                        setStatusFilter(item.value);
                                                        setCurrentPage(1);
                                                    }}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                                                        isActive 
                                                            ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-600/10' 
                                                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                                                    }`}
                                                >
                                                    <span>{item.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {filteredProjects.length === 0 ? (
                                    <div className="border border-dashed border-slate-200 rounded-2xl p-12 text-center bg-slate-50/50">
                                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-4">
                                            <Briefcase className="w-6 h-6" />
                                        </div>
                                        <h4 className="font-bold text-slate-800 mb-1">Không tìm thấy dự án nào</h4>
                                        <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
                                            Không tìm thấy dự án nào khớp với điều kiện lọc và tìm kiếm của bạn.
                                        </p>
                                        <button
                                            onClick={() => {
                                                setStatusFilter('ALL');
                                                setSearchQuery('');
                                            }}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors"
                                        >
                                            Xóa bộ lọc
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 gap-4">
                                            {paginatedProjects.map((proj) => {
                                                const isFixed = proj.projectType === 'FIXED_PRICE' || proj.projectType === 'FIXED';
                                                const statusColors = {
                                                    DRAFT: 'bg-slate-100 text-slate-600 border-slate-200',
                                                    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
                                                    PENDING_REVIEW: 'bg-amber-50 text-amber-700 border-amber-200',
                                                    PENDING_PAYMENT: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                                                    PUBLISHED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                                                    REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
                                                    IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-200',
                                                    CLOSED: 'bg-slate-100 text-slate-600 border-slate-200'
                                                };
                                                const statusLabels = {
                                                    DRAFT: 'Bản nháp',
                                                    PENDING: 'Chờ duyệt',
                                                    PENDING_REVIEW: 'Chờ duyệt',
                                                    PENDING_PAYMENT: 'Chờ thanh toán',
                                                    PUBLISHED: 'Đang tuyển',
                                                    REJECTED: 'Từ chối',
                                                    IN_PROGRESS: 'Đang thực hiện',
                                                    CLOSED: 'Đã đóng'
                                                };

                                                return (
                                                    <div key={proj.projectId} className="border border-slate-100 bg-white rounded-2xl p-5 hover:border-slate-300 hover:shadow-md transition-all duration-200 group">
                                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                                                            <div>
                                                                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                                                    <span className="text-[10px] font-extrabold uppercase bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">
                                                                        {proj.category?.categoryName || 'General'}
                                                                    </span>
                                                                    <span className={`text-[10px] font-extrabold uppercase border px-2.5 py-0.5 rounded-md ${statusColors[proj.status] || 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                                                        {statusLabels[proj.status] || proj.status}
                                                                    </span>
                                                                </div>
                                                                <h4 className="font-extrabold text-slate-950 text-base leading-snug transition-colors">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleProjectTitleClick(proj)}
                                                                        className="text-left font-extrabold text-slate-950 hover:text-cyan-600 transition-colors duration-200"
                                                                    >
                                                                        {proj.title}
                                                                    </button>
                                                                </h4>
                                                            </div>
                                                            <div className="text-right sm:shrink-0 flex sm:flex-col items-baseline sm:items-end justify-between gap-1">
                                                                <span className="text-xs text-slate-400 font-medium">
                                                                    {proj.agreedAmount || proj.agreed_amount ? 'Giá thầu chốt' : 'Ngân sách'}
                                                                </span>
                                                                <span className="font-extrabold text-emerald-600 text-sm">
                                                                    {proj.agreedAmount || proj.agreed_amount ? (
                                                                        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(proj.agreedAmount || proj.agreed_amount)
                                                                    ) : isFixed ? (
                                                                        proj.budgetFixed ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(proj.budgetFixed) : 'Thỏa thuận'
                                                                    ) : (
                                                                        proj.budgetMin && proj.budgetMax ? `${new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(proj.budgetMin)} - ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(proj.budgetMax)}` : 'Thỏa thuận'
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-2">
                                                            {proj.description}
                                                        </p>

                                                        <div className="flex items-center justify-between border-t border-slate-50 pt-4 text-xs font-semibold text-slate-500">
                                                            <div className="flex items-center gap-4">
                                                                <span className="flex items-center gap-1.5">
                                                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                                    Hạn: {proj.deadline ? new Date(proj.deadline).toLocaleDateString('vi-VN') : 'Không giới hạn'}
                                                                </span>
                                                                <span className="flex items-center gap-1.5">
                                                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                                    Đăng ngày: {proj.createdAt ? new Date(proj.createdAt).toLocaleDateString('vi-VN') : 'Hôm nay'}
                                                                </span>
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                {proj.status === 'PENDING_PAYMENT' && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handlePayProject(proj.projectId)}
                                                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors shrink-0 shadow-md shadow-indigo-600/10"
                                                                    >
                                                                        Thanh toán đăng tin
                                                                    </button>
                                                                )}
                                                                {proj.status === 'PUBLISHED' && (
                                                                    <>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleCloseProject(proj.projectId)}
                                                                            className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold rounded-xl transition-colors shrink-0"
                                                                        >
                                                                            Dừng tuyển
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleViewProposals(proj.projectId)}
                                                                            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-xl transition-colors shrink-0 shadow-md shadow-cyan-600/10"
                                                                        >
                                                                            Xem báo giá ({proj.proposalCount || 0})
                                                                        </button>
                                                                    </>
                                                                )}
                                                                {proj.status === 'IN_PROGRESS' && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleManageProgress(proj.projectId)}
                                                                        className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl transition-colors shrink-0"
                                                                    >
                                                                         Quản lý tiến độ
                                                                    </button>
                                                                )}
                                                                
                                                                {/* Sửa tin allowed for all statuses EXCEPT IN_PROGRESS and CLOSED */}
                                                                {!['IN_PROGRESS', 'CLOSED'].includes(proj.status) && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setEditingProject(proj)}
                                                                        className="px-3.5 py-2 border border-slate-200 text-slate-650 hover:bg-slate-50 text-xs font-bold rounded-xl transition-all shrink-0"
                                                                    >
                                                                        Sửa tin
                                                                    </button>
                                                                )}
                                                                
                                                                {/* Xóa tin allowed for all statuses EXCEPT IN_PROGRESS */}
                                                                {proj.status !== 'IN_PROGRESS' && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleDeleteProject(proj.projectId)}
                                                                        className="px-3.5 py-2 border border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-100 text-xs font-bold rounded-xl transition-all shrink-0"
                                                                    >
                                                                        Xóa tin
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Pagination */}
                                        {totalPages > 1 && (
                                            <div className="flex items-center justify-between border-t border-slate-100 pt-6 mt-6 flex-wrap gap-4">
                                                <span className="text-xs text-slate-500 font-medium">
                                                    Hiển thị từ <span className="font-extrabold text-slate-800">{totalElements > 0 ? (currentPage - 1) * PAGE_SIZE + 1 : 0}</span> đến{' '}
                                                    <span className="font-extrabold text-slate-800">{Math.min(currentPage * PAGE_SIZE, totalElements)}</span> trong tổng số{' '}
                                                    <span className="font-extrabold text-slate-800">{totalElements}</span> dự án
                                                </span>
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                        disabled={currentPage === 1}
                                                        className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 text-slate-500 hover:text-cyan-600 hover:border-cyan-200 hover:bg-cyan-50/30 disabled:opacity-40 disabled:pointer-events-none transition-all duration-200"
                                                        title="Trang trước"
                                                    >
                                                        <ChevronLeft className="w-4 h-4" />
                                                    </button>
                                                    
                                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                                        <button
                                                            key={p}
                                                            type="button"
                                                            onClick={() => setCurrentPage(p)}
                                                            className={`w-9 h-9 inline-flex items-center justify-center rounded-xl text-xs font-bold transition-all duration-200 ${
                                                                currentPage === p
                                                                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/10 border border-cyan-600'
                                                                    : 'border border-slate-200 text-slate-650 hover:text-cyan-600 hover:border-cyan-200 hover:bg-cyan-50/30'
                                                            }`}
                                                        >
                                                            {p}
                                                        </button>
                                                    ))}
                                                    
                                                    <button
                                                        type="button"
                                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                                        disabled={currentPage === totalPages}
                                                        className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 text-slate-500 hover:text-cyan-600 hover:border-cyan-200 hover:bg-cyan-50/30 disabled:opacity-40 disabled:pointer-events-none transition-all duration-200"
                                                        title="Trang sau"
                                                    >
                                                        <ChevronRight className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>


        {editingProject && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-md px-4 overflow-y-auto py-10 animate-fade-in">
                <div className="bg-white rounded-2xl p-6 w-full max-w-2xl border border-slate-150 shadow-2xl my-auto animate-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between border-b border-slate-150 pb-4 mb-6">
                        <h3 className="text-xl font-bold text-slate-800">Chỉnh sửa tin tuyển dụng</h3>
                        <button
                            type="button"
                            onClick={() => setEditingProject(null)}
                            className="text-slate-400 hover:text-slate-600 font-bold text-lg"
                        >
                            ✕
                        </button>
                    </div>

                    <form onSubmit={handleUpdateProject} className="space-y-4 text-left">
                        {/* Title */}
                        <label className="block">
                            <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-500 mb-1.5">Tiêu đề dự án *</span>
                            <input
                                type="text"
                                required
                                value={editForm.title}
                                onChange={(e) => setEditForm(prev => ({...prev, title: e.target.value}))}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10"
                            />
                        </label>

                        {/* Category */}
                        <label className="block">
                            <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-500 mb-1.5">Lĩnh vực cần thuê *</span>
                            <select
                                required
                                value={editForm.categoryId}
                                onChange={(e) => setEditForm(prev => ({...prev, categoryId: e.target.value}))}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10"
                            >
                                <option value="">-- Chọn danh mục phù hợp --</option>
                                {categories.map((cat) => (
                                    <option key={cat.categoryId} value={cat.categoryId}>{cat.categoryName}</option>
                                ))}
                            </select>
                        </label>

                        {/* Project Type */}
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setEditForm(prev => ({...prev, projectType: 'FIXED'}))}
                                className={`p-3 rounded-xl border text-left transition ${editForm.projectType === 'FIXED' ? 'border-cyan-500 bg-cyan-50/20' : 'border-slate-200 bg-slate-50'}`}
                            >
                                <span className="block text-xs font-bold text-slate-900">Chi phí cố định</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setEditForm(prev => ({...prev, projectType: 'RANGE'}))}
                                className={`p-3 rounded-xl border text-left transition ${editForm.projectType === 'RANGE' ? 'border-cyan-500 bg-cyan-50/20' : 'border-slate-200 bg-slate-50'}`}
                            >
                                <span className="block text-xs font-bold text-slate-900">Khoảng ngân sách</span>
                            </button>
                        </div>

                        {/* Budget fields */}
                        {editForm.projectType === 'FIXED' ? (
                            <label className="block">
                                <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-500 mb-1.5">Ngân sách trọn gói (VND) *</span>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    required
                                    value={editForm.budgetFixed ? Number(String(editForm.budgetFixed).replace(/\./g, '')).toLocaleString('vi-VN') : ''}
                                    onChange={(e) => {
                                        const raw = e.target.value.replace(/\./g, '').replace(/[^0-9]/g, '');
                                        setEditForm(prev => ({...prev, budgetFixed: raw}));
                                    }}
                                    placeholder="VD: 5.000.000 (Bắt buộc nhập)"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10"
                                />
                            </label>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                <label className="block">
                                    <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-500 mb-1.5">Tối thiểu (VND) *</span>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        required
                                        value={editForm.budgetMin ? Number(String(editForm.budgetMin).replace(/\./g, '')).toLocaleString('vi-VN') : ''}
                                        onChange={(e) => {
                                            const raw = e.target.value.replace(/\./g, '').replace(/[^0-9]/g, '');
                                            setEditForm(prev => ({...prev, budgetMin: raw}));
                                        }}
                                        placeholder="VD: 2.000.000 (Bắt buộc)"
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10"
                                    />
                                </label>
                                <label className="block">
                                    <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-500 mb-1.5">Tối đa (VND) *</span>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        required
                                        value={editForm.budgetMax ? Number(String(editForm.budgetMax).replace(/\./g, '')).toLocaleString('vi-VN') : ''}
                                        onChange={(e) => {
                                            const raw = e.target.value.replace(/\./g, '').replace(/[^0-9]/g, '');
                                            setEditForm(prev => ({...prev, budgetMax: raw}));
                                        }}
                                        placeholder="VD: 10.000.000 (Bắt buộc)"
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10"
                                    />
                                </label>
                            </div>
                        )}

                        {/* Deadline */}
                        <label className="block">
                            <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-500 mb-1.5">Hạn nhận hồ sơ *</span>
                            <input
                                type="date"
                                required
                                min={new Date().toISOString().split('T')[0]}
                                value={editForm.deadline}
                                onChange={(e) => setEditForm(prev => ({...prev, deadline: e.target.value}))}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10"
                            />
                        </label>

                        {/* Description */}
                        <label className="block">
                            <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-500 mb-1.5">Mô tả chi tiết *</span>
                            <textarea
                                required
                                rows={5}
                                value={editForm.description}
                                onChange={(e) => setEditForm(prev => ({...prev, description: e.target.value}))}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 resize-none"
                            />
                        </label>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 mt-6">
                            <button
                                type="button"
                                onClick={() => setEditingProject(null)}
                                className="px-5 py-2.5 rounded-xl border border-slate-200 font-bold text-sm text-slate-600 hover:bg-slate-50 transition-all"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="submit"
                                disabled={updating}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 text-white font-extrabold text-sm hover:bg-cyan-700 disabled:opacity-70 shadow-sm transition-all hover:scale-[1.02]"
                            >
                                {updating ? <Loader2 className="w-4 h-4 animate-spin"/> : null}
                                Lưu thay đổi
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* Proposals Modal */}
        {selectedProjectForProposals && (
            <div
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <div
                    className="bg-white rounded-2xl w-full max-w-2xl border border-slate-150 shadow-2xl p-6 sm:p-8 animate-fade-in flex flex-col max-h-[85vh]">
                    <div className="flex items-center justify-between border-b border-slate-150 pb-4 mb-4">
                        <h3 className="font-extrabold text-lg text-slate-900">
                            Danh sách đề xuất báo giá thầu
                        </h3>
                        <button
                            type="button"
                            onClick={() => setSelectedProjectForProposals(null)}
                            className="text-slate-400 hover:text-slate-650 font-bold text-lg p-1 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            ✕
                        </button>
                    </div>

                    {loadingProposals ? (
                        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600"/>
                            <span className="text-sm font-semibold">Đang tải báo giá...</span>
                        </div>
                    ) : proposals.length === 0 ? (
                        <div className="py-16 text-center text-slate-400 text-sm">
                            Chưa có Freelancer nào gửi báo giá thầu cho dự án này.
                        </div>
                    ) : (
                        <div className="overflow-y-auto flex-1 space-y-4 pr-1">
                            {proposals.map((prop) => (
                                <div key={prop.proposalId}
                                     className="border border-slate-150 rounded-xl p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors text-left">
                                    <div className="flex items-start justify-between gap-4 mb-3">
                                        <div className="flex items-center gap-3">
                                            {prop.freelancerAvatar ? (
                                                <img
                                                    src={getImageUrl(prop.freelancerAvatar)}
                                                    alt={prop.freelancerName}
                                                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                                                />
                                            ) : (
                                                <div
                                                    className="w-10 h-10 bg-blue-100 text-blue-600 font-bold rounded-full flex items-center justify-center text-sm">
                                                    {prop.freelancerName ? prop.freelancerName.charAt(0) : 'F'}
                                                </div>
                                            )}
                                            <div>
                                                <h4 className="font-bold text-sm text-slate-900">{prop.freelancerName}</h4>
                                                <p className="text-[11px] text-slate-400 font-medium">{prop.freelancerTitle || 'Freelancer tự do'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-sm font-extrabold text-emerald-600">
                                                {new Intl.NumberFormat('vi-VN', {
                                                    style: 'currency',
                                                    currency: 'VND'
                                                }).format(prop.bidAmount)}
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-bold">Thực hiện: {prop.estimatedDays} ngày</p>
                                        </div>
                                    </div>
                                    <div
                                        className="text-xs text-slate-650 bg-white border border-slate-100 rounded-lg p-3 leading-relaxed whitespace-pre-line text-left">
                                        {prop.coverLetter}
                                    </div>
                                     {prop.cvUrl && (
                                         <div className="mt-2.5 flex justify-start">
                                             <a 
                                                 href={getImageUrl(prop.cvUrl)} 
                                                 target="_blank" 
                                                 rel="noopener noreferrer"
                                                 className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg border border-blue-100 transition-colors"
                                             >
                                                 <FileText className="w-3.5 h-3.5" />
                                                 <span>Đọc CV của ứng viên (PDF)</span>
                                             </a>
                                         </div>
                                     )}
                                    {prop.status === 'SUBMITTED' ? (
                                        <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-slate-100">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedProjectForProposals(null);
                                                    if (onNavigate) onNavigate('messenger', {
                                                        id: prop.freelancerId,
                                                        role: 'FREELANCER',
                                                        name: prop.freelancerName,
                                                        avatar: prop.freelancerAvatar
                                                    });
                                                }}
                                                className="px-3.5 py-1.5 rounded-lg text-slate-700 bg-white border border-slate-250 hover:bg-slate-50 text-xs font-bold transition-all"
                                            >
                                                Chat trao đổi
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setProposalForAccept(prop)}
                                                className="px-4 py-1.5 rounded-lg text-white bg-blue-600 hover:bg-blue-700 text-xs font-bold shadow-sm transition-all"
                                            >
                                                Chấp nhận giao việc
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex justify-end mt-2">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                                prop.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                                            }`}>
                                                {prop.status === 'ACCEPTED' ? 'Đã được giao việc' : 'Đã từ chối'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )}

        {proposalForAccept && (
            <MilestoneSetupModal
                proposal={proposalForAccept}
                employerId={user?.id || user?.employerId || user?.userId}
                onClose={() => setProposalForAccept(null)}
                onSuccess={() => {
                    setProposalForAccept(null);
                    setSelectedProjectForProposals(null);
                    fetchProjects();
                    alert('Tuyển dụng Freelancer thành công! Hợp đồng đã được ký kết và bắt đầu thực hiện.');
                }}
            />
        )}
        </div>
    );
}

function FormSection({icon, title, children}) {
    return (<section className="space-y-4">
        <div className="flex items-center gap-2 text-slate-900">
        <span
            className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
          {icon}
        </span>
            <h3 className="font-extrabold">{title}</h3>
        </div>
        {children}
    </section>);
}

function TextInput({label, value, onChange, placeholder, icon, required}) {
    return (<label className="block">
      <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-500 mb-1.5">
        {label}{required ? ' *' : ''}
      </span>
        <div className="relative">
            {icon && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>}
            <input
                type="text"
                required={required}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                className={`w-full rounded-xl border border-slate-200 bg-slate-50 pr-3 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 ${
                    icon ? 'pl-10' : 'pl-3'
                }`}
            />
        </div>
    </label>);
}

function TextArea({label, value, onChange}) {
    return (<label className="block">
        <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-500 mb-1.5">{label}</span>
        <textarea
            rows="4"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 resize-none"
            placeholder="Mô tả ngắn về lĩnh vực hoạt động, đội ngũ, văn hóa và nhu cầu tuyển freelancer..."
        />
    </label>);
}

import React, {useEffect, useMemo, useState} from 'react';
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
    LifeBuoy
} from 'lucide-react';
import { contractApi } from '../api/contractApi';
import { getImageUrl, getFilenameFromUrl } from '../utils/imageHelper.js';
import EmployerSupportTickets from './employer/EmployerSupportTickets.jsx';
import EmployerInvoices from './employer/EmployerInvoices.jsx';

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

export default function EmployerProfileSettings({user, onNavigateHome, onNavigate, onUserUpdate, initialTab = 'company', openCreateTicketModal = false}) {
    const [form, setForm] = useState(emptyForm);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState(null);
    const [proposalForAccept, setProposalForAccept] = useState(null);

    // KYC Verification (GPKD & CCCD) States
    const [gpkdUrl, setGpkdUrl] = useState('');
    const [cccdUrl, setCccdUrl] = useState('');
    const [kycStatus, setKycStatus] = useState('');
    const [kycRejectedReason, setKycRejectedReason] = useState('');
    const [submittingKyc, setSubmittingKyc] = useState(false);
    const [uploadingGpkd, setUploadingGpkd] = useState(false);
    const [uploadingCccd, setUploadingCccd] = useState(false);

    
    const [activeTab, setActiveTab] = useState(initialTab || 'company'); 
    const [projects, setProjects] = useState([]);
    const [loadingProjects, setLoadingProjects] = useState(false);

    // Pagination states for projects
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 5;

    // Adjust currentPage if it goes out of range due to project count changes
    useEffect(() => {
        const maxPage = Math.ceil(projects.length / PAGE_SIZE);
        if (maxPage > 0 && currentPage > maxPage) {
            setCurrentPage(maxPage);
        } else if (projects.length === 0) {
            setCurrentPage(1);
        }
    }, [projects.length, currentPage]);

    // Reset page to 1 when changing activeTab
    useEffect(() => {
        if (activeTab === 'projects') {
            setCurrentPage(1);
        }
    }, [activeTab]);

    const totalPages = Math.ceil(projects.length / PAGE_SIZE);
    const paginatedProjects = useMemo(() => {
        return projects.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    }, [projects, currentPage]);

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
        const keys = ['displayName', 'fullName', 'phone', 'companyName', 'companyDescription', 'address', 'taxCode'];
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
            if (true) {
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
            }
        } else if (editForm.projectType === 'FIXED') {
            const fixedStr = editForm.budgetFixed ? String(editForm.budgetFixed).trim() : '';
            if (!fixedStr) {
                alert('Vui lòng nhập ngân sách cố định.');
                return;
            }
            if (fixedStr) {
                const fixed = parseFloat(fixedStr);
                if (isNaN(fixed) || fixed <= 0) {
                    alert('Ngân sách cố định phải là số dương lớn hơn 0.');
                    return;
                }
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
            setNotice({type: 'success', message: 'Cập nhật tin tuyển dụng thành công.'});
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
        if (!window.confirm('Bạn có chắc chắn muốn xóa tin tuyển dụng này?')) return;
        try {
            const response = await fetch(`http://localhost:8080/api/projects/${projectId}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Xóa dự án thất bại.');

            
            setProjects(prev => prev.filter(p => p.projectId !== projectId));
            setNotice({type: 'success', message: 'Đã xóa tin tuyển dụng thành công.'});
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

    const handleViewProposals = (projectId) => {
        setSelectedProjectForProposals(projectId);
        setLoadingProposals(true);
        fetch(`http://localhost:8080/api/proposals/project/${projectId}?userId=${user.id}&role=EMPLOYER`)
            .then((res) => {
                if (!res.ok) throw new Error('Không thể tải danh sách báo giá.');
                return res.json();
            })
            .then((data) => {
                setProposals(data);
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
        fetch(`http://localhost:8080/api/projects/employer/${user.id}`)
            .then((res) => {
                if (!res.ok) throw new Error('Không thể tải danh sách dự án.');
                return res.json();
            })
            .then((data) => {
                setProjects(data);
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
    }, [user]);

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
                setGpkdUrl(data.businessLicenseUrl || '');
                setCccdUrl(data.representativeIdCardUrl || '');
                setKycStatus(data.kycStatus || 'UNVERIFIED');
                setKycRejectedReason(data.kycRejectedReason || '');
            })
            .catch((error) => {
                setNotice({type: 'error', message: error.message || 'Không thể tải hồ sơ công ty.'});
            })
            .finally(() => setLoading(false));
    }, [user]);

    // Validation helper for verification files (Allows any file type for Staff review)
    const validateVerificationFile = (file, label) => {
        if (!file) return { valid: false, message: 'Vui lòng chọn file đính kèm.' };
        const maxMB = 50;
        if (file.size > maxMB * 1024 * 1024) {
            return {
                valid: false,
                message: `File ${label} dung lượng vượt quá ${maxMB}MB.`
            };
        }
        return { valid: true };
    };

    const handleUploadGpkd = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const check = validateVerificationFile(file, 'Giấy phép kinh doanh (GPKD)');
        if (!check.valid) {
            setNotice({ type: 'error', message: check.message });
            return;
        }
        setUploadingGpkd(true);
        setNotice(null);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await fetch('http://localhost:8080/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                const filename = getFilenameFromUrl(data.fileUrl);
                setGpkdUrl(filename);
                setNotice({ type: 'success', message: 'Tải file Giấy phép kinh doanh (GPKD) lên thành công!' });
            } else {
                throw new Error('Không thể tải file GPKD lên máy chủ.');
            }
        } catch (err) {
            setNotice({ type: 'error', message: err.message || 'Lỗi hệ thống khi tải file GPKD.' });
        } finally {
            setUploadingGpkd(false);
        }
    };

    const handleUploadCccd = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const check = validateVerificationFile(file, 'Căn cước công dân (CCCD)');
        if (!check.valid) {
            setNotice({ type: 'error', message: check.message });
            return;
        }
        setUploadingCccd(true);
        setNotice(null);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await fetch('http://localhost:8080/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                const filename = getFilenameFromUrl(data.fileUrl);
                setCccdUrl(filename);
                setNotice({ type: 'success', message: 'Tải file Căn cước công dân (CCCD) lên thành công!' });
            } else {
                throw new Error('Không thể tải file CCCD lên máy chủ.');
            }
        } catch (err) {
            setNotice({ type: 'error', message: err.message || 'Lỗi hệ thống khi tải file CCCD.' });
        } finally {
            setUploadingCccd(false);
        }
    };

    const handleKycSubmit = async (e) => {
        e.preventDefault();
        if (!gpkdUrl || !cccdUrl) {
            setNotice({
                type: 'error',
                message: 'Vui lòng đính kèm đầy đủ file Giấy phép kinh doanh (GPKD) và Căn cước công dân (CCCD) hợp lệ trước khi nộp hồ sơ xác thực.'
            });
            return;
        }
        setSubmittingKyc(true);
        setNotice(null);
        try {
            const res = await fetch(`http://localhost:8080/api/employers/${user.id}/kyc/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    taxCode: form.taxCode,
                    businessLicenseUrl: gpkdUrl,
                    representativeIdCardUrl: cccdUrl
                })
            });
            const data = await res.json();
            if (res.ok && data.success !== false) {
                setKycStatus('PENDING');
                setNotice({
                    type: 'success',
                    message: 'Đã gửi hồ sơ xác thực GPKD & CCCD thành công. Ban quản trị sẽ đối soát và phê duyệt.'
                });
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                throw new Error(data.message || 'Nộp hồ sơ xác thực không thành công.');
            }
        } catch (err) {
            setNotice({ type: 'error', message: err.message || 'Lỗi gửi hồ sơ xác thực.' });
        } finally {
            setSubmittingKyc(false);
        }
    };

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
        if (!form.fullName || form.fullName.trim().length < 2 || form.fullName.trim().length > 100) {
            setNotice({type: 'error', message: 'Vui lòng nhập Họ tên thật của người đại diện (từ 2 đến 100 ký tự).'});
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

        // Validate MST (Tax Code)
        const taxCodeRegex = /^[0-9]{10}$|^[0-9]{13}$|^[0-9]{10}-[0-9]{3}$/;
        if (form.taxCode && !taxCodeRegex.test(form.taxCode.trim())) {
            setNotice({type: 'error', message: 'Mã số thuế không hợp lệ. Mã số thuế phải gồm 10 hoặc 13 chữ số.'});
            return false;
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

    return (<div className="h-screen flex flex-col bg-slate-100 text-slate-900 pt-16 overflow-hidden">
        <div className="bg-white border-b border-slate-200 shadow-sm flex-none">
            <div className="max-w-6xl mx-auto px-6 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                    type="button"
                    onClick={onNavigateHome}
                    className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-950 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4"/>
                    Trang chủ
                </button>

                {/* Top Tab Bar Switcher */}
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
                    <button
                        type="button"
                        onClick={() => setActiveTab('company')}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            activeTab === 'company'
                                ? 'bg-slate-900 text-white shadow-sm'
                                : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                        }`}
                    >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Thông tin công ty</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('invoices')}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            activeTab === 'invoices'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                        }`}
                    >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Hóa đơn & Chứng từ</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('support')}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            activeTab === 'support'
                                ? 'bg-cyan-600 text-white shadow-sm'
                                : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                        }`}
                    >
                        <LifeBuoy className="w-3.5 h-3.5" />
                        <span>Hỗ trợ kỹ thuật</span>
                    </button>
                </div>
            </div>
        </div>

        <main className="max-w-6xl w-full mx-auto px-6 py-3 flex-1 overflow-y-auto">
            {activeTab === 'invoices' ? (
                <div className="w-full">
                    <EmployerInvoices user={user} />
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
                    <aside className="space-y-4">
                        {activeTab === 'company' ? (
                            <>
                                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-level-1">
                                    <div
                                        className="w-14 h-14 rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-700 mb-4 overflow-hidden">
                                        {form.companyLogoUrl ? (
                                            <img src={getImageUrl(form.companyLogoUrl)} alt="Company Logo" className="w-full h-full object-cover" />
                                        ) : (
                                            <Building2 className="w-7 h-7"/>
                                        )}
                                    </div>
                                    <h1 className="text-xl font-extrabold tracking-tight">Hồ sơ công ty</h1>
                                    <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                                        Cập nhật thông tin doanh nghiệp và tài khoản thanh toán để freelancer tin tưởng hơn khi
                                        nhận dự án.
                                    </p>
                                </div>

                                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-level-1">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-bold text-slate-700">Độ hoàn thiện</span>
                                        <span className="text-sm font-extrabold text-cyan-700">{completion}%</span>
                                    </div>
                                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-cyan-500 rounded-full transition-all"
                                             style={{width: `${completion}%`}}/>
                                    </div>
                                    <div className="mt-4 space-y-2 text-xs font-semibold text-slate-500">
                                        <div className="flex items-center gap-2">
                                            <BadgeCheck className="w-4 h-4 text-emerald-500"/>
                                            Thông tin rõ ràng tăng độ tin cậy
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Banknote className="w-4 h-4 text-amber-500"/>
                                            Billing dùng để đối soát thanh toán
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-level-1 space-y-4">
                                <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-700">
                                    <LifeBuoy className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-base font-extrabold text-slate-900">Trung tâm Hỗ trợ</h3>
                                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                        Gửi ticket khi bạn gặp sự cố nạp tiền, lỗi hệ thống hoặc cần giải đáp thắc mắc. Nhân viên Staff sẽ tiếp nhận và xử lý.
                                    </p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 space-y-2">
                                    <div className="flex items-center gap-2 font-bold text-slate-800">
                                        <span>💡 Lưu ý quan trọng</span>
                                    </div>
                                    <p>• Sự cố nạp tiền: đính kèm hóa đơn hoặc mã giao dịch.</p>
                                    <p>• Khiếu nại hợp đồng dự án cụ thể được xử lý tại mục Tranh chấp (Disputes).</p>
                                </div>
                            </div>
                        )}

                        <div className="bg-white border border-slate-200 rounded-2xl p-2.5 shadow-level-1 space-y-1">
                            <button
                                type="button"
                                onClick={() => setActiveTab('company')}
                                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                                    activeTab === 'company'
                                        ? 'bg-slate-900 text-white shadow-sm'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                                }`}
                            >
                                <Building2 className="w-4 h-4" />
                                <span>Thông tin công ty</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('invoices')}
                                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                                    activeTab === 'invoices'
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <FileText className="w-4 h-4" />
                                    <span>Hóa đơn & Chứng từ</span>
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('support')}
                                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                                    activeTab === 'support'
                                        ? 'bg-cyan-600 text-white shadow-sm'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <LifeBuoy className="w-4 h-4" />
                                    <span>Hỗ trợ kỹ thuật & Sự cố</span>
                                </div>
                                <span className="text-[10px] bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full font-extrabold">NEW</span>
                            </button>
                        </div>
                    </aside>

                    {activeTab === 'support' ? (
                        <section className="bg-transparent space-y-4">
                            <EmployerSupportTickets user={user} defaultOpenModal={openCreateTicketModal} />
                        </section>
                    ) : (
                        <section className="bg-white border border-slate-200 rounded-2xl shadow-level-1 overflow-hidden">
                    <div
                        className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-extrabold text-slate-900">
                                Thông tin công ty & Xác thực
                            </h2>
                            <p className="text-sm text-slate-500">
                                Cập nhật thông tin doanh nghiệp, người đại diện và đính kèm tài liệu xác thực.
                            </p>
                        </div>
                        {notice && (<div
                            className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all ${notice.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                            {notice.type === 'success' ? <CheckCircle2 className="w-4 h-4"/> :
                                <XCircle className="w-4 h-4"/>}
                            {notice.message}
                        </div>)}
                    </div>

                    {loading ? (<div className="h-[520px] flex items-center justify-center text-slate-500">
                            <Loader2 className="w-6 h-6 animate-spin mr-2"/>
                            Đang tải dữ liệu...
                        </div>) : (
                        <form onSubmit={handleSubmit} className="p-6 space-y-8 animate-fade-in">
                            <FormSection icon={<Building2 className="w-5 h-5"/>} title="Thông tin công ty">
                                {/* Company Logo Upload Area */}
                                <div className="flex items-center gap-6 pb-6 border-b border-slate-100 mb-6">
                                    <div className="w-20 h-20 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                                        {form.companyLogoUrl ? (
                                            <img src={getImageUrl(form.companyLogoUrl)} alt="Company Logo" className="w-full h-full object-cover" />
                                        ) : (
                                            <Building2 className="w-8 h-8 text-slate-400" />
                                        )}
                                    </div>
                                    <div className="space-y-1.5">
                                        <h4 className="text-sm font-bold text-slate-800">Logo công ty</h4>
                                        <p className="text-xs text-slate-500">Chấp nhận JPG, PNG, GIF. Tối đa 2MB.</p>
                                        <div className="flex items-center gap-2">
                                            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-sm">
                                                <span>Tải ảnh lên</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={async (e) => {
                                                        const file = e.target.files[0];
                                                        if (!file) return;
                                                        const formData = new FormData();
                                                        formData.append('file', file);
                                                        try {
                                                            const res = await fetch('http://localhost:8080/api/upload', {
                                                                method: 'POST',
                                                                body: formData
                                                            });
                                                            const data = await res.json();
                                                            if (data.success) {
                                                                updateField('companyLogoUrl', getFilenameFromUrl(data.fileUrl));
                                                            } else {
                                                                alert('Tải ảnh lên thất bại!');
                                                            }
                                                        } catch (err) {
                                                            alert('Lỗi tải ảnh lên! Đảm bảo Backend đang chạy.');
                                                        }
                                                    }}
                                                />
                                            </label>
                                            {form.companyLogoUrl && (
                                                <button
                                                    type="button"
                                                    onClick={() => updateField('companyLogoUrl', '')}
                                                    className="px-3 py-1.5 border border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-100 text-xs font-bold rounded-lg transition-colors"
                                                >
                                                    Xóa Logo
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <TextInput label="Tên công ty" value={form.companyName}
                                               onChange={(value) => updateField('companyName', value)} required/>
                                    <TextInput label="Mã số thuế" value={form.taxCode}
                                               onChange={(value) => updateField('taxCode', value)}
                                               placeholder="VD: 0102030405"/>
                                </div>
                                <TextArea label="Mô tả ngắn về công ty" value={form.companyDescription}
                                          onChange={(value) => updateField('companyDescription', value)}/>
                            </FormSection>

                            <FormSection icon={<UserRound className="w-5 h-5"/>} title="Người đại diện">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <TextInput label="Họ tên thật (người đại diện)" value={form.fullName}
                                               onChange={(value) => updateField('fullName', value)} required
                                               placeholder="VD: Nguyễn Văn A"/>
                                    <TextInput label="Số điện thoại" value={form.phone}
                                               onChange={(value) => updateField('phone', value)}
                                               icon={<Phone className="w-4 h-4"/>}
                                               placeholder="VD: 0987654321"/>
                                </div>
                            </FormSection>

                            {/* Section Xác thực doanh nghiệp (GPKD & CCCD) */}
                            <FormSection icon={<ShieldCheck className="w-5 h-5 text-emerald-600"/>} title="Xác thực doanh nghiệp (Giấy phép KD & CCCD)">
                                <div className="mb-4">
                                    {kycStatus === 'VERIFIED' || kycStatus === 'APPROVED' ? (
                                        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-xs font-bold shadow-sm">
                                            <BadgeCheck className="w-6 h-6 text-emerald-600 shrink-0 fill-emerald-100" />
                                            <div>
                                                <p className="font-extrabold text-sm text-emerald-900 flex items-center gap-1.5">
                                                    🟢 Đã xác thực doanh nghiệp (Verified)
                                                </p>
                                                <p className="font-medium text-emerald-700 mt-0.5">Giấy phép kinh doanh và CCCD người đại diện đã được kiểm duyệt thành công.</p>
                                            </div>
                                        </div>
                                    ) : kycStatus === 'PENDING' ? (
                                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3 text-amber-800 text-xs font-bold shadow-sm">
                                            <Clock className="w-6 h-6 text-amber-600 shrink-0 animate-pulse" />
                                            <div>
                                                <p className="font-extrabold text-sm text-amber-900 flex items-center gap-1.5">
                                                    🟡 Đang chờ Staff duyệt (Pending)
                                                </p>
                                                <p className="font-medium text-amber-700 mt-0.5">Tài liệu GPKD & CCCD đã được tải lên cơ sở dữ liệu. Hồ sơ của bạn đang được Nhân viên (Staff) xem xét và đối soát.</p>
                                            </div>
                                        </div>
                                    ) : kycStatus === 'REJECTED' ? (
                                        <div className="p-4.5 rounded-xl bg-rose-50 border border-rose-200 space-y-2 text-rose-800 text-xs font-bold shadow-sm">
                                            <div className="flex items-center gap-2 text-rose-900">
                                                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                                                <p className="font-extrabold text-sm">🔴 Hồ sơ xác thực bị từ chối (Rejected)</p>
                                            </div>
                                            <div className="text-xs font-semibold text-rose-800 bg-white/80 p-3 rounded-lg border border-rose-200 shadow-2xs">
                                                <span className="font-extrabold text-rose-950">Lý do từ chối từ Staff: </span>
                                                <span className="text-rose-900 italic font-bold">{kycRejectedReason || 'File đính kèm không hợp lệ hoặc thông tin chưa đầy đủ. Vui lòng kiểm tra lại tài liệu và gửi lại yêu cầu.'}</span>
                                            </div>
                                            <p className="text-[11px] text-rose-700 font-medium">
                                                * Bạn có thể thay đổi hoặc giữ nguyên tài liệu GPKD / CCCD bên dưới và bấm nút <strong>"Gửi lại hồ sơ xác thực"</strong> để gửi lại cho Staff duyệt.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3 text-slate-700 text-xs font-bold">
                                            <ShieldCheck className="w-5 h-5 text-slate-400 shrink-0" />
                                            <div>
                                                <p className="font-extrabold text-sm text-slate-800">Chưa gửi hồ sơ xác thực doanh nghiệp</p>
                                                <p className="font-medium text-slate-500 mt-0.5">Tải lên file Giấy phép kinh doanh (GPKD) và Căn cước công dân (CCCD) để lưu database gửi Nhân viên (Staff) duyệt.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* GPKD Upload */}
                                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-extrabold uppercase text-slate-700 flex items-center gap-1.5">
                                                <FileText className="w-4 h-4 text-cyan-600" />
                                                1. Giấy phép kinh doanh (GPKD) *
                                            </label>
                                            <span className="text-[10px] font-bold text-slate-500">Hỗ trợ PDF, Ảnh, Word, ZIP (Max 50MB)</span>
                                        </div>

                                        {gpkdUrl ? (
                                            <div className="flex items-center justify-between p-2.5 bg-white border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800">
                                                <a href={getImageUrl(gpkdUrl)} target="_blank" rel="noopener noreferrer" className="truncate hover:underline text-cyan-700 font-bold flex items-center gap-1.5">
                                                    <FileText className="w-3.5 h-3.5" />
                                                    {gpkdUrl}
                                                </a>
                                                {kycStatus !== 'VERIFIED' && kycStatus !== 'APPROVED' && kycStatus !== 'PENDING' && (
                                                    <button type="button" onClick={() => setGpkdUrl('')} className="text-rose-500 hover:text-rose-700 font-bold text-xs">Xóa</button>
                                                )}
                                            </div>
                                        ) : (
                                            <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-300 hover:border-cyan-500 bg-white rounded-xl cursor-pointer text-xs font-bold text-slate-600 transition-all">
                                                {uploadingGpkd ? <Loader2 className="w-4 h-4 animate-spin text-cyan-600" /> : <FileText className="w-4 h-4 text-slate-400" />}
                                                <span>{uploadingGpkd ? 'Đang tải file GPKD lên DB...' : 'Chọn file GPKD (PDF, Ảnh, Word...)'}</span>
                                                <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.zip,.rar" onChange={handleUploadGpkd} disabled={uploadingGpkd || kycStatus === 'VERIFIED' || kycStatus === 'APPROVED' || kycStatus === 'PENDING'} className="hidden" />
                                            </label>
                                        )}
                                    </div>

                                    {/* CCCD Upload */}
                                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-extrabold uppercase text-slate-700 flex items-center gap-1.5">
                                                <UserRound className="w-4 h-4 text-cyan-600" />
                                                2. Căn cước công dân (CCCD) *
                                            </label>
                                            <span className="text-[10px] font-bold text-slate-500">Hỗ trợ PNG, JPG, WEBP, PDF (Max 50MB)</span>
                                        </div>

                                        {cccdUrl ? (
                                            <div className="flex items-center justify-between p-2.5 bg-white border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800">
                                                <a href={getImageUrl(cccdUrl)} target="_blank" rel="noopener noreferrer" className="truncate hover:underline text-cyan-700 font-bold flex items-center gap-1.5">
                                                    <UserRound className="w-3.5 h-3.5" />
                                                    {cccdUrl}
                                                </a>
                                                {kycStatus !== 'VERIFIED' && kycStatus !== 'APPROVED' && kycStatus !== 'PENDING' && (
                                                    <button type="button" onClick={() => setCccdUrl('')} className="text-rose-500 hover:text-rose-700 font-bold text-xs">Xóa</button>
                                                )}
                                            </div>
                                        ) : (
                                            <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-300 hover:border-cyan-500 bg-white rounded-xl cursor-pointer text-xs font-bold text-slate-600 transition-all">
                                                {uploadingCccd ? <Loader2 className="w-4 h-4 animate-spin text-cyan-600" /> : <UserRound className="w-4 h-4 text-slate-400" />}
                                                <span>{uploadingCccd ? 'Đang tải file CCCD lên DB...' : 'Chọn file CCCD (PNG, JPG, PDF...)'}</span>
                                                <input type="file" accept=".png,.jpg,.jpeg,.webp,.pdf,.heic" onChange={handleUploadCccd} disabled={uploadingCccd || kycStatus === 'VERIFIED' || kycStatus === 'APPROVED' || kycStatus === 'PENDING'} className="hidden" />
                                            </label>
                                        )}
                                    </div>
                                </div>

                                {kycStatus !== 'VERIFIED' && kycStatus !== 'APPROVED' && kycStatus !== 'PENDING' && (
                                    <div className="flex justify-end pt-2">
                                        <button
                                            type="button"
                                            onClick={handleKycSubmit}
                                            disabled={submittingKyc || !gpkdUrl || !cccdUrl}
                                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-extrabold text-xs hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-sm"
                                        >
                                            {submittingKyc ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                            {submittingKyc ? 'Đang gửi...' : kycStatus === 'REJECTED' ? 'Gửi lại hồ sơ xác thực (GPKD & CCCD)' : 'Gửi hồ sơ xác thực (GPKD & CCCD)'}
                                        </button>
                                    </div>
                                )}
                            </FormSection>

                            <div className="flex justify-end border-t border-slate-200 pt-5">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 text-white font-extrabold text-sm hover:bg-slate-800 disabled:opacity-70 shadow-level-1 transition-all hover:scale-[1.02]"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                                    {saving ? 'Đang lưu...' : 'Lưu thông tin công ty'}
                                </button>
                            </div>
                        </form>
                    )}
                </section>
                )}
            </div>
            )}
        </main>

        
        {editingProject && (<div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-md px-4 overflow-y-auto py-10">
            <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl animate-fade-in my-auto">
                <div className="flex items-center justify-between border-b border-slate-150 pb-4 mb-6">
                    <h3 className="text-xl font-bold text-slate-800">Chỉnh sửa tin tuyển dụng</h3>
                    <button
                        type="button"
                        onClick={() => setEditingProject(null)}
                        className="text-slate-400 hover:text-slate-650 font-bold text-lg"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleUpdateProject} className="space-y-4">
                    {/* Title */}
                    <label className="block">
                                <span
                                    className="block text-xs font-extrabold uppercase tracking-wide text-slate-500 mb-1.5">Tiêu đề dự án *</span>
                        <input
                            type="text"
                            required
                            value={editForm.title}
                            onChange={(e) => setEditForm(prev => ({...prev, title: e.target.value}))}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-850 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10"
                        />
                    </label>

                    {/* Category */}
                    <label className="block">
                                <span
                                    className="block text-xs font-extrabold uppercase tracking-wide text-slate-500 mb-1.5">Lĩnh vực cần thuê *</span>
                        <select
                            required
                            value={editForm.categoryId}
                            onChange={(e) => setEditForm(prev => ({...prev, categoryId: e.target.value}))}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-850 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10"
                        >
                            <option value="">-- Chọn danh mục phù hợp --</option>
                            {categories.map((cat) => (
                                <option key={cat.categoryId} value={cat.categoryId}>{cat.categoryName}</option>))}
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
                    {editForm.projectType === 'FIXED' ? (<label className="block">
                                    <span
                                        className="block text-xs font-extrabold uppercase tracking-wide text-slate-500 mb-1.5">Ngân sách trọn gói (VND) *</span>
                        <input
                            type="number"
                            required
                            value={editForm.budgetFixed}
                            onChange={(e) => setEditForm(prev => ({...prev, budgetFixed: e.target.value}))}
                            placeholder="VD: 5000000 (Bắt buộc nhập)"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-850 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10"
                        />
                    </label>) : (<div className="grid grid-cols-2 gap-4">
                        <label className="block">
                                        <span
                                            className="block text-xs font-extrabold uppercase tracking-wide text-slate-500 mb-1.5">Tối thiểu (VND) *</span>
                            <input
                                type="number"
                                required
                                value={editForm.budgetMin}
                                onChange={(e) => setEditForm(prev => ({
                                    ...prev, budgetMin: e.target.value
                                }))}
                                placeholder="VD: 2000000 (Bắt buộc)"
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-855 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10"
                            />
                        </label>
                        <label className="block">
                                        <span
                                            className="block text-xs font-extrabold uppercase tracking-wide text-slate-500 mb-1.5">Tối đa (VND) *</span>
                            <input
                                type="number"
                                required
                                value={editForm.budgetMax}
                                onChange={(e) => setEditForm(prev => ({
                                    ...prev, budgetMax: e.target.value
                                }))}
                                placeholder="VD: 10000000 (Bắt buộc)"
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-855 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10"
                            />
                        </label>
                    </div>)}

                    {/* Deadline */}
                    <label className="block">
                                <span
                                    className="block text-xs font-extrabold uppercase tracking-wide text-slate-500 mb-1.5">Hạn nhận hồ sơ *</span>
                        <input
                            type="date"
                            required
                            min={new Date().toISOString().split('T')[0]}
                            value={editForm.deadline}
                            onChange={(e) => setEditForm(prev => ({...prev, deadline: e.target.value}))}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-850 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10"
                        />
                    </label>

                    {/* Description */}
                    <label className="block">
                                <span
                                    className="block text-xs font-extrabold uppercase tracking-wide text-slate-500 mb-1.5">Mô tả chi tiết *</span>
                        <textarea
                            required
                            rows="4"
                            value={editForm.description}
                            onChange={(e) => setEditForm(prev => ({...prev, description: e.target.value}))}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-850 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 resize-none"
                        />
                    </label>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 mt-6">
                        <button
                            type="button"
                            onClick={() => setEditingProject(null)}
                            className="px-5 py-2.5 rounded-xl border border-slate-200 font-bold text-sm text-slate-650 hover:bg-slate-50 transition-all"
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
        </div>)}

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
                            className="text-slate-400 hover:text-slate-650 font-bold text-lg"
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
                        <div className="py-16 text-center text-slate-400">
                            Chưa có Freelancer nào gửi báo giá thầu cho dự án này.
                        </div>
                    ) : (
                        <div className="overflow-y-auto flex-1 space-y-4 pr-1">
                            {proposals.map((prop) => (
                                <div key={prop.proposalId}
                                     className="border border-slate-150 rounded-xl p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-start justify-between gap-4 mb-3">
                                        <div className="flex items-center gap-3">
                                            {prop.freelancerAvatar ? (
                                                <img
                                                    src={prop.freelancerAvatar}
                                                    alt={prop.freelancerName}
                                                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                                                />
                                            ) : (
                                                <div
                                                    className="w-10 h-10 bg-blue-100 text-blue-600 font-bold rounded-full flex items-center justify-center text-sm">
                                                    {prop.freelancerName.charAt(0)}
                                                </div>
                                            )}
                                            <div>
                                                <h4 className="font-bold text-sm text-slate-900">{prop.freelancerName}</h4>
                                                <p className="text-[11px] text-slate-400 font-medium">{prop.freelancerTitle || 'Freelancer tự do'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-extrabold text-emerald-600">
                                                {new Intl.NumberFormat('vi-VN', {
                                                    style: 'currency',
                                                    currency: 'VND'
                                                }).format(prop.bidAmount)}
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-bold">Thực
                                                hiện: {prop.estimatedDays} ngày</p>
                                        </div>
                                    </div>
                                    <div
                                        className="text-xs text-slate-650 bg-white border border-slate-100 rounded-lg p-3 leading-relaxed whitespace-pre-line">
                                        {prop.coverLetter}
                                    </div>
                                     {prop.cvUrl && (
                                         <div className="mt-2.5 flex justify-start">
                                             <a 
                                                 href={prop.cvUrl} 
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
                employerId={user.id}
                onClose={() => setProposalForAccept(null)}
                onSuccess={() => {
                    setProposalForAccept(null);
                    setSelectedProjectForProposals(null);
                    fetchProjects();
                    alert('Tuyển dụng Freelancer thành công! Hợp đồng đã được ký kết và bắt đầu thực hiện.');
                }}
            />
        )}
    </div>);
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

function MilestoneSetupModal({ proposal, employerId, onClose, onSuccess }) {
    const [payOption, setPayOption] = useState('single'); // 'single' or 'split'
    const [milestones, setMilestones] = useState([
        { title: '', amount: '', dueDate: '', description: '' },
        { title: '', amount: '', dueDate: '', description: '' },
    ]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const bidAmount = proposal ? Number(proposal.bidAmount) : 0;

    const getDeadlineDate = () => {
        const today = new Date();
        const days = proposal ? Number(proposal.estimatedDays) : 0;
        today.setDate(today.getDate() + days);
        return today;
    };
    const maxDeadlineDate = getDeadlineDate();
    const maxDeadlineStr = maxDeadlineDate.toLocaleDateString('vi-VN');
    const maxDeadlineIso = maxDeadlineDate.toISOString().split('T')[0];
    const todayIso = new Date().toISOString().split('T')[0];

    const handleAddMilestone = () => {
        if (milestones.length >= 5) return;
        setMilestones([...milestones, { title: '', amount: '', dueDate: '', description: '' }]);
    };

    const handleRemoveMilestone = (index) => {
        if (milestones.length <= 2) return;
        setMilestones(milestones.filter((_, idx) => idx !== index));
    };

    const handleMilestoneChange = (index, field, value) => {
        const updated = milestones.map((m, idx) => {
            if (idx === index) {
                return { ...m, [field]: value };
            }
            return m;
        });
        setMilestones(updated);
    };

    // Calculate sum of milestones
    const sumAmounts = milestones.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
    const isSumMatch = sumAmounts === bidAmount;
    const diffAmount = bidAmount - sumAmounts;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        let customMilestones = null;
        if (payOption === 'split') {
            if (milestones.length < 2 || milestones.length > 5) {
                setError('Số lượng mốc thanh toán phải từ 2 đến 5.');
                return;
            }
            if (!isSumMatch) {
                setError(`Tổng số tiền các mốc chưa khớp với ngân sách thầu. Lệch: ${diffAmount.toLocaleString('vi-VN')} VNĐ`);
                return;
            }
            for (let i = 0; i < milestones.length; i++) {
                const m = milestones[i];
                if (!m.title.trim()) {
                    setError(`Tiêu đề mốc thứ ${i + 1} không được bỏ trống.`);
                    return;
                }
                if (!m.amount || Number(m.amount) <= 0) {
                    setError(`Số tiền mốc thứ ${i + 1} phải lớn hơn 0.`);
                    return;
                }
                if (!m.dueDate) {
                    setError(`Hạn hoàn thành mốc thứ ${i + 1} không được bỏ trống.`);
                    return;
                }
                if (m.dueDate < todayIso) {
                    setError(`Hạn hoàn thành mốc thứ ${i + 1} không được trước ngày hôm nay.`);
                    return;
                }
                if (m.dueDate > maxDeadlineIso) {
                    setError(`Hạn hoàn thành mốc thứ ${i + 1} (${m.dueDate}) không được vượt quá ngày hoàn thành dự án dự kiến (${maxDeadlineStr}).`);
                    return;
                }
                if (i > 0 && milestones[i - 1].dueDate > m.dueDate) {
                    setError(`Hạn hoàn thành mốc thứ ${i} không được sau mốc thứ ${i + 1}.`);
                    return;
                }
            }
            customMilestones = milestones.map(m => ({
                title: m.title.trim(),
                amount: Number(m.amount),
                dueDate: m.dueDate,
                description: m.description.trim()
            }));
        }

        try {
            setLoading(true);
            const response = await fetch(`http://localhost:8080/api/proposals/${proposal.proposalId}/accept?employerId=${employerId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: customMilestones ? JSON.stringify(customMilestones) : null
            });

            if (!response.ok) {
                const msg = await response.text();
                throw new Error(msg || 'Chấp nhận báo giá thất bại.');
            }

            onSuccess();
        } catch (err) {
            setError(err.message || 'Lỗi khi chấp nhận báo giá.');
        } finally {
            setLoading(false);
        }
    };

    if (!proposal) return null;

    return (
        <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col my-8 animate-in zoom-in-95 duration-200 text-left">
                
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
                    <div>
                        <h3 className="text-lg font-extrabold text-slate-800">Thiết lập Tiến độ & Mốc thanh toán</h3>
                        <p className="text-xs text-slate-500 mt-1">
                            Tuyển dụng freelancer <strong className="text-slate-700">{proposal.freelancerName}</strong> cho dự án.
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
                    {error && (
                        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl flex items-start gap-2.5">
                            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                            <span className="font-semibold text-xs leading-normal">{error}</span>
                        </div>
                    )}

                    {/* Total Budget Alert */}
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex justify-between items-center mb-0">
                        <span className="text-slate-655 font-bold text-xs">Tổng ngân sách gói thầu:</span>
                        <span className="text-lg font-black text-blue-700">
                            {Number(proposal.bidAmount).toLocaleString('vi-VN')} VNĐ
                        </span>
                    </div>

                    {/* Project duration & deadline info */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 gap-4 text-xs">
                        <div>
                            <span className="text-slate-400 font-bold block mb-1">Thời gian thực hiện gói thầu:</span>
                            <span className="font-extrabold text-slate-850">{proposal.estimatedDays} ngày</span>
                        </div>
                        <div>
                            <span className="text-slate-400 font-bold block mb-1">Hạn hoàn thành tối đa:</span>
                            <span className="font-extrabold text-blue-600">{maxDeadlineStr}</span>
                        </div>
                    </div>

                    {/* Payment Options */}
                    <div>
                        <span className="text-xs font-bold text-slate-455 uppercase tracking-wider block mb-3">Phương thức thanh toán</span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className={`border-2 rounded-xl p-4 flex flex-col cursor-pointer transition-all ${
                                payOption === 'single' ? 'border-blue-600 bg-blue-50/20' : 'border-slate-200 hover:border-slate-350'
                            }`}>
                                <div className="flex items-center gap-2 mb-1">
                                    <input 
                                        type="radio" 
                                        name="payOption" 
                                        value="single" 
                                        checked={payOption === 'single'} 
                                        onChange={() => setPayOption('single')}
                                        className="text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="font-extrabold text-slate-800 text-xs">Thanh toán 1 lần</span>
                                </div>
                                <span className="text-slate-500 text-xs pl-5 leading-normal">
                                    Thanh toán 100% khi dự án hoàn thành bàn giao đầy đủ.
                                </span>
                            </label>

                            <label className={`border-2 rounded-xl p-4 flex flex-col cursor-pointer transition-all ${
                                payOption === 'split' ? 'border-blue-600 bg-blue-50/20' : 'border-slate-200 hover:border-slate-355'
                            }`}>
                                <div className="flex items-center gap-2 mb-1">
                                    <input 
                                        type="radio" 
                                        name="payOption" 
                                        value="split" 
                                        checked={payOption === 'split'} 
                                        onChange={() => setPayOption('split')}
                                        className="text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="font-extrabold text-slate-800 text-xs">Chia theo tiến độ (2 - 5 mốc)</span>
                                </div>
                                <span className="text-slate-500 text-xs pl-5 leading-normal">
                                    Giải ngân tiền theo từng giai đoạn hoàn thành công việc.
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Split Milestones Form */}
                    {payOption === 'split' && (
                        <div className="space-y-4 pt-2 border-t border-slate-100">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-455 uppercase tracking-wider">Danh sách các mốc tiến độ</span>
                                <button 
                                    type="button" 
                                    onClick={handleAddMilestone}
                                    disabled={milestones.length >= 5}
                                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                                >
                                    + Thêm mốc
                                </button>
                            </div>

                            <div className="space-y-4">
                                {milestones.map((milestone, idx) => (
                                    <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/30 relative space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="font-extrabold text-slate-700 text-xs">Mốc số {idx + 1}</span>
                                            {milestones.length > 2 && (
                                                <button 
                                                    type="button" 
                                                    onClick={() => handleRemoveMilestone(idx)}
                                                    className="text-rose-500 hover:text-rose-700 text-xs font-bold transition-colors"
                                                >
                                                    Xóa
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <div className="md:col-span-2">
                                                <input 
                                                    type="text" 
                                                    value={milestone.title}
                                                    onChange={(e) => handleMilestoneChange(idx, 'title', e.target.value)}
                                                    placeholder="Tên mốc (ví dụ: Bàn giao thiết kế Figma)"
                                                    className="w-full px-3 py-1.5 border border-slate-250 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <input 
                                                    type="number" 
                                                    value={milestone.amount}
                                                    onChange={(e) => handleMilestoneChange(idx, 'amount', e.target.value)}
                                                    placeholder="Số tiền (VNĐ)"
                                                    className="w-full px-3 py-1.5 border border-slate-250 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <div className="md:col-span-2">
                                                <input 
                                                    type="text" 
                                                    value={milestone.description}
                                                    onChange={(e) => handleMilestoneChange(idx, 'description', e.target.value)}
                                                    placeholder="Mô tả công việc cần làm ở mốc này"
                                                    className="w-full px-3 py-1.5 border border-slate-250 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <input 
                                                    type="date" 
                                                    value={milestone.dueDate}
                                                    onChange={(e) => handleMilestoneChange(idx, 'dueDate', e.target.value)}
                                                    className="w-full px-3 py-1.5 border border-slate-250 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Live Budget Counter */}
                            <div className={`p-4 rounded-xl border flex justify-between items-center text-xs font-bold ${
                                isSumMatch ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'
                            }`}>
                                <span>Đã phân chia: {sumAmounts.toLocaleString('vi-VN')} VNĐ / {bidAmount.toLocaleString('vi-VN')} VNĐ</span>
                                {isSumMatch ? (
                                    <span className="flex items-center gap-1">
                                        <Check className="w-4.5 h-4.5 text-emerald-600" /> Ngân sách hợp lệ
                                    </span>
                                ) : (
                                    <span>
                                        {diffAmount > 0 
                                            ? `Còn thiếu: ${diffAmount.toLocaleString('vi-VN')} VNĐ` 
                                            : `Dư: ${Math.abs(diffAmount).toLocaleString('vi-VN')} VNĐ`}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50 rounded-b-2xl">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 border border-slate-250 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-all text-xs"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading || (payOption === 'split' && !isSumMatch)}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 text-xs shadow-sm"
                    >
                        {loading ? 'Đang giao việc...' : 'Xác nhận & Giao việc'}
                    </button>
                </div>
            </div>
        </div>
    );
}

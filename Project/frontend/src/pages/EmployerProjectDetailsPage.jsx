import React, { useState, useEffect } from 'react';
import { 
    ArrowLeft, 
    Calendar, 
    DollarSign, 
    FileText, 
    Check, 
    X, 
    Clock, 
    Briefcase,
    User,
    CheckCircle2,
    XCircle,
    Loader2,
    Users,
    ChevronRight
} from 'lucide-react';
import { contractApi } from '../api/contractApi';
import { api } from '../api/apiClient';
import MilestoneSetupModal from '../components/MilestoneSetupModal.jsx';

export default function EmployerProjectDetailsPage({ projectId, initialTab, user, onNavigate }) {
    const [project, setProject] = useState(null);
    const [proposals, setProposals] = useState([]);
    const [contract, setContract] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingProposals, setLoadingProposals] = useState(false);
    const [loadingContract, setLoadingContract] = useState(false);
    const [error, setError] = useState(null);
    const [notice, setNotice] = useState(null);
    const [activeTab, setActiveTab] = useState(initialTab || 'proposals'); // 'proposals', 'progress', 'details'
    const [selectedProposalForAccept, setSelectedProposalForAccept] = useState(null);

    const fetchProjectDetails = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await api.get(`/projects/${projectId}`);
            setProject(data);

            // Fetch proposals
            fetchProposals();

            // Fetch contract if project is active or closed
            if (data.status === 'IN_PROGRESS' || data.status === 'CLOSED') {
                fetchContractDetails();
            }
        } catch (err) {
            setError(err.message || 'Không thể tải thông tin dự án.');
        } finally {
            setLoading(false);
        }
    };

    const fetchProposals = async () => {
        try {
            setLoadingProposals(true);
            const data = await api.get(`/proposals/project/${projectId}?userId=${user.id}&role=EMPLOYER`);
            setProposals(data || []);
        } catch (err) {
            console.error("Error fetching proposals:", err);
        } finally {
            setLoadingProposals(false);
        }
    };

    const fetchContractDetails = async () => {
        try {
            setLoadingContract(true);
            const data = await contractApi.getContractByProjectId(projectId, user.id);
            setContract(data);
        } catch (err) {
            console.error("Error fetching contract:", err);
        } finally {
            setLoadingContract(false);
        }
    };

    useEffect(() => {
        if (projectId && user) {
            fetchProjectDetails();
        }
    }, [projectId, user]);

    const handleAcceptSuccess = () => {
        setSelectedProposalForAccept(null);
        setNotice({ type: 'success', message: 'Tuyển dụng Freelancer thành công! Hợp đồng đã được tạo và bắt đầu thực hiện.' });
        fetchProjectDetails();
        setActiveTab('progress');
    };

    if (loading) {
        return (
            <div className="pt-28 pb-16 min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
                <span className="text-sm font-semibold">Đang tải chi tiết dự án...</span>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="pt-28 pb-16 min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-md w-full text-center">
                    <XCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                    <h3 className="font-extrabold text-slate-900 text-lg mb-2">Đã xảy ra lỗi</h3>
                    <p className="text-sm text-slate-500 mb-6">{error || 'Không tìm thấy dữ liệu dự án.'}</p>
                    <button
                        onClick={() => onNavigate('employer_jobs')}
                        className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition-colors"
                    >
                        Quay lại danh sách dự án
                    </button>
                </div>
            </div>
        );
    }

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
        <div className="pt-28 pb-16 bg-slate-50 min-h-screen font-sans antialiased text-slate-900">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                
                {/* Back Button */}
                <button
                    onClick={() => onNavigate('employer_jobs')}
                    className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors mb-6"
                >
                    <ArrowLeft className="w-4 h-4" /> Quay lại danh sách quản lý
                </button>

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

                {/* Project Header Info Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-extrabold uppercase bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">
                                {project.categoryName || 'General'}
                            </span>
                            <span className={`text-[10px] font-extrabold uppercase border px-2.5 py-0.5 rounded-md ${statusColors[project.servicePackage] || 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                Gói dịch vụ: {project.servicePackage}
                            </span>
                            <span className={`text-[10px] font-extrabold uppercase border px-2.5 py-0.5 rounded-md ${statusColors[project.status] || 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                {statusLabels[project.status] || project.status}
                            </span>
                        </div>
                        <h2 className="text-xl font-extrabold text-slate-950 tracking-tight leading-snug">
                            {project.title}
                        </h2>
                        <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" /> Hạn: {project.deadline ? new Date(project.deadline).toLocaleDateString('vi-VN') : 'Không giới hạn'}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" /> Đăng: {project.createdAt || 'Hôm nay'}
                            </span>
                        </div>
                    </div>

                    <div className="text-left md:text-right shrink-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ngân sách dự án</p>
                        <p className="text-lg font-black text-slate-900 mt-0.5">
                            {project.budgetFixed 
                                ? `${Number(project.budgetFixed).toLocaleString('vi-VN')} VNĐ`
                                : `${Number(project.budgetMin).toLocaleString('vi-VN')} - ${Number(project.budgetMax).toLocaleString('vi-VN')} VNĐ`
                            }
                        </p>
                    </div>
                </div>

                {/* Tabs & Workspace Content */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                    
                    {/* Navigation Sidebar */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-3 mb-2">Không gian dự án</span>
                        {[
                            { value: 'proposals', label: `Hồ sơ ứng tuyển (${proposals.length})`, icon: Users },
                            { value: 'progress', label: 'Hợp đồng & Tiến độ', icon: Briefcase },
                            { value: 'details', label: 'Mô tả chi tiết tuyển dụng', icon: FileText }
                        ].map((tab) => {
                            const TabIcon = tab.icon;
                            const isActive = activeTab === tab.value;
                            return (
                                <button
                                    key={tab.value}
                                    onClick={() => setActiveTab(tab.value)}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                        isActive 
                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10' 
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                                >
                                    <TabIcon className="w-4 h-4" />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Content Area */}
                    <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm min-h-[50vh]">
                        
                        {/* 1. Proposals Tab */}
                        {activeTab === 'proposals' && (
                            <div className="space-y-6">
                                <div className="border-b border-slate-100 pb-4">
                                    <h3 className="font-extrabold text-slate-900 text-base">Hồ sơ thầu ứng tuyển từ Freelancer</h3>
                                    <p className="text-xs text-slate-500 mt-1">Duyệt hồ sơ đề xuất của các freelancer, liên hệ trao đổi thầu hoặc giao việc trực tiếp.</p>
                                </div>

                                {loadingProposals ? (
                                    <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
                                        <Loader2 className="w-6 h-6 animate-spin text-cyan-600" />
                                        <span className="text-xs font-semibold">Đang tải báo giá...</span>
                                    </div>
                                ) : proposals.length === 0 ? (
                                    <div className="py-16 text-center text-slate-400 text-xs">
                                        Chưa có Freelancer nào gửi đề xuất báo giá thầu cho dự án này.
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {proposals.map((prop) => (
                                            <div key={prop.proposalId} className="border border-slate-150 rounded-xl p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors text-left relative">
                                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
                                                    <div className="flex items-center gap-3">
                                                        {prop.freelancerAvatar ? (
                                                            <img
                                                                src={prop.freelancerAvatar}
                                                                alt={prop.freelancerName}
                                                                className="w-10 h-10 rounded-full object-cover border border-slate-200"
                                                            />
                                                        ) : (
                                                            <div className="w-10 h-10 bg-blue-100 text-blue-600 font-bold rounded-full flex items-center justify-center text-sm">
                                                                {prop.freelancerName.charAt(0)}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <h4 className="font-bold text-sm text-slate-900">{prop.freelancerName}</h4>
                                                            <p className="text-[11px] text-slate-400 font-medium">{prop.freelancerTitle || 'Freelancer tự do'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-left sm:text-right shrink-0">
                                                        <p className="text-sm font-extrabold text-emerald-600">
                                                            {Number(prop.bidAmount).toLocaleString('vi-VN')} VNĐ
                                                        </p>
                                                        <p className="text-[10px] text-slate-400 font-bold">Thời gian: {prop.estimatedDays} ngày</p>
                                                    </div>
                                                </div>
                                                <div className="text-xs text-slate-650 bg-white border border-slate-100 rounded-lg p-3 leading-relaxed whitespace-pre-line text-left mb-3">
                                                    {prop.coverLetter}
                                                </div>
                                                {prop.cvUrl && (
                                                    <div className="mb-3">
                                                        <a 
                                                            href={prop.cvUrl} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg border border-blue-100 transition-colors"
                                                        >
                                                            <FileText className="w-3.5 h-3.5" />
                                                            <span>Đọc CV ứng viên (PDF)</span>
                                                        </a>
                                                    </div>
                                                )}
                                                
                                                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                                    {prop.status === 'SUBMITTED' ? (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => onNavigate('messenger', {
                                                                    id: prop.freelancerId,
                                                                    role: 'FREELANCER',
                                                                    name: prop.freelancerName,
                                                                    avatar: prop.freelancerAvatar
                                                                })}
                                                                className="px-3.5 py-1.5 rounded-lg text-slate-700 bg-white border border-slate-250 hover:bg-slate-50 text-xs font-bold transition-all"
                                                            >
                                                                Chat trao đổi
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setSelectedProposalForAccept(prop)}
                                                                className="px-4 py-1.5 rounded-lg text-white bg-blue-600 hover:bg-blue-700 text-xs font-bold shadow-sm transition-all"
                                                            >
                                                                Chấp nhận giao việc
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                                            prop.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                                        }`}>
                                                            {prop.status === 'ACCEPTED' ? 'Đã giao việc thành công' : 'Đã từ chối'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 2. Progress Tab */}
                        {activeTab === 'progress' && (
                            <div className="space-y-6">
                                <div className="border-b border-slate-100 pb-4">
                                    <h3 className="font-extrabold text-slate-900 text-base">Hợp đồng & Tiến độ công việc</h3>
                                    <p className="text-xs text-slate-500 mt-1">Theo dõi các mốc công việc, nghiệm thu sản phẩm bàn giao từ Freelancer.</p>
                                </div>

                                {loadingContract ? (
                                    <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
                                        <Loader2 className="w-6 h-6 animate-spin text-cyan-600" />
                                        <span className="text-xs font-semibold">Đang tải hợp đồng...</span>
                                    </div>
                                ) : !contract ? (
                                    <div className="py-16 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl p-8 max-w-md mx-auto my-4">
                                        <Briefcase className="w-10 h-10 text-slate-350 mx-auto mb-3" />
                                        <h4 className="font-bold text-slate-800 text-xs mb-1">Dự án chưa có tiến độ</h4>
                                        <p className="text-[11px] text-slate-500 leading-normal mb-5">
                                            Dự án này chưa được giao thầu cho Freelancer. Tiến độ và các mốc công việc chỉ được tạo sau khi bạn chấp nhận một báo giá thầu.
                                        </p>
                                        <button
                                            onClick={() => setActiveTab('proposals')}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all"
                                        >
                                            Xem hồ sơ ứng viên để giao thầu
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        
                                        {/* Contract Brief Card */}
                                        <div className="border border-slate-150 rounded-xl p-5 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                            <div>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Freelancer đang đảm nhận</span>
                                                <div className="flex items-center gap-2">
                                                    {contract.freelancerAvatar ? (
                                                        <img src={contract.freelancerAvatar} alt={contract.freelancerName} className="w-8 h-8 rounded-full object-cover" />
                                                    ) : (
                                                        <div className="w-8 h-8 bg-blue-50 text-blue-600 font-bold rounded-full flex items-center justify-center text-xs">
                                                            {contract.freelancerName.charAt(0)}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <h4 className="font-bold text-sm text-slate-900">{contract.freelancerName}</h4>
                                                        <span className="text-[10px] text-slate-400">{contract.freelancerTitle || 'Freelancer tự do'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-left sm:text-right shrink-0">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Ngân sách hợp đồng</p>
                                                <p className="text-base font-black text-emerald-600">{Number(contract.agreedAmount).toLocaleString('vi-VN')} VNĐ</p>
                                                <button
                                                    onClick={() => onNavigate('contract_details', { contractId: contract.contractId })}
                                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 mt-1"
                                                >
                                                    Đến trang Quản lý tiến độ riêng <ChevronRight className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Milestones List */}
                                        <div className="space-y-4 text-left">
                                            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Các mốc công việc ({contract.milestones ? contract.milestones.length : 0})</h4>
                                            
                                            {(!contract.milestones || contract.milestones.length === 0) ? (
                                                <p className="text-xs text-slate-400 italic">Không có mốc công việc nào.</p>
                                            ) : (
                                                <div className="space-y-3">
                                                    {contract.milestones.map((m, idx) => {
                                                        const milestoneStatusLabels = {
                                                            PENDING: 'Chờ duyệt thầu',
                                                            PROCESSING: 'Đang thực hiện',
                                                            SUBMITTED: 'Chờ nghiệm thu',
                                                            APPROVED: 'Hoàn thành / Giải ngân'
                                                        };
                                                        const milestoneStatusColors = {
                                                            PENDING: 'bg-slate-100 text-slate-655 border-slate-200',
                                                            PROCESSING: 'bg-blue-50 text-blue-755 border-blue-200',
                                                            SUBMITTED: 'bg-amber-50 text-amber-755 border-amber-200',
                                                            APPROVED: 'bg-emerald-50 text-emerald-755 border-emerald-200'
                                                        };

                                                        return (
                                                            <div key={m.milestoneId} className="border border-slate-100 bg-white rounded-xl p-4 hover:shadow-sm transition-all flex flex-col sm:flex-row justify-between items-start gap-4">
                                                                <div className="space-y-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-bold text-slate-900 text-xs">Mốc {idx + 1}: {m.title}</span>
                                                                        <span className={`text-[9px] font-bold uppercase border px-2 py-0.5 rounded ${milestoneStatusColors[m.status] || 'bg-slate-100'}`}>
                                                                            {milestoneStatusLabels[m.status] || m.status}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-xs text-slate-500">{m.description || 'Không có mô tả'}</p>
                                                                    <p className="text-[10px] text-slate-400 font-semibold">
                                                                        Hạn hoàn thành: {m.dueDate ? new Date(m.dueDate).toLocaleDateString('vi-VN') : 'Không có'}
                                                                    </p>
                                                                </div>
                                                                <div className="text-left sm:text-right shrink-0">
                                                                    <p className="text-xs font-black text-slate-800">{Number(m.amount).toLocaleString('vi-VN')} VNĐ</p>
                                                                    
                                                                    {m.status === 'SUBMITTED' && (
                                                                        <button
                                                                            onClick={() => onNavigate('contract_details', { contractId: contract.contractId })}
                                                                            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold rounded-lg transition-colors mt-2"
                                                                        >
                                                                            Xem và Nghiệm thu
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                    </div>
                                )}
                            </div>
                        )}

                        {/* 3. Job Details Tab */}
                        {activeTab === 'details' && (
                            <div className="space-y-6">
                                <div className="border-b border-slate-100 pb-4">
                                    <h3 className="font-extrabold text-slate-900 text-base">Thông tin tuyển dụng chi tiết</h3>
                                    <p className="text-xs text-slate-500 mt-1">Xem lại đầy đủ yêu cầu công việc đã được đăng tin công khai.</p>
                                </div>

                                <div className="space-y-5 text-left">
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-450 uppercase tracking-wider mb-2">Mô tả công việc</h4>
                                        <div className="text-xs text-slate-700 leading-relaxed bg-slate-50/50 rounded-xl p-4 border border-slate-100 whitespace-pre-line">
                                            {project.description}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-450 uppercase tracking-wider mb-1.5">Hình thức làm việc</h4>
                                            <span className="inline-flex px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold">
                                                {project.workForm === 'ONLINE' ? 'Làm việc online' : 'Làm việc tại văn phòng'}
                                            </span>
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-455 uppercase tracking-wider mb-1.5">Loại ngân sách</h4>
                                            <span className="inline-flex px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold">
                                                {project.projectType === 'FIXED_PRICE' || project.projectType === 'FIXED' ? 'Ngân sách cố định' : 'Ngân sách trong khoảng'}
                                            </span>
                                        </div>
                                    </div>

                                    {project.skills && project.skills.length > 0 && (
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-455 uppercase tracking-wider mb-2">Kỹ năng yêu cầu</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {project.skills.map(skill => (
                                                    <span key={skill} className="px-2.5 py-1 bg-blue-50 border border-blue-100 text-blue-700 rounded-lg text-xs font-bold uppercase">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {selectedProposalForAccept && (
                <MilestoneSetupModal
                    proposal={selectedProposalForAccept}
                    employerId={user.id}
                    onClose={() => setSelectedProposalForAccept(null)}
                    onSuccess={handleAcceptSuccess}
                />
            )}
        </div>
    );
}

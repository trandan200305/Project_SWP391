import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  DollarSign,
  FileCheck,
  Star,
  Plus,
  Search,
  MessageSquare,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  TrendingUp,
  Award,
  AlertCircle,
  Paperclip,
  Download,
  Loader2,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { api } from '../api/apiClient';
import { getImageUrl, getFilenameFromUrl } from '../utils/imageHelper';

export default function EmployerDashboardPage({ user, onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);

  // Review deliverable modal states
  const [reviewModalData, setReviewModalData] = useState(null); // deliverable object being reviewed
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const employerId = user?.employerId || user?.id;

  const fetchDashboardData = async () => {
    if (!employerId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.get(`/employers/${employerId}/dashboard`);
      setDashboardData(data);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err.message || "Không thể tải dữ liệu dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [employerId]);

  const handleReviewDeliverable = async (approve) => {
    if (!reviewModalData) return;
    setSubmittingReview(true);
    try {
      const url = `/deliverables/${reviewModalData.deliverable_id}/review?employerId=${employerId}&approve=${approve}${reviewFeedback ? `&feedback=${encodeURIComponent(reviewFeedback)}` : ''}`;
      await api.post(url, {});

      setActionNotice({
        type: 'success',
        message: approve ? 'Đã duyệt sản phẩm thành công!' : 'Đã gửi yêu cầu chỉnh sửa sản phẩm cho Freelancer!'
      });

      setReviewModalData(null);
      setReviewFeedback('');
      // Refresh dashboard data
      fetchDashboardData();
    } catch (err) {
      setActionNotice({
        type: 'error',
        message: err.message || 'Có lỗi xảy ra khi xử lý duyệt sản phẩm.'
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0 ₫';
    return Number(amount).toLocaleString('vi-VN') + ' ₫';
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'KIM CƯƠNG': return 'from-cyan-500 to-blue-600 text-white';
      case 'VÀNG': return 'from-amber-400 to-yellow-600 text-white';
      case 'BẠC': return 'from-slate-300 to-slate-500 text-white';
      default: return 'from-amber-700 to-amber-900 text-white'; // ĐỒNG
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto" />
          <p className="text-slate-600 font-medium animate-pulse">Đang tải trang Dashboard tổng quan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-red-100">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">Không thể tải thông tin</h3>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition shadow-lg shadow-indigo-200"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const {
    displayName,
    companyName,
    avatarUrl,
    companyLogoUrl,
    totalSpent = 0,
    tier = 'ĐỒNG',
    runningProjects = [],
    runningProjectsCount = 0,
    completedProjectsCount = 0,
    completedProjectsSpent = 0,
    pendingDeliverables = [],
    pendingDeliverablesCount = 0,
    favoriteFreelancers = [],
    favoriteFreelancersCount = 0,
    isRecommendation = false,
    recentTransactions = []
  } = dashboardData || {};

  const effectiveCompanyLogo = companyLogoUrl || avatarUrl;

  return (
    <div className="min-h-screen bg-slate-50/80 pb-16">
      {/* Toast Notice */}
      {actionNotice && (
        <div className={`fixed top-5 right-5 z-50 p-4 rounded-xl shadow-2xl flex items-center gap-3 border transition-all ${
          actionNotice.type === 'success' 
            ? 'bg-emerald-900/90 text-white border-emerald-500' 
            : 'bg-red-900/90 text-white border-red-500'
        }`}>
          {actionNotice.type === 'success' ? <CheckCircle2 className="w-6 h-6 text-emerald-400" /> : <AlertCircle className="w-6 h-6 text-red-400" />}
          <span className="font-medium">{actionNotice.message}</span>
          <button onClick={() => setActionNotice(null)} className="ml-2 text-white/80 hover:text-white">✕</button>
        </div>
      )}

      {/* Top Welcome Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white pt-36 sm:pt-40 md:pt-44 pb-28 sm:pb-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293712_1px,transparent_1px),linear-gradient(to_bottom,#1f293712_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <img
                src={getImageUrl(effectiveCompanyLogo)}
                alt={companyName || displayName}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-4 ring-white/10 shadow-xl"
                onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(companyName || displayName || 'Company') + '&background=6366f1&color=fff'; }}
              />
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                    Chào mừng, {companyName || displayName}!
                  </h1>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${getTierColor(tier)} shadow-sm border border-white/20`}>
                    Hạng {tier}
                  </span>
                </div>
                <p className="text-slate-300 text-sm mt-1 flex items-center gap-2">
                  <span>Tổng quan hiệu suất công việc & chi tiêu tuyển dụng trên vLance</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => onNavigate('find_freelancers')}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/15 backdrop-blur-sm flex items-center gap-2 transition transform active:scale-95"
              >
                <Search className="w-5 h-5" />
                <span>Tìm Freelancer</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 sm:-mt-20 relative z-20 space-y-8">

        {/* 5 KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {/* Card 1: Dự án đang chạy */}
          <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition border border-slate-200/80 group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition duration-300">
                <Briefcase className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Đang chạy
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Đang thực hiện</p>
              <div className="flex items-baseline justify-between">
                <h3 className="text-2xl font-extrabold text-slate-900">{runningProjectsCount}</h3>
                <button
                  onClick={() => onNavigate('employer_jobs')}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 group-hover:translate-x-0.5 transition"
                >
                  Xem <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Dự án đã hoàn thành & Tổng số tiền nghiệm thu */}
          <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition border border-slate-200/80 group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-110 transition duration-300">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-100">
                {completedProjectsCount} dự án
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Dự án hoàn thành</p>
              <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-extrabold text-sky-700">{formatCurrency(completedProjectsSpent)}</h3>
                <button
                  onClick={() => onNavigate('employer_jobs')}
                  className="text-xs font-semibold text-sky-600 hover:text-sky-800 flex items-center gap-0.5 group-hover:translate-x-0.5 transition"
                >
                  Chi tiết <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Card 3: Tổng chi tiêu */}
          <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition border border-slate-200/80 group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition duration-300">
                <DollarSign className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                Tích lũy
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tổng chi tiêu lũy kế</p>
              <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-extrabold text-slate-900">{formatCurrency(totalSpent)}</h3>
                <button
                  onClick={() => onNavigate('employer_invoices')}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-0.5 group-hover:translate-x-0.5 transition"
                >
                  Hóa đơn <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Card 4: Deliverable chờ duyệt */}
          <div className={`bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition border ${pendingDeliverablesCount > 0 ? 'border-amber-300 ring-2 ring-amber-400/20' : 'border-slate-200/80'} group relative overflow-hidden`}>
            {pendingDeliverablesCount > 0 && (
              <div className="absolute top-0 right-0 w-1.5 h-full bg-amber-400 animate-pulse"></div>
            )}
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition duration-300">
                <FileCheck className="w-5 h-5" />
              </div>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${pendingDeliverablesCount > 0 ? 'bg-amber-100 text-amber-800 border border-amber-200 font-bold' : 'bg-slate-100 text-slate-600'}`}>
                {pendingDeliverablesCount > 0 ? 'Cần duyệt' : '0 mới'}
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sản phẩm chờ duyệt</p>
              <div className="flex items-baseline justify-between">
                <h3 className="text-2xl font-extrabold text-slate-900">{pendingDeliverablesCount}</h3>
                {pendingDeliverablesCount > 0 && (
                  <a
                    href="#pending-deliverables-section"
                    className="text-xs font-semibold text-amber-600 hover:text-amber-800 flex items-center gap-0.5 group-hover:translate-x-0.5 transition"
                  >
                    Duyệt <ChevronRight className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Card 5: Freelancer ưa thích / Đã hợp tác */}
          <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition border border-slate-200/80 group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center group-hover:scale-110 transition duration-300">
                <Star className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-100">
                {isRecommendation ? 'Gợi ý' : 'Đã hợp tác'}
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Freelancer ưa thích</p>
              <div className="flex items-baseline justify-between">
                <h3 className="text-2xl font-extrabold text-slate-900">{favoriteFreelancersCount}</h3>
                <button
                  onClick={() => onNavigate('find_freelancers')}
                  className="text-xs font-semibold text-violet-600 hover:text-violet-800 flex items-center gap-0.5 group-hover:translate-x-0.5 transition"
                >
                  Danh sách <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Deliverables Pending Review Section */}
        <div id="pending-deliverables-section" className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  Deliverable chờ bạn duyệt
                  {pendingDeliverablesCount > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-500 text-white">
                      {pendingDeliverablesCount}
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-500">Các sản phẩm mốc công việc Freelancer vừa bàn giao cần kiểm tra</p>
              </div>
            </div>
          </div>

          {pendingDeliverables.length === 0 ? (
            <div className="py-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-600">Không có sản phẩm nào đang chờ duyệt</p>
              <p className="text-xs text-slate-400 mt-1">Khi Freelancer nộp kết quả công việc, sản phẩm sẽ xuất hiện tại đây.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingDeliverables.map((deliv) => (
                <div key={deliv.deliverable_id} className="bg-slate-50 hover:bg-indigo-50/30 transition rounded-xl p-5 border border-slate-200 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          {deliv.contract_title || 'Hợp đồng'}
                        </span>
                        <h3 className="font-bold text-slate-900 text-base mt-1 line-clamp-1">
                          {deliv.deliverable_title || 'Mốc công việc bàn giao'}
                        </h3>
                      </div>
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 shrink-0">
                        Chờ duyệt
                      </span>
                    </div>

                    <div className="flex items-center gap-3 py-2 border-y border-slate-200/60">
                      <img
                        src={getImageUrl(deliv.freelancer_avatar)}
                        alt={deliv.freelancer_name}
                        className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-500/20"
                        onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(deliv.freelancer_name || 'Freelancer'); }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{deliv.freelancer_name}</p>
                        <p className="text-[11px] text-slate-500">Mốc: {deliv.milestone_title} ({formatCurrency(deliv.milestone_amount)})</p>
                      </div>
                    </div>

                    {deliv.notes && (
                      <p className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200/80 italic line-clamp-2">
                        "{deliv.notes}"
                      </p>
                    )}

                    {deliv.files && deliv.files.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                          <Paperclip className="w-3.5 h-3.5" /> File bàn giao ({deliv.files.length}):
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {deliv.files.map((file, idx) => (
                            <a
                              key={idx}
                              href={getImageUrl(file.file_url)}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-indigo-600 rounded-lg text-xs border border-slate-200 font-medium flex items-center gap-1.5 transition"
                            >
                              <Download className="w-3 h-3" />
                              <span className="max-w-[140px] truncate">{file.file_name || getFilenameFromUrl(file.file_url)}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      onClick={() => setReviewModalData(deliv)}
                      className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-200 transition"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Xem & Phê duyệt ngay</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Layout Grid: Running Projects (Left) + Favorite Freelancers & Transactions (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column (2 Cols): Dự án đang chạy */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Dự án đang thực hiện</h2>
                    <p className="text-xs text-slate-500">Danh sách công việc đang khởi chạy cùng Freelancer</p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('employer_jobs')}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  Quản lý tất cả <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {runningProjects.length === 0 ? (
                <div className="py-12 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-600">Chưa có dự án nào đang chạy</p>
                  <p className="text-xs text-slate-400 mt-1 mb-4">Hãy tạo dự án mới hoặc chọn đề xuất từ Freelancer để khởi chạy.</p>
                  <button
                    onClick={() => onNavigate('post_job')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow transition"
                  >
                    + Đăng dự án ngay
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {runningProjects.map((proj) => (
                    <div key={proj.project_id} className="bg-slate-50/70 hover:bg-slate-50 transition rounded-xl p-5 border border-slate-200 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                              {proj.contract_status || proj.project_status || 'ĐANG CHẠY'}
                            </span>
                            <span className="text-xs text-slate-400">ID: #{proj.project_id}</span>
                          </div>
                          <h3 className="font-bold text-slate-900 text-base mt-1 hover:text-indigo-600 transition cursor-pointer" onClick={() => onNavigate('employer_project_details', { projectId: proj.project_id })}>
                            {proj.title}
                          </h3>
                        </div>

                        <div className="text-left sm:text-right shrink-0">
                          <p className="text-xs text-slate-500">Ngân sách / Giá trị</p>
                          <p className="text-sm font-extrabold text-emerald-600">
                            {proj.agreed_amount ? formatCurrency(proj.agreed_amount) : formatCurrency(proj.budget_fixed || proj.budget_max)}
                          </p>
                        </div>
                      </div>

                      {proj.freelancer_name && (
                        <div className="flex items-center justify-between pt-3 border-t border-slate-200/60 text-xs">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={getImageUrl(proj.freelancer_avatar)}
                              alt={proj.freelancer_name}
                              className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-300"
                              onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(proj.freelancer_name); }}
                            />
                            <span className="font-semibold text-slate-700">Freelancer: {proj.freelancer_name}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onNavigate('messenger', { id: proj.freelancer_id, role: 'FREELANCER', name: proj.freelancer_name, avatarUrl: proj.freelancer_avatar })}
                              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-lg border border-slate-200 flex items-center gap-1.5 transition"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Nhắn tin</span>
                            </button>
                            <button
                              onClick={() => onNavigate('employer_project_details', { projectId: proj.project_id })}
                              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg border border-indigo-200 transition"
                            >
                              Chi tiết
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column (1 Col): Freelancer Ưa thích & Recent Spending */}
          <div className="space-y-6">

            {/* Freelancer Ưa thích / Gợi ý */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-violet-50 text-violet-600">
                    <Star className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      {isRecommendation ? 'Freelancer nổi bật' : 'Freelancer đã từng hợp tác'}
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      {isRecommendation ? 'Gợi ý ứng viên hàng đầu cho bạn' : 'Danh sách ứng viên ưu tú'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('find_freelancers')}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                >
                  Khám phá thêm
                </button>
              </div>

              <div className="space-y-4">
                {favoriteFreelancers.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">Chưa có Freelancer nào</p>
                ) : (
                  favoriteFreelancers.map((free) => (
                    <div key={free.freelancer_id} className="flex items-center justify-between gap-3 p-3 bg-slate-50/70 hover:bg-slate-50 rounded-xl border border-slate-200/70 transition">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={getImageUrl(free.avatar_url)}
                          alt={free.display_name}
                          className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                          onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(free.display_name); }}
                        />
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-slate-900 truncate hover:text-indigo-600 cursor-pointer" onClick={() => onNavigate('freelancer_profile', { freelancerId: free.freelancer_id })}>
                            {free.display_name}
                          </h4>
                          <p className="text-[11px] text-slate-500 truncate">{free.professional_title || 'Freelancer Professional'}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-0.5 text-[11px] font-bold text-amber-600">
                              ★ {free.average_rating ? Number(free.average_rating).toFixed(1) : '5.0'}
                            </span>
                            {free.total_contracts > 0 && (
                              <span className="text-[10px] text-slate-400">• {free.total_contracts} hợp đồng</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => onNavigate('messenger', { id: free.freelancer_id, role: 'FREELANCER', name: free.display_name, avatarUrl: free.avatar_url })}
                        title="Gửi tin nhắn"
                        className="p-2 bg-white hover:bg-indigo-600 hover:text-white text-indigo-600 rounded-lg border border-slate-200 transition shadow-sm shrink-0"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Transactions Log */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Chi tiêu gần đây</h2>
                    <p className="text-[11px] text-slate-500">Lịch sử giao dịch mới nhất</p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('employer_invoices')}
                  className="text-[11px] font-bold text-emerald-600 hover:text-emerald-800"
                >
                  Xem tất cả
                </button>
              </div>

              <div className="space-y-3">
                {recentTransactions.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">Chưa phát sinh giao dịch nào</p>
                ) : (
                  recentTransactions.map((tx) => (
                    <div key={tx.transactionId} className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <p className="font-bold text-slate-800">{tx.packageType || 'Thanh toán dự án'}</p>
                        <p className="text-[10px] text-slate-400">{tx.txnRef} • {tx.paymentMethod}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-extrabold text-slate-900">{formatCurrency(tx.amount)}</p>
                        <span className={`text-[10px] font-bold ${tx.status === 'SUCCESS' ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {tx.status === 'SUCCESS' ? 'Thành công' : tx.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Review Deliverable Modal */}
      {reviewModalData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-5 border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-600" />
                Duyệt sản phẩm nộp
              </h3>
              <button onClick={() => setReviewModalData(null)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-xl text-xs border border-slate-200/80">
              <p><strong className="text-slate-700">Dự án:</strong> {reviewModalData.contract_title}</p>
              <p><strong className="text-slate-700">Mốc công việc:</strong> {reviewModalData.milestone_title} ({formatCurrency(reviewModalData.milestone_amount)})</p>
              <p><strong className="text-slate-700">Freelancer:</strong> {reviewModalData.freelancer_name}</p>
              {reviewModalData.notes && (
                <div className="pt-2 border-t border-slate-200">
                  <strong className="text-slate-700 block mb-1">Ghi chú của Freelancer:</strong>
                  <p className="text-slate-600 bg-white p-2.5 rounded border border-slate-200 italic">{reviewModalData.notes}</p>
                </div>
              )}

              {reviewModalData.files && reviewModalData.files.length > 0 && (
                <div className="pt-2 border-t border-slate-200 space-y-1">
                  <strong className="text-slate-700 block">File đính kèm:</strong>
                  <div className="flex flex-wrap gap-2">
                    {reviewModalData.files.map((f, i) => (
                      <a
                        key={i}
                        href={getImageUrl(f.file_url)}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-semibold rounded border border-indigo-200 flex items-center gap-1 hover:underline"
                      >
                        <Download className="w-3 h-3" /> {f.file_name || 'File bàn giao'}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Phản hồi / Ghi chú bổ sung (Tùy chọn):</label>
              <textarea
                value={reviewFeedback}
                onChange={(e) => setReviewFeedback(e.target.value)}
                placeholder="Nhập phản hồi hoặc lý do nếu yêu cầu chỉnh sửa..."
                className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[90px]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                disabled={submittingReview}
                onClick={() => handleReviewDeliverable(false)}
                className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded-xl text-xs border border-red-200 transition flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                <span>Yêu cầu chỉnh sửa</span>
              </button>
              <button
                disabled={submittingReview}
                onClick={() => handleReviewDeliverable(true)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-emerald-200 transition flex items-center gap-1.5"
              >
                {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Duyệt sản phẩm</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

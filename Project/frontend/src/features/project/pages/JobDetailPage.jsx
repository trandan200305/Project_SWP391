import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Bookmark, Send, Calendar, Clock, Landmark, Loader2, UserRound, FileText, X } from 'lucide-react';
import ComingSoon from '../../../pages/ComingSoon.jsx';
import { useSavedJobs } from '../../../hooks/useSavedJobs.js';

export default function JobDetailPage({ job: initialJob, onNavigate, user }) {
  const [job, setJob] = useState(initialJob);
  const [loadingJob, setLoadingJob] = useState(false);
  const [jobError, setJobError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const { savedJobs, saveJob, unsaveJob, isJobSaved } = useSavedJobs(user);
  const [successToast, setSuccessToast] = useState({ show: false, type: '', message: '' });

  // States for bidding / proposals
  const [hasApplied, setHasApplied] = useState(false);
  const [userProposal, setUserProposal] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyForm, setApplyForm] = useState({ bidAmount: '', estimatedDays: '', coverLetter: '' });
  const [submitting, setSubmitting] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [cvUrl, setCvUrl] = useState('');
  const [uploadingCv, setUploadingCv] = useState(false);
  const [cvFileName, setCvFileName] = useState('');

  // Fetch full details of the project by ID
  useEffect(() => {
    if (initialJob && initialJob.id) {
      setLoadingJob(true);
      fetch(`http://localhost:8080/api/projects/${initialJob.id}`)
        .then((res) => {
          if (!res.ok) throw new Error('Không thể tải chi tiết công việc.');
          return res.json();
        })
        .then((data) => {
          setJob(data);
          setJobError('');
        })
        .catch((err) => {
          console.error(err);
          setJobError(err.message || 'Lỗi khi tải chi tiết dự án.');
        })
        .finally(() => setLoadingJob(false));
    } else {
      setJob(initialJob);
    }
  }, [initialJob]);

  // Check if freelancer already applied
  useEffect(() => {
    if (user && user.role === 'FREELANCER' && job && job.id) {
      fetch(`http://localhost:8080/api/proposals/project/${job.id}/check?freelancerId=${user.id}`)
        .then((res) => {
          if (!res.ok) throw new Error('Lỗi kiểm tra báo giá.');
          return res.json();
        })
        .then((data) => {
          if (data) {
            setHasApplied(true);
            setUserProposal(data);
          }
        })
        .catch((err) => console.error(err));
    }
  }, [user, job]);

  if (loadingJob) {
    return (
      <div className="pt-24 pb-12 bg-slate-50 min-h-screen flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-8 h-8 text-indigo-650 animate-spin" />
        <p className="text-slate-550 text-xs">Đang tải chi tiết dự án...</p>
      </div>
    );
  }

  if (jobError || !job) {
    return (
      <div className="pt-24 pb-12 bg-slate-50 min-h-screen flex flex-col items-center justify-center gap-3">
        <p className="text-red-500 text-sm font-medium">{jobError || 'Không tìm thấy công việc.'}</p>
        <button onClick={() => onNavigate('find_jobs')} className="px-4 py-1.5 bg-indigo-50 text-indigo-650 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors">
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const handleShowComingSoon = (e) => {
    e.preventDefault();
    setShowModal(true);
  };

  const showToastNotification = (type, message = '') => {
    setSuccessToast({ show: true, type, message });
    setTimeout(() => {
      setSuccessToast({ show: false, type: '', message: '' });
    }, 5000);
  };

  const handleBookmarkClick = (e, jobToSave) => {
    e.preventDefault();
    e.stopPropagation();
    if (isJobSaved(jobToSave.id)) {
      unsaveJob(jobToSave.id);
      showToastNotification('unsave');
    } else {
      saveJob(jobToSave);
      showToastNotification('save');
    }
  };

  const handleCvUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      setApplyError('Chỉ chấp nhận file định dạng PDF.');
      return;
    }

    try {
      setUploadingCv(true);
      setApplyError('');
      
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:8080/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Tải lên CV thất bại.');
      }

      const result = await response.json();
      if (result.success) {
        setCvUrl(result.fileUrl);
        setCvFileName(file.name);
      } else {
        throw new Error(result.message || 'Tải lên CV thất bại.');
      }
    } catch (err) {
      setApplyError(err.message || 'Lỗi khi tải file lên.');
    } finally {
      setUploadingCv(false);
    }
  };

  const handleSubmitProposal = async (e) => {
    e.preventDefault();
    if (!applyForm.bidAmount || !applyForm.estimatedDays || !applyForm.coverLetter.trim()) {
      setApplyError('Vui lòng nhập đầy đủ tất cả các trường thông tin.');
      return;
    }
    const amount = parseFloat(applyForm.bidAmount);
    const days = parseInt(applyForm.estimatedDays);
    if (isNaN(amount) || amount < 100000) {
      setApplyError('Giá chào thầu tối thiểu phải từ 100.000 VNĐ.');
      return;
    }
    if (isNaN(days) || days <= 0) {
      setApplyError('Thời gian hoàn thành phải lớn hơn 0.');
      return;
    }

    setSubmitting(true);
    setApplyError('');

    try {
      const response = await fetch(`http://localhost:8080/api/proposals/project/${job.id}?freelancerId=${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bidAmount: amount,
          estimatedDays: days,
          coverLetter: applyForm.coverLetter.trim(),
          cvUrl: cvUrl
        })
      });

      if (!response.ok) {
        const errMsg = await response.text();
        throw new Error(errMsg || 'Nộp báo giá thầu thất bại.');
      }

      const result = await response.json();
      setHasApplied(true);
      setUserProposal(result);
      setShowApplyModal(false);
      setCvUrl('');
      setCvFileName('');
      showToastNotification('apply_success', 'Đã nộp đề xuất báo giá thầu thành công!');
    } catch (err) {
      setApplyError(err.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
  };

  const formatBudget = (min, max, fixed) => {
    if (fixed) return formatCurrency(fixed);
    if (min && max) return `${formatCurrency(min)} - ${formatCurrency(max)}`;
    if (min) return `${formatCurrency(min)}`;
    return 'Thỏa thuận';
  };

  const formatDeadline = (deadlineDate) => {
    if (!deadlineDate) return 'Chưa xác định';
    const now = new Date();
    const deadline = new Date(deadlineDate);
    const diffMs = deadline - now;
    if (diffMs <= 0) return 'Đã hết hạn';
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffDays > 0) return `${diffDays} ngày ${diffHours} giờ`;
    return `${diffHours} giờ ${diffMinutes} phút`;
  };

  
  const createdAt = job.createdAt || '07/06/2026, 16:33';
  const location = job.location || 'TP. Hồ Chí Minh';
  const workFormRaw = job.workForm || 'ONLINE';
  const workForm = workFormRaw === 'ONLINE' ? 'Làm Online (Từ xa)' : workFormRaw === 'OFFLINE' ? 'Làm Offline (Tại chỗ)' : workFormRaw;
  const paymentType = job.paymentType || 'Trả theo dự án';
  
  const employerLocation = job.employerLocation || 'TP. Hồ Chí Minh';
  const employerJoinDate = job.employerJoinDate || '07/06/2026';
  const employerJobsPosted = job.employerJobsPosted !== undefined ? `${job.employerJobsPosted} việc đã đăng` : '1 việc đã đăng';
  const skills = job.skills || [];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pt-20">
      {/* Breadcrumb Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="text-sm flex items-center gap-2 text-slate-500">
            <button onClick={() => onNavigate('find_jobs')} className="font-bold text-slate-600 hover:text-slate-900">
              Việc làm
            </button>
            <span>›</span>
            <button 
              onClick={() => onNavigate('find_jobs', { category: job.categoryId || 'all' })} 
              className="font-bold text-slate-600 hover:text-slate-900"
            >
              {job.categoryName || 'Thiết kế'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          
          {/* Left Column: Job Details */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-start gap-4 mb-6">
              <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight leading-tight">
                {job.title}
              </h1>
              <button 
                onClick={(e) => handleBookmarkClick(e, job)} 
                className={`p-2 rounded-xl border transition-all ${isJobSaved(job.id) ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-white text-slate-400 border-slate-200 hover:text-slate-600 hover:bg-slate-50'}`}
                title={isJobSaved(job.id) ? 'Bỏ lưu' : 'Lưu công việc'}
              >
                <Bookmark className={`w-5 h-5 ${isJobSaved(job.id) ? 'fill-current' : ''}`} />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-sm text-slate-600 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0" />
              <span>Lĩnh vực: <strong className="text-slate-900">{job.categoryName || 'Thiết kế'}</strong>. Bạn muốn ứng tuyển dự án này? Hãy chào giá ở cột bên phải.</span>
            </div>

            <div className="text-slate-700 leading-relaxed mb-8 whitespace-pre-line text-sm">
              {job.description || "Chưa có mô tả công việc"}
            </div>

            {/* Kỹ năng yêu cầu */}
            {skills && skills.length > 0 && (
              <div className="mb-8 pt-6 border-t border-slate-200">
                <h3 className="font-bold text-slate-800 text-sm mb-3">Kỹ năng yêu cầu</h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map(skill => (
                    <span key={skill} className="px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold uppercase">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button onClick={handleShowComingSoon} className="inline-flex items-center gap-2 text-rose-600 text-xs font-bold hover:underline">
              <AlertTriangle className="w-3.5 h-3.5" />
              Phản ánh công việc này
            </button>
          </div>

          {/* Right Column: Sidebar */}
          <div className="space-y-6">

            {/* Bidding Actions Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="font-extrabold text-base text-slate-900 mb-4 pb-2 border-b border-slate-150">Chào giá thầu</h3>
              
              {!user ? (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 leading-relaxed">Đăng nhập tài khoản Freelancer của bạn để nộp đề xuất báo giá thầu cho dự án này.</p>
                  <button 
                    onClick={() => onNavigate('login')}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl transition-all text-xs"
                  >
                    Đăng nhập để ứng tuyển
                  </button>
                </div>
              ) : user.role === 'FREELANCER' ? (
                hasApplied ? (
                  <div className="space-y-4 bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Đã nộp báo giá thành công</span>
                    </div>
                    <div className="space-y-2 text-xs text-slate-600 border-t border-emerald-200/50 pt-2.5">
                      <div className="flex justify-between">
                        <span>Giá chào:</span>
                        <strong className="text-slate-900">{formatCurrency(userProposal?.bidAmount)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Thời gian:</span>
                        <strong className="text-slate-900">{userProposal?.estimatedDays} ngày</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Trạng thái:</span>
                        <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                          userProposal?.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                          userProposal?.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {userProposal?.status === 'ACCEPTED' ? 'Được chọn' :
                           userProposal?.status === 'REJECTED' ? 'Từ chối' : 'Chờ phản hồi'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Nộp thầu trực tiếp mức giá và thời gian hoàn thành dự kiến của bạn cho Nhà tuyển dụng.
                    </p>
                    <button 
                      onClick={() => {
                        setApplyError('');
                        setApplyForm({ bidAmount: job.budgetFixed || '', estimatedDays: '', coverLetter: '' });
                        setShowApplyModal(true);
                      }}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl transition-all text-xs flex items-center justify-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Nộp hồ sơ ứng tuyển
                    </button>
                  </div>
                )
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <p className="text-xs text-slate-500 font-semibold">Tài khoản {user.role} không thể ứng tuyển. Vui lòng dùng tài khoản Freelancer.</p>
                </div>
              )}
            </div>
            
            {/* Project Info Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="font-extrabold text-base text-slate-900 mb-4 pb-2 border-b border-slate-150">Thông tin dự án</h3>
              <div className="space-y-3 text-xs">

                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Ngày đăng</span>
                  <span className="font-bold text-slate-700">{createdAt}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Thời hạn</span>
                  <span className="font-bold text-slate-700">{formatDeadline(job.deadline)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Địa điểm</span>
                  <span className="font-bold text-slate-700">{location}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Ngân sách</span>
                  <span className="font-bold text-indigo-600">{formatBudget(job.budgetMin, job.budgetMax, job.budgetFixed)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Hình thức làm việc</span>
                  <span className="font-bold text-slate-700">{workForm}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Hình thức trả lương</span>
                  <span className="font-bold text-slate-700">{paymentType}</span>
                </div>
              </div>
            </div>

            {/* Client Info Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="font-extrabold text-base text-slate-900 mb-5 pb-2 border-b border-slate-150">Khách hàng</h3>
              
              <div className="flex items-center gap-3 mb-4">
                {job.employerAvatar ? (
                  <img src={job.employerAvatar} alt={job.employerName} className="w-12 h-12 rounded-full object-cover border border-slate-200" />
                ) : (
                  <div className="w-12 h-12 bg-slate-200 border border-slate-300 rounded-full flex items-center justify-center text-slate-500">
                    <UserRound className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1">
                    <button onClick={handleShowComingSoon} className="font-bold text-slate-900 hover:text-indigo-600 text-sm hover:underline text-left">
                      {job.employerName || 'Khách hàng'}
                    </button>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  </div>
                  <span className="text-[11px] text-slate-500 block">{employerLocation}</span>
                </div>
              </div>

              <div className="space-y-2 text-xs border-t border-slate-100 pt-4">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tham gia</span>
                  <span className="font-semibold text-slate-700">{employerJoinDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Đã đăng tuyển</span>
                  <span className="font-semibold text-slate-700">{employerJobsPosted}</span>
                </div>
              </div>

              <button 
                onClick={handleShowComingSoon}
                className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl transition-all text-xs"
              >
                Liên hệ trực tiếp
              </button>
            </div>

          </div>
        </div>
      </main>

      {showModal && <ComingSoon isPopup={true} onClose={() => setShowModal(false)} />}
      
      {/* Submit Proposal Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg border border-slate-200 shadow-xl p-6 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-150">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Landmark className="w-4.5 h-4.5 text-slate-600" />
                Nộp hồ sơ ứng tuyển
              </h3>
              <button onClick={() => { setShowApplyModal(false); setCvUrl(''); setCvFileName(''); }} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-550 mb-5 leading-relaxed">
              Bạn đang ứng tuyển vào dự án: <strong className="text-slate-800">{job.title}</strong>
            </p>

            {applyError && (
              <div className="mb-4 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold p-3 rounded-xl">
                ⚠️ {applyError}
              </div>
            )}

            <form onSubmit={handleSubmitProposal} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Giá chào thầu (VND) *</span>
                  <input 
                    type="number"
                    required
                    min="100000"
                    placeholder="VD: 5000000"
                    value={applyForm.bidAmount}
                    onChange={(e) => setApplyForm(prev => ({ ...prev, bidAmount: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none transition focus:border-indigo-600 focus:bg-white"
                  />
                </label>
                <label className="block">
                  <span className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Thời gian (Ngày) *</span>
                  <input 
                    type="number"
                    required
                    min="1"
                    placeholder="VD: 7"
                    value={applyForm.estimatedDays}
                    onChange={(e) => setApplyForm(prev => ({ ...prev, estimatedDays: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none transition focus:border-indigo-600 focus:bg-white"
                  />
                </label>
              </div>

              <label className="block">
                <span className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Thư giới thiệu *</span>
                <textarea 
                  required
                  rows="4"
                  placeholder="Giới thiệu ngắn gọn năng lực và phương án triển khai dự án này..."
                  value={applyForm.coverLetter}
                  onChange={(e) => setApplyForm(prev => ({ ...prev, coverLetter: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none transition focus:border-indigo-600 focus:bg-white resize-none"
                />
              </label>

              <div className="block">
                <span className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Tải lên hồ sơ CV (PDF) *</span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl cursor-pointer text-xs font-bold transition-all">
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>Chọn file PDF</span>
                    <input 
                      type="file" 
                      accept=".pdf" 
                      onChange={handleCvUpload} 
                      className="hidden" 
                      required={!cvUrl}
                    />
                  </label>
                  {uploadingCv && <span className="text-xs text-slate-400 animate-pulse">Đang tải lên...</span>}
                  {cvFileName && (
                    <span className="text-xs font-semibold text-slate-600 truncate max-w-[200px]">
                      {cvFileName} (Đã tải)
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowApplyModal(false);
                    setCvUrl('');
                    setCvFileName('');
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  {submitting && <Loader2 className="w-3 h-3 animate-spin" />}
                  {submitting ? 'Đang nộp...' : 'Gửi báo giá'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Toast Notification */}
      {successToast.show && (
        <div className="fixed bottom-6 right-6 bg-slate-800 text-white px-5 py-3.5 rounded-xl shadow-lg flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <CheckCircle2 className="w-5 h-5 text-green-400 fill-green-400" />
          <span className="font-medium text-sm">
            {successToast.message || (successToast.type === 'save' ? 'Đã lưu việc làm thành công!' : 'Đã bỏ lưu việc làm')}
          </span>
        </div>
      )}
    </div>
  );
}

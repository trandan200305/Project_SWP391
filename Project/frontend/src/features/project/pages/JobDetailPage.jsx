import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Bookmark, Send, Calendar, Clock, Landmark, Loader2 } from 'lucide-react';
import ComingSoon from '../../../pages/ComingSoon.jsx';
import { useSavedJobs } from '../../../hooks/useSavedJobs.js';

export default function JobDetailPage({ job, onNavigate, user }) {
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

  // Check if freelancer already applied
  useEffect(() => {
    if (user && user.role === 'FREELANCER' && job) {
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

  if (!job) {
    return (
      <div className="pt-24 pb-12 bg-slate-50 min-h-screen flex justify-center">
        <p>Không tìm thấy công việc.</p>
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

  const handleSubmitProposal = async (e) => {
    e.preventDefault();
    if (!applyForm.bidAmount || !applyForm.estimatedDays || !applyForm.coverLetter.trim()) {
      setApplyError('Vui lòng nhập đầy đủ tất cả các trường thông tin.');
      return;
    }
    const amount = parseFloat(applyForm.bidAmount);
    const days = parseInt(applyForm.estimatedDays);
    if (isNaN(amount) || amount <= 0) {
      setApplyError('Giá chào thầu phải là số dương lớn hơn 0.');
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
          coverLetter: applyForm.coverLetter.trim()
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

  const formatBudget = (min, max) => {
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

  // Mocked data for fields not present in job object
  const createdAt = job.createdAt || '07/06/2026, 16:33';
  const location = job.location || 'TP. Hồ Chí Minh';
  const workForm = job.workForm || 'Làm online';
  const paymentType = job.paymentType || 'Trả theo dự án';
  
  const employerLocation = job.employerLocation || 'TP. Hồ Chí Minh';
  const employerJoinDate = job.employerJoinDate || '07/06/2026';
  const employerJobsPosted = job.employerJobsPosted || '1 việc';
  const skills = job.skills || ['AFTER EFFECT', 'INFOGRAPHIC', 'MOTION GRAPHIC'];

  return (
    <div className="pt-24 pb-12 bg-white min-h-screen">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Breadcrumb */}
        <div className="text-sm mb-6 flex items-center gap-2 text-slate-500">
          <button onClick={() => onNavigate('find_jobs')} className="text-blue-500 hover:underline">
            Việc làm
          </button>
          <span>›</span>
          <button 
            onClick={() => onNavigate('find_jobs', { category: job.categoryId || 'all' })} 
            className="text-blue-500 hover:underline"
          >
            {job.categoryName || 'Thiết kế'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Main Content (Left) */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-start gap-4 mb-6">
              <h1 className="text-3xl font-bold text-slate-800 leading-tight">
                {job.title}
              </h1>
              <button 
                onClick={(e) => handleBookmarkClick(e, job)} 
                className={`p-2.5 rounded-xl transition-all duration-300 shadow-sm shrink-0 border-2 ${isJobSaved(job.id) ? 'bg-yellow-400 text-white border-yellow-400' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50 hover:text-slate-600'}`}
                title={isJobSaved(job.id) ? 'Bỏ lưu' : 'Lưu công việc'}
              >
                <Bookmark className={`w-6 h-6 ${isJobSaved(job.id) ? 'fill-current' : ''}`} />
              </button>
            </div>

            <div className={`bg-slate-50 border rounded-lg p-5 mb-8 transition-colors duration-300 ${isJobSaved(job.id) ? 'border-amber-500 bg-amber-50/20' : 'border-slate-100'}`}>
              <div className="text-slate-700 font-medium mb-1">
                Mô tả công việc: <span className="text-blue-600 font-bold">{job.categoryName || 'Dựng motion video'}</span>
              </div>
              <div className="text-sm text-slate-500">
                Bạn có thể cung cấp dịch vụ này? <button onClick={handleShowComingSoon} className="text-blue-500 hover:underline">Thêm vào hồ sơ làm việc</button>.
              </div>
            </div>

            <div className="text-slate-700 leading-relaxed mb-10 whitespace-pre-line">
              {job.description || "Chưa có mô tả công việc"}
            </div>

            <button onClick={handleShowComingSoon} className="flex items-center gap-2 text-red-500 text-sm hover:underline">
              <AlertTriangle className="w-4 h-4" />
              <span>Phản ánh công việc này</span>
            </button>
          </div>

          {/* Sidebar (Right) */}
          <div className="space-y-6">

            {/* Bidding Actions Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
              <h3 className="font-bold text-lg text-slate-800 mb-4">Chào giá thầu</h3>
              
              {!user ? (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 leading-relaxed">Đăng nhập tài khoản Freelancer của bạn để nộp đề xuất báo giá thầu cho dự án này.</p>
                  <button 
                    onClick={() => onNavigate('login')}
                    className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm"
                  >
                    Đăng nhập để ứng tuyển
                  </button>
                </div>
              ) : user.role === 'FREELANCER' ? (
                hasApplied ? (
                  <div className="space-y-4 bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                      <CheckCircle2 className="w-4.5 h-4.5" />
                      <span>Đã nộp báo giá thành công</span>
                    </div>
                    <div className="space-y-1.5 text-xs text-slate-600 border-t border-emerald-100/50 pt-2.5">
                      <div className="flex justify-between">
                        <span>Giá chào:</span>
                        <span className="font-bold text-slate-800">{formatCurrency(userProposal?.bidAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Thời gian:</span>
                        <span className="font-bold text-slate-800">{userProposal?.estimatedDays} ngày</span>
                      </div>
                      <div className="flex justify-between">
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
                      className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Nộp hồ sơ ứng tuyển
                    </button>
                  </div>
                )
              ) : (
                <div className="p-3 bg-slate-50 rounded-lg text-center">
                  <p className="text-xs text-slate-500 font-medium">Bạn đang đăng nhập bằng tài khoản {user.role}. Chỉ tài khoản Freelancer mới có thể nộp báo giá.</p>
                </div>
              )}
            </div>
            
            {/* Project Info */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-lg text-slate-800 mb-5">Thông tin dự án</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">ID dự án</span>
                  <span className="font-medium text-slate-700">{job.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ngày đăng</span>
                  <span className="font-medium text-slate-700">{createdAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Thời hạn</span>
                  <span className="font-medium text-slate-700">{formatDeadline(job.deadline)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Địa điểm</span>
                  <span className="font-medium text-slate-700">{location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ngân sách</span>
                  <span className="font-medium text-slate-700">{formatBudget(job.budgetMin, job.budgetMax)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Hình thức làm việc</span>
                  <span className="font-medium text-slate-700">{workForm}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Hình thức trả lương</span>
                  <span className="font-medium text-slate-700">{paymentType}</span>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-lg text-slate-800 mb-6">Thông tin khách hàng</h3>
              
              <div className="flex flex-col items-center mb-6">
                <button onClick={handleShowComingSoon} className="mb-3 hover:opacity-90 transition-opacity">
                  {job.employerAvatar ? (
                    <img src={job.employerAvatar} alt={job.employerName} className="w-20 h-20 rounded-full object-cover shadow-sm" />
                  ) : (
                    <div className="w-20 h-20 bg-slate-300 rounded-full flex items-center justify-center text-slate-50 shadow-sm">
                      <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    </div>
                  )}
                </button>
                <div className="flex items-center gap-1.5 justify-center">
                  <button onClick={handleShowComingSoon} className="text-blue-500 font-bold hover:underline text-lg">
                    {job.employerName || 'Nguyễn Nguyễn'}
                  </button>
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                </div>
              </div>

              <div className="space-y-3 text-sm border-t border-slate-100 pt-5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Đến từ</span>
                  <span className="font-medium text-slate-700">{employerLocation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tham gia</span>
                  <span className="font-medium text-slate-700">{employerJoinDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Đã đăng</span>
                  <span className="font-medium text-blue-500">{employerJobsPosted}</span>
                </div>
              </div>

              <button 
                onClick={handleShowComingSoon}
                className="w-full mt-6 bg-[#22c55e] text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition-colors shadow-sm"
              >
                Liên hệ trực tiếp
              </button>
            </div>

          </div>
        </div>
      </div>

      {showModal && <ComingSoon isPopup={true} onClose={() => setShowModal(false)} />}
      
      {/* Submit Proposal Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg border border-slate-100 shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-200">
            <h3 className="font-extrabold text-xl text-slate-900 mb-2 flex items-center gap-2">
              <Landmark className="w-5 h-5 text-blue-600" />
              Nộp hồ sơ ứng tuyển
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Bạn đang ứng tuyển vào dự án: <strong className="text-slate-700">{job.title}</strong>
            </p>

            {applyError && (
              <div className="mb-4 bg-rose-50 text-rose-700 border border-rose-100 text-xs font-semibold p-3.5 rounded-xl">
                ⚠️ {applyError}
              </div>
            )}

            <form onSubmit={handleSubmitProposal} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="block text-[11px] font-extrabold text-slate-500 uppercase mb-1.5">Giá chào thầu (VND) *</span>
                  <input 
                    type="number"
                    required
                    min="1"
                    placeholder="VD: 5000000"
                    value={applyForm.bidAmount}
                    onChange={(e) => setApplyForm(prev => ({ ...prev, bidAmount: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white"
                  />
                </label>
                <label className="block">
                  <span className="block text-[11px] font-extrabold text-slate-500 uppercase mb-1.5">Thời gian thực hiện (Ngày) *</span>
                  <input 
                    type="number"
                    required
                    min="1"
                    placeholder="VD: 7"
                    value={applyForm.estimatedDays}
                    onChange={(e) => setApplyForm(prev => ({ ...prev, estimatedDays: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white"
                  />
                </label>
              </div>

              <label className="block">
                <span className="block text-[11px] font-extrabold text-slate-500 uppercase mb-1.5">Thư giới thiệu / Đề xuất công việc *</span>
                <textarea 
                  required
                  rows="5"
                  placeholder="Hãy giới thiệu ngắn gọn năng lực của bạn và phương án triển khai dự án này để thuyết phục Nhà tuyển dụng..."
                  value={applyForm.coverLetter}
                  onChange={(e) => setApplyForm(prev => ({ ...prev, coverLetter: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white resize-none"
                />
              </label>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold flex items-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {submitting ? 'Đang nộp...' : 'Gửi báo giá'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Toast Notification */}
      {successToast.show && (
        <div className="fixed bottom-6 right-6 bg-slate-800 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <CheckCircle2 className="w-5 h-5 text-green-400 fill-green-400" />
          <span className="font-medium text-sm">
            {successToast.message || (successToast.type === 'save' ? 'Đã lưu việc làm thành công!' : 'Đã bỏ lưu việc làm')}
          </span>
        </div>
      )}
    </div>
  );
}

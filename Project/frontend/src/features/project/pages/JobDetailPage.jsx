import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Bookmark } from 'lucide-react';
import ComingSoon from '../../../pages/ComingSoon.jsx';
import { useSavedJobs } from '../../../hooks/useSavedJobs.js';

export default function JobDetailPage({ job, onNavigate }) {
  const [showModal, setShowModal] = useState(false);
  const { savedJobs, saveJob, unsaveJob, isJobSaved } = useSavedJobs();
  const [successToast, setSuccessToast] = useState({ show: false, type: '', message: '' });

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

  const showToastNotification = (type) => {
    setSuccessToast({ show: true, type });
    setTimeout(() => {
      setSuccessToast({ show: false, type: '' });
    }, 6000);
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
      
      {/* Success Toast for Bookmark */}
      {successToast.show && (
        <div className="fixed bottom-6 right-6 bg-slate-800 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <Bookmark className={`w-5 h-5 ${successToast.type === 'save' ? 'text-yellow-400 fill-yellow-400' : 'text-amber-400 fill-amber-400'}`} />
          <span className="font-medium text-sm">
            {successToast.type === 'save' ? (
              <>
                Đã lưu việc làm{' '}
                <button 
                  onClick={() => onNavigate('your_jobs')}
                  className="text-yellow-400 font-bold hover:underline ml-1"
                >
                  [Xem việc làm đã lưu]
                </button>
              </>
            ) : (
              'Đã bỏ lưu việc làm'
            )}
          </span>
        </div>
      )}
    </div>
  );
}

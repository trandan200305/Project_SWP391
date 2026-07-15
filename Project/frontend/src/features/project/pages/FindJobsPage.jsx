import React, { useState, useEffect } from 'react';
import { Bookmark, Loader2 } from 'lucide-react';
import ComingSoon from '../../../pages/ComingSoon.jsx';
import { useSavedJobs } from '../../../hooks/useSavedJobs.js';

export default function FindJobsPage({ onNavigate, user }) {
  const [showModal, setShowModal] = useState(false);
  const { savedJobs, saveJob, unsaveJob, isJobSaved } = useSavedJobs(user);
  const [successToast, setSuccessToast] = useState({ show: false, type: '', message: '' });
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Phân trang
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    fetchJobs(page, size);
  }, [page, size]);

  const fetchJobs = async (currentPage, currentSize) => {
    setIsLoading(true);
    try {
      const url = `http://localhost:8080/api/projects/search?page=${currentPage}&size=${currentSize}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.content || []);
        setTotalPages(data.totalPages || 0);
      }
    } catch (e) {
      console.error('Error fetching jobs:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = (e) => {
    e.preventDefault();
    setShowModal(true);
  };

  const showToastNotification = (type) => {
    setSuccessToast({ show: true, type });
    setTimeout(() => {
      setSuccessToast({ show: false, type: '' });
    }, 6000);
  };

  const handleBookmarkClick = (e, job) => {
    e.preventDefault();
    e.stopPropagation();
    if (isJobSaved(job.id)) {
      unsaveJob(job.id);
      showToastNotification('unsave');
    } else {
      saveJob(job);
      showToastNotification('save');
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    
    if (diffDays > 0) return `${diffDays} ngày ${diffHours} giờ`;
    return `${diffHours} giờ`;
  };

  const getPaginationButtons = () => {
    let startPage = Math.max(0, page - 2);
    let endPage = Math.min(totalPages - 1, startPage + 4);

    if (endPage - startPage < 4) {
      startPage = Math.max(0, endPage - 4);
    }

    const buttons = [];
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(i);
    }
    return { buttons, startPage, endPage };
  };

  const { buttons: pageButtons, startPage, endPage } = getPaginationButtons();

  return (
    <div className="pt-24 pb-12 bg-slate-50/50 min-h-screen">
      <div className="max-w-4xl mx-auto px-6">
        
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Tìm việc làm tự do</h1>
            <span className="text-xs font-semibold text-slate-400">Trang {page + 1} của {totalPages || 1}</span>
          </div>

          {/* Danh sách công việc */}
          <div className="bg-white border border-slate-200/85 rounded-2xl shadow-sm divide-y divide-slate-100 overflow-hidden">
            {isLoading ? (
              <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                <span className="text-sm font-medium">Đang tải danh sách công việc...</span>
              </div>
            ) : jobs.length === 0 ? (
              <div className="p-16 text-center text-slate-500">Không tìm thấy công việc nào.</div>
            ) : (
              jobs.map(job => (
                <div key={job.id} className="p-6 hover:bg-slate-50/40 transition-all duration-300 group border-b border-slate-100 last:border-0">
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <div className="flex-1">
                      
                      {/* Ngân sách và ID */}
                      <div className="flex items-center gap-2 text-xs text-slate-450 font-bold uppercase tracking-wider mb-1.5">
                        <span className="text-slate-400">Mã dự án: #{job.id}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-emerald-600 font-extrabold">{formatBudget(job.budgetMin, job.budgetMax)}</span>
                      </div>

                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <a 
                          href="#" 
                          onClick={(e) => { e.preventDefault(); onNavigate('job_details', { job }); }} 
                          className="text-slate-900 hover:text-[#4f46e5] hover:underline font-bold text-[17px] leading-tight transition-colors"
                        >
                          {job.title}
                        </a>
                        {job.isNew && (
                          <span className="bg-[#ea580c] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm leading-none whitespace-nowrap uppercase tracking-wider">
                            Mới
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-slate-500 mb-3 flex-wrap">
                        <button onClick={handleAction} className="flex items-center gap-1.5 hover:text-slate-700 transition-colors">
                          <img src={job.employerAvatar} alt={job.employerName} className="w-5 h-5 rounded-full" />
                          <span className="font-medium text-slate-600 text-xs">{job.employerName}</span>
                        </button>
                        <span className="text-slate-350">•</span>
                        <span className="text-xs text-slate-400">Hạn nộp: {formatDeadline(job.deadline)}</span>
                      </div>
                      
                      <p className="text-sm text-slate-600 leading-relaxed mb-1">
                        {job.description?.length > 150 ? job.description.substring(0, 150) + '.........' : job.description}
                      </p>
                    </div>
                    
                    <button 
                      onClick={(e) => handleBookmarkClick(e, job)} 
                      className={`p-1.5 rounded-lg transition-colors shadow-sm ${isJobSaved(job.id) ? 'bg-yellow-400 text-white hover:bg-yellow-500' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                      title={isJobSaved(job.id) ? 'Bỏ lưu' : 'Lưu công việc'}
                    >
                      <Bookmark className={`w-4 h-4 ${isJobSaved(job.id) ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50 border-dashed">
                    <div className="flex items-center gap-2">
                      <span className="bg-indigo-50 text-indigo-655 text-xs font-semibold px-2 py-0.5 rounded-md">
                        {job.categoryName}
                      </span>
                      <span className="text-xs text-slate-400">
                        {job.applications || 0} người đã ứng tuyển
                      </span>
                    </div>
                    
                    <button 
                      onClick={(e) => { e.preventDefault(); onNavigate('job_details', { job }); }}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-850 flex items-center gap-1 transition-colors"
                    >
                      Xem chi tiết &rarr;
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Phân trang */}
          {!isLoading && totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4 mb-8">
              
              <div className="px-4 py-2 mr-2 rounded-xl text-xs font-semibold bg-white/70 backdrop-blur-md border border-slate-200/60 text-slate-600 shadow-sm flex items-center justify-center">
                Trang {page + 1} của {totalPages}
              </div>
              
              {startPage > 0 && (
                <button 
                  onClick={() => handlePageChange(0)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold transition-all bg-white/70 backdrop-blur-md border border-slate-200/60 text-slate-600 hover:bg-white hover:shadow-md hover:-translate-y-0.5 shadow-sm flex items-center justify-center"
                >
                  Trang Đầu
                </button>
              )}
              
              {pageButtons.map((btnIndex) => (
                <button
                  key={btnIndex}
                  onClick={() => handlePageChange(btnIndex)}
                  className={`min-w-[36px] h-9 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center shadow-sm backdrop-blur-md ${
                    page === btnIndex 
                      ? 'bg-[#4f46e5] text-white border-transparent hover:-translate-y-0.5' 
                      : 'bg-white/70 border border-slate-200/60 text-slate-600 hover:bg-white hover:shadow-md hover:-translate-y-0.5'
                  }`}
                >
                  {btnIndex + 1}
                </button>
              ))}

              {endPage < totalPages - 1 && (
                <button 
                  onClick={() => handlePageChange(totalPages - 1)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold transition-all bg-white/70 backdrop-blur-md border border-slate-200/60 text-slate-600 hover:bg-white hover:shadow-md hover:-translate-y-0.5 shadow-sm flex items-center justify-center"
                >
                  Trang Cuối
                </button>
              )}
            </div>
          )}

        </div>
      </div>

      {showModal && <ComingSoon isPopup={true} onClose={() => setShowModal(false)} />}
      
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

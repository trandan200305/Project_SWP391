import React, { useState, useEffect } from 'react';
import { Search, Bookmark } from 'lucide-react';
import ComingSoon from '../../../pages/ComingSoon.jsx';
import { useSavedJobs } from '../../../hooks/useSavedJobs.js';

export default function FindJobsPage({ onNavigate, initialCategory = 'all', user }) {
  const [showModal, setShowModal] = useState(false);
  const { savedJobs, saveJob, unsaveJob, isJobSaved } = useSavedJobs(user);
  const [successToast, setSuccessToast] = useState({ show: false, type: '', message: '' });
  const [activeCategory, setActiveCategory] = useState(initialCategory || 'all');
  const [categories, setCategories] = useState([{ id: 'all', name: 'Tất cả', count: null }]);
  const [jobs, setJobs] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [minSalary, setMinSalary] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorToast, setErrorToast] = useState(null);
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (initialCategory) {
      setActiveCategory(initialCategory);
      setPage(0);
    }
  }, [initialCategory]);

  const isValidSalary = (value) => {
    if (!value) return true; // empty string is valid
    // Only allow digits (1-9 followed by 0-9)
    return /^[1-9]\d*$/.test(value);
  };

  // Fetch data whenever filters or page changes
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (!isValidSalary(minSalary)) {
        setErrorToast('Vui lòng chỉ nhập số nguyên dương cho mức lương!');
        setTimeout(() => setErrorToast(null), 3000);
        return;
      }
      setErrorToast(null);
      fetchJobs(keyword, activeCategory, minSalary, page, size);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [keyword, activeCategory, minSalary, page, size]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories([{ id: 'all', name: 'Tất cả', count: null }, ...data]);
      }
    } catch (e) {
      console.error('Error fetching categories:', e);
    }
  };

  const fetchJobs = async (searchQuery, categoryFilter, minSalaryFilter, currentPage, currentSize) => {
    setIsLoading(true);
    try {
      let url = `http://localhost:8080/api/projects/search?page=${currentPage}&size=${currentSize}`;
      if (searchQuery) url += `&keyword=${encodeURIComponent(searchQuery)}`;
      if (categoryFilter && categoryFilter !== 'all') url += `&categoryId=${categoryFilter}`;
      if (minSalaryFilter) url += `&minSalary=${minSalaryFilter}`;

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

  const handleKeywordChange = (e) => {
    setKeyword(e.target.value);
    setPage(0); // reset to first page when searching
  };

  const handleMinSalaryChange = (e) => {
    setMinSalary(e.target.value);
    setPage(0); // reset to first page when filtering
  };

  const handleExecuteSearch = () => {
    if (!isValidSalary(minSalary)) {
      setErrorToast('Vui lòng chỉ nhập số nguyên dương cho mức lương!');
      setTimeout(() => setErrorToast(null), 3000);
      return;
    }
    setErrorToast(null);
    setPage(0);
    fetchJobs(keyword, activeCategory, minSalary, 0, size);
  };

  const handleCategoryChange = (catId) => {
    setActiveCategory(catId);
    setPage(0); // reset to first page when changing category
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

  // Generate pagination buttons logic
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
    <div className="pt-24 pb-12 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Sidebar */}
        <div className="md:col-span-1 bg-white border border-slate-200 rounded-xl p-4 shadow-sm h-fit">
          <h2 className="font-bold text-lg text-slate-800 mb-4 px-2">Lĩnh vực</h2>
          <ul className="space-y-1">
            {categories.map(cat => (
              <li key={cat.id}>
                <button
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    activeCategory === cat.id 
                      ? 'bg-blue-50 text-blue-700 font-semibold' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {cat.name} {cat.count != null && <span className="text-slate-400">({cat.count})</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Main Content */}
        <div className="md:col-span-3 flex flex-col gap-6">
          
          {/* Search Bar & Filters */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-3">
            <div className="flex flex-col md:flex-row items-center gap-3 w-full">
              <div className="flex-1 relative w-full">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  type="text" 
                  placeholder="Tìm việc freelancer (tiêu đề, mô tả, tên công ty...)" 
                  value={keyword}
                  onChange={handleKeywordChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              
              <button 
                onClick={handleExecuteSearch}
                className="w-full md:w-auto px-6 py-2.5 bg-[#1e40af] text-white font-semibold rounded-lg shadow-sm hover:bg-blue-800 transition-colors flex items-center justify-center gap-2"
              >
                Tìm kiếm
              </button>
            </div>
            
            {/* Filter by Minimum Salary */}
            <div className="flex justify-end items-center gap-2 w-full">
              <span className="text-sm text-slate-600 font-medium">Mức lương:</span>
              <div className="relative w-48">
                <input 
                  type="text" 
                  placeholder="Tối thiểu..." 
                  value={minSalary}
                  onChange={handleMinSalaryChange}
                  className="w-full pl-3 pr-10 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <button 
                  onClick={handleExecuteSearch}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-[#1e40af] hover:bg-slate-100 rounded-r-lg transition-colors"
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Job List */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm divide-y divide-slate-100">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500">Đang tải dữ liệu...</div>
            ) : jobs.length === 0 ? (
              <div className="p-8 text-center text-slate-500">Không tìm thấy công việc nào.</div>
            ) : (
              jobs.map(job => (
                <div key={job.id} className="p-5 hover:bg-slate-50/50 transition-all duration-300 group border-2 border-transparent">
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('job_details', { job }); }} className="text-[#1e40af] hover:underline font-bold text-lg leading-tight">
                          {job.title}
                        </a>
                        {job.isNew && (
                          <button onClick={handleAction} className="bg-[#ea580c] text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm leading-none whitespace-nowrap uppercase tracking-wide">
                            Mới
                          </button>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                        <button onClick={handleAction} className="flex items-center gap-1.5 hover:text-slate-700 transition-colors">
                          <img src={job.employerAvatar} alt={job.employerName} className="w-5 h-5 rounded-full" />
                          <span className="font-medium text-slate-600">{job.employerName}</span>
                        </button>
                      </div>

                      <div className="bg-slate-100 rounded-md p-2.5 flex flex-wrap items-center justify-between gap-4 text-sm mb-3">
                        <div className="text-slate-600">
                          <span className="text-slate-400 mr-1">ID:</span>{job.id} <span className="mx-2 text-slate-300">|</span> 
                          <span className="font-semibold text-slate-700">{formatBudget(job.budgetMin, job.budgetMax)}</span>
                        </div>
                        <div className="text-slate-600 text-sm">
                          Hạn nhận hồ sơ: <span className="font-medium text-slate-800">{formatDeadline(job.deadline)}</span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        {job.description?.length > 150 ? job.description.substring(0, 150) + '.........' : job.description}
                        <button onClick={(e) => { e.preventDefault(); onNavigate('job_details', { job }); }} className="text-blue-600 hover:underline ml-1">Xem thêm</button>
                      </p>
                    </div>
                    
                    <button 
                      onClick={(e) => handleBookmarkClick(e, job)} 
                      className={`p-1.5 rounded-lg transition-colors shadow-sm ${isJobSaved(job.id) ? 'bg-yellow-400 text-white hover:bg-yellow-500' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                      title={isJobSaved(job.id) ? 'Bỏ lưu' : 'Lưu công việc'}
                    >
                      <Bookmark className={`w-5 h-5 ${isJobSaved(job.id) ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2 pt-3 border-t border-slate-50 border-dashed">
                    <div>
                      <button onClick={handleAction} className="bg-[#1e40af] text-white text-xs font-semibold px-2.5 py-1 rounded shadow-sm hover:bg-blue-900 transition-colors uppercase">
                        {job.categoryName}
                      </button>
                    </div>
                    <div className="text-sm font-medium text-slate-600">
                      <>{job.applications} người đã ứng tuyển</>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Custom Glassmorphism Pagination Controls */}
          {!isLoading && totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4 mb-8">
              {/* Trang X của Y */}
              <div className="px-4 py-2 mr-2 rounded-xl text-sm font-semibold bg-white/70 backdrop-blur-md border border-slate-200/60 text-slate-600 shadow-sm flex items-center justify-center">
                Trang {page + 1} của {totalPages}
              </div>
              
              {/* Trang Đầu (chỉ hiện nếu nút số 1 không được hiển thị) */}
              {startPage > 0 && (
                <button 
                  onClick={() => setPage(0)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-all bg-white/70 backdrop-blur-md border border-slate-200/60 text-slate-600 hover:bg-white hover:shadow-md hover:-translate-y-0.5 shadow-sm flex items-center justify-center"
                >
                  Trang Đầu
                </button>
              )}
              
              {/* Page Numbers */}
              {pageButtons.map((btnIndex) => (
                <button
                  key={btnIndex}
                  onClick={() => setPage(btnIndex)}
                  className={`min-w-[40px] h-10 px-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center shadow-sm backdrop-blur-md ${
                    page === btnIndex 
                      ? 'bg-[#1e40af] text-white border-transparent hover:-translate-y-0.5 shadow-blue-500/30' 
                      : 'bg-white/70 border border-slate-200/60 text-slate-600 hover:bg-white hover:shadow-md hover:-translate-y-0.5'
                  }`}
                >
                  {btnIndex + 1}
                </button>
              ))}

              {/* Trang Cuối (chỉ hiện nếu nút cuối cùng không được hiển thị) */}
              {endPage < totalPages - 1 && (
                <button 
                  onClick={() => setPage(totalPages - 1)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-all bg-white/70 backdrop-blur-md border border-slate-200/60 text-slate-600 hover:bg-white hover:shadow-md hover:-translate-y-0.5 shadow-sm flex items-center justify-center"
                >
                  Trang Cuối
                </button>
              )}
            </div>
          )}

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

      {/* Error Toast */}
      {errorToast && (
        <div className="fixed bottom-6 right-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 z-50 animate-bounce-in">
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <span className="font-medium text-sm">{errorToast}</span>
        </div>
      )}
    </div>
  );
}

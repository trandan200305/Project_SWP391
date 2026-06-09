import React, { useState, useEffect } from 'react';
import { Search, Bookmark } from 'lucide-react';
import ComingSoon from '../../../pages/ComingSoon.jsx';

export default function FindJobsPage() {
  const [showModal, setShowModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [categories, setCategories] = useState([{ id: 'all', name: 'Tất cả', count: null }]);
  const [jobs, setJobs] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    fetchCategories();
  }, []);

  // Use debounce for live search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setPage(0); // reset page when search changes
      fetchJobs(keyword, 0, size);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [keyword, size]);

  useEffect(() => {
    fetchJobs(keyword, page, size);
  }, [page]); // trigger when only page changes

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

  const fetchJobs = async (searchQuery, currentPage, currentSize) => {
    setIsLoading(true);
    try {
      const url = searchQuery 
        ? `http://localhost:8080/api/projects/search?keyword=${encodeURIComponent(searchQuery)}&page=${currentPage}&size=${currentSize}`
        : `http://localhost:8080/api/projects?page=${currentPage}&size=${currentSize}`;
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

  const displayedJobs = activeCategory === 'all' 
    ? jobs 
    : jobs.filter(j => j.categoryName === categories.find(c => c.id === activeCategory)?.name);

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
                  onClick={() => setActiveCategory(cat.id)}
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
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-center gap-3">
            <div className="flex-1 relative w-full">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input 
                type="text" 
                placeholder="Tìm việc freelancer (tiêu đề, mô tả, tên công ty...)" 
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
              <span className="text-sm text-slate-600 whitespace-nowrap">Hiển thị:</span>
              <select 
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
              >
                <option value={5}>5 công việc</option>
                <option value={10}>10 công việc</option>
                <option value={20}>20 công việc</option>
                <option value={50}>50 công việc</option>
              </select>
            </div>
          </div>

          {/* Job List */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm divide-y divide-slate-100">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500">Đang tải dữ liệu...</div>
            ) : displayedJobs.length === 0 ? (
              <div className="p-8 text-center text-slate-500">Không tìm thấy công việc nào.</div>
            ) : (
              displayedJobs.map(job => (
                <div key={job.id} className="p-5 hover:bg-slate-50/50 transition-colors group">
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <a href="#" onClick={handleAction} className="text-[#1e40af] hover:underline font-bold text-lg leading-tight">
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
                        <button onClick={handleAction} className="text-blue-600 hover:underline ml-1">Xem thêm</button>
                      </p>
                    </div>
                    
                    <button onClick={handleAction} className="text-slate-400 hover:text-slate-600 p-1">
                      <Bookmark className="w-5 h-5" />
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
          
          {/* Pagination Controls */}
          {!isLoading && totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <button 
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${page === 0 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
              >
                Trang trước
              </button>
              <span className="text-sm text-slate-600 font-medium px-4">
                Trang {page + 1} / {totalPages}
              </span>
              <button 
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page === totalPages - 1}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${page === totalPages - 1 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
              >
                Trang tiếp
              </button>
            </div>
          )}

        </div>
      </div>

      {showModal && <ComingSoon isPopup={true} onClose={() => setShowModal(false)} />}
    </div>
  );
}

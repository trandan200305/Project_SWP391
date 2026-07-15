import React, { useState, useEffect } from 'react';
import { Bookmark, Loader2, RefreshCw } from 'lucide-react';
import ComingSoon from '../../../pages/ComingSoon.jsx';
import { useSavedJobs } from '../../../hooks/useSavedJobs.js';

export default function FindJobsPage({ onNavigate, user }) {
  const [showModal, setShowModal] = useState(false);
  const { savedJobs, saveJob, unsaveJob, isJobSaved } = useSavedJobs(user);
  const [successToast, setSuccessToast] = useState({ show: false, type: '', message: '' });
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Metadata lọc nạp từ Database
  const [categories, setCategories] = useState([]);
  const [workForms, setWorkForms] = useState([]);
  const [projectTypes, setProjectTypes] = useState([]);
  const [skills, setSkills] = useState([]);

  // State các tiêu chí lọc
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeWorkForm, setActiveWorkForm] = useState('');
  const [activeProjectType, setActiveProjectType] = useState('');
  const [minSalary, setMinSalary] = useState('');
  const [maxSalary, setMaxSalary] = useState('');
  const [activeSkillIds, setActiveSkillIds] = useState([]);

  // Phân trang
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  // Fetch metadata từ Database khi component mount
  useEffect(() => {
    fetchMetadata();
  }, []);

  const fetchMetadata = async () => {
    // 1. Tải Lĩnh vực (Categories)
    fetch('http://localhost:8080/api/categories')
      .then(res => res.ok ? res.json() : [])
      .then(data => setCategories([{ categoryId: 'all', categoryName: 'Tất cả' }, ...data]))
      .catch(e => console.error('Error fetching categories:', e));

    // 2. Tải Hình thức (Work Forms) từ projects
    fetch('http://localhost:8080/api/projects/work-forms')
      .then(res => res.ok ? res.json() : [])
      .then(data => setWorkForms(data))
      .catch(e => console.error('Error fetching work forms:', e));

    // 3. Tải Loại dự án (Project Types) từ projects
    fetch('http://localhost:8080/api/projects/project-types')
      .then(res => res.ok ? res.json() : [])
      .then(data => setProjectTypes(data))
      .catch(e => console.error('Error fetching project types:', e));

    // 4. Tải Kỹ năng (Skills)
    fetch('http://localhost:8080/api/skills')
      .then(res => res.ok ? res.json() : [])
      .then(data => setSkills(data))
      .catch(e => console.error('Error fetching skills:', e));
  };

  // Gọi API tìm kiếm mỗi khi phân trang hoặc bộ lọc thay đổi (Debounce 400ms đối với nhập lương)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchJobs(page, size);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [page, size, activeCategory, activeWorkForm, activeProjectType, minSalary, maxSalary, activeSkillIds]);

  const fetchJobs = async (currentPage, currentSize) => {
    setIsLoading(true);
    try {
      let url = `http://localhost:8080/api/projects/search?page=${currentPage}&size=${currentSize}`;
      if (activeCategory && activeCategory !== 'all') {
        url += `&categoryId=${activeCategory}`;
      }
      if (activeWorkForm) {
        url += `&workForm=${activeWorkForm}`;
      }
      if (activeProjectType) {
        url += `&projectType=${activeProjectType}`;
      }
      if (minSalary) {
        url += `&minSalary=${minSalary}`;
      }
      if (maxSalary) {
        url += `&maxSalary=${maxSalary}`;
      }
      if (activeSkillIds && activeSkillIds.length > 0) {
        url += `&skillIds=${activeSkillIds.join(',')}`;
      }

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

  const handleWorkFormChange = (form) => {
    setActiveWorkForm(form);
    setPage(0);
  };

  const handleProjectTypeChange = (type) => {
    setActiveProjectType(type);
    setPage(0);
  };

  const handleSalaryChange = (type, value) => {
    if (type === 'min') {
      setMinSalary(value);
    } else {
      setMaxSalary(value);
    }
    setPage(0);
  };

  const handleSkillChange = (skillId) => {
    setActiveSkillIds(prev => {
      if (prev.includes(skillId)) {
        return prev.filter(id => id !== skillId);
      } else {
        return [...prev, skillId];
      }
    });
    setPage(0);
  };

  const handleResetFilters = () => {
    setActiveCategory('all');
    setActiveWorkForm('');
    setActiveProjectType('');
    setMinSalary('');
    setMaxSalary('');
    setActiveSkillIds([]);
    setPage(0);
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

  // Bản dịch thân thiện cho các lựa chọn động từ Database
  const translateWorkForm = (form) => {
    if (form === 'ONLINE') return 'Làm Online (Từ xa)';
    if (form === 'OFFLINE') return 'Làm Offline (Tại chỗ)';
    return form;
  };

  const translateProjectType = (type) => {
    if (type === 'FIXED' || type === 'FIXED_PRICE') return 'Ngân sách cố định';
    if (type === 'RANGE' || type === 'PROJECT') return 'Khoảng ngân sách';
    return type;
  };

  const { buttons: pageButtons, startPage, endPage } = getPaginationButtons();

  return (
    <div className="pt-24 pb-12 bg-slate-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* CỘT TRÁI - BỘ LỌC ĐỘNG TỪ DATABASE */}
        <div className="md:col-span-1 flex flex-col gap-5">
          
          <div className="bg-white border border-slate-200/85 rounded-2xl p-5 shadow-sm space-y-5 h-fit">
            
            {/* Header Bộ lọc */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Bộ lọc tìm kiếm</h2>
              <button 
                onClick={handleResetFilters}
                className="text-xs text-indigo-600 hover:text-indigo-850 font-bold flex items-center gap-1 transition-colors"
                title="Xóa tất cả bộ lọc"
              >
                <RefreshCw className="w-3 h-3" />
                Reset
              </button>
            </div>

            {/* 1. Lọc theo Lĩnh vực (Category) */}
            <div className="space-y-2">
              <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wide">Lĩnh vực</h3>
              <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
                {categories.map(cat => (
                  <button
                    key={cat.categoryId}
                    onClick={() => { setActiveCategory(cat.categoryId); setPage(0); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors font-semibold ${
                      activeCategory === cat.categoryId 
                        ? 'bg-indigo-50 text-indigo-600 font-bold border border-indigo-100' 
                        : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    {cat.categoryName}
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100"></div>

            {/* 2. Lọc theo Hình thức (Work Form) */}
            <div className="space-y-2.5">
              <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wide">Hình thức</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer font-semibold">
                  <input 
                    type="radio" 
                    name="workForm" 
                    value="" 
                    checked={activeWorkForm === ''}
                    onChange={() => handleWorkFormChange('')}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <span className={activeWorkForm === '' ? "font-bold text-slate-800" : ""}>Tất cả</span>
                </label>
                {workForms.map(wf => (
                  <label key={wf} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer font-semibold">
                    <input 
                      type="radio" 
                      name="workForm" 
                      value={wf} 
                      checked={activeWorkForm === wf}
                      onChange={() => handleWorkFormChange(wf)}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <span className={activeWorkForm === wf ? "font-bold text-slate-800" : ""}>{translateWorkForm(wf)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100"></div>

            {/* 3. Lọc theo Loại ngân sách (Project Type) */}
            <div className="space-y-2.5">
              <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wide">Loại ngân sách</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer font-semibold">
                  <input 
                    type="radio" 
                    name="projectType" 
                    value="" 
                    checked={activeProjectType === ''}
                    onChange={() => handleProjectTypeChange('')}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <span className={activeProjectType === '' ? "font-bold text-slate-800" : ""}>Tất cả</span>
                </label>
                {projectTypes.map(pt => (
                  <label key={pt} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer font-semibold">
                    <input 
                      type="radio" 
                      name="projectType" 
                      value={pt} 
                      checked={activeProjectType === pt}
                      onChange={() => handleProjectTypeChange(pt)}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <span className={activeProjectType === pt ? "font-bold text-slate-800" : ""}>{translateProjectType(pt)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100"></div>

            {/* 4. Lọc theo Khoảng ngân sách */}
            <div className="space-y-2.5">
              <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wide">Khoảng giá (VND)</h3>
              <div className="flex flex-col gap-2">
                <input 
                  type="number" 
                  min="0"
                  placeholder="Giá tối thiểu" 
                  value={minSalary}
                  onChange={(e) => handleSalaryChange('min', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold outline-none focus:border-indigo-600 focus:bg-white"
                />
                <input 
                  type="number" 
                  min="0"
                  placeholder="Giá tối đa" 
                  value={maxSalary}
                  onChange={(e) => handleSalaryChange('max', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100"></div>

            {/* 5. Lọc theo Kỹ năng (Skills) */}
            <div className="space-y-2.5">
              <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wide">Kỹ năng yêu cầu</h3>
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                {skills.map(sk => {
                  const isChecked = activeSkillIds.includes(sk.skillId);
                  return (
                    <label key={sk.skillId} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer font-semibold">
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={() => handleSkillChange(sk.skillId)}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-slate-300"
                      />
                      <span className={isChecked ? "font-bold text-slate-800" : ""}>{sk.skillName}</span>
                    </label>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* CỘT PHẢI - DANH SÁCH DỰ ÁN */}
        <div className="md:col-span-3 flex flex-col gap-6">
          
          {/* Header */}
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Tìm việc làm tự do
              {activeSkillIds.length > 0 && (
                <span className="text-[11px] bg-indigo-50 text-indigo-750 px-2 py-0.5 rounded font-extrabold uppercase">
                  Đang lọc {activeSkillIds.length} kỹ năng
                </span>
              )}
            </h1>
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
              <div className="p-16 text-center text-slate-500 flex flex-col gap-2 items-center justify-center">
                <span className="text-sm font-medium">Không tìm thấy công việc nào phù hợp với bộ lọc.</span>
                <button onClick={handleResetFilters} className="text-xs text-indigo-600 font-bold hover:underline">Xóa các bộ lọc và thử lại</button>
              </div>
            ) : (
              jobs.map(job => (
                <div key={job.id} className="p-6 hover:bg-slate-50/40 transition-all duration-300 group border-b border-slate-100 last:border-0 animate-fade-in">
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <div className="flex-1">
                      
                      {/* Ngân sách và ID */}
                      <div className="flex items-center gap-2 text-xs text-slate-450 font-bold uppercase tracking-wider mb-1.5">
                        <span className="text-slate-450">Mã dự án: #{job.id}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-emerald-600 font-extrabold">{formatBudget(job.budgetMin, job.budgetMax)}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-indigo-600 bg-indigo-50/50 px-1.5 py-0.5 rounded text-[10px]">{translateWorkForm(job.workForm)}</span>
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
                      
                      <p className="text-sm text-slate-600 leading-relaxed mb-3">
                        {job.description?.length > 150 ? job.description.substring(0, 150) + '.........' : job.description}
                      </p>

                      {/* Hiển thị Nhãn Kỹ năng thực tế của dự án */}
                      {job.skills && job.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1">
                          {job.skills.map(skill => {
                            const relatedSkill = skills.find(s => s.skillName === skill);
                            const isHighlighted = relatedSkill && activeSkillIds.includes(relatedSkill.skillId);
                            return (
                              <span 
                                key={skill} 
                                className={`px-2 py-0.5 rounded text-[9.5px] font-extrabold uppercase ${
                                  isHighlighted
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                {skill}
                              </span>
                            );
                          })}
                        </div>
                      )}

                    </div>
                    
                    <button 
                      onClick={(e) => handleBookmarkClick(e, job)} 
                      className={`p-1.5 rounded-lg transition-colors shadow-sm ${isJobSaved(job.id) ? 'bg-yellow-400 text-white hover:bg-yellow-500' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                      title={isJobSaved(job.id) ? 'Bỏ lưu' : 'Lưu công việc'}
                    >
                      <Bookmark className={`w-4 h-4 ${isJobSaved(job.id) ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100/60 border-dashed">
                    <div className="flex items-center gap-2">
                      <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2 py-0.5 rounded-md">
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
            <div className="flex justify-center items-center gap-2 mt-4 mb-8 animate-fade-in">
              
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

import React, { useState, useEffect } from 'react';
import { Search, MapPin, Star, MessageCircle, User, SlidersHorizontal, CheckCircle2 } from 'lucide-react';
import { getImageUrl } from '../../../utils/imageHelper.js';

export default function FindFreelancersPage({ onNavigate, initialKeyword = '', user }) {
  const [freelancers, setFreelancers] = useState([]);
  const [keyword, setKeyword] = useState(initialKeyword || '');
  const [minRating, setMinRating] = useState('');
  const [minRate, setMinRate] = useState('');
  const [maxRate, setMaxRate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorToast, setErrorToast] = useState(null);

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    if (initialKeyword !== undefined) {
      setKeyword(initialKeyword);
    }
  }, [initialKeyword]);

  // Fetch categories on mount
  useEffect(() => {
    fetch('http://localhost:8080/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data || []))
      .catch(e => console.error('Error fetching categories:', e));
  }, []);

  // Fetch freelancers based on active filters
  const fetchFreelancers = async () => {
    setIsLoading(true);
    try {
      let url = 'http://localhost:8080/api/freelancers?';
      if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
      if (minRate) url += `&minRate=${minRate}`;
      if (maxRate) url += `&maxRate=${maxRate}`;
      if (minRating) url += `&minRating=${minRating}`;
      if (selectedCategory && selectedCategory !== 'all') url += `&category=${encodeURIComponent(selectedCategory)}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setFreelancers(data || []);
      }
    } catch (e) {
      console.error('Error fetching freelancers:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger search on mount or when select filters change
  useEffect(() => {
    fetchFreelancers();
  }, [selectedCategory, minRating]);

  const showError = (msg) => {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(null), 3000);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (minRate && !/^\d+$/.test(minRate)) {
      showError('Giá tối thiểu phải là số nguyên dương!');
      return;
    }
    if (maxRate && !/^\d+$/.test(maxRate)) {
      showError('Giá tối đa phải là số nguyên dương!');
      return;
    }
    fetchFreelancers();
  };

  const handleResetFilters = () => {
    setMinRating('');
    setMinRate('');
    setMaxRate('');
    setKeyword('');
    setSelectedCategory('');
    setIsLoading(true);
    fetch('http://localhost:8080/api/freelancers')
      .then(res => res.json())
      .then(data => {
        setFreelancers(data || []);
        setIsLoading(false);
      })
      .catch(e => {
        console.error(e);
        setIsLoading(false);
      });
  };

  const formatRate = (rate) => {
    if (!rate) return 'Thỏa thuận';
    return new Intl.NumberFormat('vi-VN').format(rate) + ' đ/giờ';
  };

  const formatEarnings = (amount) => {
    if (!amount) return '0 đ';
    if (amount >= 1000000) {
      return (amount / 1000000).toFixed(1) + 'M đ';
    }
    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
  };

  return (
    <div className="pt-28 pb-16 bg-slate-50 min-h-screen">
      {/* Header section */}
      <div className="max-w-5xl mx-auto px-6 mb-8">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-8 md:p-12 shadow-md relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
          
          <div className="relative z-10 max-w-2xl">
            <span className="text-secondary font-bold tracking-wider uppercase text-sm block mb-2">Tìm Kiếm Freelancer</span>
            <h1 className="text-3xl md:text-4xl font-display font-extrabold mb-4 leading-tight">
              Tuyển dụng nhân sự freelancer giỏi nhất cho dự án của bạn
            </h1>
            <p className="text-slate-300 text-base md:text-lg">
              Duyệt qua danh sách freelancer chuyên nghiệp, xem hồ sơ năng lực, đánh giá từ khách hàng cũ và liên hệ trực tiếp.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 flex flex-col gap-6">
        
        {/* Search & Filter Form */}
        <form onSubmit={handleSearchSubmit} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col gap-4">
          
          {/* Search bar */}
          <div className="flex flex-col md:flex-row items-center gap-3 w-full">
            <div className="flex-1 relative w-full">
              <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input 
                type="text" 
                placeholder="Tìm freelancer theo tên, vị trí công việc, kỹ năng..." 
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <button
              type="submit"
              className="w-full md:w-auto bg-[#1e40af] hover:bg-blue-800 text-white font-bold px-6 py-3 rounded-lg text-sm transition-all duration-150 flex items-center justify-center gap-1.5 shadow-sm shrink-0"
            >
              <Search className="w-4 h-4" />
              <span>Tìm kiếm</span>
            </button>
          </div>

          {/* Advanced Filters */}
          <div className="flex flex-col gap-4 pt-3 border-t border-slate-100 w-full text-slate-700">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 font-medium text-sm text-slate-800">
                <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                <span>Bộ lọc nâng cao:</span>
              </div>
              
              {/* Category Dropdown */}
              <div className="w-full md:w-48">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tất cả ngành nghề</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rating Dropdown */}
              <div className="w-full md:w-40">
                <select
                  value={minRating}
                  onChange={(e) => setMinRating(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tất cả đánh giá</option>
                  <option value="4.5">Từ 4.5 ★ trở lên</option>
                  <option value="4.0">Từ 4.0 ★ trở lên</option>
                  <option value="3.0">Từ 3.0 ★ trở lên</option>
                </select>
              </div>

              {/* Rate Range Inputs */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <input
                  type="text"
                  placeholder="Giá tối thiểu"
                  value={minRate}
                  onChange={(e) => setMinRate(e.target.value)}
                  className="w-full md:w-28 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-slate-400 text-xs">đến</span>
                <input
                  type="text"
                  placeholder="Giá tối đa"
                  value={maxRate}
                  onChange={(e) => setMaxRate(e.target.value)}
                  className="w-full md:w-28 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Reset filter button at the right end */}
              {(minRating || minRate || maxRate || keyword || selectedCategory) && (
                <div className="flex items-center w-full md:w-auto md:ml-auto">
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold border-b border-transparent hover:border-rose-700 transition-all"
                  >
                    Xóa bộ lọc
                  </button>
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Error Alerts */}
        {errorToast && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm shadow-sm animate-shake">
            {errorToast}
          </div>
        )}

        {/* Loading Shimmer List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col gap-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-slate-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-1/4" />
                    <div className="h-3 bg-slate-200 rounded w-1/3" />
                  </div>
                </div>
                <div className="h-3 bg-slate-200 rounded w-full" />
                <div className="h-3 bg-slate-200 rounded w-5/6" />
              </div>
            ))}
          </div>
        ) : freelancers.length === 0 ? (
          /* Empty State */
          <div className="bg-white border border-slate-200 rounded-xl p-12 shadow-sm text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <User className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg text-slate-800 mb-1">Không tìm thấy Freelancer nào</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">
              Hãy thử thay đổi từ khóa, mức giá hoặc bộ lọc đánh giá khác để tìm kiếm đối tác phù hợp.
            </p>
          </div>
        ) : (
          /* Freelancers List */
          <div className="space-y-4">
            {freelancers.map(fl => {
              const skillsList = fl.primarySkills 
                ? fl.primarySkills.split(/[,;|]+/).map(s => s.trim()).filter(Boolean)
                : [];

              return (
                <div 
                  key={fl.profileId} 
                  className="bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col md:flex-row gap-5"
                >
                  {/* Left: Avatar & Rating */}
                  <div className="flex flex-col items-center md:items-start text-center md:text-left gap-3">
                    <div className="relative">
                      <img 
                        src={fl.avatarUrl ? getImageUrl(fl.avatarUrl) : `https://ui-avatars.com/api/?name=${fl.displayName}`} 
                        alt={fl.displayName}
                        className="w-16 h-16 rounded-full border border-slate-100 object-cover shadow-sm"
                      />
                      {fl.isVerified && (
                        <span className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                          <CheckCircle2 className="w-5 h-5 text-blue-500 fill-blue-50" />
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span className="text-xs font-bold text-slate-700">{fl.averageRating ? Number(fl.averageRating).toFixed(1) : '0.0'}</span>
                      <span className="text-[10px] text-slate-400">({fl.projectsCompleted || 0} việc)</span>
                    </div>
                  </div>

                  {/* Middle: Content */}
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-1">
                      <h3 className="font-bold text-lg text-slate-800 hover:text-blue-700 cursor-pointer flex items-center gap-1.5"
                          onClick={() => onNavigate('view_profile', { targetRole: 'FREELANCER', targetUserId: fl.profileId })}>
                        {fl.displayName}
                        {fl.experienceLevel && (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {fl.experienceLevel}
                          </span>
                        )}
                      </h3>
                      <span className="text-blue-700 font-extrabold text-base md:text-right">
                        {formatRate(fl.hourlyRate)}
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-slate-700">
                      {fl.professionalTitle || 'Chưa cập nhật tiêu đề nghề nghiệp'}
                    </p>

                    <p className="text-slate-500 text-sm line-clamp-2 pr-2 leading-relaxed">
                      {fl.bio || 'Chưa cập nhật giới thiệu bản thân...'}
                    </p>

                    {/* Skills Tags */}
                    {skillsList.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {skillsList.slice(0, 6).map((skill, idx) => (
                          <span 
                            key={idx} 
                            className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-md border border-slate-200/50"
                          >
                            {skill}
                          </span>
                        ))}
                        {skillsList.length > 6 && (
                          <span className="text-slate-400 text-xs self-center px-1 font-medium">
                            +{skillsList.length - 6} kỹ năng khác
                          </span>
                        )}
                      </div>
                    )}

                    {/* Location & Extra Info */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-400 text-xs mt-3 pt-3 border-t border-slate-50">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-300" />
                        <span>{fl.city ? `${fl.city}, Việt Nam` : 'Việt Nam'}</span>
                      </div>
                      <div>•</div>
                      <div>Thu nhập đã nhận: <span className="font-semibold text-slate-600">{formatEarnings(fl.totalEarnings)}</span></div>
                      {fl.expertiseField && fl.expertiseField.split(/,\s*/).map(id => {
                        const cat = categories.find(c => String(c.id) === String(id));
                        return cat ? cat.name : null;
                      }).filter(Boolean).map((fieldName, idx) => (
                        <React.Fragment key={idx}>
                          <div className="text-slate-300">•</div>
                          <div className="bg-blue-50 text-blue-600 font-medium px-2 py-0.5 rounded text-[11px]">
                            {fieldName}
                          </div>
                        </React.Fragment>
                      ))}
                      {selectedCategory && (
                        <>
                          <div>•</div>
                          <div className="bg-amber-50 text-amber-700 border border-amber-100 font-bold px-2 py-0.5 rounded text-[11px]">
                            Đã làm: {
                              fl.categoryProjectCounts 
                                ? Object.entries(fl.categoryProjectCounts).find(([k]) => k.toLowerCase().includes(selectedCategory.toLowerCase()))?.[1] || 0
                                : 0
                            } dự án [{selectedCategory}]
                          </div>
                        </>
                      )}
                      {!selectedCategory && fl.categoryProjectCounts && Object.keys(fl.categoryProjectCounts).length > 0 && (
                        <>
                          <div>•</div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            Lịch sử làm việc: {Object.entries(fl.categoryProjectCounts).map(([cat, count]) => `${cat} (${count})`).join(', ')}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex md:flex-col gap-2.5 justify-end md:justify-center items-stretch md:min-w-[120px] pt-3 md:pt-0 border-t md:border-t-0 md:border-l md:pl-5 border-slate-100">
                    <button 
                      onClick={() => onNavigate('view_profile', { targetRole: 'FREELANCER', targetUserId: fl.profileId })}
                      className="flex-1 md:flex-initial bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <User className="w-4 h-4" />
                      <span>Hồ sơ</span>
                    </button>
                    <button 
                      onClick={() => onNavigate('messenger', { 
                        id: fl.profileId, 
                        role: 'FREELANCER', 
                        name: fl.displayName || fl.fullName, 
                        avatarUrl: fl.avatarUrl 
                      })}
                      className="flex-1 md:flex-initial bg-[#1e40af] hover:bg-blue-800 text-white text-xs font-bold py-2.5 px-4 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Liên hệ</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

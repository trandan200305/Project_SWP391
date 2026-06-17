import React, { useState, useEffect } from 'react';
import { Code, Palette, Megaphone, Languages, PenTool, Video, Bookmark, Calendar, DollarSign, ExternalLink, Folder } from 'lucide-react';

export default function FeaturedJobs({ searchQuery }) {
  
  const [categories, setCategories] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [savedJobs, setSavedJobs] = useState({});

  
  const iconMap = {
    'code': Code,
    'palette': Palette,
    'megaphone': Megaphone,
    'languages': Languages,
    'pen-tool': PenTool,
    'video': Video,
    'folder-open': Folder
  };

  
  const categoryColors = [
    'text-blue-600 bg-blue-50',
    'text-indigo-600 bg-indigo-50',
    'text-cyan-600 bg-cyan-50',
    'text-purple-600 bg-purple-50',
    'text-orange-600 bg-orange-50',
    'text-rose-600 bg-rose-50',
    'text-emerald-600 bg-emerald-50'
  ];

  
  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Mới đăng';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      
      if (diffHrs < 1) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return diffMins <= 1 ? 'Vừa xong' : `${diffMins} phút trước`;
      }
      if (diffHrs < 24) {
        return `${diffHrs} giờ trước`;
      }
      const diffDays = Math.floor(diffHrs / 24);
      return `${diffDays} ngày trước`;
    } catch (e) {
      return 'Mới đăng';
    }
  };

  
  const formatBudget = (project) => {
    if (project.projectType === 'MONTHLY') {
      const amt = project.budgetFixed || project.budgetMax || project.budgetMin;
      return amt ? `${parseFloat(amt).toLocaleString('vi-VN')}đ / tháng` : 'Thỏa thuận';
    }
    
    if (project.budgetFixed) {
      return `${parseFloat(project.budgetFixed).toLocaleString('vi-VN')}đ`;
    }
    
    if (project.budgetMin && project.budgetMax) {
      return `${parseFloat(project.budgetMin).toLocaleString('vi-VN')}đ - ${parseFloat(project.budgetMax).toLocaleString('vi-VN')}đ`;
    }
    
    const singleAmt = project.budgetMin || project.budgetMax;
    return singleAmt ? `${parseFloat(singleAmt).toLocaleString('vi-VN')}đ` : 'Thỏa thuận';
  };

  
  const getSkillsByCategory = (catName) => {
    const defaultSkills = ['Freelance', 'Professional', 'vLance'];
    const map = {
      'Lập trình': ['React', 'Spring Boot', 'SQL Server', 'JavaScript', 'TailwindCSS'],
      'Thiết kế': ['Figma', 'UI/UX Design', 'Adobe Illustrator', 'Photoshop'],
      'Marketing': ['SEO', 'Content Writing', 'Google Ads', 'Social Media'],
      'Dịch thuật': ['Translation', 'English', 'Proofreading', 'Technical English'],
      'Viết lách': ['Copywriting', 'SEO Content', 'Creative Writing', 'Blogging'],
      'Video & Phim': ['Premiere Pro', 'After Effects', 'Video Editing', 'Motion Graphics'],
      'Hành chính': ['Excel', 'Data Entry', 'E-commerce', 'Product Upload']
    };
    return map[catName] || defaultSkills;
  };

  
  useEffect(() => {
    fetch('http://localhost:8080/api/categories')
      .then(res => {
        if (!res.ok) throw new Error('Network response error');
        return res.json();
      })
      .then(data => {
        setCategories(data);
        setIsLoadingCategories(false);
      })
      .catch(err => {
        console.error('Error fetching categories:', err);
        setIsLoadingCategories(false);
      });
  }, []);

  
  useEffect(() => {
    setIsLoadingProjects(true);
    const url = searchQuery && searchQuery.trim() !== ''
      ? `http://localhost:8080/api/projects/search?keyword=${encodeURIComponent(searchQuery.trim())}`
      : 'http://localhost:8080/api/projects/latest';

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error('Network response error');
        return res.json();
      })
      .then(data => {
        setProjects(data);
        setIsLoadingProjects(false);
      })
      .catch(err => {
        console.error('Error fetching projects:', err);
        setIsLoadingProjects(false);
      });
  }, [searchQuery]);

  const toggleBookmark = (id) => {
    setSavedJobs(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <section id="find-work" className="py-20 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-6">
        
        {}
        <div className="mb-20">
          <div className="flex justify-between items-end mb-8">
            <div>
              <span className="text-secondary font-bold text-label-md uppercase tracking-wider block mb-2">Khám phá theo nhóm ngành</span>
              <h2 className="font-display text-3xl font-extrabold text-primary">Danh mục phổ biến</h2>
            </div>
            <a href="#all-categories" className="text-secondary font-bold text-body-sm hover:underline flex items-center gap-1">
              Tất cả danh mục →
            </a>
          </div>
          
          {isLoadingCategories ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-surface p-5 rounded-2xl border border-muted-light/60 shadow-sm animate-pulse flex flex-col items-center">
                  <div className="w-12 h-12 bg-muted-light/40 rounded-xl mb-4" />
                  <div className="h-4 bg-muted-light/40 rounded w-20 mb-2" />
                  <div className="h-3 bg-muted-light/40 rounded w-12" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
              {categories.map((cat, index) => {
                const IconComponent = iconMap[cat.iconUrl] || Folder;
                const dynamicColor = categoryColors[index % categoryColors.length];
                
                return (
                  <div 
                    key={cat.categoryId} 
                    className="bg-surface p-5 rounded-2xl border border-muted-light/60 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col items-center text-center"
                  >
                    <div className={`w-12 h-12 ${dynamicColor} rounded-xl flex items-center justify-center mb-4`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <span className="font-display font-bold text-primary text-body-md block mb-1">{cat.categoryName}</span>
                    <span className="text-[12px] text-muted">{cat.description || 'Chuyên nghiệp'}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {}
        <div>
          <div className="flex justify-between items-end mb-8">
            <div>
              <span className="text-secondary font-bold text-label-md uppercase tracking-wider block mb-2">Cơ hội việc làm mới</span>
              <h2 className="font-display text-3xl font-extrabold text-primary">Dự án mới nhất</h2>
            </div>
            <a href="#all-projects" className="bg-primary hover:bg-primary-light text-white px-6 py-2.5 rounded-large font-bold text-body-sm transition-all shadow-sm">
              Xem tất cả dự án
            </a>
          </div>

          {isLoadingProjects ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-surface p-6 rounded-2xl border border-muted-light/60 shadow-sm animate-pulse flex flex-col justify-between h-72">
                  <div>
                    <div className="h-6 bg-muted-light/40 rounded w-24 mb-4" />
                    <div className="h-5 bg-muted-light/40 rounded w-3/4 mb-3" />
                    <div className="h-4 bg-muted-light/40 rounded w-full mb-2" />
                    <div className="h-4 bg-muted-light/40 rounded w-5/6" />
                  </div>
                  <div className="h-10 bg-muted-light/40 rounded w-full mt-6" />
                </div>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="bg-surface p-12 rounded-2xl text-center border border-muted-light shadow-sm">
              <p className="text-muted text-lg">Không tìm thấy dự án nào phù hợp với tìm kiếm của bạn.</p>
              <button 
                onClick={() => window.location.reload()} 
                className="text-secondary font-bold mt-2 hover:underline"
              >
                Đặt lại bộ lọc
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => {
                const skills = getSkillsByCategory(project.category?.categoryName);
                const isEnterprise = project.proposalCount > 15; 
                
                return (
                  <div 
                    key={project.projectId} 
                    className={`bg-surface p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between group hover:shadow-lg ${
                      isEnterprise 
                        ? 'border-secondary/40 shadow-sm shadow-secondary/5 bg-gradient-to-b from-white to-secondary-light/10' 
                        : 'border-muted-light/60 shadow-sm'
                    }`}
                  >
                    <div>
                      {}
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-body-sm font-bold ${
                            project.category?.categoryName === 'Lập trình' ? 'bg-blue-100 text-blue-800' :
                            project.category?.categoryName === 'Marketing' ? 'bg-cyan-100 text-cyan-800' :
                            project.category?.categoryName === 'Thiết kế' ? 'bg-indigo-100 text-indigo-800' :
                            project.category?.categoryName === 'Dịch thuật' ? 'bg-purple-100 text-purple-800' :
                            'bg-slate-100 text-slate-800'
                          }`}>
                            {project.category?.categoryName || 'Dự án'}
                          </span>
                          {isEnterprise && (
                            <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[11px] font-extrabold uppercase">
                              Enterprise
                            </span>
                          )}
                        </div>
                        <button 
                          onClick={() => toggleBookmark(project.projectId)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            savedJobs[project.projectId] 
                              ? 'bg-rose-50 border-rose-200 text-rose-500 hover:bg-rose-100' 
                              : 'bg-muted-light/20 border-muted-light/60 text-muted hover:bg-muted-light/50'
                          }`}
                        >
                          <Bookmark className="w-4 h-4" fill={savedJobs[project.projectId] ? "currentColor" : "none"} />
                        </button>
                      </div>

                      {}
                      <h3 className="font-display text-lg font-bold text-primary mb-2 group-hover:text-secondary transition-colors duration-200 line-clamp-1">
                        {project.title}
                      </h3>
                      
                      {}
                      <span className="text-[12px] text-muted block mb-3 font-medium">Đăng {formatTimeAgo(project.createdAt)}</span>
                      
                      {}
                      <p className="font-sans text-muted text-body-sm mb-4 line-clamp-2 leading-relaxed">
                        {project.description}
                      </p>

                      {}
                      <div className="flex flex-wrap gap-1.5 mb-6">
                        {skills.map((skill, i) => (
                          <span key={i} className="px-2.5 py-0.5 bg-muted-light/30 border border-muted-light/80 rounded-md text-[12px] font-medium text-primary">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {}
                    <div className="flex justify-between items-center pt-4 border-t border-muted-light/50 mt-auto">
                      <div>
                        <p className="text-[11px] text-muted uppercase font-bold tracking-wider">Ngân sách</p>
                        <p className="text-primary font-bold text-body-md leading-tight">{formatBudget(project)}</p>
                      </div>
                      
                      <button className="flex items-center gap-1 text-secondary font-bold text-body-sm hover:text-secondary-dark group/btn transition-colors">
                        Chào giá <ExternalLink className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </section>
  );
}

import React, { useState, useEffect } from 'react';
import { Briefcase, ArrowLeft, Coins, ArrowLeftRight, Loader2, Sparkles, CheckSquare, Plus, X, Package } from 'lucide-react';

const SKILLS_BY_CATEGORY = {
  1: ['ReactJS', 'Spring Boot', 'Node.js', 'Java', 'Python', 'SQL Server', 'VueJS', 'Tailwind CSS', 'Mobile App', 'RESTful API'],
  2: ['Figma', 'UI/UX Design', 'Photoshop', 'Illustrator', 'Thiết kế Logo', 'Thiết kế Banner/Poster', '3D Design', 'Branding'],
  3: ['SEO Website', 'Google Ads', 'Facebook Ads', 'Content Marketing', 'Copywriting', 'Social Media', 'Email Marketing'],
  4: ['Dịch tiếng Anh', 'Dịch tiếng Nhật', 'Viết bài PR', 'Viết bài chuẩn SEO', 'Biên dịch tài liệu', 'Proofreading'],
  5: ['After Effects', 'Premiere Pro', 'Video Editing', 'Motion Graphics', 'Dựng clip Tiktok', 'Voiceover'],
  6: ['Excel / Google Sheets', 'Nhập liệu Data Entry', 'Tư vấn bán hàng', 'Chăm sóc khách hàng (CSKH)', 'Đăng sản phẩm TMĐT']
};

const DEFAULT_SKILLS = [
  'ReactJS', 'Spring Boot', 'Node.js', 'Java', 'Figma', 'UI/UX Design', 
  'Photoshop', 'SEO Website', 'Google Ads', 'Content Marketing', 
  'Dịch tiếng Anh', 'Premiere Pro', 'Excel / Data Entry'
];

const DEFAULT_CATEGORIES = [
  { categoryId: 1, categoryName: 'Lập trình' },
  { categoryId: 2, categoryName: 'Thiết kế' },
  { categoryId: 3, categoryName: 'Marketing' },
  { categoryId: 4, categoryName: 'Dịch thuật' },
  { categoryId: 5, categoryName: 'Viết lách' },
  { categoryId: 6, categoryName: 'Video & Phim' },
  { categoryId: 7, categoryName: 'Hành chính' }
];

export default function PostJobPage({ user, onNavigateHome, onNavigate }) {
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [postingProject, setPostingProject] = useState(false);
  const [notice, setNotice] = useState(null);

  const [newProject, setNewProject] = useState({
    title: '',
    categoryId: '',
    projectType: 'FIXED',
    budgetFixed: '',
    budgetMin: '',
    budgetMax: '',
    deadline: '',
    description: '',
    servicePackage: 'MEDIUM',
    workForm: 'ONLINE'
  });

  const [selectedSkills, setSelectedSkills] = useState([]);
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [dbSkills, setDbSkills] = useState([]);
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);
  const [employerQuota, setEmployerQuota] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'EMPLOYER') {
      if (onNavigate) onNavigate('home');
      return;
    }

    const empId = user?.employerId || user?.id || user?.userId;
    if (empId) {
      fetch(`http://localhost:8080/api/employers/${empId}/dashboard`)
        .then(res => res.json())
        .then(data => setEmployerQuota(data))
        .catch(err => console.error('Error fetching employer quota:', err));
    }

    fetch('http://localhost:8080/api/categories')
      .then((res) => {
        if (!res.ok) throw new Error('Không thể tải danh mục.');
        return res.json();
      })
      .then((data) => {
        const activeCategories = Array.isArray(data) ? data.filter(c => c.isActive !== false) : [];
        setCategories(activeCategories.length > 0 ? activeCategories : DEFAULT_CATEGORIES);
        setLoadingCategories(false);
      })
      .catch((err) => {
        console.error('Error fetching categories:', err);
        setCategories(DEFAULT_CATEGORIES);
        setLoadingCategories(false);
      });

    // Tải danh sách kỹ năng từ bảng skills trong CSDL
    fetch('http://localhost:8080/api/skills')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setDbSkills(data);
        }
      })
      .catch(err => console.error('Error fetching skills from DB:', err));
  }, [user]);

  // Available skills based on skills table in database
  const availableSkills = React.useMemo(() => {
    if (dbSkills && dbSkills.length > 0) {
      if (newProject.categoryId) {
        const catId = parseInt(newProject.categoryId);
        const filtered = dbSkills.filter(s => s.categoryId === catId).map(s => s.skillName);
        if (filtered.length > 0) return filtered;
      }
      return dbSkills.map(s => s.skillName);
    }
    return newProject.categoryId && SKILLS_BY_CATEGORY[newProject.categoryId]
      ? SKILLS_BY_CATEGORY[newProject.categoryId]
      : DEFAULT_SKILLS;
  }, [dbSkills, newProject.categoryId]);

  const filteredAvailableSkills = React.useMemo(() => {
    const query = customSkillInput.trim().toLowerCase();
    return availableSkills.filter(
      (skill) =>
        !selectedSkills.includes(skill) &&
        skill.toLowerCase().includes(query)
    );
  }, [availableSkills, selectedSkills, customSkillInput]);

  const toggleSkill = (skill) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const handleAddCustomSkill = (e) => {
    e.preventDefault();
    const trimmed = customSkillInput.trim();
    if (trimmed && !selectedSkills.includes(trimmed)) {
      setSelectedSkills(prev => [...prev, trimmed]);
      setCustomSkillInput('');
    }
  };

  const removeSkill = (skill) => {
    setSelectedSkills(prev => prev.filter(s => s !== skill));
  };

  const handleBudgetChange = (field, rawValue) => {
    const digitsOnly = rawValue.replace(/\D/g, '');
    const formatted = digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    setNewProject(prev => ({ ...prev, [field]: formatted }));
  };

  const handlePostProject = async (e) => {
    e.preventDefault();
    if (!newProject.title.trim() || !newProject.categoryId || !newProject.description.trim()) {
      setNotice({ type: 'error', message: 'Vui lòng điền đầy đủ các thông tin bắt buộc.' });
      return;
    }

    if (newProject.title.trim().length < 8) {
      setNotice({ type: 'error', message: 'Tiêu đề công việc phải có ít nhất 8 ký tự.' });
      return;
    }

    if (newProject.description.trim().length <= 50) {
      setNotice({ type: 'error', message: 'Mô tả công việc phải có nhiều hơn 50 ký tự.' });
      return;
    }

    const packageInfo = employerQuota?.packageInfo;
    if (packageInfo && packageInfo.postsRemaining !== undefined && packageInfo.postsRemaining <= 0 && packageInfo.postsLimit !== 'Không giới hạn') {
      setNotice({ type: 'error', message: 'Tài khoản của bạn đã hết lượt đăng bài. Vui lòng mua gói dịch vụ mới để tiếp tục đăng tin.' });
      return;
    }

    // Validate budget range
    if (newProject.projectType === 'RANGE') {
      const minStr = newProject.budgetMin ? String(newProject.budgetMin).trim() : '';
      const maxStr = newProject.budgetMax ? String(newProject.budgetMax).trim() : '';
      
      if (!minStr || !maxStr) {
        setNotice({ type: 'error', message: 'Vui lòng điền đầy đủ cả ngân sách tối thiểu và tối đa.' });
        return;
      }
      const min = parseFloat(minStr.replace(/\./g, ''));
      const max = parseFloat(maxStr.replace(/\./g, ''));
      if (min < 0 || max < 0) {
        setNotice({ type: 'error', message: 'Ngân sách nhập không được nhỏ hơn 0.' });
        return;
      }
      if (isNaN(min) || isNaN(max) || min === 0 || max === 0) {
        setNotice({ type: 'error', message: 'Ngân sách tối thiểu và tối đa phải là số dương lớn hơn 0.' });
        return;
      }
      if (min > max) {
        setNotice({ type: 'error', message: 'Ngân sách tối thiểu không được lớn hơn ngân sách tối đa.' });
        return;
      }
    } else if (newProject.projectType === 'FIXED') {
      const fixedStr = newProject.budgetFixed ? String(newProject.budgetFixed).trim() : '';
      if (!fixedStr) {
        setNotice({ type: 'error', message: 'Vui lòng nhập ngân sách trọn gói.' });
        return;
      }
      const fixed = parseFloat(fixedStr.replace(/\./g, ''));
      if (fixed < 0) {
        setNotice({ type: 'error', message: 'Ngân sách nhập không được nhỏ hơn 0.' });
        return;
      }
      if (isNaN(fixed) || fixed === 0) {
        setNotice({ type: 'error', message: 'Ngân sách cố định phải là số dương lớn hơn 0.' });
        return;
      }
    }

    setPostingProject(true);
    setNotice(null);

    // Format skills into description cleanly if provided
    let finalDescription = newProject.description.trim();
    
    if (selectedSkills.length > 0) {
      finalDescription += `\n\n--- KỸ NĂNG YÊU CẦU ---\n• ` + selectedSkills.join('\n• ');
    }

    const empId = user?.employerId || user?.id || user?.userId;

    const payload = {
      clientId: empId,
      categoryId: parseInt(newProject.categoryId),
      title: newProject.title.trim(),
      description: finalDescription,
      skills: selectedSkills,
      projectType: newProject.projectType,
      budgetFixed: newProject.projectType === 'FIXED' && newProject.budgetFixed ? parseFloat(String(newProject.budgetFixed).replace(/\./g, '')) : null,
      budgetMin: newProject.projectType === 'RANGE' && newProject.budgetMin ? parseFloat(String(newProject.budgetMin).replace(/\./g, '')) : null,
      budgetMax: newProject.projectType === 'RANGE' && newProject.budgetMax ? parseFloat(String(newProject.budgetMax).replace(/\./g, '')) : null,
      deadline: newProject.deadline || null,
      servicePackage: newProject.servicePackage,
      workForm: newProject.workForm
    };

    try {
      const response = await fetch('http://localhost:8080/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errMsg = await response.text();
        throw new Error(errMsg || 'Đăng dự án thất bại.');
      }
      const savedProject = await response.json();

      if (savedProject.status === 'PENDING_PAYMENT') {
        setNotice({ 
          type: 'success', 
          message: 'Dự án đã được tạo thành công! Đang chuyển hướng đến trang chọn phương thức thanh toán...' 
        });

        try {
          const payResponse = await fetch(`http://localhost:8080/payment/create-url?projectId=${savedProject.projectId}`, {
            method: 'POST'
          });
          if (!payResponse.ok) {
            const payErr = await payResponse.text();
            throw new Error(payErr || 'Không thể tạo cổng thanh toán.');
          }
          const payData = await payResponse.json();
          if (payData.paymentUrl) {
            setTimeout(() => {
              if (onNavigate) {
                onNavigate('checkout', { 
                  projectId: savedProject.projectId, 
                  paymentUrl: payData.paymentUrl, 
                  amount: payData.amount, 
                  txnRef: payData.txnRef,
                  bankName: payData.bankName,
                  bankAccountNo: payData.bankAccountNo,
                  bankAccountName: payData.bankAccountName,
                  projectTitle: savedProject.title,
                  servicePackage: savedProject.servicePackage
                });
              } else {
                window.location.href = payData.paymentUrl;
              }
            }, 1500);
            return;
          } else {
            throw new Error('Không nhận được URL thanh toán từ máy chủ.');
          }
        } catch (payErr) {
          setNotice({ 
            type: 'error', 
            message: `Dự án đã được lưu ở trạng thái chờ thanh toán, nhưng lỗi khởi tạo thanh toán: ${payErr.message}. Vui lòng thanh toán sau trong quản lý dự án.` 
          });
          setTimeout(() => {
            if (onNavigate) onNavigate('employer_jobs');
          }, 4000);
          return;
        }
      }

      setNotice({ 
        type: 'success', 
        message: 'Đăng dự án thành công! Dự án của bạn đã được xuất bản trực tiếp lên trang chủ.' 
      });
      
      setNewProject({
        title: '',
        categoryId: '',
        projectType: 'FIXED',
        budgetFixed: '',
        budgetMin: '',
        budgetMax: '',
        deadline: '',
        description: '',
        servicePackage: 'MEDIUM',
        workForm: 'ONLINE'
      });
      setSelectedSkills([]);
      
      setTimeout(() => {
        if (onNavigate) onNavigate('employer_jobs');
      }, 2000);
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Lỗi khi đăng dự án.' });
    } finally {
      setPostingProject(false);
    }
  };

  if (!user || user.role !== 'EMPLOYER') {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pt-28 pb-16 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onNavigateHome}
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại trang chủ
          </button>
          
          <div className="flex items-center gap-1.5 bg-secondary-light border border-secondary/20 px-3 py-1 rounded-full text-secondary-dark">
            <Sparkles className="w-3.5 h-3.5 text-secondary" />
            <span className="text-xs font-bold">Không gian làm việc Nhà tuyển dụng</span>
          </div>
        </div>

        {notice && (
          <div className={`mb-6 p-4 rounded-2xl border text-sm font-semibold transition-all shadow-sm flex items-center gap-2 animate-fade-in ${
            notice.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}>
            <span className="text-base">{notice.type === 'success' ? '✓' : '⚠️'}</span>
            {notice.message}
          </div>
        )}

        {employerQuota?.packageInfo && (
          <div className="p-4 rounded-2xl mb-6 flex items-center justify-between border shadow-sm bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 text-emerald-950">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0">
                <Package className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-bold">
                  Gói dịch vụ: <span className="uppercase text-indigo-700 font-extrabold">{employerQuota.packageInfo.currentPackageName || 'Gói Tiêu Chuẩn'}</span> — 
                  Lượt đăng bài còn lại: <strong className="text-emerald-700 font-black text-base ml-1">{employerQuota.packageInfo.remainingPostsDisplay || 'Không giới hạn'}</strong>
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hạn dùng gói: {employerQuota.packageInfo.currentPackageExpiry || 'Không giới hạn'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('employer_packages')}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Mua gói / Nâng cấp
            </button>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xl shadow-slate-100">
          <div className="border-b border-slate-100 pb-6 mb-8">
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
              <Briefcase className="w-8 h-8 text-secondary" />
              Đăng dự án mới
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              Dự án của bạn sẽ được hiển thị công khai trên Trang chủ ngay sau khi nhấn đăng.
            </p>
          </div>

          <form onSubmit={handlePostProject} className="space-y-6">
            
            {/* Tiêu đề */}
            <label className="block">
              <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-500 mb-1.5">Tiêu đề dự án *</span>
              <input
                type="text"
                required
                value={newProject.title}
                onChange={(e) => setNewProject(prev => ({ ...prev, title: e.target.value }))}
                placeholder="VD: Thiết kế website bán hàng chuẩn SEO chuyên nghiệp"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-secondary focus:bg-white focus:ring-4 focus:ring-secondary/10"
              />
            </label>

            {/* Lĩnh vực */}
            <label className="block">
              <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-500 mb-1.5">Lĩnh vực cần tuyển *</span>
              {loadingCategories ? (
                <div className="h-11 w-full bg-slate-100 animate-pulse rounded-xl" />
              ) : (
                <select
                  required
                  value={newProject.categoryId}
                  onChange={(e) => setNewProject(prev => ({ ...prev, categoryId: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-semibold text-slate-850 outline-none transition focus:border-secondary focus:bg-white focus:ring-4 focus:ring-secondary/10"
                >
                  <option value="">-- Chọn danh mục phù hợp --</option>
                  {categories.map((cat) => (
                    <option key={cat.categoryId} value={cat.categoryId}>{cat.categoryName}</option>
                  ))}
                </select>
              )}
            </label>

            {/* PHẦN SKILL SEARCH & SELECT */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wide text-slate-700 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-secondary" />
                  Kỹ năng yêu cầu cho dự án (Tìm và chọn)
                </span>
                <span className="text-xs font-bold text-slate-500">
                  Đã chọn: <span className="text-secondary font-black">{selectedSkills.length}</span> kỹ năng
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                Nhập từ khóa để tìm kiếm và chọn các kỹ năng cần thiết để Freelancers hiểu rõ yêu cầu công việc.
              </p>

              {/* Hàng Input & Dropdown chọn kỹ năng */}
              <div className="flex items-center gap-2 pt-1">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={customSkillInput}
                    onChange={(e) => {
                      setCustomSkillInput(e.target.value);
                      setShowSkillDropdown(true);
                    }}
                    onFocus={() => setShowSkillDropdown(true)}
                    onBlur={() => setTimeout(() => setShowSkillDropdown(false), 200)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomSkill(e);
                      }
                    }}
                    placeholder="Tìm kiếm hoặc gõ kỹ năng khác..."
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-secondary focus:ring-4 focus:ring-secondary/10"
                  />
                  
                  {/* Cửa sổ cuộn dropdown tìm kiếm kỹ năng */}
                  {showSkillDropdown && (
                    <div className="absolute z-50 w-full mt-1.5 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg py-1">
                      {filteredAvailableSkills.length > 0 ? (
                        filteredAvailableSkills.map((skill) => (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => {
                              toggleSkill(skill);
                              setCustomSkillInput('');
                            }}
                            className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-secondary transition-colors"
                          >
                            {skill}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-xs text-slate-400 font-semibold italic">
                          Không tìm thấy kỹ năng nào phù hợp
                        </div>
                      )}
                      
                      {customSkillInput.trim() && !selectedSkills.includes(customSkillInput.trim()) && !availableSkills.includes(customSkillInput.trim()) && (
                        <button
                          type="button"
                          onClick={handleAddCustomSkill}
                          className="w-full text-left px-4 py-2 text-xs font-bold text-secondary bg-secondary/5 hover:bg-secondary/10 border-t border-slate-100 transition-colors"
                        >
                          + Thêm "{customSkillInput.trim()}" như kỹ năng mới
                        </button>
                      )}
                    </div>
                  )}
                </div>
                
                <button
                  type="button"
                  onClick={handleAddCustomSkill}
                  className="inline-flex items-center gap-1 h-9 px-4 bg-slate-800 hover:bg-slate-905 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm
                </button>
              </div>

              {/* Danh sách kỹ năng đã chọn dạng badges */}
              {selectedSkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-200/60">
                  {selectedSkills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-secondary text-white text-[11px] font-bold rounded-lg shadow-xs"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="hover:text-rose-200 transition-colors ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Hình thức ngân sách */}
            <div>
              <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-500 mb-2">Hình thức ngân sách</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setNewProject(prev => ({ ...prev, projectType: 'FIXED' }))}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    newProject.projectType === 'FIXED'
                      ? 'border-secondary bg-secondary-light/25 ring-2 ring-secondary/10'
                      : 'border-slate-200 bg-slate-50/30 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Coins className={`w-4 h-4 ${newProject.projectType === 'FIXED' ? 'text-secondary-dark' : 'text-slate-400'}`} />
                    <span className="text-xs font-extrabold text-slate-900">Chi phí cố định</span>
                  </div>
                  <span className="text-[10.5px] font-medium text-slate-500 block leading-relaxed">Phù hợp với dự án có yêu cầu cụ thể rõ ràng và chi phí trọn gói.</span>
                </button>

                <button
                  type="button"
                  onClick={() => setNewProject(prev => ({ ...prev, projectType: 'RANGE' }))}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    newProject.projectType === 'RANGE'
                      ? 'border-secondary bg-secondary-light/25 ring-2 ring-secondary/10'
                      : 'border-slate-200 bg-slate-50/30 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <ArrowLeftRight className={`w-4 h-4 ${newProject.projectType === 'RANGE' ? 'text-secondary-dark' : 'text-slate-400'}`} />
                    <span className="text-xs font-extrabold text-slate-900">Khoảng ngân sách</span>
                  </div>
                  <span className="text-[10.5px] font-medium text-slate-500 block leading-relaxed">Thương lượng trực tiếp để nhận báo giá phù hợp nhất từ Freelancer.</span>
                </button>
              </div>
            </div>

            {/* Chi tiết ngân sách */}
            {newProject.projectType === 'FIXED' ? (
              <label className="block">
                <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-500 mb-1.5">Ngân sách trọn gói (VND) *</span>
                <input
                  type="text"
                  required
                  value={newProject.budgetFixed}
                  onChange={(e) => handleBudgetChange('budgetFixed', e.target.value)}
                  placeholder="VD: 5.000.000 (Bắt buộc nhập)"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-secondary focus:bg-white focus:ring-4 focus:ring-secondary/10"
                />
              </label>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-500 mb-1.5">Tối thiểu (VND) *</span>
                  <input
                    type="text"
                    required
                    value={newProject.budgetMin}
                    onChange={(e) => handleBudgetChange('budgetMin', e.target.value)}
                    placeholder="VD: 2.000.000 (Bắt buộc)"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-secondary focus:bg-white focus:ring-4 focus:ring-secondary/10"
                  />
                </label>
                <label className="block">
                  <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-500 mb-1.5">Tối đa (VND) *</span>
                  <input
                    type="text"
                    required
                    value={newProject.budgetMax}
                    onChange={(e) => handleBudgetChange('budgetMax', e.target.value)}
                    placeholder="VD: 10.000.000 (Bắt buộc)"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-secondary focus:bg-white focus:ring-4 focus:ring-secondary/10"
                  />
                </label>
              </div>
            )}

            {/* Hình thức làm việc */}
            <div>
              <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-500 mb-2">Hình thức làm việc</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setNewProject(prev => ({ ...prev, workForm: 'ONLINE' }))}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    newProject.workForm === 'ONLINE'
                      ? 'border-secondary bg-secondary-light/25 ring-2 ring-secondary/10'
                      : 'border-slate-200 bg-slate-50/30 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xs font-extrabold text-slate-900 block mb-1">Online (Làm việc từ xa)</span>
                  <span className="text-[10px] font-medium text-slate-500 block leading-relaxed">Freelancer có thể làm việc từ bất kỳ đâu.</span>
                </button>

                <button
                  type="button"
                  onClick={() => setNewProject(prev => ({ ...prev, workForm: 'OFFLINE' }))}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    newProject.workForm === 'OFFLINE'
                      ? 'border-secondary bg-secondary-light/25 ring-2 ring-secondary/10'
                      : 'border-slate-200 bg-slate-50/30 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xs font-extrabold text-slate-900 block mb-1">Offline (Tại văn phòng)</span>
                  <span className="text-[10px] font-medium text-slate-500 block leading-relaxed">Freelancer làm việc trực tiếp tại địa điểm của bạn.</span>
                </button>
              </div>
            </div>

            {/* Deadline */}
            <label className="block">
              <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-500 mb-1.5">Hạn nhận hồ sơ ứng tuyển *</span>
              <div className="relative">
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={newProject.deadline}
                  onChange={(e) => setNewProject(prev => ({ ...prev, deadline: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-semibold text-slate-850 outline-none transition focus:border-secondary focus:bg-white focus:ring-4 focus:ring-secondary/10"
                />
              </div>
            </label>

            {/* Mô tả */}
            <label className="block">
              <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-500 mb-1.5">Mô tả công việc & Yêu cầu chi tiết *</span>
              <textarea
                required
                rows="6"
                value={newProject.description}
                onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Mô tả cụ thể dự án, danh sách các công việc cần làm, yêu cầu đối với Freelancer và kết quả bàn giao mong muốn..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-secondary focus:bg-white focus:ring-4 focus:ring-secondary/10 resize-none leading-relaxed"
              />
            </label>
            
            <div className="flex justify-end gap-3 border-t border-slate-100 pt-6 mt-8">
              <button
                type="button"
                onClick={onNavigateHome}
                className="px-6 py-3 rounded-xl border border-slate-200 font-bold text-sm text-slate-600 hover:bg-slate-50 active:scale-98 transition-all"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={postingProject}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary hover:bg-secondary-dark text-white font-extrabold text-sm disabled:opacity-70 shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {postingProject ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {postingProject ? 'Đang gửi...' : 'Đăng tin ngay'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


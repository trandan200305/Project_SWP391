import React, { useState, useEffect } from 'react';
import { Briefcase, ArrowLeft, Coins, ArrowLeftRight, Calendar, Loader2, Sparkles } from 'lucide-react';

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
    description: ''
  });

  useEffect(() => {
    if (!user || user.role !== 'EMPLOYER') {
      if (onNavigate) onNavigate('home');
      return;
    }

    fetch('http://localhost:8080/api/categories')
      .then((res) => {
        if (!res.ok) throw new Error('Không thể tải danh mục.');
        return res.json();
      })
      .then((data) => {
        setCategories(data.filter(c => c.isActive !== false));
        setLoadingCategories(false);
      })
      .catch((err) => {
        console.error('Error fetching categories:', err);
        setLoadingCategories(false);
      });
  }, [user]);

  const handlePostProject = async (e) => {
    e.preventDefault();
    if (!newProject.title.trim() || !newProject.categoryId || !newProject.description.trim()) {
      setNotice({ type: 'error', message: 'Vui lòng điền đầy đủ các thông tin bắt buộc.' });
      return;
    }

    // Validate budget range
    if (newProject.projectType === 'RANGE') {
      const minStr = newProject.budgetMin ? String(newProject.budgetMin).trim() : '';
      const maxStr = newProject.budgetMax ? String(newProject.budgetMax).trim() : '';
      if (minStr || maxStr) {
        if (!minStr || !maxStr) {
          setNotice({ type: 'error', message: 'Vui lòng điền đầy đủ cả ngân sách tối thiểu và tối đa.' });
          return;
        }
        const min = parseFloat(minStr);
        const max = parseFloat(maxStr);
        if (isNaN(min) || isNaN(max) || min <= 0 || max <= 0) {
          setNotice({ type: 'error', message: 'Ngân sách tối thiểu và tối đa phải là số dương lớn hơn 0.' });
          return;
        }
        if (min > max) {
          setNotice({ type: 'error', message: 'Ngân sách tối thiểu không được lớn hơn ngân sách tối đa.' });
          return;
        }
      }
    } else if (newProject.projectType === 'FIXED') {
      const fixedStr = newProject.budgetFixed ? String(newProject.budgetFixed).trim() : '';
      if (fixedStr) {
        const fixed = parseFloat(fixedStr);
        if (isNaN(fixed) || fixed <= 0) {
          setNotice({ type: 'error', message: 'Ngân sách cố định phải là số dương lớn hơn 0.' });
          return;
        }
      }
    }

    setPostingProject(true);
    setNotice(null);

    const payload = {
      clientId: user.id,
      categoryId: parseInt(newProject.categoryId),
      title: newProject.title.trim(),
      description: newProject.description.trim(),
      projectType: newProject.projectType,
      budgetFixed: newProject.projectType === 'FIXED' && newProject.budgetFixed ? parseFloat(newProject.budgetFixed) : null,
      budgetMin: newProject.projectType === 'RANGE' && newProject.budgetMin ? parseFloat(newProject.budgetMin) : null,
      budgetMax: newProject.projectType === 'RANGE' && newProject.budgetMax ? parseFloat(newProject.budgetMax) : null,
      deadline: newProject.deadline || null
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

      setNotice({ 
        type: 'success', 
        message: 'Đăng tin tuyển dụng thành công! Dự án của bạn đã được xuất bản trực tiếp lên trang chủ.' 
      });
      
      setNewProject({
        title: '',
        categoryId: '',
        projectType: 'FIXED',
        budgetFixed: '',
        budgetMin: '',
        budgetMax: '',
        deadline: '',
        description: ''
      });
      
      setTimeout(() => {
        if (onNavigate) onNavigate('home');
      }, 2000);
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Lỗi khi đăng tin tuyển dụng.' });
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
        {/* Navigation Header */}
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
            <span className="text-xs font-bold">Employer Workspace</span>
          </div>
        </div>

        {/* Notice Message */}
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

        {/* Form Container */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xl shadow-slate-100">
          <div className="border-b border-slate-100 pb-6 mb-8">
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
              <Briefcase className="w-8 h-8 text-secondary" />
              Đăng tin tuyển dụng mới
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              Tin đăng của bạn sẽ được hiển thị công khai trên Trang chủ ngay sau khi nhấn đăng.
            </p>
          </div>

          <form onSubmit={handlePostProject} className="space-y-6">
            {/* Title */}
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

            {/* Category */}
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

            {/* Project Type */}
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

            {/* Budget Values */}
            {newProject.projectType === 'FIXED' ? (
              <label className="block">
                <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-500 mb-1.5">Ngân sách trọn gói (VND)</span>
                <input
                  type="number"
                  min="0"
                  value={newProject.budgetFixed}
                  onChange={(e) => setNewProject(prev => ({ ...prev, budgetFixed: e.target.value }))}
                  placeholder="VD: 5000000 (Để trống nếu muốn tự thỏa thuận)"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-secondary focus:bg-white focus:ring-4 focus:ring-secondary/10"
                />
              </label>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-500 mb-1.5">Tối thiểu (VND)</span>
                  <input
                    type="number"
                    min="0"
                    value={newProject.budgetMin}
                    onChange={(e) => setNewProject(prev => ({ ...prev, budgetMin: e.target.value }))}
                    placeholder="VD: 2000000"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-secondary focus:bg-white focus:ring-4 focus:ring-secondary/10"
                  />
                </label>
                <label className="block">
                  <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-500 mb-1.5">Tối đa (VND) *</span>
                  <input
                    type="number"
                    min="0"
                    value={newProject.budgetMax}
                    onChange={(e) => setNewProject(prev => ({ ...prev, budgetMax: e.target.value }))}
                    placeholder="VD: 10000000"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-secondary focus:bg-white focus:ring-4 focus:ring-secondary/10"
                  />
                </label>
              </div>
            )}

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

            {/* Description */}
            <label className="block">
              <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-500 mb-1.5">Mô tả công việc & Yêu cầu chi tiết *</span>
              <textarea
                required
                rows="6"
                value={newProject.description}
                onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Mô tả cụ thể dự án, danh sách các công việc cần làm, yêu cầu kỹ năng đối với Freelancer và kết quả bàn giao mong muốn..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-secondary focus:bg-white focus:ring-4 focus:ring-secondary/10 resize-none leading-relaxed"
              />
            </label>
            {/* Buttons */}
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

import React, { useState, useEffect } from 'react';
import { Camera, Plus } from 'lucide-react';
import ComingSoon from '../../../pages/ComingSoon.jsx';

export default function UserProfilePage({ user, onNavigate }) {
  const [activeTab, setActiveTab] = useState('Thông tin cá nhân');

  // For Portfolio Tab
  const [portfolios, setPortfolios] = useState([]);
  const [isAddingPortfolio, setIsAddingPortfolio] = useState(false);
  
  // For popup coming soon
  const [isShowComingSoon, setIsShowComingSoon] = useState(false);

  // For Work Profile
  const [categories, setCategories] = useState([]);
  const [workProfile, setWorkProfile] = useState({
    professionalTitle: user?.professionalTitle || '',
    bio: user?.bio || '',
    personalWebsite: user?.personalWebsite || '',
    expertiseField: user?.expertiseField || '',
    experienceLevel: user?.experienceLevel || '',
    primarySkills: user?.primarySkills || '',
    servicesOffered: user?.servicesOffered || '',
    isAvailable: user?.isAvailable !== false,
    availabilityType: user?.availabilityType || 'Bán thời gian (dưới 40h/tuần)'
  });

  const [newPortfolio, setNewPortfolio] = useState({
    title: '',
    attachmentUrl: '',
    description: '',
    relatedService: '',
    productLink: ''
  });

  const [isEditingWorkProfile, setIsEditingWorkProfile] = useState(true);
  const [successToast, setSuccessToast] = useState(null);
  const [errorToast, setErrorToast] = useState(null);
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);

  const freelancerId = user?.profileId || user?.freelancerId || 1; // Default to 1 for testing if user is missing

  const showSuccess = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const showError = (msg) => {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(null), 3000);
  };

  useEffect(() => {
    fetchCategories();
    fetchPortfolios();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (e) {
      console.error('Error fetching categories:', e);
    }
  };

  const fetchPortfolios = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/freelancers/${freelancerId}/portfolios`);
      if (res.ok) {
        const data = await res.json();
        setPortfolios(data);
      }
    } catch (e) {
      console.error('Error fetching portfolios:', e);
    }
  };

  const handleSaveWorkProfile = async () => {
    // Validation
    if (!workProfile.professionalTitle || !workProfile.bio || !workProfile.expertiseField || 
        !workProfile.experienceLevel || !workProfile.primarySkills || !workProfile.servicesOffered) {
      showError('Vui lòng nhập đầy đủ các trường bắt buộc (*)');
      return;
    }

    try {
      const res = await fetch(`http://localhost:8080/api/freelancers/${freelancerId}/work-profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workProfile)
      });
      if (res.ok) {
        showSuccess('Lưu hồ sơ làm việc thành công!');
        setIsEditingWorkProfile(false);
      } else {
        showError('Lưu thất bại! Hãy thử lại.');
      }
    } catch (e) {
      console.error(e);
      showError('Đã xảy ra lỗi kết nối đến server!');
    }
  };

  const handleSavePortfolio = async () => {
    if (!newPortfolio.title || !newPortfolio.attachmentUrl || !newPortfolio.description) {
      showError('Vui lòng nhập đầy đủ các trường dữ liệu bắt buộc (*)');
      return;
    }

    try {
      const res = await fetch(`http://localhost:8080/api/freelancers/${freelancerId}/portfolios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPortfolio)
      });
      if (res.ok) {
        showSuccess('Thêm hồ sơ năng lực thành công!');
        fetchPortfolios();
        setIsAddingPortfolio(false);
        setNewPortfolio({
          title: '', attachmentUrl: '', description: '', relatedService: '', productLink: ''
        });
      } else {
        showError('Thêm hồ sơ thất bại! Hãy thử lại.');
      }
    } catch (e) {
      console.error(e);
      showError('Đã xảy ra lỗi kết nối đến server!');
    }
  };

  const handleDeletePortfolio = async (portfolioId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa hồ sơ năng lực này không?")) return;

    try {
      const res = await fetch(`http://localhost:8080/api/freelancers/portfolios/${portfolioId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showSuccess('Xóa hồ sơ năng lực thành công!');
        fetchPortfolios();
      } else {
        showError('Xóa hồ sơ thất bại!');
      }
    } catch (e) {
      console.error(e);
      showError('Đã xảy ra lỗi kết nối đến server!');
    }
  };

  const menuItems = [
    { id: 'Tài khoản', label: 'Tài khoản', active: true },
    { id: 'Cài đặt chung', label: 'Cài đặt chung', action: () => setIsShowComingSoon(true) },
    { id: 'Tài khoản ngân hàng', label: 'Tài khoản ngân hàng', action: () => setIsShowComingSoon(true) },
    { id: 'Giao dịch tiền', label: 'Giao dịch tiền', action: () => setIsShowComingSoon(true) },
    { id: 'Rút tiền', label: 'Rút tiền', action: () => setIsShowComingSoon(true) },
  ];

  const tabs = [
    'Thông tin cá nhân',
    'Hồ sơ làm việc',
    'Hồ sơ năng lực',
    'Xác thực thông tin'
  ];

  // Dummy portfolio data for testing TH2 if we want to toggle it:
  // setPortfolios([{ id: 1, title: 'Thiết kế Landing Page vLance', summary: 'Thiết kế UX/UI cho trang chủ vLance' }]);
  
  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Sidebar */}
          <div className="w-full md:w-64 shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="flex flex-col">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={item.action}
                    className={`text-left px-5 py-4 border-b border-slate-100 last:border-0 transition-colors ${
                      item.active 
                        ? 'bg-blue-500 text-white font-bold' 
                        : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600 font-medium'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 min-h-[600px] overflow-hidden">
            {/* Tabs */}
            <div className="flex overflow-x-auto border-b border-slate-200">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`whitespace-nowrap px-6 py-4 font-bold text-[15px] transition-colors border-b-2 ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-8">
              
              {/* TAB 1: THÔNG TIN CÁ NHÂN */}
              {activeTab === 'Thông tin cá nhân' && (
                <div className="max-w-4xl space-y-10">
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                        1
                      </div>
                      <h2 className="text-lg font-bold text-slate-800 uppercase">Thông tin chung</h2>
                    </div>

                    <div className="space-y-6">
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="w-32 font-semibold text-slate-700 pt-2">Ảnh đại diện <span className="text-red-500">*</span></div>
                        <div className="flex-1">
                          <div className="w-24 h-24 bg-slate-200 rounded-lg overflow-hidden flex items-center justify-center mb-3">
                            {user?.avatar ? (
                              <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <Camera className="w-8 h-8 text-slate-400" />
                            )}
                          </div>
                          <div className="text-xs text-slate-500">
                            <p>1. Kích thước không quá 1MB</p>
                            <p>2. Định dạng hỗ trợ: jpg, jpeg, png</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <div className="flex flex-col gap-2">
                          <label className="font-semibold text-slate-700 text-sm">Họ và tên <span className="text-red-500">*</span></label>
                          <input type="text" readOnly value={user?.name || ''} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 bg-slate-50 text-slate-600 outline-none" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-semibold text-slate-700 text-sm">Email <span className="text-red-500">*</span></label>
                          <input type="email" readOnly value={user?.email || ''} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 bg-slate-50 text-slate-600 outline-none" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-semibold text-slate-700 text-sm">Điện thoại <span className="text-red-500">*</span></label>
                          <input type="text" readOnly value="0123456789" className="w-full border border-slate-300 rounded-lg px-4 py-2.5 bg-slate-50 text-slate-600 outline-none" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-semibold text-slate-700 text-sm">Thành phố <span className="text-red-500">*</span></label>
                          <select disabled className="w-full border border-slate-300 rounded-lg px-4 py-2.5 bg-slate-50 text-slate-600 outline-none appearance-none">
                            <option>Hà Nội</option>
                            <option>Hồ Chí Minh</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-semibold text-slate-700 text-sm">Địa chỉ <span className="text-red-500">*</span></label>
                          <input type="text" readOnly value="" placeholder="Địa chỉ" className="w-full border border-slate-300 rounded-lg px-4 py-2.5 bg-slate-50 text-slate-600 outline-none" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="w-full h-px bg-slate-100"></div>

                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                        2
                      </div>
                      <h2 className="text-lg font-bold text-slate-800 uppercase">Thay đổi mật khẩu</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-x-8 gap-y-6 max-w-md">
                      <div className="flex flex-col gap-2">
                        <label className="font-semibold text-slate-700 text-sm">Mật khẩu cũ</label>
                        <input type="password" readOnly placeholder="Mật khẩu hiện tại" className="w-full border border-slate-300 rounded-lg px-4 py-2.5 bg-slate-50 text-slate-600 outline-none" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="font-semibold text-slate-700 text-sm">Mật khẩu mới</label>
                        <input type="password" readOnly placeholder="Mật khẩu mới" className="w-full border border-slate-300 rounded-lg px-4 py-2.5 bg-slate-50 text-slate-600 outline-none" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="font-semibold text-slate-700 text-sm">Nhập lại mật khẩu mới</label>
                        <input type="password" readOnly placeholder="Nhập lại mật khẩu mới" className="w-full border border-slate-300 rounded-lg px-4 py-2.5 bg-slate-50 text-slate-600 outline-none" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-100 flex justify-start">
                    <button onClick={() => setIsShowComingSoon(true)} className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold py-2.5 px-8 rounded-lg shadow-sm transition-colors">
                      Lưu thông tin
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: HỒ SƠ LÀM VIỆC */}
              {activeTab === 'Hồ sơ làm việc' && (
                <div className="max-w-4xl space-y-10">
                  {/* Section 1 */}
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                        1
                      </div>
                      <h2 className="text-lg font-bold text-slate-800 uppercase">Giới thiệu chung</h2>
                    </div>

                    <div className="space-y-6">
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="w-48 font-semibold text-slate-700 pt-2">Chức danh <span className="text-red-500">*</span></div>
                        <div className="flex-1">
                          <input 
                            type="text" 
                            placeholder="Giới thiệu ngắn gọn" 
                            value={workProfile.professionalTitle}
                            onChange={(e) => setWorkProfile({...workProfile, professionalTitle: e.target.value})}
                            disabled={!isEditingWorkProfile}
                            className={`w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-700 outline-none focus:border-blue-500 ${!isEditingWorkProfile ? 'bg-slate-50' : ''}`} 
                          />
                          <p className="text-xs text-slate-400 mt-1">VD: Lập trình viên web PHP / Chuyên gia thiết kế đồ hoạ với 6 năm kinh nghiệm / v.v...</p>
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="w-48 font-semibold text-slate-700 pt-2">Giới thiệu bản thân <span className="text-red-500">*</span></div>
                        <div className="flex-1">
                          <p className="text-sm text-slate-500 mb-2 font-medium">Giới thiệu đầy đủ</p>
                          <p className="text-xs text-slate-400 mb-2">Vui lòng không điền các thông tin liên lạc như email, số điện thoại, skype... trong nội dung bên dưới.</p>
                          <textarea 
                            rows={8} 
                            placeholder="Bản giới thiệu đầy đủ này sẽ giúp người xem hiểu rõ hơn về bạn..."
                            value={workProfile.bio}
                            onChange={(e) => setWorkProfile({...workProfile, bio: e.target.value})}
                            disabled={!isEditingWorkProfile}
                            className={`w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-700 outline-none focus:border-blue-500 resize-y ${!isEditingWorkProfile ? 'bg-slate-50' : ''}`}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="w-48 font-semibold text-slate-700 pt-2">Website cá nhân</div>
                        <div className="flex-1">
                          <input 
                            type="text" 
                            placeholder="Điền link website ở đây (nếu có)" 
                            value={workProfile.personalWebsite}
                            onChange={(e) => setWorkProfile({...workProfile, personalWebsite: e.target.value})}
                            disabled={!isEditingWorkProfile}
                            className={`w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-700 outline-none focus:border-blue-500 ${!isEditingWorkProfile ? 'bg-slate-50' : ''}`} 
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="w-full h-px bg-slate-100"></div>

                  {/* Section 2 */}
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                        2
                      </div>
                      <h2 className="text-lg font-bold text-slate-800 uppercase">Kinh nghiệm làm việc</h2>
                    </div>

                    <div className="space-y-6">
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="w-48 font-semibold text-slate-700 pt-2">Lĩnh vực chuyên môn <span className="text-red-500">*</span></div>
                        <div className="flex-1">
                          <select 
                            value={workProfile.expertiseField}
                            onChange={(e) => setWorkProfile({...workProfile, expertiseField: e.target.value})}
                            disabled={!isEditingWorkProfile}
                            className={`w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-700 outline-none focus:border-blue-500 ${!isEditingWorkProfile ? 'bg-slate-50' : 'bg-white'}`}
                          >
                            <option value="">Chọn lĩnh vực chuyên môn</option>
                            {categories.map(cat => (
                              <option key={cat.id} value={cat.name}>{cat.name}</option>
                            ))}
                          </select>
                          <p className="text-xs text-slate-400 mt-1">Lĩnh vực chính mà bạn đang làm việc hoặc có nhiều kinh nghiệm nhất.</p>
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="w-48 font-semibold text-slate-700 pt-2">Trình độ <span className="text-red-500">*</span></div>
                        <div className="flex-1">
                          <select 
                            value={workProfile.experienceLevel}
                            onChange={(e) => setWorkProfile({...workProfile, experienceLevel: e.target.value})}
                            disabled={!isEditingWorkProfile}
                            className={`w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-700 outline-none focus:border-blue-500 ${!isEditingWorkProfile ? 'bg-slate-50' : 'bg-white'}`}
                          >
                            <option value="">Chọn mức kinh nghiệm phù hợp</option>
                            <option value="Mới đi làm">Mới đi làm</option>
                            <option value="Đã có kinh nghiệm">Đã có kinh nghiệm</option>
                            <option value="Chuyên gia">Chuyên gia</option>
                          </select>
                          <div className="text-xs text-slate-400 mt-2 space-y-1">
                            <p>Hãy chọn mức "Trình độ" đúng với năng lực của bạn để được nhận những công việc phù hợp:</p>
                            <p>- <strong>Mới đi làm</strong> (dưới 2 năm kinh nghiệm)</p>
                            <p>- <strong>Đã có kinh nghiệm</strong> (từ 2-5 năm kinh nghiệm)</p>
                            <p>- <strong>Chuyên gia</strong> (trên 5 năm kinh nghiệm)</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="w-48 font-semibold text-slate-700 pt-2">Kỹ năng chính <span className="text-red-500">*</span></div>
                        <div className="flex-1">
                          <input 
                            type="text" 
                            placeholder="Kỹ năng bạn có" 
                            value={workProfile.primarySkills}
                            onChange={(e) => setWorkProfile({...workProfile, primarySkills: e.target.value})}
                            disabled={!isEditingWorkProfile}
                            className={`w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-700 outline-none focus:border-blue-500 ${!isEditingWorkProfile ? 'bg-slate-50' : ''}`} 
                          />
                          <p className="text-xs text-slate-400 mt-1">Kỹ năng của bạn không có trong danh sách trên? Hãy <a href="#" className="text-blue-500 hover:underline">gửi gợi ý cho chúng tôi</a>.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="w-full h-px bg-slate-100"></div>

                  {/* Section 3 */}
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                        3
                      </div>
                      <h2 className="text-lg font-bold text-slate-800 uppercase">Hồ sơ dịch vụ</h2>
                    </div>

                    <div className="space-y-6">
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="w-48 font-semibold text-slate-700 pt-2">Danh sách dịch vụ <span className="text-red-500">*</span></div>
                        <div className="flex-1">
                          <input 
                            type="text" 
                            placeholder="Tên dịch vụ (VD: Thiết kế banner facebook,...)" 
                            value={workProfile.servicesOffered}
                            onChange={(e) => setWorkProfile({...workProfile, servicesOffered: e.target.value})}
                            disabled={!isEditingWorkProfile}
                            className={`w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-700 outline-none focus:border-blue-500 ${!isEditingWorkProfile ? 'bg-slate-50' : ''}`} 
                          />
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">Bạn cần nhập ít nhất 1 dịch vụ mà bạn có thể cung cấp cho khách hàng. Bạn sẽ nhận được thông báo việc ngay lập tức nếu khách hàng đăng việc liên quan đến dịch vụ của bạn.</p>
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row gap-6 items-center">
                        <div className="w-48 font-semibold text-slate-700">Muốn nhận việc? <span className="text-red-500">*</span></div>
                        <div className="flex-1">
                          <select 
                            value={workProfile.isAvailable ? 'Có' : 'Không'}
                            onChange={(e) => setWorkProfile({...workProfile, isAvailable: e.target.value === 'Có'})}
                            disabled={!isEditingWorkProfile}
                            className={`w-1/2 border border-slate-300 rounded-lg px-4 py-2 text-slate-700 outline-none focus:border-blue-500 ${!isEditingWorkProfile ? 'bg-slate-50' : 'bg-white'}`}
                          >
                            <option value="Có">Có</option>
                            <option value="Không">Không</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row gap-6 items-center">
                        <div className="w-48 font-semibold text-slate-700">Tôi có thể làm <span className="text-red-500">*</span></div>
                        <div className="flex-1">
                          <select 
                            value={workProfile.availabilityType}
                            onChange={(e) => setWorkProfile({...workProfile, availabilityType: e.target.value})}
                            disabled={!isEditingWorkProfile}
                            className={`w-1/2 border border-slate-300 rounded-lg px-4 py-2 text-slate-700 outline-none focus:border-blue-500 ${!isEditingWorkProfile ? 'bg-slate-50' : 'bg-white'}`}
                          >
                            <option value="Bán thời gian (dưới 40h/tuần)">Bán thời gian (dưới 40h/tuần)</option>
                            <option value="Toàn thời gian (trên 40h/tuần)">Toàn thời gian (trên 40h/tuần)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-start gap-4">
                    {!isEditingWorkProfile ? (
                      <button 
                        onClick={() => setIsEditingWorkProfile(true)} 
                        className="bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold py-2.5 px-8 rounded-lg shadow-sm transition-colors"
                      >
                        Chỉnh sửa hồ sơ
                      </button>
                    ) : (
                      <button 
                        onClick={handleSaveWorkProfile} 
                        className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold py-2.5 px-8 rounded-lg shadow-sm transition-colors"
                      >
                        Lưu các thay đổi
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: HỒ SƠ NĂNG LỰC */}
              {activeTab === 'Hồ sơ năng lực' && (
                <div className="max-w-4xl space-y-10">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                        1
                      </div>
                      <h2 className="text-lg font-bold text-slate-800 uppercase">Hồ sơ năng lực</h2>
                    </div>
                    
                    <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                      Hồ sơ năng lực là các dự án cũ hoặc các công việc bạn đã từng làm trước đây (bao gồm cả các khách hàng bên ngoài vLance). Khách hàng trước khi giao việc thường xem qua các hồ sơ năng lực của freelancer rồi mới quyết định thuê. Vì vậy hãy đăng càng nhiều hồ sơ năng lực chất lượng, bạn càng có thêm nhiều cơ hội được nhận việc.
                    </p>

                    {portfolios.length === 0 ? (
                      <p className="text-sm text-slate-800 font-medium bg-slate-100 p-4 rounded-lg">
                        Hiện tại bạn <strong className="text-red-500">chưa có hồ sơ năng lực nào</strong>. Hãy dùng form dưới đây để bắt đầu đăng hồ sơ đầu tiên ngay bây giờ nhé.
                      </p>
                    ) : (
                      <div className="space-y-4 mb-6">
                        {portfolios.map((pf, idx) => (
                          <div key={idx} className="flex justify-between items-center p-4 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors">
                            <div>
                              <h3 className="font-bold text-slate-800 text-lg">{pf.title}</h3>
                              <p className="text-sm text-slate-500 mt-1">{pf.description?.length > 100 ? pf.description.substring(0, 100) + '...' : pf.description}</p>
                            </div>
                            <div className="flex gap-4">
                              <button 
                                onClick={() => setSelectedPortfolio(pf)}
                                className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                Xem chi tiết
                              </button>
                              <button 
                                onClick={() => handleDeletePortfolio(pf.portfolioId)}
                                className="text-sm font-semibold text-red-500 hover:text-red-700 hover:underline"
                              >
                                Xóa
                              </button>
                            </div>
                          </div>
                        ))}
                        
                        {!isAddingPortfolio && (
                          <button 
                            onClick={() => setIsAddingPortfolio(true)}
                            className="flex items-center gap-2 mt-4 px-6 py-2.5 bg-emerald-50 text-emerald-600 font-bold border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                          >
                            <Plus className="w-4 h-4" /> Thêm hồ sơ
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {(portfolios.length === 0 || isAddingPortfolio) && (
                    <>
                      <div className="w-full h-px bg-slate-100"></div>

                      <div>
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                            2
                          </div>
                          <h2 className="text-lg font-bold text-slate-800 uppercase">Thêm hồ sơ</h2>
                        </div>

                        <div className="space-y-6">
                          <div className="flex flex-col md:flex-row gap-6">
                            <div className="w-48 font-semibold text-slate-700 pt-2">Tiêu đề <span className="text-red-500">*</span></div>
                            <div className="flex-1">
                              <input 
                                type="text" 
                                placeholder="Tiêu đề" 
                                value={newPortfolio.title}
                                onChange={(e) => setNewPortfolio({...newPortfolio, title: e.target.value})}
                                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-700 outline-none focus:border-blue-500" 
                              />
                              <p className="text-xs text-slate-400 mt-1">Tên dự án hoặc tên sản phẩm bạn đã thực hiện</p>
                            </div>
                          </div>

                          <div className="flex flex-col md:flex-row gap-6">
                            <div className="w-48 font-semibold text-slate-700 pt-2">File đính kèm <span className="text-red-500">*</span></div>
                            <div className="flex-1">
                              <input 
                                type="text" 
                                placeholder="Nhập URL file đính kèm..."
                                value={newPortfolio.attachmentUrl}
                                onChange={(e) => setNewPortfolio({...newPortfolio, attachmentUrl: e.target.value})}
                                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-700 outline-none focus:border-blue-500 mb-2" 
                              />
                              <input type="file" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer border border-slate-300 rounded-lg p-1.5 bg-white" />
                              <div className="text-xs text-slate-400 mt-2 space-y-1">
                                <p>1. Kích thước không quá 5 MB</p>
                                <p>2. Định dạng được hỗ trợ</p>
                                <p>- Về tài liệu: .doc, .docx, .pdf</p>
                                <p>- Về hình ảnh: .jpg, .jpeg, .png, .gif</p>
                                <p>3. Nếu là ảnh:</p>
                                <p>- Kích thước tối thiểu là 380 x 214</p>
                                <p>- Kích thước tối đa là 1600 x 900</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col md:flex-row gap-6">
                            <div className="w-48 font-semibold text-slate-700 pt-2">Mô tả chi tiết <span className="text-red-500">*</span></div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-600 mb-1">Mô tả về dự án</p>
                              <p className="text-xs text-slate-400 mb-2">Vui lòng không điền các thông tin liên lạc như email, số điện thoại... trong nội dung bên dưới.</p>
                              <textarea 
                                rows={8} 
                                placeholder="Mô tả"
                                value={newPortfolio.description}
                                onChange={(e) => setNewPortfolio({...newPortfolio, description: e.target.value})}
                                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-700 outline-none focus:border-blue-500 resize-y mb-1"
                              />
                              <p className="text-xs text-slate-400">Hãy viết thật chi tiết về sản phẩm hoặc dự án này để người xem có thể hiểu được những công việc thực sự bạn đã làm.</p>
                            </div>
                          </div>

                          <div className="flex flex-col md:flex-row gap-6">
                            <div className="w-48 font-semibold text-slate-700 pt-2">Dịch vụ liên quan</div>
                            <div className="flex-1">
                              <input 
                                type="text" 
                                placeholder="Tên dịch vụ (VD : Thiết kế banner facebook,...)" 
                                value={newPortfolio.relatedService}
                                onChange={(e) => setNewPortfolio({...newPortfolio, relatedService: e.target.value})}
                                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-700 outline-none focus:border-blue-500" 
                              />
                              <p className="text-xs text-slate-400 mt-1 leading-relaxed">Bạn cần nhập 1 dịch vụ mà bạn có thể cung cấp cho khách hàng...</p>
                            </div>
                          </div>

                          <div className="flex flex-col md:flex-row gap-6">
                            <div className="w-48 font-semibold text-slate-700 pt-2">Link sản phẩm</div>
                            <div className="flex-1">
                              <input 
                                type="text" 
                                placeholder="Link web dẫn đến dự án hoặc sản phẩm này" 
                                value={newPortfolio.productLink}
                                onChange={(e) => setNewPortfolio({...newPortfolio, productLink: e.target.value})}
                                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-700 outline-none focus:border-blue-500" 
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="pt-6 flex justify-start">
                          <button 
                            onClick={handleSavePortfolio} 
                            className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold py-2.5 px-8 rounded-lg shadow-sm transition-colors"
                          >
                            Lưu hồ sơ
                          </button>
                          {portfolios.length > 0 && (
                            <button 
                              onClick={() => setIsAddingPortfolio(false)} 
                              className="ml-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 px-6 rounded-lg transition-colors"
                            >
                              Hủy
                            </button>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* TAB 4: XÁC THỰC THÔNG TIN */}
              {activeTab === 'Xác thực thông tin' && (
                <div className="text-slate-500 text-center py-20">
                  Tính năng Xác thực thông tin đang được phát triển...
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
      {isShowComingSoon && (
        <ComingSoon isPopup={true} onClose={() => setIsShowComingSoon(false)} />
      )}

      {/* Portfolio Detail Modal */}
      {selectedPortfolio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">Chi tiết hồ sơ năng lực</h3>
              <button 
                onClick={() => setSelectedPortfolio(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">{selectedPortfolio.title}</h2>
              {selectedPortfolio.relatedService && (
                <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 text-sm font-medium rounded-full mb-6">
                  {selectedPortfolio.relatedService}
                </span>
              )}
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">Mô tả dự án</h4>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{selectedPortfolio.description}</p>
                </div>
                
                {selectedPortfolio.attachmentUrl && (
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">File đính kèm</h4>
                    <a href={selectedPortfolio.attachmentUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      {selectedPortfolio.attachmentUrl}
                    </a>
                  </div>
                )}

                {selectedPortfolio.productLink && (
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">Link sản phẩm</h4>
                    <a href={selectedPortfolio.productLink} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      {selectedPortfolio.productLink}
                    </a>
                  </div>
                )}
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setSelectedPortfolio(null)}
                className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {successToast && (
        <div className="fixed bottom-6 right-6 bg-slate-800 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-emerald-500 rounded-full p-1">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <span className="font-medium text-sm">{successToast}</span>
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

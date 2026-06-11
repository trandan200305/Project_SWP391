import React, { useState, useEffect } from 'react';
import { Camera, CheckCircle, Plus } from 'lucide-react';
import UserProfile from '../components/UserProfile.jsx';
import EditProfileForm from '../components/EditProfileForm.jsx';
import UserSettings from '../components/UserSettings.jsx';

export default function UserProfilePage({ user, onNavigate, onLogout, defaultTab = 'profile' }) {
  const [role, setRole] = useState(user?.role?.toLowerCase() || 'freelancer');
  const [targetId, setTargetId] = useState(user?.id || 1);
  const [activeTab, setActiveTab] = useState(defaultTab); // 'profile', 'edit_profile', 'work_profile', 'portfolio', 'preferences'
  const [prefTab, setPrefTab] = useState('notifications'); // 'notifications', 'security', 'danger', 'kyc'
  
  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);
  
  // ================= COMMON STATE =================
  const [avatarUrl, setAvatarUrl] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [language, setLanguage] = useState('vi');
  const [timezone, setTimezone] = useState('Asia/Ho_Chi_Minh');
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deleteInput, setDeleteInput] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // ================= KYC STATE =================
  const [kycStatus, setKycStatus] = useState('UNVERIFIED');
  const [isVerified, setIsVerified] = useState(false);
  const [kycRejectedReason, setKycRejectedReason] = useState('');
  const [idCardFrontUrl, setIdCardFrontUrl] = useState('');
  const [idCardBackUrl, setIdCardBackUrl] = useState('');
  const [portraitUrl, setPortraitUrl] = useState('');
  const [isUploadingKyc, setIsUploadingKyc] = useState(false);

  // Common Read-only Stats
  const [status, setStatus] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [createdAt, setCreatedAt] = useState('');
  const [lastLoginAt, setLastLoginAt] = useState('');

  // ================= FREELANCER STATE =================
  const [fullName, setFullName] = useState('');
  const [professionalTitle, setProfessionalTitle] = useState('');
  const [bio, setBio] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  
  // Freelancer Read-only Stats
  const [profileCompleteness, setProfileCompleteness] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [projectsCompleted, setProjectsCompleted] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  
  // ================= EMPLOYER STATE =================
  const [companyName, setCompanyName] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [industry, setIndustry] = useState('');
  
  // Employer Read-only Stats
  const [totalSpent, setTotalSpent] = useState(0);
  const [projectsPosted, setProjectsPosted] = useState(0);

  // ================= ADMIN STATE =================
  const [adminLevel, setAdminLevel] = useState('SUPER_ADMIN');

  // ================= WORK PROFILE STATE =================
  const [categories, setCategories] = useState([]);
  const [workProfile, setWorkProfile] = useState({
    professionalTitle: '',
    bio: '',
    personalWebsite: '',
    expertiseField: '',
    experienceLevel: '',
    primarySkills: '',
    servicesOffered: '',
    isAvailable: true,
    availabilityType: 'Bán thời gian (dưới 40h/tuần)'
  });
  const [isEditingWorkProfile, setIsEditingWorkProfile] = useState(true);

  // ================= PORTFOLIO STATE =================
  const [portfolios, setPortfolios] = useState([]);
  const [isAddingPortfolio, setIsAddingPortfolio] = useState(false);
  const [newPortfolio, setNewPortfolio] = useState({
    title: '',
    attachmentUrl: '',
    description: '',
    relatedService: '',
    productLink: ''
  });
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);

  // Fetch Categories on Mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch Portfolios when targetId changes
  useEffect(() => {
    if (role === 'freelancer' && targetId) {
      fetchPortfolios();
    }
  }, [role, targetId]);

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
      const res = await fetch(`http://localhost:8080/api/freelancers/${targetId}/portfolios`);
      if (res.ok) {
        const data = await res.json();
        setPortfolios(data);
      }
    } catch (e) {
      console.error('Error fetching portfolios:', e);
    }
  };

  // Load profile data from server
  useEffect(() => {
    const endpoint = role === 'freelancer' ? `http://localhost:8080/api/freelancers/${targetId}` : (role === 'employer' ? `http://localhost:8080/api/employers/${targetId}` : `http://localhost:8080/api/admin/${targetId}`);
    
    fetch(endpoint)
      .then(res => res.text())
      .then(text => {
        if (!text) {
          console.log("Không tìm thấy ID này trong CSDL!");
          return;
        }
        const data = JSON.parse(text);

        if (data.displayName) setDisplayName(data.displayName);
        if (data.email) setEmail(data.email);
        if (data.phone) setPhone(data.phone);
        if (data.language) setLanguage(data.language);
        if (data.timezone) setTimezone(data.timezone);
        if (data.avatarUrl) setAvatarUrl(data.avatarUrl);
        if (data.status) setStatus(data.status);
        if (data.emailVerified) setEmailVerified(data.emailVerified);
        if (data.createdAt) setCreatedAt(data.createdAt);
        if (data.lastLoginAt) setLastLoginAt(data.lastLoginAt);
        if (data.kycStatus) setKycStatus(data.kycStatus);
        if (data.isVerified !== undefined) setIsVerified(data.isVerified);
        if (data.kycRejectedReason) setKycRejectedReason(data.kycRejectedReason);
        if (data.idCardFrontUrl) setIdCardFrontUrl(data.idCardFrontUrl);
        if (data.idCardBackUrl) setIdCardBackUrl(data.idCardBackUrl);
        if (data.portraitUrl) setPortraitUrl(data.portraitUrl);
        
        if (role === 'freelancer') {
          if (data.fullName) setFullName(data.fullName);
          if (data.professionalTitle) setProfessionalTitle(data.professionalTitle);
          if (data.bio) setBio(data.bio);
          if (data.hourlyRate) setHourlyRate(data.hourlyRate);
          if (data.address) setAddress(data.address);
          if (data.city) setCity(data.city);
          if (data.country) setCountry(data.country);
          if (data.profileCompleteness) setProfileCompleteness(data.profileCompleteness);
          if (data.totalEarnings) setTotalEarnings(data.totalEarnings);
          if (data.projectsCompleted) setProjectsCompleted(data.projectsCompleted);
          if (data.averageRating) setAverageRating(data.averageRating);

          setWorkProfile({
            professionalTitle: data.professionalTitle || '',
            bio: data.bio || '',
            personalWebsite: data.personalWebsite || '',
            expertiseField: data.expertiseField || '',
            experienceLevel: data.experienceLevel || '',
            primarySkills: data.primarySkills || '',
            servicesOffered: data.servicesOffered || '',
            isAvailable: data.isAvailable !== false,
            availabilityType: data.availabilityType || 'Bán thời gian (dưới 40h/tuần)'
          });
        } else if (role === 'employer') {
          if (data.companyName) setCompanyName(data.companyName);
          if (data.fullName) setFullName(data.fullName);
          if (data.companyDescription) setCompanyDescription(data.companyDescription);
          if (data.website) setWebsite(data.website);
          if (data.companySize) setCompanySize(data.companySize);
          if (data.industry) setIndustry(data.industry);
          if (data.address) setAddress(data.address);
          if (data.city) setCity(data.city);
          if (data.country) setCountry(data.country);
          if (data.profileCompleteness) setProfileCompleteness(data.profileCompleteness);
          if (data.totalSpent) setTotalSpent(data.totalSpent);
          if (data.projectsPosted) setProjectsPosted(data.projectsPosted);
          if (data.averageRating) setAverageRating(data.averageRating);
        } else {
           if (data.fullName) setFullName(data.fullName);
           if (data.adminLevel) setAdminLevel(data.adminLevel);
        }
      })
      .catch(error => {
        console.log('Chưa kết nối API Backend hoặc chưa login:', endpoint);
      });
  }, [role, targetId]);

  // Lock profile tab for admins
  useEffect(() => {
    if (role === 'admin' && activeTab === 'profile') {
      setActiveTab('edit_profile');
    }
  }, [role, activeTab]);

  const handleSaveProfile = (e) => {
    if(e) e.preventDefault();
    const endpoint = role === 'admin' ? `http://localhost:8080/api/admin/${targetId}/profile` : `http://localhost:8080/api/${role}s/${targetId}/profile`;
    let payload = {};
    if (role === 'freelancer') {
       payload = { displayName, fullName, phone, professionalTitle, bio, hourlyRate, address, city, country, language, timezone, avatarUrl };
    } else if (role === 'employer') {
       payload = { displayName, fullName, phone, companyName, companyDescription, website, companySize, industry, address, city, country, language, timezone, avatarUrl };
    } else if (role === 'admin') {
       payload = { displayName, fullName, phone, language, timezone, avatarUrl };
    }
    
    fetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(res => {
      alert('Đã lưu thông tin hồ sơ thành công!');
    })
    .catch(error => {
      alert('Lỗi kết nối máy chủ!');
    });
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('Mật khẩu xác nhận không khớp');
      return;
    }
    if (newPassword === currentPassword) {
      alert('Mật khẩu mới không được trùng với mật khẩu cũ');
      return;
    }
    try {
      const response = await fetch('http://localhost:8080/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          role: user.role,
          currentPassword,
          newPassword
        })
      });
      const data = await response.json();
      if (data.success) {
        alert('Đổi mật khẩu thành công!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        alert(data.message || 'Đổi mật khẩu thất bại.');
      }
    } catch (error) {
      alert('Lỗi kết nối server.');
    }
  };

  const handleDeleteAccount = () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài khoản vĩnh viễn?')) return;
    const endpoint = role === 'freelancer' ? `http://localhost:8080/api/freelancers/${targetId}?confirmationText=${deleteInput}` : `http://localhost:8080/api/employers/${targetId}?confirmationText=${deleteInput}`;
    
    fetch(endpoint, { method: 'DELETE' })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert(data.message || 'Tài khoản của bạn đã được xóa.');
          if (onLogout) onLogout();
        } else {
          alert(data.message || 'Xóa tài khoản thất bại!');
        }
      })
      .catch(error => {
        alert('Lỗi kết nối máy chủ!');
      });
  };

  const handleSaveWorkProfile = async () => {
    if (!workProfile.professionalTitle || !workProfile.bio || !workProfile.expertiseField || 
        !workProfile.experienceLevel || !workProfile.primarySkills || !workProfile.servicesOffered) {
      alert('Vui lòng nhập đầy đủ các trường bắt buộc (*)');
      return;
    }

    try {
      const res = await fetch(`http://localhost:8080/api/freelancers/${targetId}/work-profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workProfile)
      });
      if (res.ok) {
        alert('Lưu hồ sơ làm việc thành công!');
        setIsEditingWorkProfile(false);
      } else {
        alert('Lưu thất bại! Hãy thử lại.');
      }
    } catch (e) {
      console.error(e);
      alert('Đã xảy ra lỗi kết nối đến server!');
    }
  };

  const handleSavePortfolio = async () => {
    if (!newPortfolio.title || !newPortfolio.attachmentUrl || !newPortfolio.description) {
      alert('Vui lòng nhập đầy đủ các trường dữ liệu bắt buộc (*)');
      return;
    }

    try {
      const res = await fetch(`http://localhost:8080/api/freelancers/${targetId}/portfolios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPortfolio)
      });
      if (res.ok) {
        alert('Thêm hồ sơ năng lực thành công!');
        fetchPortfolios();
        setIsAddingPortfolio(false);
        setNewPortfolio({
          title: '', attachmentUrl: '', description: '', relatedService: '', productLink: ''
        });
      } else {
        alert('Thêm hồ sơ thất bại! Hãy thử lại.');
      }
    } catch (e) {
      console.error(e);
      alert('Đã xảy ra lỗi kết nối đến server!');
    }
  };

  const handleDeletePortfolio = async (portfolioId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa hồ sơ năng lực này không?")) return;

    try {
      const res = await fetch(`http://localhost:8080/api/freelancers/portfolios/${portfolioId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        alert('Xóa hồ sơ năng lực thành công!');
        fetchPortfolios();
      } else {
        alert('Xóa hồ sơ thất bại!');
      }
    } catch (e) {
      console.error(e);
      alert('Đã xảy ra lỗi kết nối đến server!');
    }
  };

  const formatDate = (dateString) => {
    if(!dateString) return 'N/A';
    const d = new Date(dateString);
    return d.toLocaleDateString('vi-VN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0 VNĐ';
    return new Intl.NumberFormat('vi-VN').format(amount) + ' VNĐ';
  };

  const formatCompactCurrency = (amount) => {
    if (!amount) return '0 VNĐ';
    if (amount >= 1e9) {
      return (amount / 1e9).toFixed(1).replace(/\.0$/, '') + ' Tỷ VNĐ';
    }
    if (amount >= 1e6) {
      return (amount / 1e6).toFixed(1).replace(/\.0$/, '') + ' Tr VNĐ';
    }
    return new Intl.NumberFormat('vi-VN').format(amount) + ' VNĐ';
  };

  const allProps = {
    role, targetId, activeTab, setActiveTab, prefTab, setPrefTab, onNavigate,
    avatarUrl, setAvatarUrl, displayName, setDisplayName, email, setEmail, phone, setPhone, language, setLanguage, timezone, setTimezone,
    currentPassword, setCurrentPassword, newPassword, setNewPassword, confirmPassword, setConfirmPassword, deleteInput, setDeleteInput, isUploadingAvatar, setIsUploadingAvatar,
    kycStatus, setKycStatus, isVerified, setIsVerified, kycRejectedReason, setKycRejectedReason, idCardFrontUrl, setIdCardFrontUrl, idCardBackUrl, setIdCardBackUrl, portraitUrl, setPortraitUrl, isUploadingKyc, setIsUploadingKyc,
    status, setStatus, emailVerified, setEmailVerified, createdAt, setCreatedAt, lastLoginAt, setLastLoginAt,
    fullName, setFullName, professionalTitle, setProfessionalTitle, bio, setBio, hourlyRate, setHourlyRate, address, setAddress, city, setCity, country, setCountry,
    profileCompleteness, setProfileCompleteness, totalEarnings, setTotalEarnings, projectsCompleted, setProjectsCompleted, averageRating, setAverageRating,
    companyName, setCompanyName, companyDescription, setCompanyDescription, website, setWebsite, companySize, setCompanySize, industry, setIndustry,
    totalSpent, setTotalSpent, projectsPosted, setProjectsPosted,
    adminLevel, setAdminLevel,
    handleSaveProfile, handleSavePassword, handleDeleteAccount, formatDate, formatCurrency, formatCompactCurrency
  };

  // Define tab navigation elements
  const tabs = role === 'freelancer' 
    ? [
        { id: 'profile', label: 'Hồ sơ cá nhân' },
        { id: 'edit_profile', label: 'Sửa hồ sơ' },
        { id: 'work_profile', label: 'Hồ sơ làm việc' },
        { id: 'portfolio', label: 'Hồ sơ năng lực' },
        { id: 'preferences', label: 'Cài đặt chung' }
      ]
    : [
        { id: 'profile', label: 'Thông tin chung' },
        { id: 'edit_profile', label: 'Sửa hồ sơ' },
        { id: 'preferences', label: 'Cài đặt chung' }
      ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans antialiased text-gray-800">
      
      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 pt-24 pb-12">
        <main className="flex-1 px-4 sm:px-8">
          <div className="max-w-[1000px] mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            
            {/* Cover Banner */}
            <div className="h-48 bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200 relative">
               <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px]"></div>
               <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
            </div>

            {/* Profile Header Block */}
            <div className="px-6 sm:px-10 pb-6 relative">
               {/* Avatar */}
               <div className="absolute -top-16 left-6 sm:left-10 w-32 h-32 rounded-full border-[5px] border-white shadow-sm bg-white overflow-hidden group cursor-pointer z-10">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-5xl font-bold text-gray-400">
                      {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="w-6 h-6 text-white mb-1" />
                    <span className="text-[10px] text-white font-medium uppercase tracking-wider">{isUploadingAvatar ? 'Uploading...' : 'Change'}</span>
                    <input type="file" className="hidden" accept="image/*" disabled={isUploadingAvatar} onChange={async (e)=>{
                        const file = e.target.files[0];
                        if(!file) return;
                        
                        setIsUploadingAvatar(true);
                        const formData = new FormData();
                        formData.append('file', file);
                        
                        try {
                          const res = await fetch('http://localhost:8080/api/upload', {
                            method: 'POST',
                            body: formData
                          });
                          const data = await res.json();
                          
                          if (data.success) {
                            setAvatarUrl(data.fileUrl);
                            
                            const updateEndpoint = role === 'admin' ? `http://localhost:8080/api/admin/${targetId}/profile` : `http://localhost:8080/api/${role}s/${targetId}/profile`;
                            await fetch(updateEndpoint, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ avatarUrl: data.fileUrl })
                            });
                            
                            alert('Đã tải ảnh lên và lưu vào CSDL thành công!');
                          } else {
                            alert('Upload ảnh thất bại!');
                          }
                        } catch (err) {
                          alert('Lỗi upload ảnh! Đảm bảo Backend đang chạy.');
                        } finally {
                          setIsUploadingAvatar(false);
                          e.target.value = '';
                        }
                    }}/>
                  </label>
               </div>

               {/* Name & Actions Header */}
               <div className="flex flex-col sm:flex-row sm:items-end justify-between pt-20 sm:pt-4 ml-0 sm:ml-[140px] gap-4">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 leading-tight tracking-tight flex items-center gap-2">
                       {role === 'freelancer' ? (displayName || fullName || 'Unnamed Freelancer') : (role === 'employer' ? (displayName || companyName || 'Unnamed Company') : (displayName || fullName || 'Administrator'))}
                       {isVerified && <CheckCircle className="w-7 h-7 text-blue-500 flex-shrink-0" title="Tài khoản đã xác thực KYC" />}
                    </h2>
                    <div className="flex items-center gap-2 mt-1.5 text-sm text-gray-500 font-medium">
                       <span>{role === 'freelancer' ? professionalTitle || 'Professional Title' : (role === 'employer' ? industry || 'Industry' : 'System Administrator')}</span>
                       <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                       <span className="text-gray-900 font-semibold">{email || 'email@example.com'}</span>
                    </div>
                  </div>
               </div>
            </div>

            {/* Navigation Tabs Bar */}
            <div className="flex overflow-x-auto border-b border-gray-100 bg-gray-50/50 px-6 sm:px-10">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap px-6 py-4 font-bold text-[14px] transition-colors border-b-2 outline-none ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Contents Area */}
            <div className="p-6 sm:px-10 py-8">
               {activeTab === 'profile' && <UserProfile {...allProps} />}
               {activeTab === 'edit_profile' && <EditProfileForm {...allProps} />}
               
               {activeTab === 'work_profile' && (
                  <div className="max-w-4xl space-y-10">
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
                                <option key={cat.categoryId} value={cat.categoryName}>{cat.categoryName}</option>
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
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="w-full h-px bg-slate-100"></div>

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
               
               {activeTab === 'portfolio' && (
                  <div className="max-w-4xl space-y-10">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                          1
                        </div>
                        <h2 className="text-lg font-bold text-slate-800 uppercase">Hồ sơ năng lực</h2>
                      </div>
                      
                      <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                        Hồ sơ năng lực là các dự án cũ hoặc các công việc bạn đã từng làm trước đây (bao gồm cả các khách hàng bên ngoài vLance). Khách hàng trước khi giao việc thường xem qua các hồ sơ năng lực của freelancer rồi mới quyết định thuê.
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
                              </div>
                            </div>

                            <div className="flex flex-col md:flex-row gap-6">
                              <div className="w-48 font-semibold text-slate-700 pt-2">Mô tả chi tiết <span className="text-red-500">*</span></div>
                              <div className="flex-1">
                                <textarea 
                                  rows={8} 
                                  placeholder="Mô tả"
                                  value={newPortfolio.description}
                                  onChange={(e) => setNewPortfolio({...newPortfolio, description: e.target.value})}
                                  className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-700 outline-none focus:border-blue-500 resize-y mb-1"
                                />
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

               {activeTab === 'preferences' && <UserSettings {...allProps} />}
            </div>
          </div>
        </main>
      </div>

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
    </div>
  );
}

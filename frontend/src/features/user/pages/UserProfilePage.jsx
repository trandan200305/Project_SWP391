import React, { useState, useEffect } from 'react';
import { Camera, CheckCircle } from 'lucide-react';
import UserProfile from '../components/UserProfile.jsx';
import EditProfileForm from '../components/EditProfileForm.jsx';
import UserSettings from '../components/UserSettings.jsx';

export default function UserProfilePage({ user, onNavigate, defaultTab = 'profile' }) {
  const [role, setRole] = useState(user?.role?.toLowerCase() || 'freelancer');
  const [targetId, setTargetId] = useState(1);
  const [activeTab, setActiveTab] = useState(defaultTab); // 'profile', 'edit_profile', 'preferences'
  const [prefTab, setPrefTab] = useState('notifications'); // 'notifications', 'security', 'danger'
  
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

  // Hàm: Tải dữ liệu hồ sơ người dùng từ máy chủ (Chạy mỗi khi đổi Role hoặc ID)
  useEffect(() => {
    const endpoint = role === 'freelancer' ? `http://localhost:8080/api/freelancers/${targetId}` : (role === 'employer' ? `http://localhost:8080/api/employers/${targetId}` : `http://localhost:8080/api/admin/${targetId}`);
    
    setDisplayName(''); setFullName(''); setCompanyName(''); setEmail(''); setPhone('');
    setBio(''); setCompanyDescription(''); setAvatarUrl(''); setStatus('');
    setProfessionalTitle(''); setHourlyRate(''); setAddress(''); setCity(''); setCountry('');
    setProfileCompleteness(0); setTotalEarnings(0); setProjectsCompleted(0); setAverageRating(0);
    setTotalSpent(0); setProjectsPosted(0);
    setKycStatus('UNVERIFIED'); setIsVerified(false); setKycRejectedReason('');
    setIdCardFrontUrl(''); setIdCardBackUrl(''); setPortraitUrl('');
    
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

  // Hàm: Khóa tab Profile đối với tài khoản Admin
  useEffect(() => {
    if (role === 'admin' && activeTab === 'profile') {
      setActiveTab('edit_profile');
    }
  }, [role, activeTab]);

  // Hàm: Lưu thông tin chỉnh sửa hồ sơ
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

  // Hàm: Đổi mật khẩu tài khoản
  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('Mật khẩu xác nhận không khớp');
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
          if (onNavigate) onNavigate('home');
        } else {
          alert(data.message || 'Xóa tài khoản thất bại!');
        }
      })
      .catch(error => {
        alert('Lỗi kết nối máy chủ!');
      });
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
    role, targetId, activeTab, setActiveTab, prefTab, setPrefTab,
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

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans antialiased text-gray-800">

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 pt-24 pb-12">
        
        <main className="flex-1 px-4 sm:px-8">
          <div className="max-w-[1000px] mx-auto mb-6 flex justify-between items-center gap-4">
              {/* MENU CHUYỂN TAB ĐƯỢC THÊM VÀO ĐÂY */}
              <div className="flex items-center gap-2 bg-white shadow-sm rounded-lg p-1 border border-gray-200">
                  <button onClick={() => setActiveTab('profile')} className={`px-4 py-1.5 text-xs rounded-md font-bold transition-all ${activeTab==='profile'?'bg-blue-100 text-blue-700':'text-gray-600 hover:bg-gray-50'}`}>Hồ Sơ</button>
                  <button onClick={() => setActiveTab('edit_profile')} className={`px-4 py-1.5 text-xs rounded-md font-bold transition-all ${activeTab==='edit_profile'?'bg-blue-100 text-blue-700':'text-gray-600 hover:bg-gray-50'}`}>Sửa Hồ Sơ</button>
                  <button onClick={() => setActiveTab('preferences')} className={`px-4 py-1.5 text-xs rounded-md font-bold transition-all ${activeTab==='preferences'?'bg-blue-100 text-blue-700':'text-gray-600 hover:bg-gray-50'}`}>Cài Đặt Chung</button>
              </div>
             
             {/* INLINE ROLE TOGGLE FOR EASY MANIPULATION */}
             <div className="flex items-center bg-white shadow-sm rounded-lg p-1 border border-gray-200">
                <span className="text-xs font-bold text-gray-500 ml-3 mr-2 uppercase tracking-wide">ID:</span>
                <input 
                   type="number" 
                   value={targetId} 
                   onChange={e => setTargetId(e.target.value)} 
                   className="w-16 text-sm font-bold text-gray-900 bg-gray-50 border border-gray-200 rounded px-2 py-1 mr-4 outline-none focus:border-blue-500" 
                   min="1"
                />
                
                <span className="text-xs font-bold text-gray-500 mr-2 uppercase tracking-wide">Role:</span>
                <button onClick={() => setRole('freelancer')} className={`px-4 py-1.5 text-xs rounded-md font-bold transition-all ${role==='freelancer'?'bg-[#1a73e8] shadow-sm text-white':'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>Freelancer</button>
                <button onClick={() => setRole('employer')} className={`px-4 py-1.5 text-xs rounded-md font-bold transition-all ${role==='employer'?'bg-green-600 shadow-sm text-white':'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>Employer</button>
                <button onClick={() => setRole('admin')} className={`px-4 py-1.5 text-xs rounded-md font-bold transition-all ${role==='admin'?'bg-purple-600 shadow-sm text-white':'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>Admin</button>
             </div>
          </div>
          
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
                        // Hàm: Xử lý sự kiện Upload Avatar và lưu trực tiếp vào CSDL
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

            {/* Tab Contents Area */}
            <div className="p-6 sm:px-10 py-8 border-t border-gray-100">
               {activeTab === 'profile' && <UserProfile {...allProps} />}
               {activeTab === 'edit_profile' && <EditProfileForm {...allProps} />}
               {activeTab === 'preferences' && <UserSettings {...allProps} />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

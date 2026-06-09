import React, { useState, useEffect } from 'react';
import { 
  User, Lock, Globe, Bell, Trash2, Camera, 
  Briefcase, Building2, ShieldAlert, Search, Sparkles,
  LayoutDashboard, Users, Building, List, BarChart2, Workflow,
  Settings as SettingsIcon, HelpCircle, MessageSquare, Menu,
  Mail, Phone, Star, CheckCircle, Clock, MapPin, Activity, DollarSign, Edit3
} from 'lucide-react';


const InputRow = ({ label, value, onChange, placeholder, type = 'text', prefix, suffix }) => (
  <div className="flex justify-between items-center sm:block">
    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider sm:mb-1 block">{label}</span>
    <div className="relative flex items-center w-[160px] sm:w-full">
      {prefix && <span className="absolute left-2 text-gray-400 text-sm">{prefix}</span>}
      <input 
        type={type} 
        value={value} 
        onChange={onChange} 
        className={`text-sm font-semibold text-gray-900 border border-transparent hover:border-gray-200 focus:border-blue-500 bg-transparent focus:bg-white rounded px-2 py-1.5 transition-all outline-none w-full text-right sm:text-left ${prefix ? 'pl-6' : ''} ${suffix ? 'pr-12' : ''}`} 
        placeholder={placeholder} 
      />
      {suffix && <span className="absolute right-2 text-gray-400 text-sm font-semibold">{suffix}</span>}
    </div>
  </div>
);

const ReadOnlyRow = ({ label, value, badgeClass, icon: Icon }) => (
  <div className="flex justify-between items-center py-1">
    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
      {Icon && <Icon className="w-3.5 h-3.5 text-gray-400" />}
      {label}
    </span>
    {badgeClass ? (
       <span className={badgeClass}>{value}</span>
    ) : (
       <span className="text-sm font-bold text-gray-800 text-right">{value}</span>
    )}
  </div>
);

export default function App({ user, onNavigate, defaultTab = 'profile' }) {
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
    const endpoint = role === 'freelancer' ? `http://localhost:8081/api/freelancers/${targetId}` : (role === 'employer' ? `http://localhost:8081/api/employers/${targetId}` : `http://localhost:8081/api/admins/${targetId}`);
    
    setDisplayName(''); setFullName(''); setCompanyName(''); setEmail(''); setPhone('');
    setBio(''); setCompanyDescription(''); setAvatarUrl(''); setStatus('');
    setProfessionalTitle(''); setHourlyRate(''); setAddress(''); setCity(''); setCountry('');
    setProfileCompleteness(0); setTotalEarnings(0); setProjectsCompleted(0); setAverageRating(0);
    setTotalSpent(0); setProjectsPosted(0);
    
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
    
    const endpoint = `http://localhost:8081/api/${role}s/${targetId}/profile`;
    
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
  const handleSavePassword = (e) => {
    e.preventDefault();
  };

  const handleDeleteAccount = () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài khoản vĩnh viễn?')) return;
    const endpoint = role === 'freelancer' ? `http://localhost:8081/api/freelancers/${targetId}?confirmationText=${deleteInput}` : `http://localhost:8081/api/employers/${targetId}?confirmationText=${deleteInput}`;
    
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
                          const res = await fetch('http://localhost:8081/api/upload', {
                            method: 'POST',
                            body: formData
                          });
                          const data = await res.json();
                          
                          if (data.success) {
                            setAvatarUrl(data.fileUrl);
                            
                            const updateEndpoint = `http://localhost:8081/api/${role}s/${targetId}/profile`;
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
                  {emailVerified && (
                    <div className="absolute bottom-1 right-2 w-7 h-7 bg-blue-600 rounded-full border-[3px] border-white flex items-center justify-center shadow-sm">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  )}
               </div>

               {/* Name & Actions Header */}
               <div className="flex flex-col sm:flex-row sm:items-end justify-between pt-20 sm:pt-4 ml-0 sm:ml-[140px] gap-4">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 leading-tight tracking-tight">
                       {role === 'freelancer' ? (displayName || fullName || 'Unnamed Freelancer') : (role === 'employer' ? (displayName || companyName || 'Unnamed Company') : (displayName || fullName || 'Administrator'))}
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
               
               {/* READ-ONLY PROFILE TAB */}
               {activeTab === 'profile' && (
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                   
                   <div className="lg:col-span-2 flex flex-col gap-6">
                     
                     <div className="flex justify-end">
                       <button onClick={() => setActiveTab('edit_profile')} className="px-5 py-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-sm rounded-xl transition-colors flex items-center gap-2 shadow-sm">
                         <Edit3 className="w-4 h-4" /> Chỉnh sửa thông tin cá nhân
                       </button>
                     </div>

                     {/* Bio */}
                     {(role === 'freelancer' || role === 'employer') && (
                       <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                           <User className="w-32 h-32" />
                         </div>
                         <h3 className="font-extrabold text-gray-900 text-xl mb-4 relative z-10">
                            {role === 'freelancer' ? 'Giới thiệu bản thân' : 'Tổng quan Doanh nghiệp'}
                         </h3>
                         <p className="text-[15px] text-gray-600 font-medium leading-relaxed whitespace-pre-line relative z-10">
                           {(role === 'freelancer' ? bio : companyDescription) || 'Chưa có thông tin giới thiệu.'}
                         </p>
                       </div>
                     )}

                     {role === 'freelancer' && (
                       <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                         <h3 className="font-extrabold text-gray-900 text-xl mb-6">Kỹ năng chuyên môn</h3>
                         <div className="flex flex-wrap gap-2">
                           {['React.js', 'UI/UX Design', 'Figma', 'Node.js', 'Tailwind CSS'].map(skill => (
                              <span key={skill} className="px-4 py-2 bg-slate-50 hover:bg-slate-100 cursor-pointer border border-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-colors">{skill}</span>
                           ))}
                         </div>
                       </div>
                     )}
                     
                     {/* Work History Placeholder */}
                     {(role === 'freelancer' || role === 'employer') && (
                       <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                         <h3 className="font-extrabold text-gray-900 text-xl mb-6">Lịch sử làm việc</h3>
                         <div className="text-center py-10">
                           <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                           <p className="text-gray-500 font-bold text-sm">Chưa có dự án nào được hoàn thành.</p>
                         </div>
                       </div>
                     )}
                   </div>

                   {/* Right Column for Profile */}
                   <div className="flex flex-col gap-6">
                     {/* Contact & Basic Info */}
                     <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                       <h3 className="font-extrabold text-gray-900 text-lg mb-6 flex items-center gap-2">
                          Thông tin cơ bản
                       </h3>
                       <div className="space-y-5">
                         <div className="flex items-start gap-4">
                           <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                              <MapPin className="w-5 h-5 text-blue-500" />
                           </div>
                           <div className="pt-0.5">
                             <p className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Vị trí / Địa chỉ</p>
                             <p className="text-[15px] font-bold text-gray-900">{[address, city, country].filter(Boolean).join(', ') || 'Chưa cập nhật'}</p>
                           </div>
                         </div>
                         <div className="flex items-start gap-4">
                           <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                              <Phone className="w-5 h-5 text-green-500" />
                           </div>
                           <div className="pt-0.5">
                             <p className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Số điện thoại</p>
                             <p className="text-[15px] font-bold text-gray-900">{phone || 'Chưa cập nhật'}</p>
                           </div>
                         </div>
                         <div className="flex items-start gap-4">
                           <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                              <Mail className="w-5 h-5 text-purple-500" />
                           </div>
                           <div className="pt-0.5 overflow-hidden">
                             <p className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Email</p>
                             <p className="text-[15px] font-bold text-gray-900 truncate">{email || 'Chưa cập nhật'}</p>
                           </div>
                         </div>
                         {role === 'freelancer' && (
                           <div className="flex items-start gap-4">
                             <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center shrink-0">
                                <DollarSign className="w-5 h-5 text-yellow-600" />
                             </div>
                             <div className="pt-0.5">
                               <p className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Mức lương mong muốn</p>
                               <p className="text-[15px] font-bold text-gray-900">{hourlyRate ? `${formatCurrency(hourlyRate)} / giờ` : 'Thỏa thuận'}</p>
                             </div>
                           </div>
                         )}
                         {role === 'employer' && (
                           <div className="flex items-start gap-4">
                             <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                                <Globe className="w-5 h-5 text-indigo-500" />
                             </div>
                             <div className="pt-0.5 overflow-hidden">
                               <p className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Website</p>
                               <p className="text-[15px] font-bold text-gray-900 truncate">{website || 'Chưa cập nhật'}</p>
                             </div>
                           </div>
                         )}
                       </div>
                     </div>

                     {/* Stats Blocks (2x2 Grid) */}
                     {(role === 'freelancer' || role === 'employer') && (
                       <div className="grid grid-cols-2 gap-4">
                         <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center hover:-translate-y-1 transition-transform cursor-default">
                           <p className="text-lg xl:text-xl font-black text-indigo-600 mb-1 break-words w-full px-1">{role === 'freelancer' ? formatCompactCurrency(totalEarnings) : formatCompactCurrency(totalSpent)}</p>
                           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{role === 'freelancer' ? 'Tổng thu nhập' : 'Đã chi tiêu'}</p>
                         </div>
                         <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center hover:-translate-y-1 transition-transform cursor-default">
                           <p className="text-lg xl:text-xl font-black text-emerald-600 mb-1 break-words w-full px-1">{role === 'freelancer' ? projectsCompleted : projectsPosted}</p>
                           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{role === 'freelancer' ? 'Dự án' : 'Dự án đã đăng'}</p>
                         </div>
                         <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center hover:-translate-y-1 transition-transform cursor-default">
                           <div className="flex items-center justify-center gap-1 mb-1 break-words w-full px-1">
                             <Star className="w-5 h-5 text-yellow-500 fill-yellow-500 shrink-0" />
                             <p className="text-lg xl:text-xl font-black text-gray-900">{averageRating}</p>
                           </div>
                           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Đánh giá</p>
                         </div>
                         <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center hover:-translate-y-1 transition-transform cursor-default">
                           <p className="text-lg xl:text-xl font-black text-blue-500 mb-1 break-words w-full px-1">{profileCompleteness}%</p>
                           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Hoàn thiện</p>
                         </div>
                       </div>
                     )}
                   </div>
                 </div>
               )}

               {/* EDIT PROFILE TAB */}
               {activeTab === 'edit_profile' && (
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                   {/* Left Column (Main Editable Info) */}
                   <div className="lg:col-span-2 flex flex-col gap-6">
                     
                     {/* Giới thiệu bản thân / Công ty */}
                     {(role === 'freelancer' || role === 'employer') && (
                     <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                       <div className="p-5 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
                         <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${role === 'freelancer' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-green-50 border-green-100 text-green-600'}`}>
                           {role === 'freelancer' ? <Briefcase className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                         </div>
                         <div>
                           <h3 className="font-bold text-gray-900 text-sm">
                             {role === 'freelancer' ? 'Giới thiệu bản thân' : 'Tổng quan Doanh nghiệp'}
                           </h3>
                           <p className="text-[11px] text-gray-500 font-medium">LancerPro Profile</p>
                         </div>
                       </div>
                       <div className="p-5">
                         <textarea 
                           value={role === 'freelancer' ? bio : companyDescription}
                           onChange={(e) => {
                             if(role==='freelancer') setBio(e.target.value);
                             else setCompanyDescription(e.target.value);
                           }}
                           placeholder="Viết một vài dòng mô tả chi tiết để khách hàng hiểu hơn về bạn..."
                           className="w-full text-sm text-gray-600 font-medium leading-relaxed border border-transparent hover:border-gray-200 focus:border-blue-500 bg-transparent hover:bg-gray-50 focus:bg-white rounded-lg p-3 resize-none transition-all outline-none min-h-[100px]"
                         />
                       </div>
                     </div>
                     )}

                     {/* Thông tin liên hệ */}
                     <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                       <div className="flex items-center justify-between mb-6">
                         <h3 className="font-bold text-gray-900 text-base">Thông tin liên hệ & Cơ bản</h3>
                       </div>

                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                         <InputRow label="Tên hiển thị" value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Tên ngắn gọn..." />
                         <InputRow label="Họ và Tên thật" value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Tên đầy đủ..." />
                         <InputRow label="Số điện thoại" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+84..." />
                         <InputRow label="Email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email..." />

                         {role === 'freelancer' && (
                           <>
                             <InputRow label="Chức danh nghề nghiệp" value={professionalTitle} onChange={e=>setProfessionalTitle(e.target.value)} placeholder="VD: UI/UX Designer..." />
                             <InputRow label="Mức lương mong muốn / Giờ" value={hourlyRate} onChange={e=>setHourlyRate(e.target.value)} placeholder="0" type="number" suffix="VNĐ" />
                           </>
                         )}

                         {role === 'employer' && (
                           <>
                             <InputRow label="Tên công ty" value={companyName} onChange={e=>setCompanyName(e.target.value)} placeholder="Công ty ABC..." />
                             <InputRow label="Website" value={website} onChange={e=>setWebsite(e.target.value)} placeholder="https://..." />
                             <InputRow label="Quy mô công ty" value={companySize} onChange={e=>setCompanySize(e.target.value)} placeholder="10-50 nhân viên..." />
                             <InputRow label="Lĩnh vực kinh doanh" value={industry} onChange={e=>setIndustry(e.target.value)} placeholder="IT, Giáo dục..." />
                           </>
                         )}

                         {role === 'admin' && (
                           <ReadOnlyRow label="Cấp bậc Admin" value={adminLevel} badgeClass="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md" />
                         )}

                         {/* Vị trí địa lý - Chung cho Freelancer & Employer */}
                         {(role === 'freelancer' || role === 'employer') && (
                           <>
                             <InputRow label="Quốc gia" value={country} onChange={e=>setCountry(e.target.value)} placeholder="Vietnam..." />
                             <InputRow label="Thành phố" value={city} onChange={e=>setCity(e.target.value)} placeholder="Hanoi..." />
                             <InputRow label="Địa chỉ cụ thể" value={address} onChange={e=>setAddress(e.target.value)} placeholder="Số nhà, đường..." />
                           </>
                         )}
                         <InputRow label="Múi giờ (Timezone)" value={timezone} onChange={e=>setTimezone(e.target.value)} placeholder="Asia/Ho_Chi_Minh..." />
                       </div>
                     </div>

                   </div>

                   {/* Right Column (Read Only Stats from DB) */}
                   <div className="flex flex-col gap-6">
                     
                     {/* System Status */}
                     <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between mb-5">
                           <h3 className="font-bold text-gray-900 text-base">Trạng thái Hệ thống</h3>
                        </div>
                        <div className="space-y-4">
                           <ReadOnlyRow 
                              label="Tình trạng tài khoản" 
                              value={status || 'ACTIVE'} 
                              badgeClass={`text-xs font-bold px-2 py-0.5 rounded-md uppercase tracking-wide ${status === 'BANNED' ? 'text-red-600 bg-red-50' : 'text-[#34A853] bg-[#E6F4EA]'}`} 
                           />
                           <ReadOnlyRow 
                              label="Xác thực Email" 
                              value={emailVerified ? 'Đã xác thực' : 'Chưa xác thực'} 
                              badgeClass={`text-xs font-bold px-2 py-0.5 rounded-md ${emailVerified ? 'text-blue-600 bg-blue-50' : 'text-orange-600 bg-orange-50'}`} 
                           />
                           <ReadOnlyRow label="Ngày tạo tài khoản" value={formatDate(createdAt)} icon={Clock} />
                           <ReadOnlyRow label="Lần đăng nhập cuối" value={formatDate(lastLoginAt)} icon={Activity} />
                        </div>
                     </div>

                     {/* Role Specific Stats */}
                     {(role === 'freelancer' || role === 'employer') && (
                     <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                        {/* Background Deco */}
                        <div className="absolute -right-4 -top-4 text-gray-50 opacity-50 pointer-events-none">
                          <BarChart2 className="w-24 h-24" />
                        </div>

                        <h3 className="font-bold text-gray-900 text-base mb-5 relative z-10">Thống kê Hoạt động</h3>
                        
                        {role === 'freelancer' ? (
                          <div className="space-y-4 relative z-10">
                            <ReadOnlyRow label="Độ hoàn thiện hồ sơ" value={`${profileCompleteness}%`} badgeClass="text-sm font-extrabold text-blue-600" />
                            <ReadOnlyRow label="Tổng thu nhập" value={`$${totalEarnings}`} icon={DollarSign} badgeClass="text-sm font-extrabold text-green-600" />
                            <ReadOnlyRow label="Dự án hoàn thành" value={projectsCompleted} icon={Briefcase} />
                            <ReadOnlyRow label="Đánh giá trung bình" value={`${averageRating} / 5`} icon={Star} badgeClass="text-sm font-extrabold text-yellow-500" />
                          </div>
                        ) : (
                          <div className="space-y-4 relative z-10">
                            <ReadOnlyRow label="Độ hoàn thiện thông tin" value={`${profileCompleteness}%`} badgeClass="text-sm font-extrabold text-blue-600" />
                            <ReadOnlyRow label="Tổng tiền đã chi" value={`$${totalSpent}`} icon={DollarSign} badgeClass="text-sm font-extrabold text-purple-600" />
                            <ReadOnlyRow label="Dự án đã đăng" value={projectsPosted} icon={Briefcase} />
                            <ReadOnlyRow label="Đánh giá từ Freelancer" value={`${averageRating} / 5`} icon={Star} badgeClass="text-sm font-extrabold text-yellow-500" />
                          </div>
                        )}
                        
                        <div className="mt-6 pt-4 border-t border-gray-100">
                           <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
                             * Các chỉ số này được hệ thống tự động cập nhật dựa trên hoạt động thực tế của bạn trên LancerPro.
                           </p>
                        </div>
                     </div>
                     )}

                   </div>
                   
                   {/* Nút lưu cuối form */}
                   <div className="lg:col-span-3 mt-6 flex justify-start">
                     <button onClick={handleSaveProfile} className="px-8 py-3.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-xl text-base font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" /> Lưu thông tin
                     </button>
                   </div>
                 </div>
               )}

               {/* PREFERENCES / GENERAL SETTINGS TAB */}
               {activeTab === 'preferences' && (
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                   
                   {/* Left Sidebar Menu for Preferences */}
                   <div className="md:col-span-1 flex flex-col gap-2">
                      <button 
                         onClick={() => setPrefTab('notifications')}
                         className={`text-left px-4 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-3 ${prefTab === 'notifications' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                      >
                         <List className="w-4 h-4" /> Tùy chọn chung
                      </button>
                      <button 
                         onClick={() => setPrefTab('security')}
                         className={`text-left px-4 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-3 ${prefTab === 'security' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                      >
                         <Lock className="w-4 h-4" /> Đổi mật khẩu
                      </button>
                      {role !== 'admin' && (
                        <button 
                           onClick={() => setPrefTab('danger')}
                           className={`text-left px-4 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-3 ${prefTab === 'danger' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                           <Trash2 className="w-4 h-4" /> Xóa tài khoản
                        </button>
                      )}
                   </div>
                   
                   {/* Content Area for Preferences */}
                   <div className="md:col-span-3">
                     
                     {prefTab === 'notifications' && (
                       <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm max-w-2xl">
                         <h3 className="font-bold text-gray-900 text-xl mb-6 flex items-center gap-2"><List className="w-5 h-5 text-gray-500" /> Tùy chọn chung</h3>
                         <div className="space-y-6">
                           <div className="flex items-center justify-between">
                             <div>
                               <p className="font-semibold text-gray-800">Thông báo Email</p>
                               <p className="text-sm text-gray-500 mt-1">Nhận email khi có tin nhắn mới hoặc cập nhật dự án.</p>
                             </div>
                             <label className="relative inline-flex items-center cursor-pointer">
                               <input type="checkbox" className="sr-only peer" defaultChecked />
                               <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                             </label>
                           </div>
                           <div className="flex items-center justify-between">
                             <div>
                               <p className="font-semibold text-gray-800">Hiển thị trực tuyến</p>
                               <p className="text-sm text-gray-500 mt-1">Cho phép người khác thấy khi bạn đang online.</p>
                             </div>
                             <label className="relative inline-flex items-center cursor-pointer">
                               <input type="checkbox" className="sr-only peer" defaultChecked />
                               <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                             </label>
                           </div>
                         </div>
                       </div>
                     )}

                     {prefTab === 'security' && (
                       <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm max-w-2xl">
                         <h3 className="font-bold text-gray-900 text-xl mb-6 flex items-center gap-2"><Lock className="w-5 h-5 text-gray-500" /> Đổi mật khẩu</h3>
                         <form onSubmit={handleSavePassword} className="space-y-5">
                           <div className="flex flex-col">
                             <span className="text-sm font-semibold text-gray-700 mb-2">Mật khẩu hiện tại</span>
                             <input type="password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} required className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all bg-gray-50 focus:bg-white" />
                           </div>
                           <div className="flex flex-col">
                             <span className="text-sm font-semibold text-gray-700 mb-2">Mật khẩu mới</span>
                             <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} required className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all bg-gray-50 focus:bg-white" />
                           </div>
                           <div className="flex flex-col">
                             <span className="text-sm font-semibold text-gray-700 mb-2">Xác nhận mật khẩu mới</span>
                             <input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} required className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all bg-gray-50 focus:bg-white" />
                           </div>
                           <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold mt-4 shadow-sm transition-colors w-full sm:w-auto">
                             Cập nhật mật khẩu
                           </button>
                         </form>
                       </div>
                     )}

                     {prefTab === 'danger' && role !== 'admin' && (
                       <div className="bg-white p-8 rounded-xl border border-red-200 shadow-sm max-w-2xl">
                         <h3 className="font-bold text-gray-900 text-xl mb-4 flex items-center gap-2"><Trash2 className="w-5 h-5 text-red-500" /> Xóa Tài Khoản</h3>
                         <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                           Khi bạn xóa tài khoản, tất cả dữ liệu bao gồm hồ sơ, dự án, lịch sử giao dịch và tin nhắn sẽ bị xóa vĩnh viễn và không thể khôi phục.
                         </p>
                         <div className="mb-6">
                           <label className="block text-sm font-semibold text-gray-700 mb-2">Vui lòng nhập <span className="font-bold text-red-600">DELETE</span> để xác nhận:</label>
                           <input type="text" value={deleteInput} onChange={e=>setDeleteInput(e.target.value)} placeholder="Nhập DELETE..." className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all bg-gray-50 focus:bg-white" />
                         </div>
                         <button onClick={handleDeleteAccount} disabled={deleteInput !== 'DELETE'} className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition-colors w-full sm:w-auto shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                           Xác nhận Xóa Tài Khoản
                         </button>
                       </div>
                     )}
                     
                   </div>
                 </div>
               )}

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

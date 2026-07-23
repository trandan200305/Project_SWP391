import React, { useState, useEffect } from 'react';
import { Camera, CheckCircle, Star, MapPin, Plus } from 'lucide-react';
import UserProfile from '../components/UserProfile.jsx';
import EditProfileForm from '../components/EditProfileForm.jsx';
import UserSettings from '../components/UserSettings.jsx';
import EmployerExpensesTab from '../components/EmployerExpensesTab.jsx';
import { getImageUrl, getFilenameFromUrl } from '../../../utils/imageHelper.js';
import RevenueDashboard from './RevenueDashboard.jsx';

export default function UserProfilePage({ user, onLogout, defaultTab = 'profile', onNavigate, targetRole, targetUserId }) {
  const initialRole = (targetRole || user?.role || 'employer').toLowerCase();
  const initialTargetId = targetUserId || user?.employerId || user?.freelancerId || user?.userId || user?.id;

  const [role, setRole] = useState(initialRole);
  const [targetId, setTargetId] = useState(initialTargetId);
  const [activeTab, setActiveTab] = useState(defaultTab); // 'profile', 'edit_profile', 'preferences'
  const [prefTab, setPrefTab] = useState('privacy'); // 'privacy', 'security', 'danger'

  useEffect(() => {
    setActiveTab(defaultTab);
    if (user) {
      const r = (targetRole || user.role || 'employer').toLowerCase();
      const id = targetUserId || user.employerId || user.freelancerId || user.userId || user.id;
      setRole(r);
      setTargetId(id);
    }
  }, [defaultTab, user, targetRole, targetUserId]);

  // ================= COMMON STATE =================
  const [avatarUrl, setAvatarUrl] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [language, setLanguage] = useState('vi');
  const [hideEmail, setHideEmail] = useState(false);
  const [hidePhone, setHidePhone] = useState(false);
  const [hideLocation, setHideLocation] = useState(false);

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // ================= KYC STATE =================
  const [kycStatus, setKycStatus] = useState('UNVERIFIED');

  const [kycRejectedReason, setKycRejectedReason] = useState('');
  const [isUploadingKyc, setIsUploadingKyc] = useState(false);
  // Freelancer KYC
  const [idCardFrontUrl, setIdCardFrontUrl] = useState('');
  const [idCardBackUrl, setIdCardBackUrl] = useState('');
  const [portraitUrl, setPortraitUrl] = useState('');
  // Employer KYB
  const [taxCode, setTaxCode] = useState('');
  const [businessLicenseUrl, setBusinessLicenseUrl] = useState('');
  const [representativeIdCardUrl, setRepresentativeIdCardUrl] = useState('');

  // Common Read-only Stats
  const [status, setStatus] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [createdAt, setCreatedAt] = useState('');
  const [lastLoginAt, setLastLoginAt] = useState('');

  // ================= FREELANCER STATE =================
  const [fullName, setFullName] = useState('');
  const [professionalTitle, setProfessionalTitle] = useState('');
  const [expertiseField, setExpertiseField] = useState('');
  const [bio, setBio] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [primarySkills, setPrimarySkills] = useState('');
  const [hourlyRate, setHourlyRate] = useState(0);

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


  // Settings state
  const [deleteInput, setDeleteInput] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  // UI / misc state
  const [adminLevel, setAdminLevel] = useState('');
  const [categories, setCategories] = useState([]);
  const [isOwnProfile, setIsOwnProfile] = useState(true);

  // Work profile (freelancer)
  const [workProfile, setWorkProfile] = useState({
    expertiseField: '', professionalTitle: '', bio: '', personalWebsite: '',
    experienceLevel: '', primarySkills: '', servicesOffered: '', isAvailable: true, availabilityType: ''
  });
  const [isEditingWorkProfile, setIsEditingWorkProfile] = useState(false);

  // Portfolio (freelancer)
  const [portfolios, setPortfolios] = useState([]);
  const [isAddingPortfolio, setIsAddingPortfolio] = useState(false);
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const [newPortfolio, setNewPortfolio] = useState({ title: '', attachmentUrl: '', description: '', relatedService: '', productLink: '' });
  const [attachmentType, setAttachmentType] = useState('url');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  const fetchProfileData = React.useCallback(() => {
    const effectiveTargetId = targetId || user?.employerId || user?.freelancerId || user?.userId || user?.id;
    if (!effectiveTargetId) return;

    const endpoint = role === 'freelancer' ? `http://localhost:8080/api/freelancers/${effectiveTargetId}` : `http://localhost:8080/api/employers/${effectiveTargetId}`;
    setDisplayName(''); setFullName(''); setCompanyName(''); setEmail(''); setPhone('');
    setBio(''); setCompanyDescription(''); setAvatarUrl(''); setStatus('');
    setProfessionalTitle(''); setExpertiseField(''); setAddress(''); setCity(''); setCountry('');
    setHideEmail(false); setHidePhone(false); setHideLocation(false);
    setProfileCompleteness(0); setTotalEarnings(0); setProjectsCompleted(0); setAverageRating(0);
    setTotalSpent(0); setProjectsPosted(0);
    setKycStatus('UNVERIFIED'); setKycRejectedReason('');
    setIdCardFrontUrl(''); setIdCardBackUrl(''); setPortraitUrl('');
    fetch(endpoint)
      .then(res => {
        if (!res.ok) throw new Error('Không tìm thấy tài khoản');
        return res.json();
      })
      .then(data => {
        if (!data) return;

        if (data.displayName) setDisplayName(data.displayName);
        if (data.email) setEmail(data.email);
        if (data.phone) setPhone(data.phone);
        if (data.language) setLanguage(data.language);
        if (data.hideEmail !== undefined) setHideEmail(data.hideEmail);
        if (data.hidePhone !== undefined) setHidePhone(data.hidePhone);
        if (data.hideLocation !== undefined) setHideLocation(data.hideLocation);
        if (data.avatarUrl) setAvatarUrl(data.avatarUrl);
        if (data.status) setStatus(data.status);
        if (data.emailVerified) setEmailVerified(data.emailVerified);
        if (data.createdAt) setCreatedAt(data.createdAt);
        if (data.lastLoginAt) setLastLoginAt(data.lastLoginAt);
        if (data.kycStatus) setKycStatus(data.kycStatus);
        if (data.kycRejectedReason) setKycRejectedReason(data.kycRejectedReason);
        if (data.idCardFrontUrl) setIdCardFrontUrl(data.idCardFrontUrl);
        if (data.idCardBackUrl) setIdCardBackUrl(data.idCardBackUrl);
        if (data.portraitUrl) setPortraitUrl(data.portraitUrl);
        if (data.taxCode) setTaxCode(data.taxCode);
        if (data.businessLicenseUrl) setBusinessLicenseUrl(data.businessLicenseUrl);
        if (data.representativeIdCardUrl) setRepresentativeIdCardUrl(data.representativeIdCardUrl);

        if (role === 'freelancer') {
          if (data.fullName) setFullName(data.fullName);
          if (data.professionalTitle) setProfessionalTitle(data.professionalTitle);
          if (data.expertiseField) setExpertiseField(data.expertiseField);
          if (data.bio) setBio(data.bio);
          if (data.address) setAddress(data.address);
          if (data.city) setCity(data.city);
          else if (data.country === 'Việt Nam') setCity('Hà Nội');
          if (data.country) setCountry(data.country);
          if (data.profileCompleteness) setProfileCompleteness(data.profileCompleteness);
          if (data.totalEarnings) setTotalEarnings(data.totalEarnings);
          if (data.projectsCompleted) setProjectsCompleted(data.projectsCompleted);
          if (data.averageRating) setAverageRating(data.averageRating);
          if (data.primarySkills) setPrimarySkills(data.primarySkills);
          if (data.expertiseField) setExpertiseField(data.expertiseField);
          if (data.hourlyRate) setHourlyRate(data.hourlyRate);
        } else if (role === 'employer') {
          if (data.companyName) setCompanyName(data.companyName);
          if (data.fullName) setFullName(data.fullName);
          if (data.companyDescription) setCompanyDescription(data.companyDescription);
          if (data.website) setWebsite(data.website);
          if (data.companySize) setCompanySize(data.companySize);
          if (data.industry) setIndustry(data.industry);
          if (data.address) setAddress(data.address);
          if (data.city) setCity(data.city);
          else if (data.country === 'Việt Nam') setCity('Hà Nội');
          if (data.country) setCountry(data.country);
          if (data.profileCompleteness) setProfileCompleteness(data.profileCompleteness);
          if (data.totalSpent) setTotalSpent(data.totalSpent);
          if (data.projectsPosted) setProjectsPosted(data.projectsPosted);
          if (data.averageRating) setAverageRating(data.averageRating);
        }
      })
      .catch(error => {
        console.log('Chưa kết nối API Backend hoặc chưa login:', endpoint);
      });
  }, [role, targetId]);

  // Hàm: Tải dữ liệu hồ sơ người dùng từ máy chủ (Chạy mỗi khi đổi Role hoặc ID)
  useEffect(() => {
    setDisplayName(''); setFullName(''); setCompanyName(''); setEmail(''); setPhone('');
    setBio(''); setCompanyDescription(''); setAvatarUrl(''); setStatus('');
    setProfessionalTitle(''); setAddress(''); setCity(''); setCountry(''); setPrimarySkills('');
    setHideEmail(false); setHidePhone(false); setHideLocation(false); setHourlyRate(0);
    setProfileCompleteness(0); setTotalEarnings(0); setProjectsCompleted(0); setAverageRating(0);
    setTotalSpent(0); setProjectsPosted(0);
    setKycStatus('UNVERIFIED'); setKycRejectedReason('');
    setIdCardFrontUrl(''); setIdCardBackUrl(''); setPortraitUrl('');

    fetchProfileData();
  }, [fetchProfileData]);



  // Hàm: Lưu thông tin chỉnh sửa hồ sơ
  const handleSaveProfile = (e) => {

    const endpoint = `http://localhost:8080/api/${role}s/${targetId}/profile`;

    let payload = {};
    if (role === 'freelancer') {
      const parsedHourlyRate = hourlyRate ? Number(hourlyRate) : null;
      payload = { email, displayName, fullName, phone, professionalTitle, expertiseField, bio, hourlyRate: parsedHourlyRate, address, city, country, language, timezone, avatarUrl, hideEmail, hidePhone, hideLocation, primarySkills };
    } else if (role === 'employer') {
      payload = { email, displayName, fullName, phone, companyName, companyDescription, website, companySize, industry, address, city, country, language, avatarUrl, hideEmail, hidePhone, hideLocation };
    }

    fetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(async res => {
        const data = await res.json();
        if (res.ok) {
          if (role === 'employer') {
            alert(data.message || 'Yêu cầu thay đổi thông tin của bạn đã được gửi tới Manager để phê duyệt.');
          } else {
            alert('Đã lưu thông tin hồ sơ thành công!');
          }
        } else {
          alert(data.message || 'Lỗi kết nối máy chủ!');
        }
      })
      .catch(error => {
        alert('Lỗi kết nối máy chủ!');
      });
  };



  const handleDeleteAccount = () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa tài khoản này không? Hành động này không thể hoàn tác!")) {
      return;
    }
    const endpoint = `http://localhost:8080/api/${role}s/${targetId}`;
    fetch(endpoint, {
      method: 'DELETE'
    })
      .then(async res => {
        const data = await res.json();
        if (res.ok && data.success) {
          alert('Tài khoản của bạn đã được xóa thành công.');
          onLogout();
        } else {
          alert(data.message || 'Lỗi khi xóa tài khoản.');
        }
      })
      .catch(err => {
        alert('Lỗi kết nối máy chủ!');
      });
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('Mật khẩu mới và xác nhận mật khẩu không khớp!');
      return;
    }
    if (newPassword.length < 6) {
      alert('Mật khẩu mới phải có ít nhất 6 ký tự!');
      return;
    }
    try {
      const res = await fetch('http://localhost:8080/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: targetId,
          role: role.toUpperCase(),
          currentPassword,
          newPassword,
          confirmPassword
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Đổi mật khẩu thành công!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        alert(data.message || 'Mật khẩu hiện tại không chính xác.');
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ!');
    }
  };

  const handleSavePrivacy = (privacyUpdates) => {
    const endpoint = `http://localhost:8080/api/${role}s/${targetId}/profile`;
    let payload = {};
    if (role === 'freelancer') {
      const parsedHourlyRate = hourlyRate ? Number(hourlyRate) : null;
      payload = { email, displayName, fullName, phone, professionalTitle, bio, address, city, country, language, avatarUrl, hideEmail, hidePhone, hideLocation, primarySkills, expertiseField, hourlyRate: parsedHourlyRate, ...privacyUpdates };
    } else if (role === 'employer') {
      payload = { email, displayName, fullName, phone, companyName, companyDescription, website, companySize, industry, address, city, country, language, avatarUrl, hideEmail, hidePhone, hideLocation, ...privacyUpdates };
    }

    fetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(err => {
      console.error('Lỗi khi lưu quyền riêng tư:', err);
    });
  };

  // ================= WORK PROFILE HANDLERS =================
  const handleSaveWorkProfile = async () => {
    try {
      const endpoint = `http://localhost:8080/api/${role}s/${targetId}/profile`;
      await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...workProfile })
      });
      setIsEditingWorkProfile(false);
      alert('Đã lưu hồ sơ năng lực thành công!');
    } catch (err) {
      alert('Lỗi khi lưu hồ sơ!');
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    const sizeKB = (file.size / 1024).toFixed(1);
    const sizeMB = (file.size / 1024 / 1024).toFixed(2);
    const ext = file.name.split('.').pop().toUpperCase();
    let dimensions = 'N/A';
    if (file.type.startsWith('image/')) {
      dimensions = await new Promise(resolve => {
        const img = new Image();
        img.onload = () => resolve(`${img.width} x ${img.height}`);
        img.src = URL.createObjectURL(file);
      });
    }
    setFilePreview({ format: ext, size: `${sizeKB} KB (${sizeMB} MB)`, dimensions });
  };

  const handleSavePortfolio = async () => {
    if (!newPortfolio.title || !newPortfolio.description) {
      alert('Vui lòng điền đầy đủ Tiêu đề và Mô tả!');
      return;
    }
    let attachmentUrl = newPortfolio.attachmentUrl;
    if (attachmentType === 'file' && selectedFile) {
      const formData = new FormData();
      formData.append('file', selectedFile);
      try {
        const res = await fetch('http://localhost:8080/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.success) attachmentUrl = data.fileUrl;
      } catch (err) { alert('Lỗi upload file!'); return; }
    }
    try {
      const res = await fetch(`http://localhost:8080/api/freelancers/${targetId}/portfolios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newPortfolio, attachmentUrl })
      });
      if (res.ok) {
        const saved = await res.json();
        setPortfolios(prev => [...prev, saved]);
        setNewPortfolio({ title: '', attachmentUrl: '', description: '', relatedService: '', productLink: '' });
        setSelectedFile(null); setFilePreview(null); setIsAddingPortfolio(false);
        alert('Đã lưu hồ sơ năng lực!');
      }
    } catch (err) { alert('Lỗi lưu portfolio!'); }
  };

  const handleDeletePortfolio = async (portfolioId) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa hồ sơ này?')) return;
    try {
      await fetch(`http://localhost:8080/api/freelancers/${targetId}/portfolios/${portfolioId}`, { method: 'DELETE' });
      setPortfolios(prev => prev.filter(p => (p.portfolioId || p.id) !== portfolioId));
    } catch (err) { alert('Lỗi xóa portfolio!'); }
  };



  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa cập nhật';
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Chưa cập nhật';
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
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
    user, onLogout,
    role, targetId, activeTab, setActiveTab, prefTab, setPrefTab, onNavigate,
    avatarUrl, setAvatarUrl, displayName, setDisplayName, email, setEmail, phone, setPhone, language, setLanguage,
    isUploadingAvatar, setIsUploadingAvatar,
    hideEmail, setHideEmail, hidePhone, setHidePhone, hideLocation, setHideLocation,
    kycStatus, setKycStatus, isVerified, setIsVerified, kycRejectedReason, setKycRejectedReason, idCardFrontUrl, setIdCardFrontUrl, idCardBackUrl, setIdCardBackUrl, portraitUrl, setPortraitUrl, isUploadingKyc, setIsUploadingKyc,
    taxCode, setTaxCode, businessLicenseUrl, setBusinessLicenseUrl, representativeIdCardUrl, setRepresentativeIdCardUrl,
    status, setStatus, emailVerified, setEmailVerified, createdAt, setCreatedAt, lastLoginAt, setLastLoginAt,
    fullName, setFullName, professionalTitle, setProfessionalTitle, expertiseField, setExpertiseField, bio, setBio, hourlyRate, setHourlyRate, address, setAddress, city, setCity, country, setCountry,
    profileCompleteness, setProfileCompleteness, totalEarnings, setTotalEarnings, projectsCompleted, setProjectsCompleted, averageRating, setAverageRating,
    companyName, setCompanyName, companyDescription, setCompanyDescription, website, setWebsite, companySize, setCompanySize, industry, setIndustry,
    totalSpent, setTotalSpent, projectsPosted, setProjectsPosted,
    adminLevel, setAdminLevel,
    handleSaveProfile, handleSavePassword, handleDeleteAccount, formatDate, formatDateTime, formatCurrency, formatCompactCurrency,
    isOwnProfile, categories,
    primarySkills, setPrimarySkills, handleSavePrivacy,
    currentPassword, setCurrentPassword, newPassword, setNewPassword, confirmPassword, setConfirmPassword,
    deleteInput, setDeleteInput,
    fetchProfileData
  };

  const tabs = isOwnProfile
    ? (role === 'freelancer' 
      ? [
          { id: 'profile', label: 'Hồ sơ cá nhân' },
          { id: 'edit_profile', label: 'Sửa hồ sơ' },
          { id: 'work_profile', label: 'Hồ sơ làm việc' },
          { id: 'portfolio', label: 'Hồ sơ năng lực' },
          { id: 'preferences', label: 'Cài đặt chung' }
        ]
      : role === 'employer'
      ? [
          { id: 'profile', label: 'Thông tin chung' },
          { id: 'expenses', label: 'Hóa đơn & Lịch sử gói' },
          { id: 'preferences', label: 'Cài đặt chung' }
        ]
      : [
          { id: 'edit_profile', label: 'Sửa hồ sơ' },
          { id: 'preferences', label: 'Cài đặt chung' }
        ])
    : (role === 'freelancer'
      ? [
          { id: 'profile', label: 'Hồ sơ cá nhân' },
          { id: 'portfolio', label: 'Hồ sơ năng lực' }
        ]
      : role === 'employer'
      ? [
          { id: 'profile', label: 'Thông tin chung' }
        ]
      : []);
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
                  <input type="file" className="hidden" accept="image/*" disabled={isUploadingAvatar} onChange={async (e) => {
                    // Hàm: Xử lý sự kiện Upload Avatar và lưu trực tiếp vào CSDL
                    const file = e.target.files[0];
                    if (!file) return;

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

                        const updateEndpoint = `http://localhost:8080/api/${role}s/${targetId}/profile`;
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
                  }} />
                </label>
              </div>

              {/* Name & Actions Header */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between pt-20 sm:pt-4 ml-0 sm:ml-[140px] gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 leading-tight tracking-tight flex items-center gap-2">
                    {role === 'freelancer' ? (displayName || fullName || 'Unnamed Freelancer') : (displayName || fullName || 'Unnamed Company')}
                    {(kycStatus === 'APPROVED') && <CheckCircle className="w-7 h-7 text-blue-500 flex-shrink-0" />}
                  </h2>
                  <div className="flex items-center flex-wrap gap-x-5 gap-y-2 mt-2 text-sm text-gray-600 font-medium">
                    {role === 'freelancer' && (
                      <span className="flex items-center gap-1.5 text-gray-800 font-bold bg-gray-100/80 px-2.5 py-1 rounded-md border border-gray-200/50 shadow-sm">
                        {professionalTitle || expertiseField || 'Freelancer'}
                      </span>
                    )}

                    {role === 'employer' && (
                      <span className="flex items-center gap-1.5 text-indigo-700 bg-indigo-50 font-bold px-2.5 py-1 rounded-md border border-indigo-100 shadow-sm">
                        Doanh nghiệp
                      </span>
                    )}



                    <div className="flex items-center gap-1.5" title="Đánh giá trung bình & Số dự án">
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow-50 rounded text-yellow-700 font-bold border border-yellow-100">
                        <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                        <span>{averageRating || '0.0'}</span>
                      </div>
                      <span className="text-gray-400 text-xs font-bold uppercase tracking-wide">
                        ({role === 'freelancer' ? (projectsCompleted || 0) : (projectsPosted || 0)} dự án)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Contents Area */}

            <div className="p-6 sm:px-10 py-8 border-t border-gray-100">

               {activeTab === 'profile' && <UserProfile {...allProps} />}
               {activeTab === 'edit_profile' && <EditProfileForm {...allProps} />}
               {activeTab === 'expenses' && <EmployerExpensesTab employerId={targetId} />}
               
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
                          <div className="w-48 font-semibold text-slate-700 pt-2">Chức danh / Lĩnh vực <span className="text-red-500">*</span></div>
                          <div className="flex-1">
                            {isEditingWorkProfile ? (
                              <div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border border-slate-300 rounded-lg p-4 bg-white">
                                  {((categories && categories.length > 0) ? categories : [
                                    { categoryId: 1, categoryName: "Lập trình & Công nghệ" },
                                    { categoryId: 2, categoryName: "Thiết kế & Đồ họa" },
                                    { categoryId: 3, categoryName: "Marketing & Bán hàng" },
                                    { categoryId: 4, categoryName: "Viết lách & Dịch thuật" },
                                    { categoryId: 5, categoryName: "Video, Ảnh & Âm thanh" },
                                    { categoryId: 6, categoryName: "Hành chính & Trợ lý ảo" },
                                    { categoryId: 7, categoryName: "Kế toán & Tư vấn" }
                                  ]).map(cat => {
                                    const catId = String(cat.categoryId || cat.id);
                                    const catName = cat.categoryName || cat.name;
                                    const isChecked = workProfile.expertiseField && workProfile.expertiseField.split(/,\s*/).includes(catId);
                                    return (
                                      <label key={catId} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer text-sm font-medium text-slate-700 transition-colors">
                                        <input 
                                          type="checkbox" 
                                          checked={!!isChecked}
                                          onChange={(e) => {
                                            let currentIds = workProfile.expertiseField ? workProfile.expertiseField.split(/,\s*/).map(s => s.trim()).filter(Boolean) : [];
                                            let currentNames = workProfile.professionalTitle ? workProfile.professionalTitle.split(/,\s*/).map(s => s.trim()).filter(Boolean) : [];
                                            if (e.target.checked) {
                                              if (!currentIds.includes(catId)) {
                                                currentIds.push(catId);
                                                currentNames.push(catName);
                                              }
                                            } else {
                                              currentIds = currentIds.filter(id => id !== catId);
                                              currentNames = currentNames.filter(name => name !== catName);
                                            }
                                            setWorkProfile({
                                              ...workProfile, 
                                              expertiseField: currentIds.join(','),
                                              professionalTitle: currentNames.join(', ')
                                            });
                                          }}
                                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span>{catName}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                                <p className="text-xs text-slate-400 mt-2">Chọn những lĩnh vực hoạt động chính của bạn.</p>
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-2 pt-1.5">
                                {workProfile.professionalTitle ? (
                                  workProfile.professionalTitle.split(/,\s*/).map((title, index) => (
                                    <span key={index} className="bg-blue-50 text-blue-600 font-semibold px-3 py-1 rounded-lg text-xs border border-blue-100">
                                      {title}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-slate-400 text-sm italic">Chưa cập nhật</span>
                                )}
                              </div>
                            )}
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
                                  onClick={() => handleDeletePortfolio(pf.portfolioId || pf.id)}
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
                                <div className="w-48 font-semibold text-slate-700 pt-2">Hình thức tải lên <span className="text-red-500">*</span></div>
                                <div className="flex-1">
                                  <select 
                                    value={attachmentType} 
                                    onChange={(e) => setAttachmentType(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-700 outline-none focus:border-blue-500 mb-2"
                                  >
                                    <option value="url">Nhập URL</option>
                                    <option value="file">Tải tệp lên</option>
                                  </select>
                                  <p className="text-xs text-slate-400">Chọn phương thức bạn muốn sử dụng để cung cấp file hồ sơ năng lực.</p>
                                </div>
                              </div>

                              <div className="flex flex-col md:flex-row gap-6">
                                <div className="w-48 font-semibold text-slate-700 pt-2">File đính kèm <span className="text-red-500">*</span></div>
                                <div className="flex-1">
                                  {attachmentType === 'url' ? (
                                    <>
                                      <input 
                                        type="text" 
                                        placeholder="Nhập URL file đính kèm..."
                                        value={newPortfolio.attachmentUrl}
                                        onChange={(e) => setNewPortfolio({...newPortfolio, attachmentUrl: e.target.value})}
                                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-700 outline-none focus:border-blue-500 mb-2" 
                                      />
                                      <p className="text-xs text-slate-400">Vui lòng cung cấp đường dẫn truy cập trực tiếp đến sản phẩm hoặc dự án của bạn (ví dụ: Google Drive, Github, Figma...).</p>
                                    </>
                                  ) : (
                                    <>
                                      <input 
                                        type="file" 
                                        onChange={handleFileChange}
                                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer border border-slate-300 rounded-lg p-1.5 bg-white mb-2" 
                                      />
                                      {filePreview && (
                                        <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800">
                                          <div className="font-semibold mb-1">Thông tin tệp:</div>
                                          <div><span className="font-medium">Định dạng:</span> {filePreview.format}</div>
                                          <div><span className="font-medium">Dung lượng:</span> {filePreview.size}</div>
                                          {filePreview.dimensions !== 'N/A' && (
                                            <div><span className="font-medium">Kích thước ảnh:</span> {filePreview.dimensions}</div>
                                          )}
                                        </div>
                                      )}
                                      <div className="text-xs text-slate-400 space-y-1">
                                        <p>1. Kích thước không quá 5 MB</p>
                                        <p>2. Định dạng được hỗ trợ</p>
                                        <p className="pl-2">- Tài liệu: .doc, .docx, .pdf</p>
                                        <p className="pl-2">- Hình ảnh: .jpg, .jpeg, .png, .gif</p>
                                        <p>3. Nếu là ảnh:</p>
                                        <p className="pl-2">- Kích thước tối đa: 1920 x 1080 (16:9) hoặc 1080 x 1920 (9:16) (Chuẩn FHD)</p>
                                        <p className="pl-2">- Kích thước tối thiểu: 380 x 214</p>
                                      </div>
                                    </>
                                  )}
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
                                  onClick={() => {
                                    setIsAddingPortfolio(false);
                                    setNewPortfolio({ title: '', attachmentUrl: '', description: '', relatedService: '', productLink: '' });
                                    setSelectedFile(null);
                                    setFilePreview(null);
                                  }}
                                  className="ml-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 px-6 rounded-lg transition-colors"
                                >
                                  Hủy bỏ
                                </button>
                              )}
                            </div>
                          </div>
                      </>
                    )}
                  </div>
                </div>
              )}

               {activeTab === 'preferences' && <UserSettings {...allProps} />}
               {activeTab === 'revenue' && <RevenueDashboard {...allProps} />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

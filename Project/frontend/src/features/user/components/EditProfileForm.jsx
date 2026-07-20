import React from 'react';
import { Briefcase, Building2, CheckCircle, Clock, Activity, BarChart2, DollarSign, Star } from 'lucide-react';
import { getImageUrl, getFilenameFromUrl } from '../../../utils/imageHelper.js';

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

const SelectRow = ({ label, value, onChange, options }) => (
  <div className="flex justify-between items-center sm:block">
    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider sm:mb-1 block">{label}</span>
    <select 
      value={value} 
      onChange={onChange} 
      className="text-sm font-semibold text-gray-900 border border-transparent hover:border-gray-200 focus:border-blue-500 bg-transparent focus:bg-white rounded px-2 py-1.5 transition-all outline-none w-[160px] sm:w-full text-right sm:text-left"
    >
      {options.map(opt => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  </div>
);

const VIETNAM_PROVINCES = [
  "Hà Nội", "Hồ Chí Minh", "Hải Phòng", "Đà Nẵng", "Cần Thơ", 
  "An Giang", "Bà Rịa - Vũng Tàu", "Bắc Giang", "Bắc Ninh", "Bình Dương", 
  "Bình Định", "Bình Thuận", "Cà Mau", "Đắk Lắk", "Đồng Nai", 
  "Đồng Tháp", "Gia Lai", "Hải Dương", "Khánh Hòa", "Kiên Giang", 
  "Lâm Đồng", "Long An", "Nam Định", "Nghệ An", "Phú Thọ", 
  "Quảng Nam", "Quảng Ngãi", "Quảng Ninh", "Sơn La", "Tây Ninh", 
  "Thái Bình", "Thanh Hóa", "Thừa Thiên Huế", "Tiền Giang"
];

const EXPERTISE_FIELDS = [
  "IT & Lập trình",
  "Thiết kế & Đồ họa",
  "Marketing & Bán hàng",
  "Viết lách & Dịch thuật",
  "Video & Nhiếp ảnh",
  "Hành chính & Trợ lý",
  "Tài chính & Kế toán",
  "Kỹ thuật & Kiến trúc",
  "Pháp lý",
  "Khác"
];

const ReadOnlyRow = ({ label, value, badgeClass, icon: Icon, title }) => (
  <div className="flex justify-between items-center py-1 gap-2" title={title}>
    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
      {Icon && <Icon className="w-3.5 h-3.5 text-gray-400" />}
      {label}
    </span>
    {badgeClass ? (
       <span className={`${badgeClass} whitespace-nowrap`}>{value}</span>
    ) : (
       <span className="text-sm font-bold text-gray-800 text-right">{value}</span>
    )}
  </div>
);

const SkillTagSelector = ({ primarySkills, setPrimarySkills }) => {
  const [allSkills, setAllSkills] = React.useState([]);
  const [searchText, setSearchText] = React.useState('');
  const [showDropdown, setShowDropdown] = React.useState(false);
  const dropdownRef = React.useRef(null);

  React.useEffect(() => {
    fetch('http://localhost:8080/api/skills')
      .then(res => res.json())
      .then(data => {
        setAllSkills(data || []);
      })
      .catch(err => console.error("Lỗi tải danh mục kỹ năng:", err));
  }, []);

  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedSkills = React.useMemo(() => {
    return primarySkills ? primarySkills.split(',').map(s => s.trim()).filter(Boolean) : [];
  }, [primarySkills]);

  const suggestions = React.useMemo(() => {
    if (!searchText.trim()) {
      return allSkills.filter(s => !selectedSkills.some(sel => sel.toLowerCase() === s.skillName.toLowerCase())).slice(0, 10);
    }
    const query = searchText.toLowerCase();
    return allSkills.filter(s => 
      s.skillName.toLowerCase().includes(query) &&
      !selectedSkills.some(sel => sel.toLowerCase() === s.skillName.toLowerCase())
    );
  }, [allSkills, selectedSkills, searchText]);

  const handleSelectSkill = (skillName) => {
    const newSelected = [...selectedSkills, skillName];
    setPrimarySkills(newSelected.join(', '));
    setSearchText('');
    setShowDropdown(false);
  };

  const handleRemoveSkill = (skillName) => {
    const newSelected = selectedSkills.filter(s => s !== skillName);
    setPrimarySkills(newSelected.join(', '));
  };

  const handleCreateNewSkill = async () => {
    const cleanText = searchText.trim();
    if (!cleanText) return;
    
    try {
      const response = await fetch('http://localhost:8080/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillName: cleanText })
      });
      if (response.ok) {
        const newSkill = await response.json();
        setAllSkills(prev => [...prev, newSkill]);
        handleSelectSkill(newSkill.skillName);
        alert(`Đã đề xuất kỹ năng "${newSkill.skillName}" thành công! Kỹ năng này đang ở trạng thái chờ duyệt và chỉ hiển thị trên hồ sơ của bạn.`);
      } else {
        alert("Không thể đề xuất kỹ năng mới.");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối khi tạo kỹ năng mới.");
    }
  };

  const isExactMatch = allSkills.some(s => s.skillName.toLowerCase() === searchText.trim().toLowerCase());

  return (
    <div className="flex justify-between items-start sm:block relative" ref={dropdownRef}>
      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider sm:mb-1 block">Kỹ năng chuyên môn</span>
      <div className="w-[160px] sm:w-full">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedSkills.map((skill, index) => (
            <span 
              key={index}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[11px] font-bold rounded-lg border border-indigo-100/50 shadow-sm"
            >
              {skill}
              <button 
                type="button"
                onClick={() => handleRemoveSkill(skill)}
                className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-indigo-400 hover:text-indigo-650 hover:bg-indigo-100 transition-colors font-extrabold text-[10px]"
              >
                ×
              </button>
            </span>
          ))}
          {selectedSkills.length === 0 && (
            <span className="text-xs text-gray-400 italic font-medium py-1">Chưa chọn kỹ năng nào</span>
          )}
        </div>

        <div className="relative">
          <input 
            type="text"
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Tìm kiếm hoặc gõ kỹ năng mới..."
            className="text-sm font-semibold text-gray-900 border border-gray-100 hover:border-gray-200 focus:border-blue-500 bg-gray-50/20 focus:bg-white rounded px-2.5 py-1.5 transition-all outline-none w-full text-right sm:text-left focus:shadow-sm"
          />

          {showDropdown && (
            <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-gray-100 shadow-xl rounded-xl max-h-[220px] overflow-y-auto divide-y divide-gray-50">
              {suggestions.map((skill) => (
                <button
                  key={skill.skillId}
                  type="button"
                  onClick={() => handleSelectSkill(skill.skillName)}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-indigo-50/60 hover:text-indigo-600 transition-colors flex items-center justify-between"
                >
                  <span>{skill.skillName}</span>
                  {!skill.isActive && (
                    <span className="text-[10px] font-semibold text-amber-500 bg-amber-50 px-1 py-0.5 rounded border border-amber-100/50">Chờ duyệt</span>
                  )}
                </button>
              ))}

              {searchText.trim() && !isExactMatch && (
                <button
                  type="button"
                  onClick={handleCreateNewSkill}
                  className="w-full text-left px-4 py-2.5 text-xs font-extrabold text-blue-600 bg-blue-50/40 hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center gap-1.5"
                >
                  <span className="text-sm font-light">+</span> Đề xuất thêm: "{searchText.trim()}" (Chờ duyệt)
                </button>
              )}

              {suggestions.length === 0 && (!searchText.trim() || isExactMatch) && (
                <div className="px-4 py-2.5 text-xs text-gray-400 italic text-center font-medium">
                  Không tìm thấy gợi ý nào thêm
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function EditProfileForm({
  role, bio, setBio, companyDescription, setCompanyDescription, displayName, setDisplayName, fullName, setFullName, phone, setPhone, email, setEmail, professionalTitle, setProfessionalTitle, hourlyRate, setHourlyRate, companyName, setCompanyName, website, setWebsite, companySize, setCompanySize, industry, setIndustry, taxCode, setTaxCode, adminLevel, country, setCountry, city, setCity, address, setAddress, timezone, setTimezone, status, emailVerified, createdAt, lastLoginAt, formatDate, formatDateTime, handleSaveProfile, profileCompleteness, totalEarnings, totalSpent, projectsCompleted, projectsPosted, averageRating, kycStatus, companyLogoUrl, setCompanyLogoUrl, primarySkills, setPrimarySkills, expertiseField, setExpertiseField, avatarUrl
}) {
  const [showCompleteness, setShowCompleteness] = React.useState(false);
  const completenessRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (completenessRef.current && !completenessRef.current.contains(e.target)) {
        setShowCompleteness(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const completenessItems = React.useMemo(() => {
    return [
      { name: 'Xác thực Danh tính (KYC)', points: 20, done: kycStatus === 'APPROVED' },
      { name: 'Xác thực Email', points: 15, done: !!emailVerified },
      { name: 'Số điện thoại', points: 10, done: !!(phone && phone.trim().length > 0) },
      { name: 'Địa chỉ cụ thể', points: 10, done: !!(address && address.trim().length > 0) },
      { name: 'Lĩnh vực chuyên môn', points: 10, done: !!(expertiseField && expertiseField.trim()) },
      { name: 'Kỹ năng chuyên môn', points: 10, done: !!(primarySkills && primarySkills.trim()) },
      { name: 'Giới thiệu bản thân (>30 ký tự)', points: 10, done: !!(bio && bio.trim().length >= 30) },
      { name: 'Ảnh đại diện', points: 5, done: !!avatarUrl },
      { name: 'Chức danh nghề nghiệp', points: 5, done: !!(professionalTitle && professionalTitle.trim()) },
      { name: 'Mức lương kỳ vọng', points: 5, done: !!(hourlyRate && hourlyRate > 0) },
    ];
  }, [kycStatus, emailVerified, phone, address, expertiseField, primarySkills, bio, avatarUrl, professionalTitle, hourlyRate]);

  return (
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
            {role === 'employer' ? (
              <InputRow label="Tên công ty" value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Công ty ABC..." />
            ) : (
              <InputRow label="Họ và Tên thật" value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Tên đầy đủ..." />
            )}
            <InputRow label="Số điện thoại" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+84..." />
            <InputRow label="Email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email..." />

            {role === 'freelancer' && (
              <>
                <InputRow label="Chức danh nghề nghiệp" value={professionalTitle} onChange={e=>setProfessionalTitle(e.target.value)} placeholder="VD: UI/UX Designer..." />
                <SelectRow label="Lĩnh vực chuyên môn" value={expertiseField} onChange={e=>setExpertiseField(e.target.value)} options={EXPERTISE_FIELDS} />
                <InputRow label="Mức lương mong muốn / Giờ" value={hourlyRate} onChange={e=>setHourlyRate(e.target.value)} placeholder="0" type="number" suffix="VNĐ" />
                <SkillTagSelector primarySkills={primarySkills} setPrimarySkills={setPrimarySkills} />
              </>
            )}

            {role === 'employer' && (
              <>
                {/* Logo Upload */}
                <div className="col-span-1 sm:col-span-2 flex items-center gap-5 p-4 border border-dashed border-gray-200 rounded-xl bg-gray-50/50 mb-2">
                  <div className="w-16 h-16 rounded-xl border border-gray-200 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                    {companyLogoUrl ? (
                      <img src={getImageUrl(companyLogoUrl)} alt="Company Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <span className="text-xs font-bold text-gray-700 block">Logo công ty</span>
                    <div className="flex items-center gap-2">
                      <label className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold rounded-lg cursor-pointer transition-colors border border-blue-100">
                        <span>Tải ảnh lên</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={async (e) => {
                            const file = e.target.files[0];
                            if(!file) return;
                            const formData = new FormData();
                            formData.append('file', file);
                            try {
                              const res = await fetch('http://localhost:8080/api/upload', {
                                method: 'POST',
                                body: formData
                              });
                              const data = await res.json();
                              if (data.success) {
                                setCompanyLogoUrl(getFilenameFromUrl(data.fileUrl));
                              } else {
                                alert('Tải ảnh lên thất bại!');
                              }
                            } catch(err) {
                              alert('Lỗi tải ảnh lên!');
                            }
                          }}
                        />
                      </label>
                      {companyLogoUrl && (
                        <button
                          type="button"
                          onClick={() => setCompanyLogoUrl('')}
                          className="px-3 py-1.5 border border-gray-200 text-red-650 hover:bg-red-50 hover:border-red-100 text-xs font-bold rounded-lg transition-colors"
                        >
                          Xóa logo
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <InputRow label="Tên công ty" value={companyName} onChange={e=>setCompanyName(e.target.value)} placeholder="Công ty ABC..." />
                <InputRow label="Website" value={website} onChange={e=>setWebsite(e.target.value)} placeholder="https://..." />
                <InputRow label="Quy mô công ty" value={companySize} onChange={e=>setCompanySize(e.target.value)} placeholder="10-50 nhân viên..." />
                <InputRow label="Lĩnh vực kinh doanh" value={industry} onChange={e=>setIndustry(e.target.value)} placeholder="IT, Giáo dục..." />
                <InputRow label="Mã số thuế" value={taxCode} onChange={e=>setTaxCode(e.target.value)} placeholder="VD: 0102030405..." />
              </>
            )}

            {role === 'admin' && (
              <ReadOnlyRow label="Cấp bậc Admin" value={adminLevel} badgeClass="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md" />
            )}

            {/* Vị trí địa lý - Chung cho Freelancer & Employer */}
            {(role === 'freelancer' || role === 'employer') && (
              <>
                <div className="flex justify-between items-center sm:block">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider sm:mb-1 block">Quốc gia</span>
                  <div className="text-sm font-semibold text-gray-700 bg-gray-50/50 border border-gray-100 rounded px-2.5 py-1.5 w-full text-right sm:text-left cursor-not-allowed">
                    Việt Nam
                  </div>
                </div>
                <SelectRow label="Tỉnh/Thành Phố" value={city} onChange={e=>setCity(e.target.value)} options={VIETNAM_PROVINCES} />
                <InputRow label="Địa chỉ cụ thể" value={address} onChange={e=>setAddress(e.target.value)} placeholder="Số nhà, đường, phường/xã..." />
              </>
            )}
          </div>
        </div>

        {/* Nút lưu cuối form */}
        <div className="mt-2 flex justify-start">
          <button onClick={handleSaveProfile} className="px-8 py-3.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-xl text-base font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-2">
             <CheckCircle className="w-5 h-5" /> Lưu thông tin
          </button>
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
                 label="Tình trạng" 
                 value={status === 'BANNED' ? 'Bị khóa' : 'Đang hoạt động'} 
                 badgeClass={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide ${status === 'BANNED' ? 'text-red-600 bg-red-50' : 'text-[#34A853] bg-[#E6F4EA]'}`} 
              />
              <ReadOnlyRow 
                 label="Xác thực Email" 
                 value={emailVerified ? 'Đã xác thực' : 'Chưa xác thực'} 
                 badgeClass={`text-[11px] font-bold px-2 py-0.5 rounded-md ${emailVerified ? 'text-blue-600 bg-blue-50' : 'text-orange-600 bg-orange-50'}`} 
              />
              <ReadOnlyRow 
                 label={<>Xác thực Danh tính <br/>(KYC)</>} 
                 value={kycStatus === 'APPROVED' ? 'Đã duyệt' : kycStatus === 'PENDING' ? 'Đang chờ duyệt' : kycStatus === 'REJECTED' ? 'Bị từ chối' : 'Chưa xác thực'} 
                 badgeClass={`text-[11px] font-bold px-2 py-0.5 rounded-md ${kycStatus === 'APPROVED' ? 'text-blue-600 bg-blue-50' : kycStatus === 'PENDING' ? 'text-yellow-600 bg-yellow-50' : kycStatus === 'REJECTED' ? 'text-red-600 bg-red-50' : 'text-gray-600 bg-gray-50'}`} 
              />
              <ReadOnlyRow label="Ngày tạo tài khoản" value={formatDate(createdAt)} icon={Clock} />
              <ReadOnlyRow label="Lần đăng nhập cuối" value={formatDateTime ? formatDateTime(lastLoginAt) : formatDate(lastLoginAt)} icon={Activity} />
           </div>
        </div>

        {/* Role Specific Stats */}
        {(role === 'freelancer' || role === 'employer') && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative">
           {/* Background Deco */}
           <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
             <div className="absolute -right-4 -top-4 text-gray-50 opacity-50">
               <BarChart2 className="w-24 h-24" />
             </div>
           </div>

           <h3 className="font-bold text-gray-900 text-base mb-5 relative z-10">Thống kê Hoạt động</h3>
           
           {role === 'freelancer' ? (
             <div className="space-y-4 relative z-10">
               <div className="relative" ref={completenessRef}>
                 <div 
                   onClick={() => setShowCompleteness(!showCompleteness)}
                   className="cursor-pointer hover:bg-blue-50/50 -mx-2 px-2 py-1 rounded-lg transition-colors group flex justify-between items-center"
                   title="Xem chi tiết các mục cần hoàn thiện"
                 >
                   <span className="text-[11px] font-bold text-gray-400 group-hover:text-blue-600 transition-colors uppercase tracking-wider flex items-center gap-1 shrink-0">
                     Độ hoàn thiện hồ sơ
                   </span>
                   <span className="text-sm font-extrabold text-blue-600 group-hover:underline whitespace-nowrap">{profileCompleteness}%</span>
                 </div>
                 
                 {showCompleteness && (
                   <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-100 shadow-xl rounded-xl z-50 p-4">
                     <h4 className="text-xs font-bold text-gray-800 mb-3 uppercase tracking-wider border-b border-gray-100 pb-2">Tiêu chí hoàn thiện ({profileCompleteness}%)</h4>
                     <ul className="space-y-2.5">
                       {completenessItems.map((item, idx) => (
                         <li key={idx} className="flex items-center justify-between">
                           <div className="flex items-center gap-2">
                             {item.done ? (
                               <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                             ) : (
                               <div className="w-3.5 h-3.5 rounded-full border border-gray-300 shrink-0" />
                             )}
                             <span className={`text-[11px] font-semibold ${item.done ? 'text-gray-800' : 'text-gray-400'}`}>
                               {item.name}
                             </span>
                           </div>
                           <span className={`text-[10px] font-bold ${item.done ? 'text-green-600' : 'text-gray-400'}`}>
                             +{item.points}%
                           </span>
                         </li>
                       ))}
                     </ul>
                   </div>
                 )}
               </div>
               <ReadOnlyRow label="Tổng thu nhập" value={`${totalEarnings} VNĐ`} icon={DollarSign} badgeClass="text-sm font-extrabold text-green-600" />
               <ReadOnlyRow label="Dự án hoàn thành" value={projectsCompleted} icon={Briefcase} />
               <ReadOnlyRow label="Đánh giá trung bình" value={`${averageRating} / 5`} icon={Star} badgeClass="text-sm font-extrabold text-yellow-500" />
             </div>
           ) : (
             <div className="space-y-4 relative z-10">
               <ReadOnlyRow label="Độ hoàn thiện thông tin" value={`${profileCompleteness}%`} badgeClass="text-sm font-extrabold text-blue-600" />
               <ReadOnlyRow label="Tổng tiền đã chi" value={`${totalSpent} VNĐ`} icon={DollarSign} badgeClass="text-sm font-extrabold text-purple-600" />
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
    </div>
  );
}

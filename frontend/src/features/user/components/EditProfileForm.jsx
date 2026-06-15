import React from 'react';
import { Briefcase, Building2, CheckCircle, Clock, Activity, BarChart2, DollarSign, Star } from 'lucide-react';

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

export default function EditProfileForm({
  role, bio, setBio, companyDescription, setCompanyDescription, displayName, setDisplayName, fullName, setFullName, phone, setPhone, email, setEmail, professionalTitle, setProfessionalTitle, hourlyRate, setHourlyRate, companyName, setCompanyName, website, setWebsite, companySize, setCompanySize, industry, setIndustry, adminLevel, country, setCountry, city, setCity, address, setAddress, timezone, setTimezone, status, emailVerified, createdAt, lastLoginAt, formatDate, handleSaveProfile, profileCompleteness, totalEarnings, totalSpent, projectsCompleted, projectsPosted, averageRating
}) {
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
  );
}

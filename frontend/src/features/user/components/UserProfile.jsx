import React from 'react';
import { User, Briefcase, MapPin, Phone, Mail, DollarSign, Globe, Star, Edit3, BarChart2 } from 'lucide-react';

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

export default function UserProfile({
  setActiveTab, onNavigate, role, bio, companyDescription, address, city, country, phone, email, hourlyRate, website,
  formatCurrency, totalEarnings, totalSpent, formatCompactCurrency, projectsCompleted, projectsPosted, averageRating, profileCompleteness
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

      <div className="lg:col-span-2 flex flex-col gap-6">

        <div className="flex justify-end">
          <button onClick={() => onNavigate('edit_profile')} className="px-5 py-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-sm rounded-xl transition-colors flex items-center gap-2 shadow-sm">
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
  );
}

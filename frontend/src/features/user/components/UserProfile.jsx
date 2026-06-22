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
  formatCurrency, totalEarnings, totalSpent, formatCompactCurrency, projectsCompleted, projectsPosted, averageRating, profileCompleteness,
  hideEmail, hidePhone, hideLocation
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


      </div>

      {/* Right Column for Profile */}
      <div className="flex flex-col gap-6">
        {/* Contact & Basic Info */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-extrabold text-gray-900 text-lg mb-6 flex items-center gap-2">
            Thông tin cơ bản
          </h3>
          <div className="space-y-5">
            <ReadOnlyRow
              label="Địa chỉ"
              icon={MapPin}
              value={hideLocation ? <span className="text-gray-400 italic">Đã ẩn</span> : ([city, country].filter(Boolean).join(', ') || 'Chưa cập nhật')}
            />
            <ReadOnlyRow
              label="Số điện thoại"
              icon={Phone}
              value={hidePhone ? <span className="text-gray-400 italic">Đã ẩn</span> : (phone || 'Chưa cập nhật')}
            />
            <ReadOnlyRow
              label="Email"
              icon={Mail}
              value={hideEmail ? <span className="text-gray-400 italic">Đã ẩn</span> : (email || 'Chưa cập nhật')}
            />
            {role === 'employer' && (
              <ReadOnlyRow
                label="Website"
                icon={Globe}
                value={website || 'Chưa cập nhật'}
              />
            )}
          </div>
        </div>


      </div>
    </div>
  );
}

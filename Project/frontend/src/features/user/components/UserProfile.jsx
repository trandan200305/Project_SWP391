import React from 'react';
import { User, Briefcase, MapPin, Phone, Mail, DollarSign, Globe, Star, Edit3, BarChart2, ChevronLeft, ChevronRight } from 'lucide-react';
import PortfolioSection from './PortfolioSection';
import { api } from '../../../api/apiClient';

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
  user, role, targetId,
  setActiveTab, onNavigate, bio, companyDescription, address, city, country, phone, email, hourlyRate, website,
  formatCurrency, totalEarnings, totalSpent, formatCompactCurrency, projectsCompleted, projectsPosted, averageRating, profileCompleteness,
  hideEmail, hidePhone, hideLocation, primarySkills, expertiseField
}) {
  const isOwner = user && targetId === user.id;

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

        {/* Skills Section */}
        {role === 'freelancer' && primarySkills && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 relative overflow-hidden">
            <h3 className="font-extrabold text-gray-900 text-lg mb-4">
              Kỹ năng chuyên môn
            </h3>
            
            {primarySkills && (
              <div>
                <div className="flex flex-wrap gap-2">
                  {primarySkills.split(',').map(s => s.trim()).filter(Boolean).map((skill, index) => (
                    <span 
                      key={index} 
                      className="px-3.5 py-1.5 bg-indigo-50/70 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-100/50 shadow-sm transition-transform hover:scale-105 duration-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Portfolio Section */}
        {role === 'freelancer' && (
          <PortfolioSection targetId={targetId} isOwner={isOwner} />
        )}

        {/* Reviews Section */}
        {role === 'freelancer' && (
          <FreelancerReviewsSection freelancerId={targetId} />
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
            {role === 'freelancer' && (
              <ReadOnlyRow
                label="Lĩnh vực chuyên môn"
                icon={Briefcase}
                value={expertiseField || 'Chưa cập nhật'}
              />
            )}
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

function FreelancerReviewsSection({ freelancerId }) {
  const [reviews, setReviews] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    api.get(`/reviews/freelancer/${freelancerId}`)
      .then(data => {
        setReviews(data || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [freelancerId]);

  const handlePrev = () => {
    setCurrentIndex(prev => (prev === 0 ? reviews.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev === reviews.length - 1 ? 0 : prev + 1));
  };

  if (loading) {
    return <div className="text-xs text-slate-500 font-medium py-4">Đang tải đánh giá từ khách hàng...</div>;
  }

  if (reviews.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-slate-400 font-semibold text-sm">
        Chưa có đánh giá nào từ khách hàng cũ.
      </div>
    );
  }

  const activeReview = reviews[currentIndex];
  if (!activeReview) return null;

  const reviewerName = activeReview.reviewerName || activeReview.reviewerEmployerName || "Khách hàng";
  const reviewerAvatar = activeReview.reviewerAvatar || activeReview.reviewerEmployerAvatar;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-extrabold text-gray-900 text-xl flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          Đánh giá từ Khách hàng ({reviews.length})
        </h3>
        
        {reviews.length > 1 && (
          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={handlePrev}
              className="p-1.5 rounded-lg border border-gray-100 hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors shadow-sm"
              title="Đánh giá trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-gray-400 select-none px-1">
              {currentIndex + 1} / {reviews.length}
            </span>
            <button 
              type="button"
              onClick={handleNext}
              className="p-1.5 rounded-lg border border-gray-100 hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors shadow-sm"
              title="Đánh giá tiếp theo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4 min-h-[120px] transition-all duration-300">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center font-extrabold text-blue-600 text-sm overflow-hidden">
              {reviewerAvatar ? (
                <img src={reviewerAvatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                reviewerName.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h4 className="font-bold text-gray-800 text-sm">{reviewerName}</h4>
              <span className="text-[10px] text-gray-400 font-medium flex flex-wrap items-center gap-1.5 mt-0.5">
                <span>{new Date(activeReview.createdAt).toLocaleDateString('vi-VN')}</span>
                {activeReview.contractTitle && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span>Dự án: <span className="text-indigo-650 font-bold">{activeReview.contractTitle}</span></span>
                  </>
                )}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star 
                key={s} 
                className={`w-3.5 h-3.5 ${s <= activeReview.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-200'}`} 
              />
            ))}
          </div>
        </div>
        <p className="text-sm text-gray-650 font-medium leading-relaxed whitespace-pre-wrap pl-11 italic bg-gray-50/50 p-4 rounded-xl border border-gray-100/50">
          "{activeReview.comment || 'Không có nhận xét chi tiết.'}"
        </p>
      </div>

      {reviews.length > 1 && (
        <div className="flex justify-center gap-1.5 pt-2">
          {reviews.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-indigo-600 w-4' : 'bg-gray-200 hover:bg-gray-300'}`}
              title={`Xem đánh giá ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

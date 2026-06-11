import React, { useState, useEffect } from 'react';
import { Star, Quote, Award, Sparkles, ArrowUpRight } from 'lucide-react';

export default function Testimonials() {
  const [freelancers, setFreelancers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  
  const avatarColors = [
    { color: 'bg-teal-600 text-teal-100' },
    { color: 'bg-indigo-600 text-indigo-100' },
    { color: 'bg-rose-600 text-rose-100' },
    { color: 'bg-amber-600 text-amber-100' }
  ];

  
  const getInitials = (name) => {
    if (!name) return 'FL';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  
  useEffect(() => {
    fetch('http://localhost:8080/api/freelancers/top')
      .then(res => {
        if (!res.ok) throw new Error('Network response error');
        return res.json();
      })
      .then(data => {
        setFreelancers(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching freelancers:', err);
        setIsLoading(false);
      });
  }, []);

  return (
    <section className="py-20 bg-surface border-t border-muted-light/60">
      <div className="max-w-7xl mx-auto px-6">
        
        {}
        <div className="mb-20">
          <div className="flex justify-between items-end mb-10">
            <div>
              <span className="text-secondary font-bold text-label-md uppercase tracking-wider block mb-2">Đội ngũ chuyên nghiệp</span>
              <h2 className="font-display text-3xl font-extrabold text-primary">Top Freelancers xuất sắc</h2>
            </div>
            <a href="#all-freelancers" className="text-secondary font-bold text-body-sm hover:underline flex items-center gap-1">
              Tìm thêm chuyên gia →
            </a>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-surface p-6 rounded-2xl border border-muted-light/60 shadow-sm animate-pulse flex flex-col items-center">
                  <div className="w-20 h-20 bg-muted-light/40 rounded-full mb-4" />
                  <div className="h-4 bg-muted-light/40 rounded w-24 mb-2" />
                  <div className="h-3 bg-muted-light/40 rounded w-36 mb-4" />
                  <div className="h-4 bg-muted-light/40 rounded w-28" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {freelancers.map((profile, index) => {
                const name = profile.user?.displayName || profile.user?.fullName || 'Freelancer';
                const initials = getInitials(name);
                const colorConfig = avatarColors[index % avatarColors.length];
                
                return (
                  <div 
                    key={profile.profileId} 
                    className="bg-surface p-6 rounded-2xl border border-muted-light/60 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center group"
                  >
                    {}
                    <div className="relative mb-4">
                      <div className={`w-20 h-20 ${colorConfig.color} rounded-full flex items-center justify-center font-extrabold text-2xl shadow-md`}>
                        {initials}
                      </div>
                      <span className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center shadow-sm">
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                      </span>
                    </div>

                    {}
                    <h3 className="font-display text-lg font-bold text-primary mb-1 flex items-center gap-1 group-hover:text-secondary transition-colors duration-200">
                      {name}
                    </h3>
                    
                    {}
                    <span className="text-body-sm text-muted mb-3 block font-medium line-clamp-1">{profile.professionalTitle || 'Chuyên gia Freelancer'}</span>
                    
                    {}
                    <div className="flex items-center justify-center gap-1.5 mb-6">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span className="font-bold text-primary text-body-sm">{profile.averageRating ? parseFloat(profile.averageRating).toFixed(1) : '5.0'}</span>
                      <span className="text-muted text-[13px]">({profile.projectsCompleted} đánh giá)</span>
                    </div>

                    {}
                    <button className="w-full bg-muted-light/20 hover:bg-secondary-light hover:text-secondary-dark border border-muted-light/50 hover:border-secondary/20 py-2.5 rounded-xl font-semibold text-primary text-body-sm transition-all duration-200 flex items-center justify-center gap-1">
                      Xem hồ sơ <ArrowUpRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center pt-8 border-t border-muted-light/60">
          <div>
            <span className="text-secondary font-bold text-label-md uppercase tracking-wider block mb-2">Được các doanh nghiệp đánh giá cao</span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-primary leading-tight mb-8">
              Khách hàng nói gì về LancerPro?
            </h2>
            <div className="space-y-6">
              <div className="relative pl-6 border-l-4 border-secondary/60">
                <Quote className="w-8 h-8 text-secondary/15 absolute -top-4 -left-2" />
                <p className="font-sans italic text-muted text-body-md mb-3 leading-relaxed relative z-10">
                  "LancerPro đã làm thay đổi hoàn toàn cách chúng tôi tuyển dụng và vận hành đội ngũ nhân sự mở rộng. Chúng tôi đã tìm thấy các lập trình viên React và thiết kế UI tài năng chỉ trong vài ngày thay vì vài tuần như trước đây."
                </p>
                <div>
                  <h4 className="font-bold text-primary text-body-sm">Anh Minh Hoàng</h4>
                  <p className="text-[12px] text-muted font-medium">CTO, CloudTech Solutions</p>
                </div>
              </div>

              <div className="relative pl-6 border-l-4 border-muted-light/80">
                <Quote className="w-8 h-8 text-primary/5 absolute -top-4 -left-2" />
                <p className="font-sans italic text-muted text-body-md mb-3 leading-relaxed relative z-10">
                  "Cơ chế thanh toán ký quỹ của LancerPro mang lại sự an tâm tuyệt đối cho cả chúng tôi lẫn các chuyên gia làm việc từ xa. Tiền chỉ được giải ngân sau khi sản phẩm đạt chất lượng yêu cầu."
                </p>
                <div>
                  <h4 className="font-bold text-primary text-body-sm">Chị Phương Thảo</h4>
                  <p className="text-[12px] text-muted font-medium">Creative Director, Apex Digital Agency</p>
                </div>
              </div>
            </div>
          </div>

          {}
          <div className="relative lg:pl-10">
            <div className="aspect-[4/3] bg-gradient-to-tr from-primary to-primary-light rounded-3xl p-8 text-white relative overflow-hidden shadow-xl flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-64 h-64 bg-secondary opacity-20 blur-[80px] rounded-full" />
              
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-6">
                  <Award className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="font-display text-2xl font-bold mb-3">Chất lượng được kiểm chứng</h3>
                <p className="text-white/80 text-body-sm leading-relaxed mb-6">
                  Tất cả freelancer xuất sắc của chúng tôi đều trải qua bài kiểm tra năng lực đầu vào và được xác minh lý lịch rõ ràng trước khi nhận dự án.
                </p>
              </div>

              <div className="flex gap-4 relative z-10 pt-4 border-t border-white/10">
                <div>
                  <p className="text-3xl font-extrabold text-white">4.9/5</p>
                  <p className="text-[11px] text-white/60 font-medium uppercase tracking-wider">Điểm đánh giá trung bình</p>
                </div>
                <div className="w-px h-10 bg-white/10 my-auto" />
                <div>
                  <p className="text-3xl font-extrabold text-white">12,000+</p>
                  <p className="text-[11px] text-white/60 font-medium uppercase tracking-wider">Doanh nghiệp tin cậy</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

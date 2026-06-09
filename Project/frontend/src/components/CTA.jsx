import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function CTA({ onNavigate, user }) {
  const handlePostJobClick = (e) => {
    e.preventDefault();
    if (onNavigate) {
      if (!user) {
        localStorage.setItem('redirect_after_login', 'post_job');
        onNavigate('login');
      } else if (user.role === 'EMPLOYER') {
        onNavigate('post_job');
      } else {
        alert('Chỉ tài khoản Nhà tuyển dụng (Employer) mới có thể đăng tin tuyển dụng!');
      }
    }
  };

  return (
    <section className="py-20 px-6 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto bg-primary rounded-[2rem] p-10 md:p-20 text-center relative overflow-hidden shadow-xl">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-secondary opacity-15 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent opacity-10 blur-[100px] rounded-full pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 max-w-3xl mx-auto">
          {/* Tagline */}
          <div className="inline-flex items-center gap-1.5 bg-white/10 px-4 py-1.5 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-secondary" />
            <span className="text-body-sm font-bold text-secondary">Khởi tạo tương lai của bạn</span>
          </div>

          {/* Heading */}
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-6">
            Bắt đầu dự án của bạn ngay hôm nay
          </h2>
          
          {/* Subtitle */}
          <p className="font-sans text-white/80 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            Tham gia cùng hàng nghìn doanh nghiệp và cá nhân đã thành công khi thuê freelancer trên LancerPro. Chất lượng cao, bảo mật và chi phí tối ưu nhất.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="#post-job" 
              onClick={handlePostJobClick}
              className="bg-accent hover:bg-accent-dark text-white px-8 py-4 rounded-xl font-bold text-body-md transition-all duration-200 shadow-lg shadow-accent/20 hover:scale-105 flex items-center justify-center gap-2"
            >
              Đăng tin tuyển dụng miễn phí <ArrowRight className="w-5 h-5" />
            </a>
            <a 
              href="#learn-more" 
              onClick={(e) => {
                e.preventDefault();
                const findWorkSection = document.getElementById('find-work');
                if (findWorkSection) {
                  findWorkSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="border-2 border-white/60 text-white hover:border-white hover:bg-white/5 px-8 py-4 rounded-xl font-bold text-body-md transition-all duration-200 flex items-center justify-center cursor-pointer"
            >
              Tìm kiếm dự án
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

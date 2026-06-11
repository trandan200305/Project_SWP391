import React, { useState } from 'react';
import { Globe, Mail, Send, CheckCircle2 } from 'lucide-react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 5000);
    }
  };

  return (
    <footer className="w-full py-16 bg-primary-dark text-white border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
        
        {}
        <div className="flex flex-col gap-4">
          <span className="font-display text-2xl font-extrabold tracking-tight text-white">
            Lancer<span className="text-secondary">Pro</span>
          </span>
          <p className="text-white/60 text-body-sm leading-relaxed">
            Sàn thương mại điện tử về dịch vụ của freelancers lớn nhất Việt Nam, giúp kết nối doanh nghiệp và chuyên gia một cách nhanh chóng, chất lượng và an toàn tuyệt đối.
          </p>
          <div className="flex gap-4 mt-2">
            <a href="#" className="w-8 h-8 rounded-lg bg-white/5 hover:bg-secondary/20 hover:text-secondary flex items-center justify-center transition-colors">
              <Globe className="w-4 h-4" />
            </a>
            <a href="#" className="w-8 h-8 rounded-lg bg-white/5 hover:bg-secondary/20 hover:text-secondary flex items-center justify-center transition-colors">
              <Mail className="w-4 h-4" />
            </a>
          </div>
        </div>

        {}
        <div>
          <h4 className="font-bold text-white text-body-md mb-6 relative pb-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-10 after:h-0.5 after:bg-secondary">
            Dành cho Khách hàng
          </h4>
          <ul className="space-y-3 text-white/60 text-body-sm">
            <li><a href="#post-job" className="hover:text-secondary transition-colors">Đăng dự án</a></li>
            <li><a href="#find-freelancer" className="hover:text-secondary transition-colors">Tìm freelancer</a></li>
            <li><a href="#process" className="hover:text-secondary transition-colors">Quy trình làm việc</a></li>
            <li><a href="#pricing" className="hover:text-secondary transition-colors">Bảng phí dịch vụ</a></li>
          </ul>
        </div>

        {}
        <div>
          <h4 className="font-bold text-white text-body-md mb-6 relative pb-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-10 after:h-0.5 after:bg-secondary">
            Dành cho Freelancer
          </h4>
          <ul className="space-y-3 text-white/60 text-body-sm">
            <li><a href="#find-jobs" className="hover:text-secondary transition-colors">Tìm việc làm</a></li>
            <li><a href="#create-profile" className="hover:text-secondary transition-colors">Tạo hồ sơ năng lực</a></li>
            <li><a href="#membership" className="hover:text-secondary transition-colors">Gói thành viên</a></li>
            <li><a href="#assessments" className="hover:text-secondary transition-colors">Đánh giá kỹ năng</a></li>
          </ul>
        </div>

        {}
        <div>
          <h4 className="font-bold text-white text-body-md mb-6 relative pb-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-10 after:h-0.5 after:bg-secondary">
            Bản tin LancerPro
          </h4>
          <p className="text-white/60 text-body-sm mb-4 leading-relaxed">
            Đăng ký nhận các xu hướng mới nhất về kinh tế tự do và bí quyết thuê ngoài hiệu quả.
          </p>
          
          <form onSubmit={handleSubscribe} className="flex gap-2">
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập Email của bạn" 
              required
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-body-sm w-full focus:outline-none focus:ring-1 focus:ring-secondary focus:border-secondary transition-all"
            />
            <button 
              type="submit" 
              className="bg-secondary hover:bg-secondary-dark text-white p-2.5 rounded-lg font-bold text-body-sm transition-all duration-200 shadow-md shrink-0 flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {subscribed && (
            <div className="flex items-center gap-1.5 mt-3 text-emerald-400 text-body-sm animate-fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>Đăng ký thành công!</span>
            </div>
          )}
        </div>
      </div>

      {}
      <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-white/40 text-body-sm">
        <p>© 2026 LancerPro Marketplace. Phát triển dựa trên CNY Database và Spring Boot + React.</p>
        <div className="flex gap-6">
          <a href="#terms" className="hover:text-white transition-colors">Điều khoản dịch vụ</a>
          <a href="#privacy" className="hover:text-white transition-colors">Chính sách bảo mật</a>
          <a href="#cookies" className="hover:text-white transition-colors">Chính sách Cookie</a>
        </div>
      </div>
    </footer>
  );
}

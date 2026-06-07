import React from 'react';
import { FileText, SearchCheck, Handshake, ShieldCheck, ArrowRight } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      icon: FileText,
      title: '1. Đăng dự án',
      desc: 'Mô tả chi tiết yêu cầu công việc và khoảng ngân sách mong muốn để thu hút các ứng viên hàng đầu.',
      color: 'bg-primary-light/5 text-primary',
      hoverColor: 'group-hover:bg-secondary group-hover:text-white',
    },
    {
      icon: SearchCheck,
      title: '2. Duyệt báo giá',
      desc: 'Xem xét và đánh giá các hồ sơ năng lực, lịch sử công việc và phản hồi từ khách hàng trước.',
      color: 'bg-primary-light/5 text-primary',
      hoverColor: 'group-hover:bg-secondary group-hover:text-white',
    },
    {
      icon: Handshake,
      title: '3. Chọn freelancer',
      desc: 'Lựa chọn đối tác phù hợp nhất, thống nhất điều khoản hợp đồng và bắt đầu triển khai qua hệ thống.',
      color: 'bg-primary-light/5 text-primary',
      hoverColor: 'group-hover:bg-secondary group-hover:text-white',
    },
    {
      icon: ShieldCheck,
      title: '4. Thanh toán an toàn',
      desc: 'Ngân sách được ký quỹ an toàn và chỉ giải ngân từng phần (Milestone) khi bạn duyệt sản phẩm đạt yêu cầu.',
      color: 'bg-primary-light/5 text-primary',
      hoverColor: 'group-hover:bg-secondary group-hover:text-white',
    },
  ];

  return (
    <section className="py-20 bg-surface border-t border-muted-light/60">
      <div className="max-w-7xl mx-auto px-6">
        {}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div className="max-w-2xl">
            <span className="text-secondary font-bold text-label-md uppercase tracking-wider block mb-2">Quy trình chuyên nghiệp</span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-primary tracking-tight">
              Các bước làm việc đơn giản và tin cậy
            </h2>
            <p className="font-sans text-muted mt-3">
              LancerPro chuẩn hóa toàn bộ quy trình làm việc từ khâu tìm kiếm cho tới nghiệm thu bàn giao và thanh toán ký quỹ, giúp bạn hoàn toàn an tâm.
            </p>
          </div>
          <a href="#guide" className="flex items-center gap-2 text-secondary font-bold hover:text-secondary-dark hover:underline transition-colors shrink-0">
            Xem hướng dẫn chi tiết <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div 
                key={index} 
                className="group p-6 rounded-2xl bg-surface border border-muted-light/50 shadow-sm hover:shadow-md hover:border-secondary/20 transition-all duration-300"
              >
                {}
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${step.color} ${step.hoverColor} transition-all duration-300 shadow-sm`}>
                  <Icon className="w-7 h-7" />
                </div>
                
                {}
                <h3 className="font-display text-lg font-bold text-primary mb-3 group-hover:text-secondary transition-colors duration-200">
                  {step.title}
                </h3>
                <p className="font-sans text-muted text-body-sm leading-relaxed">
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

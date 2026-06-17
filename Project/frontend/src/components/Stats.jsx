import React from 'react';
import { Users, CheckCircle, Award, Smile } from 'lucide-react';

export default function Stats() {
  const statItems = [
    {
      value: '1.5M+',
      label: 'Freelancers tài năng',
      sublabel: 'Có mặt trên toàn quốc',
      icon: Users,
      color: 'text-secondary',
      bgColor: 'bg-secondary-light/60',
      borderColor: 'border-secondary/20',
    },
    {
      value: '850k+',
      label: 'Dự án hoàn tất',
      sublabel: 'Đảm bảo chất lượng cao',
      icon: CheckCircle,
      color: 'text-accent',
      bgColor: 'bg-accent-light/50',
      borderColor: 'border-accent/15',
    },
    {
      value: '45k+',
      label: 'Doanh nghiệp tin dùng',
      sublabel: 'Từ startup tới tập đoàn',
      icon: Award,
      color: 'text-primary',
      bgColor: 'bg-muted-light/60',
      borderColor: 'border-primary/10',
    },
    {
      value: '98%',
      label: 'Tỉ lệ hài lòng',
      sublabel: 'Đánh giá 5 sao từ khách hàng',
      icon: Smile,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200/50',
    }
  ];

  return (
    <section className="py-12 -mt-16 relative z-20 max-w-7xl mx-auto px-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statItems.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div 
              key={index} 
              className={`glass-card p-6 rounded-2xl border ${stat.borderColor} shadow-level-1 hover:shadow-level-2 transition-all duration-300 hover:-translate-y-1 flex items-center gap-5`}
            >
              {}
              <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center shrink-0`}>
                <IconComponent className={`w-6 h-6 ${stat.color}`} />
              </div>
              
              {}
              <div className="flex flex-col">
                <span className="font-display text-2xl sm:text-3xl font-extrabold text-primary leading-tight">
                  {stat.value}
                </span>
                <span className="font-semibold text-body-sm text-primary">
                  {stat.label}
                </span>
                <span className="text-body-sm text-muted text-[12px]">
                  {stat.sublabel}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

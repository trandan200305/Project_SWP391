import React, { useState } from 'react';
import { 
  ShieldCheck, 
  UserCheck, 
  BadgeDollarSign, 
  Gavel, 
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  Briefcase
} from 'lucide-react';
import StaffDashboardPage from './StaffDashboardPage.jsx';

export default function AdminOperationsHub({ user, onNavigateToHome, onNavigate, onLogout }) {
  const [activeQueue, setActiveQueue] = useState(null);

  const handleOpenQueue = (queueId) => {
    setActiveQueue(queueId);
  };

  const handleBackToHub = () => {
    setActiveQueue(null);
  };

  // If a queue is active, we render the StaffDashboardPage in embedded mode.
  if (activeQueue) {
    return (
      <StaffDashboardPage 
        user={user} 
        onNavigateToHome={onNavigateToHome}
        onNavigate={onNavigate}
        onLogout={onLogout}
        isEmbeddedAdminMode={true}
        initialTab={activeQueue}
        onBackToHub={handleBackToHub}
      />
    );
  }

  const operationCards = [
    {
      id: 'KYC',
      title: 'Xác thực KYC',
      description: 'Duyệt hồ sơ định danh (CCCD, Selfie) từ người dùng.',
      icon: UserCheck,
      color: 'bg-blue-50 text-blue-600',
      borderColor: 'border-blue-200'
    },
    {
      id: 'Withdrawals',
      title: 'Yêu cầu Rút tiền',
      description: 'Kiểm duyệt và thực hiện lệnh rút tiền.',
      icon: BadgeDollarSign,
      color: 'bg-emerald-50 text-emerald-600',
      borderColor: 'border-emerald-200'
    },
    {
      id: 'Disputes',
      title: 'Tranh chấp & Khiếu nại',
      description: 'Phân xử các tranh chấp hợp đồng giữa Freelancer và Client.',
      icon: Gavel,
      color: 'bg-rose-50 text-rose-600',
      borderColor: 'border-rose-200'
    },
    {
      id: 'Refunds',
      title: 'Yêu cầu Hoàn tiền',
      description: 'Xử lý các khoản hoàn tiền do dự án thất bại hoặc hủy bỏ.',
      icon: TrendingUp,
      color: 'bg-orange-50 text-orange-600',
      borderColor: 'border-orange-200'
    },
    {
      id: 'Moderation',
      title: 'Kiểm duyệt Nội dung',
      description: 'Kiểm duyệt Job, Dịch vụ (Gig) và Hồ sơ cá nhân (Profile).',
      icon: ShieldCheck,
      color: 'bg-purple-50 text-purple-600',
      borderColor: 'border-purple-200'
    },
    {
      id: 'Reports',
      title: 'Báo cáo vi phạm',
      description: 'Xử lý các ticket report từ cộng đồng.',
      icon: AlertTriangle,
      color: 'bg-yellow-50 text-yellow-600',
      borderColor: 'border-yellow-200'
    },
    {
      id: 'Support',
      title: 'Hỗ trợ Khách hàng',
      description: 'Trả lời tin nhắn, hỗ trợ trực tiếp thông qua chat nội bộ.',
      icon: HelpCircle,
      color: 'bg-cyan-50 text-cyan-600',
      borderColor: 'border-cyan-200'
    }
  ];

  return (
    <div className="flex-1 p-8 bg-slate-50 overflow-y-auto w-full h-full">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
            <Briefcase className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Trung tâm Điều hành Nghiệp vụ</h1>
        </div>
        <p className="text-slate-500">Tổng quan các hàng đợi (queues) phê duyệt dành cho Admin. Chọn một nhóm nghiệp vụ để bắt đầu xử lý ngay mà không cần rời trang.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {operationCards.map(card => (
          <div 
            key={card.id}
            onClick={() => handleOpenQueue(card.id)}
            className={`bg-white rounded-xl border ${card.borderColor} p-6 cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group flex flex-col`}
          >
            <div className={`w-12 h-12 rounded-lg ${card.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <card.icon className="w-6 h-6" />
            </div>
            <h3 className="text-[17px] font-bold text-slate-800 mb-2">{card.title}</h3>
            <p className="text-sm text-slate-500 flex-1 leading-relaxed">{card.description}</p>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-400 group-hover:text-slate-600 transition-colors">Truy cập Queue</span>
              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-slate-100 transition-colors">
                <span className="text-xl leading-none">→</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

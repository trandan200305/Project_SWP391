import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  BadgeDollarSign, 
  Gavel, 
  TrendingUp,
  AlertTriangle,
  Briefcase,
  Loader2
} from 'lucide-react';
import StaffDashboardPage from './StaffDashboardPage.jsx';
import { adminApi } from '../api/adminApi.js';

export default function AdminOperationsHub({ user, onNavigateToHome, onNavigate, onLogout }) {
  const [activeQueue, setActiveQueue] = useState(null);
  const [stats, setStats] = useState({
    withdrawals: null,
    disputes: null,
    refunds: null,
    moderation: null,
    reports: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchRealData = async () => {
      try {
        const [
          withdrawalsData,
          disputesData,
          reportsData,
          projectsData,
          profilesData,
          gigsData
        ] = await Promise.all([
          adminApi.getWithdrawals().catch(() => []),
          adminApi.getDisputes().catch(() => []),
          adminApi.getReports().catch(() => []),
          adminApi.getPendingProjects().catch(() => []),
          adminApi.getProfileRequests().catch(() => []),
          adminApi.getPendingGigs().catch(() => [])
        ]);

        if (isMounted) {
          const pendingWithdrawals = withdrawalsData.filter(w => w.status === 'PENDING').length;
          const openDisputes = disputesData.filter(d => d.status === 'OPEN' || d.status === 'IN_PROGRESS').length;
          const pendingReports = reportsData.filter(r => r.status === 'PENDING').length;
          
          // Refunds might be a specific subset of disputes or withdrawals. Let's just mock it or assume it's part of disputes for now.
          const openRefunds = disputesData.filter(d => d.disputeReason === 'REFUND' && d.status === 'OPEN').length;

          const pendingModeration = 
            (projectsData ? projectsData.length : 0) + 
            (profilesData ? profilesData.length : 0) + 
            (gigsData ? gigsData.length : 0);

          setStats({
            withdrawals: pendingWithdrawals,
            disputes: openDisputes,
            refunds: openRefunds,
            moderation: pendingModeration,
            reports: pendingReports
          });
        }
      } catch (error) {
        console.error("Error fetching operations hub stats:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchRealData();
    
    return () => { isMounted = false; };
  }, []);

  const handleOpenQueue = (queueId) => {
    setActiveQueue(queueId);
  };

  const handleBackToHub = () => {
    setActiveQueue(null);
  };

  // If a queue is active, we render the StaffDashboardPage in embedded mode.
  // Note: Admin directly has full rights, no need for secondary approval.
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
      id: 'Withdrawals',
      title: 'Yêu cầu Rút tiền',
      description: 'Kiểm duyệt và thực hiện lệnh rút tiền cho Freelancer/Client.',
      icon: BadgeDollarSign,
      color: 'bg-emerald-50 text-emerald-600',
      borderColor: 'border-emerald-200',
      count: stats.withdrawals,
      label: 'Lệnh chờ duyệt'
    },
    {
      id: 'Disputes',
      title: 'Tranh chấp & Khiếu nại',
      description: 'Phân xử các tranh chấp hợp đồng giữa Freelancer và Client.',
      icon: Gavel,
      color: 'bg-rose-50 text-rose-600',
      borderColor: 'border-rose-200',
      count: stats.disputes,
      label: 'Vụ việc đang xử lý'
    },
    {
      id: 'Refunds',
      title: 'Yêu cầu Hoàn tiền',
      description: 'Xử lý các khoản hoàn tiền do dự án thất bại hoặc hủy bỏ.',
      icon: TrendingUp,
      color: 'bg-orange-50 text-orange-600',
      borderColor: 'border-orange-200',
      count: stats.refunds,
      label: 'Yêu cầu chờ duyệt'
    },
    {
      id: 'Moderation',
      title: 'Kiểm duyệt Nội dung',
      description: 'Kiểm duyệt Dự án mới, Dịch vụ (Gig) và Hồ sơ cá nhân (Profile).',
      icon: ShieldCheck,
      color: 'bg-purple-50 text-purple-600',
      borderColor: 'border-purple-200',
      count: stats.moderation,
      label: 'Mục cần duyệt'
    },
    {
      id: 'Reports',
      title: 'Báo cáo vi phạm',
      description: 'Xử lý các report từ người dùng về nội dung hoặc tin nhắn rác.',
      icon: AlertTriangle,
      color: 'bg-yellow-50 text-yellow-600',
      borderColor: 'border-yellow-200',
      count: stats.reports,
      label: 'Báo cáo chờ xử lý'
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
        <p className="text-slate-500">Tổng quan các hàng đợi (queues) phê duyệt dành cho Admin. Số liệu hiển thị là dữ liệu thực tế (Real-time data). Admin xử lý trực tiếp không cần qua phê duyệt trung gian.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {operationCards.map(card => (
          <div 
            key={card.id}
            onClick={() => handleOpenQueue(card.id)}
            className={`bg-white rounded-xl border ${card.borderColor} p-6 cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group flex flex-col relative overflow-hidden`}
          >
            {loading && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-10">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            )}
            
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 rounded-lg ${card.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <card.icon className="w-6 h-6" />
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-slate-800">
                  {card.count !== null ? card.count : '-'}
                </span>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{card.label}</p>
              </div>
            </div>
            
            <h3 className="text-[17px] font-bold text-slate-800 mb-2">{card.title}</h3>
            <p className="text-sm text-slate-500 flex-1 leading-relaxed">{card.description}</p>
            
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-400 group-hover:text-slate-600 transition-colors">Vào không gian làm việc</span>
              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                <span className="text-xl leading-none text-slate-600">→</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

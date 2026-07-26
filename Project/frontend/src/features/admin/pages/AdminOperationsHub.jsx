import React, { useState } from 'react';
import { 
  ShieldCheck, 
  BadgeDollarSign, 
  Gavel, 
  AlertTriangle,
  Briefcase
} from 'lucide-react';
import AdminWithdrawalsQueue from '../components/operations/AdminWithdrawalsQueue.jsx';
import AdminDisputesQueue from '../components/operations/AdminDisputesQueue.jsx';
import AdminModerationQueue from '../components/operations/AdminModerationQueue.jsx';
import AdminReportsQueue from '../components/operations/AdminReportsQueue.jsx';

export default function AdminOperationsHub({ user }) {
  const [activeTab, setActiveTab] = useState('withdrawals');

  const tabs = [
    { id: 'withdrawals', label: 'Lệnh Rút tiền', icon: BadgeDollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { id: 'disputes', label: 'Xử lý Tranh chấp', icon: Gavel, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
    { id: 'moderation', label: 'Kiểm duyệt Nội dung', icon: ShieldCheck, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
    { id: 'reports', label: 'Báo cáo vi phạm', icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' }
  ];

  return (
    <div className="flex-1 p-8 bg-slate-50 overflow-y-auto w-full h-full">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
              <Briefcase className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Trung tâm Điều hành Nghiệp vụ</h1>
          </div>
          <p className="text-slate-500">Môi trường làm việc độc lập dành cho Admin. Phê duyệt trực tiếp, không qua trung gian. Dữ liệu thời gian thực.</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex space-x-2 mb-8 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 max-w-fit overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 whitespace-nowrap
              ${activeTab === tab.id 
                ? `${tab.bg} ${tab.color} shadow-sm border border-transparent` 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 border border-transparent hover:border-slate-200'}
            `}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
        {activeTab === 'withdrawals' && <AdminWithdrawalsQueue adminId={user?.id || 1} />}
        {activeTab === 'disputes' && <AdminDisputesQueue adminId={user?.id || 1} />}
        {activeTab === 'moderation' && <AdminModerationQueue adminId={user?.id || 1} />}
        {activeTab === 'reports' && <AdminReportsQueue adminId={user?.id || 1} />}
      </div>
    </div>
  );
}

import React from 'react';
import { CheckCircle2, XCircle, ArrowRight, Home, Briefcase } from 'lucide-react';

export default function PaymentResultPage({ pageParams, onNavigate }) {
  const status = pageParams?.status || 'failed';
  const projectId = pageParams?.projectId || 'N/A';

  const handleGoHome = () => {
    // Clear search and query parameters
    window.history.replaceState({}, document.title, window.location.pathname);
    if (onNavigate) onNavigate('home');
  };

  const handleGoJobs = () => {
    window.history.replaceState({}, document.title, window.location.pathname);
    if (onNavigate) onNavigate('your_jobs');
  };

  const isSuccess = status === 'success';

  return (
    <div className="min-h-screen bg-slate-50/50 pt-28 pb-16 px-4 sm:px-6 flex items-center justify-center">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-xl shadow-slate-100/80 text-center animate-in fade-in zoom-in duration-300">
        
        {/* Animated Icon Header */}
        <div className="flex justify-center mb-6">
          {isSuccess ? (
            <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/10 scale-100 hover:scale-105 transition-transform duration-300">
              <CheckCircle2 className="w-12 h-12" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/10 scale-100 hover:scale-105 transition-transform duration-300">
              <XCircle className="w-12 h-12" />
            </div>
          )}
        </div>

        {/* Title */}
        <h1 className="font-display text-2xl font-extrabold text-slate-900 mb-2">
          {isSuccess ? 'Thanh toán thành công!' : 'Thanh toán không thành công'}
        </h1>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          {isSuccess 
            ? 'Cảm ơn bạn. Phí dịch vụ đăng tin tuyển dụng đã được thanh toán thành công và dự án của bạn đã hoạt động.' 
            : 'Giao dịch thanh toán phí đăng dự án bị từ chối hoặc đã bị hủy bỏ bởi người dùng.'}
        </p>

        {/* Transaction Summary Card */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-8 text-left space-y-3">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Chi tiết giao dịch</span>
            <span className={`px-2 py-0.5 rounded text-[10px] ${isSuccess ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
              {isSuccess ? 'Thành công' : 'Thất bại'}
            </span>
          </div>
          
          <hr className="border-slate-150" />
          
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 font-semibold">Loại giao dịch:</span>
            <span className="text-slate-800 font-bold">Phí xuất bản dự án</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-slate-500 font-semibold">Mã dự án:</span>
            <span className="text-slate-800 font-bold font-mono">#{projectId}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-slate-500 font-semibold">Phương thức:</span>
            <span className="text-slate-800 font-bold">Cổng VNPay</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {isSuccess ? (
            <button
              onClick={handleGoJobs}
              className="w-full bg-secondary hover:bg-secondary-dark text-white font-extrabold text-sm py-3.5 px-6 rounded-2xl shadow-md shadow-secondary/10 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 group"
            >
              <Briefcase className="w-4 h-4" />
              Xem dự án của tôi
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            <button
              onClick={handleGoJobs}
              className="w-full bg-rose-600 hover:bg-rose-750 text-white font-extrabold text-sm py-3.5 px-6 rounded-2xl shadow-md transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              Thử lại / Xem dự án
            </button>
          )}

          <button
            onClick={handleGoHome}
            className="w-full bg-white border border-slate-250 hover:bg-slate-50 text-slate-700 font-bold text-sm py-3.5 px-6 rounded-2xl transition-all active:scale-[0.99] flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Về Trang chủ
          </button>
        </div>

      </div>
    </div>
  );
}

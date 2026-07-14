import React, { useState, useEffect, useRef } from 'react';
import { authApi } from '../api/authApi.js';
import { Clock, LogOut, ShieldAlert, ShieldCheck } from 'lucide-react';

export default function WaitingRoomPage({ user, onStatusActive, onLogout }) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const pollingInterval = useRef(null);

  useEffect(() => {
    // Clear any previous interval just in case
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
    }

    const checkStatus = () => {
      if (!user || !user.id || !user.role) return;

      authApi.getUserStatus(user.role.toLowerCase(), user.id)
        .then(response => {
          if (response.success) {
            if (response.status === 'ACTIVE') {
              // Clear interval immediately
              clearInterval(pollingInterval.current);
              
              // Trigger premium transitioning spinner
              setLoading(true);
              setTimeout(() => {
                onStatusActive();
              }, 1800);
            } else if (response.status === 'SUSPENDED' || response.status === 'BANNED' || response.status === 'DELETED') {
              clearInterval(pollingInterval.current);
              setErrorMessage('Tài khoản của bạn đã bị khóa hoặc đình chỉ hoạt động bởi Quản trị viên.');
            }
          }
        })
        .catch(err => {
          console.error('Error polling status:', err);
        });
    };

    // Initial check
    checkStatus();

    // Poll every 2 seconds
    pollingInterval.current = setInterval(checkStatus, 2000);

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [user, onStatusActive]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden select-none">
        {/* Decorative dynamic ambient glow */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-[120px] animate-pulse delay-700"></div>

        <div className="z-10 text-center space-y-6">
          <div className="relative w-24 h-24 mx-auto">
            {/* Double outer spinning rings */}
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin"></div>
            <div className="absolute -inset-2 rounded-full border-4 border-indigo-500/10 border-b-indigo-500 animate-spin [animation-duration:1.5s] [animation-direction:reverse]"></div>
            <div className="absolute inset-2 flex items-center justify-center">
              <ShieldCheck className="w-10 h-10 text-emerald-400 animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-100 tracking-wide">ĐANG KHỞI TẠO KHÔNG GIAN LÀM VIỆC</h2>
            <p className="text-slate-400 text-xs font-medium">Hệ thống đang chuẩn bị trang quản trị của bạn trong giây lát...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Dynamic atmospheric backdrops */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Main Glassmorphic Container */}
      <div className="w-full max-w-lg bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 md:p-10 shadow-2xl relative z-10 text-center space-y-8">
        
        {/* Header Illustration */}
        <div className="relative w-20 h-20 mx-auto">
          {errorMessage ? (
            <div className="w-full h-full bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center text-rose-500 animate-bounce">
              <ShieldAlert className="w-10 h-10" />
            </div>
          ) : (
            <div className="w-full h-full bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400">
              <Clock className="w-10 h-10 animate-pulse" />
            </div>
          )}
        </div>

        {/* Content Info */}
        <div className="space-y-4">
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            {errorMessage ? 'Tài Khoản Đang Bị Khóa' : 'Phòng Chờ Kích Hoạt'}
          </h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed px-2">
            {errorMessage ? errorMessage : (
              <>
                Xin chào <strong className="text-indigo-400 font-semibold">{user?.name || user?.email}</strong>. 
                Tài khoản của bạn đã được thiết lập mật khẩu thành công. 
                Tuy nhiên, bạn cần chờ <strong className="text-indigo-400 font-semibold">Quản trị viên (Admin)</strong> duyệt kích hoạt tài khoản để bắt đầu làm việc.
              </>
            )}
          </p>
        </div>

        {/* Status Indicator */}
        {!errorMessage && (
          <div className="py-4 px-6 bg-slate-800/40 rounded-2xl border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Trạng thái tài khoản</span>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping"></span>
              <span className="text-amber-500 text-xs font-extrabold tracking-wide uppercase">Chờ Admin duyệt</span>
            </div>
          </div>
        )}

        {/* Quick Help Tip */}
        <div className="text-[12px] text-slate-400 bg-slate-950/40 py-3.5 px-5 rounded-2xl border border-slate-900/50 leading-relaxed">
          {errorMessage ? (
            <span>Nếu đây là sự nhầm lẫn, vui lòng liên hệ với ban quản trị hoặc bộ phận hỗ trợ kỹ thuật để được hỗ trợ mở khóa.</span>
          ) : (
            <span>Màn hình này sẽ tự động chuyển sang trang quản trị của bạn ngay khi tài khoản được kích hoạt thành công (không cần tải lại trang).</span>
          )}
        </div>

        {/* Action Controls */}
        <div className="pt-2 border-t border-slate-800/80 flex justify-center">
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-6 py-3 bg-slate-800/40 hover:bg-rose-500/10 text-slate-300 hover:text-rose-400 border border-slate-800 hover:border-rose-500/20 rounded-xl text-xs font-bold transition-all duration-300 active:scale-95"
          >
            <LogOut className="w-4 h-4" /> Đăng xuất tài khoản
          </button>
        </div>
      </div>
    </div>
  );
}

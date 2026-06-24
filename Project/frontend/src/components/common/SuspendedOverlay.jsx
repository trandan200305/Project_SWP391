import React from "react";

export default function SuspendedOverlay({ reason, onGoHome }) {
  return (
    <div className="fixed inset-0 z-[99999] bg-slate-900/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 md:p-10 max-w-[420px] w-full text-center shadow-[0_25px_60px_rgba(0,0,0,0.4)] border border-red-100 animate-[suspendFadeIn_0.3s_ease]">
        {/* Warning Icon */}
        <div className="w-[72px] h-[72px] bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5 shadow-[0_8px_20px_rgba(239,68,68,0.15)]">
          <svg width="36" height="36" fill="none" viewBox="0 0 24 24">
            <path
              stroke="#ef4444"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            />
          </svg>
        </div>

        {/* Title */}
        <h2 className="text-[22px] font-extrabold text-slate-900 mb-2">
          Tài khoản bị tạm ngưng
        </h2>

        {/* Description */}
        <p className="text-sm text-slate-500 leading-relaxed mb-3">
          Phiên đăng nhập của bạn đã bị dừng bởi Quản trị viên hệ thống.
        </p>

        {/* Reason */}
        {reason && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6 text-[13px] text-red-700 font-semibold text-center">
            Lý do: {reason}
          </div>
        )}

        {/* Home Button */}
        <button
          onClick={onGoHome}
          className="w-full bg-gradient-to-r from-blue-800 to-blue-500 hover:from-blue-700 hover:to-blue-400 text-white rounded-xl py-3.5 font-bold text-[15px] shadow-[0_4px_14px_rgba(59,130,246,0.35)] transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          Quay về Trang chủ
        </button>

        {/* Support Note */}
        <p className="text-xs text-slate-400 mt-4">
          Liên hệ quản trị viên để được hỗ trợ khôi phục tài khoản.
        </p>
      </div>

      <style>{`
        @keyframes suspendFadeIn {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

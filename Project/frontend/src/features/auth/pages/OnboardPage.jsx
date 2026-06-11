import React, { useState, useEffect } from 'react';
import { Mail, User, Key, CheckCircle, AlertTriangle } from 'lucide-react';
import { authApi } from '../api/authApi.js';

export default function Onboard({ onBackToHome, onOpenLogin }) {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [inviteInfo, setInviteInfo] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Form fields
  const [fullName, setFullName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenVal = params.get('token');
    if (!tokenVal) {
      setErrorMsg('Thiếu mã xác minh lời mời (Token)!');
      setLoading(false);
      return;
    }
    setToken(tokenVal);

    // Call API to verify token
    authApi.verifyInvitation(tokenVal)
      .then(data => {
        setLoading(false);
        if (data.success) {
          setInviteInfo(data);
        } else {
          setErrorMsg(data.message || 'Mã xác minh không hợp lệ hoặc đã hết hạn.');
        }
      })
      .catch(err => {
        setLoading(false);
        setErrorMsg('Không thể kết nối tới máy chủ để xác thực lời mời.');
      });
  }, []);

  // Verification code resend countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendCode = () => {
    if (sendingCode || countdown > 0) return;
    setSendingCode(true);
    authApi.sendInvitationCode(token)
      .then(data => {
        setSendingCode(false);
        if (data.success) {
          alert('Mã xác nhận đã được gửi về email của bạn!');
          setCountdown(60); // 60 seconds cooldown
        } else {
          alert(data.message || 'Lỗi khi gửi mã xác nhận.');
        }
      })
      .catch(err => {
        setSendingCode(false);
        alert('Không thể kết nối máy chủ để gửi mã xác nhận.');
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      alert('Vui lòng nhập Họ tên!');
      return;
    }
    if (!verificationCode.trim()) {
      alert('Vui lòng nhập Mã xác nhận đã gửi về email!');
      return;
    }

    setSubmitting(true);
    authApi.acceptInvitation({
      token,
      fullName,
      displayName,
      verificationCode
    })
      .then(data => {
        setSubmitting(false);
        if (data.success) {
          setSuccess(true);
          // Clear query params
          window.history.replaceState({}, document.title, "/");
        } else {
          alert(data.message || 'Đã xảy ra lỗi khi hoàn tất thiết lập tài khoản.');
        }
      })
      .catch(err => {
        setSubmitting(false);
        alert('Lỗi kết nối máy chủ.');
      });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-650 font-medium">Đang xác thực thông tin lời mời...</p>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg shadow-rose-500/10">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Xác thực không thành công</h2>
          <p className="text-slate-600 mb-6 font-medium leading-relaxed">{errorMsg}</p>
          <button
            onClick={onBackToHome}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all duration-300 active:scale-95 shadow-md shadow-blue-600/10 hover:shadow-blue-600/30"
          >
            Quay lại Trang chủ
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/10">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Thiết lập thành công!</h2>
          <p className="text-slate-600 mb-6 font-medium leading-relaxed">
            Tài khoản của bạn đã được kích hoạt thành công. Bây giờ bạn có thể đăng nhập vào hệ thống.
          </p>
          <div className="space-y-3">
            <button
              onClick={onOpenLogin}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all duration-300 active:scale-95 shadow-md shadow-blue-600/10 hover:shadow-blue-600/30"
            >
              Đăng nhập ngay
            </button>
            <button
              onClick={onBackToHome}
              className="w-full bg-slate-50 hover:bg-slate-100 text-slate-650 font-bold py-3 rounded-xl transition-all duration-300 active:scale-95"
            >
              Quay về trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-350">
        <div className="p-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-center">
          <h2 className="text-2xl font-black mb-1">Chào mừng thành viên mới!</h2>
          <p className="text-blue-100 font-medium text-sm">
            Bạn đã được mời tham gia quản trị hệ thống với vai trò <span className="underline font-bold">{inviteInfo?.role}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {/* Email (Readonly) */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5">Email tài khoản</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                disabled
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 font-semibold text-body-sm cursor-not-allowed"
                value={inviteInfo?.email || ''}
              />
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5">Họ và tên <span className="text-rose-500">*</span></label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                required
                placeholder="Ví dụ: Nguyễn Văn A"
                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-body-sm"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
              />
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5">Tên hiển thị (DisplayName)</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Ví dụ: A Nguyen (Mặc định lấy từ Họ tên)"
                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-body-sm"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
              />
            </div>
          </div>

          {/* Verification Code */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5">
              Mã xác nhận email <span className="text-rose-500">*</span>
            </label>
            <p className="text-xs text-slate-400 mb-2">
              Nhấn <strong>"Gửi mã"</strong> để nhận mã 6 chữ số qua email được mời. Đăng nhập sau này bằng Gmail không cần mật khẩu.
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Nhập mã 6 chữ số"
                  className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-body-sm tracking-widest"
                  value={verificationCode}
                  onChange={e => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                />
              </div>
              <button
                type="button"
                onClick={handleSendCode}
                disabled={sendingCode || countdown > 0}
                className="shrink-0 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-200 active:scale-95
                  disabled:cursor-not-allowed
                  bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white disabled:text-slate-400
                  shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/30 disabled:shadow-none"
              >
                {sendingCode ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : countdown > 0 ? (
                  `${countdown}s`
                ) : (
                  'Gửi mã'
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all duration-300 active:scale-95 disabled:bg-blue-300 disabled:cursor-not-allowed shadow-md shadow-blue-600/10 hover:shadow-blue-600/30 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang thiết lập...</span>
                </>
              ) : (
                <span>Hoàn tất thiết lập tài khoản</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

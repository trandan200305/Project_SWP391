import React, { useState, useEffect } from 'react';
import { Mail, User, Key, CheckCircle, AlertTriangle, Lock, ArrowRight } from 'lucide-react';
import { authApi } from '../api/authApi.js';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export default function Onboard({ onBackToHome, onOpenLogin }) {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [inviteInfo, setInviteInfo] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [revoked, setRevoked] = useState(false);
  const [revokedMsg, setRevokedMsg] = useState('');

  const [fullName, setFullName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [otp, setOtp] = useState(Array(6).fill(''));
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

  useEffect(() => {
    if (!token) return;

    const topic = `/topic/invitation-status/${token}`;
    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/api/ws'),
      reconnectDelay: 5000,
    });

    client.onConnect = () => {
      client.subscribe(topic, (message) => {
        try {
          const event = JSON.parse(message.body);
          if (event.status === 'REVOKED') {
            setRevoked(true);
            setRevokedMsg(event.message || 'Thao tác thiết lập tài khoản đã bị hủy bỏ bởi Quản trị viên.');
          }
        } catch (_) {}
      });
    };

    client.onStompError = (frame) => {
      console.warn('[STOMP] error:', frame);
    };

    client.activate();

    return () => {
      try { client.deactivate(); } catch (_) {}
    };
  }, [token]);

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

  const handleOtpChange = (e, index) => {
    const val = e.target.value;
    const digitsOnly = val.replace(/\D/g, '');
    const lastDigit = digitsOnly.substring(digitsOnly.length - 1);
    
    e.target.value = lastDigit;
    
    const newOtp = [...otp];
    newOtp[index] = lastDigit;
    setOtp(newOtp);

    // Auto focus next input
    if (lastDigit !== '' && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        const prevInput = document.getElementById(`otp-${index - 1}`);
        if (prevInput) {
          prevInput.focus();
          const newOtp = [...otp];
          newOtp[index - 1] = '';
          setOtp(newOtp);
        }
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      alert('Vui lòng nhập Họ tên!');
      return;
    }
    const verificationCode = otp.join('');
    if (verificationCode.length !== 6) {
      alert('Vui lòng nhập đủ mã xác nhận gồm 6 chữ số!');
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

  if (revoked) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-4 font-mono">
        <div className="bg-white border-4 border-slate-900 p-8 max-w-md w-full shadow-[8px_8px_0px_0px_#1c1917] text-center">
          <div className="w-16 h-16 border-2 border-slate-900 bg-rose-100 text-rose-800 rounded-none flex items-center justify-center mx-auto mb-6 shadow-[3px_3px_0px_0px_#1c1917]">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-wider">Thao tác bị hủy bỏ</h2>
          <p className="text-slate-700 mb-6 font-semibold text-sm leading-relaxed">
            {revokedMsg || 'Yêu cầu thiết lập tài khoản này đã bị thu hồi hoặc tài khoản đã bị vô hiệu hóa bởi Quản trị viên.'}
          </p>
          <button
            onClick={() => {
              window.history.replaceState({}, document.title, "/");
              onBackToHome();
            }}
            className="w-full py-3 border-2 border-slate-900 bg-amber-450 hover:bg-amber-300 text-slate-900 font-extrabold text-xs tracking-widest uppercase shadow-[4px_4px_0px_0px_#1c1917] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all cursor-pointer"
          >
            Quay lại Trang chủ
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-4 font-mono">
        <div className="text-center flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-800 font-bold text-sm tracking-wider uppercase">Đang xác thực thông tin lời mời...</p>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-4 font-mono">
        <div className="bg-white border-4 border-slate-900 p-8 max-w-md w-full shadow-[8px_8px_0px_0px_#1c1917] text-center">
          <div className="w-16 h-16 border-2 border-slate-900 bg-rose-100 text-rose-800 rounded-none flex items-center justify-center mx-auto mb-6 shadow-[3px_3px_0px_0px_#1c1917]">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-wider">Xác thực không thành công</h2>
          <p className="text-slate-700 mb-6 font-semibold text-sm leading-relaxed">{errorMsg}</p>
          <button
            onClick={onBackToHome}
            className="w-full py-3 border-2 border-slate-900 bg-amber-450 hover:bg-amber-300 text-slate-900 font-extrabold text-xs tracking-widest uppercase shadow-[4px_4px_0px_0px_#1c1917] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all cursor-pointer"
          >
            Quay lại Trang chủ
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-4 font-mono">
        <div className="bg-white border-4 border-slate-900 p-8 max-w-md w-full shadow-[8px_8px_0px_0px_#1c1917] text-center">
          <div className="w-16 h-16 border-2 border-slate-900 bg-emerald-105 text-emerald-800 rounded-none flex items-center justify-center mx-auto mb-6 shadow-[3px_3px_0px_0px_#1c1917] animate-bounce">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-wider">Thiết lập thành công!</h2>
          <p className="text-slate-700 mb-6 font-semibold text-sm leading-relaxed">
            Tài khoản của bạn đã được kích hoạt thành công. Bây giờ bạn có thể đăng nhập vào hệ thống.
          </p>
          <div className="space-y-3">
            <button
              onClick={onOpenLogin}
              className="w-full py-3 border-2 border-slate-900 bg-amber-450 hover:bg-amber-300 text-slate-900 font-extrabold text-xs tracking-widest uppercase shadow-[4px_4px_0px_0px_#1c1917] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all cursor-pointer"
            >
              Đăng nhập ngay
            </button>
            <button
              onClick={onBackToHome}
              className="w-full py-3 border-2 border-slate-900 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs tracking-widest uppercase shadow-[4px_4px_0px_0px_#1c1917] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all cursor-pointer"
            >
              Quay về trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-4 md:p-8 font-mono">
      {/* Main Container Card (Retro Brutalist style) */}
      <main className="w-full max-w-4xl mx-auto my-auto z-10 py-6">
        <div className="bg-white border-4 border-slate-900 rounded-none shadow-[10px_10px_0px_0px_#1c1917] grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          
          {/* Left Column */}
          <div className="md:col-span-5 p-8 md:p-10 flex flex-col justify-between border-b-2 md:border-b-0 md:border-r-2 border-slate-900 bg-[#fefcf8]">
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 border-2 border-slate-900 bg-[#ffedd5] text-slate-900 text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_#1c1917]">
                <span className="w-2.5 h-2.5 rounded-none bg-orange-600 border border-slate-900"></span>
                {inviteInfo?.role === 'MANAGER' ? 'Manager Portal' : 'Staff Portal'}
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight mt-10 mb-6 font-serif">
                Chào mừng<br />thành viên mới!
              </h1>

              {/* Subtitle */}
              <p className="text-slate-650 text-xs leading-relaxed max-w-xs mb-10 font-sans font-semibold">
                Hệ thống LancerPro yêu cầu danh tính số hóa để cấp quyền truy cập. Khởi tạo LancerPro ID của bạn.
              </p>
            </div>

            {/* Lock Footer */}
            <div className="flex items-center gap-4 mt-auto border-t-2 border-dashed border-slate-200 pt-6">
              <div className="w-10 h-10 border-2 border-slate-900 flex items-center justify-center bg-amber-100 shadow-[2px_2px_0px_0px_#1c1917]">
                <Lock className="w-4 h-4 text-slate-900" />
              </div>
              <div>
                <p className="text-[10px] font-black tracking-widest text-slate-900 uppercase">GENESIS PROTOCOL</p>
                <p className="text-[9px] text-slate-500 font-bold uppercase">E2E Encrypted Connection</p>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="md:col-span-7 p-8 md:p-10 flex flex-col justify-center bg-white">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Email (Readonly) */}
              <div>
                <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest block mb-2">
                  Địa chỉ Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    disabled
                    value={inviteInfo?.email || ''}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-100 border-2 border-slate-900 text-xs text-slate-500 cursor-not-allowed font-bold"
                  />
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest block mb-2">
                  Họ và Tên
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-900" />
                  <input
                    type="text"
                    required
                    placeholder="Nhập họ và tên của bạn"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-white border-2 border-slate-900 focus:bg-amber-50/20 focus:outline-none text-xs text-slate-900 font-bold placeholder-slate-400 shadow-[3px_3px_0px_0px_#1c1917] focus:shadow-none transition-all"
                  />
                </div>
              </div>

              {/* Display Name */}
              <div>
                <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest block mb-2">
                  Tên hiển thị (@alias)
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-900" />
                  <input
                    type="text"
                    placeholder="Ví dụ: A Nguyen"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-white border-2 border-slate-900 focus:bg-amber-50/20 focus:outline-none text-xs text-slate-900 font-bold placeholder-slate-400 shadow-[3px_3px_0px_0px_#1c1917] focus:shadow-none transition-all"
                  />
                </div>
              </div>

              {/* OTP Code */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                    Mã xác thực OTP
                  </label>
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={sendingCode || countdown > 0}
                    className="text-[10px] font-black text-blue-800 hover:text-blue-900 uppercase tracking-widest disabled:text-slate-400 transition-colors cursor-pointer underline decoration-2"
                  >
                    {sendingCode ? (
                      'Đang gửi...'
                    ) : countdown > 0 ? (
                      `Gửi lại (${countdown}s)`
                    ) : (
                      'Gửi mã'
                    )}
                  </button>
                </div>

                {/* 6 Digit Input Boxes */}
                <div className="flex gap-2.5 md:gap-3">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      value={digit}
                      onChange={e => handleOtpChange(e, index)}
                      onKeyDown={e => handleOtpKeyDown(e, index)}
                      className="w-12 h-14 bg-white text-slate-900 border-2 border-slate-900 focus:bg-amber-50/20 focus:outline-none text-center text-xl font-black shadow-[3px_3px_0px_0px_#1c1917] focus:shadow-none transition-all"
                    />
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 border-2 border-slate-900 bg-amber-400 hover:bg-amber-300 text-slate-900 font-black text-xs tracking-widest uppercase shadow-[4px_4px_0px_0px_#1c1917] hover:shadow-[2px_2px_0px_0px_#1c1917] active:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                      <span>ĐANG THIẾT LẬP...</span>
                    </>
                  ) : (
                    <>
                      <span>HOÀN TẤT THIẾT LẬP</span>
                      <ArrowRight className="w-4 h-4 text-slate-900" />
                    </>
                  )}
                </button>
                
                <p className="text-[9px] text-center text-slate-500 uppercase tracking-widest font-black mt-4">
                  By continuing, you agree to LancerPro terms
                </p>
              </div>

            </form>
          </div>

        </div>
      </main>
    </div>
  );
}

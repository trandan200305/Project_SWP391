import React, { useState, useEffect } from 'react';
import { Star, Eye, EyeOff, Chrome, X } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
import { authApi } from '../api/authApi.js';

export default function Login({ onClose, onSwitchToRegister, onLoginSuccess }) {
  // State đăng nhập thông thường
  const [role, setRole] = useState('freelancer'); 
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [accountLocked, setAccountLocked] = useState(null);

  // State xử lý quên mật khẩu và OTP
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [successMsg, setSuccessMsg] = useState('');
  const [timer, setTimer] = useState(0);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Đếm ngược thời gian gửi lại mã OTP
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Xử lý gọi API đăng nhập hệ thống
  const processBackendLogin = async (payload) => {
    setLoading(true);
    setErrorMsg('');
    setAccountLocked(null);
    try {
      const data = await authApi.login(payload);
      if (data.success) {
        setLoading(false);
        setSuccess(true);
        setTimeout(() => {
          if (onLoginSuccess) onLoginSuccess(data.user);
        }, 1200);
      } else if (data.accountStatus === 'LOCKED' || data.accountStatus === 'BANNED') {
        setLoading(false);
        setAccountLocked({ status: data.accountStatus, message: data.message });
      } else {
        setLoading(false);
        setErrorMsg(data.message || 'Đăng nhập thất bại.');
      }
    } catch (error) {
      setLoading(false);
      setErrorMsg(error.message || 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
    }
  };

  // Đăng nhập bằng Email và Mật khẩu
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) return;
    processBackendLogin({
      email,
      password,
      name: email.split('@')[0],
      requestedRole: role.toUpperCase(),
      avatar: `https://ui-avatars.com/api/?name=${email.split('@')[0]}&background=random`
    });
  };

  // Đăng nhập bằng tài khoản Google
  const handleGoogleSuccess = (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
    processBackendLogin({
      email: decoded.email,
      name: decoded.name,
      googleId: decoded.sub,
      avatar: decoded.picture,
      requestedRole: role.toUpperCase()
    });
  };

  // Gửi mã OTP xác nhận về Email
  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const data = await authApi.forgotPassword(forgotEmail);
      if (data.success) {
        setCodeSent(true);
        setSuccessMsg('Mã xác nhận đã được gửi về email của bạn!');
        setTimer(60);
        setOtp(['', '', '', '', '', '']);
      } else {
        setErrorMsg(data.message || 'Không thể gửi mã. Vui lòng thử lại.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Lỗi kết nối đến máy chủ!');
    } finally {
      setLoading(false);
    }
  };

  // Xác thực mã OTP
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) return;
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const data = await authApi.verifyCode({ email: forgotEmail, code });
      if (data.success) {
        setSuccessMsg('✅ Xác nhận mã OTP thành công! Vui lòng đặt mật khẩu mới.');
        setIsResettingPassword(true);
        setCodeSent(false);
        setOtp(['', '', '', '', '', '']);
      } else {
        setErrorMsg(data.message || 'Mã không chính xác!');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Lỗi kết nối đến máy chủ!');
    } finally {
      setLoading(false);
    }
  };

  // Đặt lại mật khẩu mới
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp!');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('Mật khẩu phải có ít nhất 6 ký tự!');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const data = await authApi.resetPassword({ email: forgotEmail, newPassword });
      if (data.success) {
        setSuccessMsg('✅ Đổi mật khẩu thành công! Bạn có thể đăng nhập ngay.');
        setTimeout(() => {
          setIsForgotPassword(false);
          setIsResettingPassword(false);
          setSuccessMsg('');
          setForgotEmail('');
          setNewPassword('');
          setConfirmPassword('');
        }, 3000);
      } else {
        setErrorMsg(data.message || 'Có lỗi xảy ra!');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Lỗi kết nối đến máy chủ!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-primary/50 backdrop-blur-md transition-all duration-300 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-3xl shadow-2xl flex flex-row overflow-hidden w-full max-w-4xl h-[560px] animate-scale-up border border-slate-100"
      >
        {}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-[100] p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/60 text-slate-400 hover:text-slate-700 transition-all shadow-sm"
          title="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {}
        <div className="hidden md:flex w-[48%] bg-gradient-to-br from-[#0B1528] via-[#0F172A] to-[#1E293B] p-8 flex-col justify-between relative overflow-hidden h-full">
          <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-secondary/15 rounded-full filter blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-accent/10 rounded-full filter blur-[80px]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:2.5rem_2.5rem]" />
          <div className="relative z-10">
            <span className="font-display text-2xl font-extrabold tracking-tight text-white block">
              Lancer<span className="text-secondary">Pro</span>
            </span>
          </div>
          <div className="relative z-10 my-4 max-w-sm">
            <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-[1.2]">
              Connect with the world's most elite freelance talent.
            </h1>
          </div>
          <div className="relative z-10 bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md shadow-lg">
            <div className="flex gap-0.5 mb-2.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 text-secondary fill-secondary" />
              ))}
            </div>
            <p className="text-white/95 text-[13px] italic leading-relaxed mb-4 font-medium">
              "LancerPro has completely transformed how we scale our engineering teams. The caliber of talent is unmatched."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/15 border border-white/20 rounded-full flex items-center justify-center font-extrabold text-white text-[12px] shadow-sm">
                JD
              </div>
              <div>
                <h4 className="font-bold text-white text-[12px]">James Dalton</h4>
                <p className="text-[10px] text-white/50 font-medium">CTO at TechFlow</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="w-full md:w-[52%] p-8 flex flex-col justify-between bg-white relative overflow-y-auto h-full">
          <div className="max-w-[320px] w-full mx-auto my-auto pr-1">

            {/* ===================== FORGOT PASSWORD FLOW ===================== */}
            {isForgotPassword ? (
              <>
                <h2 className="font-display text-xl font-extrabold text-primary mb-0.5">
                  {isResettingPassword
                    ? 'Đặt lại mật khẩu mới'
                    : codeSent
                      ? 'Nhập mã xác nhận'
                      : 'Quên mật khẩu'}
                </h2>
                <p className="font-sans text-muted text-[13px] mb-4">
                  {isResettingPassword
                    ? 'Vui lòng nhập mật khẩu mới cho tài khoản của bạn.'
                    : codeSent
                      ? `Mã 6 chữ số đã được gửi về ${forgotEmail}.`
                      : 'Nhập email đã đăng ký để nhận mã xác nhận.'}
                </p>

                {/* Error / Success messages */}
                {errorMsg && (
                  <div className="mb-3 p-2 bg-rose-50 border border-rose-200 text-rose-600 rounded-lg text-[11px] font-semibold text-center">
                    {errorMsg}
                  </div>
                )}
                {successMsg && (
                  <div className="mb-3 p-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-[11px] font-semibold text-center">
                    {successMsg}
                  </div>
                )}

                {isResettingPassword ? (
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold text-primary mb-1">
                        Mật khẩu mới
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full bg-[#F8FAFC] border border-muted-light/60 focus:border-secondary focus:ring-1 focus:ring-secondary rounded-lg px-3 py-2 text-[13px] focus:outline-none transition-all placeholder-muted text-primary font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-primary mb-1">
                        Xác nhận mật khẩu mới
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full bg-[#F8FAFC] border border-muted-light/60 focus:border-secondary focus:ring-1 focus:ring-secondary rounded-lg px-3 py-2 text-[13px] focus:outline-none transition-all placeholder-muted text-primary font-medium"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 rounded-lg font-bold text-[13px] bg-primary hover:bg-primary-light text-white shadow-md shadow-primary/10 hover:scale-[1.01] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        'Đổi mật khẩu'
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={codeSent ? handleVerifyCode : handleSendCode} className="space-y-4">
                    {/* Email input */}
                    <div>
                      <label className="block text-[11px] font-bold text-primary mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="name@company.com"
                        required
                        disabled={codeSent}
                        className="w-full bg-[#F8FAFC] border border-muted-light/60 focus:border-secondary focus:ring-1 focus:ring-secondary rounded-lg px-3 py-2 text-[13px] focus:outline-none transition-all placeholder-muted text-primary font-medium disabled:opacity-60"
                      />
                    </div>

                    {/* OTP input boxes (hiện ra khi đã gửi mã) */}
                    {codeSent && (
                      <div>
                        <label className="block text-[11px] font-bold text-primary mb-2">
                          Mã xác nhận (6 chữ số)
                        </label>
                        <div className="flex gap-2 justify-between">
                          {otp.map((digit, index) => (
                            <input
                              key={index}
                              id={`otp-${index}`}
                              type="text"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/, '');
                                const newOtp = [...otp];
                                newOtp[index] = val;
                                setOtp(newOtp);
                                if (val && index < 5) {
                                  document.getElementById(`otp-${index + 1}`).focus();
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
                                  const newOtp = [...otp];
                                  newOtp[index - 1] = '';
                                  setOtp(newOtp);
                                  document.getElementById(`otp-${index - 1}`).focus();
                                }
                              }}
                              className="w-11 h-11 text-center bg-[#F8FAFC] border border-muted-light/60 focus:border-secondary focus:ring-1 focus:ring-secondary rounded-lg text-[16px] font-bold focus:outline-none transition-all text-primary"
                            />
                          ))}
                        </div>

                        {/* Đếm ngược và gửi lại mã */}
                        <div className="mt-2 text-center text-[11px] font-semibold">
                          {timer > 0 ? (
                            <span className="text-muted">Gửi lại mã sau {timer}s</span>
                          ) : (
                            <span className="text-muted">
                              Bạn không nhận được mã?{' '}
                              <a
                                href="#resend"
                                onClick={async (e) => {
                                  e.preventDefault();
                                  setLoading(true);
                                  try {
                                    const data = await authApi.forgotPassword(forgotEmail);
                                    if (data.success) {
                                      setSuccessMsg('Mã mới đã được gửi!');
                                      setTimer(60);
                                      setOtp(['', '', '', '', '', '']);
                                      setErrorMsg('');
                                    } else {
                                      setErrorMsg(data.message);
                                    }
                                  } catch (err) {
                                    setErrorMsg(err.message || 'Lỗi kết nối máy chủ');
                                  } finally {
                                    setLoading(false);
                                  }
                                }}
                                className="text-secondary hover:underline"
                              >
                                Gửi lại mã
                              </a>
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 rounded-lg font-bold text-[13px] bg-primary hover:bg-primary-light text-white shadow-md shadow-primary/10 hover:scale-[1.01] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : !codeSent ? (
                        'Gửi mã xác nhận'
                      ) : (
                        'Xác nhận mã OTP'
                      )}
                    </button>
                  </form>
                )}

                <div className="mt-4 text-center text-[12px] text-muted font-medium">
                  <a
                    href="#login"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsForgotPassword(false);
                      setIsResettingPassword(false);
                      setCodeSent(false);
                      setOtp(['', '', '', '', '', '']);
                      setErrorMsg('');
                      setSuccessMsg('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setForgotEmail('');
                    }}
                    className="text-secondary font-bold hover:underline"
                  >
                    ← Quay lại đăng nhập
                  </a>
                </div>
              </>
            ) : (
              
              <>
                <h2 className="font-display text-xl font-extrabold text-primary mb-0.5">Welcome back</h2>
                <p className="font-sans text-muted text-[13px] mb-4">
                  Log in to manage your professional ecosystem.
                </p>

                {}
                {accountLocked && (
                  <div className={`mb-4 p-4 rounded-2xl border-2 text-left space-y-2 animate-fade-in ${
                    accountLocked.status === 'BANNED'
                      ? 'bg-rose-50 border-rose-300'
                      : 'bg-amber-50 border-amber-300'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {accountLocked.status === 'BANNED' ? '🚫' : '⚠️'}
                      </span>
                      <h3 className={`font-bold text-[13px] ${
                        accountLocked.status === 'BANNED' ? 'text-rose-800' : 'text-amber-800'
                      }`}>
                        {accountLocked.status === 'BANNED'
                          ? 'Tài khoản đã bị cấm vĩnh viễn'
                          : 'Tài khoản đang bị tạm khóa'}
                      </h3>
                    </div>
                    <p className={`text-[11px] leading-relaxed ${
                      accountLocked.status === 'BANNED' ? 'text-rose-700' : 'text-amber-700'
                    }`}>
                      {accountLocked.message}
                    </p>
                    <div className={`text-[10px] font-bold pt-1 border-t ${
                      accountLocked.status === 'BANNED'
                        ? 'border-rose-200 text-rose-500'
                        : 'border-amber-200 text-amber-500'
                    }`}>
                      Mã trạng thái: {accountLocked.status} • Liên hệ: support@vlance.vn
                    </div>
                  </div>
                )}

                {}
                {errorMsg && !accountLocked && (
                  <div className="mb-3 p-2 bg-rose-50 border border-rose-200 text-rose-600 rounded-lg text-[11px] font-semibold text-center animate-fade-in">
                    {errorMsg}
                  </div>
                )}

                {}
                <div className="bg-[#F1F5F9] p-1 rounded-xl flex gap-1 mb-3.5">
                  <button
                    type="button"
                    onClick={() => setRole('freelancer')}
                    className={`flex-1 py-1.5 text-center rounded-lg font-bold text-[12px] transition-all ${
                      role === 'freelancer' ? 'bg-white text-primary shadow-sm' : 'text-muted hover:text-primary'
                    }`}
                  >
                    Freelancer
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('employer')}
                    className={`flex-1 py-1.5 text-center rounded-lg font-bold text-[12px] transition-all ${
                      role === 'employer' ? 'bg-white text-primary shadow-sm' : 'text-muted hover:text-primary'
                    }`}
                  >
                    Employer
                  </button>
                </div>

                {}
                <div className="mb-3.5 flex justify-center w-full">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setErrorMsg('Đăng nhập Google thất bại')}
                    useOneTap
                    theme="outline"
                    size="large"
                    shape="rectangular"
                    width="320"
                    text="continue_with"
                  />
                </div>

                {}
                <div className="relative flex items-center justify-center mb-3.5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-muted-light/60"></div>
                  </div>
                  <span className="relative z-10 bg-white px-3 text-[9px] font-extrabold uppercase text-muted tracking-wider">
                    OR CONTINUE WITH EMAIL
                  </span>
                </div>

                {}
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-primary mb-1">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      required
                      className="w-full bg-[#F8FAFC] border border-muted-light/60 focus:border-secondary focus:ring-1 focus:ring-secondary rounded-lg px-3 py-2 text-[13px] focus:outline-none transition-all placeholder-muted text-primary font-medium"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-bold text-primary">Password</label>
                      {}
                      <a
                        href="#forgot"
                        onClick={(e) => {
                          e.preventDefault();
                          setIsForgotPassword(true);
                          setErrorMsg('');
                          setSuccessMsg('');
                          setCodeSent(false);
                          setOtp(['', '', '', '', '', '']);
                          setForgotEmail(email); 
                        }}
                        className="text-secondary font-bold text-[11px] hover:underline"
                      >
                        Forgot password?
                      </a>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full bg-[#F8FAFC] border border-muted-light/60 focus:border-secondary focus:ring-1 focus:ring-secondary rounded-lg pl-3 pr-10 py-2 text-[13px] focus:outline-none transition-all placeholder-muted text-primary font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                      </button>
                    </div>
                  </div>



                  <button
                    type="submit"
                    disabled={loading || success}
                    className={`w-full py-2.5 rounded-lg font-bold text-[13px] transition-all duration-200 flex items-center justify-center gap-2 ${
                      success
                        ? 'bg-emerald-600 text-white shadow-lg animate-pulse'
                        : 'bg-primary hover:bg-primary-light text-white shadow-md shadow-primary/10 hover:scale-[1.01]'
                    }`}
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : success ? (
                      'Đăng nhập thành công!'
                    ) : (
                      'Sign In to LancerPro'
                    )}
                  </button>
                </form>

                {}
                <div className="mt-3.5 text-center text-[12px] text-muted font-medium">
                  Don't have an account?{' '}
                  <a
                    href="#register"
                    onClick={(e) => {
                      e.preventDefault();
                      if (onSwitchToRegister) onSwitchToRegister();
                    }}
                    className="text-secondary font-bold hover:underline"
                  >
                    Create a free profile
                  </a>
                </div>
              </>
            )}
          </div>

          {}
          <div className="max-w-[320px] w-full mx-auto pt-3 border-t border-muted-light/40 flex flex-row justify-between items-center text-muted text-[9px] font-semibold mt-4">
            <span>© 2026 LancerPro.</span>
            <div className="flex gap-2">
              <a href="#privacy" className="hover:text-primary transition-colors">Privacy</a>
              <a href="#terms" className="hover:text-primary transition-colors">Terms</a>
              <a href="#help" className="hover:text-primary transition-colors">Help</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Star, Eye, EyeOff, Chrome, ArrowLeft, X } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";

export default function Login({ onClose, onSwitchToRegister, onLoginSuccess }) {
  const [role, setRole] = useState('freelancer'); // 'freelancer' or 'employer'
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const processBackendLogin = async (payload) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setLoading(false);
        setSuccess(true);
        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess(data.user);
          }
        }, 1200);
      } else {
        setLoading(false);
        setErrorMsg(data.message || 'Đăng nhập thất bại.');
      }
    } catch (error) {
      setLoading(false);
      setErrorMsg('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) return;

    processBackendLogin({
      email: email,
      name: email.split('@')[0], // Fallback name
      requestedRole: role.toUpperCase(),
      avatar: `https://ui-avatars.com/api/?name=${email.split('@')[0]}&background=random`
    });
  };

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

  return (
    <div 
      onClick={onClose} 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-primary/50 backdrop-blur-md transition-all duration-300 animate-fade-in"
    >
      {/* Centered Modal Card Container */}
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="relative bg-white rounded-3xl shadow-2xl flex flex-row overflow-hidden w-full max-w-4xl h-[560px] animate-scale-up border border-slate-100"
      >
        {/* Floating Close Button at top-right */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-[100] p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/60 text-slate-400 hover:text-slate-700 transition-all shadow-sm"
          title="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* LEFT PANEL: Branding & Glass Testimonial (Hidden on small screens) */}
        <div className="hidden md:flex w-[48%] bg-gradient-to-br from-[#0B1528] via-[#0F172A] to-[#1E293B] p-8 flex-col justify-between relative overflow-hidden h-full">
          {/* Ambient Glow Orbs */}
          <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-secondary/15 rounded-full filter blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-accent/10 rounded-full filter blur-[80px]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:2.5rem_2.5rem]" />

          {/* Logo */}
          <div className="relative z-10">
            <span className="font-display text-2xl font-extrabold tracking-tight text-white block">
              Lancer<span className="text-secondary">Pro</span>
            </span>
          </div>

          {/* Heading */}
          <div className="relative z-10 my-4 max-w-sm">
            <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-[1.2]">
              Connect with the world's most elite freelance talent.
            </h1>
          </div>

          {/* Glass Testimonial card */}
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

        {/* RIGHT PANEL: Sleek Compact Form */}
        <div className="w-full md:w-[52%] p-8 flex flex-col justify-between bg-white relative overflow-y-auto h-full">
          {/* Main content container */}
          <div className="max-w-[320px] w-full mx-auto my-auto pr-1">
            {/* Header Title */}
            <h2 className="font-display text-xl font-extrabold text-primary mb-0.5">
              {!isForgotPassword ? "Welcome back" : "Reset Password"}
            </h2>
            <p className="font-sans text-muted text-[13px] mb-4">
              {!isForgotPassword 
                ? "Log in to manage your professional ecosystem."
                : "Enter your email to receive a password reset link."}
            </p>

            {/* Error Message Display */}
            {errorMsg && (
              <div className="mb-3 p-2 bg-rose-50 border border-rose-200 text-rose-600 rounded-lg text-[11px] font-semibold text-center animate-fade-in">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="mb-3 p-2 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-lg text-[11px] font-semibold text-center animate-fade-in">
                {successMsg}
              </div>
            )}

            {!isForgotPassword ? (
              <>
                {/* Role Switcher Tabs */}
                <div className="bg-[#F1F5F9] p-1 rounded-xl flex gap-1 mb-3.5">
                  <button
                    type="button"
                    onClick={() => setRole('freelancer')}
                    className={`flex-1 py-1.5 text-center rounded-lg font-bold text-[12px] transition-all ${
                      role === 'freelancer'
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-muted hover:text-primary'
                    }`}
                  >
                    Freelancer
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('employer')}
                    className={`flex-1 py-1.5 text-center rounded-lg font-bold text-[12px] transition-all ${
                      role === 'employer'
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-muted hover:text-primary'
                    }`}
                  >
                    Employer
                  </button>
                </div>

                {/* Social Google Sign-In */}
                <div className="mb-3.5 flex justify-center w-full">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => {
                      setErrorMsg('Đăng nhập Google thất bại');
                    }}
                    useOneTap
                    theme="outline"
                    size="large"
                    shape="rectangular"
                    width="320"
                    text="continue_with"
                  />
                </div>

                {/* Divider */}
                <div className="relative flex items-center justify-center mb-3.5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-muted-light/60"></div>
                  </div>
                  <span className="relative z-10 bg-white px-3 text-[9px] font-extrabold uppercase text-muted tracking-wider">
                    OR CONTINUE WITH EMAIL
                  </span>
                </div>

                {/* Input Form */}
                <form onSubmit={handleSubmit} className="space-y-3">
                  {/* Email */}
                  <div>
                    <label className="block text-[11px] font-bold text-primary mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      required
                      className="w-full bg-[#F8FAFC] border border-muted-light/60 focus:border-secondary focus:ring-1 focus:ring-secondary rounded-lg px-3 py-2 text-[13px] focus:outline-none transition-all placeholder-muted text-primary font-medium"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-bold text-primary">
                        Password
                      </label>
                      <a 
                        href="#forgot" 
                        onClick={(e) => { e.preventDefault(); setIsForgotPassword(true); }}
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

                  {/* Remember */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="remember"
                      className="w-3.5 h-3.5 text-primary border-muted-light/60 focus:ring-0 rounded cursor-pointer"
                    />
                    <label htmlFor="remember" className="text-[11px] text-muted font-semibold cursor-pointer select-none">
                      Keep me logged in for 30 days
                    </label>
                  </div>

                  {/* Sign In CTA */}
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
                      `Sign In to LancerPro`
                    )}
                  </button>
                </form>

                {/* Link to Register */}
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
            ) : isChangingPassword ? (
              <>
                {/* Change Password Form */}
                <form 
                  onSubmit={async (e) => { 
                    e.preventDefault(); 
                    // MOCK: Giả lập đổi mật khẩu thành công
                    setSuccessMsg('Mật khẩu đã được cập nhật thành công! Vui lòng đăng nhập lại.');
                    setIsForgotPassword(false);
                    setIsChangingPassword(false);
                    setCodeSent(false);
                    setOtp(['', '', '', '', '', '']);
                  }} 
                  className="space-y-4"
                >
                  {/* New Password */}
                  <div>
                    <label className="block text-[11px] font-bold text-primary mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      required
                      className="w-full bg-[#F8FAFC] border border-muted-light/60 focus:border-secondary focus:ring-1 focus:ring-secondary rounded-lg px-3 py-2 text-[13px] focus:outline-none transition-all placeholder-muted text-primary font-medium"
                    />
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-[11px] font-bold text-primary mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      required
                      className="w-full bg-[#F8FAFC] border border-muted-light/60 focus:border-secondary focus:ring-1 focus:ring-secondary rounded-lg px-3 py-2 text-[13px] focus:outline-none transition-all placeholder-muted text-primary font-medium"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-lg font-bold text-[13px] bg-primary hover:bg-primary-light text-white shadow-md shadow-primary/10 hover:scale-[1.01] transition-all duration-200"
                  >
                    Update Password
                  </button>
                </form>

                {/* Back to Login */}
                <div className="mt-4 text-center text-[12px] text-muted font-medium">
                  <a 
                    href="#login" 
                    onClick={(e) => {
                      e.preventDefault();
                      setIsForgotPassword(false);
                      setIsChangingPassword(false);
                      setCodeSent(false);
                      setOtp(['', '', '', '', '', '']);
                      setSuccessMsg('');
                    }}
                    className="text-secondary font-bold hover:underline"
                  >
                    Back to Sign In
                  </a>
                </div>
              </>
            ) : (
              <>
                {/* Forgot Password Form */}
                <form 
                  onSubmit={async (e) => { 
                    e.preventDefault(); 
                    if (!codeSent) {
                      try {
                        const response = await fetch('http://localhost:8080/api/auth/forgot-password', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email })
                        });
                        const data = await response.json();
                        if (data.success) {
                          setCodeSent(true);
                          setErrorMsg('');
                          setSuccessMsg('Mã xác nhận đã được gửi về mail của bạn!');
                          setTimer(60);
                        } else {
                          setErrorMsg(data.message);
                          setSuccessMsg('');
                        }
                      } catch (error) {
                        setErrorMsg('Lỗi kết nối server');
                      }
                    } else {
                      try {
                        const response = await fetch('http://localhost:8080/api/auth/verify-code', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email, code: otp.join('') })
                        });
                        const data = await response.json();
                        if (data.success) {
                          setSuccessMsg('Xác nhận thành công! Vui lòng nhập mật khẩu mới.');
                          setIsChangingPassword(true);
                          setErrorMsg('');
                        } else {
                          setErrorMsg(data.message);
                        }
                      } catch (error) {
                        setErrorMsg('Lỗi kết nối server');
                      }
                    }
                  }} 
                  className="space-y-4"
                >
                  {/* Email */}
                  <div>
                    <label className="block text-[11px] font-bold text-primary mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      required
                      disabled={codeSent}
                      className="w-full bg-[#F8FAFC] border border-muted-light/60 focus:border-secondary focus:ring-1 focus:ring-secondary rounded-lg px-3 py-2 text-[13px] focus:outline-none transition-all placeholder-muted text-primary font-medium disabled:opacity-70"
                    />
                  </div>

                  {/* Verification Code Input */}
                  {/* Verification Code Input */}
                  {codeSent && (
                    <div>
                      <label className="block text-[11px] font-bold text-primary mb-1">
                        Verification Code
                      </label>
                      <div className="flex gap-2 justify-between">
                        {[...Array(6)].map((_, index) => (
                          <input
                            key={index}
                            id={`otp-${index}`}
                            type="text"
                            maxLength={1}
                            value={otp[index]}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (/^[0-9]$/.test(value) || value === '') {
                                const newOtp = [...otp];
                                newOtp[index] = value;
                                setOtp(newOtp);
                                
                                // Auto focus next
                                if (value !== '' && index < 5) {
                                  document.getElementById(`otp-${index + 1}`).focus();
                                }
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

                      {/* Timer or Resend */}
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
                                try {
                                  const response = await fetch('http://localhost:8080/api/auth/forgot-password', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ email })
                                  });
                                  const data = await response.json();
                                  if (data.success) {
                                    setSuccessMsg('Mã mới đã được gửi!');
                                    setTimer(60);
                                    setOtp(['', '', '', '', '', '']);
                                  } else {
                                    setErrorMsg(data.message);
                                    setSuccessMsg('');
                                  }
                                } catch (error) {
                                  setErrorMsg('Lỗi kết nối server');
                                  setSuccessMsg('');
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

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-lg font-bold text-[13px] bg-primary hover:bg-primary-light text-white shadow-md shadow-primary/10 hover:scale-[1.01] transition-all duration-200"
                  >
                    {!codeSent ? "Send Verification Code" : "Verify Code"}
                  </button>
                </form>

                {/* Back to Login */}
                <div className="mt-4 text-center text-[12px] text-muted font-medium">
                  <a 
                    href="#login" 
                    onClick={(e) => {
                      e.preventDefault();
                      setIsForgotPassword(false);
                      setCodeSent(false);
                      setOtp(['', '', '', '', '', '']);
                    }}
                    className="text-secondary font-bold hover:underline"
                  >
                    Back to Sign In
                  </a>
                </div>
              </>
            )}
          </div>

          {/* Footer copyright */}
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

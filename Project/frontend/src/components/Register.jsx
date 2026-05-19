import React, { useState } from 'react';
import { Chrome, Eye, EyeOff, Sparkles, CheckCircle, X } from 'lucide-react';

export default function Register({ onClose, onSwitchToLogin }) {
  const [role, setRole] = useState('freelancer'); // 'freelancer' or 'employer'
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName || !displayName || !phoneNumber || !email || !password || !agreeTerms) return;

    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:8080/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name: fullName,
          requestedRole: role.toUpperCase()
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setError('');
        setTimeout(() => {
          if (onSwitchToLogin) {
            onSwitchToLogin();
          }
        }, 1500);
      } else {
        setError(data.message || 'Đăng ký thất bại!');
      }
    } catch (err) {
      console.error('Error during registration:', err);
      setError('Lỗi kết nối đến server!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      onClick={onClose} 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-primary/50 backdrop-blur-md transition-all duration-300 animate-fade-in"
    >
      {/* Centered Modal Card Container */}
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="relative bg-white rounded-3xl shadow-2xl flex flex-row overflow-hidden w-full max-w-4xl h-[580px] animate-scale-up border border-slate-100"
      >
        {/* Floating Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-[100] p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/60 text-slate-400 hover:text-slate-700 transition-all shadow-sm"
          title="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* LEFT PANEL: Join Metrics & Core Benefits */}
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

          {/* Core Tagline */}
          <div className="relative z-10 my-2 max-w-sm">
            <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-[1.2]">
              Join the world's finest digital workforce.
            </h1>
            <p className="text-white/60 text-[12px] mt-2 font-medium">
              Start building your professional profile, connecting with top-tier partners, and securing projects.
            </p>
          </div>

          {/* Glass Benefits Card */}
          <div className="relative z-10 bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md shadow-lg space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-secondary shrink-0" />
              <div>
                <h4 className="font-bold text-white text-[12px]">Top International Projects</h4>
                <p className="text-[10px] text-white/50">Gain access to clients looking for skilled talent worldwide.</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-secondary shrink-0" />
              <div>
                <h4 className="font-bold text-white text-[12px]">Secure Escrow System</h4>
                <p className="text-[10px] text-white/50">Your funds are completely protected via smart milestone contracts.</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-full flex justify-between border-t border-white/10 pt-3 text-white">
                <div>
                  <span className="block text-[15px] font-extrabold text-secondary">1.5M+</span>
                  <span className="text-[9px] text-white/40 uppercase font-semibold">Freelancers</span>
                </div>
                <div>
                  <span className="block text-[15px] font-extrabold text-secondary">850k+</span>
                  <span className="text-[9px] text-white/40 uppercase font-semibold">Completed Projects</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Registration Form */}
        <div className="w-full md:w-[52%] p-6 flex flex-col justify-between bg-white relative overflow-y-auto no-scrollbar h-full">
          {/* Main Content Area */}
          <div className="max-w-[320px] w-full mx-auto my-auto pr-1">
            {/* Form Headers */}
            <h2 className="font-display text-xl font-extrabold text-primary mb-0.5">Create your free profile</h2>
            <p className="font-sans text-muted text-[13px] mb-2.5">
              Start your professional ecosystem today.
            </p>

            {error && (
              <div className="mb-2 p-2 bg-red-50 border border-red-200 text-red-600 text-[11px] rounded-lg font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-red-600 rounded-full flex-shrink-0"></span>
                {error}
              </div>
            )}

            {/* Role Switcher */}
            <div className="bg-[#F1F5F9] p-1 rounded-xl flex gap-1 mb-2">
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

            {/* Social Google Registration */}
            <div className="mb-2">
              <button 
                type="button"
                className="w-full flex items-center justify-center gap-2 border border-muted-light/60 hover:bg-muted-light/10 py-2 px-3 rounded-lg font-bold text-primary text-[12px] transition-colors"
              >
                <Chrome className="w-3.5 h-3.5 text-rose-500" /> Google
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center mb-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-muted-light/60"></div>
              </div>
              <span className="relative z-10 bg-white px-3 text-[9px] font-extrabold uppercase text-muted tracking-wider">
                OR REGISTER WITH EMAIL
              </span>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="space-y-2">
              {/* Full Name & Display Name (Dual Column) */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-primary mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full bg-[#F8FAFC] border border-muted-light/60 focus:border-secondary focus:ring-1 focus:ring-secondary rounded-lg px-2.5 py-1.5 text-[12px] focus:outline-none transition-all placeholder-muted text-primary font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-primary mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    className="w-full bg-[#F8FAFC] border border-muted-light/60 focus:border-secondary focus:ring-1 focus:ring-secondary rounded-lg px-2.5 py-1.5 text-[12px] focus:outline-none transition-all placeholder-muted text-primary font-medium"
                  />
                </div>
              </div>

              {/* Email & Phone Number (Dual Column) */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-primary mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-[#F8FAFC] border border-muted-light/60 focus:border-secondary focus:ring-1 focus:ring-secondary rounded-lg px-2.5 py-1.5 text-[12px] focus:outline-none transition-all placeholder-muted text-primary font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-primary mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    className="w-full bg-[#F8FAFC] border border-muted-light/60 focus:border-secondary focus:ring-1 focus:ring-secondary rounded-lg px-2.5 py-1.5 text-[12px] focus:outline-none transition-all placeholder-muted text-primary font-medium"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-bold text-primary">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-[#F8FAFC] border border-muted-light/60 focus:border-secondary focus:ring-1 focus:ring-secondary rounded-lg pl-3 pr-10 py-1.5 text-[12px] focus:outline-none transition-all placeholder-muted text-primary font-medium"
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

              {/* Agree Terms Checkbox */}
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="agree"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  required
                  className="w-3.5 h-3.5 text-primary border-muted-light/60 focus:ring-0 rounded mt-0.5 cursor-pointer"
                />
                <label htmlFor="agree" className="text-[10px] text-muted font-semibold cursor-pointer select-none leading-normal">
                  I agree to the <a href="#terms" className="text-secondary hover:underline">Terms of Service</a> & <a href="#privacy" className="text-secondary hover:underline">Privacy Policy</a>.
                </label>
              </div>

              {/* Sign Up CTA */}
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
                  'Tạo tài khoản thành công!'
                ) : (
                  `Create free profile`
                )}
              </button>
            </form>

            {/* Switch to Login */}
            <div className="mt-2.5 text-center text-[12px] text-muted font-medium">
              Already have an account?{' '}
              <a 
                href="#login" 
                onClick={(e) => {
                  e.preventDefault();
                  if (onSwitchToLogin) onSwitchToLogin();
                }}
                className="text-secondary font-bold hover:underline"
              >
                Sign In
              </a>
            </div>
          </div>

          {/* Footer copyright */}
          <div className="max-w-[320px] w-full mx-auto pt-3 border-t border-muted-light/40 flex flex-row justify-between items-center text-muted text-[9px] font-semibold mt-2.5">
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

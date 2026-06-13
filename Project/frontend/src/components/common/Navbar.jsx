import React, { useState, useEffect } from "react";
import {
  Menu,
  X,
  Shield,
  LogOut,
  User,
  MessageCircle,
  Building2,
  Plus,
  Briefcase,
  Bookmark,
  Edit3,
  Settings,
  CheckCircle,
} from "lucide-react";
import { authApi } from "../../features/auth/api/authApi.js";

export default function Navbar({
  onNavigate,
  onNavigateToAdmin,
  currentPage,
  user,
  onLogout,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const [showPinModal, setShowPinModal] = useState(false);
  const [pinValues, setPinValues] = useState(["", "", "", ""]);
  const [confirmPinValues, setConfirmPinValues] = useState(["", "", "", ""]);
  const [pinError, setPinError] = useState("");
  const [isConfirmingPin, setIsConfirmingPin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pinAttempts, setPinAttempts] = useState(0);
  const [resetPinSuccess, setResetPinSuccess] = useState("");
  const [isResettingTempPin, setIsResettingTempPin] = useState(false);

  // 1. RESET AND OPEN MESSENGER PIN MODAL
  const handleMessengerClick = () => {
    setShowProfileMenu(false);
    setIsOpen(false);
    setShowPinModal(true);
    setPinValues(["", "", "", ""]);
    setConfirmPinValues(["", "", "", ""]);
    setPinError("");
    setIsConfirmingPin(false);
    setPinAttempts(0);
    setResetPinSuccess("");
    setIsResettingTempPin(false);
  };

  // 2. RESET PIN gmail
  const handleForgotPin = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setPinError("");
    setResetPinSuccess("");
    try {
      const data = await authApi.forgotPin({
        userId: user.id,
        role: user.role,
      });
      if (data.success) {
        setResetPinSuccess(
          data.message || "Mã PIN mới đã được gửi về email của bạn.",
        );
        setPinAttempts(0);
      } else {
        setPinError(data.message || "Không thể gửi yêu cầu khôi phục.");
      }
    } catch (e) {
      setPinError(e.message || "Lỗi kết nối máy chủ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. SUBMIT PIN (VERIFY CURRENT OR SET NEW)
  const handlePinSubmit = async () => {
    if (isSubmitting) return;
    //đã từng tạo
    if (user?.hasMessengerPin && !isResettingTempPin) {
      const pin = pinValues.join("");
      if (pin.length !== 4) {
        setPinError("Vui lòng nhập đủ 4 chữ số.");
        return;
      }
      setIsSubmitting(true);
      setPinError("");
      setResetPinSuccess("");
      try {
        const data = await authApi.verifyPin({
          userId: user.id,
          role: user.role,
          pin,
        });
        if (data.success) {
          // tam thoi qua mail
          if (data.isTemporary) {
            setIsResettingTempPin(true);
            setPinValues(["", "", "", ""]);
            setConfirmPinValues(["", "", "", ""]);
            setIsConfirmingPin(false);
            setPinError("");
          }
          //pin chính
          else {
            setShowPinModal(false);
            if (onNavigate) onNavigate("messenger"); //chuyển trang
          }
        } else {
          setPinError(data.message || "Mã PIN không đúng.");
          setPinAttempts((prev) => prev + 1);
          setPinValues(["", "", "", ""]);
          document.getElementById("pin-0")?.focus();
        }
      } catch (e) {
        setPinError(e.message || "Lỗi kết nối máy chủ.");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }
    //xác nhận lại mã PIN mới mà chính user vừa nhập lần 1
    if (!isConfirmingPin) {
      const pin = pinValues.join("");
      if (pin.length !== 4) {
        setPinError("Vui lòng nhập đủ 4 chữ số.");
        return;
      }
      setIsConfirmingPin(true);
      setPinError("");
    } else {
      const confirmPin = confirmPinValues.join("");
      if (confirmPin.length !== 4) {
        setPinError("Vui lòng nhập đủ 4 chữ số để xác nhận.");
        return;
      }
      if (pinValues.join("") !== confirmPin) {
        setPinError("Mã PIN không khớp. Vui lòng thử lại.");
        setConfirmPinValues(["", "", "", ""]);
        const firstInput = document.getElementById("pin-confirm-0");
        if (firstInput) firstInput.focus();
        return;
      }
      // gửi mã PIN lên server để lưu
      setIsSubmitting(true);
      setPinError("");
      try {
        const data = await authApi.setPin({
          userId: user.id,
          role: user.role,
          pin: confirmPin,
        });
        if (data.success) {
          if (user) user.hasMessengerPin = true;
          setShowPinModal(false);
          setIsConfirmingPin(false);
          setIsResettingTempPin(false);
          if (onNavigate) {
            onNavigate("messenger");
          }
        } else {
          setPinError(data.message || "Có lỗi xảy ra.");
        }
      } catch (e) {
        setPinError(e.message || "Lỗi kết nối máy chủ.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  // check input
  const handlePinChange = (index, value) => {
    const numericValue = value.replace(/[^0-9]/g, "");
    if (value && !numericValue) return;

    const currentValues = isConfirmingPin ? confirmPinValues : pinValues;
    const setValues = isConfirmingPin ? setConfirmPinValues : setPinValues;
    const prefix = isConfirmingPin ? "pin-confirm-" : "pin-";

    if (numericValue.length > 1) {
      const pasted = numericValue.slice(0, 4).split("");
      const newPins = [...currentValues];
      for (let i = 0; i < pasted.length; i++) newPins[i] = pasted[i];
      setValues(newPins);
      setPinError("");
      const nextIndex = Math.min(pasted.length, 3);
      const nextInput = document.getElementById(`${prefix}${nextIndex}`);
      if (nextInput) nextInput.focus();
      return;
    }

    const newPins = [...currentValues];
    newPins[index] = numericValue;
    setValues(newPins);
    setPinError("");

    if (numericValue && index < 3) {
      const nextInput = document.getElementById(`${prefix}${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  // 5. xử lý Backspace khi nhập PIN
  const handlePinKeyDown = (index, e) => {
    const currentValues = isConfirmingPin ? confirmPinValues : pinValues;
    const prefix = isConfirmingPin ? "pin-confirm-" : "pin-";

    if (e.key === "Backspace" && !currentValues[index] && index > 0) {
      const prevInput = document.getElementById(`${prefix}${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  // 6. theo dõi cuộn trang để đổi style Navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
          scrolled
            ? "bg-surface/90 backdrop-blur-md border-b border-muted-light/60 shadow-sm py-4"
            : "bg-transparent py-6"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          {}
          <div className="flex items-center gap-8">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (onNavigate) onNavigate("home");
              }}
              className="flex items-center gap-2"
            >
              <span className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-primary/20">
                L
              </span>
              <span className="font-display text-2xl font-extrabold tracking-tight text-primary">
                Lancer<span className="text-secondary">Pro</span>
              </span>
            </a>

            {}
            <nav className="hidden md:flex gap-8">
              <a
                href="#find-work"
                onClick={(e) => {
                  e.preventDefault();
                  if (onNavigate) {
                    onNavigate("find_jobs");
                  }
                }}
                className="font-medium text-body-md text-primary hover:text-secondary transition-colors duration-200"
              >
                Tìm việc làm
              </a>
              <a
                href="#post-job"
                onClick={(e) => {
                  e.preventDefault();
                  if (onNavigate) {
                    if (!user) {
                      localStorage.setItem("redirect_after_login", "post_job");
                      onNavigate("login");
                    } else if (user.role === "EMPLOYER") {
                      onNavigate("post_job");
                    } else {
                      alert(
                        "Chỉ tài khoản Nhà tuyển dụng (Employer) mới có thể đăng tin tuyển dụng!",
                      );
                    }
                  }
                }}
                className="font-medium text-body-md text-muted hover:text-primary transition-colors duration-200"
              >
                Thuê Freelancer
              </a>
              <a
                href="#solutions"
                onClick={(e) => {
                  e.preventDefault();
                  if (onNavigate) {
                    onNavigate("coming_soon");
                  }
                }}
                className="font-medium text-body-md text-muted hover:text-primary transition-colors duration-200"
              >
                Giải pháp
              </a>
            </nav>
          </div>

          {}
          <div className="hidden md:flex items-center gap-5">
            {user?.role === "EMPLOYER" && (
              <button
                onClick={() => {
                  if (onNavigate) onNavigate("post_job");
                }}
                className="bg-secondary hover:bg-secondary-dark text-white px-5 py-2.5 rounded-large font-bold text-body-md transition-all duration-200 shadow-md shadow-secondary/10 hover:shadow-secondary/20 flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                Đăng dự án mới
              </button>
            )}

            {user ? (
              <div className="relative">
                <div
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className={`flex items-center gap-2 cursor-pointer py-1.5 px-3 rounded-xl transition-colors border ${showProfileMenu ? "bg-slate-50 border-slate-200" : "border-transparent hover:bg-slate-50 hover:border-slate-200"}`}
                >
                  <img
                    src={
                      user.avatar ||
                      `https://ui-avatars.com/api/?name=${user.name}`
                    }
                    alt={user.name}
                    className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                  />
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-primary leading-tight flex items-center gap-1">
                      {user.name}
                      {user.isVerified && (
                        <CheckCircle
                          className="w-3.5 h-3.5 text-blue-500"
                          title="Tài khoản đã xác minh KYC"
                        />
                      )}
                    </span>
                    <span className="text-[10px] font-bold text-secondary">
                      {user.role}
                    </span>
                  </div>
                </div>

                {showProfileMenu && (
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowProfileMenu(false)}
                  />
                )}

                {showProfileMenu && (
                  <div className="absolute right-0 mt-3 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-3 py-2 border-b border-slate-50 mb-1">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                        Tài khoản
                      </p>
                      <p
                        className="text-sm font-bold text-slate-800 truncate"
                        title={user.email}
                      >
                        {user.email || user.name}
                      </p>
                    </div>

                    {user?.role === "EMPLOYER" && (
                      <>
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            if (onNavigate) onNavigate("post_job");
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-secondary-dark hover:bg-secondary-light rounded-xl transition-all"
                        >
                          <Plus className="w-4 h-4" /> Đăng dự án mới
                        </button>
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            if (onNavigate) onNavigate("employer_profile");
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        >
                          <Building2 className="w-4 h-4" /> Thông tin doanh
                          nghiệp
                        </button>
                      </>
                    )}

                    {user?.role === "FREELANCER" && (
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          if (onNavigate) onNavigate("your_jobs");
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all mt-1"
                      >
                        <Bookmark className="w-4 h-4" /> Công việc của bạn
                      </button>
                    )}

                    {(user?.role === "FREELANCER" || user?.role === "EMPLOYER") && (
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          if (onNavigate) onNavigate("profile");
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all mt-1"
                      >
                        <User className="w-4 h-4" /> Hồ sơ cá nhân
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        if (onNavigate) onNavigate("edit_profile");
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all mt-1"
                    >
                      <Edit3 className="w-4 h-4" /> Sửa thông tin cá nhân
                    </button>

                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        if (onNavigate) onNavigate("preferences");
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all mt-1"
                    >
                      <Settings className="w-4 h-4" /> Cài đặt chung
                    </button>

                    {user?.role !== "STAFF" && user?.role !== "MANAGER" && (
                      <button
                        onClick={handleMessengerClick}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all mt-1"
                      >
                        <MessageCircle className="w-4 h-4" /> Tin nhắn
                      </button>
                    )}

                    {(user.role === "ADMIN" || user.role === "STAFF" || user.role === "MANAGER") && (
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          onNavigateToAdmin();
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all mt-1"
                      >
                        <Shield className="w-4 h-4" /> {user.role === "ADMIN" ? "Dashboard Admin" : user.role === "MANAGER" ? "Dashboard Manager" : "Dashboard Staff"}
                      </button>
                    )}

                    <div className="h-[1px] bg-slate-100 my-1 mx-2" />

                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                    >
                      <LogOut className="w-4 h-4" /> Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={() => {
                    if (onNavigate) onNavigate("login");
                  }}
                  className="text-body-md font-semibold text-muted hover:text-primary transition-colors duration-200"
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => {
                    if (onNavigate) onNavigate("register");
                  }}
                  className="bg-primary hover:bg-primary-light text-white px-6 py-2.5 rounded-large font-bold text-body-md transition-all duration-200 shadow-md shadow-primary/10 hover:shadow-primary/20"
                >
                  Đăng ký
                </button>
              </>
            )}
          </div>

          {}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg text-primary hover:bg-muted-light/30 transition-colors"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {}
        {isOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-surface border-b border-muted-light/80 shadow-lg py-6 px-6 flex flex-col gap-5 animate-fade-in">
            {user && (
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <img
                  src={
                    user.avatar ||
                    `https://ui-avatars.com/api/?name=${user.name}`
                  }
                  alt={user.name}
                  className="w-10 h-10 rounded-full border border-slate-200"
                />
                <div className="flex flex-col">
                  <span className="text-base font-bold text-primary flex items-center gap-1">
                    {user.name}
                    {user.isVerified && (
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                    )}
                  </span>
                  <span className="text-xs font-bold text-secondary text-left">
                    {user.role}
                  </span>
                </div>
              </div>
            )}

            <a
              href="#find-work"
              onClick={(e) => {
                e.preventDefault();
                setIsOpen(false);
                if (onNavigate) onNavigate("find_jobs");
              }}
              className="font-medium text-lg text-primary py-2 border-b border-muted-light/30"
            >
              Tìm việc làm
            </a>
            <a
              href="#post-job"
              onClick={(e) => {
                e.preventDefault();
                setIsOpen(false);
                if (onNavigate) {
                  if (!user) {
                    localStorage.setItem("redirect_after_login", "post_job");
                    onNavigate("login");
                  } else if (user.role === "EMPLOYER") {
                    onNavigate("post_job");
                  } else {
                    alert(
                      "Chỉ tài khoản Nhà tuyển dụng (Employer) mới có thể đăng tin tuyển dụng!",
                    );
                  }
                }
              }}
              className="font-medium text-lg text-muted py-2 border-b border-muted-light/30"
            >
              Thuê Freelancer
            </a>
            <a
              href="#solutions"
              onClick={(e) => {
                e.preventDefault();
                setIsOpen(false);
                if (onNavigate) onNavigate("coming_soon");
              }}
              className="font-medium text-lg text-muted py-2 border-b border-muted-light/30"
            >
              Giải pháp
            </a>

            {}
            {user && (user.role === "ADMIN" || user.role === "STAFF" || user.role === "MANAGER") && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onNavigateToAdmin();
                }}
                className="w-full text-center bg-blue-50 text-blue-600 border border-blue-200 py-3 rounded-large font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Shield className="w-4 h-4" /> {user.role === "ADMIN" ? "Admin Control Panel" : user.role === "MANAGER" ? "Manager Control Panel" : "Staff Control Panel"}
              </button>
            )}

            {user && user.role === "EMPLOYER" && (
              <>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    if (onNavigate) onNavigate("post_job");
                  }}
                  className="w-full text-center bg-secondary hover:bg-secondary-dark text-white py-3 rounded-large font-bold transition-all flex items-center justify-center gap-1.5 shadow-md mb-2"
                >
                  <Plus className="w-4 h-4" /> Đăng dự án mới
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    if (onNavigate) onNavigate("employer_profile");
                  }}
                  className="w-full text-center bg-cyan-50 text-cyan-700 border border-cyan-200 py-3 rounded-large font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Building2 className="w-4 h-4" /> Thông tin
                </button>
              </>
            )}

            {user && (
              <>
                {(user?.role === "FREELANCER" || user?.role === "EMPLOYER") && (
                  <button 
                    onClick={() => { setIsOpen(false); if (onNavigate) onNavigate('profile'); }}
                    className="w-full text-center bg-slate-50 text-slate-700 border border-slate-200 py-3 rounded-large font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm mt-2"
                  >
                    <User className="w-4 h-4" /> Hồ sơ cá nhân
                  </button>
                )}
                <button 
                  onClick={() => { setIsOpen(false); if (onNavigate) onNavigate('edit_profile'); }}
                  className="w-full text-center bg-slate-50 text-slate-700 border border-slate-200 py-3 rounded-large font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm mt-2"
                >
                  <Edit3 className="w-4 h-4" /> Sửa thông tin cá nhân
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    if (onNavigate) onNavigate("preferences");
                  }}
                  className="w-full text-center bg-slate-50 text-slate-700 border border-slate-200 py-3 rounded-large font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm mt-2"
                >
                  <Settings className="w-4 h-4" /> Cài đặt chung
                </button>
                {user?.role !== "STAFF" && user?.role !== "MANAGER" && (
                  <button
                    onClick={handleMessengerClick}
                    className="w-full text-center bg-indigo-50 text-indigo-600 border border-indigo-200 py-3 rounded-large font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm mt-2"
                  >
                    <MessageCircle className="w-4 h-4" /> Tin nhắn
                  </button>
                )}
              </>
            )}

            <div className="flex flex-col gap-4 mt-2">
              {user ? (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onLogout();
                  }}
                  className="flex items-center justify-center gap-2 text-center bg-rose-50 hover:bg-rose-100 text-rose-600 py-3 rounded-large font-bold transition-all shadow-sm"
                >
                  <LogOut className="w-5 h-5" /> Đăng xuất
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      if (onNavigate) onNavigate("login");
                    }}
                    className="text-center py-3 font-semibold text-primary hover:bg-muted-light/20 rounded-large transition-colors"
                  >
                    Đăng nhập
                  </button>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      if (onNavigate) onNavigate("register");
                    }}
                    className="text-center bg-primary hover:bg-primary-light text-white py-3 rounded-large font-bold transition-all shadow-md"
                  >
                    Đăng ký
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {}
      {showPinModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-md px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl animate-fade-in">
            {!isConfirmingPin ? (
              <>
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  {isResettingTempPin ? "Đặt lại mã PIN" : "Bảo mật Messenger"}
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  {isResettingTempPin
                    ? "Vui lòng thiết lập mã PIN mới gồm 4 chữ số theo ý bạn để sử dụng lâu dài."
                    : user?.hasMessengerPin
                      ? "Vui lòng nhập mã PIN để truy cập tin nhắn."
                      : "Vui lòng đặt mật khẩu cho đoạn chat của bạn (gồm 4 chữ số)."}
                </p>

                <div className="flex justify-center gap-3 mb-4">
                  {[0, 1, 2, 3].map((index) => (
                    <input
                      key={index}
                      id={`pin-${index}`}
                      type="password"
                      maxLength={4}
                      value={pinValues[index]}
                      onChange={(e) => handlePinChange(index, e.target.value)}
                      onKeyDown={(e) => handlePinKeyDown(index, e)}
                      className="w-14 h-14 text-center text-slate-900 text-2xl font-bold border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all shadow-sm"
                      autoFocus={index === 0}
                    />
                  ))}
                </div>

                {pinError && (
                  <p className="text-rose-500 text-sm mb-2 text-center">
                    {pinError}
                  </p>
                )}

                {isResettingTempPin && (
                  <p className="text-emerald-600 text-xs mb-3 text-center font-bold">
                    ✓ Xác thực mã PIN hệ thống thành công!
                  </p>
                )}

                {!isResettingTempPin && pinAttempts >= 1 && (
                  <p className="text-xs text-slate-500 mb-3 text-center">
                    Bạn quên mã PIN?{" "}
                    <button
                      type="button"
                      onClick={handleForgotPin}
                      className="text-indigo-600 hover:text-indigo-700 font-bold underline focus:outline-none"
                    >
                      nhấn vào đây để lấy lại
                    </button>
                  </p>
                )}
                {!isResettingTempPin && resetPinSuccess && (
                  <p className="text-emerald-600 text-xs mb-3 text-center font-bold">
                    {resetPinSuccess}
                  </p>
                )}

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setShowPinModal(false)}
                    className="flex-1 py-2.5 rounded-xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handlePinSubmit}
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all disabled:opacity-70"
                  >
                    {isSubmitting
                      ? "Đang xử lý..."
                      : user?.hasMessengerPin && !isResettingTempPin
                        ? "Xác nhận"
                        : "Tiếp tục"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  {isResettingTempPin
                    ? "Xác nhận mã PIN mới"
                    : "Xác nhận mật khẩu"}
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  Vui lòng nhập lại mã PIN mới gồm 4 chữ số để xác nhận.
                </p>

                <div className="flex justify-center gap-3 mb-4">
                  {[0, 1, 2, 3].map((index) => (
                    <input
                      key={`confirm-${index}`}
                      id={`pin-confirm-${index}`}
                      type="password"
                      maxLength={4}
                      value={confirmPinValues[index]}
                      onChange={(e) => handlePinChange(index, e.target.value)}
                      onKeyDown={(e) => handlePinKeyDown(index, e)}
                      className="w-14 h-14 text-center text-slate-900 text-2xl font-bold border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all shadow-sm"
                      autoFocus={index === 0}
                    />
                  ))}
                </div>

                {pinError && (
                  <p className="text-rose-500 text-sm mb-2 text-center">
                    {pinError}
                  </p>
                )}

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => {
                      setIsConfirmingPin(false);
                      setConfirmPinValues(["", "", "", ""]);
                      setPinError("");
                    }}
                    className="flex-1 py-2.5 rounded-xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
                  >
                    Quay lại
                  </button>
                  <button
                    onClick={handlePinSubmit}
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all disabled:opacity-70"
                  >
                    {isSubmitting ? "Đang xử lý..." : "Xác nhận"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

import React, { useState, useEffect } from 'react';
import { Menu, X, Shield, LogOut, User } from 'lucide-react';

export default function Navbar({ onNavigate, onNavigateToAdmin, currentPage, user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-surface/90 backdrop-blur-md border-b border-muted-light/60 shadow-sm py-4' 
        : 'bg-transparent py-6'
    }`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        {/* Brand Logo */}
        <div className="flex items-center gap-8">
          <a 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              if (onNavigate) onNavigate('home');
            }}
            className="flex items-center gap-2"
          >
            <span className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-primary/20">L</span>
            <span className="font-display text-2xl font-extrabold tracking-tight text-primary">
              Lancer<span className="text-secondary">Pro</span>
            </span>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-8">
            <a 
              href="#find-work" 
              onClick={(e) => {
                e.preventDefault();
                if (onNavigate) {
                  onNavigate('coming_soon');
                }
              }}
              className="font-medium text-body-md text-primary hover:text-secondary transition-colors duration-200"
            >
              Tìm việc làm
            </a>
            <a 
              href="#hire-freelancers" 
              onClick={(e) => {
                e.preventDefault();
                if (onNavigate) {
                  onNavigate('coming_soon');
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
                  onNavigate('coming_soon');
                }
              }}
              className="font-medium text-body-md text-muted hover:text-primary transition-colors duration-200"
            >
              Giải pháp
            </a>
          </nav>
        </div>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-5">
          {user ? (
            <div className="relative">
              <div 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className={`flex items-center gap-2 cursor-pointer py-1.5 px-3 rounded-xl transition-colors border ${showProfileMenu ? 'bg-slate-50 border-slate-200' : 'border-transparent hover:bg-slate-50 hover:border-slate-200'}`}
              >
                <img 
                  src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`} 
                  alt={user.name}
                  className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                />
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-primary leading-tight">{user.name}</span>
                  <span className="text-[10px] font-bold text-secondary">{user.role}</span>
                </div>
              </div>

              {/* Click outside overlay */}
              {showProfileMenu && (
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowProfileMenu(false)} 
                />
              )}

              {/* Premium Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-3 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-3 py-2 border-b border-slate-50 mb-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Tài khoản</p>
                    <p className="text-sm font-bold text-slate-800 truncate" title={user.email}>{user.email || user.name}</p>
                  </div>
                  
                  <button 
                    onClick={() => {
                      setShowProfileMenu(false);
                      if (onNavigate) onNavigate('coming_soon');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                  >
                    <User className="w-4 h-4" /> Sửa thông tin cá nhân
                  </button>

                  {user.role === 'ADMIN' && (
                    <button 
                      onClick={() => {
                        setShowProfileMenu(false);
                        onNavigateToAdmin();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all mt-1"
                    >
                      <Shield className="w-4 h-4" /> Dashboard Admin
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
                  if (onNavigate) onNavigate('login');
                }}
                className="text-body-md font-semibold text-muted hover:text-primary transition-colors duration-200"
              >
                Đăng nhập
              </button>
              <button 
                onClick={() => {
                  if (onNavigate) onNavigate('register');
                }}
                className="bg-primary hover:bg-primary-light text-white px-6 py-2.5 rounded-large font-bold text-body-md transition-all duration-200 shadow-md shadow-primary/10 hover:shadow-primary/20"
              >
                Đăng ký
              </button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="md:hidden p-2 rounded-lg text-primary hover:bg-muted-light/30 transition-colors"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-surface border-b border-muted-light/80 shadow-lg py-6 px-6 flex flex-col gap-5 animate-fade-in">
          {user && (
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <img 
                src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`} 
                alt={user.name}
                className="w-10 h-10 rounded-full border border-slate-200"
              />
              <div className="flex flex-col">
                <span className="text-base font-bold text-primary">{user.name}</span>
                <span className="text-xs font-bold text-secondary">{user.role}</span>
              </div>
            </div>
          )}

          <a 
            href="#find-work" 
            onClick={(e) => {
              e.preventDefault();
              setIsOpen(false);
              if (onNavigate) onNavigate('coming_soon');
            }}
            className="font-medium text-lg text-primary py-2 border-b border-muted-light/30"
          >
            Tìm việc làm
          </a>
          <a 
            href="#hire-freelancers" 
            onClick={(e) => {
              e.preventDefault();
              setIsOpen(false);
              if (onNavigate) onNavigate('coming_soon');
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
              if (onNavigate) onNavigate('coming_soon');
            }}
            className="font-medium text-lg text-muted py-2 border-b border-muted-light/30"
          >
            Giải pháp
          </a>
          
          {/* Mobile Admin panel entry */}
          {user && user.role === 'ADMIN' && (
            <button 
              onClick={() => { setIsOpen(false); onNavigateToAdmin(); }}
              className="w-full text-center bg-blue-50 text-blue-600 border border-blue-200 py-3 rounded-large font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Shield className="w-4 h-4" /> Admin Control Panel
            </button>
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
                    if (onNavigate) onNavigate('login');
                  }}
                  className="text-center py-3 font-semibold text-primary hover:bg-muted-light/20 rounded-large transition-colors"
                >
                  Đăng nhập
                </button>
                <button 
                  onClick={() => {
                    setIsOpen(false);
                    if (onNavigate) onNavigate('register');
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
  );
}

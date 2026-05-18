import React, { useState, useEffect } from 'react';
import { Menu, X, Shield, Globe, ChevronDown } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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
          <a href="#" className="flex items-center gap-2">
            <span className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-primary/20">L</span>
            <span className="font-display text-2xl font-extrabold tracking-tight text-primary">
              Lancer<span className="text-secondary">Pro</span>
            </span>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-8">
            <a href="#find-work" className="font-medium text-body-md text-primary hover:text-secondary transition-colors duration-200">
              Tìm việc làm
            </a>
            <a href="#hire-freelancers" className="font-medium text-body-md text-muted hover:text-primary transition-colors duration-200">
              Thuê Freelancer
            </a>
            <a href="#solutions" className="font-medium text-body-md text-muted hover:text-primary transition-colors duration-200">
              Giải pháp
            </a>
          </nav>
        </div>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-5">
          <button className="text-body-md font-semibold text-muted hover:text-primary transition-colors duration-200">
            Đăng nhập
          </button>
          <a href="#register" className="bg-primary hover:bg-primary-light text-white px-6 py-2.5 rounded-large font-bold text-body-md transition-all duration-200 shadow-md shadow-primary/10 hover:shadow-primary/20">
            Đăng ký
          </a>
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
          <a 
            href="#find-work" 
            onClick={() => setIsOpen(false)}
            className="font-medium text-lg text-primary py-2 border-b border-muted-light/30"
          >
            Tìm việc làm
          </a>
          <a 
            href="#hire-freelancers" 
            onClick={() => setIsOpen(false)}
            className="font-medium text-lg text-muted py-2 border-b border-muted-light/30"
          >
            Thuê Freelancer
          </a>
          <a 
            href="#solutions" 
            onClick={() => setIsOpen(false)}
            className="font-medium text-lg text-muted py-2 border-b border-muted-light/30"
          >
            Giải pháp
          </a>
          <div className="flex flex-col gap-4 mt-4">
            <button className="text-center py-3 font-semibold text-primary hover:bg-muted-light/20 rounded-large transition-colors">
              Đăng nhập
            </button>
            <a href="#register" className="text-center bg-primary hover:bg-primary-light text-white py-3 rounded-large font-bold transition-all shadow-md">
              Đăng ký
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

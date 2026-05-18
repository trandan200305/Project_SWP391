import React, { useState } from 'react';
import { Search, MapPin, Sparkles } from 'lucide-react';

export default function Hero({ onSearch }) {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(query, location);
    }
  };

  const handleQuickTagClick = (tag) => {
    setQuery(tag);
    if (onSearch) {
      onSearch(tag, location);
    }
  };

  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#F0F5F9] via-[#F8FAFC] to-[#FFFFFF] pt-28 pb-16">
      {/* Decorative Blur Spheres */}
      <div className="absolute top-1/4 left-10 w-72 h-72 bg-secondary/15 rounded-full filter blur-[80px]" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-accent/10 rounded-full filter blur-[100px]" />
      
      {/* Abstract grid lines background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center animate-fade-in">
        {/* Trust Batch */}
        <div className="inline-flex items-center gap-2 bg-secondary-light/60 border border-secondary/20 px-4 py-2 rounded-full mb-6">
          <Sparkles className="w-4 h-4 text-secondary-dark animate-pulse" />
          <span className="text-body-sm font-semibold text-secondary-dark">
            Nền tảng tìm kiếm Freelancer hàng đầu Việt Nam
          </span>
        </div>

        {/* Hero Title */}
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold text-primary tracking-tight leading-[1.15] mb-6 max-w-4xl mx-auto">
          Tìm kiếm <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">freelancer tài năng</span> cho dự án của bạn
        </h1>
        
        {/* Hero Subtitle */}
        <p className="font-sans text-lg sm:text-xl text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
          Kết nối với những chuyên gia hàng đầu về Công nghệ, Thiết kế, Marketing và Viết lách tại Việt Nam để hiện thực hóa ý tưởng của bạn một cách nhanh chóng và an toàn.
        </p>

        {/* Interactive Search Bar Container */}
        <form 
          onSubmit={handleSearchSubmit} 
          className="max-w-4xl mx-auto bg-surface p-3 rounded-2xl shadow-level-2 border border-muted-light/60 flex flex-col md:flex-row items-stretch gap-2 transition-all duration-300 hover:shadow-xl hover:border-secondary/30"
        >
          {/* Query Search */}
          <div className="flex-1 flex items-center px-4 gap-3 border-b md:border-b-0 md:border-r border-muted-light/60 py-2 md:py-0">
            <Search className="w-5 h-5 text-muted shrink-0" />
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Thử tìm 'Thiết kế Logo', 'Lập trình React'..."
              className="w-full bg-transparent border-none text-body-md py-3 focus:outline-none focus:ring-0 text-primary placeholder-muted"
            />
          </div>

          {/* Location Search */}
          <div className="flex-1 flex items-center px-4 gap-3 py-2 md:py-0">
            <MapPin className="w-5 h-5 text-muted shrink-0" />
            <input 
              type="text" 
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Hồ Chí Minh, Hà Nội, Toàn quốc..."
              className="w-full bg-transparent border-none text-body-md py-3 focus:outline-none focus:ring-0 text-primary placeholder-muted"
            />
          </div>

          {/* Action Button */}
          <button 
            type="submit" 
            className="bg-accent hover:bg-accent-dark text-white px-8 py-4 rounded-xl font-bold text-body-md transition-all duration-200 shadow-md shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] shrink-0"
          >
            Tìm Nhanh
          </button>
        </form>

        {/* Quick Tags */}
        <div className="mt-8 flex flex-wrap justify-center items-center gap-3">
          <span className="text-body-sm text-muted font-medium">Gợi ý phổ biến:</span>
          {['Lập trình React', 'Thiết kế Landing Page', 'Quản trị Fanpage', 'Viết content', 'SEO chuyên sâu'].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleQuickTagClick(tag)}
              className="px-4 py-1.5 bg-muted-light/40 border border-muted-light/80 rounded-full text-body-sm font-medium hover:bg-secondary-light hover:text-secondary-dark hover:border-secondary/40 transition-all duration-200"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

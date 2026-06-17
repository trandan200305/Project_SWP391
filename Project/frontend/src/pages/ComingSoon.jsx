import React from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';

export default function ComingSoon({ onNavigateHome }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 text-center max-w-2xl mx-auto bg-white/60 backdrop-blur-xl p-10 rounded-3xl border border-white/80 shadow-2xl">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/5 text-primary rounded-2xl mb-6 shadow-sm border border-primary/10">
          <Sparkles className="w-8 h-8 text-secondary" />
        </div>
        
        <h1 className="font-display text-4xl font-extrabold text-primary mb-4 tracking-tight">
          Tính năng đang phát triển
        </h1>
        
        <p className="text-muted text-lg mb-8 leading-relaxed">
          Chúng tôi đang tích cực hoàn thiện tính năng này để mang lại trải nghiệm tốt nhất cho bạn. 
          Vui lòng quay lại sau nhé!
        </p>

        <button 
          onClick={onNavigateHome}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-light text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
        >
          <ArrowLeft className="w-5 h-5" />
          Quay lại Trang Chủ
        </button>
      </div>
    </div>
  );
}

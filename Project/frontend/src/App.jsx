import React, { useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Navbar from './components/Navbar.jsx';
import Hero from './components/Hero.jsx';
import Stats from './components/Stats.jsx';
import HowItWorks from './components/HowItWorks.jsx';
import FeaturedJobs from './components/FeaturedJobs.jsx';
import Testimonials from './components/Testimonials.jsx';
import CTA from './components/CTA.jsx';
import Footer from './components/Footer.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import ComingSoon from './components/ComingSoon.jsx';

// Client ID thật từ Google Cloud Console (Dự án LancerPro - illyasviel1252004@gmail.com)
const GOOGLE_CLIENT_ID = "797982589939-262485ee5cl31or6j7rnhjgjgfp9s7os.apps.googleusercontent.com";

export default function App() {
  const [currentPage, setCurrentPage] = useState('home'); // 'home' | 'admin' | 'login' | 'register' | 'coming_soon'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  
  // Quản lý trạng thái người dùng (null: khách, object: đã đăng nhập)
  const [user, setUser] = useState(null);

  const handleSearch = (query, location) => {
    setSearchQuery(query);
    setSearchLocation(location);

    const projectsSection = document.getElementById('find-work');
    if (projectsSection) {
      projectsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleNavigate = (page) => {
    // Các tính năng cần bảo vệ (yêu cầu đăng nhập)
    const protectedPages = ['admin', 'coming_soon'];
    
    if (protectedPages.includes(page) && !user) {
      // Nếu chưa đăng nhập mà truy cập tính năng cần bảo vệ -> Mở form đăng nhập
      setCurrentPage('login');
      return;
    }

    if (page === 'admin' && user?.role !== 'ADMIN') {
      // Nếu đăng nhập rồi nhưng không phải ADMIN -> Hiển thị coming soon (hoặc báo lỗi access denied)
      setCurrentPage('coming_soon');
      return;
    }

    setCurrentPage(page);
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setCurrentPage('home'); // Đăng nhập thành công, điều hướng về home
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('home');
  };

  // Render Admin Dashboard
  if (currentPage === 'admin') {
    return <AdminDashboard user={user} onNavigateToHome={() => handleNavigate('home')} />;
  }

  // Render Coming Soon page for unfinished protected features
  if (currentPage === 'coming_soon') {
    return <ComingSoon onNavigateHome={() => handleNavigate('home')} />;
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="min-h-screen bg-background text-primary font-sans selection:bg-secondary-light selection:text-secondary-dark antialiased relative">
        {/* Navigation bar with dynamic routing state */}
        <Navbar 
          onNavigate={handleNavigate} 
          onNavigateToAdmin={() => handleNavigate('admin')} 
          currentPage={currentPage}
          user={user}
          onLogout={handleLogout}
        />

        <main>
          {/* Hero Section with interactive search capabilities */}
          <Hero onSearch={handleSearch} />

          {/* Dynamic numerical trust metrics */}
          <Stats />

          {/* Step by step descriptive guide */}
          <HowItWorks />

          {/* Categories list and Bento grid for latest jobs */}
          <FeaturedJobs searchQuery={searchQuery} />

          {/* Top Freelancers from the user's screenshot & trust stories */}
          <Testimonials />

          {/* Bottom Register and onboarding Call to Action banner */}
          <CTA />
        </main>

        {/* Structured footer with localized info */}
        <Footer />

        {/* FLOATING LOGIN MODAL POPUP */}
        {currentPage === 'login' && (
          <Login 
            onClose={() => handleNavigate('home')} 
            onSwitchToRegister={() => handleNavigate('register')}
            onLoginSuccess={handleLoginSuccess}
          />
        )}

        {/* FLOATING REGISTER MODAL POPUP */}
        {currentPage === 'register' && (
          <Register 
            onClose={() => handleNavigate('home')} 
            onSwitchToLogin={() => handleNavigate('login')} 
          />
        )}
      </div>
    </GoogleOAuthProvider>
  );
}

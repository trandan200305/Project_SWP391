import React from 'react';
import Navbar from '../common/Navbar.jsx';
import Footer from '../common/Footer.jsx';

export default function MainLayout({ children, onNavigate, onNavigateToAdmin, currentPage, user, onLogout }) {
  return (
    <div className="min-h-screen bg-background text-primary font-sans selection:bg-secondary-light selection:text-secondary-dark antialiased relative">
      <Navbar 
        onNavigate={onNavigate} 
        onNavigateToAdmin={onNavigateToAdmin} 
        currentPage={currentPage}
        user={user}
        onLogout={onLogout}
      />
      <main>
        {children}
      </main>
      <Footer />
    </div>
  );
}

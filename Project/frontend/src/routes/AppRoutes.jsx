import React from 'react';
import HomePage from '../pages/HomePage.jsx';
import ComingSoon from '../pages/ComingSoon.jsx';
import OnboardPage from '../features/auth/pages/OnboardPage.jsx';
import MessengerPage from '../features/messenger/pages/MessengerPage.jsx';
import AdminDashboardPage from '../features/admin/pages/AdminDashboardPage.jsx';
import LoginModal from '../features/auth/components/LoginModal.jsx';
import RegisterModal from '../features/auth/components/RegisterModal.jsx';
import FindJobsPage from '../features/project/pages/FindJobsPage.jsx';

export default function AppRoutes({
  currentPage,
  user,
  searchQuery,
  handleSearch,
  handleNavigate,
  handleLoginSuccess,
  onCloseAuth
}) {
  if (currentPage === 'admin') {
    return <AdminDashboardPage user={user} onNavigateToHome={() => handleNavigate('home')} />;
  }

  if (currentPage === 'coming_soon') {
    return <ComingSoon onNavigateHome={() => handleNavigate('home')} />;
  }

  if (currentPage === 'find_jobs') {
    return <FindJobsPage />;
  }

  if (currentPage === 'messenger') {
    return <MessengerPage user={user} onNavigateHome={() => handleNavigate('home')} />;
  }

  if (currentPage === 'onboard') {
    return (
      <OnboardPage 
        onBackToHome={() => handleNavigate('home')} 
        onOpenLogin={() => {
          handleNavigate('home');
          handleNavigate('login');
        }} 
      />
    );
  }

  return (
    <>
      <HomePage onSearch={handleSearch} searchQuery={searchQuery} />
      
      {currentPage === 'login' && (
        <LoginModal 
          onClose={onCloseAuth} 
          onSwitchToRegister={() => handleNavigate('register')}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {currentPage === 'register' && (
        <RegisterModal 
          onClose={onCloseAuth} 
          onSwitchToLogin={() => handleNavigate('login')} 
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </>
  );
}

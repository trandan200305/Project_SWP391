import React from 'react';
import HomePage from '../pages/HomePage.jsx';
import ComingSoon from '../pages/ComingSoon.jsx';
import OnboardPage from '../features/auth/pages/OnboardPage.jsx';
import MessengerPage from '../features/messenger/pages/MessengerPage.jsx';
import AdminDashboardPage from '../features/admin/pages/AdminDashboardPage.jsx';
import ManagerDashboardPage from '../features/admin/pages/ManagerDashboardPage.jsx';
import StaffDashboardPage from '../features/admin/pages/StaffDashboardPage.jsx';
import LoginModal from '../features/auth/components/LoginModal.jsx';
import RegisterModal from '../features/auth/components/RegisterModal.jsx';
import EmployerProfileSettings from '../components/EmployerProfileSettings.jsx';
import PostJobPage from '../pages/PostJobPage.jsx';
import FindJobsPage from '../features/project/pages/FindJobsPage.jsx';
import JobDetailPage from '../features/project/pages/JobDetailPage.jsx';
import YourJobsPage from '../features/project/pages/YourJobsPage.jsx';
import UserProfilePage from '../features/user/pages/UserProfilePage.jsx';

export default function AppRoutes({
  currentPage,
  pageParams,
  user,
  searchQuery,
  handleSearch,
  handleNavigate,
  handleLoginSuccess,
  onUserUpdate,
  onCloseAuth,
  onLogout
}) {
  if (currentPage === 'admin') {
    if (user?.role === 'ADMIN') {
      return <AdminDashboardPage user={user} onNavigateToHome={() => handleNavigate('home')} />;
    }
    if (user?.role === 'MANAGER') {
      return <ManagerDashboardPage user={user} onNavigateToHome={() => handleNavigate('home')} />;
    }
    return <StaffDashboardPage user={user} onNavigateToHome={() => handleNavigate('home')} />;
  }

  if (currentPage === 'profile' || currentPage === 'edit_profile' || currentPage === 'preferences') {
    return <UserProfilePage user={user} defaultTab={currentPage} onNavigate={handleNavigate} onLogout={onLogout} />;
  }

  if (currentPage === 'coming_soon') {
    return <ComingSoon onNavigateHome={() => handleNavigate('home')} />;
  }

  if (currentPage === 'find_jobs') {
    return <FindJobsPage onNavigate={handleNavigate} initialCategory={pageParams?.category} user={user} />;
  }

  if (currentPage === 'job_details') {
    return <JobDetailPage job={pageParams?.job} onNavigate={handleNavigate} user={user} />;
  }

  if (currentPage === 'your_jobs') {
    return <YourJobsPage onNavigate={handleNavigate} user={user} />;
  }

  if (currentPage === 'messenger') {
    return <MessengerPage user={user} onNavigateHome={() => handleNavigate('home')} initialPartner={pageParams} />;
  }

  if (currentPage === 'employer_profile') {
    return (
      <EmployerProfileSettings
        user={user}
        onNavigateHome={() => handleNavigate('home')}
        onNavigate={handleNavigate}
        onUserUpdate={onUserUpdate}
      />
    );
  }

  if (currentPage === 'post_job') {
    return (
      <PostJobPage
        user={user}
        onNavigateHome={() => handleNavigate('home')}
        onNavigate={handleNavigate}
      />
    );
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
      <HomePage onSearch={handleSearch} searchQuery={searchQuery} onNavigate={handleNavigate} user={user} />
      
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

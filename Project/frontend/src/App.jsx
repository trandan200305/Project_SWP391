import React, { useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import MainLayout from './components/layouts/MainLayout.jsx';
import AppRoutes from './routes/AppRoutes.jsx';

const GOOGLE_CLIENT_ID = "797982589939-262485ee5cl31or6j7rnhjgjgfp9s7os.apps.googleusercontent.com";

export default function App() {
  const [currentPage, setCurrentPage] = useState('home'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [user, setUser] = useState(null);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setCurrentPage('onboard');
    }
  }, []);

  const handleSearch = (query, location) => {
    setSearchQuery(query);
    setSearchLocation(location);

    const projectsSection = document.getElementById('find-work');
    if (projectsSection) {
      projectsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleNavigate = (page) => {
    const protectedPages = ['admin', 'coming_soon', 'messenger'];
    
    if (protectedPages.includes(page) && !user) {
      setCurrentPage('login');
      return;
    }

    if (page === 'admin' && user?.role !== 'ADMIN') {
      setCurrentPage('coming_soon');
      return;
    }

    setCurrentPage(page);
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setCurrentPage('home'); 
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('home');
  };

  const isLayoutPage = !['admin', 'coming_soon', 'messenger', 'onboard'].includes(currentPage);

  const routesContent = (
    <AppRoutes
      currentPage={currentPage}
      user={user}
      searchQuery={searchQuery}
      handleSearch={handleSearch}
      handleNavigate={handleNavigate}
      handleLoginSuccess={handleLoginSuccess}
      onCloseAuth={() => handleNavigate('home')}
    />
  );

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {isLayoutPage ? (
        <MainLayout
          currentPage={currentPage}
          user={user}
          onNavigate={handleNavigate}
          onNavigateToAdmin={() => handleNavigate('admin')}
          onLogout={handleLogout}
        >
          {routesContent}
        </MainLayout>
      ) : (
        routesContent
      )}
    </GoogleOAuthProvider>
  );
}


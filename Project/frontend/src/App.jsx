import React, { useState } from 'react';
import Navbar from './components/Navbar.jsx';
import Hero from './components/Hero.jsx';
import Stats from './components/Stats.jsx';
import HowItWorks from './components/HowItWorks.jsx';
import FeaturedJobs from './components/FeaturedJobs.jsx';
import Testimonials from './components/Testimonials.jsx';
import CTA from './components/CTA.jsx';
import Footer from './components/Footer.jsx';
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home'); // 'home' or 'login'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLocation, setSearchLocation] = useState('');

  const handleSearch = (query, location) => {
    setSearchQuery(query);
    setSearchLocation(location);

    // Scroll smoothly to latest projects when user searches
    const projectsSection = document.getElementById('find-work');
    if (projectsSection) {
      projectsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Standard Landing Page layout with floating login modal overlay
  return (
    <div className="min-h-screen bg-background text-primary font-sans selection:bg-secondary-light selection:text-secondary-dark antialiased relative">
      {/* Navigation bar with dynamic routing state */}
      <Navbar onNavigate={setCurrentPage} />

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

      {/* FLOATING LOGIN MODAL POPUP: Renders centered on top of homepage */}
      {currentPage === 'login' && (
        <Login 
          onClose={() => setCurrentPage('home')} 
          onSwitchToRegister={() => setCurrentPage('register')} 
        />
      )}

      {/* FLOATING REGISTER MODAL POPUP: Renders centered on top of homepage */}
      {currentPage === 'register' && (
        <Register 
          onClose={() => setCurrentPage('home')} 
          onSwitchToLogin={() => setCurrentPage('login')} 
        />
      )}
    </div>
  );
}

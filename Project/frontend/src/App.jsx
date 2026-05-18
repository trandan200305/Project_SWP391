import React, { useState } from 'react';
import Navbar from './components/Navbar.jsx';
import Hero from './components/Hero.jsx';
import Stats from './components/Stats.jsx';
import HowItWorks from './components/HowItWorks.jsx';
import FeaturedJobs from './components/FeaturedJobs.jsx';
import Testimonials from './components/Testimonials.jsx';
import CTA from './components/CTA.jsx';
import Footer from './components/Footer.jsx';

export default function App() {
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

  return (
    <div className="min-h-screen bg-background text-primary font-sans selection:bg-secondary-light selection:text-secondary-dark antialiased">
      {/* Navigation bar */}
      <Navbar />

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
    </div>
  );
}

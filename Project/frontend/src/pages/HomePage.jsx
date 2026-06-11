import React from 'react';
import Hero from '../components/Hero.jsx';
import Stats from '../components/Stats.jsx';
import HowItWorks from '../components/HowItWorks.jsx';
import FeaturedJobs from '../components/FeaturedJobs.jsx';
import Testimonials from '../components/Testimonials.jsx';
import CTA from '../components/CTA.jsx';

export default function HomePage({ onSearch, searchQuery, onNavigate, user }) {
  return (
    <>
      <Hero onSearch={onSearch} onNavigate={onNavigate} user={user} />
      <Stats />
      <HowItWorks />
      <FeaturedJobs searchQuery={searchQuery} />
      <Testimonials onNavigate={onNavigate} />
      <CTA onNavigate={onNavigate} user={user} />
    </>
  );
}

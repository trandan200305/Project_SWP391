import React, { useState } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import Navbar from "./components/Navbar.jsx";
import Hero from "./components/Hero.jsx";
import Stats from "./components/Stats.jsx";
import HowItWorks from "./components/HowItWorks.jsx";
import FeaturedJobs from "./components/FeaturedJobs.jsx";
import Testimonials from "./components/Testimonials.jsx";
import CTA from "./components/CTA.jsx";
import Footer from "./components/Footer.jsx";
import AdminDashboard from "./components/AdminDashboard.jsx";
import Login from "./components/Login.jsx";
import Register from "./components/Register.jsx";
import ComingSoon from "./components/ComingSoon.jsx";
import Messenger from "./components/Messenger.jsx";
import EmployerProfileSettings from "./components/EmployerProfileSettings.jsx";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function App() {
  const [currentPage, setCurrentPage] = useState("home"); // 'home' | 'admin' | 'login' | 'register' | 'coming_soon'
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLocation, setSearchLocation] = useState("");

  const [user, setUser] = useState(null);

  const handleSearch = (query, location) => {
    setSearchQuery(query);
    setSearchLocation(location);
    const projectsSection = document.getElementById("find-work");
    if (projectsSection) {
      projectsSection.scrollIntoView({ behavior: "smooth" });
    }
  };
  const handleNavigate = (page) => {
    const protectedPages = [
      "admin",
      "coming_soon",
      "messenger",
      "employer_profile",
    ];
    if (protectedPages.includes(page) && !user) {
      setCurrentPage("login");
      return;
    }
    if (page === "admin" && user?.role !== "ADMIN") {
      setCurrentPage("coming_soon");
      return;
    }
    if (page === "employer_profile" && user?.role !== "EMPLOYER") {
      setCurrentPage("coming_soon");
      return;
    }
    setCurrentPage(page);
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setCurrentPage("home");
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage("home");
  };
  if (currentPage === "admin") {
    return (
      <AdminDashboard
        user={user}
        onNavigateToHome={() => handleNavigate("home")}
      />
    );
  }
  if (currentPage === "coming_soon") {
    return <ComingSoon onNavigateHome={() => handleNavigate("home")} />;
  }
  if (currentPage === "messenger") {
    return (
      <Messenger user={user} onNavigateHome={() => handleNavigate("home")} />
    );
  }
  if (currentPage === "employer_profile") {
    return (
      <EmployerProfileSettings
        user={user}
        onNavigateHome={() => handleNavigate("home")}
        onUserUpdate={setUser}
      />
    );
  }
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="min-h-screen bg-background text-primary font-sans selection:bg-secondary-light selection:text-secondary-dark antialiased relative">
        <Navbar
          onNavigate={handleNavigate}
          onNavigateToAdmin={() => handleNavigate("admin")}
          currentPage={currentPage}
          user={user}
          onLogout={handleLogout}
        />
        <main>
          <Hero onSearch={handleSearch} />
          <Stats />
          <HowItWorks />
          <FeaturedJobs searchQuery={searchQuery} />

          <Testimonials />
          <CTA />
        </main>

        <Footer />

        {currentPage === "login" && (
          <Login
            onClose={() => handleNavigate("home")}
            onSwitchToRegister={() => handleNavigate("register")}
            onLoginSuccess={handleLoginSuccess}
          />
        )}
        {currentPage === "register" && (
          <Register
            onClose={() => handleNavigate("home")}
            onSwitchToLogin={() => handleNavigate("login")}
            onLoginSuccess={handleLoginSuccess}
          />
        )}
      </div>
    </GoogleOAuthProvider>
  );
}

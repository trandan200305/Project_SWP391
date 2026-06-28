import React, { useState, useEffect, useRef } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import MainLayout from "./components/layouts/MainLayout.jsx";
import AppRoutes from "./routes/AppRoutes.jsx";
import SuspendedOverlay from "./components/common/SuspendedOverlay.jsx";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [pageParams, setPageParams] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [user, setUser] = useState(null);
  const [suspended, setSuspended] = useState(null);
  const stompClientRef = useRef(null);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      setCurrentPage("onboard");
    } else if (window.location.pathname === "/payment-result") {
      const status = params.get("status") || "failed";
      const projectId = params.get("projectId");
      setCurrentPage("payment_result");
      setPageParams({ status, projectId });
    }
  }, []);

  useEffect(() => {
    if (stompClientRef.current) {
      try {
        stompClientRef.current.deactivate();
      } catch (_) {}
      stompClientRef.current = null;
    }

    if (!user) return;

    const roleUpper = user.role?.toUpperCase();
    const normalizedRole = roleUpper === "CLIENT" ? "EMPLOYER" : roleUpper;
    const topic = `/topic/account-status/${normalizedRole}/${user.id}`;

    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/api/ws"),
      reconnectDelay: 5000,
    });

    client.onConnect = () => {
      client.subscribe(topic, (message) => {
        try {
          const event = JSON.parse(message.body);
          if (event.type === "ACCOUNT_SUSPENDED") {
            setSuspended({ reason: event.reason });
          } else if (event.type === "ACCOUNT_REACTIVATED") {
            setSuspended(null);
          }
        } catch (_) {}
      });
    };

    client.onStompError = (frame) => {
      console.warn("[STOMP] error:", frame);
    };

    client.activate();
    stompClientRef.current = client;

    return () => {
      try {
        client.deactivate();
      } catch (_) {}
    };
  }, [user]);

  const handleSearch = (query, location) => {
    setSearchQuery(query);
    setSearchLocation(location);
    const projectsSection = document.getElementById("find-work");
    if (projectsSection) {
      projectsSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleNavigate = (page, params = null) => {
    if (page !== "coming_soon") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    const protectedPages = [
      "admin",
      "coming_soon",
      "messenger",
      "post_job",
      "employer_profile",
      "profile",
      "checkout",
    ];
    if (protectedPages.includes(page) && !user) {
      setCurrentPage("login");
      return;
    }
    if (
      page === "admin" &&
      !["ADMIN", "STAFF", "MANAGER"].includes(user?.role)
    ) {
      setCurrentPage("coming_soon");
      return;
    }
    if (page === "post_job" && user?.role !== "EMPLOYER") {
      alert(
        "Chỉ tài khoản Nhà tuyển dụng (Employer) mới có thể đăng tin tuyển dụng!",
      );
      setCurrentPage("home");
      return;
    }
    if (page === "employer_profile" && user?.role !== "EMPLOYER") {
      setCurrentPage("home");
      return;
    }
    setCurrentPage(page);
    setPageParams(params);
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setSuspended(null);
    const redirectTo = localStorage.getItem('redirect_after_login');
    localStorage.removeItem('redirect_after_login');
    
    if (userData.role === 'ADMIN' || userData.role === 'MANAGER' || userData.role === 'STAFF') {
      setCurrentPage('admin');
    } else if (redirectTo === 'post_job' && userData.role === 'EMPLOYER') {
      setCurrentPage('post_job');
    } else {
      setCurrentPage("home");
    }
  };

  const handleLogout = () => {
    setUser(null);
    setSuspended(null);
    setCurrentPage("home");
  };

  const handleSuspendedGoHome = () => {
    setSuspended(null);
    setUser(null);
    setCurrentPage("home");
  };

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
  };

  const isLayoutPage = ![
    "admin",
    "coming_soon",
    "messenger",
    "onboard",
    "employer_profile",
  ].includes(currentPage);

  const routesContent = (
    <AppRoutes
      currentPage={currentPage}
      pageParams={pageParams}
      user={user}
      searchQuery={searchQuery}
      handleSearch={handleSearch}
      handleNavigate={handleNavigate}
      handleLoginSuccess={handleLoginSuccess}
      onUserUpdate={handleUserUpdate}
      onCloseAuth={() => handleNavigate("home")}
      onLogout={handleLogout}
    />
  );

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {isLayoutPage ? (
        <MainLayout
          currentPage={currentPage}
          user={user}
          onNavigate={handleNavigate}
          onNavigateToAdmin={() => handleNavigate("admin")}
          onLogout={handleLogout}
        >
          {routesContent}
        </MainLayout>
      ) : (
        routesContent
      )}

      {suspended && (
        <SuspendedOverlay
          reason={suspended.reason}
          onGoHome={handleSuspendedGoHome}
        />
      )}
    </GoogleOAuthProvider>
  );
}

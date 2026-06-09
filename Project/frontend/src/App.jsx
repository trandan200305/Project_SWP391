import React, { useState, useEffect, useRef } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import MainLayout from './components/layouts/MainLayout.jsx';
import AppRoutes from './routes/AppRoutes.jsx';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// ─── Suspended Overlay ───────────────────────────────────────────────────────
function SuspendedOverlay({ reason, onGoHome }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        zIndex: 99999,
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div style={{
        background: 'white',
        borderRadius: '1.5rem',
        padding: '2.5rem 2rem',
        maxWidth: '420px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
        border: '1px solid #fee2e2',
        animation: 'suspendFadeIn 0.3s ease',
      }}>
        {/* Icon */}
        <div style={{
          width: '72px', height: '72px',
          background: '#fef2f2',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.25rem',
          boxShadow: '0 8px 20px rgba(239,68,68,0.15)',
        }}>
          <svg width="36" height="36" fill="none" viewBox="0 0 24 24">
            <path stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          </svg>
        </div>

        {/* Title */}
        <h2 style={{
          fontSize: '1.375rem', fontWeight: 800,
          color: '#0f172a', marginBottom: '0.5rem',
        }}>
          Tài khoản bị tạm ngưng
        </h2>

        {/* Subtitle */}
        <p style={{
          fontSize: '0.875rem', color: '#64748b',
          lineHeight: 1.7, marginBottom: '0.75rem',
        }}>
          Phiên đăng nhập của bạn đã bị dừng bởi Quản trị viên hệ thống.
        </p>

        {/* Reason box */}
        {reason && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '0.75rem',
            padding: '0.75rem 1rem',
            marginBottom: '1.5rem',
            fontSize: '0.8125rem',
            color: '#b91c1c',
            fontWeight: 600,
          }}>
            Lý do: {reason}
          </div>
        )}

        {/* Go home button */}
        <button
          onClick={onGoHome}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
            color: 'white',
            border: 'none',
            borderRadius: '0.875rem',
            padding: '0.875rem',
            fontWeight: 700,
            fontSize: '0.9375rem',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(59,130,246,0.35)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          Quay về Trang chủ
        </button>

        <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '1rem' }}>
          Liên hệ quản trị viên để được hỗ trợ khôi phục tài khoản.
        </p>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes suspendFadeIn {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [user, setUser] = useState(null);
  const [suspended, setSuspended] = useState(null); // { reason }
  const stompClientRef = useRef(null);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setCurrentPage('onboard');
    }
  }, []);

  // ── STOMP WebSocket: subscribe when user is MANAGER or STAFF ──────────────
  useEffect(() => {
    // Disconnect any previous client
    if (stompClientRef.current) {
      try { stompClientRef.current.deactivate(); } catch (_) {}
      stompClientRef.current = null;
    }

    if (!user || !['MANAGER', 'STAFF'].includes(user.role?.toUpperCase())) return;

    const topic = `/topic/account-status/${user.role.toUpperCase()}/${user.id}`;

    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/api/ws'),
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(topic, (message) => {
          try {
            const event = JSON.parse(message.body);
            if (event.type === 'ACCOUNT_SUSPENDED') {
              setSuspended({ reason: event.reason });
            } else if (event.type === 'ACCOUNT_REACTIVATED') {
              setSuspended(null);
            }
          } catch (_) {}
        });
      },
      onStompError: (frame) => {
        console.warn('[STOMP] error:', frame);
      },
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      try { client.deactivate(); } catch (_) {}
    };
  }, [user]);

  const handleSearch = (query, location) => {
    setSearchQuery(query);
    setSearchLocation(location);
    const projectsSection = document.getElementById('find-work');
    if (projectsSection) {
      projectsSection.scrollIntoView({ behavior: "smooth" });
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
    setSuspended(null);
    setCurrentPage('home');
  };

  const handleLogout = () => {
    setUser(null);
    setSuspended(null);
    setCurrentPage('home');
  };

  // When suspended overlay "Go home" is clicked
  const handleSuspendedGoHome = () => {
    setSuspended(null);
    setUser(null);
    setCurrentPage('home');
  };

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
  };

  const isLayoutPage = !['admin', 'coming_soon', 'messenger', 'onboard', 'employer_profile'].includes(currentPage);

  const routesContent = (
    <AppRoutes
      currentPage={currentPage}
      user={user}
      searchQuery={searchQuery}
      handleSearch={handleSearch}
      handleNavigate={handleNavigate}
      handleLoginSuccess={handleLoginSuccess}
      onUserUpdate={handleUserUpdate}
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

      {/* Global blocking suspension overlay — cannot be dismissed */}
      {suspended && (
        <SuspendedOverlay
          reason={suspended.reason}
          onGoHome={handleSuspendedGoHome}
        />
      )}
    </GoogleOAuthProvider>
  );
}

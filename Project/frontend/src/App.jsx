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

// Client ID thật từ Google Cloud Console (Dự án LancerPro - @gmail.com)
const GOOGLE_CLIENT_ID =
  "797982589939-262485ee5cl31or6j7rnhjgjgfp9s7os.apps.googleusercontent.com";

export default function App() {
  const [currentPage, setCurrentPage] = useState("home"); // 'home' | 'admin' | 'login' | 'register' | 'coming_soon'
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLocation, setSearchLocation] = useState("");

  // Quản lý trạng thái người dùng (null: khách, object: đã đăng nhập)
  const [user, setUser] = useState(null);

  /**
   * Hàm xử lý khi người dùng thực hiện tìm kiếm công việc ở trang chủ (Hero section).
   * Cập nhật từ khóa và địa điểm vào state, sau đó tự động cuộn trang (scroll) mượt mà 
   * xuống phần danh sách công việc (có id là 'find-work').
   */
  const handleSearch = (query, location) => {
    setSearchQuery(query);
    setSearchLocation(location);

    const projectsSection = document.getElementById("find-work");
    if (projectsSection) {
      projectsSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  /**
   * Hàm điều hướng chính của toàn bộ ứng dụng (thay thế cho React Router).
   * Kiểm tra quyền truy cập (Authorization) trước khi cho phép người dùng vào các trang.
   */
  const handleNavigate = (page) => {
    // Các tính năng cần bảo vệ (yêu cầu phải đăng nhập mới được dùng)
    const protectedPages = ["admin", "coming_soon", "messenger"];

    if (protectedPages.includes(page) && !user) {
      // Nếu chưa đăng nhập mà cố tình truy cập tính năng cần bảo vệ -> Mở form đăng nhập
      setCurrentPage("login");
      return;
    }

    if (page === "admin" && user?.role !== "ADMIN") {
      // Nếu đã đăng nhập nhưng cố tình vào trang Quản trị (admin) mà không có quyền ADMIN -> Hiển thị trang coming soon
      setCurrentPage("coming_soon");
      return;
    }

    // Nếu qua được các bước kiểm tra trên, cho phép chuyển đổi sang trang yêu cầu
    setCurrentPage(page);
  };

  /**
   * Hàm chạy khi đăng nhập thành công (từ Form Login hoặc Form Register).
   * Nhận thông tin user từ Backend và lưu vào state `user` để toàn app sử dụng,
   * sau đó đưa người dùng về lại trang chủ.
   */
  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setCurrentPage("home"); // Đăng nhập thành công, điều hướng về home
  };

  /**
   * Hàm xử lý khi người dùng ấn nút Đăng xuất.
   * Xóa sạch thông tin user trong state (set thành null) và đưa về trang chủ.
   */
  const handleLogout = () => {
    setUser(null);
    setCurrentPage("home");
  };

  // Hiển thị trang Quản trị (Admin Dashboard)
  if (currentPage === "admin") {
    return (
      <AdminDashboard
        user={user}
        onNavigateToHome={() => handleNavigate("home")}
      />
    );
  }

  // Hiển thị trang "Sắp ra mắt" cho các tính năng đang phát triển
  if (currentPage === "coming_soon") {
    return <ComingSoon onNavigateHome={() => handleNavigate("home")} />;
  }

  // Hiển thị trang Nhắn tin (Messenger)
  if (currentPage === "messenger") {
    return (
      <Messenger user={user} onNavigateHome={() => handleNavigate("home")} />
    );
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="min-h-screen bg-background text-primary font-sans selection:bg-secondary-light selection:text-secondary-dark antialiased relative">
        {/* Thanh điều hướng (Navbar) với trạng thái định tuyến tự động */}
        <Navbar
          onNavigate={handleNavigate}
          onNavigateToAdmin={() => handleNavigate("admin")}
          currentPage={currentPage}
          user={user}
          onLogout={handleLogout}
        />

        <main>
          {/* Phần Hero với thanh công cụ tìm kiếm tương tác */}
          <Hero onSearch={handleSearch} />

          {/* Các chỉ số và thống kê tin cậy tự động */}
          <Stats />

          {/* Hướng dẫn từng bước cách hoạt động của hệ thống */}
          <HowItWorks />

          {/* Danh mục và lưới danh sách các công việc mới nhất */}
          <FeaturedJobs searchQuery={searchQuery} />

          {/* Danh sách Freelancer hàng đầu và các câu chuyện thành công */}
          <Testimonials />

          {/* Biểu ngữ kêu gọi hành động (Đăng ký) ở cuối trang */}
          <CTA />
        </main>

        {/* Chân trang (Footer) chứa các thông tin liên hệ và liên kết */}
        <Footer />

        {/* CỬA SỔ NỔI (MODAL) ĐĂNG NHẬP */}
        {currentPage === "login" && (
          <Login
            onClose={() => handleNavigate("home")}
            onSwitchToRegister={() => handleNavigate("register")}
            onLoginSuccess={handleLoginSuccess}
          />
        )}

        {/* CỬA SỔ NỔI (MODAL) ĐĂNG KÝ */}
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

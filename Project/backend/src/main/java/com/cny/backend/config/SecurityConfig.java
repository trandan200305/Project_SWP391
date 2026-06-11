package com.cny.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    // Bean dùng để mã hóa mật khẩu khi đăng ký và kiểm tra mật khẩu khi đăng nhập.
    // BCrypt là thuật toán hash mật khẩu an toàn, không lưu mật khẩu dạng plain text.
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // Cấu hình chuỗi filter bảo mật chính của Spring Security.
    // Hiện tại project đang mở toàn bộ request để tiện phát triển Sprint 1.
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // Tắt CSRF cho API REST để frontend có thể gọi các request POST/PUT/DELETE dễ hơn.
            .csrf(AbstractHttpConfigurer::disable)
            // Bật CORS và dùng cấu hình CORS được khai báo ở method corsConfigurationSource().
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authorizeHttpRequests(auth -> auth
                .anyRequest().permitAll() // Allow all requests temporarily for Sprint 1 until JWT is fully implemented
            );
        return http.build();
    }

    // Cấu hình CORS để frontend khác port/domain vẫn gọi được API backend.
    // Ví dụ: frontend chạy localhost:5173, backend chạy localhost:8080.
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Cho phép mọi origin gọi API. Khi deploy thật nên giới hạn domain cụ thể.
        configuration.setAllowedOriginPatterns(java.util.Collections.singletonList("*"));
        // Các HTTP method được phép gọi từ frontend.
        configuration.setAllowedMethods(java.util.Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        // Các header frontend được phép gửi lên backend.
        configuration.setAllowedHeaders(java.util.Arrays.asList("Authorization", "Content-Type", "Cache-Control", "X-Admin-Id", "X-Verifier-Email"));
        // Cho phép gửi kèm credential như cookie/header xác thực nếu cần.
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // Áp dụng cấu hình CORS cho tất cả endpoint trong backend.
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}

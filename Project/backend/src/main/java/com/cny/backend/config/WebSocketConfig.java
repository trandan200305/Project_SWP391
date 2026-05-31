package com.cny.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Kích hoạt một máy chủ trung gian (broker) đơn giản trên bộ nhớ để chuyển tin nhắn về cho client
        // trên các đường dẫn (destination) có tiền tố là "/topic"
        config.enableSimpleBroker("/topic");
        
        // Đặt tiền tố "/app" cho các tin nhắn gửi từ client lên server (nhắm tới các hàm có @MessageMapping)
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Đăng ký đường dẫn "/ws" cho WebSocket, đồng thời bật tính năng dự phòng SockJS (fallback)
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }
}

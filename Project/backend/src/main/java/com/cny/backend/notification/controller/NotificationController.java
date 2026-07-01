package com.cny.backend.notification.controller;

import com.cny.backend.notification.dto.NotificationDto;
import com.cny.backend.notification.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/notifications")
@CrossOrigin(origins = "*", maxAge = 3600)
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @GetMapping("/{role}/{userId}")
    public ResponseEntity<?> getUserNotifications(@PathVariable String role, @PathVariable Long userId) {
        List<NotificationDto> notifications = notificationService.getUserNotifications(userId, role);
        long unreadCount = notificationService.getUnreadCount(userId, role);
        
        Map<String, Object> response = new HashMap<>();
        response.put("notifications", notifications);
        response.put("unreadCount", unreadCount);
        
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Notification marked as read"));
    }

    @PutMapping("/read-all/{role}/{userId}")
    public ResponseEntity<?> markAllAsRead(@PathVariable String role, @PathVariable Long userId) {
        notificationService.markAllAsRead(userId, role);
        return ResponseEntity.ok(Map.of("success", true, "message", "All notifications marked as read"));
    }

    // Temporary endpoint for testing
    @PostMapping("/test-seed/{role}/{userId}")
    public ResponseEntity<?> seedTestNotifications(@PathVariable String role, @PathVariable Long userId) {
        notificationService.createNotification(userId, role, "Yêu cầu KYC mới", "Có 3 yêu cầu KYC đang chờ bạn duyệt.", "TASK_ASSIGNED", "KYC-123");
        notificationService.createNotification(userId, role, "Hệ thống bảo trì", "Hệ thống sẽ bảo trì vào lúc 00:00 ngày mai.", "WARNING", null);
        notificationService.createNotification(userId, role, "Giải quyết khiếu nại", "Khách hàng đã phản hồi trong tranh chấp #DIS-998.", "INFO", "DIS-998");
        return ResponseEntity.ok(Map.of("success", true, "message", "Test notifications created"));
    }
}

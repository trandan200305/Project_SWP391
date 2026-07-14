package com.cny.backend.notification.service;

import com.cny.backend.notification.dto.NotificationDto;
import com.cny.backend.notification.entity.SystemNotification;
import com.cny.backend.notification.repository.SystemNotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    @Autowired
    private SystemNotificationRepository notificationRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public List<NotificationDto> getUserNotifications(Long userId, String role) {
        List<SystemNotification> notifications = notificationRepository
                .findUserAndGlobalNotifications(userId, role.toUpperCase());
        return notifications.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public long getUnreadCount(Long userId, String role) {
        return notificationRepository.countUserAndGlobalUnread(userId, role.toUpperCase());
    }

    @Transactional
    public void markAsRead(Long notificationId) {
        SystemNotification notification = notificationRepository.findById(notificationId).orElse(null);
        if (notification != null) {
            notification.setRead(true);
            notificationRepository.save(notification);
        }
    }

    @Transactional
    public void markAllAsRead(Long userId, String role) {
        List<SystemNotification> notifications = notificationRepository
                .findUserAndGlobalNotifications(userId, role.toUpperCase());
        for (SystemNotification notification : notifications) {
            if (!notification.isRead()) {
                notification.setRead(true);
                notificationRepository.save(notification);
            }
        }
    }

    @Transactional
    public SystemNotification createNotification(Long recipientId, String recipientRole, String title, String message, String type, String referenceId) {
        SystemNotification notification = SystemNotification.builder()
                .recipientId(recipientId)
                .recipientRole(recipientRole.toUpperCase())
                .title(title)
                .message(message)
                .type(type)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .referenceId(referenceId)
                .build();
        SystemNotification saved = notificationRepository.save(notification);
        
        try {
            messagingTemplate.convertAndSend("/topic/notifications/" + recipientRole.toUpperCase() + "/" + recipientId, mapToDto(saved));
        } catch (Exception e) {
            System.err.println("Failed to send websocket notification: " + e.getMessage());
        }
        
        return saved;
    }

    private NotificationDto mapToDto(SystemNotification entity) {
        return NotificationDto.builder()
                .id(entity.getId())
                .recipientId(entity.getRecipientId())
                .recipientRole(entity.getRecipientRole())
                .title(entity.getTitle())
                .message(entity.getMessage())
                .type(entity.getType())
                .isRead(entity.isRead())
                .createdAt(entity.getCreatedAt())
                .referenceId(entity.getReferenceId())
                .build();
    }
}

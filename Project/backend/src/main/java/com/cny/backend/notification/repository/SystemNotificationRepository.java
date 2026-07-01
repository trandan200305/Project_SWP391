package com.cny.backend.notification.repository;

import com.cny.backend.notification.entity.SystemNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SystemNotificationRepository extends JpaRepository<SystemNotification, Long> {
    @org.springframework.data.jpa.repository.Query("SELECT n FROM SystemNotification n WHERE (n.recipientId = ?1 OR n.recipientId = 0) AND n.recipientRole = ?2 ORDER BY n.createdAt DESC")
    List<SystemNotification> findUserAndGlobalNotifications(Long recipientId, String recipientRole);
    
    @org.springframework.data.jpa.repository.Query("SELECT COUNT(n) FROM SystemNotification n WHERE (n.recipientId = ?1 OR n.recipientId = 0) AND n.recipientRole = ?2 AND n.isRead = false")
    long countUserAndGlobalUnread(Long recipientId, String recipientRole);
}

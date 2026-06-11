package com.cny.backend.chat.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "direct_messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DirectMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "message_id")
    private Integer messageId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_id", nullable = false)
    private DirectChat chat;

    @Column(name = "sender_id", nullable = false)
    private Integer senderId;

    @Column(name = "sender_role", nullable = false, length = 20)
    private String senderRole; // FREELANCER or EMPLOYER

    @Column(name = "message_text", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String messageText;

    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false;

    @CreationTimestamp
    @Column(name = "sent_at", updatable = false)
    private LocalDateTime sentAt;
}

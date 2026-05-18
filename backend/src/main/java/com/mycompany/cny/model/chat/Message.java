package com.mycompany.cny.model.chat;

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "messages")
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "message_id")
    private Integer messageId;

    @Column(name = "conversation_id")
    private Integer conversationId;

    @Column(name = "sender_id")
    private Integer senderId;

    @Column(name = "content")
    private String content;

    @Column(name = "message_type")
    private String messageType;

    @Column(name = "is_read")
    private Boolean isRead;

    @Column(name = "created_at")
    private java.time.LocalDateTime createdAt;

}

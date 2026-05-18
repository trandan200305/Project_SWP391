package com.mycompany.cny.model.chat;

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "conversations")
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "conversation_id")
    private Integer conversationId;

    @Column(name = "project_id")
    private Integer projectId;

    @Column(name = "contract_id")
    private Integer contractId;

    @Column(name = "conversation_type")
    private String conversationType;

    @Column(name = "last_message_at")
    private java.time.LocalDateTime lastMessageAt;

    @Column(name = "created_at")
    private java.time.LocalDateTime createdAt;

}

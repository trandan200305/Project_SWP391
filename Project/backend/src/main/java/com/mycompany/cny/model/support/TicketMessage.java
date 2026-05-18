package com.mycompany.cny.model.support;

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "ticket_messages")
public class TicketMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "message_id")
    private Integer messageId;

    @Column(name = "ticket_id")
    private Integer ticketId;

    @Column(name = "sender_id")
    private Integer senderId;

    @Column(name = "content")
    private String content;

    @Column(name = "is_staff_reply")
    private Boolean isStaffReply;

    @Column(name = "created_at")
    private java.time.LocalDateTime createdAt;

}

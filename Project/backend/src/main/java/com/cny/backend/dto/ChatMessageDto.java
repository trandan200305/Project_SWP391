package com.cny.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageDto {
    private Integer messageId;
    private Integer ticketId;
    
    // Sender Details
    private Integer senderId;
    private String senderRole; // "FREELANCER" | "EMPLOYER" | "ADMIN"
    private String senderName;
    private String senderAvatar;
    
    private String messageText;
    private LocalDateTime sentAt;
    
    // Recipient details (optional, for routing confirmation)
    private Integer recipientId;
}

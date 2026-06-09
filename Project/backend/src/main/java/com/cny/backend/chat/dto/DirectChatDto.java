package com.cny.backend.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DirectChatDto {
    private Integer chatId;
    private Integer partnerId;
    private String partnerRole;
    private String partnerName;
    private String partnerAvatar;
    private String lastMessage;
    private LocalDateTime lastMessageAt;
    private long unreadCount;
    private LocalDateTime updatedAt;
}

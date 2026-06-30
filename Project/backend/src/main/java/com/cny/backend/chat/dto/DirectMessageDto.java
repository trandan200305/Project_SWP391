package com.cny.backend.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DirectMessageDto {
    private Integer messageId;
    private Integer chatId;
    private Integer senderId;
    private String senderRole;
    private String senderName;
    private String senderAvatar;
    private String messageText;
    private Boolean isRead;
    private LocalDateTime sentAt;
    private List<Map<String, Object>> attachments;
}

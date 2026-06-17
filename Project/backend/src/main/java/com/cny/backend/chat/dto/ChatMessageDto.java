package com.cny.backend.chat.dto;

import com.cny.backend.auth.entity.*;
import com.cny.backend.admin.entity.*;
import com.cny.backend.project.entity.*;
import com.cny.backend.user.entity.*;
import com.cny.backend.auth.repository.*;
import com.cny.backend.admin.repository.*;
import com.cny.backend.project.repository.*;
import com.cny.backend.user.repository.*;
import com.cny.backend.admin.dto.*;
import com.cny.backend.chat.dto.*;
import com.cny.backend.project.dto.*;
import com.cny.backend.user.dto.*;
import com.cny.backend.auth.service.*;
import com.cny.backend.admin.service.*;
import com.cny.backend.chat.service.*;


import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class ChatMessageDto {
    private Integer messageId;
    private Integer ticketId;
    private Integer senderId;
    private String senderRole; 
    private String senderName;
    private String senderAvatar;
    private String messageText;
    private LocalDateTime sentAt;
    private Boolean isRead;
    private List<Map<String, Object>> attachments;
    private Integer recipientId;

    public ChatMessageDto() {}

    public ChatMessageDto(Integer messageId, Integer ticketId, Integer senderId, String senderRole, 
                          String senderName, String senderAvatar, String messageText, 
                          LocalDateTime sentAt, Boolean isRead, List<Map<String, Object>> attachments, 
                          Integer recipientId) {
        this.messageId = messageId;
        this.ticketId = ticketId;
        this.senderId = senderId;
        this.senderRole = senderRole;
        this.senderName = senderName;
        this.senderAvatar = senderAvatar;
        this.messageText = messageText;
        this.sentAt = sentAt;
        this.isRead = isRead;
        this.attachments = attachments;
        this.recipientId = recipientId;
    }

    public Integer getMessageId() { return messageId; }
    public void setMessageId(Integer messageId) { this.messageId = messageId; }

    public Integer getTicketId() { return ticketId; }
    public void setTicketId(Integer ticketId) { this.ticketId = ticketId; }

    public Integer getSenderId() { return senderId; }
    public void setSenderId(Integer senderId) { this.senderId = senderId; }

    public String getSenderRole() { return senderRole; }
    public void setSenderRole(String senderRole) { this.senderRole = senderRole; }

    public String getSenderName() { return senderName; }
    public void setSenderName(String senderName) { this.senderName = senderName; }

    public String getSenderAvatar() { return senderAvatar; }
    public void setSenderAvatar(String senderAvatar) { this.senderAvatar = senderAvatar; }

    public String getMessageText() { return messageText; }
    public void setMessageText(String messageText) { this.messageText = messageText; }

    public LocalDateTime getSentAt() { return sentAt; }
    public void setSentAt(LocalDateTime sentAt) { this.sentAt = sentAt; }

    public Boolean getIsRead() { return isRead; }
    public void setIsRead(Boolean isRead) { this.isRead = isRead; }

    public List<Map<String, Object>> getAttachments() { return attachments; }
    public void setAttachments(List<Map<String, Object>> attachments) { this.attachments = attachments; }

    public Integer getRecipientId() { return recipientId; }
    public void setRecipientId(Integer recipientId) { this.recipientId = recipientId; }

    
    public static ChatMessageDtoBuilder builder() {
        return new ChatMessageDtoBuilder();
    }

    public static class ChatMessageDtoBuilder {
        private Integer messageId;
        private Integer ticketId;
        private Integer senderId;
        private String senderRole; 
        private String senderName;
        private String senderAvatar;
        private String messageText;
        private LocalDateTime sentAt;
        private Boolean isRead;
        private List<Map<String, Object>> attachments;
        private Integer recipientId;

        public ChatMessageDtoBuilder messageId(Integer messageId) { this.messageId = messageId; return this; }
        public ChatMessageDtoBuilder ticketId(Integer ticketId) { this.ticketId = ticketId; return this; }
        public ChatMessageDtoBuilder senderId(Integer senderId) { this.senderId = senderId; return this; }
        public ChatMessageDtoBuilder senderRole(String senderRole) { this.senderRole = senderRole; return this; }
        public ChatMessageDtoBuilder senderName(String senderName) { this.senderName = senderName; return this; } 
        public ChatMessageDtoBuilder senderAvatar(String senderAvatar) { this.senderAvatar = senderAvatar; return this; }
        public ChatMessageDtoBuilder messageText(String messageText) { this.messageText = messageText; return this; }
        public ChatMessageDtoBuilder sentAt(LocalDateTime sentAt) { this.sentAt = sentAt; return this; }
        public ChatMessageDtoBuilder isRead(Boolean isRead) { this.isRead = isRead; return this; }
        public ChatMessageDtoBuilder attachments(List<Map<String, Object>> attachments) { this.attachments = attachments; return this; }
        public ChatMessageDtoBuilder recipientId(Integer recipientId) { this.recipientId = recipientId; return this; }

        public ChatMessageDto build() {
            return new ChatMessageDto(messageId, ticketId, senderId, senderRole, senderName, senderAvatar, messageText, sentAt, isRead, attachments, recipientId);
        }
    }
}

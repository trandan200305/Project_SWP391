package com.cny.backend.chat.controller;

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


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
public class ChatController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private SupportChatService chatService;

    @MessageMapping("/chat.send")
    public void sendMessage(@Payload ChatMessageDto chatMessage) {
        boolean shouldSendAutoReply = false;
        if (!"ADMIN".equals(chatMessage.getSenderRole())) {
            Integer ticketId = chatMessage.getTicketId();
            if (ticketId == null || ticketId == 0) {
                shouldSendAutoReply = true;
            } else {
                shouldSendAutoReply = !chatService.hasAdminReplied(ticketId);
            }
        }

        ChatMessageDto savedMessage = chatService.saveMessage(chatMessage);

        messagingTemplate.convertAndSend("/topic/ticket." + savedMessage.getTicketId(), savedMessage);

        messagingTemplate.convertAndSend("/topic/admin", savedMessage);
        if (shouldSendAutoReply) {
            ChatMessageDto autoReply = new ChatMessageDto();
            autoReply.setTicketId(savedMessage.getTicketId());
            autoReply.setSenderRole("ADMIN");
            autoReply.setSenderName("Hỗ Trợ Kỹ Thuật LancerPro");
            autoReply.setSenderAvatar("https://ui-avatars.com/api/?name=Technical+Support&background=eff6ff&color=3b82f6");
            autoReply.setMessageText("👋 Xin chào! Cảm ơn bạn đã liên hệ với bộ phận hỗ trợ.\n\nYêu cầu của bạn đã được ghi nhận 🎫\nNhân viên hỗ trợ sẽ phản hồi trong ít phút.\n\nTrong thời gian chờ, bạn có thể:\n• Mô tả chi tiết vấn đề\n• Gửi hình ảnh/video lỗi\n• Đính kèm file liên quan\n\n⏱️ Thời gian phản hồi trung bình: 5-15 phút.");

            ChatMessageDto savedAutoReply = chatService.saveAutoReply(autoReply);

            messagingTemplate.convertAndSend("/topic/ticket." + savedAutoReply.getTicketId(), savedAutoReply);

            messagingTemplate.convertAndSend("/topic/user." + savedMessage.getSenderId(), savedAutoReply);
        }
        if ("ADMIN".equals(savedMessage.getSenderRole())) {
            Map<String, Object> recipient = chatService.getTicketRecipient(savedMessage.getTicketId());
            if (recipient != null && recipient.containsKey("userId")) {
                Integer userId = (Integer) recipient.get("userId");
                messagingTemplate.convertAndSend("/topic/user." + userId, savedMessage);
            }
        }
    }
}

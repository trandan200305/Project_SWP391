package com.cny.backend.controller;

import com.cny.backend.dto.ChatMessageDto;
import com.cny.backend.service.SupportChatService;
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

    // Xử lý các tin nhắn được gửi đến đường dẫn "/app/chat.send"
    @MessageMapping("/chat.send")
    public void sendMessage(@Payload ChatMessageDto chatMessage) {
        // Kiểm tra xem admin đã trả lời ticket này chưa
        boolean shouldSendAutoReply = false;
        if (!"ADMIN".equals(chatMessage.getSenderRole())) {
            Integer ticketId = chatMessage.getTicketId();
            if (ticketId == null || ticketId == 0) {
                shouldSendAutoReply = true;
            } else {
                shouldSendAutoReply = !chatService.hasAdminReplied(ticketId);
            }
        }

        // 1. Lưu tin nhắn vào Database (sẽ tự động tạo messageId, thời gian sentAt, ticketId, và thông tin người gửi)
        ChatMessageDto savedMessage = chatService.saveMessage(chatMessage);

        // 2. Phát (Broadcast) tin nhắn đến kênh riêng của ticket này (để cả người dùng và admin đang xem chat đều nhận được)
        // Chủ đề (Topic): "/topic/ticket.{ticketId}"
        messagingTemplate.convertAndSend("/topic/ticket." + savedMessage.getTicketId(), savedMessage);

        // 3. Phát tin nhắn đến kênh chung của admin (để làm mới danh sách ticket / thông báo badge theo thời gian thực)
        // Chủ đề (Topic): "/topic/admin"
        messagingTemplate.convertAndSend("/topic/admin", savedMessage);

        // 4. Gửi tin nhắn trả lời tự động (auto-reply) nếu admin chưa từng phản hồi
        if (shouldSendAutoReply) {
            ChatMessageDto autoReply = new ChatMessageDto();
            autoReply.setTicketId(savedMessage.getTicketId());
            autoReply.setSenderRole("ADMIN");
            autoReply.setSenderName("Hỗ Trợ Kỹ Thuật LancerPro");
            autoReply.setSenderAvatar("https://ui-avatars.com/api/?name=Technical+Support&background=eff6ff&color=3b82f6");
            autoReply.setMessageText("👋 Xin chào! Cảm ơn bạn đã liên hệ với bộ phận hỗ trợ.\n\nYêu cầu của bạn đã được ghi nhận 🎫\nNhân viên hỗ trợ sẽ phản hồi trong ít phút.\n\nTrong thời gian chờ, bạn có thể:\n• Mô tả chi tiết vấn đề\n• Gửi hình ảnh/video lỗi\n• Đính kèm file liên quan\n\n⏱️ Thời gian phản hồi trung bình: 5-15 phút.");

            ChatMessageDto savedAutoReply = chatService.saveAutoReply(autoReply);

            // Phát tin nhắn trả lời tự động vào kênh của ticket đó
            messagingTemplate.convertAndSend("/topic/ticket." + savedAutoReply.getTicketId(), savedAutoReply);

            // Gửi thông báo đến kênh cá nhân của người dùng về việc có tin nhắn trả lời tự động
            messagingTemplate.convertAndSend("/topic/user." + savedMessage.getSenderId(), savedAutoReply);
        }

        // 5. Gửi thông báo đến kênh cá nhân của người dùng nếu tin nhắn vừa gửi là từ một admin (không phải tin nhắn tự động)
        // Chủ đề (Topic): "/topic/user.{userId}"
        if ("ADMIN".equals(savedMessage.getSenderRole())) {
            Map<String, Object> recipient = chatService.getTicketRecipient(savedMessage.getTicketId());
            if (recipient != null && recipient.containsKey("userId")) {
                Integer userId = (Integer) recipient.get("userId");
                messagingTemplate.convertAndSend("/topic/user." + userId, savedMessage);
            }
        }
    }
}

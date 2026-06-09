package com.cny.backend.chat.controller;

import com.cny.backend.chat.dto.ChatReadReceiptDto;
import com.cny.backend.chat.dto.DirectMessageDto;
import com.cny.backend.chat.service.DirectChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class DirectChatWebSocketController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private DirectChatService chatService;

    @MessageMapping("/direct.chat.send")
    public void sendDirectMessage(@Payload DirectMessageDto messageDto) {
        DirectMessageDto savedMessage = chatService.saveMessage(messageDto);

        // Send to the chat room topic
        messagingTemplate.convertAndSend("/topic/directChat." + savedMessage.getChatId(), savedMessage);

        // Notify the partner directly
        Integer partnerUserId = chatService.getPartnerUserId(savedMessage.getChatId(), savedMessage.getSenderRole());
        if (partnerUserId != null) {
            messagingTemplate.convertAndSend("/topic/user." + partnerUserId + ".direct", savedMessage);
        }
    }

    @MessageMapping("/direct.chat.read")
    public void readDirectReceipt(@Payload ChatReadReceiptDto readReceipt) {
        if (readReceipt.getTicketId() != null && readReceipt.getReaderRole() != null) {
            // Using ticketId field from existing Dto for chatId to reuse Dto
            chatService.markMessagesAsRead(readReceipt.getTicketId(), readReceipt.getReaderRole());
            messagingTemplate.convertAndSend("/topic/directChat." + readReceipt.getTicketId(), readReceipt);
        }
    }
}

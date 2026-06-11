package com.cny.backend.chat.controller;

import com.cny.backend.chat.dto.DirectChatDto;
import com.cny.backend.chat.dto.DirectMessageDto;
import com.cny.backend.chat.service.DirectChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/v1/direct-chats")
public class DirectChatRestController {

    @Autowired
    private DirectChatService chatService;

    @GetMapping("/get-or-create")
    public ResponseEntity<DirectChatDto> getOrCreateDirectChat(
            @RequestParam Integer freelancerId,
            @RequestParam Integer employerId) {
        DirectChatDto chat = chatService.getOrCreateChat(freelancerId, employerId);
        return ResponseEntity.ok(chat);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<DirectChatDto>> getUserChats(
            @PathVariable Integer userId,
            @RequestParam String role) {
        List<DirectChatDto> chats = chatService.getUserChats(userId, role);
        return ResponseEntity.ok(chats);
    }

    @GetMapping("/{chatId}/messages")
    public ResponseEntity<List<DirectMessageDto>> getChatMessages(@PathVariable Integer chatId) {
        List<DirectMessageDto> messages = chatService.getChatMessages(chatId);
        return ResponseEntity.ok(messages);
    }

    @PostMapping("/{chatId}/delete")
    public ResponseEntity<Void> deleteChat(
            @PathVariable Integer chatId,
            @RequestParam Integer userId,
            @RequestParam String role) {
        chatService.deleteChat(chatId, userId, role);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{chatId}/restore")
    public ResponseEntity<Void> restoreChat(
            @PathVariable Integer chatId,
            @RequestParam Integer userId,
            @RequestParam String role) {
        chatService.restoreChat(chatId, userId, role);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{chatId}/block")
    public ResponseEntity<Void> blockChat(
            @PathVariable Integer chatId,
            @RequestParam Integer userId,
            @RequestParam String role) {
        chatService.blockChat(chatId, userId, role);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{chatId}/unblock")
    public ResponseEntity<Void> unblockChat(
            @PathVariable Integer chatId,
            @RequestParam Integer userId,
            @RequestParam String role) {
        chatService.unblockChat(chatId, userId, role);
        return ResponseEntity.ok().build();
    }
}

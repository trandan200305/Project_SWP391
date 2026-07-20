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
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/chat")
@CrossOrigin(origins = "*")
public class ChatRestController {

    @Autowired
    private SupportChatService chatService;

    
    @GetMapping("/tickets/active")
    public ResponseEntity<Map<String, Object>> getActiveTicket(
            @RequestParam("userId") Integer userId,
            @RequestParam("role") String role) {
        Integer ticketId = chatService.getActiveTicketForUser(userId, role);
        Map<String, Object> response = new HashMap<>();
        response.put("ticketId", ticketId);
        return ResponseEntity.ok(response);
    }

    
    @GetMapping("/tickets/get-or-create")
    public ResponseEntity<Map<String, Object>> getOrCreateTicket(
            @RequestParam("userId") Integer userId,
            @RequestParam("role") String role) {
        Integer ticketId = chatService.getOrCreateTicket(userId, role);
        String blockedUntil = chatService.getTicketBlockedUntil(ticketId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("ticketId", ticketId);
        response.put("blockedUntil", blockedUntil);
        return ResponseEntity.ok(response);
    }

    
    @GetMapping("/tickets")
    public ResponseEntity<List<Map<String, Object>>> getOpenTickets() {
        return ResponseEntity.ok(chatService.getAllOpenTickets());
    }

    
    @GetMapping("/messages/{ticketId}")
    public ResponseEntity<List<ChatMessageDto>> getChatHistory(@PathVariable("ticketId") Integer ticketId) {
        return ResponseEntity.ok(chatService.getChatHistory(ticketId));
    }

    @GetMapping("/tickets/deleted")
    public ResponseEntity<List<Map<String, Object>>> getDeletedTickets() {
        return ResponseEntity.ok(chatService.getDeletedTickets());
    }

    @PostMapping("/tickets/{ticketId}/delete")
    public ResponseEntity<Void> deleteTicket(@PathVariable("ticketId") Integer ticketId) {
        chatService.deleteTicket(ticketId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/tickets/{ticketId}/restore")
    public ResponseEntity<Void> restoreTicket(@PathVariable("ticketId") Integer ticketId) {
        chatService.restoreTicket(ticketId);
        return ResponseEntity.ok().build();
    }

    @Autowired
    private org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    @PostMapping("/tickets/{ticketId}/block")
    public ResponseEntity<Void> blockUser(@PathVariable("ticketId") Integer ticketId, @RequestParam("days") Integer days) {
        chatService.blockUser(ticketId, days);
        
        
        ChatMessageDto sysMsg = new ChatMessageDto();
        sysMsg.setTicketId(ticketId);
        sysMsg.setSenderRole("SYSTEM");
        sysMsg.setMessageText("BLOCK_UPDATE:" + days);
        messagingTemplate.convertAndSend("/topic/ticket." + ticketId, sysMsg);
        
        return ResponseEntity.ok().build();
    }

    @PostMapping("/tickets/{ticketId}/claim")
    public ResponseEntity<Void> claimTicket(
            @PathVariable("ticketId") Integer ticketId,
            @RequestParam("staffId") Integer staffId) {
        chatService.claimTicket(ticketId, staffId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/tickets/employer/{employerId}")
    public ResponseEntity<?> getEmployerTickets(@PathVariable("employerId") Integer employerId) {
        try {
            return ResponseEntity.ok(chatService.getTicketsByEmployerId(employerId));
        } catch (Exception e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @PostMapping("/tickets/employer")
    public ResponseEntity<Map<String, Object>> createEmployerTicket(@RequestBody Map<String, Object> payload) {
        try {
            Integer employerId = payload.get("employerId") != null ? ((Number) payload.get("employerId")).intValue() : null;
            String subject = (String) payload.get("subject");
            String description = (String) payload.get("description");
            String priority = (String) payload.get("priority");
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> attachments = (List<Map<String, Object>>) payload.get("attachments");

            Integer ticketId = chatService.createEmployerTicket(employerId, subject, description, priority, attachments);
            Map<String, Object> res = new HashMap<>();
            res.put("success", true);
            res.put("ticketId", ticketId);
            res.put("message", "Tạo ticket hỗ trợ thành công. Staff sẽ tiếp nhận và xử lý.");
            return ResponseEntity.ok(res);
        } catch (IllegalArgumentException e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @PutMapping("/tickets/{ticketId}/status-employer")
    public ResponseEntity<?> updateTicketStatusByEmployer(
            @PathVariable("ticketId") Integer ticketId,
            @RequestParam("status") String status) {
        try {
            chatService.updateTicketStatusByEmployer(ticketId, status);
            return ResponseEntity.ok(Map.of("success", true, "message", "Cập nhật trạng thái ticket thành công."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}


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
        Map<String, Object> response = new HashMap<>();
        response.put("ticketId", ticketId);
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
}

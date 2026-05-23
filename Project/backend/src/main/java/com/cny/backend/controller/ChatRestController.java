package com.cny.backend.controller;

import com.cny.backend.dto.ChatMessageDto;
import com.cny.backend.service.SupportChatService;
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

    // GET /api/chat/tickets/active - Fetch active ticket ID for user
    @GetMapping("/tickets/active")
    public ResponseEntity<Map<String, Object>> getActiveTicket(
            @RequestParam("userId") Integer userId,
            @RequestParam("role") String role) {
        Integer ticketId = chatService.getActiveTicketForUser(userId, role);
        Map<String, Object> response = new HashMap<>();
        response.put("ticketId", ticketId);
        return ResponseEntity.ok(response);
    }

    // GET /api/chat/tickets/get-or-create - Get or create open ticket
    @GetMapping("/tickets/get-or-create")
    public ResponseEntity<Map<String, Object>> getOrCreateTicket(
            @RequestParam("userId") Integer userId,
            @RequestParam("role") String role) {
        Integer ticketId = chatService.getOrCreateTicket(userId, role);
        Map<String, Object> response = new HashMap<>();
        response.put("ticketId", ticketId);
        return ResponseEntity.ok(response);
    }

    // GET /api/chat/tickets - Fetch all open support tickets (for Admin view)
    @GetMapping("/tickets")
    public ResponseEntity<List<Map<String, Object>>> getOpenTickets() {
        return ResponseEntity.ok(chatService.getAllOpenTickets());
    }

    // GET /api/chat/messages/{ticketId} - Retrieve message logs for a specific ticket
    @GetMapping("/messages/{ticketId}")
    public ResponseEntity<List<ChatMessageDto>> getChatHistory(@PathVariable("ticketId") Integer ticketId) {
        return ResponseEntity.ok(chatService.getChatHistory(ticketId));
    }
}

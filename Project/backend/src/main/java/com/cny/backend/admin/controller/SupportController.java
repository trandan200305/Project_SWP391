package com.cny.backend.admin.controller;

import com.cny.backend.admin.dto.SupportTicketDto;
import com.cny.backend.admin.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/support")
@CrossOrigin(origins = "*")
public class SupportController {

    @Autowired
    private AdminService adminService;

    // ----- CUSTOMER SUPPORT (TICKETS) -----

    @GetMapping("/tickets")
    public ResponseEntity<List<SupportTicketDto>> getTickets() {
        return ResponseEntity.ok(adminService.getTickets());
    }

    @PostMapping("/tickets/{id}/reply")
    public ResponseEntity<Map<String, Object>> replyToTicket(
            @PathVariable("id") int id,
            @RequestBody Map<String, String> payload,
            @RequestHeader(value = "X-Admin-Id", required = false, defaultValue = "1") int adminId) {
        // TODO: Implement replyToTicket
        return ResponseEntity.ok(Map.of("success", true, "message", "Đã phản hồi người dùng."));
    }

    @PutMapping("/tickets/{id}/status")
    public ResponseEntity<Map<String, Object>> updateTicketStatus(
            @PathVariable("id") int id,
            @RequestParam("status") String status,
            @RequestHeader(value = "X-Admin-Id", required = false, defaultValue = "1") int adminId) {
        // TODO: Implement updateTicketStatus
        return ResponseEntity.ok(Map.of("success", true, "message", "Cập nhật trạng thái thành công."));
    }

    @PostMapping("/tickets/{id}/escalate")
    public ResponseEntity<Map<String, Object>> escalateTicket(
            @PathVariable("id") int id,
            @RequestBody Map<String, String> payload,
            @RequestHeader(value = "X-Admin-Id", required = false, defaultValue = "1") int adminId) {
        // TODO: Implement escalateTicket
        return ResponseEntity.ok(Map.of("success", true, "message", "Đã chuyển ticket lên cấp Quản lý."));
    }

    // ----- TECHNICAL SUPPORT (BUG REPORTS) -----

    @GetMapping("/bug-reports")
    public ResponseEntity<List<Object>> getBugReports() {
        return ResponseEntity.ok(adminService.getBugReports());
    }

    @PutMapping("/bug-reports/{id}/status")
    public ResponseEntity<Map<String, Object>> updateBugReportStatus(
            @PathVariable("id") int id,
            @RequestParam("status") String status,
            @RequestHeader(value = "X-Admin-Id", required = false, defaultValue = "1") int adminId) {
        return ResponseEntity.ok(adminService.updateBugReportStatus(id, status, adminId));
    }
}

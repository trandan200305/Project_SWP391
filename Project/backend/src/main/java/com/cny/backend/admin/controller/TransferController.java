package com.cny.backend.admin.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/transfers")
@CrossOrigin(origins = "*")
public class TransferController {

    @Autowired
    private com.cny.backend.admin.service.AdminService adminService;

    @GetMapping("/requests")
    public ResponseEntity<List<Object>> getTransferRequests() {
        return ResponseEntity.ok(adminService.getTransferRequests());
    }

    @PostMapping("/requests")
    public ResponseEntity<Map<String, Object>> submitTransferRequest(
            @RequestBody Map<String, Object> payload,
            @RequestHeader(value = "X-Admin-Id", required = false, defaultValue = "1") int adminId) {
        return ResponseEntity.ok(adminService.submitTransferRequest(payload, adminId));
    }

    @PutMapping("/requests/{id}/approve")
    public ResponseEntity<Map<String, Object>> approveTransferRequest(
            @PathVariable("id") int id,
            @RequestParam("status") String status,
            @RequestParam(value = "reason", required = false) String reason,
            @RequestHeader(value = "X-Admin-Id", required = false, defaultValue = "1") int adminId) {
        return ResponseEntity.ok(adminService.approveTransferRequest(id, status, reason, adminId));
    }
}

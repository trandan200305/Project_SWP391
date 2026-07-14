package com.cny.backend.admin.controller;

import com.cny.backend.admin.dto.DisputeDto;
import com.cny.backend.admin.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/disputes")
@CrossOrigin(origins = "*")
public class DisputeController {

    @Autowired
    private AdminService adminService;

    @GetMapping
    public ResponseEntity<List<DisputeDto>> getDisputes() {
        return ResponseEntity.ok(adminService.getDisputes());
    }

    @PutMapping("/{id}/resolve")
    public ResponseEntity<Map<String, Object>> resolveDispute(
            @PathVariable("id") int id,
            @RequestParam("status") String status,
            @RequestParam(value = "note", required = false) String note,
            @RequestHeader(value = "X-Admin-Id", required = false, defaultValue = "1") int adminId) {
        return ResponseEntity.ok(adminService.resolveDispute(id, status, note, adminId));
    }

    @PostMapping("/{id}/escalate")
    public ResponseEntity<Map<String, Object>> escalateDispute(
            @PathVariable("id") int id,
            @RequestBody Map<String, String> payload,
            @RequestHeader(value = "X-Admin-Id", required = false, defaultValue = "1") int adminId) {
        // TODO: Implement escalateDispute
        return ResponseEntity.ok(Map.of("success", true, "message", "Đã chuyển tranh chấp lên cấp Quản lý."));
    }
}

package com.cny.backend.admin.controller;

import com.cny.backend.admin.dto.WithdrawalDto;
import com.cny.backend.admin.entity.PaymentTransaction;
import com.cny.backend.admin.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/finance")
@CrossOrigin(origins = "*")
public class FinanceStaffController {

    @Autowired
    private AdminService adminService;


    @GetMapping("/withdrawals")
    public ResponseEntity<List<WithdrawalDto>> getWithdrawals() {
        return ResponseEntity.ok(adminService.getWithdrawals());
    }

    @PutMapping("/withdrawals/{id}/process")
    public ResponseEntity<Map<String, Object>> processWithdrawal(
            @PathVariable("id") int id,
            @RequestParam("status") String status,
            @RequestParam(value = "reason", required = false) String reason,
            @RequestHeader(value = "X-Admin-Id", required = false, defaultValue = "1") int adminId) {
        return ResponseEntity.ok(adminService.processWithdrawal(id, status, reason, adminId));
    }

}

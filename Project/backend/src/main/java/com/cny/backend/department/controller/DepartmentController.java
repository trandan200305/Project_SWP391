package com.cny.backend.department.controller;

import com.cny.backend.department.entity.Department;
import com.cny.backend.department.entity.DepartmentActivityLog;
import com.cny.backend.department.entity.DepartmentSession;
import com.cny.backend.department.entity.DepartmentTransferHistory;
import com.cny.backend.department.service.DepartmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/departments")
@CrossOrigin(origins = "*")
public class DepartmentController {

    @Autowired
    private DepartmentService departmentService;

    // GET all departments (fixed, read-only)
    @GetMapping
    public ResponseEntity<List<Department>> getAllDepartments() {
        return ResponseEntity.ok(departmentService.getAllDepartments());
    }

    // NOTE: POST create department is REMOVED — departments are fixed in the system

    // GET member counts for a department
    @GetMapping("/{id}/member-counts")
    public ResponseEntity<Map<String, Object>> getMemberCounts(@PathVariable("id") Integer id) {
        return ResponseEntity.ok(departmentService.getDepartmentMemberCounts(id));
    }

    // GET sessions for a department
    @GetMapping("/{id}/sessions")
    public ResponseEntity<List<DepartmentSession>> getSessions(@PathVariable("id") Integer id) {
        return ResponseEntity.ok(departmentService.getSessionsByDepartment(id));
    }

    // GET activity logs for a department
    @GetMapping("/{id}/logs")
    public ResponseEntity<List<DepartmentActivityLog>> getLogs(@PathVariable("id") Integer id) {
        return ResponseEntity.ok(departmentService.getLogsByDepartment(id));
    }

    // GET transfer history for a department
    @GetMapping("/{id}/transfers")
    public ResponseEntity<List<DepartmentTransferHistory>> getTransfers(@PathVariable("id") Integer id) {
        return ResponseEntity.ok(departmentService.getTransfersByDepartment(id));
    }

    // POST transfer a manager or staff to another department
    @PostMapping("/transfer")
    public ResponseEntity<?> transferUser(@RequestBody Map<String, Object> body) {
        try {
            String userType = (String) body.get("userType");
            Integer userId = (Integer) body.get("userId");
            Integer toDepartmentId = (Integer) body.get("toDepartmentId");
            Integer adminId = body.get("adminId") != null ? (Integer) body.get("adminId") : 1;
            String reason = (String) body.get("reason");

            DepartmentTransferHistory result = departmentService.transferUser(
                    userType, userId, toDepartmentId, adminId, reason);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Điều chuyển thành công.",
                    "transfer", result
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", "Lỗi hệ thống: " + e.getMessage()
            ));
        }
    }
}

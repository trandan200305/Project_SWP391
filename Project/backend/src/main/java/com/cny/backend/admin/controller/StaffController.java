package com.cny.backend.admin.controller;

import com.cny.backend.admin.entity.Staff;
import com.cny.backend.admin.repository.StaffRepository;
import com.cny.backend.admin.dto.StaffDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/staff")
@CrossOrigin(origins = "*")
public class StaffController {

    @Autowired
    private StaffRepository staffRepository;

    @GetMapping("/{id}")
    public ResponseEntity<StaffDto> getById(@PathVariable Integer id) {
        return staffRepository.findById(id).map(s -> ResponseEntity.ok(mapToDto(s))).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/profile")
    public ResponseEntity<StaffDto> updateProfile(@PathVariable Integer id, @RequestBody StaffDto updated) {
        return staffRepository.findById(id).map(s -> {
            if(updated.getDisplayName() != null) s.setDisplayName(updated.getDisplayName());
            if(updated.getFullName() != null) s.setFullName(updated.getFullName());
            if(updated.getPhone() != null) s.setPhone(updated.getPhone());
            s.setUpdatedAt(java.time.LocalDateTime.now());
            Staff saved = staffRepository.save(s);
            return ResponseEntity.ok(mapToDto(saved));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteAccount(@PathVariable Integer id, @RequestParam(required = false) String confirmationText) {
        Map<String, Object> response = new java.util.HashMap<>();
        if (confirmationText == null || !confirmationText.equals("DELETE")) {
            response.put("success", false);
            response.put("message", "Chữ xác nhận không hợp lệ. Vui lòng nhập đúng chữ 'DELETE'.");
            return ResponseEntity.badRequest().body(response);
        }
        return staffRepository.findById(id).map(s -> {
            s.setIsDeleted(true);
            s.setUpdatedAt(java.time.LocalDateTime.now());
            staffRepository.save(s);
            response.put("success", true);
            response.put("message", "Tài khoản của bạn đã được xóa vĩnh viễn.");
            return ResponseEntity.ok(response);
        }).orElseGet(() -> {
            response.put("success", false);
            response.put("message", "Không tìm thấy tài khoản để xóa.");
            return ResponseEntity.notFound().build();
        });
    }

    private StaffDto mapToDto(Staff s) {
        return StaffDto.builder()
                .staffId(s.getStaffId())
                .email(s.getEmail())
                .displayName(s.getDisplayName())
                .fullName(s.getFullName())
                .phone(s.getPhone())
                .status(s.getStatus())
                .createdAt(s.getCreatedAt() != null ? s.getCreatedAt().toString() : null)
                .updatedAt(s.getUpdatedAt() != null ? s.getUpdatedAt().toString() : null)
                .build();
    }
}

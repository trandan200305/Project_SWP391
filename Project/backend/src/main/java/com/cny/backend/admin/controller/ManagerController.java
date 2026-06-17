package com.cny.backend.admin.controller;

import com.cny.backend.admin.entity.Manager;
import com.cny.backend.admin.repository.ManagerRepository;
import com.cny.backend.admin.dto.ManagerDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/managers")
@CrossOrigin(origins = "*")
public class ManagerController {

    @Autowired
    private ManagerRepository managerRepository;

    @GetMapping("/{id}")
    public ResponseEntity<ManagerDto> getById(@PathVariable Integer id) {
        return managerRepository.findById(id).map(m -> ResponseEntity.ok(mapToDto(m))).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/profile")
    public ResponseEntity<ManagerDto> updateProfile(@PathVariable Integer id, @RequestBody ManagerDto updated) {
        return managerRepository.findById(id).map(m -> {
            if(updated.getDisplayName() != null) m.setDisplayName(updated.getDisplayName());
            if(updated.getFullName() != null) m.setFullName(updated.getFullName());
            if(updated.getPhone() != null) m.setPhone(updated.getPhone());
            m.setUpdatedAt(java.time.LocalDateTime.now());
            Manager saved = managerRepository.save(m);
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
        return managerRepository.findById(id).map(m -> {
            m.setIsDeleted(true);
            m.setUpdatedAt(java.time.LocalDateTime.now());
            managerRepository.save(m);
            response.put("success", true);
            response.put("message", "Tài khoản của bạn đã được xóa vĩnh viễn.");
            return ResponseEntity.ok(response);
        }).orElseGet(() -> {
            response.put("success", false);
            response.put("message", "Không tìm thấy tài khoản để xóa.");
            return ResponseEntity.notFound().build();
        });
    }

    private ManagerDto mapToDto(Manager m) {
        return ManagerDto.builder()
                .managerId(m.getManagerId())
                .email(m.getEmail())
                .displayName(m.getDisplayName())
                .fullName(m.getFullName())
                .phone(m.getPhone())
                .status(m.getStatus())
                .createdAt(m.getCreatedAt() != null ? m.getCreatedAt().toString() : null)
                .updatedAt(m.getUpdatedAt() != null ? m.getUpdatedAt().toString() : null)
                .build();
    }
}

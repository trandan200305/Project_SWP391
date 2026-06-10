package com.cny.backend.user.controller;

import com.cny.backend.user.entity.Employer;
import com.cny.backend.user.repository.EmployerRepository;
import com.cny.backend.user.dto.EmployerDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/employers")
@CrossOrigin(origins = "*")
public class EmployerController {

    @Autowired
    private EmployerRepository employerRepository;

    @GetMapping
    public ResponseEntity<List<EmployerDto>> getAllEmployers() {
        List<Employer> employers = employerRepository.findAll();
        List<EmployerDto> dtos = employers.stream().map(this::mapToDto).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmployerDto> getById(@PathVariable Integer id) {
        return employerRepository.findById(id)
                .map(e -> ResponseEntity.ok(mapToDto(e)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/profile")
    public ResponseEntity<EmployerDto> updateProfile(@PathVariable Integer id, @RequestBody EmployerDto updated) {
        return employerRepository.findById(id).map(e -> {
            if(updated.getDisplayName() != null) e.setDisplayName(updated.getDisplayName());
            if(updated.getFullName() != null) e.setFullName(updated.getFullName());
            if(updated.getPhone() != null) e.setPhone(updated.getPhone());
            if(updated.getCompanyName() != null) e.setCompanyName(updated.getCompanyName());
            if(updated.getCompanyDescription() != null) e.setCompanyDescription(updated.getCompanyDescription());
            if(updated.getWebsite() != null) e.setWebsite(updated.getWebsite());
            if(updated.getCompanySize() != null) e.setCompanySize(updated.getCompanySize());
            if(updated.getIndustry() != null) e.setIndustry(updated.getIndustry());
            if(updated.getAddress() != null) e.setAddress(updated.getAddress());
            if(updated.getCity() != null) e.setCity(updated.getCity());
            if(updated.getCountry() != null) e.setCountry(updated.getCountry());
            if(updated.getAvatarUrl() != null) e.setAvatarUrl(updated.getAvatarUrl());
            e.setUpdatedAt(java.time.LocalDateTime.now());
            Employer saved = employerRepository.save(e);
            return ResponseEntity.ok(mapToDto(saved));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<java.util.Map<String, Object>> deleteAccount(@PathVariable Integer id, @RequestParam(required = false) String confirmationText) {
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        if (confirmationText == null || !confirmationText.equals("DELETE")) {
            response.put("success", false);
            response.put("message", "Chữ xác nhận không hợp lệ. Vui lòng nhập đúng chữ 'DELETE'.");
            return ResponseEntity.badRequest().body(response);
        }
        return employerRepository.findById(id).map(e -> {
            e.setIsDeleted(true);
            e.setUpdatedAt(java.time.LocalDateTime.now());
            employerRepository.save(e);
            response.put("success", true);
            response.put("message", "Tài khoản của bạn đã được xóa vĩnh viễn.");
            return ResponseEntity.ok(response);
        }).orElseGet(() -> {
            response.put("success", false);
            response.put("message", "Không tìm thấy tài khoản để xóa.");
            return ResponseEntity.notFound().build();
        });
    }

    @PostMapping("/{id}/kyc/submit")
    public ResponseEntity<java.util.Map<String, Object>> submitKyc(@PathVariable Integer id, @RequestBody com.cny.backend.user.dto.KycSubmitDto dto) {
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        return employerRepository.findById(id).map(e -> {
            e.setIdCardFrontUrl(dto.getIdCardFrontUrl());
            e.setIdCardBackUrl(dto.getIdCardBackUrl());
            e.setPortraitUrl(dto.getPortraitUrl());
            e.setKycStatus("PENDING");
            e.setKycSubmittedAt(java.time.LocalDateTime.now());
            e.setUpdatedAt(java.time.LocalDateTime.now());
            
            employerRepository.save(e);
            response.put("success", true);
            response.put("message", "Đã nộp hồ sơ KYC thành công. Đang chờ duyệt.");
            return ResponseEntity.ok(response);
        }).orElseGet(() -> {
            response.put("success", false);
            response.put("message", "Không tìm thấy người dùng.");
            return ResponseEntity.notFound().build();
        });
    }

    private EmployerDto mapToDto(Employer e) {
        return EmployerDto.builder()
                .employerId(e.getEmployerId())
                .email(e.getEmail())
                .displayName(e.getDisplayName())
                .fullName(e.getFullName())
                .phone(e.getPhone())
                .avatarUrl(e.getAvatarUrl())
                .status(e.getStatus())
                .emailVerified(e.getEmailVerified())
                .companyName(e.getCompanyName())
                .companyLogoUrl(e.getCompanyLogoUrl())
                .companyDescription(e.getCompanyDescription())
                .website(e.getWebsite())
                .address(e.getAddress())
                .city(e.getCity())
                .country(e.getCountry())
                .companySize(e.getCompanySize())
                .industry(e.getIndustry())
                .profileCompleteness(e.getProfileCompleteness())
                .totalSpent(e.getTotalSpent())
                .projectsPosted(e.getProjectsPosted())
                .averageRating(e.getAverageRating())
                .createdAt(e.getCreatedAt() != null ? e.getCreatedAt().toString() : null)
                .updatedAt(e.getUpdatedAt() != null ? e.getUpdatedAt().toString() : null)
                .kycStatus(e.getKycStatus())
                .idCardFrontUrl(e.getIdCardFrontUrl())
                .idCardBackUrl(e.getIdCardBackUrl())
                .portraitUrl(e.getPortraitUrl())
                .kycSubmittedAt(e.getKycSubmittedAt() != null ? e.getKycSubmittedAt().toString() : null)
                .kycReviewedAt(e.getKycReviewedAt() != null ? e.getKycReviewedAt().toString() : null)
                .kycReviewedByStaffId(e.getKycReviewedByStaffId())
                .kycRejectedReason(e.getKycRejectedReason())
                .isVerified(e.getIsVerified())
                .build();
    }
}

package com.cny.backend.user.controller;

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
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/freelancers")
@CrossOrigin(origins = "*")
public class FreelancerController {

    @Autowired
    private FreelancerRepository freelancerRepository;

    @Autowired
    private com.cny.backend.user.service.FreelancerService freelancerService;

    @Autowired
    private com.cny.backend.user.service.PortfolioService portfolioService;

    @GetMapping
    public ResponseEntity<List<FreelancerDto>> getAllFreelancers() {
        List<Freelancer> freelancers = freelancerRepository.findByIsAvailableTrueOrderByAverageRatingDescProjectsCompletedDesc();
        List<FreelancerDto> dtos = freelancers.stream().map(this::mapToDto).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/top")
    public ResponseEntity<List<FreelancerDto>> getTopFreelancers() {
        List<Freelancer> freelancers = freelancerRepository.findTopRatedFreelancers();
        List<FreelancerDto> topFreelancers = freelancers.stream()
                .limit(4)
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(topFreelancers);
    }

    @GetMapping("/{id}")
    public ResponseEntity<FreelancerDto> getById(@PathVariable Integer id) {
        return freelancerRepository.findById(id)
                .map(f -> ResponseEntity.ok(mapToDto(f)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/profile")
    public ResponseEntity<java.util.Map<String, Object>> updateProfile(@PathVariable Integer id, @RequestBody FreelancerDto updated) {
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        boolean success = freelancerService.updateProfile(id, updated);
        if (success) {
            response.put("success", true);
            response.put("message", "Cập nhật thông tin thành công.");
            return ResponseEntity.ok(response);
        } else {
            response.put("success", false);
            response.put("message", "Không tìm thấy người dùng hoặc Email/Số điện thoại đã bị trùng lặp!");
            return ResponseEntity.badRequest().body(response);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<java.util.Map<String, Object>> deleteAccount(@PathVariable Integer id) {
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        return freelancerRepository.findById(id).map(f -> {
            f.setIsDeleted(true);
            f.setUpdatedAt(java.time.LocalDateTime.now());
            freelancerRepository.save(f);
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
    public ResponseEntity<java.util.Map<String, Object>> submitKyc(@PathVariable Integer id, @RequestBody KycSubmitDto dto) {
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        return freelancerRepository.findById(id).map(f -> {
            f.setIdCardFrontUrl(dto.getIdCardFrontUrl());
            f.setIdCardBackUrl(dto.getIdCardBackUrl());
            f.setPortraitUrl(dto.getPortraitUrl());
            f.setKycStatus("PENDING");
            f.setKycSubmittedAt(java.time.LocalDateTime.now());
            f.setUpdatedAt(java.time.LocalDateTime.now());
            
            freelancerRepository.save(f);
            response.put("success", true);
            response.put("message", "Đã nộp hồ sơ KYC thành công. Đang chờ duyệt.");
            return ResponseEntity.ok(response);
        }).orElseGet(() -> {
            response.put("success", false);
            response.put("message", "Không tìm thấy người dùng.");
            return ResponseEntity.notFound().build();
        });
    }

    private FreelancerDto mapToDto(Freelancer f) {
        return FreelancerDto.builder()
                .profileId(f.getProfileId())
                .email(f.getEmail())
                .displayName(f.getDisplayName())
                .fullName(f.getFullName())
                .phone(f.getPhone())
                .avatarUrl(f.getAvatarUrl())
                .status(f.getStatus())
                .emailVerified(f.getEmailVerified())
                .professionalTitle(f.getProfessionalTitle())
                .bio(f.getBio())
                .hourlyRate(f.getHourlyRate())
                .address(f.getAddress())
                .city(f.getCity())
                .country(f.getCountry())
                .hideEmail(f.getHideEmail())
                .hidePhone(f.getHidePhone())
                .hideLocation(f.getHideLocation())
                .profileCompleteness(f.getProfileCompleteness())
                .totalEarnings(f.getTotalEarnings())
                .projectsCompleted(f.getProjectsCompleted())
                .averageRating(f.getAverageRating())
                .isAvailable(f.getIsAvailable())
                .createdAt(f.getCreatedAt() != null ? f.getCreatedAt().toString() : null)
                .updatedAt(f.getUpdatedAt() != null ? f.getUpdatedAt().toString() : null)
                .lastLoginAt(f.getLastLoginAt() != null ? f.getLastLoginAt().toString() : null)
                .kycStatus(f.getKycStatus())
                .idCardFrontUrl(f.getIdCardFrontUrl())
                .idCardBackUrl(f.getIdCardBackUrl())
                .portraitUrl(f.getPortraitUrl())
                .kycSubmittedAt(f.getKycSubmittedAt() != null ? f.getKycSubmittedAt().toString() : null)
                .kycReviewedAt(f.getKycReviewedAt() != null ? f.getKycReviewedAt().toString() : null)
                .kycReviewedByStaffId(f.getKycReviewedByStaffId())
                .kycRejectedReason(f.getKycRejectedReason())
                .isVerified(f.getIsVerified())
                .build();
    }

    // ==========================================
    // PORTFOLIO APIs
    // ==========================================
    @GetMapping("/{id}/portfolios")
    public ResponseEntity<List<com.cny.backend.user.dto.PortfolioDto>> getPortfolios(@PathVariable Integer id) {
        return ResponseEntity.ok(portfolioService.getFreelancerPortfolios(id));
    }

    @PostMapping("/{id}/portfolios")
    public ResponseEntity<com.cny.backend.user.dto.PortfolioDto> addPortfolio(@PathVariable Integer id, @RequestBody com.cny.backend.user.dto.PortfolioDto dto) {
        return ResponseEntity.ok(portfolioService.addPortfolio(id, dto));
    }

    @PutMapping("/{id}/portfolios/{portfolioId}")
    public ResponseEntity<com.cny.backend.user.dto.PortfolioDto> updatePortfolio(
            @PathVariable Integer id, 
            @PathVariable Integer portfolioId, 
            @RequestBody com.cny.backend.user.dto.PortfolioDto dto) {
        return ResponseEntity.ok(portfolioService.updatePortfolio(id, portfolioId, dto));
    }

    @DeleteMapping("/{id}/portfolios/{portfolioId}")
    public ResponseEntity<java.util.Map<String, Object>> deletePortfolio(@PathVariable Integer id, @PathVariable Integer portfolioId) {
        portfolioService.deletePortfolio(id, portfolioId);
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("success", true);
        response.put("message", "Đã xóa Portfolio thành công.");
        return ResponseEntity.ok(response);
    }
}

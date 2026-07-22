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
import com.cny.backend.user.service.*;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/freelancers")
@CrossOrigin(origins = "*")
public class FreelancerController {

    @Autowired
    private FreelancerRepository freelancerRepository;

    @Autowired
    private FreelancerProfileRepository freelancerProfileRepository;

    @Autowired
    private FreelancerService freelancerService;

    @Autowired
    private EmployerRepository employerRepository;

    @Autowired
    private ContractRepository contractRepository;

    @Autowired
    private com.cny.backend.notification.service.NotificationService notificationService;

    @Autowired
    private com.cny.backend.project.repository.JobCategoryRepository jobCategoryRepository;

    /** Lấy danh sách tất cả freelancer (mặc định không filter) */
    @GetMapping
    public ResponseEntity<List<FreelancerDto>> getAllFreelancers(
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "experienceLevel", required = false) String experienceLevel,
            @RequestParam(value = "minRate", required = false) java.math.BigDecimal minRate,
            @RequestParam(value = "maxRate", required = false) java.math.BigDecimal maxRate,
            @RequestParam(value = "minRating", required = false) java.math.BigDecimal minRating) {
        
        List<Freelancer> freelancers = freelancerRepository.findByIsAvailableTrueOrderByAverageRatingDescProjectsCompletedDesc();
        List<FreelancerDto> dtos = freelancers.stream().map(this::mapToDto).collect(Collectors.toList());
        
        // Filter in memory
        if ((keyword != null && !keyword.trim().isEmpty()) || 
            (category != null && !category.trim().isEmpty() && !category.equalsIgnoreCase("all")) ||
            (experienceLevel != null && !experienceLevel.trim().isEmpty()) ||
            minRate != null || maxRate != null || minRating != null) {
            
            dtos = dtos.stream().filter(f -> {
                boolean matches = true;
                
                // Category match (expertiseField - list of IDs)
                if (category != null && !category.trim().isEmpty() && !category.equalsIgnoreCase("all")) {
                    String catId = category.trim();
                    String expField = f.getExpertiseField();
                    if (expField != null) {
                        java.util.List<String> ids = java.util.Arrays.asList(expField.split(",\\s*"));
                        if (!ids.contains(catId)) {
                            matches = false;
                        }
                    } else {
                        matches = false;
                    }
                }
                
                // Keyword match (name, bio, professional title, primary skills)
                if (matches && keyword != null && !keyword.trim().isEmpty()) {
                    String kwLower = keyword.trim().toLowerCase();
                    boolean nameMatch = f.getDisplayName() != null && f.getDisplayName().toLowerCase().contains(kwLower);
                    boolean fullNameMatch = f.getFullName() != null && f.getFullName().toLowerCase().contains(kwLower);
                    boolean bioMatch = f.getBio() != null && f.getBio().toLowerCase().contains(kwLower);
                    boolean titleMatch = f.getProfessionalTitle() != null && f.getProfessionalTitle().toLowerCase().contains(kwLower);
                    boolean skillsMatch = f.getPrimarySkills() != null && f.getPrimarySkills().toLowerCase().contains(kwLower);
                    
                    if (!nameMatch && !fullNameMatch && !bioMatch && !titleMatch && !skillsMatch) {
                        matches = false;
                    }
                }
                
                // Experience level match
                if (matches && experienceLevel != null && !experienceLevel.trim().isEmpty()) {
                    String expLower = experienceLevel.trim().toLowerCase();
                    String flExp = f.getExperienceLevel();
                    if (flExp == null || !flExp.toLowerCase().contains(expLower)) {
                        matches = false;
                    }
                }
                
                // Hourly rate match
                if (matches) {
                    java.math.BigDecimal rate = f.getHourlyRate();
                    if (rate != null) {
                        if (minRate != null && rate.compareTo(minRate) < 0) {
                            matches = false;
                        }
                        if (maxRate != null && rate.compareTo(maxRate) > 0) {
                            matches = false;
                        }
                    } else {
                        // if rate is null, exclude if min/max filters are active
                        if (minRate != null || maxRate != null) {
                            matches = false;
                        }
                    }
                }
                
                // Rating filter (averageRating)
                if (matches && minRating != null) {
                    java.math.BigDecimal rating = f.getAverageRating();
                    if (rating == null || rating.compareTo(minRating) < 0) {
                        matches = false;
                    }
                }
                
                return matches;
            }).collect(Collectors.toList());
        }
        
        return ResponseEntity.ok(dtos);
    }

    /** Lấy danh sách top freelancer (legacy, giới hạn 4) */
    @GetMapping("/top")
    public ResponseEntity<List<FreelancerDto>> getTopFreelancers() {
        List<Freelancer> freelancers = freelancerRepository.findTopRatedFreelancers();
        List<FreelancerDto> topFreelancers = freelancers.stream()
                .limit(4)
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(topFreelancers);
    }

    /**
     * Tìm kiếm freelancer với bộ lọc:
     * - keyword: tên hoặc professional title
     * - category: tên danh mục/chuyên môn
     * - minRate / maxRate: mức giá theo giờ
     * - minRating: đánh giá tối thiểu
     * - page, size, sort
     */
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchFreelancers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) BigDecimal minRate,
            @RequestParam(required = false) BigDecimal maxRate,
            @RequestParam(required = false) BigDecimal minRating,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "averageRating") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        String kw = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
        String cat = (category != null && !category.trim().isEmpty()) ? category.trim() : null;

        Page<Freelancer> result = freelancerRepository.searchFreelancers(kw, cat, minRate, maxRate, minRating, pageable);

        List<FreelancerDto> dtos = result.getContent().stream().map(this::mapToDto).collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("freelancers", dtos);
        response.put("currentPage", result.getNumber());
        response.put("totalPages", result.getTotalPages());
        response.put("totalElements", result.getTotalElements());
        response.put("pageSize", result.getSize());

        return ResponseEntity.ok(response);
    }

    /**
     * Lấy danh sách tất cả danh mục công việc (dùng cho dropdown filter trên UI)
     */
    @GetMapping("/categories")
    public ResponseEntity<List<Map<String, Object>>> getCategories() {
        List<Map<String, Object>> categories = jobCategoryRepository
                .findByIsActiveTrueOrderByDisplayOrderAsc()
                .stream()
                .map(c -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", c.getCategoryId());
                    m.put("name", c.getCategoryName());
                    m.put("description", c.getDescription());
                    m.put("iconUrl", c.getIconUrl());
                    return m;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(categories);
    }

    @GetMapping("/{id}")
    public ResponseEntity<FreelancerDto> getFreelancerById(@PathVariable Integer id) {
        return freelancerRepository.findById(id)
                .map(this::mapToDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/work-profile")
    public ResponseEntity<WorkProfileDto> updateWorkProfile(@PathVariable("id") Integer id, @RequestBody WorkProfileDto dto) {
        return ResponseEntity.ok(freelancerService.updateWorkProfile(id, dto));
    }

    @GetMapping("/{id}/portfolios")
    public ResponseEntity<List<PortfolioDto>> getPortfolios(@PathVariable("id") Integer id) {
        return ResponseEntity.ok(freelancerService.getPortfolios(id));
    }

    @PostMapping("/{id}/portfolios")
    public ResponseEntity<PortfolioDto> addPortfolio(@PathVariable("id") Integer id, @RequestBody PortfolioDto dto) {
        return ResponseEntity.ok(freelancerService.addPortfolio(id, dto));
    }

    @PutMapping("/portfolios/{portfolioId}")
    public ResponseEntity<PortfolioDto> updatePortfolio(@PathVariable("portfolioId") Integer portfolioId, @RequestBody PortfolioDto dto) {
        return ResponseEntity.ok(freelancerService.updatePortfolio(portfolioId, dto));
    }

    @DeleteMapping("/portfolios/{portfolioId}")
    public ResponseEntity<Void> deletePortfolio(@PathVariable("portfolioId") Integer portfolioId) {
        freelancerService.deletePortfolio(portfolioId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/profile")
    public ResponseEntity<?> updateProfile(@PathVariable Integer id, @RequestBody FreelancerDto updated) {
        return freelancerRepository.findById(id).map(f -> {
            if (updated.getPhone() != null) {
                String phone = updated.getPhone().trim();
                if (!phone.isEmpty()) {
                    if (!phone.matches("^(0[3|5|7|8|9])[0-9]{8}$")) {
                        java.util.Map<String, Object> errResponse = new java.util.HashMap<>();
                        errResponse.put("success", false);
                        errResponse.put("message", "Số điện thoại không hợp lệ (phải gồm 10 số bắt đầu bằng 03, 05, 07, 08 hoặc 09).");
                        return ResponseEntity.badRequest().body(errResponse);
                    }
                    if (freelancerRepository.countByPhoneAndProfileIdNot(phone, id) > 0 ||
                            employerRepository.countByPhone(phone) > 0) {
                        java.util.Map<String, Object> errResponse = new java.util.HashMap<>();
                        errResponse.put("success", false);
                        errResponse.put("message", "Số điện thoại này đã được sử dụng trên hệ thống. Vui lòng nhập số khác!");
                        return ResponseEntity.badRequest().body(errResponse);
                    }
                    f.setPhone(phone);
                } else {
                    f.setPhone(null);
                }
            }
            if(updated.getDisplayName() != null) f.setDisplayName(updated.getDisplayName());
            if(updated.getFullName() != null) f.setFullName(updated.getFullName());
            if(updated.getProfessionalTitle() != null) f.setProfessionalTitle(updated.getProfessionalTitle());
            if(updated.getBio() != null) f.setBio(updated.getBio());
            if(updated.getHourlyRate() != null) f.setHourlyRate(updated.getHourlyRate());
            if(updated.getAddress() != null) f.setAddress(updated.getAddress());
            if(updated.getCity() != null) f.setCity(updated.getCity());
            if(updated.getCountry() != null) f.setCountry(updated.getCountry());
            if(updated.getHideEmail() != null) f.setHideEmail(updated.getHideEmail());
            if(updated.getHidePhone() != null) f.setHidePhone(updated.getHidePhone());
            if(updated.getHideLocation() != null) f.setHideLocation(updated.getHideLocation());
            if(updated.getAvatarUrl() != null) f.setAvatarUrl(updated.getAvatarUrl());
            f.setUpdatedAt(java.time.LocalDateTime.now());
            Freelancer saved = freelancerRepository.save(f);

            // Synchronize with FreelancerProfile
            FreelancerProfile profile = freelancerProfileRepository.findByFreelancer_ProfileId(f.getProfileId())
                    .orElseGet(() -> {
                        FreelancerProfile newProfile = new FreelancerProfile();
                        newProfile.setFreelancer(f);
                        return newProfile;
                    });
            if(updated.getProfessionalTitle() != null) profile.setProfessionalTitle(updated.getProfessionalTitle());
            if(updated.getExpertiseField() != null) profile.setExpertiseField(updated.getExpertiseField());
            if(updated.getBio() != null) profile.setBio(updated.getBio());
            if(updated.getHourlyRate() != null) profile.setHourlyRate(updated.getHourlyRate());
            if(updated.getAddress() != null) profile.setAddress(updated.getAddress());
            if(updated.getCity() != null) profile.setCity(updated.getCity());
            if(updated.getCountry() != null) profile.setCountry(updated.getCountry());
            freelancerProfileRepository.save(profile);

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
            
            // Notify STAFF
            notificationService.createNotification(
                0L, // Global for staff
                "STAFF",
                "Yêu cầu xác minh danh tính KYC mới",
                "Freelancer " + (f.getFullName() != null ? f.getFullName() : f.getDisplayName()) + " vừa gửi yêu cầu xác minh danh tính.",
                "INFO",
                "KYC-FL-" + f.getProfileId()
            );

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
        FreelancerProfile profile = freelancerProfileRepository.findByFreelancer_ProfileId(f.getProfileId()).orElse(null);
        
        java.util.List<Contract> contracts = contractRepository.findByFreelancerProfileId(f.getProfileId());
        java.util.Map<String, Long> counts = new java.util.HashMap<>();
        if (contracts != null) {
            counts = contracts.stream()
                    .filter(c -> "COMPLETED".equals(c.getStatus()) && c.getProject() != null && c.getProject().getCategory() != null)
                    .collect(Collectors.groupingBy(
                            c -> c.getProject().getCategory().getCategoryName(),
                            Collectors.counting()
                    ));
        }

        return FreelancerDto.builder()
                .profileId(f.getProfileId())
                .email(f.getEmail())
                .displayName(f.getDisplayName())
                .fullName(f.getFullName())
                .phone(f.getPhone())
                .avatarUrl(f.getAvatarUrl())
                .status(f.getStatus())
                .emailVerified(f.getEmailVerified())
                .professionalTitle(profile != null && profile.getProfessionalTitle() != null ? profile.getProfessionalTitle() : f.getProfessionalTitle())
                .bio(profile != null && profile.getBio() != null ? profile.getBio() : f.getBio())
                .hourlyRate(profile != null && profile.getHourlyRate() != null ? profile.getHourlyRate() : f.getHourlyRate())
                .address(profile != null && profile.getAddress() != null ? profile.getAddress() : f.getAddress())
                .city(profile != null && profile.getCity() != null ? profile.getCity() : f.getCity())
                .country(profile != null && profile.getCountry() != null ? profile.getCountry() : f.getCountry())
                .hideEmail(f.getHideEmail())
                .hidePhone(f.getHidePhone())
                .hideLocation(f.getHideLocation())
                .profileCompleteness(profile != null && profile.getProfileCompleteness() != null ? profile.getProfileCompleteness() : f.getProfileCompleteness())
                .totalEarnings(profile != null && profile.getTotalEarnings() != null ? profile.getTotalEarnings() : f.getTotalEarnings())
                .projectsCompleted(profile != null && profile.getProjectsCompleted() != null ? profile.getProjectsCompleted() : f.getProjectsCompleted())
                .averageRating(profile != null && profile.getAverageRating() != null ? profile.getAverageRating() : f.getAverageRating())
                .isAvailable(profile != null && profile.getIsAvailable() != null ? profile.getIsAvailable() : f.getIsAvailable())
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
                .expertiseField(profile != null ? profile.getExpertiseField() : null)
                .experienceLevel(profile != null ? profile.getExperienceLevel() : null)
                .primarySkills(profile != null ? profile.getPrimarySkills() : null)
                .servicesOffered(profile != null ? profile.getServicesOffered() : null)
                .categoryProjectCounts(counts)
                .build();
    }
}

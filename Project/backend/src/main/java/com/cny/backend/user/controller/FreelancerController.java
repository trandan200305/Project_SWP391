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
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/freelancers")
@CrossOrigin(origins = "*")
public class FreelancerController {

    @Autowired
    private FreelancerRepository freelancerRepository;

    @Autowired
    private FreelancerService freelancerService;

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
    public ResponseEntity<FreelancerDto> getFreelancerById(@PathVariable Integer id) {
        return freelancerRepository.findById(id)
                .map(this::mapToDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ==========================================
    // WORK PROFILE API
    // ==========================================
    @PutMapping("/{id}/work-profile")
    public ResponseEntity<WorkProfileDto> updateWorkProfile(@PathVariable("id") Integer id, @RequestBody WorkProfileDto dto) {
        return ResponseEntity.ok(freelancerService.updateWorkProfile(id, dto));
    }

    // ==========================================
    // PORTFOLIO API
    // ==========================================
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
                .profileCompleteness(f.getProfileCompleteness())
                .totalEarnings(f.getTotalEarnings())
                .projectsCompleted(f.getProjectsCompleted())
                .averageRating(f.getAverageRating())
                .isAvailable(f.getIsAvailable())
                .createdAt(f.getCreatedAt() != null ? f.getCreatedAt().toString() : null)
                .updatedAt(f.getUpdatedAt() != null ? f.getUpdatedAt().toString() : null)
                .build();
    }
}

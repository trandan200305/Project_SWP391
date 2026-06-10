package com.cny.backend.user.service;

import com.cny.backend.user.dto.PortfolioDto;
import com.cny.backend.user.dto.WorkProfileDto;
import com.cny.backend.user.entity.Freelancer;
import com.cny.backend.user.entity.FreelancerPortfolio;
import com.cny.backend.user.entity.FreelancerProfile;
import com.cny.backend.user.repository.FreelancerPortfolioRepository;
import com.cny.backend.user.repository.FreelancerProfileRepository;
import com.cny.backend.user.repository.FreelancerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class FreelancerService {

    @Autowired
    private FreelancerProfileRepository profileRepository;

    @Autowired
    private FreelancerRepository freelancerRepository;

    @Autowired
    private FreelancerPortfolioRepository portfolioRepository;

    @Transactional
    public WorkProfileDto updateWorkProfile(Integer freelancerId, WorkProfileDto dto) {
        FreelancerProfile profile = profileRepository.findByFreelancerProfileId(freelancerId)
                .orElseThrow(() -> new RuntimeException("Freelancer profile not found"));

        profile.setProfessionalTitle(dto.getProfessionalTitle());
        profile.setBio(dto.getBio());
        profile.setPersonalWebsite(dto.getPersonalWebsite());
        profile.setExpertiseField(dto.getExpertiseField());
        profile.setExperienceLevel(dto.getExperienceLevel());
        profile.setPrimarySkills(dto.getPrimarySkills());
        profile.setServicesOffered(dto.getServicesOffered());
        profile.setAvailabilityType(dto.getAvailabilityType());
        profile.setIsAvailable(dto.getIsAvailable() != null ? dto.getIsAvailable() : true);

        profile = profileRepository.save(profile);

        return mapToWorkProfileDto(profile);
    }

    public List<PortfolioDto> getPortfolios(Integer freelancerId) {
        List<FreelancerPortfolio> portfolios = portfolioRepository.findByFreelancer_ProfileIdOrderByCreatedAtDesc(freelancerId);
        return portfolios.stream().map(this::mapToPortfolioDto).collect(Collectors.toList());
    }

    @Transactional
    public PortfolioDto addPortfolio(Integer freelancerId, PortfolioDto dto) {
        Freelancer freelancer = freelancerRepository.findById(freelancerId)
                .orElseThrow(() -> new RuntimeException("Freelancer not found"));

        FreelancerPortfolio portfolio = FreelancerPortfolio.builder()
                .freelancer(freelancer)
                .title(dto.getTitle())
                .attachmentUrl(dto.getAttachmentUrl())
                .description(dto.getDescription())
                .relatedService(dto.getRelatedService())
                .productLink(dto.getProductLink())
                .build();

        portfolio = portfolioRepository.save(portfolio);
        return mapToPortfolioDto(portfolio);
    }

    @Transactional
    public PortfolioDto updatePortfolio(Integer portfolioId, PortfolioDto dto) {
        FreelancerPortfolio portfolio = portfolioRepository.findById(portfolioId)
                .orElseThrow(() -> new RuntimeException("Portfolio not found"));

        portfolio.setTitle(dto.getTitle());
        portfolio.setAttachmentUrl(dto.getAttachmentUrl());
        portfolio.setDescription(dto.getDescription());
        portfolio.setRelatedService(dto.getRelatedService());
        portfolio.setProductLink(dto.getProductLink());

        portfolio = portfolioRepository.save(portfolio);
        return mapToPortfolioDto(portfolio);
    }

    @Transactional
    public void deletePortfolio(Integer portfolioId) {
        portfolioRepository.deleteById(portfolioId);
    }

    private WorkProfileDto mapToWorkProfileDto(FreelancerProfile profile) {
        return WorkProfileDto.builder()
                .professionalTitle(profile.getProfessionalTitle())
                .bio(profile.getBio())
                .personalWebsite(profile.getPersonalWebsite())
                .expertiseField(profile.getExpertiseField())
                .experienceLevel(profile.getExperienceLevel())
                .primarySkills(profile.getPrimarySkills())
                .servicesOffered(profile.getServicesOffered())
                .availabilityType(profile.getAvailabilityType())
                .isAvailable(profile.getIsAvailable())
                .build();
    }

    private PortfolioDto mapToPortfolioDto(FreelancerPortfolio portfolio) {
        return PortfolioDto.builder()
                .portfolioId(portfolio.getPortfolioId())
                .freelancerId(portfolio.getFreelancer().getProfileId())
                .title(portfolio.getTitle())
                .attachmentUrl(portfolio.getAttachmentUrl())
                .description(portfolio.getDescription())
                .relatedService(portfolio.getRelatedService())
                .productLink(portfolio.getProductLink())
                .createdAt(portfolio.getCreatedAt())
                .updatedAt(portfolio.getUpdatedAt())
                .build();
    }
}

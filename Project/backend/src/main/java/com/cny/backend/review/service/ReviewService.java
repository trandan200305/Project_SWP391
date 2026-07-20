package com.cny.backend.review.service;

import com.cny.backend.project.entity.Contract;
import com.cny.backend.project.repository.ContractRepository;
import com.cny.backend.review.dto.ReviewDto;
import com.cny.backend.review.dto.ReviewRequestDto;
import com.cny.backend.review.entity.Review;
import com.cny.backend.review.repository.ReviewRepository;
import com.cny.backend.user.entity.Employer;
import com.cny.backend.user.entity.Freelancer;
import com.cny.backend.user.entity.FreelancerProfile;
import com.cny.backend.user.repository.EmployerRepository;
import com.cny.backend.user.repository.FreelancerProfileRepository;
import com.cny.backend.user.repository.FreelancerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Service("generalReviewService")
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ContractRepository contractRepository;
    private final FreelancerRepository freelancerRepository;
    private final FreelancerProfileRepository freelancerProfileRepository;
    private final EmployerRepository employerRepository;

    public ReviewService(
            ReviewRepository reviewRepository,
            ContractRepository contractRepository,
            FreelancerRepository freelancerRepository,
            FreelancerProfileRepository freelancerProfileRepository,
            EmployerRepository employerRepository) {
        this.reviewRepository = reviewRepository;
        this.contractRepository = contractRepository;
        this.freelancerRepository = freelancerRepository;
        this.freelancerProfileRepository = freelancerProfileRepository;
        this.employerRepository = employerRepository;
    }

    @Transactional
    public ReviewDto submitEmployerReview(Integer contractId, Integer employerId, ReviewRequestDto dto) {
        Contract contract = getCompletedContract(contractId);
        if (!contract.getClient().getEmployerId().equals(employerId)) {
            throw new IllegalArgumentException("Employer does not own this contract.");
        }
        reviewRepository.findByContractContractIdAndReviewerEmployerEmployerId(contractId, employerId)
                .ifPresent(review -> {
                    throw new IllegalArgumentException("Employer has already reviewed this contract.");
                });

        Employer reviewer = contract.getClient();
        Freelancer reviewee = contract.getFreelancer();
        Review review = Review.builder()
                .contract(contract)
                .reviewerEmployer(reviewer)
                .revieweeFreelancer(reviewee)
                .rating(toRating(dto.getRating()))
                .comment(normalizeComment(dto.getComment()))
                .build();

        Review saved = reviewRepository.save(review);
        updateFreelancerRating(reviewee);
        return mapToDto(saved);
    }

    @Transactional
    public ReviewDto submitFreelancerReview(Integer contractId, Integer freelancerId, ReviewRequestDto dto) {
        Contract contract = getCompletedContract(contractId);
        if (!contract.getFreelancer().getProfileId().equals(freelancerId)) {
            throw new IllegalArgumentException("Freelancer does not own this contract.");
        }
        reviewRepository.findByContractContractIdAndReviewerFreelancerProfileId(contractId, freelancerId)
                .ifPresent(review -> {
                    throw new IllegalArgumentException("Freelancer has already reviewed this contract.");
                });

        Freelancer reviewer = contract.getFreelancer();
        Employer reviewee = contract.getClient();
        Review review = Review.builder()
                .contract(contract)
                .reviewerFreelancer(reviewer)
                .revieweeEmployer(reviewee)
                .rating(toRating(dto.getRating()))
                .comment(normalizeComment(dto.getComment()))
                .build();

        Review saved = reviewRepository.save(review);
        updateEmployerRating(reviewee);
        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public List<ReviewDto> getReviewsByContract(Integer contractId) {
        if (!contractRepository.existsById(contractId)) {
            throw new IllegalArgumentException("Contract not found.");
        }
        return reviewRepository.findByContractContractIdOrderByCreatedAtAsc(contractId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ReviewDto> getReviewsForFreelancer(Integer freelancerId) {
        return reviewRepository.findByRevieweeFreelancerProfileId(freelancerId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private Contract getCompletedContract(Integer contractId) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new IllegalArgumentException("Contract not found."));
        if (!"COMPLETED".equals(contract.getStatus())) {
            throw new IllegalArgumentException("Reviews can only be submitted after the contract is completed.");
        }
        return contract;
    }

    private BigDecimal toRating(Double rating) {
        if (rating == null || rating < 1 || rating > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5.");
        }
        return BigDecimal.valueOf(rating).setScale(2, RoundingMode.HALF_UP);
    }

    private String normalizeComment(String comment) {
        if (comment == null) {
            return null;
        }
        String trimmed = comment.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private void updateFreelancerRating(Freelancer freelancer) {
        BigDecimal average = calculateAverageRating(reviewRepository.findByRevieweeFreelancerProfileId(freelancer.getProfileId()));
        freelancer.setAverageRating(average);
        freelancer.setProjectsCompleted((freelancer.getProjectsCompleted() == null ? 0 : freelancer.getProjectsCompleted()) + 1);
        freelancerRepository.save(freelancer);

        freelancerProfileRepository.findByFreelancer_ProfileId(freelancer.getProfileId()).ifPresent(profile -> {
            profile.setAverageRating(average);
            profile.setProjectsCompleted((profile.getProjectsCompleted() == null ? 0 : profile.getProjectsCompleted()) + 1);
            freelancerProfileRepository.save(profile);
        });
    }

    private void updateEmployerRating(Employer employer) {
        BigDecimal average = calculateAverageRating(reviewRepository.findByRevieweeEmployerEmployerId(employer.getEmployerId()));
        employer.setAverageRating(average);
        employerRepository.save(employer);
    }

    private BigDecimal calculateAverageRating(List<Review> reviews) {
        if (reviews.isEmpty()) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        BigDecimal total = reviews.stream()
                .map(Review::getRating)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return total.divide(BigDecimal.valueOf(reviews.size()), 2, RoundingMode.HALF_UP);
    }

    private ReviewDto mapToDto(Review review) {
        Freelancer reviewerFreelancer = review.getReviewerFreelancer();
        Employer reviewerEmployer = review.getReviewerEmployer();
        Freelancer revieweeFreelancer = review.getRevieweeFreelancer();
        Employer revieweeEmployer = review.getRevieweeEmployer();

        return ReviewDto.builder()
                .reviewId(review.getReviewId())
                .contractId(review.getContract().getContractId())
                .reviewerId(reviewerFreelancer != null ? reviewerFreelancer.getProfileId() : reviewerEmployer.getEmployerId())
                .reviewerType(reviewerFreelancer != null ? "FREELANCER" : "EMPLOYER")
                .reviewerName(reviewerFreelancer != null ? getFreelancerName(reviewerFreelancer) : getEmployerName(reviewerEmployer))
                .reviewerAvatar(reviewerFreelancer != null ? reviewerFreelancer.getAvatarUrl() : reviewerEmployer.getAvatarUrl())
                .revieweeId(revieweeFreelancer != null ? revieweeFreelancer.getProfileId() : revieweeEmployer.getEmployerId())
                .revieweeType(revieweeFreelancer != null ? "FREELANCER" : "EMPLOYER")
                .revieweeName(revieweeFreelancer != null ? getFreelancerName(revieweeFreelancer) : getEmployerName(revieweeEmployer))
                .revieweeAvatar(revieweeFreelancer != null ? revieweeFreelancer.getAvatarUrl() : revieweeEmployer.getAvatarUrl())
                .rating(review.getRating())
                .comment(review.getComment())
                .contractTitle(review.getContract().getTitle())
                .createdAt(review.getCreatedAt())
                .build();
    }

    private String getFreelancerName(Freelancer freelancer) {
        if (freelancer.getDisplayName() != null && !freelancer.getDisplayName().isBlank()) {
            return freelancer.getDisplayName();
        }
        if (freelancer.getFullName() != null && !freelancer.getFullName().isBlank()) {
            return freelancer.getFullName();
        }
        return "Freelancer";
    }

    private String getEmployerName(Employer employer) {
        if (employer.getCompanyName() != null && !employer.getCompanyName().isBlank()) {
            return employer.getCompanyName();
        }
        if (employer.getDisplayName() != null && !employer.getDisplayName().isBlank()) {
            return employer.getDisplayName();
        }
        if (employer.getFullName() != null && !employer.getFullName().isBlank()) {
            return employer.getFullName();
        }
        return "Employer";
    }
}

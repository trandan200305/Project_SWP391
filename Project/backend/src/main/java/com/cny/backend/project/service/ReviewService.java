package com.cny.backend.project.service;

import com.cny.backend.project.dto.ReviewCreateDto;
import com.cny.backend.project.dto.ReviewDto;
import com.cny.backend.project.entity.Contract;
import com.cny.backend.project.entity.Review;
import com.cny.backend.project.repository.ContractRepository;
import com.cny.backend.project.repository.ReviewRepository;
import com.cny.backend.user.entity.Employer;
import com.cny.backend.user.entity.Freelancer;
import com.cny.backend.user.repository.EmployerRepository;
import com.cny.backend.user.repository.FreelancerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service("projectReviewService")
public class ReviewService {

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private ContractRepository contractRepository;

    @Autowired
    private FreelancerRepository freelancerRepository;

    @Autowired
    private EmployerRepository employerRepository;

    @Transactional
    public ReviewDto writeReviewForEmployer(Integer contractId, Integer freelancerId, ReviewCreateDto dto) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hợp đồng ID: " + contractId));

        if (!contract.getFreelancer().getProfileId().equals(freelancerId)) {
            throw new IllegalArgumentException("Bạn không có quyền viết đánh giá cho hợp đồng này.");
        }

        if (!"COMPLETED".equals(contract.getStatus()) && !"CLOSED".equals(contract.getStatus())) {
            throw new IllegalArgumentException("Chỉ có thể viết đánh giá sau khi hợp đồng đã hoàn thành.");
        }

        // Kiểm tra xem đã đánh giá chưa
        List<Review> existingReviews = reviewRepository.findByContractContractId(contractId);
        for (Review r : existingReviews) {
            if (r.getReviewerFreelancer() != null && r.getReviewerFreelancer().getProfileId().equals(freelancerId)) {
                throw new IllegalArgumentException("Bạn đã gửi đánh giá cho khách hàng này thuộc hợp đồng này rồi.");
            }
        }

        if (dto.getRating() == null || dto.getRating().compareTo(BigDecimal.ONE) < 0 || dto.getRating().compareTo(BigDecimal.valueOf(5)) > 0) {
            throw new IllegalArgumentException("Điểm đánh giá phải từ 1 đến 5 sao.");
        }

        Review review = Review.builder()
                .contract(contract)
                .reviewerFreelancer(contract.getFreelancer())
                .revieweeEmployer(contract.getClient())
                .rating(dto.getRating())
                .comment(dto.getComment())
                .build();

        Review saved = reviewRepository.save(review);
        
        // Cập nhật điểm đánh giá trung bình của Employer
        Employer employer = contract.getClient();
        List<Review> empReviews = reviewRepository.findAll().stream()
                .filter(r -> r.getRevieweeEmployer() != null && r.getRevieweeEmployer().getEmployerId().equals(employer.getEmployerId()))
                .collect(Collectors.toList());
        
        double sum = empReviews.stream().mapToDouble(r -> r.getRating().doubleValue()).sum();
        employer.setAverageRating(BigDecimal.valueOf(sum / empReviews.size()));
        employerRepository.save(employer);

        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public List<ReviewDto> getFreelancerReviews(Integer freelancerId) {
        return reviewRepository.findByRevieweeFreelancerProfileId(freelancerId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ReviewDto> getContractReviews(Integer contractId) {
        return reviewRepository.findByContractContractId(contractId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private ReviewDto mapToDto(Review review) {
        Integer reviewerFreelancerId = null;
        String reviewerFreelancerName = null;
        String reviewerFreelancerAvatar = null;
        if (review.getReviewerFreelancer() != null) {
            reviewerFreelancerId = review.getReviewerFreelancer().getProfileId();
            String dispName = review.getReviewerFreelancer().getDisplayName();
            String fullName = review.getReviewerFreelancer().getFullName();
            reviewerFreelancerName = dispName != null ? dispName : (fullName != null ? fullName : "Freelancer");
            reviewerFreelancerAvatar = review.getReviewerFreelancer().getAvatarUrl();
        }

        Integer reviewerEmployerId = null;
        String reviewerEmployerName = null;
        String reviewerEmployerAvatar = null;
        if (review.getReviewerEmployer() != null) {
            reviewerEmployerId = review.getReviewerEmployer().getEmployerId();
            String compName = review.getReviewerEmployer().getCompanyName();
            String fullName = review.getReviewerEmployer().getFullName();
            reviewerEmployerName = compName != null ? compName : (fullName != null ? fullName : "Employer");
            reviewerEmployerAvatar = review.getReviewerEmployer().getAvatarUrl();
        }

        return ReviewDto.builder()
                .reviewId(review.getReviewId())
                .contractId(review.getContract().getContractId())
                .reviewerFreelancerId(reviewerFreelancerId)
                .reviewerFreelancerName(reviewerFreelancerName)
                .reviewerFreelancerAvatar(reviewerFreelancerAvatar)
                .reviewerEmployerId(reviewerEmployerId)
                .reviewerEmployerName(reviewerEmployerName)
                .reviewerEmployerAvatar(reviewerEmployerAvatar)
                .revieweeFreelancerId(review.getRevieweeFreelancer() != null ? review.getRevieweeFreelancer().getProfileId() : null)
                .revieweeEmployerId(review.getRevieweeEmployer() != null ? review.getRevieweeEmployer().getEmployerId() : null)
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .build();
    }
}

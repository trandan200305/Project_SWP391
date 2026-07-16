package com.cny.backend.review.repository;

import com.cny.backend.review.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Integer> {
    List<Review> findByContractContractIdOrderByCreatedAtAsc(Integer contractId);

    Optional<Review> findByContractContractIdAndReviewerEmployerEmployerId(Integer contractId, Integer employerId);

    Optional<Review> findByContractContractIdAndReviewerFreelancerProfileId(Integer contractId, Integer freelancerId);

    List<Review> findByRevieweeFreelancerProfileId(Integer freelancerId);

    List<Review> findByRevieweeEmployerEmployerId(Integer employerId);
}

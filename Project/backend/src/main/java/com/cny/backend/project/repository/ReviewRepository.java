package com.cny.backend.project.repository;

import com.cny.backend.project.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Integer> {
    List<Review> findByRevieweeFreelancerProfileId(Integer freelancerId);
    List<Review> findByContractContractId(Integer contractId);
}

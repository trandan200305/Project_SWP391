package com.cny.backend.user.repository;

import com.cny.backend.user.entity.FreelancerPortfolio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FreelancerPortfolioRepository extends JpaRepository<FreelancerPortfolio, Integer> {
    List<FreelancerPortfolio> findByFreelancer_ProfileIdOrderByCreatedAtDesc(Integer freelancerId);
}

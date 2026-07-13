package com.cny.backend.user.repository;

import com.cny.backend.user.entity.Portfolio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PortfolioRepository extends JpaRepository<Portfolio, Integer> {
    List<Portfolio> findByFreelancer_ProfileId(Integer profileId);
}

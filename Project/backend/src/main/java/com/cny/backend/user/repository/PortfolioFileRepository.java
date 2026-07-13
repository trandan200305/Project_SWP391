package com.cny.backend.user.repository;

import com.cny.backend.user.entity.PortfolioFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PortfolioFileRepository extends JpaRepository<PortfolioFile, Integer> {
    List<PortfolioFile> findByPortfolio_PortfolioId(Integer portfolioId);
}

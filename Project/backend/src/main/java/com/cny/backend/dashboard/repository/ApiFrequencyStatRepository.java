package com.cny.backend.dashboard.repository;

import com.cny.backend.dashboard.entity.ApiFrequencyStat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ApiFrequencyStatRepository extends JpaRepository<ApiFrequencyStat, Long> {
    java.util.List<ApiFrequencyStat> findByPath(String path);
}

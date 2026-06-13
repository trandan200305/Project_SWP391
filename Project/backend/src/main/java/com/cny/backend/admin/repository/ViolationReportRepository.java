package com.cny.backend.admin.repository;

import com.cny.backend.admin.entity.ViolationReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ViolationReportRepository extends JpaRepository<ViolationReport, Integer> {
}

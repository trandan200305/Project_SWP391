package com.cny.backend.admin.repository;

import com.cny.backend.admin.entity.BugReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BugReportRepository extends JpaRepository<BugReport, Integer> {
    List<BugReport> findByStatus(String status);
    List<BugReport> findByAssignedTo(Integer assignedTo);
}

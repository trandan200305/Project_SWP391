package com.cny.backend.department.repository;

import com.cny.backend.department.entity.DepartmentActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DepartmentActivityLogRepository extends JpaRepository<DepartmentActivityLog, Integer> {
    List<DepartmentActivityLog> findByDepartmentId(Integer departmentId);
    List<DepartmentActivityLog> findBySessionId(Integer sessionId);
}

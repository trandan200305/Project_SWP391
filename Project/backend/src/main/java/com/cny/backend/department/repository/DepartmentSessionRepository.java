package com.cny.backend.department.repository;

import com.cny.backend.department.entity.DepartmentSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DepartmentSessionRepository extends JpaRepository<DepartmentSession, Integer> {
    List<DepartmentSession> findByDepartmentId(Integer departmentId);
    List<DepartmentSession> findByUserIdAndUserRole(Integer userId, String userRole);
    Optional<DepartmentSession> findFirstByUserIdAndUserRoleAndStatusOrderByLoginAtDesc(Integer userId, String userRole, String status);
}

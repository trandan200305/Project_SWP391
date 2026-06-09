package com.cny.backend.department.repository;

import com.cny.backend.department.entity.DepartmentTransferHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DepartmentTransferHistoryRepository extends JpaRepository<DepartmentTransferHistory, Integer> {
    List<DepartmentTransferHistory> findByUserTypeAndUserIdOrderByTransferredAtDesc(String userType, Integer userId);
    List<DepartmentTransferHistory> findByFromDepartmentDepartmentIdOrToDepartmentDepartmentIdOrderByTransferredAtDesc(Integer fromId, Integer toId);
}

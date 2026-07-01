package com.cny.backend.department.repository;

import com.cny.backend.department.entity.DepartmentTransferRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DepartmentTransferRequestRepository extends JpaRepository<DepartmentTransferRequest, Integer> {
    List<DepartmentTransferRequest> findByUserIdAndUserType(Integer userId, String userType);
    List<DepartmentTransferRequest> findByStatus(String status);
}

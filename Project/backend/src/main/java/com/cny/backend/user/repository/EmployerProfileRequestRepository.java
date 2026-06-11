package com.cny.backend.user.repository;

import com.cny.backend.user.entity.EmployerProfileRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EmployerProfileRequestRepository extends JpaRepository<EmployerProfileRequest, Integer> {
    List<EmployerProfileRequest> findByEmployerEmployerIdOrderByCreatedAtDesc(Integer employerId);
    List<EmployerProfileRequest> findByStatusOrderByCreatedAtDesc(String status);
}

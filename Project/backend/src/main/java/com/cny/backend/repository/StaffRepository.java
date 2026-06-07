package com.cny.backend.repository;

import com.cny.backend.entity.Staff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface StaffRepository extends JpaRepository<Staff, Integer> {
    Optional<Staff> findByEmail(String email);
    long countByEmail(String email);
    long countByPhone(String phone);
    long countByDisplayName(String displayName);
    List<Staff> findByManager_ManagerId(Integer managerId);
}

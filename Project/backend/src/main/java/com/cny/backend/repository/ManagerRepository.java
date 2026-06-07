package com.cny.backend.repository;

import com.cny.backend.entity.Manager;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ManagerRepository extends JpaRepository<Manager, Integer> {
    Optional<Manager> findByEmail(String email);
    long countByEmail(String email);
    long countByPhone(String phone);
    long countByDisplayName(String displayName);
}

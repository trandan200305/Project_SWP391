package com.cny.backend.repository;

import com.cny.backend.entity.Admin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface AdminRepository extends JpaRepository<Admin, Integer> {
    Optional<Admin> findByEmail(String email);
    int countByEmail(String email);
    int countByPhone(String phone);
    int countByDisplayName(String displayName);
}

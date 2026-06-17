package com.cny.backend.admin.repository;

import com.cny.backend.admin.entity.VnpayConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface VnpayConfigRepository extends JpaRepository<VnpayConfig, Integer> {
    Optional<VnpayConfig> findFirstByIsActiveTrueOrderByIdDesc();
}

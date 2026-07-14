package com.cny.backend.admin.repository;

import com.cny.backend.admin.entity.ServicePackageConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ServicePackageConfigRepository extends JpaRepository<ServicePackageConfig, Integer> {
    Optional<ServicePackageConfig> findByPackageType(String packageType);
}

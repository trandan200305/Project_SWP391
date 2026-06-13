package com.cny.backend.admin.repository;

import com.cny.backend.admin.entity.WarningTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WarningTemplateRepository extends JpaRepository<WarningTemplate, Integer> {
    List<WarningTemplate> findByIsActiveTrue();
}

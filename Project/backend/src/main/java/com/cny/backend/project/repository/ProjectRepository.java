package com.cny.backend.project.repository;

import com.cny.backend.auth.entity.*;
import com.cny.backend.admin.entity.*;
import com.cny.backend.project.entity.*;
import com.cny.backend.user.entity.*;
import com.cny.backend.auth.repository.*;
import com.cny.backend.admin.repository.*;
import com.cny.backend.project.repository.*;
import com.cny.backend.user.repository.*;
import com.cny.backend.admin.dto.*;
import com.cny.backend.chat.dto.*;
import com.cny.backend.project.dto.*;
import com.cny.backend.user.dto.*;
import com.cny.backend.auth.service.*;
import com.cny.backend.admin.service.*;
import com.cny.backend.chat.service.*;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Integer> {
    Page<Project> findByIsDeletedFalseAndStatusOrderByCreatedAtDesc(String status, Pageable pageable);
    
    @Query("SELECT p FROM Project p WHERE p.isDeleted = false AND p.status = :status " +
           "AND (LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(p.category.categoryName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(p.client.companyName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(p.client.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(p.client.displayName) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Project> searchProjectsByKeyword(@Param("status") String status, @Param("keyword") String keyword, Pageable pageable);
    
    List<Project> findByClientEmployerIdAndIsDeletedFalse(Integer employerId);
    
    int countByCategoryCategoryIdAndStatusAndIsDeletedFalse(Integer categoryId, String status);
}

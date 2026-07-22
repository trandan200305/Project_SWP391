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
    List<Project> findByIsDeletedFalseAndStatusOrderByCreatedAtDesc(String status);

    @Query("SELECT p FROM Project p WHERE p.isDeleted = false AND p.status = :status " +
           "AND (LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(p.category.categoryName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR EXISTS (SELECT ps FROM ProjectSkill ps WHERE ps.project = p AND LOWER(ps.skill.skillName) LIKE LOWER(CONCAT('%', :keyword, '%'))))")
    List<Project> searchProjectsByKeyword(@Param("status") String status, @Param("keyword") String keyword);

    @Query("SELECT p FROM Project p WHERE p.isDeleted = false AND p.status = :status " +
           "AND (LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(p.category.categoryName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR EXISTS (SELECT ps FROM ProjectSkill ps WHERE ps.project = p AND LOWER(ps.skill.skillName) LIKE LOWER(CONCAT('%', :keyword, '%'))))")
    Page<Project> searchProjectsByKeyword(@Param("status") String status, @Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT p FROM Project p WHERE p.isDeleted = false AND p.status = :status " +
           "AND (:categoryId IS NULL OR p.category.categoryId = :categoryId) " +
           "AND (:workForm IS NULL OR p.workForm = :workForm) " +
           "AND (:projectType IS NULL OR p.projectType = :projectType) " +
           "AND (:minSalary IS NULL OR " +
           "    (p.budgetMax IS NOT NULL AND p.budgetMax >= :minSalary) OR " +
           "    (p.budgetFixed IS NOT NULL AND p.budgetFixed >= :minSalary) OR " +
           "    (p.budgetMax IS NULL AND p.budgetFixed IS NULL AND p.budgetMin IS NOT NULL AND p.budgetMin >= :minSalary)" +
           ") " +
           "AND (:maxSalary IS NULL OR " +
           "    (p.budgetMin IS NOT NULL AND p.budgetMin <= :maxSalary) OR " +
           "    (p.budgetFixed IS NOT NULL AND p.budgetFixed <= :maxSalary) OR " +
           "    (p.budgetMin IS NULL AND p.budgetFixed IS NULL AND p.budgetMax IS NOT NULL AND p.budgetMax <= :maxSalary)" +
           ") " +
           "AND (:skillIds IS NULL OR EXISTS (SELECT s FROM p.skills s WHERE s.skillId IN :skillIds)) " +
           "AND (LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(p.category.categoryName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(p.client.companyName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(p.client.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(p.client.displayName) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Project> searchProjectsByFilters(
            @Param("status") String status, 
            @Param("keyword") String keyword, 
            @Param("categoryId") Integer categoryId, 
            @Param("workForm") String workForm, 
            @Param("projectType") String projectType, 
            @Param("minSalary") java.math.BigDecimal minSalary, 
            @Param("maxSalary") java.math.BigDecimal maxSalary, 
            @Param("skillIds") List<Integer> skillIds, 
            Pageable pageable);

    @Query(value = "SELECT DISTINCT work_form FROM projects WHERE work_form IS NOT NULL", nativeQuery = true)
    List<String> findDistinctWorkForms();

    @Query(value = "SELECT DISTINCT project_type FROM projects WHERE project_type IS NOT NULL", nativeQuery = true)
    List<String> findDistinctProjectTypes();

    @Query("SELECT p FROM Project p WHERE p.isDeleted = false AND p.status = :status " +
           "AND (:categoryId IS NULL OR p.category.categoryId = :categoryId) " +
           "AND (:minSalary IS NULL OR " +
           "    (p.budgetMax IS NOT NULL AND p.budgetMax >= :minSalary) OR " +
           "    (p.budgetFixed IS NOT NULL AND p.budgetFixed >= :minSalary) OR " +
           "    (p.budgetMax IS NULL AND p.budgetFixed IS NULL AND p.budgetMin IS NOT NULL AND p.budgetMin >= :minSalary)" +
           ") " +
           "AND (LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(p.category.categoryName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(p.client.companyName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(p.client.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(p.client.displayName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR EXISTS (SELECT ps FROM ProjectSkill ps WHERE ps.project = p AND LOWER(ps.skill.skillName) LIKE LOWER(CONCAT('%', :keyword, '%'))))")
    Page<Project> searchProjectsByKeywordAndCategory(@Param("status") String status, @Param("keyword") String keyword, @Param("categoryId") Integer categoryId, @Param("minSalary") java.math.BigDecimal minSalary, Pageable pageable);
    
    List<Project> findByClientEmployerIdAndIsDeletedFalse(Integer employerId);
    
    @Query("SELECT p FROM Project p WHERE p.client.employerId = :employerId AND p.isDeleted = false " +
           "AND (:status IS NULL OR :status = 'ALL' OR p.status = :status) " +
           "AND (:keyword IS NULL OR LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Project> findEmployerProjectsPaginated(@Param("employerId") Integer employerId,
                                                @Param("status") String status,
                                                @Param("keyword") String keyword,
                                                Pageable pageable);
    
    int countByCategoryCategoryIdAndStatusAndIsDeletedFalse(Integer categoryId, String status);
}

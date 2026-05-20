package com.cny.backend.repository;

import com.cny.backend.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Integer> {
    List<Project> findByIsDeletedFalseAndStatusOrderByCreatedAtDesc(String status);
    
    @Query("SELECT p FROM Project p WHERE p.isDeleted = false AND p.status = :status " +
           "AND (LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(p.category.categoryName) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<Project> searchProjectsByKeyword(@Param("status") String status, @Param("keyword") String keyword);
    
    List<Project> findByClientEmployerIdAndIsDeletedFalse(Integer employerId);
}

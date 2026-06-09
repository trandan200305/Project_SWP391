package com.cny.backend.project.repository;

import com.cny.backend.project.entity.SavedJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SavedJobRepository extends JpaRepository<SavedJob, Integer> {
    
    List<SavedJob> findByUserIdAndUserRoleOrderBySavedAtDesc(Integer userId, String userRole);

    Optional<SavedJob> findByUserIdAndUserRoleAndProject_ProjectId(Integer userId, String userRole, Integer projectId);

    void deleteByUserIdAndUserRoleAndProject_ProjectId(Integer userId, String userRole, Integer projectId);
}

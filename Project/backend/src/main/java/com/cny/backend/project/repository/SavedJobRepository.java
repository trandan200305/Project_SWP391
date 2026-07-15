package com.cny.backend.project.repository;

import com.cny.backend.project.entity.SavedJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SavedJobRepository extends JpaRepository<SavedJob, Integer> {
    List<SavedJob> findByFreelancer_ProfileIdOrderBySavedAtDesc(Integer freelancerId);

    Optional<SavedJob> findByFreelancer_ProfileIdAndProject_ProjectId(Integer freelancerId, Integer projectId);

    void deleteByFreelancer_ProfileIdAndProject_ProjectId(Integer freelancerId, Integer projectId);
}

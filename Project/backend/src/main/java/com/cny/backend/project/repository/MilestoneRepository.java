package com.cny.backend.project.repository;

import com.cny.backend.project.entity.Milestone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MilestoneRepository extends JpaRepository<Milestone, Integer> {
    List<Milestone> findByContractContractIdOrderByMilestoneIdAsc(Integer contractId);
}

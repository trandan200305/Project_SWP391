package com.cny.backend.project.repository;

import com.cny.backend.project.entity.Proposal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProposalRepository extends JpaRepository<Proposal, Integer> {
    List<Proposal> findByProjectProjectId(Integer projectId);
    List<Proposal> findByFreelancerProfileId(Integer freelancerId);
    Optional<Proposal> findByProjectProjectIdAndFreelancerProfileId(Integer projectId, Integer freelancerId);
}

package com.cny.backend.admin.repository;

import com.cny.backend.admin.entity.Dispute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DisputeRepository extends JpaRepository<Dispute, Integer> {
    
    @org.springframework.data.jpa.repository.Query("SELECT COUNT(d) FROM Dispute d JOIN com.cny.backend.project.entity.Contract c ON d.contractId = c.contractId WHERE c.freelancer.profileId = :freelancerId AND d.status IN ('OPEN', 'IN_PROGRESS')")
    int countActiveDisputesByFreelancerId(@org.springframework.data.repository.query.Param("freelancerId") Integer freelancerId);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(d) FROM Dispute d JOIN com.cny.backend.project.entity.Contract c ON d.contractId = c.contractId WHERE c.client.employerId = :employerId AND d.status IN ('OPEN', 'IN_PROGRESS')")
    int countActiveDisputesByEmployerId(@org.springframework.data.repository.query.Param("employerId") Integer employerId);
}

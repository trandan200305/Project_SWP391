package com.cny.backend.project.repository;

import com.cny.backend.project.entity.Contract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ContractRepository extends JpaRepository<Contract, Integer> {
    List<Contract> findByClientEmployerId(Integer employerId);
    List<Contract> findByFreelancerProfileId(Integer freelancerId);
    java.util.Optional<Contract> findByProjectProjectId(Integer projectId);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(c.agreedAmount), 0) FROM Contract c WHERE c.freelancer.profileId = :freelancerId AND c.status = :status")
    java.math.BigDecimal sumEarningsByFreelancerAndStatus(@org.springframework.data.repository.query.Param("freelancerId") Integer freelancerId, @org.springframework.data.repository.query.Param("status") String status);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(c) FROM Contract c WHERE c.freelancer.profileId = :freelancerId AND c.status = :status")
    Integer countContractsByFreelancerAndStatus(@org.springframework.data.repository.query.Param("freelancerId") Integer freelancerId, @org.springframework.data.repository.query.Param("status") String status);

    List<Contract> findByFreelancerProfileIdAndStatusOrderByUpdatedAtDesc(Integer freelancerId, String status);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(c) FROM Contract c WHERE c.freelancer.profileId = :freelancerId AND c.status IN ('IN_PROGRESS', 'PENDING', 'ACTIVE')")
    int countActiveContractsByFreelancerId(@org.springframework.data.repository.query.Param("freelancerId") Integer freelancerId);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(c) FROM Contract c WHERE c.client.employerId = :employerId AND c.status IN ('IN_PROGRESS', 'PENDING', 'ACTIVE')")
    int countActiveContractsByEmployerId(@org.springframework.data.repository.query.Param("employerId") Integer employerId);
}

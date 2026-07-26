package com.cny.backend.kyc.repository;

import com.cny.backend.kyc.entity.UserKycVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface KycVerificationRepository extends JpaRepository<UserKycVerification, Long> {

    List<UserKycVerification> findByStatusOrderByCreatedAtDesc(String status);

    List<UserKycVerification> findAllByOrderByCreatedAtDesc();

    Optional<UserKycVerification> findTopByUserEmailOrderByCreatedAtDesc(String userEmail);
}

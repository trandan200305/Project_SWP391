package com.cny.backend.repository;

import com.cny.backend.entity.StaffInvitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface StaffInvitationRepository extends JpaRepository<StaffInvitation, Integer> {
    Optional<StaffInvitation> findByToken(String token);
    Optional<StaffInvitation> findByEmail(String email);
}

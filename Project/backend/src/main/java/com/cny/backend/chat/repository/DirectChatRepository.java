package com.cny.backend.chat.repository;

import com.cny.backend.chat.entity.DirectChat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DirectChatRepository extends JpaRepository<DirectChat, Integer> {

    Optional<DirectChat> findByFreelancer_ProfileIdAndEmployer_EmployerId(Integer freelancerId, Integer employerId);

    @Query("SELECT c FROM DirectChat c WHERE c.freelancer.profileId = :freelancerId ORDER BY c.updatedAt DESC")
    List<DirectChat> findByFreelancerIdOrderByUpdatedAtDesc(Integer freelancerId);

    @Query("SELECT c FROM DirectChat c WHERE c.employer.employerId = :employerId ORDER BY c.updatedAt DESC")
    List<DirectChat> findByEmployerIdOrderByUpdatedAtDesc(Integer employerId);
}

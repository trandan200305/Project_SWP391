package com.cny.backend.project.repository;

import com.cny.backend.project.entity.Gig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface GigRepository extends JpaRepository<Gig, Integer> {
    List<Gig> findByStatusOrderByCreatedAtDesc(String status);
}

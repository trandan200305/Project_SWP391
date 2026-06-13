package com.cny.backend.admin.repository;

import com.cny.backend.admin.entity.Dispute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DisputeRepository extends JpaRepository<Dispute, Integer> {
}

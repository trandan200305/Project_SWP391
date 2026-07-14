package com.cny.backend.project.repository;

import com.cny.backend.project.entity.DeliverableFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DeliverableFileRepository extends JpaRepository<DeliverableFile, Integer> {
}

package com.cny.backend.project.repository;

import com.cny.backend.project.entity.Deliverable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DeliverableRepository extends JpaRepository<Deliverable, Integer> {
    List<Deliverable> findByMilestoneMilestoneIdOrderByDeliverableIdDesc(Integer milestoneId);
}

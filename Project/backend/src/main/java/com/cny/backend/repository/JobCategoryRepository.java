package com.cny.backend.repository;

import com.cny.backend.entity.JobCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface JobCategoryRepository extends JpaRepository<JobCategory, Integer> {
    List<JobCategory> findByIsActiveTrueOrderByDisplayOrderAsc();
    List<JobCategory> findByParentIsNullAndIsActiveTrueOrderByDisplayOrderAsc();
    List<JobCategory> findByParentCategoryIdAndIsActiveTrue(Integer parentId);
}

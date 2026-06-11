package com.cny.backend.department.repository;

import com.cny.backend.department.entity.DepartmentVerificationTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DepartmentVerificationTaskRepository extends JpaRepository<DepartmentVerificationTask, Integer> {
    List<DepartmentVerificationTask> findByStatus(String status);
}

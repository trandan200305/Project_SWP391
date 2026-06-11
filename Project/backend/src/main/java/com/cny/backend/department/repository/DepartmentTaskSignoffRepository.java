package com.cny.backend.department.repository;

import com.cny.backend.department.entity.DepartmentTaskSignoff;
import com.cny.backend.department.entity.DepartmentVerificationTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DepartmentTaskSignoffRepository extends JpaRepository<DepartmentTaskSignoff, Integer> {
    List<DepartmentTaskSignoff> findByVerificationTask(DepartmentVerificationTask task);
    List<DepartmentTaskSignoff> findByVerificationTaskAndDepartmentCode(DepartmentVerificationTask task, String departmentCode);
}

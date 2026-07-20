package com.cny.backend.project.repository;

import com.cny.backend.project.entity.ProjectSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectSkillRepository extends JpaRepository<ProjectSkill, Integer> {
    List<ProjectSkill> findByProjectProjectId(Integer projectId);
    void deleteByProjectProjectId(Integer projectId);
}

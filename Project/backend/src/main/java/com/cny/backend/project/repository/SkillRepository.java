package com.cny.backend.project.repository;

import com.cny.backend.project.entity.Skill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SkillRepository extends JpaRepository<Skill, Integer> {
    List<Skill> findByIsActiveTrueOrderBySkillNameAsc();
    List<Skill> findByCategoryId(Integer categoryId);
    List<Skill> findByCategoryIdAndIsActiveTrueOrderBySkillNameAsc(Integer categoryId);
    Optional<Skill> findFirstBySkillNameIgnoreCase(String skillName);
    Optional<Skill> findBySkillNameIgnoreCase(String skillName);
}

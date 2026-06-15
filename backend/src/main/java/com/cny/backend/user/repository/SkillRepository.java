package com.cny.backend.user.repository;

import com.cny.backend.user.entity.Skill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SkillRepository extends JpaRepository<Skill, Integer> {
    Optional<Skill> findBySkillNameIgnoreCase(String skillName);
}

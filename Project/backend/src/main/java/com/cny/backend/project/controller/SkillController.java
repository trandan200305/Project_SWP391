package com.cny.backend.project.controller;

import com.cny.backend.project.entity.Skill;
import com.cny.backend.project.repository.SkillRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/skills")
@CrossOrigin(origins = "*")
public class SkillController {

    @Autowired
    private SkillRepository skillRepository;

    @GetMapping
    public ResponseEntity<List<Skill>> getAllSkills() {
        return ResponseEntity.ok(skillRepository.findByIsActiveTrueOrderBySkillNameAsc());
    }

    @PostMapping
    public ResponseEntity<Skill> createSkill(@RequestBody Skill newSkill) {
        if (newSkill.getSkillName() == null || newSkill.getSkillName().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        String normalizedName = newSkill.getSkillName().trim();
        java.util.Optional<Skill> existing = skillRepository.findBySkillNameIgnoreCase(normalizedName);
        if (existing.isPresent()) {
            return ResponseEntity.ok(existing.get());
        }
        Skill skillToSave = Skill.builder()
                .skillName(normalizedName)
                .categoryId(newSkill.getCategoryId() != null ? newSkill.getCategoryId() : 1)
                .isActive(false) // Mặc định là false để chờ Staff duyệt
                .build();
        Skill saved = skillRepository.save(skillToSave);
        return ResponseEntity.ok(saved);
    }
}

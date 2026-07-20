package com.cny.backend.project.controller;

import com.cny.backend.project.entity.Skill;
import com.cny.backend.project.repository.SkillRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/skills")
@CrossOrigin(origins = "*")
public class SkillController {

    @Autowired
    private SkillRepository skillRepository;

    @PostConstruct
    public void initDefaultSkills() {
        try {
            if (skillRepository.count() == 0) {
                List<Skill> defaultSkills = Arrays.asList(
                    // Lập trình & CNTT (CategoryId: 1)
                    Skill.builder().skillName("ReactJS").categoryId(1).build(),
                    Skill.builder().skillName("Spring Boot").categoryId(1).build(),
                    Skill.builder().skillName("Node.js").categoryId(1).build(),
                    Skill.builder().skillName("Java").categoryId(1).build(),
                    Skill.builder().skillName("Python").categoryId(1).build(),
                    Skill.builder().skillName("SQL Server").categoryId(1).build(),
                    Skill.builder().skillName("VueJS").categoryId(1).build(),
                    Skill.builder().skillName("Tailwind CSS").categoryId(1).build(),
                    Skill.builder().skillName("Mobile App").categoryId(1).build(),
                    Skill.builder().skillName("RESTful API").categoryId(1).build(),

                    // Thiết kế Đồ họa & UI/UX (CategoryId: 2)
                    Skill.builder().skillName("Figma").categoryId(2).build(),
                    Skill.builder().skillName("UI/UX Design").categoryId(2).build(),
                    Skill.builder().skillName("Photoshop").categoryId(2).build(),
                    Skill.builder().skillName("Illustrator").categoryId(2).build(),
                    Skill.builder().skillName("Thiết kế Logo").categoryId(2).build(),
                    Skill.builder().skillName("Thiết kế Banner/Poster").categoryId(2).build(),
                    Skill.builder().skillName("3D Design").categoryId(2).build(),
                    Skill.builder().skillName("Branding").categoryId(2).build(),

                    // Marketing & Quảng cáo (CategoryId: 3)
                    Skill.builder().skillName("SEO Website").categoryId(3).build(),
                    Skill.builder().skillName("Google Ads").categoryId(3).build(),
                    Skill.builder().skillName("Facebook Ads").categoryId(3).build(),
                    Skill.builder().skillName("Content Marketing").categoryId(3).build(),
                    Skill.builder().skillName("Copywriting").categoryId(3).build(),
                    Skill.builder().skillName("Social Media").categoryId(3).build(),
                    Skill.builder().skillName("Email Marketing").categoryId(3).build(),

                    // Viết lách & Dịch thuật (CategoryId: 4)
                    Skill.builder().skillName("Dịch tiếng Anh").categoryId(4).build(),
                    Skill.builder().skillName("Dịch tiếng Nhật").categoryId(4).build(),
                    Skill.builder().skillName("Viết bài PR").categoryId(4).build(),
                    Skill.builder().skillName("Viết bài chuẩn SEO").categoryId(4).build(),
                    Skill.builder().skillName("Biên dịch tài liệu").categoryId(4).build(),
                    Skill.builder().skillName("Proofreading").categoryId(4).build(),

                    // Video, Âm thanh & Dựng phim (CategoryId: 5)
                    Skill.builder().skillName("After Effects").categoryId(5).build(),
                    Skill.builder().skillName("Premiere Pro").categoryId(5).build(),
                    Skill.builder().skillName("Video Editing").categoryId(5).build(),
                    Skill.builder().skillName("Motion Graphics").categoryId(5).build(),
                    Skill.builder().skillName("Dựng clip Tiktok").categoryId(5).build(),
                    Skill.builder().skillName("Voiceover").categoryId(5).build(),

                    // Hành chính & Trợ lý (CategoryId: 6)
                    Skill.builder().skillName("Excel / Google Sheets").categoryId(6).build(),
                    Skill.builder().skillName("Nhập liệu Data Entry").categoryId(6).build(),
                    Skill.builder().skillName("Tư vấn bán hàng").categoryId(6).build(),
                    Skill.builder().skillName("Chăm sóc khách hàng (CSKH)").categoryId(6).build(),
                    Skill.builder().skillName("Đăng sản phẩm TMĐT").categoryId(6).build()
                );
                skillRepository.saveAll(defaultSkills);
            }
        } catch (Exception e) {
            System.err.println("Skill initialization notice: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<Skill>> getSkills(@RequestParam(value = "categoryId", required = false) Integer categoryId) {
        if (categoryId != null) {
            return ResponseEntity.ok(skillRepository.findByCategoryId(categoryId));
        }
        return ResponseEntity.ok(skillRepository.findAll());
    }
}

package com.cny.backend;

import com.cny.backend.entity.FreelancerProfile;
import com.cny.backend.entity.JobCategory;
import com.cny.backend.entity.Project;
import com.cny.backend.entity.User;
import com.cny.backend.repository.FreelancerProfileRepository;
import com.cny.backend.repository.JobCategoryRepository;
import com.cny.backend.repository.ProjectRepository;
import com.cny.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JobCategoryRepository jobCategoryRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private FreelancerProfileRepository freelancerProfileRepository;

    @Override
    public void run(String... args) throws Exception {
        // Seed Categories
        if (jobCategoryRepository.count() == 0) {
            seedCategories();
        }

        // Seed Users and Freelancers
        if (userRepository.count() == 0) {
            seedUsersAndFreelancers();
        }

        // Seed Projects
        if (projectRepository.count() == 0) {
            seedProjects();
        }
    }

    private void seedCategories() {
        String[] catNames = {"Lập trình", "Thiết kế", "Marketing", "Dịch thuật", "Viết lách", "Video & Phim", "Hành chính"};
        String[] icons = {"code", "palette", "megaphone", "languages", "pen-tool", "video", "folder-open"};
        
        for (int i = 0; i < catNames.length; i++) {
            JobCategory cat = JobCategory.builder()
                    .categoryName(catNames[i])
                    .description("Các dự án liên quan đến " + catNames[i])
                    .iconUrl(icons[i])
                    .displayOrder(i)
                    .isActive(true)
                    .build();
            jobCategoryRepository.save(cat);
        }
    }

    private void seedUsersAndFreelancers() {
        // Create an admin/client user
        User clientUser = User.builder()
                .email("client@lancerpro.vn")
                .passwordHash("$2a$10$xyz...") // Mock crypt hash
                .displayName("Doanh Nghiệp Việt")
                .fullName("Công Ty TNHH Lancer Việt Nam")
                .phone("0901234567")
                .avatarUrl("client_avatar.png")
                .status("ACTIVE")
                .emailVerified(true)
                .build();
        userRepository.save(clientUser);

        // Top Freelancers matching the vLance screenshot
        String[] names = {"Minh Anh", "Quang Huy", "Phương Linh", "Tùng Dương"};
        String[] emails = {"minhanh@gmail.com", "quanghuy@gmail.com", "phuonglinh@gmail.com", "tungduong@gmail.com"};
        String[] titles = {
            "UI/UX Designer • 5+ năm kinh nghiệm",
            "Backend Developer • Chuyên gia PHP/Java",
            "Content Marketer • SEO Specialist",
            "Mobile Developer • Chuyên Flutter & React Native"
        };
        double[] ratings = {4.9, 5.0, 4.8, 4.9};
        int[] reviews = {126, 86, 210, 54};
        int[] earnings = {150000000, 190000000, 95000000, 120000000};

        for (int i = 0; i < names.length; i++) {
            User user = User.builder()
                    .email(emails[i])
                    .passwordHash("$2a$10$mock...")
                    .displayName(names[i])
                    .fullName(names[i])
                    .phone("098765432" + i)
                    .avatarUrl("avatar_" + i + ".png")
                    .status("ACTIVE")
                    .emailVerified(true)
                    .build();
            userRepository.save(user);

            FreelancerProfile profile = FreelancerProfile.builder()
                    .user(user)
                    .professionalTitle(titles[i])
                    .bio("Tôi là chuyên gia về " + titles[i] + ". Đã thực hiện nhiều dự án cho các startup lớn nhỏ.")
                    .hourlyRate(BigDecimal.valueOf(200000 + (i * 50000)))
                    .address("Quận 1")
                    .city(i % 2 == 0 ? "Hồ Chí Minh" : "Hà Nội")
                    .country("Việt Nam")
                    .profileCompleteness(95)
                    .totalEarnings(BigDecimal.valueOf(earnings[i]))
                    .projectsCompleted(reviews[i])
                    .averageRating(BigDecimal.valueOf(ratings[i]))
                    .isAvailable(true)
                    .build();
            freelancerProfileRepository.save(profile);
        }
    }

    private void seedProjects() {
        User client = userRepository.findByEmail("client@lancerpro.vn").orElse(null);
        JobCategory tech = jobCategoryRepository.findAll().stream()
                .filter(c -> c.getCategoryName().equals("Lập trình")).findFirst().orElse(null);
        JobCategory design = jobCategoryRepository.findAll().stream()
                .filter(c -> c.getCategoryName().equals("Thiết kế")).findFirst().orElse(null);
        JobCategory marketing = jobCategoryRepository.findAll().stream()
                .filter(c -> c.getCategoryName().equals("Marketing")).findFirst().orElse(null);
        JobCategory translation = jobCategoryRepository.findAll().stream()
                .filter(c -> c.getCategoryName().equals("Dịch thuật")).findFirst().orElse(null);
        JobCategory admin = jobCategoryRepository.findAll().stream()
                .filter(c -> c.getCategoryName().equals("Hành chính")).findFirst().orElse(null);

        if (client == null) return;

        List<Project> projects = new ArrayList<>();

        projects.add(Project.builder()
                .client(client)
                .category(design != null ? design : tech)
                .title("Thiết kế Landing Page cho dự án SaaS")
                .description("Cần tìm chuyên gia thiết kế giao diện landing page chuyên nghiệp, hiện đại, chuẩn UI/UX cho nền tảng quản trị tài chính doanh nghiệp.")
                .projectType("FIXED_PRICE")
                .budgetMin(BigDecimal.valueOf(5000000))
                .budgetMax(BigDecimal.valueOf(7000000))
                .deadline(LocalDate.now().plusDays(15))
                .status("PUBLISHED")
                .proposalCount(12)
                .build());

        projects.add(Project.builder()
                .client(client)
                .category(marketing != null ? marketing : tech)
                .title("Quản trị Fanpage & Sáng tạo nội dung")
                .description("Tìm đối tác lâu dài để quản lý Fanpage thương hiệu, viết content đăng bài hàng ngày và thiết kế visual cơ bản theo bộ nhận diện.")
                .projectType("MONTHLY")
                .budgetFixed(BigDecimal.valueOf(10000000))
                .deadline(LocalDate.now().plusDays(30))
                .status("PUBLISHED")
                .proposalCount(8)
                .build());

        projects.add(Project.builder()
                .client(client)
                .category(translation != null ? translation : tech)
                .title("Biên dịch tài liệu Kỹ thuật (Anh - Việt)")
                .description("Biên dịch bộ tài liệu hướng dẫn lắp ráp và vận hành máy móc công nghiệp từ tiếng Anh sang tiếng Việt. Yêu cầu dịch chính xác thuật ngữ chuyên ngành.")
                .projectType("FIXED_PRICE")
                .budgetMin(BigDecimal.valueOf(3000000))
                .budgetMax(BigDecimal.valueOf(5000000))
                .deadline(LocalDate.now().plusDays(7))
                .status("PUBLISHED")
                .proposalCount(5)
                .build());

        projects.add(Project.builder()
                .client(client)
                .category(tech)
                .title("Sửa lỗi giao diện website WordPress")
                .description("Website bán hàng đang bị lỗi hiển thị thanh menu và giỏ hàng trên thiết bị di động, cần coder tối ưu responsive gấp trong ngày.")
                .projectType("FIXED_PRICE")
                .budgetMin(BigDecimal.valueOf(1000000))
                .budgetMax(BigDecimal.valueOf(2000000))
                .deadline(LocalDate.now().plusDays(2))
                .status("PUBLISHED")
                .proposalCount(15)
                .build());

        projects.add(Project.builder()
                .client(client)
                .category(design != null ? design : tech)
                .title("Thiết kế bộ nhận diện thương hiệu F&B")
                .description("Cần thiết kế bộ nhận diện thương hiệu cơ bản bao gồm logo, menu, danh thiếp, bảng hiệu cho quán cà phê specialty mới mở tại Hồ Chí Minh.")
                .projectType("FIXED_PRICE")
                .budgetFixed(BigDecimal.valueOf(4000000))
                .deadline(LocalDate.now().plusDays(20))
                .status("PUBLISHED")
                .proposalCount(19)
                .build());

        projects.add(Project.builder()
                .client(client)
                .category(admin != null ? admin : tech)
                .title("Nhập liệu 500 sản phẩm lên sàn TMĐT")
                .description("Cần nhập thông tin 500 sản phẩm thời trang lên các sàn Shopee, Lazada. Đã có sẵn hình ảnh và mô tả sản phẩm chi tiết trong file Excel.")
                .projectType("FIXED_PRICE")
                .budgetFixed(BigDecimal.valueOf(2000000))
                .deadline(LocalDate.now().plusDays(5))
                .status("PUBLISHED")
                .proposalCount(24)
                .build());

        for (Project p : projects) {
            projectRepository.save(p);
        }
    }
}

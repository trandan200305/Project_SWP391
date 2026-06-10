package com.cny.backend;

import com.cny.backend.auth.entity.*;
import com.cny.backend.admin.entity.*;
import com.cny.backend.project.entity.*;
import com.cny.backend.user.entity.*;
import com.cny.backend.auth.repository.*;
import com.cny.backend.admin.repository.*;
import com.cny.backend.project.repository.*;
import com.cny.backend.user.repository.*;
import com.cny.backend.admin.dto.*;
import com.cny.backend.chat.dto.*;
import com.cny.backend.project.dto.*;
import com.cny.backend.user.dto.*;
import com.cny.backend.auth.service.*;
import com.cny.backend.admin.service.*;
import com.cny.backend.chat.service.*;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JobCategoryRepository jobCategoryRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private FreelancerRepository freelancerRepository;

    @Autowired
    private EmployerRepository employerRepository;

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private com.cny.backend.admin.repository.ManagerRepository managerRepository;

    @Autowired
    private com.cny.backend.admin.repository.StaffRepository staffRepository;

    @Autowired
    private com.cny.backend.department.repository.DepartmentRepository departmentRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        // Seed fixed departments first (always ensure they exist)
        seedFixedDepartments();
        
        if (jobCategoryRepository.count() == 0) {
            seedCategories();
        }

        if (adminRepository.count() == 0) {
            seedAdminOnly();
        }

        if (employerRepository.count() == 0) {
            seedEmployer();
        }

        if (freelancerRepository.count() == 0) {
            seedActors();
        }

        if (projectRepository.count() == 0) {
            seedProjects();
        }
        
        seedAdminEntities();
    }

    private void seedAdminOnly() {
        Admin admin = Admin.builder()
                .email("admin@lancerpro.com")
                .passwordHash(passwordEncoder.encode("123456"))
                .displayName("Hệ Thống Admin")
                .fullName("Administrator LancerPro")
                .phone("0911223344")
                .avatarUrl("https://ui-avatars.com/api/?name=Admin")
                .status("ACTIVE")
                .emailVerified(true)
                .googleId("google_admin_mock")
                .language("vi")
                .timezone("Asia/Ho_Chi_Minh")
                .adminLevel("SUPER_ADMIN")
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        adminRepository.save(admin);
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

    private void seedActors() {
        
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
            Freelancer freelancer = Freelancer.builder()
                    .email(emails[i])
                    .passwordHash(passwordEncoder.encode("123456"))
                    .displayName(names[i])
                    .fullName(names[i])
                    .phone("098765432" + i)
                    .avatarUrl("avatar_" + i + ".png")
                    .status("ACTIVE")
                    .emailVerified(true)
                    .googleId("google_freelancer_mock_" + i)
                    .language("vi")
                    .timezone("Asia/Ho_Chi_Minh")
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
                    .isDeleted(false)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            freelancerRepository.save(freelancer);
        }
    }

    private void seedEmployer() {
        Employer employer = Employer.builder()
                .email("client@lancerpro.vn")
                .passwordHash(passwordEncoder.encode("123456"))
                .displayName("LancerPro Client")
                .fullName("Client LancerPro")
                .phone("0912345678")
                .avatarUrl("https://ui-avatars.com/api/?name=Client")
                .status("ACTIVE")
                .emailVerified(true)
                .googleId("google_client_mock")
                .language("vi")
                .timezone("Asia/Ho_Chi_Minh")
                .companyName("TechFlow Corporation")
                .companyLogoUrl("https://ui-avatars.com/api/?name=TechFlow")
                .companyDescription("Công ty công nghệ hàng đầu chuyên cung cấp giải pháp chuyển đổi số.")
                .website("https://techflow.vn")
                .address("123 Đường Láng")
                .city("Hà Nội")
                .country("Việt Nam")
                .companySize("50-100")
                .industry("Công nghệ thông tin")
                .profileCompleteness(100)
                .totalSpent(BigDecimal.ZERO)
                .projectsPosted(0)
                .averageRating(BigDecimal.valueOf(5.0))
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        employerRepository.save(employer);
    }

    private void seedProjects() {
        Employer client = employerRepository.findAll().stream()
                .filter(e -> e.getEmail().equals("client@lancerpro.vn")).findFirst().orElse(null);
        
        JobCategory tech = jobCategoryRepository.findAll().stream()
                .filter(c -> c.getCategoryName().equals("Lập trình")).findFirst().orElse(null);
        JobCategory design = jobCategoryRepository.findAll().stream()
                .filter(c -> c.getCategoryName().equals("Thiết kế")).findFirst().orElse(null);
        JobCategory marketing = jobCategoryRepository.findAll().stream()
                .filter(c -> c.getCategoryName().equals("Marketing")).findFirst().orElse(null);
        JobCategory translation = jobCategoryRepository.findAll().stream()
                .filter(c -> c.getCategoryName().equals("Dịch thuật")).findFirst().orElse(null);

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
                .category(tech)
                .title("Tích hợp cổng thanh toán AI cho Mobile App")
                .description("Yêu cầu tích hợp AI vào cổng thanh toán thông minh để tự động nhận dạng giao dịch.")
                .projectType("FIXED_PRICE")
                .budgetFixed(BigDecimal.valueOf(15000000))
                .deadline(LocalDate.now().plusDays(10))
                .status("PENDING_REVIEW")
                .proposalCount(0)
                .build());

        projects.add(Project.builder()
                .client(client)
                .category(design != null ? design : tech)
                .title("Thiết kế bộ nhận diện thương hiệu Specialty Coffee")
                .description("Thiết kế logo, menu, bao bì, bảng hiệu cho quán Specialty Coffee mới mở.")
                .projectType("FIXED_PRICE")
                .budgetFixed(BigDecimal.valueOf(6000000))
                .deadline(LocalDate.now().plusDays(20))
                .status("PENDING_REVIEW")
                .proposalCount(0)
                .build());

        projects.add(Project.builder()
                .client(client)
                .category(marketing != null ? marketing : tech)
                .title("Tối ưu hóa chiến dịch Google Ads cho thời trang")
                .description("Chạy và tối ưu hóa quảng cáo chuyển đổi cho thương hiệu thời trang thiết kế.")
                .projectType("MONTHLY")
                .budgetFixed(BigDecimal.valueOf(4500000))
                .deadline(LocalDate.now().plusDays(30))
                .status("PENDING_REVIEW")
                .proposalCount(0)
                .build());

        for (Project p : projects) {
            projectRepository.save(p);
        }
    }

    private void seedAdminEntities() {
        try {
            
            Integer bankCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM bank_accounts", Integer.class);
            if (bankCount != null && bankCount == 0) {
                
                List<Integer> adminIds = jdbcTemplate.queryForList("SELECT admin_id FROM admins WHERE email = 'admin@lancerpro.com'", Integer.class);
                List<Integer> maIds = jdbcTemplate.queryForList("SELECT freelancer_id FROM freelancers WHERE email = 'minhanh@gmail.com'", Integer.class);
                List<Integer> qhIds = jdbcTemplate.queryForList("SELECT freelancer_id FROM freelancers WHERE email = 'quanghuy@gmail.com'", Integer.class);

                if (!adminIds.isEmpty() && !maIds.isEmpty() && !qhIds.isEmpty()) {
                    Integer adminId = adminIds.get(0);
                    Integer maFreelancerId = maIds.get(0);
                    Integer qhFreelancerId = qhIds.get(0);

                    
                    jdbcTemplate.update("INSERT INTO bank_accounts (freelancer_id, bank_name, account_number, account_holder, is_default) VALUES (?, ?, ?, ?, 1)",
                            maFreelancerId, "Vietcombank", "102345910", "NGUYEN MINH ANH");
                    jdbcTemplate.update("INSERT INTO bank_accounts (freelancer_id, bank_name, account_number, account_holder, is_default) VALUES (?, ?, ?, ?, 1)",
                            qhFreelancerId, "Techcombank", "190345129", "TRAN QUANG HUY");

                    
                    List<Integer> maBankIds = jdbcTemplate.queryForList("SELECT bank_account_id FROM bank_accounts WHERE freelancer_id = ?", Integer.class, maFreelancerId);
                    List<Integer> qhBankIds = jdbcTemplate.queryForList("SELECT bank_account_id FROM bank_accounts WHERE freelancer_id = ?", Integer.class, qhFreelancerId);

                    if (!maBankIds.isEmpty() && !qhBankIds.isEmpty()) {
                        Integer maBankId = maBankIds.get(0);
                        Integer qhBankId = qhBankIds.get(0);

                        
                        jdbcTemplate.update("INSERT INTO withdrawal_requests (freelancer_id, amount, bank_account_id, status, created_at) VALUES (?, 12000000, ?, 'PENDING', GETDATE())",
                                maFreelancerId, maBankId);
                        jdbcTemplate.update("INSERT INTO withdrawal_requests (freelancer_id, amount, bank_account_id, status, created_at) VALUES (?, 5000000, ?, 'PENDING', GETDATE())",
                                qhFreelancerId, qhBankId);
                    }

                    
                    jdbcTemplate.update("INSERT INTO admin_audit_logs (admin_id, action, module, description, created_at) VALUES (?, 'VERIFY_USER', 'USER_MANAGEMENT', 'Đã xác thực thông tin KYC cho freelancer Minh Anh', GETDATE())",
                            adminId);
                    jdbcTemplate.update("INSERT INTO admin_audit_logs (admin_id, action, module, description, created_at) VALUES (?, 'UPDATE_SEO', 'CMS_SETTINGS', 'Cập nhật cấu hình meta title trang chủ', GETDATE())",
                            adminId);
                }
            }
        } catch (Exception e) {
            System.err.println("Error seeding admin data: " + e.getMessage());
        }
    }

    private void seedFixedDepartments() {
        try {
            // 8 phòng ban cố định — cập nhật hoặc seed mới
            String[][] departments = {
                {"FIN", "Phòng Tài chính (Finance)", "Quản lý rút tiền, hoàn tiền, escrow, giao dịch | Liên kết với: DIS, AUD"},
                {"MOD", "Phòng Kiểm duyệt (Moderation)", "Duyệt dự án, kiểm duyệt nội dung, KYC | Liên kết với: FIN, CS"},
                {"DIS", "Phòng Tranh chấp (Dispute Resolution)", "Xử lý tranh chấp, phân xử hợp đồng | Liên kết với: FIN, MOD"},
                {"CS", "Phòng Hỗ trợ (Customer Support)", "Support tickets, hỗ trợ người dùng | Liên kết với: MOD, IT"},
                {"IT", "Phòng Kỹ thuật (IT & Development)", "Bảo trì hệ thống, cấu hình, SEO, CMS | Liên kết với: Tất cả"},
                {"AUD", "Phòng Kiểm toán (Audit & Compliance)", "Giám sát, audit logs, đánh giá tuân thủ | Liên kết với: FIN, DIS"},
                {"MKT", "Marketing", "Phòng Truyền thông và Marketing"},
                {"GEN", "General", "Phòng tổng hợp"}
            };

            for (String[] dept : departments) {
                Optional<com.cny.backend.department.entity.Department> existing = departmentRepository.findByCode(dept[0]);
                if (existing.isPresent()) {
                    com.cny.backend.department.entity.Department d = existing.get();
                    d.setName(dept[1]);
                    d.setDescription(dept[2]);
                    departmentRepository.save(d);
                } else {
                    com.cny.backend.department.entity.Department d = com.cny.backend.department.entity.Department.builder()
                            .code(dept[0])
                            .name(dept[1])
                            .description(dept[2])
                            .maxManagers(5)
                            .build();
                    departmentRepository.save(d);
                }
            }
        } catch (Exception e) {
            System.err.println("Error seeding fixed departments: " + e.getMessage());
        }
    }
}

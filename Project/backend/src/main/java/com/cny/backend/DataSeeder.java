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
        seedStaffAndManagers();
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
            String kycStat = "UNVERIFIED";
            boolean isVer = false;
            String frontUrl = null;
            LocalDateTime subTime = null;
            
            if (i == 0) { // Minh Anh
                kycStat = "PENDING";
                frontUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&fit=crop";
                subTime = LocalDateTime.now().minusDays(1);
            } else if (i == 1) { // Quang Huy
                kycStat = "APPROVED";
                isVer = true;
                frontUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&fit=crop";
                subTime = LocalDateTime.now().minusDays(2);
            }

            Freelancer freelancer = Freelancer.builder()
                    .email(emails[i])
                    .passwordHash(passwordEncoder.encode("123456"))
                    .displayName(names[i])
                    .fullName(names[i])
                    .phone("098765432" + i)
                    .avatarUrl("https://ui-avatars.com/api/?name=" + names[i])
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
                    .kycStatus(kycStat)
                    .isVerified(isVer)
                    .idCardFrontUrl(frontUrl)
                    .kycSubmittedAt(subTime)
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
                .kycStatus("PENDING")
                .idCardFrontUrl("https://images.unsplash.com/photo-1554469384-e58fac16e23a?w=400&fit=crop")
                .kycSubmittedAt(LocalDateTime.now().minusDays(3))
                .isVerified(false)
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
                .status("PENDING")
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
                .status("PENDING")
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
                .status("PENDING")
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

                    Integer ticketCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM support_tickets", Integer.class);
                    if (ticketCount != null && ticketCount == 0) {
                        // Ticket 1: Minh Anh
                        jdbcTemplate.update("INSERT INTO support_tickets (freelancer_id, employer_id, subject, description, status, priority, created_at, updated_at) " +
                                "VALUES (?, NULL, N'Hỗ trợ rút tiền', N'Yêu cầu rút tiền chưa nhận được', 'OPEN', 'MEDIUM', GETDATE(), GETDATE())", maFreelancerId);
                        Integer tId1 = jdbcTemplate.queryForObject("SELECT IDENT_CURRENT('support_tickets')", Integer.class);

                        jdbcTemplate.update("INSERT INTO ticket_messages (ticket_id, sender_freelancer_id, sender_employer_id, sender_admin_id, message_text, is_read, sent_at) " +
                                "VALUES (?, ?, NULL, NULL, N'Chào Admin, tôi đã gửi yêu cầu rút tiền từ hôm qua nhưng chưa thấy tài khoản nhận được tiền. Nhờ admin kiểm tra giúp tôi với ạ.', 0, DATEADD(hour, -2, GETDATE()))", tId1, maFreelancerId);
                        jdbcTemplate.update("INSERT INTO ticket_messages (ticket_id, sender_freelancer_id, sender_employer_id, sender_admin_id, message_text, is_read, sent_at) " +
                                "VALUES (?, NULL, NULL, ?, N'Chào bạn Minh Anh, chúng tôi đã tiếp nhận yêu cầu. Yêu cầu của bạn đang được Phòng Tài chính xử lý. Vui lòng chờ trong giây lát.', 1, DATEADD(hour, -1, GETDATE()))", tId1, adminId);

                        // Ticket 2: LancerPro Client
                        List<Integer> clientIds = jdbcTemplate.queryForList("SELECT employer_id FROM employers WHERE email = 'client@lancerpro.vn'", Integer.class);
                        if (!clientIds.isEmpty()) {
                            Integer clientId = clientIds.get(0);
                            jdbcTemplate.update("INSERT INTO support_tickets (freelancer_id, employer_id, subject, description, status, priority, created_at, updated_at) " +
                                    "VALUES (NULL, ?, N'Duyệt dự án mới', N'Bài đăng dự án ở trạng thái chờ duyệt', 'OPEN', 'LOW', GETDATE(), GETDATE())", clientId);
                            Integer tId2 = jdbcTemplate.queryForObject("SELECT IDENT_CURRENT('support_tickets')", Integer.class);

                            jdbcTemplate.update("INSERT INTO ticket_messages (ticket_id, sender_freelancer_id, sender_employer_id, sender_admin_id, message_text, is_read, sent_at) " +
                                    "VALUES (?, NULL, ?, NULL, N'Tôi vừa đăng dự án mới nhưng trạng thái là PENDING_REVIEW. Bao lâu thì bài đăng của tôi được hiển thị?', 0, DATEADD(hour, -3, GETDATE()))", tId2, clientId);
                        }
                    }

                    // Seed Moderation Data (Violation Reports, Disputes, Warning Templates)
                    Integer reportCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM violation_reports", Integer.class);
                    if (reportCount != null && reportCount == 0) {
                        jdbcTemplate.update("INSERT INTO violation_reports (target_type, target_id, reporter_name, accused_name, severity, status, reason, evidence, created_at, updated_at) " +
                                "VALUES ('PROJECT', 'PRJ-102', N'Trần Việt Hoàng', N'LancerPro Client', 'HIGH', 'PENDING', N'Spam bài đăng tuyển dụng nhiều lần cùng nội dung', N'https://example.com/evidence1.jpg', GETDATE(), GETDATE())");
                        jdbcTemplate.update("INSERT INTO violation_reports (target_type, target_id, reporter_name, accused_name, severity, status, reason, evidence, created_at, updated_at) " +
                                "VALUES ('USER', 'USR-405', N'Nguyễn Minh Anh', N'Vũ Hoàng Nam', 'MEDIUM', 'RESOLVED', N'Lời lẽ thô tục xúc phạm trong khung chat', N'https://example.com/evidence2.jpg', DATEADD(day, -2, GETDATE()), DATEADD(day, -2, GETDATE()))");
                    }

                    Integer disputeCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM disputes", Integer.class);
                    if (disputeCount != null && disputeCount == 0) {
                        jdbcTemplate.update("INSERT INTO disputes (project_title, client_name, freelancer_name, amount, reason, priority, status, created_at, updated_at) " +
                                "VALUES (N'Xây dựng Website bán hàng Laravel', N'LancerPro Client', N'Nguyễn Minh Anh', 15000000, N'Freelancer chậm tiến độ bàn giao sản phẩm', 'HIGH', 'OPEN', GETDATE(), GETDATE())");
                        jdbcTemplate.update("INSERT INTO disputes (project_title, client_name, freelancer_name, amount, reason, priority, status, created_at, updated_at) " +
                                "VALUES (N'Thiết kế Banner Sự kiện', N'TechFlow Corporation', N'Lê Thủy Tiên', 2000000, N'Yêu cầu hoàn trả 50% chi phí do thiết kế lỗi', 'MEDIUM', 'RESOLVED', DATEADD(day, -3, GETDATE()), DATEADD(day, -3, GETDATE()))");
                    }

                    Integer warningCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM warning_templates", Integer.class);
                    if (warningCount != null && warningCount == 0) {
                        jdbcTemplate.update("INSERT INTO warning_templates (content, is_active, created_at) VALUES (N'Vi phạm quy định cộng đồng: Sử dụng ngôn từ không phù hợp', 1, GETDATE())");
                        jdbcTemplate.update("INSERT INTO warning_templates (content, is_active, created_at) VALUES (N'Spam hệ thống: Đăng bài nhiều lần với cùng nội dung', 1, GETDATE())");
                        jdbcTemplate.update("INSERT INTO warning_templates (content, is_active, created_at) VALUES (N'Hành vi gian lận: Cố tình lách luật thanh toán ngoài nền tảng', 1, GETDATE())");
                        jdbcTemplate.update("INSERT INTO warning_templates (content, is_active, created_at) VALUES (N'Hồ sơ giả mạo: Sử dụng hình ảnh/thông tin của người khác', 1, GETDATE())");
                    }
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

    private void seedStaffAndManagers() {
        try {
            com.cny.backend.department.entity.Department genDept = departmentRepository.findByCode("GEN").orElse(null);
            com.cny.backend.department.entity.Department csDept = departmentRepository.findByCode("CS").orElse(null);
            com.cny.backend.department.entity.Department itDept = departmentRepository.findByCode("IT").orElse(null);

            Admin admin = adminRepository.findByEmail("admin@lancerpro.com").orElse(null);

            if (managerRepository.count() == 0 && genDept != null) {
                Manager manager = Manager.builder()
                        .email("managerstaff@gmail.com")
                        .passwordHash(passwordEncoder.encode("123456"))
                        .displayName("ManagerStaff")
                        .fullName("General Manager")
                        .phone("0987654321")
                        .avatarUrl("https://ui-avatars.com/api/?name=ManagerStaff&background=006b2c&color=fff")
                        .status("ACTIVE")
                        .department("General")
                        .departmentEntity(genDept)
                        .managedByAdmin(admin != null ? admin.getAdminId() : 1)
                        .isDeleted(false)
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build();
                managerRepository.save(manager);
            }

            Manager manager = managerRepository.findByEmail("managerstaff@gmail.com").orElse(null);

            if (staffRepository.count() == 0 && csDept != null && manager != null) {
                // Elena Kostic
                Staff staff1 = Staff.builder()
                        .email("staff@gmail.com")
                        .passwordHash(passwordEncoder.encode("123456"))
                        .displayName("Elena Kostic")
                        .fullName("Elena Kostic")
                        .phone("0987654311")
                        .avatarUrl("https://ui-avatars.com/api/?name=Elena+Kostic&background=006b2c&color=fff")
                        .status("ACTIVE")
                        .specialization("Senior Analyst")
                        .departmentEntity(csDept)
                        .manager(manager)
                        .isDeleted(false)
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build();
                staffRepository.save(staff1);

                // Marcus Webb
                Staff staff2 = Staff.builder()
                        .email("marcus@lancerpro.com")
                        .passwordHash(passwordEncoder.encode("123456"))
                        .displayName("Marcus Webb")
                        .fullName("Marcus Webb")
                        .phone("0987654312")
                        .avatarUrl("https://ui-avatars.com/api/?name=Marcus+Webb&background=006b2c&color=fff")
                        .status("ACTIVE")
                        .specialization("Ops Lead")
                        .departmentEntity(csDept)
                        .manager(manager)
                        .isDeleted(false)
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build();
                staffRepository.save(staff2);

                // Jia Song
                Staff staff3 = Staff.builder()
                        .email("jia@lancerpro.com")
                        .passwordHash(passwordEncoder.encode("123456"))
                        .displayName("Jia Song")
                        .fullName("Jia Song")
                        .phone("0987654313")
                        .avatarUrl("https://ui-avatars.com/api/?name=Jia+Song&background=ba1a1a&color=fff")
                        .status("ACTIVE")
                        .specialization("Developer")
                        .departmentEntity(itDept != null ? itDept : csDept)
                        .manager(manager)
                        .isDeleted(false)
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build();
                staffRepository.save(staff3);

                // Seed 21 more staff to make exactly 24 staff (20 Active, 4 Inactive)
                for (int i = 1; i <= 21; i++) {
                    String status = (i <= 17) ? "ACTIVE" : "INACTIVE";
                    Staff extraStaff = Staff.builder()
                            .email("staff" + i + "@lancerpro.com")
                            .passwordHash(passwordEncoder.encode("123456"))
                            .displayName("Staff Agent " + i)
                            .fullName("Staff Agent " + i)
                            .phone("098765435" + i)
                            .avatarUrl("https://ui-avatars.com/api/?name=Staff+Agent+" + i)
                            .status(status)
                            .specialization("Support Agent")
                            .departmentEntity(csDept)
                            .manager(manager)
                            .isDeleted(false)
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .build();
                    staffRepository.save(extraStaff);
                }
            }
        } catch (Exception e) {
            System.err.println("Error seeding staff and managers: " + e.getMessage());
        }
    }
}

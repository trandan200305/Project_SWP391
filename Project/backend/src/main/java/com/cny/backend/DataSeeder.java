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
    private FreelancerProfileRepository freelancerProfileRepository;

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
    private com.cny.backend.department.repository.DepartmentTransferRequestRepository departmentTransferRequestRepository;

    @Autowired
    private PaymentInvoiceRepository paymentInvoiceRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private SkillRepository skillRepository;

    @Override
    public void run(String... args) throws Exception {
        
        seedFixedDepartments();
        
        if (jobCategoryRepository.count() == 0) {
            seedCategories();
        }

        if (skillRepository.count() == 0) {
            seedSkills();
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

        if (paymentInvoiceRepository.count() == 0) {
            seedInvoices();
        }
    }

    private void seedInvoices() {
        var employers = employerRepository.findAll();
        if (employers.isEmpty()) return;

        for (Employer emp : employers) {
            PaymentInvoice inv1 = PaymentInvoice.builder()
                    .invoiceNumber("INV-20260715-" + emp.getEmployerId() + "01")
                    .transactionId(1001 + emp.getEmployerId())
                    .employerId(emp.getEmployerId())
                    .description("Thanh toán gói dịch vụ Doanh nghiệp VIP (Enterprise Package)")
                    .amount(new BigDecimal("2500000.00"))
                    .taxAmount(new BigDecimal("250000.00"))
                    .totalAmount(new BigDecimal("2750000.00"))
                    .issuedAt(LocalDateTime.now().minusDays(5))
                    .status("PAID")
                    .build();

            PaymentInvoice inv2 = PaymentInvoice.builder()
                    .invoiceNumber("INV-20260718-" + emp.getEmployerId() + "02")
                    .transactionId(1002 + emp.getEmployerId())
                    .employerId(emp.getEmployerId())
                    .description("Nạp tiền vào tài khoản LancerPro (Ví Employer)")
                    .amount(new BigDecimal("5000000.00"))
                    .taxAmount(BigDecimal.ZERO)
                    .totalAmount(new BigDecimal("5000000.00"))
                    .issuedAt(LocalDateTime.now().minusDays(2))
                    .status("PAID")
                    .build();

            PaymentInvoice inv3 = PaymentInvoice.builder()
                    .invoiceNumber("INV-20260720-" + emp.getEmployerId() + "03")
                    .transactionId(1003 + emp.getEmployerId())
                    .employerId(emp.getEmployerId())
                    .description("Thanh toán phí đăng tin dự án Nổi bật (Featured Job)")
                    .amount(new BigDecimal("500000.00"))
                    .taxAmount(new BigDecimal("50000.00"))
                    .totalAmount(new BigDecimal("550000.00"))
                    .issuedAt(LocalDateTime.now().minusHours(6))
                    .status("PAID")
                    .build();

            paymentInvoiceRepository.saveAll(List.of(inv1, inv2, inv3));
        }
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
            
            if (i == 0) { 
                kycStat = "PENDING";
                frontUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&fit=crop";
                subTime = LocalDateTime.now().minusDays(1);
            } else if (i == 1) { 
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
            Freelancer savedFl = freelancerRepository.save(freelancer);
            
            // Seed a matching FreelancerProfile for advanced filtering
            FreelancerProfile profile = FreelancerProfile.builder()
                    .freelancer(savedFl)
                    .professionalTitle(freelancer.getProfessionalTitle())
                    .bio(freelancer.getBio())
                    .hourlyRate(freelancer.getHourlyRate())
                    .address(freelancer.getAddress())
                    .city(freelancer.getCity())
                    .country(freelancer.getCountry())
                    .expertiseField(i == 0 ? "Thiết kế" : i == 1 ? "Lập trình" : i == 2 ? "Marketing" : "Lập trình")
                    .experienceLevel(i % 2 == 0 ? "Chuyên gia" : "Đã có kinh nghiệm")
                    .primarySkills(i == 0 ? "Figma, UI/UX, Wireframe" : i == 1 ? "Java, Spring Boot, MySQL" : i == 2 ? "SEO, Google Ads, Copywriting" : "Flutter, React Native, Firebase")
                    .profileCompleteness(95)
                    .totalEarnings(BigDecimal.valueOf(earnings[i]))
                    .projectsCompleted(reviews[i])
                    .averageRating(BigDecimal.valueOf(ratings[i]))
                    .isAvailable(true)
                    .build();
            freelancerProfileRepository.save(profile);
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

        List<Skill> allSkills = skillRepository.findAll();
        Skill figma = allSkills.stream().filter(s -> s.getSkillName().equals("Figma")).findFirst().orElse(null);
        Skill photoshop = allSkills.stream().filter(s -> s.getSkillName().equals("Photoshop")).findFirst().orElse(null);
        Skill seo = allSkills.stream().filter(s -> s.getSkillName().equals("SEO")).findFirst().orElse(null);
        Skill reactjs = allSkills.stream().filter(s -> s.getSkillName().equals("ReactJS")).findFirst().orElse(null);
        Skill wordpress = allSkills.stream().filter(s -> s.getSkillName().equals("WordPress")).findFirst().orElse(null);
        Skill googleAds = allSkills.stream().filter(s -> s.getSkillName().equals("Google Ads")).findFirst().orElse(null);

        List<Project> projects = new ArrayList<>();

        
        projects.add(Project.builder()
                .client(client)
                .category(design != null ? design : tech)
                .title("Thiết kế Landing Page cho dự án SaaS")
                .description("Cần tìm chuyên gia thiết kế giao diện landing page chuyên nghiệp, hiện đại, chuẩn UI/UX cho nền tảng quản trị tài chính doanh nghiệp.")
                .projectType("RANGE")
                .budgetMin(BigDecimal.valueOf(5000000))
                .budgetMax(BigDecimal.valueOf(7000000))
                .deadline(LocalDate.now().plusDays(15))
                .status("PUBLISHED")
                .proposalCount(12)
                .skills(filterNonNullSkills(figma, photoshop))
                .build());

        projects.add(Project.builder()
                .client(client)
                .category(marketing != null ? marketing : tech)
                .title("Quản trị Fanpage & Sáng tạo nội dung")
                .description("Tìm đối tác lâu dài để quản lý Fanpage thương hiệu, viết content đăng bài hàng ngày và thiết kế visual cơ bản theo bộ nhận diện.")
                .projectType("FIXED_PRICE")
                .budgetFixed(BigDecimal.valueOf(10000000))
                .deadline(LocalDate.now().plusDays(30))
                .status("PUBLISHED")
                .proposalCount(8)
                .skills(filterNonNullSkills(seo))
                .build());

        projects.add(Project.builder()
                .client(client)
                .category(translation != null ? translation : tech)
                .title("Biên dịch tài liệu Kỹ thuật (Anh - Việt)")
                .description("Biên dịch bộ tài liệu hướng dẫn lắp ráp và vận hành máy móc công nghiệp từ tiếng Anh sang tiếng Việt. Yêu cầu dịch chính xác thuật ngữ chuyên ngành.")
                .projectType("RANGE")
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
                .workForm("OFFLINE")
                .budgetMin(BigDecimal.valueOf(1000000))
                .budgetMax(BigDecimal.valueOf(2000000))
                .deadline(LocalDate.now().plusDays(2))
                .status("PUBLISHED")
                .proposalCount(15)
                .skills(filterNonNullSkills(wordpress))
                .build());

        
        projects.add(Project.builder()
                .client(client)
                .category(tech)
                .title("Tích hợp cổng thanh toán AI cho Mobile App")
                .description("Yêu cầu tích hợp AI vào cổng thanh toán thông minh để tự động nhận dạng giao dịch.")
                .projectType("FIXED_PRICE")
                .budgetFixed(BigDecimal.valueOf(15000000))
                .deadline(LocalDate.now().plusDays(10))
                .status("PUBLISHED")
                .proposalCount(0)
                .skills(filterNonNullSkills(reactjs))
                .build());

        projects.add(Project.builder()
                .client(client)
                .category(design != null ? design : tech)
                .title("Thiết kế bộ nhận diện thương hiệu Specialty Coffee")
                .description("Thiết kế logo, menu, bao bì, bảng hiệu cho quán Specialty Coffee mới mở.")
                .projectType("FIXED_PRICE")
                .workForm("OFFLINE")
                .budgetFixed(BigDecimal.valueOf(6000000))
                .deadline(LocalDate.now().plusDays(20))
                .status("PUBLISHED")
                .proposalCount(0)
                .skills(filterNonNullSkills(figma, photoshop))
                .build());

        projects.add(Project.builder()
                .client(client)
                .category(marketing != null ? marketing : tech)
                .title("Tối ưu hóa chiến dịch Google Ads cho thời trang")
                .description("Chạy và tối ưu hóa quảng cáo chuyển đổi cho thương hiệu thời trang thiết kế.")
                .projectType("FIXED_PRICE")
                .budgetFixed(BigDecimal.valueOf(4500000))
                .deadline(LocalDate.now().plusDays(30))
                .status("PUBLISHED")
                .proposalCount(0)
                .skills(filterNonNullSkills(googleAds))
                .build());

        for (Project p : projects) {
            projectRepository.save(p);
        }
    }

    private void seedAdminEntities() {
        try {
            List<Integer> adminIds = jdbcTemplate.queryForList("SELECT admin_id FROM admins WHERE email = 'admin@lancerpro.com'", Integer.class);
            List<Integer> maIds = jdbcTemplate.queryForList("SELECT freelancer_id FROM freelancers WHERE email = 'minhanh@gmail.com'", Integer.class);
            List<Integer> qhIds = jdbcTemplate.queryForList("SELECT freelancer_id FROM freelancers WHERE email = 'quanghuy@gmail.com'", Integer.class);

            if (!adminIds.isEmpty() && !maIds.isEmpty() && !qhIds.isEmpty()) {
                Integer adminId = adminIds.get(0);
                Integer maFreelancerId = maIds.get(0);
                Integer qhFreelancerId = qhIds.get(0);

                // 1. Seed bank_accounts if empty
                Integer bankCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM bank_accounts", Integer.class);
                if (bankCount != null && bankCount == 0) {
                    jdbcTemplate.update("INSERT INTO bank_accounts (freelancer_id, bank_name, account_number, account_holder, is_default) VALUES (?, ?, ?, ?, 1)",
                            maFreelancerId, "Vietcombank", "102345910", "NGUYEN MINH ANH");
                    jdbcTemplate.update("INSERT INTO bank_accounts (freelancer_id, bank_name, account_number, account_holder, is_default) VALUES (?, ?, ?, ?, 1)",
                            qhFreelancerId, "Techcombank", "190345129", "TRAN QUANG HUY");
                }

                // Ensure bank accounts exist for both freelancers to prevent foreign key errors on withdrawal requests
                List<Integer> maBankIds = jdbcTemplate.queryForList("SELECT bank_account_id FROM bank_accounts WHERE freelancer_id = ?", Integer.class, maFreelancerId);
                List<Integer> qhBankIds = jdbcTemplate.queryForList("SELECT bank_account_id FROM bank_accounts WHERE freelancer_id = ?", Integer.class, qhFreelancerId);

                if (maBankIds.isEmpty()) {
                    jdbcTemplate.update("INSERT INTO bank_accounts (freelancer_id, bank_name, account_number, account_holder, is_default) VALUES (?, ?, ?, ?, 1)",
                            maFreelancerId, "Vietcombank", "102345910", "NGUYEN MINH ANH");
                    maBankIds = jdbcTemplate.queryForList("SELECT bank_account_id FROM bank_accounts WHERE freelancer_id = ?", Integer.class, maFreelancerId);
                }
                if (qhBankIds.isEmpty()) {
                    jdbcTemplate.update("INSERT INTO bank_accounts (freelancer_id, bank_name, account_number, account_holder, is_default) VALUES (?, ?, ?, ?, 1)",
                            qhFreelancerId, "Techcombank", "190345129", "TRAN QUANG HUY");
                    qhBankIds = jdbcTemplate.queryForList("SELECT bank_account_id FROM bank_accounts WHERE freelancer_id = ?", Integer.class, qhFreelancerId);
                }

                Integer maBankId = maBankIds.get(0);
                Integer qhBankId = qhBankIds.get(0);

                // 2. Seed withdrawal_requests if empty
                Integer withdrawalCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM withdrawal_requests", Integer.class);
                if (withdrawalCount != null && withdrawalCount == 0) {
                    jdbcTemplate.update("INSERT INTO withdrawal_requests (freelancer_id, amount, bank_account_id, status, created_at) VALUES (?, 12000000, ?, 'PENDING', GETDATE())",
                            maFreelancerId, maBankId);
                    jdbcTemplate.update("INSERT INTO withdrawal_requests (freelancer_id, amount, bank_account_id, status, created_at) VALUES (?, 5000000, ?, 'PENDING', GETDATE())",
                            qhFreelancerId, qhBankId);
                    jdbcTemplate.update("INSERT INTO withdrawal_requests (freelancer_id, amount, bank_account_id, status, created_at) VALUES (?, 3500000, ?, 'APPROVED', DATEADD(day, -3, GETDATE()))",
                            maFreelancerId, maBankId);
                    jdbcTemplate.update("INSERT INTO withdrawal_requests (freelancer_id, amount, bank_account_id, status, created_at) VALUES (?, 1500000, ?, 'REJECTED', DATEADD(day, -5, GETDATE()))",
                            qhFreelancerId, qhBankId);
                }

                // Also automatically seed withdrawal requests for user 'tdan9704@gmail.com' if they exist in the DB
                List<Integer> customIds = jdbcTemplate.queryForList("SELECT freelancer_id FROM freelancers WHERE email = 'tdan9704@gmail.com'", Integer.class);
                if (!customIds.isEmpty()) {
                    Integer customId = customIds.get(0);
                    List<Integer> customBankIds = jdbcTemplate.queryForList("SELECT bank_account_id FROM bank_accounts WHERE freelancer_id = ?", Integer.class, customId);
                    if (customBankIds.isEmpty()) {
                        jdbcTemplate.update("INSERT INTO bank_accounts (freelancer_id, bank_name, account_number, account_holder, is_default) VALUES (?, ?, ?, ?, 1)",
                                customId, "MB Bank", "9999999999", "TRAN DAN");
                        customBankIds = jdbcTemplate.queryForList("SELECT bank_account_id FROM bank_accounts WHERE freelancer_id = ?", Integer.class, customId);
                    }
                    Integer customBankId = customBankIds.get(0);

                    // Check if they already have withdrawal requests, if not seed some
                    Integer customWdCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM withdrawal_requests WHERE freelancer_id = ?", Integer.class, customId);
                    if (customWdCount != null && customWdCount == 0) {
                        jdbcTemplate.update("INSERT INTO withdrawal_requests (freelancer_id, amount, bank_account_id, status, created_at) VALUES (?, 8000000, ?, 'PENDING', GETDATE())",
                                customId, customBankId);
                        jdbcTemplate.update("INSERT INTO withdrawal_requests (freelancer_id, amount, bank_account_id, status, created_at) VALUES (?, 15000000, ?, 'APPROVED', DATEADD(day, -2, GETDATE()))",
                                customId, customBankId);
                        jdbcTemplate.update("INSERT INTO withdrawal_requests (freelancer_id, amount, bank_account_id, status, created_at) VALUES (?, 2000000, ?, 'REJECTED', DATEADD(day, -4, GETDATE()))",
                                customId, customBankId);
                    }
                }

                // 3. Seed admin_audit_logs if empty
                Integer auditLogCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM admin_audit_logs", Integer.class);
                if (auditLogCount != null && auditLogCount == 0) {
                    jdbcTemplate.update("INSERT INTO admin_audit_logs (admin_id, action, module, description, created_at) VALUES (?, 'VERIFY_USER', 'USER_MANAGEMENT', 'Đã xác thực thông tin KYC cho freelancer Minh Anh', GETDATE())",
                            adminId);
                    jdbcTemplate.update("INSERT INTO admin_audit_logs (admin_id, action, module, description, created_at) VALUES (?, 'UPDATE_SEO', 'CMS_SETTINGS', 'Cập nhật cấu hình meta title trang chủ', GETDATE())",
                            adminId);
                }

                // 4. Seed support_tickets if empty
                Integer ticketCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM support_tickets", Integer.class);
                if (ticketCount != null && ticketCount == 0) {
                    jdbcTemplate.update("INSERT INTO support_tickets (freelancer_id, employer_id, subject, description, status, priority, created_at, updated_at) " +
                            "VALUES (?, NULL, N'Hỗ trợ rút tiền', N'Yêu cầu rút tiền chưa nhận được', 'OPEN', 'MEDIUM', GETDATE(), GETDATE())", maFreelancerId);
                    Integer tId1 = jdbcTemplate.queryForObject("SELECT IDENT_CURRENT('support_tickets')", Integer.class);

                    jdbcTemplate.update("INSERT INTO ticket_messages (ticket_id, sender_freelancer_id, sender_employer_id, sender_admin_id, message_text, is_read, sent_at) " +
                            "VALUES (?, ?, NULL, NULL, N'Chào Admin, tôi đã gửi yêu cầu rút tiền từ hôm qua nhưng chưa thấy tài khoản nhận được tiền. Nhờ admin kiểm tra giúp tôi với ạ.', 0, DATEADD(hour, -2, GETDATE()))", tId1, maFreelancerId);
                    jdbcTemplate.update("INSERT INTO ticket_messages (ticket_id, sender_freelancer_id, sender_employer_id, sender_admin_id, message_text, is_read, sent_at) " +
                            "VALUES (?, NULL, NULL, ?, N'Chào bạn Minh Anh, chúng tôi đã tiếp nhận yêu cầu. Yêu cầu của bạn đang được Phòng Tài chính xử lý. Vui lòng chờ trong giây lát.', 1, DATEADD(hour, -1, GETDATE()))", tId1, adminId);

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

                // 5. Seed violation_reports if empty
                Integer reportCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM violation_reports", Integer.class);
                if (reportCount != null && reportCount == 0) {
                    jdbcTemplate.update("INSERT INTO violation_reports (target_type, target_id, reporter_name, accused_name, severity, status, reason, evidence, created_at, updated_at) " +
                            "VALUES ('PROJECT', 'PRJ-102', N'Trần Việt Hoàng', N'LancerPro Client', 'HIGH', 'PENDING', N'Spam bài đăng tuyển dụng nhiều lần cùng nội dung', N'https://example.com/evidence1.jpg', GETDATE(), GETDATE())");
                    jdbcTemplate.update("INSERT INTO violation_reports (target_type, target_id, reporter_name, accused_name, severity, status, reason, evidence, created_at, updated_at) " +
                            "VALUES ('USER', 'USR-405', N'Nguyễn Minh Anh', N'Vũ Hoàng Nam', 'MEDIUM', 'RESOLVED', N'Lời lẽ thô tục xúc phạm trong khung chat', N'https://example.com/evidence2.jpg', DATEADD(day, -2, GETDATE()), DATEADD(day, -2, GETDATE()))");
                }

                // 6. Seed disputes if empty (include RESOLVED_CLIENT_FAVOR for Refunds)
                Integer disputeCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM disputes", Integer.class);
                if (disputeCount != null && disputeCount == 0) {
                    jdbcTemplate.update("INSERT INTO disputes (contract_id, project_title, client_name, freelancer_name, amount, reason, priority, status, created_at, updated_at) " +
                            "VALUES (1, N'Xây dựng Website bán hàng Laravel', N'LancerPro Client', N'Nguyễn Minh Anh', 15000000, N'Freelancer chậm tiến độ bàn giao sản phẩm', 'HIGH', 'OPEN', GETDATE(), GETDATE())");
                    jdbcTemplate.update("INSERT INTO disputes (contract_id, project_title, client_name, freelancer_name, amount, reason, priority, status, created_at, updated_at) " +
                            "VALUES (1, N'Thiết kế Banner Sự kiện', N'TechFlow Corporation', N'Lê Thủy Tiên', 2000000, N'Yêu cầu hoàn trả 50% chi phí do thiết kế lỗi', 'MEDIUM', 'RESOLVED', DATEADD(day, -3, GETDATE()), DATEADD(day, -3, GETDATE()))");
                    jdbcTemplate.update("INSERT INTO disputes (contract_id, project_title, client_name, freelancer_name, amount, reason, priority, status, created_at, updated_at) " +
                            "VALUES (1, N'Thiết kế Landing Page Bất Động Sản', N'Vingroup Agency', N'Nguyễn Minh Anh', 4500000, N'Freelancer không bàn giao source code', 'HIGH', 'RESOLVED_CLIENT_FAVOR', DATEADD(day, -2, GETDATE()), DATEADD(day, -2, GETDATE()))");
                }

                // 7. Seed payment_transactions if empty
                Integer transactionCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM payment_transactions", Integer.class);
                if (transactionCount != null && transactionCount == 0) {
                    jdbcTemplate.update("INSERT INTO payment_transactions (txn_ref, employer_id, project_id, amount, status, vnp_transaction_no, created_at, updated_at) " +
                            "VALUES ('TXN12345678', 1, 101, 15000000, 'SUCCESS', '14012345', GETDATE(), GETDATE())");
                    jdbcTemplate.update("INSERT INTO payment_transactions (txn_ref, employer_id, project_id, amount, status, vnp_transaction_no, created_at, updated_at) " +
                            "VALUES ('TXN87654321', 1, 102, 5000000, 'FAILED', 'N/A', DATEADD(day, -1, GETDATE()), DATEADD(day, -1, GETDATE()))");
                    jdbcTemplate.update("INSERT INTO payment_transactions (txn_ref, employer_id, project_id, amount, status, vnp_transaction_no, created_at, updated_at) " +
                            "VALUES ('TXN99999999', 1, 103, 3500000, 'PENDING', 'N/A', DATEADD(hour, -2, GETDATE()), DATEADD(hour, -2, GETDATE()))");
                }

                // 8. Seed warning_templates if empty
                Integer warningCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM warning_templates", Integer.class);
                if (warningCount != null && warningCount == 0) {
                    jdbcTemplate.update("INSERT INTO warning_templates (content, is_active, created_at) VALUES (N'Vi phạm quy định cộng đồng: Sử dụng ngôn từ không phù hợp', 1, GETDATE())");
                    jdbcTemplate.update("INSERT INTO warning_templates (content, is_active, created_at) VALUES (N'Spam hệ thống: Đăng bài nhiều lần với cùng nội dung', 1, GETDATE())");
                    jdbcTemplate.update("INSERT INTO warning_templates (content, is_active, created_at) VALUES (N'Hành vi gian lận: Cố tình lách luật thanh toán ngoài nền tảng', 1, GETDATE())");
                    jdbcTemplate.update("INSERT INTO warning_templates (content, is_active, created_at) VALUES (N'Hồ sơ giả mạo: Sử dụng hình ảnh/thông tin của người khác', 1, GETDATE())");
                }
            }
        } catch (Exception e) {
            System.err.println("Error seeding admin data: " + e.getMessage());
        }
    }

    private void seedFixedDepartments() {
        try {
            // Soft-delete and detach staff/managers from FIN to clean up
            try {
                // First, clean up any staff/managers with 'finance' in their email
                try {
                    jdbcTemplate.update("UPDATE staff SET is_deleted = 1, department_id = NULL WHERE email LIKE '%finance%'");
                } catch (Exception e) {
                    System.out.println("Clean up finance staff email warning: " + e.getMessage());
                }
                try {
                    jdbcTemplate.update("UPDATE managers SET is_deleted = 1, department_id = NULL WHERE email LIKE '%finance%'");
                } catch (Exception e) {
                    System.out.println("Clean up finance manager email warning: " + e.getMessage());
                }

                Integer finId = null;
                try {
                    finId = jdbcTemplate.queryForObject(
                        "SELECT department_id FROM departments WHERE code = 'FIN'", Integer.class);
                } catch (Exception e) {
                    System.out.println("FIN department not found: " + e.getMessage());
                }

                if (finId != null) {
                    try { jdbcTemplate.update("UPDATE staff SET is_deleted = 1, department_id = NULL WHERE department_id = ?", finId); } catch (Exception e) {}
                    try { jdbcTemplate.update("UPDATE managers SET is_deleted = 1, department_id = NULL WHERE department_id = ?", finId); } catch (Exception e) {}
                    try { jdbcTemplate.update("DELETE FROM department_sessions WHERE department_id = ?", finId); } catch (Exception e) {}
                    try { jdbcTemplate.update("DELETE FROM department_activity_logs WHERE department_id = ?", finId); } catch (Exception e) {}
                    try { jdbcTemplate.update("DELETE FROM department_task_signoffs WHERE department_id = ?", finId); } catch (Exception e) {}
                    try { jdbcTemplate.update("DELETE FROM department_transfer_history WHERE from_department_id = ? OR to_department_id = ?", finId, finId); } catch (Exception e) {}
                    try { jdbcTemplate.update("DELETE FROM department_transfer_requests WHERE from_department_id = ? OR to_department_id = ?", finId, finId); } catch (Exception e) {}
                    try { jdbcTemplate.update("DELETE FROM departments WHERE department_id = ?", finId); } catch (Exception e) {}
                    System.out.println("CLEANUP: Soft-deleted FIN staff/managers and deleted FIN department successfully.");
                }
            } catch (Exception ex) {
                System.out.println("INFO: FIN department clean up skipped: " + ex.getMessage());
            }

            String[][] departments = {
                {"MOD", "Phòng Kiểm duyệt (Moderation)", "Duyệt dự án, kiểm duyệt nội dung, KYC | Liên kết với: CS"},
                {"DIS", "Phòng Tranh chấp (Dispute Resolution)", "Xử lý tranh chấp, phân xử hợp đồng | Liên kết với: MOD"},
                {"CS", "Phòng Hỗ trợ (Customer Support)", "Support tickets, hỗ trợ người dùng | Liên kết với: MOD, IT"},
                {"IT", "Phòng Kỹ thuật (IT & Development)", "Bảo trì hệ thống, cấu hình, SEO, CMS | Liên kết với: CS, MOD"}
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

    private Manager seedManager(String email, String displayName, String fullName, com.cny.backend.department.entity.Department dept, Admin admin) {
        Optional<Manager> existing = managerRepository.findByEmail(email);
        if (existing.isPresent()) {
            Manager m = existing.get();
            if (dept != null) {
                m.setDepartment(dept.getName());
                m.setDepartmentEntity(dept);
                managerRepository.save(m);
            }
            return m;
        }
        
        Manager manager = Manager.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode("123456"))
                .displayName(displayName)
                .fullName(fullName)
                .phone("0987654321")
                .avatarUrl("https://ui-avatars.com/api/?name=" + displayName.replace(" ", "+") + "&background=006b2c&color=fff")
                .status("ACTIVE")
                .department(dept != null ? dept.getName() : null)
                .departmentEntity(dept)
                .managedByAdmin(admin != null ? admin.getAdminId() : 1)
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        return managerRepository.save(manager);
    }

    private void seedStaffAndManagers() {
        try {
            com.cny.backend.department.entity.Department csDept = departmentRepository.findByCode("CS").orElse(null);
            com.cny.backend.department.entity.Department itDept = departmentRepository.findByCode("IT").orElse(null);
            com.cny.backend.department.entity.Department modDept = departmentRepository.findByCode("MOD").orElse(null);
            com.cny.backend.department.entity.Department disDept = departmentRepository.findByCode("DIS").orElse(null);

            Admin admin = adminRepository.findByEmail("admin@lancerpro.com").orElse(null);

            // Seed 4 Managers for 4 Departments
            Manager modManager = seedManager("manager.mod@lancerpro.com", "ManagerMod", "Moderation Manager", modDept, admin);
            Manager disManager = seedManager("manager.dis@lancerpro.com", "ManagerDis", "Dispute Manager", disDept, admin);
            Manager csManager = seedManager("manager.cs@lancerpro.com", "ManagerCS", "Customer Support Manager", csDept, admin);
            Manager itManager = seedManager("manager.it@lancerpro.com", "ManagerIT", "IT Manager", itDept, admin);

            // Clean up old managerstaff if exists
            Optional<Manager> oldManagerOpt = managerRepository.findByEmail("managerstaff@gmail.com");
            if (oldManagerOpt.isPresent()) {
                Manager oldManager = oldManagerOpt.get();
                jdbcTemplate.update("UPDATE staff SET manager_id = ? WHERE manager_id = ?", csManager.getManagerId(), oldManager.getManagerId());
                try {
                    jdbcTemplate.update("UPDATE login_history SET manager_id = ? WHERE manager_id = ?", csManager.getManagerId(), oldManager.getManagerId());
                    jdbcTemplate.update("UPDATE department_sessions SET user_id = ? WHERE user_id = ? AND user_role = 'MANAGER'", csManager.getManagerId(), oldManager.getManagerId());
                } catch (Exception ex) {
                    System.out.println("Warning migrating old manager login/session history: " + ex.getMessage());
                }
                managerRepository.delete(oldManager);
            }

            if (staffRepository.count() == 0 && csDept != null) {
                
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
                        .manager(csManager)
                        .isDeleted(false)
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build();
                staffRepository.save(staff1);

                
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
                        .manager(csManager)
                        .isDeleted(false)
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build();
                staffRepository.save(staff2);

                
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
                        .manager(itManager)
                        .isDeleted(false)
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build();
                staffRepository.save(staff3);

                
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
                            .manager(csManager)
                            .isDeleted(false)
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .build();
                    staffRepository.save(extraStaff);
                }
            }

            Staff existingStaff = staffRepository.findByEmail("staff@gmail.com").orElse(null);
            if (existingStaff != null && modDept != null) {
                existingStaff.setDepartmentEntity(modDept);
                existingStaff.setManager(modManager);
                staffRepository.save(existingStaff);
            }

            // Sync staff manager relationships based on department matches
            try {
                jdbcTemplate.update("UPDATE staff SET manager_id = (SELECT manager_id FROM managers m WHERE m.department_id = staff.department_id) WHERE manager_id IS NULL");
            } catch (Exception ex) {
                System.out.println("Sync staff manager id warning: " + ex.getMessage());
            }

            // Seed sample transfer requests if empty
            try {
                if (departmentTransferRequestRepository.count() == 0 && modDept != null && disDept != null) {
                    Staff sampleStaff = staffRepository.findAll().stream().findFirst().orElse(null);
                    if (sampleStaff != null) {
                        com.cny.backend.department.entity.DepartmentTransferRequest req1 = com.cny.backend.department.entity.DepartmentTransferRequest.builder()
                            .userType("STAFF")
                            .userId(sampleStaff.getStaffId())
                            .userEmail(sampleStaff.getEmail())
                            .userDisplayName(sampleStaff.getDisplayName())
                            .fromDepartment(sampleStaff.getDepartmentEntity() != null ? sampleStaff.getDepartmentEntity() : modDept)
                            .toDepartment(disDept)
                            .reason("Lý do điều chuyển: Muốn mở rộng kỹ năng sang mảng giải quyết tranh chấp hợp đồng.\nPhòng ban mong muốn: Phòng Tranh chấp (DIS)\nVị trí mong muốn: Chuyên viên xử lý tranh chấp\nNgày mong muốn bắt đầu: 2026-08-01\nLoại điều chuyển: Chuyển phòng ban\nKỹ năng liên quan & kinh nghiệm trước đây: 2 năm kiểm duyệt dự án và tư vấn pháp lý hợp đồng\nThành tích nổi bật & lý do bạn phù hợp: Đạt hiệu suất 98% xử lý đơn hàng năm 2025\nTệp đính kèm: don_xin_dieu_chuyen_dis.pdf")
                            .status("PENDING")
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .build();
                        departmentTransferRequestRepository.save(req1);
                        System.out.println("SEEDED sample transfer request ID #" + req1.getRequestId());
                    }
                }
            } catch (Exception reqEx) {
                System.out.println("Warning seeding sample transfer request: " + reqEx.getMessage());
            }

        } catch (Exception e) {
            System.err.println("Error seeding staff and managers: " + e.getMessage());
        }
    }

    private void seedSkills() {
        JobCategory tech = jobCategoryRepository.findAll().stream()
                .filter(c -> c.getCategoryName().equals("Lập trình")).findFirst().orElse(null);
        JobCategory design = jobCategoryRepository.findAll().stream()
                .filter(c -> c.getCategoryName().equals("Thiết kế")).findFirst().orElse(null);
        JobCategory marketing = jobCategoryRepository.findAll().stream()
                .filter(c -> c.getCategoryName().equals("Marketing")).findFirst().orElse(null);
        JobCategory translation = jobCategoryRepository.findAll().stream()
                .filter(c -> c.getCategoryName().equals("Dịch thuật")).findFirst().orElse(null);

        if (tech != null) {
            skillRepository.save(Skill.builder().skillName("ReactJS").categoryId(tech.getCategoryId()).build());
            skillRepository.save(Skill.builder().skillName("Spring Boot").categoryId(tech.getCategoryId()).build());
            skillRepository.save(Skill.builder().skillName("WordPress").categoryId(tech.getCategoryId()).build());
            skillRepository.save(Skill.builder().skillName("Flutter").categoryId(tech.getCategoryId()).build());
        }
        if (design != null) {
            skillRepository.save(Skill.builder().skillName("Figma").categoryId(design.getCategoryId()).build());
            skillRepository.save(Skill.builder().skillName("Photoshop").categoryId(design.getCategoryId()).build());
            skillRepository.save(Skill.builder().skillName("UI/UX Design").categoryId(design.getCategoryId()).build());
        }
        if (marketing != null) {
            skillRepository.save(Skill.builder().skillName("Google Ads").categoryId(marketing.getCategoryId()).build());
            skillRepository.save(Skill.builder().skillName("SEO").categoryId(marketing.getCategoryId()).build());
        }
        if (translation != null) {
            skillRepository.save(Skill.builder().skillName("English Translation").categoryId(translation.getCategoryId()).build());
        }
    }

    private List<Skill> filterNonNullSkills(Skill... skills) {
        List<Skill> list = new ArrayList<>();
        for (Skill s : skills) {
            if (s != null) {
                list.add(s);
            }
        }
        return list;
    }
}

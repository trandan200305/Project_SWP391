package com.cny.backend.admin.service;

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
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminService {

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private StaffInvitationRepository staffInvitationRepository;

    @Autowired
    private FreelancerRepository freelancerRepository;

    @Autowired
    private EmployerRepository employerRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private JobCategoryRepository jobCategoryRepository;

    @Autowired
    private DashboardRepository dashboardRepository;

    @Autowired
    private com.cny.backend.admin.repository.ManagerRepository managerRepository;

    @Autowired
    private com.cny.backend.admin.repository.StaffRepository staffRepository;

    @Autowired
    private com.cny.backend.admin.repository.AdminRepository adminRepository;

    private static final Set<String> PROTECTED_ADMIN_EMAILS = Set.of(
        "illyasviel1252004@gmail.com",
        "admin@lancerpro.com"
    );

    
    public AdminStatsDto getStats(String period) {
        int days = period.equals("7days") ? 7 : (period.equals("365days") ? 365 : 30);

        try {
            int totalFreelancers = dashboardRepository.countNewFreelancers(-days);
            int totalEmployers = dashboardRepository.countNewEmployers(-days);
            int totalUsers = totalFreelancers + totalEmployers;
            
            int activeProjects = dashboardRepository.countActiveProjects(-days);
            int pendingWithdrawals = dashboardRepository.countPendingWithdrawals();

            double totalRevenue = 0.0;
            try {
                Double dbRevenue = dashboardRepository.calculateTotalRevenue(-days);
                if (dbRevenue != null) {
                    totalRevenue = dbRevenue;
                }
            } catch (Exception e) {
                try {
                    Double fallbackRev = dashboardRepository.calculateTotalRevenue(-days);
                    if (fallbackRev != null) {
                        totalRevenue = fallbackRev;
                    }
                } catch (Exception ex) {
                    totalRevenue = 0.0;
                }
            }

            int activeDisputes = 0;
            try {
                activeDisputes = dashboardRepository.countActiveDisputes();
            } catch(Exception e) {}

            return AdminStatsDto.builder()
                    .totalUsers(totalUsers)
                    .activeProjects(activeProjects)
                    .totalRevenue(totalRevenue)
                    .activeDisputes(activeDisputes)
                    .pendingWithdrawals(pendingWithdrawals)
                    .usersGrowthPercent(0.0)
                    .projectsGrowthPercent(0.0)
                    .revenueGrowthPercent(0.0)
                    .build();
        } catch (Exception e) {
            return AdminStatsDto.builder()
                    .totalUsers(1284)
                    .activeProjects(452)
                    .totalRevenue(128500.0)
                    .activeDisputes(18)
                    .pendingWithdrawals(2)
                    .usersGrowthPercent(12.0)
                    .projectsGrowthPercent(5.0)
                    .revenueGrowthPercent(8.2)
                    .build();
        }
    }

    public List<UserGrowthTrendDto> getUserGrowthTrend() {
        List<UserGrowthTrendDto> trend = new ArrayList<>();
        try {
            for (int i = 5; i >= 0; i--) {
                String monthLabel = dashboardRepository.getMonthLabel(-i);
                
                int currF = dashboardRepository.countFreelancersByMonthOffset(-i);
                int currE = dashboardRepository.countEmployersByMonthOffset(-i);
                
                int prevF = dashboardRepository.countFreelancersByMonthOffset(-(i + 1));
                int prevE = dashboardRepository.countEmployersByMonthOffset(-(i + 1));
                
                trend.add(UserGrowthTrendDto.builder()
                        .label(monthLabel)
                        .value(currF + currE)
                        .compareValue(prevF + prevE)
                        .build());
            }
        } catch (Exception e) {}
        return trend;
    }

    public List<RevenueTrendDto> getRevenueTrend() {
        List<RevenueTrendDto> trend = new ArrayList<>();
        try {
            for (int i = 3; i >= 0; i--) {
                String qLabel = dashboardRepository.getQuarterLabel(-i);
                Double rev = dashboardRepository.calculateRevenueByQuarterOffset(-i);
                
                trend.add(RevenueTrendDto.builder()
                        .label(qLabel)
                        .value(rev != null ? rev : 0.0)
                        .build());
            }
        } catch (Exception e) {}
        return trend;
    }

    public PlatformFeeDto getFeeConfig() {
        try {
            Double currentFee = dashboardRepository.getLatestFeeConfig();
            return PlatformFeeDto.builder()
                    .fee(currentFee != null ? currentFee : 10.0)
                    .build();
        } catch (Exception e) {
            return PlatformFeeDto.builder()
                    .fee(10.0)
                    .build();
        }
    }

    @Transactional
    public PlatformFeeDto updateFeeConfig(double fee, int adminId) {
        try {
            dashboardRepository.insertFeeConfig(fee);
            dashboardRepository.logAudit(adminId, "UPDATE_FEE_RATE", "FINANCE", "Đã cấu hình lại mức phí dịch vụ của nền tảng thành " + fee + "%");

            return PlatformFeeDto.builder()
                    .success(true)
                    .fee(fee)
                    .build();
        } catch (Exception e) {
            return PlatformFeeDto.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build();
        }
    }

    public List<AdminUserDto> getUsers() {
        List<AdminUserDto> users = new ArrayList<>();
        
        List<Freelancer> freelancers = freelancerRepository.findAll();
        for (Freelancer f : freelancers) {
            if (f.getIsDeleted() != null && f.getIsDeleted()) continue;
            
            users.add(AdminUserDto.builder()
                    .id(f.getProfileId())
                    .name(f.getDisplayName())
                    .email(f.getEmail())
                    .status(f.getStatus())
                    .role("FREELANCER")
                    .joined(f.getCreatedAt() != null ? f.getCreatedAt().toString().substring(0, 10) : "")
                    .lastLogin(f.getLastLoginAt() != null ? f.getLastLoginAt().toString() : null)
                    .isProtectedAdmin(false)
                    .build());
        }

        List<Employer> employers = employerRepository.findAll();
        for (Employer e : employers) {
            if (e.getIsDeleted() != null && e.getIsDeleted()) continue;
            
            users.add(AdminUserDto.builder()
                    .id(e.getEmployerId())
                    .name(e.getDisplayName())
                    .email(e.getEmail())
                    .status(e.getStatus())
                    .role("EMPLOYER")
                    .joined(e.getCreatedAt() != null ? e.getCreatedAt().toString().substring(0, 10) : "")
                    .lastLogin(e.getLastLoginAt() != null ? e.getLastLoginAt().toString() : null)
                    .isProtectedAdmin(false)
                    .build());
        }

        List<com.cny.backend.admin.entity.Manager> managers = managerRepository.findAll();
        for (com.cny.backend.admin.entity.Manager m : managers) {
            if (m.getIsDeleted() != null && m.getIsDeleted()) continue;
            
            users.add(AdminUserDto.builder()
                    .id(m.getManagerId())
                    .name(m.getDisplayName())
                    .email(m.getEmail())
                    .status(m.getStatus())
                    .role("MANAGER")
                    .joined(m.getCreatedAt() != null ? m.getCreatedAt().toString().substring(0, 10) : "")
                    .lastLogin(m.getLastLoginAt() != null ? m.getLastLoginAt().toString() : null)
                    .isProtectedAdmin(false)
                    .build());
        }

        List<com.cny.backend.admin.entity.Staff> staff = staffRepository.findAll();
        for (com.cny.backend.admin.entity.Staff s : staff) {
            if (s.getIsDeleted() != null && s.getIsDeleted()) continue;
            
            users.add(AdminUserDto.builder()
                    .id(s.getStaffId())
                    .name(s.getDisplayName())
                    .email(s.getEmail())
                    .status(s.getStatus())
                    .role("STAFF")
                    .joined(s.getCreatedAt() != null ? s.getCreatedAt().toString().substring(0, 10) : "")
                    .lastLogin(s.getLastLoginAt() != null ? s.getLastLoginAt().toString() : null)
                    .isProtectedAdmin(false)
                    .build());
        }
        
        return users;
    }

    @Transactional
    public Map<String, Object> updateUserStatus(int id, String role, String status, String reason, int adminId) {
        Map<String, Object> response = new HashMap<>();
        
        if ("EMPLOYER".equalsIgnoreCase(role)) {
            Optional<Employer> employerOpt = employerRepository.findById(id);
            if (employerOpt.isPresent()) {
                Employer emp = employerOpt.get();
                String oldStatus = emp.getStatus();
                emp.setStatus(status);
                employerRepository.save(emp);
                
                dashboardRepository.logEmployerStatusHistory(id, oldStatus != null ? oldStatus : "ACTIVE", status, reason != null ? reason : "Lý do bảo mật");
                
                sendNotification(id, "EMPLOYER", status, reason);
                writeAuditLog(adminId, "CHANGE_STATUS", "USER_MANAGEMENT", "Thay đổi trạng thái Employer #" + id + " (" + emp.getEmail() + ") từ " + oldStatus + " → " + status + " | Lý do: " + reason);
                
                response.put("success", true);
                response.put("message", "Đã cập nhật trạng thái Employer thành công.");
                return response;
            }
        } else if ("MANAGER".equalsIgnoreCase(role)) {
            Optional<com.cny.backend.admin.entity.Manager> managerOpt = managerRepository.findById(id);
            if (managerOpt.isPresent()) {
                com.cny.backend.admin.entity.Manager mgr = managerOpt.get();
                String oldStatus = mgr.getStatus();
                mgr.setStatus(status);
                managerRepository.save(mgr);
                
                writeAuditLog(adminId, "CHANGE_STATUS", "USER_MANAGEMENT", "Thay đổi trạng thái Manager #" + id + " (" + mgr.getEmail() + ") từ " + oldStatus + " → " + status + " | Lý do: " + reason);
                
                response.put("success", true);
                response.put("message", "Đã cập nhật trạng thái Manager thành công.");
                return response;
            }
        } else if ("STAFF".equalsIgnoreCase(role)) {
            Optional<com.cny.backend.admin.entity.Staff> staffOpt = staffRepository.findById(id);
            if (staffOpt.isPresent()) {
                com.cny.backend.admin.entity.Staff stf = staffOpt.get();
                String oldStatus = stf.getStatus();
                stf.setStatus(status);
                staffRepository.save(stf);
                
                writeAuditLog(adminId, "CHANGE_STATUS", "USER_MANAGEMENT", "Thay đổi trạng thái Staff #" + id + " (" + stf.getEmail() + ") từ " + oldStatus + " → " + status + " | Lý do: " + reason);
                
                response.put("success", true);
                response.put("message", "Đã cập nhật trạng thái Staff thành công.");
                return response;
            }
        } else if ("FREELANCER".equalsIgnoreCase(role)) {
            Optional<Freelancer> freelancerOpt = freelancerRepository.findById(id);
            if (freelancerOpt.isPresent()) {
                Freelancer f = freelancerOpt.get();
                String oldStatus = f.getStatus();
                f.setStatus(status);
                freelancerRepository.save(f);
                
                dashboardRepository.logFreelancerStatusHistory(id, oldStatus != null ? oldStatus : "ACTIVE", status, reason != null ? reason : "Lý do bảo mật");
                
                sendNotification(id, "FREELANCER", status, reason);
                writeAuditLog(adminId, "CHANGE_STATUS", "USER_MANAGEMENT", "Thay đổi trạng thái Freelancer #" + id + " (" + f.getEmail() + ") từ " + oldStatus + " → " + status + " | Lý do: " + reason);
                
                response.put("success", true);
                response.put("message", "Đã cập nhật trạng thái Freelancer thành công.");
                return response;
            }
        }

        response.put("success", false);
        response.put("message", "Không tìm thấy người dùng (hoặc Role không hợp lệ)");
        return response;
    }

    private void sendNotification(int id, String role, String status, String reason) {
        String notifTitle = "";
        String notifContent = "";
        String notifType = "SYSTEM";

        if ("LOCKED".equals(status)) {
            notifTitle = " Tài khoản của bạn đã bị tạm khóa";
            notifContent = "Tài khoản của bạn đã bị Admin tạm khóa với lý do: " + 
                (reason != null ? reason : "Vi phạm chính sách nền tảng") + 
                ". Trong thời gian bị khóa, bạn sẽ không thể đăng nhập hoặc sử dụng các dịch vụ trên hệ thống. " +
                "Vui lòng liên hệ bộ phận hỗ trợ qua email support@vlance.vn để được giải quyết.";
        } else if ("BANNED".equals(status)) {
            notifTitle = " Tài khoản của bạn đã bị cấm vĩnh viễn";
            notifContent = "Tài khoản của bạn đã bị Admin cấm vĩnh viễn với lý do: " + 
                (reason != null ? reason : "Vi phạm nghiêm trọng chính sách nền tảng") + 
                ". Quyết định này có hiệu lực ngay lập tức và không thể đảo ngược.";
        } else if ("ACTIVE".equals(status)) {
            notifTitle = " Tài khoản của bạn đã được mở khóa";
            notifContent = "Chúc mừng! Tài khoản của bạn đã được Admin mở khóa thành công.";
        }

        if (!notifTitle.isEmpty()) {
            if ("FREELANCER".equals(role)) {
                dashboardRepository.insertNotificationFreelancer(id, notifTitle, notifContent, notifType);
            } else {
                dashboardRepository.insertNotificationEmployer(id, notifTitle, notifContent, notifType);
            }
        }
    }

    private void writeAuditLog(int adminId, String action, String module, String description) {
        dashboardRepository.logAudit(adminId, action, module, description);
    }

    public List<PendingProjectDto> getPendingProjects() {
        return dashboardRepository.getPendingProjects().stream().map(p -> 
            PendingProjectDto.builder()
                .id(p.getId())
                .title(p.getTitle())
                .description(p.getDescription())
                .type(p.getType())
                .budget(p.getBudget())
                .createdAt(p.getCreatedAt())
                .clientName(p.getClientName())
                .build()
        ).collect(Collectors.toList());
    }

    
    @Transactional
    public Map<String, Object> moderateProject(int id, boolean approve, String reason, int adminId) {
        Map<String, Object> response = new HashMap<>();
        String newStatus = approve ? "PUBLISHED" : "REJECTED";
        try {
            dashboardRepository.updateProjectStatus(id, newStatus, reason);
            
            writeAuditLog(adminId, "MODERATE_PROJECT", "PROJECTS", "Duyệt dự án #" + id + " thành " + newStatus + " | Lý do: " + reason);
            
            response.put("success", true);
            response.put("message", "Đã duyệt dự án thành công.");
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
        }
        return response;
    }

    
    public List<WithdrawalDto> getWithdrawals() {
        return dashboardRepository.getAllWithdrawalRequests().stream().map(p -> 
            WithdrawalDto.builder()
                .id(p.getId())
                .amount(p.getAmount())
                .status(p.getStatus())
                .createdAt(p.getCreatedAt())
                .userName(p.getFreelancerName())
                .userEmail(p.getFreelancerEmail())
                .bankName(p.getBankName())
                .accountNumber(p.getAccountNumber())
                .build()
        ).collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> processWithdrawal(int id, String status, int adminId) {
        Map<String, Object> response = new HashMap<>();
        try {
            dashboardRepository.processWithdrawalRequest(id, status, adminId);
            writeAuditLog(adminId, "PROCESS_WITHDRAWAL", "FINANCE", "Xử lý yêu cầu rút tiền #" + id + " thành " + status);
            response.put("success", true);
            response.put("message", "Đã xử lý yêu cầu rút tiền thành công.");
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
        }
        return response;
    }

    public List<AdminAuditLogDto> getAuditLogs() {
        return dashboardRepository.getAuditLogs().stream().map(p -> 
            AdminAuditLogDto.builder()
                .id(p.getId())
                .status(p.getStatus())
                .module(p.getModule())
                .detail(p.getDetail())
                .timestamp(p.getTimestamp())
                .source(p.getSource())
                .build()
        ).collect(Collectors.toList());
    }

    public List<JobCategoryDto> getJobCategories() {
        return dashboardRepository.getJobCategories().stream().map(p -> 
            JobCategoryDto.builder()
                .id(p.getId())
                .name(p.getName())
                .description(p.getDescription())
                .isActive(p.getIsActive())
                .build()
        ).collect(Collectors.toList());
    }

    public List<KycRequestDto> getKycRequests() {
        List<KycRequestDto> list = new ArrayList<>();
        list.add(KycRequestDto.builder()
                .id(1)
                .userName("Nguyễn Minh Anh")
                .userEmail("minhanh@gmail.com")
                .idCard("030094001234")
                .status("PENDING")
                .submittedAt("2026-05-18T10:30:00")
                .build());
        
        list.add(KycRequestDto.builder()
                .id(2)
                .userName("Trần Việt Hoàng")
                .userEmail("hoangtv@gmail.com")
                .idCard("038092005678")
                .status("APPROVED")
                .submittedAt("2026-05-17T15:20:00")
                .build());
        return list;
    }

    public List<DisputeDto> getDisputes() {
        List<DisputeDto> list = new ArrayList<>();
        list.add(DisputeDto.builder()
                .id(1)
                .projectTitle("Xây dựng Website bán hàng Laravel")
                .clientName("LancerPro Client")
                .freelancerName("Nguyễn Minh Anh")
                .amount(15000000)
                .status("OPEN")
                .reason("Freelancer chậm tiến độ bàn giao sản phẩm")
                .createdAt("2026-05-16T09:00:00")
                .build());
        
        list.add(DisputeDto.builder()
                .id(2)
                .projectTitle("Thiết kế Banner Sự kiện")
                .clientName("TechFlow Corporation")
                .freelancerName("Lê Thủy Tiên")
                .amount(2000000)
                .status("RESOLVED")
                .reason("Yêu cầu hoàn trả 50% chi phí do thiết kế lỗi")
                .createdAt("2026-05-14T14:30:00")
                .build());
        return list;
    }

    public List<ReportDto> getReports() {
        List<ReportDto> list = new ArrayList<>();
        list.add(ReportDto.builder()
                .id(1)
                .reporterName("Trần Việt Hoàng")
                .reportedName("LancerPro Client")
                .reason("Spam bài đăng tuyển dụng nhiều lần cùng nội dung")
                .status("PENDING")
                .createdAt("2026-05-18T08:15:00")
                .build());
        
        list.add(ReportDto.builder()
                .id(2)
                .reporterName("Nguyễn Minh Anh")
                .reportedName("Vũ Hoàng Nam")
                .reason("Lời lẽ thô tục xúc phạm trong khung chat")
                .status("RESOLVED")
                .createdAt("2026-05-15T11:45:00")
                .build());
        return list;
    }

    public List<ArticleDto> getArticles() {
        List<ArticleDto> list = new ArrayList<>();
        list.add(ArticleDto.builder()
                .id(1)
                .title("Kinh nghiệm làm việc tự do (Freelancer) thành công năm 2026")
                .author("Admin")
                .views(1245)
                .status("PUBLISHED")
                .publishedAt("2026-05-10T08:00:00")
                .build());
        
        list.add(ArticleDto.builder()
                .id(2)
                .title("Làm thế nào để thuê được Freelancer IT chất lượng cao?")
                .author("Admin")
                .views(856)
                .status("DRAFT")
                .publishedAt("2026-05-12T14:00:00")
                .build());
        return list;
    }

    public List<SupportTicketDto> getTickets() {
        List<SupportTicketDto> list = new ArrayList<>();
        list.add(SupportTicketDto.builder()
                .id(1)
                .subject("Lỗi không nạp tiền qua cổng VNPay")
                .sender("minhanh@gmail.com")
                .priority("HIGH")
                .status("OPEN")
                .createdAt("2026-05-19T09:30:00")
                .build());
        
        list.add(SupportTicketDto.builder()
                .id(2)
                .subject("Yêu cầu thay đổi số điện thoại liên kết")
                .sender("hoangtv@gmail.com")
                .priority("LOW")
                .status("CLOSED")
                .createdAt("2026-05-17T16:00:00")
                .build());
        return list;
    }

    public List<SeoConfigDto> getSeoConfigs() {
        List<SeoConfigDto> list = new ArrayList<>();
        list.add(SeoConfigDto.builder()
                .id(1)
                .pageName("Home Page")
                .title("LancerPro - Nền tảng Freelancer lớn nhất Việt Nam")
                .description("Kết nối doanh nghiệp với hàng ngàn freelancer tài năng trên toàn quốc.")
                .keywords("freelancer, thue freelancer, viec lam tu do, thiet ke web")
                .build());
        
        list.add(SeoConfigDto.builder()
                .id(2)
                .pageName("Find Jobs Page")
                .title("Tìm việc freelance lương cao tại LancerPro")
                .description("Hàng trăm dự án mới mỗi ngày thuộc nhiều lĩnh vực khác nhau.")
                .keywords("tim viec freelance, viec lam it freelance, viet lach, marketing")
                .build());
        return list;
    }

    @Transactional
    public Map<String, Object> createManager(ManagerCreateDto dto, int adminId) {
        Map<String, Object> response = new HashMap<>();
        String email = dto.getEmail();
        if (email == null || email.trim().isEmpty()) {
            response.put("success", false);
            response.put("message", "Email không được để trống!");
            return response;
        }

        if (adminRepository.findByEmail(email).isPresent() ||
            freelancerRepository.findByEmail(email).isPresent() ||
            employerRepository.findByEmail(email).isPresent() ||
            managerRepository.findByEmail(email).isPresent() ||
            staffRepository.findByEmail(email).isPresent()) {
            response.put("success", false);
            response.put("message", "Email đã tồn tại trong hệ thống!");
            return response;
        }

        com.cny.backend.admin.entity.Manager mgr = com.cny.backend.admin.entity.Manager.builder()
                .email(email)
                .passwordHash(dto.getPassword() != null ? dto.getPassword() : "123456")
                .displayName(dto.getDisplayName() != null ? dto.getDisplayName() : "Manager")
                .fullName(dto.getFullName())
                .phone(dto.getPhone())
                .status("ACTIVE")
                .department(dto.getDepartment() != null ? dto.getDepartment() : "General")
                .managedByAdmin(adminId)
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        mgr = managerRepository.save(mgr);
        writeAuditLog(adminId, "CREATE_MANAGER", "USER_MANAGEMENT", "Admin #" + adminId + " đã tạo tài khoản Manager: " + email + " (ID: " + mgr.getManagerId() + ")");

        response.put("success", true);
        response.put("message", "Tạo tài khoản Manager thành công.");
        response.put("manager", ManagerDto.builder()
                .managerId(mgr.getManagerId())
                .email(mgr.getEmail())
                .displayName(mgr.getDisplayName())
                .fullName(mgr.getFullName())
                .phone(mgr.getPhone())
                .status(mgr.getStatus())
                .department(mgr.getDepartment())
                .managedByAdmin(mgr.getManagedByAdmin())
                .createdAt(mgr.getCreatedAt().toString())
                .updatedAt(mgr.getUpdatedAt().toString())
                .build());
        return response;
    }

    @Transactional
    public Map<String, Object> createStaff(StaffCreateDto dto, int adminId) {
        Map<String, Object> response = new HashMap<>();
        String email = dto.getEmail();
        if (email == null || email.trim().isEmpty()) {
            response.put("success", false);
            response.put("message", "Email không được để trống!");
            return response;
        }

        if (adminRepository.findByEmail(email).isPresent() ||
            freelancerRepository.findByEmail(email).isPresent() ||
            employerRepository.findByEmail(email).isPresent() ||
            managerRepository.findByEmail(email).isPresent() ||
            staffRepository.findByEmail(email).isPresent()) {
            response.put("success", false);
            response.put("message", "Email đã tồn tại trong hệ thống!");
            return response;
        }

        com.cny.backend.admin.entity.Manager mgr = null;
        if (dto.getManagerId() != null) {
            Optional<com.cny.backend.admin.entity.Manager> mgrOpt = managerRepository.findById(dto.getManagerId());
            if (mgrOpt.isPresent()) {
                mgr = mgrOpt.get();
            } else {
                response.put("success", false);
                response.put("message", "Không tìm thấy Manager được chỉ định!");
                return response;
            }
        }

        com.cny.backend.admin.entity.Staff stf = com.cny.backend.admin.entity.Staff.builder()
                .email(email)
                .passwordHash(dto.getPassword() != null ? dto.getPassword() : "123456")
                .displayName(dto.getDisplayName() != null ? dto.getDisplayName() : "Staff")
                .fullName(dto.getFullName())
                .phone(dto.getPhone())
                .status("ACTIVE")
                .specialization(dto.getSpecialization() != null ? dto.getSpecialization() : "General")
                .manager(mgr)
                .createdByAdmin(adminId)
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        stf = staffRepository.save(stf);
        writeAuditLog(adminId, "CREATE_STAFF", "USER_MANAGEMENT", "Admin #" + adminId + " đã tạo tài khoản Staff: " + email + " (ID: " + stf.getStaffId() + ")");

        response.put("success", true);
        response.put("message", "Tạo tài khoản Staff thành công.");
        response.put("staff", StaffDto.builder()
                .staffId(stf.getStaffId())
                .email(stf.getEmail())
                .displayName(stf.getDisplayName())
                .fullName(stf.getFullName())
                .phone(stf.getPhone())
                .status(stf.getStatus())
                .specialization(stf.getSpecialization())
                .managerId(stf.getManager() != null ? stf.getManager().getManagerId() : null)
                .managerName(stf.getManager() != null ? stf.getManager().getDisplayName() : null)
                .createdByAdmin(stf.getCreatedByAdmin())
                .createdAt(stf.getCreatedAt().toString())
                .updatedAt(stf.getUpdatedAt().toString())
                .build());
        return response;
    }

    public List<ManagerDto> getAllManagers() {
        return managerRepository.findAll().stream()
                .filter(m -> m.getIsDeleted() == null || !m.getIsDeleted())
                .map(m -> ManagerDto.builder()
                        .managerId(m.getManagerId())
                        .email(m.getEmail())
                        .displayName(m.getDisplayName())
                        .fullName(m.getFullName())
                        .phone(m.getPhone())
                        .avatarUrl(m.getAvatarUrl())
                        .status(m.getStatus())
                        .department(m.getDepartment())
                        .managedByAdmin(m.getManagedByAdmin())
                        .createdAt(m.getCreatedAt() != null ? m.getCreatedAt().toString() : null)
                        .updatedAt(m.getUpdatedAt() != null ? m.getUpdatedAt().toString() : null)
                        .build())
                .collect(Collectors.toList());
    }

    public List<StaffDto> getAllStaff() {
        return staffRepository.findAll().stream()
                .filter(s -> s.getIsDeleted() == null || !s.getIsDeleted())
                .map(s -> StaffDto.builder()
                        .staffId(s.getStaffId())
                        .email(s.getEmail())
                        .displayName(s.getDisplayName())
                        .fullName(s.getFullName())
                        .phone(s.getPhone())
                        .avatarUrl(s.getAvatarUrl())
                        .status(s.getStatus())
                        .specialization(s.getSpecialization())
                        .managerId(s.getManager() != null ? s.getManager().getManagerId() : null)
                        .managerName(s.getManager() != null ? s.getManager().getDisplayName() : null)
                        .createdByAdmin(s.getCreatedByAdmin())
                        .createdAt(s.getCreatedAt() != null ? s.getCreatedAt().toString() : null)
                        .updatedAt(s.getUpdatedAt() != null ? s.getUpdatedAt().toString() : null)
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> inviteStaffOrManager(Map<String, String> payload, int adminId) {
        Map<String, Object> response = new HashMap<>();
        String email = payload.get("email");
        String role = payload.get("role"); // "MANAGER" or "STAFF"

        if (email == null || email.trim().isEmpty()) {
            response.put("success", false);
            response.put("message", "Email không được để trống!");
            return response;
        }
        if (role == null || (!role.equalsIgnoreCase("MANAGER") && !role.equalsIgnoreCase("STAFF"))) {
            response.put("success", false);
            response.put("message", "Vai trò không hợp lệ!");
            return response;
        }

        email = email.trim().toLowerCase();
        role = role.toUpperCase();

        // Check if email already exists in any table
        if (adminRepository.findByEmail(email).isPresent() ||
            freelancerRepository.findByEmail(email).isPresent() ||
            employerRepository.findByEmail(email).isPresent() ||
            managerRepository.findByEmail(email).isPresent() ||
            staffRepository.findByEmail(email).isPresent()) {
            response.put("success", false);
            response.put("message", "Email đã tồn tại trong hệ thống!");
            return response;
        }

        // Clean up any existing pending invitations for this email to avoid duplicates
        staffInvitationRepository.findByEmail(email).ifPresent(inv -> staffInvitationRepository.delete(inv));

        // Generate invitation token
        String token = java.util.UUID.randomUUID().toString();
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(24);

        // Create the invitation record
        com.cny.backend.admin.entity.StaffInvitation invitation = com.cny.backend.admin.entity.StaffInvitation.builder()
                .email(email)
                .role(role)
                .token(token)
                .expiresAt(expiresAt)
                .status("PENDING")
                .build();
        staffInvitationRepository.save(invitation);

        // Create placeholder user account with status "INVITED"
        String emailPrefix = email.split("@")[0];
        if ("MANAGER".equals(role)) {
            com.cny.backend.admin.entity.Manager mgr = com.cny.backend.admin.entity.Manager.builder()
                    .email(email)
                    .passwordHash("INVITED_PENDING")
                    .displayName(emailPrefix)
                    .status("INVITED")
                    .department("General")
                    .managedByAdmin(adminId)
                    .isDeleted(false)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            managerRepository.save(mgr);
        } else {
            com.cny.backend.admin.entity.Staff stf = com.cny.backend.admin.entity.Staff.builder()
                    .email(email)
                    .passwordHash("INVITED_PENDING")
                    .displayName(emailPrefix)
                    .status("INVITED")
                    .specialization("General")
                    .manager(null)
                    .createdByAdmin(adminId)
                    .isDeleted(false)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            staffRepository.save(stf);
        }

        // Send Email
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(email);
            message.setSubject("[LancerPro] Mời tham gia quản trị hệ thống");

            String onboardingUrl = "http://localhost:3000/onboard?token=" + token;
            String emailContent = "Chào bạn,\n\n"
                    + "Bạn được quản trị viên mời tham gia quản trị hệ thống LancerPro với vai trò: " + role + ".\n\n"
                    + "Vui lòng truy cập liên kết dưới đây để thiết lập tài khoản của bạn (liên kết có hiệu lực trong 24 giờ):\n"
                    + onboardingUrl + "\n\n"
                    + "Trân trọng,\n"
                    + "Đội ngũ LancerPro";

            message.setText(emailContent);
            mailSender.send(message);
        } catch (Exception e) {
            e.printStackTrace();
            // We can still return success, just warn about email send failure
            writeAuditLog(adminId, "INVITE_USER", "USER_MANAGEMENT", "Mời " + email + " làm " + role + " (Email gửi lỗi: " + e.getMessage() + ")");
            response.put("success", true);
            response.put("message", "Tạo lời mời thành công (Nhưng có lỗi gửi email: " + e.getMessage() + "). Link kích hoạt: http://localhost:3000/onboard?token=" + token);
            return response;
        }

        writeAuditLog(adminId, "INVITE_USER", "USER_MANAGEMENT", "Đã gửi lời mời kích hoạt tài khoản cho " + email + " làm " + role);
        response.put("success", true);
        response.put("message", "Đã gửi email lời mời kích hoạt tài khoản thành công!");
        return response;
    }
}


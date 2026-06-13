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
import com.cny.backend.department.entity.*;
import com.cny.backend.department.repository.*;


import com.cny.backend.email.service.EmailService;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.messaging.simp.SimpMessagingTemplate;
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
    private EmailService emailService;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

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
    private EmployerProfileRequestRepository employerProfileRequestRepository;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Autowired
    private com.cny.backend.admin.repository.ManagerRepository managerRepository;

    @Autowired
    private com.cny.backend.admin.repository.StaffRepository staffRepository;

    @Autowired
    private com.cny.backend.department.repository.DepartmentRepository departmentRepository;

    @Autowired
    private com.cny.backend.admin.repository.AdminRepository adminRepository;

    @Autowired
    private com.cny.backend.department.repository.DepartmentVerificationTaskRepository departmentVerificationTaskRepository;

    @Autowired
    private com.cny.backend.department.repository.DepartmentTaskSignoffRepository departmentTaskSignoffRepository;

    @Autowired
    private com.cny.backend.admin.repository.ViolationReportRepository violationReportRepository;

    @Autowired
    private com.cny.backend.admin.repository.DisputeRepository disputeRepository;

    @Autowired
    private com.cny.backend.admin.repository.WarningTemplateRepository warningTemplateRepository;

    private static final Set<String> PROTECTED_ADMIN_EMAILS = Set.of(
        "luongnd2625F@gmail.com",
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
                    .departmentId(m.getDepartmentEntity() != null ? m.getDepartmentEntity().getDepartmentId() : null)
                    .departmentName(m.getDepartmentEntity() != null ? m.getDepartmentEntity().getName() : null)
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
                    .departmentId(s.getDepartmentEntity() != null ? s.getDepartmentEntity().getDepartmentId() : null)
                    .departmentName(s.getDepartmentEntity() != null ? s.getDepartmentEntity().getName() : null)
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
                if ("DELETED".equalsIgnoreCase(status)) {
                    emp.setIsDeleted(true);
                    emp.setStatus("DELETED");
                } else {
                    emp.setIsDeleted(false);
                    emp.setStatus(status);
                }
                employerRepository.save(emp);
                
                dashboardRepository.logEmployerStatusHistory(id, oldStatus != null ? oldStatus : "ACTIVE", status, reason != null ? reason : "Lý do bảo mật");
                
                sendNotification(id, "EMPLOYER", status, reason);

                if ("LOCKED".equalsIgnoreCase(status) || "ACTIVE".equalsIgnoreCase(status) || "DELETED".equalsIgnoreCase(status) || "BANNED".equalsIgnoreCase(status)) {
                    Map<String, Object> event = new HashMap<>();
                    event.put("type", "DELETED".equalsIgnoreCase(status) || "LOCKED".equalsIgnoreCase(status) || "BANNED".equalsIgnoreCase(status) ? "ACCOUNT_SUSPENDED" : "ACCOUNT_REACTIVATED");
                    event.put("role", "EMPLOYER");
                    event.put("id", id);
                    event.put("reason", reason != null ? reason : "Tài khoản bị tạm ngưng bởi Admin");
                    messagingTemplate.convertAndSend("/topic/account-status/EMPLOYER/" + id, event);
                }

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
                if ("DELETED".equalsIgnoreCase(status)) {
                    mgr.setIsDeleted(true);
                    mgr.setStatus("DELETED");
                } else {
                    mgr.setIsDeleted(false);
                    mgr.setStatus(status);
                }
                managerRepository.save(mgr);

                if ("LOCKED".equalsIgnoreCase(status) || "ACTIVE".equalsIgnoreCase(status) || "DELETED".equalsIgnoreCase(status) || "BANNED".equalsIgnoreCase(status)) {
                    Map<String, Object> event = new HashMap<>();
                    event.put("type", "DELETED".equalsIgnoreCase(status) || "LOCKED".equalsIgnoreCase(status) || "BANNED".equalsIgnoreCase(status) ? "ACCOUNT_SUSPENDED" : "ACCOUNT_REACTIVATED");
                    event.put("role", "MANAGER");
                    event.put("id", id);
                    event.put("reason", reason != null ? reason : "Tài khoản bị tạm ngưng bởi Admin");
                    messagingTemplate.convertAndSend("/topic/account-status/MANAGER/" + id, event);
                }

                if ("DELETED".equalsIgnoreCase(status) || "LOCKED".equalsIgnoreCase(status) || "SUSPENDED".equalsIgnoreCase(status) || "BANNED".equalsIgnoreCase(status)) {
                    Optional<com.cny.backend.admin.entity.StaffInvitation> invOpt = staffInvitationRepository.findByEmail(mgr.getEmail());
                    if (invOpt.isPresent()) {
                        com.cny.backend.admin.entity.StaffInvitation invitation = invOpt.get();
                        invitation.setStatus("REVOKED");
                        staffInvitationRepository.save(invitation);

                        Map<String, Object> revokeEvent = new HashMap<>();
                        revokeEvent.put("status", "REVOKED");
                        revokeEvent.put("message", "Thao tác thiết lập tài khoản đã bị hủy bỏ bởi Quản trị viên.");
                        messagingTemplate.convertAndSend("/topic/invitation-status/" + invitation.getToken(), revokeEvent);
                    }
                }
                
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
                if ("DELETED".equalsIgnoreCase(status)) {
                    stf.setIsDeleted(true);
                    stf.setStatus("DELETED");
                } else {
                    stf.setIsDeleted(false);
                    stf.setStatus(status);
                }
                staffRepository.save(stf);

                if ("LOCKED".equalsIgnoreCase(status) || "ACTIVE".equalsIgnoreCase(status) || "DELETED".equalsIgnoreCase(status) || "BANNED".equalsIgnoreCase(status)) {
                    Map<String, Object> event = new HashMap<>();
                    event.put("type", "DELETED".equalsIgnoreCase(status) || "LOCKED".equalsIgnoreCase(status) || "BANNED".equalsIgnoreCase(status) ? "ACCOUNT_SUSPENDED" : "ACCOUNT_REACTIVATED");
                    event.put("role", "STAFF");
                    event.put("id", id);
                    event.put("reason", reason != null ? reason : "Tài khoản bị tạm ngưng bởi Admin");
                    messagingTemplate.convertAndSend("/topic/account-status/STAFF/" + id, event);
                }

                if ("DELETED".equalsIgnoreCase(status) || "LOCKED".equalsIgnoreCase(status) || "SUSPENDED".equalsIgnoreCase(status) || "BANNED".equalsIgnoreCase(status)) {
                    Optional<com.cny.backend.admin.entity.StaffInvitation> invOpt = staffInvitationRepository.findByEmail(stf.getEmail());
                    if (invOpt.isPresent()) {
                        com.cny.backend.admin.entity.StaffInvitation invitation = invOpt.get();
                        invitation.setStatus("REVOKED");
                        staffInvitationRepository.save(invitation);

                        Map<String, Object> revokeEvent = new HashMap<>();
                        revokeEvent.put("status", "REVOKED");
                        revokeEvent.put("message", "Thao tác thiết lập tài khoản đã bị hủy bỏ bởi Quản trị viên.");
                        messagingTemplate.convertAndSend("/topic/invitation-status/" + invitation.getToken(), revokeEvent);
                    }
                }
                
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
                if ("DELETED".equalsIgnoreCase(status)) {
                    f.setIsDeleted(true);
                    f.setStatus("DELETED");
                } else {
                    f.setIsDeleted(false);
                    f.setStatus(status);
                }
                freelancerRepository.save(f);
                
                dashboardRepository.logFreelancerStatusHistory(id, oldStatus != null ? oldStatus : "ACTIVE", status, reason != null ? reason : "Lý do bảo mật");
                
                sendNotification(id, "FREELANCER", status, reason);

                if ("LOCKED".equalsIgnoreCase(status) || "ACTIVE".equalsIgnoreCase(status) || "DELETED".equalsIgnoreCase(status) || "BANNED".equalsIgnoreCase(status)) {
                    Map<String, Object> event = new HashMap<>();
                    event.put("type", "DELETED".equalsIgnoreCase(status) || "LOCKED".equalsIgnoreCase(status) || "BANNED".equalsIgnoreCase(status) ? "ACCOUNT_SUSPENDED" : "ACCOUNT_REACTIVATED");
                    event.put("role", "FREELANCER");
                    event.put("id", id);
                    event.put("reason", reason != null ? reason : "Tài khoản bị tạm ngưng bởi Admin");
                    messagingTemplate.convertAndSend("/topic/account-status/FREELANCER/" + id, event);
                }

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

    private int getValidAdminId(int adminId) {
        if (adminRepository.existsById(adminId)) {
            return adminId;
        }
        List<Admin> allAdmins = adminRepository.findAll();
        if (!allAdmins.isEmpty()) {
            return allAdmins.get(0).getAdminId();
        }
        return 1; // Fallback to 1 if no admins in DB
    }

    private void writeAuditLog(int adminId, String action, String module, String description) {
        int validAdminId = getValidAdminId(adminId);
        dashboardRepository.logAudit(validAdminId, action, module, description);
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
            int validAdminId = getValidAdminId(adminId);
            dashboardRepository.processWithdrawalRequest(id, status, validAdminId);
            writeAuditLog(validAdminId, "PROCESS_WITHDRAWAL", "FINANCE", "Xử lý yêu cầu rút tiền #" + id + " thành " + status);
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
        
        try {
            List<Freelancer> freelancers = freelancerRepository.findAll();
            for (Freelancer f : freelancers) {
                if (f.getKycStatus() != null && !"UNVERIFIED".equalsIgnoreCase(f.getKycStatus())) {
                    list.add(KycRequestDto.builder()
                            .id(f.getProfileId())
                            .userName(f.getDisplayName() != null ? f.getDisplayName() : (f.getFullName() != null ? f.getFullName() : f.getEmail()))
                            .userEmail(f.getEmail())
                            .idCard(f.getIdCardFrontUrl() != null ? f.getIdCardFrontUrl() : "")
                            .status(f.getKycStatus())
                            .submittedAt(f.getKycSubmittedAt() != null ? f.getKycSubmittedAt().toString() : "")
                            .userRole("FREELANCER")
                            .build());
                }
            }
        } catch (Exception e) {
            System.err.println("Error fetching freelancer KYC requests: " + e.getMessage());
        }

        try {
            List<Employer> employers = employerRepository.findAll();
            for (Employer emp : employers) {
                if (emp.getKycStatus() != null && !"UNVERIFIED".equalsIgnoreCase(emp.getKycStatus())) {
                    list.add(KycRequestDto.builder()
                            .id(emp.getEmployerId())
                            .userName(emp.getDisplayName() != null ? emp.getDisplayName() : (emp.getFullName() != null ? emp.getFullName() : emp.getEmail()))
                            .userEmail(emp.getEmail())
                            .idCard(emp.getIdCardFrontUrl() != null ? emp.getIdCardFrontUrl() : "")
                            .status(emp.getKycStatus())
                            .submittedAt(emp.getKycSubmittedAt() != null ? emp.getKycSubmittedAt().toString() : "")
                            .userRole("EMPLOYER")
                            .build());
                }
            }
        } catch (Exception e) {
            System.err.println("Error fetching employer KYC requests: " + e.getMessage());
        }

        return list;
    }

    @Transactional
    public Map<String, Object> moderateKycRequest(int id, boolean approve, String role, int adminId) {
        Map<String, Object> response = new HashMap<>();
        String status = approve ? "APPROVED" : "REJECTED";
        
        if ("FREELANCER".equalsIgnoreCase(role)) {
            Optional<Freelancer> opt = freelancerRepository.findById(id);
            if (opt.isPresent()) {
                Freelancer f = opt.get();
                f.setKycStatus(status);
                f.setIsVerified(approve);
                f.setKycReviewedAt(LocalDateTime.now());
                f.setKycReviewedByStaffId(adminId);
                freelancerRepository.save(f);
                
                try {
                    jdbcTemplate.update("INSERT INTO admin_audit_logs (admin_id, action, module, description, created_at) VALUES (?, 'KYC_MODERATE', 'USER_MANAGEMENT', ?, GETDATE())",
                            adminId, "KYC " + status + " for Freelancer " + f.getEmail());
                } catch (Exception ex) {}

                response.put("success", true);
                response.put("message", "Đã cập nhật KYC Freelancer thành công.");
            } else {
                response.put("success", false);
                response.put("message", "Không tìm thấy Freelancer.");
            }
        } else if ("EMPLOYER".equalsIgnoreCase(role) || "CLIENT".equalsIgnoreCase(role)) {
            Optional<Employer> opt = employerRepository.findById(id);
            if (opt.isPresent()) {
                Employer e = opt.get();
                e.setKycStatus(status);
                e.setIsVerified(approve);
                e.setKycReviewedAt(LocalDateTime.now());
                e.setKycReviewedByStaffId(adminId);
                employerRepository.save(e);

                try {
                    jdbcTemplate.update("INSERT INTO admin_audit_logs (admin_id, action, module, description, created_at) VALUES (?, 'KYC_MODERATE', 'USER_MANAGEMENT', ?, GETDATE())",
                            adminId, "KYC " + status + " for Employer " + e.getEmail());
                } catch (Exception ex) {}

                response.put("success", true);
                response.put("message", "Đã cập nhật KYC Employer thành công.");
            } else {
                response.put("success", false);
                response.put("message", "Không tìm thấy Employer.");
            }
        } else {
            response.put("success", false);
            response.put("message", "Role không hợp lệ.");
        }
        
        return response;
    }


    public List<DisputeDto> getDisputes() {
        return disputeRepository.findAll().stream().map(d -> DisputeDto.builder()
                .id(d.getDisputeId())
                .projectTitle(d.getProjectTitle())
                .clientName(d.getClientName())
                .freelancerName(d.getFreelancerName())
                .amount(d.getAmount() != null ? d.getAmount().doubleValue() : 0.0)
                .status(d.getStatus())
                .reason(d.getReason())
                .priority(d.getPriority())
                .createdAt(d.getCreatedAt() != null ? d.getCreatedAt().toString() : "")
                .build()).collect(Collectors.toList());
    }

    public List<ReportDto> getReports() {
        return violationReportRepository.findAll().stream().map(r -> ReportDto.builder()
                .id(r.getReportId())
                .reporterName(r.getReporterName())
                .reportedName(r.getAccusedName())
                .targetType(r.getTargetType())
                .evidence(r.getEvidence())
                .severity(r.getSeverity())
                .reason(r.getReason())
                .status(r.getStatus())
                .createdAt(r.getCreatedAt() != null ? r.getCreatedAt().toString() : "")
                .build()).collect(Collectors.toList());
    }

    public List<WarningTemplateDto> getWarningTemplates() {
        return warningTemplateRepository.findByIsActiveTrue().stream().map(w -> WarningTemplateDto.builder()
                .id(w.getTemplateId())
                .content(w.getContent())
                .build()).collect(Collectors.toList());
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

        boolean emailExists = adminRepository.findByEmail(email).isPresent() ||
            freelancerRepository.findByEmail(email).filter(f -> !Boolean.TRUE.equals(f.getIsDeleted())).isPresent() ||
            employerRepository.findByEmail(email).filter(e -> !Boolean.TRUE.equals(e.getIsDeleted())).isPresent() ||
            managerRepository.findByEmail(email).filter(m -> !Boolean.TRUE.equals(m.getIsDeleted())).isPresent() ||
            staffRepository.findByEmail(email).filter(s -> !Boolean.TRUE.equals(s.getIsDeleted())).isPresent();

        if (emailExists) {
            response.put("success", false);
            response.put("message", "Email đã tồn tại trong hệ thống!");
            return response;
        }

        com.cny.backend.department.entity.Department dept = null;
        if (dto.getDepartmentId() != null) {
            dept = departmentRepository.findById(dto.getDepartmentId()).orElse(null);
        }
        if (dept == null) {
            dept = departmentRepository.findByCode("GEN").orElse(null);
        }

        Optional<com.cny.backend.admin.entity.Manager> existingManager = managerRepository.findByEmail(email);
        com.cny.backend.admin.entity.Manager mgr;
        if (existingManager.isPresent() && Boolean.TRUE.equals(existingManager.get().getIsDeleted())) {
            mgr = existingManager.get();
            mgr.setDisplayName(dto.getDisplayName() != null ? dto.getDisplayName() : "Manager");
            mgr.setFullName(dto.getFullName());
            mgr.setPhone(dto.getPhone());
            mgr.setPasswordHash(dto.getPassword() != null ? dto.getPassword() : "123456");
            mgr.setDepartment(dept != null ? dept.getName() : "General");
            mgr.setDepartmentEntity(dept);
            mgr.setStatus("ACTIVE");
            mgr.setIsDeleted(false);
            mgr.setUpdatedAt(LocalDateTime.now());
            mgr = managerRepository.save(mgr);
            writeAuditLog(adminId, "REACTIVATE_MANAGER", "USER_MANAGEMENT", "Admin #" + adminId + " đã kích hoạt lại Manager: " + email);
        } else {
            mgr = com.cny.backend.admin.entity.Manager.builder()
                    .email(email)
                    .passwordHash(dto.getPassword() != null ? dto.getPassword() : "123456")
                    .displayName(dto.getDisplayName() != null ? dto.getDisplayName() : "Manager")
                    .fullName(dto.getFullName())
                    .phone(dto.getPhone())
                    .status("ACTIVE")
                    .department(dept != null ? dept.getName() : "General")
                    .departmentEntity(dept)
                    .managedByAdmin(adminId)
                    .isDeleted(false)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            mgr = managerRepository.save(mgr);
            writeAuditLog(adminId, "CREATE_MANAGER", "USER_MANAGEMENT", "Admin #" + adminId + " đã tạo tài khoản Manager: " + email + " (ID: " + mgr.getManagerId() + ")");
        }

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
                .departmentId(mgr.getDepartmentEntity() != null ? mgr.getDepartmentEntity().getDepartmentId() : null)
                .departmentName(mgr.getDepartmentEntity() != null ? mgr.getDepartmentEntity().getName() : null)
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

        boolean emailExists = adminRepository.findByEmail(email).isPresent() ||
            freelancerRepository.findByEmail(email).filter(f -> !Boolean.TRUE.equals(f.getIsDeleted())).isPresent() ||
            employerRepository.findByEmail(email).filter(e -> !Boolean.TRUE.equals(e.getIsDeleted())).isPresent() ||
            managerRepository.findByEmail(email).filter(m -> !Boolean.TRUE.equals(m.getIsDeleted())).isPresent() ||
            staffRepository.findByEmail(email).filter(s -> !Boolean.TRUE.equals(s.getIsDeleted())).isPresent();

        if (emailExists) {
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

        com.cny.backend.department.entity.Department dept = null;
        if (dto.getDepartmentId() != null) {
            dept = departmentRepository.findById(dto.getDepartmentId()).orElse(null);
        }
        if (dept == null && mgr != null) {
            dept = mgr.getDepartmentEntity();
        }
        if (dept == null) {
            dept = departmentRepository.findByCode("GEN").orElse(null);
        }

        Optional<com.cny.backend.admin.entity.Staff> existingStaff = staffRepository.findByEmail(email);
        com.cny.backend.admin.entity.Staff stf;
        if (existingStaff.isPresent() && Boolean.TRUE.equals(existingStaff.get().getIsDeleted())) {
            stf = existingStaff.get();
            stf.setDisplayName(dto.getDisplayName() != null ? dto.getDisplayName() : "Staff");
            stf.setFullName(dto.getFullName());
            stf.setPhone(dto.getPhone());
            stf.setPasswordHash(dto.getPassword() != null ? dto.getPassword() : "123456");
            stf.setSpecialization(dto.getSpecialization() != null ? dto.getSpecialization() : "General");
            stf.setManager(mgr);
            stf.setDepartmentEntity(dept);
            stf.setStatus("ACTIVE");
            stf.setIsDeleted(false);
            stf.setUpdatedAt(LocalDateTime.now());
            stf = staffRepository.save(stf);
            writeAuditLog(adminId, "REACTIVATE_STAFF", "USER_MANAGEMENT", "Admin #" + adminId + " đã kích hoạt lại Staff: " + email);
        } else {
            stf = com.cny.backend.admin.entity.Staff.builder()
                    .email(email)
                    .passwordHash(dto.getPassword() != null ? dto.getPassword() : "123456")
                    .displayName(dto.getDisplayName() != null ? dto.getDisplayName() : "Staff")
                    .fullName(dto.getFullName())
                    .phone(dto.getPhone())
                    .status("ACTIVE")
                    .specialization(dto.getSpecialization() != null ? dto.getSpecialization() : "General")
                    .manager(mgr)
                    .departmentEntity(dept)
                    .createdByAdmin(adminId)
                    .isDeleted(false)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            stf = staffRepository.save(stf);
            writeAuditLog(adminId, "CREATE_STAFF", "USER_MANAGEMENT", "Admin #" + adminId + " đã tạo tài khoản Staff: " + email + " (ID: " + stf.getStaffId() + ")");
        }

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
                .departmentId(stf.getDepartmentEntity() != null ? stf.getDepartmentEntity().getDepartmentId() : null)
                .departmentName(stf.getDepartmentEntity() != null ? stf.getDepartmentEntity().getName() : null)
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
                        .departmentId(m.getDepartmentEntity() != null ? m.getDepartmentEntity().getDepartmentId() : null)
                        .departmentName(m.getDepartmentEntity() != null ? m.getDepartmentEntity().getName() : null)
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
                        .departmentId(s.getDepartmentEntity() != null ? s.getDepartmentEntity().getDepartmentId() : null)
                        .departmentName(s.getDepartmentEntity() != null ? s.getDepartmentEntity().getName() : null)
                        .createdByAdmin(s.getCreatedByAdmin())
                        .createdAt(s.getCreatedAt() != null ? s.getCreatedAt().toString() : null)
                        .updatedAt(s.getUpdatedAt() != null ? s.getUpdatedAt().toString() : null)
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> inviteStaffOrManager(Map<String, Object> payload, int adminId) {
        Map<String, Object> response = new HashMap<>();
        String email = payload.get("email") != null ? payload.get("email").toString() : null;
        String role = payload.get("role") != null ? payload.get("role").toString() : null;
        String departmentIdStr = payload.get("departmentId") != null ? payload.get("departmentId").toString() : null;
        String managerIdStr = payload.get("managerId") != null ? payload.get("managerId").toString() : null;

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

        // Check if email already exists in any table (ignoring soft-deleted users in key roles)
        if (adminRepository.findByEmail(email).isPresent() ||
            freelancerRepository.findByEmail(email).filter(f -> !Boolean.TRUE.equals(f.getIsDeleted())).isPresent() ||
            employerRepository.findByEmail(email).filter(e -> !Boolean.TRUE.equals(e.getIsDeleted())).isPresent() ||
            managerRepository.findByEmail(email).filter(m -> !Boolean.TRUE.equals(m.getIsDeleted())).isPresent() ||
            staffRepository.findByEmail(email).filter(s -> !Boolean.TRUE.equals(s.getIsDeleted())).isPresent()) {
            response.put("success", false);
            response.put("message", "Email đã tồn tại trong hệ thống!");
            return response;
        }

        com.cny.backend.department.entity.Department dept = null;
        if (departmentIdStr != null && !departmentIdStr.trim().isEmpty()) {
            try {
                int deptId = Integer.parseInt(departmentIdStr);
                dept = departmentRepository.findById(deptId).orElse(null);
            } catch (Exception e) {}
        }
        if (dept == null) {
            dept = departmentRepository.findByCode("GEN").orElse(null);
        }

        com.cny.backend.admin.entity.Manager mgr = null;
        if (managerIdStr != null && !managerIdStr.trim().isEmpty()) {
            try {
                int mgrId = Integer.parseInt(managerIdStr);
                mgr = managerRepository.findById(mgrId).orElse(null);
            } catch (Exception e) {}
        }

        String token = java.util.UUID.randomUUID().toString();
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(24);

        String rawPassword = generateRandomPassword(10);
        String hashedPassword = passwordEncoder.encode(rawPassword);

        Optional<com.cny.backend.admin.entity.StaffInvitation> existingInvOpt = staffInvitationRepository.findByEmail(email);
        com.cny.backend.admin.entity.StaffInvitation invitation;
        if (existingInvOpt.isPresent()) {
            invitation = existingInvOpt.get();
            invitation.setRole(role);
            invitation.setToken(token);
            invitation.setExpiresAt(expiresAt);
            invitation.setStatus("PENDING");
        } else {
            invitation = com.cny.backend.admin.entity.StaffInvitation.builder()
                    .email(email)
                    .role(role)
                    .token(token)
                    .expiresAt(expiresAt)
                    .status("PENDING")
                    .build();
        }
        staffInvitationRepository.save(invitation);

        String emailPrefix = email.split("@")[0];
        Optional<com.cny.backend.admin.entity.Manager> existingManager = managerRepository.findByEmail(email);
        Optional<com.cny.backend.admin.entity.Staff> existingStaff = staffRepository.findByEmail(email);

        if ("MANAGER".equals(role)) {
            com.cny.backend.admin.entity.Manager managerPlaceholder;
            if (existingManager.isPresent()) {
                managerPlaceholder = existingManager.get();
                managerPlaceholder.setPasswordHash(hashedPassword);
                managerPlaceholder.setStatus("ACTIVE");
                managerPlaceholder.setDepartment(dept != null ? dept.getName() : "General");
                managerPlaceholder.setDepartmentEntity(dept);
                managerPlaceholder.setManagedByAdmin(adminId);
                managerPlaceholder.setIsDeleted(false);
                managerPlaceholder.setUpdatedAt(LocalDateTime.now());
            } else {
                managerPlaceholder = com.cny.backend.admin.entity.Manager.builder()
                        .email(email)
                        .passwordHash(hashedPassword)
                        .displayName(emailPrefix)
                        .status("ACTIVE")
                        .department(dept != null ? dept.getName() : "General")
                        .departmentEntity(dept)
                        .managedByAdmin(adminId)
                        .isDeleted(false)
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build();
            }
            managerRepository.save(managerPlaceholder);

            if (existingStaff.isPresent()) {
                com.cny.backend.admin.entity.Staff s = existingStaff.get();
                s.setIsDeleted(true);
                s.setStatus("DELETED");
                staffRepository.save(s);
            }
        } else {
            com.cny.backend.admin.entity.Staff stf;
            if (existingStaff.isPresent()) {
                stf = existingStaff.get();
                stf.setPasswordHash(hashedPassword);
                stf.setStatus("ACTIVE");
                stf.setSpecialization("General");
                stf.setManager(mgr);
                stf.setDepartmentEntity(dept);
                stf.setCreatedByAdmin(adminId);
                stf.setIsDeleted(false);
                stf.setUpdatedAt(LocalDateTime.now());
            } else {
                stf = com.cny.backend.admin.entity.Staff.builder()
                        .email(email)
                        .passwordHash(hashedPassword)
                        .displayName(emailPrefix)
                        .status("ACTIVE")
                        .specialization("General")
                        .manager(mgr)
                        .departmentEntity(dept)
                        .createdByAdmin(adminId)
                        .isDeleted(false)
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build();
            }
            staffRepository.save(stf);

            if (existingManager.isPresent()) {
                com.cny.backend.admin.entity.Manager m = existingManager.get();
                m.setIsDeleted(true);
                m.setStatus("DELETED");
                managerRepository.save(m);
            }
        }

        String roleLabel = "MANAGER".equals(role) ? "Manager (Quản Lý)" : "Staff (Nhân Viên)";
        String deptName = dept != null ? dept.getName() + " (" + dept.getCode() + ")" : "Chưa phân bổ";
        String setupLink = "http://localhost:3000/?token=" + token;
        String emailContent = "Chào bạn,\n\n"
                + "Quản trị viên hệ thống LancerPro đã thêm bạn vào đội ngũ quản trị / vận hành.\n\n"
                + "══════════════════════════════════\n"
                + "  THÔNG TIN VAI TRÒ\n"
                + "══════════════════════════════════\n"
                + "  Vai trò  : " + roleLabel + "\n"
                + "  Phòng ban: " + deptName + "\n"
                + "══════════════════════════════════\n\n"
                + "Vui lòng bấm vào liên kết dưới đây để tiến hành thiết lập thông tin cá nhân và hoàn tất kích hoạt tài khoản của bạn:\n"
                + setupLink + "\n\n"
                + "Lưu ý: Liên kết có hiệu lực trong vòng 24 giờ.\n"
                + "Nếu bạn có thắc mắc, vui lòng liên hệ quản trị viên để được hỗ trợ.\n\n"
                + "Trân trọng,\n"
                + "Đội ngũ LancerPro";

        emailService.sendEmailAsync(email, "[LancerPro] Thư mời tham gia đội ngũ quản trị hệ thống", emailContent);

        writeAuditLog(adminId, "INVITE_USER", "USER_MANAGEMENT", "Đã tạo tài khoản " + role + " cho " + email + " tại phòng ban " + deptName);
        response.put("success", true);
        response.put("message", "Đã tạo tài khoản thành công!");
        response.put("generatedEmail", email);
        response.put("generatedPassword", rawPassword);
        response.put("role", role);
        response.put("department", deptName);
        return response;
    }

    private String generateRandomPassword(int length) {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
        StringBuilder sb = new StringBuilder();
        java.security.SecureRandom random = new java.security.SecureRandom();
        for (int i = 0; i < length; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }

    // --- VERIFICATION TASKS ENDPOINTS ---

    @Transactional
    public Map<String, Object> createVerificationTask(Map<String, Object> payload) {
        Map<String, Object> response = new HashMap<>();
        try {
            String taskType = (String) payload.getOrDefault("taskType", "KYC_VERIFICATION");
            Integer referenceId = payload.containsKey("referenceId") ? ((Number) payload.get("referenceId")).intValue() : 1;
            String title = (String) payload.getOrDefault("title", "Yêu cầu kiểm duyệt");
            String description = (String) payload.getOrDefault("description", "");
            String requiredDepartments = (String) payload.getOrDefault("requiredDepartments", "CS");
            
            DepartmentVerificationTask task = DepartmentVerificationTask.builder()
                    .taskType(taskType)
                    .referenceId(referenceId)
                    .title(title)
                    .description(description)
                    .status("PENDING")
                    .requiredDepartments(requiredDepartments)
                    .build();
                    
            departmentVerificationTaskRepository.save(task);
            
            response.put("success", true);
            response.put("message", "Tác vụ đã được khởi tạo thành công trên database.");
            response.put("taskId", task.getTaskId());
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi: " + e.getMessage());
        }
        return response;
    }

    public List<Map<String, Object>> getVerificationTasks() {
        // Ensure default departments are present in DB
        initPresetDepartments();

        List<DepartmentVerificationTask> tasks = departmentVerificationTaskRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        
        for (DepartmentVerificationTask task : tasks) {
            Map<String, Object> map = new HashMap<>();
            map.put("taskId", task.getTaskId());
            map.put("taskType", task.getTaskType());
            map.put("referenceId", task.getReferenceId());
            map.put("title", task.getTitle());
            map.put("description", task.getDescription());
            map.put("status", task.getStatus());
            map.put("requiredDepartments", task.getRequiredDepartments());
            map.put("createdAt", task.getCreatedAt() != null ? task.getCreatedAt().toString() : null);
            map.put("updatedAt", task.getUpdatedAt() != null ? task.getUpdatedAt().toString() : null);
            
            // Get signoffs for this task
            List<DepartmentTaskSignoff> signoffs = departmentTaskSignoffRepository.findByVerificationTask(task);
            List<Map<String, Object>> signoffList = new ArrayList<>();
            for (DepartmentTaskSignoff s : signoffs) {
                Map<String, Object> smap = new HashMap<>();
                smap.put("signoffId", s.getSignoffId());
                smap.put("departmentCode", s.getDepartmentCode());
                smap.put("verifierEmail", s.getVerifierEmail());
                smap.put("status", s.getStatus());
                smap.put("note", s.getNote());
                smap.put("signedAt", s.getSignedAt().toString());
                signoffList.add(smap);
            }
            map.put("signoffs", signoffList);
            result.add(map);
        }
        return result;
    }

    @Transactional
    public Map<String, Object> submitTaskSignoff(int taskId, Map<String, Object> payload, String verifierEmail) {
        Map<String, Object> response = new HashMap<>();
        Optional<DepartmentVerificationTask> taskOpt = departmentVerificationTaskRepository.findById(taskId);
        if (!taskOpt.isPresent()) {
            response.put("success", false);
            response.put("message", "Không tìm thấy tác vụ kiểm chứng!");
            return response;
        }

        DepartmentVerificationTask task = taskOpt.get();
        if (!"PENDING".equals(task.getStatus())) {
            response.put("success", false);
            response.put("message", "Tác vụ này đã được hoàn tất trước đó!");
            return response;
        }

        String departmentCode = payload.get("departmentCode") != null ? payload.get("departmentCode").toString().toUpperCase() : "";
        String status = payload.get("status") != null ? payload.get("status").toString().toUpperCase() : ""; // APPROVED, REJECTED
        String note = payload.get("note") != null ? payload.get("note").toString() : "";

        if (departmentCode.isEmpty() || status.isEmpty()) {
            response.put("success", false);
            response.put("message", "Mã khoa hoặc trạng thái ký duyệt không hợp lệ!");
            return response;
        }

        // Verify if department is required for this task
        List<String> requiredDepts = Arrays.asList(task.getRequiredDepartments().split(","));
        if (!requiredDepts.contains(departmentCode)) {
            response.put("success", false);
            response.put("message", "Khoa của bạn không nằm trong danh sách yêu cầu kiểm chứng cho tác vụ này!");
            return response;
        }

        // Check if already signed off by this department
        List<DepartmentTaskSignoff> existing = departmentTaskSignoffRepository.findByVerificationTaskAndDepartmentCode(task, departmentCode);
        if (!existing.isEmpty()) {
            response.put("success", false);
            response.put("message", "Khoa của bạn đã thực hiện ký duyệt tác vụ này rồi!");
            return response;
        }

        // Create new signoff
        DepartmentTaskSignoff signoff = DepartmentTaskSignoff.builder()
                .verificationTask(task)
                .departmentCode(departmentCode)
                .verifierEmail(verifierEmail)
                .status(status)
                .note(note)
                .build();
        departmentTaskSignoffRepository.save(signoff);

        writeAuditLog(0, "TASK_SIGNOFF", "DEPARTMENTS", 
                "Tài khoản " + verifierEmail + " của khoa " + departmentCode + " đã ký duyệt " + status + " tác vụ #" + taskId);

        // Check overall status
        if ("REJECTED".equals(status)) {
            task.setStatus("REJECTED");
            departmentVerificationTaskRepository.save(task);
            
            // Execute rejection of original transaction
            rejectOriginalTransaction(task.getTaskType(), task.getReferenceId());
            
            response.put("success", true);
            response.put("message", "Đã từ chối tác vụ kiểm chứng thành công. Giao dịch gốc đã bị hủy.");
            return response;
        }

        // Recheck if all required departments signed APPROVED
        List<DepartmentTaskSignoff> allSignoffs = departmentTaskSignoffRepository.findByVerificationTask(task);
        Set<String> approvedDepts = allSignoffs.stream()
                .filter(s -> "APPROVED".equals(s.getStatus()))
                .map(DepartmentTaskSignoff::getDepartmentCode)
                .collect(Collectors.toSet());

        boolean allApproved = true;
        for (String req : requiredDepts) {
            if (!approvedDepts.contains(req)) {
                allApproved = false;
                break;
            }
        }

        if (allApproved) {
            task.setStatus("APPROVED");
            departmentVerificationTaskRepository.save(task);
            
            // Execute approval of original transaction
            approveOriginalTransaction(task.getTaskType(), task.getReferenceId());
            
            response.put("success", true);
            response.put("message", "Tất cả các khoa đã đồng ý ký duyệt. Giao dịch gốc đã được tự động phê duyệt.");
        } else {
            response.put("success", true);
            response.put("message", "Ký duyệt thành công. Chờ chữ ký từ các khoa còn lại.");
        }

        return response;
    }

    private void approveOriginalTransaction(String type, int referenceId) {
        try {
            if ("WITHDRAWAL".equals(type)) {
                dashboardRepository.processWithdrawalRequest(referenceId, "APPROVED", getValidAdminId(1));
            } else if ("DISPUTE_REFUND".equals(type)) {
                // mock process dispute refund success
                System.out.println("Dispute refund #" + referenceId + " approved!");
            } else if ("KYC_VERIFICATION".equals(type)) {
                System.out.println("KYC Verification #" + referenceId + " approved!");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void rejectOriginalTransaction(String type, int referenceId) {
        try {
            if ("WITHDRAWAL".equals(type)) {
                dashboardRepository.processWithdrawalRequest(referenceId, "REJECTED", getValidAdminId(1));
            } else if ("DISPUTE_REFUND".equals(type)) {
                System.out.println("Dispute refund #" + referenceId + " rejected!");
            } else if ("KYC_VERIFICATION".equals(type)) {
                System.out.println("KYC Verification #" + referenceId + " rejected!");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void initPresetDepartments() {
        String[][] presets = {
            {"FIN", "Phòng Tài chính (Finance)", "Quản lý rút tiền, hoàn tiền, escrow, giao dịch | Liên kết với: DIS, AUD"},
            {"MOD", "Phòng Kiểm duyệt (Moderation)", "Duyệt dự án, kiểm duyệt nội dung, KYC | Liên kết với: FIN, CS"},
            {"DIS", "Phòng Tranh chấp (Dispute Resolution)", "Xử lý tranh chấp, phân xử hợp đồng | Liên kết với: FIN, MOD"},
            {"CS", "Phòng Hỗ trợ (Customer Support)", "Support tickets, hỗ trợ người dùng | Liên kết với: MOD, IT"},
            {"IT", "Phòng Kỹ thuật (IT & Development)", "Bảo trì hệ thống, cấu hình, SEO, CMS | Liên kết với: Tất cả"},
            {"AUD", "Phòng Kiểm toán (Audit & Compliance)", "Giám sát, audit logs, đánh giá tuân thủ | Liên kết với: FIN, DIS"},
            {"MKT", "Marketing", "Phòng Truyền thông và Marketing"},
            {"GEN", "General", "Phòng tổng hợp"}
        };

        for (String[] preset : presets) {
            String code = preset[0];
            Optional<com.cny.backend.department.entity.Department> existing = departmentRepository.findByCode(code);
            if (existing.isPresent()) {
                com.cny.backend.department.entity.Department d = existing.get();
                d.setName(preset[1]);
                d.setDescription(preset[2]);
                departmentRepository.save(d);
            } else {
                com.cny.backend.department.entity.Department d = com.cny.backend.department.entity.Department.builder()
                        .code(code)
                        .name(preset[1])
                        .description(preset[2])
                        .maxManagers(5)
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build();
                departmentRepository.save(d);
            }
        }

        // Clean up outdated verification tasks/signoffs containing KYC or SUP department references
        boolean hasOutdated = departmentVerificationTaskRepository.findAll().stream()
                .anyMatch(t -> t.getRequiredDepartments().contains("KYC") || t.getRequiredDepartments().contains("SUP"));
        if (hasOutdated) {
            departmentTaskSignoffRepository.deleteAll();
            departmentVerificationTaskRepository.deleteAll();
        }

        // Generate mock tasks if there are none to populate the list on UI load!
        if (departmentVerificationTaskRepository.findAll().isEmpty()) {
            departmentVerificationTaskRepository.save(DepartmentVerificationTask.builder()
                    .taskType("WITHDRAWAL")
                    .referenceId(1)
                    .title("Yêu cầu rút tiền lớn từ Nguyễn Minh Anh")
                    .description("Yêu cầu rút 15.000.000 VND về tài khoản Techcombank 1903xxx. Cần FIN (xác nhận số tiền) và AUD (kiểm tra tuân thủ) ký duyệt.")
                    .status("PENDING")
                    .requiredDepartments("FIN,AUD")
                    .build());

            departmentVerificationTaskRepository.save(DepartmentVerificationTask.builder()
                    .taskType("DISPUTE_REFUND")
                    .referenceId(1)
                    .title("Hoàn tiền tranh chấp dự án Laravel Website")
                    .description("Yêu cầu hoàn trả 7.500.000 VND cho Client do Freelancer chậm tiến độ. Cần DIS (phân tích bằng chứng), FIN (tính toán hoàn tiền) và MOD (đánh giá vi phạm) ký duyệt.")
                    .status("PENDING")
                    .requiredDepartments("DIS,FIN,MOD")
                    .build());

            departmentVerificationTaskRepository.save(DepartmentVerificationTask.builder()
                    .taskType("KYC_VERIFICATION")
                    .referenceId(1)
                    .title("Xác thực thông tin KYC người dùng")
                    .description("Xác thực thông tin CCCD và ảnh selfie của Nguyễn Minh Anh. Cần MOD (xác minh giấy tờ) và AUD (kiểm tra hồ sơ) ký duyệt.")
                    .status("PENDING")
                    .requiredDepartments("MOD,AUD")
                    .build());
        }
    }

    public List<EmployerProfileRequest> getPendingProfileRequests() {
        return employerProfileRequestRepository.findByStatusOrderByCreatedAtDesc("PENDING");
    }

    @Transactional
    public Map<String, Object> moderateProfileRequest(int requestId, boolean approve, String reason, int adminId) {
        Map<String, Object> response = new HashMap<>();
        Optional<EmployerProfileRequest> reqOpt = employerProfileRequestRepository.findById(requestId);
        if (!reqOpt.isPresent()) {
            response.put("success", false);
            response.put("message", "Không tìm thấy yêu cầu với ID: " + requestId);
            return response;
        }

        EmployerProfileRequest req = reqOpt.get();
        if (!"PENDING".equals(req.getStatus())) {
            response.put("success", false);
            response.put("message", "Yêu cầu này đã được xử lý trước đó!");
            return response;
        }

        int validAdminId = getValidAdminId(adminId);

        if (approve) {
            req.setStatus("APPROVED");
            Employer employer = req.getEmployer();
            
            // Copy fields from request to employer
            if (req.getDisplayName() != null) employer.setDisplayName(req.getDisplayName());
            if (req.getFullName() != null) employer.setFullName(req.getFullName());
            if (req.getPhone() != null) employer.setPhone(req.getPhone());
            if (req.getCompanyName() != null) employer.setCompanyName(req.getCompanyName());
            if (req.getCompanyLogoUrl() != null) employer.setCompanyLogoUrl(req.getCompanyLogoUrl());
            if (req.getCompanyDescription() != null) employer.setCompanyDescription(req.getCompanyDescription());
            if (req.getWebsite() != null) employer.setWebsite(req.getWebsite());
            if (req.getAddress() != null) employer.setAddress(req.getAddress());
            if (req.getCity() != null) employer.setCity(req.getCity());
            if (req.getCountry() != null) employer.setCountry(req.getCountry());
            if (req.getCompanySize() != null) employer.setCompanySize(req.getCompanySize());
            if (req.getIndustry() != null) employer.setIndustry(req.getIndustry());
            employer.setUpdatedAt(LocalDateTime.now());
            
            // Calculate completeness
            employer.setProfileCompleteness(calculateCompleteness(employer));
            employerRepository.save(employer);

            // Update bank details if provided
            if (req.getBankName() != null || req.getAccountNumber() != null || req.getAccountHolder() != null || req.getBranch() != null) {
                upsertDefaultBankAccount(employer.getEmployerId(), req.getBankName(), req.getAccountNumber(), req.getAccountHolder(), req.getBranch());
            }

            writeAuditLog(validAdminId, "APPROVE_PROFILE_REQUEST", "USER_MANAGEMENT", 
                "Admin #" + validAdminId + " đã phê duyệt thay đổi thông tin của Employer #" + employer.getEmployerId());
            
            response.put("success", true);
            response.put("message", "Đã phê duyệt và cập nhật hồ sơ Employer thành công.");
        } else {
            req.setStatus("REJECTED");
            req.setRejectReason(reason);
            writeAuditLog(validAdminId, "REJECT_PROFILE_REQUEST", "USER_MANAGEMENT", 
                "Admin #" + validAdminId + " đã từ chối thay đổi thông tin của Employer #" + req.getEmployer().getEmployerId() + " | Lý do: " + reason);
            
            response.put("success", true);
            response.put("message", "Đã từ chối yêu cầu thay đổi thông tin.");
        }
        
        employerProfileRequestRepository.save(req);
        return response;
    }

    private int calculateCompleteness(Employer employer) {
        String[] fields = {
            employer.getDisplayName(),
            employer.getFullName(),
            employer.getPhone(),
            employer.getCompanyName(),
            employer.getCompanyDescription(),
            employer.getWebsite(),
            employer.getAddress(),
            employer.getCity(),
            employer.getCountry(),
            employer.getCompanySize(),
            employer.getIndustry()
        };
        int filled = 0;
        for (String field : fields) {
            if (field != null && !field.trim().isEmpty()) {
                filled++;
            }
        }
        return Math.round((filled * 100f) / fields.length);
    }

    private void upsertDefaultBankAccount(Integer employerId, String bankName, String accountNumber, String accountHolder, String branch) {
        Integer existingId = jdbcTemplate.query(
                "SELECT TOP 1 bank_account_id FROM bank_accounts WHERE employer_id = ? ORDER BY is_default DESC, created_at DESC",
                rs -> rs.next() ? rs.getInt("bank_account_id") : null,
                employerId
        );

        String bName = bankName != null ? bankName.trim() : "Chưa cập nhật";
        String accNum = accountNumber != null ? accountNumber.trim() : "Chưa cập nhật";
        String accHolder = accountHolder != null ? accountHolder.trim() : "Chưa cập nhật";
        String br = branch != null ? branch.trim() : null;

        if (existingId == null) {
            jdbcTemplate.update(
                    "INSERT INTO bank_accounts (employer_id, bank_name, account_number, account_holder, branch, is_default) VALUES (?, ?, ?, ?, ?, 1)",
                    employerId, bName, accNum, accHolder, br
            );
        } else {
            jdbcTemplate.update(
                    "UPDATE bank_accounts SET bank_name = ?, account_number = ?, account_holder = ?, branch = ?, is_default = 1 WHERE bank_account_id = ?",
                    bName, accNum, accHolder, br, existingId
            );
        }
    }
}


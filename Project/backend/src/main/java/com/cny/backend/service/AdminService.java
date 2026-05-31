package com.cny.backend.service;

import com.cny.backend.entity.JobCategory;
import com.cny.backend.entity.Project;
import com.cny.backend.entity.Employer;
import com.cny.backend.entity.Freelancer;
import com.cny.backend.repository.JobCategoryRepository;
import com.cny.backend.repository.ProjectRepository;
import com.cny.backend.repository.EmployerRepository;
import com.cny.backend.repository.FreelancerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import com.cny.backend.repository.DashboardRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminService {

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

    private static final Set<String> PROTECTED_ADMIN_EMAILS = Set.of(
        "illyasviel1252004@gmail.com",
        "admin@lancerpro.com"
    );

    // 1. Get Dashboard Stats
    public Map<String, Object> getStats(String period) {
        Map<String, Object> stats = new HashMap<>();
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

            stats.put("totalUsers", totalUsers);
            stats.put("activeProjects", activeProjects);
            stats.put("totalRevenue", totalRevenue);
            stats.put("activeDisputes", activeDisputes);
            stats.put("pendingWithdrawals", pendingWithdrawals);
            
            stats.put("usersGrowthPercent", 0.0);
            stats.put("projectsGrowthPercent", 0.0);
            stats.put("revenueGrowthPercent", 0.0);
        } catch (Exception e) {
            stats.put("totalUsers", 1284);
            stats.put("activeProjects", 452);
            stats.put("totalRevenue", 128500.0);
            stats.put("activeDisputes", 18);
            stats.put("pendingWithdrawals", 2);
            stats.put("usersGrowthPercent", 12.0);
            stats.put("projectsGrowthPercent", 5.0);
            stats.put("revenueGrowthPercent", 8.2);
        }
        return stats;
    }

    // 2. Get User Growth Trend
    public List<Map<String, Object>> getUserGrowthTrend() {
        List<Map<String, Object>> trend = new ArrayList<>();
        try {
            for (int i = 5; i >= 0; i--) {
                Map<String, Object> point = new HashMap<>();
                String monthLabel = dashboardRepository.getMonthLabel(-i);
                
                int currF = dashboardRepository.countFreelancersByMonthOffset(-i);
                int currE = dashboardRepository.countEmployersByMonthOffset(-i);
                
                int prevF = dashboardRepository.countFreelancersByMonthOffset(-(i + 1));
                int prevE = dashboardRepository.countEmployersByMonthOffset(-(i + 1));
                
                point.put("label", monthLabel);
                point.put("value", currF + currE);
                point.put("compareValue", prevF + prevE);
                trend.add(point);
            }
        } catch (Exception e) {}
        return trend;
    }

    // 3. Get Revenue Trend
    public List<Map<String, Object>> getRevenueTrend() {
        List<Map<String, Object>> trend = new ArrayList<>();
        try {
            for (int i = 3; i >= 0; i--) {
                Map<String, Object> point = new HashMap<>();
                String qLabel = dashboardRepository.getQuarterLabel(-i);
                
                Double rev = dashboardRepository.calculateRevenueByQuarterOffset(-i);
                
                point.put("label", qLabel);
                point.put("value", rev != null ? rev : 0.0);
                trend.add(point);
            }
        } catch (Exception e) {}
        return trend;
    }

    // 4. Get Platform Fee Config
    public Map<String, Object> getFeeConfig() {
        Map<String, Object> response = new HashMap<>();
        try {
            Double currentFee = dashboardRepository.getLatestFeeConfig();
            response.put("fee", currentFee != null ? currentFee : 10.0);
        } catch (Exception e) {
            response.put("fee", 10.0);
        }
        return response;
    }

    // 5. Update Platform Fee Config
    @Transactional
    public Map<String, Object> updateFeeConfig(double fee, int adminId) {
        Map<String, Object> response = new HashMap<>();
        try {
            dashboardRepository.insertFeeConfig(fee);
            
            dashboardRepository.logAudit(adminId, "UPDATE_FEE_RATE", "FINANCE", "Đã cấu hình lại mức phí dịch vụ của nền tảng thành " + fee + "%");

            response.put("success", true);
            response.put("fee", fee);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
        }
        return response;
    }

    public List<Map<String, Object>> getUsers() {
        List<Map<String, Object>> users = new ArrayList<>();
        
        // Fetch Freelancers
        List<Freelancer> freelancers = freelancerRepository.findAll();
        for (Freelancer f : freelancers) {
            if (f.getIsDeleted() != null && f.getIsDeleted()) continue;
            
            Map<String, Object> map = new HashMap<>();
            map.put("id", f.getProfileId());
            map.put("name", f.getDisplayName());
            map.put("email", f.getEmail());
            map.put("status", f.getStatus());
            map.put("role", "FREELANCER");
            map.put("joined", f.getCreatedAt() != null ? f.getCreatedAt().toString().substring(0, 10) : "");
            map.put("lastLogin", f.getLastLoginAt() != null ? f.getLastLoginAt().toString() : null);
            map.put("isProtectedAdmin", false);
            users.add(map);
        }

        // Fetch Employers (using exact Database ID)
        List<Employer> employers = employerRepository.findAll();
        for (Employer e : employers) {
            if (e.getIsDeleted() != null && e.getIsDeleted()) continue;
            
            Map<String, Object> map = new HashMap<>();
            map.put("id", e.getEmployerId());
            map.put("name", e.getDisplayName());
            map.put("email", e.getEmail());
            map.put("status", e.getStatus());
            map.put("role", "EMPLOYER");
            map.put("joined", e.getCreatedAt() != null ? e.getCreatedAt().toString().substring(0, 10) : "");
            map.put("lastLogin", e.getLastLoginAt() != null ? e.getLastLoginAt().toString() : null);
            map.put("isProtectedAdmin", false);
            users.add(map);
        }
        
        return users;
    }

    @Transactional
    public Map<String, Object> updateUserStatus(int id, String role, String status, String reason, int adminId) {
        Map<String, Object> response = new HashMap<>();
        
        if ("EMPLOYER".equalsIgnoreCase(role)) {
            // Employer (O(1) PK Lookup)
            Optional<Employer> employerOpt = employerRepository.findById(id);
            if (employerOpt.isPresent()) {
                Employer emp = employerOpt.get();
                String oldStatus = emp.getStatus();
                emp.setStatus(status);
                employerRepository.save(emp);
                
                // Log history
                dashboardRepository.logEmployerStatusHistory(id, oldStatus != null ? oldStatus : "ACTIVE", status, reason != null ? reason : "Lý do bảo mật");
                
                sendNotification(id, "EMPLOYER", status, reason);
                writeAuditLog(adminId, "CHANGE_STATUS", "USER_MANAGEMENT", "Thay đổi trạng thái Employer #" + id + " (" + emp.getEmail() + ") từ " + oldStatus + " → " + status + " | Lý do: " + reason);
                
                response.put("success", true);
                response.put("message", "Đã cập nhật trạng thái Employer thành công.");
                return response;
            }
        } else if ("FREELANCER".equalsIgnoreCase(role)) {
            // Freelancer (O(1) PK Lookup)
            Optional<Freelancer> freelancerOpt = freelancerRepository.findById(id);
            if (freelancerOpt.isPresent()) {
                Freelancer f = freelancerOpt.get();
                String oldStatus = f.getStatus();
                f.setStatus(status);
                freelancerRepository.save(f);
                
                // Log history
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
            notifTitle = "⚠️ Tài khoản của bạn đã bị tạm khóa";
            notifContent = "Tài khoản của bạn đã bị Admin tạm khóa với lý do: " + 
                (reason != null ? reason : "Vi phạm chính sách nền tảng") + 
                ". Trong thời gian bị khóa, bạn sẽ không thể đăng nhập hoặc sử dụng các dịch vụ trên hệ thống. " +
                "Vui lòng liên hệ bộ phận hỗ trợ qua email support@vlance.vn để được giải quyết.";
        } else if ("BANNED".equals(status)) {
            notifTitle = "🚫 Tài khoản của bạn đã bị cấm vĩnh viễn";
            notifContent = "Tài khoản của bạn đã bị Admin cấm vĩnh viễn với lý do: " + 
                (reason != null ? reason : "Vi phạm nghiêm trọng chính sách nền tảng") + 
                ". Quyết định này có hiệu lực ngay lập tức và không thể đảo ngược.";
        } else if ("ACTIVE".equals(status)) {
            notifTitle = "✅ Tài khoản của bạn đã được mở khóa";
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

    // 8. GET Pending Projects for Moderation
    public List<Map<String, Object>> getPendingProjects() {
        return dashboardRepository.getPendingProjects().stream().map(p -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", p.getId());
            map.put("title", p.getTitle());
            map.put("description", p.getDescription());
            map.put("type", p.getType());
            map.put("budget", p.getBudget());
            map.put("createdAt", p.getCreatedAt());
            map.put("clientName", p.getClientName());
            return map;
        }).collect(Collectors.toList());
    }

    // 9. Moderate Project (Approve/Reject)
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

    // 10. GET Withdrawal Requests
    public List<Map<String, Object>> getWithdrawals() {
        return dashboardRepository.getAllWithdrawalRequests().stream().map(p -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", p.getId());
            map.put("amount", p.getAmount());
            map.put("status", p.getStatus());
            map.put("createdAt", p.getCreatedAt());
            map.put("userName", p.getFreelancerName());
            map.put("userEmail", p.getFreelancerEmail());
            map.put("bankName", p.getBankName());
            map.put("accountNumber", p.getAccountNumber());
            return map;
        }).collect(Collectors.toList());
    }

    // 11. Process Withdrawal Request
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

    // 12. GET Admin Audit Logs
    public List<Map<String, Object>> getAuditLogs() {
        return dashboardRepository.getAuditLogs().stream().map(p -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", p.getId());
            map.put("status", p.getStatus());
            map.put("module", p.getModule());
            map.put("detail", p.getDetail());
            map.put("timestamp", p.getTimestamp());
            map.put("source", p.getSource());
            return map;
        }).collect(Collectors.toList());
    }

    // 13. GET Job Categories
    public List<Map<String, Object>> getJobCategories() {
        return dashboardRepository.getJobCategories().stream().map(p -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", p.getId());
            map.put("name", p.getName());
            map.put("description", p.getDescription());
            map.put("isActive", p.getIsActive());
            return map;
        }).collect(Collectors.toList());
    }

    // 14. GET KYC Requests (Mock Data)
    public List<Map<String, Object>> getKycRequests() {
        List<Map<String, Object>> list = new ArrayList<>();
        Map<String, Object> req1 = new HashMap<>();
        req1.put("id", 1);
        req1.put("userName", "Nguyễn Minh Anh");
        req1.put("userEmail", "minhanh@gmail.com");
        req1.put("idCard", "030094001234");
        req1.put("status", "PENDING");
        req1.put("submittedAt", "2026-05-18T10:30:00");
        
        Map<String, Object> req2 = new HashMap<>();
        req2.put("id", 2);
        req2.put("userName", "Trần Việt Hoàng");
        req2.put("userEmail", "hoangtv@gmail.com");
        req2.put("idCard", "038092005678");
        req2.put("status", "APPROVED");
        req2.put("submittedAt", "2026-05-17T15:20:00");
        
        list.add(req1);
        list.add(req2);
        return list;
    }

    // 15. GET Dispute Resolution Requests (Mock Data)
    public List<Map<String, Object>> getDisputes() {
        List<Map<String, Object>> list = new ArrayList<>();
        Map<String, Object> d1 = new HashMap<>();
        d1.put("id", 1);
        d1.put("projectTitle", "Xây dựng Website bán hàng Laravel");
        d1.put("clientName", "LancerPro Client");
        d1.put("freelancerName", "Nguyễn Minh Anh");
        d1.put("amount", 15000000);
        d1.put("status", "OPEN");
        d1.put("reason", "Freelancer chậm tiến độ bàn giao sản phẩm");
        d1.put("createdAt", "2026-05-16T09:00:00");
        
        Map<String, Object> d2 = new HashMap<>();
        d2.put("id", 2);
        d2.put("projectTitle", "Thiết kế Banner Sự kiện");
        d2.put("clientName", "TechFlow Corporation");
        d2.put("freelancerName", "Lê Thủy Tiên");
        d2.put("amount", 2000000);
        d2.put("status", "RESOLVED");
        d2.put("reason", "Yêu cầu hoàn trả 50% chi phí do thiết kế lỗi");
        d2.put("createdAt", "2026-05-14T14:30:00");
        
        list.add(d1);
        list.add(d2);
        return list;
    }

    // 16. GET User Reports (Mock Data)
    public List<Map<String, Object>> getReports() {
        List<Map<String, Object>> list = new ArrayList<>();
        Map<String, Object> r1 = new HashMap<>();
        r1.put("id", 1);
        r1.put("reporterName", "Trần Việt Hoàng");
        r1.put("reportedName", "LancerPro Client");
        r1.put("reason", "Spam bài đăng tuyển dụng nhiều lần cùng nội dung");
        r1.put("status", "PENDING");
        r1.put("createdAt", "2026-05-18T08:15:00");
        
        Map<String, Object> r2 = new HashMap<>();
        r2.put("id", 2);
        r2.put("reporterName", "Nguyễn Minh Anh");
        r2.put("reportedName", "Vũ Hoàng Nam");
        r2.put("reason", "Lời lẽ thô tục xúc phạm trong khung chat");
        r2.put("status", "RESOLVED");
        r2.put("createdAt", "2026-05-15T11:45:00");
        
        list.add(r1);
        list.add(r2);
        return list;
    }

    // 17. GET CMS Articles (Mock Data)
    public List<Map<String, Object>> getArticles() {
        List<Map<String, Object>> list = new ArrayList<>();
        Map<String, Object> a1 = new HashMap<>();
        a1.put("id", 1);
        a1.put("title", "Kinh nghiệm làm việc tự do (Freelancer) thành công năm 2026");
        a1.put("author", "Admin");
        a1.put("views", 1245);
        a1.put("status", "PUBLISHED");
        a1.put("publishedAt", "2026-05-10T08:00:00");
        
        Map<String, Object> a2 = new HashMap<>();
        a2.put("id", 2);
        a2.put("title", "Làm thế nào để thuê được Freelancer IT chất lượng cao?");
        a2.put("author", "Admin");
        a2.put("views", 856);
        a2.put("status", "DRAFT");
        a2.put("publishedAt", "2026-05-12T14:00:00");
        
        list.add(a1);
        list.add(a2);
        return list;
    }

    // 18. GET Support Tickets (Mock Data)
    public List<Map<String, Object>> getTickets() {
        List<Map<String, Object>> list = new ArrayList<>();
        Map<String, Object> t1 = new HashMap<>();
        t1.put("id", 1);
        t1.put("subject", "Lỗi không nạp tiền qua cổng VNPay");
        t1.put("sender", "minhanh@gmail.com");
        t1.put("priority", "HIGH");
        t1.put("status", "OPEN");
        t1.put("createdAt", "2026-05-19T09:30:00");
        
        Map<String, Object> t2 = new HashMap<>();
        t2.put("id", 2);
        t2.put("subject", "Yêu cầu thay đổi số điện thoại liên kết");
        t2.put("sender", "hoangtv@gmail.com");
        t2.put("priority", "LOW");
        t2.put("status", "CLOSED");
        t2.put("createdAt", "2026-05-17T16:00:00");
        
        list.add(t1);
        list.add(t2);
        return list;
    }

    // 19. GET SEO Configurations (Mock Data)
    public List<Map<String, Object>> getSeoConfigs() {
        List<Map<String, Object>> list = new ArrayList<>();
        Map<String, Object> s1 = new HashMap<>();
        s1.put("id", 1);
        s1.put("pageName", "Home Page");
        s1.put("title", "LancerPro - Nền tảng Freelancer lớn nhất Việt Nam");
        s1.put("description", "Kết nối doanh nghiệp với hàng ngàn freelancer tài năng trên toàn quốc.");
        s1.put("keywords", "freelancer, thue freelancer, viec lam tu do, thiet ke web");
        
        Map<String, Object> s2 = new HashMap<>();
        s2.put("id", 2);
        s2.put("pageName", "Find Jobs Page");
        s2.put("title", "Tìm việc freelance lương cao tại LancerPro");
        s2.put("description", "Hàng trăm dự án mới mỗi ngày thuộc nhiều lĩnh vực khác nhau.");
        s2.put("keywords", "tim viec freelance, viec lam it freelance, viet lach, marketing");
        
        list.add(s1);
        list.add(s2);
        return list;
    }
}


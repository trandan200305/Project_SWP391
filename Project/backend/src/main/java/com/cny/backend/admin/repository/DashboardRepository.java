package com.cny.backend.admin.repository;

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


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public interface DashboardRepository extends JpaRepository<Admin, Integer> {
    
    
    @Query(value = "SELECT COUNT(*) FROM freelancers WHERE is_deleted = 0 AND created_at >= DATEADD(day, :days, GETDATE())", nativeQuery = true)
    int countNewFreelancers(@Param("days") int days);

    @Query(value = "SELECT COUNT(*) FROM employers WHERE is_deleted = 0 AND created_at >= DATEADD(day, :days, GETDATE())", nativeQuery = true)
    int countNewEmployers(@Param("days") int days);

    @Query(value = "SELECT COUNT(*) FROM projects WHERE is_deleted = 0 AND status = 'PUBLISHED' AND created_at >= DATEADD(day, :days, GETDATE())", nativeQuery = true)
    int countActiveProjects(@Param("days") int days);

    @Query(value = "SELECT COUNT(*) FROM withdrawal_requests WHERE status = 'PENDING'", nativeQuery = true)
    int countPendingWithdrawals();

    @Query(value = "SELECT COUNT(*) FROM disputes WHERE status = 'OPEN'", nativeQuery = true)
    int countActiveDisputes();

    @Query(value = "SELECT SUM(amount) FROM transactions WHERE type = 'PLATFORM_FEE' AND created_at >= DATEADD(day, :days, GETDATE())", nativeQuery = true)
    Double calculateTotalRevenue(@Param("days") int days);

    
    @Query(value = "SELECT FORMAT(DATEADD(month, :monthOffset, GETDATE()), 'MMM')", nativeQuery = true)
    String getMonthLabel(@Param("monthOffset") int monthOffset);

    @Query(value = "SELECT COUNT(*) FROM freelancers WHERE FORMAT(created_at, 'yyyy-MM') = FORMAT(DATEADD(month, :monthOffset, GETDATE()), 'yyyy-MM')", nativeQuery = true)
    int countFreelancersByMonthOffset(@Param("monthOffset") int monthOffset);

    @Query(value = "SELECT COUNT(*) FROM employers WHERE FORMAT(created_at, 'yyyy-MM') = FORMAT(DATEADD(month, :monthOffset, GETDATE()), 'yyyy-MM')", nativeQuery = true)
    int countEmployersByMonthOffset(@Param("monthOffset") int monthOffset);

    
    @Query(value = "SELECT 'Q' + CAST(DATEPART(quarter, DATEADD(quarter, :quarterOffset, GETDATE())) AS VARCHAR)", nativeQuery = true)
    String getQuarterLabel(@Param("quarterOffset") int quarterOffset);

    @Query(value = "SELECT SUM(amount) FROM transactions WHERE type = 'PLATFORM_FEE' AND DATEPART(quarter, created_at) = DATEPART(quarter, DATEADD(quarter, :quarterOffset, GETDATE())) AND DATEPART(year, created_at) = DATEPART(year, DATEADD(quarter, :quarterOffset, GETDATE()))", nativeQuery = true)
    Double calculateRevenueByQuarterOffset(@Param("quarterOffset") int quarterOffset);

    
    @Query(value = "SELECT TOP 1 fee_percentage FROM platform_fee_configs ORDER BY created_at DESC", nativeQuery = true)
    Double getLatestFeeConfig();

    @Modifying
    @Query(value = "UPDATE platform_fee_configs SET is_active = 0", nativeQuery = true)
    void deactivateAllFeeConfigs();

    @Modifying
    @Query(value = "INSERT INTO platform_fee_configs (fee_percentage, effective_from, created_by, created_at) VALUES (:fee, GETDATE(), 1, GETDATE())", nativeQuery = true)
    void insertFeeConfig(@Param("fee") double fee);

    
    @Modifying
    @Query(value = "UPDATE freelancers SET is_active = :status, updated_at = GETDATE() WHERE freelancer_id = :id", nativeQuery = true)
    void updateFreelancerStatus(@Param("id") int id, @Param("status") int status);

    @Modifying
    @Query(value = "UPDATE employers SET is_active = :status, updated_at = GETDATE() WHERE employer_id = :id", nativeQuery = true)
    void updateEmployerStatus(@Param("id") int id, @Param("status") int status);

    
    @Modifying
    @Query(value = "UPDATE projects SET status = :status, reject_reason = :reason, updated_at = GETDATE() WHERE project_id = :projectId", nativeQuery = true)
    void updateProjectStatus(@Param("projectId") int projectId, @Param("status") String status, @Param("reason") String reason);

    
    @Modifying
    @Query(value = "INSERT INTO user_status_history (freelancer_id, old_status, new_status, reason, changed_at) VALUES (:id, :oldStatus, :newStatus, :reason, GETDATE())", nativeQuery = true)
    void logFreelancerStatusHistory(@Param("id") int id, @Param("oldStatus") String oldStatus, @Param("newStatus") String newStatus, @Param("reason") String reason);

    @Modifying
    @Query(value = "INSERT INTO user_status_history (employer_id, old_status, new_status, reason, changed_at) VALUES (:id, :oldStatus, :newStatus, :reason, GETDATE())", nativeQuery = true)
    void logEmployerStatusHistory(@Param("id") int id, @Param("oldStatus") String oldStatus, @Param("newStatus") String newStatus, @Param("reason") String reason);

    @Modifying
    @Query(value = "INSERT INTO notifications (freelancer_id, title, message, type, is_read, created_at) VALUES (:id, :title, :message, :type, 0, GETDATE())", nativeQuery = true)
    void insertNotificationFreelancer(@Param("id") int id, @Param("title") String title, @Param("message") String message, @Param("type") String type);

    @Modifying
    @Query(value = "INSERT INTO notifications (employer_id, title, message, type, is_read, created_at) VALUES (:id, :title, :message, :type, 0, GETDATE())", nativeQuery = true)
    void insertNotificationEmployer(@Param("id") int id, @Param("title") String title, @Param("message") String message, @Param("type") String type);


    
    public interface WithdrawalProjection {
        Integer getId();
        Double getAmount();
        String getStatus();
        java.util.Date getCreatedAt();
        String getBankName();
        String getAccountNumber();
        String getFreelancerEmail();
        String getFreelancerName();
    }
    
    public interface AuditLogProjection {
        Integer getId();
        String getStatus();
        String getModule();
        String getDetail();
        java.util.Date getTimestamp();
        String getSource();
    }
    
    public interface JobCategoryProjection {
        Integer getId();
        String getName();
        String getDescription();
        Boolean getIsActive();
    }
    
    public interface ProjectProjection {
        Integer getId();
        String getTitle();
        String getDescription();
        String getType();
        Double getBudget();
        java.util.Date getCreatedAt();
        String getClientName();
    }

    
    @Query(value = "SELECT w.withdrawal_id as id, w.amount, w.status, w.created_at as createdAt, b.bank_name as bankName, b.account_number as accountNumber, f.email as freelancerEmail, f.display_name as freelancerName FROM withdrawal_requests w JOIN freelancers f ON w.freelancer_id = f.freelancer_id JOIN bank_accounts b ON w.bank_account_id = b.bank_account_id ORDER BY w.created_at DESC", nativeQuery = true)
    List<WithdrawalProjection> getAllWithdrawalRequests();

    @Modifying
    @Query(value = "UPDATE withdrawal_requests SET status = :status, processed_at = GETDATE(), processed_by = :adminId WHERE withdrawal_id = :withdrawalId", nativeQuery = true)
    void processWithdrawalRequest(@Param("withdrawalId") int withdrawalId, @Param("status") String status, @Param("adminId") int adminId);

    @Modifying
    @Query(value = "UPDATE freelancers SET balance = balance - :amount WHERE freelancer_id = (SELECT freelancer_id FROM withdrawal_requests WHERE withdrawal_id = :withdrawalId)", nativeQuery = true)
    void deductFreelancerBalanceForWithdrawal(@Param("withdrawalId") int withdrawalId, @Param("amount") double amount);

    
    @Modifying
    @Query(value = "INSERT INTO admin_audit_logs (admin_id, action, module, description, created_at) VALUES (:adminId, :action, :module, :description, GETDATE())", nativeQuery = true)
    void logAudit(@Param("adminId") int adminId, @Param("action") String action, @Param("module") String module, @Param("description") String description);

    @Query(value = "SELECT l.log_id as id, l.action as status, l.module, l.description as detail, l.created_at as timestamp, a.email as source FROM admin_audit_logs l JOIN admins a ON l.admin_id = a.admin_id ORDER BY l.created_at DESC", nativeQuery = true)
    List<AuditLogProjection> getAuditLogs();

    
    @Query(value = "SELECT category_id as id, category_name as name, description, is_active as isActive FROM job_categories ORDER BY category_name ASC", nativeQuery = true)
    List<JobCategoryProjection> getJobCategories();
    
    
    @Query(value = "SELECT p.project_id as id, p.title, p.description, p.project_type as type, COALESCE(p.budget_fixed, p.budget_min) as budget, p.created_at as createdAt, e.display_name as clientName FROM projects p JOIN employers e ON p.client_id = e.employer_id WHERE p.status = 'PENDING' AND p.is_deleted = 0 ORDER BY p.created_at DESC", nativeQuery = true)
    List<ProjectProjection> getPendingProjects();
}

package com.cny.backend.department.service;

import com.cny.backend.department.entity.Department;
import com.cny.backend.department.entity.DepartmentActivityLog;
import com.cny.backend.department.entity.DepartmentSession;
import com.cny.backend.department.entity.DepartmentTransferHistory;
import com.cny.backend.department.repository.DepartmentActivityLogRepository;
import com.cny.backend.department.repository.DepartmentRepository;
import com.cny.backend.department.repository.DepartmentSessionRepository;
import com.cny.backend.department.repository.DepartmentTransferHistoryRepository;
import com.cny.backend.admin.entity.Manager;
import com.cny.backend.admin.entity.Staff;
import com.cny.backend.admin.repository.ManagerRepository;
import com.cny.backend.admin.repository.StaffRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class DepartmentService {

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private DepartmentSessionRepository departmentSessionRepository;

    @Autowired
    private DepartmentActivityLogRepository departmentActivityLogRepository;

    @Autowired
    private DepartmentTransferHistoryRepository transferHistoryRepository;

    @Autowired
    private ManagerRepository managerRepository;

    @Autowired
    private StaffRepository staffRepository;

    // ========== QUERY ==========

    public List<Department> getAllDepartments() {
        return departmentRepository.findAll();
    }

    /**
     * Count managers and staff in a given department.
     */
    public Map<String, Object> getDepartmentMemberCounts(Integer departmentId) {
        Department dept = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new IllegalArgumentException("Department not found: " + departmentId));

        long managerCount = managerRepository.findAll().stream()
                .filter(m -> m.getDepartmentEntity() != null
                        && m.getDepartmentEntity().getDepartmentId().equals(departmentId)
                        && !Boolean.TRUE.equals(m.getIsDeleted()))
                .count();
        long staffCount = staffRepository.findAll().stream()
                .filter(s -> s.getDepartmentEntity() != null
                        && s.getDepartmentEntity().getDepartmentId().equals(departmentId)
                        && !Boolean.TRUE.equals(s.getIsDeleted()))
                .count();

        Map<String, Object> result = new HashMap<>();
        result.put("departmentId", departmentId);
        result.put("departmentCode", dept.getCode());
        result.put("departmentName", dept.getName());
        result.put("managerCount", managerCount);
        result.put("staffCount", staffCount);
        result.put("maxManagers", dept.getMaxManagers());
        return result;
    }

    public List<DepartmentTransferHistory> getTransfersByDepartment(Integer departmentId) {
        return transferHistoryRepository
                .findByFromDepartmentDepartmentIdOrToDepartmentDepartmentIdOrderByTransferredAtDesc(
                        departmentId, departmentId);
    }

    public List<DepartmentTransferHistory> getTransfersByUser(String userType, Integer userId) {
        return transferHistoryRepository
                .findByUserTypeAndUserIdOrderByTransferredAtDesc(userType, userId);
    }

    // ========== TRANSFER ==========

    /**
     * Transfer a Manager or Staff to another department.
     * Business rules enforced:
     *   1. Source department must retain at least 1 manager (if transferring manager)
     *   2. Source department must retain at least 1 staff (if transferring staff)
     *   3. Target department must not exceed max_managers (if transferring manager)
     *   4. Cannot transfer to the same department
     */
    @Transactional
    public DepartmentTransferHistory transferUser(
            String userType, Integer userId, Integer toDepartmentId, Integer adminId, String reason) {

        Department toDept = departmentRepository.findById(toDepartmentId)
                .orElseThrow(() -> new IllegalArgumentException("Phòng ban đích không tồn tại."));

        if ("MANAGER".equalsIgnoreCase(userType)) {
            return transferManager(userId, toDept, adminId, reason);
        } else if ("STAFF".equalsIgnoreCase(userType)) {
            return transferStaff(userId, toDept, adminId, reason);
        } else {
            throw new IllegalArgumentException("userType phải là 'MANAGER' hoặc 'STAFF'.");
        }
    }

    private DepartmentTransferHistory transferManager(Integer managerId, Department toDept, Integer adminId, String reason) {
        Manager manager = managerRepository.findById(managerId)
                .orElseThrow(() -> new IllegalArgumentException("Manager không tồn tại: " + managerId));

        Department fromDept = manager.getDepartmentEntity();
        if (fromDept == null) {
            throw new IllegalArgumentException("Manager chưa thuộc phòng ban nào.");
        }
        if (fromDept.getDepartmentId().equals(toDept.getDepartmentId())) {
            throw new IllegalArgumentException("Manager đã thuộc phòng ban này.");
        }

        // Rule: source must retain at least 1 manager
        long fromManagerCount = managerRepository.findAll().stream()
                .filter(m -> m.getDepartmentEntity() != null
                        && m.getDepartmentEntity().getDepartmentId().equals(fromDept.getDepartmentId())
                        && !Boolean.TRUE.equals(m.getIsDeleted()))
                .count();
        if (fromManagerCount <= 1) {
            throw new IllegalArgumentException(
                    "Phòng ban '" + fromDept.getName() + "' phải giữ tối thiểu 1 Manager. Không thể điều chuyển.");
        }

        // Rule: target must not exceed max_managers
        long toManagerCount = managerRepository.findAll().stream()
                .filter(m -> m.getDepartmentEntity() != null
                        && m.getDepartmentEntity().getDepartmentId().equals(toDept.getDepartmentId())
                        && !Boolean.TRUE.equals(m.getIsDeleted()))
                .count();
        if (toManagerCount >= toDept.getMaxManagers()) {
            throw new IllegalArgumentException(
                    "Phòng ban '" + toDept.getName() + "' đã đạt giới hạn " + toDept.getMaxManagers() + " Manager.");
        }

        // Perform transfer
        manager.setDepartmentEntity(toDept);
        manager.setDepartment(toDept.getName());
        manager.setUpdatedAt(LocalDateTime.now());
        managerRepository.save(manager);

        // Log transfer history
        DepartmentTransferHistory history = DepartmentTransferHistory.builder()
                .userType("MANAGER")
                .userId(managerId)
                .userEmail(manager.getEmail())
                .userDisplayName(manager.getDisplayName())
                .fromDepartment(fromDept)
                .toDepartment(toDept)
                .transferredBy(adminId)
                .reason(reason)
                .build();
        return transferHistoryRepository.save(history);
    }

    private DepartmentTransferHistory transferStaff(Integer staffId, Department toDept, Integer adminId, String reason) {
        Staff staff = staffRepository.findById(staffId)
                .orElseThrow(() -> new IllegalArgumentException("Staff không tồn tại: " + staffId));

        Department fromDept = staff.getDepartmentEntity();
        if (fromDept == null) {
            throw new IllegalArgumentException("Staff chưa thuộc phòng ban nào.");
        }
        if (fromDept.getDepartmentId().equals(toDept.getDepartmentId())) {
            throw new IllegalArgumentException("Staff đã thuộc phòng ban này.");
        }

        // Rule: source must retain at least 1 staff
        long fromStaffCount = staffRepository.findAll().stream()
                .filter(s -> s.getDepartmentEntity() != null
                        && s.getDepartmentEntity().getDepartmentId().equals(fromDept.getDepartmentId())
                        && !Boolean.TRUE.equals(s.getIsDeleted()))
                .count();
        if (fromStaffCount <= 1) {
            throw new IllegalArgumentException(
                    "Phòng ban '" + fromDept.getName() + "' phải giữ tối thiểu 1 Staff. Không thể điều chuyển.");
        }

        // Perform transfer
        staff.setDepartmentEntity(toDept);
        staff.setUpdatedAt(LocalDateTime.now());
        staffRepository.save(staff);

        // Log transfer history
        DepartmentTransferHistory history = DepartmentTransferHistory.builder()
                .userType("STAFF")
                .userId(staffId)
                .userEmail(staff.getEmail())
                .userDisplayName(staff.getDisplayName())
                .fromDepartment(fromDept)
                .toDepartment(toDept)
                .transferredBy(adminId)
                .reason(reason)
                .build();
        return transferHistoryRepository.save(history);
    }

    // ========== SESSION MANAGEMENT ==========

    @Transactional
    public DepartmentSession startSession(Integer departmentId, Integer userId, String userRole, String ipAddress) {
        Optional<DepartmentSession> activeSession = departmentSessionRepository
                .findFirstByUserIdAndUserRoleAndStatusOrderByLoginAtDesc(userId, userRole, "ACTIVE");
        if (activeSession.isPresent()) {
            DepartmentSession oldSession = activeSession.get();
            oldSession.setStatus("COMPLETED");
            oldSession.setLogoutAt(LocalDateTime.now());
            departmentSessionRepository.save(oldSession);
        }

        DepartmentSession session = DepartmentSession.builder()
                .departmentId(departmentId)
                .userId(userId)
                .userRole(userRole)
                .ipAddress(ipAddress)
                .loginAt(LocalDateTime.now())
                .status("ACTIVE")
                .build();
        return departmentSessionRepository.save(session);
    }

    @Transactional
    public void endSession(Integer sessionId) {
        departmentSessionRepository.findById(sessionId).ifPresent(session -> {
            session.setStatus("COMPLETED");
            session.setLogoutAt(LocalDateTime.now());
            departmentSessionRepository.save(session);
        });
    }

    @Transactional
    public void logActivity(Integer sessionId, Integer departmentId, Integer userId, String userRole, String action, String description) {
        DepartmentActivityLog log = DepartmentActivityLog.builder()
                .sessionId(sessionId)
                .departmentId(departmentId)
                .userId(userId)
                .userRole(userRole)
                .action(action)
                .description(description)
                .createdAt(LocalDateTime.now())
                .build();
        departmentActivityLogRepository.save(log);
    }

    public List<DepartmentSession> getSessionsByDepartment(Integer departmentId) {
        return departmentSessionRepository.findByDepartmentId(departmentId);
    }

    public List<DepartmentActivityLog> getLogsByDepartment(Integer departmentId) {
        return departmentActivityLogRepository.findByDepartmentId(departmentId);
    }
}

# BẢNG USE CASE CHI TIẾT (STAFF & MANAGER)

Dưới đây là bảng tổng hợp chi tiết các Use Case phục vụ quản lý và phân tích nghiệp vụ, được viết dưới dạng User Story ("As a..., I want to..., so that...") bám sát yêu cầu nghiệp vụ của dự án **vLance**.

---

## 1. BẢNG USE CASE CHO VAI TRÒ STAFF (NHÂN VIÊN)

| Tên Use Case (Use Case Name) | Trạng thái | Hành vi chi tiết (Behavior / User Story) |
| :--- | :--- | :--- |
| **KYC Verification** | Đã có | As a **staff**, I want to review and approve or reject user identity verification requests to ensure platform compliance and trust. |
| **Project Moderation** | Đã có | As a **staff**, I want to review, approve, reject, or request revisions on client projects to maintain marketplace quality. |
| **Profile Audit Management** | Đã có | As a **staff**, I want to review and approve or reject company profile update requests to verify employer legitimacy. |
| **Withdrawal Request Verification** | Đã có | As a **staff**, I want to audit freelancer withdrawal requests and verify bank details to prevent fraudulent payouts. |
| **Realtime Support Chat** | Đã có | As a **staff**, I want to chat in real-time with users within support tickets to resolve their inquiries and technical issues. |
| **Support Ticket Claiming** | Đã có | As a **staff**, I want to claim open support tickets from the queue to assign them to myself for resolution. |
| **Spammer User Blocking** | Đã có | As a **staff**, I want to block abusive or spamming users from sending support chat messages to maintain a productive support environment. |
| **Ticket Deletion & Restoration** | Đã có | As a **staff**, I want to delete support tickets or restore them from the trash to clean up duplicate or invalid requests. |
| **Task Signoff Submission** | Đã có | As a **staff**, I want to submit department signoff decisions on assigned verification tasks to move them forward in the approval pipeline. |
| **Violation Report Investigation** | Đã có | As a **staff**, I want to investigate user reports and flags to issue warning templates or recommend account locks. |
| **Warning Template Management** | Đã có | As a **staff**, I want to access and use standardized warning templates to quickly and consistently communicate violations to users. |
| **Dispute Settlement Suggestion** | **Nên thêm** | As a **staff**, I want to analyze dispute evidence and suggest an escrow split percentage to my manager for final execution. |
| **Ticket Escalation to Manager** | **Nên thêm** | As a **staff**, I want to escalate complex support tickets or severe disputes to my manager to obtain senior authority intervention. |
| **Daily Moderation Export** | **Nên thêm** | As a **staff**, I want to export my daily moderation actions to a CSV file to report my daily work progress to my supervisor. |

---

## 2. BẢNG USE CASE CHO VAI TRÒ MANAGER (TRƯỞNG PHÒNG)

| Tên Use Case (Use Case Name) | Trạng thái | Hành vi chi tiết (Behavior / User Story) |
| :--- | :--- | :--- |
| **Verification Task Creation** | Đã có | As a **manager**, I want to create verification tasks and assign them to specific departments to delegate internal check duties. |
| **Task Final Signoff** | Đã có | As a **manager**, I want to review department signoffs and provide the final approval for verification tasks to ensure all compliance checks are met. |
| **Staff Account Invitation** | Đã có | As a **manager**, I want to send invitation links and assign department roles to new staff members to expand my department team. |
| **Department Member Transfer** | Đã có | As a **manager**, I want to transfer department members to another team to dynamically adjust operational workloads. |
| **Department Stats Monitoring** | Đã có | As a **manager**, I want to view the list of staff, login history, and pending workload in my department to evaluate overall department efficiency. |
| **Dispute Resolution Execution** | **Nên thêm** | As a **manager**, I want to review staff settlement suggestions and finalize escrow payout distributions (refund client, pay freelancer, or split) for resolved disputes. |
| **Dual-Authorization Payout Signoff** | **Nên thêm** | As a **manager**, I want to perform secondary authorization on high-value withdrawal requests to prevent financial fraud. |
| **Staff Performance Analytics** | **Nên thêm** | As a **manager**, I want to view performance reports for my department's staff (average response speed, task completion rate) to evaluate work efficiency. |
| **Internal Log Investigation** | **Nên thêm** | As a **manager**, I want to search and audit detailed action logs of my staff members to detect and prevent potential administrative authority abuses. |
| **Smart Workload Routing Config** | **Nên thêm** | As a **manager**, I want to configure automatic support ticket distribution policies to assign chats fairly among active staff members. |

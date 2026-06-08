# Walkthrough: Invitation Flow & RBAC for Staff and Manager Roles

We have successfully designed, built, and pushed the complete invitation-based onboarding flow combined with role-based access management for Manager and Staff accounts.

## Changes Made

### 1. Database Layer (`Database/CNY.sql`)
- Created the table `dbo.staff_invitations` with a secure random UUID token, role selection (`MANAGER` or `STAFF`), statustracking (`PENDING`, `ACCEPTED`, `EXPIRED`), and 24-hour expiration (`expires_at`).
- Included safe drops for multiple execution cycles.

### 2. Backend Layer (Spring Boot)
- **`StaffInvitation` & `StaffInvitationRepository`**: Added JPA mappings and query operations for invitation token management.
- **`AdminService` / `AdminController`**:
  - Implemented the `inviteStaffOrManager` service method to create placeholder accounts (`status = 'INVITED'`), generate secure UUID tokens, and send invite emails via `JavaMailSender` containing the registration URL.
  - Exposed `POST /api/admin/invite` endpoint.
- **`AuthService` / `AuthController`**:
  - Implemented `verifyInvitationToken` to validate token expiration and state.
  - Implemented `acceptInvitation` to complete onboarding by capturing Họ và Tên, SĐT, Tên hiển thị, and plain-text Password, then transitions account status to `ACTIVE`.
  - Exposed `GET /api/auth/invitation/verify` and `POST /api/auth/invitation/accept`.

### 3. Frontend Layer (React + Vite)
- **`AdminDashboard.jsx`**: Simplified the create user modal. Instead of the admin manually typing all account details, the Admin inputs only the recipient's **Email** and selects the **Role** (Manager or Staff).
- **`Onboard.jsx` (NEW)**: Created the onboarding registration page which parses the token, performs validation check on the API, and renders a glassmorphism onboarding form to complete registration.
- **`App.jsx`**: Wired query parameter checking on mount so links containing `?token=...` automatically open the onboarding screen.

## Git Pushes
- All local code has been staged, committed with the message `fix dto+qly manager+staff`, and successfully pushed to branch `fix-dto+add-manager+staff` on the remote repository `https://github.com/emancomchuwa/Project_SWP391.git`.

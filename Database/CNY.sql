
-- LANCERPRO (CNY) DATABASE SYSTEM DDL SCRIPT
-- DESIGNED WITH ABSOLUTE CONCRETE ACTOR SEPARATION (TABLE PER CLASS)
-- THERE IS NO SHARED "USERS" TABLE IN THIS SYSTEM.
-- =========================================================================

-- 1. AUTOMATIC DATABASE SETUP
-- Checks if database 'CNY' exists; if not, creates it automatically.
drop database CNY
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'CNY')
BEGIN
    CREATE DATABASE CNY;
END
GO

USE CNY;
GO

-- 2. SAFE CLEANUP (DROP TABLE SEQUENCE IN REVERSE FK DEPENDENCY ORDER)
-- This allows running the script multiple times without any constraint conflicts.
IF OBJECT_ID('dbo.department_task_signoffs', 'U') IS NOT NULL DROP TABLE dbo.department_task_signoffs;
IF OBJECT_ID('dbo.department_verification_tasks', 'U') IS NOT NULL DROP TABLE dbo.department_verification_tasks;
IF OBJECT_ID('dbo.department_transfer_history', 'U') IS NOT NULL DROP TABLE dbo.department_transfer_history;
IF OBJECT_ID('dbo.department_activity_logs', 'U') IS NOT NULL DROP TABLE dbo.department_activity_logs;
IF OBJECT_ID('dbo.department_sessions', 'U') IS NOT NULL DROP TABLE dbo.department_sessions;
IF OBJECT_ID('dbo.staff_invitations', 'U') IS NOT NULL DROP TABLE dbo.staff_invitations;
IF OBJECT_ID('dbo.admin_audit_logs', 'U') IS NOT NULL DROP TABLE dbo.admin_audit_logs;
IF OBJECT_ID('dbo.newsletter_subscribers', 'U') IS NOT NULL DROP TABLE dbo.newsletter_subscribers;
IF OBJECT_ID('dbo.notifications', 'U') IS NOT NULL DROP TABLE dbo.notifications;
IF OBJECT_ID('dbo.ticket_attachments', 'U') IS NOT NULL DROP TABLE dbo.ticket_attachments;
IF OBJECT_ID('dbo.ticket_messages', 'U') IS NOT NULL DROP TABLE dbo.ticket_messages;
IF OBJECT_ID('dbo.support_tickets', 'U') IS NOT NULL DROP TABLE dbo.support_tickets;
IF OBJECT_ID('dbo.message_attachments', 'U') IS NOT NULL DROP TABLE dbo.message_attachments;
IF OBJECT_ID('dbo.messages', 'U') IS NOT NULL DROP TABLE dbo.messages;
IF OBJECT_ID('dbo.conversation_participants', 'U') IS NOT NULL DROP TABLE dbo.conversation_participants;
IF OBJECT_ID('dbo.conversations', 'U') IS NOT NULL DROP TABLE dbo.conversations;
IF OBJECT_ID('dbo.kyc_documents', 'U') IS NOT NULL DROP TABLE dbo.kyc_documents;
IF OBJECT_ID('dbo.kyc_requests', 'U') IS NOT NULL DROP TABLE dbo.kyc_requests;
IF OBJECT_ID('dbo.dispute_decisions', 'U') IS NOT NULL DROP TABLE dbo.dispute_decisions;
IF OBJECT_ID('dbo.dispute_evidences', 'U') IS NOT NULL DROP TABLE dbo.dispute_evidences;
IF OBJECT_ID('dbo.disputes', 'U') IS NOT NULL DROP TABLE dbo.disputes;
IF OBJECT_ID('dbo.user_warnings', 'U') IS NOT NULL DROP TABLE dbo.user_warnings;
IF OBJECT_ID('dbo.reviews', 'U') IS NOT NULL DROP TABLE dbo.reviews;
IF OBJECT_ID('dbo.platform_fee_configs', 'U') IS NOT NULL DROP TABLE dbo.platform_fee_configs;
IF OBJECT_ID('dbo.payment_gateway_logs', 'U') IS NOT NULL DROP TABLE dbo.payment_gateway_logs;
IF OBJECT_ID('dbo.withdrawal_requests', 'U') IS NOT NULL DROP TABLE dbo.withdrawal_requests;
IF OBJECT_ID('dbo.bank_accounts', 'U') IS NOT NULL DROP TABLE dbo.bank_accounts;
IF OBJECT_ID('dbo.escrow_transactions', 'U') IS NOT NULL DROP TABLE dbo.escrow_transactions;
IF OBJECT_ID('dbo.transactions', 'U') IS NOT NULL DROP TABLE dbo.transactions;
IF OBJECT_ID('dbo.wallets', 'U') IS NOT NULL DROP TABLE dbo.wallets;
IF OBJECT_ID('dbo.deliverable_files', 'U') IS NOT NULL DROP TABLE dbo.deliverable_files;
IF OBJECT_ID('dbo.deliverables', 'U') IS NOT NULL DROP TABLE dbo.deliverables;
IF OBJECT_ID('dbo.milestones', 'U') IS NOT NULL DROP TABLE dbo.milestones;
IF OBJECT_ID('dbo.contracts', 'U') IS NOT NULL DROP TABLE dbo.contracts;
IF OBJECT_ID('dbo.proposals', 'U') IS NOT NULL DROP TABLE dbo.proposals;
IF OBJECT_ID('dbo.saved_jobs', 'U') IS NOT NULL DROP TABLE dbo.saved_jobs;
IF OBJECT_ID('dbo.project_attachments', 'U') IS NOT NULL DROP TABLE dbo.project_attachments;
IF OBJECT_ID('dbo.project_skills', 'U') IS NOT NULL DROP TABLE dbo.project_skills;
IF OBJECT_ID('dbo.projects', 'U') IS NOT NULL DROP TABLE dbo.projects;
IF OBJECT_ID('dbo.portfolio_files', 'U') IS NOT NULL DROP TABLE dbo.portfolio_files;
IF OBJECT_ID('dbo.portfolios', 'U') IS NOT NULL DROP TABLE dbo.portfolios;
IF OBJECT_ID('dbo.experiences', 'U') IS NOT NULL DROP TABLE dbo.experiences;
IF OBJECT_ID('dbo.educations', 'U') IS NOT NULL DROP TABLE dbo.educations;
IF OBJECT_ID('dbo.freelancer_skills', 'U') IS NOT NULL DROP TABLE dbo.freelancer_skills;
IF OBJECT_ID('dbo.skills', 'U') IS NOT NULL DROP TABLE dbo.skills;
IF OBJECT_ID('dbo.job_categories', 'U') IS NOT NULL DROP TABLE dbo.job_categories;
IF OBJECT_ID('dbo.staff', 'U') IS NOT NULL DROP TABLE dbo.staff;
IF OBJECT_ID('dbo.managers', 'U') IS NOT NULL DROP TABLE dbo.managers;
IF OBJECT_ID('dbo.departments', 'U') IS NOT NULL DROP TABLE dbo.departments;
IF OBJECT_ID('dbo.admins', 'U') IS NOT NULL DROP TABLE dbo.admins;
IF OBJECT_ID('dbo.employers', 'U') IS NOT NULL DROP TABLE dbo.employers;
IF OBJECT_ID('dbo.freelancers', 'U') IS NOT NULL DROP TABLE dbo.freelancers;
IF OBJECT_ID('dbo.user_status_history', 'U') IS NOT NULL DROP TABLE dbo.user_status_history;
IF OBJECT_ID('dbo.login_history', 'U') IS NOT NULL DROP TABLE dbo.login_history;
GO

-- =============================================
-- 3. ABSOLUTE ACTOR TABLES (CONCRETE TABLES WITH LOGIN DETAILS)
-- =============================================

-- Freelancer (Người tìm việc) Concrete Table
CREATE TABLE freelancers (
    freelancer_id       INT PRIMARY KEY IDENTITY(1,1),
    email               NVARCHAR(255) NOT NULL UNIQUE,
    password_hash       NVARCHAR(255) NOT NULL,
    display_name        NVARCHAR(100) NOT NULL,
    full_name           NVARCHAR(150),
    phone               NVARCHAR(20),
    avatar_url          NVARCHAR(500),
    status              NVARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    email_verified      BIT NOT NULL DEFAULT 1,
    google_id           NVARCHAR(100) UNIQUE,
    language            NVARCHAR(10) DEFAULT 'vi',
    timezone            NVARCHAR(50) DEFAULT 'Asia/Ho_Chi_Minh',
    last_login_at       DATETIME2,
    professional_title  NVARCHAR(200),
    bio                 NVARCHAR(MAX),
    hourly_rate         DECIMAL(12,2),
    address             NVARCHAR(500),
    city                NVARCHAR(100),
    country             NVARCHAR(100),
    profile_completeness INT DEFAULT 0,
    total_earnings      DECIMAL(15,2) DEFAULT 0,
    projects_completed  INT DEFAULT 0,
    average_rating      DECIMAL(3,2) DEFAULT 0,
    is_available        BIT DEFAULT 1,
    is_deleted          BIT NOT NULL DEFAULT 0,
    messenger_pin       NVARCHAR(10) NULL,  -- Mã PIN bảo mật Messenger (4 chữ số)
    created_at          DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at          DATETIME2 NOT NULL DEFAULT GETDATE()
);
CREATE INDEX idx_freelancers_email ON freelancers(email);
CREATE INDEX idx_freelancers_status ON freelancers(status);
GO

-- Employer (Nhà tuyển dụng) Concrete Table
CREATE TABLE employers (
    employer_id         INT PRIMARY KEY IDENTITY(1,1),
    email               NVARCHAR(255) NOT NULL UNIQUE,
    password_hash       NVARCHAR(255) NOT NULL,
    display_name        NVARCHAR(100) NOT NULL,
    full_name           NVARCHAR(150),
    phone               NVARCHAR(20),
    avatar_url          NVARCHAR(500),
    status              NVARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    email_verified      BIT NOT NULL DEFAULT 1,
    google_id           NVARCHAR(100) UNIQUE,
    language            NVARCHAR(10) DEFAULT 'vi',
    timezone            NVARCHAR(50) DEFAULT 'Asia/Ho_Chi_Minh',
    last_login_at       DATETIME2,
    company_name        NVARCHAR(200),
    company_logo_url    NVARCHAR(500),
    company_description NVARCHAR(MAX),
    website             NVARCHAR(500),
    address             NVARCHAR(500),
    city                NVARCHAR(100),
    country             NVARCHAR(100),
    company_size        NVARCHAR(50),
    industry            NVARCHAR(100),
    profile_completeness INT DEFAULT 0,
    total_spent         DECIMAL(15,2) DEFAULT 0,
    projects_posted     INT DEFAULT 0,
    average_rating      DECIMAL(3,2) DEFAULT 0,
    is_deleted          BIT NOT NULL DEFAULT 0,
    messenger_pin       NVARCHAR(10) NULL,  -- Mã PIN bảo mật Messenger (4 chữ số)
    created_at          DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at          DATETIME2 NOT NULL DEFAULT GETDATE()
);
CREATE INDEX idx_employers_email ON employers(email);
CREATE INDEX idx_employers_status ON employers(status);
GO

-- Admin (Quản trị viên) Concrete Table
CREATE TABLE admins (
    admin_id            INT PRIMARY KEY IDENTITY(1,1),
    email               NVARCHAR(255) NOT NULL UNIQUE,
    password_hash       NVARCHAR(255) NOT NULL,
    display_name        NVARCHAR(100) NOT NULL,
    full_name           NVARCHAR(150),
    phone               NVARCHAR(20),
    avatar_url          NVARCHAR(500),
    status              NVARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    email_verified      BIT NOT NULL DEFAULT 1,
    google_id           NVARCHAR(100) UNIQUE,
    language            NVARCHAR(10) DEFAULT 'vi',
    timezone            NVARCHAR(50) DEFAULT 'Asia/Ho_Chi_Minh',
    last_login_at       DATETIME2,
    admin_level         NVARCHAR(50) DEFAULT 'SUPER_ADMIN',
    is_deleted          BIT NOT NULL DEFAULT 0,
    messenger_pin       NVARCHAR(10) NULL,  -- Mã PIN bảo mật Messenger (4 chữ số)
    created_at          DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at          DATETIME2 NOT NULL DEFAULT GETDATE()
);
CREATE INDEX idx_admins_email ON admins(email);
GO

-- Department (Khoa / Phòng ban) Table — CÁC PHÒNG BAN CỐ ĐỊNH, KHÔNG ĐƯỢC THÊM MỚI
CREATE TABLE departments (
    department_id       INT PRIMARY KEY IDENTITY(1,1),
    name                NVARCHAR(100) NOT NULL UNIQUE,
    code                NVARCHAR(20) NOT NULL UNIQUE,
    description         NVARCHAR(500),
    max_managers        INT NOT NULL DEFAULT 5,  -- Tối đa 5 manager mỗi phòng ban
    created_at          DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at          DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

-- SEED 6 PHÒNG BAN CỐ ĐỊNH (KHÔNG ĐƯỢC THÊM MỚI TỪ GIAO DIỆN)
INSERT INTO departments (name, code, description, max_managers) VALUES
    (N'Phòng Tài Chính', 'FIN', N'Quản lý rút tiền, hoàn tiền, escrow, giao dịch tài chính', 5),
    (N'Phòng Kiểm Duyệt', 'MOD', N'Duyệt dự án, kiểm duyệt nội dung, xác minh KYC', 5),
    (N'Phòng Tranh Chấp', 'DIS', N'Xử lý tranh chấp, phân xử hợp đồng giữa các bên', 5),
    (N'Phòng Hỗ Trợ', 'CS', N'Support tickets, hỗ trợ và chăm sóc người dùng', 5),
    (N'Phòng Kỹ Thuật', 'IT', N'Bảo trì hệ thống, cấu hình, CMS, SEO, vận hành kỹ thuật', 5),
    (N'Phòng Kiểm Toán', 'AUD', N'Giám sát, audit logs, đánh giá tuân thủ quy trình', 5);
GO

-- Manager (Trưởng phòng ban) Concrete Table
CREATE TABLE managers (
    manager_id          INT PRIMARY KEY IDENTITY(1,1),
    email               NVARCHAR(255) NOT NULL UNIQUE,
    password_hash       NVARCHAR(255) NOT NULL,
    display_name        NVARCHAR(100) NOT NULL,
    full_name           NVARCHAR(150),
    phone               NVARCHAR(20),
    avatar_url          NVARCHAR(500),
    status              NVARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    department          NVARCHAR(50) NULL, -- Chuỗi text cũ (để tương thích ngược)
    department_id       INT REFERENCES departments(department_id), -- Quan hệ chính thức với Khoa
    managed_by_admin    INT REFERENCES admins(admin_id),
    is_deleted          BIT NOT NULL DEFAULT 0,
    created_at          DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at          DATETIME2 NOT NULL DEFAULT GETDATE(),
    last_login_at       DATETIME2,
    messenger_pin       NVARCHAR(10) NULL
);
CREATE INDEX idx_managers_email ON managers(email);
GO

-- Staff (Nhân viên chuyên trách) Concrete Table
CREATE TABLE staff (
    staff_id            INT PRIMARY KEY IDENTITY(1,1),
    email               NVARCHAR(255) NOT NULL UNIQUE,
    password_hash       NVARCHAR(255) NOT NULL,
    display_name        NVARCHAR(100) NOT NULL,
    full_name           NVARCHAR(150),
    phone               NVARCHAR(20),
    avatar_url          NVARCHAR(500),
    status              NVARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    specialization      NVARCHAR(50) NOT NULL,
    manager_id          INT REFERENCES managers(manager_id),
    department_id       INT REFERENCES departments(department_id), -- Thuộc Khoa nào
    created_by_admin    INT REFERENCES admins(admin_id),
    is_deleted          BIT NOT NULL DEFAULT 0,
    created_at          DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at          DATETIME2 NOT NULL DEFAULT GETDATE(),
    last_login_at       DATETIME2,
    messenger_pin       NVARCHAR(10) NULL
);
CREATE INDEX idx_staff_email ON staff(email);
GO

-- Department Sessions (Phiên làm việc của khoa/phòng ban) Table
CREATE TABLE department_sessions (
    session_id          INT PRIMARY KEY IDENTITY(1,1),
    department_id       INT NOT NULL REFERENCES departments(department_id),
    user_id             INT NOT NULL,
    user_role           NVARCHAR(50) NOT NULL,
    login_at            DATETIME2 NOT NULL DEFAULT GETDATE(),
    logout_at           DATETIME2,
    ip_address          NVARCHAR(45),
    status              NVARCHAR(50) NOT NULL DEFAULT 'ACTIVE'
);
GO

-- Department Activity Logs (Nhật ký hành động trong khoa/phòng ban) Table
CREATE TABLE department_activity_logs (
    log_id              INT PRIMARY KEY IDENTITY(1,1),
    session_id          INT REFERENCES department_sessions(session_id),
    department_id       INT NOT NULL REFERENCES departments(department_id),
    user_id             INT NOT NULL,
    user_role           NVARCHAR(50) NOT NULL,
    action              NVARCHAR(100) NOT NULL,
    description         NVARCHAR(MAX),
    created_at          DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

-- Department Transfer History (Lịch sử điều chuyển nhân sự giữa các phòng ban)
CREATE TABLE department_transfer_history (
    transfer_id         INT PRIMARY KEY IDENTITY(1,1),
    user_type           NVARCHAR(20) NOT NULL,    -- 'MANAGER' hoặc 'STAFF'
    user_id             INT NOT NULL,             -- manager_id hoặc staff_id
    user_email          NVARCHAR(255) NOT NULL,   -- Email để truy vấn nhanh
    user_display_name   NVARCHAR(100),            -- Tên hiển thị
    from_department_id  INT NOT NULL REFERENCES departments(department_id),
    to_department_id    INT NOT NULL REFERENCES departments(department_id),
    transferred_by      INT NOT NULL REFERENCES admins(admin_id),
    reason              NVARCHAR(500),
    transferred_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
CREATE INDEX idx_transfer_history_user ON department_transfer_history(user_type, user_id);
CREATE INDEX idx_transfer_history_dept ON department_transfer_history(from_department_id, to_department_id);
GO

-- Staff/Manager Onboarding Invitations Table
CREATE TABLE staff_invitations (
    id                  INT PRIMARY KEY IDENTITY(1,1),
    email               NVARCHAR(255) NOT NULL UNIQUE,
    role                NVARCHAR(50) NOT NULL, -- 'MANAGER' or 'STAFF'
    token               NVARCHAR(255) NOT NULL UNIQUE,
    expires_at          DATETIME2 NOT NULL,
    status              NVARCHAR(50) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'ACCEPTED', 'EXPIRED'
    created_at          DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at          DATETIME2 NOT NULL DEFAULT GETDATE()
);
CREATE INDEX idx_staff_invitations_token ON staff_invitations(token);
GO

-- =============================================
-- 4. LOGIN HISTORY & SYSTEM LOGS
-- =============================================
CREATE TABLE login_history (
    id            INT PRIMARY KEY IDENTITY(1,1),
    freelancer_id INT REFERENCES freelancers(freelancer_id),
    employer_id   INT REFERENCES employers(employer_id),
    admin_id      INT REFERENCES admins(admin_id),
    manager_id    INT REFERENCES managers(manager_id),
    staff_id      INT REFERENCES staff(staff_id),
    ip_address    NVARCHAR(45),
    user_agent    NVARCHAR(500),
    login_at      DATETIME2 NOT NULL DEFAULT GETDATE(),
    success       BIT NOT NULL DEFAULT 1
);
GO

CREATE TABLE user_status_history (
    id            INT PRIMARY KEY IDENTITY(1,1),
    freelancer_id INT REFERENCES freelancers(freelancer_id),
    employer_id   INT REFERENCES employers(employer_id),
    old_status    NVARCHAR(30),
    new_status    NVARCHAR(30) NOT NULL,
    reason        NVARCHAR(1000),
    changed_at    DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

-- =============================================
-- 5. TAXONOMY & RELATIONSHIPS
-- =============================================
CREATE TABLE job_categories (
    category_id     INT PRIMARY KEY IDENTITY(1,1),
    parent_id       INT REFERENCES job_categories(category_id),
    category_name   NVARCHAR(100) NOT NULL,
    description     NVARCHAR(500),
    icon_url        NVARCHAR(500),
    display_order   INT DEFAULT 0,
    is_active       BIT DEFAULT 1,
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE skills (
    skill_id    INT PRIMARY KEY IDENTITY(1,1),
    skill_name  NVARCHAR(100) NOT NULL UNIQUE,
    category_id INT REFERENCES job_categories(category_id),
    is_active   BIT DEFAULT 1,
    created_at  DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE freelancer_skills (
    freelancer_id INT NOT NULL REFERENCES freelancers(freelancer_id),
    skill_id      INT NOT NULL REFERENCES skills(skill_id),
    proficiency   NVARCHAR(20),
    PRIMARY KEY (freelancer_id, skill_id)
);
GO

CREATE TABLE educations (
    education_id    INT PRIMARY KEY IDENTITY(1,1),
    freelancer_id   INT NOT NULL REFERENCES freelancers(freelancer_id),
    school_name     NVARCHAR(200) NOT NULL,
    degree          NVARCHAR(100),
    field_of_study  NVARCHAR(200),
    start_year      INT,
    end_year        INT,
    description     NVARCHAR(1000),
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE experiences (
    experience_id   INT PRIMARY KEY IDENTITY(1,1),
    freelancer_id   INT NOT NULL REFERENCES freelancers(freelancer_id),
    company_name    NVARCHAR(200) NOT NULL,
    position        NVARCHAR(200) NOT NULL,
    start_date      DATE,
    end_date        DATE,
    is_current      BIT DEFAULT 0,
    description     NVARCHAR(2000),
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE portfolios (
    portfolio_id    INT PRIMARY KEY IDENTITY(1,1),
    freelancer_id   INT NOT NULL REFERENCES freelancers(freelancer_id),
    title           NVARCHAR(200) NOT NULL,
    description     NVARCHAR(2000),
    project_url     NVARCHAR(500),
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE portfolio_files (
    file_id         INT PRIMARY KEY IDENTITY(1,1),
    portfolio_id    INT NOT NULL REFERENCES portfolios(portfolio_id),
    file_url        NVARCHAR(500) NOT NULL,
    file_name       NVARCHAR(255),
    file_size       BIGINT,
    file_type       NVARCHAR(50),
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

-- =============================================
-- 6. PROJECTS & PROPOSALS
-- =============================================
CREATE TABLE projects (
    project_id      INT PRIMARY KEY IDENTITY(1,1),
    client_id       INT NOT NULL REFERENCES employers(employer_id),
    category_id     INT NOT NULL REFERENCES job_categories(category_id),
    title           NVARCHAR(300) NOT NULL,
    description     NVARCHAR(MAX) NOT NULL,
    project_type    NVARCHAR(20) NOT NULL,
    budget_min      DECIMAL(15,2),
    budget_max      DECIMAL(15,2),
    budget_fixed    DECIMAL(15,2),
    deadline        DATE,
    posting_expires DATE,
    status          NVARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    reject_reason   NVARCHAR(1000),
    reviewed_by     INT REFERENCES admins(admin_id),
    reviewed_at     DATETIME2,
    proposal_count  INT DEFAULT 0,
    is_deleted      BIT NOT NULL DEFAULT 0,
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE project_skills (
    project_id      INT NOT NULL REFERENCES projects(project_id),
    skill_id        INT NOT NULL REFERENCES skills(skill_id),
    PRIMARY KEY (project_id, skill_id)
);
GO

CREATE TABLE project_attachments (
    attachment_id   INT PRIMARY KEY IDENTITY(1,1),
    project_id      INT NOT NULL REFERENCES projects(project_id),
    file_url        NVARCHAR(500) NOT NULL,
    file_name       NVARCHAR(255),
    file_size       BIGINT,
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE saved_jobs (
    id              INT PRIMARY KEY IDENTITY(1,1),
    freelancer_id   INT NOT NULL REFERENCES freelancers(freelancer_id),
    project_id      INT NOT NULL REFERENCES projects(project_id),
    saved_at        DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE proposals (
    proposal_id     INT PRIMARY KEY IDENTITY(1,1),
    project_id      INT NOT NULL REFERENCES projects(project_id),
    freelancer_id   INT NOT NULL REFERENCES freelancers(freelancer_id),
    bid_amount      DECIMAL(15,2) NOT NULL,
    estimated_days  INT NOT NULL,
    cover_letter    NVARCHAR(MAX) NOT NULL,
    status          NVARCHAR(30) NOT NULL DEFAULT 'SUBMITTED',
    client_feedback NVARCHAR(1000),
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

-- =============================================
-- 7. CONTRACTS & MILESTONES
-- =============================================
CREATE TABLE contracts (
    contract_id     INT PRIMARY KEY IDENTITY(1,1),
    project_id      INT NOT NULL REFERENCES projects(project_id),
    freelancer_id   INT NOT NULL REFERENCES freelancers(freelancer_id),
    client_id       INT NOT NULL REFERENCES employers(employer_id),
    title           NVARCHAR(255) NOT NULL,
    agreed_amount   DECIMAL(15,2) NOT NULL,
    start_date      DATE NOT NULL,
    end_date        DATE,
    status          NVARCHAR(30) NOT NULL DEFAULT 'PENDING_SIGN',
    terms           NVARCHAR(MAX),
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE milestones (
    milestone_id    INT PRIMARY KEY IDENTITY(1,1),
    contract_id     INT NOT NULL REFERENCES contracts(contract_id),
    title           NVARCHAR(255) NOT NULL,
    amount          DECIMAL(15,2) NOT NULL,
    due_date        DATE,
    status          NVARCHAR(30) NOT NULL DEFAULT 'PENDING',
    description     NVARCHAR(1000),
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE deliverables (
    deliverable_id  INT PRIMARY KEY IDENTITY(1,1),
    milestone_id    INT NOT NULL REFERENCES milestones(milestone_id),
    title           NVARCHAR(255) NOT NULL,
    notes           NVARCHAR(2000),
    status          NVARCHAR(30) NOT NULL DEFAULT 'SUBMITTED',
    submitted_at    DATETIME2 NOT NULL DEFAULT GETDATE(),
    feedback        NVARCHAR(1000)
);
GO

CREATE TABLE deliverable_files (
    file_id         INT PRIMARY KEY IDENTITY(1,1),
    deliverable_id  INT NOT NULL REFERENCES deliverables(deliverable_id),
    file_url        NVARCHAR(500) NOT NULL,
    file_name       NVARCHAR(255),
    file_size       BIGINT,
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

-- =============================================
-- 8. WALLETS & TRANSACTIONS
-- =============================================
CREATE TABLE wallets (
    wallet_id       INT PRIMARY KEY IDENTITY(1,1),
    freelancer_id   INT UNIQUE REFERENCES freelancers(freelancer_id),
    employer_id     INT UNIQUE REFERENCES employers(employer_id),
    balance         DECIMAL(15,2) NOT NULL DEFAULT 0,
    pending_amount  DECIMAL(15,2) NOT NULL DEFAULT 0,
    escrow_amount   DECIMAL(15,2) NOT NULL DEFAULT 0,
    currency        NVARCHAR(10) DEFAULT 'VND',
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE transactions (
    transaction_id  INT PRIMARY KEY IDENTITY(1,1),
    wallet_id       INT NOT NULL REFERENCES wallets(wallet_id),
    amount          DECIMAL(15,2) NOT NULL,
    type            NVARCHAR(30) NOT NULL, -- 'DEPOSIT', 'WITHDRAWAL', 'ESCROW_HOLD', 'ESCROW_RELEASE', 'PLATFORM_FEE'
    status          NVARCHAR(30) NOT NULL DEFAULT 'PENDING',
    description     NVARCHAR(500),
    reference_id    INT,
    reference_type  NVARCHAR(50),
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE escrow_transactions (
    escrow_id       INT PRIMARY KEY IDENTITY(1,1),
    contract_id     INT NOT NULL REFERENCES contracts(contract_id),
    milestone_id    INT REFERENCES milestones(milestone_id),
    amount          DECIMAL(15,2) NOT NULL,
    status          NVARCHAR(30) NOT NULL DEFAULT 'HELD',
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE bank_accounts (
    bank_account_id INT PRIMARY KEY IDENTITY(1,1),
    freelancer_id   INT REFERENCES freelancers(freelancer_id),
    employer_id     INT REFERENCES employers(employer_id),
    bank_name       NVARCHAR(200) NOT NULL,
    account_number  NVARCHAR(50) NOT NULL,
    account_holder  NVARCHAR(200) NOT NULL,
    branch          NVARCHAR(200),
    is_default      BIT DEFAULT 0,
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE withdrawal_requests (
    withdrawal_id   INT PRIMARY KEY IDENTITY(1,1),
    freelancer_id   INT NOT NULL REFERENCES freelancers(freelancer_id),
    amount          DECIMAL(15,2) NOT NULL,
    bank_account_id INT NOT NULL REFERENCES bank_accounts(bank_account_id),
    status          NVARCHAR(30) NOT NULL DEFAULT 'PENDING',
    processed_by    INT REFERENCES admins(admin_id),
    processed_at    DATETIME2,
    reject_reason   NVARCHAR(500),
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE payment_gateway_logs (
    log_id          INT PRIMARY KEY IDENTITY(1,1),
    transaction_id  INT REFERENCES transactions(transaction_id),
    gateway_name    NVARCHAR(50) NOT NULL,
    raw_response    NVARCHAR(MAX),
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE platform_fee_configs (
    config_id       INT PRIMARY KEY IDENTITY(1,1),
    fee_percentage  DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    effective_from  DATETIME2 NOT NULL,
    created_by      INT REFERENCES admins(admin_id),
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

-- =============================================
-- 9. CMS, REVIEWS & MODERATION SYSTEM
-- =============================================
CREATE TABLE reviews (
    review_id               INT PRIMARY KEY IDENTITY(1,1),
    contract_id             INT NOT NULL REFERENCES contracts(contract_id),
    reviewer_freelancer_id   INT REFERENCES freelancers(freelancer_id),
    reviewer_employer_id     INT REFERENCES employers(employer_id),
    reviewee_freelancer_id   INT REFERENCES freelancers(freelancer_id),
    reviewee_employer_id     INT REFERENCES employers(employer_id),
    rating                  DECIMAL(3,2) NOT NULL,
    comment                 NVARCHAR(2000),
    created_at              DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE user_warnings (
    warning_id      INT PRIMARY KEY IDENTITY(1,1),
    freelancer_id   INT REFERENCES freelancers(freelancer_id),
    employer_id     INT REFERENCES employers(employer_id),
    issued_by       INT REFERENCES admins(admin_id),
    reason          NVARCHAR(1000) NOT NULL,
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE disputes (
    dispute_id              INT PRIMARY KEY IDENTITY(1,1),
    contract_id             INT NOT NULL REFERENCES contracts(contract_id),
    raised_by_freelancer_id   INT REFERENCES freelancers(freelancer_id),
    raised_by_employer_id     INT REFERENCES employers(employer_id),
    reason                  NVARCHAR(MAX) NOT NULL,
    status                  NVARCHAR(30) NOT NULL DEFAULT 'OPEN',
    created_at              DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at              DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE dispute_evidences (
    evidence_id     INT PRIMARY KEY IDENTITY(1,1),
    dispute_id      INT NOT NULL REFERENCES disputes(dispute_id),
    freelancer_id   INT REFERENCES freelancers(freelancer_id),
    employer_id     INT REFERENCES employers(employer_id),
    description     NVARCHAR(MAX),
    file_url        NVARCHAR(500),
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE dispute_decisions (
    decision_id              INT PRIMARY KEY IDENTITY(1,1),
    dispute_id               INT NOT NULL REFERENCES disputes(dispute_id),
    decided_by               INT NOT NULL REFERENCES admins(admin_id),
    freelancer_refund_amount DECIMAL(15,2) NOT NULL,
    employer_refund_amount   DECIMAL(15,2) NOT NULL,
    notes                    NVARCHAR(MAX),
    decided_at               DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE kyc_requests (
    request_id      INT PRIMARY KEY IDENTITY(1,1),
    freelancer_id   INT REFERENCES freelancers(freelancer_id),
    employer_id     INT REFERENCES employers(employer_id),
    status          NVARCHAR(30) NOT NULL DEFAULT 'PENDING',
    reviewed_by     INT REFERENCES admins(admin_id),
    reviewed_at     DATETIME2,
    reject_reason   NVARCHAR(500),
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE kyc_documents (
    document_id     INT PRIMARY KEY IDENTITY(1,1),
    request_id      INT NOT NULL REFERENCES kyc_requests(request_id),
    document_type   NVARCHAR(50) NOT NULL,
    document_number NVARCHAR(100),
    file_url        NVARCHAR(500) NOT NULL,
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

-- =============================================
-- 10. COMMUNICATIONS (MESSAGES & TICKETS)
-- =============================================
CREATE TABLE conversations (
    conversation_id INT PRIMARY KEY IDENTITY(1,1),
    title           NVARCHAR(200),
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE conversation_participants (
    id              INT PRIMARY KEY IDENTITY(1,1),
    conversation_id INT NOT NULL REFERENCES conversations(conversation_id),
    freelancer_id   INT REFERENCES freelancers(freelancer_id),
    employer_id     INT REFERENCES employers(employer_id),
    joined_at       DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE messages (
    message_id              INT PRIMARY KEY IDENTITY(1,1),
    conversation_id         INT NOT NULL REFERENCES conversations(conversation_id),
    sender_freelancer_id    INT REFERENCES freelancers(freelancer_id),
    sender_employer_id      INT REFERENCES employers(employer_id),
    message_text            NVARCHAR(MAX),
    is_read                 BIT DEFAULT 0,
    sent_at                 DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE message_attachments (
    attachment_id   INT PRIMARY KEY IDENTITY(1,1),
    message_id      INT NOT NULL REFERENCES messages(message_id),
    file_url        NVARCHAR(500) NOT NULL,
    file_name       NVARCHAR(255),
    file_size       BIGINT,
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE support_tickets (
    ticket_id       INT PRIMARY KEY IDENTITY(1,1),
    freelancer_id   INT REFERENCES freelancers(freelancer_id),
    employer_id     INT REFERENCES employers(employer_id),
    subject         NVARCHAR(255) NOT NULL,
    description     NVARCHAR(MAX) NOT NULL,
    status          NVARCHAR(30) NOT NULL DEFAULT 'OPEN',
    priority        NVARCHAR(20) DEFAULT 'MEDIUM',
    assigned_to     INT REFERENCES admins(admin_id),
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE ticket_messages (
    message_id              INT PRIMARY KEY IDENTITY(1,1),
    ticket_id               INT NOT NULL REFERENCES support_tickets(ticket_id),
    sender_freelancer_id    INT REFERENCES freelancers(freelancer_id),
    sender_employer_id      INT REFERENCES employers(employer_id),
    sender_admin_id         INT REFERENCES admins(admin_id),
    message_text            NVARCHAR(MAX) NOT NULL,
    is_read                 BIT DEFAULT 0,
    sent_at                 DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE ticket_attachments (
    attachment_id   INT PRIMARY KEY IDENTITY(1,1),
    message_id      INT NOT NULL REFERENCES ticket_messages(message_id),
    file_url        NVARCHAR(500) NOT NULL,
    file_name       NVARCHAR(255),
    file_size       BIGINT,
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE notifications (
    notification_id INT PRIMARY KEY IDENTITY(1,1),
    freelancer_id   INT REFERENCES freelancers(freelancer_id),
    employer_id     INT REFERENCES employers(employer_id),
    admin_id        INT REFERENCES admins(admin_id),
    type            NVARCHAR(50) NOT NULL,
    title           NVARCHAR(200) NOT NULL,
    message         NVARCHAR(500),
    is_read         BIT DEFAULT 0,
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE newsletter_subscribers (
    id              INT PRIMARY KEY IDENTITY(1,1),
    email           NVARCHAR(255) NOT NULL UNIQUE,
    freelancer_id   INT REFERENCES freelancers(freelancer_id),
    employer_id     INT REFERENCES employers(employer_id),
    status          NVARCHAR(20) DEFAULT 'PENDING',
    token           NVARCHAR(255),
    subscribed_at   DATETIME2,
    unsubscribed_at DATETIME2,
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE admin_audit_logs (
    log_id          INT PRIMARY KEY IDENTITY(1,1),
    admin_id        INT NOT NULL REFERENCES admins(admin_id),
    action          NVARCHAR(100) NOT NULL,
    module          NVARCHAR(50) NOT NULL,
    description     NVARCHAR(MAX),
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

-- =========================================================================
-- PATCH: Thêm cột messenger_pin cho database đã tồn tại
-- Chạy phần này nếu bạn KHÔNG muốn tạo lại database từ đầu
-- =========================================================================
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'freelancers' AND COLUMN_NAME = 'messenger_pin')
    ALTER TABLE freelancers ADD messenger_pin NVARCHAR(10) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'employers' AND COLUMN_NAME = 'messenger_pin')
    ALTER TABLE employers ADD messenger_pin NVARCHAR(10) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'admins' AND COLUMN_NAME = 'messenger_pin')
    ALTER TABLE admins ADD messenger_pin NVARCHAR(10) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'managers' AND COLUMN_NAME = 'messenger_pin')
    ALTER TABLE managers ADD messenger_pin NVARCHAR(10) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'staff' AND COLUMN_NAME = 'messenger_pin')
    ALTER TABLE staff ADD messenger_pin NVARCHAR(10) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ticket_messages' AND COLUMN_NAME = 'is_read')
    ALTER TABLE ticket_messages ADD is_read BIT NOT NULL DEFAULT 0;
GO

-- =============================================
-- 11. DEPARTMENT VERIFICATION TASKS & SIGNOFFS
-- =============================================
CREATE TABLE department_verification_tasks (
    task_id               INT PRIMARY KEY IDENTITY(1,1),
    task_type             NVARCHAR(50) NOT NULL, -- 'WITHDRAWAL', 'DISPUTE_REFUND', 'KYC_VERIFICATION'
    reference_id          INT NOT NULL,
    title                 NVARCHAR(255) NOT NULL,
    description           NVARCHAR(MAX),
    status                NVARCHAR(30) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
    required_departments  NVARCHAR(255) NOT NULL, -- e.g., 'KYC,FIN'
    created_at            DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at            DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE department_task_signoffs (
    signoff_id            INT PRIMARY KEY IDENTITY(1,1),
    task_id               INT NOT NULL REFERENCES department_verification_tasks(task_id) ON DELETE CASCADE,
    department_code       NVARCHAR(20) NOT NULL,
    verifier_email        NVARCHAR(255) NOT NULL,
    status                NVARCHAR(30) NOT NULL, -- 'APPROVED', 'REJECTED'
    note                  NVARCHAR(MAX),
    signed_at             DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO


USE CNY;
GO

-- =============================================
-- 1. USERS & AUTHENTICATION
-- =============================================
CREATE TABLE users (
    user_id         INT PRIMARY KEY IDENTITY(1,1),
    email           NVARCHAR(255) NOT NULL UNIQUE,
    password_hash   NVARCHAR(255) NOT NULL,
    display_name    NVARCHAR(100) NOT NULL,
    full_name       NVARCHAR(150),
    phone           NVARCHAR(20),
    avatar_url      NVARCHAR(500),
    status          NVARCHAR(30) NOT NULL DEFAULT 'PENDING_VERIFICATION',
    email_verified  BIT NOT NULL DEFAULT 0,
    google_id       NVARCHAR(100) UNIQUE,
    language        NVARCHAR(10) DEFAULT 'vi',
    timezone        NVARCHAR(50) DEFAULT 'Asia/Ho_Chi_Minh',
    last_login_at   DATETIME2,
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2 NOT NULL DEFAULT GETDATE(),
    is_deleted      BIT NOT NULL DEFAULT 0,
    deleted_at      DATETIME2
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
GO

CREATE TABLE roles (
    role_id     INT PRIMARY KEY IDENTITY(1,1),
    role_name   NVARCHAR(50) NOT NULL UNIQUE,
    description NVARCHAR(255),
    is_active   BIT NOT NULL DEFAULT 1,
    created_at  DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE permissions (
    permission_id   INT PRIMARY KEY IDENTITY(1,1),
    permission_key  NVARCHAR(100) NOT NULL UNIQUE,
    module          NVARCHAR(50) NOT NULL,
    description     NVARCHAR(255)
);
GO

CREATE TABLE role_permissions (
    role_id         INT NOT NULL REFERENCES roles(role_id),
    permission_id   INT NOT NULL REFERENCES permissions(permission_id),
    PRIMARY KEY (role_id, permission_id)
);
GO

CREATE TABLE user_roles (
    user_id     INT NOT NULL REFERENCES users(user_id),
    role_id     INT NOT NULL REFERENCES roles(role_id),
    assigned_by INT REFERENCES users(user_id),
    assigned_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    PRIMARY KEY (user_id, role_id)
);
GO

CREATE TABLE email_verifications (
    id          INT PRIMARY KEY IDENTITY(1,1),
    user_id     INT NOT NULL REFERENCES users(user_id),
    token       NVARCHAR(255) NOT NULL UNIQUE,
    expires_at  DATETIME2 NOT NULL,
    used        BIT NOT NULL DEFAULT 0,
    created_at  DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE password_reset_tokens (
    id          INT PRIMARY KEY IDENTITY(1,1),
    user_id     INT NOT NULL REFERENCES users(user_id),
    token       NVARCHAR(255) NOT NULL UNIQUE,
    expires_at  DATETIME2 NOT NULL,
    used        BIT NOT NULL DEFAULT 0,
    created_at  DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE login_history (
    id          INT PRIMARY KEY IDENTITY(1,1),
    user_id     INT NOT NULL REFERENCES users(user_id),
    ip_address  NVARCHAR(45),
    user_agent  NVARCHAR(500),
    login_at    DATETIME2 NOT NULL DEFAULT GETDATE(),
    success     BIT NOT NULL DEFAULT 1
);
CREATE INDEX idx_login_user ON login_history(user_id, login_at);
GO

CREATE TABLE user_status_history (
    id              INT PRIMARY KEY IDENTITY(1,1),
    user_id         INT NOT NULL REFERENCES users(user_id),
    old_status      NVARCHAR(30),
    new_status      NVARCHAR(30) NOT NULL,
    reason          NVARCHAR(1000),
    changed_by      INT REFERENCES users(user_id),
    changed_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

-- =============================================
-- 2. PROFILES
-- =============================================
CREATE TABLE freelancer_profiles (
    profile_id          INT PRIMARY KEY IDENTITY(1,1),
    user_id             INT NOT NULL UNIQUE REFERENCES users(user_id),
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
    created_at          DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at          DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE client_profiles (
    profile_id          INT PRIMARY KEY IDENTITY(1,1),
    user_id             INT NOT NULL UNIQUE REFERENCES users(user_id),
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
    created_at          DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at          DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE job_categories (
    category_id     INT PRIMARY KEY IDENTITY(1,1),
    parent_id       INT REFERENCES job_categories(category_id),
    category_name   NVARCHAR(100) NOT NULL,
    description     NVARCHAR(500),
    icon_url        NVARCHAR(500),
    display_order   INT DEFAULT 0,
    is_active       BIT DEFAULT 1,
    created_by      INT REFERENCES users(user_id),
    updated_by      INT REFERENCES users(user_id),
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

CREATE TABLE user_skills (
    user_id     INT NOT NULL REFERENCES users(user_id),
    skill_id    INT NOT NULL REFERENCES skills(skill_id),
    proficiency NVARCHAR(20),
    PRIMARY KEY (user_id, skill_id)
);
GO

CREATE TABLE educations (
    education_id    INT PRIMARY KEY IDENTITY(1,1),
    user_id         INT NOT NULL REFERENCES users(user_id),
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
    user_id         INT NOT NULL REFERENCES users(user_id),
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
    user_id         INT NOT NULL REFERENCES users(user_id),
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
-- 3. PROJECTS & PROPOSALS
-- =============================================
CREATE TABLE projects (
    project_id      INT PRIMARY KEY IDENTITY(1,1),
    client_id       INT NOT NULL REFERENCES users(user_id),
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
    reviewed_by     INT REFERENCES users(user_id),
    reviewed_at     DATETIME2,
    proposal_count  INT DEFAULT 0,
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2 NOT NULL DEFAULT GETDATE(),
    is_deleted      BIT DEFAULT 0,
    deleted_at      DATETIME2
);
CREATE INDEX idx_projects_client ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_category ON projects(category_id);
GO

CREATE TABLE project_skills (
    project_id  INT NOT NULL REFERENCES projects(project_id),
    skill_id    INT NOT NULL REFERENCES skills(skill_id),
    PRIMARY KEY (project_id, skill_id)
);
GO

CREATE TABLE project_attachments (
    attachment_id   INT PRIMARY KEY IDENTITY(1,1),
    project_id      INT NOT NULL REFERENCES projects(project_id),
    file_url        NVARCHAR(500) NOT NULL,
    file_name       NVARCHAR(255),
    file_size       BIGINT,
    file_type       NVARCHAR(50),
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE saved_jobs (
    user_id     INT NOT NULL REFERENCES users(user_id),
    project_id  INT NOT NULL REFERENCES projects(project_id),
    saved_at    DATETIME2 NOT NULL DEFAULT GETDATE(),
    PRIMARY KEY (user_id, project_id)
);
GO

CREATE TABLE proposals (
    proposal_id     INT PRIMARY KEY IDENTITY(1,1),
    project_id      INT NOT NULL REFERENCES projects(project_id),
    freelancer_id   INT NOT NULL REFERENCES users(user_id),
    bid_amount      DECIMAL(15,2) NOT NULL,
    delivery_days   INT NOT NULL,
    cover_letter    NVARCHAR(MAX),
    status          NVARCHAR(20) NOT NULL DEFAULT 'PENDING',
    submitted_at    DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2 NOT NULL DEFAULT GETDATE(),
    UNIQUE(project_id, freelancer_id)
);
CREATE INDEX idx_proposals_project ON proposals(project_id);
CREATE INDEX idx_proposals_freelancer ON proposals(freelancer_id);
GO

-- =============================================
-- 4. CONTRACTS & MILESTONES
-- =============================================
CREATE TABLE contracts (
    contract_id     INT PRIMARY KEY IDENTITY(1,1),
    project_id      INT NOT NULL REFERENCES projects(project_id),
    proposal_id     INT NOT NULL REFERENCES proposals(proposal_id),
    client_id       INT NOT NULL REFERENCES users(user_id),
    freelancer_id   INT NOT NULL REFERENCES users(user_id),
    agreed_amount   DECIMAL(15,2) NOT NULL,
    status          NVARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    started_at      DATETIME2 NOT NULL DEFAULT GETDATE(),
    completed_at    DATETIME2,
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
CREATE INDEX idx_contracts_client ON contracts(client_id);
CREATE INDEX idx_contracts_freelancer ON contracts(freelancer_id);
GO

CREATE TABLE milestones (
    milestone_id    INT PRIMARY KEY IDENTITY(1,1),
    contract_id     INT NOT NULL REFERENCES contracts(contract_id),
    title           NVARCHAR(200) NOT NULL,
    description     NVARCHAR(MAX),
    amount          DECIMAL(15,2) NOT NULL,
    deadline        DATE,
    status          NVARCHAR(30) NOT NULL DEFAULT 'CREATED',
    display_order   INT DEFAULT 0,
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
CREATE INDEX idx_milestones_contract ON milestones(contract_id);
GO

CREATE TABLE deliverables (
    deliverable_id  INT PRIMARY KEY IDENTITY(1,1),
    milestone_id    INT NOT NULL REFERENCES milestones(milestone_id),
    freelancer_id   INT NOT NULL REFERENCES users(user_id),
    description     NVARCHAR(MAX),
    submitted_at    DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE deliverable_files (
    file_id         INT PRIMARY KEY IDENTITY(1,1),
    deliverable_id  INT NOT NULL REFERENCES deliverables(deliverable_id),
    file_url        NVARCHAR(500) NOT NULL,
    file_name       NVARCHAR(255),
    file_size       BIGINT,
    file_type       NVARCHAR(50),
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

PRINT N'=== PART 1 HOAN TAT. Tiep tuc chay database_part2.sql ===';
GO


-- =============================================
-- vLance Freelance Marketplace - DATABASE SCRIPT
-- PART 2/2: Finance, Reviews, Disputes, CMS, System
-- Chay file nay SAU khi da chay database_part1.sql
-- =============================================
USE CNY;
GO

-- =============================================
-- 5. WALLETS & TRANSACTIONS
-- =============================================
CREATE TABLE wallets (
    wallet_id       INT PRIMARY KEY IDENTITY(1,1),
    user_id         INT NOT NULL UNIQUE REFERENCES users(user_id),
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
    user_id         INT NOT NULL REFERENCES users(user_id),
    type            NVARCHAR(30) NOT NULL,
    amount          DECIMAL(15,2) NOT NULL,
    balance_after   DECIMAL(15,2) NOT NULL,
    reference_code  NVARCHAR(50) UNIQUE,
    description     NVARCHAR(500),
    related_milestone_id INT REFERENCES milestones(milestone_id),
    status          NVARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
CREATE INDEX idx_tx_user ON transactions(user_id, created_at);
CREATE INDEX idx_tx_type ON transactions(type);
GO

CREATE TABLE escrow_transactions (
    escrow_id       INT PRIMARY KEY IDENTITY(1,1),
    milestone_id    INT NOT NULL REFERENCES milestones(milestone_id),
    client_id       INT NOT NULL REFERENCES users(user_id),
    freelancer_id   INT NOT NULL REFERENCES users(user_id),
    amount          DECIMAL(15,2) NOT NULL,
    platform_fee    DECIMAL(15,2) NOT NULL DEFAULT 0,
    net_amount      DECIMAL(15,2) NOT NULL,
    status          NVARCHAR(20) NOT NULL DEFAULT 'HELD',
    funded_at       DATETIME2,
    released_at     DATETIME2,
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE bank_accounts (
    bank_account_id INT PRIMARY KEY IDENTITY(1,1),
    user_id         INT NOT NULL REFERENCES users(user_id),
    bank_name       NVARCHAR(200) NOT NULL,
    account_number  NVARCHAR(50) NOT NULL,
    account_holder  NVARCHAR(200) NOT NULL,
    branch          NVARCHAR(200),
    is_default      BIT DEFAULT 0,
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE withdrawal_requests (
    request_id      INT PRIMARY KEY IDENTITY(1,1),
    user_id         INT NOT NULL REFERENCES users(user_id),
    amount          DECIMAL(15,2) NOT NULL,
    bank_account_id INT NOT NULL REFERENCES bank_accounts(bank_account_id),
    status          NVARCHAR(20) NOT NULL DEFAULT 'PENDING',
    reject_reason   NVARCHAR(500),
    processed_by    INT REFERENCES users(user_id),
    processed_at    DATETIME2,
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE payment_gateway_logs (
    log_id          INT PRIMARY KEY IDENTITY(1,1),
    transaction_id  INT REFERENCES transactions(transaction_id),
    gateway         NVARCHAR(50) NOT NULL,
    gateway_tx_id   NVARCHAR(100),
    request_data    NVARCHAR(MAX),
    response_data   NVARCHAR(MAX),
    status          NVARCHAR(20),
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE platform_fee_configs (
    config_id       INT PRIMARY KEY IDENTITY(1,1),
    fee_percentage  DECIMAL(5,2) NOT NULL,
    effective_from  DATE NOT NULL,
    effective_to    DATE,
    created_by      INT NOT NULL REFERENCES users(user_id),
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

-- =============================================
-- 6. REVIEWS & RATINGS
-- =============================================
CREATE TABLE reviews (
    review_id       INT PRIMARY KEY IDENTITY(1,1),
    contract_id     INT NOT NULL REFERENCES contracts(contract_id),
    reviewer_id     INT NOT NULL REFERENCES users(user_id),
    reviewee_id     INT NOT NULL REFERENCES users(user_id),
    overall_rating  DECIMAL(3,2) NOT NULL,
    comment         NVARCHAR(MAX),
    is_visible      BIT DEFAULT 0,
    is_hidden       BIT DEFAULT 0,
    hidden_reason   NVARCHAR(500),
    hidden_by       INT REFERENCES users(user_id),
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2 NOT NULL DEFAULT GETDATE(),
    is_deleted      BIT DEFAULT 0,
    UNIQUE(contract_id, reviewer_id)
);
CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);
GO

CREATE TABLE review_criteria_scores (
    id              INT PRIMARY KEY IDENTITY(1,1),
    review_id       INT NOT NULL REFERENCES reviews(review_id),
    criteria_name   NVARCHAR(50) NOT NULL,
    score           DECIMAL(3,2) NOT NULL
);
GO

CREATE TABLE user_rankings (
    ranking_id      INT PRIMARY KEY IDENTITY(1,1),
    user_id         INT NOT NULL REFERENCES users(user_id),
    user_type       NVARCHAR(20) NOT NULL,
    ranking_score   DECIMAL(10,4) NOT NULL,
    rank_position   INT,
    category_id     INT REFERENCES job_categories(category_id),
    calculated_at   DATETIME2 NOT NULL DEFAULT GETDATE()
);
CREATE INDEX idx_rankings_type ON user_rankings(user_type, ranking_score DESC);
GO

-- =============================================
-- 7. REPORTS & VIOLATIONS
-- =============================================
CREATE TABLE reports (
    report_id       INT PRIMARY KEY IDENTITY(1,1),
    reporter_id     INT NOT NULL REFERENCES users(user_id),
    target_type     NVARCHAR(20) NOT NULL,
    target_id       INT NOT NULL,
    violation_type  NVARCHAR(50) NOT NULL,
    description     NVARCHAR(MAX) NOT NULL,
    status          NVARCHAR(20) NOT NULL DEFAULT 'PENDING',
    action_taken    NVARCHAR(50),
    processed_by    INT REFERENCES users(user_id),
    processed_at    DATETIME2,
    process_note    NVARCHAR(1000),
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
CREATE INDEX idx_reports_status ON reports(status);
GO

CREATE TABLE report_evidences (
    evidence_id     INT PRIMARY KEY IDENTITY(1,1),
    report_id       INT NOT NULL REFERENCES reports(report_id),
    file_url        NVARCHAR(500) NOT NULL,
    file_name       NVARCHAR(255),
    file_type       NVARCHAR(50),
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE user_warnings (
    warning_id      INT PRIMARY KEY IDENTITY(1,1),
    user_id         INT NOT NULL REFERENCES users(user_id),
    report_id       INT REFERENCES reports(report_id),
    warning_type    NVARCHAR(30) NOT NULL,
    message         NVARCHAR(MAX) NOT NULL,
    issued_by       INT NOT NULL REFERENCES users(user_id),
    acknowledged    BIT DEFAULT 0,
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

-- =============================================
-- 8. DISPUTES
-- =============================================
CREATE TABLE disputes (
    dispute_id      INT PRIMARY KEY IDENTITY(1,1),
    milestone_id    INT NOT NULL UNIQUE REFERENCES milestones(milestone_id),
    contract_id     INT NOT NULL REFERENCES contracts(contract_id),
    opened_by       INT NOT NULL REFERENCES users(user_id),
    reason_category NVARCHAR(50) NOT NULL,
    description     NVARCHAR(MAX) NOT NULL,
    status          NVARCHAR(20) NOT NULL DEFAULT 'OPEN',
    assigned_to     INT REFERENCES users(user_id),
    response_deadline DATETIME2,
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
CREATE INDEX idx_disputes_status ON disputes(status);
GO

CREATE TABLE dispute_evidences (
    evidence_id     INT PRIMARY KEY IDENTITY(1,1),
    dispute_id      INT NOT NULL REFERENCES disputes(dispute_id),
    submitted_by    INT NOT NULL REFERENCES users(user_id),
    evidence_type   NVARCHAR(20),
    file_url        NVARCHAR(500),
    description     NVARCHAR(MAX),
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE dispute_decisions (
    decision_id     INT PRIMARY KEY IDENTITY(1,1),
    dispute_id      INT NOT NULL UNIQUE REFERENCES disputes(dispute_id),
    decided_by      INT NOT NULL REFERENCES users(user_id),
    decision_type   NVARCHAR(30) NOT NULL,
    client_amount   DECIMAL(15,2) NOT NULL DEFAULT 0,
    freelancer_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    reasoning       NVARCHAR(MAX) NOT NULL,
    decided_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

-- =============================================
-- 9. KYC
-- =============================================
CREATE TABLE kyc_requests (
    kyc_id          INT PRIMARY KEY IDENTITY(1,1),
    user_id         INT NOT NULL REFERENCES users(user_id),
    full_name       NVARCHAR(150) NOT NULL,
    date_of_birth   DATE NOT NULL,
    id_number       NVARCHAR(20) NOT NULL,
    status          NVARCHAR(20) NOT NULL DEFAULT 'PENDING',
    reject_reason   NVARCHAR(500),
    reviewed_by     INT REFERENCES users(user_id),
    reviewed_at     DATETIME2,
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
CREATE INDEX idx_kyc_status ON kyc_requests(status);
GO

CREATE TABLE kyc_documents (
    document_id     INT PRIMARY KEY IDENTITY(1,1),
    kyc_id          INT NOT NULL REFERENCES kyc_requests(kyc_id),
    document_type   NVARCHAR(30) NOT NULL,
    file_url        NVARCHAR(500) NOT NULL,
    file_name       NVARCHAR(255),
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

-- =============================================
-- 10. CHAT & MESSAGING
-- =============================================
CREATE TABLE conversations (
    conversation_id INT PRIMARY KEY IDENTITY(1,1),
    project_id      INT REFERENCES projects(project_id),
    contract_id     INT REFERENCES contracts(contract_id),
    conversation_type NVARCHAR(20) DEFAULT 'PROJECT',
    last_message_at DATETIME2,
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE conversation_participants (
    conversation_id INT NOT NULL REFERENCES conversations(conversation_id),
    user_id         INT NOT NULL REFERENCES users(user_id),
    last_read_at    DATETIME2,
    is_muted        BIT DEFAULT 0,
    PRIMARY KEY (conversation_id, user_id)
);
GO

CREATE TABLE messages (
    message_id      INT PRIMARY KEY IDENTITY(1,1),
    conversation_id INT NOT NULL REFERENCES conversations(conversation_id),
    sender_id       INT NOT NULL REFERENCES users(user_id),
    content         NVARCHAR(MAX),
    message_type    NVARCHAR(20) DEFAULT 'TEXT',
    is_read         BIT DEFAULT 0,
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
CREATE INDEX idx_messages_conv ON messages(conversation_id, created_at);
GO

CREATE TABLE message_attachments (
    attachment_id   INT PRIMARY KEY IDENTITY(1,1),
    message_id      INT NOT NULL REFERENCES messages(message_id),
    file_url        NVARCHAR(500) NOT NULL,
    file_name       NVARCHAR(255),
    file_size       BIGINT,
    file_type       NVARCHAR(50),
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

-- =============================================
-- 11. SUPPORT TICKETS
-- =============================================
CREATE TABLE support_tickets (
    ticket_id       INT PRIMARY KEY IDENTITY(1,1),
    user_id         INT NOT NULL REFERENCES users(user_id),
    subject         NVARCHAR(300) NOT NULL,
    description     NVARCHAR(MAX) NOT NULL,
    category        NVARCHAR(50) NOT NULL,
    priority        NVARCHAR(20) DEFAULT 'MEDIUM',
    status          NVARCHAR(20) NOT NULL DEFAULT 'OPEN',
    assigned_to     INT REFERENCES users(user_id),
    resolved_at     DATETIME2,
    closed_at       DATETIME2,
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
CREATE INDEX idx_tickets_status ON support_tickets(status);
GO

CREATE TABLE ticket_messages (
    message_id      INT PRIMARY KEY IDENTITY(1,1),
    ticket_id       INT NOT NULL REFERENCES support_tickets(ticket_id),
    sender_id       INT NOT NULL REFERENCES users(user_id),
    content         NVARCHAR(MAX) NOT NULL,
    is_staff_reply  BIT DEFAULT 0,
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE ticket_attachments (
    attachment_id   INT PRIMARY KEY IDENTITY(1,1),
    ticket_id       INT NOT NULL REFERENCES support_tickets(ticket_id),
    message_id      INT REFERENCES ticket_messages(message_id),
    file_url        NVARCHAR(500) NOT NULL,
    file_name       NVARCHAR(255),
    file_size       BIGINT,
    file_type       NVARCHAR(50),
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

-- =============================================
-- 12. CMS & CONTENT (DA SUA: them created_by, updated_by)
-- =============================================
CREATE TABLE article_categories (
    article_category_id INT PRIMARY KEY IDENTITY(1,1),
    category_name   NVARCHAR(100) NOT NULL,
    slug            NVARCHAR(100) NOT NULL UNIQUE,
    display_order   INT DEFAULT 0,
    is_active       BIT DEFAULT 1,
    created_by      INT REFERENCES users(user_id),
    updated_by      INT REFERENCES users(user_id),
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE articles (
    article_id      INT PRIMARY KEY IDENTITY(1,1),
    category_id     INT REFERENCES article_categories(article_category_id),
    title           NVARCHAR(300) NOT NULL,
    slug            NVARCHAR(300) NOT NULL UNIQUE,
    content         NVARCHAR(MAX) NOT NULL,
    cover_image_url NVARCHAR(500),
    author_id       INT NOT NULL REFERENCES users(user_id),
    status          NVARCHAR(20) DEFAULT 'DRAFT',
    meta_title      NVARCHAR(200),
    meta_description NVARCHAR(500),
    published_at    DATETIME2,
    display_order   INT DEFAULT 0,
    view_count      INT DEFAULT 0,
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE article_tags (
    article_id  INT NOT NULL REFERENCES articles(article_id),
    tag_name    NVARCHAR(50) NOT NULL,
    PRIMARY KEY (article_id, tag_name)
);
GO

CREATE TABLE faq_categories (
    faq_category_id INT PRIMARY KEY IDENTITY(1,1),
    category_name   NVARCHAR(100) NOT NULL,
    display_order   INT DEFAULT 0,
    is_active       BIT DEFAULT 1,
    created_by      INT REFERENCES users(user_id),
    updated_by      INT REFERENCES users(user_id),
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE faqs (
    faq_id          INT PRIMARY KEY IDENTITY(1,1),
    category_id     INT REFERENCES faq_categories(faq_category_id),
    question        NVARCHAR(500) NOT NULL,
    answer          NVARCHAR(MAX) NOT NULL,
    display_order   INT DEFAULT 0,
    is_active       BIT DEFAULT 1,
    created_by      INT REFERENCES users(user_id),
    updated_by      INT REFERENCES users(user_id),
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE policy_pages (
    page_id         INT PRIMARY KEY IDENTITY(1,1),
    page_type       NVARCHAR(30) NOT NULL UNIQUE,
    title           NVARCHAR(200) NOT NULL,
    content         NVARCHAR(MAX) NOT NULL,
    version         INT NOT NULL DEFAULT 1,
    published_at    DATETIME2,
    updated_by      INT REFERENCES users(user_id),
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE policy_versions (
    version_id      INT PRIMARY KEY IDENTITY(1,1),
    page_id         INT NOT NULL REFERENCES policy_pages(page_id),
    version_number  INT NOT NULL,
    content         NVARCHAR(MAX) NOT NULL,
    created_by      INT NOT NULL REFERENCES users(user_id),
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE footer_sections (
    section_id      INT PRIMARY KEY IDENTITY(1,1),
    section_name    NVARCHAR(100) NOT NULL,
    display_order   INT DEFAULT 0,
    is_active       BIT DEFAULT 1,
    created_by      INT REFERENCES users(user_id),
    updated_by      INT REFERENCES users(user_id),
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE footer_links (
    link_id         INT PRIMARY KEY IDENTITY(1,1),
    section_id      INT NOT NULL REFERENCES footer_sections(section_id),
    label           NVARCHAR(100) NOT NULL,
    url             NVARCHAR(500) NOT NULL,
    display_order   INT DEFAULT 0,
    is_active       BIT DEFAULT 1,
    open_new_tab    BIT DEFAULT 0,
    created_by      INT REFERENCES users(user_id),
    updated_by      INT REFERENCES users(user_id),
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

-- site_settings thay the company_info (khong con co lap)
CREATE TABLE site_settings (
    setting_id      INT PRIMARY KEY IDENTITY(1,1),
    setting_group   NVARCHAR(50) NOT NULL,
    setting_key     NVARCHAR(100) NOT NULL UNIQUE,
    setting_value   NVARCHAR(MAX),
    updated_by      INT REFERENCES users(user_id),
    updated_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
CREATE INDEX idx_site_settings_group ON site_settings(setting_group);
GO

CREATE TABLE seo_configs (
    seo_id          INT PRIMARY KEY IDENTITY(1,1),
    page_identifier NVARCHAR(100) NOT NULL UNIQUE,
    meta_title      NVARCHAR(200),
    meta_description NVARCHAR(500),
    og_image_url    NVARCHAR(500),
    canonical_url   NVARCHAR(500),
    updated_by      INT REFERENCES users(user_id),
    updated_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

-- =============================================
-- 13. NOTIFICATIONS & SETTINGS
-- =============================================
CREATE TABLE notifications (
    notification_id INT PRIMARY KEY IDENTITY(1,1),
    user_id         INT NOT NULL REFERENCES users(user_id),
    type            NVARCHAR(50) NOT NULL,
    title           NVARCHAR(200) NOT NULL,
    message         NVARCHAR(500),
    link            NVARCHAR(500),
    is_read         BIT DEFAULT 0,
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
CREATE INDEX idx_notif_user ON notifications(user_id, is_read, created_at DESC);
GO

CREATE TABLE notification_settings (
    id              INT PRIMARY KEY IDENTITY(1,1),
    user_id         INT NOT NULL UNIQUE REFERENCES users(user_id),
    email_new_project BIT DEFAULT 1,
    email_proposal_accepted BIT DEFAULT 1,
    email_payment   BIT DEFAULT 1,
    email_messages  BIT DEFAULT 1,
    email_frequency NVARCHAR(20) DEFAULT 'INSTANT',
    inapp_enabled   BIT DEFAULT 1,
    updated_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE user_settings (
    id              INT PRIMARY KEY IDENTITY(1,1),
    user_id         INT NOT NULL UNIQUE REFERENCES users(user_id),
    theme           NVARCHAR(10) DEFAULT 'light',
    tos_accepted_version INT,
    tos_accepted_at DATETIME2,
    updated_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE newsletter_subscribers (
    id              INT PRIMARY KEY IDENTITY(1,1),
    email           NVARCHAR(255) NOT NULL UNIQUE,
    user_id         INT REFERENCES users(user_id),
    status          NVARCHAR(20) DEFAULT 'PENDING',
    token           NVARCHAR(255),
    subscribed_at   DATETIME2,
    unsubscribed_at DATETIME2,
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

-- =============================================
-- 14. AUDIT & SYSTEM LOGS
-- =============================================
CREATE TABLE admin_audit_logs (
    log_id          INT PRIMARY KEY IDENTITY(1,1),
    admin_id        INT NOT NULL REFERENCES users(user_id),
    action          NVARCHAR(100) NOT NULL,
    module          NVARCHAR(50) NOT NULL,
    target_type     NVARCHAR(50),
    target_id       INT,
    old_value       NVARCHAR(MAX),
    new_value       NVARCHAR(MAX),
    description     NVARCHAR(1000),
    ip_address      NVARCHAR(45),
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
CREATE INDEX idx_audit_admin ON admin_audit_logs(admin_id, created_at);
CREATE INDEX idx_audit_module ON admin_audit_logs(module, created_at);
GO

-- =============================================
-- SEED DATA
-- =============================================
INSERT INTO site_settings (setting_group, setting_key, setting_value) VALUES
('COMPANY_INFO', 'company_name', N'vLance'),
('COMPANY_INFO', 'company_address', NULL),
('COMPANY_INFO', 'company_email', NULL),
('COMPANY_INFO', 'company_phone', NULL),
('COMPANY_INFO', 'company_hotline', NULL),
('SOCIAL_LINKS', 'facebook_url', NULL),
('SOCIAL_LINKS', 'linkedin_url', NULL),
('SOCIAL_LINKS', 'youtube_url', NULL);
GO

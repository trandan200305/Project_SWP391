# Phần 4B: Thiết kế Database — SUPPORT, CMS & AUDIT

> Tiếp nối [Phần 4A — Core Tables](./part4a_database_core.md)

---

## 6. REVIEWS & RATINGS

### `reviews`

```sql
CREATE TABLE reviews (
    review_id       INT PRIMARY KEY IDENTITY(1,1),
    contract_id     INT NOT NULL REFERENCES contracts(contract_id),
    reviewer_id     INT NOT NULL REFERENCES users(user_id),    -- người đánh giá
    reviewee_id     INT NOT NULL REFERENCES users(user_id),    -- người được đánh giá
    overall_rating  DECIMAL(3,2) NOT NULL,  -- 1.00 - 5.00
    comment         NVARCHAR(MAX),
    is_visible      BIT DEFAULT 0,  -- hiện sau khi cả 2 bên đánh giá hoặc sau 14 ngày
    is_hidden       BIT DEFAULT 0,  -- Admin ẩn (UC-33)
    hidden_reason   NVARCHAR(500),
    hidden_by       INT REFERENCES users(user_id),
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2 NOT NULL DEFAULT GETDATE(),
    is_deleted      BIT DEFAULT 0,
    UNIQUE(contract_id, reviewer_id)  -- mỗi user chỉ review 1 lần/contract
);
CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);
```

### `review_criteria_scores`

```sql
CREATE TABLE review_criteria_scores (
    id              INT PRIMARY KEY IDENTITY(1,1),
    review_id       INT NOT NULL REFERENCES reviews(review_id),
    criteria_name   NVARCHAR(50) NOT NULL,
        -- QUALITY | COMMUNICATION | TIMELINESS | EXPERTISE | COOPERATION
    score           DECIMAL(3,2) NOT NULL  -- 1.00 - 5.00
);
```

### `user_rankings`

```sql
CREATE TABLE user_rankings (
    ranking_id      INT PRIMARY KEY IDENTITY(1,1),
    user_id         INT NOT NULL REFERENCES users(user_id),
    user_type       NVARCHAR(20) NOT NULL,  -- FREELANCER | CLIENT
    ranking_score   DECIMAL(10,4) NOT NULL,
    rank_position   INT,
    category_id     INT REFERENCES job_categories(category_id),  -- NULL = tổng thể
    calculated_at   DATETIME2 NOT NULL DEFAULT GETDATE()
);
CREATE INDEX idx_rankings_type ON user_rankings(user_type, ranking_score DESC);
```

---

## 7. REPORTS & VIOLATIONS

### `reports`

```sql
CREATE TABLE reports (
    report_id       INT PRIMARY KEY IDENTITY(1,1),
    reporter_id     INT NOT NULL REFERENCES users(user_id),
    target_type     NVARCHAR(20) NOT NULL,  -- USER | PROJECT | REVIEW | MESSAGE
    target_id       INT NOT NULL,           -- ID của đối tượng bị report
    violation_type  NVARCHAR(50) NOT NULL,
        -- SPAM | FAKE | INAPPROPRIATE | FRAUD | HARASSMENT | OTHER
    description     NVARCHAR(MAX) NOT NULL,
    status          NVARCHAR(20) NOT NULL DEFAULT 'PENDING',
        -- PENDING | REVIEWING | DISMISSED | WARNED | ACTION_TAKEN
    action_taken    NVARCHAR(50),  -- WARN | LOCK | BAN
    processed_by    INT REFERENCES users(user_id),
    processed_at    DATETIME2,
    process_note    NVARCHAR(1000),
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
CREATE INDEX idx_reports_status ON reports(status);
```

### `report_evidences`

```sql
CREATE TABLE report_evidences (
    evidence_id     INT PRIMARY KEY IDENTITY(1,1),
    report_id       INT NOT NULL REFERENCES reports(report_id),
    file_url        NVARCHAR(500) NOT NULL,
    file_name       NVARCHAR(255),
    file_type       NVARCHAR(50),
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
```

### `user_warnings`

```sql
CREATE TABLE user_warnings (
    warning_id      INT PRIMARY KEY IDENTITY(1,1),
    user_id         INT NOT NULL REFERENCES users(user_id),
    report_id       INT REFERENCES reports(report_id),
    warning_type    NVARCHAR(30) NOT NULL,  -- WARNING | FINAL_WARNING
    message         NVARCHAR(MAX) NOT NULL,
    issued_by       INT NOT NULL REFERENCES users(user_id),
    acknowledged    BIT DEFAULT 0,
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
```

---

## 8. DISPUTES

### `disputes`

```sql
CREATE TABLE disputes (
    dispute_id      INT PRIMARY KEY IDENTITY(1,1),
    milestone_id    INT NOT NULL UNIQUE REFERENCES milestones(milestone_id),
    contract_id     INT NOT NULL REFERENCES contracts(contract_id),
    opened_by       INT NOT NULL REFERENCES users(user_id),
    reason_category NVARCHAR(50) NOT NULL,
        -- QUALITY_ISSUE | NON_DELIVERY | CONTRACT_VIOLATION | PAYMENT_ISSUE | OTHER
    description     NVARCHAR(MAX) NOT NULL,
    status          NVARCHAR(20) NOT NULL DEFAULT 'OPEN',
        -- OPEN | REVIEWING | ESCALATED | RESOLVED
    assigned_to     INT REFERENCES users(user_id),  -- Admin xử lý
    response_deadline DATETIME2,  -- hạn phản hồi cho đối phương
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
CREATE INDEX idx_disputes_status ON disputes(status);
```

### `dispute_evidences`

```sql
CREATE TABLE dispute_evidences (
    evidence_id     INT PRIMARY KEY IDENTITY(1,1),
    dispute_id      INT NOT NULL REFERENCES disputes(dispute_id),
    submitted_by    INT NOT NULL REFERENCES users(user_id),
    evidence_type   NVARCHAR(20),  -- FILE | TEXT | CHAT_LOG
    file_url        NVARCHAR(500),
    description     NVARCHAR(MAX),
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
```

### `dispute_decisions`

```sql
CREATE TABLE dispute_decisions (
    decision_id     INT PRIMARY KEY IDENTITY(1,1),
    dispute_id      INT NOT NULL UNIQUE REFERENCES disputes(dispute_id),
    decided_by      INT NOT NULL REFERENCES users(user_id),  -- Admin
    decision_type   NVARCHAR(30) NOT NULL,
        -- REFUND_CLIENT | PAY_FREELANCER | SPLIT
    client_amount   DECIMAL(15,2) NOT NULL DEFAULT 0,
    freelancer_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    reasoning       NVARCHAR(MAX) NOT NULL,
    decided_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
```

---

## 9. KYC

### `kyc_requests`

```sql
CREATE TABLE kyc_requests (
    kyc_id          INT PRIMARY KEY IDENTITY(1,1),
    user_id         INT NOT NULL REFERENCES users(user_id),
    full_name       NVARCHAR(150) NOT NULL,
    date_of_birth   DATE NOT NULL,
    id_number       NVARCHAR(20) NOT NULL,  -- số CCCD
    status          NVARCHAR(20) NOT NULL DEFAULT 'PENDING',
        -- PENDING | APPROVED | REJECTED
    reject_reason   NVARCHAR(500),
    reviewed_by     INT REFERENCES users(user_id),
    reviewed_at     DATETIME2,
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
CREATE INDEX idx_kyc_status ON kyc_requests(status);
```

### `kyc_documents`

```sql
CREATE TABLE kyc_documents (
    document_id     INT PRIMARY KEY IDENTITY(1,1),
    kyc_id          INT NOT NULL REFERENCES kyc_requests(kyc_id),
    document_type   NVARCHAR(30) NOT NULL,
        -- ID_FRONT | ID_BACK | SELFIE_WITH_ID
    file_url        NVARCHAR(500) NOT NULL,  -- encrypted storage
    file_name       NVARCHAR(255),
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
```

---

## 10. CHAT & MESSAGING

### `conversations`

```sql
CREATE TABLE conversations (
    conversation_id INT PRIMARY KEY IDENTITY(1,1),
    project_id      INT REFERENCES projects(project_id),
    contract_id     INT REFERENCES contracts(contract_id),
    conversation_type NVARCHAR(20) DEFAULT 'PROJECT',  -- PROJECT | DIRECT | SUPPORT
    last_message_at DATETIME2,
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
```

### `conversation_participants`

```sql
CREATE TABLE conversation_participants (
    conversation_id INT NOT NULL REFERENCES conversations(conversation_id),
    user_id         INT NOT NULL REFERENCES users(user_id),
    last_read_at    DATETIME2,
    is_muted        BIT DEFAULT 0,
    PRIMARY KEY (conversation_id, user_id)
);
```

### `messages`

```sql
CREATE TABLE messages (
    message_id      INT PRIMARY KEY IDENTITY(1,1),
    conversation_id INT NOT NULL REFERENCES conversations(conversation_id),
    sender_id       INT NOT NULL REFERENCES users(user_id),
    content         NVARCHAR(MAX),
    message_type    NVARCHAR(20) DEFAULT 'TEXT',  -- TEXT | FILE | SYSTEM
    is_read         BIT DEFAULT 0,
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
CREATE INDEX idx_messages_conv ON messages(conversation_id, created_at);
```

### `message_attachments`

```sql
CREATE TABLE message_attachments (
    attachment_id   INT PRIMARY KEY IDENTITY(1,1),
    message_id      INT NOT NULL REFERENCES messages(message_id),
    file_url        NVARCHAR(500) NOT NULL,
    file_name       NVARCHAR(255),
    file_size       BIGINT,
    file_type       NVARCHAR(50),
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
```

---

## 11. SUPPORT TICKETS

### `support_tickets`

```sql
CREATE TABLE support_tickets (
    ticket_id       INT PRIMARY KEY IDENTITY(1,1),
    user_id         INT NOT NULL REFERENCES users(user_id),
    subject         NVARCHAR(300) NOT NULL,
    description     NVARCHAR(MAX) NOT NULL,
    category        NVARCHAR(50) NOT NULL,  -- BUG | SUGGESTION | CONTACT | ACCOUNT
    priority        NVARCHAR(20) DEFAULT 'MEDIUM',  -- LOW | MEDIUM | HIGH | CRITICAL
    status          NVARCHAR(20) NOT NULL DEFAULT 'OPEN',
        -- OPEN | IN_PROGRESS | RESOLVED | CLOSED
    assigned_to     INT REFERENCES users(user_id),  -- Admin/Staff
    resolved_at     DATETIME2,
    closed_at       DATETIME2,
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
CREATE INDEX idx_tickets_status ON support_tickets(status);
```

### `ticket_messages`

```sql
CREATE TABLE ticket_messages (
    message_id      INT PRIMARY KEY IDENTITY(1,1),
    ticket_id       INT NOT NULL REFERENCES support_tickets(ticket_id),
    sender_id       INT NOT NULL REFERENCES users(user_id),
    content         NVARCHAR(MAX) NOT NULL,
    is_staff_reply  BIT DEFAULT 0,
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
```

### `ticket_attachments`

```sql
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
```

---

## 12. CMS & CONTENT

### `articles`

```sql
CREATE TABLE articles (
    article_id      INT PRIMARY KEY IDENTITY(1,1),
    category_id     INT REFERENCES article_categories(article_category_id),
    title           NVARCHAR(300) NOT NULL,
    slug            NVARCHAR(300) NOT NULL UNIQUE,  -- URL-friendly
    content         NVARCHAR(MAX) NOT NULL,
    cover_image_url NVARCHAR(500),
    author_id       INT NOT NULL REFERENCES users(user_id),
    status          NVARCHAR(20) DEFAULT 'DRAFT',  -- DRAFT | PUBLISHED
    meta_title      NVARCHAR(200),
    meta_description NVARCHAR(500),
    published_at    DATETIME2,
    display_order   INT DEFAULT 0,
    view_count      INT DEFAULT 0,
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
```

### `article_categories`

```sql
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
```

### `article_tags`

```sql
CREATE TABLE article_tags (
    article_id  INT NOT NULL REFERENCES articles(article_id),
    tag_name    NVARCHAR(50) NOT NULL,
    PRIMARY KEY (article_id, tag_name)
);
```

### `faqs`

```sql
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
```

### `faq_categories`

```sql
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
```

### `policy_pages`

```sql
CREATE TABLE policy_pages (
    page_id         INT PRIMARY KEY IDENTITY(1,1),
    page_type       NVARCHAR(30) NOT NULL UNIQUE,  -- TERMS_OF_SERVICE | PRIVACY_POLICY
    title           NVARCHAR(200) NOT NULL,
    content         NVARCHAR(MAX) NOT NULL,
    version         INT NOT NULL DEFAULT 1,
    published_at    DATETIME2,
    updated_by      INT REFERENCES users(user_id),
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
```

### `policy_versions`

```sql
CREATE TABLE policy_versions (
    version_id      INT PRIMARY KEY IDENTITY(1,1),
    page_id         INT NOT NULL REFERENCES policy_pages(page_id),
    version_number  INT NOT NULL,
    content         NVARCHAR(MAX) NOT NULL,
    created_by      INT NOT NULL REFERENCES users(user_id),
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
```

### `footer_sections`

```sql
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
```

### `footer_links`

```sql
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
```

### `site_settings`
> Thay thế bảng `company_info` cũ. Dùng dạng key-value để lưu tất cả cấu hình site-wide (thông tin công ty, social links, v.v.), có FK `updated_by` → `users` để không còn bị cô lập trên ERD.

```sql
CREATE TABLE site_settings (
    setting_id      INT PRIMARY KEY IDENTITY(1,1),
    setting_group   NVARCHAR(50) NOT NULL,
        -- COMPANY_INFO | SOCIAL_LINKS | GENERAL
    setting_key     NVARCHAR(100) NOT NULL UNIQUE,
        -- VD: 'company_name', 'company_address', 'company_email',
        --     'company_phone', 'company_hotline',
        --     'facebook_url', 'linkedin_url', 'youtube_url'
    setting_value   NVARCHAR(MAX),
    updated_by      INT REFERENCES users(user_id),  -- Admin đã cập nhật
    updated_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
CREATE INDEX idx_site_settings_group ON site_settings(setting_group);
```

### `seo_configs`

```sql
CREATE TABLE seo_configs (
    seo_id          INT PRIMARY KEY IDENTITY(1,1),
    page_identifier NVARCHAR(100) NOT NULL UNIQUE,
        -- VD: 'home', 'category_web', 'category_mobile', 'search'
    meta_title      NVARCHAR(200),
    meta_description NVARCHAR(500),
    og_image_url    NVARCHAR(500),
    canonical_url   NVARCHAR(500),
    updated_by      INT REFERENCES users(user_id),
    updated_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
```

---

## 13. NOTIFICATIONS & SETTINGS

### `notifications`

```sql
CREATE TABLE notifications (
    notification_id INT PRIMARY KEY IDENTITY(1,1),
    user_id         INT NOT NULL REFERENCES users(user_id),
    type            NVARCHAR(50) NOT NULL,
        -- NEW_PROPOSAL | PROPOSAL_ACCEPTED | MILESTONE_CREATED | PAYMENT_RECEIVED
        -- | DISPUTE_OPENED | KYC_APPROVED | NEW_MESSAGE | REPORT_RESULT | SYSTEM
    title           NVARCHAR(200) NOT NULL,
    message         NVARCHAR(500),
    link            NVARCHAR(500),  -- redirect URL khi click
    is_read         BIT DEFAULT 0,
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
CREATE INDEX idx_notif_user ON notifications(user_id, is_read, created_at DESC);
```

### `notification_settings`

```sql
CREATE TABLE notification_settings (
    id              INT PRIMARY KEY IDENTITY(1,1),
    user_id         INT NOT NULL UNIQUE REFERENCES users(user_id),
    email_new_project BIT DEFAULT 1,
    email_proposal_accepted BIT DEFAULT 1,
    email_payment   BIT DEFAULT 1,
    email_messages  BIT DEFAULT 1,
    email_frequency NVARCHAR(20) DEFAULT 'INSTANT',  -- INSTANT | DAILY | OFF
    inapp_enabled   BIT DEFAULT 1,
    updated_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
```

### `user_settings`

```sql
CREATE TABLE user_settings (
    id              INT PRIMARY KEY IDENTITY(1,1),
    user_id         INT NOT NULL UNIQUE REFERENCES users(user_id),
    theme           NVARCHAR(10) DEFAULT 'light',
    tos_accepted_version INT,
    tos_accepted_at DATETIME2,
    updated_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
```

### `newsletter_subscribers`

```sql
CREATE TABLE newsletter_subscribers (
    id              INT PRIMARY KEY IDENTITY(1,1),
    email           NVARCHAR(255) NOT NULL UNIQUE,
    user_id         INT REFERENCES users(user_id),  -- NULL nếu guest
    status          NVARCHAR(20) DEFAULT 'PENDING',  -- PENDING | ACTIVE | UNSUBSCRIBED
    token           NVARCHAR(255),  -- confirm token
    subscribed_at   DATETIME2,
    unsubscribed_at DATETIME2,
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
```

---

## 14. AUDIT & SYSTEM LOGS

### `admin_audit_logs`

```sql
CREATE TABLE admin_audit_logs (
    log_id          INT PRIMARY KEY IDENTITY(1,1),
    admin_id        INT NOT NULL REFERENCES users(user_id),
    action          NVARCHAR(100) NOT NULL,
        -- VD: 'USER_LOCKED', 'PROJECT_APPROVED', 'WITHDRAWAL_APPROVED', 'KYC_REJECTED'
    module          NVARCHAR(50) NOT NULL,
        -- USER | PROJECT | FINANCE | DISPUTE | KYC | CMS | REVIEW | REPORT | SYSTEM
    target_type     NVARCHAR(50),   -- USER | PROJECT | WITHDRAWAL | DISPUTE | ...
    target_id       INT,
    old_value       NVARCHAR(MAX),
    new_value       NVARCHAR(MAX),
    description     NVARCHAR(1000),
    ip_address      NVARCHAR(45),
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE()
);
CREATE INDEX idx_audit_admin ON admin_audit_logs(admin_id, created_at);
CREATE INDEX idx_audit_module ON admin_audit_logs(module, created_at);
```

---

## TỔNG HỢP: DANH SÁCH TOÀN BỘ BẢNG (48 bảng)

| # | Bảng | Module | Use Cases liên quan |
|---|---|---|---|
| 1 | `users` | Core | UC-01,09,22,23,43 |
| 2 | `roles` | Auth | UC-24 |
| 3 | `permissions` | Auth | UC-24 |
| 4 | `role_permissions` | Auth | UC-24 |
| 5 | `user_roles` | Auth | UC-01,09,24 |
| 6 | `email_verifications` | Auth | UC-01,09 |
| 7 | `password_reset_tokens` | Auth | UC-44 |
| 8 | `login_history` | Auth | UC-43 |
| 9 | `user_status_history` | User | UC-22,34 |
| 10 | `freelancer_profiles` | Profile | UC-02,19,20 |
| 11 | `client_profiles` | Profile | UC-10 |
| 12 | `skills` | Profile | UC-02,26 |
| 13 | `user_skills` | Profile | UC-02 |
| 14 | `educations` | Profile | UC-02 |
| 15 | `experiences` | Profile | UC-02 |
| 16 | `portfolios` | Profile | UC-02 |
| 17 | `portfolio_files` | Profile | UC-02 |
| 18 | `job_categories` | Project | UC-26,56 |
| 19 | `projects` | Project | UC-11,12,25,47 |
| 20 | `project_skills` | Project | UC-11 |
| 21 | `project_attachments` | Project | UC-11,47 |
| 22 | `saved_jobs` | Project | UC-04 |
| 23 | `proposals` | Project | UC-03,13 |
| 24 | `contracts` | Contract | UC-13,14 |
| 25 | `milestones` | Contract | UC-06,15,17 |
| 26 | `deliverables` | Contract | UC-05 |
| 27 | `deliverable_files` | Contract | UC-05 |
| 28 | `wallets` | Finance | UC-07,16,53 |
| 29 | `transactions` | Finance | UC-16,17,27,53 |
| 30 | `escrow_transactions` | Finance | UC-15,17,32 |
| 31 | `withdrawal_requests` | Finance | UC-07,28 |
| 32 | `bank_accounts` | Finance | UC-07 |
| 33 | `payment_gateway_logs` | Finance | UC-16,27 |
| 34 | `platform_fee_configs` | Finance | UC-30 |
| 35 | `reviews` | Review | UC-18,33 |
| 36 | `review_criteria_scores` | Review | UC-18 |
| 37 | `user_rankings` | Review | UC-55 |
| 38 | `reports` | Report | UC-34,51 |
| 39 | `report_evidences` | Report | UC-51 |
| 40 | `user_warnings` | Report | UC-34 |
| 41 | `disputes` | Dispute | UC-32,50 |
| 42 | `dispute_evidences` | Dispute | UC-50 |
| 43 | `dispute_decisions` | Dispute | UC-32 |
| 44 | `kyc_requests` | KYC | UC-31,52 |
| 45 | `kyc_documents` | KYC | UC-52 |
| 46 | `conversations` | Chat | UC-48 |
| 47 | `conversation_participants` | Chat | UC-48 |
| 48 | `messages` | Chat | UC-48 |
| 49 | `message_attachments` | Chat | UC-49 |
| 50 | `support_tickets` | Support | UC-41,59 |
| 51 | `ticket_messages` | Support | UC-41 |
| 52 | `ticket_attachments` | Support | UC-59 |
| 53 | `articles` | CMS | UC-40,57 |
| 54 | `article_categories` | CMS | UC-40 |
| 55 | `article_tags` | CMS | UC-40 |
| 56 | `faqs` | CMS | UC-58 |
| 57 | `faq_categories` | CMS | UC-58 |
| 58 | `policy_pages` | CMS | UC-36,62 |
| 59 | `policy_versions` | CMS | UC-36 |
| 60 | `footer_sections` | CMS | UC-39 |
| 61 | `footer_links` | CMS | UC-39 |
| 62 | `site_settings` | CMS | UC-39 |
| 63 | `seo_configs` | CMS | UC-42 |
| 64 | `notifications` | System | UC-54 |
| 65 | `notification_settings` | System | UC-54 |
| 66 | `user_settings` | System | UC-46 |
| 67 | `newsletter_subscribers` | System | UC-61 |
| 68 | `admin_audit_logs` | System | UC-37 |

> **Tổng: 68 bảng** phủ toàn bộ 62 Use Cases trên 4 roles (Freelancer, Client, Admin/Super Admin, Common User)

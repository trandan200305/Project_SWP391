// ==========================================
// CODE MỞ RỘNG CHO BẢNG FREELANCER VÀ EMPLOYER
// (Dành riêng cho tính năng KYC - Xác minh danh tính)
// ==========================================

// 1. Thêm các thuộc tính sau vào các file Entity: Freelancer.java và Employer.java

    // --- BẮT ĐẦU PHẦN KYC ---
    
    @Column(name = "kyc_status", length = 20)
    private String kycStatus = "UNVERIFIED"; // Các trạng thái: UNVERIFIED, PENDING, APPROVED, REJECTED

    @Column(name = "id_card_front_url", length = 500)
    private String idCardFrontUrl; // Ảnh mặt trước CCCD

    @Column(name = "id_card_back_url", length = 500)
    private String idCardBackUrl; // Ảnh mặt sau CCCD

    @Column(name = "portrait_url", length = 500)
    private String portraitUrl; // Ảnh chụp khuôn mặt (selfie)

    @Column(name = "kyc_submitted_at")
    private LocalDateTime kycSubmittedAt; // Thời gian nộp yêu cầu KYC

    @Column(name = "kyc_reviewed_at")
    private LocalDateTime kycReviewedAt; // Thời gian Staff duyệt/từ chối

    @Column(name = "kyc_reviewed_by_staff_id")
    private Integer kycReviewedByStaffId; // ID của Staff thực hiện duyệt (để truy vết)

    @Column(name = "kyc_rejected_reason", length = 500)
    private String kycRejectedReason; // Lý do từ chối KYC

    @Column(name = "is_verified", nullable = false)
    private Boolean isVerified = false; // Trạng thái Huy hiệu xác thực (Tích xanh)

    // --- KẾT THÚC PHẦN KYC ---


// 2. Lệnh SQL tương ứng để cập nhật Database (Dành cho SQL Server):
/*
ALTER TABLE freelancers 
ADD 
    kyc_status VARCHAR(20) DEFAULT 'UNVERIFIED',
    id_card_front_url VARCHAR(500),
    id_card_back_url VARCHAR(500),
    portrait_url VARCHAR(500),
    kyc_submitted_at DATETIME,
    kyc_reviewed_at DATETIME,
    kyc_reviewed_by_staff_id INT,
    kyc_rejected_reason VARCHAR(500),
    is_verified BIT DEFAULT 0;

ALTER TABLE employers 
ADD 
    kyc_status VARCHAR(20) DEFAULT 'UNVERIFIED',
    id_card_front_url VARCHAR(500),
    id_card_back_url VARCHAR(500),
    portrait_url VARCHAR(500),
    kyc_submitted_at DATETIME,
    kyc_reviewed_at DATETIME,
    kyc_reviewed_by_staff_id INT,
    kyc_rejected_reason VARCHAR(500),
    is_verified BIT DEFAULT 0;
*/

package com.mycompany.cny.model.kyc;

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "kyc_requests")
public class KycRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "kyc_id")
    private Integer kycId;

    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "full_name")
    private String fullName;

    @Column(name = "date_of_birth")
    private java.time.LocalDateTime dateOfBirth;

    @Column(name = "id_number")
    private String idNumber;

    @Column(name = "status")
    private String status;

    @Column(name = "reject_reason")
    private String rejectReason;

    @Column(name = "reviewed_by")
    private Integer reviewedBy;

    @Column(name = "reviewed_at")
    private java.time.LocalDateTime reviewedAt;

    @Column(name = "created_at")
    private java.time.LocalDateTime createdAt;

}

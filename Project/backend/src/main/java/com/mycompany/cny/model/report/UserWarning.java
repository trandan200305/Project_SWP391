package com.mycompany.cny.model.report;

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "user_warnings")
public class UserWarning {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "warning_id")
    private Integer warningId;

    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "report_id")
    private Integer reportId;

    @Column(name = "warning_type")
    private String warningType;

    @Column(name = "message")
    private String message;

    @Column(name = "issued_by")
    private Integer issuedBy;

    @Column(name = "acknowledged")
    private Boolean acknowledged;

    @Column(name = "created_at")
    private java.time.LocalDateTime createdAt;

}

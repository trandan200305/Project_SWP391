package com.mycompany.cny.model.cms;

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "policy_versions")
public class PolicyVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "version_id")
    private Integer versionId;

    @Column(name = "page_id")
    private Integer pageId;

    @Column(name = "version_number")
    private Integer versionNumber;

    @Column(name = "content")
    private String content;

    @Column(name = "created_by")
    private Integer createdBy;

    @Column(name = "created_at")
    private java.time.LocalDateTime createdAt;

}

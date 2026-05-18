package com.mycompany.cny.model.cms;

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "policy_pages")
public class PolicyPage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "page_id")
    private Integer pageId;

    @Column(name = "page_type")
    private String pageType;

    @Column(name = "title")
    private String title;

    @Column(name = "content")
    private String content;

    @Column(name = "version")
    private Integer version;

    @Column(name = "published_at")
    private java.time.LocalDateTime publishedAt;

    @Column(name = "updated_by")
    private Integer updatedBy;

    @Column(name = "created_at")
    private java.time.LocalDateTime createdAt;

    @Column(name = "updated_at")
    private java.time.LocalDateTime updatedAt;

}

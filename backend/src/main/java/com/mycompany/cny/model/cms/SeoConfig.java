package com.mycompany.cny.model.cms;

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "seo_configs")
public class SeoConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seo_id")
    private Integer seoId;

    @Column(name = "page_identifier")
    private String pageIdentifier;

    @Column(name = "meta_title")
    private String metaTitle;

    @Column(name = "meta_description")
    private String metaDescription;

    @Column(name = "og_image_url")
    private String ogImageUrl;

    @Column(name = "canonical_url")
    private String canonicalUrl;

    @Column(name = "updated_by")
    private Integer updatedBy;

    @Column(name = "updated_at")
    private java.time.LocalDateTime updatedAt;

}

package com.mycompany.cny.model.user;

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "portfolio_files")
public class PortfolioFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "file_id")
    private Integer fileId;

    @Column(name = "portfolio_id")
    private Integer portfolioId;

    @Column(name = "file_url")
    private String fileUrl;

    @Column(name = "file_name")
    private String fileName;

    @Column(name = "file_size")
    private Integer fileSize;

    @Column(name = "file_type")
    private String fileType;

    @Column(name = "created_at")
    private java.time.LocalDateTime createdAt;

}

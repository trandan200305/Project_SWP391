package com.cny.backend.chat.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Entity representing an attachment (image or file) associated with a direct 1-1 message.
 */
@Entity
@Table(name = "direct_message_attachments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DirectMessageAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "attachment_id")
    private Integer attachmentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_id", nullable = false)
    private DirectMessage message;

    @Column(name = "file_url", nullable = false, columnDefinition = "NVARCHAR(500)")
    private String fileUrl;

    @Column(name = "file_name", nullable = false, columnDefinition = "NVARCHAR(255)")
    private String fileName;

    @Column(name = "file_size")
    private Long fileSize;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}

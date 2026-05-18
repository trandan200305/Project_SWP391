package com.mycompany.cny.model.support;

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "ticket_attachments")
public class TicketAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "attachment_id")
    private Integer attachmentId;

    @Column(name = "ticket_id")
    private Integer ticketId;

    @Column(name = "message_id")
    private Integer messageId;

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

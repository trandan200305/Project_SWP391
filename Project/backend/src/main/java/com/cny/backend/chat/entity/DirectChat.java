package com.cny.backend.chat.entity;

import com.cny.backend.user.entity.Employer;
import com.cny.backend.user.entity.Freelancer;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "direct_chats")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DirectChat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "chat_id")
    private Integer chatId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "freelancer_id", nullable = false)
    private Freelancer freelancer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employer_id", nullable = false)
    private Employer employer;

    @Column(name = "is_deleted_by_freelancer")
    @Builder.Default
    private Boolean isDeletedByFreelancer = false;

    @Column(name = "is_deleted_by_employer")
    @Builder.Default
    private Boolean isDeletedByEmployer = false;

    @Column(name = "is_blocked_by_freelancer")
    @Builder.Default
    private Boolean isBlockedByFreelancer = false;

    @Column(name = "is_blocked_by_employer")
    @Builder.Default
    private Boolean isBlockedByEmployer = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

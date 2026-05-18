package com.mycompany.cny.model.system;

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "notification_settings")
public class NotificationSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "email_new_project")
    private Boolean emailNewProject;

    @Column(name = "email_proposal_accepted")
    private Boolean emailProposalAccepted;

    @Column(name = "email_payment")
    private Boolean emailPayment;

    @Column(name = "email_messages")
    private Boolean emailMessages;

    @Column(name = "email_frequency")
    private String emailFrequency;

    @Column(name = "inapp_enabled")
    private Boolean inappEnabled;

    @Column(name = "updated_at")
    private java.time.LocalDateTime updatedAt;

}

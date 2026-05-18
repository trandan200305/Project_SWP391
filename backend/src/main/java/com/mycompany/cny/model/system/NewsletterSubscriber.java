package com.mycompany.cny.model.system;

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "newsletter_subscribers")
public class NewsletterSubscriber {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "email")
    private String email;

    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "status")
    private String status;

    @Column(name = "token")
    private String token;

    @Column(name = "subscribed_at")
    private java.time.LocalDateTime subscribedAt;

    @Column(name = "unsubscribed_at")
    private java.time.LocalDateTime unsubscribedAt;

    @Column(name = "created_at")
    private java.time.LocalDateTime createdAt;

}

package com.mycompany.cny.model.chat;

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "conversation_participants")
public class ConversationParticipant {

    @Column(name = "conversation_id")
    private Integer conversationId;

    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "last_read_at")
    private java.time.LocalDateTime lastReadAt;

    @Column(name = "is_muted")
    private Boolean isMuted;

}

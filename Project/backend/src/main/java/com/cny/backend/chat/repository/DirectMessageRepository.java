package com.cny.backend.chat.repository;

import com.cny.backend.chat.entity.DirectMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DirectMessageRepository extends JpaRepository<DirectMessage, Integer> {

    List<DirectMessage> findByChat_ChatIdOrderBySentAtAsc(Integer chatId);

    Optional<DirectMessage> findTopByChat_ChatIdOrderBySentAtDesc(Integer chatId);

    @Query("SELECT COUNT(m) FROM DirectMessage m WHERE m.chat.chatId = :chatId AND m.isRead = false AND m.senderRole != :receiverRole")
    long countUnreadMessagesByChatAndReceiverRole(Integer chatId, String receiverRole);

    @Modifying
    @Query("UPDATE DirectMessage m SET m.isRead = true WHERE m.chat.chatId = :chatId AND m.isRead = false AND m.senderRole != :readerRole")
    void markMessagesAsRead(Integer chatId, String readerRole);
}

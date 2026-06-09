package com.cny.backend.chat.service;

import com.cny.backend.chat.dto.DirectChatDto;
import com.cny.backend.chat.dto.DirectMessageDto;
import com.cny.backend.chat.entity.DirectChat;
import com.cny.backend.chat.entity.DirectMessage;
import com.cny.backend.chat.repository.DirectChatRepository;
import com.cny.backend.chat.repository.DirectMessageRepository;
import com.cny.backend.user.entity.Employer;
import com.cny.backend.user.entity.Freelancer;
import com.cny.backend.user.repository.EmployerRepository;
import com.cny.backend.user.repository.FreelancerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class DirectChatService {

    @Autowired
    private DirectChatRepository chatRepository;

    @Autowired
    private DirectMessageRepository messageRepository;

    @Autowired
    private FreelancerRepository freelancerRepository;

    @Autowired
    private EmployerRepository employerRepository;

    @Transactional
    public DirectChatDto getOrCreateChat(Integer freelancerId, Integer employerId) {
        Optional<DirectChat> existingChat = chatRepository.findByFreelancer_ProfileIdAndEmployer_EmployerId(freelancerId, employerId);
        
        DirectChat chat;
        if (existingChat.isPresent()) {
            chat = existingChat.get();
        } else {
            Freelancer freelancer = freelancerRepository.findById(freelancerId)
                    .orElseThrow(() -> new IllegalArgumentException("Freelancer not found"));
            Employer employer = employerRepository.findById(employerId)
                    .orElseThrow(() -> new IllegalArgumentException("Employer not found"));

            chat = DirectChat.builder()
                    .freelancer(freelancer)
                    .employer(employer)
                    .build();
            chat = chatRepository.save(chat);
        }

        return DirectChatDto.builder()
                .chatId(chat.getChatId())
                .updatedAt(chat.getUpdatedAt() != null ? chat.getUpdatedAt() : chat.getCreatedAt())
                .build();
    }

    public List<DirectChatDto> getUserChats(Integer userId, String role) {
        List<DirectChat> chats;
        List<DirectChatDto> chatDtos = new ArrayList<>();

        if ("FREELANCER".equalsIgnoreCase(role)) {
            chats = chatRepository.findByFreelancerIdOrderByUpdatedAtDesc(userId);
            for (DirectChat chat : chats) {
                chatDtos.add(mapToDtoForFreelancer(chat));
            }
        } else if ("EMPLOYER".equalsIgnoreCase(role)) {
            chats = chatRepository.findByEmployerIdOrderByUpdatedAtDesc(userId);
            for (DirectChat chat : chats) {
                chatDtos.add(mapToDtoForEmployer(chat));
            }
        }
        return chatDtos;
    }

    private DirectChatDto mapToDtoForFreelancer(DirectChat chat) {
        Optional<DirectMessage> lastMsgOpt = messageRepository.findTopByChat_ChatIdOrderBySentAtDesc(chat.getChatId());
        long unreadCount = messageRepository.countUnreadMessagesByChatAndReceiverRole(chat.getChatId(), "FREELANCER");

        DirectChatDto dto = DirectChatDto.builder()
                .chatId(chat.getChatId())
                .partnerId(chat.getEmployer().getEmployerId())
                .partnerRole("EMPLOYER")
                .partnerName(chat.getEmployer().getDisplayName() != null ? chat.getEmployer().getDisplayName() : chat.getEmployer().getUser().getFullName())
                .partnerAvatar(chat.getEmployer().getAvatarUrl())
                .unreadCount(unreadCount)
                .updatedAt(chat.getUpdatedAt() != null ? chat.getUpdatedAt() : chat.getCreatedAt())
                .build();

        if (lastMsgOpt.isPresent()) {
            dto.setLastMessage(lastMsgOpt.get().getMessageText());
            dto.setLastMessageAt(lastMsgOpt.get().getSentAt());
        }

        return dto;
    }

    private DirectChatDto mapToDtoForEmployer(DirectChat chat) {
        Optional<DirectMessage> lastMsgOpt = messageRepository.findTopByChat_ChatIdOrderBySentAtDesc(chat.getChatId());
        long unreadCount = messageRepository.countUnreadMessagesByChatAndReceiverRole(chat.getChatId(), "EMPLOYER");

        DirectChatDto dto = DirectChatDto.builder()
                .chatId(chat.getChatId())
                .partnerId(chat.getFreelancer().getProfileId())
                .partnerRole("FREELANCER")
                .partnerName(chat.getFreelancer().getDisplayName() != null ? chat.getFreelancer().getDisplayName() : chat.getFreelancer().getUser().getFullName())
                .partnerAvatar(chat.getFreelancer().getAvatarUrl())
                .unreadCount(unreadCount)
                .updatedAt(chat.getUpdatedAt() != null ? chat.getUpdatedAt() : chat.getCreatedAt())
                .build();

        if (lastMsgOpt.isPresent()) {
            dto.setLastMessage(lastMsgOpt.get().getMessageText());
            dto.setLastMessageAt(lastMsgOpt.get().getSentAt());
        }

        return dto;
    }

    public List<DirectMessageDto> getChatMessages(Integer chatId) {
        return messageRepository.findByChat_ChatIdOrderBySentAtAsc(chatId).stream()
                .map(this::mapMessageToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public DirectMessageDto saveMessage(DirectMessageDto msgDto) {
        DirectChat chat = chatRepository.findById(msgDto.getChatId())
                .orElseThrow(() -> new IllegalArgumentException("Chat not found"));

        DirectMessage msg = DirectMessage.builder()
                .chat(chat)
                .senderId(msgDto.getSenderId())
                .senderRole(msgDto.getSenderRole().toUpperCase())
                .messageText(msgDto.getMessageText())
                .isRead(false)
                .build();

        msg = messageRepository.save(msg);
        
        chat.setUpdatedAt(LocalDateTime.now());
        chatRepository.save(chat);

        return mapMessageToDto(msg);
    }

    @Transactional
    public void markMessagesAsRead(Integer chatId, String readerRole) {
        messageRepository.markMessagesAsRead(chatId, readerRole.toUpperCase());
    }

    private DirectMessageDto mapMessageToDto(DirectMessage msg) {
        DirectMessageDto dto = DirectMessageDto.builder()
                .messageId(msg.getMessageId())
                .chatId(msg.getChat().getChatId())
                .senderId(msg.getSenderId())
                .senderRole(msg.getSenderRole())
                .messageText(msg.getMessageText())
                .isRead(msg.getIsRead())
                .sentAt(msg.getSentAt())
                .build();

        if ("FREELANCER".equals(msg.getSenderRole())) {
            dto.setSenderName(msg.getChat().getFreelancer().getDisplayName() != null ? msg.getChat().getFreelancer().getDisplayName() : msg.getChat().getFreelancer().getUser().getFullName());
            dto.setSenderAvatar(msg.getChat().getFreelancer().getAvatarUrl());
        } else {
            dto.setSenderName(msg.getChat().getEmployer().getDisplayName() != null ? msg.getChat().getEmployer().getDisplayName() : msg.getChat().getEmployer().getUser().getFullName());
            dto.setSenderAvatar(msg.getChat().getEmployer().getAvatarUrl());
        }

        return dto;
    }
    
    public Integer getPartnerUserId(Integer chatId, String senderRole) {
        DirectChat chat = chatRepository.findById(chatId).orElse(null);
        if (chat == null) return null;
        if ("FREELANCER".equalsIgnoreCase(senderRole)) {
            return chat.getEmployer().getUser().getUserId();
        } else {
            return chat.getFreelancer().getUser().getUserId();
        }
    }
}

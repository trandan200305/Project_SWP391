package com.cny.backend.chat.service;

import com.cny.backend.auth.entity.*;
import com.cny.backend.admin.entity.*;
import com.cny.backend.project.entity.*;
import com.cny.backend.user.entity.*;
import com.cny.backend.auth.repository.*;
import com.cny.backend.admin.repository.*;
import com.cny.backend.project.repository.*;
import com.cny.backend.user.repository.*;
import com.cny.backend.admin.dto.*;
import com.cny.backend.chat.dto.*;
import com.cny.backend.project.dto.*;
import com.cny.backend.user.dto.*;
import com.cny.backend.auth.service.*;
import com.cny.backend.admin.service.*;
import com.cny.backend.chat.service.*;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class SupportChatService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Transactional
    public Integer getOrCreateTicket(Integer userId, String role) {
        String roleUpper = role.toUpperCase();
        List<Integer> ticketIds;

        if ("FREELANCER".equals(roleUpper)) {
            ticketIds = jdbcTemplate.queryForList(
                "SELECT ticket_id FROM support_tickets WHERE freelancer_id = ? AND status = 'OPEN'",
                Integer.class, userId
            );
        } else if ("EMPLOYER".equals(roleUpper) || "CLIENT".equals(roleUpper)) {
            ticketIds = jdbcTemplate.queryForList(
                "SELECT ticket_id FROM support_tickets WHERE employer_id = ? AND status = 'OPEN'",
                Integer.class, userId
            );
        } else {
            throw new IllegalArgumentException("Invalid user role for ticket creation: " + role);
        }

        if (!ticketIds.isEmpty()) {
            return ticketIds.get(0);
        }

        
        String sql = "INSERT INTO support_tickets (freelancer_id, employer_id, subject, description, status, priority, created_at, updated_at) " +
                     "VALUES (?, ?, ?, ?, 'OPEN', 'MEDIUM', GETDATE(), GETDATE())";

        if ("FREELANCER".equals(roleUpper)) {
            jdbcTemplate.update(sql, userId, null, "Hỗ trợ trực tuyến", "Hộp thoại chat hỗ trợ trực tiếp");
        } else {
            jdbcTemplate.update(sql, null, userId, "Hỗ trợ trực tuyến", "Hộp thoại chat hỗ trợ trực tiếp");
        }

        return jdbcTemplate.queryForObject("SELECT IDENT_CURRENT('support_tickets')", Integer.class);
    }

    public List<ChatMessageDto> getChatHistory(Integer ticketId) {
        
        jdbcTemplate.update("UPDATE ticket_messages SET is_read = 1 WHERE ticket_id = ? AND sender_admin_id IS NULL", ticketId);

        String sql = "SELECT tm.message_id, tm.ticket_id, tm.sender_freelancer_id, tm.sender_employer_id, tm.sender_admin_id, tm.message_text, tm.is_read, tm.sent_at, " +
                     "f.display_name as freelancer_name, f.avatar_url as freelancer_avatar, " +
                     "e.display_name as employer_name, e.avatar_url as employer_avatar, " +
                     "a.display_name as admin_name, a.avatar_url as admin_avatar " +
                     "FROM ticket_messages tm " +
                     "LEFT JOIN freelancers f ON tm.sender_freelancer_id = f.freelancer_id " +
                     "LEFT JOIN employers e ON tm.sender_employer_id = e.employer_id " +
                     "LEFT JOIN admins a ON tm.sender_admin_id = a.admin_id " +
                     "WHERE tm.ticket_id = ? " +
                     "ORDER BY tm.sent_at ASC";

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, ticketId);
        List<ChatMessageDto> messages = new ArrayList<>();

        for (Map<String, Object> row : rows) {
            ChatMessageDto msg = new ChatMessageDto();
            msg.setMessageId((Integer) row.get("message_id"));
            msg.setTicketId((Integer) row.get("ticket_id"));
            msg.setMessageText((String) row.get("message_text"));
            
            Timestamp sentAt = (Timestamp) row.get("sent_at");
            if (sentAt != null) {
                msg.setSentAt(sentAt.toLocalDateTime());
            }

            Object isReadObj = row.get("is_read");
            if (isReadObj instanceof Boolean) {
                msg.setIsRead((Boolean) isReadObj);
            } else if (isReadObj instanceof Number) {
                msg.setIsRead(((Number) isReadObj).intValue() == 1);
            } else {
                msg.setIsRead(false);
            }

            
            if (row.get("sender_freelancer_id") != null) {
                msg.setSenderId((Integer) row.get("sender_freelancer_id"));
                msg.setSenderRole("FREELANCER");
                msg.setSenderName((String) row.get("freelancer_name"));
                msg.setSenderAvatar((String) row.get("freelancer_avatar"));
            } else if (row.get("sender_employer_id") != null) {
                msg.setSenderId((Integer) row.get("sender_employer_id"));
                msg.setSenderRole("EMPLOYER");
                msg.setSenderName((String) row.get("employer_name"));
                msg.setSenderAvatar((String) row.get("employer_avatar"));
            } else if (row.get("sender_admin_id") != null) {
                msg.setSenderId((Integer) row.get("sender_admin_id"));
                msg.setSenderRole("ADMIN");
                msg.setSenderName((String) row.get("admin_name"));
                msg.setSenderAvatar((String) row.get("admin_avatar"));
            }

            
            List<Map<String, Object>> attachments = jdbcTemplate.queryForList(
                "SELECT file_url AS fileUrl, file_name AS fileName, file_size AS fileSize FROM ticket_attachments WHERE message_id = ?",
                msg.getMessageId()
            );
            msg.setAttachments(attachments);

            messages.add(msg);
        }

        return messages;
    }

    public List<Map<String, Object>> getAllOpenTickets() {
        String sql = "SELECT t.ticket_id, t.freelancer_id, t.employer_id, t.subject, t.status, t.priority, t.created_at, t.updated_at, " +
                     "f.display_name as freelancer_name, f.avatar_url as freelancer_avatar, f.email as freelancer_email, f.status as freelancer_user_status, f.last_login_at as freelancer_last_login, " +
                     "e.display_name as employer_name, e.avatar_url as employer_avatar, e.email as employer_email, e.status as employer_user_status, e.last_login_at as employer_last_login, " +
                     "(SELECT TOP 1 message_text FROM ticket_messages WHERE ticket_id = t.ticket_id ORDER BY sent_at DESC) as last_message, " +
                     "(SELECT TOP 1 sent_at FROM ticket_messages WHERE ticket_id = t.ticket_id ORDER BY sent_at DESC) as last_message_at, " +
                     "(SELECT COUNT(*) FROM ticket_messages WHERE ticket_id = t.ticket_id AND sender_admin_id IS NULL AND is_read = 0) as unread_count, " +
                     "(SELECT COUNT(*) FROM ticket_messages WHERE ticket_id = t.ticket_id) as total_messages, " +
                     "(SELECT COUNT(*) FROM ticket_messages WHERE ticket_id = t.ticket_id AND sender_admin_id IS NULL) as user_message_count, " +
                     "(CASE WHEN EXISTS (SELECT 1 FROM ticket_messages WHERE ticket_id = t.ticket_id AND sender_admin_id IS NOT NULL AND message_text NOT LIKE N'👋 Xin chào! Cảm ơn bạn%') THEN 1 ELSE 0 END) as has_admin_replied " +
                     "FROM support_tickets t " +
                     "LEFT JOIN freelancers f ON t.freelancer_id = f.freelancer_id " +
                     "LEFT JOIN employers e ON t.employer_id = e.employer_id " +
                     "WHERE t.status = 'OPEN' " +
                     "ORDER BY t.updated_at DESC";

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);
        List<Map<String, Object>> tickets = new ArrayList<>();

        for (Map<String, Object> row : rows) {
            Map<String, Object> ticket = new HashMap<>(row);
            
            
            if (row.get("created_at") != null) {
                ticket.put("created_at", row.get("created_at").toString());
            }
            if (row.get("updated_at") != null) {
                ticket.put("updated_at", row.get("updated_at").toString());
            }
            if (row.get("last_message_at") != null) {
                ticket.put("last_message_at", row.get("last_message_at").toString());
            }

            
            if (row.get("freelancer_id") != null) {
                ticket.put("sender_name", row.get("freelancer_name"));
                ticket.put("sender_avatar", row.get("freelancer_avatar"));
                ticket.put("sender_email", row.get("freelancer_email"));
                ticket.put("sender_role", "FREELANCER");
                ticket.put("sender_id", row.get("freelancer_id"));
                ticket.put("sender_status", row.get("freelancer_user_status"));
                ticket.put("sender_last_login", row.get("freelancer_last_login") != null ? row.get("freelancer_last_login").toString() : null);
            } else if (row.get("employer_id") != null) {
                ticket.put("sender_name", row.get("employer_name"));
                ticket.put("sender_avatar", row.get("employer_avatar"));
                ticket.put("sender_email", row.get("employer_email"));
                ticket.put("sender_role", "EMPLOYER");
                ticket.put("sender_id", row.get("employer_id"));
                ticket.put("sender_status", row.get("employer_user_status"));
                ticket.put("sender_last_login", row.get("employer_last_login") != null ? row.get("employer_last_login").toString() : null);
            }

            Object hasReplied = row.get("has_admin_replied");
            ticket.put("has_admin_replied", hasReplied != null && ((Number) hasReplied).intValue() == 1);
            Object unreadCount = row.get("unread_count");
            ticket.put("unread_count", unreadCount != null ? ((Number) unreadCount).intValue() : 0);

            Object totalMessages = row.get("total_messages");
            ticket.put("total_messages", totalMessages != null ? ((Number) totalMessages).intValue() : 0);

            Object userMsgCount = row.get("user_message_count");
            ticket.put("user_message_count", userMsgCount != null ? ((Number) userMsgCount).intValue() : 0);

            tickets.add(ticket);
        }

        return tickets;
    }

    @Transactional
    public ChatMessageDto saveMessage(ChatMessageDto messageDto) {
        Integer ticketId = messageDto.getTicketId();
        if (ticketId == null || ticketId == 0) {
            
            if ("ADMIN".equals(messageDto.getSenderRole())) {
                throw new IllegalStateException("Admin cannot send messages without a valid ticket ID");
            }
            ticketId = getOrCreateTicket(messageDto.getSenderId(), messageDto.getSenderRole());
            messageDto.setTicketId(ticketId);
        }

        String sql = "INSERT INTO ticket_messages (ticket_id, sender_freelancer_id, sender_employer_id, sender_admin_id, message_text, is_read, sent_at) " +
                     "VALUES (?, ?, ?, ?, ?, ?, GETDATE())";

        Integer freelancerId = null;
        Integer employerId = null;
        Integer adminId = null;

        String role = messageDto.getSenderRole().toUpperCase();
        if ("FREELANCER".equals(role)) {
            freelancerId = messageDto.getSenderId();
        } else if ("EMPLOYER".equals(role) || "CLIENT".equals(role)) {
            employerId = messageDto.getSenderId();
        } else if ("ADMIN".equals(role)) {
            adminId = messageDto.getSenderId();
        }

        int isReadValue = (adminId != null) ? 1 : 0;
        jdbcTemplate.update(sql, ticketId, freelancerId, employerId, adminId, messageDto.getMessageText(), isReadValue);
        Integer messageId = jdbcTemplate.queryForObject("SELECT IDENT_CURRENT('ticket_messages')", Integer.class);
        messageDto.setMessageId(messageId);
        messageDto.setSentAt(LocalDateTime.now());
        messageDto.setIsRead(isReadValue == 1);

        
        if (messageDto.getAttachments() != null) {
            for (Map<String, Object> att : messageDto.getAttachments()) {
                jdbcTemplate.update(
                    "INSERT INTO ticket_attachments (message_id, file_url, file_name, file_size, created_at) VALUES (?, ?, ?, ?, GETDATE())",
                    messageId, att.get("fileUrl"), att.get("fileName"), att.get("fileSize")
                );
            }
        }

        jdbcTemplate.update("UPDATE support_tickets SET updated_at = GETDATE() WHERE ticket_id = ?", ticketId);
        if (messageDto.getSenderName() == null || messageDto.getSenderAvatar() == null) {
            if ("FREELANCER".equals(role)) {
                List<Map<String, Object>> res = jdbcTemplate.queryForList("SELECT display_name, avatar_url FROM freelancers WHERE freelancer_id = ?", freelancerId);
                if (!res.isEmpty()) {
                    messageDto.setSenderName((String) res.get(0).get("display_name"));
                    messageDto.setSenderAvatar((String) res.get(0).get("avatar_url"));
                }
            } else if ("EMPLOYER".equals(role) || "CLIENT".equals(role)) {
                List<Map<String, Object>> res = jdbcTemplate.queryForList("SELECT display_name, avatar_url FROM employers WHERE employer_id = ?", employerId);
                if (!res.isEmpty()) {
                    messageDto.setSenderName((String) res.get(0).get("display_name"));
                    messageDto.setSenderAvatar((String) res.get(0).get("avatar_url"));
                }
            } else if ("ADMIN".equals(role)) {
                List<Map<String, Object>> res = jdbcTemplate.queryForList("SELECT display_name, avatar_url FROM admins WHERE admin_id = ?", adminId);
                if (!res.isEmpty()) {
                    messageDto.setSenderName((String) res.get(0).get("display_name"));
                    messageDto.setSenderAvatar((String) res.get(0).get("avatar_url"));
                }
            }
        }

        return messageDto;
    }
    
    
    public Integer getActiveTicketForUser(Integer userId, String role) {
        String roleUpper = role.toUpperCase();
        String sql = "SELECT ticket_id FROM support_tickets WHERE " + 
                     ("FREELANCER".equals(roleUpper) ? "freelancer_id" : "employer_id") + 
                     " = ? AND status = 'OPEN'";
        List<Integer> ids = jdbcTemplate.queryForList(sql, Integer.class, userId);
        return ids.isEmpty() ? null : ids.get(0);
    }

    public Map<String, Object> getTicketRecipient(Integer ticketId) {
        String sql = "SELECT freelancer_id, employer_id FROM support_tickets WHERE ticket_id = ?";
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, ticketId);
        if (rows.isEmpty()) return null;

        Map<String, Object> row = rows.get(0);
        Map<String, Object> res = new HashMap<>();
        if (row.get("freelancer_id") != null) {
            res.put("userId", row.get("freelancer_id"));
            res.put("role", "FREELANCER");
        } else if (row.get("employer_id") != null) {
            res.put("userId", row.get("employer_id"));
            res.put("role", "EMPLOYER");
        }
        return res;
    }

    public boolean isTicketEmpty(Integer ticketId) {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM ticket_messages WHERE ticket_id = ?", Integer.class, ticketId);
        return count == null || count == 0;
    }

    public boolean hasAdminReplied(Integer ticketId) {
        String sql = "SELECT COUNT(*) FROM ticket_messages WHERE ticket_id = ? AND sender_admin_id IS NOT NULL AND message_text NOT LIKE N'👋 Xin chào! Cảm ơn bạn%'";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, ticketId);
        return count != null && count > 0;
    }

    @Transactional
    public ChatMessageDto saveAutoReply(ChatMessageDto autoReply) {
        Integer adminId = null;
        List<Integer> adminIds = jdbcTemplate.queryForList("SELECT TOP 1 admin_id FROM admins ORDER BY admin_id ASC", Integer.class);
        if (!adminIds.isEmpty()) {
            adminId = adminIds.get(0);
        } else {
            adminId = 1; 
        }

        String sql = "INSERT INTO ticket_messages (ticket_id, sender_admin_id, message_text, is_read, sent_at) " +
                     "VALUES (?, ?, ?, 1, GETDATE())";
        jdbcTemplate.update(sql, autoReply.getTicketId(), adminId, autoReply.getMessageText());
        Integer messageId = jdbcTemplate.queryForObject("SELECT IDENT_CURRENT('ticket_messages')", Integer.class);
        autoReply.setMessageId(messageId);
        autoReply.setSentAt(LocalDateTime.now());
        autoReply.setIsRead(true);
        return autoReply;
    }
}

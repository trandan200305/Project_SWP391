package com.cny.backend.email.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Autowired
    private JavaMailSender mailSender;

    @Async("mailTaskExecutor")
    public void sendEmailAsync(String to, String subject, String content) {
        log.info("Starting async email sending to {} in thread {}", to, Thread.currentThread().getName());
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(content);
            mailSender.send(message);
            log.info("Successfully sent async email to {} in thread {}", to, Thread.currentThread().getName());
        } catch (Exception e) {
            log.error("Failed to send async email to {} in thread {}: {}", to, Thread.currentThread().getName(), e.getMessage());
        }
    }
}

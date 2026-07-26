package com.cny.backend.kyc.service;

import com.cny.backend.kyc.dto.KycReviewDto;
import com.cny.backend.kyc.dto.KycSubmissionDto;
import com.cny.backend.kyc.entity.UserKycVerification;
import com.cny.backend.kyc.repository.KycVerificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminKycService {

    private final KycVerificationRepository kycRepository;

    public List<UserKycVerification> getAllSubmissions(String status) {
        if (status != null && !status.trim().isEmpty() && !"ALL".equalsIgnoreCase(status)) {
            return kycRepository.findByStatusOrderByCreatedAtDesc(status.toUpperCase());
        }
        return kycRepository.findAllByOrderByCreatedAtDesc();
    }

    public UserKycVerification getSubmissionById(Long id) {
        return kycRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hồ sơ KYC ID: " + id));
    }

    @Transactional
    public UserKycVerification approveKyc(Long id, KycReviewDto reviewDto) {
        UserKycVerification kyc = getSubmissionById(id);
        kyc.setStatus("APPROVED");
        kyc.setAdminNotes(reviewDto != null ? reviewDto.getAdminNotes() : "Duyệt tự động/thủ công bởi Admin");
        kyc.setReviewedAt(LocalDateTime.now());
        log.info("Admin đã duyệt KYC thành công cho user: {}", kyc.getUserEmail());
        return kycRepository.save(kyc);
    }

    @Transactional
    public UserKycVerification rejectKyc(Long id, KycReviewDto reviewDto) {
        UserKycVerification kyc = getSubmissionById(id);
        kyc.setStatus("REJECTED");
        kyc.setAdminNotes(reviewDto != null ? reviewDto.getAdminNotes() : "Từ chối xác thực KYC");
        kyc.setReviewedAt(LocalDateTime.now());
        log.info("Admin đã từ chối KYC của user: {}", kyc.getUserEmail());
        return kycRepository.save(kyc);
    }

    @Transactional
    public UserKycVerification submitKycResult(KycSubmissionDto dto) {
        // Automatic AI verification decision based on VNPT eKYC AI results
        boolean isSuccess = "SUCCESS".equalsIgnoreCase(dto.getCardLivenessStatus()) 
                && "SUCCESS".equalsIgnoreCase(dto.getFaceLivenessStatus())
                && ("MATCH".equalsIgnoreCase(dto.getFaceMatchResult()) || (dto.getFaceMatchPercentage() != null && dto.getFaceMatchPercentage() >= 70.0));

        String autoStatus = isSuccess ? "APPROVED" : "REJECTED";
        String autoNote = isSuccess 
                ? "Duyệt tự động thành công qua VNPT eKYC AI (Khớp khuôn mặt: " + dto.getFaceMatchPercentage() + "%)"
                : "Hệ thống tự động từ chối: Giấy tờ hoặc khuôn mặt không hợp lệ";

        UserKycVerification kyc = UserKycVerification.builder()
                .userEmail(dto.getUserEmail())
                .fullName(dto.getFullName())
                .idNumber(dto.getIdNumber())
                .dateOfBirth(dto.getDateOfBirth())
                .gender(dto.getGender())
                .address(dto.getAddress())
                .cardType(dto.getCardType())
                .idCardFrontUrl(dto.getIdCardFrontUrl())
                .idCardBackUrl(dto.getIdCardBackUrl())
                .facePortraitUrl(dto.getFacePortraitUrl())
                .cardLivenessStatus(dto.getCardLivenessStatus() != null ? dto.getCardLivenessStatus() : "SUCCESS")
                .faceLivenessStatus(dto.getFaceLivenessStatus() != null ? dto.getFaceLivenessStatus() : "SUCCESS")
                .faceMatchPercentage(dto.getFaceMatchPercentage() != null ? dto.getFaceMatchPercentage() : 95.0)
                .faceMatchResult(dto.getFaceMatchResult() != null ? dto.getFaceMatchResult() : "MATCH")
                .status(autoStatus)
                .adminNotes(autoNote)
                .reviewedAt(isSuccess ? LocalDateTime.now() : null)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        log.info("Đã xác thực eKYC tự động ({}) cho email: {}", autoStatus, dto.getUserEmail());
        return kycRepository.save(kyc);
    }

    public Map<String, Object> getKycStatistics() {
        List<UserKycVerification> all = kycRepository.findAll();
        long total = all.size();
        long pending = all.stream().filter(k -> "PENDING".equalsIgnoreCase(k.getStatus())).count();
        long approved = all.stream().filter(k -> "APPROVED".equalsIgnoreCase(k.getStatus())).count();
        long rejected = all.stream().filter(k -> "REJECTED".equalsIgnoreCase(k.getStatus())).count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("total", total);
        stats.put("pending", pending);
        stats.put("approved", approved);
        stats.put("rejected", rejected);
        return stats;
    }
}

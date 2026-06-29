package com.cny.backend.project.service;

import com.cny.backend.project.entity.*;
import com.cny.backend.project.dto.DeliverableDto;
import com.cny.backend.project.dto.DeliverableSubmitDto;
import com.cny.backend.project.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DeliverableService {

    @Autowired
    private MilestoneRepository milestoneRepository;

    @Autowired
    private DeliverableRepository deliverableRepository;

    @Autowired
    private DeliverableFileRepository deliverableFileRepository;

    @Transactional
    public DeliverableDto submitDeliverable(Integer milestoneId, DeliverableSubmitDto dto, Integer freelancerId) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy mốc công việc ID: " + milestoneId));

        Contract contract = milestone.getContract();
        if (!contract.getFreelancer().getProfileId().equals(freelancerId)) {
            throw new IllegalArgumentException("Bạn không có quyền nộp sản phẩm cho mốc công việc này.");
        }

        if (!"ACTIVE".equals(contract.getStatus())) {
            throw new IllegalArgumentException("Hợp đồng này không ở trạng thái hoạt động (ACTIVE).");
        }

        // Tạo deliverable mới
        Deliverable deliverable = Deliverable.builder()
                .milestone(milestone)
                .title(dto.getTitle())
                .notes(dto.getNotes())
                .status("SUBMITTED")
                .files(new ArrayList<>())
                .build();

        Deliverable savedDeliverable = deliverableRepository.save(deliverable);

        // Lưu các files đính kèm
        if (dto.getAttachments() != null && !dto.getAttachments().isEmpty()) {
            for (DeliverableSubmitDto.AttachmentDto fileDto : dto.getAttachments()) {
                DeliverableFile df = DeliverableFile.builder()
                        .deliverable(savedDeliverable)
                        .fileUrl(fileDto.getFileUrl())
                        .fileName(fileDto.getFileName())
                        .fileSize(fileDto.getFileSize())
                        .build();
                deliverableFileRepository.save(df);
                savedDeliverable.getFiles().add(df);
            }
        }

        // Cập nhật trạng thái Milestone
        milestone.setStatus("SUBMITTED");
        milestoneRepository.save(milestone);

        return mapToDto(savedDeliverable);
    }

    @Transactional
    public DeliverableDto reviewDeliverable(Integer deliverableId, Boolean approve, String feedback, Integer employerId) {
        Deliverable deliverable = deliverableRepository.findById(deliverableId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy sản phẩm nộp ID: " + deliverableId));

        Milestone milestone = deliverable.getMilestone();
        Contract contract = milestone.getContract();

        if (!contract.getClient().getEmployerId().equals(employerId)) {
            throw new IllegalArgumentException("Bạn không có quyền đánh giá sản phẩm nộp này.");
        }

        if (!"SUBMITTED".equals(deliverable.getStatus())) {
            throw new IllegalArgumentException("Sản phẩm nộp này đã được duyệt hoặc từ chối trước đó.");
        }

        if (approve) {
            deliverable.setStatus("APPROVED");
            milestone.setStatus("APPROVED");
        } else {
            deliverable.setStatus("REJECTED");
            milestone.setStatus("REJECTED");
        }

        deliverable.setFeedback(feedback);
        deliverableRepository.save(deliverable);
        milestoneRepository.save(milestone);

        return mapToDto(deliverable);
    }

    public DeliverableDto mapToDto(Deliverable deliverable) {
        List<DeliverableDto.DeliverableFileDto> filesDto = new ArrayList<>();
        if (deliverable.getFiles() != null) {
            filesDto = deliverable.getFiles().stream()
                    .map(f -> DeliverableDto.DeliverableFileDto.builder()
                            .fileId(f.getFileId())
                            .fileUrl(f.getFileUrl())
                            .fileName(f.getFileName())
                            .fileSize(f.getFileSize())
                            .createdAt(f.getCreatedAt())
                            .build())
                    .collect(Collectors.toList());
        }

        return DeliverableDto.builder()
                .deliverableId(deliverable.getDeliverableId())
                .milestoneId(deliverable.getMilestone().getMilestoneId())
                .title(deliverable.getTitle())
                .notes(deliverable.getNotes())
                .status(deliverable.getStatus())
                .submittedAt(deliverable.getSubmittedAt())
                .feedback(deliverable.getFeedback())
                .files(filesDto)
                .build();
    }
}

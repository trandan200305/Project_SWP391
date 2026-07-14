package com.cny.backend.project.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliverableDto {
    private Integer deliverableId;
    private Integer milestoneId;
    private String title;
    private String notes;
    private String status;
    private LocalDateTime submittedAt;
    private String feedback;
    private List<DeliverableFileDto> files;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DeliverableFileDto {
        private Integer fileId;
        private String fileUrl;
        private String fileName;
        private Long fileSize;
        private LocalDateTime createdAt;
    }
}

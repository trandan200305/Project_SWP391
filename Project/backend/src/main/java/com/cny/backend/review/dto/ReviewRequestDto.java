package com.cny.backend.review.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReviewRequestDto {

    @NotNull(message = "Rating is required.")
    @DecimalMin(value = "1.0", message = "Rating must be at least 1.")
    @DecimalMax(value = "5.0", message = "Rating must be at most 5.")
    private Double rating;

    @Size(max = 2000, message = "Comment must not exceed 2000 characters.")
    private String comment;
}

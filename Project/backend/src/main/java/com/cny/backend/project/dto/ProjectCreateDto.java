package com.cny.backend.project.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectCreateDto {
    @NotNull(message = "ID Nhà tuyển dụng không được để trống.")
    private Integer clientId;

    @NotNull(message = "Vui lòng chọn danh mục công việc.")
    private Integer categoryId;

    @NotBlank(message = "Tiêu đề công việc không được để trống.")
    @Size(min = 8, max = 150, message = "Tiêu đề công việc phải từ 8 đến 150 ký tự.")
    private String title;

    private String workForm;

    @NotBlank(message = "Mô tả công việc không được để trống.")
    @Size(min = 50, max = 5000, message = "Mô tả công việc phải từ 50 đến 5000 ký tự.")
    private String description;

    private List<String> skills;

    private String projectType;

    @DecimalMin(value = "0.01", message = "Ngân sách tối thiểu phải lớn hơn 0.")
    private BigDecimal budgetMin;

    @DecimalMin(value = "0.01", message = "Ngân sách tối đa phải lớn hơn 0.")
    private BigDecimal budgetMax;

    @DecimalMin(value = "0.01", message = "Ngân sách cố định phải lớn hơn 0.")
    private BigDecimal budgetFixed;

    private LocalDate deadline;
    private String servicePackage;
}

package com.cny.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SeoConfigDto {
    private int id;
    private String pageName;
    private String title;
    private String description;
    private String keywords;
}

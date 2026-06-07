package com.cny.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ArticleDto {
    private int id;
    private String title;
    private String author;
    private int views;
    private String status;
    private String publishedAt;
}

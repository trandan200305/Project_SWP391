package com.cny.backend.project.service;

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
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class JobCategoryService {

    @Autowired
    private JobCategoryRepository jobCategoryRepository;

    @Autowired
    private ProjectRepository projectRepository;

    public List<JobCategoryDto> getAllCategoriesWithCount() {
        List<JobCategory> categories = jobCategoryRepository.findByIsActiveTrueOrderByDisplayOrderAsc();
        return categories.stream().map(cat -> {
            int count = projectRepository.countByCategoryCategoryIdAndStatusAndIsDeletedFalse(cat.getCategoryId(), "PUBLISHED");
            return JobCategoryDto.builder()
                    .id(cat.getCategoryId())
                    .name(cat.getCategoryName())
                    .description(cat.getDescription())
                    .isActive(cat.getIsActive())
                    .count(count)
                    .categoryId(cat.getCategoryId())
                    .categoryName(cat.getCategoryName())
                    .iconUrl(cat.getIconUrl())
                    .build();
        }).collect(Collectors.toList());
    }

    public List<JobCategoryDto> getTopCategories() {
        List<JobCategory> categories = jobCategoryRepository.findByParentIsNullAndIsActiveTrueOrderByDisplayOrderAsc();
        return categories.stream().map(cat -> {
            int count = projectRepository.countByCategoryCategoryIdAndStatusAndIsDeletedFalse(cat.getCategoryId(), "PUBLISHED");
            return JobCategoryDto.builder()
                    .id(cat.getCategoryId())
                    .name(cat.getCategoryName())
                    .description(cat.getDescription())
                    .isActive(cat.getIsActive())
                    .count(count)
                    .categoryId(cat.getCategoryId())
                    .categoryName(cat.getCategoryName())
                    .iconUrl(cat.getIconUrl())
                    .build();
        }).collect(Collectors.toList());
    }

    public JobCategoryDto createCategory(JobCategory category) {
        JobCategory saved = jobCategoryRepository.save(category);
        return JobCategoryDto.builder()
                .id(saved.getCategoryId())
                .name(saved.getCategoryName())
                .description(saved.getDescription())
                .isActive(saved.getIsActive())
                .count(0)
                .categoryId(saved.getCategoryId())
                .categoryName(saved.getCategoryName())
                .iconUrl(saved.getIconUrl())
                .build();
    }
}

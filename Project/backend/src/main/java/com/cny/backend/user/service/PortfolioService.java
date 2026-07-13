package com.cny.backend.user.service;

import com.cny.backend.user.dto.PortfolioDto;
import com.cny.backend.user.dto.PortfolioFileDto;
import com.cny.backend.user.entity.Freelancer;
import com.cny.backend.user.entity.Portfolio;
import com.cny.backend.user.entity.PortfolioFile;
import com.cny.backend.user.repository.FreelancerRepository;
import com.cny.backend.user.repository.PortfolioFileRepository;
import com.cny.backend.user.repository.PortfolioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class PortfolioService {

    @Autowired
    private PortfolioRepository portfolioRepository;

    @Autowired
    private PortfolioFileRepository portfolioFileRepository;

    @Autowired
    private FreelancerRepository freelancerRepository;

    public List<PortfolioDto> getFreelancerPortfolios(Integer freelancerId) {
        return portfolioRepository.findByFreelancer_ProfileId(freelancerId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public PortfolioDto addPortfolio(Integer freelancerId, PortfolioDto dto) {
        Freelancer freelancer = freelancerRepository.findById(freelancerId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Freelancer với ID: " + freelancerId));

        Portfolio portfolio = new Portfolio();
        portfolio.setFreelancer(freelancer);
        portfolio.setTitle(dto.getTitle());
        portfolio.setDescription(dto.getDescription());
        portfolio.setProjectUrl(dto.getProjectUrl());
        portfolio.setCreatedAt(LocalDateTime.now());

        Portfolio savedPortfolio = portfolioRepository.save(portfolio);

        if (dto.getFiles() != null && !dto.getFiles().isEmpty()) {
            List<PortfolioFile> files = dto.getFiles().stream().map(fileDto -> {
                PortfolioFile pf = new PortfolioFile();
                pf.setPortfolio(savedPortfolio);
                pf.setFileUrl(fileDto.getFileUrl());
                pf.setFileName(fileDto.getFileName());
                pf.setFileSize(fileDto.getFileSize());
                pf.setFileType(fileDto.getFileType());
                pf.setCreatedAt(LocalDateTime.now());
                return pf;
            }).collect(Collectors.toList());
            
            portfolioFileRepository.saveAll(files);
            savedPortfolio.setFiles(files);
        }

        return mapToDto(savedPortfolio);
    }

    public PortfolioDto updatePortfolio(Integer freelancerId, Integer portfolioId, PortfolioDto dto) {
        Portfolio portfolio = portfolioRepository.findById(portfolioId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Portfolio với ID: " + portfolioId));

        if (!portfolio.getFreelancer().getProfileId().equals(freelancerId)) {
            throw new RuntimeException("Không có quyền chỉnh sửa Portfolio này!");
        }

        portfolio.setTitle(dto.getTitle());
        portfolio.setDescription(dto.getDescription());
        portfolio.setProjectUrl(dto.getProjectUrl());

        // Update files
        if (dto.getFiles() != null) {
            // Xóa file cũ
            if (portfolio.getFiles() != null) {
                portfolioFileRepository.deleteAll(portfolio.getFiles());
                portfolio.getFiles().clear();
            }

            // Thêm file mới
            List<PortfolioFile> newFiles = dto.getFiles().stream().map(fileDto -> {
                PortfolioFile pf = new PortfolioFile();
                pf.setPortfolio(portfolio);
                pf.setFileUrl(fileDto.getFileUrl());
                pf.setFileName(fileDto.getFileName());
                pf.setFileSize(fileDto.getFileSize());
                pf.setFileType(fileDto.getFileType());
                pf.setCreatedAt(LocalDateTime.now());
                return pf;
            }).collect(Collectors.toList());

            portfolioFileRepository.saveAll(newFiles);
            portfolio.setFiles(newFiles);
        }

        Portfolio savedPortfolio = portfolioRepository.save(portfolio);
        return mapToDto(savedPortfolio);
    }

    public void deletePortfolio(Integer freelancerId, Integer portfolioId) {
        Portfolio portfolio = portfolioRepository.findById(portfolioId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Portfolio với ID: " + portfolioId));

        if (!portfolio.getFreelancer().getProfileId().equals(freelancerId)) {
            throw new RuntimeException("Không có quyền xóa Portfolio này!");
        }

        portfolioRepository.delete(portfolio);
    }

    private PortfolioDto mapToDto(Portfolio portfolio) {
        PortfolioDto dto = new PortfolioDto();
        dto.setPortfolioId(portfolio.getPortfolioId());
        dto.setFreelancerId(portfolio.getFreelancer().getProfileId());
        dto.setTitle(portfolio.getTitle());
        dto.setDescription(portfolio.getDescription());
        dto.setProjectUrl(portfolio.getProjectUrl());
        dto.setCreatedAt(portfolio.getCreatedAt());

        if (portfolio.getFiles() != null) {
            List<PortfolioFileDto> fileDtos = portfolio.getFiles().stream().map(f -> {
                PortfolioFileDto fdto = new PortfolioFileDto();
                fdto.setFileId(f.getFileId());
                fdto.setFileUrl(f.getFileUrl());
                fdto.setFileName(f.getFileName());
                fdto.setFileSize(f.getFileSize());
                fdto.setFileType(f.getFileType());
                fdto.setCreatedAt(f.getCreatedAt());
                return fdto;
            }).collect(Collectors.toList());
            dto.setFiles(fileDtos);
        }

        return dto;
    }
}

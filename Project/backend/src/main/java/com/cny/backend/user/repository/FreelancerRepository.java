package com.cny.backend.user.repository;

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


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface FreelancerRepository extends JpaRepository<Freelancer, Integer> {
    
    
    List<Freelancer> findByIsAvailableTrueOrderByAverageRatingDescProjectsCompletedDesc();
    
    @Query("SELECT f FROM Freelancer f WHERE f.isAvailable = true AND f.averageRating >= 4.5 ORDER BY f.averageRating DESC")
    List<Freelancer> findTopRatedFreelancers();

    Optional<Freelancer> findByEmail(String email);
    int countByEmail(String email);
    int countByPhone(String phone);
    int countByPhoneAndProfileIdNot(String phone, Integer profileId);
    int countByDisplayName(String displayName);

    @Query("SELECT COUNT(f) > 0 FROM Freelancer f WHERE f.phone = :phone AND (f.isDeleted IS NULL OR f.isDeleted = false) AND f.email <> :email")
    boolean existsByPhoneActiveAndEmailNot(@Param("phone") String phone, @Param("email") String email);

    /**
     * Tìm kiếm freelancer theo keyword (tên, professional title) và/hoặc expertiseField (danh mục),
     * chỉ lấy những freelancer đang active (isDeleted != true), hỗ trợ phân trang.
     */
    @Query("SELECT f FROM Freelancer f LEFT JOIN FreelancerProfile p ON p.freelancer = f WHERE " +
           "(f.isDeleted IS NULL OR f.isDeleted = false) " +
           "AND (f.isAvailable IS NULL OR f.isAvailable = true) " +
           "AND (:keyword IS NULL OR :keyword = '' OR LOWER(f.displayName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(f.professionalTitle) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "AND (:category IS NULL OR :category = '' " +
           "OR p.expertiseField = :category " +
           "OR p.expertiseField LIKE CONCAT(:category, ',%') " +
           "OR p.expertiseField LIKE CONCAT('%,', :category) " +
           "OR p.expertiseField LIKE CONCAT('%,', :category, ',%')) " +
           "AND (:minRate IS NULL OR f.hourlyRate >= :minRate) " +
           "AND (:maxRate IS NULL OR f.hourlyRate <= :maxRate) " +
           "AND (:minRating IS NULL OR f.averageRating >= :minRating)")
    Page<Freelancer> searchFreelancers(
            @Param("keyword") String keyword,
            @Param("category") String category,
            @Param("minRate") BigDecimal minRate,
            @Param("maxRate") BigDecimal maxRate,
            @Param("minRating") BigDecimal minRating,
            Pageable pageable);

    /**
     * Tìm top freelancer theo kỹ năng / danh mục, sắp xếp theo rating và số dự án hoàn thành.
     */
    @Query("SELECT f FROM Freelancer f LEFT JOIN FreelancerProfile p ON p.freelancer = f WHERE " +
           "(f.isDeleted IS NULL OR f.isDeleted = false) " +
           "AND (f.isAvailable IS NULL OR f.isAvailable = true) " +
           "AND (:category IS NULL OR :category = '' " +
           "OR p.expertiseField = :category " +
           "OR p.expertiseField LIKE CONCAT(:category, ',%') " +
           "OR p.expertiseField LIKE CONCAT('%,', :category) " +
           "OR p.expertiseField LIKE CONCAT('%,', :category, ',%')) " +
           "ORDER BY COALESCE(f.averageRating, 0) DESC, COALESCE(f.projectsCompleted, 0) DESC")
    Page<Freelancer> findTopFreelancers(
            @Param("category") String category,
            Pageable pageable);
}


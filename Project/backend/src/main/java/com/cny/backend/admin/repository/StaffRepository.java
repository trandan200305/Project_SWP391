package com.cny.backend.admin.repository;

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
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface StaffRepository extends JpaRepository<Staff, Integer> {
    Optional<Staff> findByEmail(String email);
    long countByEmail(String email);
    long countByPhone(String phone);
    long countByCitizenId(String citizenId);
    long countByDisplayName(String displayName);
    List<Staff> findByManager_ManagerId(Integer managerId);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(s) > 0 FROM Staff s WHERE s.phone = :phone AND (s.isDeleted IS NULL OR s.isDeleted = false) AND s.email <> :email")
    boolean existsByPhoneActiveAndEmailNot(@org.springframework.data.repository.query.Param("phone") String phone, @org.springframework.data.repository.query.Param("email") String email);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(s) > 0 FROM Staff s WHERE s.citizenId = :citizenId AND (s.isDeleted IS NULL OR s.isDeleted = false) AND s.email <> :email")
    boolean existsByCitizenIdActiveAndEmailNot(@org.springframework.data.repository.query.Param("citizenId") String citizenId, @org.springframework.data.repository.query.Param("email") String email);
}

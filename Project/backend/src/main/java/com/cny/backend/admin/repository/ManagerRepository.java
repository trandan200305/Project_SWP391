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

@Repository
public interface ManagerRepository extends JpaRepository<Manager, Integer> {
    Optional<Manager> findByEmail(String email);
    long countByEmail(String email);
    long countByPhone(String phone);
    long countByCitizenId(String citizenId);
    long countByDisplayName(String displayName);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(m) > 0 FROM Manager m WHERE m.phone = :phone AND (m.isDeleted IS NULL OR m.isDeleted = false) AND m.email <> :email")
    boolean existsByPhoneActiveAndEmailNot(@org.springframework.data.repository.query.Param("phone") String phone, @org.springframework.data.repository.query.Param("email") String email);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(m) > 0 FROM Manager m WHERE m.citizenId = :citizenId AND (m.isDeleted IS NULL OR m.isDeleted = false) AND m.email <> :email")
    boolean existsByCitizenIdActiveAndEmailNot(@org.springframework.data.repository.query.Param("citizenId") String citizenId, @org.springframework.data.repository.query.Param("email") String email);
}

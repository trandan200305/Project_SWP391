package com.hello.remake.repository;
import com.hello.remake.entity.Admin;
import org.springframework.data.jpa.repository.JpaRepository;
public interface AdminRepository extends JpaRepository<Admin, Integer> {}

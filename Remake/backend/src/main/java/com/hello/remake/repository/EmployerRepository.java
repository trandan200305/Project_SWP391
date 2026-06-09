package com.hello.remake.repository;
import com.hello.remake.entity.Employer;
import org.springframework.data.jpa.repository.JpaRepository;
public interface EmployerRepository extends JpaRepository<Employer, Integer> {}

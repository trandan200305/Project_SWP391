package com.cny.backend.admin.repository;

import com.cny.backend.admin.entity.PaymentInvoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface PaymentInvoiceRepository extends JpaRepository<PaymentInvoice, Integer> {
    Optional<PaymentInvoice> findByTransactionId(Integer transactionId);
    Optional<PaymentInvoice> findByInvoiceNumber(String invoiceNumber);
    List<PaymentInvoice> findByEmployerIdOrderByIssuedAtDesc(Integer employerId);
    Page<PaymentInvoice> findByEmployerId(Integer employerId, Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT i FROM PaymentInvoice i WHERE i.employerId = :employerId " +
           "AND (:keyword IS NULL OR LOWER(i.invoiceNumber) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(i.description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<PaymentInvoice> findByEmployerIdWithSearch(@org.springframework.data.repository.query.Param("employerId") Integer employerId,
                                                    @org.springframework.data.repository.query.Param("keyword") String keyword,
                                                    Pageable pageable);
}

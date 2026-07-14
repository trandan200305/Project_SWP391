package com.cny.backend.admin.repository;

import com.cny.backend.admin.entity.PaymentInvoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface PaymentInvoiceRepository extends JpaRepository<PaymentInvoice, Integer> {
    Optional<PaymentInvoice> findByTransactionId(Integer transactionId);
    Optional<PaymentInvoice> findByInvoiceNumber(String invoiceNumber);
    List<PaymentInvoice> findByEmployerIdOrderByIssuedAtDesc(Integer employerId);
}

package com.cny.backend.invoice.repository;

import com.cny.backend.invoice.entity.ElectronicInvoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ElectronicInvoiceRepository extends JpaRepository<ElectronicInvoice, Integer> {
    Optional<ElectronicInvoice> findByTransactionUuid(String transactionUuid);
    Optional<ElectronicInvoice> findByPaymentTransactionId(Integer paymentTransactionId);
}

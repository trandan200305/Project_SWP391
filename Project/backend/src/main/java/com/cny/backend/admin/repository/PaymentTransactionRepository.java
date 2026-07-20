package com.cny.backend.admin.repository;

import com.cny.backend.admin.entity.PaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Integer> {
    Optional<PaymentTransaction> findByTxnRef(String txnRef);
    List<PaymentTransaction> findByProjectIdAndStatus(Integer projectId, String status);
    List<PaymentTransaction> findByEmployerIdOrderByCreatedAtDesc(Integer employerId);

    @Query(value = "SELECT SUM(amount) FROM payment_transactions WHERE status = 'SUCCESS' AND CAST(created_at AS DATE) = CAST(GETDATE() AS DATE)", nativeQuery = true)
    Double calculateInstantRevenue();
}


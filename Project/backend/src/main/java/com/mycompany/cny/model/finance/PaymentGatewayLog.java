package com.mycompany.cny.model.finance;

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "payment_gateway_logs")
public class PaymentGatewayLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "log_id")
    private Integer logId;

    @Column(name = "transaction_id")
    private Integer transactionId;

    @Column(name = "gateway")
    private String gateway;

    @Column(name = "gateway_tx_id")
    private String gatewayTxId;

    @Column(name = "request_data")
    private String requestData;

    @Column(name = "response_data")
    private String responseData;

    @Column(name = "status")
    private String status;

    @Column(name = "created_at")
    private java.time.LocalDateTime createdAt;

}

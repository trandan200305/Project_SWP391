package com.cny.backend.invoice.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "sinvoice")
@Data
public class ViettelSInvoiceConfig {
    private String apiUrl = "https://sinvoice.viettel.vn:8443";
    private String username;
    private String password;
    private String taxCode;
    private String templateCode;
    private String invoiceSeries;
    
    // API KEY authentication properties
    private String appKid;
    private String apiKey;
}

package com.cny.backend.admin.service;

import com.cny.backend.admin.entity.PaymentInvoice;
import com.cny.backend.user.entity.Employer;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
@Slf4j
public class ViettelSInvoiceService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${viettel.sinvoice.base-url:https://api-vinvoice.viettel.vn/services/einvoiceapplication/api/}")
    private String baseUrl;

    @Value("${viettel.sinvoice.username:0100109106-507}")
    private String username;

    @Value("${viettel.sinvoice.password:2wsxCDE#}")
    private String password;

    @Value("${viettel.sinvoice.taxcode:0100109106-507}")
    private String taxCode;

    @Value("${viettel.sinvoice.template-code:1/001}")
    private String templateCode;

    @Value("${viettel.sinvoice.invoice-series:C24TYY}")
    private String invoiceSeries;

    @Value("${viettel.sinvoice.invoice-type:1}")
    private String invoiceType;

    public ViettelSInvoiceService(ObjectMapper objectMapper) {
        this.restTemplate = new RestTemplate();
        this.objectMapper = objectMapper;
    }

    /**
     * Lấy Access Token từ API của Viettel SInvoice
     */
    public String login() {
        String url = "https://api-vinvoice.viettel.vn/auth/login";
        Map<String, String> body = new HashMap<>();
        body.put("username", username);
        body.put("password", password);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                if (root.has("access_token")) {
                    return root.get("access_token").asText();
                }
            }
            throw new RuntimeException("Lỗi xác thực Viettel SInvoice: Không nhận được access_token");
        } catch (Exception e) {
            log.error("Lỗi khi login Viettel SInvoice", e);
            throw new RuntimeException("Không thể kết nối đến hệ thống Hóa đơn điện tử");
        }
    }

    /**
     * Tạo hóa đơn điện tử cho 1 PaymentInvoice
     */
    public Map<String, Object> createInvoice(PaymentInvoice invoice, Employer employer) {
        String token = login();
        String url = baseUrl + "InvoiceAPI/InvoiceWS/createInvoice/" + (taxCode.contains("-") ? taxCode : username);

        String txnUuid = UUID.randomUUID().toString();
        
        // Cấu trúc generalInvoiceInfo
        Map<String, Object> generalInfo = new HashMap<>();
        generalInfo.put("invoiceType", invoiceType); 
        generalInfo.put("templateCode", templateCode);
        generalInfo.put("invoiceSeries", invoiceSeries);
        generalInfo.put("currencyCode", "VND");
        generalInfo.put("paymentStatus", true);
        generalInfo.put("transactionUuid", txnUuid);

        // Cấu trúc buyerInfo
        Map<String, Object> buyerInfo = new HashMap<>();
        buyerInfo.put("buyerName", employer.getFullName() != null ? employer.getFullName() : "Khách hàng");
        buyerInfo.put("buyerLegalName", employer.getCompanyName() != null ? employer.getCompanyName() : employer.getFullName());
        buyerInfo.put("buyerTaxCode", employer.getTaxCode() != null ? employer.getTaxCode() : "");
        buyerInfo.put("buyerAddressLine", employer.getAddress() != null ? employer.getAddress() : "Không xác định");
        buyerInfo.put("buyerEmail", employer.getEmail());

        // Cấu trúc sellerInfo
        Map<String, Object> sellerInfo = new HashMap<>();
        sellerInfo.put("sellerLegalName", "Công ty TNHH LancerPro");
        sellerInfo.put("sellerTaxCode", taxCode);
        sellerInfo.put("sellerAddressLine", "Hà Nội");

        // Cấu trúc itemInfo
        List<Map<String, Object>> items = new ArrayList<>();
        Map<String, Object> item = new HashMap<>();
        item.put("lineNumber", 1);
        item.put("itemName", invoice.getDescription());
        item.put("unitName", "Gói");
        item.put("unitPrice", invoice.getAmount());
        item.put("quantity", 1);
        item.put("itemTotalAmountWithoutTax", invoice.getAmount());
        item.put("taxPercentage", 0);
        item.put("taxAmount", 0);
        item.put("discount", 0);
        item.put("itemTotalAmountWithTax", invoice.getAmount());
        items.add(item);

        // Cấu trúc summarizeInfo
        Map<String, Object> summarizeInfo = new HashMap<>();
        summarizeInfo.put("sumOfTotalLineAmountWithoutTax", invoice.getAmount());
        summarizeInfo.put("totalAmountWithoutTax", invoice.getAmount());
        summarizeInfo.put("totalTaxAmount", 0);
        summarizeInfo.put("totalAmountWithTax", invoice.getAmount());
        summarizeInfo.put("totalAmountWithTaxInWords", "Theo số tiền");

        // Cấu trúc payments
        List<Map<String, Object>> payments = new ArrayList<>();
        Map<String, Object> payment = new HashMap<>();
        payment.put("paymentMethodName", "TM/CK"); // Hình thức thanh toán Tiền mặt/Chuyển khoản
        payments.add(payment);

        Map<String, Object> payload = new HashMap<>();
        payload.put("generalInvoiceInfo", generalInfo);
        payload.put("buyerInfo", buyerInfo);
        payload.put("sellerInfo", sellerInfo);
        payload.put("itemInfo", items);
        payload.put("summarizeInfo", summarizeInfo);
        payload.put("payments", payments);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Cookie", "access_token=" + token); // SInvoice yêu cầu access_token trong Cookie

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            JsonNode root = objectMapper.readTree(response.getBody());
            
            Map<String, Object> result = new HashMap<>();
            
            // Xử lý phản hồi từ Viettel SInvoice
            if (root.has("result") && root.get("result").has("invoiceNo")) {
                String invoiceNo = root.get("result").get("invoiceNo").asText();
                String reservationCode = root.get("result").has("reservationCode") ? root.get("result").get("reservationCode").asText() : null;
                
                result.put("success", true);
                result.put("invoiceNo", invoiceNo);
                result.put("transactionUuid", txnUuid);
                result.put("reservationCode", reservationCode);
            } else {
                result.put("success", false);
                result.put("message", root.has("message") ? root.get("message").asText() : "Lỗi không xác định từ SInvoice");
                log.error("SInvoice Error: {}", response.getBody());
            }
            return result;
        } catch (org.springframework.web.client.HttpStatusCodeException ex) {
            String errorBody = ex.getResponseBodyAsString();
            log.error("Lỗi HTTP gọi API createInvoice: {} - {}", ex.getStatusCode(), errorBody);
            throw new RuntimeException("Lỗi SInvoice: " + errorBody);
        } catch (Exception e) {
            log.error("Lỗi gọi API createInvoice", e);
            throw new RuntimeException("Có lỗi xảy ra khi phát hành hóa đơn: " + e.getMessage());
        }
    }

    /**
     * Lấy bản thể hiện PDF của hóa đơn
     */
    public byte[] downloadInvoicePdf(String invoiceNo) {
        String token = login();
        
        // POST request to get invoice file representation (PDF)
        String url = baseUrl + "InvoiceAPI/InvoiceUtilsWS/getInvoiceRepresentationFile";
        
        // Payload theo chuẩn API tải PDF v2.50
        Map<String, String> payload = new HashMap<>();
        payload.put("supplierTaxCode", taxCode.contains("-") ? taxCode : username); // Use the correct supplierTaxCode (usually matches username for branch)
        payload.put("invoiceNo", invoiceNo);
        payload.put("templateCode", templateCode); // Template code used in createInvoice
        payload.put("fileType", "PDF"); // Yêu cầu trả về định dạng PDF

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Cookie", "access_token=" + token);

        HttpEntity<Map<String, String>> entity = new HttpEntity<>(payload, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            JsonNode root = objectMapper.readTree(response.getBody());
            
            if (root.has("fileToBytes")) {
                String base64Content = root.get("fileToBytes").asText();
                return Base64.getDecoder().decode(base64Content);
            }
            throw new RuntimeException("SInvoice không trả về nội dung file PDF.");
        } catch (Exception e) {
            log.error("Lỗi khi tải file PDF từ SInvoice", e);
            throw new RuntimeException("Không thể lấy bản PDF hóa đơn từ Viettel.");
        }
    }
}

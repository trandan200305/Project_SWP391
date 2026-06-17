package com.cny.backend.admin.service;

import com.cny.backend.admin.entity.PaymentTransaction;
import com.cny.backend.admin.entity.VnpayConfig;
import com.cny.backend.admin.repository.VnpayConfigRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class VNPayService {

    @Autowired
    private VnpayConfigRepository vnpayConfigRepository;

    public static String hmacSHA512(final String key, final String data) {
        try {
            if (key == null || data == null) {
                return null;
            }
            final Mac hmac512 = Mac.getInstance("HmacSHA512");
            byte[] hmacKeyBytes = key.getBytes(StandardCharsets.UTF_8);
            final SecretKeySpec secretKey = new SecretKeySpec(hmacKeyBytes, "HmacSHA512");
            hmac512.init(secretKey);
            byte[] dataBytes = data.getBytes(StandardCharsets.UTF_8);
            byte[] result = hmac512.doFinal(dataBytes);
            StringBuilder sb = new StringBuilder(2 * result.length);
            for (byte b : result) {
                sb.append(String.format("%02x", b & 0xff));
            }
            return sb.toString();
        } catch (Exception ex) {
            return "";
        }
    }

    public String generatePaymentUrl(PaymentTransaction txn, String ipAddress) {
        VnpayConfig config = vnpayConfigRepository.findFirstByIsActiveTrueOrderByIdDesc()
                .orElse(null);
        
        String tmnCode = config != null ? config.getTmnCode() : "DEMO2019";
        String secretKey = config != null ? config.getHashSecret() : "9A7F11E55E1C3806E0528B65355AA05C";
        String vnpUrl = config != null ? config.getVnpUrl() : "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
        String returnUrl = config != null ? config.getReturnUrl() : "http://localhost:3000/payment-result";

        Map<String, String> vnp_Params = new HashMap<>();
        vnp_Params.put("vnp_Version", "2.1.0");
        vnp_Params.put("vnp_Command", "pay");
        vnp_Params.put("vnp_TmnCode", tmnCode);
        
        long amountInCents = txn.getAmount().multiply(new java.math.BigDecimal("100")).longValue();
        vnp_Params.put("vnp_Amount", String.valueOf(amountInCents));
        vnp_Params.put("vnp_CurrCode", "VND");
        
        vnp_Params.put("vnp_TxnRef", txn.getTxnRef());
        vnp_Params.put("vnp_OrderInfo", "Thanh toan phi dang tin du an ID " + txn.getProjectId());
        vnp_Params.put("vnp_OrderType", "other");
        vnp_Params.put("vnp_Locale", "vn");
        vnp_Params.put("vnp_ReturnUrl", returnUrl);
        vnp_Params.put("vnp_IpAddr", ipAddress != null ? ipAddress : "127.0.0.1");

        LocalDateTime now = LocalDateTime.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
        vnp_Params.put("vnp_CreateDate", now.format(formatter));

        List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
        Collections.sort(fieldNames);
        StringBuilder query = new StringBuilder();
        StringBuilder hashData = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = vnp_Params.get(fieldName);
            if ((fieldValue != null) && (fieldValue.length() > 0)) {
                hashData.append(fieldName);
                hashData.append("=");
                hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));

                query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII));
                query.append("=");
                query.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));

                if (itr.hasNext()) {
                    query.append("&");
                    hashData.append("&");
                }
            }
        }

        String queryUrl = query.toString();
        String vnp_SecureHash = hmacSHA512(secretKey, hashData.toString());
        queryUrl += "&vnp_SecureHash=" + vnp_SecureHash;

        return vnpUrl + "?" + queryUrl;
    }

    public boolean verifySignature(Map<String, String> fields) {
        String secureHashReceived = fields.get("vnp_SecureHash");
        if (secureHashReceived == null) {
            return false;
        }

        Map<String, String> signFields = new HashMap<>(fields);
        signFields.remove("vnp_SecureHash");
        signFields.remove("vnp_SecureHashType");

        VnpayConfig config = vnpayConfigRepository.findFirstByIsActiveTrueOrderByIdDesc()
                .orElse(null);
        String secretKey = config != null ? config.getHashSecret() : "9A7F11E55E1C3806E0528B65355AA05C";

        List<String> fieldNames = new ArrayList<>(signFields.keySet());
        Collections.sort(fieldNames);
        StringBuilder sb = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = signFields.get(fieldName);
            if ((fieldValue != null) && (fieldValue.length() > 0)) {
                sb.append(fieldName);
                sb.append("=");
                sb.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                if (itr.hasNext()) {
                    sb.append("&");
                }
            }
        }

        String secureHashCalculated = hmacSHA512(secretKey, sb.toString());
        return secureHashCalculated.equalsIgnoreCase(secureHashReceived);
    }
}

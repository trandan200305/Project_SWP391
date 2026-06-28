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

import com.cny.backend.admin.repository.PaymentTransactionRepository;
import com.cny.backend.project.service.ProjectService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;

@Service
public class VNPayService {

    @Autowired
    private PaymentTransactionRepository transactionRepository;

    @Autowired
    private ProjectService projectService;

    @Value("${vnpay.tmn-code:DEMO2019}")
    private String vnpTmnCode;

    @Value("${vnpay.hash-secret:9A7F11E55E1C3806E0528B65355AA05C}")
    private String vnpHashSecret;

    @Value("${vnpay.vnp-url:https://sandbox.vnpayment.vn/paymentv2/vpcpay.html}")
    private String vnpUrl;

    @Value("${vnpay.return-url:http://localhost:8080/api/payment/vnpay-return}")
    private String vnpReturnUrl;

    @Value("${vietqr.client-id:}")
    private String vietqrClientId;

    @Value("${vietqr.api-key:}")
    private String vietqrApiKey;

    @Value("${vietqr.lookup-url:https://api.vietqr.io/v2/lookup}")
    private String vietqrLookupUrl;

    // BIN mapping: bank code (VietQR Quick Link code) -> Napas BIN number
    private static final Map<String, String> BANK_BIN_MAP = new HashMap<>();
    static {
        BANK_BIN_MAP.put("vietcombank",  "970436");
        BANK_BIN_MAP.put("vietinbank",   "970415");
        BANK_BIN_MAP.put("bidv",         "970418");
        BANK_BIN_MAP.put("agribank",     "970405");
        BANK_BIN_MAP.put("techcombank",  "970407");
        BANK_BIN_MAP.put("mbbank",       "970422");
        BANK_BIN_MAP.put("vpbank",       "970432");
        BANK_BIN_MAP.put("acb",          "970416");
        BANK_BIN_MAP.put("sacombank",    "970403");
        BANK_BIN_MAP.put("tpbank",       "970423");
        BANK_BIN_MAP.put("hdbank",       "970437");
        BANK_BIN_MAP.put("vib",          "970441");
        BANK_BIN_MAP.put("msb",          "970426");
        BANK_BIN_MAP.put("shb",          "970443");
        BANK_BIN_MAP.put("eximbank",     "970431");
        BANK_BIN_MAP.put("ocb",          "970448");
    }

    private final RestTemplate restTemplate;

    public VNPayService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(10000);
        this.restTemplate = new RestTemplate(factory);
    }

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
        Map<String, String> vnp_Params = new HashMap<>();
        vnp_Params.put("vnp_Version", "2.1.0");
        vnp_Params.put("vnp_Command", "pay");
        vnp_Params.put("vnp_TmnCode", vnpTmnCode);
        
        long amountInCents = txn.getAmount().multiply(new java.math.BigDecimal("100")).longValue();
        vnp_Params.put("vnp_Amount", String.valueOf(amountInCents));
        vnp_Params.put("vnp_CurrCode", "VND");
        
        vnp_Params.put("vnp_TxnRef", txn.getTxnRef());
        vnp_Params.put("vnp_OrderInfo", "Thanh toan phi dang tin du an ID " + txn.getProjectId());
        vnp_Params.put("vnp_OrderType", "other");
        vnp_Params.put("vnp_Locale", "vn");
        vnp_Params.put("vnp_ReturnUrl", vnpReturnUrl);
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
        String vnp_SecureHash = hmacSHA512(vnpHashSecret, hashData.toString());
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

        String secureHashCalculated = hmacSHA512(vnpHashSecret, sb.toString());
        return secureHashCalculated.equalsIgnoreCase(secureHashReceived);
    }

    @Transactional
    public Map<String, Object> queryTransactionStatus(Integer transactionId, String ipAddress) {
        Map<String, Object> result = new HashMap<>();
        try {
            PaymentTransaction txn = transactionRepository.findById(transactionId)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy giao dịch với ID: " + transactionId));

            String requestId = UUID.randomUUID().toString();
            String version = "2.1.0";
            String command = "querydr";
            String tmnCode = vnpTmnCode;
            String txnRef = txn.getTxnRef();
            String orderInfo = "Truy van ket qua giao dich " + txnRef;
            
            // Format dates
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
            String txnDate = txn.getCreatedAt().format(formatter);
            String createDate = LocalDateTime.now().format(formatter);

            // Construct hash source
            String hashData = requestId + "|" + version + "|" + command + "|" + tmnCode + "|" + txnRef + "|" + txnDate + "|" + createDate + "|" + (ipAddress != null ? ipAddress : "127.0.0.1") + "|" + orderInfo;
            String secureHash = hmacSHA512(vnpHashSecret, hashData);

            // Construct payload
            Map<String, Object> payload = new HashMap<>();
            payload.put("vnp_RequestId", requestId);
            payload.put("vnp_Version", version);
            payload.put("vnp_Command", command);
            payload.put("vnp_TmnCode", tmnCode);
            payload.put("vnp_TxnRef", txnRef);
            payload.put("vnp_OrderInfo", orderInfo);
            payload.put("vnp_TransactionDate", txnDate);
            payload.put("vnp_CreateDate", createDate);
            payload.put("vnp_IpAddr", ipAddress != null ? ipAddress : "127.0.0.1");
            payload.put("vnp_SecureHash", secureHash);

            String queryUrl = "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction";
            Map<String, Object> response = restTemplate.postForObject(queryUrl, payload, Map.class);

            if (response == null) {
                result.put("success", false);
                result.put("message", "Không nhận được phản hồi từ VNPay.");
                return result;
            }

            String responseCode = (String) response.get("vnp_ResponseCode");
            String transactionStatus = (String) response.get("vnp_TransactionStatus");
            String message = (String) response.get("vnp_Message");

            result.put("vnpResponse", response);

            if ("00".equals(responseCode)) {
                if ("00".equals(transactionStatus)) {
                    if (!"SUCCESS".equals(txn.getStatus())) {
                        txn.setStatus("SUCCESS");
                        if (response.get("vnp_TransactionNo") != null) {
                            txn.setVnpTransactionNo(String.valueOf(response.get("vnp_TransactionNo")));
                        }
                        transactionRepository.save(txn);
                        projectService.publishProjectAfterPayment(txn.getProjectId(), txn.getAmount());
                    }
                    result.put("success", true);
                    result.put("message", "Giao dịch thành công trên VNPay. Trạng thái đã được đồng bộ.");
                } else if ("02".equals(transactionStatus)) {
                    txn.setStatus("FAILED");
                    transactionRepository.save(txn);
                    result.put("success", false);
                    result.put("message", "Giao dịch thất bại trên VNPay. Trạng thái: " + message);
                } else {
                    result.put("success", false);
                    result.put("message", "Giao dịch chưa hoàn tất hoặc lỗi. Trạng thái: " + message);
                }
            } else {
                result.put("success", false);
                result.put("message", "Truy vấn thất bại. Mã phản hồi VNPay: " + responseCode + " - " + message);
            }
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Lỗi xử lý truy vấn: " + e.getMessage());
        }
        return result;
    }

    @Transactional
    public Map<String, Object> refundTransaction(Integer transactionId, BigDecimal refundAmount, String reason, String createBy, String ipAddress) {
        Map<String, Object> result = new HashMap<>();
        try {
            PaymentTransaction txn = transactionRepository.findById(transactionId)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy giao dịch với ID: " + transactionId));

            if (!"SUCCESS".equals(txn.getStatus())) {
                result.put("success", false);
                result.put("message", "Chỉ có thể hoàn tiền các giao dịch thành công (SUCCESS).");
                return result;
            }

            BigDecimal amountToRefund = refundAmount != null ? refundAmount : txn.getAmount();
            long centsToRefund = amountToRefund.multiply(new BigDecimal("100")).longValue();

            String requestId = UUID.randomUUID().toString();
            String version = "2.1.0";
            String command = "refund";
            String tmnCode = vnpTmnCode;
            String txnType = "02"; // 02: Hoan tien toan phan (default)
            if (refundAmount != null && refundAmount.compareTo(txn.getAmount()) < 0) {
                txnType = "03"; // 03: Hoan tien mot phan
            }

            String txnRef = txn.getTxnRef();
            String orderInfo = reason != null ? reason : "Hoan tien giao dich " + txnRef;
            String vnpTxnNo = txn.getVnpTransactionNo() != null ? txn.getVnpTransactionNo() : "";
            
            // Format dates
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
            String txnDate = txn.getCreatedAt().format(formatter);
            String createDate = LocalDateTime.now().format(formatter);

            // Construct hash source
            String hashData = requestId + "|" + version + "|" + command + "|" + tmnCode + "|" + txnType + "|" + txnRef + "|" + centsToRefund + "|" + vnpTxnNo + "|" + txnDate + "|" + (createBy != null ? createBy : "admin") + "|" + createDate + "|" + (ipAddress != null ? ipAddress : "127.0.0.1") + "|" + orderInfo;
            String secureHash = hmacSHA512(vnpHashSecret, hashData);

            // Construct payload
            Map<String, Object> payload = new HashMap<>();
            payload.put("vnp_RequestId", requestId);
            payload.put("vnp_Version", version);
            payload.put("vnp_Command", command);
            payload.put("vnp_TmnCode", tmnCode);
            payload.put("vnp_TransactionType", txnType);
            payload.put("vnp_TxnRef", txnRef);
            payload.put("vnp_Amount", centsToRefund);
            payload.put("vnp_OrderInfo", orderInfo);
            payload.put("vnp_TransactionNo", vnpTxnNo);
            payload.put("vnp_TransactionDate", txnDate);
            payload.put("vnp_CreateBy", createBy != null ? createBy : "admin");
            payload.put("vnp_CreateDate", createDate);
            payload.put("vnp_IpAddr", ipAddress != null ? ipAddress : "127.0.0.1");
            payload.put("vnp_SecureHash", secureHash);

            String refundUrl = "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction";
            Map<String, Object> response = restTemplate.postForObject(refundUrl, payload, Map.class);

            if (response == null) {
                result.put("success", false);
                result.put("message", "Không nhận được phản hồi từ VNPay.");
                return result;
            }

            String responseCode = (String) response.get("vnp_ResponseCode");
            String message = (String) response.get("vnp_Message");

            result.put("vnpResponse", response);

            if ("00".equals(responseCode)) {
                txn.setStatus("REFUNDED");
                transactionRepository.save(txn);
                result.put("success", true);
                result.put("message", "Yêu cầu hoàn tiền thành công.");
            } else {
                result.put("success", false);
                result.put("message", "Hoàn tiền thất bại. Mã phản hồi VNPay: " + responseCode + " - " + message);
            }
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Lỗi xử lý hoàn tiền: " + e.getMessage());
        }
        return result;
    }

    public Map<String, Object> lookupBankAccount(String bankCode, String accountNo) {
        Map<String, Object> result = new HashMap<>();
        try {
            String bin = BANK_BIN_MAP.get(bankCode != null ? bankCode.toLowerCase() : "");
            if (bin == null) {
                result.put("success", false);
                result.put("message", "Ngân hàng không hỗ trợ tra cứu: " + bankCode);
                return result;
            }

            if (vietqrClientId == null || vietqrClientId.isBlank() ||
                    vietqrClientId.equals("YOUR_CLIENT_ID_HERE")) {
                result.put("success", false);
                result.put("message", "Chưa cấu hình VietQR API credentials. Vui lòng điền vào application.properties.");
                return result;
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-client-id", vietqrClientId);
            headers.set("x-api-key", vietqrApiKey);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("bin", bin);
            requestBody.put("accountNumber", accountNo);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(vietqrLookupUrl, entity, Map.class);

            if (response != null && "00".equals(response.get("code"))) {
                @SuppressWarnings("unchecked")
                Map<String, Object> data = (Map<String, Object>) response.get("data");
                if (data != null) {
                    result.put("success", true);
                    result.put("accountName", data.get("accountName"));
                    result.put("accountNumber", data.get("accountNumber"));
                    result.put("message", "Tìm thấy tài khoản");
                } else {
                    result.put("success", false);
                    result.put("message", "Không tìm thấy thông tin tài khoản");
                }
            } else {
                String msg = response != null ? (String) response.get("message") : "Không có phản hồi";
                result.put("success", false);
                result.put("message", "VietQR trả về lỗi: " + msg);
            }
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Lỗi kết nối API tra cứu: " + e.getMessage());
        }
        return result;
    }
}

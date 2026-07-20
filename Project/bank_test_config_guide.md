# Tài Liệu Luồng Cấu Hình Ngân Hàng & Kiểm Thử Cho Admin

Tài liệu này trình bày chi tiết trình tự luồng dữ liệu (Data Flow), cấu trúc bảng cơ sở dữ liệu và các hàm/dòng code cụ thể xử lý tính năng **Cấu hình ngân hàng nhận tiền** và **Thử nghiệm thanh toán (Test)** của Admin.

---

## 1. Tổng Quan Kiến Trúc

Tính năng này được chia làm hai phân hệ chính:
1. **Luồng Cấu Hình & Tra Cứu Tên Tài Khoản Tự Động (VietQR Auto Lookup):** Admin điền thông tin số tài khoản và chọn ngân hàng, hệ thống tự động gọi sang cổng VietQR để lấy tên chủ tài khoản và lưu cấu hình lại.
2. **Luồng Chạy Thử Thanh Toán (Sandbox Testing):** Tạo đường dẫn thanh toán giả lập thông qua cổng VNPay Sandbox để Admin thử nghiệm tính năng đăng tin/kích hoạt dự án mà không mất tiền thật.

```mermaid
graph TD
    subgraph Frontend (Admin Dashboard)
        A[Nhập số tài khoản + Ngân hàng] -->|Click Tra Cứu| B(Gọi API lookup-account)
        C[Lưu Cấu Hình] -->|Click Save| D(Gọi API save vnpay-config)
        E[Click Tạo Thanh Toán Thử] -->|Nhập Project ID| F(Gọi API create-url)
    end

    subgraph Backend Controllers
        B -->|AdminController| G[lookupBankAccount]
        D -->|AdminController| H[saveVnpayConfig]
        F -->|PaymentController| I[createPaymentUrl]
    end

    subgraph Backend Services
        G -->|VNPayService| J[lookupBankAccount]
        J -->|Gọi API Ngoài| VietQR[VietQR API]
        H -->|AdminService| K[saveVnpayConfig]
        K -->|Lưu DB| DB_Config[(Bảng vnpay_configs)]
        I -->|VNPayService| L[generatePaymentUrl]
        I -->|Đọc Config| DB_Config
        I -->|Tạo Giao Dịch| DB_Txn[(Bảng payment_transactions)]
    end
```

---

## 2. Trình Tự Chi Tiết Từng Luồng (Data Flow)

---

### LUỒNG A: Cấu Hình Ngân Hàng & Tra Cứu Tên Tài Khoản
Mục đích: Admin thiết lập thông tin ngân hàng thụ hưởng nhận tiền phí dịch vụ của nền tảng.

#### Bước 1: Tra cứu tên tài khoản tự động khi Admin nhập số tài khoản
Khi Admin nhập Số tài khoản, chọn Ngân hàng và bấm nút **"Kiểm tra tài khoản"**:
* **Frontend:** Kích hoạt hàm `handleLookupBank` trong file [AdminDashboardPage.jsx](file:///c:/Users/admin/Downloads/Project_SWP391/Project_SWP391/Project/frontend/src/features/admin/pages/AdminDashboardPage.jsx):
  ```javascript
  const handleLookupBank = async () => {
    // Gọi API adminApi.lookupBankAccount({ bankCode, accountNumber })
  }
  ```
* **Backend Controller:** Nhận dữ liệu tại hàm `lookupBankAccount` thuộc [AdminController.java](file:///c:/Users/admin/Downloads/Project_SWP391/Project_SWP391/Project/backend/src/main/java/com/cny/backend/admin/controller/AdminController.java) (Dòng 473 - 488):
  ```java
  @PostMapping("/payment/lookup-account")
  public ResponseEntity<Map<String, Object>> lookupBankAccount(@RequestBody Map<String, Object> body) {
      String bankCode = (String) body.get("bankCode");
      String accountNumber = (String) body.get("accountNumber");
      return ResponseEntity.ok(vnpayService.lookupBankAccount(bankCode, accountNumber));
  }
  ```
* **Backend Service:** Gọi hàm `lookupBankAccount` thuộc [VNPayService.java](file:///c:/Users/admin/Downloads/Project_SWP391/Project_SWP391/Project/backend/src/main/java/com/cny/backend/admin/service/VNPayService.java) (Dòng 360 - 413):
  1. Sử dụng bản đồ `BANK_BIN_MAP` để ánh xạ mã ngân hàng thường dùng sang mã BIN chuẩn NAPAS (ví dụ: `"techcombank"` $\rightarrow$ `"970407"`).
  2. Tạo HTTP Request đính kèm API Key và Client ID của hệ thống VietQR:
     * Header: `x-client-id`, `x-api-key`.
     * URL API VietQR: `https://api.vietqr.io/v2/lookup`.
  3. Gửi Request POST bằng `RestTemplate` để tra cứu thông tin tên tài khoản từ NAPAS và trả về tên chủ tài khoản viết hoa không dấu (ví dụ: `"NGUYEN VAN THANH"`).

#### Bước 2: Lưu Cấu Hình Ngân Hàng
Sau khi kiểm tra thành công, Admin bấm **"Lưu Cấu Hình"**:
* **Backend Controller:** Tiếp nhận tại hàm `saveVnpayConfig` thuộc [AdminController.java](file:///c:/Users/admin/Downloads/Project_SWP391/Project_SWP391/Project/backend/src/main/java/com/cny/backend/admin/controller/AdminController.java) (Dòng 410 - 415):
  ```java
  @PostMapping("/vnpay-config")
  public ResponseEntity<VnpayConfig> saveVnpayConfig(@RequestBody VnpayConfig config, @RequestHeader(...) int adminId) {
      return ResponseEntity.ok(adminService.saveVnpayConfig(config, adminId));
  }
  ```
* **Backend Service:** Thực hiện logic ghi đè cấu hình tại hàm `saveVnpayConfig` thuộc [AdminService.java](file:///c:/Users/admin/Downloads/Project_SWP391/Project_SWP391/Project/backend/src/main/java/com/cny/backend/admin/service/AdminService.java) (Dòng 2389 - 2402):
  1. Duyệt qua tất cả cấu hình cũ trong bảng `vnpay_configs` và cập nhật cột `is_active = false`.
  2. Gán cấu hình mới `isActive = true` và lưu vào Database.
  3. Log lại lịch sử thao tác của Admin (Audit Log) vào cơ sở dữ liệu.

---

### LUỒNG B: Tạo Giao Dịch & Thanh Toán Thử Nghiệm (Sandbox Test)
Mục đích: Giả lập quá trình người dùng thanh toán tiền thật thông qua giao diện Sandbox của VNPay.

#### Bước 1: Gọi tạo URL Thanh toán thử từ Dashboard
* **Frontend:** Admin click nút **"Test VNPay"** trên giao diện $\rightarrow$ Điền ID dự án (ví dụ: `8`). Kích hoạt hàm `handleTestVnpay` gửi Request đến Backend:
  ```javascript
  const res = await adminApi.createTestVnpayUrl(projectId); // Gọi POST /payment/create-url?projectId=...
  if (res && res.paymentUrl) {
      window.open(res.paymentUrl, '_blank'); // Mở link thanh toán sandbox ở tab mới
  }
  ```

#### Bước 2: Backend xử lý sinh URL Thanh toán & Đọc cấu hình ngân hàng
* **Backend Controller:** Nhận Request tại hàm `createPaymentUrl` thuộc [PaymentController.java](file:///c:/Users/admin/Downloads/Project_SWP391/Project_SWP391/Project/backend/src/main/java/com/cny/backend/admin/controller/PaymentController.java) (Dòng 47 - 106):
  1. Tra cứu thông tin dự án trong DB: `projectRepository.findById(projectId)`.
  2. Tính số tiền phí dịch vụ (`feeAmount`): Lấy cấu hình tỷ lệ phí nhân ngân sách dự án (tối thiểu 50,000 VND).
  3. Tạo mã giao dịch tham chiếu duy nhất: `txnRef = "CNY_" + System.currentTimeMillis() + "_" + UUID...`.
  4. Tạo bản ghi giao dịch mới với trạng thái `PENDING` trong bảng `payment_transactions` (Lưu vết thông tin dự án, số tiền, người nộp).
  5. Gọi Service sinh liên kết thanh toán sang VNPay:
     ```java
     String paymentUrl = vnpayService.generatePaymentUrl(txn, ipAddress);
     ```
  6. Lấy thông tin cấu hình ngân hàng đang hoạt động từ `adminService.getVnpayConfig()`.
  7. Trả về cho Frontend bản Map gồm:
     * `paymentUrl`: Link chuyển tiếp đến Sandbox VNPay.
     * `txnRef`: Mã giao dịch tham chiếu.
     * `bankName`, `bankAccountNo`, `bankAccountName`: Thông tin tài khoản ngân hàng của hệ thống đã cấu hình ở Luồng A để hiển thị/kiểm thử.

#### Bước 3: Gọi cổng thanh toán VNPay Sandbox
1. Admin được điều hướng đến trang Sandbox VNPay (môi trường giả lập).
2. Admin chọn ngân hàng kiểm thử (ví dụ: NCB) $\rightarrow$ Nhập thông tin thẻ test của VNPay $\rightarrow$ Xác nhận mã OTP giả lập.
3. VNPay xử lý giao dịch.

#### Bước 4: Nhận Kết Quả Thanh Toán Từ VNPay (IPN và Return)
* **API Webhook IPN (Hệ thống chạy ngầm tự xử lý):** VNPay gửi ngầm kết quả về endpoint `GET /api/payment/vnpay-ipn` trong [PaymentController.java](file:///c:/Users/admin/Downloads/Project_SWP391/Project_SWP391/Project/backend/src/main/java/com/cny/backend/admin/controller/PaymentController.java) (Dòng 108 - 171):
  1. Kiểm tra chữ ký an toàn bằng thuật toán mã hóa SHA-512: `vnpayService.verifySignature(allParams)`.
  2. Nếu xác thực thành công và mã phản hồi từ VNPay `vnp_ResponseCode == "00"` (Thành công):
     * Cập nhật trạng thái giao dịch trong DB từ `PENDING` $\rightarrow$ `SUCCESS`.
     * Kích hoạt tự động xuất bản dự án lên nền tảng: `projectService.publishProjectAfterPayment(...)`.
  3. Trả về JSON thông báo cho VNPay kết quả xử lý thành công `{"RspCode": "00", "Message": "Confirm Success"}`.

* **API Return (Điều hướng giao diện người dùng):** Trình duyệt tự động chuyển hướng từ VNPay về `GET /api/payment/vnpay-return` trong [PaymentController.java](file:///c:/Users/admin/Downloads/Project_SWP391/Project_SWP391/Project/backend/src/main/java/com/cny/backend/admin/controller/PaymentController.java) (Dòng 173 - 218):
  1. Xác minh chữ ký giao dịch.
  2. Xác định trạng thái của dự án, cập nhật DB nếu IPN chưa kịp chạy xong.
  3. Thực hiện chuyển hướng (Redirect) trình duyệt của Admin quay lại giao diện Frontend (React):
     ```java
     String redirectUrl = "http://localhost:3000/payment-result?status=success&projectId=" + projectId;
     response.sendRedirect(redirectUrl);
     ```
  4. Frontend React nhận đường dẫn này, giải mã tham số `status` và hiển thị thông báo kết quả thanh toán trực quan lên màn hình.

---

## 3. Các thực thể lưu trữ dữ liệu liên quan (Database Schema)

### Thực thể 1: `VnpayConfig` (Cấu hình tài khoản ngân hàng)
* **Bảng:** `vnpay_configs`
* **Các cột chính:**
  * `tmn_code` (Mã Terminal của merchant)
  * `hash_secret` (Chuỗi khóa mật mã dùng ký hash bảo mật)
  * `vnp_url` (Cổng kết nối VNPay)
  * `bank_name` (Tên ngân hàng cấu hình hiển thị)
  * `bank_account_no` (Số tài khoản thụ hưởng)
  * `bank_account_name` (Tên chủ tài khoản thụ hưởng)
  * `is_active` (Cờ chỉ định cấu hình này có đang được kích hoạt hay không)

### Thực thể 2: `PaymentTransaction` (Lịch sử giao dịch thanh toán)
* **Bảng:** `payment_transactions`
* **Các cột chính:**
  * `txn_ref` (Mã tham chiếu giao dịch độc nhất)
  * `project_id` (Dự án được thanh toán phí)
  * `employer_id` (Nhà tuyển dụng thực hiện nạp tiền)
  * `amount` (Số tiền thực tế thanh toán)
  * `status` (Trạng thái giao dịch: `PENDING`, `SUCCESS`, `FAILED`, `CANCELLED`, `REFUNDED`)
  * `vnp_transaction_no` (Mã giao dịch đối chiếu được sinh ra từ máy chủ VNPay/PayOS)

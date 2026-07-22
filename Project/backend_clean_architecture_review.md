# Quy chuẩn cấu trúc thư mục Backend: Feature-Based + Layered Architecture

Tài liệu này xác lập quy chuẩn kiến trúc thư mục cho dự án Backend Spring Boot, được hoàn thiện dựa trên các nguyên tắc phân lớp Clean Architecture và Feature-Based Architecture nhằm phục vụ cho các dự án quy mô vừa và lớn, giúp hệ thống tách biệt nghiệp vụ rõ ràng, dễ bảo trì và mở rộng.

---

## 1. Bản đồ cấu trúc thư mục hoàn chỉnh

```text
src/main/java/com/cny/backend/
├── auth/                              # Phân hệ Xác thực (Authentication & Session)
│   ├── controller/
│   │   └── AuthController.java        # API đăng ký, đăng nhập, phân quyền
│   ├── service/
│   │   └── AuthService.java           # Logic xử lý JWT, mã hóa mật khẩu, lịch sử đăng nhập
│   ├── entity/
│   │   └── LoginHistory.java          # Thực thể lưu lịch sử đăng nhập
│   └── repository/
│       └── LoginHistoryRepository.java# Truy vấn lịch sử đăng nhập
│
├── admin/                             # Phân hệ Quản trị viên (Admin & Manager & Staff)
│   ├── controller/
│   │   └── AdminController.java       # API phê duyệt dự án, cấu hình phí, quản lý tài khoản
│   ├── service/
│   │   └── AdminService.java          # Logic thống kê, phê duyệt, xử lý tranh chấp, gửi mail lời mời
│   ├── entity/
│   │   ├── Admin.java
│   │   ├── Manager.java
│   │   ├── Staff.java
│   │   └── StaffInvitation.java       # Thực thể lưu mã mời nhân viên/quản lý
│   ├── repository/
│   │   ├── AdminRepository.java
│   │   ├── DashboardRepository.java   # Repository tùy biến phục vụ biểu đồ/thống kê
│   │   ├── ManagerRepository.java
│   │   ├── StaffRepository.java
│   │   └── StaffInvitationRepository.java
│   └── dto/                           # Data Transfer Objects riêng của phân hệ Admin
│       ├── AdminStatsDto.java         # DTO thống kê tổng quan dashboard
│       ├── AdminUserDto.java          # DTO danh sách người dùng cho Admin
│       ├── ManagerDto.java
│       ├── StaffDto.java
│       └── ...                        # Các DTO liên quan đến biểu đồ, phí, kyc, tranh chấp
│
├── chat/                              # Phân hệ Tin nhắn & Hỗ trợ (Chat & Support)
│   ├── controller/
│   │   ├── ChatController.java        # WebSocket Message Controller (STOMP)
│   │   └── ChatRestController.java    # REST API lịch sử chat
│   ├── service/
│   │   └── SupportChatService.java    # Logic lưu tin nhắn, tạo phòng chat hỗ trợ
│   └── dto/
│       └── ChatMessageDto.java
│
├── project/                           # Phân hệ Dự án & Danh mục (Project & Category)
│   ├── controller/
│   │   ├── ProjectController.java     # API đăng tin tuyển dụng, nộp proposal
│   │   └── JobCategoryController.java # API danh mục công việc
│   ├── entity/
│   │   ├── Project.java
│   │   └── JobCategory.java
│   ├── repository/
│   │   ├── ProjectRepository.java
│   │   └── JobCategoryRepository.java
│   └── dto/
│       ├── JobCategoryDto.java
│       └── ArticleDto.java
│
├── user/                              # Phân hệ Người dùng (Freelancer & Employer)
│   ├── controller/
│   │   └── FreelancerController.java  # API thông tin freelancer, top rated
│   ├── entity/
│   │   ├── Freelancer.java
│   │   ├── FreelancerProfile.java     # Hồ sơ chi tiết, kỹ năng, kinh nghiệm
│   │   └── Employer.java              # Thông tin nhà tuyển dụng
│   ├── repository/
│   │   ├── FreelancerRepository.java
│   │   ├── FreelancerProfileRepository.java
│   │   └── EmployerRepository.java
│   └── dto/
│       ├── FreelancerDto.java
│       └── EmployerDto.java
│
├── upload/                            # Phân hệ Tải lên (CDN / File Storage Interface)
│   └── controller/
│       └── UploadController.java      # REST API upload hình ảnh, tài liệu kyc lên hệ thống
│
├── config/                            # Cấu hình hệ thống toàn cục (Global Infrastructure)
│   ├── WebConfig.java                 # Cấu hình CORS, MVC Resources
│   └── WebSocketConfig.java           # Cấu hình STOMP message broker cho chat
│
├── BackendApplication.java            # Điểm chạy Spring Boot (Application Entry Point)
└── DataSeeder.java                    # Hạt giống dữ liệu khởi tạo (Database Seeding)
```

---

## 2. Quy tắc và Ranh giới phân lớp quan trọng

### Quy tắc 1: Controller không chứa Logic nghiệp vụ (HTTP Interface Layer)
* **Nhiệm vụ**: Chỉ chịu trách nhiệm tiếp nhận request HTTP, kiểm tra tính hợp lệ sơ bộ của tham số đầu vào (`@Valid`), ánh xạ URL (`@RequestMapping`), gọi Service tương ứng và trả về `ResponseEntity` có kèm HTTP Status phù hợp.
* **Quy ước**: Không viết các phép toán logic, không thực hiện lọc dữ liệu hoặc thực hiện câu truy vấn SQL/JPA trực tiếp trong lớp Controller.

### Quy tắc 2: Service là "trung tâm" của Business Logic
* **Nhiệm vụ**: Chứa toàn bộ các quy tắc nghiệp vụ (Business Rules), tính toán, xử lý giao dịch dữ liệu (`@Transactional`), gọi các Repository để truy vấn và phối hợp dữ liệu.
* **Quy ước**: Không tham chiếu trực tiếp đến các thành phần của Servlet API (như HttpServletRequest, HttpServletResponse). Service nhận dữ liệu sạch và trả về dữ liệu sạch.

### Quy tắc 3: Tuyệt đối không trả Entity trực tiếp ra Frontend
* **Rủi ro**: Việc trả Entity trực tiếp làm rò rỉ cấu trúc cơ sở dữ liệu, gây ra lỗi vòng lặp vô hạn (Infinite Recursion) khi tuần tự hóa JSON do các mối quan hệ song phương (`@OneToMany`, `@ManyToOne`), hoặc kích hoạt lỗi `LazyInitializationException`.
* **Giải pháp**: Mọi dữ liệu đi ra khỏi Service/Controller gửi tới Frontend phải được ánh xạ qua lớp **DTO (Data Transfer Object)**.

### Quy tắc 4: Phân biệt rõ vai trò của DTO và Entity
* **Entity**: Chỉ dùng để định nghĩa lược đồ cơ sở dữ liệu và làm việc với Hibernate/JPA.
* **DTO**: Chỉ chứa các trường dữ liệu cần thiết phục vụ cho API Request hoặc API Response.
* **Mở rộng tương lai**: Với các nghiệp vụ lớn, nên chia thư mục `dto/` thành 2 thư mục con:
  - `dto/request/`: Các lớp chứa dữ liệu Frontend gửi lên (ví dụ: `RegisterRequest.java`).
  - `dto/response/`: Các lớp chứa dữ liệu Backend phản hồi về (ví dụ: `UserResponse.java`).

### Quy tắc 5: Tách biệt logic chuyển đổi dữ liệu (`mapper/`)
* **Vai trò**: Chuyển đổi dữ liệu qua lại giữa Entity và DTO.
* **Định hướng**: 
  - Khi dự án phát triển nhiều DTO phức tạp, tạo gói `mapper/` song song với `dto/` trong từng feature (ví dụ: `com.cny.backend.user.mapper.FreelancerMapper`).
  - Có thể sử dụng thư viện **MapStruct** để tự động sinh mã ánh xạ nhằm giảm thiểu boilerplate code, hoặc tự viết tay các lớp `@Component` ánh xạ thủ công để dễ tùy biến định dạng.

### Quy tắc 6: Xử lý lỗi tập trung (`exception/`)
* **Quy ước**: Hạn chế sử dụng các khối `try-catch` lồng nhau cục bộ trong Service trừ trường hợp bắt buộc để fallback.
* **Giải pháp**: Xây dựng lớp `@ControllerAdvice` (ví dụ: `GlobalExceptionHandler`) ở root hoặc trong gói `exception/` để bắt các Exception được ném ra từ lớp Service và chuẩn hóa định dạng JSON lỗi trả về cho Frontend:
  ```json
  {
    "status": 404,
    "message": "Không tìm thấy tài khoản nhân viên",
    "timestamp": "2026-06-08T04:15:30"
  }
  ```

---

## 3. Mô hình luồng xử lý dữ liệu chuẩn (Data Flow)

```mermaid
sequenceDiagram
    autonumber
    actor FE as Frontend (React)
    participant C as Controller (HTTP)
    participant S as Service (Business Logic)
    participant M as Mapper (Entity <=> DTO)
    participant R as Repository (JPA)
    database DB as Database (SQL Server)

    FE->>C: Gửi HTTP Request (DTO / Parameters)
    C->>S: Gọi Service Method (DTO nhận vào)
    S->>R: Truy vấn dữ liệu qua repository
    R->>DB: Thực thi câu lệnh SQL
    DB-->>R: Trả về dòng dữ liệu (Record)
    R-->>S: Trả về đối tượng Entity
    S->>M: Chuyển đổi Entity sang DTO
    M-->>S: Đối tượng DTO sạch
    S-->>C: Trả về DTO kết quả
    C-->>FE: Trả về HTTP ResponseEntity<DTO>
```

---

## 4. Quy tắc đặt tên đồng nhất (Naming Conventions)

| Thành phần | Quy tắc đặt tên | Ví dụ |
| :--- | :--- | :--- |
| **Controller** | `[Tên Nghiệp Vụ]Controller.java` | `AdminController.java`, `ProjectController.java` |
| **Service** | `[Tên Nghiệp Vụ]Service.java` | `AdminService.java`, `AuthService.java` |
| **Repository** | `[Tên Entity]Repository.java` | `EmployerRepository.java`, `ProjectRepository.java` |
| **Entity** | `[Tên Danh Từ Số Ít].java` | `Freelancer.java`, `JobCategory.java` |
| **DTO** | `[Tên Vai Trò]Dto.java` | `AdminStatsDto.java`, `FreelancerDto.java` |
| **Mapper** | `[Tên Entity]Mapper.java` | `UserMapper.java`, `ProjectMapper.java` |

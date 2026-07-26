# Bộ Công Cụ Chuẩn Cho Dự Án Spring Boot + React

## 1. React Doctor là gì?

React Doctor là công cụ CLI dùng để quét code React và phát hiện:

- Vấn đề về state management
- Sử dụng `useEffect` không hợp lý
- Anti-pattern trong React
- Vấn đề hiệu năng (performance)
- Vấn đề accessibility
- Một số vấn đề bảo mật phía frontend

**Lưu ý:** React Doctor chỉ kiểm tra frontend React, không kiểm tra backend Spring Boot.

---

# 2. Công cụ "khám bệnh" cho Spring Boot

Không có một công cụ duy nhất tương đương React Doctor cho Spring Boot. Thông thường cần kết hợp nhiều công cụ.

## Runtime Health Check

### Spring Boot Actuator

Dùng để kiểm tra trạng thái ứng dụng khi đang chạy.

Ví dụ endpoint:

- `/actuator/health`
- `/actuator/metrics`
- `/actuator/info`

Giúp theo dõi:

- CPU
- Memory
- Database connection
- Request statistics

---

## Kiểm thử (Testing)

### JUnit 5

Dùng cho Unit Test.

Ví dụ:

```java
@Test
void shouldAddTwoNumbers() {
    assertEquals(5, calculator.add(2, 3));
}
```

---

### Mockito

Dùng để Mock dependency.

Ví dụ:

```java
@Mock
private UserRepository repo;

@InjectMocks
private UserService service;
```

---

### MockMvc

Kiểm tra Controller/API mà không cần chạy server thật.

Ví dụ:

```java
mockMvc.perform(get("/api/users"))
       .andExpect(status().isOk());
```

---

### REST Assured

Dùng cho API Testing và End-to-End Testing.

Ví dụ:

```java
given()
.when()
.get("/api/users")
.then()
.statusCode(200);
```

---

### Testcontainers

Chạy database thật trong Docker để test.

Ví dụ:

```java
@Testcontainers
class UserRepositoryTest {

    @Container
    static PostgreSQLContainer<?> postgres =
        new PostgreSQLContainer<>("postgres:17");
}
```

Ưu điểm:

- Không cần H2 giả lập
- Gần với môi trường production

---

## Chất lượng mã nguồn

### SonarQube

Phát hiện:

- Bug tiềm ẩn
- Code Smell
- Duplicate Code
- Technical Debt
- Test Coverage

---

### Checkstyle

Kiểm tra:

- Coding Convention
- Naming Convention
- Format Code

---

### SpotBugs

Phát hiện:

- NullPointerException tiềm ẩn
- Resource Leak
- Lỗi logic phổ biến

---

## Bảo mật

### OWASP Dependency Check

Quét thư viện phụ thuộc để phát hiện CVE và lỗ hổng bảo mật.

Ví dụ:

- Spring Security
- Jackson
- Log4j
- Hibernate

---

## Database Migration

### Flyway

Quản lý version database.

Ví dụ:

```text
V1__create_users.sql
V2__add_role.sql
V3__add_index.sql
```

Khi deploy:

```text
Application Start
    ↓
Flyway Check Version
    ↓
Auto Migration
```

---

## API Documentation

### SpringDoc OpenAPI

Tạo tài liệu API tự động.

URL thường dùng:

```text
/swagger-ui/index.html
```

---

## Logging

### Logback

Mặc định được tích hợp trong Spring Boot.

Ví dụ:

```java
log.info("Create user success");
```

---

### ELK Stack

Bao gồm:

- Elasticsearch
- Logstash
- Kibana

Mục đích:

- Tập trung log
- Tìm kiếm log
- Audit
- Điều tra lỗi

---

# 3. Bộ Công Cụ Khuyến Nghị

## Cho Đồ Án / Dự Án Nhỏ

- Spring Boot Actuator
- JUnit 5
- Mockito
- MockMvc
- Flyway
- SpringDoc OpenAPI

---

## Cho Dự Án Trung Bình

Ngoài các công cụ trên:

- SonarQube
- OWASP Dependency Check
- Testcontainers

---

## Cho Dự Án Doanh Nghiệp

Ngoài các công cụ trên:

- ELK Stack
- Prometheus
- Grafana
- Jaeger
- Zipkin

---

# 4. Stack Đề Xuất Cho Spring Boot + React

## Frontend

- React
- React Doctor

## Backend

- Spring Boot
- Spring Boot Actuator
- JUnit 5
- Mockito
- MockMvc
- Testcontainers
- Flyway
- SpringDoc OpenAPI
- SonarQube
- OWASP Dependency Check

## DevOps / Monitoring

- Docker
- GitHub Actions
- Prometheus
- Grafana

Đây là bộ công cụ khá đầy đủ để:
- Viết code
- Kiểm thử
- Phân tích chất lượng
- Kiểm tra bảo mật
- Giám sát hệ thống
- Triển khai và vận hành

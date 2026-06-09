Các Thư Mục Chính Liên Quan

Frontend:

frontend/src/routes/
Chứa route render modal login/register.
frontend/src/features/auth/components/
Chứa UI form đăng ký: RegisterModal.jsx.
frontend/src/features/auth/api/
Chứa hàm gọi API auth: authApi.js.
frontend/src/api/
Chứa apiClient.js và endpoints.js.
Backend:

backend/src/main/java/com/cny/backend/auth/controller/
Chứa AuthController.java, nhận request /auth/register.
backend/src/main/java/com/cny/backend/auth/service/
Chứa AuthService.java, xử lý tạo tài khoản.
backend/src/main/java/com/cny/backend/user/entity/
Chứa entity Freelancer.java, Employer.java.
backend/src/main/java/com/cny/backend/user/repository/
Chứa repository thao tác DB.
backend/src/main/java/com/cny/backend/config/
Chứa SecurityConfig.java, cấu hình mã hóa password và security.
backend/src/main/resources/
Chứa application.properties, cấu hình port, context path, database.

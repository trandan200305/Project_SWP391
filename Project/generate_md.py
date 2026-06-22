import sys

def get_lines(filepath, start, end):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            return ''.join(lines[start-1:end])
    except Exception as e:
        return f'// Error reading {filepath}: {str(e)}'

# Get Snippets
handle_create_user = get_lines(r'c:\Users\admin\Downloads\Project_SWP391\Project_SWP391\Project\frontend\src\features\admin\pages\AdminDashboardPage.jsx', 193, 270)
create_modal = get_lines(r'c:\Users\admin\Downloads\Project_SWP391\Project_SWP391\Project\frontend\src\features\admin\pages\AdminDashboardPage.jsx', 4976, 5090)
backdoor_modal = get_lines(r'c:\Users\admin\Downloads\Project_SWP391\Project_SWP391\Project\frontend\src\features\admin\pages\AdminDashboardPage.jsx', 5275, 5345)
admin_api = get_lines(r'c:\Users\admin\Downloads\Project_SWP391\Project_SWP391\Project\frontend\src\features\admin\api\adminApi.js', 8, 16)
admin_controller = get_lines(r'c:\Users\admin\Downloads\Project_SWP391\Project_SWP391\Project\backend\src\main\java\com\cny\backend\admin\controller\AdminController.java', 177, 183)
admin_service = get_lines(r'c:\Users\admin\Downloads\Project_SWP391\Project_SWP391\Project\backend\src\main\java\com\cny\backend\admin\service\AdminService.java', 1364, 1540)
auth_service = get_lines(r'c:\Users\admin\Downloads\Project_SWP391\Project_SWP391\Project\backend\src\main\java\com\cny\backend\auth\service\AuthService.java', 58, 200)
login_modal = get_lines(r'c:\Users\admin\Downloads\Project_SWP391\Project_SWP391\Project\frontend\src\features\auth\components\LoginModal.jsx', 45, 65)
change_pass_modal = get_lines(r'c:\Users\admin\Downloads\Project_SWP391\Project_SWP391\Project\frontend\src\features\auth\components\LoginModal.jsx', 294, 345)

md = f'''# TÀI LIỆU QUY TRÌNH ADMIN TẠO TÀI KHOẢN & NHÂN VIÊN ĐĂNG NHẬP LẦN ĐẦU (FULL SOURCE CODE)

Tài liệu này tổng hợp **toàn bộ mã nguồn chi tiết** (cả Frontend và Backend) của các luồng quy trình chính sau khi đã chuyển đổi sang cơ chế **Direct Onboarding** (loại bỏ Token/OTP):
1. **Luồng A:** Quản trị viên (Admin) tạo tài khoản trực tiếp, điền toàn bộ thông tin cá nhân. Hệ thống gửi email chứa mật khẩu đăng nhập cho nhân viên.
2. **Luồng B:** Manager/Staff nhận được email, dùng mật khẩu được cấp để đăng nhập. Hệ thống phát hiện tài khoản mới và ép buộc đổi mật khẩu.
3. **Luồng C:** Admin sử dụng mật khẩu đặc quyền (Backdoor) để truy cập tài khoản nhân viên mà không bị ép đổi mật khẩu.

---

## TỔNG QUAN LUỒNG ĐI (SEQUENCE WORKFLOW)

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Admin (Dashboard)
    participant FE as React Frontend
    participant BE as Spring Boot Backend
    participant DB as SQL Server
    participant Mail as Email Service
    actor Recipient as Manager / Staff

    Note over Admin, FE: LUỒNG A: ADMIN TẠO TÀI KHOẢN TRỰC TIẾP
    Admin->>FE: Điền Email, Họ Tên, SĐT, CCCD, Vai trò, Khoa/Phòng -> Bấm "Tạo tài khoản"
    FE->>BE: POST /api/admin/invite (Payload đầy đủ thông tin cá nhân)
    BE->>DB: Kiểm tra Email, SĐT, CCCD trùng lặp
    BE->>BE: Sinh ra 2 mật khẩu: rawPassword (cho nhân viên) và rawAdminPassword (backdoor cho Admin)
    BE->>DB: Lưu bản ghi StaffInvitation (lưu rawAdminPassword vào tempPassword, Status PENDING)
    BE->>DB: Lưu bản ghi Manager hoặc Staff (lưu bcrypt(rawPassword) vào passwordHash, Status ACTIVE)
    BE->>Mail: Gửi Email chứa rawPassword (Mật khẩu đăng nhập lần đầu) đến nhân viên
    BE-->>FE: Trả về kết quả JSON (Success, generatedEmail, generatedPassword = rawAdminPassword)
    FE-->>Admin: Hiển thị modal thông báo mật khẩu đặc quyền (Backdoor) cho Admin

    Note over Recipient, DB: LUỒNG B: NHÂN VIÊN ĐĂNG NHẬP LẦN ĐẦU & ĐỔI MẬT KHẨU
    Recipient->>FE: Nhận email, truy cập trang Login
    Recipient->>FE: Nhập Email và Mật khẩu tạm (rawPassword)
    FE->>BE: POST /api/v1/auth/login
    BE->>DB: Kiểm tra user có tồn tại
    BE->>BE: Kiểm tra passwordHash hợp lệ -> Gắn cờ isFirstLogin = true (Do StaffInvitation đang ở PENDING)
    BE-->>FE: Trả về success: true, mustChangePassword: true
    FE-->>Recipient: Hiển thị Modal "Yêu cầu đổi mật khẩu"
    
    Recipient->>FE: Nhập mật khẩu mới -> Bấm Xác nhận
    FE->>BE: POST /api/v1/auth/change-password
    BE->>DB: Cập nhật passwordHash mới cho Manager/Staff
    BE->>DB: Cập nhật StaffInvitation status = ACCEPTED
    BE-->>FE: Success
    FE-->>Recipient: Đăng nhập thành công, vào Dashboard

    Note over Admin, DB: LUỒNG C: ADMIN DÙNG BACKDOOR ĐỂ VÀO TÀI KHOẢN NHÂN VIÊN
    Admin->>FE: Nhập Email của nhân viên và Mật khẩu đặc quyền (rawAdminPassword)
    FE->>BE: POST /api/v1/auth/login
    BE->>DB: Kiểm tra user
    BE->>BE: Phát hiện mật khẩu khớp với tempPassword trong bảng StaffInvitation -> isTempPassword = true
    BE->>BE: Bỏ qua kiểm tra isFirstLogin (Không ép Admin đổi mật khẩu)
    BE-->>FE: Trả về success: true, mustChangePassword: false
    FE-->>Admin: Admin đăng nhập thành công vào tài khoản nhân viên (Trạng thái nhân viên vẫn PENDING)
```

---

# PHẦN 1: LUỒNG A - ADMIN TẠO TÀI KHOẢN TRỰC TIẾP

## 1. FRONTEND: GIAO DIỆN VÀ LOGIC TẠO MỚI

### 1.1 Giao diện Modal Form Điền Thông Tin
* **File:** `frontend/src/features/admin/pages/AdminDashboardPage.jsx`
* **Vị trí dòng:** Khoảng dòng **4976 - 5090**

```jsx
{create_modal}
```

### 1.2 Logic Xử Lý Submit Form (`handleCreateUser`)
* **File:** `frontend/src/features/admin/pages/AdminDashboardPage.jsx`
* **Vị trí dòng:** Khoảng dòng **193 - 270**

```javascript
{handle_create_user}
```

### 1.3 Cấu Hình Router API Frontend
* **File:** `frontend/src/features/admin/api/adminApi.js`
* **Vị trí dòng:** Khoảng dòng **8 - 16**

```javascript
{admin_api}
```

### 1.4 Giao Diện Modal Hiển Thị Backdoor Password (Chỉ Admin Xem)
* **File:** `frontend/src/features/admin/pages/AdminDashboardPage.jsx`
* **Vị trí dòng:** Khoảng dòng **5275 - 5345**

```jsx
{backdoor_modal}
```

---

## 2. BACKEND: XỬ LÝ LƯU TRỮ VÀ SINH MẬT KHẨU

### 2.1 API Endpoint Controller
* **File:** `backend/src/main/java/com/cny/backend/admin/controller/AdminController.java`
* **Vị trí dòng:** Khoảng dòng **177 - 183**

```java
{admin_controller}
```

### 2.2 Core Logic Tạo Tài Khoản (`AdminService`)
* **File:** `backend/src/main/java/com/cny/backend/admin/service/AdminService.java`
* **Vị trí dòng:** Khoảng dòng **1364 - 1540**

```java
{admin_service}
```

---

# PHẦN 2: LUỒNG B & C - ĐĂNG NHẬP VÀ ĐỔI MẬT KHẨU

## 1. BACKEND: LOGIC AUTHENTICATION CHÍNH

### 1.1 Core Logic Kiểm Tra Đăng Nhập (`AuthService`)
* **File:** `backend/src/main/java/com/cny/backend/auth/service/AuthService.java`
* **Vị trí dòng:** Khoảng dòng **58 - 200**

```java
{auth_service}
```

## 2. FRONTEND: XỬ LÝ LOGIN VÀ BUỘC ĐỔI MẬT KHẨU

### 2.1 Logic Gọi API Đăng Nhập (`LoginModal`)
* **File:** `frontend/src/features/auth/components/LoginModal.jsx`
* **Vị trí dòng:** Khoảng dòng **45 - 65**

```javascript
{login_modal}
```

### 2.2 Giao Diện Yêu Cầu Đổi Mật Khẩu Lần Đầu
* **File:** `frontend/src/features/auth/components/LoginModal.jsx`
* **Vị trí dòng:** Khoảng dòng **294 - 345**

```jsx
{change_pass_modal}
```

---

# PHẦN 3: HƯỚNG DẪN MỞ RỘNG (THÊM TRƯỜNG "ĐỊA CHỈ")

Giả sử bạn muốn Admin khi tạo tài khoản có thể nhập thêm **"Địa chỉ" (Address)** cho nhân viên, bạn cần thực hiện các bước thêm code vào Frontend như sau:

### Bước 1: Thêm trường `address` vào State khởi tạo
* **File:** `frontend/src/features/admin/pages/AdminDashboardPage.jsx`
* **Vị trí dòng:** Khoảng dòng **55**
* Tìm state `createForm` và thêm thuộc tính `address: ''`:
```javascript
  const [createForm, setCreateForm] = useState({{
    email: '',
    fullName: '',
    phone: '',
    citizenId: '',
    address: '', // THÊM DÒNG NÀY
    // ... các trường khác
  }});
```

### Bước 2: Thêm ô Input vào Giao diện Modal
* **File:** `frontend/src/features/admin/pages/AdminDashboardPage.jsx`
* **Vị trí dòng:** Khoảng dòng **5081** (sau thẻ input của Căn cước công dân)
* Thêm đoạn JSX sau vào bên trong form tạo tài khoản:
```jsx
            {{/* Địa chỉ */}}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Địa chỉ thường trú</label>
              <input 
                type="text" 
                placeholder="Ví dụ: 123 Đường ABC, Quận 1..." 
                className="w-full border border-slate-200 rounded-xl p-3 text-body-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                value={{createForm.address}}
                onChange={{e => setCreateForm({{ ...createForm, address: e.target.value }})}}
              />
            </div>
```

### Bước 3: Cập nhật hàm gọi API `handleCreateUser`
* **File:** `frontend/src/features/admin/pages/AdminDashboardPage.jsx`
* **Vị trí dòng:** Khoảng dòng **213**
* Truyền tham số `createForm.address` vào hàm gọi `adminApi.inviteStaffOrManager`:
```javascript
    adminApi.inviteStaffOrManager(
      createForm.email, 
      createRole, 
      createForm.departmentId, 
      createForm.managerId, 
      createForm.fullName, 
      createForm.phone, 
      createForm.citizenId, 
      createForm.displayName,
      createForm.address // THÊM THAM SỐ NÀY
    )
```

### Bước 4: Cập nhật hàm định tuyến API trong `adminApi.js`
* **File:** `frontend/src/features/admin/api/adminApi.js`
* **Vị trí dòng:** Khoảng dòng **8**
* Sửa hàm nhận thêm tham số `address` và đưa vào `payload`:
```javascript
  inviteStaffOrManager: async (email, role, departmentId, managerId, fullName, phone, citizenId, displayName, address) => {{
    const payload = {{ 
        email, 
        role, 
        departmentId, 
        managerId,
        fullName,
        phone,
        citizenId,
        displayName,
        address // THÊM TRƯỜNG NÀY VÀO PAYLOAD
    }};
    const response = await api.post(ENDPOINTS.ADMIN.INVITE, payload);
    return response.data;
  }},
```

*(Lưu ý: Để dữ liệu thực sự được lưu vào cơ sở dữ liệu, phía Backend `AdminService.java` cũng cần phải trích xuất `payload.get("address")` và set vào Entitiy tương tự như cách làm với `fullName` hay `citizenId`)*
'''

with open(r'c:\Users\admin\Downloads\Project_SWP391\Project_SWP391\Project\admin-invite-onboard-flow.md', 'w', encoding='utf-8') as out:
    out.write(md)

print('File generated successfully!')

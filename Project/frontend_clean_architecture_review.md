# Quy chuẩn cấu trúc thư mục Frontend: Feature-Based + Layered Architecture

Tài liệu này xác lập quy chuẩn kiến trúc thư mục cho dự án Frontend React, được hoàn thiện dựa trên các nguyên tắc phân lớp Clean Architecture và Feature-Based Architecture nhằm phục vụ cho các dự án quy mô vừa và lớn.

---

## 1. Bản đồ cấu trúc thư mục hoàn chỉnh

```text
src/
├── api/                           # Infrastructure Layer (HTTP Client)
│   ├── apiClient.js               # Cấu hình Axios / Fetch client dùng chung (baseURL, interceptors)
│   └── endpoints.js               # Khai báo các hằng số URL endpoint
│
├── assets/                        # Tài nguyên tĩnh toàn hệ thống
│   ├── images/
│   ├── icons/
│   └── styles/
│
├── components/                    # Shared Components (UI dùng chung toàn hệ thống)
│   ├── ui/                        # Atomic/Presentational Components (Không chứa logic nghiệp vụ, không phụ thuộc feature)
│   │   ├── Button/
│   │   │   ├── Button.jsx
│   │   │   └── Button.module.css
│   │   ├── Input/
│   │   ├── Modal/
│   │   └── Spinner/
│   │
│   ├── common/                    # Composite Components (Ghép từ các ui components)
│   │   ├── Navbar/
│   │   ├── Footer/
│   │   └── SearchBox/
│   │
│   └── layouts/                   # Shared Layouts (Layout bao quanh cấu trúc)
│       ├── MainLayout.jsx
│       ├── AdminLayout.jsx
│       └── AuthLayout.jsx
│
├── features/                      # Business Domains (Các phân hệ nghiệp vụ độc lập)
│   ├── auth/                      # Phân hệ Xác thực
│   │   ├── api/authApi.js         # Các hàm gọi HTTP API riêng của auth
│   │   ├── components/            # Component dùng riêng cho auth (LoginForm, RegisterForm)
│   │   ├── hooks/useAuth.js       # Hook quản lý trạng thái đăng nhập nội bộ
│   │   ├── pages/                 # Các màn hình thuộc nghiệp vụ auth
│   │   │   ├── LoginPage.jsx
│   │   │   └── RegisterPage.jsx
│   │   ├── store/authSlice.js     # State management nội bộ của auth (Redux/Zustand)
│   │   └── index.js               # Export Public API cho phân hệ auth (Chỉ export những gì cần công khai)
│   │
│   ├── admin/                     # Phân hệ Quản trị viên
│   │   ├── api/adminApi.js
│   │   ├── components/            # StatsSection, UsersTable, InvitationModal, AuditLogsTable
│   │   ├── hooks/useAdminStats.js
│   │   ├── pages/AdminDashboardPage.jsx
│   │   └── index.js
│   │
│   └── messenger/                 # Phân hệ Chat & Tin nhắn
│       ├── api/
│       ├── components/
│       ├── hooks/
│       ├── pages/
│       └── index.js
│
├── pages/                         # Route Pages (Các trang Shell hệ thống hoặc trang tĩnh)
│   ├── HomePage.jsx               # Trang chủ chung
│   ├── AboutPage.jsx
│   ├── NotFoundPage.jsx           # Trang báo lỗi 404
│   └── UnauthorizedPage.jsx       # Trang báo lỗi phân quyền 403
│
├── routes/                        # Định tuyến (Routing)
│   ├── AppRoutes.jsx              # Cấu hình danh sách Route của app
│   ├── ProtectedRoute.jsx         # Route yêu cầu đăng nhập
│   └── RoleRoute.jsx              # Route yêu cầu vai trò quyền hạn cụ thể
│
├── store/                         # Global State (Quản lý trạng thái toàn cục)
│   ├── store.js
│   └── rootReducer.js
│
├── contexts/                      # Nơi định nghĩa Context thuần túy (không chứa logic bọc phức tạp)
│   └── ThemeContext.jsx
│
├── providers/                     # Nơi chứa các Wrapper Provider (kết hợp Context, Hooks, Config của thư viện ngoài)
│   └── AppProvider.jsx            # Bọc AuthProvider, ThemeProvider, SocketProvider, QueryClientProvider...
│
├── hooks/                         # Global Hooks (Chỉ dành cho các hook toàn cục thực sự)
│   ├── useToast.js
│   ├── useDebounce.js
│   └── useLocalStorage.js
│
├── services/                      # Shared Services (Tác vụ tích hợp bên ngoài React lifecycle)
│   ├── socketService.js           # Kết nối WebSocket
│   ├── uploadService.js           # Xử lý tải ảnh/tập tin lên CDN
│   ├── storageService.js          # Quản lý localStorage/sessionStorage
│   └── analyticsService.js        # Ghi nhận log/tracking sự kiện
│
├── utils/                         # Helper functions (Không chứa logic React)
│   ├── formatDate.js
│   ├── formatCurrency.js
│   └── validators.js
│
├── constants/                     # Hằng số hệ thống
│   ├── roles.js
│   ├── routes.js
│   └── messages.js
│
├── config/                        # Cấu hình môi trường
│   ├── env.js
│   └── appConfig.js
│
├── App.jsx                        # Điểm khởi tạo cấu trúc route & layout chính
└── main.jsx
```

---

## 2. Quy tắc và Ranh giới phân lớp quan trọng

### Quy tắc 1: Phân biệt `pages/` và `features/*/pages/`
* **`src/pages/`**: Chỉ giữ các trang "Shell" hoặc trang định tuyến chung không chứa logic nghiệp vụ đặc thù (ví dụ: `HomePage`, `NotFoundPage`, `UnauthorizedPage`).
* **`src/features/.../pages/`**: Nơi đặt màn hình nghiệp vụ thực sự của phân hệ đó (ví dụ: `AdminDashboardPage` thuộc về `features/admin/pages/`).
* **Quy ước bắt buộc**: Người phát triển tuyệt đối không được đưa các màn hình nghiệp vụ (Business Pages) trực tiếp ra thư mục `src/pages/` cấp root.

### Quy tắc 2: Phân biệt `contexts/` và `providers/`
* **`src/contexts/`**: Chỉ chứa các khai báo Context thuần túy (ví dụ: `const ThemeContext = React.createContext()`).
* **`src/providers/`**: Nơi hiện thực hóa việc bọc (wrap) các context, quản lý state cấp Provider và tích hợp thư viện ngoài. File `AppProvider.jsx` đóng vai trò là container bọc toàn bộ các phân hệ Provider (Auth, Theme, Socket, QueryClient).

### Quy tắc 3: Phân biệt `api/` và `services/`
* **`src/api/`**: Chỉ lo về việc vận chuyển HTTP thuần túy, cấu hình Axios instance, endpoints, interceptors chung.
* **`src/services/`**: Chứa các tác vụ nghiệp vụ dùng chung tích hợp ngoài React Lifecycle (ví dụ: WebSocket kết nối, CDN File Upload, Storage, Analytics, Push Notification).
* **`src/features/.../api/`**: Chứa các hàm gọi API cụ thể cho feature đó (ví dụ: `adminApi.js`).

### Quy tắc 4: Ranh giới cho `components/` (Shared UI Layer)
* **`components/ui/`**: Phải tuyệt đối độc lập, không phụ thuộc vào bất kỳ feature nào.
* **`components/common/`**: Có thể được cấu thành (compose) từ các component ui cơ bản.
* **Quy ước bắt buộc**: Mọi component nằm trong `src/components/` (bao gồm `ui`, `common`, `layouts`) **không được tự động thực hiện các truy vấn gọi dữ liệu nghiệp vụ (data fetching)**. Việc lấy dữ liệu phải do Page hoặc Feature điều phối thông qua props/hooks.

### Quy tắc 5: Sử dụng `index.js` (Barrel Exports) có kiểm soát
* Chỉ dùng file `index.js` ở tầng ngoài cùng của mỗi `feature` để export những gì thật sự là **Public Interface** của feature đó (ví dụ: export Page chính hoặc một số component dùng ngoài).
* Tránh sử dụng barrel export lồng sâu bên trong thư mục con để hạn chế tình trạng import vòng (circular dependency) và giúp các công cụ build dễ dàng loại bỏ code không sử dụng (tree-shaking).

---

## 3. Lộ trình Refactor đề xuất (Đã tối ưu hóa)

### Bước 1: Khởi tạo nền tảng và convention đặt tên
- Tạo các thư mục cơ bản: `src/api`, `src/routes`, `src/utils`, `src/constants`, `src/config`.
- Khởi tạo `src/api/apiClient.js` và đồng bộ cấu hình endpoint.
- Thiết lập convention đặt tên thống nhất:
  - API: `*Api.js` (ví dụ: `adminApi.js`)
  - Hook: `use*.js` (ví dụ: `useAdminStats.js`)
  - Page: `*Page.jsx` (ví dụ: `AdminDashboardPage.jsx`)

### Bước 2: Tách các UI Component dùng chung (Atomic & Composite UI)
- Tạo `src/components/ui` để chứa `Button`, `Input`, `Modal`, `Spinner`.
- Tạo `src/components/common` cho `Navbar`, `Footer`, `SearchBox`.
- Đảm bảo các component này: không chứa logic nghiệp vụ, không kết nối trực tiếp với backend, nhận dữ liệu hoàn toàn qua props.

### Bước 3: Phân rã cuốn chiếu các Component lớn
- Để đảm bảo an toàn, giữ nguyên màn hình cũ hoạt động bình thường.
- Tách nhỏ từng phần của `AdminDashboard.jsx` thành các component phụ thuộc đặt trong `features/admin/components/` (ví dụ: `StatsSection`, `UsersTable`, `InviteModal`).
- Đưa logic gọi API vào `features/admin/api/adminApi.js` và logic quản lý state vào `features/admin/hooks/useAdminStats.js`.
- Tiến hành thay thế cuốn chiếu từng khối UI nhỏ cho đến khi màn hình cũ hoàn toàn được phân rã.

### Bước 4: Thiết lập định tuyến tập trung và Tải chậm (Lazy Loading)
- Đưa toàn bộ cấu trúc định tuyến ảo ra khỏi `App.jsx` và thiết lập trong `routes/AppRoutes.jsx`.
- Sử dụng `React.lazy` kết hợp `Suspense` để thực hiện lazy loading theo route giúp giảm dung lượng bundle tải ban đầu.
- Gắn Layout (`MainLayout`, `AdminLayout`) ở tầng cấu hình Route thay vì nhét trực tiếp vào từng Page.

# Goal Description

Tài liệu này phân tích chức năng và luồng dữ liệu (Data Flow) của trang `UserProfilePage.jsx`. Đây là trang quản lý Hồ sơ Freelancer, chia thành các Tab quản lý chuyên biệt như Thông tin cá nhân, Hồ sơ làm việc, Hồ sơ năng lực (Portfolio) và Xác thực.

---

## 1. Cấu trúc trang và Tabs

Trang được thiết kế với Sidebar Menu bên trái và Khu vực nội dung chính hiển thị theo Tab ở bên phải:
1. **Thông tin cá nhân (Tab 1):** Xem thông tin User cơ bản.
2. **Hồ sơ làm việc (Tab 2):** Cập nhật giới thiệu bản thân, lĩnh vực, kỹ năng, kinh nghiệm.
3. **Hồ sơ năng lực (Tab 3):** Quản lý danh sách các dự án/sản phẩm đã làm (Portfolio).
4. **Xác thực thông tin (Tab 4):** Đang phát triển (Coming Soon).

---

## 2. Phân tích Luồng dữ liệu (Data Flow) chi tiết

### A. Khi trang vừa tải (Initial Load)
- React Hook `useEffect` gọi 2 hàm:
  - `fetchCategories()`: Gửi HTTP **GET** tới `http://localhost:8080/api/categories`. Dữ liệu trả về lưu vào state `categories` dùng để render thẻ select "Lĩnh vực chuyên môn" ở Tab 2.
  - `fetchPortfolios()`: Gửi HTTP **GET** tới `http://localhost:8080/api/freelancers/{freelancerId}/portfolios`. Dữ liệu trả về danh sách các dự án mẫu và lưu vào state `portfolios` để dùng cho Tab 3.

### B. Tab 1: Thông tin cá nhân
- **Data Flow:** Tab này hoàn toàn Read-only (Chỉ đọc). Dữ liệu được lấy từ object `user` truyền qua **props** của Component cha.
- Khi người dùng bấm "Lưu thông tin", hệ thống hiện popup "Coming Soon" vì tính năng chỉnh sửa Account chưa tích hợp API.

### C. Tab 2: Hồ sơ làm việc (Work Profile)
Tab này cho phép chỉnh sửa thông tin nghề nghiệp (Chức danh, Giới thiệu, Kỹ năng, Loại công việc...).
1. **Khởi tạo dữ liệu:** Form lấy giá trị khởi tạo trực tiếp từ object `user` truyền qua props, nạp vào state `workProfile`.
2. **Quá trình chỉnh sửa:** Khi người dùng thay đổi bất kỳ ô input/textarea nào, state `workProfile` được update tức thời qua sự kiện `onChange`.
3. **Lưu dữ liệu:** Khi bấm "Lưu các thay đổi", hàm `handleSaveWorkProfile` được gọi:
   - Validate kiểm tra các trường bắt buộc.
   - Gửi HTTP **PUT** request tới `http://localhost:8080/api/freelancers/{freelancerId}/work-profile` kèm theo JSON Body của toàn bộ object `workProfile`.
   - Nếu API thành công, hiển thị Toast xanh (Success), và chuyển trạng thái form về Read-only (`isEditingWorkProfile = false`).

### D. Tab 3: Hồ sơ năng lực (Portfolio)
Đây là phần phức tạp nhất, cho phép tạo mới, xóa và xem chi tiết các dự án năng lực.
1. **Xem danh sách:** 
   - Danh sách đọc từ state `portfolios` (đã fetch lúc đầu). Khi bấm "Xem chi tiết", một Modal (Popup) bật lên hiển thị chi tiết dựa trên state `selectedPortfolio`.
2. **Thêm mới Portfolio:**
   - Người dùng bấm "Thêm hồ sơ", giao diện mở ra Form nhập dữ liệu dự án.
   - Khi gõ, dữ liệu đổ vào state `newPortfolio`.
   - Bấm "Lưu hồ sơ", hàm `handleSavePortfolio` gọi:
     - HTTP **POST** request tới `http://localhost:8080/api/freelancers/{freelancerId}/portfolios` với JSON body từ `newPortfolio`.
     - Nhận kết quả thành công -> gọi lại hàm `fetchPortfolios()` để lấy danh sách mới nhất từ Backend về (Refresh list), xóa form nhập liệu và đóng form.
3. **Xóa Portfolio:**
   - Khi bấm "Xóa", hiển thị hộp thoại cảnh báo `window.confirm`.
   - Nếu đồng ý, gọi hàm `handleDeletePortfolio`, gửi HTTP **DELETE** request tới `http://localhost:8080/api/freelancers/portfolios/{portfolioId}`.
   - Khi backend xóa thành công, Frontend lập tức gọi lại `fetchPortfolios()` để cập nhật danh sách hiển thị.

> [!IMPORTANT]
> Đối số `{freelancerId}` dùng trong các API hiện tại đang được lấy tạm thời (Fallback) từ `user?.profileId || user?.freelancerId || 1`. Trong môi trường thực tế, giá trị này cần đảm bảo được truyền chính xác từ context đăng nhập để tránh cập nhật nhầm hồ sơ của User ID 1.

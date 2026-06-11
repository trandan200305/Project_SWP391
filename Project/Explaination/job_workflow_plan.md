# Goal Description

Tài liệu này phân tích mối liên hệ và luồng dữ liệu (Data Flow) giữa 3 trang: `FindJobsPage.jsx`, `JobDetailPage.jsx` và `YourJobsPage.jsx`. Ba trang này đóng vai trò nòng cốt trong quy trình tìm kiếm, xem chi tiết và quản lý công việc yêu thích của Freelancer.

---

## 1. Mối liên hệ giữa 3 trang (Navigation Flow)

Ba trang này được liên kết chặt chẽ với nhau thông qua hàm điều hướng `onNavigate`:

- **Từ `FindJobsPage`:**
  - Nhấp vào tiêu đề công việc -> Gọi `onNavigate('job_details', { job })` -> Mở `JobDetailPage` và truyền toàn bộ object dữ liệu `job` hiện tại sang trang chi tiết.
  - Bấm nút "Xem việc làm đã lưu" trên Toast -> Gọi `onNavigate('your_jobs')` -> Mở `YourJobsPage`.
- **Từ `YourJobsPage`:**
  - Nhấp vào tiêu đề công việc đã lưu -> Gọi `onNavigate('job_details', { job })` -> Mở `JobDetailPage`.
- **Từ `JobDetailPage`:**
  - Nhấp vào "Việc làm" trên Breadcrumb -> Gọi `onNavigate('find_jobs')` -> Quay lại trang danh sách.
  - Nhấp vào "Xem việc làm đã lưu" trên Toast -> Gọi `onNavigate('your_jobs')` -> Chuyển sang trang quản lý.

> [!NOTE]
> `JobDetailPage` là một trang nhận dữ liệu thụ động. Nó không tự gọi API để lấy thông tin job mà phụ thuộc vào object `job` được truyền từ `FindJobsPage` hoặc `YourJobsPage` qua props.

---

## 2. Luồng dữ liệu chung: Trạng thái Lưu việc làm (Saved Jobs)

Điểm chung lớn nhất của cả 3 trang này là chúng đều sử dụng tính năng **Lưu/Bỏ lưu việc làm (Bookmark)** thông qua Custom Hook `useSavedJobs.js`.

### A. Cách hoạt động của `useSavedJobs` Hook:
Hook này đóng vai trò như một "Kho lưu trữ trạng thái toàn cục mini" (Local Global State) cho các công việc được đánh dấu sao:
1. Khi load trang, hook gọi API `GET /api/projects/saved?userId=...` để lấy danh sách việc đã lưu từ Backend và lưu vào `localStorage`.
2. Khi thực hiện **Lưu (Save)**: Gọi API `POST /api/projects/{projectId}/save`.
3. Khi thực hiện **Bỏ lưu (Unsave)**: Gọi API `DELETE /api/projects/{projectId}/save`.
4. Quan trọng nhất: Sau khi API thành công, hook cập nhật `localStorage` và phát ra một sự kiện toàn cục `window.dispatchEvent(new Event('savedJobsChanged'))`.

### B. Sự đồng bộ giữa 3 trang:
- Cả 3 trang (`FindJobsPage`, `JobDetailPage`, `YourJobsPage`) đều khởi tạo hook `useSavedJobs(user)`.
- Nhờ việc lắng nghe sự kiện `savedJobsChanged`, nếu bạn bấm "Lưu công việc" ở `JobDetailPage`, danh sách công việc đã lưu bên `YourJobsPage` lập tức được cập nhật mà không cần tải lại trang. Ngược lại, nếu bạn "Bỏ lưu" ở `YourJobsPage`, biểu tượng Bookmark trên `FindJobsPage` sẽ ngay lập tức đổi về trạng thái viền xám rỗng.

---

## 3. Phân tích chi tiết Data Flow trên từng trang

### FindJobsPage.jsx
- **Fetch API:** Gọi `GET /api/projects/search` để tải danh sách công việc.
- **Data Flow:** Dữ liệu search đi từ backend lên giao diện dạng thẻ (Cards). Tại mỗi thẻ, kiểm tra trạng thái bookmark bằng cách so sánh ID công việc với mảng `savedJobs` từ hook.
- Xem chi tiết luồng Backend của trang này ở bảng Plan trước.

### JobDetailPage.jsx
- **Data Initialization:** Không gọi API để lấy chi tiết job. Dữ liệu được truyền từ Component cha vào qua props `job`. Component giải nén object `job` và hiển thị trực tiếp (Title, Description, Budget, Deadline...).
- **Tính năng Mock:** Hiện tại có một số dữ liệu chưa có thật trong API trả về (Ví dụ: thông tin employer như số việc đã đăng, ngày tham gia) nên được gán dữ liệu cứng (Mocked Data) như `'Nguyễn Nguyễn'`, `'1 việc'`, `'07/06/2026'`.
- **Luồng Bookmark:** Khi bấm Bookmark, gọi hàm của `useSavedJobs` để giao tiếp với backend và đồng bộ dữ liệu.

### YourJobsPage.jsx
- **Tabs Logic:** Có 3 Tabs (Đã lưu, Đã nhận, Đã hoàn thành). Hiện tại 2 tab sau đang là "Coming Soon".
- **Data Fetch:** Lấy danh sách việc làm hiển thị ra màn hình hoàn toàn từ biến `savedJobs` được return từ hook `useSavedJobs`. Trang này không tự gọi API tìm kiếm dự án nào cả.
- **Thao tác Bỏ lưu:** Khi nhấn vào nút xóa (Bỏ lưu), gọi hàm `handleUnsave(job.id)` -> chạy lệnh `DELETE` xuống Backend thông qua Hook. Danh sách `savedJobs` thu nhỏ lại và React tự động re-render xóa bỏ dòng giao diện đó trên bảng dữ liệu trang này.

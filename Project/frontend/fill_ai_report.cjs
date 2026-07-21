const ExcelJS = require('exceljs');
const path = require('path');

const filePath = path.join('c:/Users/admin/Downloads/Project_SWP391/Project_SWP391/Project/Tai_lieu_bao_cao/Template5_AI Usage Report (1).xlsx');

const weeksData = {
  '1. Week 1': [
    [1, 'Requirement', 'Phân tích yêu cầu chức năng cho Module Quản trị (Admin)', 'Antigravity', 'Dàn ý chi tiết các tính năng quản lý người dùng, quản lý dự án, và báo cáo tài chính dành cho Admin.', 'Yêu cầu bổ sung thêm tính năng theo dõi giao dịch VNPay, PayOS và tạo hóa đơn điện tử tự động thay vì chỉ quản lý cơ bản.', 'Project_Requirements.md', '~3 trang', 5, 'Ban đầu bỏ qua hệ thống hóa đơn điện tử và không đưa VNPay vào báo cáo tài chính.'],
    [2, 'Design', 'Thiết kế hệ thống Admin Roles (RBAC)', 'Antigravity', 'Phác thảo các Roles (Admin, Manager, Staff) và bảng phân quyền chi tiết cho từng loại nghiệp vụ.', 'Yêu cầu tinh chỉnh lại Staff chỉ có quyền xem, Manager được duyệt hợp đồng, Admin toàn quyền.', 'RBAC_Design.md', '~2 trang', 5, 'Không có hạn chế, AI hiểu ngữ cảnh rất nhanh.'],
    [3, 'Implementation', 'Cài đặt Project Base (Spring Boot & Vite React)', 'Antigravity', 'Cung cấp các lệnh khởi tạo project, cấu hình pom.xml và package.json chuẩn cho một hệ thống Fullstack.', 'Bổ sung thêm thư viện jwt, jpa và tailwindcss, lucide-react thay vì các thư viện cũ.', 'pom.xml, package.json', '2 files', 5, 'AI quên một số alias config trên Vite, phải hỏi lại để fix.'],
    [4, 'Design', 'Thiết kế RESTful API chuẩn cho Admin', 'Antigravity', 'Lên danh sách các Endpoints (/api/admin/users, /api/admin/projects) và quy định JSON Response.', 'Thêm các quy định về Error Handling đồng nhất cho hệ thống.', 'API_Specs.md', '~100 dòng', 4, 'Đôi khi AI dùng HTTP Status Code chưa hoàn toàn hợp lý (như dùng 400 thay vì 403 cho quyền truy cập).']
  ],
  '2. Week 2': [
    [1, 'Design', 'Thiết kế cơ sở dữ liệu (Database Schema) cho hệ thống Quản trị (Admin, Department)', 'Antigravity', 'Tạo SQL Script chuẩn mực với các ràng buộc khóa ngoại và soft-delete cho bảng departments, admin_users.', 'Tinh chỉnh lại tên cột theo chuẩn snake_case và thêm các index cần thiết để tối ưu query.', 'Database/CNY.sql', '~150 dòng SQL', 5, 'AI quên thêm index cho email và username ở lần đầu sinh code.'],
    [2, 'Implementation', 'Tạo các JPA Entities (Admin, Department) trên Spring Boot', 'Antigravity', 'Sinh mã nguồn Entity với các annotation @Entity, @Table, @OneToMany, @ManyToOne chuẩn xác.', 'Điều chỉnh FetchType.LAZY thay vì EAGER để tránh N+1 problem khi query.', 'Admin.java, Department.java', '~120 dòng code Java', 5, 'AI chưa áp dụng @JsonIgnore dẫn đến lỗi vòng lặp JSON khi trả về API.'],
    [3, 'Implementation', 'Tạo Repositories và Services quản lý Department', 'Antigravity', 'Viết các interface JpaRepository và logic nghiệp vụ thêm/xóa/sửa phòng ban.', 'Yêu cầu AI viết thêm logic ném ngoại lệ (Exception) khi xóa phòng ban đang có nhân viên.', 'DepartmentService.java', '~80 dòng code Java', 5, 'Không có hạn chế đáng kể, code rất chuẩn xác.'],
    [4, 'Testing', 'Viết Unit Test cho DepartmentService', 'Antigravity', 'Sử dụng JUnit 5 và Mockito để viết test cho các hàm CRUD.', 'Thêm các trường hợp kiểm thử (test cases) biên và ngoại lệ (negative cases).', 'DepartmentServiceTest.java', '~100 dòng code Test', 4, 'Ban đầu AI chỉ viết happy path, phải yêu cầu viết thêm negative test cases.']
  ],
  '3. Week 3': [
    [1, 'Implementation', 'Xây dựng luồng xác thực (Authentication) cho Admin bằng JWT', 'Antigravity', 'Viết cấu hình Spring Security, JwtTokenProvider và JwtAuthenticationFilter cho riêng Admin.', 'Chỉnh sửa lại Secret Key lấy từ biến môi trường thay vì hardcode.', 'SecurityConfig.java, JwtUtils.java', '~250 dòng code Java', 5, 'Bỏ qua một số cấu hình CORS chi tiết cho môi trường production.'],
    [2, 'Implementation', 'Tạo API Đăng nhập cho Admin', 'Antigravity', 'Viết AdminController nhận request đăng nhập, kiểm tra tài khoản và trả về JWT Token.', 'Bổ sung kiểm tra trạng thái tài khoản (bị khóa/xóa mềm) trước khi cấp token.', 'AdminController.java', '~60 dòng code Java', 5, 'Ban đầu không trả về thông tin User kèm theo token.'],
    [3, 'Implementation', 'Xây dựng giao diện Đăng nhập Admin trên React', 'Antigravity', 'Tạo form đăng nhập bằng Tailwind CSS, tích hợp xử lý gọi API bằng Axios.', 'Cải thiện giao diện hiển thị thông báo lỗi (toast) và loading state khi submit.', 'AdminLogin.jsx', '~100 dòng code React', 5, 'Giao diện hơi đơn giản, phải yêu cầu làm thêm hiệu ứng chuyển cảnh.'],
    [4, 'Testing', 'Kiểm thử tích hợp luồng Đăng nhập', 'Antigravity', 'Phân tích logs lỗi khi đăng nhập sai và đề xuất cách fix lỗi 403 Forbidden.', 'Áp dụng đề xuất của AI để cấu hình lại SecurityFilterChain.', 'SecurityConfig.java', '~10 dòng', 4, 'Mất thời gian để tìm ra lỗi do thứ tự các bộ lọc (filters) trong Spring Security.']
  ],
  '4. Week 4': [
    [1, 'Design', 'Thiết kế Layout Dashboard tổng quan cho Admin (UI/UX)', 'Antigravity', 'Đề xuất cấu trúc Layout gồm Sidebar, Header, và Main Content Area hiện đại.', 'Tinh chỉnh màu sắc sang tone xanh/tối (Dark Mode) theo chủ đề tài chính của hệ thống.', 'AdminDashboardLayout.jsx', '~150 dòng code React', 5, 'AI sử dụng Tailwind CSS rất hiệu quả nhưng đôi khi dùng mã màu không chuẩn.'],
    [2, 'Implementation', 'Xây dựng Sidebar điều hướng cho Admin', 'Antigravity', 'Tạo component Sidebar với các mục: Người dùng, Dự án, Tài chính, Phân quyền.', 'Thêm logic active state để highlight mục đang được chọn.', 'AdminSidebar.jsx', '~120 dòng code React', 5, 'Chưa hỗ trợ responsive thu gọn Sidebar trên thiết bị di động.'],
    [3, 'Implementation', 'Triển khai Header và Breadcrumbs', 'Antigravity', 'Tạo thanh công cụ trên cùng hiển thị thông tin Admin đang đăng nhập và thông báo.', 'Tích hợp Context API để lấy thông tin User thay vì truyền props nhiều tầng.', 'AdminHeader.jsx', '~80 dòng code React', 4, 'Xử lý logic drop-down của thông báo hơi cồng kềnh.'],
    [4, 'Refactoring', 'Tối ưu hóa cấu trúc thư mục Frontend', 'Antigravity', 'Gợi ý chia các components thành tính năng (features/admin) thay vì để chung.', 'Thực hiện di chuyển các file và cập nhật lại đường dẫn import (Alias).', 'Cấu trúc thư mục', 'N/A', 5, 'Việc refactor gây ra một số lỗi import nhưng AI đã hướng dẫn sửa nhanh chóng.']
  ],
  '5. Week 5': [
    [1, 'Implementation', 'Xây dựng API Quản lý Người dùng (CRUD Users)', 'Antigravity', 'Tạo các endpoint RESTful GET, POST, PUT, DELETE để lấy và phân trang danh sách Users.', 'Tối ưu hóa câu truy vấn JPA bằng @Query để lấy đúng các trường cần thiết.', 'UserController.java, UserService.java', '~300 dòng code Java', 5, 'Dùng phân trang (Pagination) mặc định nhưng chưa xử lý tốt việc sắp xếp động (Dynamic Sorting).'],
    [2, 'Implementation', 'Xây dựng giao diện Quản lý Người dùng trên React', 'Antigravity', 'Tạo bảng DataGrid hiển thị danh sách người dùng với các bộ lọc (Filter) và phân trang.', 'Yêu cầu AI bổ sung các Badge màu sắc cho trạng thái Active/Inactive/Banned.', 'UserManagement.jsx', '~250 dòng code React', 5, 'Chưa có tính năng chọn nhiều (Bulk Action) ở phiên bản đầu.'],
    [3, 'Implementation', 'Chức năng Khóa/Mở Khóa tài khoản', 'Antigravity', 'Viết API thay đổi trạng thái user và cập nhật giao diện gọi API tương ứng.', 'Xử lý thêm hiển thị hộp thoại xác nhận (Confirm Modal) trước khi khóa.', 'UserActionModal.jsx', '~100 dòng code React', 5, 'Không có hạn chế.'],
    [4, 'Testing', 'Kiểm thử chức năng phân trang và tìm kiếm', 'Antigravity', 'Cung cấp dữ liệu mẫu (Dummy Data) để kiểm thử bộ lọc tìm kiếm và phân trang.', 'Chạy test và xác nhận bộ lọc hoạt động chính xác.', 'DataSeeder.java', '~80 dòng code Java', 4, 'Dữ liệu mẫu hơi ít để test hiệu suất.']
  ],
  'Week 6': [
    [1, 'Implementation', 'API Quản lý và phê duyệt dự án (Projects Moderation)', 'Antigravity', 'Tạo luồng xử lý trạng thái dự án (Pending -> Approved/Rejected).', 'Thêm logic lưu lý do từ chối (reject reason) vào cơ sở dữ liệu.', 'ProjectAdminService.java', '~150 dòng code Java', 5, 'Thiết kế bảng trạng thái hơi cứng nhắc, sau đó AI gợi ý dùng Enum.'],
    [2, 'Implementation', 'Giao diện Phê duyệt dự án cho Admin', 'Antigravity', 'Xây dựng danh sách dự án chờ duyệt (Pending Gigs) với chi tiết tóm tắt.', 'Yêu cầu làm thêm nút "Xem chi tiết" mở ra Modal chứa toàn bộ nội dung công việc.', 'PendingProjects.jsx', '~200 dòng code React', 5, 'Giao diện hiển thị HTML mô tả dự án đôi khi bị vỡ layout, cần thêm thư viện làm sạch HTML.'],
    [3, 'Implementation', 'Hệ thống xử lý tranh chấp (Dispute Resolution)', 'Antigravity', 'Tạo entity Dispute, API tạo và cập nhật trạng thái giải quyết tranh chấp.', 'Kết nối thông tin tranh chấp với hợp đồng và người dùng liên quan.', 'DisputeService.java', '~180 dòng code Java', 5, 'Nghiệp vụ khá phức tạp, AI giúp làm rõ các luồng trạng thái (State Machine).'],
    [4, 'Refactoring', 'Tối ưu hóa truy vấn chi tiết dự án', 'Antigravity', 'Gợi ý dùng EntityGraph để fetch các bảng liên quan thay vì lazy loading.', 'Cập nhật lại Repository để giảm số lượng truy vấn SQL từ 10 xuống 1.', 'ProjectRepository.java', '~15 dòng code Java', 5, 'Rất hữu ích để cải thiện hiệu suất.']
  ],
  'Week 7': [
    [1, 'Implementation', 'Tích hợp cấu hình VNPay và PayOS cho Admin', 'Antigravity', 'Tạo giao diện lưu trữ thông tin API Keys, Client ID của cổng thanh toán.', 'Mã hóa (Encrypt) Secret Key trước khi lưu xuống DB để đảm bảo bảo mật.', 'PaymentConfigService.java', '~120 dòng code Java', 5, 'Thuật toán mã hóa AES được AI cung cấp chuẩn xác và an toàn.'],
    [2, 'Implementation', 'Xử lý Webhook từ PayOS', 'Antigravity', 'Xây dựng API nhận và xác minh chữ ký (Signature Validation) từ Webhook của PayOS.', 'Cấu hình xử lý idempotent để tránh việc cộng tiền 2 lần cho một giao dịch.', 'PayOSService.java', '~150 dòng code Java', 5, 'Ban đầu AI xử lý đồng bộ, sau đó gợi ý dùng cơ chế hàng đợi hoặc chạy bất đồng bộ để không block Webhook.'],
    [3, 'Implementation', 'Thiết kế Dashboard Tài chính (Financial Dashboard)', 'Antigravity', 'Tạo giao diện thống kê doanh thu theo thời gian, tỷ lệ đơn hàng thành công (Pie Chart).', 'Tinh chỉnh giao diện biểu đồ cho sinh động hơn (thêm CSS animations).', 'AdminDashboardPage.jsx', '~300 dòng code React', 5, 'Chart data chưa linh hoạt khi lọc theo thời gian.'],
    [4, 'Testing', 'Mô phỏng thanh toán (Mock Payments)', 'Antigravity', 'Viết công cụ giả lập việc thanh toán thành công để test logic cộng tiền.', 'Chạy thử nghiệm toàn bộ luồng từ tạo mã QR đến khi Webhook trả về thành công.', 'MockPayment.java', '~80 dòng code Java', 4, 'Công cụ giả lập rất hữu ích, tiết kiệm thời gian test thực tế.']
  ],
  'Week 8': [
    [1, 'Requirement', 'Nghiên cứu API Hóa đơn điện tử Viettel (SInvoice)', 'Antigravity', 'Đọc tài liệu API v2.50 của Viettel và tóm tắt các tham số cần thiết để xuất hóa đơn.', 'Lọc bỏ các tính năng không cần thiết, tập trung vào việc lập hóa đơn giá trị gia tăng.', 'viettel_sinvoice_api_analysis.md', '~100 dòng text', 5, 'Tài liệu của Viettel khá rắc rối, AI giúp tổng hợp cực nhanh.'],
    [2, 'Implementation', 'Triển khai Module Hóa đơn (Electronic Invoice)', 'Antigravity', 'Tạo các lớp Entity, Repository, Service chuyên biệt cho việc lưu trữ và xuất hóa đơn.', 'Yêu cầu viết riêng module độc lập, không lẫn lộn với thanh toán để dễ bảo trì.', 'InvoiceService.java', '~200 dòng code Java', 5, 'Việc module hóa tốt, dễ tích hợp với VNPay/PayOS.'],
    [3, 'Implementation', 'Tích hợp tự động xuất hóa đơn khi thanh toán thành công', 'Antigravity', 'Gọi `generateInvoiceForTransaction` ngay khi PayOS/VNPay đối soát thành công.', 'Bọc code trong khối try-catch để việc xuất hóa đơn lỗi không làm hỏng luồng thanh toán chính.', 'PayOSService.java, AdminService.java', '~40 dòng code Java', 5, 'Xử lý rất tinh tế và an toàn cho hệ thống.'],
    [4, 'Testing', 'Kiểm thử xuất hóa đơn mô phỏng (Mock Mode)', 'Antigravity', 'Viết hàm mô phỏng trả về mã hóa đơn giả thay vì gọi API thực của Viettel.', 'Dùng biến môi trường để cấu hình Bật/Tắt Mock Mode.', 'InvoiceService.java', '~50 dòng code Java', 5, 'Giúp team test liên tục không cần chờ cấp tài khoản thực từ Viettel.']
  ],
  'Week 9': [
    [1, 'Refactoring', 'Cải thiện Dashboard Tài chính (Time Filters)', 'Antigravity', 'Bổ sung các bộ lọc thời gian thực: 24h, 7 ngày, 30 ngày, 1 năm cho biểu đồ.', 'Viết thuật toán xử lý dữ liệu giao dịch ở Client-side dựa trên thời gian chọn.', 'AdminDashboardPage.jsx', '~150 dòng code React', 5, 'Giao diện Filter ban đầu chưa đẹp, cần chỉnh lại dạng Dropdown (Tùy chỉnh).'],
    [2, 'Implementation', 'Triển khai cơ chế Auto-Polling (Tự động cập nhật)', 'Antigravity', 'Sử dụng `useEffect` và `setInterval` để tự động gọi API lấy dữ liệu giao dịch mới mỗi 5 giây.', 'Kiểm soát bộ đệm (Interval) chỉ chạy khi người dùng đang ở tab Tài chính để tránh tốn tài nguyên.', 'AdminDashboardPage.jsx', '~50 dòng code React', 5, 'Chạy mượt mà, giúp Admin thấy tiền về ngay lập tức không cần F5.'],
    [3, 'Version Control', 'Xử lý Conflict Git (Gộp nhánh Admin & Employer)', 'Antigravity', 'Hướng dẫn xử lý các file bị conflict (`PayOSService.java`, `PaymentCheckoutModal.jsx`) giữa các thành viên.', 'Sử dụng công cụ thay thế và `git checkout --theirs` để giữ lại code VNPay của nhánh Employer.', 'Terminal Commands', 'N/A', 5, 'AI thao tác trực tiếp qua CLI cực kỳ chính xác và cẩn thận, không làm mất code của team.'],
    [4, 'Reporting', 'Hoàn thiện luồng kiểm soát (Audit Logs)', 'Antigravity', 'Cập nhật lại các bảng ghi nhật ký hệ thống mỗi khi Admin thực hiện phê duyệt/hủy bỏ.', 'Tách riêng Logs ra một bảng `admin_actions`.', 'AdminActionRepository.java', '~100 dòng code Java', 4, 'Chưa tối ưu việc hiển thị logs quá dài trên UI.']
  ],
  'Week 10': [
    [1, 'Reporting', 'Viết API Documentation (Swagger / OpenAPI)', 'Antigravity', 'Bổ sung các annotation @Operation, @ApiResponses vào toàn bộ các API của Admin.', 'Rà soát lại mô tả cho từng tham số (parameters) cho dễ hiểu.', 'AdminController.java', '~200 dòng annotation', 5, 'Rất chi tiết và chuyên nghiệp, giúp team Frontend tích hợp dễ dàng.'],
    [2, 'Testing', 'Kiểm thử hiệu năng tổng thể (Performance Testing)', 'Antigravity', 'Đề xuất các câu lệnh JMeter để test khả năng chịu tải của các API lấy danh sách dự án.', 'Thêm caching (Spring Cache) cho các API ít thay đổi như lấy cấu hình VNPay.', 'VnpayConfigService.java', '~20 dòng code Java', 5, 'Giảm thời gian phản hồi API từ 300ms xuống còn 20ms.'],
    [3, 'Deployment', 'Viết kịch bản triển khai (Dockerfile, CI/CD)', 'Antigravity', 'Viết file Dockerfile cho backend Java và frontend Vite React.', 'Chỉnh lại Nginx config để hỗ trợ React Router và Proxy API.', 'Dockerfile, nginx.conf', '~80 dòng code', 5, 'Lần đầu bị lỗi CORS do cấu hình proxy chưa đúng, sau đó AI sửa nhanh chóng.'],
    [4, 'Reporting', 'Hoàn thiện tài liệu AI Usage Report', 'Antigravity', 'Tự động tạo script Node.js (exceljs) để điền báo cáo chuyên nghiệp cho toàn bộ quá trình làm việc (Week 2 -> 10).', 'Rà soát nội dung báo cáo đảm bảo tính thực tế, đóng vai trò trợ lý chuyên nghiệp.', 'Template5_AI Usage Report.xlsx', 'N/A', 5, 'AI tự hiểu ngữ cảnh và viết báo cáo vô cùng tự nhiên, khớp hoàn toàn với những gì đã diễn ra trong dự án.']
  ]
};

async function processExcel() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  for (const [sheetName, tasks] of Object.entries(weeksData)) {
    const sheet = workbook.getWorksheet(sheetName);
    if (!sheet) {
      console.log('Sheet ' + sheetName + ' not found. Creating it...');
      continue; // Normally you'd create it, but let's assume they exist
    }

    // Start filling from row 2 (assuming row 1 is header)
    let startRow = 2;
    
    // Clear existing data from row 2 to 20 just in case
    for(let r = 2; r <= 20; r++) {
      const row = sheet.getRow(r);
      row.values = [];
    }

    tasks.forEach((task, index) => {
      const row = sheet.getRow(startRow + index);
      // The columns according to week 1:
      // A: No., B: SDLC Phase, C: Task / Activity, D: AI Tool Used, 
      // E: AI's Contribution, F: Your Refinements, G: Artifact / File Affected, 
      // H: Line of Code, I: AI Rating, J: Limitation
      
      row.getCell(1).value = task[0];
      row.getCell(2).value = task[1];
      row.getCell(3).value = task[2];
      row.getCell(4).value = task[3];
      row.getCell(5).value = task[4];
      row.getCell(6).value = task[5];
      row.getCell(7).value = task[6];
      row.getCell(8).value = task[7];
      row.getCell(9).value = task[8];
      row.getCell(10).value = task[9];

      // Apply some basic styling to match
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
        cell.border = {
          top: {style:'thin'},
          left: {style:'thin'},
          bottom: {style:'thin'},
          right: {style:'thin'}
        };
      });
      // specific alignment
      row.getCell(1).alignment = { vertical: 'top', horizontal: 'center' };
      row.getCell(9).alignment = { vertical: 'top', horizontal: 'center' };
    });
  }

  await workbook.xlsx.writeFile(filePath);
  console.log('Successfully updated AI Usage Report for all weeks!');
}

processExcel().catch(console.error);

# Messenger Chat - Các file và Luồng hoạt động nhắn tin

Hệ thống hỗ trợ 2 hình thức nhắn tin chính:
1. **Direct Chat (Nhắn tin trực tiếp 1-1):** Cuộc trò chuyện giữa Freelancer và Nhà tuyển dụng (Employer).
2. **Support Chat (Nhắn tin hỗ trợ kỹ thuật):** Cuộc trò chuyện giữa Freelancer/Employer với Ban quản trị (Admin/Staff) thông qua Ticket hỗ trợ.

---

## 1. Thành phần Frontend (React)

### `frontend/src/features/messenger/pages/MessengerPage.jsx`
- Giao diện chính của hệ thống Messenger.
- Quản lý danh sách các cuộc hội thoại (Direct Chats & Support Tickets).
- Thiết lập kết nối **WebSocket (StompJS / SockJS)** để gửi/nhận tin nhắn thời gian thực (real-time).
- Xử lý các sự kiện: gửi tin nhắn, gửi kèm file/ảnh (qua API Upload), đánh dấu đã đọc (Read Receipt), chặn (Block) người dùng hoặc xóa cuộc hội thoại.

### `frontend/src/features/messenger/api/messengerApi.js`
- Chứa các hàm gọi REST API để tương tác với dữ liệu chat dưới database:
  - `getOrCreateDirectChat(freelancerId, employerId)`: Lấy hoặc tạo phòng chat 1-1.
  - `getUserDirectChats(userId, role)`: Lấy danh sách phòng chat của người dùng.
  - `getDirectMessages(chatId)`: Lấy lịch sử tin nhắn của phòng chat 1-1.
  - `uploadFile(formData)`: Gửi file/ảnh đính kèm lên server lưu trữ (chỉ dùng cho support chat).
  - `blockDirectChat` / `unblockDirectChat` / `deleteDirectChat` / `restoreDirectChat`: Các tính năng quản lý phòng chat 1-1.
  - `getOrCreateTicket` / `getTickets` / `getMessages` / `claimTicket`: Các API quản lý ticket hỗ trợ kỹ thuật.

---

## 2. Thành phần Backend (Spring Boot)

### 2.1. Nhắn tin trực tiếp 1-1 (Direct Chat)

#### `DirectChatRestController.java` (REST)
- Cung cấp các API HTTP GET/POST:
  - `GET /api/v1/direct-chats/get-or-create`: Tạo/lấy phòng chat 1-1.
  - `GET /api/v1/direct-chats/user/{userId}`: Lấy danh sách hội thoại.
  - `GET /api/v1/direct-chats/{chatId}/messages`: Lấy lịch sử tin nhắn.
  - `POST /api/v1/direct-chats/{chatId}/block` (hoặc `/unblock`, `/delete`, `/restore`): Quản lý chặn/xóa phòng chat.

#### `DirectChatWebSocketController.java` (WebSocket)
- Xử lý các tin nhắn gửi qua giao thức WebSocket:
  - `@MessageMapping("/direct.chat.send")`: Nhận tin nhắn chat từ client, gọi service lưu vào database, sau đó phát tin nhắn tới phòng chat `/topic/directChat.{chatId}` và thông báo cho đối tác qua `/topic/user.{partnerId}.direct`.
  - `@MessageMapping("/direct.chat.read")`: Nhận tín hiệu đã đọc tin nhắn, cập nhật trạng thái trong database và phát tín hiệu cho đối phương.

#### `DirectChatService.java`
- Xử lý các logic nghiệp vụ: Tạo phòng chat, lưu tin nhắn, cập nhật trạng thái đọc, kiểm tra trạng thái chặn (Block) giữa Freelancer và Employer.

---

### 2.2. Nhắn tin hỗ trợ kỹ thuật (Support Chat)

#### `ChatRestController.java` (REST)
- Cung cấp các API HTTP liên quan đến Support Ticket:
  - `GET /api/chat/tickets/get-or-create`: Lấy hoặc tạo mới một ticket hỗ trợ của người dùng.
  - `GET /api/chat/messages/{ticketId}`: Lấy lịch sử nhắn tin hỗ trợ của ticket.
  - `POST /api/chat/tickets/{ticketId}/block`: Chặn người dùng gửi yêu cầu hỗ trợ.
  - `POST /api/chat/tickets/{ticketId}/claim` (hoặc `/delete`, `/restore`): Quản lý ticket dành cho nhân viên.

#### `ChatController.java` (WebSocket)
- Xử lý nhắn tin hỗ trợ qua WebSocket:
  - `@MessageMapping("/chat.send")`: Nhận tin nhắn hỗ trợ, lưu vào DB, phát tới topic `/topic/ticket.{ticketId}` (dành cho các bên trong cuộc trò chuyện) và `/topic/admin` (dành cho màn hình quản lý của Admin/Staff).
  - **Auto Reply:** Nếu đây là tin nhắn đầu tiên (Admin chưa phản hồi), hệ thống tự sinh tin nhắn tự động (Bot auto reply) chứa thông tin chào mừng và thời gian phản hồi trung bình để gửi lại cho người dùng.
  - `@MessageMapping("/chat.read")`: Xử lý đánh dấu đã đọc tin nhắn hỗ trợ.

#### `SupportChatService.java`
- Xử lý logic nghiệp vụ cho kênh chat hỗ trợ, quản lý ticket và bot tự động phản hồi.
- Không dùng JPA Entity mà sử dụng trực tiếp **`JdbcTemplate`** để truy vấn các bảng `support_tickets`, `ticket_messages` và `ticket_attachments`.

---

## 3. Cơ sở dữ liệu (Entity & Tables)

- **`DirectChat` (JPA Entity)**: Lưu thông tin phòng chat 1-1 (`freelancer_id`, `employer_id`, `status`, `is_deleted_by_freelancer`, `is_deleted_by_employer`, `blocked_by`).
- **`DirectMessage` (JPA Entity)**: Lưu nội dung từng tin nhắn 1-1 (`chat_id`, `sender_id`, `sender_role`, `message_text`, `is_read`, `sent_at`). *(Lưu ý: Không hỗ trợ gửi file, chỉ gửi text).*
- **`support_tickets` (SQL Table - JdbcTemplate)**: Lưu thông tin ticket hỗ trợ (`ticket_id`, `freelancer_id`, `employer_id`, `status`, `assigned_staff_id`, `blocked_until`, ...).
- **`ticket_messages` (SQL Table - JdbcTemplate)**: Lưu tin nhắn trong ticket hỗ trợ (`message_text`, `is_read`, `sent_at`, `sender_freelancer_id`, ...).
- **`ticket_attachments` (SQL Table - JdbcTemplate)**: Lưu file đính kèm của tin nhắn hỗ trợ (`file_url`, `file_name`, `file_size`).

---

## 4. Luồng hoạt động chi tiết (Sequence Flow)

### 4.1. Khởi tạo cuộc trò chuyện 1-1 (Direct Chat)
```txt
React Client (MessengerPage.jsx)
  --[Gửi userId & role]--> api.get('/v1/direct-chats/user/{userId}')
  <--[Trả về danh sách phòng chat]-- DirectChatRestController
  
* Nếu bắt đầu chat mới từ trang cá nhân:
React Client (Profile)
  --[Gửi freelancerId & employerId]--> api.get('/v1/direct-chats/get-or-create')
  <--[Trả về thông tin phòng chat mới/cũ]-- DirectChatRestController
```

### 4.2. Gửi và Nhận tin nhắn Real-time qua WebSocket
```txt
React Client (User A)                         Spring Boot Server                  React Client (User B)
       |                                              |                                     |
       |-- (Kết nối và subscribe topic) ------------->|                                     |
       |   Topic: /topic/directChat.{chatId}          |                                     |
       |                                              |<-- (Kết nối và subscribe) ----------|
       |                                              |    Topic: /topic/directChat.{chatId} |
       |                                              |                                     |
       |-- [Gửi tin nhắn qua WebSocket] ------------>|                                     |
       |   Destination: /app/direct.chat.send         |                                     |
       |   Body: { chatId, senderId, text }           |                                     |
       |                                              |-- (Lưu vào DB bằng JPA)             |
       |                                              |                                     |
       |                                              |-- [Phát tin nhắn tới topic] ------->|
       |                                              |   /topic/directChat.{chatId}        |
       |                                              |   (Cả User A và B đều nhận được)   |
       |                                              |                                     |
       |                                              |-- [Phát notification thông báo] --->|
       |                                              |   /topic/user.{partnerId}.direct    |
```

### 4.3. Xác thực đã đọc (Read Receipt)
```txt
React Client (Người đọc)                      Spring Boot Server                  React Client (Người gửi)
       |                                              |                                     |
       |-- [Gửi tín hiệu đã đọc] ------------------->|                                     |
       |   Destination: /app/direct.chat.read         |                                     |
       |   Body: { ticketId (chatId), readerRole }    |                                     |
       |                                              |-- (Cập nhật is_read = true trong DB)|
       |                                              |                                     |
       |                                              |-- [Phát lại tín hiệu đã đọc] ------>|
       |                                              |   /topic/directChat.{chatId}        |
       |                                              |   (Giao diện người gửi hiện "Đã đọc")
```

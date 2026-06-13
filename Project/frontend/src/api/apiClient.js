// Đường dẫn cơ sở (Base URL) của API Spring Boot backend
const BASE_URL = "http://localhost:8080/api";

/**
 *
 * @param {string} endpoint
 * @param {Object} options
 * @returns {Promise<any>}
 * @throws {Error}
 */
export async function request(endpoint, options = {}) {
  const { headers = {}, body, ...customOptions } = options;

  // Cấu hình mặc định cho request
  const config = {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    ...customOptions,
  };

  // Nếu có truyền dữ liệu body, tự động chuyển đổi sang chuỗi JSON
  if (body) {
    config.body = JSON.stringify(body);
  }

  // Thực hiện gọi API thực tế bằng Fetch
  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  // Kiểm tra nếu mã trạng thái phản hồi không thành công (ví dụ: 400, 401, 403, 404, 500)
  if (!response.ok) {
    // Thử lấy thông báo lỗi JSON từ server, nếu không parse được thì trả về object rỗng
    const errorData = await response.json().catch(() => ({}));
    // Ném ra một Error chứa thông báo lỗi cụ thể hoặc thông báo mặc định
    throw new Error(errorData.message || "Có lỗi xảy ra khi kết nối máy chủ.");
  }

  // Lấy dữ liệu phản hồi dưới dạng text
  const text = await response.text();
  // Nếu có dữ liệu trả về, parse nó thành JSON, ngược lại trả về null
  return text ? JSON.parse(text) : null;
}

/**
 * Đối tượng tiện ích định nghĩa các hàm gửi yêu cầu rút gọn cho các phương thức HTTP phổ biến (GET, POST, PUT, DELETE).
 */
export const api = {
  // Gửi request GET để lấy dữ liệu từ server
  get: (url, options) => request(url, { ...options, method: "GET" }),

  // Gửi request POST để tạo mới dữ liệu
  post: (url, body, options) =>
    request(url, { ...options, method: "POST", body }),

  // Gửi request PUT để cập nhật toàn bộ dữ liệu
  put: (url, body, options) =>
    request(url, { ...options, method: "PUT", body }),

  // Gửi request DELETE để xóa dữ liệu
  delete: (url, options) => request(url, { ...options, method: "DELETE" }),
};

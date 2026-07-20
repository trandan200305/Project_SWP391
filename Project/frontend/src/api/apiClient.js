const BASE_URL = "http://localhost:8080/api";

export async function request(endpoint, options = {}) {
  const { headers = {}, body, ...customOptions } = options;
  const config = {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    ...customOptions,
  };

  try {
    const userStr = sessionStorage.getItem("user");
    if (userStr) {
      const userObj = JSON.parse(userStr);
      if (userObj && userObj.email) {
        config.headers["X-Admin-Email"] = userObj.email;
      }
    }
  } catch (e) {
    // ignore
  }

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorData = {};
      try {
        errorData = errorText ? JSON.parse(errorText) : {};
      } catch (e) {
        errorData = { message: errorText };
      }
      throw new Error(errorData.message || "Có lỗi xảy ra khi kết nối máy chủ.");
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    if (error.message === "Failed to fetch" || error.name === "TypeError") {
      throw new Error("Không thể kết nối đến máy chủ (Backend chưa chạy hoặc gián đoạn mạng).");
    }
    throw error;
  }
}

export const api = {
  get: (url, options) => request(url, { ...options, method: "GET" }),

  post: (url, body, options) =>
    request(url, { ...options, method: "POST", body }),

  put: (url, body, options) =>
    request(url, { ...options, method: "PUT", body }),

  delete: (url, options) => request(url, { ...options, method: "DELETE" }),
};

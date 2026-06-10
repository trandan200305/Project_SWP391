const BASE_URL = 'http://localhost:8080/api';

export async function request(endpoint, options = {}) {
  const { headers = {}, body, ...customOptions } = options;

  const config = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...customOptions,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Có lỗi xảy ra khi kết nối máy chủ.');
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export const api = {
  get: (url, options) => request(url, { ...options, method: 'GET' }),
  post: (url, body, options) => request(url, { ...options, method: 'POST', body }),
  put: (url, body, options) => request(url, { ...options, method: 'PUT', body }),
  delete: (url, options) => request(url, { ...options, method: 'DELETE' }),
};

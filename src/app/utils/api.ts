// Lấy đường dẫn từ file .env ra dùng chung
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const fetchApi = (endpoint: string, options: RequestInit = {}) => {
  return fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
};
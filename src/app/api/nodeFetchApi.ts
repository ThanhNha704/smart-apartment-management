// src/app/api/nodeFetchApi.ts
// Fetch wrapper riêng cho backend Node.js (chat/message), tách biệt với backend .NET (fetchApi.ts).
// Base URL lấy từ VITE_API_URL trong .env (ví dụ: https://smartboardinghouse.onrender.com)

const RAW_NODE_URL = import.meta.env.VITE_API_URL || "";
// Bỏ dấu "/" cuối (nếu có) để tránh lỗi "//api" khi nối chuỗi
const NODE_BASE_URL = `${RAW_NODE_URL.replace(/\/+$/, "")}/api`;

export const fetchNodeApi = async (
  endpoint: string,
  options: RequestInit = {},
): Promise<Response> => {
  // Token đăng nhập được lưu chung 1 nơi cho toàn bộ app (kể cả gọi sang .NET lẫn Node),
  // xem AuthContext.tsx -> login(): localStorage/sessionStorage key "token".
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  const headers = new Headers();

  // 1. CHỈ tự động set JSON Content-Type nếu body KHÔNG phải là FormData
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  // 2. Xử lý gộp custom headers truyền từ ngoài vào một cách an toàn
  if (options.headers) {
    const customHeaders = new Headers(options.headers);
    customHeaders.forEach((value, key) => {
      // Nếu dev truyền vào giá trị giả lập xóa (undefined, "undefined", "null") 
      // thì xóa hẳn header đó ra thay vì ghi đè chuỗi lỗi vào request
      if (value === "undefined" || value === "null" || !value) {
        headers.delete(key);
      } else {
        headers.set(key, value);
      }
    });
  }

  // 3. Thêm token xác thực nếu có
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // 4. Chuẩn hóa endpoint: Đảm bảo luôn luôn có dấu "/" phân cách giữa base URL và endpoint
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  const response = await fetch(`${NODE_BASE_URL}${cleanEndpoint}`, {
    ...options,
    headers,
  });

  return response;
};

export default fetchNodeApi;
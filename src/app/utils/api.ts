// Lấy đường dẫn từ file .env ra dùng chung
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const fetchApi = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  
  // Tạo đối tượng headers mới
  const headers = new Headers();

  // CHỈ tự động set JSON Content-Type nếu body KHÔNG phải là FormData
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Gộp các headers tùy chọn truyền vào từ bên ngoài nếu có
  if (options.headers) {
    const customHeaders = new Headers(options.headers);
    customHeaders.forEach((value, key) => {
      headers.set(key, value);
    });
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Gọi API
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers, // Truyền trực tiếp đối tượng headers vào fetch
  });

  // Xử lý tự động logout nếu token hết hạn (Lỗi 401)
  if (response.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  }

  return response;
};
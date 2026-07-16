// Lấy đường dẫn từ file .env ra dùng chung
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const fetchApi = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
  // 1. Lấy token từ localStorage
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  // 2. Sử dụng new Headers() để tránh lỗi gán thuộc tính của TypeScript
  const headers = new Headers({
    'Content-Type': 'application/json',
    ...options.headers, // Gộp các headers truyền riêng từ ngoài vào nếu có
  });

  // 3. Nếu có token thì đính kèm vào Header
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // 4. Gọi API
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers, // Truyền trực tiếp đối tượng headers vào fetch
  });

  // 5. Xử lý tự động logout nếu token hết hạn (Lỗi 401)
  if (response.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  }

  return response;
};
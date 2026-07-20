// src/utils/auth.ts

// Định nghĩa cấu trúc dữ liệu cho Admin/Tenant tùy thuộc vào dự án của bạn
export interface AdminInfo {
  id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  role?: string;
  avatarUrl?: string;
  [key: string]: any; // Cho phép mở rộng thêm các field khác từ backend nếu có
}

export interface SessionPayload {
  accessToken: string;
  refreshToken?: string;
  tenant?: AdminInfo; // Object chứa thông tin user/admin đăng nhập
}

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const ADMIN_INFO_KEY = "adminInfo";

/**
 * Lưu thông tin phiên đăng nhập vào LocalStorage
 */
export const saveSession = ({ accessToken, refreshToken, tenant }: SessionPayload): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
  if (tenant) {
    localStorage.setItem(ADMIN_INFO_KEY, JSON.stringify(tenant));
  }
};

/**
 * Xóa sạch toàn bộ thông tin phiên đăng nhập khi Logout hoặc Token hết hạn
 */
export const clearSession = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(ADMIN_INFO_KEY);
};

/**
 * Lấy Access Token hiện tại
 */
export const getAccessToken = (): string | null => localStorage.getItem(ACCESS_TOKEN_KEY);

/**
 * Lấy thông tin chi tiết của Admin/User đang đăng nhập hiện tại
 */
export const getCurrentAdmin = (): AdminInfo | null => {
  const raw = localStorage.getItem(ADMIN_INFO_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminInfo;
  } catch (error) {
    console.error("Lỗi parse thông tin admin từ LocalStorage:", error);
    return null;
  }
};

/**
 * Kiểm tra xem người dùng đã đăng nhập hay chưa (trả về true/false)
 */
export const isAuthenticated = (): boolean => !!getAccessToken();
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { fetchApi } from '../utils/api';

interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  role: number;
  roleLabel: string;
  roomNumber: string | null;
  token: string;
  refreshToken: string;
}

interface RegisterData {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  role: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe: boolean) => Promise<User>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // SỬA: Phục hồi trạng thái đồng bộ hoàn toàn trước khi tắt trạng thái Loading
  useEffect(() => {
    try {
      const localUser = localStorage.getItem('user');
      const sessionUser = sessionStorage.getItem('user');

      if (localUser) {
        setUser(JSON.parse(localUser));
      } else if (sessionUser) {
        setUser(JSON.parse(sessionUser));
      }
    } catch (error) {
      console.error("Lỗi đọc dữ liệu auth từ storage:", error);
      // Nếu dữ liệu storage lỗi (dữ liệu rác), clear sạch sẽ luôn
      localStorage.clear();
      sessionStorage.clear();
    } finally {
      // Đảm bảo mọi thứ chạy xong mới tắt loading
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean): Promise<User> => {
    const response = await fetchApi('/Auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: email.trim(),
        password: password.trim()
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(errorData || 'Đăng nhập thất bại');
    }

    const userData: User = await response.json();
    setUser(userData);

    if (rememberMe) {
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', userData.token);
      
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('token');
    } else {
      sessionStorage.setItem('user', JSON.stringify(userData));
      sessionStorage.setItem('token', userData.token);

      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }

    return userData;
  };

  const register = async (data: RegisterData): Promise<void> => {
    const response = await fetchApi('/Auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(errorData || 'Đăng ký thất bại');
    }

    // SỬA CHỖ NÀY: Không ép kiểu response.json() của Register thành User
    // Đăng ký xong nên điều hướng bắt họ đăng nhập lại hoặc trả về thông báo, tránh set bậy token lỗi vào state.
  };

  const logout = async () => {
    try {
      await fetchApi('/Auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Lỗi khi gọi API logout:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('token');
      
      // Xóa các dữ liệu phụ (như ID chat ở câu hỏi trước) để tránh rác storage
      localStorage.removeItem('active_chat_user_id');
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
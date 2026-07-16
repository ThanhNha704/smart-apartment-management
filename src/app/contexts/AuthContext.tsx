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

  // Chạy một lần duy nhất khi ứng dụng khởi chạy / reload (F5)
  useEffect(() => {
    const localUser = localStorage.getItem('user');
    const sessionUser = sessionStorage.getItem('user');

    if (localUser) {
      setUser(JSON.parse(localUser));
    } else if (sessionUser) {
      setUser(JSON.parse(sessionUser));
    }

    setIsLoading(false);
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

    // Xử lý lưu trữ thông tin dựa trên checkbox Ghi nhớ đăng nhập
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

    const userData: User = await response.json();
    setUser(userData);
    
    sessionStorage.setItem('user', JSON.stringify(userData));
    sessionStorage.setItem('token', userData.token);
  };

  const logout = async () => {
    try {
      await fetchApi('/Auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Lỗi khi gọi API logout:', error);
    } finally {
      // Luôn dọn dẹp sạch sẽ dữ liệu ở Client
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('token');
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
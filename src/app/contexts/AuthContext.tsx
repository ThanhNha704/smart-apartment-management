import { createContext, useContext, useState, type ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'landlord' | 'tenant';
  phone?: string;
  room?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: 'landlord' | 'tenant') => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: 'landlord' | 'tenant';
  room?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = async (email: string, password: string, role: 'landlord' | 'tenant') => {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockUser: User = {
      id: '1',
      email,
      password,
      name: role === 'landlord' ? 'Chủ nhà' : 'Nguyễn Văn A',
      role,
      phone: '0901234567',
      room: role === 'tenant' ? 'P101' : undefined,
    };

    setUser(mockUser);
    localStorage.setItem('user', JSON.stringify(mockUser));
  };

  const register = async (data: RegisterData) => {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email: data.email,
      password: data.password,
      name: data.name,
      role: data.role,
      phone: data.phone,
      room: data.room,
    };

    setUser(mockUser);
    localStorage.setItem('user', JSON.stringify(mockUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout }}>
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

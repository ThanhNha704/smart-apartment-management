import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import LoginPage from './components/auth/LoginPage';
// import RegisterPage from './components/auth/RegisterPage';
// import ForgotPasswordPage from './components/auth/ForgotPasswordPage';

import Sidebar from './components/landlord/Sidebar';
import Dashboard from './components/landlord/Dashboard';
import FloorManagement from './components/landlord/FloorManagement';
import RoomManagement from './components/landlord/RoomManagement';
import InvoiceManagement from './components/landlord/InvoiceManagement';
import TenantManagement from './components/landlord/TenantManagement';
import ContractManagement from './components/landlord/ContractManagement';
import MeterReading from './components/landlord/MeterReading';
import MaintenanceRequests from './components/landlord/MaintenanceRequests';
import Messages from './components/landlord/ChatManagement';
import Notification from './components/landlord/NotificationManagement';
// import Settings from './components/landlord/Settings';

function ProtectedRoute({ children }: { children: React.ReactNode; }) {
  const { isAuthenticated, isLoading } = useAuth(); // Thêm isLoading từ AuthContext nếu có

  // NẾU APP ĐANG TRONG QUÁ TRÌNH KHỞI TẠO ĐỌC STORAGE, HIỂN THỊ LOADING CHỨ KHÔNG ĐÁ VỀ LOGIN
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function LandlordLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="size-full flex bg-gray-50">
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <main className={`flex-1 overflow-auto transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/floors" element={<FloorManagement />} />
          <Route path="/rooms" element={<RoomManagement />} />
          <Route path="/tenants" element={<TenantManagement />} />
          <Route path="/contracts" element={<ContractManagement />} />
          <Route path="/invoices" element={<InvoiceManagement />} />
          <Route path="/meter-reading" element={<MeterReading />} />
          <Route path="/maintenance" element={<MaintenanceRequests />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/notification" element={<Notification />} />
          {/* <Route path="/settings" element={<Settings />} /> */}
          {/* Tự động redirect các route không tồn tại trong dashboard về trang chủ */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  // Đang check data đăng nhập cũ thì tạm hoãn render các Route chuyển hướng
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      {/* <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />} /> */}
      {/* <Route path="/forgot-password" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <ForgotPasswordPage />} /> */}

      <Route path="/*" element={
        <ProtectedRoute>
          <LandlordLayout />
        </ProtectedRoute>
      } />

      {/* Route mặc định "/" */}
      <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </AuthProvider>
  );
}
import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import ForgotPasswordPage from './components/auth/ForgotPasswordPage';

import Sidebar from './components/landlord/Sidebar';
import Dashboard from './components/landlord/Dashboard';
import FloorManagement from './components/landlord/FloorManagement';
import RoomManagement from './components/landlord/RoomManagement';
import InvoiceManagement from './components/landlord/InvoiceManagement';
import TenantManagement from './components/landlord/TenantManagement';
import ContractManagement from './components/landlord/ContractManagement';
import MeterReading from './components/landlord/MeterReading';
import MaintenanceRequests from './components/landlord/MaintenanceRequests';
import Settings from './components/landlord/Settings';

import TenantDashboard from './components/tenant/TenantDashboard';
import TenantInvoices from './components/tenant/TenantInvoices';
import TenantMaintenance from './components/tenant/TenantMaintenance';
import TenantProfile from './components/tenant/TenantProfile';
import TenantBottomNav from './components/tenant/TenantBottomNav';

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: 'landlord' | 'tenant' }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role && user?.role !== role) {
    if (user?.role === 'landlord') {
      return <Navigate to="/dashboard" replace />;
    } else {
      return <Navigate to="/tenant/dashboard" replace />;
    }
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
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}

function TenantLayout() {
  return (
    <div className="size-full bg-gray-50 pb-16">
      <Routes>
        <Route path="dashboard" element={<TenantDashboard />} />
        <Route path="invoices" element={<TenantInvoices />} />
        <Route path="maintenance" element={<TenantMaintenance />} />
        <Route path="profile" element={<TenantProfile />} />
      </Routes>
      <TenantBottomNav />
    </div>
  );
}

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to={user?.role === 'landlord' ? '/dashboard' : '/tenant/dashboard'} replace /> : <LoginPage />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to={user?.role === 'landlord' ? '/dashboard' : '/tenant/dashboard'} replace /> : <RegisterPage />} />
      <Route path="/forgot-password" element={isAuthenticated ? <Navigate to={user?.role === 'landlord' ? '/dashboard' : '/tenant/dashboard'} replace /> : <ForgotPasswordPage />} />

      <Route path="/*" element={
        <ProtectedRoute role="landlord">
          <LandlordLayout />
        </ProtectedRoute>
      } />

      <Route path="/tenant/*" element={
        <ProtectedRoute role="tenant">
          <TenantLayout />
        </ProtectedRoute>
      } />

      <Route path="/" element={<Navigate to={isAuthenticated ? (user?.role === 'landlord' ? '/dashboard' : '/tenant/dashboard') : '/login'} replace />} />
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

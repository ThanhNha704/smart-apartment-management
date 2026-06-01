import { Home, FileText, Wrench, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';

export default function TenantBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/tenant/dashboard', icon: Home, label: 'Trang chủ' },
    { path: '/tenant/invoices', icon: FileText, label: 'Hóa đơn' },
    { path: '/tenant/maintenance', icon: Wrench, label: 'Sửa chữa' },
    { path: '/tenant/profile', icon: User, label: 'Tài khoản' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-inset-bottom">
      <div className="grid grid-cols-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center py-3 transition-colors ${
                isActive ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              <Icon className={`w-6 h-6 mb-1 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
              <span className="text-xs">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

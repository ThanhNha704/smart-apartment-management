import { Link, useLocation, useNavigate } from 'react-router';
import {
  LayoutDashboard,
  Building2,
  FileText,
  Users,
  MessageCircleMore,
  Bell,
  Gauge,
  Settings as SettingsIcon,
  Menu,
  Home,
  Layers,
  FileSignature,
  Wrench,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
}

const menuItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Tổng quan' },
  { path: '/floors', icon: Layers, label: 'Quản lý tầng' },
  { path: '/rooms', icon: Building2, label: 'Quản lý phòng' },
  { path: '/tenants', icon: Users, label: 'Người thuê' },
  { path: '/contracts', icon: FileSignature, label: 'Hợp đồng' },
  { path: '/invoices', icon: FileText, label: 'Hóa đơn' },
  { path: '/meter-reading', icon: Gauge, label: 'Đọc công tơ' },
  { path: '/maintenance', icon: Wrench, label: 'Yêu cầu sửa chữa' },
  { path: '/messages', icon: MessageCircleMore, label: 'Tin nhắn' },
  { path: '/notification', icon: Bell, label: 'Thông báo' },
  { path: '/settings', icon: SettingsIcon, label: 'Cài đặt' },
];

export default function Sidebar({ open, onToggle }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    toast.success('Đã đăng xuất!');
    navigate('/login');
  };

  return (
    <aside className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-50 flex flex-col ${open ? 'w-64' : 'w-20'}`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {open ? (
          <>
            <div className="flex items-center gap-2">
              <Home className="w-6 h-6 text-blue-600" />
              <span className="font-semibold text-lg">Quản lý trọ</span>
            </div>
            <button onClick={onToggle} className="p-1 hover:bg-gray-100 rounded">
              <Menu className="w-5 h-5" />
            </button>
          </>
        ) : (
          <button onClick={onToggle} className="p-1 hover:bg-gray-100 rounded mx-auto">
            <Menu className="w-5 h-5" />
          </button>
        )}
      </div>

      {open && user && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{user.name}</p>
              <p className="text-xs text-gray-500">Chủ nhà</p>
            </div>
          </div>
        </div>
      )}

      <nav className="p-2 mt-4 flex-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg mb-1 transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              } ${!open ? 'justify-center' : ''}`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {open && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-2 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 px-3 py-3 rounded-lg w-full text-red-600 hover:bg-red-50 transition-colors ${!open ? 'justify-center' : ''}`}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {open && <span>Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );
}

import { ArrowLeft, User, Mail, Phone, Home, Calendar, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

export default function TenantProfile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast.success('Đã đăng xuất!');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-purple-600 text-white p-6 pb-20">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/tenant/dashboard')} className="p-2 hover:bg-white/10 rounded-lg">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold">Tài khoản</h1>
        </div>

        <div className="text-center">
          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-bold mb-1">{user?.name}</h2>
          <p className="text-purple-100">Người thuê</p>
        </div>
      </div>

      <div className="px-4 -mt-12 pb-6">
        <div className="bg-white rounded-2xl shadow-lg p-5 mb-4">
          <h3 className="font-semibold mb-4">Thông tin cá nhân</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-600">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Phone className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-600">Số điện thoại</p>
                <p className="font-medium">{user?.phone}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-5 mb-4">
          <h3 className="font-semibold mb-4">Thông tin phòng</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Home className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-600">Số phòng</p>
                <p className="font-medium">{user?.room}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-600">Ngày nhận phòng</p>
                <p className="font-medium">15/01/2025</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button className="w-full py-4 bg-white rounded-xl shadow text-left px-5 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="font-medium">Đổi mật khẩu</span>
              <span className="text-gray-400">›</span>
            </div>
          </button>

          <button className="w-full py-4 bg-white rounded-xl shadow text-left px-5 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="font-medium">Cài đặt thông báo</span>
              <span className="text-gray-400">›</span>
            </div>
          </button>

          <button className="w-full py-4 bg-white rounded-xl shadow text-left px-5 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="font-medium">Hỗ trợ & Liên hệ</span>
              <span className="text-gray-400">›</span>
            </div>
          </button>

          <button
            onClick={handleLogout}
            className="w-full py-4 bg-red-50 text-red-600 rounded-xl shadow hover:bg-red-100 flex items-center justify-center gap-2 font-medium mt-6"
          >
            <LogOut className="w-5 h-5" />
            Đăng xuất
          </button>
        </div>

        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Phiên bản 1.0.0</p>
        </div>
      </div>
    </div>
  );
}

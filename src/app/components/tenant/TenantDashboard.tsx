import { useNavigate } from 'react-router';
import { Home, FileText, Wrench, User, DollarSign, Droplets, Zap, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function TenantDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const currentInvoice = {
    month: 'Tháng 6/2026',
    totalAmount: 3450000,
    dueDate: '2026-06-05',
    status: 'pending' as const,
    electricityAmount: 480000,
    waterAmount: 140000,
    rentAmount: 2500000,
    serviceAmount: 200000,
  };

  // Đã sửa: Khai báo trực tiếp class Tailwind hoàn chỉnh để tránh lỗi Dynamic Class
  const quickStats = [
    { icon: DollarSign, label: 'Tiền phòng', value: '2.5M', bgColor: 'bg-blue-100', textColor: 'text-blue-600' },
    { icon: Zap, label: 'Tiền điện', value: '480K', bgColor: 'bg-yellow-100', textColor: 'text-yellow-600' },
    { icon: Droplets, label: 'Tiền nước', value: '140K', bgColor: 'bg-cyan-100', textColor: 'text-cyan-600' },
    { icon: AlertCircle, label: 'Chưa thanh toán', value: '1', bgColor: 'bg-red-100', textColor: 'text-red-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Profile & Room Info */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white p-6 pb-20">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-blue-100 text-sm">Xin chào,</p>
            <h1 className="text-2xl font-bold">{user?.name || 'Người thuê'}</h1>
          </div>
          <button
            onClick={() => navigate('/tenant/profile')}
            className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <User className="w-6 h-6" />
          </button>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-blue-100">Phòng của bạn</span>
            <Home className="w-5 h-5" />
          </div>
          <h2 className="text-3xl font-bold mb-1">{user?.room || 'N/A'}</h2>
          <p className="text-blue-100 text-sm">Tầng 1</p>
        </div>
      </div>

      {/* Main Content Info */}
      <div className="px-4 -mt-12">
        {/* Invoice Card */}
        <div className="bg-white rounded-2xl shadow-lg p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-600 text-sm">Hóa đơn tháng này</p>
              <h3 className="text-2xl font-bold text-blue-600">{currentInvoice.totalAmount.toLocaleString('vi-VN')} ₫</h3>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              currentInvoice.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
            }`}>
              {currentInvoice.status === 'pending' ? 'Chưa thanh toán' : 'Đã thanh toán'}
            </div>
          </div>

          <div className="space-y-2 mb-4 border-b border-gray-100 pb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tiền phòng</span>
              <span className="font-medium text-gray-800">{currentInvoice.rentAmount.toLocaleString('vi-VN')} ₫</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Điện</span>
              <span className="font-medium text-gray-800">{currentInvoice.electricityAmount.toLocaleString('vi-VN')} ₫</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Nước</span>
              <span className="font-medium text-gray-800">{currentInvoice.waterAmount.toLocaleString('vi-VN')} ₫</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Dịch vụ</span>
              <span className="font-medium text-gray-800">{currentInvoice.serviceAmount.toLocaleString('vi-VN')} ₫</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/tenant/invoices')}
              className="flex-1 py-3 border border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              Chi tiết
            </button>
            <button
              onClick={() => navigate('/tenant/invoices')}
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Thanh toán
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {quickStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-50">
                {/* Đã sửa: Gọi biến class trực tiếp tại đây */}
                <div className={`w-10 h-10 ${stat.bgColor} rounded-lg flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${stat.textColor}`} />
                </div>
                <p className="text-gray-500 text-xs mb-1">{stat.label}</p>
                <p className="text-xl font-bold text-gray-800">{stat.value}</p>
              </div>
            );
          })}
        </div>

        {/* Quick Access Menu */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-800 text-lg mb-3">Truy cập nhanh</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/tenant/invoices')}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-50 hover:shadow-md transition-shadow text-left"
            >
              <FileText className="w-8 h-8 text-blue-600 mb-2" />
              <p className="font-medium text-gray-800">Hóa đơn</p>
              <p className="text-xs text-gray-500">Xem lịch sử</p>
            </button>
            <button
              onClick={() => navigate('/tenant/maintenance')}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-50 hover:shadow-md transition-shadow text-left"
            >
              <Wrench className="w-8 h-8 text-orange-600 mb-2" />
              <p className="font-medium text-gray-800">Sửa chữa</p>
              <p className="text-xs text-gray-500">Gửi yêu cầu</p>
            </button>
          </div>
        </div>

        {/* Bottom Alert Reminder */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-24">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-blue-900 mb-1">Nhắc nhở thanh toán</p>
              <p className="text-sm text-blue-800">
                Hóa đơn {currentInvoice.month} cần thanh toán trước ngày{' '}
                {new Date(currentInvoice.dueDate).toLocaleDateString('vi-VN')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
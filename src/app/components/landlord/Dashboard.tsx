import { useState, useEffect } from 'react';
import { Building2, Users, DollarSign, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Định nghĩa Interface
interface RevenueMonth {
  month: string;
  revenue: number;
}

interface RecentActivity {
  type: string;
  userName: string; // Khớp với userName (camelCase của UserName từ backend)
  description: string;
  roomNumber: string;
  timeAgo: string;
  amount: number;
}

interface DashboardData {
  totalRooms: number;
  rentedRooms: number;
  monthlyRevenue: number;
  unpaidInvoices: number;
  revenueLast6Months: RevenueMonth[];
  recentActivities: RecentActivity[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Gọi API lấy dữ liệu Dashboard
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}/Dashboard`);
        if (!response.ok) throw new Error('Không thể tải dữ liệu dashboard');
        const result: DashboardData = await response.json();
        setData(result);
      } catch (error) {
        toast.error('Lỗi khi kết nối tới máy chủ Dashboard!');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return <div className="p-6 text-center text-gray-500">Đang tải dữ liệu tổng quan...</div>;
  }

  if (!data) {
    return <div className="p-6 text-center text-red-500">Không có dữ liệu hiển thị.</div>;
  }

  // Khớp dữ liệu Thống kê thẻ
  const statsCards = [
    { label: 'Tổng phòng', value: data.totalRooms.toString(), icon: Building2, color: 'blue' },
    { label: 'Phòng đã thuê', value: data.rentedRooms.toString(), icon: Users, color: 'green' },
    { label: 'Doanh thu tháng', value: `${data.monthlyRevenue.toLocaleString('vi-VN')} ₫`, icon: DollarSign, color: 'purple' },
    { label: 'Hóa đơn chưa thanh toán', value: data.unpaidInvoices.toString(), icon: AlertCircle, color: 'red' },
  ];

  // Khớp dữ liệu biểu đồ tròn (PieChart) tình trạng phòng
  const vacantRooms = data.totalRooms - data.rentedRooms;
  const occupancyPieData = [
    { name: 'Đã thuê', value: data.rentedRooms, color: '#10b981' },
    { name: 'Trống', value: vacantRooms >= 0 ? vacantRooms : 0, color: '#ef4444' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Tổng quan</h1>
        <p className="text-gray-600">Xin chào! Đây là thông tin tổng quan về hệ thống phòng trọ của bạn.</p>
      </div>

      {/* 4 Thẻ thống kê hàng đầu */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg bg-${stat.color}-50`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
              <p className="text-2xl font-semibold">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Biểu đồ đường Doanh thu 6 tháng gần đây */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="font-semibold mb-4">Doanh thu các tháng gần đây</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.revenueLast6Months}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)} triệu`} />
              <Tooltip formatter={(value: any) => [`${Number(value).toLocaleString('vi-VN')} ₫`, 'Doanh thu']} />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Biểu đồ hình quạt Tình trạng phòng */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="font-semibold mb-4">Tình trạng phòng</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={occupancyPieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {occupancyPieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {occupancyPieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-gray-600">{item.name}</span>
                </div>
                <span className="font-semibold">{item.value} phòng</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Danh sách hoạt động gần đây từ API */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-semibold">Hoạt động gần đây</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {data.recentActivities.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">Chưa có hoạt động nào diễn ra.</div>
          ) : (
            data.recentActivities.map((activity, index) => (
              <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {/* Xử lý gắn màu badge tùy biến theo kiểu "type" chữ từ backend */}
                      <span className={`px-2 py-1 rounded text-xs ${
                        activity.type?.toLowerCase().includes('pay') || activity.type?.toLowerCase().includes('toán')
                          ? 'bg-green-100 text-green-700' 
                          : activity.type?.toLowerCase().includes('in') || activity.type?.toLowerCase().includes('nhận')
                          ? 'bg-blue-100 text-blue-700'
                          : activity.type?.toLowerCase().includes('out') || activity.type?.toLowerCase().includes('trả')
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {activity.type || 'Hệ thống'}
                      </span>
                      <span className="font-medium">{activity.userName}</span>
                      {activity.roomNumber && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-600">Phòng {activity.roomNumber}</span>
                        </>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{activity.description}</p>
                    {activity.amount > 0 && (
                      <p className="text-xs text-green-600 font-medium mt-0.5">
                        Số tiền: +{activity.amount.toLocaleString('vi-VN')} ₫
                      </p>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">{activity.timeAgo}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
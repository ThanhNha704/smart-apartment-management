import { useState, useEffect } from 'react';
import { Building2, Users, DollarSign, AlertCircle, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner';
import { fetchApi } from '../../api/fetchApi';

// Định nghĩa Interface
interface RevenueMonth {
  month: string;
  revenue: number;
}

interface RecentActivity {
  type: string;
  userName: string;
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

  // Gọi API lấy dữ liệu Dashboard bằng fetchApi
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const response = await fetchApi('/Dashboard');

        if (response.ok) {
          const result: DashboardData = await response.json();
          setData(result);
        } else {
          toast.error('Không thể tải dữ liệu dashboard!');
        }
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
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500 gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm font-medium">Đang tải dữ liệu tổng quan...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-red-500 font-medium">
        Không có dữ liệu hiển thị từ máy chủ.
      </div>
    );
  }

  // Dữ liệu Thống kê thẻ
  const statsCards = [
    { label: 'Tổng phòng', value: data.totalRooms.toString(), icon: Building2, color: 'blue' },
    { label: 'Phòng đã thuê', value: data.rentedRooms.toString(), icon: Users, color: 'green' },
    { label: 'Doanh thu tháng', value: `${data.monthlyRevenue.toLocaleString('vi-VN')} ₫`, icon: DollarSign, color: 'purple' },
    { label: 'Hóa đơn chưa thanh toán', value: data.unpaidInvoices.toString(), icon: AlertCircle, color: 'red' },
  ];

  // Dữ liệu biểu đồ tròn (PieChart) tình trạng phòng
  const vacantRooms = data.totalRooms - data.rentedRooms;
  const occupancyPieData = [
    { name: 'Đã thuê', value: data.rentedRooms, color: '#10b981' },
    { name: 'Trống', value: vacantRooms >= 0 ? vacantRooms : 0, color: '#ef4444' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Tổng quan</h1>
        <p className="text-gray-600">Xin chào! Đây là thông tin tổng quan về hệ thống phòng trọ của bạn.</p>
      </div>

      {/* 4 Thẻ thống kê hàng đầu */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg bg-${stat.color}-50`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
              </div>
              <p className="text-gray-500 text-xs font-medium uppercase mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Biểu đồ đường Doanh thu 6 tháng gần đây */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Doanh thu các tháng gần đây</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.revenueLast6Months}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis
                tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip formatter={(value: any) => [`${Number(value).toLocaleString('vi-VN')} ₫`, 'Doanh thu']} />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Biểu đồ hình quạt Tình trạng phòng */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Tình trạng phòng</h3>
          <div className="flex justify-center">
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
          </div>
          <div className="mt-4 space-y-2">
            {occupancyPieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-gray-600">{item.name}</span>
                </div>
                <span className="font-semibold text-gray-800">{item.value} phòng</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Danh sách hoạt động gần đây */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Hoạt động gần đây</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {data.recentActivities.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">Chưa có hoạt động nào diễn ra.</div>
          ) : (
            data.recentActivities.map((activity, index) => (
              <div key={index} className="p-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${activity.type?.toLowerCase().includes('pay') || activity.type?.toLowerCase().includes('toán')
                          ? 'bg-green-50 text-green-700'
                          : activity.type?.toLowerCase().includes('in') || activity.type?.toLowerCase().includes('nhận')
                            ? 'bg-blue-50 text-blue-700'
                            : activity.type?.toLowerCase().includes('out') || activity.type?.toLowerCase().includes('trả')
                              ? 'bg-orange-50 text-orange-700'
                              : 'bg-purple-50 text-purple-700'
                        }`}>
                        {activity.type || 'Hệ thống'}
                      </span>
                      <span className="font-medium text-sm text-gray-900">{activity.userName}</span>
                      {activity.roomNumber && (
                        <>
                          <span className="text-gray-300 text-xs">•</span>
                          <span className="text-xs text-gray-500 font-medium">Phòng {activity.roomNumber}</span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 truncate">{activity.description}</p>
                    {activity.amount > 0 && (
                      <p className="text-xs text-green-600 font-semibold mt-0.5">
                        +{activity.amount.toLocaleString('vi-VN')} ₫
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{activity.timeAgo}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
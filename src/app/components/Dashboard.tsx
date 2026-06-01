import { Building2, Users, DollarSign, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const statsData = [
  { label: 'Tổng phòng', value: '48', change: '+2', icon: Building2, color: 'blue' },
  { label: 'Phòng đã thuê', value: '42', change: '+5', icon: Users, color: 'green' },
  { label: 'Doanh thu tháng', value: '124.5M', change: '+12%', icon: DollarSign, color: 'purple' },
  { label: 'Hóa đơn chưa thanh toán', value: '8', change: '-3', icon: AlertCircle, color: 'red' },
];

const revenueData = [
  { month: 'T1', revenue: 95 },
  { month: 'T2', revenue: 102 },
  { month: 'T3', revenue: 108 },
  { month: 'T4', revenue: 115 },
  { month: 'T5', revenue: 118 },
  { month: 'T6', revenue: 124.5 },
];

const occupancyData = [
  { name: 'Đã thuê', value: 42, color: '#10b981' },
  { name: 'Trống', value: 6, color: '#ef4444' },
];

const recentActivities = [
  { id: 1, type: 'payment', tenant: 'Nguyễn Văn A', room: 'P101', amount: '2.5M', time: '10 phút trước' },
  { id: 2, type: 'checkout', tenant: 'Trần Thị B', room: 'P205', time: '2 giờ trước' },
  { id: 3, type: 'checkin', tenant: 'Lê Văn C', room: 'P301', time: '5 giờ trước' },
  { id: 4, type: 'maintenance', tenant: 'Phạm Thị D', room: 'P402', issue: 'Sửa vòi nước', time: '1 ngày trước' },
];

export default function Dashboard() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Tổng quan</h1>
        <p className="text-gray-600">Xin chào! Đây là thông tin tổng quan về hệ thống phòng trọ của bạn.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statsData.map((stat) => {
          const Icon = stat.icon;
          const isPositive = stat.change.startsWith('+');

          return (
            <div key={stat.label} className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg bg-${stat.color}-50`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
                <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span>{stat.change}</span>
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
              <p className="text-2xl font-semibold">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="font-semibold mb-4">Doanh thu 6 tháng gần đây</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `${value} triệu VNĐ`} />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="font-semibold mb-4">Tình trạng phòng</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={occupancyData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {occupancyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {occupancyData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-gray-600">{item.name}</span>
                </div>
                <span className="font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-semibold">Hoạt động gần đây</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-1 rounded text-xs ${
                      activity.type === 'payment' ? 'bg-green-100 text-green-700' :
                      activity.type === 'checkin' ? 'bg-blue-100 text-blue-700' :
                      activity.type === 'checkout' ? 'bg-orange-100 text-orange-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {activity.type === 'payment' ? 'Thanh toán' :
                       activity.type === 'checkin' ? 'Nhận phòng' :
                       activity.type === 'checkout' ? 'Trả phòng' :
                       'Bảo trì'}
                    </span>
                    <span className="font-medium">{activity.tenant}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-600">{activity.room}</span>
                  </div>
                  {activity.amount && (
                    <p className="text-sm text-gray-600">Đã thanh toán {activity.amount}</p>
                  )}
                  {activity.issue && (
                    <p className="text-sm text-gray-600">{activity.issue}</p>
                  )}
                </div>
                <span className="text-sm text-gray-500">{activity.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

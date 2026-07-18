import { useState, useEffect } from 'react';
import { Calendar, Loader2, Info, Zap, Droplet } from 'lucide-react';
import { toast } from 'sonner';
import { fetchApi } from '../../utils/api';

// INTERFACES
interface Room {
  id: string;
  roomNumber: string;
  tenantName: string;
}

interface MeterReadingItem {
  id: string;
  roomNumber: string;
  tenantName: string;
  type: number; // 0: Điện, 1: Nước
  typeLabel: string;
  month: number;
  year: number;
  period: string;
  previousIndex: number;
  currentIndex: number;
  usage: number;
  usageLabel: string;
  unitPrice: number;
  total: number;
  photoUrl: string;
}

export default function MeterReadingHistory() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [readings, setReadings] = useState<MeterReadingItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRoomNumber, setSelectedRoomNumber] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Hàm GET: Tải danh sách phòng và lịch sử ghi số từ hệ thống
  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Lấy toàn bộ danh sách phòng và toàn bộ lịch sử công tơ
      const [roomsRes, readingsRes] = await Promise.all([
        fetchApi('/Rooms'),
        fetchApi('/MeterReadings'),
      ]);

      if (roomsRes.ok) {
        const roomsData = await roomsRes.json();
        setRooms(roomsData);
      } else throw new Error('Không thể tải danh sách phòng');

      if (readingsRes.ok) {
        const readingsData = await readingsRes.json();
        setReadings(readingsData);
      } else throw new Error('Không thể tải lịch sử ghi số');

    } catch (error) {
      console.error("Lỗi lấy dữ liệu từ backend:", error);
      toast.error('Lỗi khi tải dữ liệu từ máy chủ!');
    } finally {
      setIsLoading(false);
    }
  };

  // Tự động tải lại
  useEffect(() => {
    fetchData();
  }, [selectedRoomNumber]);

  // Bộ lọc dữ liệu theo loại công tơ (Điện / Nước) và tên phòng
  const filteredReadings = readings.filter(reading => {
    // Lọc theo Loại dịch vụ (Điện/Nước)
    const matchesType = filterType === 'all' || reading.type.toString() === filterType;

    // Lọc theo Từ khóa tìm kiếm
    const query = searchQuery.toLowerCase().trim();

    // Nếu không nhập từ khóa, giữ nguyên
    if (!query) return matchesType;

    // Chuẩn hóa dữ liệu phòng
    const roomNumberStr = reading.roomNumber ? reading.roomNumber.toLowerCase() : '';
    const tenantNameStr = reading.tenantName ? reading.tenantName.toLowerCase() : '';
    const typeLabelStr = reading.typeLabel ? reading.typeLabel.toLowerCase() : '';

    // Kiểm tra xem từ khóa có khớp với số phòng, tên khách hoặc loại nhãn không
    const matchesQuery = 
      roomNumberStr.includes(query) || 
      tenantNameStr.includes(query) ||
      typeLabelStr.includes(query);

    return matchesType && matchesQuery;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* TIÊU ĐỀ CHÍNH */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Lịch sử chỉ số công tơ</h1>
          <p className="text-gray-600">Theo dõi và kiểm tra lịch sử ghi nhận số điện, số nước của các phòng</p>
        </div>
      </div>

      {/* THANH BỘ LỌC */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6 p-4 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Tìm kiếm nhanh theo số phòng
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Nhập số phòng (ví dụ: 101, P101), tên khách..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <div className="w-full sm:w-48">
          <label className="block text-xs font-medium text-gray-500 mb-1">Loại dịch vụ</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">Tất cả loại dịch vụ</option>
            <option value="0">⚡ Điện</option>
            <option value="1">💧 Nước</option>
          </select>
        </div>
      </div>

      {/* DANH SÁCH LỊCH SỬ CHỈ SỐ */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm">Đang tải lịch sử chỉ số từ máy chủ...</p>
          </div>
        ) : filteredReadings.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-base text-gray-500 font-medium">Không tìm thấy dữ liệu.</p>
            <p className="text-xs text-gray-400 mt-1">Chưa có chỉ số công tơ nào được ghi nhận khớp với bộ lọc hiện tại.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReadings.map((reading) => (
              <div
                key={reading.id}
                className="p-5 border border-gray-200 rounded-xl hover:shadow-md transition-all flex flex-col justify-between bg-white"
              >
                <div>
                  {/* Header của thẻ card */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-lg text-gray-900">
                        Phòng {reading.roomNumber}
                      </p>
                      <p className="text-sm text-gray-500 line-clamp-1">
                        Khách: {reading.tenantName || 'Trống / Chưa có'}
                      </p>
                    </div>

                    {/* Icon phân biệt Điện / Nước */}
                    {reading.type === 0 ? (
                      <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-semibold border border-amber-200">
                        <Zap className="w-3 h-3 fill-amber-500 text-amber-500" /> Điện
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-200">
                        <Droplet className="w-3 h-3 fill-blue-500 text-blue-500" /> Nước
                      </span>
                    )}
                  </div>

                  {/* Kỳ hóa đơn */}
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4 bg-gray-50 px-2 py-1.5 rounded-md w-fit">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>Kỳ hóa đơn: <strong>Tháng {reading.month}/{reading.year}</strong></span>
                  </div>

                  {/* Khối chỉ số chi tiết */}
                  <div className="grid grid-cols-3 gap-2 text-center bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                    <div>
                      <p className="text-gray-400 text-[11px] font-medium uppercase tracking-wider">Chỉ số cũ</p>
                      <p className="font-semibold text-gray-700 mt-0.5 text-sm">{reading.previousIndex}</p>
                    </div>
                    <div className="border-x border-gray-200">
                      <p className="text-gray-400 text-[11px] font-medium uppercase tracking-wider">Chỉ số mới</p>
                      <p className="font-semibold text-gray-700 mt-0.5 text-sm">{reading.currentIndex}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-[11px] font-medium uppercase tracking-wider">Tiêu thụ</p>
                      <p className="font-bold text-blue-600 mt-0.5 text-sm">
                        {reading.usageLabel || `${reading.usage} ${reading.type === 0 ? 'kWh' : 'm³'}`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Phần tính tiền */}
                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                  <p className="text-xs text-gray-500">Đơn giá: {reading.unitPrice.toLocaleString('vi-VN')} đ</p>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Thành tiền</p>
                    <p className="font-bold text-green-600 text-base">
                      {reading.total.toLocaleString('vi-VN')} ₫
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* THANH THÔNG TIN BỔ SUNG */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex gap-3 items-start mt-6">
        <Info className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
        <p className="text-xs text-gray-600 leading-relaxed">
          Số liệu tiêu thụ và thành tiền được hệ thống tự động đồng bộ dựa trên dữ liệu chốt số công tơ hàng tháng. Mọi thắc mắc hoặc sai sót về số liệu, vui lòng kiểm tra lại hóa đơn gốc hoặc liên hệ quản trị viên hệ thống để cập nhật lại.
        </p>
      </div>
    </div>
  );
}
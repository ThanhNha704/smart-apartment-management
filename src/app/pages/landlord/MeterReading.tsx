import { useState, useEffect, useMemo } from 'react';
import { Calendar, Loader2, Info, Zap, Droplet, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { fetchApi } from '../../api/fetchApi';

// INTERFACES
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

type SortKey = 'date-desc' | 'date-asc' | 'room-asc' | 'room-desc';

export default function MeterReadingHistory() {
  const [readings, setReadings] = useState<MeterReadingItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('date-desc'); // Mặc định: Mới nhất lên đầu
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; 

  // Hàm GET: Tải lịch sử ghi số từ hệ thống
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const readingsRes = await fetchApi('/MeterReadings');

      if (readingsRes.ok) {
        const readingsData = await readingsRes.json();
        setReadings(readingsData);
      } else {
        throw new Error('Không thể tải lịch sử ghi số');
      }
    } catch (error) {
      console.error("Lỗi lấy dữ liệu từ backend:", error);
      toast.error('Lỗi khi tải dữ liệu từ máy chủ!');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Reset về trang 1 mỗi khi thay đổi bộ lọc, từ khóa hoặc cách sắp xếp
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, searchQuery, sortBy]);

  // XỬ LÝ LỌC VÀ SẮP XẾP DỮ LIỆU
  const processedReadings = useMemo(() => {
    // 1. Lọc theo Dịch vụ & Từ khóa tìm kiếm
    const filtered = readings.filter(reading => {
      const matchesType = filterType === 'all' || reading.type.toString() === filterType;
      const query = searchQuery.toLowerCase().trim();

      if (!query) return matchesType;

      const roomNumberStr = reading.roomNumber ? reading.roomNumber.toLowerCase() : '';
      const tenantNameStr = reading.tenantName ? reading.tenantName.toLowerCase() : '';
      const typeLabelStr = reading.typeLabel ? reading.typeLabel.toLowerCase() : '';

      const matchesQuery = 
        roomNumberStr.includes(query) || 
        tenantNameStr.includes(query) ||
        typeLabelStr.includes(query);

      return matchesType && matchesQuery;
    });

    // 2. Sắp xếp dữ liệu theo lựa chọn
    return filtered.sort((a, b) => {
      if (sortBy === 'date-desc') {
        // Sắp xếp theo năm giảm dần -> tháng giảm dần -> số phòng tăng dần
        return (b.year - a.year) || (b.month - a.month) || a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true });
      }
      if (sortBy === 'date-asc') {
        return (a.year - b.year) || (a.month - b.month) || a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true });
      }
      if (sortBy === 'room-asc') {
        // Sắp xếp số phòng tự nhiên (101 -> 102 -> 201...)
        return a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true }) || (b.year - a.year);
      }
      if (sortBy === 'room-desc') {
        return b.roomNumber.localeCompare(a.roomNumber, undefined, { numeric: true }) || (b.year - a.year);
      }
      return 0;
    });
  }, [readings, filterType, searchQuery, sortBy]);

  // XỬ LÝ PHÂN TRANG
  const totalItems = processedReadings.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentReadings = processedReadings.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* TIÊU ĐỀ CHÍNH */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Lịch sử chỉ số công tơ</h1>
        <p className="text-gray-600 text-sm">Theo dõi và kiểm tra lịch sử ghi nhận số điện, số nước của các phòng</p>
      </div>

      {/* THANH BỘ LỌC & SẮP XẾP */}
      <div className="bg-white rounded-xl border border-gray-200 mb-6 p-4 shadow-sm flex flex-col md:flex-row gap-4">
        {/* Ô Tìm kiếm */}
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Tìm kiếm nhanh
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Nhập số phòng, tên khách..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-black text-sm"
          />
        </div>

        {/* Bộ lọc Loại Dịch Vụ */}
        <div className="w-full md:w-56">
          <label className="block text-xs font-medium text-gray-500 mb-1">Loại dịch vụ</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-black text-sm"
          >
            <option value="all">Tất cả loại dịch vụ</option>
            <option value="0">⚡ Điện</option>
            <option value="1">💧 Nước</option>
          </select>
        </div>

        {/* Bộ chọn Sắp xếp */}
        <div className="w-full md:w-56">
          <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3" /> Sắp xếp theo
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-black text-sm"
          >
            <option value="date-desc">Kỳ mới nhất trước</option>
            <option value="date-asc">Kỳ cũ nhất trước</option>
            <option value="room-asc">Số phòng tăng dần</option>
            <option value="room-desc">Số phòng giảm dần</option>
          </select>
        </div>
      </div>

      {/* DANH SÁCH LỊCH SỬ CHỈ SỐ */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm">Đang tải lịch sử chỉ số từ máy chủ...</p>
          </div>
        ) : processedReadings.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-base text-gray-500 font-medium">Không tìm thấy dữ liệu.</p>
            <p className="text-xs text-gray-400 mt-1">Chưa có chỉ số công tơ nào khớp với tìm kiếm hoặc bộ lọc hiện tại.</p>
          </div>
        ) : (
          <>
            {/* Grid hiển thị thẻ card */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {currentReadings.map((reading) => (
                <div
                  key={reading.id}
                  className="p-5 border border-gray-200 rounded-xl hover:shadow-md transition-all flex flex-col justify-between bg-white"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-lg text-gray-900">
                          Phòng {reading.roomNumber}
                        </p>
                        <p className="text-sm text-gray-500 line-clamp-1">
                          Khách: {reading.tenantName || 'Trống / Chưa có'}
                        </p>
                      </div>

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

                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4 bg-gray-50 px-2 py-1.5 rounded-md w-fit">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>Kỳ hóa đơn: <strong>Tháng {reading.month}/{reading.year}</strong></span>
                    </div>

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

            {/* THANH PHÂN TRANG */}
            <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-gray-100 gap-4">
              <p className="text-sm text-gray-500">
                Hiển thị <span className="font-medium">{indexOfFirstItem + 1}</span> -{' '}
                <span className="font-medium">{Math.min(indexOfLastItem, totalItems)}</span> trên tổng số{' '}
                <span className="font-medium">{totalItems}</span> bản ghi
              </p>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        currentPage === page
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'border border-gray-300 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          </>
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
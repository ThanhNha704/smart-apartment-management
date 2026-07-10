import { useState, useEffect } from 'react';
import { Camera, Upload, Calendar, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface Room {
  id: string;
  roomNumber: string;
  tenantName: string;
}

interface MeterReadingItem {
  id: string;
  roomNumber: string;
  tenantName: string;
  typeLabel: string; // 0: điện, 1: nước
  month: number;
  year: number;
  previousIndex: number;
  currentIndex: number;
  usageLabel: string;
  unitPrice: number;
  total: number;
  photoUrl: string;
}

export default function MeterReading() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [readings, setReadings] = useState<MeterReadingItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedRoomNumber, setSelectedRoomNumber] = useState('');
  const [currentIndex, setCurrentIndex] = useState('');
  const [meterType, setMeterType] = useState<'0' | '1'>('0'); // Giả định: 0 = Điện, 1 = Nước
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Tải danh sách phòng và lịch sử ghi số từ API khi load trang
  useEffect(() => {
    fetchRooms();
    fetchReadings();
  }, []);

  const fetchRooms = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/Rooms`);
      if (!response.ok) throw new Error('Không thể tải dữ liệu');
      const data: Room[] = await response.json();
      setRooms(data);
    } catch (error) {
      toast.error('Lỗi khi lấy danh sách phòng từ server!');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReadings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/MeterReadings`);
      if (!response.ok) throw new Error('Không thể tải dữ liệu');
      const data: MeterReadingItem[] = await response.json();
      setReadings(data);
    } catch (error) {
      toast.error('Lỗi khi tải lịch sử ghi số từ server!');
      console.error('Lỗi tải lịch sử ghi số:', error);
    }
  };

  // 2. Xử lý khi người dùng chọn file ảnh (OCR thực tế qua API nhận diện)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedRoomNumber) {
      toast.error('Vui lòng chọn phòng trước khi tải ảnh!');
      return;
    }

    setSelectedFile(file);
    setIsScanning(true);

    // Chuẩn bị FormData để gửi lên API POST /api/MeterReadings xử lý OCR
    const formData = new FormData();
    formData.append('RoomNumber', selectedRoomNumber);
    formData.append('MeterIndex', '0'); // Giá trị tạm thời, backend OCR sẽ ghi đè hoặc phân tích
    formData.append('Type', meterType);
    formData.append('Photo', file);

    try {
      const res = await fetch('/api/MeterReadings', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const result = await res.json();
        // Cập nhật số công tơ lấy về từ phản hồi nhận diện của backend
        setCurrentIndex(result.currentIndex?.toString() || '');
        toast.success('Đã quét ảnh và nhận diện số công tơ thành công!');
        fetchReadings(); // Tải lại lịch sử
      } else {
        const errText = await res.text();
        toast.error(`Quét ảnh thất bại: ${errText || 'Lỗi hệ thống'}`);
      }
    } catch (error) {
      toast.error('Không thể kết nối tới máy chủ OCR');
    } finally {
      setIsScanning(false);
    }
  };

  // 3. Xử lý lưu/Xác nhận số công tơ nhập thủ công (hoặc khi chỉnh sửa lại số OCR)
  const handleSubmitReading = async () => {
    if (!selectedRoomNumber || !currentIndex) {
      toast.error('Vui lòng chọn phòng và nhập số công tơ!');
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('RoomNumber', selectedRoomNumber);
    formData.append('MeterIndex', currentIndex);
    formData.append('Type', meterType);
    if (selectedFile) {
      formData.append('Photo', selectedFile);
    }

    try {
      const res = await fetch('/api/MeterReadings', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        toast.success(`Đã ghi số công tơ cho phòng ${selectedRoomNumber} thành công!`);
        setSelectedRoomNumber('');
        setCurrentIndex('');
        setSelectedFile(null);
        fetchReadings(); // Reload lịch sử hiển thị
      } else {
        toast.error('Ghi số công tơ thất bại. Vui lòng kiểm tra lại dữ liệu.');
      }
    } catch (error) {
      toast.error('Lỗi kết nối máy chủ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Đọc số công tơ</h1>
        <p className="text-gray-600">Ghi nhận số công tơ hàng tháng bằng OCR tích hợp hoặc nhập thủ công</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* KHU VỰC ĐỌC CÔNG TƠ */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold mb-4 text-gray-800">Nhập số công tơ</h3>

            <div className="space-y-4">
              {/* Loại dịch vụ */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Loại công tơ</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="meterType"
                      checked={meterType === '0'}
                      onChange={() => setMeterType('0')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    Công tơ Điện
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="meterType"
                      checked={meterType === '1'}
                      onChange={() => setMeterType('1')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    Công tơ Nước
                  </label>
                </div>
              </div>

              {/* Bước 1: Chọn phòng */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Chọn phòng cần đọc</label>
                <select
                  value={selectedRoomNumber}
                  onChange={(e) => setSelectedRoomNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Chọn phòng --</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.roomNumber}>
                      {room.roomNumber} - {room.tenantName || 'Chưa có khách'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bước 2: Quét ảnh (OCR) qua input file thực tế */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50 relative">
                {isScanning ? (
                  <div className="space-y-3 py-4">
                    <div className="w-12 h-12 mx-auto border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-600 text-sm">Đang upload & nhận diện số từ ảnh...</p>
                  </div>
                ) : (
                  <>
                    <Camera className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500 mb-3">Chụp ảnh hoặc tải lên ảnh số công tơ hiện tại</p>
                    <div className="flex gap-2 justify-center">
                      <label className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-1.5 transition-colors cursor-pointer">
                        <Upload className="w-4 h-4" />
                        Chọn file / Máy ảnh
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </label>
                    </div>
                    {selectedFile && (
                      <p className="text-xs text-green-600 mt-2 font-medium">Tệp đã chọn: {selectedFile.name}</p>
                    )}
                  </>
                )}
              </div>

              {/* Bước 3: Số công tơ hiện tại */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Số công tơ hiện tại</label>
                <input
                  type="number"
                  value={currentIndex}
                  onChange={(e) => setCurrentIndex(e.target.value)}
                  placeholder="Nhập thủ công hoặc hệ thống tự điền sau khi quét ảnh"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmitReading}
            disabled={isSubmitting || isScanning}
            className="w-full mt-6 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center gap-2 font-medium transition-colors"
          >
            <CheckCircle className="w-5 h-5" />
            {isSubmitting ? 'Đang lưu kết quả...' : 'Xác nhận ghi số'}
          </button>
        </div>

        {/* LỊCH SỬ GHI SỐ THỰC TẾ TỪ API */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 overflow-y-auto max-h-[600px]">
          <h3 className="font-semibold mb-4 text-gray-800">Lịch sử ghi số gần đây</h3>
          <div className="space-y-3">
            {readings.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Chưa có dữ liệu ghi nhận chỉ số.</p>
            ) : (
              readings.map((reading) => (
                <div key={reading.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900">
                        Phòng {reading.roomNumber} - {reading.tenantName || 'N/A'}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Thánɡ {reading.month}/{reading.year}
                        </span>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full font-medium">
                          {reading.typeLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm mt-3 pt-2 border-t border-gray-100">
                    <div>
                      <p className="text-gray-500 text-xs">Số cũ</p>
                      <p className="font-medium text-gray-700">{reading.previousIndex}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Số mới</p>
                      <p className="font-medium text-gray-700">{reading.currentIndex}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Tiêu thụ</p>
                      <p className="font-semibold text-blue-600">{reading.usageLabel}</p>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center">
                    <p className="text-sm text-gray-600">Đơn giá: {reading.unitPrice.toLocaleString('vi-VN')} ₫</p>
                    <span className="font-semibold text-green-600">
                      {reading.total.toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* HƯỚNG DẪN */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-1">💡 Hướng dẫn tích hợp thực tế</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Chọn chính xác <strong>Loại công tơ (Điện/Nước)</strong> và <strong>Phòng</strong> trước khi thao tác file.</li>
          <li>• Sử dụng nút tải ảnh lên để gọi trực tiếp API OCR `POST /api/MeterReadings` truyền dữ liệu dạng `multipart/form-data`.</li>
          <li>• Nếu ảnh mờ hoặc nhận diện sai, bạn có thể tự do ghi đè/nhập lại thủ công vào ô <strong>Số công tơ hiện tại</strong> rồi bấm Xác nhận.</li>
        </ul>
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Camera, Upload, Calendar, CheckCircle, Loader2 } from 'lucide-react';
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
  type: string;
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

export default function MeterReading() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [readings, setReadings] = useState<MeterReadingItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedRoomNumber, setSelectedRoomNumber] = useState('');
  const [currentIndex, setCurrentIndex] = useState('');
  const [meterType, setMeterType] = useState<string>('Điện');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hàm GET: Tải danh sách phòng và lịch sử ghi số từ hệ thống
  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      const readingsUrl = selectedRoomNumber 
        ? `/MeterReadings/room/${selectedRoomNumber}`
        : '/MeterReadings';

      const [roomsRes, readingsRes] = await Promise.all([
        fetchApi('/Rooms'),
        fetchApi(readingsUrl),
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

  // Tự động tải lại lịch sử khi người dùng thay đổi phòng chọn lọc
  useEffect(() => {
    fetchData();
  }, [selectedRoomNumber]);

  // Hàm POST: Xử lý khi người dùng chọn file ảnh gửi dạng Multipart (OCR)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedRoomNumber) {
      toast.error('Vui lòng chọn phòng trước khi tải ảnh!');
      e.target.value = '';
      return;
    }

    setSelectedFile(file);
    setIsScanning(true);

    const formData = new FormData();
    formData.append('RoomNumber', selectedRoomNumber);
    formData.append('MeterIndex', '0'); 
    formData.append('Type', meterType);
    formData.append('Photo', file);

    try {
      const res = await fetchApi('/MeterReadings', {
        method: 'POST',
        body: formData, 
      });

      if (res.ok) {
        const result = await res.json();
        setCurrentIndex(result.currentIndex?.toString() || '');
        toast.success('Đã quét ảnh và nhận diện số công tơ thành công!');
        fetchData(); 
      } else {
        const errorData = await res.json().catch(() => null);
        toast.error(errorData?.message || 'Quét ảnh thất bại hoặc lỗi định dạng!');
      }
    } catch (error) {
      console.error(error);
      toast.error('Không thể kết nối tới máy chủ OCR');
    } finally {
      setIsScanning(false);
    }
  };

  // Hàm POST: Xác nhận/Lưu thủ công chỉ số công tơ
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
      const res = await fetchApi('/MeterReadings', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        toast.success(`Đã ghi số công tơ cho phòng ${selectedRoomNumber} thành công!`);
        setSelectedRoomNumber('');
        setCurrentIndex('');
        setSelectedFile(null);
        fetchData(); 
      } else {
        const errorData = await res.json().catch(() => null);
        toast.error(errorData?.message || 'Ghi số công tơ thất bại. Vui lòng kiểm tra lại!');
      }
    } catch (error) {
      console.error(error);
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
                      checked={meterType === 'Điện'}
                      onChange={() => setMeterType('Điện')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    Công tơ Điện
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="meterType"
                      checked={meterType === 'Nước'}
                      onChange={() => setMeterType('Nước')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    Công tơ Nước
                  </label>
                </div>
              </div>

              {/* Chọn phòng */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Chọn phòng cần đọc</label>
                <select
                  value={selectedRoomNumber}
                  onChange={(e) => setSelectedRoomNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Tất cả các phòng --</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.roomNumber}>
                      {room.roomNumber} - {room.tenantName || 'Chưa có khách'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quét ảnh (OCR) qua input file thực tế */}
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

              {/* Số công tơ hiện tại */}
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
            disabled={isSubmitting || isScanning || isLoading}
            className="w-full mt-6 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center gap-2 font-medium transition-colors"
          >
            <CheckCircle className="w-5 h-5" />
            {isSubmitting ? 'Đang lưu kết quả...' : 'Xác nhận ghi số'}
          </button>
        </div>

        {/* LỊCH SỬ GHI SỐ THỰC TẾ */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 overflow-y-auto max-h-[600px]">
          <h3 className="font-semibold mb-4 text-gray-800">
            {selectedRoomNumber ? `Lịch sử ghi số phòng ${selectedRoomNumber}` : 'Lịch sử ghi số gần đây'}
          </h3>
          <div className="space-y-3">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <p className="text-xs">Đang đồng bộ lịch sử chỉ số...</p>
              </div>
            ) : readings.length === 0 ? (
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
                          <Calendar className="w-3 h-3" /> Tháng {reading.month}/{reading.year}
                        </span>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full font-medium">
                          {reading.typeLabel || reading.type}
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
                      <p className="font-semibold text-blue-600">
                        {reading.usageLabel || `${reading.usage} ${reading.type === 'Điện' ? 'kWh' : 'm³'}`}
                      </p>
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
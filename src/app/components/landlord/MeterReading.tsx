import { useState } from 'react';
import { Camera, Upload, Calendar, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Reading {
  id: string;
  room: string;
  tenant: string;
  previousReading: number;
  currentReading: number;
  usage: number;
  amount: number;
  date: string;
}

const initialReadings: Reading[] = [
  {
    id: '1',
    room: 'P101',
    tenant: 'Nguyễn Văn A',
    previousReading: 1250,
    currentReading: 1400,
    usage: 150,
    amount: 450000,
    date: '2026-05-28',
  },
  {
    id: '2',
    room: 'P103',
    tenant: 'Trần Thị B',
    previousReading: 2100,
    currentReading: 2280,
    usage: 180,
    amount: 540000,
    date: '2026-05-28',
  },
];

export default function MeterReading() {
  const [readings] = useState<Reading[]>(initialReadings);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const handleScanImage = () => {
    if (!selectedRoom) {
      toast.error('Vui lòng chọn phòng trước khi quét ảnh!');
      return;
    }
    setIsScanning(true);
    setTimeout(() => {
      const randomValue = Math.floor(Math.random() * 1000 + 1500);
      setCurrentValue(randomValue.toString());
      setIsScanning(false);
      toast.success('Đã quét thành công! Số công tơ: ' + randomValue);
    }, 2000);
  };

  const handleSubmitReading = () => {
    if (!selectedRoom || !currentValue) {
      toast.error('Vui lòng chọn phòng và nhập số công tơ!');
      return;
    }
    toast.success(`Đã ghi số công tơ cho phòng ${selectedRoom} thành công!`);
    setSelectedRoom('');
    setCurrentValue('');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Đọc số công tơ</h1>
        <p className="text-gray-600">Ghi nhận số công tơ hàng tháng bằng OCR hoặc nhập thủ công</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* KHU VỰC ĐỌC CÔNG TƠ */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold mb-4 text-gray-800">Nhập số công tơ</h3>

            <div className="space-y-4">
              {/* Bước 1: Chọn phòng */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Chọn phòng cần đọc</label>
                <select
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Chọn phòng --</option>
                  <option value="P101">P101 - Nguyễn Văn A</option>
                  <option value="P103">P103 - Trần Thị B</option>
                  <option value="P201">P201 - Lê Văn C</option>
                </select>
              </div>

              {/* Bước 2: Quét ảnh (OCR) hoặc tải lên */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
                {isScanning ? (
                  <div className="space-y-3 py-4">
                    <div className="w-12 h-12 mx-auto border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-600 text-sm">Đang nhận diện số từ ảnh...</p>
                  </div>
                ) : (
                  <>
                    <Camera className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500 mb-3">Chụp ảnh hoặc tải lên ảnh số công tơ</p>
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={handleScanImage}
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-1.5 transition-colors"
                      >
                        <Camera className="w-4 h-4" />
                        Chụp ảnh
                      </button>
                      <button
                        onClick={handleScanImage}
                        className="px-3 py-1.5 border border-gray-300 bg-white text-sm text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-1.5 transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        Tải ảnh lên
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Bước 3: Số công tơ hiện tại */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Số công tơ hiện tại</label>
                <input
                  type="number"
                  value={currentValue}
                  onChange={(e) => setCurrentValue(e.target.value)}
                  placeholder="Nhập thủ công hoặc quét từ ảnh ở trên"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmitReading}
            className="w-full mt-6 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 font-medium transition-colors"
          >
            <CheckCircle className="w-5 h-5" />
            Xác nhận ghi số
          </button>
        </div>

        {/* LỊCH SỬ GHI SỐ */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold mb-4 text-gray-800">Lịch sử ghi số gần đây</h3>
          <div className="space-y-3">
            {readings.map((reading) => (
              <div key={reading.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-900">{reading.room} - {reading.tenant}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {new Date(reading.date).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm mt-3 pt-2 border-t border-gray-100">
                  <div>
                    <p className="text-gray-500 text-xs">Số cũ</p>
                    <p className="font-medium text-gray-700">{reading.previousReading}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Số mới</p>
                    <p className="font-medium text-gray-700">{reading.currentReading}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Tiêu thụ</p>
                    <p className="font-semibold text-blue-600">
                      {reading.usage} Chỉ số
                    </p>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center">
                  <p className="text-sm text-gray-600">Thành tiền:</p>
                  <span className="font-semibold text-green-600">{reading.amount.toLocaleString('vi-VN')} ₫</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* HƯỚNG DẪN */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-1">💡 Hướng dẫn nhanh</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Bước 1: Chọn phòng cần nhập hoặc quét số.</li>
          <li>• Bước 2: Chụp/tải ảnh công tơ để hệ thống OCR tự điền số, hoặc bạn có thể tự tay gõ vào ô nhập liệu.</li>
          <li>• Bước 3: Kiểm tra kỹ lại số hiển thị và ấn nút <strong>Xác nhận ghi số</strong>.</li>
        </ul>
      </div>
    </div>
  );
}
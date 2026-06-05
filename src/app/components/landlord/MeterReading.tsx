import { useState } from 'react';
import { Camera, Upload, Zap, Droplets, Calendar, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Reading {
  id: string;
  room: string;
  tenant: string;
  type: 'electricity' | 'water';
  previousReading: number;
  currentReading: number;
  usage: number;
  amount: number;
  date: string;
  imageUrl?: string;
}

const initialReadings: Reading[] = [
  {
    id: '1',
    room: 'P101',
    tenant: 'Nguyễn Văn A',
    type: 'electricity',
    previousReading: 1250,
    currentReading: 1400,
    usage: 150,
    amount: 450000,
    date: '2026-05-28',
  },
  {
    id: '2',
    room: 'P101',
    tenant: 'Nguyễn Văn A',
    type: 'water',
    previousReading: 88,
    currentReading: 100,
    usage: 12,
    amount: 120000,
    date: '2026-05-28',
  },
  {
    id: '3',
    room: 'P103',
    tenant: 'Trần Thị B',
    type: 'electricity',
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
  const [meterType, setMeterType] = useState<'electricity' | 'water'>('electricity');
  const [currentValue, setCurrentValue] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const handleScanImage = () => {
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
    toast.success('Đã ghi số công tơ thành công!');
    setSelectedRoom('');
    setCurrentValue('');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Đọc số công tơ</h1>
        <p className="text-gray-600">Ghi nhận số điện nước hàng tháng bằng OCR hoặc nhập thủ công</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold mb-4">Quét công tơ tự động (OCR)</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Chọn phòng</label>
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

            <div>
              <label className="block text-sm font-medium mb-2">Loại công tơ</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setMeterType('electricity')}
                  className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                    meterType === 'electricity'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Zap className={`w-6 h-6 mx-auto mb-1 ${meterType === 'electricity' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className="text-sm">Điện</span>
                </button>
                <button
                  onClick={() => setMeterType('water')}
                  className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                    meterType === 'water'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Droplets className={`w-6 h-6 mx-auto mb-1 ${meterType === 'water' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className="text-sm">Nước</span>
                </button>
              </div>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              {isScanning ? (
                <div className="space-y-3">
                  <div className="w-16 h-16 mx-auto border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-gray-600">Đang quét ảnh công tơ...</p>
                </div>
              ) : (
                <>
                  <Camera className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600 mb-4">Chụp ảnh hoặc tải lên ảnh công tơ</p>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={handleScanImage}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      Chụp ảnh
                    </button>
                    <button
                      onClick={handleScanImage}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Tải lên
                    </button>
                  </div>
                </>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Số công tơ hiện tại</label>
              <input
                type="number"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                placeholder="Nhập hoặc quét từ ảnh"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={handleSubmitReading}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Xác nhận ghi số
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold mb-4">Lịch sử ghi số gần đây</h3>
          <div className="space-y-3">
            {readings.map((reading) => (
              <div key={reading.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {reading.type === 'electricity' ? (
                      <Zap className="w-5 h-5 text-yellow-600" />
                    ) : (
                      <Droplets className="w-5 h-5 text-blue-600" />
                    )}
                    <div>
                      <p className="font-medium">{reading.room} - {reading.tenant}</p>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {new Date(reading.date).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                  </div>
                  <span className={`text-sm px-2 py-1 rounded ${
                    reading.type === 'electricity'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {reading.type === 'electricity' ? 'Điện' : 'Nước'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-gray-600 text-xs">Số cũ</p>
                    <p className="font-medium">{reading.previousReading}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Số mới</p>
                    <p className="font-medium">{reading.currentReading}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Tiêu thụ</p>
                    <p className="font-medium text-blue-600">
                      {reading.usage} {reading.type === 'electricity' ? 'kWh' : 'm³'}
                    </p>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <p className="text-sm text-gray-600">Thành tiền: <span className="font-semibold text-green-600">{reading.amount.toLocaleString('vi-VN')} ₫</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">💡 Hướng dẫn quét công tơ</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Chụp ảnh rõ nét, đủ ánh sáng, tránh bị mờ hoặc nhòe</li>
          <li>• Đảm bảo các chữ số trên công tơ hiển thị rõ ràng</li>
          <li>• Hệ thống OCR sẽ tự động nhận diện và điền số công tơ</li>
          <li>• Kiểm tra lại số liệu trước khi xác nhận</li>
        </ul>
      </div>
    </div>
  );
}

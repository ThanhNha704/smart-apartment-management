import { useState } from 'react';
import { Save, Bell, DollarSign, Mail, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const [settings, setSettings] = useState({
    electricityPrice: 3000,
    waterPrice: 10000,
    servicePrice: 200000,
    paymentDueDay: 5,
    autoReminder: true,
    reminderDaysBefore: 3,
    smsNotification: true,
    emailNotification: true,
    bankName: 'Vietcombank',
    bankAccount: '1234567890',
    bankAccountName: 'NGUYEN VAN A',
  });

  const handleSave = () => {
    toast.success('Đã lưu cài đặt thành công!');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Cài đặt</h1>
        <p className="text-gray-600">Cấu hình hệ thống và thông báo</p>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold">Đơn giá dịch vụ</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Giá điện (₫/kWh)</label>
              <input
                type="number"
                value={settings.electricityPrice}
                onChange={(e) => setSettings({ ...settings, electricityPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Giá nước (₫/m³)</label>
              <input
                type="number"
                value={settings.waterPrice}
                onChange={(e) => setSettings({ ...settings, waterPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Phí dịch vụ (₫/tháng)</label>
              <input
                type="number"
                value={settings.servicePrice}
                onChange={(e) => setSettings({ ...settings, servicePrice: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Internet, rác, vệ sinh chung</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Hạn thanh toán (ngày/tháng)</label>
              <input
                type="number"
                value={settings.paymentDueDay}
                onChange={(e) => setSettings({ ...settings, paymentDueDay: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max="31"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold">Thông báo tự động</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Kích hoạt nhắc nợ tự động</p>
                <p className="text-sm text-gray-600">Gửi thông báo tự động đến người thuê</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoReminder}
                  onChange={(e) => setSettings({ ...settings, autoReminder: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Nhắc trước hạn thanh toán (ngày)</label>
              <input
                type="number"
                value={settings.reminderDaysBefore}
                onChange={(e) => setSettings({ ...settings, reminderDaysBefore: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max="10"
                disabled={!settings.autoReminder}
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium">Thông báo SMS</p>
                  <p className="text-sm text-gray-600">Gửi SMS đến số điện thoại</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.smsNotification}
                  onChange={(e) => setSettings({ ...settings, smsNotification: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium">Thông báo Email</p>
                  <p className="text-sm text-gray-600">Gửi email đến địa chỉ email</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.emailNotification}
                  onChange={(e) => setSettings({ ...settings, emailNotification: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold mb-4">Thông tin thanh toán</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Ngân hàng</label>
              <input
                type="text"
                value={settings.bankName}
                onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Số tài khoản</label>
              <input
                type="text"
                value={settings.bankAccount}
                onChange={(e) => setSettings({ ...settings, bankAccount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tên chủ tài khoản</label>
              <input
                type="text"
                value={settings.bankAccountName}
                onChange={(e) => setSettings({ ...settings, bankAccountName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                Thông tin này sẽ được hiển thị trên hóa đơn và QR code thanh toán
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            Lưu cài đặt
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Search, Plus, Download, Eye, QrCode, CheckCircle, Clock, XCircle } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { toast } from 'sonner';
import axios from 'axios';

// Cấu hình Base URL của Backend API (bạn sửa lại port/domain cho đúng với môi trường của bạn)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface Invoice {
  id: string;
  invoiceNumber: string;
  roomNumber: string;
  tenantName: string;
  billingPeriod: string;
  dueDate: string;
  status: number; // 0 = Chờ thanh toán, 1 = Đã thanh toán, 2 = Quá hạn
  statusLabel: string;
  roomPrice: number;
  electricUsage: number;
  electricPrice: number;
  electricTotal: number;
  waterUsage: number;
  waterPrice: number;
  serviceFee: number;
  amount: number;
}

export default function InvoiceManagement() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsisLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  const [createFormData, setCreateFormData] = useState({
    roomNumber: '',
    tenantName: '',
    billingPeriod: '',
    electricUsage: 0,
    waterUsage: 0,
    electricPrice: 3000,
    waterPrice: 10000,
    serviceFee: 200000,
    roomPrice: 2500000,
  });

  // 1. Hàm GET lấy dữ liệu thật từ Backend
  const fetchInvoices = async () => {
    try {
      setIsisLoading(true);
            const response = await fetch(`${API_BASE_URL}/Invoices`);
            if (!response.ok) throw new Error('Không thể tải dữ liệu');
            const data: Invoice[] = await response.json();
            setInvoices(data);
          } catch (error) {
            toast.error('Lỗi khi lấy danh sách hóa đơn từ server!');
            console.error(error);
          } finally {
            setIsisLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // 2. Hàm POST gửi dữ liệu thật lên Backend để tạo hóa đơn
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const electricAmount = createFormData.electricUsage * createFormData.electricPrice;
    const waterAmount = createFormData.waterUsage * createFormData.waterPrice;
    const totalAmount = createFormData.roomPrice + electricAmount + waterAmount + createFormData.serviceFee;

    // Payload chuẩn chỉnh theo Swagger của bạn
    const payload = {
      roomNumber: createFormData.roomNumber,
      tenantName: createFormData.tenantName,
      billingPeriod: createFormData.billingPeriod,
      roomPrice: createFormData.roomPrice,
      electricUsage: createFormData.electricUsage,
      electricPrice: createFormData.electricPrice,
      waterUsage: createFormData.waterUsage,
      waterPrice: createFormData.waterPrice,
      serviceFee: createFormData.serviceFee,
      amount: totalAmount,
      dueDate: new Date(new Date().setDate(5)).toISOString() 
    };

    try {
      await axios.post(API_BASE_URL, payload);
      toast.success('Đã tạo và lưu hóa đơn lên hệ thống thành công!');
      setIsCreateDialogOpen(false);
      
      // Reset Form và load lại bảng dữ liệu mới nhất
      setCreateFormData({
        roomNumber: '',
        tenantName: '',
        billingPeriod: '',
        electricUsage: 0,
        waterUsage: 0,
        electricPrice: 3000,
        waterPrice: 10000,
        serviceFee: 200000,
        roomPrice: 2500000,
      });
      fetchInvoices();
    } catch (error) {
      console.error(error);
      toast.error('Lỗi khi tạo hóa đơn, vui lòng kiểm tra lại!');
    }
  };

  // 3. Hàm PUT để cập nhật trạng thái thanh toán thật (Tận dụng endpoint pay có sẵn của bạn)
  const handlePayInvoice = async (id: string) => {
    try {
      await axios.put(`${API_BASE_URL}/${id}/pay`);
      toast.success('Xác nhận thanh toán thành công!');
      if (selectedInvoice) setSelectedInvoice({ ...selectedInvoice, status: 1, statusLabel: 'Đã thanh toán' });
      fetchInvoices(); // Cập nhật lại danh sách bên ngoài
    } catch (error) {
      console.error(error);
      toast.error('Không thể cập nhật trạng thái thanh toán!');
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = (invoice.invoiceNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                          (invoice.tenantName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                          (invoice.roomNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || String(invoice.status) === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: number, label: string) => {
    const configs = {
      1: { icon: CheckCircle, className: 'bg-green-100 text-green-700' },
      0: { icon: Clock, className: 'bg-yellow-100 text-yellow-700' },
      2: { icon: XCircle, className: 'bg-red-100 text-red-700' },
    };
    const config = configs[status as keyof typeof configs] || { icon: Clock, className: 'bg-gray-100 text-gray-700' };
    const Icon = config.icon;
    return (
      <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.className}`}>
        <Icon className="w-4 h-4" />
        {label || 'Chờ xử lý'}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Quản lý hóa đơn</h1>
        <p className="text-gray-600">Dữ liệu thời gian thực được kết nối trực tiếp với hệ thống</p>
      </div>

      {/* Tìm kiếm & Bộ lọc */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm hóa đơn, phòng, người thuê..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="1">Đã thanh toán</option>
              <option value="0">Chờ thanh toán</option>
              <option value="2">Quá hạn</option>
            </select>
            <button
              onClick={() => setIsCreateDialogOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Tạo hóa đơn
            </button>
          </div>
        </div>
      </div>

      {/* Bảng Hiển Thị */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-10 text-center text-gray-500">Đang tải dữ liệu thực...</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã hóa đơn</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phòng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người thuê</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kỳ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng tiền</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hạn thanh toán</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-gray-500">Không tìm thấy hóa đơn nào</td>
                  </tr>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{invoice.invoiceNumber || `ID: ${invoice.id}`}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{invoice.roomNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{invoice.tenantName}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{invoice.billingPeriod}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-blue-600 font-medium">
                        {(invoice.amount || 0).toLocaleString('vi-VN')} ₫
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('vi-VN') : '---'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(invoice.status, invoice.statusLabel)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setSelectedInvoice(invoice)} className="p-2 hover:bg-gray-100 rounded-lg" title="Xem chi tiết">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setSelectedInvoice(invoice); setShowQRDialog(true); }} className="p-2 hover:bg-gray-100 rounded-lg" title="QR Code">
                            <QrCode className="w-4 h-4" />
                          </button>
                          {/* <button className="p-2 hover:bg-gray-100 rounded-lg" title="Tải xuống">
                            <Download className="w-4 h-4" />
                          </button> */}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Dialog Chi Tiết Hóa Đơn & Xử lý Thanh Toán */}
      <Dialog.Root open={selectedInvoice !== null && !showQRDialog} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-auto">
            {selectedInvoice && (
              <>
                <Dialog.Title className="text-xl font-semibold mb-4">Chi tiết hóa đơn hệ thống</Dialog.Title>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-200">
                    <div>
                      <p className="text-sm text-gray-600">Mã hóa đơn</p>
                      <p className="font-medium">{selectedInvoice.invoiceNumber || `ID: ${selectedInvoice.id}`}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Kỳ thanh toán</p>
                      <p className="font-medium">{selectedInvoice.billingPeriod}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phòng</p>
                      <p className="font-medium">{selectedInvoice.roomNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Người thuê</p>
                      <p className="font-medium">{selectedInvoice.tenantName}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Chi tiết dòng tiền</h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span>Tiền phòng</span>
                        <span className="font-medium">{(selectedInvoice.roomPrice || 0).toLocaleString('vi-VN')} ₫</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Điện ({selectedInvoice.electricUsage} kWh × {selectedInvoice.electricPrice} ₫)</span>
                        <span className="font-medium">{(selectedInvoice.electricUsage * selectedInvoice.electricPrice).toLocaleString('vi-VN')} ₫</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Nước ({selectedInvoice.waterUsage} m³ × {selectedInvoice.waterPrice} ₫)</span>
                        <span className="font-medium">{(selectedInvoice.waterUsage * selectedInvoice.waterPrice).toLocaleString('vi-VN')} ₫</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Phí dịch vụ cố định</span>
                        <span className="font-medium">{(selectedInvoice.serviceFee || 0).toLocaleString('vi-VN')} ₫</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-gray-200 text-lg">
                        <span className="font-semibold">Tổng số tiền cần thu</span>
                        <span className="font-semibold text-blue-600">{(selectedInvoice.amount || 0).toLocaleString('vi-VN')} ₫</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Dialog.Close className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Đóng</Dialog.Close>
                    {selectedInvoice.status !== 1 && (
                      <button
                        onClick={() => handlePayInvoice(selectedInvoice.id)}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Xác nhận thanh toán
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Dialog QR Code Thanh Toán */}
      <Dialog.Root open={showQRDialog} onOpenChange={setShowQRDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md">
            <Dialog.Title className="text-xl font-semibold mb-4">Mã QR Thanh Toán</Dialog.Title>
            {selectedInvoice && (
              <div className="text-center">
                <div className="bg-gray-100 rounded-lg p-8 mb-4">
                  <div className="w-64 h-64 mx-auto bg-white rounded-lg flex items-center justify-center">
                    <QrCode className="w-48 h-48 text-gray-400" />
                  </div>
                </div>
                <p className="font-medium mb-1">{selectedInvoice.invoiceNumber}</p>
                <p className="text-2xl font-semibold text-blue-600 mb-4">
                  {(selectedInvoice.amount || 0).toLocaleString('vi-VN')} ₫
                </p>
                <div className="flex gap-2">
                  <Dialog.Close className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Đóng</Dialog.Close>
                  {selectedInvoice.status !== 1 && (
                    <button onClick={() => { handlePayInvoice(selectedInvoice.id); setShowQRDialog(false); }} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Đã thanh toán
                    </button>
                  )}
                </div>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Dialog Tạo Mới Hóa Đơn */}
      <Dialog.Root open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-auto">
            <Dialog.Title className="text-xl font-semibold mb-4">Tạo hóa đơn mới</Dialog.Title>
            <form className="space-y-4" onSubmit={handleCreateInvoice}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Số phòng</label>
                  <input
                    type="text"
                    value={createFormData.roomNumber}
                    onChange={(e) => setCreateFormData({...createFormData, roomNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Ví dụ: P101"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Họ tên người thuê</label>
                  <input
                    type="text"
                    value={createFormData.tenantName}
                    onChange={(e) => setCreateFormData({...createFormData, tenantName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Nguyễn Văn A"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Kỳ thanh toán</label>
                <input
                  type="text"
                  value={createFormData.billingPeriod}
                  onChange={(e) => setCreateFormData({...createFormData, billingPeriod: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Tháng 07/2026"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tiền phòng gốc (VNĐ)</label>
                <input
                  type="number"
                  value={createFormData.roomPrice}
                  onChange={(e) => setCreateFormData({...createFormData, roomPrice: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Sản lượng điện tiêu thụ (kWh)</label>
                  <input
                    type="number"
                    value={createFormData.electricUsage}
                    onChange={(e) => setCreateFormData({...createFormData, electricUsage: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Đơn giá điện (Đồng/kWh)</label>
                  <input
                    type="number"
                    value={createFormData.electricPrice}
                    onChange={(e) => setCreateFormData({...createFormData, electricPrice: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Khối lượng nước tiêu thụ (m³)</label>
                  <input
                    type="number"
                    value={createFormData.waterUsage}
                    onChange={(e) => setCreateFormData({...createFormData, waterUsage: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Đơn giá nước (Đồng/m³)</label>
                  <input
                    type="number"
                    value={createFormData.waterPrice}
                    onChange={(e) => setCreateFormData({...createFormData, waterPrice: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Phí dịch vụ phát sinh (VNĐ)</label>
                <input
                  type="number"
                  value={createFormData.serviceFee}
                  onChange={(e) => setCreateFormData({...createFormData, serviceFee: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Xem trước tổng tiền</h4>
                <div className="space-y-1 text-sm text-gray-700">
                  <div className="flex justify-between">
                    <span>Tổng tiền hóa đơn dự kiến:</span>
                    <span className="font-bold text-blue-600 text-base">
                      {(createFormData.roomPrice +
                        createFormData.electricUsage * createFormData.electricPrice +
                        createFormData.waterUsage * createFormData.waterPrice +
                        createFormData.serviceFee).toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Dialog.Close className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Hủy</Dialog.Close>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Lưu dữ liệu thật</button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
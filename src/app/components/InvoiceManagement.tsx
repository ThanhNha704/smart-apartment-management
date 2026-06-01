import { useState } from 'react';
import { Search, Plus, Download, Eye, QrCode, CheckCircle, Clock, XCircle } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { toast } from 'sonner';

interface Invoice {
  id: string;
  invoiceNumber: string;
  room: string;
  tenant: string;
  month: string;
  rentAmount: number;
  electricityUsage: number;
  electricityAmount: number;
  waterUsage: number;
  waterAmount: number;
  serviceAmount: number;
  totalAmount: number;
  status: 'paid' | 'pending' | 'overdue';
  dueDate: string;
  paidDate?: string;
}

const initialInvoices: Invoice[] = [
  {
    id: '1',
    invoiceNumber: 'INV-2026-001',
    room: 'P101',
    tenant: 'Nguyễn Văn A',
    month: 'Tháng 5/2026',
    rentAmount: 2500000,
    electricityUsage: 150,
    electricityAmount: 450000,
    waterUsage: 12,
    waterAmount: 120000,
    serviceAmount: 200000,
    totalAmount: 3270000,
    status: 'paid',
    dueDate: '2026-05-05',
    paidDate: '2026-05-03',
  },
  {
    id: '2',
    invoiceNumber: 'INV-2026-002',
    room: 'P102',
    tenant: 'Trần Thị B',
    month: 'Tháng 5/2026',
    rentAmount: 2800000,
    electricityUsage: 180,
    electricityAmount: 540000,
    waterUsage: 15,
    waterAmount: 150000,
    serviceAmount: 200000,
    totalAmount: 3690000,
    status: 'pending',
    dueDate: '2026-06-05',
  },
  {
    id: '3',
    invoiceNumber: 'INV-2026-003',
    room: 'P201',
    tenant: 'Lê Văn C',
    month: 'Tháng 5/2026',
    rentAmount: 3000000,
    electricityUsage: 200,
    electricityAmount: 600000,
    waterUsage: 18,
    waterAmount: 180000,
    serviceAmount: 200000,
    totalAmount: 3980000,
    status: 'overdue',
    dueDate: '2026-05-25',
  },
];

export default function InvoiceManagement() {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    room: '',
    tenant: '',
    month: '',
    electricityUsage: 0,
    waterUsage: 0,
    electricityPrice: 3000,
    waterPrice: 10000,
    serviceAmount: 200000,
    rentAmount: 2500000,
  });

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.tenant.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.room.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || invoice.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    const configs = {
      paid: { icon: CheckCircle, label: 'Đã thanh toán', className: 'bg-green-100 text-green-700' },
      pending: { icon: Clock, label: 'Chờ thanh toán', className: 'bg-yellow-100 text-yellow-700' },
      overdue: { icon: XCircle, label: 'Quá hạn', className: 'bg-red-100 text-red-700' },
    };
    const config = configs[status as keyof typeof configs];
    const Icon = config.icon;
    return (
      <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${config.className}`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    );
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const electricityAmount = createFormData.electricityUsage * createFormData.electricityPrice;
    const waterAmount = createFormData.waterUsage * createFormData.waterPrice;
    const totalAmount = createFormData.rentAmount + electricityAmount + waterAmount + createFormData.serviceAmount;

    const newInvoice: Invoice = {
      id: String(invoices.length + 1),
      invoiceNumber: `INV-2026-${String(invoices.length + 1).padStart(3, '0')}`,
      room: createFormData.room,
      tenant: createFormData.tenant,
      month: createFormData.month,
      rentAmount: createFormData.rentAmount,
      electricityUsage: createFormData.electricityUsage,
      electricityAmount,
      waterUsage: createFormData.waterUsage,
      waterAmount,
      serviceAmount: createFormData.serviceAmount,
      totalAmount,
      status: 'pending',
      dueDate: new Date(new Date().setDate(5)).toISOString().split('T')[0],
    };

    setInvoices([newInvoice, ...invoices]);
    toast.success('Đã tạo hóa đơn thành công!');
    setIsCreateDialogOpen(false);
    setCreateFormData({
      room: '',
      tenant: '',
      month: '',
      electricityUsage: 0,
      waterUsage: 0,
      electricityPrice: 3000,
      waterPrice: 10000,
      serviceAmount: 200000,
      rentAmount: 2500000,
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Quản lý hóa đơn</h1>
        <p className="text-gray-600">Quản lý và theo dõi các hóa đơn thanh toán</p>
      </div>

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
              <option value="paid">Đã thanh toán</option>
              <option value="pending">Chờ thanh toán</option>
              <option value="overdue">Quá hạn</option>
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

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
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
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{invoice.invoiceNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{invoice.room}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{invoice.tenant}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{invoice.month}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-blue-600 font-medium">
                    {invoice.totalAmount.toLocaleString('vi-VN')} ₫
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(invoice.dueDate).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(invoice.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedInvoice(invoice)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setShowQRDialog(true);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        title="QR Code"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg" title="Tải xuống">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog.Root open={selectedInvoice !== null && !showQRDialog} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-auto">
            {selectedInvoice && (
              <>
                <Dialog.Title className="text-xl font-semibold mb-4">Chi tiết hóa đơn</Dialog.Title>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-200">
                    <div>
                      <p className="text-sm text-gray-600">Mã hóa đơn</p>
                      <p className="font-medium">{selectedInvoice.invoiceNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Kỳ thanh toán</p>
                      <p className="font-medium">{selectedInvoice.month}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phòng</p>
                      <p className="font-medium">{selectedInvoice.room}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Người thuê</p>
                      <p className="font-medium">{selectedInvoice.tenant}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Chi tiết thanh toán</h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span>Tiền phòng</span>
                        <span className="font-medium">{selectedInvoice.rentAmount.toLocaleString('vi-VN')} ₫</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Điện ({selectedInvoice.electricityUsage} kWh × 3,000 ₫)</span>
                        <span className="font-medium">{selectedInvoice.electricityAmount.toLocaleString('vi-VN')} ₫</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Nước ({selectedInvoice.waterUsage} m³ × 10,000 ₫)</span>
                        <span className="font-medium">{selectedInvoice.waterAmount.toLocaleString('vi-VN')} ₫</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Dịch vụ (Internet, rác, vệ sinh)</span>
                        <span className="font-medium">{selectedInvoice.serviceAmount.toLocaleString('vi-VN')} ₫</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-gray-200 text-lg">
                        <span className="font-semibold">Tổng cộng</span>
                        <span className="font-semibold text-blue-600">{selectedInvoice.totalAmount.toLocaleString('vi-VN')} ₫</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Dialog.Close className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Đóng</Dialog.Close>
                    <button
                      onClick={() => {
                        toast.success('Đã gửi thông báo nhắc nợ!');
                      }}
                      className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                    >
                      Gửi nhắc nợ
                    </button>
                    <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Tải hóa đơn
                    </button>
                  </div>
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={showQRDialog} onOpenChange={setShowQRDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md">
            <Dialog.Title className="text-xl font-semibold mb-4">QR Code thanh toán</Dialog.Title>
            {selectedInvoice && (
              <div className="text-center">
                <div className="bg-gray-100 rounded-lg p-8 mb-4">
                  <div className="w-64 h-64 mx-auto bg-white rounded-lg flex items-center justify-center">
                    <QrCode className="w-48 h-48 text-gray-400" />
                  </div>
                </div>
                <p className="font-medium mb-1">{selectedInvoice.invoiceNumber}</p>
                <p className="text-2xl font-semibold text-blue-600 mb-4">
                  {selectedInvoice.totalAmount.toLocaleString('vi-VN')} ₫
                </p>
                <p className="text-sm text-gray-600">Quét mã QR để thanh toán qua VNPay, MoMo, hoặc Banking</p>
                <Dialog.Close className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Đóng
                </Dialog.Close>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Dialog Tạo hóa đơn */}
      <Dialog.Root open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-auto">
            <Dialog.Title className="text-xl font-semibold mb-4">Tạo hóa đơn mới</Dialog.Title>
            <form className="space-y-4" onSubmit={handleCreateInvoice}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Phòng</label>
                  <select
                    value={createFormData.room}
                    onChange={(e) => setCreateFormData({...createFormData, room: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">-- Chọn phòng --</option>
                    <option value="P101">P101</option>
                    <option value="P102">P102</option>
                    <option value="P103">P103</option>
                    <option value="P201">P201</option>
                    <option value="P202">P202</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Người thuê</label>
                  <input
                    type="text"
                    value={createFormData.tenant}
                    onChange={(e) => setCreateFormData({...createFormData, tenant: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nguyễn Văn A"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Kỳ thanh toán</label>
                <input
                  type="text"
                  value={createFormData.month}
                  onChange={(e) => setCreateFormData({...createFormData, month: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tháng 6/2026"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tiền phòng (VNĐ)</label>
                <input
                  type="number"
                  value={createFormData.rentAmount}
                  onChange={(e) => setCreateFormData({...createFormData, rentAmount: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Số điện (kWh)</label>
                  <input
                    type="number"
                    value={createFormData.electricityUsage}
                    onChange={(e) => setCreateFormData({...createFormData, electricityUsage: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Đơn giá điện (VNĐ/kWh)</label>
                  <input
                    type="number"
                    value={createFormData.electricityPrice}
                    onChange={(e) => setCreateFormData({...createFormData, electricityPrice: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Số nước (m³)</label>
                  <input
                    type="number"
                    value={createFormData.waterUsage}
                    onChange={(e) => setCreateFormData({...createFormData, waterUsage: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Đơn giá nước (VNĐ/m³)</label>
                  <input
                    type="number"
                    value={createFormData.waterPrice}
                    onChange={(e) => setCreateFormData({...createFormData, waterPrice: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Phí dịch vụ (VNĐ)</label>
                <input
                  type="number"
                  value={createFormData.serviceAmount}
                  onChange={(e) => setCreateFormData({...createFormData, serviceAmount: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Tổng kết</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Tiền phòng:</span>
                    <span className="font-medium">{createFormData.rentAmount.toLocaleString('vi-VN')} ₫</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tiền điện ({createFormData.electricityUsage} kWh):</span>
                    <span className="font-medium">{(createFormData.electricityUsage * createFormData.electricityPrice).toLocaleString('vi-VN')} ₫</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tiền nước ({createFormData.waterUsage} m³):</span>
                    <span className="font-medium">{(createFormData.waterUsage * createFormData.waterPrice).toLocaleString('vi-VN')} ₫</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phí dịch vụ:</span>
                    <span className="font-medium">{createFormData.serviceAmount.toLocaleString('vi-VN')} ₫</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-blue-200 text-lg">
                    <span className="font-bold">Tổng cộng:</span>
                    <span className="font-bold text-blue-600">
                      {(createFormData.rentAmount +
                        createFormData.electricityUsage * createFormData.electricityPrice +
                        createFormData.waterUsage * createFormData.waterPrice +
                        createFormData.serviceAmount).toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Dialog.Close className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Hủy
                </Dialog.Close>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Tạo hóa đơn
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

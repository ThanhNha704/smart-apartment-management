import { useState, useEffect } from 'react';
import { Search, Plus, Eye, QrCode, CheckCircle, Clock, XCircle, Trash2, Loader2 } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { toast } from 'sonner';
import { fetchApi } from '../../utils/api';

// Interface
interface Invoice {
  id: string;
  createdAt: string;
  updatedAt: string;
  invoiceNumber: string;
  roomNumber: string;
  tenantName: string;
  billingPeriod: string;
  dueTime: string;
  status: number;  // 0 = Chờ thanh toán, 1 = Đã thanh toán, 2 = Quá hạn
  statusLabel: string;
  roomPrice: number;
  electricUsage: number;
  electricPrice: number;
  electricTotal: number;
  waterUsage: number;
  waterPrice: number;
  waterTotal: number;
  serviceFee: number;
  amount: number;
}

// Option phục vụ thẻ select tự động map dữ liệu
interface RoomOption { id: string; roomNumber: string; price: number; }
interface TenantOption { id: string; name: string; }

const blankCreateFormData = {
  roomNumber: '',
  tenantName: '',
  billingPeriod: '',
  electricUsage: 0,
  waterUsage: 0,
  electricPrice: 3500,
  waterPrice: 12000,
  serviceFee: 150000,
  roomPrice: 0,
  dueTime: '',
};

export default function InvoiceManagement() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // States Modal quản lý
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  // Form State & Select State
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [createFormData, setCreateFormData] = useState(blankCreateFormData);

  // Hàm GET: Tải tất cả hóa đơn, phòng và khách thuê
  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [resInvoices, resRooms, resTenants] = await Promise.all([
        fetchApi('/Invoices'),
        fetchApi('/Rooms'),
        fetchApi('/Users'),
      ]);

      if (resInvoices.ok) setInvoices(await resInvoices.json());
      if (resRooms.ok) setRooms(await resRooms.json());
      if (resTenants.ok) setTenants(await resTenants.json());
    } catch (error) {
      toast.error('Lỗi khi tải dữ liệu từ server!');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Tự động điền số phòng và giá phòng khi chọn phòng từ danh sách
  useEffect(() => {
    const activeRoom = rooms.find(r => r.id === selectedRoomId);
    if (activeRoom) {
      setCreateFormData(prev => ({
        ...prev,
        roomNumber: activeRoom.roomNumber,
        roomPrice: activeRoom.price
      }));
    }
  }, [selectedRoomId, rooms]);

  // Tự động điền tên khách thuê khi chọn từ danh sách
  useEffect(() => {
    const activeTenant = tenants.find(t => t.id === selectedTenantId);
    if (activeTenant) {
      setCreateFormData(prev => ({ ...prev, tenantName: activeTenant.name }));
    }
  }, [selectedTenantId, tenants]);

  // Hàm POST: Gửi dữ liệu tạo hóa đơn mới lên Swagger Server
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createFormData.roomNumber || !createFormData.tenantName || !createFormData.dueTime) {
      toast.error('Vui lòng chọn đầy đủ Phòng, Khách thuê và Hạn thanh toán!');
      return;
    }

    const electricTotal = createFormData.electricUsage * createFormData.electricPrice;
    const waterTotal = createFormData.waterUsage * createFormData.waterPrice;
    const totalAmount = createFormData.roomPrice + electricTotal + waterTotal + createFormData.serviceFee;

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
      dueTime: new Date(createFormData.dueTime).toISOString()
    };

    try {
      const response = await fetchApi('/Invoices', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success('Đã lưu hóa đơn thực tế lên hệ thống thành công!');
        setIsCreateDialogOpen(false);
        setCreateFormData(blankCreateFormData);
        setSelectedRoomId('');
        setSelectedTenantId('');
        loadInitialData();
      } else {
        const err = await response.json().catch(() => null);
        toast.error(err?.message || 'Không thể lưu hóa đơn mới!');
      }
    } catch {
      toast.error('Lỗi kết nối đến máy chủ!');
    }
  };

  // Hàm PUT: Cập nhật trạng thái thanh toán (/api/Invoices/{id}/pay)
  const handlePayInvoice = async (id: string) => {
    try {
      const response = await fetchApi(`/Invoices/${id}/pay`, { method: 'PUT' });
      if (response.ok) {
        toast.success('Xác nhận thanh toán thành công!');
        setSelectedInvoice(null);
        setShowQRDialog(false);
        loadInitialData();
      } else throw new Error();
    } catch {
      toast.error('Cập nhật trạng thái thanh toán thất bại!');
    }
  };

  // Hàm DELETE: Gỡ bỏ hóa đơn
  const handleDeleteInvoice = async () => {
    if (!invoiceToDelete) return;
    try {
      const response = await fetchApi(`/Invoices/${invoiceToDelete.id}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('Đã xóa hóa đơn vĩnh viễn thành công!');
        setIsDeleteDialogOpen(false);
        setInvoiceToDelete(null);
        loadInitialData();
      } else throw new Error();
    } catch {
      toast.error('Không thể xóa hóa đơn này!');
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
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.className}`}>
        <Icon className="w-3.5 h-3.5" />
        {label || 'Chờ xử lý'}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Quản lý hóa đơn</h1>
        <p className="text-gray-600">Đồng bộ dữ liệu thời gian thực qua Swagger API</p>
      </div>

      {/* Tìm kiếm & Bộ lọc */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6 p-4 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm hóa đơn, số phòng, người thuê..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-700"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="1">Đã thanh toán</option>
            <option value="0">Chờ thanh toán</option>
            <option value="2">Quá hạn</option>
          </select>
          <button
            onClick={() => setIsCreateDialogOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-medium transition-colors shrink-0"
          >
            <Plus className="w-5 h-5" /> Tạo hóa đơn
          </button>
        </div>
      </div>

      {/* Bảng dữ liệu */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2 text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-sm">Đang đồng bộ dữ liệu hóa đơn...</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium">
                <tr>
                  <th className="px-6 py-3 text-left">Mã hóa đơn</th>
                  <th className="px-6 py-3 text-left">Phòng</th>
                  <th className="px-6 py-3 text-left">Người thuê</th>
                  <th className="px-6 py-3 text-left">Kỳ hạn</th>
                  <th className="px-6 py-3 text-left">Tổng tiền cần thu</th>
                  <th className="px-6 py-3 text-left">Hạn đóng tiền</th>
                  <th className="px-6 py-3 text-left">Trạng thái</th>
                  <th className="px-6 py-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-gray-700">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500 border-dashed">Không có hóa đơn tương thích.</td>
                  </tr>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-mono font-medium">{invoice.invoiceNumber || `ID: ${invoice.id.slice(0, 8)}`}</td>
                      <td className="px-6 py-4 font-semibold">Phòng {invoice.roomNumber}</td>
                      <td className="px-6 py-4">{invoice.tenantName}</td>
                      <td className="px-6 py-4">{invoice.billingPeriod}</td>
                      <td className="px-6 py-4 text-blue-600 font-semibold">{(invoice.amount || 0).toLocaleString('vi-VN')} ₫</td>
                      <td className="px-6 py-4 text-gray-500">{invoice.dueTime ? new Date(invoice.dueTime).toLocaleDateString('vi-VN') : '---'}</td>
                      <td className="px-6 py-4">{getStatusBadge(invoice.status, invoice.statusLabel)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setSelectedInvoice(invoice)} className="p-2 hover:bg-gray-100 text-gray-600 rounded-md" title="Xem chi tiết"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => { setSelectedInvoice(invoice); setShowQRDialog(true); }} className="p-2 hover:bg-gray-100 text-gray-600 rounded-md" title="Mã QR Pay"><QrCode className="w-4 h-4" /></button>
                          <button onClick={() => { setInvoiceToDelete(invoice); setIsDeleteDialogOpen(true); }} className="p-2 hover:bg-gray-100 text-red-600 rounded-md" title="Xóa bỏ"><Trash2 className="w-4 h-4" /></button>
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

      {/* Dialog Chi Tiết Hóa Đơn & Xác Nhận Thanh Toán */}
      <Dialog.Root open={selectedInvoice !== null && !showQRDialog} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
          <Dialog.Content aria-describedby={undefined} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-auto z-50 text-sm shadow-2xl">
            {selectedInvoice && (
              <>
                <Dialog.Title className="text-xl font-bold border-b pb-3 mb-4 flex justify-between items-center">
                  <span>Hóa đơn: {selectedInvoice.invoiceNumber || 'Hệ thống'}</span>
                  {getStatusBadge(selectedInvoice.status, selectedInvoice.statusLabel)}
                </Dialog.Title>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-300 text-sm">
                    <div><p className="text-gray-400 text-xs">Phòng liên kết</p><p className="font-semibold text-gray-900">Phòng {selectedInvoice.roomNumber}</p></div>
                    <div><p className="text-gray-400 text-xs">Chủ hộ thuê</p><p className="font-semibold text-gray-900">{selectedInvoice.tenantName}</p></div>
                    <div><p className="text-gray-400 text-xs">Kỳ đóng tiền</p><p className="font-medium">{selectedInvoice.billingPeriod}</p></div>
                    <div><p className="text-gray-400 text-xs">Hạn cuối thanh toán</p><p className="font-medium text-red-600">{new Date(selectedInvoice.dueTime).toLocaleDateString('vi-VN')}</p></div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Bảng tổng hợp chi tiết dịch vụ</h4>
                    <div className="border border-gray-300 rounded-lg p-4 space-y-2.5 bg-white">
                      <div className="flex justify-between"><span>Tiền thuê phòng cơ bản</span><span className="font-medium">{(selectedInvoice.roomPrice || 0).toLocaleString('vi-VN')} ₫</span></div>
                      <div className="flex justify-between text-gray-600"><span>Tiền điện ({selectedInvoice.electricUsage} kWh × {selectedInvoice.electricPrice} ₫)</span><span>{selectedInvoice.electricTotal.toLocaleString('vi-VN')} ₫</span></div>
                      <div className="flex justify-between text-gray-600"><span>Tiền nước ({selectedInvoice.waterUsage} m³ × {selectedInvoice.waterPrice} ₫)</span><span>{selectedInvoice.waterTotal.toLocaleString('vi-VN')} ₫</span></div>
                      <div className="flex justify-between text-gray-600"><span>Phí quản lý dịch vụ cố định</span><span>{(selectedInvoice.serviceFee || 0).toLocaleString('vi-VN')} ₫</span></div>
                      <div className="flex justify-between pt-3 border-t text-base font-bold text-gray-900">
                        <span>Tổng chi phí cần thanh toán</span>
                        <span className="text-blue-600">{(selectedInvoice.amount || 0).toLocaleString('vi-VN')} ₫</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t">
                    <Dialog.Close className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">Đóng</Dialog.Close>
                    {selectedInvoice.status !== 1 && (
                      <button onClick={() => handlePayInvoice(selectedInvoice.id)} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors">
                        Xác nhận đã thu tiền
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Dialog Mã QR Thanh Toán */}
      <Dialog.Root open={showQRDialog} onOpenChange={setShowQRDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
          <Dialog.Content aria-describedby={undefined} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md z-50 shadow-2xl">
            <Dialog.Title className="text-xl font-bold mb-3 text-center">Quét mã QR Code thu tiền</Dialog.Title>
            {selectedInvoice && (
              <div className="text-center">
                <div className="bg-gray-50 rounded-lg p-6 mb-4 border border-gray-300 flex items-center justify-center">
                  <QrCode className="w-48 h-48 text-gray-800" />
                </div>
                <p className="text-sm font-mono text-gray-500 mb-1">HĐ: {selectedInvoice.invoiceNumber || selectedInvoice.id.slice(0, 12)}</p>
                <p className="text-2xl font-bold text-blue-600 mb-5">{(selectedInvoice.amount || 0).toLocaleString('vi-VN')} ₫</p>
                <div className="flex gap-2">
                  <Dialog.Close className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm">Đóng</Dialog.Close>
                  {selectedInvoice.status !== 1 && (
                    <button onClick={() => handlePayInvoice(selectedInvoice.id)} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm">
                      Xác nhận đã hoàn thành
                    </button>
                  )}
                </div>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Dialog Lập Hóa Đơn Mới (POST) */}
      <Dialog.Root open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
          <Dialog.Content aria-describedby={undefined} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-auto z-50 text-sm shadow-2xl">
            <Dialog.Title className="text-xl font-bold mb-4 border-b pb-2">Lập hóa đơn thanh toán tháng</Dialog.Title>
            <form className="space-y-4" onSubmit={handleCreateInvoice}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1 text-gray-700">Chọn số phòng có sẵn <span className="text-red-500">*</span></label>
                  <select value={selectedRoomId} onChange={(e) => setSelectedRoomId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white" required>
                    <option value="">-- Chọn phòng --</option>
                    {rooms.map(r => <option key={r.id} value={r.id}>Phòng {r.roomNumber} ({r.price.toLocaleString('vi-VN')}đ)</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1 text-gray-700">Chọn khách thuê hiện tại <span className="text-red-500">*</span></label>
                  <select value={selectedTenantId} onChange={(e) => setSelectedTenantId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white" required>
                    <option value="">-- Chọn thành viên --</option>
                    {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1 text-gray-700">Kỳ thông báo đóng tiền <span className="text-red-500">*</span></label>
                  <input type="text" value={createFormData.billingPeriod} onChange={(e) => setCreateFormData({ ...createFormData, billingPeriod: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Ví dụ: Tháng 07/2026" required />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-gray-700">Hạn cuối đóng tiền <span className="text-red-500">*</span></label>
                  <input type="date" value={createFormData.dueTime} onChange={(e) => setCreateFormData({ ...createFormData, dueTime: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-3">
                <div>
                  <label className="block font-medium mb-1 text-gray-600">Điện tiêu thụ (kWh)</label>
                  <input type="number" value={createFormData.electricUsage} onChange={(e) => setCreateFormData({ ...createFormData, electricUsage: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-gray-600">Đơn giá điện (₫/kWh)</label>
                  <input type="number" value={createFormData.electricPrice} onChange={(e) => setCreateFormData({ ...createFormData, electricPrice: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1 text-gray-600">Nước tiêu thụ (m³)</label>
                  <input type="number" value={createFormData.waterUsage} onChange={(e) => setCreateFormData({ ...createFormData, waterUsage: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-gray-600">Đơn giá nước (₫/m³)</label>
                  <input type="number" value={createFormData.waterPrice} onChange={(e) => setCreateFormData({ ...createFormData, waterPrice: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1 text-gray-700">Cộng phí dịch vụ khác (₫)</label>
                <input type="number" value={createFormData.serviceFee} onChange={(e) => setCreateFormData({ ...createFormData, serviceFee: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
              </div>

              <div className="p-4 bg-blue-50 border border-gray-300 border-blue-100 rounded-lg flex justify-between items-center text-sm">
                <span className="font-semibold text-blue-900">Ước tính tổng cộng tiền thu:</span>
                <span className="font-bold text-blue-600 text-lg">
                  {(createFormData.roomPrice + (createFormData.electricUsage * createFormData.electricPrice) + (createFormData.waterUsage * createFormData.waterPrice) + createFormData.serviceFee).toLocaleString('vi-VN')} ₫
                </span>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Dialog.Close type="button" className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium">Hủy</Dialog.Close>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Lưu dữ liệu thực</button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Dialog Hỏi Xác Nhận Xóa Hóa Đơn (DELETE) */}
      <Dialog.Root open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content aria-describedby={undefined} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-sm z-50 text-sm shadow-2xl">
            <Dialog.Title className="text-lg font-bold text-gray-900 mb-2">Hủy bỏ hóa đơn vĩnh viễn</Dialog.Title>
            <p className="text-gray-500 mb-4">Bạn chắc chắn muốn loại bỏ mã hóa đơn <strong className="text-gray-900">{invoiceToDelete?.invoiceNumber || invoiceToDelete?.id.slice(0, 8)}</strong>? Thao tác này sẽ xóa vĩnh viễn trên Swagger Server.</p>
            <div className="flex gap-2">
              <Dialog.Close className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">Hủy</Dialog.Close>
              <button onClick={handleDeleteInvoice} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">Xác nhận xóa</button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
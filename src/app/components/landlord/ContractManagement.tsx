import { useState, useEffect } from 'react';
import { Search, Plus, FileText, Download, Eye, CheckCircle, Clock, XCircle, Calendar } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { toast } from 'sonner';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// --- INTERFACES DỮ LIỆU ---
interface ContractBackend {
  id: string;
  createdAt: string;
  updatedAt: string;
  contractNumber: string;
  roomNumber: string;
  tenantName: string;
  startDate: string;
  endDate: string;
  paymentDate: number;
  paymentDateLabel: string;
  price: number;
  roomDeposit: number;
  status: number;
  statusLabel: string;
  remainTime: number;
}

interface CreateContractInput {
  contractNumber: string;
  roomId: string;
  roomNumber: string;
  tenantId: string;
  tenantName: string;
  startDate: string;
  endDate: string;
  paymentDate: number;
  monthlyRent: number;
}

interface RoomOption { id: string; roomNumber: string; price: number; }
interface TenantOption { id: string; name: string; }

export default function ContractManagement() {
  const [contracts, setContracts] = useState<ContractBackend[]>([]);
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [selectedContract, setSelectedContract] = useState<ContractBackend | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isExtendDialogOpen, setIsExtendDialogOpen] = useState(false);
  const [extendEndDate, setExtendEndDate] = useState('');

  const [createFormData, setCreateFormData] = useState<CreateContractInput>({
    contractNumber: '', roomId: '', roomNumber: '', tenantId: '', tenantName: '',
    startDate: '', endDate: '', paymentDate: 5, monthlyRent: 0,
  });

  // --- COPPING & FETCHING DATA ---
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [resContracts, resRooms, resTenants] = await Promise.all([
        fetch(`${API_BASE_URL}/Contracts`),
        fetch(`${API_BASE_URL}/Rooms?status=available`),   // Gọi endpoint lấy danh sách phòng trống
        fetch(`${API_BASE_URL}/Users`), // Gọi endpoint lấy danh sách người thuê
      ]);

      if (resContracts.ok) setContracts(await resContracts.json());
      if (resRooms.ok) setRooms(await resRooms.json());
      if (resTenants.ok) setTenants(await resTenants.json());
    } catch (error) {
      toast.error('Lỗi khi tải dữ liệu từ máy chủ!');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Tự động map giá tiền khi chọn phòng
  useEffect(() => {
    const selectedRoom = rooms.find(r => r.id === createFormData.roomId);
    if (selectedRoom) {
      setCreateFormData(prev => ({
        ...prev,
        roomNumber: selectedRoom.roomNumber,
        monthlyRent: selectedRoom.price
      }));
    }
  }, [createFormData.roomId, rooms]);

  // --- HÀNH ĐỘNG XỬ LÝ API ---
  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/Contracts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createFormData),
      });
      if (!response.ok) throw new Error();

      toast.success('Đã tạo hợp đồng mới thành công!');
      setIsCreateDialogOpen(false);
      setCreateFormData({
        contractNumber: '', roomId: '', roomNumber: '', tenantId: '', tenantName: '',
        startDate: '', endDate: '', paymentDate: 5, monthlyRent: 0,
      });
      fetchData();
    } catch { toast.error('Lỗi khi tạo hợp đồng!'); }
  };

  const handleTerminateContract = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn thanh lý hợp đồng này không?')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/Contracts/${id}/terminate`, { method: 'PUT' });
      if (!response.ok) throw new Error();
      toast.success('Đã hoàn tất thanh lý hợp đồng!');
      setSelectedContract(null);
      fetchData();
    } catch { toast.error('Gặp lỗi khi thanh lý hợp đồng!'); }
  };

  const handleExtendContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContract || !extendEndDate) return;
    try {
      const response = await fetch(`${API_BASE_URL}/Contracts/${selectedContract.id}/extend`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(extendEndDate),
      });
      if (!response.ok) throw new Error();

      toast.success('Gia hạn hợp đồng thành công!');
      setIsExtendDialogOpen(false);
      setSelectedContract(null);
      setExtendEndDate('');
      fetchData();
    } catch { toast.error('Gặp lỗi khi gia hạn hợp đồng!'); }
  };

  // // Hàm tải file hợp đồng
  // const handleDownloadContract = async (contractId: string, contractNumber: string) => {
  //   try {
  //     toast.info('Đang chuẩn bị tải file...');
  //     const response = await fetch(`${API_BASE_URL}/Contracts/${contractId}/download`, {
  //       method: 'GET',
  //       headers: { 'Accept': 'application/pdf' } // Hoặc loại file tương ứng
  //     });

  //     if (!response.ok) throw new Error();

  //     // Chuyển đổi dữ liệu nhận được thành file để tải xuống
  //     const blob = await response.blob();
  //     const url = window.URL.createObjectURL(blob);
  //     const a = document.createElement('a');
  //     a.href = url;
  //     a.download = `HopDong_${contractNumber}.pdf`; // Tên file khi tải về
  //     document.body.appendChild(a);
  //     a.click();

  //     // Dọn dẹp bộ nhớ
  //     window.URL.revokeObjectURL(url);
  //     document.body.removeChild(a);
  //     toast.success('Tải hợp đồng thành công!');
  //   } catch (error) {
  //     toast.error('Không thể tải file hợp đồng lúc này!');
  //     console.error(error);
  //   }
  // };

  // --- LOGIC LỌC TÌM KIẾM ---
  const filteredContracts = contracts.filter(contract => {
    const matchesSearch =
      contract.contractNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.tenantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.roomNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch && (filterStatus === 'all' || String(contract.status) === filterStatus);
  });

  // Gắn Badge Trạng thái rút gọn (Helper UI)
  const renderStatusBadge = (label: string, status: number) => {
    const isSuccess = label?.toLowerCase().includes('hiệu lực') || status === 0;
    const isDanger = label?.toLowerCase().includes('hết hạn') || status === 1;
    const Icon = isSuccess ? CheckCircle : (isDanger ? XCircle : Clock);
    const colorClass = isSuccess ? 'bg-green-100 text-green-700' : (isDanger ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700');

    return (
      <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${colorClass}`}>
        <Icon className="w-4 h-4" /> {label || 'Không rõ'}
      </span>
    );
  };

  if (isLoading) return <div className="p-6 text-center text-gray-500">Đang tải danh sách...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Quản lý hợp đồng</h1>
          <p className="text-gray-600">Theo dõi thông tin, tạo mới và gia hạn các hợp đồng thuê phòng</p>
        </div>
      </div>

      {/* Thanh Tìm kiếm & Bộ Lọc */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6 p-4 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text" placeholder="Tìm kiếm theo mã HĐ, tên phòng, người thuê..." value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="0">Đang hiệu lực</option>
            <option value="1">Hết hạn</option>
            <option value="2">Đã chấm dứt</option>
          </select>
          <button
            onClick={() => setIsCreateDialogOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" /> Tạo hợp đồng
          </button>
        </div>
      </div>

      {/* Danh sách thẻ hợp đồng */}
      <div className="grid grid-cols-1 gap-4">
        {filteredContracts.length === 0 ? (
          <div className="text-center py-10 text-gray-500 border border-dashed rounded-lg bg-white">Không tìm thấy dữ liệu.</div>
        ) : (
          filteredContracts.map((contract) => (
            <div key={contract.id} className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{contract.contractNumber}</h3>
                    <p className="text-sm text-gray-600">Khách thuê: <span className="font-medium text-gray-900">{contract.tenantName}</span> • Phòng: <span className="font-medium text-gray-900">{contract.roomNumber}</span></p>
                  </div>
                </div>
                {renderStatusBadge(contract.statusLabel, contract.status)}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                <div><p className="text-xs text-gray-500 mb-0.5">Ngày bắt đầu</p><p className="font-medium">{new Date(contract.startDate).toLocaleDateString('vi-VN')}</p></div>
                <div><p className="text-xs text-gray-500 mb-0.5">Ngày kết thúc</p><p className="font-medium">{new Date(contract.endDate).toLocaleDateString('vi-VN')}</p></div>
                <div><p className="text-xs text-gray-500 mb-0.5">Tiền thuê/tháng</p><p className="font-medium text-blue-600">{contract.price.toLocaleString('vi-VN')} ₫</p></div>
                <div><p className="text-xs text-gray-500 mb-0.5">Tiền đặt cọc</p><p className="font-medium text-gray-800">{contract.roomDeposit.toLocaleString('vi-VN')} ₫</p></div>
              </div>

              {contract.remainTime <= 30 && contract.remainTime > 0 && (
                <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800">
                  Hợp đồng sắp hết hạn! Còn lại <span className="font-semibold">{contract.remainTime} ngày</span>.
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setSelectedContract(contract)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 text-sm text-gray-700 transition-colors"
                >
                  <Eye className="w-4 h-4" /> Xem chi tiết
                </button>
                {/* <button
                  onClick={() => handleDownloadContract(contract.id, contract.contractNumber)} // Nếu dùng Cách A
                  // onClick={() => handleDownloadContract(contract)} // Nếu dùng Cách B
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 hover:text-blue-600 hover:border-blue-300 transition-colors"
                  title="Tải file hợp đồng"
                >
                  <Download className="w-4 h-4" />
                </button> */}
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- DIALOG CHI TIẾT HỢP ĐỒNG --- */}
      <Dialog.Root open={selectedContract !== null} onOpenChange={(open) => !open && setSelectedContract(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-auto z-50 shadow-xl text-sm">
            {selectedContract && (
              <>
                <Dialog.Title className="text-xl font-bold mb-4 flex items-center justify-between">
                  <span>Hợp đồng: {selectedContract.contractNumber}</span>
                  {renderStatusBadge(selectedContract.statusLabel, selectedContract.status)}
                </Dialog.Title>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <div><p className="text-xs text-gray-500">Khách thuê phòng</p><p className="font-semibold text-gray-900">{selectedContract.tenantName}</p></div>
                    <div><p className="text-xs text-gray-500">Mã / Số phòng</p><p className="font-semibold text-gray-900">Phòng {selectedContract.roomNumber}</p></div>
                  </div>
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                    <div><p className="text-gray-500">Ngày bắt đầu</p><p className="font-medium">{new Date(selectedContract.startDate).toLocaleDateString('vi-VN')}</p></div>
                    <div><p className="text-gray-500">Ngày kết thúc</p><p className="font-medium">{new Date(selectedContract.endDate).toLocaleDateString('vi-VN')}</p></div>
                    <div><p className="text-gray-500">Chu kỳ đóng tiền</p><p className="font-medium">{selectedContract.paymentDateLabel || `Ngày ${selectedContract.paymentDate} hàng tháng`}</p></div>
                    <div><p className="text-gray-500">Thời gian còn lại</p><p className="font-medium text-orange-600">{selectedContract.remainTime} ngày</p></div>
                    <div><p className="text-gray-500">Tiền thuê hàng tháng</p><p className="font-semibold text-blue-600 text-base">{selectedContract.price.toLocaleString('vi-VN')} ₫</p></div>
                    <div><p className="text-gray-500">Tiền đặt cọc phòng</p><p className="font-semibold text-gray-800 text-base">{selectedContract.roomDeposit.toLocaleString('vi-VN')} ₫</p></div>
                  </div>
                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <Dialog.Close className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">Đóng</Dialog.Close>
                    <button onClick={() => handleTerminateContract(selectedContract.id)} className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium ml-auto">Thanh lý hợp đồng</button>
                    <button onClick={() => setIsExtendDialogOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-1"><Calendar className="w-4 h-4" /> Gia hạn</button>
                  </div>
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* --- DIALOG GIA HẠN HỢP ĐỒNG --- */}
      <Dialog.Root open={isExtendDialogOpen} onOpenChange={setIsExtendDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md z-50 shadow-2xl text-sm">
            <Dialog.Title className="text-lg font-bold mb-3">Gia hạn hợp đồng mới</Dialog.Title>
            <form onSubmit={handleExtendContract} className="space-y-4">
              <div>
                <label className="block font-medium mb-1 text-gray-700">Chọn ngày kết thúc mới (EndDate)</label>
                <input type="date" value={extendEndDate} onChange={(e) => setExtendEndDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setIsExtendDialogOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium">Xác nhận gia hạn</button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* --- DIALOG TẠO HỢP ĐỒNG MỚI  --- */}
      <Dialog.Root open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-auto z-40 shadow-xl text-sm">
            <Dialog.Title className="text-xl font-bold mb-4">Tạo hợp đồng thuê phòng mới</Dialog.Title>
            <form className="space-y-4" onSubmit={handleCreateContract}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1 text-gray-700">Số hợp đồng</label>
                  <input type="text" value={createFormData.contractNumber} onChange={(e) => setCreateFormData({ ...createFormData, contractNumber: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Ví dụ: HD-2026-009" required />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-gray-700">Khách thuê</label>
                  <select
                    value={createFormData.tenantId}
                    onChange={(e) => {
                      const t = tenants.find(tenant => tenant.id === e.target.value);
                      setCreateFormData({ ...createFormData, tenantId: e.target.value, tenantName: t ? t.name : '' });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white" required
                  >
                    <option value="">-- Chọn người thuê --</option>
                    {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1 text-gray-700">Phòng trống có sẵn</label>
                  <select value={createFormData.roomId} onChange={(e) => setCreateFormData({ ...createFormData, roomId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white" required>
                    <option value="">-- Chọn mã phòng --</option>
                    {rooms.map(r => <option key={r.id} value={r.id}>{r.roomNumber} (Gốc: {r.price.toLocaleString('vi-VN')}đ)</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1 text-gray-700">Ngày đóng tiền hàng tháng</label>
                  <input type="number" value={createFormData.paymentDate} onChange={(e) => setCreateFormData({ ...createFormData, paymentDate: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" min="1" max="31" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1 text-gray-700">Ngày bắt đầu ở</label>
                  <input type="date" value={createFormData.startDate} onChange={(e) => setCreateFormData({ ...createFormData, startDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-gray-700">Ngày kết thúc hợp đồng</label>
                  <input type="date" value={createFormData.endDate} onChange={(e) => setCreateFormData({ ...createFormData, endDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1 text-gray-700">Tiền phòng/tháng (₫)</label>
                <input type="number" value={createFormData.monthlyRent || ''}
                  onChange={(e) => setCreateFormData({ ...createFormData, monthlyRent: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-medium text-gray-700 focus:ring-2 focus:ring-blue-500"
                  // placeholder="Giá tự động điền theo phòng"
                  required />
              </div>

              <div className="flex gap-2 pt-4">
                <Dialog.Close type="button" className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Hủy bỏ</Dialog.Close>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Tạo hợp đồng</button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
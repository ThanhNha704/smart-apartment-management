import { useState, useEffect } from 'react';
import { Search, Plus, FileText, CheckCircle, Clock, XCircle, Calendar, Eye, Loader2 } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { toast } from 'sonner';
import { fetchApi } from '../../utils/api';

// INTERFACES
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
  roomNumber: string;
  tenantName: string;
  startDate: string;
  endDate: string;
  paymentDate: number;
  price: number;
}

interface RoomOption { id: string; roomNumber: string; price: number; status: number; }
interface TenantOption { id: string; name: string; }

const blankCreateFormData: CreateContractInput = {
  contractNumber: '',
  roomNumber: '',
  tenantName: '',
  startDate: '',
  endDate: '',
  paymentDate: 5,
  price: 0,
};

export default function ContractManagement() {
  const [contracts, setContracts] = useState<ContractBackend[]>([]);
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Quản lý trạng thái các Dialogs
  const [selectedContract, setSelectedContract] = useState<ContractBackend | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isExtendDialogOpen, setIsExtendDialogOpen] = useState(false);
  const [isTerminateDialogOpen, setIsTerminateDialogOpen] = useState(false);

  const [contractToTerminate, setContractToTerminate] = useState<ContractBackend | null>(null);
  const [extendEndDate, setExtendEndDate] = useState('');

  // States chọn trên UI khi tạo mới
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [createFormData, setCreateFormData] = useState<CreateContractInput>(blankCreateFormData);

  // Tải dữ liệu từ API
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [resContracts, resRooms, resTenants] = await Promise.all([
        fetchApi('/Contracts'),
        fetchApi('/Rooms'),
        fetchApi('/Users'),
      ]);

      if (resContracts.ok) setContracts(await resContracts.json());
      if (resRooms.ok) {
        const allRooms: RoomOption[] = await resRooms.json();
        setRooms(allRooms);
      }
      if (resTenants.ok) setTenants(await resTenants.json());
    } catch (error) {
      toast.error('Lỗi khi tải dữ liệu từ máy chủ!');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Tự động map dữ liệu phòng sang Form khi tạo mới
  useEffect(() => {
    if (isCreateDialogOpen) {
      const targetRoom = rooms.find(r => r.id === selectedRoomId);
      if (targetRoom) {
        setCreateFormData(prev => ({
          ...prev,
          roomNumber: targetRoom.roomNumber,
          price: targetRoom.price
        }));
      }
    }
  }, [selectedRoomId, rooms, isCreateDialogOpen]);

  // Tự động map tên khách thuê sang Form khi tạo mới
  useEffect(() => {
    if (isCreateDialogOpen) {
      const targetTenant = tenants.find(t => t.id === selectedTenantId);
      if (targetTenant) {
        setCreateFormData(prev => ({ ...prev, tenantName: targetTenant.name }));
      }
    }
  }, [selectedTenantId, tenants, isCreateDialogOpen]);

  // POST: Tạo hợp đồng mới
  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: CreateContractInput = {
        contractNumber: createFormData.contractNumber,
        roomNumber: createFormData.roomNumber,
        tenantName: createFormData.tenantName,
        startDate: createFormData.startDate ? new Date(createFormData.startDate).toISOString() : '',
        endDate: createFormData.endDate ? new Date(createFormData.endDate).toISOString() : '',
        paymentDate: createFormData.paymentDate,
        price: createFormData.price,
      };

      const response = await fetchApi('/Contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success('Đã tạo hợp đồng thành công!');
        setIsCreateDialogOpen(false);
        setCreateFormData(blankCreateFormData);
        setSelectedRoomId('');
        setSelectedTenantId('');
        fetchData();
      } else {
        const errorData = await response.json().catch(() => null);
        toast.error(errorData?.message || 'Lỗi khi tạo hợp đồng!');
      }
    } catch {
      toast.error('Lỗi kết nối đến server!');
    }
  };

  // PUT: Thanh lý hợp đồng
  const handleTerminateContract = async () => {
    if (!contractToTerminate) return;
    try {
      const response = await fetchApi(`/Contracts/${contractToTerminate.id}/terminate`, {
        method: 'PUT'
      });
      if (response.ok) {
        toast.success('Đã thanh lý hợp đồng thành công!');
        setIsTerminateDialogOpen(false);
        setContractToTerminate(null);
        setSelectedContract(null);
        fetchData();
      } else {
        const errorData = await response.json().catch(() => null);
        toast.error(errorData?.message || 'Lỗi khi xử lý thanh lý!');
      }
    } catch {
      toast.error('Lỗi khi xử lý thanh lý!');
    }
  };

  // PUT: Gia hạn hợp đồng
  const handleExtendContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContract || !extendEndDate) return;
    try {
      const response = await fetchApi(`/Contracts/${selectedContract.id}/extend`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(new Date(extendEndDate).toISOString()),
      });
      if (response.ok) {
        toast.success('Gia hạn hợp đồng thành công!');
        setIsExtendDialogOpen(false);
        setExtendEndDate('');
        setSelectedContract(null);
        fetchData();
      } else {
        const errorData = await response.json().catch(() => null);
        toast.error(errorData?.message || 'Lỗi khi xử lý gia hạn!');
      }
    } catch {
      toast.error('Lỗi khi xử lý gia hạn!');
    }
  };

  // Lọc dữ liệu hiển thị
  const filteredContracts = contracts.filter(c => {
    const matchesSearch = c.contractNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.tenantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.roomNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch && (filterStatus === 'all' || String(c.status) === filterStatus);
  });

  const renderStatusBadge = (label: string, status: number) => {
    const isSuccess = status === 0 || label?.toLowerCase().includes('hiệu lực');
    const isDanger = status === 1 || label?.toLowerCase().includes('hết hạn') || label?.toLowerCase().includes('chấm dứt');
    const Icon = isSuccess ? CheckCircle : (isDanger ? XCircle : Clock);
    const colorClass = isSuccess ? 'bg-green-100 text-green-700' : (isDanger ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700');
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        <Icon className="w-3.5 h-3.5" /> {label || 'Không rõ'}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-2 text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm font-medium">Đang đồng bộ dữ liệu hợp đồng...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Quản lý hợp đồng</h1>
        <p className="text-gray-600">Theo dõi thông tin, tạo mới và quản lý thời hạn hợp đồng phòng thuê</p>
      </div>

      {/* Tìm kiếm & Bộ lọc */}
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
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700">
            <option value="all">Tất cả trạng thái</option>
            <option value="0">Đang hiệu lực</option>
            <option value="1">Hết hạn / Đã chấm dứt</option>
          </select>
          <button
            onClick={() => {
              setCreateFormData(blankCreateFormData);
              setSelectedRoomId('');
              setSelectedTenantId('');
              setIsCreateDialogOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-medium shrink-0"
          >
            <Plus className="w-5 h-5" /> Tạo hợp đồng
          </button>
        </div>
      </div>

      {/* Danh sách hợp đồng */}
      <div className="grid grid-cols-1 gap-4">
        {filteredContracts.length === 0 ? (
          <div className="text-center py-12 text-gray-500 border border-dashed rounded-lg bg-white">Không tìm thấy dữ liệu.</div>
        ) : (
          filteredContracts.map((contract) => (
            <div key={contract.id} className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{contract.contractNumber}</h3>
                    <p className="text-sm text-gray-600 mt-0.5">Khách thuê: <strong>{contract.tenantName}</strong> • Phòng: <strong>{contract.roomNumber}</strong></p>
                  </div>
                </div>
                {renderStatusBadge(contract.statusLabel, contract.status)}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm border-t border-b border-gray-50 py-3 my-2">
                <div><p className="text-xs text-gray-400 mb-0.5">Ngày bắt đầu</p><p className="font-medium text-gray-800">{new Date(contract.startDate).toLocaleDateString('vi-VN')}</p></div>
                <div><p className="text-xs text-gray-400 mb-0.5">Ngày kết thúc</p><p className="font-medium text-gray-800">{new Date(contract.endDate).toLocaleDateString('vi-VN')}</p></div>
                <div><p className="text-xs text-gray-400 mb-0.5">Tiền thuê/tháng</p><p className="font-semibold text-blue-600">{contract.price.toLocaleString('vi-VN')} ₫</p></div>
                <div><p className="text-xs text-gray-400 mb-0.5">Tiền đặt cọc</p><p className="font-medium text-gray-700">{contract.roomDeposit.toLocaleString('vi-VN')} ₫</p></div>
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={() => setSelectedContract(contract)} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 text-sm font-medium text-gray-700">
                  <Eye className="w-4 h-4" /> Chi tiết hợp đồng
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* DIALOG CHI TIẾT HỢP ĐỒNG */}
      <Dialog.Root open={selectedContract !== null} onOpenChange={(open) => !open && setSelectedContract(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
          <Dialog.Content aria-describedby={undefined} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-auto z-50 text-sm shadow-2xl">
            {selectedContract && (
              <>
                <Dialog.Title className="text-xl font-bold mb-4 flex items-center justify-between border-b pb-3 border-gray-100">
                  <span>Hợp đồng: {selectedContract.contractNumber}</span>
                  {renderStatusBadge(selectedContract.statusLabel, selectedContract.status)}
                </Dialog.Title>
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-300">
                    <div><p className="text-xs text-gray-400">Khách thuê phòng</p><p className="font-semibold text-base text-gray-900">{selectedContract.tenantName}</p></div>
                    <div><p className="text-xs text-gray-400">Số phòng liên kết</p><p className="font-semibold text-base text-gray-900">Phòng {selectedContract.roomNumber}</p></div>
                  </div>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-6 border-b border-gray-400 pb-4">
                    <div><p className="text-gray-400 text-xs">Ngày bắt đầu</p><p className="font-medium">{new Date(selectedContract.startDate).toLocaleDateString('vi-VN')}</p></div>
                    <div><p className="text-gray-400 text-xs">Ngày hết hạn</p><p className="font-medium">{new Date(selectedContract.endDate).toLocaleDateString('vi-VN')}</p></div>
                    <div><p className="text-gray-400 text-xs">Chu kỳ đóng tiền</p><p className="font-medium">{selectedContract.paymentDateLabel || `Ngày ${selectedContract.paymentDate} hàng tháng`}</p></div>
                    <div><p className="text-gray-400 text-xs">Thời gian còn lại</p><p className="font-bold text-orange-600">{selectedContract.remainTime} ngày</p></div>
                    <div><p className="text-gray-400 text-xs">Giá thuê phòng/tháng</p><p className="font-bold text-blue-600 text-lg">{selectedContract.price.toLocaleString('vi-VN')} ₫</p></div>
                    <div><p className="text-gray-400 text-xs">Tiền đặt cọc phòng</p><p className="font-bold text-gray-800 text-lg">{selectedContract.roomDeposit.toLocaleString('vi-VN')} ₫</p></div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Dialog.Close className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">Đóng</Dialog.Close>
                    {selectedContract.status === 0 && (
                      <>
                        <button onClick={() => { setContractToTerminate(selectedContract); setIsTerminateDialogOpen(true); }} className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 text-sm ml-auto">Thanh lý hợp đồng</button>
                        <button onClick={() => setIsExtendDialogOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-1"><Calendar className="w-4 h-4" /> Gia hạn</button>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* DIALOG TẠO MỚI (POST) */}
      <Dialog.Root open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
          <Dialog.Content aria-describedby={undefined} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-auto z-50 shadow-2xl text-sm">
            <Dialog.Title className="text-xl font-bold mb-4 border-b pb-2">
              Lập hợp đồng cho thuê mới
            </Dialog.Title>
            <form className="space-y-4" onSubmit={handleCreateContract}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1 text-gray-700">Mã số hợp đồng <span className="text-red-500">*</span></label>
                  <input type="text" value={createFormData.contractNumber} onChange={(e) => setCreateFormData({ ...createFormData, contractNumber: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-gray-700">Lựa chọn người thuê <span className="text-red-500">*</span></label>
                  <select value={selectedTenantId} onChange={(e) => setSelectedTenantId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white" required>
                    <option value="">-- Chọn khách thuê --</option>
                    {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1 text-gray-700">Số phòng liên kết <span className="text-red-500">*</span></label>
                  <select value={selectedRoomId} onChange={(e) => {
                    setSelectedRoomId(e.target.value);
                    const room = rooms.find(r => r.id === e.target.value);
                    if (room) setCreateFormData(prev => ({ ...prev, roomNumber: room.roomNumber, price: room.price }));
                  }} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white" required>
                    <option value="">-- Chọn số phòng --</option>
                    {rooms.map(r => <option key={r.id} value={r.id}>Phòng {r.roomNumber} ({r.status === 0 ? 'Trống' : 'Đang thuê'})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1 text-gray-700">Ngày thu tiền định kỳ <span className="text-red-500">*</span></label>
                  <input type="number" value={createFormData.paymentDate} onChange={(e) => setCreateFormData({ ...createFormData, paymentDate: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" min="1" max="31" required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1 text-gray-700">Ngày bắt đầu hiệu lực <span className="text-red-500">*</span></label>
                  <input type="date" value={createFormData.startDate} onChange={(e) => setCreateFormData({ ...createFormData, startDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-gray-700">Ngày hết hạn hợp đồng <span className="text-red-500">*</span></label>
                  <input type="date" value={createFormData.endDate} onChange={(e) => setCreateFormData({ ...createFormData, endDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1 text-gray-700">Giá phòng hàng tháng (₫) <span className="text-red-500">*</span></label>
                <input type="number" value={createFormData.price || ''} onChange={(e) => setCreateFormData({ ...createFormData, price: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg font-medium" required />
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <button type="button" onClick={() => setIsCreateDialogOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">Hủy bỏ</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                  Kích hoạt hợp đồng
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* DIALOG GIA HẠN HỢP ĐỒNG */}
      <Dialog.Root open={isExtendDialogOpen} onOpenChange={setIsExtendDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content aria-describedby={undefined} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md z-50 text-sm shadow-2xl">
            <Dialog.Title className="text-lg font-bold mb-3">Gia hạn thời gian hợp đồng mới</Dialog.Title>
            <form onSubmit={handleExtendContract} className="space-y-4">
              <div>
                <label className="block font-medium mb-1 text-gray-700">Chọn ngày gia hạn kết thúc mới<span className="text-red-500">*</span></label>
                <input type="date" value={extendEndDate} onChange={(e) => setExtendEndDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
              </div>
              <div className="flex gap-2 justify-end pt-2 border-t border-gray-200">
                <button type="button" onClick={() => setIsExtendDialogOpen(false)} className="px-4 py-2 border rounded-lg">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Xác nhận</button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* DIALOG XÁC NHẬN THANH LÝ HỢP ĐỒNG */}
      <Dialog.Root open={isTerminateDialogOpen} onOpenChange={setIsTerminateDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content aria-describedby={undefined} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-sm z-50 shadow-xl border">
            <Dialog.Title className="text-lg font-semibold text-gray-900 mb-2">Xác nhận thanh lý hợp đồng</Dialog.Title>
            <div className="text-sm text-gray-500 mb-5 space-y-2">
              <p>Bạn có chắc chắn muốn tiến hành chấm dứt quyền hạn và thanh lý hợp đồng số <strong className="text-gray-800">{contractToTerminate?.contractNumber}</strong>?</p>
              <p className="text-xs text-red-500 font-medium bg-red-50 p-2 rounded border">
                * Lưu ý: Phòng liên kết sẽ chuyển về trạng thái trống khả dụng ngay sau khi thanh lý.
              </p>
            </div>
            <div className="flex gap-2">
              <Dialog.Close className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm font-medium text-center">Hủy</Dialog.Close>
              <button onClick={handleTerminateContract} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium">Thanh lý</button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
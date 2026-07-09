import { useState, useEffect } from 'react';
import { Search, Plus, FileText, Download, Eye, CheckCircle, Clock, XCircle, Calendar } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { toast } from 'sonner';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// --- ĐỊNH NGHĨA INTERFACES THEO BACKEND ---
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
  status: number; // 0, 1, 2... tùy theo enum backend
  statusLabel: string; // "Đang hiệu lực", "Hết hạn",... ăn theo backend trả ra
  remainTime: number; // Số ngày còn lại backend tính sẵn
}

interface CreateContractInput {
  contractNumber: string;
  roomNumber: string;
  tenantName: string;
  startDate: string;
  endDate: string;
  paymentDate: number;
  monthlyRent: number;
}

export default function ContractManagement() {
  const [contracts, setContracts] = useState<ContractBackend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Trạng thái Dialog Chi tiết
  const [selectedContract, setSelectedContract] = useState<ContractBackend | null>(null);
  
  // Trạng thái Dialog Tạo mới
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState<CreateContractInput>({
    contractNumber: '',
    roomNumber: '',
    tenantName: '',
    startDate: '',
    endDate: '',
    paymentDate: 5,
    monthlyRent: 0,
  });

  // Trạng thái Dialog Gia hạn
  const [isExtendDialogOpen, setIsExtendDialogOpen] = useState(false);
  const [extendEndDate, setExtendEndDate] = useState('');

  // 1. Fetch danh sách hợp đồng (GET /api/Contracts)
  const fetchContracts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/Contracts`);
      if (!response.ok) throw new Error('Không thể tải danh sách hợp đồng');
      const data: ContractBackend[] = await response.json();
      setContracts(data);
    } catch (error) {
      toast.error('Lỗi khi kết nối đến máy chủ hợp đồng!');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  // 2. Xem chi tiết hợp đồng (GET /api/Contracts/{id})
  const handleViewDetails = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/Contracts/${id}`);
      if (!response.ok) throw new Error('Không thể tải chi tiết hợp đồng');
      const detailData: ContractBackend = await response.json();
      setSelectedContract(detailData);
    } catch (error) {
      toast.error('Không thể lấy thông tin chi tiết hợp đồng!');
      console.error(error);
    }
  };

  // 3. Tạo hợp đồng mới (POST /api/Contracts)
  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/Contracts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createFormData),
      });

      if (!response.ok) throw new Error('Tạo hợp đồng thất bại');
      
      toast.success('Đã tạo hợp đồng mới thành công!');
      setIsCreateDialogOpen(false);
      // Reset form
      setCreateFormData({
        contractNumber: '',
        roomNumber: '',
        tenantName: '',
        startDate: '',
        endDate: '',
        paymentDate: 5,
        monthlyRent: 0,
      });
      fetchContracts(); // Reload danh sách
    } catch (error) {
      toast.error('Lỗi khi tạo hợp đồng mới!');
      console.error(error);
    }
  };

  // 4. Thanh lý/Hủy hợp đồng (PUT /api/Contracts/{id}/terminate)
  const handleTerminateContract = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn thanh lý hợp đồng này không?')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/Contracts/${id}/terminate`, {
        method: 'PUT',
      });
      if (!response.ok) throw new Error('Thanh lý hợp đồng thất bại');

      toast.success('Đã hoàn tất thanh lý hợp đồng!');
      setSelectedContract(null); // Đóng modal chi tiết nếu đang mở
      fetchContracts(); // Reload danh sách
    } catch (error) {
      toast.error('Gặp lỗi khi thanh lý hợp đồng!');
      console.error(error);
    }
  };

  // 5. Gia hạn hợp đồng (PUT /api/Contracts/{id}/extend)
  const handleExtendContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContract || !extendEndDate) return;

    try {
      const response = await fetch(`${API_BASE_URL}/Contracts/${selectedContract.id}/extend`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(extendEndDate), // Truyền chuỗi DateTime ISO
      });

      if (!response.ok) throw new Error('Gia hạn hợp đồng thất bại');

      toast.success('Gia hạn hợp đồng thành công!');
      setIsExtendDialogOpen(false);
      setSelectedContract(null);
      setExtendEndDate('');
      fetchContracts(); // Reload danh sách
    } catch (error) {
      toast.error('Gặp lỗi khi gia hạn hợp đồng!');
      console.error(error);
    }
  };

  // --- LOGIC LỌC & TÌM KIẾM TRÊN CLIENT ---
  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = 
      contract.contractNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.tenantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.roomNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || String(contract.status) === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Gắn màu sắc Badge động dựa vào nhãn trạng thái từ backend
  const getStatusBadge = (statusLabel: string, status: number) => {
    let className = 'bg-purple-100 text-purple-700';
    let Icon = Clock;

    if (statusLabel?.toLowerCase().includes('hiệu lực') || status === 0) {
      className = 'bg-green-100 text-green-700';
      Icon = CheckCircle;
    } else if (statusLabel?.toLowerCase().includes('hết hạn') || status === 1) {
      className = 'bg-red-100 text-red-700';
      Icon = XCircle;
    } else if (statusLabel?.toLowerCase().includes('sắp') || statusLabel?.toLowerCase().includes('chờ')) {
      className = 'bg-orange-100 text-orange-700';
      Icon = Clock;
    }

    return (
      <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${className}`}>
        <Icon className="w-4 h-4" />
        {statusLabel || 'Không rõ'}
      </span>
    );
  };

  if (isLoading) {
    return <div className="p-6 text-center text-gray-500">Đang tải danh sách hợp đồng từ backend...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Quản lý hợp đồng</h1>
        <p className="text-gray-600">Theo dõi thông tin, tạo mới và gia hạn các hợp đồng thuê phòng</p>
      </div>

      {/* Bộ lọc & Tìm kiếm */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo mã HĐ, tên phòng, người thuê..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="0">Đang hiệu lực</option>
              <option value="1">Hết hạn</option>
            </select>
            <button
              onClick={() => setIsCreateDialogOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Tạo hợp đồng
            </button>
          </div>
        </div>
      </div>

      {/* Danh sách thẻ hợp đồng */}
      <div className="grid grid-cols-1 gap-4">
        {filteredContracts.length === 0 ? (
          <div className="text-center py-10 text-gray-500 border border-dashed rounded-lg bg-white">
            Không tìm thấy hợp đồng nào phù hợp.
          </div>
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
                {getStatusBadge(contract.statusLabel, contract.status)}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Ngày bắt đầu</p>
                  <p className="font-medium">{new Date(contract.startDate).toLocaleDateString('vi-VN')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Ngày kết thúc</p>
                  <p className="font-medium">{new Date(contract.endDate).toLocaleDateString('vi-VN')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Tiền thuê/tháng</p>
                  <p className="font-medium text-blue-600">{contract.price.toLocaleString('vi-VN')} ₫</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Tiền đặt cọc</p>
                  <p className="font-medium text-gray-800">{contract.roomDeposit.toLocaleString('vi-VN')} ₫</p>
                </div>
              </div>

              {/* Cảnh báo thời gian còn lại (remainTime) */}
              {contract.remainTime <= 30 && contract.remainTime > 0 && (
                <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800">
                  ⚠️ Hợp đồng sắp hết hạn! Còn lại <span className="font-semibold">{contract.remainTime} ngày</span>.
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleViewDetails(contract.id)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 text-sm text-gray-700 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Xem chi tiết
                </button>
                <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 text-sm text-gray-700 transition-colors">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- DIALOG CHI TIẾT HỢP ĐỒNG --- */}
      <Dialog.Root open={selectedContract !== null} onOpenChange={(open) => !open && setSelectedContract(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40 transition-opacity" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-auto z-50 shadow-xl">
            {selectedContract && (
              <>
                <Dialog.Title className="text-xl font-bold mb-4 flex items-center justify-between">
                  <span>Hợp đồng: {selectedContract.contractNumber}</span>
                  {getStatusBadge(selectedContract.statusLabel, selectedContract.status)}
                </Dialog.Title>
                
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500">Khách thuê phòng</p>
                      <p className="font-semibold text-base text-gray-900">{selectedContract.tenantName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Mã / Số phòng</p>
                      <p className="font-semibold text-base text-gray-900">Phòng {selectedContract.roomNumber}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                    <div>
                      <p className="text-gray-500">Ngày bắt đầu hợp đồng</p>
                      <p className="font-medium">{new Date(selectedContract.startDate).toLocaleDateString('vi-VN')}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Ngày kết thúc dự kiến</p>
                      <p className="font-medium">{new Date(selectedContract.endDate).toLocaleDateString('vi-VN')}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Chu kỳ đóng tiền phòng</p>
                      <p className="font-medium">{selectedContract.paymentDateLabel || `Ngày ${selectedContract.paymentDate} hàng tháng`}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Thời gian còn lại</p>
                      <p className="font-medium text-orange-600">{selectedContract.remainTime} ngày</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Mức tiền thuê hàng tháng</p>
                      <p className="font-semibold text-blue-600 text-base">{selectedContract.price.toLocaleString('vi-VN')} ₫</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Tiền cọc giữ chỗ (Room Deposit)</p>
                      <p className="font-semibold text-gray-800 text-base">{selectedContract.roomDeposit.toLocaleString('vi-VN')} ₫</p>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
                    <p className="mb-1 font-medium">Hệ thống ghi nhận:</p>
                    <p>• Khởi tạo ngày: {new Date(selectedContract.createdAt).toLocaleString('vi-VN')}</p>
                    <p>• Cập nhật lần cuối: {new Date(selectedContract.updatedAt).toLocaleString('vi-VN')}</p>
                  </div>

                  {/* Thanh công cụ hành động kết nối API Terminate & Extend */}
                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <Dialog.Close className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors">
                      Đóng UI
                    </Dialog.Close>
                    <button 
                      onClick={() => handleTerminateContract(selectedContract.id)}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium transition-colors ml-auto"
                    >
                      Thanh lý hợp đồng
                    </button>
                    <button 
                      onClick={() => setIsExtendDialogOpen(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-1 transition-colors"
                    >
                      <Calendar className="w-4 h-4" /> Gia hạn
                    </button>
                  </div>
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* --- DIALOG GIA HẠN HỢP ĐỒNG (Chạy lồng) --- */}
      <Dialog.Root open={isExtendDialogOpen} onOpenChange={setIsExtendDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md z-50 shadow-2xl">
            <Dialog.Title className="text-lg font-bold mb-3">Gia hạn hợp đồng mới</Dialog.Title>
            <form onSubmit={handleExtendContract} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Chọn ngày kết thúc mới (EndDate)</label>
                <input
                  type="date"
                  value={extendEndDate}
                  onChange={(e) => setExtendEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsExtendDialogOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                >
                  Hủy
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                  Xác nhận gia hạn
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* --- DIALOG TẠO HỢP ĐỒNG MỚI (POST) --- */}
      <Dialog.Root open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-auto z-40 shadow-xl">
            <Dialog.Title className="text-xl font-bold mb-4">Tạo hợp đồng thuê phòng mới</Dialog.Title>
            
            <form className="space-y-4 text-sm" onSubmit={handleCreateContract}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1 text-gray-700">Số hợp đồng</label>
                  <input
                    type="text"
                    value={createFormData.contractNumber}
                    onChange={(e) => setCreateFormData({...createFormData, contractNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ví dụ: HD-2026-009"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-gray-700">Tên khách thuê</label>
                  <input
                    type="text"
                    value={createFormData.tenantName}
                    onChange={(e) => setCreateFormData({...createFormData, tenantName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập họ và tên người thuê"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1 text-gray-700">Số / Mã phòng</label>
                  <input
                    type="text"
                    value={createFormData.roomNumber}
                    onChange={(e) => setCreateFormData({...createFormData, roomNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ví dụ: P102"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-gray-700">Ngày đóng tiền hàng tháng</label>
                  <input
                    type="number"
                    value={createFormData.paymentDate}
                    onChange={(e) => setCreateFormData({...createFormData, paymentDate: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="31"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1 text-gray-700">Ngày bắt đầu ở</label>
                  <input
                    type="date"
                    value={createFormData.startDate}
                    onChange={(e) => setCreateFormData({...createFormData, startDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-gray-700">Ngày kết thúc hợp đồng</label>
                  <input
                    type="date"
                    value={createFormData.endDate}
                    onChange={(e) => setCreateFormData({...createFormData, endDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1 text-gray-700">Tiền phòng/tháng (₫)</label>
                <input
                  type="number"
                  value={createFormData.monthlyRent || ''}
                  onChange={(e) => setCreateFormData({...createFormData, monthlyRent: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập giá phòng thuê"
                  required
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Dialog.Close type="button" className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  Hủy bỏ
                </Dialog.Close>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors">
                  Tạo hợp đồng (Lưu DB)
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
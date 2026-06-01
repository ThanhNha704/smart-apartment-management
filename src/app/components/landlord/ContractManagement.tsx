import { useState } from 'react';
import { Search, Plus, FileText, Download, Eye, CheckCircle, Clock, XCircle } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { toast } from 'sonner';

interface Contract {
  id: string;
  contractNumber: string;
  tenant: string;
  room: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  deposit: number;
  status: 'active' | 'expiring' | 'expired';
  paymentDay: number;
}

const initialContracts: Contract[] = [
  {
    id: '1',
    contractNumber: 'HD-2025-001',
    tenant: 'Nguyễn Văn A',
    room: 'P101',
    startDate: '2025-01-15',
    endDate: '2026-01-14',
    monthlyRent: 2500000,
    deposit: 5000000,
    status: 'active',
    paymentDay: 5,
  },
  {
    id: '2',
    contractNumber: 'HD-2025-002',
    tenant: 'Trần Thị B',
    room: 'P103',
    startDate: '2025-03-01',
    endDate: '2026-03-01',
    monthlyRent: 2800000,
    deposit: 5600000,
    status: 'active',
    paymentDay: 1,
  },
  {
    id: '3',
    contractNumber: 'HD-2024-015',
    tenant: 'Lê Văn C',
    room: 'P201',
    startDate: '2024-11-20',
    endDate: '2025-11-19',
    monthlyRent: 3000000,
    deposit: 6000000,
    status: 'expiring',
    paymentDay: 20,
  },
];

export default function ContractManagement() {
  const [contracts, setContracts] = useState<Contract[]>(initialContracts);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    tenant: '',
    tenantPhone: '',
    tenantEmail: '',
    tenantId: '',
    room: '',
    startDate: '',
    duration: 12,
    monthlyRent: 2500000,
    deposit: 5000000,
    paymentDay: 5,
  });

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.tenant.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.room.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || contract.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    const configs = {
      active: { icon: CheckCircle, label: 'Đang hiệu lực', className: 'bg-green-100 text-green-700' },
      expiring: { icon: Clock, label: 'Sắp hết hạn', className: 'bg-orange-100 text-orange-700' },
      expired: { icon: XCircle, label: 'Hết hạn', className: 'bg-red-100 text-red-700' },
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

  const getRemainingDays = (endDate: string) => {
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleCreateContract = (e: React.FormEvent) => {
    e.preventDefault();
    const startDate = new Date(createFormData.startDate);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + createFormData.duration);

    const newContract: Contract = {
      id: String(contracts.length + 1),
      contractNumber: `HD-2026-${String(contracts.length + 1).padStart(3, '0')}`,
      tenant: createFormData.tenant,
      room: createFormData.room,
      startDate: createFormData.startDate,
      endDate: endDate.toISOString().split('T')[0],
      monthlyRent: createFormData.monthlyRent,
      deposit: createFormData.deposit,
      status: 'active',
      paymentDay: createFormData.paymentDay,
    };

    setContracts([newContract, ...contracts]);
    toast.success('Đã tạo hợp đồng thành công!');
    setIsCreateDialogOpen(false);
    setCreateFormData({
      tenant: '',
      tenantPhone: '',
      tenantEmail: '',
      tenantId: '',
      room: '',
      startDate: '',
      duration: 12,
      monthlyRent: 2500000,
      deposit: 5000000,
      paymentDay: 5,
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Quản lý hợp đồng</h1>
        <p className="text-gray-600">Quản lý hợp đồng thuê phòng và theo dõi thời hạn</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 mb-6 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm hợp đồng, phòng, người thuê..."
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
              <option value="active">Đang hiệu lực</option>
              <option value="expiring">Sắp hết hạn</option>
              <option value="expired">Hết hạn</option>
            </select>
            <button
              onClick={() => setIsCreateDialogOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Tạo hợp đồng
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredContracts.map((contract) => {
          const remainingDays = getRemainingDays(contract.endDate);

          return (
            <div key={contract.id} className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{contract.contractNumber}</h3>
                    <p className="text-sm text-gray-600">{contract.tenant} - {contract.room}</p>
                  </div>
                </div>
                {getStatusBadge(contract.status)}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Ngày bắt đầu</p>
                  <p className="font-medium">{new Date(contract.startDate).toLocaleDateString('vi-VN')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Ngày kết thúc</p>
                  <p className="font-medium">{new Date(contract.endDate).toLocaleDateString('vi-VN')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Tiền thuê/tháng</p>
                  <p className="font-medium text-blue-600">{contract.monthlyRent.toLocaleString('vi-VN')} ₫</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Tiền cọc</p>
                  <p className="font-medium">{contract.deposit.toLocaleString('vi-VN')} ₫</p>
                </div>
              </div>

              {contract.status === 'expiring' && (
                <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-800">
                    ⚠️ Hợp đồng sẽ hết hạn sau <span className="font-semibold">{remainingDays} ngày</span>. Liên hệ để gia hạn.
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setSelectedContract(contract)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 text-sm"
                >
                  <Eye className="w-4 h-4" />
                  Xem chi tiết
                </button>
                <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm">
                  <Download className="w-4 h-4" />
                  Tải hợp đồng
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog.Root open={selectedContract !== null} onOpenChange={(open) => !open && setSelectedContract(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-auto">
            {selectedContract && (
              <>
                <Dialog.Title className="text-xl font-semibold mb-4">Chi tiết hợp đồng</Dialog.Title>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Mã hợp đồng</p>
                      <p className="font-medium">{selectedContract.contractNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Trạng thái</p>
                      <div className="mt-1">{getStatusBadge(selectedContract.status)}</div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Người thuê</p>
                      <p className="font-medium">{selectedContract.tenant}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phòng</p>
                      <p className="font-medium">{selectedContract.room}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Ngày bắt đầu</p>
                      <p className="font-medium">{new Date(selectedContract.startDate).toLocaleDateString('vi-VN')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Ngày kết thúc</p>
                      <p className="font-medium">{new Date(selectedContract.endDate).toLocaleDateString('vi-VN')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Tiền thuê/tháng</p>
                      <p className="font-medium text-blue-600">{selectedContract.monthlyRent.toLocaleString('vi-VN')} ₫</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Tiền đặt cọc</p>
                      <p className="font-medium">{selectedContract.deposit.toLocaleString('vi-VN')} ₫</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Ngày thanh toán</p>
                      <p className="font-medium">Ngày {selectedContract.paymentDay} hàng tháng</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Thời hạn còn lại</p>
                      <p className="font-medium">{getRemainingDays(selectedContract.endDate)} ngày</p>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Điều khoản hợp đồng</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Thanh toán tiền phòng trước ngày {selectedContract.paymentDay} hàng tháng</li>
                      <li>• Không được chuyển nhượng hợp đồng cho người khác</li>
                      <li>• Thông báo trước 1 tháng khi muốn trả phòng</li>
                      <li>• Giữ gìn vệ sinh và cơ sở vật chất phòng</li>
                      <li>• Tuân thủ nội quy chung của tòa nhà</li>
                    </ul>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Dialog.Close className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                      Đóng
                    </Dialog.Close>
                    <button className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                      Gia hạn hợp đồng
                    </button>
                    <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Tải hợp đồng
                    </button>
                  </div>
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Dialog Tạo hợp đồng */}
      <Dialog.Root open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-auto">
            <Dialog.Title className="text-xl font-semibold mb-4">Tạo hợp đồng mới</Dialog.Title>
            <form className="space-y-4" onSubmit={handleCreateContract}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Họ và tên người thuê</label>
                  <input
                    type="text"
                    value={createFormData.tenant}
                    onChange={(e) => setCreateFormData({...createFormData, tenant: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nguyễn Văn A"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Số điện thoại</label>
                  <input
                    type="tel"
                    value={createFormData.tenantPhone}
                    onChange={(e) => setCreateFormData({...createFormData, tenantPhone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0901234567"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={createFormData.tenantEmail}
                    onChange={(e) => setCreateFormData({...createFormData, tenantEmail: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="email@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">CMND/CCCD</label>
                  <input
                    type="text"
                    value={createFormData.tenantId}
                    onChange={(e) => setCreateFormData({...createFormData, tenantId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="001234567890"
                    required
                  />
                </div>
              </div>

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
                    <option value="P301">P301</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ngày bắt đầu</label>
                  <input
                    type="date"
                    value={createFormData.startDate}
                    onChange={(e) => setCreateFormData({...createFormData, startDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Thời hạn hợp đồng</label>
                  <select
                    value={createFormData.duration}
                    onChange={(e) => setCreateFormData({...createFormData, duration: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={6}>6 tháng</option>
                    <option value={12}>12 tháng</option>
                    <option value={24}>24 tháng</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ngày thanh toán hàng tháng</label>
                  <input
                    type="number"
                    value={createFormData.paymentDay}
                    onChange={(e) => setCreateFormData({...createFormData, paymentDay: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="31"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tiền thuê/tháng (VNĐ)</label>
                  <input
                    type="number"
                    value={createFormData.monthlyRent}
                    onChange={(e) => setCreateFormData({...createFormData, monthlyRent: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tiền đặt cọc (VNĐ)</label>
                  <input
                    type="number"
                    value={createFormData.deposit}
                    onChange={(e) => setCreateFormData({...createFormData, deposit: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Thông tin tổng hợp</h4>
                <div className="space-y-1 text-sm text-blue-800">
                  <p>• Thời hạn: {createFormData.duration} tháng</p>
                  <p>• Thanh toán: Ngày {createFormData.paymentDay} hàng tháng</p>
                  <p>• Tiền thuê: {createFormData.monthlyRent.toLocaleString('vi-VN')} ₫/tháng</p>
                  <p>• Tiền cọc: {createFormData.deposit.toLocaleString('vi-VN')} ₫</p>
                  <p className="font-semibold pt-2 border-t border-blue-200">
                    Tổng thanh toán lần đầu: {(createFormData.monthlyRent + createFormData.deposit).toLocaleString('vi-VN')} ₫
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Dialog.Close className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Hủy
                </Dialog.Close>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Tạo hợp đồng
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

import { useState } from 'react';
import { Search, Plus, Edit, Trash2, Phone, Mail, Calendar, Home } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { toast } from 'sonner';

interface Tenant {
  id: string;
  name: string;
  phone: string;
  email: string;
  idNumber: string;
  room: string;
  moveInDate: string;
  depositAmount: number;
  monthlyRent: number;
  password?: string;
  status: 'active' | 'moving-out' | 'expired';
}

const initialTenants: Tenant[] = [
  {
    id: '1',
    name: 'Nguyễn Văn A',
    phone: '0901234567',
    email: 'nguyenvana@email.com',
    idNumber: '001234567890',
    room: 'P101',
    moveInDate: '2025-01-15',
    depositAmount: 5000000,
    monthlyRent: 2500000,
    status: 'active',
  },
  {
    id: '2',
    name: 'Trần Thị B',
    phone: '0912345678',
    email: 'tranthib@email.com',
    idNumber: '001234567891',
    room: 'P103',
    moveInDate: '2025-03-01',
    depositAmount: 5600000,
    monthlyRent: 2800000,
    status: 'active',
  },
  {
    id: '3',
    name: 'Lê Văn C',
    phone: '0923456789',
    email: 'levanc@email.com',
    idNumber: '001234567892',
    room: 'P201',
    moveInDate: '2024-11-20',
    depositAmount: 6000000,
    monthlyRent: 3000000,
    status: 'active',
  },
];

// Khởi tạo form trống cho người thuê mới
const blankTenant: Omit<Tenant, 'id'> = {
  name: '',
  phone: '',
  email: '',
  idNumber: '',
  room: '',
  moveInDate: new Date().toISOString().split('T')[0], // Mặc định lấy ngày hôm nay
  depositAmount: 0,
  monthlyRent: 0,
  status: 'active',
};

export default function TenantManagement() {
  const [tenants, setTenants] = useState<Tenant[]>(initialTenants);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  
  // State quản lý việc đóng/mở và dữ liệu của Dialog thêm mới
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTenant, setNewTenant] = useState<Omit<Tenant, 'id'>>(blankTenant);

  const filteredTenants = tenants.filter(tenant =>
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.phone.includes(searchTerm) ||
    tenant.room.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Hàm xử lý khi nhấn Lưu (Thêm mới người thuê)
  const handleAddTenant = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTenant.name || !newTenant.phone || !newTenant.room) {
      toast.error('Vui lòng điền đầy đủ các thông tin bắt buộc (Tên, SĐT, Phòng)!');
      return;
    }

    const createdTenant: Tenant = {
      ...newTenant,
      id: Date.now().toString(), // Tạo id tạm thời bằng timestamp
    };

    setTenants([createdTenant, ...tenants]);
    toast.success('Thêm mới người thuê thành công!');
    setIsAddOpen(false);
    setNewTenant(blankTenant); // Reset form về trống
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      active: { label: 'Đang ở', className: 'bg-green-100 text-green-700' },
      'moving-out': { label: 'Sắp trả phòng', className: 'bg-orange-100 text-orange-700' },
      expired: { label: 'Đã trả phòng', className: 'bg-gray-100 text-gray-700' },
    };
    const config = configs[status as keyof typeof configs];
    return <span className={`px-3 py-1 rounded-full text-sm ${config.className}`}>{config.label}</span>;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Quản lý người thuê</h1>
        <p className="text-gray-600">Quản lý thông tin người thuê trọ</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 mb-6 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm tên, số điện thoại, phòng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Nút trigger mở Dialog thêm người thuê */}
          <button 
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Thêm người thuê
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredTenants.map((tenant) => (
          <div key={tenant.id} className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {tenant.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{tenant.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Home className="w-4 h-4" />
                    <span>{tenant.room}</span>
                  </div>
                </div>
              </div>
              {getStatusBadge(tenant.status)}
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">{tenant.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">{tenant.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">
                  Nhận phòng: {new Date(tenant.moveInDate).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs text-gray-600 mb-1">Tiền cọc</p>
                <p className="font-medium text-sm">{tenant.depositAmount.toLocaleString('vi-VN')} ₫</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Tiền thuê/tháng</p>
                <p className="font-medium text-sm text-blue-600">{tenant.monthlyRent.toLocaleString('vi-VN')} ₫</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedTenant(tenant)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 text-sm"
              >
                <Edit className="w-4 h-4" />
                Chi tiết
              </button>
              <button className="px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* DIALOG 1: THÊM NGƯỜI THUÊ MỚI */}
      <Dialog.Root open={isAddOpen} onOpenChange={setIsAddOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-auto z-50">
            <Dialog.Title className="text-xl font-semibold mb-4">Thêm người thuê mới</Dialog.Title>
            <form onSubmit={handleAddTenant} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Họ và tên <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={newTenant.name}
                    onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Số điện thoại <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={newTenant.phone}
                    onChange={(e) => setNewTenant({ ...newTenant, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="090xxxxxxx"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={newTenant.email}
                    onChange={(e) => setNewTenant({ ...newTenant, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="example@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">CMND/CCCD</label>
                  <input
                    type="text"
                    value={newTenant.idNumber}
                    onChange={(e) => setNewTenant({ ...newTenant, idNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Căn cước công dân"
                  />
                </div>
                {/* Mật khẩu */}
                <div>
                  <label className="block text-sm font-medium mb-1">Mật khẩu
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={newTenant.password}
                    onChange={(e) => setNewTenant({ ...newTenant, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập mật khẩu"
                  />
                </div>
                {/* <div>
                  <label className="block text-sm font-medium mb-1">Nhập lại mật khẩu
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={newTenant.password}
                    onChange={(e) => setNewTenant({ ...newTenant, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập lại mật khẩu"
                  />
                </div> */}
                {/* Phòng */}
                {/* <div>
                  <label className="block text-sm font-medium mb-1">Phòng <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={newTenant.room}
                    onChange={(e) => setNewTenant({ ...newTenant, room: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ví dụ: P101"
                  />
                </div> */}
                {/* Ngày nhận phòng */}
                {/* <div>
                  <label className="block text-sm font-medium mb-1">Ngày nhận phòng</label>
                  <input
                    type="date"
                    value={newTenant.moveInDate}
                    onChange={(e) => setNewTenant({ ...newTenant, moveInDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div> */}
                {/* Tiền đặt cọc */}
                {/* <div>
                  <label className="block text-sm font-medium mb-1">Tiền đặt cọc (VNĐ)</label>
                  <input
                    type="number"
                    value={newTenant.depositAmount || ''}
                    onChange={(e) => setNewTenant({ ...newTenant, depositAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div> */}
                {/* Tiền thuê */}
                {/* <div>
                  <label className="block text-sm font-medium mb-1">Tiền thuê/tháng (VNĐ)</label>
                  <input
                    type="number"
                    value={newTenant.monthlyRent || ''}
                    onChange={(e) => setNewTenant({ ...newTenant, monthlyRent: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div> */}
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <Dialog.Close type="button" className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Hủy
                </Dialog.Close>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Thêm mới
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* DIALOG 2: CHI TIẾT / SỬA NGƯỜI THUÊ (Giữ nguyên của bạn) */}
      <Dialog.Root open={selectedTenant !== null} onOpenChange={(open) => !open && setSelectedTenant(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-auto z-50">
            {selectedTenant && (
              <>
                <Dialog.Title className="text-xl font-semibold mb-4">Thông tin người thuê</Dialog.Title>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Họ và tên</label>
                      <input
                        type="text"
                        defaultValue={selectedTenant.name}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Số điện thoại</label>
                      <input
                        type="text"
                        defaultValue={selectedTenant.phone}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <input
                        type="email"
                        defaultValue={selectedTenant.email}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">CMND/CCCD</label>
                      <input
                        type="text"
                        defaultValue={selectedTenant.idNumber}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Phòng</label>
                      <input
                        type="text"
                        defaultValue={selectedTenant.room}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Ngày nhận phòng</label>
                      <input
                        type="date"
                        defaultValue={selectedTenant.moveInDate}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Tiền đặt cọc (VNĐ)</label>
                      <input
                        type="number"
                        defaultValue={selectedTenant.depositAmount}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Tiền thuê/tháng (VNĐ)</label>
                      <input
                        type="number"
                        defaultValue={selectedTenant.monthlyRent}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <Dialog.Close className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                      Hủy
                    </Dialog.Close>
                    <button
                      onClick={() => {
                        toast.success('Đã cập nhật thông tin!');
                        setSelectedTenant(null);
                      }}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Lưu thay đổi
                    </button>
                  </div>
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
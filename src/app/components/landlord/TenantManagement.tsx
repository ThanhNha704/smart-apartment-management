import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Phone, Mail, MapPin, Loader2, Eye, EyeOff } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { toast } from 'sonner';
import axios from 'axios';

// Cấu hình URL của Backend API
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Interface khớp 100% với Schema mẫu từ GET/POST /api/Users trong Swagger của bạn
interface UserTenant {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  name: string;
  // username: string;
  password?: string;
  phoneNumber: string;
  email: string;
  address: string;
  role?: string;
  roleLabel?: string;
  isActive?: boolean;
}

// Khởi tạo form trống tương ứng với Request Body của POST /api/Users
const blankTenantFormData = {
  name: '',
  // username: '',
  password: '',
  phoneNumber: '',
  email: '',
  address: '',
};

export default function TenantManagement() {
  const [tenants, setTenants] = useState<UserTenant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPassword, setShowPassword] = useState(false);


  // Trạng thái đóng/mở Dialogs
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState<string | null>(null);

  // States quản lý dữ liệu form
  const [formData, setFormData] = useState(blankTenantFormData);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  // 1. Gọi API lấy danh sách người dùng từ Backend (GET /api/Users)
  const fetchTenants = async () => {
    try {
      setLoading(true);
      const response = await axios.get<UserTenant[]>(`${API_BASE_URL}/Users`);
      // Thường hệ thống quản lý trọ sẽ lọc các tài khoản có role là khách thuê (Tenant)
      // Nếu backend trả về chung, bạn có thể lọc: response.data.filter(u => u.roleLabel === 'Tenant' hoặc tương đương)
      setTenants(response.data);
    } catch (error) {
      console.error("Lỗi khi fetch users:", error);
      toast.error('Không thể tải danh sách người thuê từ server!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  // 2. Xử lý Thêm người thuê mới (POST /api/Users)
  const handleAddTenant = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name
      // || !formData.username 
      || !formData.password
      || !formData.phoneNumber) {
      toast.error('Vui lòng điền đầy đủ các thông tin bắt buộc!');
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/Users`, formData);
      toast.success('Thêm mới người thuê lên hệ thống thành công!');
      setIsAddOpen(false);
      setFormData(blankTenantFormData); // Reset form
      fetchTenants(); // Tải lại danh sách realtime
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response?.data?.message || 'Lỗi khi tạo tài khoản người thuê!';
      toast.error(errorMsg);
    }
  };

  // Mở modal chỉnh sửa và đổ dữ liệu cũ vào form
  const openEditModal = (tenant: UserTenant) => {
    setSelectedTenantId(tenant.id);
    setFormData({
      name: tenant.name,
      // username: tenant.username,
      password: '', // Không hiển thị lại mật khẩu cũ vì lý do bảo mật
      phoneNumber: tenant.phoneNumber,
      email: tenant.email,
      address: tenant.address
    });
    setIsEditOpen(true);
  };

  // 3. Xử lý cập nhật thông tin người thuê (PUT /api/Users/{id})
  const handleUpdateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenantId) return;

    try {
      await axios.put(`${API_BASE_URL}/Users/${selectedTenantId}`, {
        id: selectedTenantId,
        ...formData
      });
      toast.success('Cập nhật thông tin người thuê thành công!');
      setIsEditOpen(false);
      setSelectedTenantId(null);
      setFormData(blankTenantFormData);
      fetchTenants();
    } catch (error) {
      console.error(error);
      toast.error('Cập nhật thất bại, vui lòng kiểm tra lại dữ liệu!');
    }
  };

  // 4. Xử lý Xóa tài khoản người thuê (DELETE /api/Users/{id})
  const confirmDeleteTenant = async () => {
    if (!tenantToDelete) return;
    try {
      await axios.delete(`${API_BASE_URL}/Users/${tenantToDelete}`);
      toast.success('Đã xóa tài khoản thành công!');
      setIsDeleteDialogOpen(false);
      setTenantToDelete(null);
      fetchTenants(); // Hoặc fetchData() tùy theo hàm làm mới dữ liệu của bạn
    } catch (error) {
      console.error(error);
      toast.error('Không thể xóa người dùng này (Có thể liên quan đến ràng buộc dữ liệu hợp đồng).');
    }
  };

  // Hàm này gắn vào sự kiện onClick của nút "Xóa" dưới danh sách/bảng
  const openDeleteModal = (id: string) => {
    setTenantToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  // Tìm kiếm cục bộ trên tập dữ liệu dynamic lấy về từ backend
  const filteredTenants = tenants.filter(tenant =>
    tenant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.phoneNumber?.includes(searchTerm)
    // || tenant.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Quản lý người thuê</h1>
        <p className="text-gray-600">Dữ liệu danh sách tài khoản hệ thống</p>
      </div>

      {/* Tìm kiếm & Thêm mới */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, số điện thoại, tên tài khoản..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={() => {
              setFormData(blankTenantFormData);
              setIsAddOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> Thêm khách thuê
          </button>
        </div>
      </div>

      {/* Loading Indicator */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-500">Đang đồng bộ dữ liệu từ Swagger Server...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredTenants.map((tenant) => (
            <div key={tenant.id} className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {tenant.name ? tenant.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{tenant.name}</h3>
                    {/* <div className="text-xs text-gray-500">
                      Tài khoản: <span className="font-mono font-medium text-gray-700">{tenant.username}</span>
                    </div> */}
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${tenant.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {tenant.roleLabel || 'Khách thuê'}
                </span>
              </div>

              <div className="space-y-2 mb-4 border-t border-gray-100 pt-3">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>{tenant.phoneNumber || 'Chưa cập nhật SĐT'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="truncate">{tenant.email || 'Chưa liên kết email'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="line-clamp-1">{tenant.address || 'Chưa khai báo địa chỉ'}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <button
                  onClick={() => openEditModal(tenant)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <Edit className="w-4 h-4" /> Sửa thông tin
                </button>
                <button
                  onClick={() => openDeleteModal(tenant.id)}
                  className="px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DIALOG THÊM NGƯỜI THUÊ MỚI (POST /api/Users) */}
      <Dialog.Root open={isAddOpen} onOpenChange={setIsAddOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-xl max-h-[90vh] overflow-auto z-50">
            <Dialog.Title className="text-xl font-semibold mb-4">Tạo tài khoản khách thuê mới</Dialog.Title>
            <form onSubmit={handleAddTenant} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Họ và tên <span className="text-red-500">*</span></label>
                  <input
                    type="text" required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Số điện thoại <span className="text-red-500">*</span></label>
                  <input
                    type="text" required
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="090xxxxxxx"
                  />
                </div>
                {/* <div>
                  <label className="block text-sm font-medium mb-1">Tên tài khoản (username) <span className="text-red-500">*</span></label>
                  <input
                    type="text" required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono"
                    placeholder="anv123"
                  />
                </div> */}
                <div>
                  <label className="block text-sm font-medium mb-1">Mật khẩu kích hoạt <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email liên hệ</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="nguyenvana@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Địa chỉ thường trú (address)</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Xã/Phường, Quận/Huyện, Tỉnh Thành"
                />
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <Dialog.Close type="button" className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Hủy</Dialog.Close>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Đăng ký thành viên</button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* DIALOG SỬA THÔNG TIN NGƯỜI THUÊ (PUT /api/Users/{id}) */}
      <Dialog.Root open={isEditOpen} onOpenChange={(open) => !open && setIsEditOpen(false)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-xl max-h-[90vh] overflow-auto z-50">
            <Dialog.Title className="text-xl font-semibold mb-4">Cập nhật thông tin tài khoản</Dialog.Title>
            <form onSubmit={handleUpdateTenant} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Họ và tên</label>
                  <input
                    type="text" required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Số điện thoại</label>
                  <input
                    type="text" required
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                {/* <div>
                  <label className="block text-sm font-medium mb-1">Tên tài khoản (Không được đổi)</label>
                  <input
                    type="text" disabled
                    value={formData.username}
                    className="w-full px-3 py-2 border border-gray-300 bg-gray-50 rounded-lg text-gray-500 font-mono"
                  />
                </div> */}
                <div>
                  <label className="block text-sm font-medium mb-1">Mật khẩu mới</label>
                  <label className="block text-sm text-gray-500 font-medium mb-1">(Bỏ trống nếu giữ nguyên)</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Nhập mật khẩu mới nếu cần đổi"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Địa chỉ</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <Dialog.Close type="button" className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Hủy</Dialog.Close>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Lưu thay đổi</button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Dialog Xác nhận xóa tài khoản */}
      <Dialog.Root open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 animate-fade-in" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-sm shadow-xl border border-gray-200">
            <Dialog.Title className="text-lg font-semibold text-gray-900 mb-2">
              Xác nhận xóa tài khoản
            </Dialog.Title>

            <p className="text-sm text-gray-500 mb-5">
              Bạn có chắc chắn muốn xóa tài khoản người thuê này khỏi cơ sở dữ liệu? Hành động này không thể hoàn tác.
            </p>

            <div className="flex gap-2">
              <Dialog.Close className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors">
                Hủy
              </Dialog.Close>
              <button
                onClick={confirmDeleteTenant}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
              >
                Xác nhận xóa
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
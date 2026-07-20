import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Phone, Mail, MapPin, Loader2, Eye, EyeOff, CreditCard, Calendar } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { toast } from 'sonner';
import { fetchApi } from '../../api/fetchApi';

// Interface
interface UserTenant {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  idCard: string;
  avatarUrl: string | null;
  address: string;
  dateOfBirth: string;
  roomNumber: string | null;
  isActive: boolean;
  role: string;
}

// Cấu trúc Form
const blankTenantFormData = {
  name: '',
  password: '',
  email: '',
  phoneNumber: '',
  idCard: '',
  address: '',
  dateOfBirth: '',
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
  const [tenantToDelete, setTenantToDelete] = useState<UserTenant | null>(null);

  // States quản lý dữ liệu form
  const [formData, setFormData] = useState(blankTenantFormData);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  // Lấy danh sách người dùng
  const fetchTenants = async () => {
    try {
      setLoading(true);
      const response = await fetchApi('/Users');
      if (!response.ok) throw new Error('Không thể tải dữ liệu');
      const data = await response.json();
      setTenants(data);
    } catch (error) {
      console.error("Lỗi khi fetch users:", error);
      toast.error('Không thể tải danh sách khách thuê từ server!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  // Xử lý Thêm người thuê mới (POST /api/Users)
  const handleAddTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.password || !formData.phoneNumber || !formData.idCard || !formData.dateOfBirth) {
      toast.error('Vui lòng điền đầy đủ các thông tin bắt buộc (Tên, Mật khẩu, SĐT, CCCD, Ngày sinh)!');
      return;
    }

    try {
      const payload = {
        ...formData,
        dateOfBirth: new Date(formData.dateOfBirth).toISOString()
      };

      const response = await fetchApi('/Users', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success('Thêm mới khách thuê thành công!');
        setIsAddOpen(false);
        setFormData(blankTenantFormData);
        fetchTenants();
      } else {
        const errorData = await response.json().catch(() => null);
        const errMsg = errorData?.join?.(', ') || errorData?.message || 'Lỗi khi tạo tài khoản!';
        toast.error(errMsg);
      }
    } catch (error) {
      toast.error('Lỗi kết nối đến server!');
    }
  };

  // Mở modal chỉnh sửa
  const openEditModal = (tenant: UserTenant) => {
    setSelectedTenantId(tenant.id);

    let formattedDate = '';
    if (tenant.dateOfBirth) {
      formattedDate = tenant.dateOfBirth.split('T')[0];
    }

    setFormData({
      name: tenant.name,
      password: '',
      email: tenant.email,
      phoneNumber: tenant.phoneNumber,
      idCard: tenant.idCard || '',
      address: tenant.address,
      dateOfBirth: formattedDate,
    });
    setIsEditOpen(true);
  };

  // Xử lý Cập nhật thông tin (PUT /api/Users/{id})
  const handleUpdateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenantId) return;

    try {
      const payload = {
        ...formData,
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : ""
      };

      const response = await fetchApi(`/Users/${selectedTenantId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success('Cập nhật thông tin thành công!');
        setIsEditOpen(false);
        setSelectedTenantId(null);
        setFormData(blankTenantFormData);
        fetchTenants();
      } else {
        const errorData = await response.json().catch(() => null);
        const errMsg = errorData?.join?.(', ') || errorData?.message || 'Cập nhật thất bại!';
        toast.error(errMsg);
      }
    } catch (error) {
      toast.error('Lỗi kết nối đến server!');
    }
  };

  // Xử lý Xóa tài khoản
  const confirmDeleteTenant = async () => {
    if (!tenantToDelete) return;
    try {
      const response = await fetchApi(`/Users/${tenantToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Đã xóa tài khoản thành công!');
        setIsDeleteDialogOpen(false);
        setTenantToDelete(null);
        fetchTenants();
      } else {
        throw new Error('Xóa thất bại');
      }
    } catch (error) {
      console.error(error);
      toast.error('Không thể xóa người dùng này (Có thể liên quan đến ràng buộc hợp đồng).');
    }
  };

  const openDeleteModal = (tenant: UserTenant) => {
    setTenantToDelete(tenant);
    setIsDeleteDialogOpen(true);
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return 'Chưa cập nhật';

    try {
      // Tách chuỗi bằng khoảng trắng để lấy phần đầu tiên
      const firstPart = dateStr.trim().split(' ')[0]; // Kết quả sẽ là '16/07/2026' hoặc '2000-03-19'

      // Nếu chuỗi trả về chứa chữ 'T'
      const onlyDate = firstPart.includes('T') ? firstPart.split('T')[0] : firstPart;

      // Nếu không rơi vào các trường hợp trên
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return onlyDate;

      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();

      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  const filteredTenants = tenants.filter(tenant =>
    tenant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.phoneNumber?.includes(searchTerm) ||
    tenant.idCard?.includes(searchTerm) ||
    tenant.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Quản lý người thuê</h1>
        <p className="text-gray-600">Danh sách tài khoản khách thuê phòng trọ</p>
      </div>

      {/* Thanh công cụ Tìm kiếm & Thêm mới */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, số điện thoại, CCCD, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          <button
            onClick={() => {
              setFormData(blankTenantFormData);
              setIsAddOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors shrink-0"
          >
            <Plus className="w-5 h-5" /> Thêm khách thuê
          </button>
        </div>
      </div>

      {/* Hiển thị Danh sách */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-500">Đang đồng bộ dữ liệu hệ thống...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredTenants.map((tenant) => (
            <div key={tenant.id} className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {tenant.avatarUrl ? (
                    <img src={tenant.avatarUrl} alt={tenant.name} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {tenant.name ? tenant.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{tenant.name}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>NS: {formatDateDisplay(tenant.dateOfBirth)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tenant.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {tenant.isActive ? 'Đang hoạt động' : 'Tạm khóa'}
                  </span>
                  {tenant.roomNumber && (
                    <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded">
                      Phòng: {tenant.roomNumber}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2 mb-4 border-t border-gray-100 pt-3">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>{tenant.phoneNumber || 'Chưa cập nhật SĐT'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <CreditCard className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>CCCD: <span className="font-medium text-gray-900">{tenant.idCard || 'Chưa cập nhật'}</span></span>
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
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                >
                  <Edit className="w-4 h-4" /> Sửa thông tin
                </button>
                <button
                  onClick={() => openDeleteModal(tenant)}
                  className="px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DIALOG THÊM MỚI KHÁCH THUÊ */}
      <Dialog.Root open={isAddOpen} onOpenChange={setIsAddOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 transition-opacity" />
          <Dialog.Content aria-describedby={undefined} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-xl max-h-[90vh] overflow-auto z-50 shadow-2xl">
            <Dialog.Title className="text-xl font-semibold mb-4">Tạo tài khoản khách thuê mới</Dialog.Title>
            <form onSubmit={handleAddTenant} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Họ và tên <span className="text-red-500">*</span></label>
                  <input
                    type="text" required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:outline-none"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Số điện thoại <span className="text-red-500">*</span></label>
                  <input
                    type="text" required
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:outline-none"
                    placeholder="090xxxxxxx"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Số CCCD <span className="text-red-500">*</span></label>
                  <input
                    type="text" required
                    value={formData.idCard}
                    onChange={(e) => setFormData({ ...formData, idCard: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:outline-none font-mono"
                    placeholder="079xxxxxxxxxx"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ngày sinh <span className="text-red-500">*</span></label>
                  <input
                    type="date" required
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Mật khẩu hệ thống <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:outline-none"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:outline-none"
                  placeholder="nguyenvana@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Địa chỉ thường trú</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:outline-none"
                  placeholder="Xã/Phường, Quận/Huyện, Tỉnh Thành"
                />
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <Dialog.Close type="button" className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">Hủy</Dialog.Close>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">Đăng ký thành viên</button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* DIALOG CHỈNH SỬA THÔNG TIN */}
      <Dialog.Root open={isEditOpen} onOpenChange={(open) => !open && setIsEditOpen(false)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 transition-opacity" />
          <Dialog.Content aria-describedby={undefined} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-xl max-h-[90vh] overflow-auto z-50 shadow-2xl">
            <Dialog.Title className="text-xl font-semibold mb-4">Cập nhật thông tin tài khoản</Dialog.Title>
            <form onSubmit={handleUpdateTenant} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Họ và tên</label>
                  <input
                    type="text" required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Số điện thoại</label>
                  <input
                    type="text" required
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Số CCCD <span className="text-red-500">*</span></label>
                  <input
                    type="text" required
                    value={formData.idCard}
                    onChange={(e) => setFormData({ ...formData, idCard: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono focus:ring-1 focus:ring-black focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ngày sinh <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    required
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Mật khẩu mới <span className="text-xs text-gray-400">(Bỏ trống nếu giữ nguyên)</span></label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:outline-none"
                    placeholder="Nhập mật khẩu mới"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Địa chỉ</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <Dialog.Close type="button" className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">Hủy</Dialog.Close>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">Lưu thay đổi</button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* DIALOG XÁC NHẬN XÓA */}
      <Dialog.Root open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 transition-opacity" />
          <Dialog.Content aria-describedby={undefined} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-sm shadow-xl border border-gray-200 z-50">
            <Dialog.Title className="text-lg font-semibold text-gray-900 mb-2">
              Xác nhận xóa tài khoản
            </Dialog.Title>

            <div className="text-sm text-gray-500 mb-5 space-y-2">
              <p>
                Bạn có chắc chắn muốn xóa khách thuê <strong className="text-gray-800">{tenantToDelete?.name}</strong> khỏi hệ thống?
              </p>
              <p className="text-red-500 text-xs font-medium">
                * Hành động này sẽ loại bỏ hoàn toàn dữ liệu của khách và không thể khôi phục lại.
              </p>
            </div>

            <div className="flex gap-2">
              <Dialog.Close className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors text-center">
                Hủy
              </Dialog.Close>
              <button
                onClick={confirmDeleteTenant}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors shadow-xs"
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
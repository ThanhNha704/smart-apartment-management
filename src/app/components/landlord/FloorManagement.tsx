import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Building2, DoorOpen, Users } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { toast } from 'sonner';
import { fetchApi } from '../../utils/api';

// Định nghĩa Interface
interface FloorItem {
  id: string;
  floorNumber: number;
  name: string;
  description: string;
  roomCount: number;
  occupiedRooms: number;
  emptyRooms: number;
  revenueOnFloor: number;
}

interface ApiResponse {
  totalFloors: number;
  totalRooms: number;
  monthlyRevenue: number;
  floors: FloorItem[];
}

export default function FloorManagement() {
  // Quản lý dữ liệu tổng quan và danh sách tầng
  const [apiData, setApiData] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Trạng thái Dialogs
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState<FloorItem | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [floorToDelete, setFloorToDelete] = useState<string | null>(null);

  // States quản lý dữ liệu Form nhập vào
  const [addFormData, setAddFormData] = useState({ floorNumber: '', name: '', description: '' });
  const [editFormData, setEditFormData] = useState({ floorNumber: '', name: '', description: '' });

  // Hàm GET: Lấy danh sách tầng
  const fetchFloors = async () => {
    try {
      setIsLoading(true);
      const response = await fetchApi('/Floors');
      if (!response.ok) throw new Error('Không thể tải dữ liệu');

      const data: ApiResponse = await response.json();
      setApiData(data);
    } catch (error) {
      toast.error('Lỗi khi lấy danh sách tầng từ server!');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFloors();
  }, []);

  // Tính tỷ lệ lấp đầy
  const getOccupancyRate = (floor: FloorItem) => {
    if (floor.roomCount === 0) return 0;
    return Math.round((floor.occupiedRooms / floor.roomCount) * 100);
  };

  // Hàm POST: Thêm tầng mới
  const handleAddFloor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const num = parseInt(addFormData.floorNumber.replace(/\D/g, '')) || 0;

      const payload = {
        name: addFormData.name || `Tầng ${num}`,
        floorNumber: num,
        description: addFormData.description
      };

      const response = await fetchApi('/Floors', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success('Đã thêm tầng thành công!');
        setIsAddDialogOpen(false);
        setAddFormData({ floorNumber: '', name: '', description: '' });
        fetchFloors();
      } else {
        const errorData = await response.json().catch(() => null);
        const errMsg = errorData?.join?.(', ') || 'Thêm tầng thất bại. Vui lòng thử lại!';
        toast.error(errMsg);
      }
    } catch (error) {
      toast.error('Lỗi kết nối đến server!');
    }
  };

  // Mở popup sửa và gán dữ liệu cũ vào state form
  const handleOpenEdit = (floor: FloorItem) => {
    setSelectedFloor(floor);
    setEditFormData({
      floorNumber: floor.floorNumber.toString(),
      name: floor.name,
      description: floor.description || '',
    });
    setIsEditDialogOpen(true);
  };

  // Hàm PUT: Cập nhật thông tin tầng
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFloor) return;

    try {
      const num = parseInt(editFormData.floorNumber.replace(/\D/g, '')) || 0;

      const payload = {
        name: editFormData.name || `Tầng ${num}`,
        floorNumber: num,
        description: editFormData.description
      };

      const response = await fetchApi(`/Floors/${selectedFloor.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success('Đã cập nhật thông tin tầng!');
        setIsEditDialogOpen(false);
        setSelectedFloor(null);
        fetchFloors();
      } else {
        const errorData = await response.json().catch(() => null);
        const errMsg = errorData?.join?.(', ') || 'Cập nhật thất bại!';
        toast.error(errMsg);
      }
    } catch (error) {
      toast.error('Lỗi kết nối đến server!');
    }
  };

  // Hàm DELETE
  const confirmDeleteFloor = async () => {
    if (!floorToDelete) return;
    try {
      const response = await fetchApi(`/Floors/${floorToDelete}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Đã xóa tầng thành công!');
        setIsDeleteDialogOpen(false);
        setFloorToDelete(null);
        fetchFloors();
      } else {
        throw new Error('Xóa thất bại');
      }
    } catch (error) {
      console.error(error);
      toast.error('Không thể xóa tầng này (Có thể liên quan đến ràng buộc dữ liệu hợp đồng).');
    }
  };

  const openDeleteModal = (id: string) => {
    setFloorToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  if (isLoading) {
    return <div className="p-6 text-center text-gray-500">Đang tải dữ liệu từ server...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Quản lý tầng</h1>
        <p className="text-gray-600">Tổng quan và quản lý các tầng trong tòa nhà</p>
      </div>

      {/* Khối Thống kê Tổng quan */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6 p-4 flex justify-between items-center">
        <div className="flex gap-6">
          <div>
            <p className="text-sm text-gray-600">Tổng số tầng</p>
            <p className="text-2xl font-semibold text-blue-600">{apiData?.totalFloors || 0}</p>
          </div>
          <div className="border-l border-gray-200 pl-6">
            <p className="text-sm text-gray-600">Tổng số phòng</p>
            <p className="text-2xl font-semibold">{apiData?.totalRooms || 0}</p>
          </div>
          <div className="border-l border-gray-200 pl-6">
            <p className="text-sm text-gray-600">Doanh thu tháng</p>
            <p className="text-2xl font-semibold text-green-600">
              {(apiData?.monthlyRevenue || 0).toLocaleString('vi-VN')} ₫
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsAddDialogOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Thêm tầng
        </button>
      </div>

      {/* Grid Danh sách Tầng */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {apiData?.floors.map((floor) => {
          const occupancyRate = getOccupancyRate(floor);

          return (
            <div key={floor.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{floor.name}</h3>
                    {/* <p className="text-xs text-gray-400">Mã số số tầng: {floor.floorNumber}</p> */}
                    {floor.description && <p className="text-sm text-gray-500 mt-1">{floor.description}</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenEdit(floor)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openDeleteModal(floor.id)}
                    className="p-2 hover:bg-red-50 text-red-600 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Tỷ lệ lấp đầy ({floor.roomCount} phòng)</span>
                  <span className="font-medium">{occupancyRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${occupancyRate}%` }}
                  />
                </div>
              </div>

              {/* Các khối chi tiết phòng */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <Users className="w-5 h-5 text-green-600 mx-auto mb-1" />
                  <p className="text-2xl font-semibold text-green-600">{floor.occupiedRooms}</p>
                  <p className="text-xs text-gray-600">Đã thuê</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <DoorOpen className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-2xl font-semibold text-blue-600">{floor.emptyRooms}</p>
                  <p className="text-xs text-gray-600">Trống</p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Doanh thu tầng</span>
                  <span className="font-semibold text-green-600">
                    {floor.revenueOnFloor.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dialog Thêm tầng */}
      <Dialog.Root open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md">
            <Dialog.Title className="text-xl font-semibold mb-4">Thêm tầng mới</Dialog.Title>
            <form className="space-y-4" onSubmit={handleAddFloor}>
              <div>
                <label className="block text-sm font-medium mb-1">Số tầng (Index)</label>
                <input
                  type="text"
                  value={addFormData.floorNumber}
                  onChange={(e) => setAddFormData({ ...addFormData, floorNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ví dụ: 5"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tên hiển thị tầng</label>
                <input
                  type="text"
                  value={addFormData.name}
                  onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ví dụ: Lầu 5 (Mặc định: Tầng + Số tầng)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mô tả chi tiết</label>
                <textarea
                  value={addFormData.description}
                  onChange={(e) => setAddFormData({ ...addFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                  placeholder="Thông tin thêm về khu vực tầng..."
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Dialog.Close type="button" className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Hủy
                </Dialog.Close>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Thêm tầng
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Dialog Sửa tầng */}
      <Dialog.Root open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md">
            <Dialog.Title className="text-xl font-semibold mb-4">Sửa thông tin tầng</Dialog.Title>
            <form className="space-y-4" onSubmit={handleSaveEdit}>
              <div>
                <label className="block text-sm font-medium mb-1">Số tầng (Index)</label>
                <input
                  type="text"
                  value={editFormData.floorNumber}
                  onChange={(e) => setEditFormData({ ...editFormData, floorNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tên hiển thị tầng</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mô tả chi tiết</label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Dialog.Close type="button" className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Hủy
                </Dialog.Close>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Dialog Xác nhận xóa */}
      <Dialog.Root open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 animate-fade-in" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-sm shadow-xl border border-gray-200">
            <Dialog.Title className="text-lg font-semibold text-gray-900 mb-2">
              Xác nhận xóa tầng
            </Dialog.Title>

            <p className="text-sm text-gray-500 mb-5">
              Bạn có chắc chắn muốn xóa tầng này khỏi cơ sở dữ liệu? Hành động này không thể hoàn tác.
            </p>

            <div className="flex gap-2">
              <Dialog.Close className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors">
                Hủy
              </Dialog.Close>
              <button
                onClick={confirmDeleteFloor}
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
import { useState } from 'react';
import { Plus, Edit, Trash2, Building2, DoorOpen, Users } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { toast } from 'sonner';

interface Floor {
  id: string;
  floorNumber: number;
  totalRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  maintenanceRooms: number;
  monthlyRevenue: number;
}

const initialFloors: Floor[] = [
  { id: '1', floorNumber: 1, totalRooms: 10, occupiedRooms: 8, vacantRooms: 2, maintenanceRooms: 0, monthlyRevenue: 25000000 },
  { id: '2', floorNumber: 2, totalRooms: 12, occupiedRooms: 10, vacantRooms: 1, maintenanceRooms: 1, monthlyRevenue: 30000000 },
  { id: '3', floorNumber: 3, totalRooms: 12, occupiedRooms: 11, vacantRooms: 1, maintenanceRooms: 0, monthlyRevenue: 33000000 },
  { id: '4', floorNumber: 4, totalRooms: 14, occupiedRooms: 13, vacantRooms: 1, maintenanceRooms: 0, monthlyRevenue: 39000000 },
];

export default function FloorManagement() {
  const [floors, setFloors] = useState<Floor[]>(initialFloors);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null);
  const [editFormData, setEditFormData] = useState({
    floorNumber: 1,
    totalRooms: 10,
  });

  const getOccupancyRate = (floor: Floor) => {
    return Math.round((floor.occupiedRooms / floor.totalRooms) * 100);
  };

  const handleEdit = (floor: Floor) => {
    setSelectedFloor(floor);
    setEditFormData({
      floorNumber: floor.floorNumber,
      totalRooms: floor.totalRooms,
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFloor) {
      setFloors(floors.map(f =>
        f.id === selectedFloor.id
          ? { ...f, ...editFormData }
          : f
      ));
      toast.success('Đã cập nhật thông tin tầng!');
      setIsEditDialogOpen(false);
      setSelectedFloor(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Quản lý tầng</h1>
        <p className="text-gray-600">Tổng quan và quản lý các tầng trong tòa nhà</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 mb-6 p-4 flex justify-between items-center">
        <div className="flex gap-6">
          <div>
            <p className="text-sm text-gray-600">Tổng số tầng</p>
            <p className="text-2xl font-semibold text-blue-600">{floors.length}</p>
          </div>
          <div className="border-l border-gray-200 pl-6">
            <p className="text-sm text-gray-600">Tổng số phòng</p>
            <p className="text-2xl font-semibold">{floors.reduce((sum, f) => sum + f.totalRooms, 0)}</p>
          </div>
          <div className="border-l border-gray-200 pl-6">
            <p className="text-sm text-gray-600">Doanh thu tháng</p>
            <p className="text-2xl font-semibold text-green-600">
              {floors.reduce((sum, f) => sum + f.monthlyRevenue, 0).toLocaleString('vi-VN')} ₫
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {floors.map((floor) => {
          const occupancyRate = getOccupancyRate(floor);

          return (
            <div key={floor.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Tầng {floor.floorNumber}</h3>
                    <p className="text-sm text-gray-600">{floor.totalRooms} phòng</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(floor)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-2 hover:bg-red-50 text-red-600 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Tỷ lệ lấp đầy</span>
                  <span className="font-medium">{occupancyRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${occupancyRate}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <Users className="w-5 h-5 text-green-600 mx-auto mb-1" />
                  <p className="text-2xl font-semibold text-green-600">{floor.occupiedRooms}</p>
                  <p className="text-xs text-gray-600">Đã thuê</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <DoorOpen className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-2xl font-semibold text-blue-600">{floor.vacantRooms}</p>
                  <p className="text-xs text-gray-600">Trống</p>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <Building2 className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                  <p className="text-2xl font-semibold text-orange-600">{floor.maintenanceRooms}</p>
                  <p className="text-xs text-gray-600">Bảo trì</p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Doanh thu/tháng</span>
                  <span className="font-semibold text-green-600">
                    {floor.monthlyRevenue.toLocaleString('vi-VN')} ₫
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
            <form className="space-y-4" onSubmit={(e) => {
              e.preventDefault();
              toast.success('Đã thêm tầng thành công!');
              setIsAddDialogOpen(false);
            }}>
              <div>
                <label className="block text-sm font-medium mb-1">Số tầng</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="5"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Số lượng phòng</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="12"
                  required
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Dialog.Close className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
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
                <label className="block text-sm font-medium mb-1">Số tầng</label>
                <input
                  type="number"
                  value={editFormData.floorNumber}
                  onChange={(e) => setEditFormData({...editFormData, floorNumber: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Số lượng phòng</label>
                <input
                  type="number"
                  value={editFormData.totalRooms}
                  onChange={(e) => setEditFormData({...editFormData, totalRooms: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ Lưu ý: Thay đổi số lượng phòng có thể ảnh hưởng đến dữ liệu hiện tại
                </p>
              </div>
              <div className="flex gap-2 pt-4">
                <Dialog.Close className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
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
    </div>
  );
}

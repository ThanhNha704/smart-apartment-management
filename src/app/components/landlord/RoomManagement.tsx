import { useState } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Users, DoorOpen } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { toast } from 'sonner';

interface Room {
  id: string;
  number: string;
  floor: number;
  status: 'vacant' | 'occupied' | 'maintenance';
  tenant?: string;
  price: number;
  deposit: number;
  area: number;
}

const initialRooms: Room[] = [
  { id: '1', number: 'P101', floor: 1, status: 'occupied', tenant: 'Nguyễn Văn A', price: 2500000, deposit: 5000000, area: 25 },
  { id: '2', number: 'P102', floor: 1, status: 'vacant', price: 2500000, deposit: 5000000, area: 25 },
  { id: '3', number: 'P103', floor: 1, status: 'occupied', tenant: 'Trần Thị B', price: 2800000, deposit: 5600000, area: 30 },
  { id: '4', number: 'P201', floor: 2, status: 'occupied', tenant: 'Lê Văn C', price: 3000000, deposit: 6000000, area: 35 },
  { id: '5', number: 'P202', floor: 2, status: 'maintenance', price: 3000000, deposit: 6000000, area: 35 },
  { id: '6', number: 'P203', floor: 2, status: 'vacant', price: 2800000, deposit: 5600000, area: 30 },
];

export default function RoomManagement() {
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isRentDialogOpen, setIsRentDialogOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [editFormData, setEditFormData] = useState({
    number: '',
    floor: 1,
    area: 25,
    price: 2500000,
    deposit: 5000000,
  });
  const [rentFormData, setRentFormData] = useState({
    tenantName: '',
    tenantPhone: '',
    tenantEmail: '',
    tenantId: '',
    moveInDate: '',
    contractDuration: 12,
  });

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.tenant?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || room.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      vacant: 'bg-green-100 text-green-700',
      occupied: 'bg-blue-100 text-blue-700',
      maintenance: 'bg-orange-100 text-orange-700',
    };
    const labels = {
      vacant: 'Trống',
      occupied: 'Đã thuê',
      maintenance: 'Bảo trì',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const handleEdit = (room: Room) => {
    setSelectedRoom(room);
    setEditFormData({
      number: room.number,
      floor: room.floor,
      area: room.area,
      price: room.price,
      deposit: room.deposit,
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRoom) {
      setRooms(rooms.map(r =>
        r.id === selectedRoom.id
          ? { ...r, ...editFormData }
          : r
      ));
      toast.success('Đã cập nhật thông tin phòng!');
      setIsEditDialogOpen(false);
      setSelectedRoom(null);
    }
  };

  const handleRent = (room: Room) => {
    setSelectedRoom(room);
    setRentFormData({
      tenantName: '',
      tenantPhone: '',
      tenantEmail: '',
      tenantId: '',
      moveInDate: '',
      contractDuration: 12,
    });
    setIsRentDialogOpen(true);
  };

  const handleSaveRent = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRoom) {
      setRooms(rooms.map(r =>
        r.id === selectedRoom.id
          ? { ...r, status: 'occupied' as const, tenant: rentFormData.tenantName }
          : r
      ));
      toast.success('Đã cho thuê phòng thành công!');
      setIsRentDialogOpen(false);
      setSelectedRoom(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Quản lý phòng</h1>
        <p className="text-gray-600">Quản lý thông tin và tình trạng các phòng trọ</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 mb-6 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm phòng, người thuê..."
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
              <option value="vacant">Phòng trống</option>
              <option value="occupied">Đã thuê</option>
              <option value="maintenance">Bảo trì</option>
            </select>
            <button
              onClick={() => setIsAddDialogOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Thêm phòng
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRooms.map((room) => (
          <div key={room.id} className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold mb-1">{room.number}</h3>
                <p className="text-gray-600 text-sm">Tầng {room.floor}</p>
              </div>
              {getStatusBadge(room.status)}
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Diện tích</span>
                <span className="font-medium">{room.area}m²</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Giá thuê</span>
                <span className="font-medium text-blue-600">{room.price.toLocaleString('vi-VN')} ₫</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Đặt cọc</span>
                <span className="font-medium">{room.deposit.toLocaleString('vi-VN')} ₫</span>
              </div>
              {room.tenant && (
                <div className="flex items-center gap-2 text-sm pt-2 border-t border-gray-100">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{room.tenant}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4 border-t border-gray-100">
              <button
                onClick={() => handleEdit(room)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 text-sm"
              >
                <Edit className="w-4 h-4" />
                Sửa
              </button>
              {room.status === 'vacant' ? (
                <button
                  onClick={() => handleRent(room)}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm"
                >
                  <DoorOpen className="w-4 h-4" />
                  Cho thuê
                </button>
              ) : (
                <button className="flex-1 px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center justify-center gap-2 text-sm">
                  <Trash2 className="w-4 h-4" />
                  Xóa
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Dialog Thêm phòng */}
      <Dialog.Root open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md">
            <Dialog.Title className="text-xl font-semibold mb-4">Thêm phòng mới</Dialog.Title>
            <form className="space-y-4" onSubmit={(e) => {
              e.preventDefault();
              toast.success('Đã thêm phòng thành công!');
              setIsAddDialogOpen(false);
            }}>
              <div>
                <label className="block text-sm font-medium mb-1">Số phòng</label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="P301" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tầng</label>
                <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="3" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Diện tích (m²)</label>
                <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="30" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Giá thuê (VNĐ)</label>
                <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="2500000" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tiền đặt cọc (VNĐ)</label>
                <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="5000000" required />
              </div>
              <div className="flex gap-2 pt-4">
                <Dialog.Close className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Hủy</Dialog.Close>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Thêm phòng</button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Dialog Sửa phòng */}
      <Dialog.Root open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md">
            <Dialog.Title className="text-xl font-semibold mb-4">Sửa thông tin phòng</Dialog.Title>
            <form className="space-y-4" onSubmit={handleSaveEdit}>
              <div>
                <label className="block text-sm font-medium mb-1">Số phòng</label>
                <input
                  type="text"
                  value={editFormData.number}
                  onChange={(e) => setEditFormData({...editFormData, number: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tầng</label>
                <input
                  type="number"
                  value={editFormData.floor}
                  onChange={(e) => setEditFormData({...editFormData, floor: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Diện tích (m²)</label>
                <input
                  type="number"
                  value={editFormData.area}
                  onChange={(e) => setEditFormData({...editFormData, area: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Giá thuê (VNĐ)</label>
                <input
                  type="number"
                  value={editFormData.price}
                  onChange={(e) => setEditFormData({...editFormData, price: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tiền đặt cọc (VNĐ)</label>
                <input
                  type="number"
                  value={editFormData.deposit}
                  onChange={(e) => setEditFormData({...editFormData, deposit: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Dialog.Close className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Hủy</Dialog.Close>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Lưu thay đổi</button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Dialog Cho thuê phòng */}
      <Dialog.Root open={isRentDialogOpen} onOpenChange={setIsRentDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-auto">
            <Dialog.Title className="text-xl font-semibold mb-4">
              Cho thuê phòng {selectedRoom?.number}
            </Dialog.Title>
            <form className="space-y-4" onSubmit={handleSaveRent}>
              <div>
                <label className="block text-sm font-medium mb-1">Họ và tên người thuê</label>
                <input
                  type="text"
                  value={rentFormData.tenantName}
                  onChange={(e) => setRentFormData({...rentFormData, tenantName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nguyễn Văn A"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Số điện thoại</label>
                <input
                  type="tel"
                  value={rentFormData.tenantPhone}
                  onChange={(e) => setRentFormData({...rentFormData, tenantPhone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0901234567"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={rentFormData.tenantEmail}
                  onChange={(e) => setRentFormData({...rentFormData, tenantEmail: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="email@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">CMND/CCCD</label>
                <input
                  type="text"
                  value={rentFormData.tenantId}
                  onChange={(e) => setRentFormData({...rentFormData, tenantId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="001234567890"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ngày nhận phòng</label>
                <input
                  type="date"
                  value={rentFormData.moveInDate}
                  onChange={(e) => setRentFormData({...rentFormData, moveInDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Thời hạn hợp đồng (tháng)</label>
                <select
                  value={rentFormData.contractDuration}
                  onChange={(e) => setRentFormData({...rentFormData, contractDuration: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={6}>6 tháng</option>
                  <option value={12}>12 tháng</option>
                  <option value={24}>24 tháng</option>
                </select>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-900 font-medium mb-2">Thông tin thanh toán</p>
                <div className="space-y-1 text-sm text-blue-800">
                  <p>Tiền thuê: {selectedRoom?.price.toLocaleString('vi-VN')} ₫/tháng</p>
                  <p>Tiền cọc: {selectedRoom?.deposit.toLocaleString('vi-VN')} ₫</p>
                  <p className="font-semibold pt-1 border-t border-blue-200">
                    Tổng thanh toán lần đầu: {selectedRoom && (selectedRoom.price + selectedRoom.deposit).toLocaleString('vi-VN')} ₫
                  </p>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Dialog.Close className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Hủy</Dialog.Close>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Xác nhận cho thuê</button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

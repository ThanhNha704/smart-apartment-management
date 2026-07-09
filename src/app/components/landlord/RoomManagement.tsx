import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Users, DoorOpen, Loader2 } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { toast } from 'sonner';
import axios from 'axios';

// Khai báo Base URL của API Backend
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Định nghĩa Enum trạng thái phòng theo chuẩn Swagger Backend
const RoomStatus = {
  Vacant: 0,
  Occupied: 1,
  Maintenance: 2,
} as const;

type RoomStatus = typeof RoomStatus[keyof typeof RoomStatus];

// Interface chuẩn theo Schema mẫu của API /api/Rooms
interface Room {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  roomNumber: string;    
  price: number;
  area: number;
  maxOccupants: number;  
  description: string;   
  roomDeposit: number;   
  floorId: string;       
  status: RoomStatus;    
  tenantName?: string | null; 
}

// Interface của Floor lấy từ API /api/Floors
interface FloorItem {
  id: string;
  floorNumber: number;
  name: string;
  description?: string;
  roomCount: number;
}

// Interface của User/Tenant lấy từ API /api/Users
interface UserItem {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  phone?: string;
  roomNumber?: string;
}

export default function RoomManagement() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [floors, setFloors] = useState<FloorItem[]>([]);
  const [tenants, setTenants] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Trạng thái đóng/mở Dialog
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isRentDialogOpen, setIsRentDialogOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  
  // State quản lý Form phòng (Thêm / Sửa) -> Khớp với DTO /api/Rooms
  const [roomFormData, setRoomFormData] = useState({
    roomNumber: '',
    price: 0,
    area: 0,
    maxOccupants: 2,
    roomDeposit: 0,
    floorId: '',
    description: ''
  });

  // State quản lý Form hợp đồng -> Khớp với POST /api/Contracts
  const [contractFormData, setContractFormData] = useState({
    contractNumber: '',
    tenantName: '',
    startDate: '',
    endDate: '',
    paymentDate: 5, 
    monthlyRent: 0
  });

  // 1. Lấy tất cả dữ liệu cần thiết từ Backend
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch danh sách phòng
      const roomsRes = await axios.get<Room[]>(`${API_BASE_URL}/Rooms`);
      setRooms(roomsRes.data);

      // Fetch danh sách tầng để chọn
      const floorsRes = await axios.get(`${API_BASE_URL}/Floors`);
      setFloors(floorsRes.data.floors || []);

      // Fetch danh sách người dùng (để chọn người thuê hợp lệ)
      const usersRes = await axios.get<UserItem[]>(`${API_BASE_URL}/Users`);
      setTenants(usersRes.data || []);
    } catch (error) {
      console.error("Lỗi lấy dữ liệu từ backend:", error);
      toast.error('Không thể kết nối đến hệ thống backend để tải dữ liệu!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2. Xử lý Thêm phòng mới (POST /api/Rooms)
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomFormData.floorId) {
      toast.error('Vui lòng chọn một tầng cho phòng này!');
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/Rooms`, roomFormData);
      toast.success('Đã thêm phòng mới lên hệ thống backend!');
      setIsAddDialogOpen(false);
      fetchData(); // Tải lại danh sách mới cập nhật từ DB
    } catch (error: any) {
      console.error(error);
      const errMsg = error.response?.data?.join?.(', ') || error.response?.data || 'Lỗi khi thêm phòng mới!';
      toast.error(errMsg);
    }
  };

  // 3. Xử lý Sửa thông tin phòng (PUT /api/Rooms/{id})
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;
    if (!roomFormData.floorId) {
      toast.error('Vui lòng chọn tầng!');
      return;
    }

    try {
      await axios.put(`${API_BASE_URL}/Rooms/${selectedRoom.id}`, {
        ...roomFormData
      });
      toast.success('Đã cập nhật thông tin phòng thành công!');
      setIsEditDialogOpen(false);
      setSelectedRoom(null);
      fetchData(); 
    } catch (error: any) {
      console.error(error);
      const errMsg = error.response?.data?.join?.(', ') || error.response?.data || 'Cập nhật thông tin thất bại!';
      toast.error(errMsg);
    }
  };

  // 4. Xử lý Lập hợp đồng & Cho thuê phòng (POST /api/Contracts)
  const handleSaveRent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;
    if (!contractFormData.tenantName) {
      toast.error('Vui lòng chọn khách hàng thuê!');
      return;
    }

    try {
      // Gọi API tạo hợp đồng thuê phòng
      await axios.post(`${API_BASE_URL}/Contracts`, {
        roomNumber: selectedRoom.roomNumber, // Truyền roomNumber liên kết
        contractNumber: contractFormData.contractNumber,
        tenantName: contractFormData.tenantName,
        startDate: contractFormData.startDate,
        endDate: contractFormData.endDate,
        paymentDate: contractFormData.paymentDate,
        monthlyRent: contractFormData.monthlyRent
      });
      
      toast.success(`Đã kích hoạt hợp đồng ${contractFormData.contractNumber} thành công!`);
      setIsRentDialogOpen(false);
      setSelectedRoom(null);
      fetchData(); // Tải lại để cập nhật trạng thái phòng thành Đã thuê (1) và hiển thị TenantName
    } catch (error: any) {
      console.error(error);
      const errMsg = error.response?.data?.join?.(', ') || error.response?.data || 'Không thể tạo hợp đồng cho thuê!';
      toast.error(errMsg);
    }
  };

  // 5. Xử lý Xóa phòng (DELETE /api/Rooms/{id})
  const handleDeleteRoom = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa phòng này khỏi cơ sở dữ liệu backend?')) {
      try {
        await axios.delete(`${API_BASE_URL}/Rooms/${id}`);
        toast.success('Đã xóa phòng thành công!');
        fetchData();
      } catch (error: any) {
        console.error(error);
        const errMsg = error.response?.data || 'Lỗi khi xóa phòng hoặc phòng đang có ràng buộc hợp đồng!';
        toast.error(errMsg);
      }
    }
  };

  // Mở form Sửa thông tin phòng và gán dữ liệu cũ vào state
  const openEditModal = (room: Room) => {
    setSelectedRoom(room);
    setRoomFormData({
      roomNumber: room.roomNumber,
      price: room.price,
      area: room.area,
      maxOccupants: room.maxOccupants,
      roomDeposit: room.roomDeposit,
      floorId: room.floorId,
      description: room.description || ''
    });
    setIsEditDialogOpen(true);
  };

  // Mở form Lập hợp đồng cho thuê phòng trống
  const openRentModal = (room: Room) => {
    setSelectedRoom(room);
    setContractFormData({
      contractNumber: `HD-${room.roomNumber}-${Date.now().toString().slice(-4)}`,
      tenantName: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      paymentDate: 5,
      monthlyRent: room.price
    });
    setIsRentDialogOpen(true);
  };

  // Logic Tìm kiếm và Lọc trên dữ liệu động lấy về từ Backend
  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (room.tenantName && room.tenantName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterStatus === 'all' || room.status.toString() === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: RoomStatus) => {
    const styles = {
      [RoomStatus.Vacant]: 'bg-green-100 text-green-700',
      [RoomStatus.Occupied]: 'bg-blue-100 text-blue-700',
      [RoomStatus.Maintenance]: 'bg-orange-100 text-orange-700',
    };
    const labels = {
      [RoomStatus.Vacant]: 'Trống',
      [RoomStatus.Occupied]: 'Đã thuê',
      [RoomStatus.Maintenance]: 'Bảo trì',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Quản lý phòng</h1>
        <p className="text-gray-600">Dữ liệu đồng bộ trực tiếp với Backend API</p>
      </div>

      {/* Tìm kiếm và Thêm mới */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm số phòng, tên khách..."
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
              <option value={RoomStatus.Vacant}>Phòng trống</option>
              <option value={RoomStatus.Occupied}>Đã thuê</option>
              <option value={RoomStatus.Maintenance}>Bảo trì</option>
            </select>
            <button
              onClick={() => {
                setRoomFormData({ 
                  roomNumber: '', 
                  price: 2000000, 
                  area: 20, 
                  maxOccupants: 2, 
                  roomDeposit: 2000000, 
                  floorId: floors[0]?.id || '', 
                  description: '' 
                });
                setIsAddDialogOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" /> Thêm phòng
            </button>
          </div>
        </div>
      </div>

      {/* Trạng thái Loading dữ liệu từ API */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-500">Đang tải thông tin từ máy chủ...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRooms.map((room) => (
            <div key={room.id} className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold mb-1">{room.roomNumber}</h3>
                  <p className="text-gray-400 text-xs">
                    Mã tầng: {floors.find(f => f.id === room.floorId)?.name || `Tầng (ID: ${room.floorId})`}
                  </p>
                </div>
                {getStatusBadge(room.status)}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Diện tích / Sức chứa</span>
                  <span className="font-medium">{room.area}m² - Tối đa {room.maxOccupants} người</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Giá thuê</span>
                  <span className="font-medium text-blue-600">{room.price.toLocaleString('vi-VN')} ₫</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Tiền đặt cọc</span>
                  <span className="font-medium">{room.roomDeposit.toLocaleString('vi-VN')} ₫</span>
                </div>
                {room.description && (
                  <p className="text-xs text-gray-500 italic line-clamp-1 border-t pt-1">Ghi chú: {room.description}</p>
                )}
                {room.status === RoomStatus.Occupied && room.tenantName && (
                  <div className="flex items-center gap-2 text-sm pt-2 border-t border-gray-100">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900 font-medium">Khách thuê: {room.tenantName}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => openEditModal(room)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 text-sm"
                >
                  <Edit className="w-4 h-4" /> Sửa
                </button>
                {room.status === RoomStatus.Vacant ? (
                  <button
                    onClick={() => openRentModal(room)}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm"
                  >
                    <DoorOpen className="w-4 h-4" /> Cho thuê
                  </button>
                ) : (
                  <button
                    onClick={() => handleDeleteRoom(room.id)}
                    className="flex-1 px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center justify-center gap-2 text-sm"
                  >
                    <Trash2 className="w-4 h-4" /> Xóa
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog Thêm phòng (POST /api/Rooms) */}
      <Dialog.Root open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 animate-fade-in" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md shadow-xl border border-gray-200">
            <Dialog.Title className="text-xl font-semibold mb-4">Thêm phòng mới</Dialog.Title>
            <form className="space-y-4" onSubmit={handleCreateRoom}>
              <div>
                <label className="block text-sm font-medium mb-1">Số phòng (roomNumber)</label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={roomFormData.roomNumber} onChange={(e) => setRoomFormData({...roomFormData, roomNumber: e.target.value})} placeholder="P101" required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Chọn Tầng</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={roomFormData.floorId}
                    onChange={(e) => setRoomFormData({...roomFormData, floorId: e.target.value})}
                    required
                  >
                    <option value="">-- Chọn tầng --</option>
                    {floors.map(f => (
                      <option key={f.id} value={f.id}>{f.name || `Tầng ${f.floorNumber}`}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Số người tối đa</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={roomFormData.maxOccupants} onChange={(e) => setRoomFormData({...roomFormData, maxOccupants: Number(e.target.value)})} min={1} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Diện tích (m²)</label>
                  <input type="number" step="any" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={roomFormData.area} onChange={(e) => setRoomFormData({...roomFormData, area: Number(e.target.value)})} min={1} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Giá thuê (VNĐ)</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={roomFormData.price} onChange={(e) => setRoomFormData({...roomFormData, price: Number(e.target.value)})} min={1} required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tiền đặt cọc (roomDeposit)</label>
                <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={roomFormData.roomDeposit} onChange={(e) => setRoomFormData({...roomFormData, roomDeposit: Number(e.target.value)})} min={0} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mô tả phòng</label>
                <textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" rows={2} value={roomFormData.description} onChange={(e) => setRoomFormData({...roomFormData, description: e.target.value})} placeholder="Vị trí, trang thiết bị đi kèm..." />
              </div>
              <div className="flex gap-2 pt-2">
                <Dialog.Close className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Hủy</Dialog.Close>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Thêm phòng</button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Dialog Sửa thông tin phòng (PUT /api/Rooms/{id}) */}
      <Dialog.Root open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 animate-fade-in" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md shadow-xl border border-gray-200">
            <Dialog.Title className="text-xl font-semibold mb-4">Sửa thông tin phòng</Dialog.Title>
            <form className="space-y-4" onSubmit={handleSaveEdit}>
              <div>
                <label className="block text-sm font-medium mb-1">Số phòng</label>
                <input type="text" value={roomFormData.roomNumber} onChange={(e) => setRoomFormData({...roomFormData, roomNumber: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Chọn Tầng</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={roomFormData.floorId}
                    onChange={(e) => setRoomFormData({...roomFormData, floorId: e.target.value})}
                    required
                  >
                    <option value="">-- Chọn tầng --</option>
                    {floors.map(f => (
                      <option key={f.id} value={f.id}>{f.name || `Tầng ${f.floorNumber}`}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Số người tối đa</label>
                  <input type="number" value={roomFormData.maxOccupants} onChange={(e) => setRoomFormData({...roomFormData, maxOccupants: Number(e.target.value)})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Diện tích (m²)</label>
                  <input type="number" step="any" value={roomFormData.area} onChange={(e) => setRoomFormData({...roomFormData, area: Number(e.target.value)})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Giá thuê (VNĐ)</label>
                  <input type="number" value={roomFormData.price} onChange={(e) => setRoomFormData({...roomFormData, price: Number(e.target.value)})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tiền đặt cọc (roomDeposit)</label>
                <input type="number" value={roomFormData.roomDeposit} onChange={(e) => setRoomFormData({...roomFormData, roomDeposit: Number(e.target.value)})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mô tả</label>
                <textarea value={roomFormData.description} onChange={(e) => setRoomFormData({...roomFormData, description: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" rows={2} />
              </div>
              <div className="flex gap-2 pt-2">
                <Dialog.Close className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Hủy</Dialog.Close>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Lưu thay đổi</button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Dialog Cho thuê phòng (POST /api/Contracts) */}
      <Dialog.Root open={isRentDialogOpen} onOpenChange={setIsRentDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 animate-fade-in" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md shadow-xl border border-gray-200 max-h-[90vh] overflow-auto">
            <Dialog.Title className="text-xl font-semibold mb-2">
              Lập hợp đồng thuê phòng {selectedRoom?.roomNumber}
            </Dialog.Title>
            <p className="text-xs text-gray-500 mb-4 italic">
              Lưu ý: Bạn cần tạo Người dùng (Khách thuê) trong danh sách Quản lý thành viên trước khi thực hiện lập hợp đồng.
            </p>
            <form className="space-y-4" onSubmit={handleSaveRent}>
              <div>
                <label className="block text-sm font-medium mb-1">Mã số hợp đồng (contractNumber)</label>
                <input type="text" value={contractFormData.contractNumber} onChange={(e) => setContractFormData({...contractFormData, contractNumber: e.target.value})} className="w-full px-3 py-2 border border-gray-300 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Chọn Khách hàng thuê (tenantName)</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={contractFormData.tenantName}
                  onChange={(e) => setContractFormData({...contractFormData, tenantName: e.target.value})}
                  required
                >
                  <option value="">-- Chọn khách thuê --</option>
                  {tenants
                    .filter(t => t.roomNumber === "Chưa có phòng" || !t.roomNumber || t.roomNumber === "")
                    .map(tenant => (
                      <option key={tenant.id} value={tenant.name}>
                        {tenant.name} - {tenant.phoneNumber || tenant.phone || 'Chưa cập nhật SĐT'}
                      </option>
                    ))}
                </select>
                {tenants.filter(t => t.roomNumber === "Chưa có phòng" || !t.roomNumber || t.roomNumber === "").length === 0 && (
                  <p className="text-xs text-red-500 mt-1">Không tìm thấy khách thuê trống (Chưa có phòng) nào trong hệ thống!</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Ngày bắt đầu</label>
                  <input type="date" value={contractFormData.startDate} onChange={(e) => setContractFormData({...contractFormData, startDate: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ngày kết thúc</label>
                  <input type="date" value={contractFormData.endDate} onChange={(e) => setContractFormData({...contractFormData, endDate: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ngày thanh toán định kỳ (hàng tháng)</label>
                <input type="number" min={1} max={31} value={contractFormData.paymentDate} onChange={(e) => setContractFormData({...contractFormData, paymentDate: Number(e.target.value)})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-900 font-medium mb-2">Thông tin tài chính tạm tính</p>
                <div className="space-y-1 text-sm text-blue-800">
                  <p>Tiền thuê phòng: {selectedRoom?.price.toLocaleString('vi-VN')} ₫/tháng</p>
                  <p>Tiền cọc giữ chỗ: {selectedRoom?.roomDeposit.toLocaleString('vi-VN')} ₫</p>
                  <p className="font-semibold pt-1 border-t border-blue-200">
                    Tổng thu lần đầu: {selectedRoom && (selectedRoom.price + selectedRoom.roomDeposit).toLocaleString('vi-VN')} ₫
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Dialog.Close className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Hủy</Dialog.Close>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Xác nhận & Tạo hợp đồng</button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
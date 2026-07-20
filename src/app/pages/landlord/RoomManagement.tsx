import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Users, DoorOpen, Loader2, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { toast } from 'sonner';
import { fetchApi } from '../../api/fetchApi';

// Định nghĩa trạng thái phòng
const RoomStatus = {
  Vacant: 0,
  Occupied: 1,
  Maintenance: 2,
} as const;

type RoomStatus = typeof RoomStatus[keyof typeof RoomStatus];

// Tiêu chí sắp xếp
type SortKey = 'price' | 'roomDeposit' | 'area' | 'floorNumber' | 'maxOccupants' | '';
type SortDirection = 'asc' | 'desc';

// Interface
interface Room {
  id: string;
  createdAt: string;
  updatedAt: string;
  roomNumber: string;
  price: number;
  area: number;
  maxOccupants: number;
  description: string;
  roomDeposit: number;
  floorNumber: number;
  status: RoomStatus;
  statusLabel: string;
  tenantName: string | null;
}

interface FloorItem {
  id: string;
  floorNumber: number;
  name: string;
  description?: string;
  roomCount: number;
}

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

  // --- THÊM STATE CHO SẮP XẾP & PHÂN TRANG ---
  const [sortKey, setSortKey] = useState<SortKey>('');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(6); // Mỗi trang hiển thị 6 phòng

  // Trạng thái đóng/mở Dialog
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isRentDialogOpen, setIsRentDialogOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null);

  // State quản lý Form phòng
  const [roomFormData, setRoomFormData] = useState({
    roomNumber: '',
    price: 0,
    area: 0,
    maxOccupants: 2,
    roomDeposit: 0,
    floorId: '',
    description: ''
  });

  // State quản lý Form hợp đồng
  const [contractFormData, setContractFormData] = useState({
    contractNumber: '',
    tenantName: '',
    startDate: '',
    endDate: '',
    paymentDate: 5,
    price: 0
  });

  // Hàm GET dữ liệu
  const fetchData = async () => {
    try {
      setLoading(true);
      const roomsRes = await fetchApi('/Rooms');
      if (!roomsRes.ok) throw new Error('Không thể tải danh sách phòng');
      const roomsData = await roomsRes.json();
      setRooms(roomsData);

      const floorsRes = await fetchApi('/Floors');
      if (!floorsRes.ok) throw new Error('Không thể tải danh sách tầng');
      const floorsData = await floorsRes.json();
      setFloors(floorsData.floors || []);

      const usersRes = await fetchApi('/Users');
      if (!usersRes.ok) throw new Error('Không thể tải danh sách khách hàng');
      const usersData = await usersRes.json();
      setTenants(usersData || []);
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

  // Reset về trang 1 nếu người dùng tìm kiếm hoặc đổi bộ lọc
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, sortKey, sortDirection]);

  // Hàm POST: Thêm phòng mới
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomFormData.floorId) {
      toast.error('Vui lòng chọn một tầng cho phòng này!');
      return;
    }
    try {
      const response = await fetchApi('/Rooms', {
        method: 'POST',
        body: JSON.stringify(roomFormData),
      });

      if (response.ok) {
        toast.success('Đã thêm phòng mới lên hệ thống!');
        setIsAddDialogOpen(false);
        setRoomFormData({ roomNumber: '', price: 0, area: 0, maxOccupants: 2, roomDeposit: 0, floorId: '', description: '' });
        fetchData();
      } else {
        const errorData = await response.json().catch(() => null);
        const errMsg = errorData?.join?.(', ') || errorData?.message || 'Lỗi khi thêm phòng mới!';
        toast.error(errMsg);
      }
    } catch (error) {
      console.error(error);
      toast.error('Lỗi kết nối đến server!');
    }
  };

  // Hàm PUT: Sửa thông tin phòng
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;
    if (!roomFormData.floorId) {
      toast.error('Vui lòng chọn tầng!');
      return;
    }

    try {
      const response = await fetchApi(`/Rooms/${selectedRoom.id}`, {
        method: 'PUT',
        body: JSON.stringify(roomFormData),
      });

      if (response.ok) {
        toast.success('Đã cập nhật thông tin phòng thành công!');
        setIsEditDialogOpen(false);
        setSelectedRoom(null);
        fetchData();
      } else {
        const errorData = await response.json().catch(() => null);
        const errMsg = errorData?.join?.(', ') || errorData?.message || 'Cập nhật thông tin thất bại!';
        toast.error(errMsg);
      }
    } catch (error) {
      console.error(error);
      toast.error('Lỗi kết nối đến server!');
    }
  };

  // Hàm POST: Kích hoạt hợp đồng
  const handleSaveRent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;
    if (!contractFormData.tenantName) {
      toast.error('Vui lòng chọn khách hàng thuê!');
      return;
    }

    try {
      const response = await fetchApi('/Contracts', {
        method: 'POST',
        body: JSON.stringify({
          roomNumber: selectedRoom.roomNumber,
          contractNumber: contractFormData.contractNumber,
          tenantName: contractFormData.tenantName,
          startDate: contractFormData.startDate,
          endDate: contractFormData.endDate,
          paymentDate: contractFormData.paymentDate,
          price: contractFormData.price
        }),
      });

      if (response.ok) {
        toast.success(`Đã kích hoạt hợp đồng ${contractFormData.contractNumber} thành công!`);
        setIsRentDialogOpen(false);
        setSelectedRoom(null);
        fetchData();
      } else {
        const errorData = await response.json().catch(() => null);
        const errMsg = errorData?.join?.(', ') || errorData?.message || 'Không thể tạo hợp đồng cho thuê!';
        toast.error(errMsg);
      }
    } catch (error) {
      console.error(error);
      toast.error('Lỗi kết nối đến server!');
    }
  };

  // Hàm DELETE: Xóa phòng
  const confirmDeleteRoom = async () => {
    if (!roomToDelete) return;
    try {
      const response = await fetchApi(`/Rooms/${roomToDelete}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Đã xóa phòng thành công!');
        setIsDeleteDialogOpen(false);
        setRoomToDelete(null);
        fetchData();
      } else {
        throw new Error('Xóa thất bại');
      }
    } catch (error) {
      console.error(error);
      toast.error('Không thể xóa phòng này (Có thể liên quan đến ràng buộc dữ liệu hợp đồng).');
    }
  };

  const openDeleteModal = (id: string) => {
    setRoomToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const openEditModal = (room: Room) => {
    setSelectedRoom(room);
    const matchedFloor = floors.find(f => f.floorNumber === room.floorNumber);
    setRoomFormData({
      roomNumber: room.roomNumber,
      price: room.price,
      area: room.area,
      maxOccupants: room.maxOccupants,
      roomDeposit: room.roomDeposit,
      floorId: matchedFloor?.id || '',
      description: room.description || ''
    });
    setIsEditDialogOpen(true);
  };

  const openRentModal = (room: Room) => {
    setSelectedRoom(room);
    setContractFormData({
      contractNumber: `HD-${room.roomNumber}-${Date.now().toString().slice(-4)}`,
      tenantName: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      paymentDate: 5,
      price: room.price
    });
    setIsRentDialogOpen(true);
  };

  // --- XỬ LÝ LỌC & SẮP XẾP DỮ LIỆU ---
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const processedRooms = rooms
    .filter(room => {
      const matchesSearch = room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (room.tenantName && room.tenantName.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesFilter = filterStatus === 'all' || room.status.toString() === filterStatus;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (!sortKey) return 0;
      const valA = a[sortKey];
      const valB = b[sortKey];

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  // --- LOGIC PHÂN TRANG ---
  const totalItems = processedRooms.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRooms = processedRooms.slice(startIndex, startIndex + itemsPerPage);

  const getStatusBadge = (status: RoomStatus, label?: string) => {
    const styles = {
      [RoomStatus.Vacant]: 'bg-green-100 text-green-700',
      [RoomStatus.Occupied]: 'bg-blue-100 text-blue-700',
      [RoomStatus.Maintenance]: 'bg-orange-100 text-orange-700',
    };

    const defaultLabels = {
      [RoomStatus.Vacant]: 'Trống',
      [RoomStatus.Occupied]: 'Đã thuê',
      [RoomStatus.Maintenance]: 'Bảo trì',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status]}`}>
        {label || defaultLabels[status]}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Quản lý phòng</h1>
        <p className="text-gray-600">Quản lí phòng ở tòa nhà của bạn</p>
      </div>

      {/* Bộ lọc, Tìm kiếm & Sắp xếp */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6 p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm số phòng, tên khách..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black text-sm bg-white"
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Thêm phòng
            </button>
          </div>
        </div>

        {/* --- THANH CHỨC NĂNG SẮP XẾP TÍNH HỢP --- */}
        <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center gap-2 text-sm text-gray-600">
          <span className="font-medium mr-2">Sắp xếp theo:</span>
          {[
            { key: 'price', label: 'Giá thuê' },
            { key: 'roomDeposit', label: 'Tiền cọc' },
            { key: 'area', label: 'Diện tích' },
            { key: 'floorNumber', label: 'Số tầng' },
            { key: 'maxOccupants', label: 'Sức chứa' },
          ].map((item) => {
            const isActive = sortKey === item.key;
            return (
              <button
                key={item.key}
                onClick={() => handleSort(item.key as SortKey)}
                className={`px-3 py-1.5 rounded-md border flex items-center gap-1.5 transition-colors ${isActive
                    ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium'
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700'
                  }`}
              >
                {item.label}
                {isActive ? (
                  sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                ) : (
                  <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                )}
              </button>
            );
          })}
          {sortKey && (
            <button
              onClick={() => setSortKey('')}
              className="text-xs text-red-500 hover:underline ml-auto"
            >
              Xóa bộ xếp
            </button>
          )}
        </div>
      </div>

      {/* Trạng thái Loading */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-500">Đang tải thông tin từ máy chủ...</p>
        </div>
      ) : (
        <>
          {/* Danh sách phòng đã phân trang */}
          {paginatedRooms.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-500 text-sm">Không tìm thấy phòng phù hợp với tiêu chí lọc.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedRooms.map((room) => (
                <div key={room.id} className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-lg transition-shadow flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold mb-1">{room.roomNumber}</h3>
                        <p className="text-gray-400 text-xs">
                          {floors.find(f => f.floorNumber === room.floorNumber)?.name || `Tầng ${room.floorNumber}`}
                        </p>
                      </div>
                      {getStatusBadge(room.status, room.statusLabel)}
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
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-2 mb-4 min-h-[56px] flex flex-col justify-center">
                    {room.description ? (
                      <p className="text-xs text-gray-500 italic line-clamp-1 mb-1">Ghi chú: {room.description}</p>
                    ) : null}

                    {room.status === RoomStatus.Occupied && room.tenantName ? (
                      <div className="flex items-center gap-2 text-sm pt-1">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900 font-medium line-clamp-1">Khách thuê: {room.tenantName}</span>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-gray-100 mt-auto">
                    {room.status === RoomStatus.Vacant ? (
                      <>
                        <button
                          onClick={() => openRentModal(room)}
                          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm font-medium"
                        >
                          <DoorOpen className="w-4 h-4" /> Cho thuê
                        </button>
                        <button
                          onClick={() => openEditModal(room)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 text-sm font-medium"
                        >
                          <Edit className="w-4 h-4" /> Sửa
                        </button>
                        <button
                          onClick={() => openDeleteModal(room.id)}
                          className="flex-1 px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center justify-center gap-2 text-sm font-medium"
                        >
                          <Trash2 className="w-4 h-4" /> Xóa
                        </button>
                      </>
                    ) : (
                      // Khi phòng đã được thuê: Không hiển thị nút bấm nào cả, chỉ hiện trạng thái text mờ
                      <div className="flex-1 text-center py-2 text-sm font-medium text-gray-400 bg-gray-50 rounded-lg select-none">
                        Phòng đang được thuê
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* --- GIAO DIỆN PHÂN TRANG (PAGINATION) --- */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-sm text-gray-600">
                Hiển thị từ <span className="font-medium">{startIndex + 1}</span> đến{' '}
                <span className="font-medium">{Math.min(startIndex + itemsPerPage, totalItems)}</span> trong tổng số{' '}
                <span className="font-medium">{totalItems}</span> phòng
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-transparent"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3.5 py-1.5 rounded-lg text-sm font-medium border ${currentPage === page
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-700'
                      }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-transparent"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Dialog Thêm phòng */}
      <Dialog.Root open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 animate-fade-in" />
          <Dialog.Content aria-describedby={undefined} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md shadow-xl border border-gray-200">
            <Dialog.Title className="text-xl font-semibold mb-4">Thêm phòng mới</Dialog.Title>
            <form className="space-y-4" onSubmit={handleCreateRoom}>
              <div>
                <label className="block text-sm font-medium mb-1">Số phòng</label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black" value={roomFormData.roomNumber} onChange={(e) => setRoomFormData({ ...roomFormData, roomNumber: e.target.value })} placeholder="P101" required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Chọn Tầng</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-black"
                    value={roomFormData.floorId}
                    onChange={(e) => setRoomFormData({ ...roomFormData, floorId: e.target.value })}
                    required
                  >
                    <option value="">-- Chọn tầng --</option>
                    {floors.map(f => (
                      <option key={f.id} value={f.id}>{`Tầng ${f.floorNumber}`}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Số người tối đa</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black" value={roomFormData.maxOccupants} onChange={(e) => setRoomFormData({ ...roomFormData, maxOccupants: Number(e.target.value) })} min={1} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Diện tích (m²)</label>
                  <input type="number" step="any" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black" value={roomFormData.area} onChange={(e) => setRoomFormData({ ...roomFormData, area: Number(e.target.value) })} min={1} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Giá thuê (VNĐ)</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black" value={roomFormData.price} onChange={(e) => setRoomFormData({ ...roomFormData, price: Number(e.target.value) })} min={1} required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tiền đặt cọc</label>
                <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black" value={roomFormData.roomDeposit} onChange={(e) => setRoomFormData({ ...roomFormData, roomDeposit: Number(e.target.value) })} min={0} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mô tả phòng</label>
                <textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black" rows={2} value={roomFormData.description} onChange={(e) => setRoomFormData({ ...roomFormData, description: e.target.value })} placeholder="Vị trí, trang thiết bị đi kèm..." />
              </div>
              <div className="flex gap-2 pt-2">
                <Dialog.Close className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Hủy</Dialog.Close>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Thêm phòng</button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Dialog Sửa thông tin phòng */}
      <Dialog.Root open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 animate-fade-in" />
          <Dialog.Content aria-describedby={undefined} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md shadow-xl border border-gray-200">
            <Dialog.Title className="text-xl font-semibold mb-4">Sửa thông tin phòng</Dialog.Title>
            <form className="space-y-4" onSubmit={handleSaveEdit}>
              <div>
                <label className="block text-sm font-medium mb-1">Số phòng</label>
                <input type="text" value={roomFormData.roomNumber} onChange={(e) => setRoomFormData({ ...roomFormData, roomNumber: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black" required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Chọn Tầng</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-black"
                    value={roomFormData.floorId}
                    onChange={(e) => setRoomFormData({ ...roomFormData, floorId: e.target.value })}
                    required
                  >
                    <option value="">-- Chọn tầng --</option>
                    {floors.map(f => (
                      <option key={f.id} value={f.id}>{`Tầng ${f.floorNumber}`}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Số người tối đa</label>
                  <input type="number" value={roomFormData.maxOccupants} onChange={(e) => setRoomFormData({ ...roomFormData, maxOccupants: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Diện tích (m²)</label>
                  <input type="number" step="any" value={roomFormData.area} onChange={(e) => setRoomFormData({ ...roomFormData, area: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Giá thuê (VNĐ)</label>
                  <input type="number" value={roomFormData.price} onChange={(e) => setRoomFormData({ ...roomFormData, price: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tiền đặt cọc</label>
                <input type="number" value={roomFormData.roomDeposit} onChange={(e) => setRoomFormData({ ...roomFormData, roomDeposit: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mô tả</label>
                <textarea value={roomFormData.description} onChange={(e) => setRoomFormData({ ...roomFormData, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black" rows={2} />
              </div>
              <div className="flex gap-2 pt-2">
                <Dialog.Close className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Hủy</Dialog.Close>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Lưu thay đổi</button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Dialog Cho thuê phòng */}
      <Dialog.Root open={isRentDialogOpen} onOpenChange={setIsRentDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 animate-fade-in" />
          <Dialog.Content aria-describedby={undefined} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md shadow-xl border border-gray-200 max-h-[90vh] overflow-auto">
            <Dialog.Title className="text-xl font-semibold mb-2">
              Lập hợp đồng thuê phòng {selectedRoom?.roomNumber}
            </Dialog.Title>
            <p className="text-xs text-gray-500 mb-4 italic">
              Lưu ý: Bạn cần tạo Người dùng (Khách thuê) trong danh sách Quản lý thành viên trước khi thực hiện lập hợp đồng.
            </p>
            <form className="space-y-4" onSubmit={handleSaveRent}>
              <div>
                <label className="block text-sm font-medium mb-1">Mã số hợp đồng</label>
                <input type="text" value={contractFormData.contractNumber} onChange={(e) => setContractFormData({ ...contractFormData, contractNumber: e.target.value })} className="w-full px-3 py-2 border border-gray-300 bg-gray-50 rounded-lg focus:outline-none focus:ring-1 focus:ring-black" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Chọn Khách hàng thuê</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-black"
                  value={contractFormData.tenantName}
                  onChange={(e) => setContractFormData({ ...contractFormData, tenantName: e.target.value })}
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
                  <input type="date" value={contractFormData.startDate} onChange={(e) => setContractFormData({ ...contractFormData, startDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ngày kết thúc</label>
                  <input type="date" value={contractFormData.endDate} onChange={(e) => setContractFormData({ ...contractFormData, endDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ngày thanh toán định kỳ (hàng tháng)</label>
                <input type="number" min={1} max={31} value={contractFormData.paymentDate} onChange={(e) => setContractFormData({ ...contractFormData, paymentDate: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tiền thanh toán định kỳ (hàng tháng)</label>
                <input
                  type="number"
                  min={1000}
                  value={contractFormData.price}
                  onChange={(e) => setContractFormData({ ...contractFormData, price: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                  required
                />
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

      {/* Dialog Xác nhận xóa phòng */}
      <Dialog.Root open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 animate-fade-in" />
          <Dialog.Content aria-describedby={undefined} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-sm shadow-xl border border-gray-200">
            <Dialog.Title className="text-lg font-semibold text-gray-900 mb-2">
              Xác nhận xóa phòng
            </Dialog.Title>

            <p className="text-sm text-gray-500 mb-5">
              Bạn có chắc chắn muốn xóa tài khoản phòng này khỏi cơ sở dữ liệu? Hành động này không thể hoàn tác.
            </p>

            <div className="flex gap-2">
              <Dialog.Close className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors">
                Hủy
              </Dialog.Close>
              <button
                onClick={confirmDeleteRoom}
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
import { useState, useEffect, useMemo } from 'react';
import { Search, CheckCircle, Clock, Wrench, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { toast } from 'sonner';
import { fetchApi } from '../../api/fetchApi';

// INTERFACES
interface MaintenanceItem {
  id: string;
  requestNumber: string;
  roomNumber: string;
  tenantName: string;
  title: string;
  description: string;
  priority: number;
  priorityLabel: string;
  status: number;
  statusLabel: string;
  createdAt: string;
}

interface ApiResponse {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  items: MaintenanceItem[];
}

type SortKey = 'priority-desc' | 'date-desc' | 'date-asc' | 'room-asc';

export default function MaintenanceRequests() {
  const [apiData, setApiData] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortKey>('priority-desc'); // Mặc định: Ưu tiên cao nhất lên đầu
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceItem | null>(null);

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Hàm GET: Lấy dữ liệu 
  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const response = await fetchApi('/MaintenanceRequests');

      if (!response.ok) throw new Error('Không thể tải dữ liệu');

      const data: ApiResponse = await response.json();
      setApiData(data);
    } catch (error) {
      toast.error('Lỗi khi tải lịch sử sửa chữa từ server!');
      console.error('Lỗi tải lịch sử sửa chữa:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Reset về trang 1 khi thay đổi bất kỳ bộ lọc hoặc kiểu sắp xếp nào
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterPriority, sortBy]);

  // Hàm PUT: Bắt đầu xử lý
  const handleStartProcess = async (id: string) => {
    try {
      const response = await fetchApi(`/MaintenanceRequests/${id}/start`, {
        method: 'PUT',
      });

      if (response.ok) {
        toast.success('Đã chuyển trạng thái sang Đang xử lý!');
        setSelectedRequest(null);
        fetchRequests();
      } else {
        throw new Error('Cập nhật thất bại');
      }
    } catch (error) {
      console.error(error);
      toast.error('Lỗi khi cập nhật trạng thái xử lý!');
    }
  };

  // Hàm PUT: Hoàn thành xử lý
  const handleCompleteProcess = async (id: string) => {
    try {
      const response = await fetchApi(`/MaintenanceRequests/${id}/complete`, {
        method: 'PUT',
      });

      if (response.ok) {
        toast.success('Đã hoàn thành xử lý yêu cầu!');
        setSelectedRequest(null);
        fetchRequests();
      } else {
        throw new Error('Cập nhật thất bại');
      }
    } catch (error) {
      console.error(error);
      toast.error('Lỗi khi hoàn thành yêu cầu sửa chữa!');
    }
  };

  // XỬ LÝ LỌC VÀ SẮP XẾP DỮ LIỆU
  const processedRequests = useMemo(() => {
    const items = apiData?.items || [];
    
    // 1. Lọc dữ liệu
    const filtered = items.filter(request => {
      const matchesSearch = (request.requestNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (request.tenantName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (request.roomNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (request.title || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter = filterStatus === 'all' || String(request.status) === filterStatus;
      const matchesPriority = filterPriority === 'all' || String(request.priority) === filterPriority;

      return matchesSearch && matchesFilter && matchesPriority;
    });

    // 2. Sắp xếp dữ liệu
    return filtered.sort((a, b) => {
      if (sortBy === 'priority-desc') {
        return (b.priority - a.priority) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'date-desc') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'date-asc') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'room-asc') {
        return a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true });
      }
      return 0;
    });
  }, [apiData, searchTerm, filterStatus, filterPriority, sortBy]);

  // TÍNH TOÁN DỮ LIỆU PHÂN TRANG
  const totalItems = processedRequests.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRequests = processedRequests.slice(indexOfFirstItem, indexOfLastItem);

  const getStatusBadge = (status: number, label: string) => {
    const configs = {
      0: { icon: Clock, className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
      1: { icon: Wrench, className: 'bg-blue-100 text-blue-700 border-blue-200' },
      2: { icon: CheckCircle, className: 'bg-green-100 text-green-700 border-green-200' },
    };
    const config = configs[status as keyof typeof configs] || { icon: Clock, className: 'bg-gray-100 text-gray-700 border-gray-200' };
    const Icon = config.icon;
    return (
      <span className={`flex items-center gap-1 px-2.5 py-0.5 border rounded-full text-xs font-medium ${config.className}`}>
        <Icon className="w-3.5 h-3.5" />
        {label || 'Chờ xử lý'}
      </span>
    );
  };

  const getPriorityBadge = (priority: number, label: string) => {
    const configs = {
      0: { className: 'bg-gray-100 text-gray-700 border-gray-200' }, 
      1: { className: 'bg-blue-100 text-blue-700 border-blue-200' }, 
      2: { className: 'bg-orange-100 text-orange-700 border-orange-200' }, 
      3: { className: 'bg-red-100 text-red-700 border-red-200' }, 
    };
    const config = configs[priority as keyof typeof configs] || { className: 'bg-gray-100 text-gray-700 border-gray-200' };
    return (
      <span className={`px-2 py-0.5 border rounded text-xs font-semibold ${config.className}`}>
        {label || 'Bình thường'}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Yêu cầu sửa chữa</h1>
        <p className="text-gray-600 text-sm">Xử lý các yêu cầu sửa chữa cơ sở vật chất thời gian thực</p>
      </div>

      {/* Khối thống kê */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-gray-500 text-xs font-medium mb-1">Tổng yêu cầu</p>
          <p className="text-2xl font-semibold">{apiData?.total || 0}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 shadow-sm">
          <p className="text-yellow-700 text-xs font-medium mb-1">Chờ xử lý</p>
          <p className="text-2xl font-semibold text-yellow-700">{apiData?.pending || 0}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 shadow-sm">
          <p className="text-blue-700 text-xs font-medium mb-1">Đang xử lý</p>
          <p className="text-2xl font-semibold text-blue-700">{apiData?.inProgress || 0}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-xl border border-green-200 shadow-sm">
          <p className="text-green-700 text-xs font-medium mb-1">Hoàn thành</p>
          <p className="text-2xl font-semibold text-green-700">{apiData?.completed || 0}</p>
        </div>
      </div>

      {/* Tìm kiếm & Bộ lọc */}
      <div className="bg-white rounded-xl border border-gray-200 mb-6 p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm yêu cầu, phòng, người thuê..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Bộ lọc trạng thái */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black bg-white"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="0">Chờ xử lý</option>
              <option value="1">Đang xử lý</option>
              <option value="2">Hoàn thành</option>
            </select>

            {/* Bộ lọc độ ưu tiên */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black bg-white"
            >
              <option value="all">Tất cả độ ưu tiên</option>
              <option value="0">Thấp</option>
              <option value="1">Trung bình</option>
              <option value="2">Cao</option>
              <option value="3">Khẩn cấp</option>
            </select>

            {/* Tiêu chí sắp xếp */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black bg-white font-medium text-gray-700"
            >
              <option value="priority-desc">Ưu tiên cao trước</option>
              <option value="date-desc">Mới nhất trước</option>
              <option value="date-asc">Cũ nhất trước</option>
              <option value="room-asc">Phòng tăng dần</option>
            </select>
          </div>
        </div>
      </div>

      {/* Danh sách yêu cầu hiển thị dạng thẻ */}
      <div className="space-y-4 mb-6">
        {isLoading ? (
          <div className="p-16 text-center text-sm text-gray-500 bg-white rounded-xl border border-gray-200 shadow-sm">
            Đang đồng bộ dữ liệu sửa chữa...
          </div>
        ) : currentRequests.length === 0 ? (
          <div className="p-16 text-center text-sm text-gray-500 bg-white rounded-xl border border-gray-200 shadow-sm">
            Không có yêu cầu nào trùng khớp với tiêu chí tìm kiếm.
          </div>
        ) : (
          currentRequests.map((request) => (
            <div key={request.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <h3 className="font-semibold text-gray-900">{request.requestNumber || `ID: ${request.id.slice(0, 8)}`}</h3>
                    {getPriorityBadge(request.priority, request.priorityLabel)}
                    {getStatusBadge(request.status, request.statusLabel)}
                  </div>
                  <p className="text-gray-600 text-sm">Phòng: <strong>{request.roomNumber}</strong> — Người thuê: {request.tenantName}</p>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap self-start sm:self-center bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
                  {request.createdAt ? new Date(request.createdAt).toLocaleString('vi-VN') : '---'}
                </span>
              </div>

              <div className="mb-4 bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm text-gray-900">{request.title}</p>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed line-clamp-2">{request.description}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedRequest(request)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-xs font-medium transition-colors"
                >
                  Xem chi tiết
                </button>
                {request.status === 0 && (
                  <button
                    onClick={() => handleStartProcess(request.id)}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium transition-colors"
                  >
                    Bắt đầu xử lý
                  </button>
                )}
                {request.status === 1 && (
                  <button
                    onClick={() => handleCompleteProcess(request.id)}
                    className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium transition-colors"
                  >
                    Hoàn thành
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* THANH ĐIỀU HƯỚNG PHÂN TRANG */}
      {!isLoading && totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-gray-200 gap-4 bg-white px-4 py-3 rounded-xl shadow-sm border">
          <p className="text-xs text-gray-500">
            Hiển thị <span className="font-medium">{indexOfFirstItem + 1}</span> -{' '}
            <span className="font-medium">{Math.min(indexOfLastItem, totalItems)}</span> trên tổng số{' '}
            <span className="font-medium">{totalItems}</span> yêu cầu
          </p>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    currentPage === page
                      ? 'bg-blue-600 text-white shadow-sm font-semibold'
                      : 'border border-gray-300 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      )}

      {/* Modal Chi tiết yêu cầu */}
      <Dialog.Root open={selectedRequest !== null} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-fade-in" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-auto z-50 shadow-xl border border-gray-100">
            {selectedRequest && (
              <>
                <Dialog.Title className="text-lg font-semibold mb-4 text-gray-900 border-b border-gray-100 pb-2">
                  Chi tiết yêu cầu sửa chữa
                </Dialog.Title>
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Mã yêu cầu</p>
                      <p className="font-semibold text-gray-900">{selectedRequest.requestNumber || selectedRequest.id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Trạng thái hiện tại</p>
                      <div className="mt-0.5 w-fit">{getStatusBadge(selectedRequest.status, selectedRequest.statusLabel)}</div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Số phòng</p>
                      <p className="font-semibold text-gray-900">{selectedRequest.roomNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Khách báo sự cố</p>
                      <p className="font-semibold text-gray-900">{selectedRequest.tenantName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Mức độ ưu tiên</p>
                      <div className="mt-0.5 w-fit">{getPriorityBadge(selectedRequest.priority, selectedRequest.priorityLabel)}</div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Thời gian tiếp nhận</p>
                      <p className="font-medium text-gray-800">{new Date(selectedRequest.createdAt).toLocaleString('vi-VN')}</p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <p className="text-xs text-gray-500 mb-1">Tiêu đề sự cố</p>
                    <p className="font-semibold text-gray-900 text-base">{selectedRequest.title}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-1">Nội dung mô tả sự cố từ khách thuê</p>
                    <p className="text-gray-700 bg-gray-50/50 p-3 rounded-lg border border-gray-200 leading-relaxed whitespace-pre-wrap">{selectedRequest.description}</p>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-gray-100 mt-6">
                    <Dialog.Close className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-center text-xs font-medium transition-colors">
                      Đóng
                    </Dialog.Close>
                    {selectedRequest.status === 0 && (
                      <button
                        onClick={() => handleStartProcess(selectedRequest.id)}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium transition-colors"
                      >
                        Bắt đầu xử lý
                      </button>
                    )}
                    {selectedRequest.status === 1 && (
                      <button
                        onClick={() => handleCompleteProcess(selectedRequest.id)}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium transition-colors"
                      >
                        Hoàn thành nhiệm vụ
                      </button>
                    )}
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
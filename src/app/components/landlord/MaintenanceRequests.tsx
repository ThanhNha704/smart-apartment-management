import { useState, useEffect } from 'react';
import { Search, CheckCircle, Clock, Wrench, AlertCircle } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { toast } from 'sonner';
import { fetchApi } from '../../utils/api';

// INTERFACES DỮ LIỆU ĐÃ CHUẨN BACKEND
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

export default function MaintenanceRequests() {
  const [apiData, setApiData] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceItem | null>(null);

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

  // Hàm PUT: Gọi API /MaintenanceRequests/{id}/start để bắt đầu xử lý
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

  // Hàm PUT: Gọi API /MaintenanceRequests/{id}/complete để hoàn thành xử lý
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

  // Lọc dữ liệu chuẩn xác từ mảng items bên trong apiData
  const items = apiData?.items || [];
  const filteredRequests = items.filter(request => {
    const matchesSearch = (request.requestNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (request.tenantName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (request.roomNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (request.title || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || String(request.status) === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: number, label: string) => {
    const configs = {
      0: { icon: Clock, className: 'bg-yellow-100 text-yellow-700' }, // Chờ xử lý / Pending
      1: { icon: Wrench, className: 'bg-blue-100 text-blue-700' }, // Đang xử lý / In Progress
      2: { icon: CheckCircle, className: 'bg-green-100 text-green-700' }, // Hoàn thành / Completed
    };
    const config = configs[status as keyof typeof configs] || { icon: Clock, className: 'bg-gray-100 text-gray-700' };
    const Icon = config.icon;
    return (
      <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.className}`}>
        <Icon className="w-4 h-4" />
        {label || 'Chờ xử lý'}
      </span>
    );
  };

  const getPriorityBadge = (priority: number, label: string) => {
    const configs = {
      0: { className: 'bg-gray-100 text-gray-700' }, // Thấp
      1: { className: 'bg-blue-100 text-blue-700' }, // Trung bình
      2: { className: 'bg-orange-100 text-orange-700' }, // Cao
      3: { className: 'bg-red-100 text-red-700' }, // Khẩn cấp
    };
    const config = configs[priority as keyof typeof configs] || { className: 'bg-gray-100 text-gray-700' };
    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${config.className}`}>
        {label || 'Bình thường'}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Yêu cầu sửa chữa</h1>
        <p className="text-gray-600">Xử lý các yêu cầu sửa chữa cơ sở vật chất thời gian thực</p>
      </div>

      {/* Khối thống kê Counter tự động đồng bộ từ API */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm mb-1">Tổng yêu cầu</p>
          <p className="text-2xl font-semibold">{apiData?.total || 0}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <p className="text-yellow-700 text-sm mb-1">Chờ xử lý</p>
          <p className="text-2xl font-semibold text-yellow-700">{apiData?.pending || 0}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-blue-700 text-sm mb-1">Đang xử lý</p>
          <p className="text-2xl font-semibold text-blue-700">{apiData?.inProgress || 0}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <p className="text-green-700 text-sm mb-1">Hoàn thành</p>
          <p className="text-2xl font-semibold text-green-700">{apiData?.completed || 0}</p>
        </div>
      </div>

      {/* Tìm kiếm & Bộ lọc */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm yêu cầu, phòng, người thuê..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="0">Chờ xử lý</option>
            <option value="1">Đang xử lý</option>
            <option value="2">Hoàn thành</option>
          </select>
        </div>
      </div>

      {/* Danh sách yêu cầu hiển thị dạng thẻ */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-10 text-center text-gray-500">Đang đồng bộ dữ liệu sửa chữa...</div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-10 text-center text-gray-500 bg-white rounded-lg border border-gray-200">
            Không có yêu cầu nào trùng khớp.
          </div>
        ) : (
          filteredRequests.map((request) => (
            <div key={request.id} className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{request.requestNumber || `Mã ID: ${request.id}`}</h3>
                    {getPriorityBadge(request.priority, request.priorityLabel)}
                    {getStatusBadge(request.status, request.statusLabel)}
                  </div>
                  <p className="text-gray-600 text-sm mb-1">Phòng: {request.roomNumber} - Người thuê: {request.tenantName}</p>
                  <p className="text-sm text-gray-500">
                    {request.createdAt ? new Date(request.createdAt).toLocaleString('vi-VN') : '---'}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-start gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">{request.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{request.description}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedRequest(request)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                >
                  Xem chi tiết
                </button>
                {request.status === 0 && (
                  <button
                    onClick={() => handleStartProcess(request.id)}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Bắt đầu xử lý
                  </button>
                )}
                {request.status === 1 && (
                  <button
                    onClick={() => handleCompleteProcess(request.id)}
                    className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                  >
                    Hoàn thành
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Popup Chi tiết yêu cầu */}
      <Dialog.Root open={selectedRequest !== null} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-auto z-50">
            {selectedRequest && (
              <>
                <Dialog.Title className="text-xl font-semibold mb-4">Chi tiết yêu cầu hệ thống</Dialog.Title>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Mã yêu cầu</p>
                      <p className="font-medium">{selectedRequest.requestNumber || selectedRequest.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Trạng thái</p>
                      <div className="mt-1">{getStatusBadge(selectedRequest.status, selectedRequest.statusLabel)}</div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phòng kỹ thuật</p>
                      <p className="font-medium">{selectedRequest.roomNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Người khai báo</p>
                      <p className="font-medium">{selectedRequest.tenantName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Độ ưu tiên</p>
                      <div className="mt-1">{getPriorityBadge(selectedRequest.priority, selectedRequest.priorityLabel)}</div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Thời gian ghi nhận</p>
                      <p className="font-medium">{new Date(selectedRequest.createdAt).toLocaleString('vi-VN')}</p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-3">
                    <p className="text-sm text-gray-600 mb-1">Tiêu đề sự cố</p>
                    <p className="font-medium">{selectedRequest.title}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Mô tả chi tiết nội dung</p>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">{selectedRequest.description}</p>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <Dialog.Close className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-center">
                      Đóng cửa sổ
                    </Dialog.Close>
                    {selectedRequest.status === 0 && (
                      <button
                        onClick={() => handleStartProcess(selectedRequest.id)}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Bắt đầu xử lý
                      </button>
                    )}
                    {selectedRequest.status === 1 && (
                      <button
                        onClick={() => handleCompleteProcess(selectedRequest.id)}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
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
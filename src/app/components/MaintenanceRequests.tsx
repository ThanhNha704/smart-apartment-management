import { useState } from 'react';
import { Search, CheckCircle, Clock, XCircle, Wrench, AlertCircle } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { toast } from 'sonner';

interface MaintenanceRequest {
  id: string;
  requestNumber: string;
  room: string;
  tenant: string;
  tenantPhone: string;
  issue: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  createdAt: string;
  completedAt?: string;
  images?: string[];
}

const initialRequests: MaintenanceRequest[] = [
  {
    id: '1',
    requestNumber: 'MT-2026-001',
    room: 'P101',
    tenant: 'Nguyễn Văn A',
    tenantPhone: '0901234567',
    issue: 'Vòi nước bị hỏng',
    description: 'Vòi nước lavabo bị rỉ nước, cần thay mới',
    priority: 'high',
    status: 'pending',
    createdAt: '2026-06-01T08:30:00',
  },
  {
    id: '2',
    requestNumber: 'MT-2026-002',
    room: 'P205',
    tenant: 'Trần Thị B',
    tenantPhone: '0912345678',
    issue: 'Điều hòa không mát',
    description: 'Điều hòa không làm lạnh, có thể cần bơm gas',
    priority: 'medium',
    status: 'in-progress',
    createdAt: '2026-05-30T14:20:00',
  },
  {
    id: '3',
    requestNumber: 'MT-2026-003',
    room: 'P302',
    tenant: 'Lê Văn C',
    tenantPhone: '0923456789',
    issue: 'Bóng đèn hỏng',
    description: 'Bóng đèn phòng ngủ không sáng',
    priority: 'low',
    status: 'completed',
    createdAt: '2026-05-28T10:15:00',
    completedAt: '2026-05-28T16:30:00',
  },
  {
    id: '4',
    requestNumber: 'MT-2026-004',
    room: 'P401',
    tenant: 'Phạm Thị D',
    tenantPhone: '0934567890',
    issue: 'Cống tắc nghẽn',
    description: 'Cống nhà vệ sinh bị tắc, nước không thoát',
    priority: 'urgent',
    status: 'pending',
    createdAt: '2026-06-01T09:45:00',
  },
];

export default function MaintenanceRequests() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>(initialRequests);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.tenant.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.issue.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || request.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    const configs = {
      pending: { icon: Clock, label: 'Chờ xử lý', className: 'bg-yellow-100 text-yellow-700' },
      'in-progress': { icon: Wrench, label: 'Đang xử lý', className: 'bg-blue-100 text-blue-700' },
      completed: { icon: CheckCircle, label: 'Hoàn thành', className: 'bg-green-100 text-green-700' },
      cancelled: { icon: XCircle, label: 'Đã hủy', className: 'bg-gray-100 text-gray-700' },
    };
    const config = configs[status as keyof typeof configs];
    const Icon = config.icon;
    return (
      <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${config.className}`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const configs = {
      low: { label: 'Thấp', className: 'bg-gray-100 text-gray-700' },
      medium: { label: 'Trung bình', className: 'bg-blue-100 text-blue-700' },
      high: { label: 'Cao', className: 'bg-orange-100 text-orange-700' },
      urgent: { label: 'Khẩn cấp', className: 'bg-red-100 text-red-700' },
    };
    const config = configs[priority as keyof typeof configs];
    return (
      <span className={`px-2 py-1 rounded text-xs ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const handleUpdateStatus = (requestId: string, newStatus: string) => {
    setRequests(requests.map(req =>
      req.id === requestId
        ? { ...req, status: newStatus as any, completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined }
        : req
    ));
    toast.success('Đã cập nhật trạng thái!');
    setSelectedRequest(null);
  };

  const stats = {
    pending: requests.filter(r => r.status === 'pending').length,
    inProgress: requests.filter(r => r.status === 'in-progress').length,
    completed: requests.filter(r => r.status === 'completed').length,
    total: requests.length,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Yêu cầu sửa chữa</h1>
        <p className="text-gray-600">Xử lý các yêu cầu sửa chữa cơ sở vật chất từ người thuê</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm mb-1">Tổng yêu cầu</p>
          <p className="text-2xl font-semibold">{stats.total}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <p className="text-yellow-700 text-sm mb-1">Chờ xử lý</p>
          <p className="text-2xl font-semibold text-yellow-700">{stats.pending}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-blue-700 text-sm mb-1">Đang xử lý</p>
          <p className="text-2xl font-semibold text-blue-700">{stats.inProgress}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <p className="text-green-700 text-sm mb-1">Hoàn thành</p>
          <p className="text-2xl font-semibold text-green-700">{stats.completed}</p>
        </div>
      </div>

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
            <option value="pending">Chờ xử lý</option>
            <option value="in-progress">Đang xử lý</option>
            <option value="completed">Hoàn thành</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredRequests.map((request) => (
          <div key={request.id} className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-lg">{request.requestNumber}</h3>
                  {getPriorityBadge(request.priority)}
                  {getStatusBadge(request.status)}
                </div>
                <p className="text-gray-600 text-sm mb-1">{request.room} - {request.tenant}</p>
                <p className="text-sm text-gray-500">
                  {new Date(request.createdAt).toLocaleString('vi-VN')}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-start gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">{request.issue}</p>
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
              {request.status === 'pending' && (
                <button
                  onClick={() => handleUpdateStatus(request.id, 'in-progress')}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  Bắt đầu xử lý
                </button>
              )}
              {request.status === 'in-progress' && (
                <button
                  onClick={() => handleUpdateStatus(request.id, 'completed')}
                  className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  Hoàn thành
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog.Root open={selectedRequest !== null} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-auto">
            {selectedRequest && (
              <>
                <Dialog.Title className="text-xl font-semibold mb-4">Chi tiết yêu cầu</Dialog.Title>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Mã yêu cầu</p>
                      <p className="font-medium">{selectedRequest.requestNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Trạng thái</p>
                      <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phòng</p>
                      <p className="font-medium">{selectedRequest.room}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Người yêu cầu</p>
                      <p className="font-medium">{selectedRequest.tenant}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Số điện thoại</p>
                      <p className="font-medium">{selectedRequest.tenantPhone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Mức độ ưu tiên</p>
                      <div className="mt-1">{getPriorityBadge(selectedRequest.priority)}</div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Vấn đề</p>
                    <p className="font-medium">{selectedRequest.issue}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Mô tả chi tiết</p>
                    <p className="text-gray-700">{selectedRequest.description}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Thời gian tạo</p>
                    <p className="font-medium">{new Date(selectedRequest.createdAt).toLocaleString('vi-VN')}</p>
                  </div>

                  {selectedRequest.completedAt && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Thời gian hoàn thành</p>
                      <p className="font-medium">{new Date(selectedRequest.completedAt).toLocaleString('vi-VN')}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <Dialog.Close className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                      Đóng
                    </Dialog.Close>
                    {selectedRequest.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(selectedRequest.id, 'in-progress')}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Bắt đầu xử lý
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(selectedRequest.id, 'cancelled')}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          Hủy yêu cầu
                        </button>
                      </>
                    )}
                    {selectedRequest.status === 'in-progress' && (
                      <button
                        onClick={() => handleUpdateStatus(selectedRequest.id, 'completed')}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Hoàn thành
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

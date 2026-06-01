import { useState } from 'react';
import { ArrowLeft, Plus, CheckCircle, Clock, Wrench, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router';
import * as Dialog from '@radix-ui/react-dialog';
import { toast } from 'sonner';

interface MaintenanceRequest {
  id: string;
  issue: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: string;
  completedAt?: string;
}

const requests: MaintenanceRequest[] = [
  {
    id: '1',
    issue: 'Vòi nước bị rỉ',
    description: 'Vòi nước lavabo bị rỉ nước nhỏ giọt',
    priority: 'high',
    status: 'in-progress',
    createdAt: '2026-06-01T08:30:00',
  },
  {
    id: '2',
    issue: 'Bóng đèn hỏng',
    description: 'Bóng đèn phòng ngủ không sáng',
    priority: 'low',
    status: 'completed',
    createdAt: '2026-05-28T10:15:00',
    completedAt: '2026-05-28T16:30:00',
  },
];

export default function TenantMaintenance() {
  const navigate = useNavigate();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    issue: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Đã gửi yêu cầu sửa chữa!');
    setIsCreateDialogOpen(false);
    setFormData({ issue: '', description: '', priority: 'medium' });
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      pending: { icon: Clock, label: 'Chờ xử lý', className: 'bg-yellow-100 text-yellow-700' },
      'in-progress': { icon: Wrench, label: 'Đang xử lý', className: 'bg-blue-100 text-blue-700' },
      completed: { icon: CheckCircle, label: 'Hoàn thành', className: 'bg-green-100 text-green-700' },
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

  const getPriorityLabel = (priority: string) => {
    const labels = { low: 'Thấp', medium: 'Trung bình', high: 'Cao' };
    return labels[priority as keyof typeof labels];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-orange-600 text-white p-6 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/tenant/dashboard')} className="p-2 hover:bg-white/10 rounded-lg">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold">Sửa chữa</h1>
          </div>
          <button
            onClick={() => setIsCreateDialogOpen(true)}
            className="p-3 bg-white/20 rounded-full hover:bg-white/30"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="px-4 -mt-4 pb-6">
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-orange-900 mb-1">Hướng dẫn gửi yêu cầu</p>
              <p className="text-sm text-orange-800">Mô tả rõ vấn đề cần sửa chữa. Chúng tôi sẽ xử lý trong vòng 24-48 giờ.</p>
            </div>
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="text-center py-12">
            <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Chưa có yêu cầu sửa chữa nào</p>
            <button
              onClick={() => setIsCreateDialogOpen(true)}
              className="px-6 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700"
            >
              Tạo yêu cầu mới
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((request) => (
              <div key={request.id} className="bg-white rounded-xl shadow p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{request.issue}</h3>
                    <p className="text-sm text-gray-600 mb-2">{request.description}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {new Date(request.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">Ưu tiên: {getPriorityLabel(request.priority)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  {getStatusBadge(request.status)}
                  {request.completedAt && (
                    <span className="text-xs text-gray-500">
                      Hoàn thành: {new Date(request.completedAt).toLocaleDateString('vi-VN')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog.Root open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-6 w-[90%] max-w-md max-h-[90vh] overflow-auto">
            <Dialog.Title className="text-xl font-semibold mb-4">Yêu cầu sửa chữa mới</Dialog.Title>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Vấn đề cần sửa</label>
                <input
                  type="text"
                  value={formData.issue}
                  onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
                  placeholder="Vd: Vòi nước bị rỉ"
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Mô tả chi tiết</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả cụ thể vấn đề..."
                  rows={4}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Mức độ ưu tiên</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="low">Thấp - Không cấp thiết</option>
                  <option value="medium">Trung bình - Cần sửa sớm</option>
                  <option value="high">Cao - Cần sửa gấp</option>
                </select>
              </div>

              <div className="flex gap-2 pt-4">
                <Dialog.Close className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50">
                  Hủy
                </Dialog.Close>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700"
                >
                  Gửi yêu cầu
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

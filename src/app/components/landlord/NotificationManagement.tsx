import { useState, useEffect } from 'react';
import { Bell, BellRing, Check, CheckCheck, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { fetchApi } from '../../utils/api';
// import { useAuth } from '../../contexts/AuthContext';

// INTERFACES
interface NotificationItem {
  id: string;
  tenantId: string;
  title: string;
  body: string;
  type: number;
  refId: string;
  refModel: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationManagement() {
  // const { user } = useAuth();
  // const CURRENT_USER_ID = user?.id || "";
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);

  // States danh sách thông báo
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [isReadFilter, setIsReadFilter] = useState<boolean | null>(null); // null: Tất cả, true: Đã đọc, false: Chưa đọc

  // States form gửi thông báo mới (POST)
  const [tenantId, setTenantId] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState<number>(0);
  const [refId, setRefId] = useState('');
  const [refModel, setRefModel] = useState('');

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // GET: Tải danh sách thông báo
  const fetchNotifications = async () => {
    try {
      setIsLoading(true);

      // Xây dựng query params dựa trên API Swagger
      let query = `/Notification?page=${page}&pageSize=${pageSize}`;
      if (isReadFilter !== null) {
        query += `&isRead=${isReadFilter}`;
      }

      const res = await fetchApi(query);
      if (res.ok) {
        const data = await res.json();
        // Kiểm tra cấu trúc trả về
        if (Array.isArray(data)) {
          setNotifications(data);
        } else if (data && Array.isArray(data.items)) {
          setNotifications(data.items);
        }
      } else {
        toast.error('Không thể tải danh sách thông báo!');
      }
    } catch (error) {
      console.error(error);
      toast.error('Lỗi kết nối khi tải thông báo!');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [page, isReadFilter]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetchApi('/Users');
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        }
      } catch (error) {
        console.error('Không thể tải danh sách người dùng:', error);
      }
    };
    fetchUsers();
  }, []);

  // POST: Gửi thông báo mới
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim() || isSending) return;

    try {
      setIsSending(true);
      const payload = {
        tenantId: tenantId.trim() || null,
        title: title.trim(),
        body: body.trim(),
        type: type,
        refId: refId.trim() || null,
        refModel: refModel.trim() || null,
        meta: {}
      };

      const response = await fetchApi('/Notification', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success('Gửi thông báo thành công!');
        // Reset form nhập liệu
        setTenantId('');
        setTitle('');
        setBody('');
        setType(0);
        setRefId('');
        setRefModel('');

        // Tải lại danh sách để cập nhật tin mới
        setPage(1);
        fetchNotifications();
      } else {
        toast.error('Gửi thông báo thất bại!');
      }
    } catch (error) {
      console.error(error);
      toast.error('Lỗi hệ thống khi gửi thông báo!');
    } finally {
      setIsSending(false);
    }
  };

  // PUT: Đánh dấu đã đọc một thông báo cụ thể
  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await fetchApi(`/Notification/mark-read/${id}`, {
        method: 'PUT',
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notif) => (notif.id === id ? { ...notif, isRead: true } : notif))
        );
        toast.success('Đã đánh dấu đã đọc!');
      }
    } catch (error) {
      console.error(error);
    }
  };

  // PUT: Đánh dấu đã đọc TẤT CẢ thông báo
  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetchApi('/Notification/mark-all-read', {
        method: 'PUT',
      });

      if (response.ok) {
        setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })));
        toast.success('Đã đọc toàn bộ thông báo!');
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Quản lý Thông báo</h1>
        <p className="text-gray-600">Gửi thông báo đến người dùng và theo dõi hoạt động hệ thống</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* CỘT TRÁI: GỬI THÔNG BÁO MỚI (POST) */}
        <div className="lg:col-span-1 bg-white p-5 rounded-xl border border-gray-200 shadow-sm h-fit">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BellRing className="w-5 h-5 text-blue-600" />
            Tạo thông báo mới
          </h2>

          <form onSubmit={handleSendNotification} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Người nhận (Mặc định: Gửi cho tất cả)
              </label>
              <select
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                {/* Option mặc định không chọn ai -> gửi chung */}
                <option value="">Gửi cho tất cả mọi người</option>

                {/* Render danh sách người dùng từ API */}
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                    {/* ({u.id.substring(0, 8)}...) */}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tiêu đề thông báo <span className="text-red-500 text-sm">*</span></label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tiêu đề ngắn gọn..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nội dung thông báo <span className="text-red-500 text-sm">*</span></label>
              <textarea
                required
                rows={3}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Nhập chi tiết nội dung gửi đến người dùng..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Loại thông báo</label>
                <select
                  value={type}
                  onChange={(e) => setType(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value={0}>Hệ thống (0)</option>
                  <option value={1}>Hóa đơn (1)</option>
                  <option value={2}>Sự cố (2)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Model tham chiếu</label>
                <input
                  type="text"
                  value={refModel}
                  onChange={(e) => setRefModel(e.target.value)}
                  placeholder="Ví dụ: Bill, Issue"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">ID tham chiếu</label>
              <input
                type="text"
                value={refId}
                onChange={(e) => setRefId(e.target.value)}
                placeholder="ID của thực thể liên quan"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSending || !title.trim() || !body.trim()}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-50"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Phát thông báo
            </button>
          </form>
        </div>

        {/* CỘT PHẢI: LỊCH SỬ & LOG THÔNG BÁO (GET / PUT) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-[600px]">
          <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800">Lịch sử thông báo</span>
              <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-0.5 rounded-full font-medium">
                {notifications.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Filter theo trạng thái đọc */}
              <select
                value={isReadFilter === null ? 'all' : isReadFilter.toString()}
                onChange={(e) => {
                  const val = e.target.value;
                  setIsReadFilter(val === 'all' ? null : val === 'true');
                  setPage(1);
                }}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none bg-white"
              >
                <option value="all">Tất cả thông báo</option>
                <option value="false">Chưa đọc</option>
                <option value="true">Đã đọc</option>
              </select>

              <button
                onClick={handleMarkAllAsRead}
                disabled={notifications.length === 0}
                className="px-3 py-1.5 bg-gray-50 border border-gray-200 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Đọc tất cả
              </button>
            </div>
          </div>

          {/* Danh sách thông báo */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Bell className="w-12 h-12 text-gray-300 mb-2" />
                <p className="text-sm font-medium">Không có thông báo nào</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors ${!notif.isRead ? 'bg-blue-50/20' : ''
                    }`}
                >
                  <div
                    className={`p-2 rounded-lg shrink-0 ${!notif.isRead ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                      }`}
                  >
                    <Bell className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className={`text-sm truncate ${!notif.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed mb-2">{notif.body}</p>

                    {/* Tags thông tin kèm theo */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-gray-100 text-gray-600 text-[9px] px-2 py-0.5 rounded-full">
                        Loại: {notif.type}
                      </span>
                      {notif.refModel && (
                        <span className="bg-purple-50 text-purple-600 text-[9px] px-2 py-0.5 rounded-full">
                          {notif.refModel} ({notif.refId})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Hành động trên từng dòng */}
                  {!notif.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="p-1 hover:bg-blue-100 rounded-md text-blue-600 transition-colors shrink-0"
                      title="Đánh dấu đã đọc"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Phân trang đơn giản */}
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border rounded-lg text-xs font-medium disabled:opacity-50 hover:bg-gray-50"
            >
              Trang trước
            </button>
            <span className="text-xs text-gray-600 font-medium">Trang {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={notifications.length < pageSize}
              className="px-3 py-1.5 border rounded-lg text-xs font-medium disabled:opacity-50 hover:bg-gray-50"
            >
              Trang sau
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
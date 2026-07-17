import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Chuyển trang
import { 
  Bell, 
  BellRing, 
  Check, 
  CheckCheck, 
  Loader2, 
  Send, 
  Search, 
  Plus, 
  X,
  Volume2,
  Inbox,
  MessageSquare // Icon tin nhắn trực quan
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchApi } from '../../utils/api';

// INTERFACES khớp hoàn toàn với Backend Swagger
interface NotificationItem {
  id: string;
  tenantId: string | null;
  title: string;
  body: string;
  type: number;
  refId: string | null;
  refModel: string | null;
  isRead: boolean;
  createdAt: string;
  meta?: Record<string, string>;
}

export default function NotificationManagement() {
  const navigate = useNavigate(); // Hook điều hướng chuyển trang
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  
  // Bộ lọc & Phân trang
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [isReadFilter, setIsReadFilter] = useState<boolean | null>(null); // null: Tất cả, true: Đã đọc, false: Chưa đọc
  const [searchQuery, setSearchQuery] = useState('');

  // States Thống kê số lượng thông báo nhanh
  const [stats, setStats] = useState({ total: 0, unread: 0, read: 0 });

  // Dialog Form Gửi Thông báo
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [tenantId, setTenantId] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState<number>(0);
  const [refModel, setRefModel] = useState(''); // Giá trị select liên kết tính năng
  const [metaKey, setMetaKey] = useState('');
  const [metaValue, setMetaValue] = useState('');

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // GET: Tải danh sách thông báo
  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      let query = `/Notification?page=${page}&pageSize=${pageSize}`;
      if (isReadFilter !== null) {
        query += `&isRead=${isReadFilter}`;
      }

      const res = await fetchApi(query);
      if (res.ok) {
        const data = await res.json();
        let items: NotificationItem[] = [];
        if (Array.isArray(data)) {
          items = data;
        } else if (data && Array.isArray(data.items)) {
          items = data.items;
        }
        setNotifications(items);

        // Tính toán nhanh số liệu thống kê ở client
        const unreadCount = items.filter(n => !n.isRead).length;
        setStats({
          total: items.length,
          unread: unreadCount,
          read: items.length - unreadCount
        });
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
      
      // Khởi tạo meta object khớp Swagger
      const metaObj: Record<string, string> = {};
      if (metaKey.trim() && metaValue.trim()) {
        metaObj[metaKey.trim()] = metaValue.trim();
      }

      const payload = {
        tenantId: tenantId.trim() || null,
        title: title.trim(),
        body: body.trim(),
        type: type,
        refId: null, // Đã loại bỏ phần nhập ID, gán cứng null lên backend
        refModel: refModel.trim() || null,
        meta: metaObj
      };

      const response = await fetchApi('/Notification', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success('Gửi thông báo thành công!');
        // Reset form
        setTenantId('');
        setTitle('');
        setBody('');
        setType(0);
        setRefModel('');
        setMetaKey('');
        setMetaValue('');
        setIsFormOpen(false);

        // Tải lại danh sách
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
  const handleMarkAsRead = async (id: string, silent = false) => {
    try {
      const response = await fetchApi(`/Notification/mark-read/${id}`, {
        method: 'PUT',
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notif) => (notif.id === id ? { ...notif, isRead: true } : notif))
        );
        if (!silent) toast.success('Đã đánh dấu đã đọc!');
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

  // Xử lý chuyển trang hướng động khi click vào card thông báo
  const handleNotificationClick = async (notif: NotificationItem) => {
    // Đọc ngầm nếu chưa đọc
    if (!notif.isRead) {
      await handleMarkAsRead(notif.id, true);
    }

    const model = notif.refModel?.toLowerCase();
    switch (model) {
      case 'message':
      case 'chat':
        navigate('/messages'); 
        toast.info('Đang chuyển hướng tới hộp thoại tin nhắn...');
        break;
      case 'bill':
        navigate('/bills');
        break;
      case 'issue':
      case 'maintenance':
        navigate('/issues');
        break;
      case 'contract':
        navigate('/contracts');
        break;
      case 'room':
        navigate('/rooms');
        break;
      default:
        toast.info(`Thông báo hệ thống: ${notif.title}`);
        break;
    }
  };

  // Filter tìm kiếm client-side theo tiêu đề/nội dung
  const filteredNotifications = notifications.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    n.body.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Thông báo hệ thống</h1>
          <p className="text-sm text-gray-500">Quản lý và phát đi thông báo trực tiếp tới các cư dân, người dùng</p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Tạo thông báo mới
        </button>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Tổng thông báo</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
        </div>
        <div className="bg-yellow-50/50 p-5 rounded-xl border border-yellow-100 shadow-sm">
          <p className="text-sm text-yellow-700 font-medium">Chưa đọc</p>
          <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.unread}</p>
        </div>
        <div className="bg-green-50/50 p-5 rounded-xl border border-green-100 shadow-sm">
          <p className="text-sm text-green-700 font-medium">Đã đọc</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{stats.read}</p>
        </div>
        <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100 shadow-sm flex flex-col justify-center">
          <button
            onClick={handleMarkAllAsRead}
            disabled={notifications.length === 0}
            className="w-full py-2 bg-white hover:bg-blue-50 border border-blue-200 text-blue-600 font-medium rounded-lg text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <CheckCheck className="w-4 h-4" />
            Đánh dấu đọc tất cả
          </button>
        </div>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-2/3">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm thông báo, tiêu đề, nội dung..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={isReadFilter === null ? 'all' : isReadFilter.toString()}
            onChange={(e) => {
              const val = e.target.value;
              setIsReadFilter(val === 'all' ? null : val === 'true');
              setPage(1);
            }}
            className="w-full md:w-auto px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none bg-white cursor-pointer"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="false">Chưa đọc</option>
            <option value="true">Đã đọc</option>
          </select>
        </div>
      </div>

      {/* NOTIFICATION CARDS LIST */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-100">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
            <p className="text-sm text-gray-500">Đang đồng bộ dữ liệu...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-100 text-gray-400">
            <Inbox className="w-12 h-12 text-gray-300 mb-2" />
            <p className="text-sm font-medium">Không tìm thấy thông báo nào</p>
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)} // Click vào thẻ để kích hoạt chuyển hướng
              className={`bg-white p-5 rounded-xl border transition-all hover:shadow-md cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                !notif.isRead ? 'border-l-4 border-l-blue-500 border-gray-200' : 'border-gray-100'
              }`}
            >
              {/* Thẻ bên trái chứa nội dung chính */}
              <div className="flex items-start gap-4 flex-1">
                <div className={`p-2.5 rounded-lg ${
                  notif.refModel?.toLowerCase() === 'message' 
                    ? 'bg-purple-50 text-purple-600' // Đổi sang màu tím nếu là tin nhắn
                    : !notif.isRead ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {notif.refModel?.toLowerCase() === 'message' ? (
                    <MessageSquare className="w-5 h-5" />
                  ) : (
                    <Bell className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-xs font-semibold text-gray-400">#{notif.id.substring(0, 8).toUpperCase()}</span>
                    
                    {/* Loại thông báo */}
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium ${
                      notif.type === 0 ? 'bg-gray-100 text-gray-600' :
                      notif.type === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {notif.type === 0 ? 'Hệ thống' : notif.type === 1 ? 'Hóa đơn' : 'Sự cố'}
                    </span>

                    {/* Trạng thái Đã đọc / Chưa đọc */}
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium ${
                      notif.isRead ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {notif.isRead ? 'Đã đọc' : 'Chưa đọc'}
                    </span>

                    <span className="text-xs text-gray-400">
                      • {new Date(notif.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>

                  <h3 className={`text-base flex items-center gap-2 ${!notif.isRead ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                    {notif.title}
                    {notif.refModel?.toLowerCase() === 'message' && (
                      <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-1.5 py-0.5 rounded">Tin nhắn mới</span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">{notif.body}</p>

                  {/* Ref model link hiển thị thông báo chuyển hướng */}
                  {notif.refModel && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 w-fit px-2.5 py-1 rounded-md border border-blue-100">
                      <Volume2 className="w-3.5 h-3.5" />
                      Nhấp để đi tới: <span className="font-semibold uppercase">{notif.refModel}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Nhóm hành động bên phải (BỎ NÚT MẮT XEM METADATA) */}
              <div 
                className="flex items-center gap-2 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 justify-end"
                onClick={(e) => e.stopPropagation()} // Ngăn nổi bọt để tránh kích hoạt click chuyển trang
              >
                {!notif.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(notif.id)}
                    className="flex-1 md:flex-none px-4 py-2 border border-blue-200 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    Đánh dấu đã đọc
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* PHÂN TRANG */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
        <button
          onClick={() => setPage((p) => Math.max(p - 1, 1))}
          disabled={page === 1}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-gray-50 transition-colors"
        >
          Trang trước
        </button>
        <span className="text-sm text-gray-600 font-medium">Trang {page}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={notifications.length < pageSize}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-gray-50 transition-colors"
        >
          Trang sau
        </button>
      </div>

      {/* MODAL/POPUP FORM TẠO THÔNG BÁO MỚI */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden border border-gray-100 animate-slide-up">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <BellRing className="w-5 h-5 text-blue-600" />
                Soạn tin nhắn thông báo mới
              </h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSendNotification} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Người nhận (Gửi toàn bộ nếu trống)
                </label>
                <select
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  <option value="">Gửi cho tất cả mọi người</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Tiêu đề thông báo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Tiêu đề chính..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Nội dung chi tiết <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Nhập nội dung gửi..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                />
              </div>

              {/* KHU VỰC THAY ĐỔI: Bỏ ID tham chiếu, chỉ giữ lại Phân loại & Select liên kết tính năng */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Phân loại</label>
                  <select
                    value={type}
                    onChange={(e) => setType(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value={0}>Hệ thống</option>
                    <option value={1}>Hóa đơn</option>
                    <option value={2}>Sự cố</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Liên kết tính năng</label>
                  <select
                    value={refModel}
                    onChange={(e) => setRefModel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="">-- Không liên kết --</option>
                    <option value="Message">Tin nhắn (Message)</option>
                    <option value="Bill">Hóa đơn (Bill)</option>
                    <option value="Issue">Sửa chữa (Issue)</option>
                    <option value="Contract">Hợp đồng (Contract)</option>
                    <option value="Room">Quản lý phòng (Room)</option>
                  </select>
                </div>
              </div>

              {/* Metadata section (Giữ nguyên cấu trúc Metadata để backup khi cần truyền Key/Value) */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Metadata Key/Val (Tùy chọn)</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={metaKey}
                    onChange={(e) => setMetaKey(e.target.value)}
                    placeholder="Key (ví dụ: source)"
                    className="w-1/2 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={metaValue}
                    onChange={(e) => setMetaValue(e.target.value)}
                    placeholder="Value (ví dụ: system_alert)"
                    className="w-1/2 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSending || !title.trim() || !body.trim()}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Phát thông báo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
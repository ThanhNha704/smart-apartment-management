import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  Building2,
  FileText,
  Users,
  MessageCircleMore,
  Bell,
  Gauge,
  Menu,
  Layers,
  FileSignature,
  Wrench,
  LogOut,
  Coins,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import { fetchApi } from "../api/fetchApi";

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
}

const menuItems = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Tổng quan" },
  { path: "/notification", icon: Bell, label: "Thông báo" },
  { path: "/messages", icon: MessageCircleMore, label: "Tin nhắn" },
  { path: "/floors", icon: Layers, label: "Quản lý tầng" },
  { path: "/rooms", icon: Building2, label: "Quản lý phòng" },
  { path: "/tenants", icon: Users, label: "Người thuê" },
  { path: "/contracts", icon: FileSignature, label: "Hợp đồng" },
  { path: "/invoices", icon: FileText, label: "Hóa đơn" },
  { path: "/fees", icon: Coins, label: "Khoản phí phụ" },
  { path: "/meter-reading", icon: Gauge, label: "Lịch sử công tơ" },
  { path: "/maintenance", icon: Wrench, label: "Yêu cầu sửa chữa" },
];

export default function Sidebar({ open, onToggle }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Lấy số lượng thông báo chưa đọc trực tiếp từ API
  const fetchUnreadCount = async () => {
    try {
      const res = await fetchApi("/Notification/all?page=1&pageSize=1");
      if (res.ok) {
        const result = await res.json();
        setUnreadCount(result.unreadCount ?? 0);
      }
    } catch (error) {
      console.error("Lỗi khi tải số lượng thông báo chưa đọc:", error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    // Lắng nghe sự kiện để cập nhật lại badge khi có thay đổi
    window.addEventListener("notification-updated", fetchUnreadCount);
    return () => {
      window.removeEventListener("notification-updated", fetchUnreadCount);
    };
  }, []);

  const handleLogout = () => {
    logout();
    toast.success("Đã đăng xuất!");
    navigate("/login");
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-50 flex flex-col ${
        open ? "w-64" : "w-20"
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {open ? (
          <>
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl overflow-hidden p-1">
                <img
                  src="/logo.svg"
                  alt="Smart Boarding House Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-semibold text-lg">Quản lý trọ</span>
            </div>
            <button
              onClick={onToggle}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <Menu className="w-5 h-5" />
            </button>
          </>
        ) : (
          <button
            onClick={onToggle}
            className="p-1 hover:bg-gray-100 rounded mx-auto"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="p-2 mt-4 flex-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          const isNotification = item.path === "/notification";

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg mb-1 transition-colors relative ${
                isActive
                  ? "bg-blue-50 text-blue-600 font-medium"
                  : "text-gray-700 hover:bg-gray-100"
              } ${!open ? "justify-center" : ""}`}
            >
              <div className="relative flex-shrink-0">
                <Icon className="w-5 h-5" />
                {/* Khi thu gọn: Chấm đỏ góc icon chuông */}
                {!open && isNotification && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white" />
                )}
              </div>

              {open && (
                <>
                  <span className="flex-1 truncate">{item.label}</span>
                  {/* Khi mở rộng: Badge màu đỏ */}
                  {isNotification && unreadCount > 0 && (
                    <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full min-w-[20px] text-center shadow-xs">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-2 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 px-3 py-3 rounded-lg w-full text-red-600 hover:bg-red-50 transition-colors ${
            !open ? "justify-center" : ""
          }`}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {open && <span>Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );
}

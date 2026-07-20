// src/socket/adminSocket.ts
import { io, Socket } from "socket.io-client";

const SOCKET_URL: string = import.meta.env.VITE_API_URL;

let socket: Socket | null = null;
let socketToken: string | null = null; // Biến lưu vết token được sử dụng để kết nối socket hiện tại

/**
 * Lấy JWT hiện tại từ Storage chung của ứng dụng.
 */
const getChatToken = (): string | null =>
  localStorage.getItem("token") || sessionStorage.getItem("token");

/**
 * Tạo (hoặc trả về) instance socket đã kết nối, kèm JWT của Admin đang đăng nhập.
 */
export const getAdminSocket = (): Socket => {
  const token = getChatToken();

  // SỬA TẠI ĐÂY: Nếu socket đang chạy NHƯNG token trong máy đã thay đổi (đăng xuất/đăng nhập tài khoản khác),
  // bắt buộc phải ngắt kết nối cũ ngay để tránh dùng nhầm quyền hạn của user cũ.
  if (socket && socketToken !== token) {
    socket.disconnect();
    socket = null;
  }

  // Nếu socket đã tồn tại và đang kết nối ổn định với đúng token đó thì trả về luôn
  if (socket && socket.connected) {
    return socket;
  }

  // Nếu instance socket đã có nhưng bị rớt mạng (connected = false), chỉ cần gọi connect lại mà không tạo mới
  if (socket) {
    socket.connect();
    return socket;
  }

  // Khởi tạo kết nối socket mới tinh
  socketToken = token; // Lưu lại vết token mới
  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket"],
    autoConnect: true,
    reconnection: true, // Tự động kết nối lại khi rớt mạng
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
  });

  // Đăng ký sự kiện lỗi duy nhất 1 lần lúc khởi tạo để tránh trùng lặp listener (Memory Leak)
  socket.on("connect_error", (err: Error) => {
    console.error("[Socket] Kết nối lỗi hoặc sai Token xác thực:", err.message);
  });

  return socket;
};

/**
 * Ngắt kết nối socket hiện tại và giải phóng bộ nhớ
 */
export const disconnectAdminSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
    socketToken = null;
  }
};

export default getAdminSocket;
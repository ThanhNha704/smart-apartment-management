// src/api/chatApi.ts
// Toàn bộ API chat/message chạy trên backend Node.js (khác với backend .NET dùng cho phần còn lại),
// nên dùng fetchNodeApi (trỏ tới VITE_API_URL) thay vì fetchApi (trỏ tới VITE_API_BASE_URL của .NET).
import { fetchNodeApi } from "../api/nodeFetchApi";

// INTERFACES
export interface ConversationItem {
  id: string;
  tenantId: string;
  tenantName: string;
  roomNumber: string;
  avatarUrl?: string;
  lastMessageContent: string;
  lastMessageTime: string;
  unreadCount: number;
}

export interface MessageItem {
  id: string;
  senderId: string;
  senderRole: "Admin" | "Tenant";
  content: string;
  type: "Text" | "Image";
  imageUrl?: string;
  createdAt: string;
}

export interface SendMessagePayload {
  tenantId: string;
  content: string;
  type?: "Text" | "Image";
  imageUrl?: string;
}

// Hàm bổ trợ xử lý Response (tương đương interceptor response của Axios)
const clearRealSession = (): void => {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  sessionStorage.removeItem("user");
  sessionStorage.removeItem("token");
};

const handleAuthResponse = async (response: Response): Promise<Response> => {
  if (response.status === 401) {
    try {
      const cloned = response.clone();
      const body = await cloned.json();
      console.error(
        "[Chat API] 401 từ Node backend — lý do:",
        body?.message || body,
      );
    } catch {
      console.error("[Chat API] 401 từ Node backend (không đọc được response body)");
    }

    clearRealSession();
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }
  return response;
};

/**
 * GET /messages 
 * Lấy danh sách tất cả các cuộc trò chuyện
 */
export const getConversations = async (): Promise<Response> => {
  const response = await fetchNodeApi("/messages", {
    method: "GET",
  });
  return handleAuthResponse(response);
};

/**
 * GET /messages/:tenantId 
 * Lấy lịch sử chat với một tenant cụ thể (hỗ trợ phân trang)
 */
export const getMessagesWithTenant = async (
  tenantId: string, 
  page: number = 1, 
  limit: number = 30
): Promise<Response> => {
  const response = await fetchNodeApi(`/messages/${tenantId}?page=${page}&limit=${limit}`, {
    method: "GET",
  });
  return handleAuthResponse(response);
};

/**
 * POST /messages/send 
 * Gửi tin nhắn (Dùng chung cho cả Admin và Tenant)
 */
export const sendMessageApi = async (payload: SendMessagePayload): Promise<Response> => {
  const { tenantId, content, type = "Text", imageUrl } = payload;
  
  const response = await fetchNodeApi("/messages/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ tenantId, content, type, imageUrl }),
  });
  return handleAuthResponse(response);
};

/**
 * POST /messages/upload-image 
 * Tải ảnh lên máy chủ trước khi gửi tin nhắn dạng Image
 */
export const uploadChatImage = async (file: File): Promise<Response> => {
  const formData = new FormData();
  formData.append("image", file); // Tên field khớp với cấu hình Multer/Backend

  const response = await fetchNodeApi("/messages/upload-image", {
    method: "POST",
    // GIẢI PHÁP AN TOÀN: Truyền đè headers trống hoặc cấu hình đặc biệt nếu fetchNodeApi của bạn
    // tự động ép `Content-Type: application/json`. Trình duyệt sẽ tự động điền `multipart/form-data` kèm `boundary`.
    headers: {
      // Bỏ trống Content-Type để ép fetchNodeApi không tự chèn JSON header (nếu hàm đó có check logic)
      "Content-Type": undefined as any 
    },
    body: formData,
  });
  return handleAuthResponse(response);
};
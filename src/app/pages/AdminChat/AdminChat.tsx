// src/pages/AdminChat/AdminChat.tsx
import React, { useEffect, useState, useCallback } from "react";
import ConversationList, { type ConversationItem } from "./ConversationList";
import ChatWindow from "./ChatWindow";
import { getConversations } from "../../api/chatApi";
import { getAdminSocket } from "../../socket/adminSocket";

const AdminChat: React.FC = () => {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [loadingList, setLoadingList] = useState<boolean>(true);

  // Hàm tải danh sách các cuộc hội thoại từ Server
  const loadConversations = useCallback(() => {
    getConversations()
      .then(async (res) => {
        if (res.ok) {
          const resData = await res.json();
          // Điều chỉnh bóc tách theo Fetch API: Lấy resData.data hoặc trực tiếp mảng resData
          const fetchedConversations: ConversationItem[] = resData.data || resData || [];
          setConversations(fetchedConversations);
        } else {
          console.error("Lỗi phản hồi từ server khi tải danh sách hội thoại");
        }
      })
      .catch((err) => console.error("Lỗi tải danh sách hội thoại:", err))
      .finally(() => setLoadingList(false));
  }, []);

  useEffect(() => {
    loadConversations();

    const socket = getAdminSocket();

    const handleOnlineUsers = (ids: string[]) => setOnlineUserIds(ids);

    const handleNewMessageGlobal = () => {
      // Có tin nhắn mới bất kỳ -> refresh lại danh sách để cập nhật tin nhắn cuối & số lượng tin chưa đọc
      loadConversations();
    };

    socket.on("online_users", handleOnlineUsers);
    socket.on("new_message", handleNewMessageGlobal);

    return () => {
      socket.off("online_users", handleOnlineUsers);
      socket.off("new_message", handleNewMessageGlobal);
      // Giữ nguyên logic đóng kết nối tùy thuộc vào NotificationBell dùng chung như ghi chú của bạn
      // disconnectAdminSocket();
    };
  }, [loadConversations]);

  // Tìm cuộc trò chuyện đang được chọn để lấy profile Tenant chuyển sang cửa sổ chat
  const selectedConv = conversations.find(
    (c) => c.conversationId === selectedTenantId
  );

  return (
    <div className="flex h-full border border-gray-200 rounded-lg overflow-hidden bg-white">
      {loadingList && conversations.length === 0 ? (
        <div className="flex items-center justify-center p-8 text-gray-500 text-sm w-full">
          Đang tải danh sách cuộc trò chuyện...
        </div>
      ) : (
        <>
          <ConversationList
            conversations={conversations}
            selectedTenantId={selectedTenantId}
            onlineUserIds={onlineUserIds}
            onSelect={setSelectedTenantId}
          />
          <ChatWindow
            key={selectedTenantId || "empty"}
            tenant={selectedConv?.tenant || null}
            tenantId={selectedTenantId}
            onMessageSent={loadConversations}
          />
        </>
      )}
    </div>
  );
};

export default AdminChat;
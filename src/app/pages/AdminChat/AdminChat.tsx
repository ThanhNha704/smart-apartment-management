// src/pages/AdminChat/AdminChat.tsx
import React, { useEffect, useState, useCallback } from "react";
import ConversationList, { type UserChatItem } from "./ConversationList";
import ChatWindow from "./ChatWindow";
import { getConversations } from "../../api/chatApi";
import { getAdminSocket } from "../../socket/adminSocket";
import { fetchApi } from "../../api/fetchApi";

interface UserTenant {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  avatarUrl: string | null;
  roomNumber: string | null;
  isActive: boolean;
  role: string;
}

const AdminChat: React.FC = () => {
  const [conversations, setConversations] = useState<UserChatItem[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(() => {
    const saved = localStorage.getItem("active_chat_user_id");
    if (saved) {
      localStorage.removeItem("active_chat_user_id");
    }
    return saved || null;
  });
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [loadingList, setLoadingList] = useState<boolean>(true);

  // Hàm tải danh sách các cuộc hội thoại từ Server
  const loadConversations = useCallback(() => {
    setLoadingList(true);
    Promise.all([
      getConversations()
        .then(async (res) => {
          if (res.ok) {
            const resData = await res.json();
            // Điều chỉnh bóc tách theo Fetch API: Lấy resData.data hoặc trực tiếp mảng resData
            const fetchedConversations: UserChatItem[] = resData.data || resData || [];
            return fetchedConversations;
          }
          return [] as UserChatItem[];
        })
        .catch((err) => {
          console.error("Lỗi tải danh sách hội thoại:", err);
          return [] as UserChatItem[];
        }),
      fetchApi("/Users")
        .then(async (res) => {
          if (res.ok) {
            const usersData: UserTenant[] = await res.json();
            return usersData;
          }
          return [] as UserTenant[];
        })
        .catch((err) => {
          console.error("Lỗi tải danh sách khách thuê:", err);
          return [] as UserTenant[];
        }),
    ])
      .then(([chatConversations, allUsers]) => {
        // Thực hiện gộp danh sách cuộc trò chuyện với danh sách người dùng
        const merged: UserChatItem[] = [...chatConversations];

        allUsers.forEach((user) => {
          const exists = merged.some((c) => c._id === user.id);
          if (!exists) {
            merged.push({
              _id: user.id,
              fullName: user.name,
              phone: user.phoneNumber,
              avatar: user.avatarUrl || undefined,
              email: user.email,
              roomNumber: user.roomNumber || undefined,
              isActive: user.isActive,
              hasConversation: false,
              lastMessage: null,
              unreadCount: 0,
            });
          } else {
            const index = merged.findIndex((c) => c._id === user.id);
            if (index !== -1) {
              merged[index] = {
                ...merged[index],
                fullName: merged[index].fullName || user.name,
                phone: merged[index].phone || user.phoneNumber,
                avatar: merged[index].avatar || user.avatarUrl || undefined,
                email: merged[index].email || user.email,
                roomNumber: merged[index].roomNumber || user.roomNumber || undefined,
                isActive: merged[index].isActive !== undefined ? merged[index].isActive : user.isActive,
                hasConversation: true,
              };
            }
          }
        });

        // Sắp xếp danh sách
        merged.sort((a, b) => {
          const timeA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
          const timeB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;

          if (timeA !== timeB) {
            return timeB - timeA; // Cuộc trò chuyện có tin nhắn mới hơn lên trước
          }

          // Phân loại phòng và sắp xếp theo phòng
          const roomA = a.roomNumber || "";
          const roomB = b.roomNumber || "";
          if (roomA && roomB) {
            return roomA.localeCompare(roomB, undefined, { numeric: true, sensitivity: "base" });
          }
          if (roomA) return -1;
          if (roomB) return 1;

          // Xếp theo tên tiếng Việt
          const nameA = a.fullName || "";
          const nameB = b.fullName || "";
          return nameA.localeCompare(nameB, "vi");
        });

        setConversations(merged);
      })
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
    };
  }, [loadConversations]);

  // Tìm cuộc trò chuyện đang được chọn để lấy profile Tenant chuyển sang cửa sổ chat
  const selectedConv = conversations.find(
    (c) => c._id === selectedTenantId
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
            tenant={
              selectedConv
                ? {
                    id: selectedConv._id,
                    fullName: selectedConv.fullName,
                    avatar: selectedConv.avatar,
                    roomNumber: selectedConv.roomNumber,
                  }
                : null
            }
            tenantId={selectedTenantId}
            onMessageSent={loadConversations}
          />
        </>
      )}
    </div>
  );
};

export default AdminChat;
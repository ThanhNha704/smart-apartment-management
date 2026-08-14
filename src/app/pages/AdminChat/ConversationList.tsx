// src/pages/AdminChat/ConversationList.tsx
import React, { useState, useMemo } from "react";
import { User, Image as ImageIcon, Search, X, Phone } from "lucide-react";

// Interface khớp chính xác với kết quả trả về từ API backend
export interface LastMessageInfo {
  _id?: string;
  senderId?: string;
  senderRole?: "Admin" | "Tenant";
  content?: string;
  type?: "Text" | "Image";
  createdAt?: string;
}

export interface UserChatItem {
  _id: string; // ID của Tenant
  fullName?: string;
  phone?: string;
  avatar?: string;
  email?: string;
  roomNumber?: string;
  isActive?: boolean;
  hasConversation?: boolean;
  lastMessage?: LastMessageInfo | null;
  unreadCount?: number;
}

interface ConversationListProps {
  conversations: UserChatItem[];
  selectedTenantId: string | null;
  onlineUserIds: string[];
  onSelect: (tenantId: string) => void;
}

const formatTime = (dateStr?: string): string => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  return isToday
    ? date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
};

const ConversationList: React.FC<ConversationListProps> = ({
  conversations = [],
  selectedTenantId,
  onlineUserIds = [],
  onSelect,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Loại bỏ các ID trùng lặp nếu có
  const uniqueList = useMemo(() => {
    return (conversations || []).filter(
      (user, index, self) => self.findIndex((u) => u._id === user._id) === index
    );
  }, [conversations]);

  // Lọc theo Tên, Số phòng hoặc Số điện thoại
  const filteredList = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    if (!search) return uniqueList;

    return uniqueList.filter((user) => {
      const fullName = user.fullName?.toLowerCase() || "";
      const roomNumber = user.roomNumber?.toLowerCase() || "";
      const phone = user.phone?.toLowerCase() || "";
      return (
        fullName.includes(search) ||
        roomNumber.includes(search) ||
        phone.includes(search)
      );
    });
  }, [uniqueList, searchTerm]);

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 w-full max-w-sm">
      {/* Header & Ô tìm kiếm */}
      <div className="p-4 border-b border-gray-100 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">Tin nhắn</h1>
          <span className="text-xs bg-blue-50 text-blue-600 font-medium px-2.5 py-1 rounded-full">
            {uniqueList.length} khách thuê
          </span>
        </div>

        {/* Thanh tìm kiếm */}
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            className="w-full h-9 pl-9 pr-8 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:bg-white transition-all placeholder:text-gray-400"
            placeholder="Tìm theo tên, SĐT hoặc số phòng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Danh sách người dùng / hội thoại */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {filteredList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 space-y-2">
            <User className="w-8 h-8 opacity-50" />
            <span className="text-sm font-medium">
              {searchTerm ? "Không tìm thấy kết quả phù hợp" : "Chưa có khách thuê nào"}
            </span>
          </div>
        ) : (
          filteredList.map((user) => {
            const isSelected = selectedTenantId === user._id;
            const isOnline = onlineUserIds.includes(user._id);
            const unreadCount = user.unreadCount || 0;
            const hasUnread = unreadCount > 0 && !isSelected;

            return (
              <div
                key={user._id}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 select-none
                  ${
                    isSelected
                      ? "bg-blue-100 text-blue-950 shadow-sm"
                      : "hover:bg-gray-100 active:bg-gray-200 text-gray-700"
                  }`}
                onClick={() => onSelect(user._id)}
              >
                {/* Avatar + Trạng thái Online */}
                <div className="relative flex-shrink-0">
                  {user.avatar ? (
                    <img
                      className="w-12 h-12 rounded-full object-cover border border-gray-100 shadow-sm"
                      src={user.avatar}
                      alt={user.fullName || "Tenant"}
                    />
                  ) : (
                    <div className="w-12 h-12 flex items-center justify-center bg-gray-100 text-gray-400 rounded-full border border-gray-200">
                      <User className="w-6 h-6" />
                    </div>
                  )}

                  {isOnline && (
                    <span className="absolute bottom-0 right-0 flex h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-white">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    </span>
                  )}
                </div>

                {/* Thông tin & Tin nhắn tóm tắt */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`text-[15px] truncate ${
                          hasUnread ? "font-semibold text-gray-900" : "font-medium text-gray-800"
                        }`}
                      >
                        {user.fullName || (user.roomNumber ? `Khách thuê P.${user.roomNumber}` : "Khách thuê")}
                      </span>
                      {/* {user.roomNumber && (
                        <span className="text-[11px] font-medium bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-md flex-shrink-0">
                          P.{user.roomNumber}
                        </span>
                      )} */}
                    </div>

                    <span
                      className={`text-xs flex-shrink-0 ml-2 ${
                        hasUnread ? "font-semibold text-blue-600" : "text-gray-400"
                      }`}
                    >
                      {formatTime(user.lastMessage?.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <p
                      className={`text-sm truncate ${
                        hasUnread ? "font-semibold text-gray-900" : "text-gray-500"
                      }`}
                    >
                      {user.lastMessage ? (
                        <>
                          {user.lastMessage.senderRole === "Admin" && (
                            <span className="text-gray-400 font-normal">Bạn: </span>
                          )}
                          {user.lastMessage.type === "Image" ? (
                            <span className="inline-flex items-center gap-1 text-blue-500 font-medium text-xs">
                              <ImageIcon className="w-3.5 h-3.5" /> [Hình ảnh]
                            </span>
                          ) : (
                            user.lastMessage.content || <span className="italic text-gray-300 text-xs">Tin nhắn trống</span>
                          )}
                        </>
                      ) : (
                        <span className="italic text-gray-400 text-xs flex items-center gap-1">
                          {user.phone ? (
                            <>
                              <Phone className="w-3 h-3" /> {user.phone}
                            </>
                          ) : (
                            "Bắt đầu trò chuyện"
                          )}
                        </span>
                      )}
                    </p>

                    {/* Badge số tin nhắn chưa đọc */}
                    {hasUnread && (
                      <span className="flex items-center justify-center min-w-5 h-5 px-1.5 ml-2 text-[11px] font-bold text-white bg-blue-600 rounded-full shadow-sm">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ConversationList;
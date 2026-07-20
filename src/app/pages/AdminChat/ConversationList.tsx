// src/pages/AdminChat/ConversationList.tsx
import React, { useState } from "react";
import { User, Image as ImageIcon, Search, X } from "lucide-react";

// INTERFACES (Giữ nguyên không đổi)
export interface TenantInfo {
  id?: string;
  fullName?: string;
  avatar?: string;
  roomNumber?: string;
}

export interface LastMessageInfo {
  id?: string;
  senderId?: string;
  senderRole?: "Admin" | "Tenant";
  content?: string;
  type?: "Text" | "Image";
  createdAt?: string;
}

export interface ConversationItem {
  conversationId: string;
  tenant?: TenantInfo;
  lastMessage?: LastMessageInfo;
  unreadCount: number;
}

interface ConversationListProps {
  conversations: ConversationItem[];
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
  conversations,
  selectedTenantId,
  onlineUserIds,
  onSelect,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>("");

  // SỬA TẠI ĐÂY: Loại bỏ các ID trùng lặp trước khi filter tìm kiếm
  const uniqueConversations = conversations.filter(
    (conv, index, self) =>
      self.findIndex((c) => c.conversationId === conv.conversationId) === index
  );

  // LỌC DANH SÁCH THEO TÊN HOẶC SỐ PHÒNG (Dựa trên mảng uniqueConversations đã sạch)
  const filteredConversations = uniqueConversations.filter((conv) => {
    const fullName = conv.tenant?.fullName?.toLowerCase() || "";
    const roomNumber = conv.tenant?.roomNumber?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || roomNumber.includes(search);
  });

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 w-full max-w-sm">
      {/* Header tiêu đề */}
      <div className="p-4 border-b border-gray-100 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800 tracking-tight">Tin nhắn</h1>
          <span className="text-xs bg-blue-50 text-blue-600 font-medium px-2.5 py-1 rounded-full">
            {uniqueConversations.length} cuộc hội thoại
          </span>
        </div>

        {/* THANH TÌM KIẾM */}
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            className="w-full h-9 pl-9 pr-8 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:bg-white transition-all placeholder:text-gray-400"
            placeholder="Tìm theo tên hoặc số phòng..."
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

      {/* Danh sách cuộc trò chuyện */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 space-y-2">
            <User className="w-8 h-8 opacity-50" />
            <span className="text-sm font-medium">
              {searchTerm ? "Không tìm thấy kết quả phù hợp" : "Chưa có cuộc trò chuyện nào"}
            </span>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const tenant = conv.tenant || {};
            const isSelected = selectedTenantId === conv.conversationId;
            const isOnline = onlineUserIds.includes(conv.conversationId);
            const hasUnread = conv.unreadCount > 0;

            return (
              <div
                key={conv.conversationId}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 select-none
                  ${isSelected
                    ? "bg-blue-50 text-blue-950 shadow-sm"
                    : "hover:bg-gray-50 active:bg-gray-150 text-gray-750"
                  }`}
                onClick={() => onSelect(conv.conversationId)}
              >
                {/* Vùng ảnh đại diện (Avatar) */}
                <div className="relative flex-shrink-0">
                  {tenant.avatar ? (
                    <img
                      className="w-12 h-12 rounded-full object-cover border border-gray-100 shadow-sm"
                      src={tenant.avatar}
                      alt={tenant.fullName || "Tenant"}
                    />
                  ) : (
                    <div className="w-12 h-12 flex items-center justify-center bg-gray-100 text-gray-400 rounded-full border border-gray-200">
                      <User className="w-6 h-6" />
                    </div>
                  )}

                  {/* Chấm trạng thái Online */}
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 flex h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-white">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    </span>
                  )}
                </div>

                {/* Nội dung tin nhắn tóm tắt */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`text-[15px] truncate ${hasUnread ? "font-semibold text-gray-900" : "font-medium text-gray-800"}`}>
                        {tenant.fullName || "Người dùng đã xoá"}
                      </span>
                      {tenant.roomNumber && (
                        <span className="text-[11px] font-medium bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-md flex-shrink-0">
                          P.{tenant.roomNumber}
                        </span>
                      )}
                    </div>
                    <span className={`text-xs flex-shrink-0 ml-2 ${hasUnread ? "font-semibold text-blue-600" : "text-gray-400"}`}>
                      {formatTime(conv.lastMessage?.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className={`text-sm truncate ${hasUnread ? "font-semibold text-gray-900" : "text-gray-500"}`}>
                      {conv.lastMessage?.senderRole === "Admin" && (
                        <span className="text-gray-400 font-normal">Bạn: </span>
                      )}
                      {conv.lastMessage?.type === "Image" ? (
                        <span className="inline-flex items-center gap-1 text-blue-500 font-medium text-xs">
                          <ImageIcon className="w-3.5 h-3.5" /> [Hình ảnh]
                        </span>
                      ) : (
                        conv.lastMessage?.content || <span className="italic text-gray-300 text-xs">Chưa có tin nhắn</span>
                      )}
                    </p>

                    {/* Badge số tin nhắn chưa đọc */}
                    {hasUnread && (
                      <span className="flex items-center justify-center min-w-5 h-5 px-1.5 ml-2 text-[11px] font-bold text-white bg-blue-600 rounded-full animate-fade-in shadow-sm">
                        {conv.unreadCount}
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
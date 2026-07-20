// src/pages/AdminChat/ChatWindow.tsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { MessageSquare, Image as ImageIcon, Send, Loader2, X, ArrowLeft, RefreshCw } from "lucide-react";
import {
  getMessagesWithTenant,
  sendMessageApi,
  uploadChatImage,
} from "../../api/chatApi";
import type { MessageItem } from "../../api/chatApi";
import { getAdminSocket } from "../../socket/adminSocket";

// INTERFACES
interface TenantData {
  id?: string;
  fullName?: string;
  avatar?: string;
  roomNumber?: string;
}

interface ChatWindowProps {
  tenant: TenantData | null;
  tenantId: string | null;
  onMessageSent?: () => void;
  onCloseChat?: () => void; // Giữ lại prop này cho nút điều hướng ArrowLeft trên mobile
}

interface ChatMessage extends MessageItem {
  _id?: string;
  conversationId?: string;
  isRead?: boolean;
}

interface TypingEventData {
  isTyping: boolean;
  senderRole: "Admin" | "Tenant";
}

interface MessagesReadEventData {
  conversationId: string;
  readBy: "Admin" | "Tenant";
}

// HELPER FORMAT TIME
const formatMsgTime = (dateStr: string): string =>
  new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

// HELPER GROUP BY DATE
const getGroupDateLabel = (dateStr: string): string => {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) {
    return "Hôm nay";
  } else if (d.toDateString() === yesterday.toDateString()) {
    return "Hôm qua";
  } else {
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }
};

const ChatWindow: React.FC<ChatWindowProps> = ({ tenant, tenantId, onMessageSent, onCloseChat }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [text, setText] = useState<string>("");
  const [sending, setSending] = useState<boolean>(false);
  const [tenantTyping, setTenantTyping] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);

  // Xem trước hình ảnh trước khi gửi
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");

  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const socket = getAdminSocket();

  // Hàm load tin nhắn dùng chung cho cả useEffect lẫn nút Tải lại
  const fetchInitialMessages = useCallback((id: string) => {
    setMessages([]);
    setPage(1);
    setHasMore(true);
    setLoading(true);
    setSelectedImage(null);
    setImagePreviewUrl("");

    socket.emit("join_room", id);

    getMessagesWithTenant(id, 1, 30)
      .then(async (res) => {
        if (res.ok) {
          const resData = await res.json();
          const fetchedMessages: ChatMessage[] = resData.data || resData || [];
          setMessages(fetchedMessages);
          socket.emit("mark_read", { tenantId: id });
        } else {
          console.error("Lỗi tải tin nhắn từ server");
        }
      })
      .catch((err) => {
        console.error("Lỗi tải tin nhắn:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [socket]);

  // Tải lịch sử chat khi đổi Tenant
  useEffect(() => {
    if (!tenantId) return;

    fetchInitialMessages(tenantId);

    return () => {
      socket.emit("leave_room", tenantId);
    };
  }, [tenantId, fetchInitialMessages, socket]);

  // Lắng nghe socket realtime
  useEffect(() => {
    if (!tenantId) return;

    const handleNewMessage = (msg: ChatMessage) => {
      if (msg.conversationId !== tenantId) return;
      setMessages((prev) => [...prev, msg]);
      if (msg.senderRole === "Tenant") {
        socket.emit("mark_read", { tenantId });
      }
      onMessageSent?.();
    };

    const handleTyping = ({ isTyping, senderRole }: TypingEventData) => {
      if (senderRole === "Tenant") setTenantTyping(isTyping);
    };

    const handleMessagesRead = ({ conversationId, readBy }: MessagesReadEventData) => {
      if (conversationId !== tenantId || readBy !== "Tenant") return;
      setMessages((prev) =>
        prev.map((m) =>
          m.senderRole === "Admin" ? { ...m, isRead: true } : m
        )
      );
    };

    socket.on("new_message", handleNewMessage);
    socket.on("typing", handleTyping);
    socket.on("messages_read", handleMessagesRead);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("typing", handleTyping);
      socket.off("messages_read", handleMessagesRead);
    };
  }, [tenantId, socket, onMessageSent]);

  // Cuộn xuống cuối khi có tin nhắn mới hoặc đang preview ảnh
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, tenantTyping, imagePreviewUrl]);

  const loadMore = useCallback(() => {
    if (!hasMore || loading || !tenantId) return;
    const nextPage = page + 1;
    
    getMessagesWithTenant(tenantId, nextPage, 30).then(async (res) => {
      if (res.ok) {
        const resData = await res.json();
        const older: ChatMessage[] = resData.data || resData || [];
        if (older.length === 0) {
          setHasMore(false);
          return;
        }
        setMessages((prev) => [...older, ...prev]);
        setPage(nextPage);
      }
    });
  }, [tenantId, page, hasMore, loading]);

  const handleSend = async () => {
    const content = text.trim();
    if ((!content && !selectedImage) || sending || !tenantId) return;

    setSending(true);
    try {
      let finalImageUrl = "";
      
      if (selectedImage) {
        const uploadRes = await uploadChatImage(selectedImage);
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          finalImageUrl = uploadData.data?.imageUrl || uploadData.imageUrl;
        } else {
          throw new Error("Upload ảnh thất bại");
        }
      }

      let response;
      if (finalImageUrl) {
        response = await sendMessageApi({
          tenantId,
          content: content || "[Hình ảnh]",
          type: "Image",
          imageUrl: finalImageUrl,
        });
      } else {
        response = await sendMessageApi({ tenantId, content, type: "Text" });
      }

      if (response.ok) {
        setText("");
        setSelectedImage(null);
        setImagePreviewUrl("");
        socket.emit("typing", { tenantId, isTyping: false });
      } else {
        throw new Error("Gửi tin không thành công");
      }
    } catch (err) {
      console.error(err);
      alert("Gửi tin nhắn thất bại, thử lại nhé.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTypingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    if (tenantId) {
      socket.emit("typing", { tenantId, isTyping: true });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("typing", { tenantId, isTyping: false });
      }, 1500);
    }
  };

  const handlePickImage = () => fileInputRef.current?.click();

  const handleImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setSelectedImage(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreviewUrl(previewUrl);
  };

  const handleRemoveImagePreview = () => {
    setSelectedImage(null);
    setImagePreviewUrl("");
  };

  const handleRefreshChat = () => {
    if (tenantId) fetchInitialMessages(tenantId);
  };

  // TRẠNG THÁI TRỐNG KHI CHƯA CHỌN CĂN HỘ/NGƯỜI THUÊ KHÁCH HÀNG
  if (!tenantId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-400 p-6 h-full max-h-screen">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center max-w-sm text-center">
          <div className="bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-4 p-4">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h3 className="text-gray-800 font-semibold text-lg mb-1">Cửa sổ trò chuyện</h3>
          <p className="text-sm text-gray-400">
            Chọn một khách thuê từ danh sách bên trái để xem lịch sử và bắt đầu trao đổi thông tin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full h-screen bg-white overflow-hidden border border-gray-100 rounded-r-xl">
      
      {/* HEADER CỬA SỔ CHAT */}
      <div className="h-16 bg-white border-b border-gray-100 px-6 flex items-center justify-between flex-shrink-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <button 
            onClick={onCloseChat}
            className="text-gray-400 hover:text-gray-600 md:hidden p-1 mr-1 rounded-lg hover:bg-gray-50 active:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="relative">
            {tenant?.avatar ? (
              <img
                className="w-8 h-8 rounded-full object-cover"
                src={tenant.avatar}
                alt={tenant.fullName}
              />
            ) : (
              <div className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 font-semibold rounded-full text-sm">
                {tenant?.fullName?.charAt(0).toUpperCase() || "N"}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800 truncate text-[15px]">
                {tenant?.fullName || "Người dùng"}
              </span>
              {tenant?.roomNumber && (
                <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                  P.{tenant.roomNumber}
                </span>
              )}
            </div>
            {tenantTyping && (
              <div className="flex items-center gap-1 text-xs text-green-500 font-medium mt-0.5">
                <span>Đang nhập</span>
                <span className="flex gap-0.5 items-center justify-center h-2 ml-0.5">
                  <span className="w-1 h-1 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1 h-1 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1 h-1 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </span>
              </div>
            )}
          </div>
        </div>

        {/* CHỈ GIỮ LẠI NÚT ĐIỀU HƯỚNG TẢI LẠI TRÊN TIÊU ĐỀ */}
        <div className="flex items-center gap-2">
          <button 
            onClick={handleRefreshChat}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors" 
            title="Tải lại tin nhắn"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* THÂN CỬA SỔ CHAT (DANH SÁCH TIN NHẮN) */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-scrollbar flex flex-col bg-gray-50/40">
        {hasMore && !loading && messages.length > 0 && (
          <button 
            className="self-center text-xs font-medium text-blue-600 bg-white hover:bg-blue-50 border border-gray-200 px-3 py-1.5 rounded-full transition-colors my-2 shadow-xs" 
            onClick={loadMore}
          >
            Tải tin nhắn cũ hơn
          </button>
        )}

        {loading && (
          <div className="flex-1 flex items-center justify-center text-gray-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            <span className="text-sm">Đang tải tin nhắn...</span>
          </div>
        )}

        {!loading &&
          messages.map((msg, index) => {
            const isAdmin = msg.senderRole === "Admin";
            
            const currentLabel = getGroupDateLabel(msg.createdAt);
            const prevLabel = index > 0 ? getGroupDateLabel(messages[index - 1].createdAt) : null;
            const showDateDivider = currentLabel !== prevLabel;

            return (
              <React.Fragment key={msg._id || msg.id}>
                {showDateDivider && (
                  <div className="flex items-center justify-center my-6">
                    <div className="h-[1px] bg-gray-200 w-full max-w-[150px]"></div>
                    <span className="mx-4 text-xs font-normal text-gray-400 bg-gray-100 px-3 py-1 rounded-full border border-gray-200/50">
                      {currentLabel}
                    </span>
                    <div className="h-[1px] bg-gray-200 w-full max-w-[150px]"></div>
                  </div>
                )}

                <div className={`flex w-full ${isAdmin ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] flex flex-col ${isAdmin ? "items-end" : "items-start"}`}>
                    {msg.type === "Image" ? (
                      <div className="relative">
                        <img
                          src={msg.imageUrl}
                          alt="Ảnh gửi kèm"
                          className="rounded-2xl max-w-full max-h-72 object-cover shadow-xs"
                        />
                      </div>
                    ) : (
                      <div
                        className={`px-4 py-2.5 text-[14px] leading-relaxed shadow-xs rounded-2xl
                          ${isAdmin 
                            ? "bg-[#3B82F6] text-white rounded-tr-sm" 
                            : "bg-[#EFF6FF] text-gray-800 rounded-tl-sm"
                          }`}
                      >
                        <span className="whitespace-pre-wrap break-words">{msg.content}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1.5 mt-1 px-1 text-[11px] text-gray-400 select-none">
                      <span>{formatMsgTime(msg.createdAt)}</span>
                      {isAdmin && (
                        <>
                          <span>·</span>
                          {msg.isRead ? (
                            <span className="text-[#3B82F6] font-medium flex items-center gap-0.5">
                              Đã xem
                            </span>
                          ) : (
                            <span className="text-gray-400 flex items-center gap-0.5">
                              Đã gửi
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        <div ref={bottomRef} />
      </div>

      {/* THANH GÕ VÀ GỬI TIN NHẮN */}
      <div className="p-4 bg-white border-t border-gray-100 flex flex-col gap-2 flex-shrink-0">
        {imagePreviewUrl && (
          <div className="relative inline-block self-start mb-1 bg-gray-50 p-2 rounded-xl border border-gray-200">
            <img 
              src={imagePreviewUrl} 
              alt="Preview" 
              className="w-20 h-20 object-cover rounded-lg"
            />
            <button
              onClick={handleRemoveImagePreview}
              className="absolute -top-1.5 -right-1.5 p-1 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-colors shadow-sm"
              title="Xóa ảnh"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-colors disabled:opacity-50"
            onClick={handlePickImage}
            disabled={sending}
            title="Gửi hình ảnh"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleImageSelected}
          />
          
          <input
            type="text"
            className="flex-1 h-10 px-4 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:border-blue-400 transition-all placeholder:text-gray-300"
            placeholder="Nhập tin nhắn..."
            value={text}
            onChange={handleTypingChange}
            onKeyDown={handleKeyDown}
            disabled={sending}
          />

          <button
            className={`w-10 h-10 rounded-full transition-all flex items-center justify-center shrink-0
              ${(text.trim() || selectedImage) && !sending
                ? "bg-[#3B82F6] text-white hover:bg-blue-600 active:scale-95" 
                : "bg-gray-100 text-gray-300 cursor-not-allowed"
              }`}
            onClick={handleSend}
            disabled={sending || (!text.trim() && !selectedImage)}
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Send className="w-4 h-4 fill-current rotate-45 transform -translate-x-0.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
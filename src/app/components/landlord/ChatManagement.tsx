import { useState, useEffect, useRef } from 'react';
import { Search, Send, Image as ImageIcon, Check, CheckCheck, Loader2, ArrowLeft, User, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { fetchApi } from '../../utils/api';

// INTERFACES
interface Message {
    id?: string;
    senderId?: string;
    senderRole: 'Admin' | 'Tenant' | string;
    receiverId?: string;
    conversationId: string;
    content: string | null;
    type: 'Text' | 'Image' | string;
    imageUrl?: string | null;
    isRead: boolean;
    createdAt: string;
}

interface UserOption {
    id: string;
    name: string;
    avatarUrl?: string;
    lastMessage?: Message | null;
    unreadCount?: number;
}

export default function ChatManagement() {
    const { user } = useAuth();
    const CURRENT_USER_ID = user?.id || "";

    const [users, setUsers] = useState<UserOption[]>([]);

    const [activeUser, setActiveUser] = useState<UserOption | null>(() => {
        const saved = localStorage.getItem('active_chat_user_id');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch {
                return null;
            }
        }
        return null;
    });

    const [messages, setMessages] = useState<Message[]>([]);
    const [searchUser, setSearchUser] = useState('');

    // States gửi tin nhắn
    const [inputText, setInputText] = useState('');
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Loading states
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isSending, setIsSending] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = (behavior: 'smooth' | 'auto' = 'smooth') => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior });
        }
    };

    useEffect(() => {
        if (messages.length > 0) {
            const timer = setTimeout(() => {
                scrollToBottom('smooth');
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [messages]);

    // Tải danh sách người dùng & kiểm tra tin nhắn cuối cùng
    const fetchUsersAndChatStatus = async () => {
        try {
            setIsLoadingUsers(true);
            const res = await fetchApi('/Users');
            if (res.ok) {
                const userData: UserOption[] = await res.json();
                const filtered = userData.filter((u) => u.id !== CURRENT_USER_ID);

                const enrichedUsers = await Promise.all(
                    filtered.map(async (u) => {
                        try {
                            const msgRes = await fetchApi(`/Message/conversation/${u.id}?page=1&pageSize=1`);
                            if (msgRes.ok) {
                                const chatData = await msgRes.json();
                                const history: Message[] = Array.isArray(chatData) ? chatData : (chatData?.items || []);

                                if (history.length > 0) {
                                    const lastMsg = history[0];
                                    const isUnread = lastMsg.senderRole !== 'Admin' && !lastMsg.isRead;
                                    return {
                                        ...u,
                                        lastMessage: lastMsg,
                                        unreadCount: isUnread ? 1 : 0
                                    };
                                }
                            }
                        } catch (e) {
                            console.error("Lỗi lấy trạng thái chat của user:", u.id, e);
                        }
                        return { ...u, lastMessage: null, unreadCount: 0 };
                    })
                );

                setUsers(enrichedUsers);

                // Cập nhật lại thông tin mới nhất của activeUser nếu nó đã tồn tại trong danh sách mới
                const savedData = localStorage.getItem('active_chat_user_id');
                if (savedData) {
                    const savedParsed = JSON.parse(savedData) as UserOption;
                    const latestActiveUser = enrichedUsers.find(u => u.id === savedParsed.id);
                    if (latestActiveUser) {
                        setActiveUser(latestActiveUser);
                    }
                }
            }
        } catch {
            toast.error('Không thể tải danh sách người dùng!');
        } finally {
            setIsLoadingUsers(false);
        }
    };

    useEffect(() => {
        fetchUsersAndChatStatus();
    }, []);

    // Tải tin nhắn của hội thoại
    const fetchConversation = async (conversationId: string) => {
        try {
            setIsLoadingMessages(true);
            const res = await fetchApi(`/Message/conversation/${conversationId}?page=1&pageSize=50`);
            if (res.ok) {
                clearImage();
                setInputText('');
                const chatHistory = await res.json();
                let rawMessages: Message[] = [];
                if (Array.isArray(chatHistory)) {
                    rawMessages = chatHistory;
                } else if (chatHistory && Array.isArray(chatHistory.items)) {
                    rawMessages = chatHistory.items;
                }

                const sortedMessages = [...rawMessages].sort(
                    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                );

                setMessages(sortedMessages);

                await fetchApi(`/Message/mark-all-read/${conversationId}`, { method: 'PUT' });

                setUsers(prevUsers =>
                    prevUsers.map(u => u.id === conversationId ? { ...u, unreadCount: 0, lastMessage: u.lastMessage ? { ...u.lastMessage, isRead: true } : null } : u)
                );
            }
        } catch {
            toast.error('Lỗi khi tải lịch sử nhắn tin!');
        } finally {
            setIsLoadingMessages(false);
            setTimeout(() => scrollToBottom('auto'), 50);
        }
    };

    // Chỉ theo dõi `activeUser?.id` thay vì toàn bộ object để tránh re-render lặp vô tận khi object đổi tham chiếu
    useEffect(() => {
        if (activeUser?.id) {
            localStorage.setItem('active_chat_user_id', JSON.stringify(activeUser));
            fetchConversation(activeUser.id);
        } else {
            setMessages([]);
        }
        return () => {
            localStorage.removeItem('active_chat_user_id');
        };
    }, [activeUser?.id]);

    // Hàm xử lý khi bấm nút đóng/quay lại cuộc trò chuyện
    const handleCloseChat = () => {
        setActiveUser(null);
        localStorage.removeItem('active_chat_user_id');
    };

    // Chọn ảnh để gửi
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const clearImage = () => {
        setSelectedImage(null);
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Gửi tin nhắn dùng FormData
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeUser || (!inputText.trim() && !selectedImage) || isSending) return;

        try {
            setIsSending(true);
            const formData = new FormData();

            formData.append('TenantId', activeUser.id);
            formData.append('Content', inputText.trim());
            formData.append('Type', selectedImage ? 'Image' : 'Text');

            if (selectedImage) {
                formData.append('Image', selectedImage);
            }

            const response = await fetchApi('/Message/send', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                setInputText('');
                clearImage();
                await fetchConversation(activeUser.id);
            } else {
                toast.error('Gửi tin nhắn thất bại!');
            }
        } catch {
            toast.error('Lỗi kết nối máy chủ khi gửi tin nhắn!');
        } finally {
            setIsSending(false);
        }
    };

    // Tải ảnh trực tiếp về máy
    const handleDownloadImage = async (imgUrl: string, filename = 'tai-anh-chat.jpg') => {
        try {
            const response = await fetch(imgUrl);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
            toast.success("Tải ảnh xuống thành công!");
        } catch {
            window.open(imgUrl, '_blank');
        }
    };

    // Nhãn chia nhóm ngày tháng
    const getDateLabel = (dateStr: string): string => {
        const d = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        const isSameDay = (d1: Date, d2: Date) =>
            d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();

        if (isSameDay(d, today)) {
            return "Hôm nay";
        } else if (isSameDay(d, yesterday)) {
            return "Hôm qua";
        } else {
            return d.toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            });
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchUser.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col">
            <div className="mb-4">
                <h1 className="text-2xl font-semibold mb-1">Tin nhắn & Hỗ trợ</h1>
                <p className="text-gray-600">Trò chuyện trực tiếp với khách thuê phòng và xử lý yêu cầu</p>
            </div>

            <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden flex">

                {/* CỘT TRÁI: DANH SÁCH HỘI THOẠI */}
                <div className={`w-full md:w-80 border-r border-gray-200 flex flex-col ${activeUser ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 border-b border-gray-100">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm khách thuê..."
                                value={searchUser}
                                onChange={(e) => setSearchUser(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                        {isLoadingUsers ? (
                            <div className="flex items-center justify-center py-10">
                                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <p className="text-center text-gray-400 text-xs py-10">Không tìm thấy khách thuê</p>
                        ) : (
                            filteredUsers.map((u) => {
                                const hasUnread = (u.unreadCount ?? 0) > 0;
                                return (
                                    <button
                                        key={u.id}
                                        onClick={() => setActiveUser(u)}
                                        className={`w-full p-4 flex items-center gap-3 hover:bg-blue-100 transition-colors text-left relative ${activeUser?.id === u.id ? 'bg-blue-100/70' : ''
                                            }`}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 relative">
                                            {u.avatarUrl ? (
                                                <img src={u.avatarUrl} alt={u.name} className="w-10 h-10 rounded-full object-cover" />
                                            ) : (
                                                <User className="w-5 h-5" />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h4 className={`text-sm truncate ${hasUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-700'
                                                }`}>
                                                {u.name}
                                            </h4>
                                            <p className={`text-xs truncate mt-0.5 ${hasUnread ? 'font-semibold text-blue-600' : 'text-gray-400'
                                                }`}>
                                                {hasUnread ? 'Có tin nhắn mới chưa xem' : 'Nhấn để bắt đầu trò chuyện'}
                                            </p>
                                        </div>

                                        {hasUnread && (
                                            <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0 absolute right-4 top-1/2 -translate-y-1/2 shadow-sm animate-pulse" />
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* CỘT PHẢI: KHUNG CHAT CHI TIẾT */}
                <div className={`flex-1 flex flex-col bg-gray-50 ${!activeUser ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
                    {activeUser ? (
                        <>
                            {/* Header khung chat */}
                            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
                                <button onClick={handleCloseChat} className="p-1 hover:bg-gray-100 rounded-lg">
                                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                                </button>
                                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                    {activeUser.name ? activeUser.name.charAt(0).toUpperCase() : "?"}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-sm text-gray-900">{activeUser.name}</h3>
                                </div>
                            </div>

                            {/* Lịch sử tin nhắn */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {isLoadingMessages ? (
                                    <div className="flex items-center justify-center h-full">
                                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                        <p className="text-sm">Chưa có tin nhắn nào</p>
                                        <p className="text-xs">Hãy gửi tin nhắn đầu tiên để bắt đầu hội thoại!</p>
                                    </div>
                                ) : (
                                    messages.map((msg, index) => {
                                        const messageId = msg.id || `msg-${index}`;
                                        const isMe = msg.senderRole === 'Admin' || msg.senderId === CURRENT_USER_ID;

                                        const currentMsgDate = new Date(msg.createdAt).toDateString();
                                        const prevMsgDate = index > 0 ? new Date(messages[index - 1].createdAt).toDateString() : null;
                                        const showDateSeparator = currentMsgDate !== prevMsgDate;

                                        return (
                                            <div key={messageId} className="space-y-4">
                                                {showDateSeparator && (
                                                    <div className="flex items-center justify-center my-6">
                                                        <div className="h-[1px] bg-gray-200 flex-grow max-w-[15%] md:max-w-[25%]"></div>
                                                        <span className="mx-4 text-xs font-medium text-gray-400 bg-gray-100 px-3 py-1 rounded-full shadow-sm">
                                                            {getDateLabel(msg.createdAt)}
                                                        </span>
                                                        <div className="h-[1px] bg-gray-200 flex-grow max-w-[15%] md:max-w-[25%]"></div>
                                                    </div>
                                                )}

                                                <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                        {/* So sánh không phân biệt hoa thường bằng toLowerCase() */}
                                                        {msg.type?.toLowerCase() === "image" && msg.imageUrl ? (

                                                            // Layout ảnh
                                                            <div className="max-w-[70%] flex flex-col group/img my-1">
                                                                <div className="relative rounded-2xl overflow-hidden border border-black/5 shadow-sm bg-gray-100">
                                                                    <img
                                                                        src={msg.imageUrl}
                                                                        alt="Hình ảnh trò chuyện"
                                                                        className="max-h-72 max-w-full object-cover block"
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleDownloadImage(msg.imageUrl!)}
                                                                        className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity"
                                                                        title="Lưu ảnh về máy"
                                                                    >
                                                                        <Download className="w-4 h-4" />
                                                                    </button>
                                                                </div>

                                                                {/* Thời gian dưới ảnh */}
                                                                <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-gray-400 px-1">
                                                                    <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                    {isMe && (
                                                                        <div className="flex items-center gap-0.5 ml-1">
                                                                            {msg.isRead ? (
                                                                                <CheckCheck className="w-3 h-3 text-blue-500 stroke-[2.5]" />
                                                                            ) : (
                                                                                <Check className="w-3 h-3 text-gray-400 stroke-[2.5]" />
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                        ) : (

                                                            // Layout chữ
                                                            <div className={`flex flex-col max-w-[70%] my-1 ${isMe ? 'items-end' : 'items-start'}`}>
                                                                <div className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm min-w-[60px] w-auto inline-block ${isMe ? 'bg-blue-500 text-white rounded-br-none' : 'bg-white text-gray-900 rounded-bl-none border border-gray-100'
                                                                    }`}>
                                                                    {/* Text hiển thị */}
                                                                    {msg.content && <p className="leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>}

                                                                    {/* Phần thời gian nằm */}
                                                                    <div className={`flex items-center justify-end gap-1 mt-1.5 text-[10px] select-none ${isMe ? 'text-blue-100/80' : 'text-gray-400'
                                                                        }`}>
                                                                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>

                                                                        {isMe && (
                                                                            <div className="flex items-center gap-0.5 ml-0.5">
                                                                                {msg.isRead ? (
                                                                                    <CheckCheck className={`w-3 h-3 stroke-[2.5] ${isMe ? 'text-cyan-200' : 'text-blue-500'}`} />
                                                                                ) : (
                                                                                    <Check className={`w-3 h-3 stroke-[2.5] ${isMe ? 'text-blue-200' : 'text-gray-400'}`} />
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Giao diện xem trước ảnh */}
                            {imagePreview && (
                                <div className="px-4 py-2 bg-white border-t border-gray-100 flex items-center gap-3">
                                    <div className="relative w-16 h-16 rounded-lg overflow-hidden border">
                                        <img src={imagePreview} alt="Xem trước" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={clearImage}
                                            className="absolute top-0 right-0 bg-black/70 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-bl"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <span className="text-xs text-gray-500">Sẵn sàng gửi file ảnh...</span>
                                </div>
                            )}

                            {/* Ô nhập và gửi tin nhắn */}
                            <form onSubmit={handleSendMessage} className="bg-white border-t border-gray-200 p-3 flex items-center gap-2">
                                <input
                                    type="file"
                                    accept="image/*"
                                    ref={fileInputRef}
                                    onChange={handleImageChange}
                                    className="hidden"
                                />

                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-50 rounded-full transition-colors shrink-0"
                                    title="Gửi kèm hình ảnh"
                                >
                                    <ImageIcon className="w-5 h-5" />
                                </button>

                                <input
                                    type="text"
                                    placeholder="Nhập tin nhắn..."
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    className="flex-1 px-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />

                                <button
                                    type="submit"
                                    disabled={isSending || (!inputText.trim() && !selectedImage)}
                                    className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors shrink-0"
                                >
                                    {isSending ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="text-center text-gray-400 p-6">
                            <User className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                            <h3 className="font-semibold text-gray-700 text-sm">Chưa chọn cuộc trò chuyện</h3>
                            <p className="text-xs text-gray-500 mt-1">Chọn một khách thuê ở danh sách bên trái để bắt đầu trao đổi.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
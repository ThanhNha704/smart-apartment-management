import { useState, useEffect, useRef } from 'react';
import { Search, Send, Image as ImageIcon, CheckCheck, Loader2, ArrowLeft, User } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { fetchApi } from '../../utils/api';

// INTERFACES
interface Message {
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    type: number; // 0: Text, 1: Image, ...
    imageUrl?: string;
    isRead: boolean;
    createdAt: string;
}

interface UserOption {
    id: string;
    name: string;
    avatarUrl?: string;
}

export default function ChatManagement() {
    const { user } = useAuth();
    const CURRENT_USER_ID = user?.id || ""; // Lấy ID động từ User đăng nhập thực tế

    const [users, setUsers] = useState<UserOption[]>([]);
    const [activeUser, setActiveUser] = useState<UserOption | null>(null);
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

    // Cuộn xuống đáy hòm thư khi có tin nhắn mới
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Tải danh sách người dùng để tạo danh sách hội thoại
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setIsLoadingUsers(true);
                const res = await fetchApi('/Users');
                if (res.ok) {
                    const data = await res.json();
                    // Lọc bỏ tài khoản của chính mình khỏi danh sách chat nếu có trùng ID
                    setUsers(data.filter((u: UserOption) => u.id !== CURRENT_USER_ID));
                }
            } catch {
                toast.error('Không thể tải danh sách người dùng!');
            } finally {
                setIsLoadingUsers(false);
            }
        };
        fetchUsers();
    }, []);

    // Tải tin nhắn của hội thoại đang chọn
    const fetchConversation = async (conversationId: string) => {
        try {
            setIsLoadingMessages(true);
            const res = await fetchApi(`/Message/conversation/${conversationId}?page=1&pageSize=50`);
            if (res.ok) {
                const chatHistory = await res.json();

                if (Array.isArray(chatHistory)) {
                    setMessages(chatHistory);
                } else if (chatHistory && Array.isArray(chatHistory.items)) {
                    setMessages(chatHistory.items);
                }

                await fetchApi(`/Message/mark-all-read/${conversationId}`, { method: 'PUT' });
            }
        } catch {
            toast.error('Lỗi khi tải lịch sử nhắn tin!');
        } finally {
            setIsLoadingMessages(false);
        }
    };

    useEffect(() => {
        if (activeUser) {
            fetchConversation(activeUser.id);
        } else {
            setMessages([]);
        }
    }, [activeUser]);

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

    // POST: Gửi tin nhắn dùng FormData (multipart/form-data) chuẩn Swagger
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeUser || (!inputText.trim() && !selectedImage) || isSending) return;

        try {
            setIsSending(true);
            const formData = new FormData();
            formData.append('SenderId', CURRENT_USER_ID);
            formData.append('ReceiverId', activeUser.id);
            formData.append('Content', inputText.trim());
            // Quy ước Type: 0 là chữ, 1 là có ảnh đi kèm
            formData.append('Type', selectedImage ? '1' : '0');
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

    // Lọc danh sách người dùng theo thanh tìm kiếm
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
                            filteredUsers.map((user) => (
                                <button
                                    key={user.id}
                                    onClick={() => setActiveUser(user)}
                                    className={`w-full p-4 flex items-center gap-3 hover:bg-blue-100 transition-colors text-left ${activeUser?.id === user.id ? 'bg-blue-50' : ''
                                        }`}
                                >
                                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                        {user.avatarUrl ? (
                                            <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                                        ) : (
                                            <User className="w-5 h-5" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-sm text-gray-900 truncate">{user.name}</h4>
                                        <p className="text-xs text-gray-500 truncate">Nhấn để bắt đầu trò chuyện</p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* CỘT PHẢI: KHUNG CHÁT CHI TIẾT */}
                <div className={`flex-1 flex flex-col bg-gray-50 ${!activeUser ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
                    {activeUser ? (
                        <>
                            {/* Header khung chat */}
                            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
                                <button onClick={() => setActiveUser(null)} className="md:hidden p-1 hover:bg-gray-100 rounded-lg">
                                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                                </button>
                                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                    {activeUser.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-sm text-gray-900">{activeUser.name}</h3>
                                    <p className="text-[10px] text-green-600 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span> Đang trực tuyến
                                    </p>
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
                                    messages.map((msg) => {
                                        const isMe = msg.senderId === CURRENT_USER_ID;
                                        return (
                                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-900 rounded-bl-none border border-gray-100'
                                                    }`}>
                                                    {msg.content && <p className="leading-relaxed break-words">{msg.content}</p>}

                                                    {/* Hiển thị ảnh nếu có */}
                                                    {msg.type === 1 && msg.imageUrl && (
                                                        <img src={msg.imageUrl} alt="Gửi kèm" className="mt-2 rounded-lg max-h-60 object-cover" />
                                                    )}

                                                    <div className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        {isMe && <CheckCheck className="w-3.5 h-3.5 text-blue-100" />}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Giao diện xem trước ảnh chọn gửi kèm */}
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
                                    className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors shrink-0"
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
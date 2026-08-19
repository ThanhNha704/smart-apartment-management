import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Loader2, Coins, X, ShieldAlert } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { toast } from 'sonner';
import { fetchApi, parseApiError } from '../../api/fetchApi';

interface ItemFee {
    id: string;
    name: string;
    price: number;
    unit: string;
    type: string; // mandatory, wifi, parking
    isActive: boolean;
    createdAt: string;
}

const blankFormData = {
    name: '',
    price: 0,
    unit: 'tháng',
    type: '',
    isActive: true
};

export default function ItemFeeManagement() {
    const [fees, setFees] = useState<ItemFee[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Dialog state
    const [isOpen, setIsOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedFee, setSelectedFee] = useState<ItemFee | null>(null);

    // Form state
    const [formData, setFormData] = useState(blankFormData);
    const [customTypeVal, setCustomTypeVal] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchFees = async () => {
        try {
            setIsLoading(true);
            const res = await fetchApi('/ItemFee');
            if (res.ok) {
                setFees(await res.json());
            }
        } catch {
            toast.error('Lỗi khi tải danh sách khoản phí!');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchFees();
    }, []);

    const handleOpenAdd = () => {
        setSelectedFee(null);
        setFormData(blankFormData);
        setCustomTypeVal('');
        setIsOpen(true);
    };

    const handleOpenEdit = (fee: ItemFee) => {
        setSelectedFee(fee);
        const isPreset = ['mandatory', 'wifi', 'parking'].includes(fee.type);
        setFormData({
            name: fee.name,
            price: fee.price,
            unit: fee.unit,
            type: isPreset ? fee.type : 'custom',
            isActive: fee.isActive
        });
        setCustomTypeVal(isPreset ? '' : fee.type);
        setIsOpen(true);
    };

    const handleOpenDelete = (fee: ItemFee) => {
        setSelectedFee(fee);
        setIsDeleteOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim() || formData.price < 0 || isSubmitting) return;

        const finalType = formData.type === 'custom' ? customTypeVal.trim() : formData.type;
        if (!finalType) {
            toast.error('Vui lòng điền hoặc chọn loại phí áp dụng!');
            return;
        }

        try {
            setIsSubmitting(true);
            const isEdit = !!selectedFee;
            const url = isEdit ? `/ItemFee/${selectedFee!.id}` : '/ItemFee';
            const method = isEdit ? 'PUT' : 'POST';

            const res = await fetchApi(url, {
                method,
                body: JSON.stringify({
                    ...formData,
                    type: finalType
                })
            });

            if (res.ok) {
                toast.success(isEdit ? 'Cập nhật khoản phí thành công!' : 'Tạo khoản phí mới thành công!');
                setIsOpen(false);
                setFormData(blankFormData);
                setSelectedFee(null);
                fetchFees();
            } else {
                const errMsg = await parseApiError(res, 'Lỗi khi lưu dữ liệu!');
                toast.error(errMsg);
            }
        } catch {
            toast.error('Lỗi kết nối máy chủ!');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedFee) return;

        try {
            setIsSubmitting(true);
            const res = await fetchApi(`/ItemFee/${selectedFee.id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                toast.success('Đã xóa khoản phí thành công!');
                setIsDeleteOpen(false);
                setSelectedFee(null);
                fetchFees();
            } else {
                const errMsg = await parseApiError(res, 'Xóa khoản phí thất bại!');
                toast.error(errMsg);
            }
        } catch {
            toast.error('Lỗi kết nối máy chủ!');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredFees = fees.filter(fee =>
        fee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fee.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getTypeBadge = (type: string) => {
        return (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-gray-50 text-gray-700 border-gray-200">
                {type}
            </span>
        );
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Cấu hình các khoản phí phụ</h1>
                    <p className="text-gray-500">Quản lý định mức đơn giá các dịch vụ và phụ phí trong tòa nhà</p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-black hover:bg-gray-800 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Thêm khoản phí
                </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 p-4 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm khoản phí phụ..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black text-sm bg-gray-50/50 focus:bg-white"
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-2 text-gray-500">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                            <p className="text-sm">Đang tải danh mục khoản phí...</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium">
                                <tr>
                                    <th className="px-6 py-3 text-left">Tên khoản phí</th>
                                    <th className="px-6 py-3 text-left">Số tiền (đơn giá)</th>
                                    <th className="px-6 py-3 text-left">Đơn vị</th>
                                    <th className="px-6 py-3 text-left">Loại áp dụng</th>
                                    <th className="px-6 py-3 text-center">Trạng thái</th>
                                    <th className="px-6 py-3 text-center">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 text-gray-700">
                                {filteredFees.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-400">Không có khoản phí nào phù hợp.</td>
                                    </tr>
                                ) : (
                                    filteredFees.map((fee) => (
                                        <tr key={fee.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 font-semibold text-gray-900">{fee.name}</td>
                                            <td className="px-6 py-4 font-semibold text-blue-600">{(fee.price || 0).toLocaleString('vi-VN')} ₫</td>
                                            <td className="px-6 py-4 text-gray-500">/{fee.unit}</td>
                                            <td className="px-6 py-4">{getTypeBadge(fee.type)}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${fee.isActive
                                                        ? 'bg-green-50 text-green-700 border-green-200'
                                                        : 'bg-rose-50 text-rose-700 border-rose-200'
                                                    }`}>
                                                    {fee.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        onClick={() => handleOpenEdit(fee)}
                                                        className="p-1.5 hover:bg-gray-100 text-gray-600 hover:text-black rounded-lg transition-colors"
                                                        title="Sửa thông tin"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenDelete(fee)}
                                                        className="p-1.5 hover:bg-red-50 text-red-500 hover:text-red-700 rounded-lg transition-colors"
                                                        title="Xóa bỏ"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Dialog Thêm / Sửa */}
            <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/45 backdrop-blur-sm z-40 transition-all duration-200" />
                    <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto z-50 shadow-2xl border border-gray-100">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
                            <Dialog.Title className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Coins className="w-5 h-5 text-gray-500" />
                                {selectedFee ? 'Cập nhật khoản phí' : 'Thêm khoản phí mới'}
                            </Dialog.Title>
                            <Dialog.Close className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-900 transition-colors">
                                <X className="w-4 h-4" />
                            </Dialog.Close>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Tên khoản phí phụ <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ví dụ: Tiền thu rác sinh hoạt, Điện thang máy..."
                                    className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-black focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Đơn giá (₫) <span className="text-red-500">*</span></label>
                                    <input
                                        type="number"
                                        required
                                        min={0}
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                        className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-black focus:outline-none font-semibold text-blue-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Đơn vị tính <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.unit}
                                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                        placeholder="Ví dụ: tháng, người, chiếc..."
                                        className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-black focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Loại phí áp dụng <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    placeholder="Ví dụ: mandatory, wifi, parking..."
                                    className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-black focus:outline-none"
                                />
                            </div>

                            <div className="flex items-center gap-2 py-2 border-t border-b border-gray-50 my-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-4 h-4 rounded text-black border-gray-300 focus:ring-black"
                                />
                                <label htmlFor="isActive" className="text-sm font-medium text-gray-700 select-none cursor-pointer">
                                    Kích hoạt sử dụng khoản phí này ngay
                                </label>
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
                                <Dialog.Close type="button" className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                                    Hủy
                                </Dialog.Close>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !formData.name.trim()}
                                    className="px-5 py-2 bg-black hover:bg-gray-800 disabled:opacity-50 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
                                >
                                    {isSubmitting && <Loader2 className="w-4.5 h-4.5 animate-spin" />}
                                    Lưu thay đổi
                                </button>
                            </div>
                        </form>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            {/* Dialog Xóa */}
            <Dialog.Root open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/45 backdrop-blur-sm z-40" />
                    <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl p-6 w-full max-w-sm z-50 shadow-2xl border border-gray-100">
                        <div className="text-center space-y-3">
                            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto border border-red-200">
                                <ShieldAlert className="w-6 h-6" />
                            </div>
                            <Dialog.Title className="text-lg font-bold text-gray-900">Xóa khoản phí phụ</Dialog.Title>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                Bạn chắc chắn muốn xóa vĩnh viễn khoản phí <strong className="text-gray-900">{selectedFee?.name}</strong>? Hành động này không thể hoàn tác.
                            </p>
                        </div>
                        <div className="pt-5 border-t border-gray-50 flex gap-2 mt-4">
                            <Dialog.Close className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 text-center transition-colors">
                                Hủy
                            </Dialog.Close>
                            <button
                                onClick={handleDelete}
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors"
                            >
                                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                Xác nhận xóa
                            </button>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </div>
    );
}

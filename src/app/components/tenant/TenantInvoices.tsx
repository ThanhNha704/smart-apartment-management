import { useState } from 'react';
import { ArrowLeft, Download, QrCode, CheckCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router';
import * as Dialog from '@radix-ui/react-dialog';
import { toast } from 'sonner';

interface Invoice {
  id: string;
  month: string;
  totalAmount: number;
  rentAmount: number;
  electricityAmount: number;
  waterAmount: number;
  serviceAmount: number;
  status: 'paid' | 'pending';
  dueDate: string;
  paidDate?: string;
}

const invoices: Invoice[] = [
  {
    id: '1',
    month: 'Tháng 6/2026',
    totalAmount: 3450000,
    rentAmount: 2500000,
    electricityAmount: 480000,
    waterAmount: 140000,
    serviceAmount: 200000,
    status: 'pending',
    dueDate: '2026-06-05',
  },
  {
    id: '2',
    month: 'Tháng 5/2026',
    totalAmount: 3270000,
    rentAmount: 2500000,
    electricityAmount: 450000,
    waterAmount: 120000,
    serviceAmount: 200000,
    status: 'paid',
    dueDate: '2026-05-05',
    paidDate: '2026-05-03',
  },
  {
    id: '3',
    month: 'Tháng 4/2026',
    totalAmount: 3180000,
    rentAmount: 2500000,
    electricityAmount: 420000,
    waterAmount: 110000,
    serviceAmount: 200000,
    status: 'paid',
    dueDate: '2026-04-05',
    paidDate: '2026-04-02',
  },
];

export default function TenantInvoices() {
  const navigate = useNavigate();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showQRDialog, setShowQRDialog] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-600 text-white p-6 pb-8">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/tenant/dashboard')} className="p-2 hover:bg-white/10 rounded-lg">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold">Hóa đơn</h1>
        </div>
      </div>

      <div className="px-4 -mt-4 pb-6">
        <div className="space-y-3">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="bg-white rounded-xl shadow p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg mb-1">{invoice.month}</h3>
                  <p className="text-sm text-gray-600">
                    Hạn: {new Date(invoice.dueDate).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                  invoice.status === 'paid'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {invoice.status === 'paid' ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Đã thanh toán
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4" />
                      Chưa thanh toán
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2 mb-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tiền phòng</span>
                  <span className="font-medium">{invoice.rentAmount.toLocaleString('vi-VN')} ₫</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Điện</span>
                  <span className="font-medium">{invoice.electricityAmount.toLocaleString('vi-VN')} ₫</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Nước</span>
                  <span className="font-medium">{invoice.waterAmount.toLocaleString('vi-VN')} ₫</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Dịch vụ</span>
                  <span className="font-medium">{invoice.serviceAmount.toLocaleString('vi-VN')} ₫</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="font-semibold">Tổng cộng</span>
                  <span className="font-bold text-blue-600 text-lg">{invoice.totalAmount.toLocaleString('vi-VN')} ₫</span>
                </div>
              </div>

              {invoice.status === 'paid' ? (
                <div className="text-center py-2">
                  <p className="text-sm text-green-600">
                    ✓ Đã thanh toán ngày {invoice.paidDate && new Date(invoice.paidDate).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button className="flex-1 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50">
                    <Download className="w-4 h-4 inline mr-1" />
                    Tải về
                  </button>
                  <button
                    onClick={() => {
                      setSelectedInvoice(invoice);
                      setShowQRDialog(true);
                    }}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                  >
                    <QrCode className="w-4 h-4 inline mr-1" />
                    Thanh toán
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <Dialog.Root open={showQRDialog} onOpenChange={setShowQRDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-6 w-[90%] max-w-sm">
            <Dialog.Title className="text-xl font-semibold mb-4 text-center">Thanh toán hóa đơn</Dialog.Title>
            {selectedInvoice && (
              <div>
                <div className="bg-gray-100 rounded-xl p-8 mb-4">
                  <div className="w-full aspect-square bg-white rounded-lg flex items-center justify-center">
                    <QrCode className="w-32 h-32 text-gray-400" />
                  </div>
                </div>
                <p className="font-medium text-center mb-2">{selectedInvoice.month}</p>
                <p className="text-3xl font-bold text-blue-600 text-center mb-4">
                  {selectedInvoice.totalAmount.toLocaleString('vi-VN')} ₫
                </p>
                <p className="text-sm text-gray-600 text-center mb-6">
                  Quét mã QR để thanh toán qua<br />VNPay, MoMo, hoặc Banking
                </p>
                <button
                  onClick={() => {
                    toast.success('Thanh toán thành công!');
                    setShowQRDialog(false);
                  }}
                  className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                >
                  Xác nhận đã thanh toán
                </button>
                <Dialog.Close className="w-full mt-2 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50">
                  Đóng
                </Dialog.Close>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

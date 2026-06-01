import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Home, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsSuccess(true);
    setIsLoading(false);
    toast.success('Đã gửi email khôi phục mật khẩu!');
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Kiểm tra email</h1>
            <p className="text-gray-600">Chúng tôi đã gửi hướng dẫn khôi phục mật khẩu</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-6">
              <p className="text-gray-700 mb-4">
                Vui lòng kiểm tra hộp thư đến của email <span className="font-semibold">{email}</span>
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Chúng tôi đã gửi link khôi phục mật khẩu. Link này sẽ hết hạn sau 24 giờ.
              </p>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 Không nhận được email? Kiểm tra thư mục spam hoặc yêu cầu gửi lại sau 5 phút.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Quay lại đăng nhập
              </button>
              <button
                onClick={() => {
                  setIsSuccess(false);
                  setEmail('');
                }}
                className="w-full py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Gửi lại email
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-2xl mb-4">
            <Home className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quên mật khẩu</h1>
          <p className="text-gray-600">Nhập email để khôi phục mật khẩu</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">
                Chúng tôi sẽ gửi một email chứa link để bạn có thể đặt lại mật khẩu mới.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  Gửi email khôi phục
                </>
              )}
            </button>
          </form>

          <div className="mt-6">
            <button
              onClick={() => navigate('/login')}
              className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại đăng nhập
            </button>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Bạn chưa có tài khoản?{' '}
            <button
              onClick={() => navigate('/register')}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              Đăng ký ngay
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

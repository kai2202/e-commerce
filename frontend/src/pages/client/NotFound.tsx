import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, ArrowLeft, Home, Search, HelpCircle } from 'lucide-react';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-[#FDFBF7] px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full text-center">
        {/* Animated illustration area */}
        <div className="relative mb-8 flex justify-center">
          <div className="absolute inset-0 bg-[#E07A5F]/5 rounded-full blur-3xl transform -translate-y-4"></div>
          <div className="relative">
            {/* Main Compass Icon floating */}
            <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100/50 flex items-center justify-center animate-bounce duration-1000">
              <Compass className="h-20 w-20 text-[#E07A5F]" />
            </div>
            {/* Small decorative bubbles */}
            <div className="absolute -top-2 -right-2 h-4 w-4 bg-[#D4A373] rounded-full animate-ping"></div>
            <div className="absolute -bottom-1 -left-3 h-6 w-6 bg-[#E07A5F]/20 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Big 404 Number */}
        <h1 className="text-8xl font-serif font-black text-[#E07A5F] tracking-widest drop-shadow-sm">
          404
        </h1>

        {/* Header Message */}
        <h2 className="mt-4 text-2xl font-serif font-bold text-[#1A1A1A] tracking-tight">
          Không tìm thấy trang yêu cầu
        </h2>

        {/* Sub-text explanation */}
        <p className="mt-3 text-gray-500 text-sm leading-relaxed max-w-sm mx-auto">
          Đường dẫn bạn truy cập có thể đã bị thay đổi, bị xóa, hoặc không tồn tại. Hãy để chúng tôi dẫn đường bạn trở lại!
        </p>

        {/* Dynamic Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 font-medium rounded-xl transition-all shadow-sm hover:shadow hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại trang trước
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#E07A5F] hover:bg-[#d06e53] text-white font-medium rounded-xl transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
          >
            <Home className="h-4 w-4" />
            Về Trang chủ
          </button>
        </div>

        {/* Quick Links section */}
        <div className="mt-12 pt-8 border-t border-gray-200/50">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Đường dẫn gợi ý cho bạn
          </h3>
          <div className="flex justify-center gap-6 text-sm text-gray-600">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 hover:text-[#E07A5F] transition-colors"
            >
              <Search className="h-4 w-4" />
              Sản phẩm
            </button>
            <button
              onClick={() => navigate('/track')}
              className="flex items-center gap-1.5 hover:text-[#E07A5F] transition-colors"
            >
              <Compass className="h-4 w-4" />
              Tra cứu đơn hàng
            </button>
            <button
              onClick={() => navigate('/account')}
              className="flex items-center gap-1.5 hover:text-[#E07A5F] transition-colors"
            >
              <HelpCircle className="h-4 w-4" />
              Tài khoản
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

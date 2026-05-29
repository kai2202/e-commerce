import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../redux/hooks';
import { cancelOrder } from '../../redux/orderSlice';
import api from '../../utils/api';
import { Search, Package, Clock, Truck, CheckCircle2, XCircle, ArrowRight, MapPin, User, Mail, Phone, ShieldAlert, AlertCircle, ShoppingBag } from 'lucide-react';

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  selectedColor: string;
  selectedSize: string;
}

interface OrderHistory {
  status: string;
  note: string;
  date: string;
}

interface Order {
  id: string;
  _id?: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  subTotal: number;
  shippingFee: number;
  discountAmount: number;
  total: number;
  status: 'pending' | 'shipping' | 'completed' | 'cancelled';
  shippingAddress: {
    name: string;
    phone: string;
    street: string;
    city: string;
  };
  paymentMethod: string;
  courier: string;
  date: string;
  history?: OrderHistory[];
}

export const OrderTracking: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // State fields
  const [orderId, setOrderId] = useState('');
  const [authCredential, setAuthCredential] = useState(''); // Email or SĐT
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle prefilled state from redirect
  useEffect(() => {
    const state = location.state as any;
    if (state && state.orderId) {
      setOrderId(state.orderId);
      const prefillCred = state.email || state.phone || '';
      setAuthCredential(prefillCred);
      
      // Auto trigger search if both are present
      if (state.orderId && prefillCred) {
        performSearch(state.orderId, prefillCred);
      }
    }
  }, [location.state]);

  const performSearch = async (targetId: string, credential: string) => {
    if (!targetId.trim()) {
      setErrorMsg('Vui lòng nhập Mã đơn hàng!');
      return;
    }
    if (!credential.trim()) {
      setErrorMsg('Vui lòng nhập Email hoặc Số điện thoại đặt hàng!');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setOrder(null);

    try {
      const isEmail = credential.includes('@');
      const params = isEmail
        ? { email: credential.trim(), phone: '' }
        : { email: '', phone: credential.trim() };

      const response = await api.get(`/orders/${targetId.trim()}`, { params });
      setOrder(response.data);
    } catch (err: any) {
      console.error('Error fetching tracked order:', err);
      setErrorMsg(err.response?.data?.message || 'Không tìm thấy đơn hàng hoặc thông tin xác thực chưa chính xác. Vui lòng kiểm tra lại!');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(orderId, authCredential);
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    
    if (confirm('Bạn có chắc chắn muốn hủy đơn hàng này không? Quá trình này sẽ hoàn trả số lượng hàng vào kho lập tức.')) {
      setLoading(true);
      try {
        const isEmail = authCredential.includes('@');
        const verification = isEmail
          ? { orderId: order.id, email: authCredential.trim() }
          : { orderId: order.id, phone: authCredential.trim() };

        const resultAction = await dispatch(cancelOrder(verification));
        if (cancelOrder.fulfilled.match(resultAction)) {
          // Success! Refetch order details to show updated history & status
          await performSearch(order.id, authCredential);
          alert('Hủy đơn hàng thành công!');
        }
      } catch (err) {
        console.error('Cancel order error:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const formatVND = (num: number) => {
    return num.toLocaleString('vi-VN') + ' ₫';
  };

  const formatHistoryDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      return dateStr;
    }
    return d.toLocaleString('vi-VN');
  };

  // Helper for tracking steps styling
  const getStatusStepClass = (step: number, currentStatus: string) => {
    const statuses = ['pending', 'shipping', 'completed'];
    const currentIndex = statuses.indexOf(currentStatus);
    
    if (currentStatus === 'cancelled') {
      return step === 0 ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-400';
    }

    if (currentIndex >= step) {
      return 'bg-indigo-600 text-white';
    }
    return 'bg-gray-200 text-gray-400';
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 font-sans space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Tra Cứu Đơn Hàng</h1>
        <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
          Dành cho Khách vãng lai và Thành viên tra cứu tình trạng xử lý, giao nhận và quản lý đơn hàng nhanh chóng.
        </p>
      </div>

      {/* Search Bar Form Card */}
      <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-xs max-w-2xl mx-auto">
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-gray-400 block">Mã Đơn Hàng</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="Ví dụ: ord-1716943800000"
                  className="w-full rounded-xl border border-gray-250 bg-gray-50/20 pl-9 pr-3 py-2.5 text-xs text-gray-900 focus:border-indigo-500 focus:outline-hidden transition"
                />
                <Package className="absolute left-3 top-3 h-4.5 w-4.5 text-gray-400" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-gray-400 block">Email / SĐT Đặt Hàng</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={authCredential}
                  onChange={(e) => setAuthCredential(e.target.value)}
                  placeholder="Nhập email hoặc số điện thoại"
                  className="w-full rounded-xl border border-gray-250 bg-gray-50/20 pl-9 pr-3 py-2.5 text-xs text-gray-900 focus:border-indigo-500 focus:outline-hidden transition"
                />
                <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-650 text-white font-bold py-2.5 text-xs hover:bg-indigo-750 transition duration-150 cursor-pointer shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {loading ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <Search className="h-4 w-4" />
                Tra cứu ngay
              </>
            )}
          </button>
        </form>

        {errorMsg && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl flex items-start gap-2 animate-shake">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Loading state skeleton */}
      {loading && !order && (
        <div className="space-y-4 max-w-3xl mx-auto animate-pulse">
          <div className="h-8 bg-gray-200 rounded-lg w-1/3" />
          <div className="h-40 bg-gray-200 rounded-xl" />
          <div className="h-48 bg-gray-200 rounded-xl" />
        </div>
      )}

      {/* Tracked Order Results Content */}
      {order && (
        <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
          {/* Status Header Bar */}
          <div className="bg-white rounded-2xl border border-gray-150 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Trạng thái đơn hàng</span>
              <div className="flex items-center gap-2 mt-1">
                {order.status === 'pending' && (
                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                    <Clock className="h-3 w-3" /> Chờ xử lý
                  </span>
                )}
                {order.status === 'shipping' && (
                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                    <Truck className="h-3 w-3" /> Đang vận chuyển
                  </span>
                )}
                {order.status === 'completed' && (
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="h-3 w-3" /> Hoàn tất
                  </span>
                )}
                {order.status === 'cancelled' && (
                  <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-100 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                    <XCircle className="h-3 w-3" /> Đã hủy
                  </span>
                )}
                <span className="text-xs text-gray-400 font-medium">Đặt ngày: <b>{new Date(order.date).toLocaleDateString('vi-VN')}</b></span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 font-bold">
                Mã Đơn: <b className="text-indigo-700 font-black text-sm">{order.id}</b>
              </span>
              
              {order.status === 'pending' && (
                <button
                  onClick={handleCancelOrder}
                  className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-150 p-1.5 px-3 rounded-lg text-[10.5px] font-bold transition duration-150 cursor-pointer shadow-xs"
                >
                  Hủy đơn hàng
                </button>
              )}
            </div>
          </div>

          {/* Progress Timeline steps */}
          {order.status !== 'cancelled' ? (
            <div className="bg-white rounded-2xl border border-gray-150 p-6">
              <div className="flex items-center justify-between relative max-w-md mx-auto py-3">
                {/* Horizontal progress bar background */}
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-gray-100 -z-0" />
                
                {/* Step 1: Pending */}
                <div className="flex flex-col items-center gap-1.5 relative z-10">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-black shadow-sm ${getStatusStepClass(0, order.status)}`}>
                    <Clock className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-extrabold text-gray-500 uppercase">Chờ xử lý</span>
                </div>

                {/* Step 2: Shipping */}
                <div className="flex flex-col items-center gap-1.5 relative z-10">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-black shadow-sm ${getStatusStepClass(1, order.status)}`}>
                    <Truck className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-extrabold text-gray-500 uppercase">Đang vận chuyển</span>
                </div>

                {/* Step 3: Completed */}
                <div className="flex flex-col items-center gap-1.5 relative z-10">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-black shadow-sm ${getStatusStepClass(2, order.status)}`}>
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-extrabold text-gray-500 uppercase">Hoàn tất</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-6 text-center space-y-2">
              <XCircle className="h-10 w-10 text-rose-500 mx-auto" />
              <div className="space-y-1">
                <h4 className="font-extrabold text-xs text-rose-700 uppercase tracking-widest">Đơn hàng đã bị hủy</h4>
                <p className="text-[11px] text-gray-400">Đơn hàng này không còn được xử lý. Kho hàng của các sản phẩm đã được tự động hoàn trả.</p>
              </div>
            </div>
          )}

          {/* Details & Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Products and summary (Col 1-2) */}
            <div className="md:col-span-2 space-y-6">
              {/* Product items list card */}
              <div className="bg-white rounded-2xl border border-gray-150 p-6 space-y-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-2 flex items-center gap-1.5">
                  <ShoppingBag className="h-4 w-4 text-indigo-650" />
                  Chi tiết sản phẩm ({order.items.reduce((acc, curr) => acc + curr.quantity, 0)})
                </h3>
                
                <div className="divide-y divide-gray-100">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-14 w-14 object-cover rounded-lg border border-gray-150 shrink-0 bg-gray-50"
                      />
                      <div className="flex-grow space-y-1 min-w-0">
                        <h4 className="text-xs font-bold text-gray-800 line-clamp-2 leading-relaxed">{item.name}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium">
                          <span>Phân loại: <b>{item.selectedColor} / {item.selectedSize}</b></span>
                          <span>•</span>
                          <span>Số lượng: <b>{item.quantity}</b></span>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold text-gray-850 shrink-0 self-start">
                        {formatVND(item.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status history log card */}
              {order.history && order.history.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-150 p-6 space-y-4">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-2">Lịch sử cập nhật đơn hàng</h3>
                  
                  <div className="relative border-l border-gray-150 ml-2.5 pl-5 space-y-4">
                    {order.history.map((hist, idx) => (
                      <div key={idx} className="relative text-xs">
                        {/* Dot indicator */}
                        <div className={`absolute -left-7.5 top-1 h-3 w-3 rounded-full border-2 border-white ${
                          hist.status === 'cancelled' ? 'bg-red-500' :
                          hist.status === 'completed' ? 'bg-green-500' :
                          hist.status === 'shipping' ? 'bg-blue-500' : 'bg-amber-500'
                        }`} />
                        <div className="flex items-center justify-between font-bold text-gray-400 text-[10px] tracking-wide mb-0.5">
                          <span className="uppercase text-gray-500">{hist.status}</span>
                          <span className="font-mono">{formatHistoryDate(hist.date)}</span>
                        </div>
                        <p className="text-gray-650 leading-relaxed font-medium">{hist.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Delivery address & pricing summary (Col 3) */}
            <div className="space-y-6">
              {/* Delivery and payment address card */}
              <div className="bg-white rounded-2xl border border-gray-150 p-6 space-y-4 text-xs">
                <h3 className="font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-2">Thông tin nhận hàng</h3>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <User className="h-4.5 w-4.5 text-gray-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-gray-800 block leading-tight">{order.customerName}</span>
                      <span className="text-[10px] text-gray-400 font-medium">Người nhận</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Phone className="h-4.5 w-4.5 text-gray-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-mono font-bold text-gray-800 block leading-tight">{order.customerPhone}</span>
                      <span className="text-[10px] text-gray-400 font-medium">Điện thoại</span>
                    </div>
                  </div>

                  {order.customerEmail && (
                    <div className="flex items-start gap-2">
                      <Mail className="h-4.5 w-4.5 text-gray-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="font-bold text-gray-800 block leading-tight truncate">{order.customerEmail}</span>
                        <span className="text-[10px] text-gray-400 font-medium">Email</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-2 border-t border-gray-100 pt-3">
                    <MapPin className="h-4.5 w-4.5 text-gray-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium text-gray-650 leading-relaxed block">{order.shippingAddress.street}, {order.shippingAddress.city}</span>
                      <span className="text-[10px] text-gray-400 font-medium">Địa chỉ giao</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Billing and totals card */}
              <div className="bg-white rounded-2xl border border-gray-150 p-6 space-y-3 text-xs">
                <h3 className="font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-2">Chi tiết thanh toán</h3>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-500 font-medium">
                    <span>Tạm tính</span>
                    <span>{formatVND(order.subTotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500 font-medium">
                    <span>Phí vận chuyển</span>
                    <span>{formatVND(order.shippingFee)}</span>
                  </div>
                  {order.discountAmount > 0 && (
                    <div className="flex justify-between text-rose-500 font-semibold">
                      <span>Khuyến mãi</span>
                      <span>-{formatVND(order.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-500 font-medium">
                    <span>Thanh toán qua</span>
                    <span className="font-bold text-gray-850 uppercase">{order.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between text-gray-500 font-medium pb-2 border-b border-gray-100">
                    <span>Đơn vị vận chuyển</span>
                    <span className="font-bold text-gray-850">{order.courier}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-gray-800 font-bold text-sm">Tổng cộng</span>
                    <span className="font-black text-rose-500 text-sm">{formatVND(order.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../redux/hooks';
import { checkout as checkoutAction } from '../../redux/orderSlice';
import { clearCart } from '../../redux/cartSlice';
import { saveAddress as saveAddressAction } from '../../redux/authSlice';
import { Address, Order } from '../../types';
import { CreditCard, CheckCircle, ArrowLeft, Landmark, Wallet, ShieldAlert, ShieldCheck, BadgePercent, MapPin, Plus, Truck } from 'lucide-react';
import api from '../../utils/api';

export const Checkout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const appliedCouponCode = location.state?.appliedCouponCode;
  const selectedCourier = location.state?.selectedCourier || 'Giao Hàng Nhanh (GHN)';
  const dispatch = useAppDispatch();
  const cart = useAppSelector((state) => state.cart.cart);
  const products = useAppSelector((state) => state.shop.products);
  const coupons = useAppSelector((state) => state.shop.coupons);
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  // Active Checkout Step (1: Delivery Address, 2: Delivery Method, 3: Payment)
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

  // Selected Address
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(
    currentUser && currentUser.addresses.length > 0 ? currentUser.addresses[0] : null
  );

  // Manual Address Fields (Used if not logged in or doesn't use saved address)
  const [shippingName, setShippingName] = useState(currentUser?.name || '');
  const [shippingPhone, setShippingPhone] = useState(currentUser?.phone || '');
  const [shippingStreet, setShippingStreet] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [saveToBook, setSaveToBook] = useState(false);
  const [guestEmail, setGuestEmail] = useState('');

  // New Address Toggle
  const [useNewAddress, setUseNewAddress] = useState(!currentUser || currentUser.addresses.length === 0);

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<Order['paymentMethod']>('COD');

  // Interactive Online Payment simulator state
  const [isProcessing, setIsProcessing] = useState(false);
  const [simulatedGateway, setSimulatedGateway] = useState<'VNPAY' | 'MOMO' | 'CREDIT' | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [isCheckoutFinished, setIsCheckoutFinished] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState('');

  // Verify VNPAY return params if present (backend redirects here with vnp_status)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const vnpStatus = params.get('vnp_status');
    const orderId = params.get('orderId');
    
    if (vnpStatus) {
      // Clear query params from browser URL immediately
      window.history.replaceState({}, document.title, window.location.pathname);
      
      if (vnpStatus === 'success' && orderId) {
        // Thanh toán VNPAY thành công → xoá giỏ hàng và hiển thị thành công
        dispatch(clearCart());
        setCreatedOrderId(orderId);
        setPaymentMethod('VNPAY');
        setIsCheckoutFinished(true);
      } else if (vnpStatus === 'failed') {
        // Thanh toán thất bại / bị huỷ → GIỮ NGUYÊN giỏ hàng để người dùng thử lại
        const reason = params.get('reason') || 'Thanh toán thất bại hoặc đã bị hủy.';
        alert(`Thanh toán qua VNPAY thất bại: ${reason}`);
      } else {
        // Lỗi hệ thống → GIỮ NGUYÊN giỏ hàng
        alert('Có lỗi xảy ra trong quá trình xử lý thanh toán. Vui lòng thử lại.');
      }
    }
  }, [navigate]);


  // Cart Enrichment
  const cartWithProducts = cart.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    const price = product ? (product.discountPrice ?? product.originalPrice) : 0;
    return {
      ...item,
      product,
      price,
      totalPrice: price * item.quantity,
    };
  });

  const subTotal = cartWithProducts.reduce((acc, item) => acc + item.totalPrice, 0);
  const shippingFee = subTotal > 1000000 ? 0 : 35000;

  // Coupon
  let discountAmount = 0;
  if (appliedCouponCode) {
    const cp = coupons.find((c) => c.code.toUpperCase() === appliedCouponCode.toUpperCase() && c.active);
    if (cp) {
      if (cp.type === 'percent') {
        discountAmount = Math.round((subTotal * cp.value) / 100);
      } else {
        discountAmount = cp.value;
      }
    }
  }

  const finalTotal = Math.max(0, subTotal + shippingFee - discountAmount);

  const formatVND = (num: number) => {
    return num.toLocaleString('vi-VN') + ' ₫';
  };

  const handlePlaceOrderSubmit = () => {
    let finalAddress: Address;

    if (!useNewAddress && selectedAddress) {
      finalAddress = selectedAddress;
    } else {
      // Validate inputs
      if (!shippingName || !shippingPhone || !shippingStreet || !shippingCity) {
        alert('Vui lòng nhập đầy đủ thông tin giao nhận hàng!');
        return;
      }
      if (!currentUser && !guestEmail) {
        alert('Vui lòng nhập Email nhận thông tin đơn hàng!');
        return;
      }
      finalAddress = {
        id: `addr-${Date.now()}`,
        name: shippingName,
        phone: shippingPhone,
        label: 'Địa chỉ mới của tôi',
        street: shippingStreet,
        city: shippingCity,
      };

      // Save Address in register book if requested
      if (saveToBook && currentUser) {
        dispatch(saveAddressAction({
          name: shippingName,
          phone: shippingPhone,
          label: 'Địa chỉ lưu thêm',
          street: shippingStreet,
          city: shippingCity,
        }));
      }
    }

    if (paymentMethod === 'COD') {
      // Direct checkout
      setIsProcessing(true);
      setTimeout(() => {
        dispatch(checkoutAction({ 
          shippingAddress: finalAddress, 
          paymentMethod: 'COD', 
          courier: selectedCourier, 
          appliedCouponCode,
          customerEmail: !currentUser ? guestEmail : undefined
        }))
          .unwrap()
          .then((res: any) => {
            setIsProcessing(false);
            if (res.success) {
              if (currentUser) {
                navigate('/account', { state: { activeTab: 'orders', showSuccessMessage: true } });
              } else {
                setCreatedOrderId(res.orderId);
                setIsCheckoutFinished(true);
              }
            } else {
              alert(res.message);
            }
          });
      }, 1000);
    } else if (paymentMethod === 'VNPAY') {
      // VNPAY Gateway integration
      setIsProcessing(true);
      dispatch(checkoutAction({ 
        shippingAddress: finalAddress, 
        paymentMethod: 'VNPAY', 
        courier: selectedCourier, 
        appliedCouponCode,
        customerEmail: !currentUser ? guestEmail : undefined
      }))
        .unwrap()
        .then((res: any) => {
          setIsProcessing(false);
          if (res.success && res.paymentUrl) {
            window.location.href = res.paymentUrl;
          } else {
            alert(res.message || 'Lỗi tạo liên kết thanh toán VNPAY!');
          }
        });
    } else {
      // Trigger Online Gateway simulator for MOMO and CREDIT
      setSimulatedGateway(paymentMethod);
    }
  };

  const handleSimulatedPaymentAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    setTimeout(() => {
      let finalAddress: Address;
      if (!useNewAddress && selectedAddress) {
        finalAddress = selectedAddress;
      } else {
        finalAddress = {
          id: `addr-${Date.now()}`,
          name: shippingName,
          phone: shippingPhone,
          label: 'Địa chỉ mới của tôi',
          street: shippingStreet,
          city: shippingCity,
        };
      }

      dispatch(checkoutAction({ 
        shippingAddress: finalAddress, 
        paymentMethod, 
        courier: selectedCourier, 
        appliedCouponCode,
        customerEmail: !currentUser ? guestEmail : undefined
      }))
        .unwrap()
        .then((res) => {
          setIsProcessing(false);
          setSimulatedGateway(null);

          if (res.success) {
            if (currentUser) {
              navigate('/account', { state: { activeTab: 'orders', showSuccessMessage: true } });
            } else {
              setCreatedOrderId(res.orderId);
              setIsCheckoutFinished(true);
            }
          } else {
            alert(res.message);
          }
        });
    }, 1500);
  };

  const getEstimatedDeliveryDate = () => {
    const date1 = new Date();
    date1.setDate(date1.getDate() + 3);
    const date2 = new Date();
    date2.setDate(date2.getDate() + 5);
    
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'numeric' };
    const format1 = date1.toLocaleDateString('vi-VN', options);
    const format2 = date2.toLocaleDateString('vi-VN', options);
    return `Dự kiến giao hàng: ${format1} - ${format2}`;
  };

  if (isCheckoutFinished) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center space-y-6 font-sans animate-fade-in">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-green-600 flex items-center justify-center text-white shrink-0 shadow-lg animate-scale-up">
            <CheckCircle className="h-8 w-8 stroke-[2.5]" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">Đặt Hàng Thành Công!</h2>
          <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
            Cảm ơn bạn đã lựa chọn E-Market. Đơn hàng của bạn đã được hệ thống tiếp nhận và đang tiến hành đóng gói vận chuyển.
          </p>
        </div>

        {/* Invoice Summary Card */}
        <div className="rounded-3xl border border-gray-150 p-6 sm:p-8 bg-white text-left space-y-5 shadow-sm">
          <div className="flex justify-between border-b border-gray-100 pb-3 items-center">
            <span className="font-display text-[10.5px] font-black uppercase tracking-widest text-gray-400">Mã Đơn Hàng</span>
            <span className="text-sm font-black text-black font-mono">{createdOrderId}</span>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="grid grid-cols-3">
              <span className="font-bold text-gray-400">Người nhận:</span>
              <span className="col-span-2 text-black font-semibold">
                {shippingName || selectedAddress?.name}
              </span>
            </div>
            <div className="grid grid-cols-3">
              <span className="font-bold text-gray-400">Điện thoại:</span>
              <span className="col-span-2 text-black font-semibold font-mono">
                {shippingPhone || selectedAddress?.phone}
              </span>
            </div>
            <div className="grid grid-cols-3">
              <span className="font-bold text-gray-400">Địa chỉ giao:</span>
              <span className="col-span-2 text-black font-semibold leading-relaxed">
                {useNewAddress
                  ? `${shippingStreet}, ${shippingCity}`
                  : `${selectedAddress?.street}, ${selectedAddress?.city}`}
              </span>
            </div>
            <div className="grid grid-cols-3">
              <span className="font-bold text-gray-400">Đơn vị vận chuyển:</span>
              <span className="col-span-2 text-black font-bold uppercase tracking-wider text-[10px]">{selectedCourier}</span>
            </div>
            <div className="grid grid-cols-3">
              <span className="font-bold text-gray-400">Phương thức:</span>
              <span className="col-span-2 text-black font-bold uppercase tracking-wider text-[10px]">{paymentMethod}</span>
            </div>
            <div className="grid grid-cols-3 border-t border-gray-100 pt-4 items-baseline">
              <span className="font-display text-xs font-black uppercase tracking-wider text-black">Tổng thanh toán:</span>
              <span className="col-span-2 font-display text-lg font-black text-[#EE1111]">{formatVND(finalTotal)}</span>
            </div>
          </div>
        </div>

        {/* Action Button stack (rounded-full) */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <button
            onClick={() => {
              if (currentUser) {
                navigate('/account', { state: { activeTab: 'orders' } });
              } else {
                navigate('/track', { 
                  state: { 
                    orderId: createdOrderId, 
                    email: guestEmail, 
                    phone: shippingPhone 
                  } 
                });
              }
            }}
            className="h-12 px-8 rounded-full bg-black text-white hover:opacity-90 transition font-display text-[10.5px] font-black uppercase tracking-widest cursor-pointer shadow-sm"
          >
            Theo dõi đơn hàng
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="h-12 px-8 rounded-full border border-gray-300 hover:border-black bg-white transition font-display text-[10.5px] font-black uppercase tracking-widest text-black cursor-pointer"
          >
            Tiếp tục mua sắm
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans animate-fade-in">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Gateway Simulator popup overlay */}
        {simulatedGateway && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setSimulatedGateway(null)} />
            <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 border border-gray-100 relative z-10 text-center space-y-5 animate-scale-up">
              <div className="flex justify-center">
                {simulatedGateway === 'VNPAY' && <div className="h-10 w-24 bg-blue-50 border border-blue-100 flex items-center justify-center rounded-lg text-lg font-black tracking-tight text-blue-700 italic">VN PAY</div>}
                {simulatedGateway === 'MOMO' && <div className="h-10 w-20 bg-pink-50 border border-pink-100 rounded-lg flex items-center justify-center font-black text-rose-600 text-[10px] uppercase tracking-wide">MoMo</div>}
                {simulatedGateway === 'CREDIT' && <CreditCard className="h-10 w-10 text-black shrink-0" />}
              </div>

              <div className="space-y-1">
                <h4 className="font-display text-sm font-black uppercase tracking-widest text-black">Xác thực giao dịch giả lập</h4>
                <p className="text-[10px] text-gray-500 leading-normal font-semibold">Bạn đang giao dịch số tiền <b>{formatVND(finalTotal)}</b> nhằm hoàn tất thanh toán.</p>
              </div>

              <form onSubmit={handleSimulatedPaymentAuth} className="space-y-4 text-left">
                <div className="space-y-1.5">
                  <label className="text-[10.5px] uppercase font-black text-black block tracking-wider">Nhập mã OTP giả lập</label>
                  <input
                    type="password"
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Nhập mã OTP bất kỳ..."
                    className="w-full text-center tracking-widest text-xs rounded-xl border border-gray-300 py-3 font-extrabold focus:border-black focus:ring-0 focus:outline-none"
                  />
                  <span className="block text-[9.5px] text-gray-400 font-semibold italic mt-1 leading-normal">💡 Mẹo: Nhập bất kỳ chữ số nào để giả lập giao dịch thành công.</span>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setSimulatedGateway(null)}
                    className="w-1/2 h-11 rounded-full border border-gray-300 hover:border-black bg-white transition cursor-pointer font-display text-[9.5px] font-black uppercase tracking-widest text-black"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-1/2 h-11 rounded-full bg-black hover:bg-black/90 text-white transition cursor-pointer font-display text-[9.5px] font-black uppercase tracking-widest flex items-center justify-center"
                  >
                    {isProcessing ? 'Đang xử lý...' : 'Xác nhận'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Column Left: Asymmetrical Steps (occupies 7 cols on md) */}
        <div className="lg:col-span-7 divide-y divide-gray-200 border-b border-gray-200">
          
          {/* STEP 1: Delivery Address */}
          <div className="py-6 first:pt-0">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm sm:text-base font-black uppercase tracking-widest text-black flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-black">1</span>
                Địa chỉ giao hàng
              </h3>
              {activeStep > 1 && (
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className="text-[10px] font-black uppercase tracking-wider text-black hover:underline cursor-pointer bg-transparent border-none focus:outline-none"
                >
                  Chỉnh sửa
                </button>
              )}
            </div>

            {activeStep === 1 ? (
              /* Expanded Form */
              <div className="mt-5 space-y-4 animate-fade-in">
                {currentUser && currentUser.addresses.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Chọn từ địa chỉ đã lưu:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {currentUser.addresses.map((addr) => {
                        const isSelected = !useNewAddress && selectedAddress?.id === addr.id;
                        return (
                          <div
                            key={addr.id}
                            onClick={() => {
                              setSelectedAddress(addr);
                              setUseNewAddress(false);
                            }}
                            className={`relative p-4 border cursor-pointer text-xs transition rounded-2xl ${
                              isSelected
                                ? 'border-black bg-gray-50'
                                : 'border-gray-200 hover:border-black/50 bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-gray-900">{addr.name}</span>
                              <span className="bg-black text-white rounded-xs px-1.5 py-0.2 text-[8px] uppercase font-bold tracking-wider font-display">
                                {addr.label}
                              </span>
                            </div>
                            <p className="font-mono text-gray-500 font-semibold">{addr.phone}</p>
                            <p className="text-gray-400 mt-1 leading-normal font-semibold">{addr.street}, {addr.city}</p>
                          </div>
                        );
                      })}

                      <div
                        onClick={() => {
                          setUseNewAddress(true);
                          setSelectedAddress(null);
                        }}
                        className={`flex flex-col items-center justify-center p-4 border-2 border-dashed cursor-pointer text-xs transition rounded-2xl min-h-[100px] ${
                          useNewAddress ? 'border-black bg-gray-50/30' : 'border-gray-200 hover:border-black/50'
                        }`}
                      >
                        <Plus className="h-5 w-5 text-gray-400 mb-1" />
                        <span className="font-bold text-gray-700">Sử dụng địa chỉ khác</span>
                      </div>
                    </div>
                  </div>
                )}

                {useNewAddress && (
                  <div className="space-y-4 pt-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Chi tiết địa chỉ giao hàng mới:</span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-black uppercase tracking-wider">Tên người nhận</label>
                        <input
                          type="text"
                          required
                          value={shippingName}
                          onChange={(e) => setShippingName(e.target.value)}
                          placeholder="Họ & Tên..."
                          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-xs text-black focus:border-black focus:ring-0 focus:outline-none placeholder:text-gray-400 font-semibold transition"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-black uppercase tracking-wider">Số điện thoại</label>
                        <input
                          type="tel"
                          required
                          value={shippingPhone}
                          onChange={(e) => setShippingPhone(e.target.value)}
                          placeholder="09xxxxxxxx..."
                          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-xs text-black focus:border-black focus:ring-0 focus:outline-none placeholder:text-gray-400 font-semibold transition"
                        />
                      </div>
                    </div>

                    {!currentUser && (
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-black uppercase tracking-wider">Email nhận thông tin đơn hàng</label>
                        <input
                          type="email"
                          required
                          value={guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                          placeholder="email@example.com..."
                          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-xs text-black focus:border-black focus:ring-0 focus:outline-none placeholder:text-gray-400 font-semibold transition"
                        />
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-black uppercase tracking-wider">Địa chỉ chi tiết (Số nhà, Tên đường, Phường/Xã)</label>
                      <input
                        type="text"
                        required
                        value={shippingStreet}
                        onChange={(e) => setShippingStreet(e.target.value)}
                        placeholder="Ví dụ: 123 Đường Nguyễn Huệ, Phường Bến Nghé..."
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-xs text-black focus:border-black focus:ring-0 focus:outline-none placeholder:text-gray-400 font-semibold transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-black uppercase tracking-wider">Tỉnh / Thành phố</label>
                      <input
                        type="text"
                        required
                        value={shippingCity}
                        onChange={(e) => setShippingCity(e.target.value)}
                        placeholder="Ví dụ: TP. Hồ Chí Minh..."
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-xs text-black focus:border-black focus:ring-0 focus:outline-none placeholder:text-gray-400 font-semibold transition"
                      />
                    </div>

                    {currentUser && (
                      <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer pt-2 select-none">
                        <input
                          type="checkbox"
                          checked={saveToBook}
                          onChange={(e) => setSaveToBook(e.target.checked)}
                          className="rounded border-gray-300 text-black focus:ring-black h-4 w-4"
                        />
                        <span>Lưu địa chỉ này vào sổ địa chỉ để dùng lần sau</span>
                      </label>
                    )}
                  </div>
                )}

                {/* Step 1 CTA button (Nike rounded-full style) */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!useNewAddress && selectedAddress) {
                        setActiveStep(2);
                      } else {
                        if (!shippingName || !shippingPhone || !shippingStreet || !shippingCity) {
                          alert('Vui lòng nhập đầy đủ thông tin giao nhận hàng!');
                          return;
                        }
                        if (!currentUser && !guestEmail) {
                          alert('Vui lòng nhập Email nhận thông tin đơn hàng!');
                          return;
                        }
                        setActiveStep(2);
                      }
                    }}
                    className="h-12 px-8 rounded-full bg-black text-white hover:opacity-90 transition font-display text-[10.5px] font-black uppercase tracking-widest cursor-pointer shadow-sm"
                  >
                    Lưu & Tiếp Tục
                  </button>
                </div>
              </div>
            ) : (
              /* Collapsed Summary view */
              <div className="mt-2 text-xs text-gray-500 font-medium leading-relaxed">
                {useNewAddress ? (
                  <p>Giao tới: <b>{shippingName}</b> • {shippingPhone} • {shippingStreet}, {shippingCity}</p>
                ) : (
                  <p>Giao tới: <b>{selectedAddress?.name}</b> • {selectedAddress?.phone} • {selectedAddress?.street}, {selectedAddress?.city}</p>
                )}
              </div>
            )}
          </div>

          {/* STEP 2: Delivery Method */}
          <div className="py-6">
            <div className="flex items-center justify-between">
              <h3 className={`font-display text-sm sm:text-base font-black uppercase tracking-widest flex items-center gap-2 ${activeStep < 2 ? 'text-gray-300' : 'text-black'}`}>
                <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-black ${activeStep < 2 ? 'bg-gray-200 text-gray-400' : 'bg-black text-white'}`}>2</span>
                Dịch vụ vận chuyển
              </h3>
              {activeStep > 2 && (
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="text-[10px] font-black uppercase tracking-wider text-black hover:underline cursor-pointer bg-transparent border-none focus:outline-none"
                >
                  Chỉnh sửa
                </button>
              )}
            </div>

            {activeStep === 2 && (
              /* Expanded options */
              <div className="mt-5 space-y-4 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'Giao Hàng Nhanh (GHN)', detail: 'Thời gian: 1-2 ngày làm việc. Hỗ trợ giao tận tay.' },
                    { label: 'Giao Hàng Tiết Kiệm (GHTK)', detail: 'Thời gian: 2-3 ngày làm việc. Tối ưu chi phí.' },
                  ].map((cou) => {
                    const isSelected = selectedCourier === cou.label;
                    return (
                      <button
                        key={cou.label}
                        type="button"
                        onClick={() => navigate('/checkout', { state: { appliedCouponCode, selectedCourier: cou.label } })}
                        className={`text-left p-4 border transition cursor-pointer rounded-2xl select-none ${
                          isSelected
                            ? 'border-black bg-gray-50'
                            : 'border-gray-200 hover:border-black/50 bg-white'
                        }`}
                      >
                        <span className="font-display text-[10px] font-black uppercase tracking-wider text-black block">{cou.label}</span>
                        <span className="text-[10px] text-gray-450 mt-1 block leading-normal font-semibold">{cou.detail}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveStep(3)}
                    className="h-12 px-8 rounded-full bg-black text-white hover:opacity-90 transition font-display text-[10.5px] font-black uppercase tracking-widest cursor-pointer shadow-sm"
                  >
                    Lưu & Tiếp Tục
                  </button>
                </div>
              </div>
            )}

            {activeStep > 2 && (
              /* Collapsed Summary */
              <div className="mt-2 text-xs text-gray-500 font-medium leading-relaxed">
                <p>Đơn vị giao: <b>{selectedCourier}</b> • {shippingFee === 0 ? 'Miễn phí vận chuyển' : formatVND(shippingFee)}</p>
              </div>
            )}
          </div>

          {/* STEP 3: Payment Method */}
          <div className="py-6">
            <h3 className={`font-display text-sm sm:text-base font-black uppercase tracking-widest flex items-center gap-2 ${activeStep < 3 ? 'text-gray-300' : 'text-black'}`}>
              <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-black ${activeStep < 3 ? 'bg-gray-200 text-gray-400' : 'bg-black text-white'}`}>3</span>
              Phương thức thanh toán
            </h3>

            {activeStep === 3 && (
              /* Expanded Options */
              <div className="mt-5 space-y-5 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: 'COD', label: 'COD (Tiền mặt)', detail: 'Thanh toán trực tiếp khi nhận hàng', icon: <Landmark className="h-5 w-5 text-black shrink-0" /> },
                    { id: 'VNPAY', label: 'VN PAY Gateway', detail: 'Thanh toán bảo mật trực tuyến', icon: <div className="text-[9px] font-extrabold italic bg-blue-50 border border-blue-150 px-1 rounded text-blue-650 leading-tight">VN PAY</div> },
                  ].map((pay) => {
                    const isSelected = paymentMethod === pay.id;
                    return (
                      <div
                        key={pay.id}
                        onClick={() => setPaymentMethod(pay.id as Order['paymentMethod'])}
                        className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer hover:border-black transition select-none ${
                          isSelected
                            ? 'border-black bg-gray-50'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="payRadio"
                          checked={isSelected}
                          onChange={() => {}}
                          className="mt-0.5 border-gray-300 text-black focus:ring-black h-4 w-4"
                        />
                        <div className="flex-grow space-y-1">
                          <div className="flex items-center gap-2 justify-between">
                            <span className="font-display text-[10px] font-black uppercase tracking-wider text-black">{pay.label}</span>
                            {pay.icon}
                          </div>
                          <p className="text-[10px] text-gray-450 font-semibold leading-normal">{pay.detail}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Purchase Trigger Buttons */}
                <div className="pt-4 border-t border-gray-100">
                  {currentUser && (currentUser.role === 'admin' || currentUser.role === 'staff_inventory') ? (
                    <div className="w-full flex items-center gap-2 bg-gray-50 border border-gray-250 p-4 text-xs font-bold text-gray-500 leading-normal">
                      <ShieldCheck className="h-5 w-5 shrink-0 text-gray-400" />
                      <span>Admin không khả dụng thanh toán checkout.</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handlePlaceOrderSubmit}
                      disabled={isProcessing}
                      className="w-full h-14 rounded-full bg-black hover:bg-black/90 text-white font-display text-xs font-black uppercase tracking-widest transition cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? 'Đang xử lý...' : `XÁC NHẬN ĐẶT HÀNG (${formatVND(finalTotal)})`}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Column Right: Order Summary (Sticky Summary - 5 cols on md) */}
        <div className="lg:col-span-5 flex flex-col space-y-6 lg:sticky lg:top-28 h-fit pb-10 bg-white border border-gray-150 p-6 rounded-3xl shadow-sm">
          <h2 className="font-display text-xl font-black uppercase tracking-wider text-black border-b border-gray-100 pb-3">
            Tóm tắt đơn hàng
          </h2>
          
          {/* Estimated delivery dynamic date (Nike premium styling) */}
          <div className="p-3.5 bg-gray-50 border border-gray-150 text-[11px] text-black font-semibold uppercase tracking-wider rounded-xl">
            {getEstimatedDeliveryDate()}
          </div>

          {/* Products small list display */}
          <div className="max-h-60 overflow-y-auto space-y-4 pr-1 scrollbar-hide border-b border-gray-100 pb-5">
            {cartWithProducts.map((item) => (
              <div key={item.id} className="flex gap-3 text-xs leading-snug items-start">
                <img
                  src={item.product?.image[0]}
                  alt={item.product?.name}
                  className="h-14 w-14 rounded-lg object-cover border border-gray-150 shrink-0 bg-gray-50"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-grow min-w-0">
                  <span className="font-display text-xs font-black uppercase tracking-tight text-black block line-clamp-1">{item.product?.name}</span>
                  <span className="text-[10px] text-gray-400 font-bold block mt-0.5">{item.color} / Size: {item.size} • Số lượng: {item.quantity}</span>
                  <span className="font-display text-xs font-black text-black block mt-1.5">{formatVND(item.price * item.quantity)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Money calculations display */}
          <div className="space-y-3 text-xs border-b border-gray-100 pb-5">
            <div className="flex justify-between text-gray-500 font-semibold">
              <span>Tổng tiền hàng:</span>
              <span className="text-black">{formatVND(subTotal)}</span>
            </div>
            <div className="flex justify-between text-gray-500 font-semibold">
              <span>Phí vận chuyển:</span>
              <span className="text-black">
                {shippingFee === 0 ? 'Miễn phí' : formatVND(shippingFee)}
              </span>
            </div>

            {appliedCouponCode && (
              <div className="flex justify-between text-red-500 font-bold items-center uppercase tracking-wider text-[10px]">
                <span className="flex items-center gap-1.5">
                  <BadgePercent className="h-4 w-4" />
                  Mã giảm ({appliedCouponCode}):
                </span>
                <span>-{formatVND(discountAmount)}</span>
              </div>
            )}

            <div className="border-t border-gray-100 pt-3 mt-1 flex justify-between">
              <span className="font-display text-sm font-black uppercase tracking-wider text-black">Tổng thanh toán:</span>
              <span className="font-display text-lg font-black text-[#EE1111]">{formatVND(finalTotal)}</span>
            </div>
          </div>

          {/* Secured payment information banner */}
          <div className="flex items-start gap-2 text-[10px] text-gray-400 font-semibold leading-normal">
            <ShieldAlert className="h-4 w-4 shrink-0 text-gray-400" />
            <span>Mọi giao dịch thanh toán trực tuyến tại E-Market đều được mã hóa SSL/TLS 256-bit cực kỳ an toàn, bảo vệ tuyệt đối thông tin thẻ và tài khoản của bạn.</span>
          </div>

        </div>

      </div>

      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../redux/hooks';
import { removeFromCart, updateCartQuantity, toggleWishlist } from '../../redux/cartSlice';
import { setAuthModalOpen } from '../../redux/uiSlice';
import { Trash2, Heart, Plus, Minus, Tag, AlertCircle, ShoppingBag, ArrowLeft, ShieldCheck } from 'lucide-react';

export const Cart: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const cart = useAppSelector((state) => state.cart.cart);
  const wishlist = useAppSelector((state) => state.cart.wishlist);
  const products = useAppSelector((state) => state.shop.products);
  const coupons = useAppSelector((state) => state.shop.coupons);
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [selectedCourier, setSelectedCourier] = useState('Giao Hàng Nhanh (GHN)');

  // Map and calculate product info
  const enrichedCartItems = cart.map((item) => {
    const product = products.find((p) => p.id === item.productId || (p as any)._id === item.productId);
    const price = product ? (product.discountPrice ?? product.originalPrice) : 0;

    // Find stock level for selected color & size
    const matchedVariant = product?.variants.find(
      (v) => v.color.toLowerCase() === item.color.toLowerCase() && v.size.toLowerCase() === item.size.toLowerCase()
    );
    const stock = matchedVariant?.stock ?? 0;
    return {
      ...item,
      product,
      price,
      stock,
      totalPrice: price * item.quantity,
    };
  });

  const subTotal = enrichedCartItems.reduce((acc, item) => acc + item.totalPrice, 0);

  // Shipping estimation (Free shipping above 1M VND)
  const shippingFee = subTotal > 1000000 || subTotal === 0 ? 0 : 35000;

  // Coupon Application logic
  let discountAmount = 0;
  if (appliedCoupon) {
    const cp = coupons.find((c) => c.code.toUpperCase() === appliedCoupon.toUpperCase() && c.active);
    if (cp) {
      const isExp = new Date(cp.expiryDate).getTime() < Date.now();
      if (!isExp && subTotal >= cp.minOrder) {
        if (cp.type === 'percent') {
          discountAmount = Math.round((subTotal * cp.value) / 100);
        } else {
          discountAmount = cp.value;
        }
      }
    }
  }

  const finalTotal = Math.max(0, subTotal + shippingFee - discountAmount);

  const formatVND = (num: number) => {
    return num.toLocaleString('vi-VN') + ' ₫';
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess('');
    if (!couponInput) return;

    const matched = coupons.find((c) => c.code.toUpperCase() === couponInput.toUpperCase());
    if (!matched) {
      setCouponError('Mã giảm giá này không hợp lệ!');
      return;
    }
    if (!matched.active) {
      setCouponError('Mã giảm giá này đã tạm ngưng hoặc hết lượt sử dụng!');
      return;
    }
    const isExp = new Date(matched.expiryDate).getTime() < Date.now();
    if (isExp) {
      setCouponError('Mã giảm giá này đã hết hạn sử dụng!');
      return;
    }
    if (subTotal < matched.minOrder) {
      setCouponError(`Đơn hàng tối thiểu để áp dụng mã này là ${formatVND(matched.minOrder)}!`);
      return;
    }
    setAppliedCoupon(matched.code);
    setCouponSuccess(`Áp dụng mã thành công! Bạn được giảm ${
      matched.type === 'percent' ? `${matched.value}%` : formatVND(matched.value)
    }`);
  };

  const handleCheckoutClick = () => {
    if (cart.length === 0) return;
    navigate('/checkout', { state: { appliedCouponCode: appliedCoupon || undefined, selectedCourier } });
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Back navigation */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-black transition cursor-pointer mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Tiếp tục mua sắm
        </button>

        {enrichedCartItems.length === 0 ? (
          /* Empty Cart State (Nike minimalist style) */
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-5 max-w-md mx-auto">
            <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center border border-gray-150">
              <ShoppingBag className="h-7 w-7 text-gray-400" />
            </div>
            <h2 className="font-display text-2xl font-black uppercase tracking-tight text-black">Giỏ hàng của bạn đang trống</h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              Bạn chưa thêm sản phẩm nào vào túi mua sắm. Hãy khám phá ngay các bộ sưu tập giày thể thao và quần áo mới nhất của Nike để lựa chọn những sản phẩm ưng ý.
            </p>
            <button
              onClick={() => navigate('/')}
              className="h-12 px-8 rounded-full bg-black text-white hover:opacity-90 transition font-display text-[10.5px] font-black uppercase tracking-widest cursor-pointer"
            >
              Bắt đầu mua hàng
            </button>
          </div>
        ) : (
          /* Main Cart Content: 2-Column Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* Left Column: Cart items list */}
            <div className="lg:col-span-8 space-y-6">
              <h2 className="font-display text-xl sm:text-2xl font-black uppercase tracking-wider text-black border-b border-gray-100 pb-3">
                Túi mua sắm ({enrichedCartItems.reduce((sum, i) => sum + i.quantity, 0)})
              </h2>

              <div className="divide-y divide-gray-100">
                {enrichedCartItems.map((item) => {
                  const isItemLiked = wishlist.includes(item.productId);
                  return (
                    <div key={item.id} className="flex gap-5 py-6 first:pt-0 last:pb-0 items-start">
                      
                      {/* Product Thumbnail image */}
                      <div className="aspect-[4/5] w-24 sm:w-32 bg-gray-50 overflow-hidden shrink-0 border border-gray-200 rounded-lg">
                        {item.product && (
                          <img
                            src={item.product.image[0]}
                            alt={item.product.name}
                            className="h-full w-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        )}
                      </div>

                      {/* Product details and actions */}
                      <div className="flex-grow min-w-0 flex flex-col sm:flex-row justify-between gap-4">
                        
                        {/* Name and selection specs */}
                        <div className="space-y-1 sm:max-w-[70%]">
                          <h3 
                            onClick={() => navigate(`/product/${item.productId}`)}
                            className="font-display text-sm sm:text-base font-black uppercase tracking-tight text-black cursor-pointer hover:underline line-clamp-2 leading-snug"
                          >
                            {item.product?.name}
                          </h3>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                            {item.product?.brand}
                          </span>
                          
                          <div className="pt-2 text-xs text-gray-500 font-medium flex flex-wrap gap-x-4 gap-y-1">
                            <span>Màu sắc: <b>{item.color}</b></span>
                            <span>Kích cỡ: <b>{item.size}</b></span>
                          </div>

                          {/* Action icons row */}
                          <div className="flex items-center gap-4 pt-4">
                            {/* Favorite toggle */}
                            <button
                              type="button"
                              onClick={() => {
                                if (!currentUser) return dispatch(setAuthModalOpen(true));
                                dispatch(toggleWishlist(item.productId));
                              }}
                              className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-wider hover:text-black transition cursor-pointer bg-transparent border-none ${
                                isItemLiked ? 'text-[#EE1111]' : 'text-gray-400'
                              }`}
                            >
                              <Heart className={`h-4.5 w-4.5 ${isItemLiked ? 'fill-current' : ''}`} />
                              {isItemLiked ? 'Đã yêu thích' : 'Yêu thích'}
                            </button>

                            {/* Delete button */}
                            <button
                              type="button"
                              onClick={() => dispatch(removeFromCart(item.id))}
                              className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-gray-400 hover:text-red-650 transition cursor-pointer bg-transparent border-none"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                              Xóa sản phẩm
                            </button>
                          </div>
                        </div>

                        {/* Quantity selection & Price details */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-4">
                          
                          {/* Stepper Quantity selection */}
                          <div className="flex items-center rounded-none border border-gray-300 bg-transparent h-8 w-24 justify-between">
                            <button
                              type="button"
                              onClick={() => dispatch(updateCartQuantity({ cartItemId: item.id, quantity: item.quantity - 1 }))}
                              className="px-2 h-full text-gray-400 hover:text-black transition cursor-pointer flex items-center justify-center"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-xs font-extrabold text-black">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => dispatch(updateCartQuantity({ cartItemId: item.id, quantity: item.quantity + 1 }))}
                              className="px-2 h-full text-gray-400 hover:text-black transition cursor-pointer flex items-center justify-center"
                              disabled={item.quantity >= item.stock}
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>

                          {/* Prices details */}
                          <div className="text-right">
                            <span className="font-display text-sm sm:text-base font-black text-black block leading-none">
                              {formatVND(item.price * item.quantity)}
                            </span>
                            {item.quantity > 1 && (
                              <span className="text-[10px] text-gray-400 font-bold block mt-1">
                                {formatVND(item.price)} / sản phẩm
                              </span>
                            )}
                          </div>
                        </div>

                      </div>

                    </div>
                  );
                })}
              </div>

              {/* Courier service selecting block */}
              <div className="border-t border-gray-100 pt-6 space-y-3">
                <span className="font-display text-[10.5px] font-black uppercase tracking-wider text-black block">
                  Phương Thức Vận Chuyển
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'Giao Hàng Nhanh (GHN)', detail: 'Giao hàng nhanh từ 1 - 2 ngày. Ship nhanh nội ngoại thành.' },
                    { label: 'Giao Hàng Tiết Kiệm (GHTK)', detail: 'Tiết kiệm chi phí, vận chuyển ổn định trong 2 - 3 ngày.' },
                  ].map((cou) => (
                    <button
                      key={cou.label}
                      type="button"
                      onClick={() => setSelectedCourier(cou.label)}
                      className={`text-left p-3.5 border transition cursor-pointer rounded-xl select-none ${
                        selectedCourier === cou.label
                          ? 'border-black bg-gray-50'
                          : 'border-gray-200 hover:border-black/50 bg-white'
                      }`}
                    >
                      <span className="font-display text-[10px] font-black uppercase tracking-wider text-black block">{cou.label}</span>
                      <span className="text-[10px] text-gray-450 mt-1 block leading-normal font-semibold">{cou.detail}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Column: Order Summary (Sticky Summary) */}
            <div className="lg:col-span-4 flex flex-col space-y-6 lg:sticky lg:top-28 h-fit pb-10 bg-white">
              <h2 className="font-display text-xl sm:text-2xl font-black uppercase tracking-wider text-black border-b border-gray-100 pb-3">
                Tóm tắt đơn hàng
              </h2>

              {/* Price details calculation */}
              <div className="space-y-3.5 border-b border-gray-100 pb-5">
                <div className="flex justify-between text-xs text-gray-500 font-semibold">
                  <span>Tạm tính (Subtotal):</span>
                  <span className="text-black">{formatVND(subTotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 font-semibold">
                  <span>Vận chuyển ước tính:</span>
                  <span className="text-black">{shippingFee === 0 ? 'Miễn phí' : formatVND(shippingFee)}</span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-xs font-bold text-[#EE1111] uppercase tracking-wider">
                    <span>Giảm giá ({appliedCoupon}):</span>
                    <span>-{formatVND(discountAmount)}</span>
                  </div>
                )}
                
                <div className="border-t border-gray-100 pt-4 flex justify-between">
                  <span className="font-display text-sm font-black uppercase tracking-wider text-black">Tổng Thanh Toán:</span>
                  <span className="font-display text-lg font-black text-[#EE1111]">{formatVND(finalTotal)}</span>
                </div>

                {subTotal < 1000000 && (
                  <div className="text-center text-[9px] uppercase tracking-wider text-gray-500 bg-gray-50 border border-gray-100 py-2.5 mt-2 font-black">
                    Mua thêm {formatVND(1000000 - subTotal)} nữa để được miễn phí giao hàng!
                  </div>
                )}
              </div>

              {/* Coupon discount input form */}
              <div className="space-y-2.5 border-b border-gray-100 pb-5">
                <span className="font-display text-[10.5px] font-black uppercase tracking-wider text-black block">
                  Nhập Mã Giảm Giá
                </span>
                <form onSubmit={handleApplyCoupon} className="flex gap-0">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="ECOM10, GIAM100K09"
                    className="flex-grow border border-gray-300 border-r-0 bg-transparent px-3.5 py-2 text-xs text-black focus:ring-0 focus:border-black focus:outline-none uppercase"
                  />
                  <button
                    type="submit"
                    className="bg-black hover:bg-gray-900 transition text-white px-5 text-[10px] uppercase font-black tracking-widest cursor-pointer whitespace-nowrap border border-black"
                  >
                    Áp Dụng
                  </button>
                </form>
                {couponError && (
                  <p className="text-[10px] text-red-500 font-bold flex items-center gap-0.5">
                    <AlertCircle className="h-3 w-3" />
                    {couponError}
                  </p>
                )}
                {couponSuccess && (
                  <p className="text-[10px] text-green-600 font-black flex items-center gap-0.5 leading-normal">
                    Mã <b>{appliedCoupon}</b>: {couponSuccess}
                  </p>
                )}
                {/* Coupon Hint */}
                <span className="block text-[9.5px] text-gray-400 italic">
                  * ECOM10 (giảm 10% từ 500k), GIAM100K09 (giảm 100k từ 1.5M).
                </span>
              </div>

              {/* Admin restrictions alert */}
              {currentUser && (currentUser.role === 'admin' || currentUser.role === 'staff_inventory') ? (
                <div className="w-full flex items-center gap-2 bg-gray-50 border border-gray-250 p-4 text-xs font-bold text-gray-500 leading-normal">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-gray-400" />
                  <span>Admin không khả dụng thanh toán checkout.</span>
                </div>
              ) : (
                /* Primary Nike Checkout rounded-full CTA Button */
                <button
                  type="button"
                  onClick={handleCheckoutClick}
                  disabled={cart.length === 0}
                  className="w-full h-14 rounded-full bg-black hover:bg-black/90 text-white font-display text-xs font-black uppercase tracking-widest transition cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:border-gray-200"
                >
                  Tiến Hành Thanh Toán
                </button>
              )}

            </div>

          </div>
        )}

      </div>
    </div>
  );
};

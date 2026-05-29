import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../redux/hooks';
import { removeFromCart, updateCartQuantity } from '../../redux/cartSlice';
import { setCartDrawerOpen } from '../../redux/uiSlice';
import { X, Trash2, Plus, Minus, Tag, Ship, Ticket, Truck, AlertCircle } from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const isOpen = useAppSelector((state) => state.ui.isCartOpen);
  const onClose = () => dispatch(setCartDrawerOpen(false));

  const cart = useAppSelector((state) => state.cart.cart);
  const products = useAppSelector((state) => state.shop.products);
  const coupons = useAppSelector((state) => state.shop.coupons);

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [selectedCourier, setSelectedCourier] = useState('Giao Hàng Nhanh (GHN)');

  if (!isOpen) return null;

  // Find product and calc prices
  const enrichedCartItems = cart.map((item) => {
    const product = products.find((p) => p.id === item.productId);
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

  // Shipping estimation
  const shippingFee = subTotal > 1000000 || subTotal === 0 ? 0 : 35000;

  // Coupon Application
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
    onClose();
    navigate('/checkout', { state: { appliedCouponCode: appliedCoupon || undefined, selectedCourier } });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end font-sans">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 border-l border-gray-200">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 shrink-0">
          <div className="flex items-center gap-3">
            <h3 className="font-display text-base font-black uppercase tracking-wider text-black">Giỏ Hàng</h3>
            <span className="bg-black px-2.5 py-0.5 font-display text-[9px] uppercase tracking-wider font-bold text-white">
              {cart.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-black transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-grow px-6 py-4 overflow-y-auto space-y-6">
          {enrichedCartItems.length > 0 ? (
            <div className="space-y-4">
              {enrichedCartItems.map((item) => (
                <div key={item.id} className="flex gap-3 border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                  <div className="aspect-square w-20 overflow-hidden bg-gray-50 flex items-center justify-center shrink-0">
                    {item.product && (
                      <img
                        src={item.product.image[0]}
                        alt={item.product.name}
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    )}
                  </div>

                  {/* Content label information */}
                  <div className="flex-grow flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-[#1A1A1A] line-clamp-2 leading-snug">
                        {item.product?.name}
                      </h4>
                      <span className="text-[9.5px] text-[#8C7E6A] font-bold block mt-1 uppercase tracking-wider">
                        Phân loại: {item.color} — {item.size}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2.5">
                      {/* Quantity switcher */}
                      <div className="flex items-center rounded-none border border-[#1A1A1A]/15 bg-transparent">
                        <button
                          type="button"
                          onClick={() => dispatch(updateCartQuantity({ cartItemId: item.id, quantity: item.quantity - 1 }))}
                          className="px-2 py-1 text-[#1A1A1A]/60 hover:text-[#1A1A1A] transition cursor-pointer"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-[11px] font-bold text-[#1A1A1A]">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => dispatch(updateCartQuantity({ cartItemId: item.id, quantity: item.quantity + 1 }))}
                          className="px-2 py-1 text-[#1A1A1A]/60 hover:text-[#1A1A1A] transition cursor-pointer"
                          disabled={item.quantity >= item.stock}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="serif text-xs font-bold text-[#1A1A1A] block">
                          {formatVND(item.price)}
                        </span>

                        <button
                          type="button"
                          onClick={() => dispatch(removeFromCart(item.id))}
                          className="text-[10px] uppercase font-bold tracking-wider text-red-500 hover:text-red-700 transition mt-1.5 cursor-pointer flex items-center justify-end gap-0.5"
                        >
                          <Trash2 className="h-3 w-3" />
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 flex flex-col items-center justify-center gap-4">
              <Truck className="h-10 w-10 text-[#8C7E6A]/50" />
              <h4 className="serif text-lg font-bold italic text-[#1A1A1A]">Hộp đồ trống</h4>
              <p className="text-xs text-[#1A1A1A]/50 max-w-xs leading-relaxed">Hãy lựa chọn những sản phẩm ưng ý trong tạp chí của chúng tôi để lấp đầy giỏ hàng nhé.</p>

              <button
                type="button"
                onClick={onClose}
                className="mt-3 text-[10px] uppercase tracking-widest font-bold border border-[#1A1A1A] bg-[#1A1A1A] text-white px-5 py-2.5 hover:opacity-90 transition cursor-pointer"
              >
                Trở lại duyệt sản phẩm
              </button>
            </div>
          )}

          {cart.length > 0 && (
            <div className="border-t border-[#1A1A1A]/10 pt-6 space-y-5">
              {/* Shipping Carriers Choices */}
              <div className="space-y-2">
                <span className="text-[9.5px] font-bold uppercase text-[#8C7E6A] tracking-[0.2em] flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5" />
                  Phương Thức Vận Chuyển
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Giao Hàng Nhanh (GHN)', detail: 'Thời gian: 1-2 ngày. Phí ship: 35k' },
                    { label: 'Giao Hàng Tiết Kiệm (GHTK)', detail: 'Thời gian: 2-3 ngày. Phí ship: 35k' },
                  ].map((cou) => (
                    <button
                      key={cou.label}
                      onClick={() => setSelectedCourier(cou.label)}
                      className={`text-left p-2.5 rounded-none border text-[10.5px] transition cursor-pointer ${
                        selectedCourier === cou.label
                          ? 'border-[#1A1A1A] bg-[#F4F1ED]'
                          : 'border-[#1A1A1A]/10 hover:border-[#1A1A1A]/30 bg-[#FDFBF7]'
                      }`}
                    >
                      <span className="font-bold text-[#1A1A1A] block">{cou.label}</span>
                      <span className="text-[9.5px] text-[#1A1A1A]/45 mt-1 block leading-tight">{cou.detail}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-display text-xs font-bold uppercase tracking-widest text-black flex items-center gap-1">
                  <Ticket className="h-3.5 w-3.5" />
                  Mã Giảm Giá
                </span>
                <form onSubmit={handleApplyCoupon} className="flex gap-0">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="ECOM10, GIAM100K09"
                    className="flex-grow border border-gray-300 border-r-0 bg-transparent px-3 py-2 text-xs text-black focus:ring-0 focus:border-black focus:outline-none uppercase"
                  />
                  <button
                    type="submit"
                    className="bg-black hover:bg-gray-900 transition text-white px-5 text-[10px] uppercase font-bold tracking-wider cursor-pointer whitespace-nowrap border border-black"
                  >
                    Áp Dụng
                  </button>
                </form>
                {couponError && (
                  <p className="text-[10.5px] text-red-500 font-medium flex items-center gap-0.5">
                    <AlertCircle className="h-3 w-3" />
                    {couponError}
                  </p>
                )}
                {couponSuccess && (
                  <p className="text-[10.5px] text-green-600 font-bold flex items-center gap-0.5">
                    Mã đã áp dụng: <b>{appliedCoupon}</b>. {couponSuccess}
                  </p>
                )}
                {/* Quick Hint */}
                <span className="block text-[9.5px] text-[#1A1A1A]/40 italic">
                  * Gợi ý: ECOM10 (giảm 10% đơn từ 500k), GIAM100K09 (giảm 100k đơn từ 1.5M).
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer totals */}
        {cart.length > 0 && (
          <div className="border-t border-gray-200 p-6 bg-white shrink-0 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Tạm tính:</span>
                <span>{formatVND(subTotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Vận chuyển:</span>
                <span>{shippingFee === 0 ? 'Miễn phí' : formatVND(shippingFee)}</span>
              </div>

              {appliedCoupon && (
                <div className="flex justify-between text-sm font-bold text-[#EE1111]">
                  <span>Giảm giá ({appliedCoupon}):</span>
                  <span>-{formatVND(discountAmount)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-3 mt-2 flex justify-between">
                <span className="font-display text-xs font-black uppercase tracking-wider text-black">Tổng Cộng:</span>
                <span className="font-display text-xl font-black text-[#EE1111]">{formatVND(finalTotal)}</span>
              </div>
              {subTotal < 1000000 && (
                <div className="text-center text-[10px] uppercase tracking-wider text-gray-500 bg-gray-50 border border-gray-100 py-2 mt-2">
                  Mua thêm {formatVND(1000000 - subTotal)} nữa → Miễn phí giao hàng!
                </div>
              )}
            </div>

            <button
              type="button"
              id="proceed-checkout-action"
              onClick={handleCheckoutClick}
              className="btn-adidas-primary"
            >
              TIẾN HÀNH ĐẶT HÀNG
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../redux/hooks';
import { toggleWishlist, addToCart } from '../../redux/cartSlice';
import { setWishlistDrawerOpen } from '../../redux/uiSlice';
import { X, Heart, ShoppingCart, Trash } from 'lucide-react';

export const WishlistDrawer: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  const isOpen = useAppSelector((state) => state.ui.isWishlistOpen);
  const onClose = () => dispatch(setWishlistDrawerOpen(false));
  const wishlist = useAppSelector((state) => state.cart.wishlist);
  const products = useAppSelector((state) => state.shop.products);

  if (!isOpen) return null;

  const wishlistProducts = products.filter((p) => wishlist.includes(p.id));

  const formatVND = (num: number) => {
    return num.toLocaleString('vi-VN') + ' ₫';
  };

  const handleAddToCartQuick = (productId: string, color: string, size: string) => {
    dispatch(addToCart({ productId, color, size, quantity: 1 }))
      .unwrap()
      .then((res) => {
        alert(res.message);
      });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans text-xs">
      <div className="absolute inset-0 bg-[#1A1A1A]/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="absolute inset-y-0 right-0 max-w-md w-full bg-[#FDFBF7] shadow-editorial flex flex-col border-l border-[#1A1A1A]/10">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#1A1A1A]/10 flex items-center justify-between h-16 bg-[#F2EDE4]/30">
          <div className="flex items-center gap-2">
            <Heart className="h-4.5 w-4.5 text-[#8C7E6A] fill-current" />
            <span className="serif text-sm font-bold uppercase text-[#1A1A1A] tracking-[0.2em] font-serif">Yêu Thích Tuyển Chọn</span>
          </div>
          <button onClick={onClose} className="rounded-none p-1.5 hover:bg-[#1A1A1A]/5 text-gray-400">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content list body */}
        <div className="flex-grow overflow-y-auto p-4 space-y-4">
          {wishlistProducts.length > 0 ? (
            wishlistProducts.map((p) => (
              <div key={p.id} className="flex gap-4 p-3 rounded-none bg-[#FDFBF7] border border-[#1A1A1A]/10 hover:border-[#1A1A1A]/25 transition">
                <img
                  src={p.image[0]}
                  alt={p.name}
                  className="h-16 w-16 object-cover rounded-none border border-[#1A1A1A]/10 shrink-0 cursor-pointer"
                  onClick={() => {
                    navigate(`/product/${p.id}`);
                    onClose();
                  }}
                />

                <div className="flex-grow flex flex-col justify-between">
                  <div>
                    <span
                      onClick={() => {
                        navigate(`/product/${p.id}`);
                        onClose();
                      }}
                      className="serif text-xs font-semibold text-[#1A1A1A] block hover:text-[#8C7E6A] cursor-pointer truncate"
                    >
                      {p.name}
                    </span>
                    <span className="text-[11px] text-[#8C7E6A] font-bold block mt-1">
                      {formatVND(p.discountPrice ?? p.originalPrice)}
                    </span>
                  </div>

                  <div className="flex gap-2 justify-end mt-2">
                    <button
                      onClick={() => dispatch(toggleWishlist(p.id))}
                      className="p-1 px-2.5 border border-[#1A1A1A]/10 rounded-none bg-transparent hover:bg-red-50 text-red-5000 transition cursor-pointer flex items-center gap-1 font-bold text-[9px] uppercase tracking-wider text-red-650"
                    >
                      <Trash className="h-3 w-3" />
                      Xóa
                    </button>

                    <button
                      onClick={() => handleAddToCartQuick(p.id, p.colors[0], p.sizes[0])}
                      className="p-1 px-2.5 bg-[#1A1A1A] rounded-none text-[#FDFBF7] hover:opacity-90 transition cursor-pointer flex items-center gap-1 font-bold text-[9px] uppercase tracking-wider"
                    >
                      <ShoppingCart className="h-3 w-3" />
                      Thêm giỏ
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 space-y-3">
              <Heart className="h-10 w-10 text-[#8C7E6A]/50 mx-auto" />
              <p className="serif text-base font-bold italic text-[#1A1A1A]">Danh tuyển đang trống</p>
              <p className="text-[10.5px] text-[#1A1A1A]/40 max-w-xs mx-auto leading-relaxed">Hãy chọn mẫu thiết kế bạn ưng ý trong khi duyệt album và lưu dấu tại đây.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

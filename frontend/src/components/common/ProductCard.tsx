import React from 'react';
import { Product } from '../../types';
import { Star, Heart, ShoppingBag } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../redux/hooks';
import { toggleWishlist } from '../../redux/cartSlice';
import { setAuthModalOpen, setAddedToFavoritesOpen, setAddedToFavoritesItem } from '../../redux/uiSlice';

interface ProductCardProps {
  product: Product;
  onOpenDetail: (p: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onOpenDetail }) => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const wishlist = useAppSelector((state) => state.cart.wishlist);
  const isLiked = wishlist.includes(product.id);

  const formatVND = (num: number) => num.toLocaleString('vi-VN') + ' ₫';

  const hasDiscount = product.discountPrice !== undefined;
  const discountPct = hasDiscount
    ? Math.round(((product.originalPrice - (product.discountPrice || 0)) / product.originalPrice) * 100)
    : 0;
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);

  return (
    <div
      id={`pcard-${product.id}`}
      className="group relative flex flex-col bg-white cursor-pointer"
      onClick={() => onOpenDetail(product)}
    >
      {/* Image container */}
      <div className="relative w-full aspect-[4/5] overflow-hidden bg-gray-100 product-img-zoom">
        <img
          src={product.image[0]}
          alt={product.name}
          className="h-full w-full object-cover object-center"
          referrerPolicy="no-referrer"
        />

        {/* Badges */}
        <div className="absolute left-0 top-3 z-10 flex flex-col gap-1">
          {hasDiscount && (
            <span className="bg-[#EE1111] px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold text-white leading-none">
              -{discountPct}%
            </span>
          )}
          {totalStock === 0 && (
            <span className="bg-black px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold text-white leading-none">
              Hết hàng
            </span>
          )}
          {product.featured && totalStock > 0 && !hasDiscount && (
            <span className="bg-black px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold text-white leading-none">
              Nổi bật
            </span>
          )}
        </div>

        {/* Wishlist */}
        {(!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'staff_inventory')) && (
          <button
            type="button"
            id={`wish-btn-${product.id}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!currentUser) return dispatch(setAuthModalOpen(true));
              
              const isAdding = !isLiked;
              if (isAdding) {
                dispatch(setAddedToFavoritesItem({
                  productId: product.id,
                  name: product.name,
                  image: product.image[0],
                  brand: product.brand,
                  price: product.discountPrice ?? product.originalPrice
                }));
                dispatch(setAddedToFavoritesOpen(true));
              }
              dispatch(toggleWishlist(product.id));
            }}
            className="absolute right-3 top-3 z-10 p-2 bg-white text-black hover:text-[#EE1111] transition cursor-pointer opacity-0 group-hover:opacity-100"
          >
            <Heart className={`h-4.5 w-4.5 transition-colors ${isLiked ? 'fill-[#EE1111] text-[#EE1111]' : ''}`} />
          </button>
        )}

        {/* Quick shop overlay */}
        <div className="absolute inset-x-0 bottom-0 z-10 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <div className="bg-black text-white flex items-center justify-center gap-2 py-3 text-[11px] font-display font-700 uppercase tracking-widest">
            <ShoppingBag className="h-3.5 w-3.5" />
            Xem Chi Tiết
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="pt-3 pb-1">
        {/* Brand */}
        <span className="font-display text-[10px] font-700 uppercase tracking-[0.15em] text-gray-500 block">
          {product.brand}
        </span>

        {/* Name */}
        <h4 className="mt-1 font-sans text-sm font-600 text-black leading-snug line-clamp-2 hover:text-gray-600 transition">
          {product.name}
        </h4>

        {/* Rating */}
        <div className="mt-1.5 flex items-center gap-1">
          <div className="flex items-center gap-0.5 text-[#EE1111]">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${i < Math.round(product.rating) ? 'fill-current' : 'fill-gray-200 text-gray-200'}`}
              />
            ))}
          </div>
          <span className="text-[10px] text-gray-500 font-medium">({product.salesCount} đã bán)</span>
        </div>

        {/* Price */}
        <div className="mt-2 flex items-baseline gap-2">
          {hasDiscount ? (
            <>
              <span className="font-display text-base font-800 text-[#EE1111]">
                {formatVND(product.discountPrice!)}
              </span>
              <span className="text-xs text-gray-400 line-through font-normal">
                {formatVND(product.originalPrice)}
              </span>
            </>
          ) : (
            <span className="font-display text-base font-800 text-black">
              {formatVND(product.originalPrice)}
            </span>
          )}
        </div>

        {/* Low stock warning */}
        {totalStock > 0 && totalStock <= 10 && (
          <span className="mt-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#EE1111]">
            Chỉ còn {totalStock} sản phẩm
          </span>
        )}
      </div>
    </div>
  );
};

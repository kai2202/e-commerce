import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../redux/hooks';
import { toggleWishlist } from '../../redux/cartSlice';
import { Heart, Trash2, ArrowLeft } from 'lucide-react';

export const Favorites: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const wishlist = useAppSelector((state) => state.cart.wishlist);
  const products = useAppSelector((state) => state.shop.products);
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  // Filter products that are in the user's wishlist
  const favoriteProducts = products.filter((p) => wishlist.includes(p.id));

  const formatVND = (num: number) => {
    return num.toLocaleString('vi-VN') + ' ₫';
  };

  return (
    <div className="min-h-screen bg-white font-sans animate-fade-in">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Back Link */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-black transition cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </button>

        {/* Standalone Favorites Header */}
        <div className="flex items-baseline justify-between border-b border-gray-200 pb-4">
          <h1 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-wider text-black">
            Danh Sách Yêu Thích <span className="font-sans font-medium text-gray-400 normal-case">({favoriteProducts.length})</span>
          </h1>
        </div>

        {/* Standalone Favorites Grid */}
        {favoriteProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {favoriteProducts.map((prod) => {
              const isDiscount = prod.discountPrice !== undefined;
              return (
                <div key={prod.id} className="relative group flex flex-col space-y-2.5">
                  {/* Remove favorite circular button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      dispatch(toggleWishlist(prod.id));
                    }}
                    className="absolute top-3 right-3 z-20 h-8 w-8 bg-white/90 hover:bg-white text-black hover:text-[#EE1111] rounded-full flex items-center justify-center shadow-md transition cursor-pointer select-none"
                    aria-label="Xóa khỏi yêu thích"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  {/* Product Image Link */}
                  <div 
                    onClick={() => navigate(`/product/${prod.id}`)}
                    className="aspect-[4/5] overflow-hidden bg-gray-50 border border-gray-100 cursor-pointer rounded-2xl relative"
                  >
                    <img
                      src={prod.image[0]}
                      alt={prod.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-103"
                      referrerPolicy="no-referrer"
                    />
                    {isDiscount && (
                      <span className="absolute top-0 left-0 bg-[#EE1111] text-white font-display text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-br-lg rounded-tl-2xl">
                        Sale
                      </span>
                    )}
                  </div>

                  {/* Texts Info details */}
                  <div 
                    onClick={() => navigate(`/product/${prod.id}`)}
                    className="space-y-1 text-xs cursor-pointer"
                  >
                    <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">E-Market Sport</span>
                    <span className="font-display font-black text-xs text-black block uppercase tracking-tight line-clamp-1 group-hover:underline">
                      {prod.name}
                    </span>
                    
                    <div className="flex items-center gap-2 pt-0.5">
                      {isDiscount ? (
                        <>
                          <span className="font-display font-black text-[#EE1111] text-xs">
                            {formatVND(prod.discountPrice!)}
                          </span>
                          <span className="font-display font-semibold text-gray-450 line-through text-[11px]">
                            {formatVND(prod.originalPrice)}
                          </span>
                        </>
                      ) : (
                        <span className="font-display font-black text-black text-xs">
                          {formatVND(prod.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick Shop full-width button */}
                  <button
                    type="button"
                    onClick={() => navigate(`/product/${prod.id}`)}
                    className="h-10 w-full rounded-full bg-black text-white hover:opacity-90 transition font-display text-[10px] font-black uppercase tracking-widest cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    Xem chi tiết
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="border border-gray-150 rounded-3xl p-16 text-center space-y-4 max-w-lg mx-auto bg-white">
            <Heart className="h-10 w-10 text-gray-300 mx-auto animate-pulse" />
            <div className="space-y-1.5">
              <h4 className="font-display text-sm font-black uppercase tracking-widest text-black">Danh sách yêu thích trống</h4>
              <p className="text-[10px] text-gray-450 max-w-xs mx-auto leading-normal font-semibold">
                Lưu giữ những sản phẩm bạn yêu thích nhất tại đây để chuẩn bị cho những hành trình bứt phá mới.
              </p>
            </div>
            <button 
              onClick={() => navigate('/?view=collection')}
              className="h-11 px-6 rounded-full bg-black text-white hover:opacity-90 transition font-display text-[10px] font-black uppercase tracking-widest cursor-pointer shadow-sm"
            >
              MUA SẮM NGAY
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

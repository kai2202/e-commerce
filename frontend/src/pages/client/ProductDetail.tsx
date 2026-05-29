import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../redux/hooks';
import { addToCart as addToCartAction, toggleWishlist as toggleWishlistAction } from '../../redux/cartSlice';
import { setAuthModalOpen, setAddedToBagOpen, setAddedToBagItem, setAddedToFavoritesOpen, setAddedToFavoritesItem } from '../../redux/uiSlice';
import { fetchProductReviews, submitProductReview, fetchProductById } from '../../redux/shopSlice';
import { Heart, Star, ShoppingBag, Plus, Minus, ShieldCheck, RefreshCw, Truck, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const products = useAppSelector((state) => state.shop.products);
  const status = useAppSelector((state) => state.shop.status);
  const reviews = useAppSelector((state) => state.shop.reviews);
  const wishlist = useAppSelector((state) => state.cart.wishlist);
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  const product = products.find((p) => p.id === id);

  const [activeImg, setActiveImg] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [buyQty, setBuyQty] = useState(1);
  
  // Nike Accordion States
  const [descOpen, setDescOpen] = useState(true);
  const [specsOpen, setSpecsOpen] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [shippingOpen, setShippingOpen] = useState(false);

  const [mobileActiveIdx, setMobileActiveIdx] = useState(0);

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Reviews Form State
  const [newRating, setNewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewFormError, setReviewFormError] = useState('');
  const [reviewFormSuccess, setReviewFormSuccess] = useState('');

  useEffect(() => {
    if (product) {
      setActiveImg(product.image[0]);
      setSelectedColor(product.colors[0] || '');
      setSelectedSize(product.sizes[0] || '');
      setBuyQty(1);
      setMobileActiveIdx(0);
      setDescOpen(true);
      setSpecsOpen(false);
      setReviewsOpen(false);
      setShippingOpen(false);
      setSuccessMsg('');
      setErrorMsg('');
      setReviewFormError('');
      setReviewFormSuccess('');
    }
  }, [product]);

  useEffect(() => {
    if (product) {
      dispatch(fetchProductReviews(product.id));
    }
  }, [dispatch, product]);

  useEffect(() => {
    if (!product && id) {
      dispatch(fetchProductById(id));
    }
  }, [dispatch, product, id]);

  if (!product) {
    if (status === 'loading') {
      return (
        <div className="flex flex-col items-center justify-center py-40 space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-black" />
          <p className="text-[10px] text-black/60 font-bold tracking-wider uppercase">Đang tải thông tin sản phẩm...</p>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <h2 className="font-display text-xl font-bold uppercase text-gray-700">Sản phẩm không tồn tại</h2>
        <button 
          onClick={() => navigate('/')} 
          className="rounded-full border border-black bg-black text-white hover:opacity-90 transition font-bold uppercase tracking-widest text-[10px] py-3.5 px-8 cursor-pointer"
        >
          Quay lại trang chủ
        </button>
      </div>
    );
  }

  const isLiked = wishlist.includes(product.id);
  const hasDiscount = product.discountPrice !== undefined;
  
  const formatVND = (num: number) => {
    return num.toLocaleString('vi-VN') + ' ₫';
  };

  const currentVariant = product.variants.find(
    (v) => v.color.toLowerCase() === selectedColor.toLowerCase() && v.size.toLowerCase() === selectedSize.toLowerCase()
  );

  const matchedReviews = reviews.filter((r) => r.productId === product.id);

  const handleAddToCart = () => {
    if (!currentUser) {
      dispatch(setAuthModalOpen(true));
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');
    if (!selectedColor || !selectedSize) {
      setErrorMsg('Vui lòng chọn đầy đủ màu sắc và kích cỡ!');
      return;
    }

    dispatch(addToCartAction({ productId: product.id, color: selectedColor, size: selectedSize, quantity: buyQty }))
      .unwrap()
      .then((res) => {
        if (res.success) {
          // Open Nike-style Added to Bag Modal Popup
          dispatch(setAddedToBagItem({
            productId: product.id,
            name: product.name,
            image: product.image[0],
            brand: product.brand,
            color: selectedColor,
            size: selectedSize,
            price: product.discountPrice ?? product.originalPrice,
            quantity: buyQty
          }));
          dispatch(setAddedToBagOpen(true));
        } else {
          setErrorMsg(res.message);
        }
      });
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      dispatch(setAuthModalOpen(true));
      return;
    }
    if (!newComment.trim()) {
      setReviewFormError('Vui lòng nhập nội dung đánh giá!');
      return;
    }
    setReviewFormError('');
    setReviewFormSuccess('');
    setIsSubmittingReview(true);

    dispatch(submitProductReview({
      productId: product.id,
      rating: newRating,
      comment: newComment
    }))
      .unwrap()
      .then(() => {
        setReviewFormSuccess('Gửi đánh giá thành công!');
        setNewComment('');
        setNewRating(5);
        setTimeout(() => setReviewFormSuccess(''), 3000);
      })
      .catch((err) => {
        setReviewFormError(err || 'Gửi đánh giá thất bại!');
      })
      .finally(() => {
        setIsSubmittingReview(false);
      });
  };

  return (
    <div className="min-h-screen bg-white font-sans animate-fade-in">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Back link */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-black transition cursor-pointer mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </button>

        {/* Nike 2-Column Asymmetrical Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
          
          {/* Column Left: Visual Premium Gallery (occupies 7 cols on md) */}
          <div className="md:col-span-7 flex flex-col gap-4">
            
            {/* Desktop View: Stack of large 4:5 images */}
            <div className="hidden md:flex flex-col gap-4 w-full">
              {product.image.map((img, idx) => (
                <div key={idx} className="aspect-[4/5] overflow-hidden bg-gray-50 flex items-center justify-center border border-gray-200">
                  <img
                    src={img}
                    alt={`${product.name} - góc ${idx + 1}`}
                    className="h-full w-full object-cover hover:scale-[1.02] transition-all duration-500 select-none animate-fade-in"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ))}
            </div>

            {/* Mobile View: Horizontal scroll-snap carousel */}
            <div className="block md:hidden relative w-full">
              <div 
                className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide w-full aspect-[4/5] bg-gray-50 border border-gray-250"
                onScroll={(e) => {
                  const target = e.target as HTMLDivElement;
                  const index = Math.round(target.scrollLeft / target.clientWidth);
                  setMobileActiveIdx(index);
                }}
              >
                {product.image.map((img, idx) => (
                  <div key={idx} className="w-full h-full shrink-0 snap-start flex items-center justify-center">
                    <img
                      src={img}
                      alt={`${product.name} - mobile ${idx + 1}`}
                      className="h-full w-full object-cover select-none"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ))}
              </div>
              {/* Image pagination indicator overlay */}
              {product.image.length > 1 && (
                <div className="absolute bottom-4 right-4 bg-black/75 px-3 py-1 rounded-full text-white text-[10px] font-bold tracking-wider font-mono">
                  {mobileActiveIdx + 1} / {product.image.length}
                </div>
              )}
            </div>
          </div>

          {/* Column Right: Sticky Details (occupies 5 cols on md) */}
          <div className="md:col-span-5 flex flex-col space-y-6 sticky top-28 h-fit pb-10">
            <div>
              <span className="font-display text-[10px] font-black uppercase tracking-[0.25em] text-[#EE1111]">{product.brand}</span>
              <h2 className="font-display mt-2 text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none text-black">
                {product.name}
              </h2>
              
              {/* Stars & sales meta */}
              <div className="mt-4 flex items-center gap-3 border-b border-gray-150 pb-4">
                <div className="flex text-amber-500 gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'fill-current text-[#EE1111]' : 'text-gray-200'}`} />
                  ))}
                </div>
                <span className="text-xs font-black text-black font-display">{product.rating}</span>
                <span className="text-gray-200">|</span>
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{matchedReviews.length} Đánh giá</span>
                <span className="text-gray-200">|</span>
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Đã bán {product.salesCount}</span>
              </div>
            </div>

            {/* Price section */}
            <div className="py-2 border-b border-gray-150">
              <div className="flex items-baseline gap-3.5">
                {hasDiscount ? (
                  <>
                    <span className="font-display text-3xl font-black text-[#EE1111] tracking-tight">
                      {formatVND(product.discountPrice!)}
                    </span>
                    <span className="text-base text-gray-400 line-through font-bold">
                      {formatVND(product.originalPrice)}
                    </span>
                    <span className="font-display text-[10px] font-black uppercase tracking-wider bg-[#EE1111] text-white px-2 py-0.5 rounded-xs">
                      -{Math.round(((product.originalPrice - (product.discountPrice || 0)) / product.originalPrice) * 100)}%
                    </span>
                  </>
                ) : (
                  <span className="font-display text-3xl font-black text-black tracking-tight">
                    {formatVND(product.originalPrice)}
                  </span>
                )}
              </div>
            </div>

            {/* Colors picker */}
            {product.colors.length > 0 && product.colors[0] !== 'Tự nhiên' && (
              <div className="space-y-2.5">
                <label className="block font-display text-[11px] font-black uppercase tracking-[0.2em] text-black">
                  Màu Sắc: <span className="font-normal normal-case tracking-normal text-gray-500">{selectedColor}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => { setSelectedColor(color); setSuccessMsg(''); setErrorMsg(''); }}
                      className={`px-4 py-2 text-xs font-bold border transition duration-150 cursor-pointer ${
                        selectedColor === color
                          ? 'border-black bg-black text-white'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-black'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sizes picker - Premium Nike size grid with slash indicator for out-of-stock sizes */}
            {product.sizes.length > 0 && product.sizes[0] !== 'Tiêu chuẩn' && (
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <label className="block font-display text-[11px] font-black uppercase tracking-[0.2em] text-black">Chọn Kích Cỡ</label>
                  <span className="text-[10px] font-bold text-gray-450 hover:underline cursor-pointer">Bảng Size</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {product.sizes.map((size) => {
                    // Check if this specific size is out of stock in database for selectedColor
                    const targetVariant = product.variants.find(
                      (v) => v.color.toLowerCase() === selectedColor.toLowerCase() && v.size.toLowerCase() === size.toLowerCase()
                    );
                    const isOutOfStock = !targetVariant || targetVariant.stock <= 0;

                    if (isOutOfStock) {
                      return (
                        <div
                          key={size}
                          className="relative flex items-center justify-center border border-gray-200 bg-gray-50 text-gray-350 text-xs py-3 font-semibold select-none cursor-not-allowed overflow-hidden opacity-50"
                          title="Hết hàng"
                        >
                          {size}
                          {/* Diagonal line through out of stock sizes */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-[140%] h-[1px] bg-gray-300 rotate-[25deg] transform"></div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => { setSelectedSize(size); setSuccessMsg(''); setErrorMsg(''); }}
                        className={`relative border text-xs py-3 font-bold cursor-pointer transition flex items-center justify-center rounded-none select-none ${
                          selectedSize === size
                            ? 'border-black bg-black text-white'
                            : 'border-gray-200 bg-white text-black hover:border-black'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stock details */}
            {currentVariant && (
              <div className="text-xs font-semibold flex items-center justify-between border-t border-gray-100 pt-3">
                <span className="text-gray-400">Trạng thái kho:</span>
                {currentVariant.stock > 0 ? (
                  <span className="font-bold text-black">{currentVariant.stock > 10 ? 'Còn hàng' : `Chỉ còn ${currentVariant.stock} sản phẩm`}</span>
                ) : (
                  <span className="font-display text-[10px] font-extrabold uppercase tracking-wider text-[#EE1111]">Tạm Hết Hàng</span>
                )}
              </div>
            )}

            {/* Purchase Operations Panel */}
            {currentUser && (currentUser.role === 'admin' || currentUser.role === 'staff_inventory') ? (
              <div className="w-full flex items-center gap-2 bg-gray-50 border border-gray-250 p-4 text-xs font-bold text-gray-500 leading-normal">
                <ShieldCheck className="h-5 w-5 shrink-0 text-gray-400" />
                <span>Bạn đang xem sản phẩm với tư cách Admin. Thêm giỏ hàng không khả dụng.</span>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* Select Quantity Row (Sleek selection before CTAs) */}
                {(!currentVariant || currentVariant.stock > 0) && (
                  <div className="flex items-center justify-between py-1">
                    <span className="font-display text-[11px] font-black uppercase tracking-[0.2em] text-black">Số Lượng:</span>
                    <div className="flex items-center border border-gray-300 rounded-none h-9 bg-transparent w-28 justify-between">
                      <button
                        type="button"
                        onClick={() => setBuyQty((prev) => Math.max(1, prev - 1))}
                        className="px-2.5 h-full text-gray-500 hover:text-black cursor-pointer transition flex items-center justify-center"
                        disabled={currentVariant && currentVariant.stock <= 0}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-xs font-extrabold text-black">{buyQty}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const max = currentVariant?.stock ?? 99;
                          setBuyQty((prev) => (prev < max ? prev + 1 : prev));
                        }}
                        className="px-2.5 h-full text-gray-500 hover:text-black cursor-pointer transition flex items-center justify-center"
                        disabled={currentVariant && buyQty >= currentVariant.stock}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Nike Stacked CTA Buttons (Add to Bag stacked above Favorite) */}
                <div className="flex flex-col gap-3">
                  
                  {/* Primary add to bag button */}
                  <button
                    type="button"
                    id="add-to-cart-action"
                    onClick={handleAddToCart}
                    disabled={currentVariant && currentVariant.stock <= 0}
                    className="w-full h-14 rounded-full bg-black hover:bg-black/90 text-white font-display text-xs font-black uppercase tracking-widest transition cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:border-gray-200"
                  >
                    <ShoppingBag className="h-5 w-5" />
                    {currentVariant && currentVariant.stock <= 0 ? 'Hiện Tại Hết Hàng' : 'THÊM VÀO GIỎ HÀNG'}
                  </button>

                  {/* Favorite button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      if (!currentUser) return dispatch(setAuthModalOpen(true));
                      
                      const isAdding = !isLiked;
                      if (isAdding) {
                        dispatch(setAddedToFavoritesItem({
                          productId: product.id,
                          name: product.name,
                          image: product.image[0],
                          brand: product.brand,
                          price: product.discountPrice ?? product.originalPrice,
                          color: selectedColor || product.colors[0],
                          size: selectedSize || product.sizes[0]
                        }));
                        dispatch(setAddedToFavoritesOpen(true));
                      }
                      dispatch(toggleWishlistAction(product.id));
                    }}
                    className={`w-full h-14 rounded-full border transition cursor-pointer flex items-center justify-center gap-2 font-display text-xs font-black uppercase tracking-widest ${
                      isLiked 
                        ? 'border-[#EE1111] bg-red-50 text-[#EE1111]' 
                        : 'border-gray-300 bg-white text-black hover:border-black'
                    }`}
                  >
                    <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
                    {isLiked ? 'Đã Yêu Thích' : 'Yêu Thích'}
                  </button>
                </div>
              </div>
            )}

            {/* Notification Messages */}
            {successMsg && (
              <div className="bg-black text-white p-3.5 text-center text-xs font-bold uppercase tracking-wider shadow-sm animate-scale-up">
                {successMsg}
              </div>
            )}
            {errorMsg && (
              <div className="bg-[#EE1111] text-white p-3.5 text-center text-xs font-bold uppercase tracking-wider shadow-sm animate-scale-up">
                {errorMsg}
              </div>
            )}

            {/* ── Premium Nike Editorial Flat Accordions ────────────────────────── */}
            <div className="border-t border-gray-250 pt-2 divide-y divide-gray-200">
              
              {/* Accordion 1: Description */}
              <div className="py-5">
                <button
                  type="button"
                  onClick={() => setDescOpen(!descOpen)}
                  className="w-full flex items-center justify-between font-display text-xs font-black uppercase tracking-widest text-black cursor-pointer bg-transparent border-none text-left focus:outline-none"
                >
                  <span>Mô Tả Sản Phẩm</span>
                  {descOpen ? <ChevronUp className="h-4.5 w-4.5" /> : <ChevronDown className="h-4.5 w-4.5" />}
                </button>
                {descOpen && (
                  <div className="mt-4 text-xs text-gray-650 leading-relaxed font-sans whitespace-pre-line animate-fade-in pr-2">
                    {product.description}
                  </div>
                )}
              </div>

              {/* Accordion 2: Specs */}
              <div className="py-5">
                <button
                  type="button"
                  onClick={() => setSpecsOpen(!specsOpen)}
                  className="w-full flex items-center justify-between font-display text-xs font-black uppercase tracking-widest text-black cursor-pointer bg-transparent border-none text-left focus:outline-none"
                >
                  <span>Thông Số Kỹ Thuật</span>
                  {specsOpen ? <ChevronUp className="h-4.5 w-4.5" /> : <ChevronDown className="h-4.5 w-4.5" />}
                </button>
                {specsOpen && (
                  <div className="mt-4 rounded-none border border-gray-200 overflow-hidden divide-y divide-gray-200 animate-fade-in">
                    {product.specs.length > 0 ? (
                      product.specs.map((spec, idx) => (
                        <div key={idx} className="grid grid-cols-3 p-3.5 text-xs bg-gray-50/50">
                          <span className="font-bold text-gray-500 uppercase tracking-wider text-[9px]">{spec.label}</span>
                          <span className="col-span-2 text-black font-semibold">{spec.value}</span>
                        </div>
                      ))
                    ) : (
                      <p className="p-3 text-center text-xs text-gray-400">Sản phẩm này chưa cập nhật thông số.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Accordion 3: Delivery & Returns */}
              <div className="py-5">
                <button
                  type="button"
                  onClick={() => setShippingOpen(!shippingOpen)}
                  className="w-full flex items-center justify-between font-display text-xs font-black uppercase tracking-widest text-black cursor-pointer bg-transparent border-none text-left focus:outline-none"
                >
                  <span>Vận Chuyển & Trả Hàng</span>
                  {shippingOpen ? <ChevronUp className="h-4.5 w-4.5" /> : <ChevronDown className="h-4.5 w-4.5" />}
                </button>
                {shippingOpen && (
                  <div className="mt-4 text-xs text-gray-650 leading-relaxed font-sans animate-fade-in pr-2 space-y-2">
                    <p>Đơn hàng của bạn sẽ được giao **miễn phí** cho mọi hóa đơn trị giá từ **1.000.000 ₫** trở lên.</p>
                    <p>• Thời gian vận chuyển dự kiến: **3 - 5 ngày làm việc** tùy khu vực.</p>
                    <p>• Chính sách đổi trả hàng: Bạn có thể hoàn trả các sản phẩm còn nguyên tem mác hoàn toàn **miễn phí trong vòng 7 ngày** kể từ ngày nhận hàng vì bất cứ lý do nào.</p>
                  </div>
                )}
              </div>

              {/* Guarantee badges */}
              <div className="py-5">
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div className="flex flex-col items-center text-center p-2.5 bg-gray-50 border border-gray-150">
                    <ShieldCheck className="h-4.5 w-4.5 text-black mb-1 shrink-0" />
                    <span className="font-display text-[9px] font-black uppercase tracking-wide text-black block leading-none">100% Chính Hãng</span>
                  </div>
                  <div className="flex flex-col items-center text-center p-2.5 bg-gray-50 border border-gray-150">
                    <Truck className="h-4.5 w-4.5 text-black mb-1 shrink-0" />
                    <span className="font-display text-[9px] font-black uppercase tracking-wide text-black block leading-none">Freeship từ 1M</span>
                  </div>
                  <div className="flex flex-col items-center text-center p-2.5 bg-gray-50 border border-gray-150">
                    <RefreshCw className="h-4.5 w-4.5 text-black mb-1 shrink-0" />
                    <span className="font-display text-[9px] font-black uppercase tracking-wide text-black block leading-none">7 Ngày Đổi Trả</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom Section: Full Width Reviews List & Ratings Form ── */}
        <div className="border-t border-gray-200 mt-16 pt-10 space-y-10">
          <h3 className="font-display text-xl font-black uppercase tracking-wider text-black">
            Đánh Giá từ khách hàng ({matchedReviews.length})
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* Reviews Form block (4 cols) */}
            {(!currentUser || currentUser.role === 'customer') && (
              <div className="lg:col-span-4 bg-gray-50 border border-gray-200 p-6 rounded-none space-y-4">
                <h4 className="font-display text-sm font-black uppercase tracking-widest text-black">Viết nhận xét của bạn</h4>
                
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  {/* Select stars */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-black text-black uppercase tracking-wider block">Chấm điểm sao:</span>
                    <div className="flex gap-1 text-amber-400">
                      {[1, 2, 3, 4, 5].map((starNum) => {
                        const activeColor = (hoverRating ?? newRating) >= starNum ? 'text-amber-500 fill-current' : 'text-gray-200';
                        return (
                          <button
                            key={starNum}
                            type="button"
                            onClick={() => setNewRating(starNum)}
                            onMouseEnter={() => setHoverRating(starNum)}
                            onMouseLeave={() => setHoverRating(null)}
                            className="p-0.5 transition cursor-pointer hover:scale-110"
                          >
                            <Star className={`h-6 w-6 ${activeColor}`} />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Comment */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-black text-black uppercase tracking-wider">Ý kiến bình luận</label>
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Chia sẻ cảm nhận thực tế của bạn..."
                      rows={4}
                      className="w-full rounded-none border border-gray-300 bg-white px-3.5 py-2.5 text-xs text-black focus:border-black focus:ring-0 focus:outline-none"
                    />
                  </div>

                  {reviewFormError && (
                    <div className="text-xs font-bold text-red-650 bg-red-50 p-2.5 border border-red-150">
                      {reviewFormError}
                    </div>
                  )}
                  {reviewFormSuccess && (
                    <div className="text-xs font-bold text-green-600 bg-green-50 p-2.5 border border-green-150">
                      {reviewFormSuccess}
                    </div>
                  )}

                  {currentUser ? (
                    <button
                      type="submit"
                      disabled={isSubmittingReview}
                      className="w-full bg-black border border-black hover:bg-black/90 px-6 py-3 text-[10px] uppercase tracking-widest font-black text-white transition disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer rounded-full"
                    >
                      {isSubmittingReview ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : null}
                      Gửi Nhận Xét
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => dispatch(setAuthModalOpen(true))}
                      className="w-full border border-black hover:bg-gray-100 px-6 py-3 text-[10px] uppercase tracking-widest font-black text-black transition cursor-pointer rounded-full bg-white"
                    >
                      Đăng Nhập Để Gửi Đánh Giá
                    </button>
                  )}
                </form>
              </div>
            )}

            {/* Review List block (8 cols or full if no form) */}
            <div className={`${(!currentUser || currentUser.role === 'customer') ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-6`}>
              {matchedReviews.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {matchedReviews.map((rev) => (
                    <div key={rev.id || rev._id} className="py-6 first:pt-0 last:pb-0">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <img
                            src={rev.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                            alt={rev.userName}
                            className="h-10 w-10 rounded-full object-cover border border-gray-200"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-black">{rev.userName}</span>
                              {rev.verifiedPurchase && (
                                <span className="inline-flex items-center gap-0.5 text-[8.5px] font-black text-green-700 bg-green-50 px-1.5 py-0.2 border border-green-150 rounded-xs">
                                  ✓ Đã mua
                                </span>
                              )}
                            </div>
                            <div className="flex text-amber-500 gap-0.5 mt-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={`h-3 w-3 ${i < rev.rating ? 'fill-current text-[#EE1111]' : 'text-gray-200'}`} />
                              ))}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-gray-400">
                          {new Date(rev.createdAt || rev.date || Date.now()).toLocaleDateString('vi-VN')}
                        </span>
                      </div>

                      <p className="mt-3 text-xs text-gray-650 leading-relaxed pl-13 font-sans font-medium whitespace-pre-line">
                        {rev.comment}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-gray-50 border border-gray-150 rounded-none space-y-1">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Chưa Có Đánh Giá Nào</p>
                  <p className="text-[11px] text-gray-400">Hãy là người đầu tiên trải nghiệm và gửi đánh giá nhận xét cho sản phẩm này nhé.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

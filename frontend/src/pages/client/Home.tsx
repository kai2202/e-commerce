import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../redux/hooks';
import { setSelectedCategoryId, setAuthModalOpen, setSearchKeyword } from '../../redux/uiSlice';
import { fetchProducts, fetchProductFilters } from '../../redux/shopSlice';
import { ProductCard } from '../../components/common/ProductCard';
import { ArrowUpDown, Star, SlidersHorizontal } from 'lucide-react';

export const Home: React.FC = () => {
  // Test Error Boundary (có thể kích hoạt bằng cách truy cập /?test-error=true)
  if (window.location.search.includes('test-error=true')) {
    throw new Error("Lỗi kiểm thử ErrorBoundary của ứng dụng E-Commerce");
  }

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  
  const { products, categories, banners, filters: shopFilters, pagination, status } = useAppSelector((state) => state.shop);
  const { searchKeyword, selectedCategoryId } = useAppSelector((state) => state.ui);

  const productsSectionRef = useRef<HTMLDivElement>(null);

  const [currentBannerIdx, setCurrentBannerIdx] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<string | null>(null);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('default');

  // Toggle landing vs collection page view mode
  const [viewMode, setViewMode] = useState<'landing' | 'collection'>('landing');

  // Synchronize view mode with query parameter, search queries, and selected category
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const view = params.get('view');
    
    if (view === 'collection' || searchKeyword || selectedCategoryId) {
      setViewMode('collection');
    } else if (view === 'landing') {
      setViewMode('landing');
    } else {
      // Default to landing page if no filter or search is active
      if (!searchKeyword && !selectedCategoryId) {
        setViewMode('landing');
      } else {
        setViewMode('collection');
      }
    }
  }, [location.search, searchKeyword, selectedCategoryId]);

  // Auto-scroll banners (used in collection view if needed)
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIdx((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners]);

  useEffect(() => {
    dispatch(fetchProductFilters());
  }, [dispatch]);

  useEffect(() => {
    setPage(1);
  }, [searchKeyword, selectedCategoryId, selectedBrand, priceRange, minRating, selectedColor, selectedSize, sortBy]);

  useEffect(() => {
    const params: any = {};
    if (searchKeyword) params.search = searchKeyword;
    if (selectedCategoryId) params.category = selectedCategoryId;
    if (selectedBrand) params.brand = selectedBrand;
    if (priceRange) params.priceRange = priceRange;
    if (minRating) params.rating = minRating;
    if (selectedColor) params.color = selectedColor;
    if (selectedSize) params.size = selectedSize;
    if (sortBy && sortBy !== 'default') params.sort = sortBy;
    params.page = page;
    params.limit = 12;
    dispatch(fetchProducts(params));
  }, [dispatch, searchKeyword, selectedCategoryId, selectedBrand, priceRange, minRating, selectedColor, selectedSize, sortBy, page]);

  const allBrands = shopFilters?.brands || [];
  const allColors = shopFilters?.colors || [];
  const allSizes = shopFilters?.sizes || [];
  const sortedProducts = products;

  const clearAllFilters = () => {
    setSelectedBrand(null);
    setPriceRange(null);
    setMinRating(null);
    setSelectedColor(null);
    setSelectedSize(null);
    setPage(1);
    dispatch(setSelectedCategoryId(null));
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    if (productsSectionRef.current) {
      productsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const activeBanners = banners.filter((b) => b.active);

  // Setup landing banner assets
  const heroImage = activeBanners.length > 0 ? activeBanners[0].image : 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=1600&auto=format&fit=crop&q=80';
  const heroTitle = activeBanners.length > 0 ? activeBanners[0].title : 'GIẢI PHÓNG NĂNG LƯỢNG';
  const heroSubtitle = activeBanners.length > 0 ? activeBanners[0].subtitle : 'Khám phá bộ sưu tập giày chạy bộ và trang phục thể thao hiệu năng cao mới nhất.';

  // ── Render 1: Premium Nike Vietnam-Inspired Editorial Landing Page ──
  if (viewMode === 'landing') {
    return (
      <div className="min-h-screen bg-white font-sans animate-fade-in">
        {/* ── Alert Strip (Nike style promo) ────────────────────────────── */}
        <div className="bg-gray-100 border-b border-gray-200 py-2.5 text-center text-[10.5px] font-bold uppercase tracking-widest text-black">
          <div className="mx-auto max-w-7xl px-4 flex justify-center items-center gap-1.5 overflow-hidden">
            <span>Miễn Phí Vận Chuyển Cho Đơn Hàng Từ 1.000.000 ₫</span>
            <span className="text-[#EE1111]">•</span>
            <span 
              className="underline hover:text-[#EE1111] cursor-pointer" 
              onClick={() => navigate('/?view=collection')}
            >
              Tìm Hiểu Thêm
            </span>
          </div>
        </div>

        {/* ── Nike Full-Width Hero ────────────────────────────────────────── */}
        <div className="relative overflow-hidden bg-black min-h-[500px] sm:min-h-[640px] flex items-end">
          <img
            src={heroImage}
            alt={heroTitle}
            className="absolute inset-0 h-full w-full object-cover select-none object-center"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />

          <div className="relative w-full mx-auto max-w-7xl px-6 sm:px-8 py-16 sm:py-24 text-left z-10 space-y-4">
            <span className="inline-block bg-[#EE1111] px-3 py-0.5 font-display text-[9.5px] font-extrabold uppercase tracking-[0.25em] text-white">
              Bộ Sưu Tập Premium
            </span>
            <h1 className="font-display text-5xl sm:text-7xl md:text-8xl font-black uppercase tracking-tighter text-white leading-none max-w-4xl">
              {heroTitle}
            </h1>
            <p className="text-sm sm:text-base text-white/80 font-normal max-w-lg leading-relaxed">
              {heroSubtitle}
            </p>
            <div className="pt-4 flex flex-wrap gap-3">
              <button
                onClick={() => {
                  dispatch(setSelectedCategoryId(null));
                  dispatch(setSearchKeyword(''));
                  navigate('/?view=collection');
                }}
                className="bg-white text-black hover:bg-white/90 font-display text-[10.5px] font-black uppercase tracking-widest px-8 py-3.5 rounded-full transition-all duration-150 shadow-md cursor-pointer"
              >
                Khám Phá Bộ Sưu Tập
              </button>
              <button
                onClick={() => {
                  const shoesCat = categories.find((c) => c.name.toLowerCase().includes('giày') || c.name.toLowerCase().includes('dép'));
                  if (shoesCat) {
                    dispatch(setSelectedCategoryId(shoesCat.id));
                  }
                  dispatch(setSearchKeyword(''));
                  navigate('/?view=collection');
                }}
                className="bg-transparent border border-white text-white hover:bg-white/10 font-display text-[10.5px] font-black uppercase tracking-widest px-8 py-3.5 rounded-full transition-all duration-150 cursor-pointer"
              >
                Xem Giày Hot Nhất
              </button>
            </div>
          </div>
        </div>

        {/* ── Visual Quick Links Section (Explore Categories) ────────────── */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 text-center space-y-6">
          <h2 className="font-display text-lg sm:text-xl font-black uppercase tracking-wider text-black">
            Khám Phá Theo Nhóm
          </h2>
          <div className="flex justify-center items-center flex-wrap gap-6 sm:gap-10">
            {[
              { label: 'Nam', keyword: 'nam', img: 'https://images.unsplash.com/photo-1483721310020-03333e577078?w=150&auto=format&fit=crop&q=80' },
              { label: 'Nữ', keyword: 'nữ', img: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=150&auto=format&fit=crop&q=80' },
              { label: 'Trẻ Em', keyword: 'trẻ em', img: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=150&auto=format&fit=crop&q=80' },
              { label: 'Giày', keyword: 'giày', img: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=150&auto=format&fit=crop&q=80' },
              { label: 'Thể Thao', keyword: 'thể thao', img: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=150&auto=format&fit=crop&q=80' },
            ].map((tag) => (
              <button
                key={tag.label}
                onClick={() => {
                  dispatch(setSelectedCategoryId(null));
                  dispatch(setSearchKeyword(tag.keyword));
                  navigate('/?view=collection');
                }}
                className="flex flex-col items-center gap-2.5 group cursor-pointer bg-transparent border-none outline-none"
              >
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full overflow-hidden border-2 border-transparent group-hover:border-black transition duration-300 shadow-md">
                  <img
                    src={tag.img}
                    alt={tag.label}
                    className="h-full w-full object-cover select-none transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
                <span className="font-display text-xs font-black tracking-widest uppercase text-gray-500 group-hover:text-black transition">
                  {tag.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Trending Now Section ────────────────────────────────────────── */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <h2 className="font-display text-xl sm:text-2xl font-black uppercase tracking-wider text-black">
            Xu Hướng Hiện Tại
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1 */}
            <div className="relative group overflow-hidden bg-gray-50 aspect-[4/3] sm:aspect-[16/10]">
              <img
                src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80"
                alt="Giày chạy bộ chuyên nghiệp"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/30" />
              <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 space-y-2">
                <span className="font-display text-[10px] font-bold tracking-widest uppercase text-white/90">Running Performance</span>
                <h3 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-white leading-none">Chạy Bộ Bất Tận</h3>
                <button
                  onClick={() => {
                    const shoesCat = categories.find((c) => c.name.toLowerCase().includes('giày') || c.name.toLowerCase().includes('dép'));
                    if (shoesCat) dispatch(setSelectedCategoryId(shoesCat.id));
                    dispatch(setSearchKeyword(''));
                    navigate('/?view=collection');
                  }}
                  className="mt-2 bg-white text-black hover:bg-gray-100 font-display text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-full w-fit transition cursor-pointer"
                >
                  Khám Phá Giày Chạy
                </button>
              </div>
            </div>

            {/* Card 2 */}
            <div className="relative group overflow-hidden bg-gray-50 aspect-[4/3] sm:aspect-[16/10]">
              <img
                src="https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=800&auto=format&fit=crop&q=80"
                alt="Thời trang thể thao đường phố"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/30" />
              <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 space-y-2">
                <span className="font-display text-[10px] font-bold tracking-widest uppercase text-white/90">Streetwear & Style</span>
                <h3 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-white leading-none">Phong Cách Đường Phố</h3>
                <button
                  onClick={() => {
                    const clothingCat = categories.find((c) => c.name.toLowerCase().includes('áo') || c.name.toLowerCase().includes('quần'));
                    if (clothingCat) dispatch(setSelectedCategoryId(clothingCat.id));
                    dispatch(setSearchKeyword(''));
                    navigate('/?view=collection');
                  }}
                  className="mt-2 bg-white text-black hover:bg-gray-100 font-display text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-full w-fit transition cursor-pointer"
                >
                  Khám Phá Áo Quần
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Featured Categories Section ─────────────────────────────────── */}
        {categories.length > 0 && (
          <div className="bg-gray-50 py-16 border-y border-gray-100">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
              <h2 className="font-display text-xl sm:text-2xl font-black uppercase tracking-wider text-black">
                Danh Mục Nổi Bật
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((cat, idx) => {
                  const catImages = [
                    'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1502224562085-639556652f33?w=600&auto=format&fit=crop&q=80',
                  ];
                  const bgImg = catImages[idx % catImages.length];

                  return (
                    <div
                      key={cat.id}
                      onClick={() => {
                        dispatch(setSelectedCategoryId(cat.id));
                        dispatch(setSearchKeyword(''));
                        navigate('/?view=collection');
                      }}
                      className="relative group overflow-hidden bg-white aspect-[3/4] cursor-pointer border border-gray-200"
                    >
                      <img
                        src={bgImg}
                        alt={cat.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 select-none"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                      
                      <div className="absolute inset-0 flex flex-col justify-end p-6 text-left">
                        <h4 className="font-display text-lg sm:text-xl font-black uppercase tracking-wider text-white">
                          {cat.name}
                        </h4>
                        <button
                          type="button"
                          className="mt-2 bg-white text-black hover:bg-gray-100 font-display text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-full w-fit transition cursor-pointer"
                        >
                          Mua Ngay
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Best Sellers Showcase ───────────────────────────────────────── */}
        {products.length > 0 && (
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl sm:text-2xl font-black uppercase tracking-wider text-black">
                Sản Phẩm Khuyên Dùng
              </h2>
              <button
                onClick={() => {
                  dispatch(setSelectedCategoryId(null));
                  dispatch(setSearchKeyword(''));
                  navigate('/?view=collection');
                }}
                className="text-xs font-bold uppercase tracking-widest text-black hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-none"
              >
                Xem tất cả
              </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {products.slice(0, 4).map((prod) => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  onOpenDetail={(p) => navigate(`/product/${p.id}`)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Nike Editorial Bottom Banner ────────────────────────────────── */}
        <div className="bg-black py-16 text-center text-white space-y-4 px-4 border-t border-gray-900">
          <span className="font-display text-[9px] font-bold tracking-[0.3em] uppercase text-[#EE1111]">E-MARKET MEMBER</span>
          <h3 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-tight max-w-xl mx-auto">
            Trở thành thành viên để nhận ưu đãi đặc quyền
          </h3>
          <p className="text-xs text-white/60 max-w-md mx-auto leading-relaxed">
            Đăng ký tài khoản miễn phí ngay hôm nay để nhận thông tin về các bộ sưu tập mới nhất và ưu đãi đặc biệt dành riêng cho thành viên.
          </p>
          <button
            onClick={() => dispatch(setAuthModalOpen(true))}
            className="mt-4 bg-white text-black hover:bg-gray-100 font-display text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-full transition cursor-pointer"
          >
            Tham Gia Ngay
          </button>
        </div>
      </div>
    );
  }

  // ── Render 2: Standard "Bộ Sưu Tập" Product Grid & Filters View ──
  return (
    <div className="min-h-screen bg-white font-sans animate-fade-in">
      {/* ── Hero Banner ───────────────────────────────────────────────── */}
      {activeBanners.length > 0 && (
        <div className="relative overflow-hidden bg-black min-h-[400px] sm:min-h-[520px]">
          {activeBanners.map((banner, idx) => {
            const isActive = idx === currentBannerIdx;
            return (
              <div
                key={banner.id || idx}
                className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
                  isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
              >
                <img
                  src={banner.image}
                  alt={banner.title}
                  className="h-full w-full object-cover select-none"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent" />

                <div className="absolute inset-0 flex flex-col justify-center px-8 sm:px-16 max-w-3xl">
                  <span className="inline-block mb-4 bg-[#EE1111] px-3 py-1 font-display text-[10px] font-bold uppercase tracking-[0.2em] text-white w-fit">
                    Bộ Sưu Tập Mới
                  </span>
                  <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight text-white leading-none">
                    {banner.title}
                  </h1>
                  <p className="mt-3 text-sm text-white/70 font-light max-w-md leading-relaxed">
                    {banner.subtitle}
                  </p>
                  {banner.link && (
                    <div className="mt-6 flex flex-wrap gap-3">
                      <button
                        onClick={() => dispatch(setSelectedCategoryId(banner.link))}
                        className="btn-adidas-primary !w-auto px-8"
                      >
                        Mua Ngay
                      </button>
                      <button
                        onClick={() => dispatch(setSelectedCategoryId(null))}
                        className="btn-adidas-secondary !w-auto px-8 !border-white !text-white hover:!bg-white/10"
                      >
                        Xem Tất Cả
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {activeBanners.length > 1 && (
            <div className="absolute right-6 bottom-6 z-20 flex gap-2">
              {activeBanners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentBannerIdx(idx)}
                  className={`h-1 transition-all cursor-pointer ${currentBannerIdx === idx ? 'w-8 bg-white' : 'w-3 bg-white/40'}`}
                />
              ))}
            </div>
          )}
        </div>
      )}


      {/* ── Main Content ──────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div ref={productsSectionRef} className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">

          {/* Filters Sidebar */}
          <aside className="hidden lg:block space-y-6">
            <div className="flex items-center justify-between">
              <span className="font-display text-base font-black uppercase tracking-wider text-black">
                Bộ Lọc
              </span>
              {(selectedBrand || priceRange || minRating || selectedColor || selectedSize) && (
                <button onClick={clearAllFilters} className="text-[10px] font-bold uppercase tracking-wider text-[#EE1111] hover:underline cursor-pointer bg-transparent border-none">
                  Xóa tất cả
                </button>
              )}
            </div>

            {/* Brands */}
            {allBrands.length > 0 && (
              <div className="space-y-3 border-t border-gray-200 pt-5">
                <h5 className="font-display text-xs font-black uppercase tracking-widest text-black">Thương Hiệu</h5>
                <div className="flex flex-col gap-2">
                  {allBrands.map((b) => (
                    <label key={b} className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer hover:text-black transition">
                      <input
                        type="checkbox"
                        checked={selectedBrand === b}
                        onChange={() => setSelectedBrand(selectedBrand === b ? null : b)}
                        className="rounded-none border-gray-300 text-black focus:ring-black"
                      />
                      {b}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Price */}
            <div className="space-y-3 border-t border-gray-200 pt-5">
              <h5 className="font-display text-xs font-black uppercase tracking-widest text-black">Khoảng Giá</h5>
              <div className="flex flex-col gap-2">
                {[
                  { label: 'Dưới 1 triệu', value: 'under-1m' },
                  { label: '1 – 5 triệu', value: '1m-5m' },
                  { label: '5 – 15 triệu', value: '5m-15m' },
                  { label: 'Trên 15 triệu', value: 'over-15m' },
                ].map((ran) => (
                  <label key={ran.value} className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer hover:text-black transition">
                    <input
                      type="radio"
                      name="priceRangeRadio"
                      checked={priceRange === ran.value}
                      onChange={() => setPriceRange(ran.value)}
                      className="border-gray-300 text-black focus:ring-black"
                    />
                    {ran.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Rating */}
            <div className="space-y-3 border-t border-gray-200 pt-5">
              <h5 className="font-display text-xs font-black uppercase tracking-widest text-black">Đánh Giá</h5>
              <div className="flex flex-col gap-1.5">
                {[5, 4, 3].map((val) => (
                  <button
                    key={val}
                    onClick={() => setMinRating(minRating === val ? null : val)}
                    className={`flex items-center gap-2 py-1.5 text-sm text-left cursor-pointer transition bg-transparent border-none ${
                      minRating === val ? 'text-black font-bold' : 'text-gray-600 hover:text-black'
                    }`}
                  >
                    <div className="flex">
                      {[...Array(val)].map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-[#EE1111] text-[#EE1111]" />
                      ))}
                    </div>
                    <span>Từ {val} sao</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Colors */}
            {allColors.length > 0 && allColors[0] !== 'Tự nhiên' && (
              <div className="space-y-3 border-t border-gray-200 pt-5">
                <h5 className="font-display text-xs font-black uppercase tracking-widest text-black">Màu Sắc</h5>
                <div className="flex flex-wrap gap-2">
                  {allColors.map((col) => (
                    <button
                      key={col}
                      onClick={() => setSelectedColor(selectedColor === col ? null : col)}
                      className={`px-3 py-1.5 border text-[11px] font-semibold cursor-pointer tracking-wide transition ${
                        selectedColor === col
                          ? 'border-black bg-black text-white'
                          : 'border-gray-300 text-gray-700 hover:border-black'
                      }`}
                    >
                      {col}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {allSizes.length > 0 && allSizes[0] !== 'Tiêu chuẩn' && (
              <div className="space-y-3 border-t border-gray-200 pt-5">
                <h5 className="font-display text-xs font-black uppercase tracking-widest text-black">Kích Cỡ</h5>
                <div className="flex flex-wrap gap-1.5">
                  {allSizes.map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(selectedSize === sz ? null : sz)}
                      className={`size-btn ${selectedSize === sz ? 'active' : ''}`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Products Grid */}
          <main className="lg:col-span-3 space-y-6">

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 border-b border-gray-200">
              <span className="font-display text-xs font-semibold uppercase tracking-widest text-gray-500">
                <span className="text-black font-black">{pagination ? pagination.totalProducts : sortedProducts.length}</span> Sản Phẩm
                {searchKeyword && <span className="font-sans normal-case tracking-normal font-normal ml-1">cho "{searchKeyword}"</span>}
              </span>

              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent font-display text-[11px] font-bold uppercase tracking-wider text-black border-0 focus:ring-0 focus:outline-none cursor-pointer"
                >
                  <option value="default">Sắp Xếp: Mặc Định</option>
                  <option value="price-asc">Giá: Thấp → Cao</option>
                  <option value="price-desc">Giá: Cao → Thấp</option>
                  <option value="newest">Mới Nhất</option>
                  <option value="top-seller">Bán Chạy Nhất</option>
                </select>
              </div>
            </div>

            {/* Grid */}
            {status === 'loading' ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="bg-white space-y-3 animate-pulse">
                    <div className="aspect-[4/5] bg-gray-100 w-full" />
                    <div className="space-y-2 px-1">
                      <div className="h-3 bg-gray-100 w-1/3" />
                      <div className="h-4 bg-gray-100 w-3/4" />
                      <div className="h-4 bg-gray-100 w-1/4 mt-3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : sortedProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {sortedProducts.map((prod) => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    onOpenDetail={(p) => navigate(`/product/${p.id}`)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <SlidersHorizontal className="h-12 w-12 text-gray-200" />
                <h4 className="font-display text-xl font-black uppercase tracking-wider text-black">Không Tìm Thấy Sản Phẩm</h4>
                <p className="text-sm text-gray-500 max-w-sm text-center">Thử điều chỉnh bộ lọc hoặc tìm kiếm từ khóa khác.</p>
                <button type="button" onClick={clearAllFilters} className="mt-2 btn-adidas-secondary !w-auto px-8">
                  Xóa Bộ Lọc
                </button>
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-1 pt-8 border-t border-gray-200">
                <button
                  disabled={page === 1}
                  onClick={() => handlePageChange(page - 1)}
                  className="px-5 py-2.5 border border-gray-300 font-display text-xs font-bold uppercase tracking-wider text-black hover:bg-black hover:text-white hover:border-black disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                >
                  ← Trước
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((pNum) => (
                    <button
                      key={pNum}
                      onClick={() => handlePageChange(pNum)}
                      className={`h-10 w-10 border font-display text-xs font-black transition cursor-pointer ${
                        page === pNum
                          ? 'border-black bg-black text-white'
                          : 'border-gray-200 text-gray-700 hover:border-black hover:text-black'
                      }`}
                    >
                      {pNum}
                    </button>
                  ))}
                </div>

                <button
                  disabled={page === pagination.pages}
                  onClick={() => handlePageChange(page + 1)}
                  className="px-5 py-2.5 border border-gray-300 font-display text-xs font-bold uppercase tracking-wider text-black hover:bg-black hover:text-white hover:border-black disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                >
                  Sau →
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

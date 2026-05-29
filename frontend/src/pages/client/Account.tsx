import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../redux/hooks';
import { updateUserProfile as updateProfileAction, saveAddress as addAddressAction, updateAddress as editAddressAction, deleteAddress as deleteAddressAction } from '../../redux/authSlice';
import { cancelOrder as cancelOrderAction, fetchMyOrders } from '../../redux/orderSlice';
import { submitReview as submitReviewAction } from '../../redux/shopSlice';
import { toggleWishlist } from '../../redux/cartSlice';
import { Address, Order, Review } from '../../types';
import { 
  User as UserIcon, Phone, MapPin, Camera, Star, Package, 
  Check, Trash, Trash2, Edit, Save, Plus, AlertCircle, 
  Sparkles, X, QrCode, Heart, Settings, ChevronRight 
} from 'lucide-react';

interface ClientAccountProps {
  initialSubTab?: 'profile' | 'favorites' | 'orders' | 'settings';
}

export const Account: React.FC<ClientAccountProps> = ({ initialSubTab = 'profile' }) => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const orders = useAppSelector((state) => state.order.orders);
  const wishlist = useAppSelector((state) => state.cart.wishlist);
  const products = useAppSelector((state) => state.shop.products);
  const cart = useAppSelector((state) => state.cart.cart);

  // Active Sub-Tab at Top Level ('profile' | 'favorites' | 'orders' | 'settings')
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'favorites' | 'orders' | 'settings'>(
    currentUser && currentUser.role !== 'customer' ? 'profile' : 
    (((location.state as any)?.activeTab === 'addresses') ? 'settings' : ((location.state as any)?.activeTab || initialSubTab) as any)
  );

  // Sub-Tab inside Settings ('details' | 'addresses')
  const [activeSettingsTab, setActiveSettingsTab] = useState<'details' | 'addresses'>(
    ((location.state as any)?.activeTab === 'addresses') ? 'addresses' : 'details'
  );

  useEffect(() => {
    if (currentUser && currentUser.role === 'customer') {
      dispatch(fetchMyOrders());
    }
  }, [dispatch, currentUser]);

  useEffect(() => {
    const stateTab = (location.state as any)?.activeTab;
    if (stateTab) {
      if (stateTab === 'addresses') {
        setActiveSubTab('settings');
        setActiveSettingsTab('addresses');
      } else {
        setActiveSubTab(stateTab);
      }
    }
  }, [location.state]);

  // Profile fields editing state
  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [profilePhone, setProfilePhone] = useState(currentUser?.phone || '');
  const [profileAvatar, setProfileAvatar] = useState(currentUser?.avatar || '');
  const [passwordChange, setPasswordChange] = useState('');
  const [successNotify, setSuccessNotify] = useState('');

  // Address editing triggers
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [formLabel, setFormLabel] = useState('Nhà riêng');
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formStreet, setFormStreet] = useState('');
  const [formCity, setFormCity] = useState('');

  // Review Submitting Trigger
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [reviewProductId, setReviewProductId] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewImageInput, setReviewImageInput] = useState('');
  const [reviewImagesList, setReviewImagesList] = useState<string[]>([]);

  // Orders pagination
  const ORDERS_PER_PAGE = 5;
  const [orderPage, setOrderPage] = useState(1);

  if (!currentUser) {
    return (
      <div className="mx-auto max-w-xl text-center py-20 space-y-4 font-sans animate-fade-in">
        <AlertCircle className="h-12 w-12 text-[#EE1111] mx-auto animate-scale-up" />
        <h4 className="font-display text-xl font-black uppercase tracking-tight text-black">Bạn chưa đăng nhập!</h4>
        <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
          Vui lòng đăng nhập hoặc đăng ký tài khoản mới để tiếp tục truy cập trang quản lý hồ sơ và đơn hàng thành viên.
        </p>
        <button 
          onClick={() => navigate('/')}
          className="inline-block h-11 px-6 rounded-full bg-black text-white hover:opacity-90 transition font-display text-[10px] font-black uppercase tracking-widest cursor-pointer shadow-sm"
        >
          Quay lại Trang chủ
        </button>
      </div>
    );
  }

  // Filter the actual products inside wishlist
  const favoriteProducts = products.filter((p) => wishlist.includes(p.id));

  // Backend already returns only the current user's orders via getMyOrders (sorted newest first)
  const myOrders = orders;
  const totalOrderPages = Math.ceil(myOrders.length / ORDERS_PER_PAGE);
  const paginatedOrders = myOrders.slice((orderPage - 1) * ORDERS_PER_PAGE, orderPage * ORDERS_PER_PAGE);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = { name: profileName, phone: profilePhone, avatar: profileAvatar };
    if (passwordChange) {
      payload.password = passwordChange;
    }
    dispatch(updateProfileAction(payload));
    setSuccessNotify('Cập nhật thông tin cá nhân thành công!');
    setPasswordChange('');
    setTimeout(() => setSuccessNotify(''), 3000);
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formPhone || !formStreet || !formCity) return;

    const data = {
      name: formName,
      phone: formPhone,
      label: formLabel,
      street: formStreet,
      city: formCity,
    };

    if (editingAddressId) {
      dispatch(editAddressAction({ id: editingAddressId, address: data }));
    } else {
      dispatch(addAddressAction(data));
    }

    // Reset Address form
    setShowAddressForm(false);
    setEditingAddressId(null);
    setFormLabel('Nhà riêng');
    setFormName('');
    setFormPhone('');
    setFormStreet('');
    setFormCity('');
  };

  const handleEditAddressInit = (addr: Address) => {
    setEditingAddressId(addr.id);
    setFormLabel(addr.label);
    setFormName(addr.name);
    setFormPhone(addr.phone);
    setFormStreet(addr.street);
    setFormCity(addr.city);
    setShowAddressForm(true);
  };

  const handleOpenReviewDialog = (order: Order, pId: string) => {
    setReviewOrder(order);
    setReviewProductId(pId);
    setReviewRating(5);
    setReviewComment('');
    setReviewImagesList([]);
    setReviewImageInput('');
  };

  const handleAddReviewImage = () => {
    if (!reviewImageInput) return;
    setReviewImagesList((p) => [...p, reviewImageInput]);
    setReviewImageInput('');
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewOrder) return;

    const newReview: Review = {
      id: `rev-${Date.now()}`,
      orderId: reviewOrder.id,
      productId: reviewProductId,
      userId: currentUser?.id || 'anonymous',
      userName: currentUser?.name || 'Khách hàng',
      userAvatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      rating: reviewRating,
      comment: reviewComment,
      images: reviewImagesList,
      date: new Date().toISOString(),
    };
    dispatch(submitReviewAction(newReview));
    setReviewOrder(null);
    alert('Đánh giá sản phẩm thành công! Cảm ơn bạn đã phản hồi.');
  };

  const formatVND = (num: number) => {
    return num.toLocaleString('vi-VN') + ' ₫';
  };

  const getCartCount = () => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  };

  return (
    <div className="min-h-screen bg-white font-sans animate-fade-in">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        
        {/* Review Dialog overlay Modal */}
        {reviewOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setReviewOrder(null)} />
            <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 border border-gray-150 z-10 space-y-5 max-h-[90vh] overflow-y-auto animate-scale-up">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <span className="font-display text-xs font-black uppercase text-black tracking-widest">Viết Đánh Giá Sản Phẩm</span>
                <button onClick={() => setReviewOrder(null)} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div className="p-3.5 bg-gray-50 border border-gray-150 rounded-xl text-xs font-bold text-gray-800">
                  Mã đơn hàng: {reviewOrder.id}
                </div>

                {/* Rating Star input */}
                <div className="space-y-2 text-center">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Chấm độ hài lòng (sao)</label>
                  <div className="flex justify-center gap-2 text-amber-400">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setReviewRating(val)}
                        className="p-1 transform hover:scale-125 transition cursor-pointer"
                      >
                        <Star className={`h-8 w-8 ${val <= reviewRating ? 'fill-current' : 'text-gray-250'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Feedback comment area */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Nội dung đánh giá</label>
                  <textarea
                    required
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Hãy chia sẻ trải nghiệm thực tế của bạn về chất lượng và độ hoàn thiện của sản phẩm nhé..."
                    className="w-full text-xs rounded-xl border border-gray-300 p-3.5 bg-white focus:border-black focus:ring-0 focus:outline-none placeholder:text-gray-450 font-semibold"
                  />
                </div>

                {/* Feedback Photos mockup attachments */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Tải ảnh feedback đính kèm (URL)</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={reviewImageInput}
                      onChange={(e) => setReviewImageInput(e.target.value)}
                      placeholder="Dán link ảnh Unsplash hoặc web bất kỳ..."
                      className="flex-grow text-xs rounded-xl border border-gray-300 px-3.5 py-2.5 placeholder:text-gray-450 font-semibold focus:border-black focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddReviewImage}
                      className="px-4 py-2 bg-black rounded-full text-white text-[10px] font-black uppercase tracking-wider hover:opacity-90 transition cursor-pointer"
                    >
                      Thêm ảnh
                    </button>
                  </div>

                  {reviewImagesList.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {reviewImagesList.map((im, idx) => (
                        <div key={idx} className="relative h-14 w-14 rounded-lg overflow-hidden border border-gray-200">
                          <img src={im} alt="preview" className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setReviewImagesList((p) => p.filter((_, i) => i !== idx))}
                            className="absolute right-1 top-1 p-0.5 rounded-full bg-black/60 text-white hover:bg-black"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 mt-2">
                  <button
                    type="button"
                    onClick={() => setReviewOrder(null)}
                    className="h-11 px-5 rounded-full border border-gray-300 bg-white text-black hover:border-black transition text-[10px] font-black uppercase tracking-widest cursor-pointer"
                  >
                    Bỏ qua
                  </button>
                  <button
                    type="submit"
                    className="h-11 px-5 rounded-full bg-black text-white hover:opacity-90 transition text-[10px] font-black uppercase tracking-widest cursor-pointer"
                  >
                    Gửi đánh giá
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Account Top Profile Header block */}
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between border-b border-gray-200 pb-8 gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            <div className="relative group shrink-0">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="h-24 w-24 rounded-full object-cover border border-gray-200 bg-gray-55"
                referrerPolicy="no-referrer"
              />
              <label className="absolute bottom-0 right-0 p-2 bg-black rounded-full text-white cursor-pointer hover:opacity-90 transition shadow-md border border-white select-none">
                <Camera className="h-4 w-4 stroke-[2]" />
                <input
                  type="text"
                  className="hidden"
                  onChange={(e) => {
                    const link = prompt('Dán link URL ảnh đại diện mới của bạn:');
                    if (link) {
                      setProfileAvatar(link);
                      dispatch(updateProfileAction({ name: profileName, phone: profilePhone, avatar: link }));
                    }
                  }}
                />
              </label>
            </div>

            <div className="space-y-1.5 pt-2">
              <h1 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-tight text-black leading-none">{currentUser.name}</h1>
              <p className="text-xs text-gray-500 font-mono font-semibold">{currentUser.email}</p>
              
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start items-center pt-1.5">
                <span className="font-display text-[9px] uppercase tracking-widest font-black px-2 py-0.5 bg-black text-white rounded-xs">
                  {currentUser.role === 'customer' ? 'Thành Viên' : 'Quản Trị Viên'}
                </span>
                <span className="text-[11px] text-gray-450 font-semibold">• Tham gia: {currentUser.joinedDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Horizontal Secondary Sub-navigation Bar */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 overflow-x-auto scrollbar-hide py-1">
            {[
              { id: 'profile', label: 'Hồ sơ' },
              { id: 'favorites', label: 'Yêu thích' },
              ...(currentUser.role === 'customer'
                ? [
                    { id: 'orders', label: 'Đơn hàng' },
                    { id: 'settings', label: 'Cài đặt' }
                  ]
                : [])
            ].map((sub) => {
              const isActive = activeSubTab === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => {
                    setActiveSubTab(sub.id as any);
                    setSuccessNotify('');
                  }}
                  className={`relative font-display text-sm font-bold uppercase tracking-widest pb-4 transition shrink-0 cursor-pointer ${
                    isActive ? 'text-black font-black' : 'text-gray-400 hover:text-black'
                  }`}
                >
                  {sub.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-black rounded-full animate-fade-in" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Profile Content subdivisions */}
        <div className="pt-2">
          
          {/* TAB 1: PROFILE DASHBOARD */}
          {activeSubTab === 'profile' && (
            <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
              
              {/* Welcoming Header */}
              <div className="space-y-3 text-center sm:text-left">
                <h2 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-tight text-black leading-none">
                  Chào mừng trở lại,<br/>{currentUser.name.split(' ').pop()}!
                </h2>
                <p className="text-xs text-gray-500 leading-relaxed font-semibold">
                  Cảm ơn bạn đã đồng hành cùng E-Market. Hãy khám phá và quản lý các hoạt động thể thao cá nhân của bạn dưới đây.
                </p>
              </div>

              {/* Quick actions cards - 3 columns grid on desktop */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div 
                  onClick={() => navigate('/?view=collection')} 
                  className="p-6 border border-gray-200 hover:border-black transition rounded-2xl bg-white space-y-3 cursor-pointer select-none group"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-display text-xs font-black uppercase tracking-widest text-black">Mua Sắm BST Mới</span>
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-black transition-transform group-hover:translate-x-1" />
                  </div>
                  <p className="text-[10px] text-gray-500 font-semibold leading-normal">
                    Khám phá những đôi giày chạy, áo đấu bóng đá và trang phục tập luyện đỉnh cao vừa cập bến.
                  </p>
                </div>

                <div 
                  onClick={() => navigate('/cart')} 
                  className="p-6 border border-gray-200 hover:border-black transition rounded-2xl bg-white space-y-3 cursor-pointer select-none group"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-display text-xs font-black uppercase tracking-widest text-black">Túi Đồ Mua Sắm</span>
                    <span className="h-5 px-2 bg-black text-white text-[9px] font-black rounded-full flex items-center justify-center font-display leading-none">
                      {getCartCount()}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 font-semibold leading-normal">
                    Xem lại các sản phẩm bạn đã lựa chọn và chuẩn bị hoàn tất đơn thanh toán của mình.
                  </p>
                </div>

                <div 
                  onClick={() => {
                    setActiveSubTab('settings');
                    setActiveSettingsTab('details');
                  }} 
                  className="p-6 border border-gray-200 hover:border-black transition rounded-2xl bg-white space-y-3 cursor-pointer select-none group"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-display text-xs font-black uppercase tracking-widest text-black">Cài Đặt Tài Khoản</span>
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-black transition-transform group-hover:translate-x-1" />
                  </div>
                  <p className="text-[10px] text-gray-500 font-semibold leading-normal">
                    Quản lý thông tin liên hệ cá nhân, thay đổi mật khẩu và sổ địa chỉ giao nhận hàng.
                  </p>
                </div>
              </div>

              {/* Bottom sports banner with Nike quote */}
              <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-neutral-900 text-white p-6 sm:p-8 flex flex-col justify-end min-h-[160px]">
                {/* Aspect sport mockup back */}
                <img 
                  src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=60" 
                  alt="sport quote background" 
                  className="absolute inset-0 h-full w-full object-cover opacity-20 filter grayscale"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                
                <div className="relative z-10 space-y-2">
                  <span className="font-display text-[9px] font-black uppercase tracking-widest text-[#EE1111] block">Truyền cảm hứng</span>
                  <p className="font-display text-xl sm:text-2xl font-black uppercase italic tracking-tight text-white leading-none max-w-sm">
                    "YESTERDAY YOU SAID TOMORROW. JUST DO IT."
                  </p>
                  <span className="block text-[9px] font-bold text-gray-400 font-sans uppercase tracking-widest">E-Market Sport Việt Nam</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FAVORITES (WISHLIST) */}
          {activeSubTab === 'favorites' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-baseline justify-between border-b border-gray-150 pb-3">
                <span className="font-display text-xs font-black uppercase tracking-widest text-gray-400">Danh mục sản phẩm đã thích ({favoriteProducts.length})</span>
              </div>

              {favoriteProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                  {favoriteProducts.map((prod) => {
                    const isDiscount = prod.discountPrice !== undefined;
                    return (
                      <div key={prod.id} className="relative group flex flex-col space-y-2.5">
                        {/* Remove favorite circular button */}
                        <button
                          type="button"
                          onClick={() => dispatch(toggleWishlist(prod.id))}
                          className="absolute top-3 right-3 z-20 h-8 w-8 bg-white/90 hover:bg-white text-black hover:text-[#EE1111] rounded-full flex items-center justify-center shadow-md transition cursor-pointer select-none"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>

                        {/* Image link */}
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

                        {/* Text description details */}
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

                        {/* Quick shop full button */}
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
                <div className="border border-gray-150 rounded-3xl p-12 text-center space-y-4 max-w-lg mx-auto bg-white">
                  <Heart className="h-10 w-10 text-gray-300 mx-auto animate-pulse" />
                  <div className="space-y-1.5">
                    <h4 className="font-display text-sm font-black uppercase tracking-widest text-black">Chưa có sản phẩm yêu thích nào</h4>
                    <p className="text-[10px] text-gray-450 max-w-xs mx-auto leading-normal font-semibold">
                      Hãy thả tim cho những đôi giày chạy và quần áo thể thao cao cấp bạn yêu mến khi duyệt sản phẩm để lưu lại tại đây nhé.
                    </p>
                  </div>
                  <button 
                    onClick={() => navigate('/?view=collection')}
                    className="h-11 px-6 rounded-full bg-black text-white hover:opacity-90 transition font-display text-[10px] font-black uppercase tracking-widest cursor-pointer shadow-sm"
                  >
                    Khám phá sản phẩm
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ORDERS HISTORY */}
          {currentUser.role === 'customer' && activeSubTab === 'orders' && (
            <div className="space-y-6 animate-fade-in">
              {location.state?.showSuccessMessage && (
                <div className="bg-green-50 border border-green-200 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-scale-up">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-500 text-white shrink-0 flex items-center justify-center">
                      <Check className="h-5 w-5 stroke-[2.5]" />
                    </div>
                    <div>
                      <h4 className="font-display text-sm font-black uppercase tracking-wider text-green-900">🎉 Đặt Hàng Thành Công!</h4>
                      <p className="text-[11px] text-green-600 leading-normal font-semibold">Cảm ơn bạn. Đơn hàng đã được tiếp nhận và chờ xử lý đóng gói.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate('/')}
                      className="rounded-full bg-green-650 px-5 py-2 text-xs font-black text-white hover:bg-green-700 transition cursor-pointer font-display uppercase tracking-wider"
                    >
                      Tiếp tục mua sắm
                    </button>
                    <button
                      onClick={() => {
                        navigate(location.pathname, { replace: true, state: {} });
                      }}
                      className="p-2 rounded-full hover:bg-green-100 text-green-500 transition cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-baseline justify-between border-b border-gray-150 pb-3">
                <span className="font-display text-xs font-black uppercase tracking-widest text-gray-400">Lịch sử giao dịch ({myOrders.length} đơn hàng)</span>
              </div>

              {myOrders.length > 0 ? (
                <div className="space-y-6">
                  {paginatedOrders.map((ord) => (
                    <div key={ord.id} className="bg-white border border-gray-150 rounded-3xl divide-y divide-gray-100 overflow-hidden text-xs shadow-xs">
                      
                      {/* Top order summary header */}
                      <div className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50/50 gap-3">
                        <div className="space-y-0.5">
                          <span className="font-display text-sm font-black tracking-wider text-black block uppercase">Mã đơn: {ord.id}</span>
                          <span className="text-[10px] text-gray-400 block font-semibold">Đặt ngày: {new Date(ord.date).toLocaleString('vi-VN')}</span>
                        </div>
                        
                        {/* Sport flat status pill */}
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                          ord.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                          ord.status === 'shipping' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                          ord.status === 'completed' ? 'bg-green-50 text-green-600 border-green-200' :
                          'bg-red-50 text-red-500 border-red-200'
                        }`}>
                          {ord.status === 'pending' ? 'Chờ xác nhận' :
                           ord.status === 'shipping' ? 'Đang giao hàng' :
                           ord.status === 'completed' ? 'Đã nhận hàng' : 'Đã hủy'}
                        </span>
                      </div>

                      {/* Purchased products item block row */}
                      <div className="p-4 sm:p-5 space-y-4">
                        {ord.items.map((it, idx) => (
                          <div key={idx} className="flex gap-4 items-center justify-between">
                            <div className="flex gap-3.5 items-center min-w-0">
                              <img src={it.image} alt={it.name} className="h-12 w-12 object-cover rounded-xl border border-gray-150 bg-gray-50 shrink-0" />
                              <div className="min-w-0">
                                <span className="font-display text-xs font-black uppercase tracking-tight text-black block truncate hover:underline cursor-pointer" onClick={() => navigate(`/product/${it.productId}`)}>
                                  {it.name}
                                </span>
                                <span className="text-[10px] text-gray-400 font-bold block mt-0.5">{it.selectedColor} — Size: {it.selectedSize} • Số lượng: {it.quantity}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <span className="font-display text-xs font-black text-black">{formatVND(it.price * it.quantity)}</span>
                              
                              {ord.status === 'completed' && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenReviewDialog(ord, it.productId)}
                                  className="h-8 px-3 rounded-full border border-gray-250 hover:border-black bg-white text-[9px] font-black uppercase tracking-wider transition cursor-pointer select-none"
                                >
                                  Đánh giá
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Footer sum info */}
                      <div className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3.5 bg-white">
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider space-x-2">
                          <span>Vận chuyển: <b>{ord.courier}</b></span>
                          <span>•</span>
                          <span>Hình thức: <b>{ord.paymentMethod}</b></span>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-5">
                          <span className="font-display text-xs text-gray-500 uppercase font-black tracking-wider">
                            Tổng thanh toán: <b className="text-base font-black text-[#EE1111] ml-1">{formatVND(ord.total)}</b>
                          </span>

                          {ord.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm('Bạn có chắc muốn hủy đơn hàng này không?')) {
                                  dispatch(cancelOrderAction(ord.id));
                                }
                              }}
                              className="h-9 px-4 rounded-full border border-red-200 hover:bg-red-50 text-red-500 text-[10px] font-black uppercase tracking-widest transition cursor-pointer"
                            >
                              Hủy đơn
                            </button>
                          )}
                        </div>
                      </div>

                    </div>
                  ))}

                  {/* Sport Square minimal Pagination controls */}
                  {totalOrderPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between bg-white border border-gray-150 rounded-3xl px-5 py-4 gap-3">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                        Đang xem <span className="text-black">{(orderPage - 1) * ORDERS_PER_PAGE + 1}</span>–<span className="text-black">{Math.min(orderPage * ORDERS_PER_PAGE, myOrders.length)}</span> của <span className="text-black">{myOrders.length}</span> đơn mua
                      </p>
                      <div className="flex items-center gap-1.5">
                        <button
                          disabled={orderPage === 1}
                          onClick={() => setOrderPage(p => Math.max(p - 1, 1))}
                          className="h-8 px-3 text-[10px] font-black uppercase tracking-wider border border-gray-200 rounded-lg hover:border-black text-gray-700 hover:text-black transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:text-gray-700"
                        >
                          Trước
                        </button>
                        {Array.from({ length: totalOrderPages }).map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setOrderPage(i + 1)}
                            className={`h-8 w-8 flex items-center justify-center text-[10px] font-black rounded-lg transition cursor-pointer ${
                              orderPage === i + 1
                                ? 'bg-black text-white'
                                : 'border border-gray-200 text-gray-700 hover:border-black'
                            }`}
                          >
                            {i + 1}
                          </button>
                        ))}
                        <button
                          disabled={orderPage === totalOrderPages}
                          onClick={() => setOrderPage(p => Math.min(p + 1, totalOrderPages))}
                          className="h-8 px-3 text-[10px] font-black uppercase tracking-wider border border-gray-200 rounded-lg hover:border-black text-gray-700 hover:text-black transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:text-gray-700"
                        >
                          Sau
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="border border-gray-150 rounded-3xl p-12 text-center space-y-3.5 max-w-lg mx-auto bg-white">
                  <Package className="h-10 w-10 text-gray-300 mx-auto" />
                  <div className="space-y-1">
                    <h4 className="font-display text-sm font-black uppercase tracking-widest text-black">Chưa có đơn hàng nào</h4>
                    <p className="text-[10px] text-gray-450 max-w-xs mx-auto leading-normal font-semibold">
                      Lịch sử đơn mua của bạn hiện đang trống. Hãy thực hiện đặt mua đơn hàng đầu tiên của bạn tại cửa hàng nhé.
                    </p>
                  </div>
                  <button 
                    onClick={() => navigate('/?view=collection')}
                    className="h-11 px-6 rounded-full bg-black text-white hover:opacity-90 transition font-display text-[10px] font-black uppercase tracking-widest cursor-pointer shadow-sm"
                  >
                    Bắt đầu mua sắm
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SETTINGS (COMBINED MEMBER SETTINGS) */}
          {currentUser.role === 'customer' && activeSubTab === 'settings' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
              
              {/* Settings Left Column Navigation (occupies 3 cols) */}
              <aside className="lg:col-span-3 flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-1.5 border-b lg:border-b-0 lg:border-r border-gray-200 pb-3 lg:pb-0 lg:pr-6">
                {[
                  { id: 'details', label: 'Thông tin tài khoản' },
                  { id: 'addresses', label: 'Sổ địa chỉ nhận hàng' }
                ].map((setTab) => {
                  const isActive = activeSettingsTab === setTab.id;
                  return (
                    <button
                      key={setTab.id}
                      onClick={() => {
                        setActiveSettingsTab(setTab.id as any);
                        setShowAddressForm(false);
                      }}
                      className={`text-left font-display text-xs font-bold uppercase tracking-wider px-3.5 py-3 transition shrink-0 cursor-pointer rounded-xl ${
                        isActive
                          ? 'bg-gray-50 text-black font-black border-l-2 border-black rounded-l-none'
                          : 'text-gray-400 hover:text-black hover:bg-gray-50/50'
                      }`}
                    >
                      {setTab.label}
                    </button>
                  );
                })}
              </aside>

              {/* Settings Right Column Contents Panel (occupies 9 cols) */}
              <main className="lg:col-span-9">
                
                {/* SETTINGS OPTION: ACCOUNT DETAILS FORM */}
                {activeSettingsTab === 'details' && (
                  <div className="space-y-6 max-w-2xl">
                    <h3 className="font-display text-lg font-black uppercase tracking-wider text-black border-b border-gray-150 pb-3 leading-none">Thông Tin Tài Khoản</h3>
                    
                    {successNotify && (
                      <div className="rounded-2xl bg-green-50 border border-green-150 p-4 text-xs font-bold text-green-600 flex items-center gap-2 animate-scale-up">
                        <Check className="h-4.5 w-4.5 stroke-[2.5]" />
                        {successNotify}
                      </div>
                    )}

                    <form onSubmit={handleUpdateProfile} className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Mã định danh thành viên</label>
                          <input
                            type="text"
                            disabled
                            value={currentUser.id}
                            className="w-full bg-transparent border-b border-gray-100 rounded-none py-2.5 px-0 text-xs font-bold text-gray-400 font-mono focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Địa chỉ email</label>
                          <input
                            type="text"
                            disabled
                            value={currentUser.email}
                            className="w-full bg-transparent border-b border-gray-100 rounded-none py-2.5 px-0 text-xs font-bold text-gray-400 font-mono focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Họ & Tên</label>
                          <input
                            type="text"
                            required
                            value={profileName}
                            onChange={(e) => setProfileName(e.target.value)}
                            placeholder="Họ và tên..."
                            className="w-full bg-transparent border-b border-gray-250 focus:border-black rounded-none py-2.5 px-0 text-xs font-bold text-black focus:outline-none transition placeholder:text-gray-300 font-semibold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Số điện thoại liên hệ</label>
                          <input
                            type="tel"
                            required
                            value={profilePhone}
                            onChange={(e) => setProfilePhone(e.target.value)}
                            placeholder="Số điện thoại..."
                            className="w-full bg-transparent border-b border-gray-250 focus:border-black rounded-none py-2.5 px-0 text-xs font-bold text-black focus:outline-none transition placeholder:text-gray-300 font-semibold"
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <div className="space-y-1 max-w-sm">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Thay đổi mật khẩu tài khoản</label>
                          <input
                            type="password"
                            value={passwordChange}
                            onChange={(e) => setPasswordChange(e.target.value)}
                            placeholder="Nhập mật khẩu mới..."
                            className="w-full bg-transparent border-b border-gray-250 focus:border-black rounded-none py-2.5 px-0 text-xs font-bold text-black focus:outline-none transition placeholder:text-gray-300 font-semibold"
                          />
                          <span className="block text-[9.5px] text-gray-400 font-semibold italic pt-1 leading-normal">💡 Để trống trường này nếu không có nhu cầu đổi mật khẩu.</span>
                        </div>
                      </div>

                      <div className="pt-4">
                        <button
                          type="submit"
                          className="h-12 px-8 rounded-full bg-black text-white hover:opacity-90 transition font-display text-[10.5px] font-black uppercase tracking-widest cursor-pointer shadow-sm"
                        >
                          Lưu Thay Đổi
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* SETTINGS OPTION: SAVED ADDRESS BOOK */}
                {activeSettingsTab === 'addresses' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-gray-150 pb-3 gap-3 leading-none">
                      <h3 className="font-display text-lg font-black uppercase tracking-wider text-black">Sổ Địa Chỉ Giao Hàng</h3>
                      
                      {!showAddressForm && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAddressId(null);
                            setShowAddressForm(true);
                            setFormLabel('Nhà riêng');
                            setFormName(currentUser.name || '');
                            setFormPhone(currentUser.phone || '');
                            setFormStreet('');
                            setFormCity('');
                          }}
                          className="flex items-center gap-1 text-[10.5px] font-black text-black uppercase tracking-widest hover:underline cursor-pointer bg-transparent border-none focus:outline-none"
                        >
                          <Plus className="h-4 w-4" />
                          Thêm địa chỉ mới
                        </button>
                      )}
                    </div>

                    {/* Address addition/editing form */}
                    {showAddressForm && (
                      <form onSubmit={handleAddressSubmit} className="bg-gray-50 border border-gray-200 p-5 rounded-3xl text-xs font-medium space-y-4 animate-scale-up">
                        <span className="font-display text-xs font-black uppercase tracking-wider text-black block border-b border-gray-200 pb-2">
                          {editingAddressId ? 'Cập nhật địa chỉ nhận hàng' : 'Thêm một địa chỉ mới'}
                        </span>

                        <div className="space-y-2">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Loại địa chỉ</label>
                          <div className="flex flex-wrap gap-2.5">
                            {['Nhà riêng', 'Văn phòng', 'Nhà bố mẹ', 'Nơi làm việc'].map((lab) => {
                              const isSelected = formLabel === lab;
                              return (
                                <button
                                  key={lab}
                                  type="button"
                                  onClick={() => setFormLabel(lab)}
                                  className={`h-9 px-4 border text-[10px] font-black uppercase tracking-wider rounded-full cursor-pointer transition select-none ${
                                    isSelected
                                      ? 'border-black bg-black text-white'
                                      : 'border-gray-200 bg-white text-gray-600 hover:border-black/50'
                                  }`}
                                >
                                  {lab}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Tên người nhận</label>
                            <input
                              type="text"
                              required
                              value={formName}
                              onChange={(e) => setFormName(e.target.value)}
                              placeholder="Họ và tên..."
                              className="w-full bg-transparent border-b border-gray-250 focus:border-black rounded-none py-2.5 px-0 text-xs font-bold text-black focus:outline-none transition placeholder:text-gray-300 font-semibold"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Số điện thoại người nhận</label>
                            <input
                              type="tel"
                              required
                              value={formPhone}
                              onChange={(e) => setFormPhone(e.target.value)}
                              placeholder="Số điện thoại..."
                              className="w-full bg-transparent border-b border-gray-250 focus:border-black rounded-none py-2.5 px-0 text-xs font-bold text-black focus:outline-none transition placeholder:text-gray-300 font-semibold"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Địa chỉ chi tiết (Số nhà, Tên đường, Phường/Xã...)</label>
                          <input
                            type="text"
                            required
                            value={formStreet}
                            onChange={(e) => setFormStreet(e.target.value)}
                            placeholder="Địa chỉ giao hàng..."
                            className="w-full bg-transparent border-b border-gray-250 focus:border-black rounded-none py-2.5 px-0 text-xs font-bold text-black focus:outline-none transition placeholder:text-gray-300 font-semibold"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Tỉnh / Thành phố</label>
                          <input
                            type="text"
                            required
                            value={formCity}
                            onChange={(e) => setFormCity(e.target.value)}
                            placeholder="Tỉnh/Thành phố..."
                            className="w-full bg-transparent border-b border-gray-250 focus:border-black rounded-none py-2.5 px-0 text-xs font-bold text-black focus:outline-none transition placeholder:text-gray-300 font-semibold"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddressForm(false);
                              setEditingAddressId(null);
                            }}
                            className="h-10 px-5 rounded-full border border-gray-300 bg-white text-black hover:border-black transition text-[10px] font-black uppercase tracking-widest cursor-pointer"
                          >
                            Bỏ qua
                          </button>
                          <button
                            type="submit"
                            className="h-10 px-5 rounded-full bg-black text-white hover:opacity-90 transition text-[10px] font-black uppercase tracking-widest cursor-pointer"
                          >
                            Lưu địa chỉ
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Render saved address list */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {currentUser.addresses.length > 0 ? (
                        currentUser.addresses.map((addr) => (
                          <div 
                            key={addr.id} 
                            className="p-5 rounded-3xl border border-gray-200 hover:border-black bg-white transition text-xs flex flex-col justify-between min-h-[140px] relative group"
                          >
                            {/* Controls buttons */}
                            <div className="absolute right-4 top-4 flex gap-1 bg-white pl-2">
                              <button
                                onClick={() => handleEditAddressInit(addr)}
                                className="p-1.5 rounded-full text-gray-400 hover:text-black hover:bg-gray-50 cursor-pointer"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => dispatch(deleteAddressAction(addr.id))}
                                className="p-1.5 rounded-full text-gray-400 hover:text-[#EE1111] hover:bg-red-50 cursor-pointer"
                              >
                                <Trash className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 font-bold text-gray-900 pr-14">
                                <span className="truncate">{addr.name}</span>
                                <span className="bg-black text-white rounded-xs px-1.5 py-0.2 text-[8px] uppercase font-bold tracking-wider shrink-0 font-display">
                                  {addr.label}
                                </span>
                              </div>
                              <p className="font-mono text-gray-500 font-semibold">{addr.phone}</p>
                              <p className="text-gray-400 mt-1 lines-clamp-2 leading-relaxed font-semibold pr-4">
                                {addr.street}, {addr.city}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="sm:col-span-2 border border-gray-150 rounded-3xl p-8 text-center space-y-1.5 max-w-sm mx-auto bg-white w-full">
                          <MapPin className="h-7 w-7 text-gray-300 mx-auto" />
                          <p className="text-xs text-gray-400 font-semibold">Sổ địa chỉ của bạn đang trống.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </main>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

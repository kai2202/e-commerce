import React, { useState, useRef } from 'react';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../redux/hooks';
import { logout as logoutAction } from '../../redux/authSlice';
import { setActiveView, setAuthModalOpen, setCartDrawerOpen, setWishlistDrawerOpen, setSearchKeyword, setSelectedCategoryId } from '../../redux/uiSlice';
import { ShoppingCart, Heart, Search, User, LogOut, LayoutDashboard, Store, LogIn, X, Menu } from 'lucide-react';

export const Navbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const cart = useAppSelector((state) => state.cart.cart);
  const wishlist = useAppSelector((state) => state.cart.wishlist);
  const activeView = useAppSelector((state) => state.ui.activeView);

  const [searchInput, setSearchInput] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useClickOutside(dropdownRef, () => setShowProfileDropdown(false));
  useClickOutside(searchRef, () => setSearchOpen(false));

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(setSearchKeyword(searchInput));
    setSearchOpen(false);
    if (location.pathname !== '/') navigate('/');
  };

  const handleLogoClick = () => {
    dispatch(setSelectedCategoryId(null));
    dispatch(setSearchKeyword(''));
    setSearchInput('');
    dispatch(setActiveView('client'));
    navigate('/?view=landing');
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-6">
            
            {/* Logo */}
            <div
              onClick={handleLogoClick}
              className="flex shrink-0 items-center cursor-pointer select-none"
            >
              <span className="font-display text-2xl font-900 tracking-wider text-black uppercase leading-none">
                E-Market
              </span>
              <span className="text-[#EE1111] text-2xl font-black font-display leading-none ml-0.5">.</span>
            </div>

            {/* Nav links — desktop */}
            <nav className="hidden lg:flex items-center gap-6">
              {[
                { label: 'Bộ Sưu Tập', action: () => { dispatch(setSelectedCategoryId(null)); dispatch(setSearchKeyword('')); navigate('/?view=collection'); } },
                { label: 'Nam', action: () => { dispatch(setSelectedCategoryId(null)); dispatch(setSearchKeyword('nam')); navigate('/?view=collection'); } },
                { label: 'Nữ', action: () => { dispatch(setSelectedCategoryId(null)); dispatch(setSearchKeyword('nữ')); navigate('/?view=collection'); } },
                { label: 'Trẻ Em', action: () => { dispatch(setSelectedCategoryId(null)); dispatch(setSearchKeyword('trẻ em')); navigate('/?view=collection'); } },
                { label: 'Giày', action: () => { dispatch(setSelectedCategoryId(null)); dispatch(setSearchKeyword('giày')); navigate('/?view=collection'); } },
                { label: 'Thể Thao', action: () => { dispatch(setSelectedCategoryId(null)); dispatch(setSearchKeyword('thể thao')); navigate('/?view=collection'); } },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.action}
                  className="nav-link-adidas cursor-pointer bg-transparent border-none text-[11px] font-bold tracking-widest uppercase"
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Right icons */}
            <div className="flex items-center gap-3">
              
              {/* Search toggle */}
              <button
                type="button"
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 text-black hover:text-[#EE1111] transition cursor-pointer"
                aria-label="Tìm kiếm"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Wishlist */}
              <button
                type="button"
                onClick={() => {
                  if (!currentUser) return dispatch(setAuthModalOpen(true));
                  navigate('/favorites');
                }}
                className="relative p-2 text-black hover:text-[#EE1111] transition cursor-pointer"
                aria-label="Danh sách yêu thích"
              >
                <Heart className="h-5 w-5" />
                {wishlist.length > 0 && (
                  <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-[#EE1111] text-[9px] font-bold text-white">
                    {wishlist.length}
                  </span>
                )}
              </button>

              {/* Cart */}
              <button
                type="button"
                id="top-cart-btn"
                onClick={() => {
                  navigate('/cart');
                }}
                className="relative p-2 text-black hover:text-[#EE1111] transition cursor-pointer"
                aria-label="Giỏ hàng"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[9px] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Profile */}
              {currentUser ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="flex items-center gap-2 p-1 hover:opacity-80 transition cursor-pointer"
                    id="profile-menu-trigger"
                  >
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="h-8 w-8 rounded-full object-cover border-2 border-black"
                      referrerPolicy="no-referrer"
                    />
                    <span className="hidden lg:block font-display text-xs font-700 uppercase tracking-wider text-black max-w-[100px] truncate">
                      {currentUser.name.split(' ').pop()}
                    </span>
                  </button>

                  {showProfileDropdown && (
                    <div className="absolute right-0 mt-2 w-56 origin-top-right bg-white border border-gray-200 shadow-lg z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <span className="block font-display text-xs font-700 uppercase tracking-wider text-black">{currentUser.name}</span>
                        <span className="block text-[10px] text-gray-500 mt-0.5 font-mono truncate">{currentUser.email}</span>
                        <span className={`inline-block mt-1.5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          currentUser.role === 'admin' ? 'bg-[#EE1111] text-white' :
                          currentUser.role === 'staff_inventory' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {currentUser.role === 'admin' ? 'Admin' :
                           currentUser.role === 'staff_inventory' ? 'Nhân Viên Kho' : 'Khách Hàng'}
                        </span>
                      </div>

                      {(currentUser.role === 'admin' || currentUser.role === 'staff_inventory') && (
                        <button
                          onClick={() => {
                            if (activeView === 'client') {
                              dispatch(setActiveView('admin'));
                              navigate('/admin');
                            } else {
                              dispatch(setActiveView('client'));
                              navigate('/');
                            }
                            setShowProfileDropdown(false);
                          }}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-black hover:bg-gray-50 transition cursor-pointer"
                        >
                          {activeView === 'client' ? <LayoutDashboard className="h-3.5 w-3.5" /> : <Store className="h-3.5 w-3.5" />}
                          {activeView === 'client' ? 'Vào Trang Admin' : 'Vào Giao Diện'}
                        </button>
                      )}

                      <button
                        onClick={() => { navigate('/account'); setShowProfileDropdown(false); }}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                      >
                        <User className="h-3.5 w-3.5" />
                        Thông tin tài khoản
                      </button>

                      <button
                        onClick={() => { navigate('/track'); setShowProfileDropdown(false); }}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                      >
                        <Search className="h-3.5 w-3.5" />
                        Tra cứu đơn hàng
                      </button>

                      <button
                        onClick={() => {
                          dispatch(logoutAction());
                          setShowProfileDropdown(false);
                          navigate('/');
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[11px] uppercase tracking-wider font-bold text-[#EE1111] hover:bg-red-50 transition border-t border-gray-100 cursor-pointer"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  id="login-trigger-btn"
                  onClick={() => dispatch(setAuthModalOpen(true))}
                  className="flex items-center gap-1.5 bg-black px-4 py-2 text-[10px] uppercase font-bold tracking-widest text-white hover:bg-gray-900 transition duration-150 cursor-pointer"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Đăng Nhập
                </button>
              )}

              {/* Mobile menu toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-black cursor-pointer"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Search bar — full-width dropdown */}
        {searchOpen && (
          <div ref={searchRef} className="border-t border-gray-200 bg-white py-3 px-4 sm:px-6 lg:px-8">
            <form onSubmit={handleSearchSubmit} className="mx-auto max-w-2xl flex items-center gap-3">
              <Search className="h-4 w-4 text-gray-400 shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Tìm kiếm sản phẩm..."
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  dispatch(setSearchKeyword(e.target.value));
                }}
                className="flex-1 bg-transparent text-sm text-black placeholder:text-gray-400 outline-none font-sans"
              />
              {searchInput && (
                <button type="button" onClick={() => { setSearchInput(''); dispatch(setSearchKeyword('')); }} className="text-gray-400 hover:text-black cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              )}
            </form>
          </div>
        )}

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            {[
              { label: 'Bộ Sưu Tập', action: () => { dispatch(setSelectedCategoryId(null)); dispatch(setSearchKeyword('')); navigate('/?view=collection'); setMobileMenuOpen(false); } },
              { label: 'Nam', action: () => { dispatch(setSelectedCategoryId(null)); dispatch(setSearchKeyword('nam')); navigate('/?view=collection'); setMobileMenuOpen(false); } },
              { label: 'Nữ', action: () => { dispatch(setSelectedCategoryId(null)); dispatch(setSearchKeyword('nữ')); navigate('/?view=collection'); setMobileMenuOpen(false); } },
              { label: 'Trẻ Em', action: () => { dispatch(setSelectedCategoryId(null)); dispatch(setSearchKeyword('trẻ em')); navigate('/?view=collection'); setMobileMenuOpen(false); } },
              { label: 'Giày', action: () => { dispatch(setSelectedCategoryId(null)); dispatch(setSearchKeyword('giày')); navigate('/?view=collection'); setMobileMenuOpen(false); } },
              { label: 'Thể Thao', action: () => { dispatch(setSelectedCategoryId(null)); dispatch(setSearchKeyword('thể thao')); navigate('/?view=collection'); setMobileMenuOpen(false); } },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={item.action}
                className="block w-full px-6 py-3.5 text-left font-display text-sm font-700 uppercase tracking-wider text-black border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </header>
    </>
  );
};

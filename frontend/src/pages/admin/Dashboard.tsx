import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../redux/hooks';
import { logout as logoutAction } from '../../redux/authSlice';
import { setActiveView } from '../../redux/uiSlice';
import { AdminDashboard } from '../../components/admin/AdminDashboard';
import { AdminProducts } from '../../components/admin/AdminProducts';
import { AdminCategories } from '../../components/admin/AdminCategories';
import { AdminOrders } from '../../components/admin/AdminOrders';
import { AdminUsers } from '../../components/admin/AdminUsers';
import { AdminPromotions } from '../../components/admin/AdminPromotions';
import {
  LayoutDashboard,
  ShoppingCart,
  FolderHeart,
  BadgeCheck,
  Users2,
  Gift,
  Lock,
  ShieldAlert,
  Store,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type AdminTab = 'dashboard' | 'products' | 'categories' | 'orders' | 'users' | 'promotions';

const NAV_ITEMS: { id: AdminTab; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'TỔNG QUAN', icon: LayoutDashboard },
  { id: 'products', label: 'SẢN PHẨM & KHO', icon: ShoppingCart },
  { id: 'categories', label: 'DANH MỤC', icon: FolderHeart },
  { id: 'orders', label: 'ĐƠN HÀNG', icon: BadgeCheck },
  { id: 'users', label: 'TÀI KHOẢN', icon: Users2 },
  { id: 'promotions', label: 'KHUYẾN MÃI', icon: Gift },
];

export const Dashboard: React.FC = () => {
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const [activeTab, setActiveTab] = useState<AdminTab>('orders');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  if (!currentUser) {
    return (
      <div className="mx-auto max-w-xl text-center py-24 space-y-5 font-sans">
        <ShieldAlert className="h-14 w-14 mx-auto" style={{ color: '#D2FC38' }} />
        <h3 className="text-lg font-black text-white uppercase tracking-widest font-display">
          YÊU CẦU ĐĂNG NHẬP
        </h3>
        <p className="text-sm text-gray-400">
          Vui lòng đăng nhập với tài khoản Admin hoặc Nhân Viên Kho để sử dụng trang quản trị.
        </p>
      </div>
    );
  }

  const isStaff = currentUser.role === 'staff_inventory';
  const hasAccess = (tab: AdminTab) => {
    if (!isStaff) return true;
    return tab === 'products' || tab === 'orders';
  };

  const handleTabSelect = (tab: AdminTab) => {
    if (!hasAccess(tab)) {
      alert('🔒 Bạn đang đăng nhập bằng phân quyền Nhân Viên Kho. Chỉ Admin tối cao mới quyền chỉnh sửa mục cấu hình hệ thống này!');
      return;
    }
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  const handleGoToStore = () => {
    dispatch(setActiveView('client'));
    navigate('/');
  };

  const handleLogout = () => {
    dispatch(logoutAction());
    navigate('/');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-100">
      {/* ──────────── Mobile Overlay Backdrop ──────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ──────────── LEFT SIDEBAR ──────────── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 flex flex-col
          bg-neutral-950 text-white
          transform transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0 lg:flex
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-800">
          <div className="select-none">
            <span className="text-xl font-semibold italic tracking-tighter text-white" style={{ fontFamily: 'serif' }}>
              E-Market
            </span>
            <span className="ml-1 text-xs font-black uppercase tracking-[0.25em] font-display" style={{ color: '#D2FC38' }}>
              ADMIN HUB
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 text-neutral-400 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const IconComp = item.icon;
            const allowed = hasAccess(item.id);
            const active = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleTabSelect(item.id)}
                className={`
                  flex items-center gap-3 w-full text-left rounded-lg px-4 py-3
                  font-display font-bold text-xs tracking-wider uppercase
                  transition-all duration-200 cursor-pointer
                  ${active
                    ? 'text-black shadow-lg'
                    : allowed
                      ? 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                      : 'text-neutral-600 cursor-not-allowed'
                  }
                `}
                style={active ? { backgroundColor: '#D2FC38' } : undefined}
              >
                <IconComp className={`h-4.5 w-4.5 shrink-0 ${active ? 'text-black' : ''}`} />
                <span className="flex-1">{item.label}</span>
                {!allowed && <Lock className="h-3.5 w-3.5 text-neutral-600 shrink-0" />}
                {active && <ChevronRight className="h-4 w-4 text-black shrink-0" />}
              </button>
            );
          })}
        </nav>

        {/* Staff Warning Badge */}
        {isStaff && (
          <div className="mx-3 mb-3 px-3 py-2.5 rounded-lg border border-neutral-700 bg-neutral-900 flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 shrink-0" style={{ color: '#D2FC38' }} />
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">
              Quyền hạn chế — Nhân viên kho
            </span>
          </div>
        )}

        {/* Sidebar Footer — User Info & Actions */}
        <div className="border-t border-neutral-800 px-4 py-4 space-y-3">
          {/* User Details */}
          <div className="flex items-center gap-3">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="h-9 w-9 rounded-full object-cover border-2 shrink-0"
              style={{ borderColor: '#D2FC38' }}
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0">
              <span className="block text-xs font-black text-white truncate uppercase tracking-wide font-display">
                {currentUser.name}
              </span>
              <span
                className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider"
                style={{
                  backgroundColor: currentUser.role === 'admin' ? '#D2FC38' : '#2d2d2d',
                  color: currentUser.role === 'admin' ? '#000' : '#D2FC38',
                }}
              >
                {currentUser.role === 'admin' ? 'ADMIN' : 'STAFF'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleGoToStore}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full border border-neutral-700 text-[10px] font-black uppercase tracking-wider text-neutral-400 hover:text-white hover:border-neutral-500 transition cursor-pointer"
            >
              <Store className="h-3.5 w-3.5" />
              Cửa hàng
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full border border-red-900/50 text-[10px] font-black uppercase tracking-wider text-red-400 hover:bg-red-950 hover:text-red-300 transition cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              Đăng xuất
            </button>
          </div>
        </div>
      </aside>

      {/* ──────────── MAIN CONTENT AREA ──────────── */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Top Header Bar — Mobile + Info */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 bg-white border-b border-neutral-200 px-4 sm:px-6 lg:px-8 py-3">
          {/* Hamburger for mobile */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition cursor-pointer"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Current section title */}
          <div className="flex-1">
            <h1 className="text-sm font-black uppercase tracking-widest text-neutral-900 font-display">
              {NAV_ITEMS.find((n) => n.id === activeTab)?.label || 'QUẢN TRỊ'}
            </h1>
            <p className="text-[10px] text-neutral-400 font-medium mt-0.5 hidden sm:block">
              Hệ thống quản trị trung tâm E-Market — Đăng nhập:{' '}
              <b className="text-neutral-700">{currentUser.name}</b> ({currentUser.role === 'admin' ? 'Admin' : 'Staff'})
            </p>
          </div>

          {/* Volt accent dot indicator */}
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: '#D2FC38' }} />
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider hidden md:inline">
              Hệ thống đang hoạt động
            </span>
          </div>
        </header>

        {/* Main scrollable content area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {activeTab === 'dashboard' && <AdminDashboard />}
          {activeTab === 'products' && <AdminProducts />}
          {activeTab === 'categories' && <AdminCategories />}
          {activeTab === 'orders' && <AdminOrders />}
          {activeTab === 'users' && <AdminUsers />}
          {activeTab === 'promotions' && <AdminPromotions />}
        </main>
      </div>
    </div>
  );
};

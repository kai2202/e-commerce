import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../redux/hooks';
import { logout as logoutAction } from '../../redux/authSlice';
import { setActiveView } from '../../redux/uiSlice';
import { ShieldCheck, Store, LogOut, User, LayoutDashboard } from 'lucide-react';

export const AdminNavbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const activeView = useAppSelector((state) => state.ui.activeView);

  const handleToggleView = () => {
    if (activeView === 'admin') {
      dispatch(setActiveView('client'));
      navigate('/');
    } else {
      dispatch(setActiveView('admin'));
      navigate('/admin');
    }
  };

  const handleLogout = () => {
    dispatch(logoutAction());
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-150 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* Brand Logo & Admin Label */}
          <div className="flex items-center gap-3 select-none">
            <div className="flex items-center gap-1">
              <span className="serif text-2xl font-semibold italic tracking-tighter text-[#1A1A1A]">
                E-Market
              </span>
              <span className="text-[#8C7E6A] text-xl font-black font-sans leading-none">.</span>
            </div>
            
            <div className="h-4 w-px bg-gray-250" />
            
            <div className="flex items-center gap-1 bg-indigo-50 border border-indigo-150 rounded-md px-2 py-0.5 text-indigo-700 font-extrabold text-[9.5px] tracking-wider uppercase">
              <ShieldCheck className="h-3 w-3 shrink-0" />
              <span>Admin Panel</span>
            </div>
          </div>

          {/* Quick Actions & Profile info */}
          <div className="flex items-center gap-6">
            
            {/* Quick Link Toggle View */}
            <button
              onClick={handleToggleView}
              className="flex items-center gap-1.5 font-black uppercase text-[10px] tracking-wider text-gray-500 hover:text-indigo-650 transition cursor-pointer"
            >
              {activeView === 'admin' ? (
                <>
                  <Store className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">Quay về cửa hàng</span>
                </>
              ) : (
                <>
                  <LayoutDashboard className="h-4 w-4 shrink-0 text-indigo-600 animate-pulse" />
                  <span className="hidden sm:inline text-indigo-600">Vào trang quản trị</span>
                </>
              )}
            </button>

            <div className="h-5 w-px bg-gray-200" />

            {/* Admin Account details */}
            {currentUser && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="h-7.5 w-7.5 rounded-full object-cover border border-gray-200"
                    referrerPolicy="no-referrer"
                  />
                  <div className="text-left leading-tight hidden md:block">
                    <span className="block font-black text-gray-800 text-[11px] uppercase tracking-wider max-w-[120px] truncate">
                      {currentUser.name}
                    </span>
                    <span className={`inline-block px-1 py-0.2 rounded-sm text-[8px] font-black uppercase tracking-wider mt-0.5 ${
                      currentUser.role === 'admin' 
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                        : 'bg-cyan-50 text-cyan-700 border border-cyan-100'
                    }`}>
                      {currentUser.role === 'admin' ? 'Quản trị viên' : 'Nhân viên kho'}
                    </span>
                  </div>
                </div>

                <div className="h-4 w-px bg-gray-200 hidden md:block" />

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  title="Đăng xuất khỏi hệ thống"
                  className="flex items-center justify-center p-1.5 rounded-lg border border-red-100 text-red-500 bg-red-50/50 hover:bg-red-100 hover:text-red-750 transition cursor-pointer"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  <span className="hidden lg:inline text-[9.5px] font-black uppercase tracking-wider ml-1">Thoát</span>
                </button>
              </div>
            )}
            
          </div>
          
        </div>
      </div>
    </header>
  );
};

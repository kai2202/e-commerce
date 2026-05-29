import React from 'react';
import { Routes, Route, Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { AdminNavbar } from '../components/admin/AdminNavbar';
import { useAppSelector } from '../redux/hooks';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

// Pages
import { Home } from '../pages/client/Home';
import { Checkout } from '../pages/client/Checkout';
import { Account } from '../pages/client/Account';
import { ProductDetail } from '../pages/client/ProductDetail';
import { LoginSuccess } from '../pages/client/LoginSuccess';
import { OrderTracking } from '../pages/client/OrderTracking';
import { NotFound } from '../pages/client/NotFound';
import { Cart } from '../pages/client/Cart';
import { Favorites } from '../pages/client/Favorites';
import { Dashboard as AdminDashboard } from '../pages/admin/Dashboard';

const CheckoutHeader: React.FC = () => {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200 h-16 shrink-0 font-sans">
      <div className="mx-auto max-w-7xl h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <div onClick={() => navigate('/')} className="flex items-center cursor-pointer select-none">
          <span className="font-display text-xl font-900 tracking-wider text-black uppercase leading-none">E-Market</span>
          <span className="text-[#EE1111] text-xl font-black font-display ml-0.5 leading-none">.</span>
        </div>
        {/* Secure Checkout Icon */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-display font-black uppercase tracking-widest text-gray-400">Secure Checkout</span>
          <span className="text-gray-200">|</span>
          <button 
            onClick={() => navigate('/cart')} 
            className="text-[10px] font-display font-black uppercase tracking-widest text-black hover:underline cursor-pointer bg-transparent border-none focus:outline-none"
          >
            Quay lại giỏ hàng
          </button>
        </div>
      </div>
    </header>
  );
};

const ClientLayout: React.FC = () => {
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'staff_inventory');
  const location = useLocation();
  const isCheckout = location.pathname === '/checkout';

  return (
    <>
      {isAdmin ? (
        <AdminNavbar />
      ) : isCheckout ? (
        <CheckoutHeader />
      ) : (
        <Navbar />
      )}
      <main className="flex-grow">
        <ErrorBoundary key={location.pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>
    </>
  );
};

// Admin Route Guard to secure /admin/* routes
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  const hasAdminPrivilege = currentUser.role === 'admin' || currentUser.role === 'staff_inventory';
  if (!hasAdminPrivilege) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<ClientLayout />}>
        <Route index element={<Home />} />
        <Route path="product/:id" element={<ProductDetail />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="cart" element={<Cart />} />
        <Route path="favorites" element={<Favorites />} />
        <Route path="account" element={<Account />} />
        <Route path="login-success" element={<LoginSuccess />} />
        <Route path="track" element={<OrderTracking />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="/admin/*" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
    </Routes>
  );
};


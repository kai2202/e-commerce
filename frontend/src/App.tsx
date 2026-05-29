import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from './redux/hooks';
import { AppRoutes } from './routes/AppRoutes';
import { AuthModal } from './components/client/AuthModal';
import { AddedToBagModal } from './components/client/AddedToBagModal';
import { AddedToFavoritesModal } from './components/client/AddedToFavoritesModal';
import { WishlistDrawer } from './components/client/WishlistDrawer';
import { fetchProducts, fetchCategories, fetchCoupons, fetchBanners } from './redux/shopSlice';
import { restoreSession } from './redux/authSlice';
import { loadUserCartAndWishlist } from './redux/cartSlice';
import { ErrorBoundary } from './components/common/ErrorBoundary';

export default function App() {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const cart = useAppSelector((state) => state.cart.cart);
  const wishlist = useAppSelector((state) => state.cart.wishlist);

  useEffect(() => {
    dispatch(restoreSession());
    dispatch(fetchCategories());
    dispatch(fetchCoupons());
    dispatch(fetchBanners());
  }, [dispatch]);

  useEffect(() => {
    dispatch(loadUserCartAndWishlist(currentUser ? currentUser.id : null));
  }, [dispatch, currentUser]);

  useEffect(() => {
    const productIds = new Set<string>();
    cart.forEach((item) => {
      if (item.productId) productIds.add(item.productId);
    });
    wishlist.forEach((id) => {
      if (id) productIds.add(id);
    });

    if (productIds.size > 0) {
      dispatch(fetchProducts({ ids: Array.from(productIds).join(',') }));
    }
  }, [dispatch, cart, wishlist]);

  return (
    <ErrorBoundary isGlobal={true}>
      <BrowserRouter>
        <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A] flex flex-col justify-between selection:bg-[#F4F1ED] font-sans">
          <AppRoutes />

          {/* Popup Dialog Overlays and Sliders */}
          <AuthModal />
          <AddedToBagModal />
          <AddedToFavoritesModal />
          <WishlistDrawer />
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
}


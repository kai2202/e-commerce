import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { CartItem } from '../types';
import { RootState } from './store';
import api from '../utils/api';

interface CartState {
  cart: CartItem[];
  wishlist: string[];
  activeUserId: string;
}

const initialState: CartState = {
  cart: [],
  wishlist: [],
  activeUserId: 'guest',
};

const saveData = (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data));

// Async Thunk: Load cart & wishlist and merge guest data if user logs in
export const loadUserCartAndWishlist = createAsyncThunk(
  'cart/loadUserCartAndWishlist',
  async (userId: string | null, { getState }) => {
    const activeUserId = userId || 'guest';
    
    // 1. Load guest data from localStorage
    const guestCartKey = 'ecom_cart_guest';
    const guestWishlistKey = 'ecom_wishlist_guest';
    
    const guestCartVal = localStorage.getItem(guestCartKey);
    const guestWishlistVal = localStorage.getItem(guestWishlistKey);
    
    const guestCart: CartItem[] = guestCartVal ? JSON.parse(guestCartVal) : [];
    const guestWishlist: string[] = guestWishlistVal ? JSON.parse(guestWishlistVal) : [];

    let finalCart = [...guestCart];
    let finalWishlist = [...guestWishlist];

    if (userId && userId !== 'guest') {
      try {
        // 2. Fetch current cart/wishlist from DB
        const response = await api.get('/users/cart-wishlist');
        const dbCart: CartItem[] = response.data.cart || [];
        const dbWishlist: string[] = response.data.wishlist || [];

        // 3. Merge guest cart with DB cart
        const mergedCart = [...dbCart];
        guestCart.forEach((gItem) => {
          const matched = mergedCart.find(
            (dbItem) => dbItem.productId === gItem.productId && dbItem.color === gItem.color && dbItem.size === gItem.size
          );
          if (matched) {
            matched.quantity += gItem.quantity;
          } else {
            mergedCart.push(gItem);
          }
        });

        // 4. Merge guest wishlist with DB wishlist
        const mergedWishlist = Array.from(new Set([...dbWishlist, ...guestWishlist]));

        finalCart = mergedCart;
        finalWishlist = mergedWishlist;

        // 5. If guest had items, sync merged cart/wishlist back to DB and clear guest local data
        if (guestCart.length > 0 || guestWishlist.length > 0) {
          await api.put('/users/cart-wishlist', {
            cart: finalCart,
            wishlist: finalWishlist
          });
          
          localStorage.removeItem(guestCartKey);
          localStorage.removeItem(guestWishlistKey);
        }
      } catch (err) {
        console.error('Failed to load or merge user cart & wishlist with backend DB:', err);
      }
    } else {
      // Guest: Just load guest data from local storage
      const cartKey = `ecom_cart_guest`;
      const savedCart = localStorage.getItem(cartKey);
      finalCart = savedCart ? JSON.parse(savedCart) : [];
      
      const wishlistKey = `ecom_wishlist_guest`;
      const savedWishlist = localStorage.getItem(wishlistKey);
      finalWishlist = savedWishlist ? JSON.parse(savedWishlist) : [];
    }

    // 6. Save loaded/merged data to localStorage for the active user ID
    localStorage.setItem(`ecom_cart_${activeUserId}`, JSON.stringify(finalCart));
    localStorage.setItem(`ecom_wishlist_${activeUserId}`, JSON.stringify(finalWishlist));

    return {
      activeUserId,
      cart: finalCart,
      wishlist: finalWishlist
    };
  }
);

// Async Thunk: Add product to cart and sync with DB if logged in
export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ productId, color, size, quantity }: { productId: string; color: string; size: string; quantity: number }, { getState, dispatch }) => {
    const state = getState() as RootState;
    const currentUser = state.auth.currentUser;
    const userId = currentUser ? currentUser.id : 'guest';
    
    const product = state.shop.products.find((p) => p.id === productId);
    if (!product) return { success: false, message: 'Không tìm thấy sản phẩm' };

    const matchedVariant = product.variants.find(
      (v) => v.color.toLowerCase() === color.toLowerCase() && v.size.toLowerCase() === size.toLowerCase()
    );

    if (matchedVariant) {
      const currentInCart = state.cart.cart.find(
        (item) => item.productId === productId && item.color === color && item.size === size
      );
      const targetQty = (currentInCart?.quantity || 0) + quantity;
      
      if (targetQty > matchedVariant.stock) {
        return {
          success: false,
          message: `Rất tiếc! Số lượng hàng còn lại cho màu ${color} - size ${size} là ${matchedVariant.stock}. Bạn không thể thêm thêm số lượng này.`,
        };
      }
    } else {
      return { success: false, message: 'Biến thể sản phẩm này hiện không có sẵn!' };
    }

    // Update Redux state immediately
    const itemId = `${productId}_${color}_${size}`;
    dispatch(addToCartInternal({ id: itemId, productId, color, size, quantity }));
    
    // Sync with backend if user is logged in
    const updatedState = getState() as RootState;
    if (currentUser) {
      try {
        await api.put('/users/cart-wishlist', {
          cart: updatedState.cart.cart,
          wishlist: updatedState.cart.wishlist
        });
      } catch (err) {
        console.error('Failed to sync addToCart with database:', err);
      }
    }

    return { success: true, message: 'Đã thêm sản phẩm vào giỏ hàng thành công!' };
  }
);

// Async Thunk: Update cart item quantity and sync with DB if logged in
export const updateCartQuantity = createAsyncThunk(
  'cart/updateQuantity',
  async ({ cartItemId, quantity }: { cartItemId: string; quantity: number }, { getState, dispatch }) => {
    const state = getState() as RootState;
    const currentUser = state.auth.currentUser;

    if (quantity <= 0) {
      dispatch(removeFromCartInternal(cartItemId));
      
      const updatedState = getState() as RootState;
      if (currentUser) {
        try {
          await api.put('/users/cart-wishlist', {
            cart: updatedState.cart.cart,
            wishlist: updatedState.cart.wishlist
          });
        } catch (err) {
          console.error('Failed to sync removeFromCart with database:', err);
        }
      }
      return { success: true, action: 'removed' };
    }
    
    const item = state.cart.cart.find((i) => i.id === cartItemId);
    if (!item) return { success: false, action: 'none' };

    const product = state.shop.products.find((p) => p.id === item.productId);
    if (product) {
      const matchedVariant = product.variants.find(
        (v) => v.color.toLowerCase() === item.color.toLowerCase() && v.size.toLowerCase() === item.size.toLowerCase()
      );
      if (matchedVariant && quantity > matchedVariant.stock) {
        return { success: false, action: 'exceed' }; 
      }
    }

    dispatch(updateCartQuantityInternal({ cartItemId, quantity }));

    const updatedState = getState() as RootState;
    if (currentUser) {
      try {
        await api.put('/users/cart-wishlist', {
          cart: updatedState.cart.cart,
          wishlist: updatedState.cart.wishlist
        });
      } catch (err) {
        console.error('Failed to sync updateCartQuantity with database:', err);
      }
    }

    return { success: true, action: 'updated' };
  }
);

// Async Thunk: Remove item from cart and sync with DB if logged in
export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async (cartItemId: string, { dispatch, getState }) => {
    dispatch(removeFromCartInternal(cartItemId));
    
    const state = getState() as RootState;
    if (state.auth.currentUser) {
      try {
        await api.put('/users/cart-wishlist', {
          cart: state.cart.cart,
          wishlist: state.cart.wishlist
        });
      } catch (err) {
        console.error('Failed to sync removeFromCart with database:', err);
      }
    }
  }
);

// Async Thunk: Clear entire cart and sync with DB if logged in
export const clearCart = createAsyncThunk(
  'cart/clearCart',
  async (_, { dispatch, getState }) => {
    dispatch(clearCartInternal());
    
    const state = getState() as RootState;
    if (state.auth.currentUser) {
      try {
        await api.put('/users/cart-wishlist', {
          cart: [],
          wishlist: state.cart.wishlist
        });
      } catch (err) {
        console.error('Failed to sync clearCart with database:', err);
      }
    }
  }
);

// Async Thunk: Toggle wishlist item and sync with DB if logged in
export const toggleWishlist = createAsyncThunk(
  'cart/toggleWishlist',
  async (productId: string, { dispatch, getState }) => {
    dispatch(toggleWishlistInternal(productId));
    
    const state = getState() as RootState;
    if (state.auth.currentUser) {
      try {
        await api.put('/users/cart-wishlist', {
          cart: state.cart.cart,
          wishlist: state.cart.wishlist
        });
      } catch (err) {
        console.error('Failed to sync toggleWishlist with database:', err);
      }
    }
  }
);

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // Internal synchronous reducers for snappy UI updates
    addToCartInternal: (state, action: PayloadAction<CartItem>) => {
      const { productId, color, size, quantity, id } = action.payload;
      const existing = state.cart.find((item) => item.id === id);
      if (existing) {
        existing.quantity += quantity;
      } else {
        state.cart.push({ id, productId, color, size, quantity });
      }
      saveData(`ecom_cart_${state.activeUserId}`, state.cart);
    },
    removeFromCartInternal: (state, action: PayloadAction<string>) => {
      state.cart = state.cart.filter((i) => i.id !== action.payload);
      saveData(`ecom_cart_${state.activeUserId}`, state.cart);
    },
    updateCartQuantityInternal: (state, action: PayloadAction<{ cartItemId: string; quantity: number }>) => {
      const { cartItemId, quantity } = action.payload;
      const existing = state.cart.find((item) => item.id === cartItemId);
      if (existing) {
        existing.quantity = quantity;
      }
      saveData(`ecom_cart_${state.activeUserId}`, state.cart);
    },
    clearCartInternal: (state) => {
      state.cart = [];
      saveData(`ecom_cart_${state.activeUserId}`, state.cart);
    },
    toggleWishlistInternal: (state, action: PayloadAction<string>) => {
      const productId = action.payload;
      if (state.wishlist.includes(productId)) {
        state.wishlist = state.wishlist.filter((id) => id !== productId);
      } else {
        state.wishlist.push(productId);
      }
      saveData(`ecom_wishlist_${state.activeUserId}`, state.wishlist);
    }
  },
  extraReducers: (builder) => {
    builder.addCase(loadUserCartAndWishlist.fulfilled, (state, action) => {
      if (action.payload) {
        const { activeUserId, cart, wishlist } = action.payload;
        state.activeUserId = activeUserId;
        state.cart = cart;
        state.wishlist = wishlist;
      }
    });
  }
});

// Export internal actions for thunk usage
export const {
  addToCartInternal,
  removeFromCartInternal,
  updateCartQuantityInternal,
  clearCartInternal,
  toggleWishlistInternal
} = cartSlice.actions;

export default cartSlice.reducer;

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import shopReducer from './shopSlice';
import cartReducer from './cartSlice';
import orderReducer from './orderSlice';
import uiReducer from './uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    shop: shopReducer,
    cart: cartReducer,
    order: orderReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

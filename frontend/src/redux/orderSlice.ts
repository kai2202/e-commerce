import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Order, Address } from '../types';
import { RootState } from './store';
import { clearCart } from './cartSlice';
import api from '../utils/api';

interface OrderState {
  orders: Order[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
}

const initialState: OrderState = {
  orders: [],
  status: 'idle',
};

export const fetchMyOrders = createAsyncThunk('order/fetchMyOrders', async () => {
  const response = await api.get('/orders/myorders');
  return response.data;
});

export const fetchAllOrders = createAsyncThunk('order/fetchAllOrders', async () => {
  const response = await api.get('/orders');
  return response.data;
});

export const checkout = createAsyncThunk(
  'order/checkout',
  async ({
    shippingAddress, paymentMethod, courier, appliedCouponCode, customerEmail
  }: {
    shippingAddress: Address, paymentMethod: Order['paymentMethod'], courier: string, appliedCouponCode?: string, customerEmail?: string
  }, { getState, dispatch }) => {
    
    const state = getState() as RootState;
    if (state.cart.cart.length === 0) {
      return { success: false, message: 'Giỏ hàng đang trống!' };
    }

    let subTotal = 0;
    const orderItems: any[] = [];

    // Construct items array
    for (const cartItem of state.cart.cart) {
      const product = state.shop.products.find((p) => p.id === cartItem.productId || (p as any)._id === cartItem.productId);
      if (!product) return { success: false, message: 'Có sản phẩm không tìm thấy' };

      const matchedVariant = product.variants.find(
        (v) => v.color.toLowerCase() === cartItem.color.toLowerCase() && v.size.toLowerCase() === cartItem.size.toLowerCase()
      );

      if (!matchedVariant || matchedVariant.stock < cartItem.quantity) {
        return {
          success: false,
          message: `Sản phẩm ${product.name} (${cartItem.color} - ${cartItem.size}) không đủ hàng trong kho!`,
        };
      }

      const activePrice = product.discountPrice !== undefined ? product.discountPrice : product.originalPrice;
      subTotal += activePrice * cartItem.quantity;

      orderItems.push({
        productId: product.id || (product as any)._id,
        name: product.name,
        image: product.image[0],
        selectedColor: cartItem.color,
        selectedSize: cartItem.size,
        price: activePrice,
        quantity: cartItem.quantity,
      });
    }

    const shippingFee = subTotal > 1000000 ? 0 : 35000;
    let discountAmount = 0;

    if (appliedCouponCode) {
      const cp = state.shop.coupons.find((c) => c.code.toUpperCase() === appliedCouponCode.toUpperCase() && c.active);
      if (cp) {
        const isExp = new Date(cp.expiryDate).getTime() < Date.now();
        if (!isExp && subTotal >= cp.minOrder) {
          if (cp.type === 'percent') {
            discountAmount = Math.round((subTotal * cp.value) / 100);
          } else {
            discountAmount = cp.value;
          }
        }
      }
    }

    const total = Math.max(0, subTotal + shippingFee - discountAmount);
    
    const orderPayload = {
      items: orderItems,
      totalAmount: subTotal,
      shippingFee,
      discount: discountAmount,
      finalAmount: total,
      paymentMethod,
      courier,
      customerEmail,
      shippingAddress: {
        name: shippingAddress.name,
        phone: shippingAddress.phone,
        address: `${shippingAddress.street}, ${shippingAddress.city}`,
        id: shippingAddress.id,
        label: shippingAddress.label,
        street: shippingAddress.street,
        city: shippingAddress.city
      }
    };

    try {
      const response = await api.post('/orders', orderPayload);
      const isOnlinePayment = response.data.paymentUrl !== undefined;
      const orderData = isOnlinePayment ? response.data.order : response.data;
      
      // Chỉ xoá giỏ hàng ngay lập tức cho các phương thức thanh toán không cần xác nhận online (COD, MOMO sim, CREDIT sim).
      // Với VNPAY, giỏ hàng chỉ được xoá sau khi thanh toán thành công trên cổng (xử lý tại return URL).
      if (!isOnlinePayment) {
        dispatch(clearCart());
      }
      dispatch(orderSlice.actions.addOrderLocally(orderData));
      
      return { 
        success: true, 
        orderId: orderData.id || orderData._id, 
        paymentUrl: response.data.paymentUrl, 
        message: 'Đặt hàng thành công!' 
      };

    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Có lỗi xảy ra khi đặt hàng' };
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  'order/updateOrderStatus',
  async ({ orderId, status }: { orderId: string; status: Order['status'] }, { dispatch }) => {
    try {
      const response = await api.put(`/orders/${orderId}/status`, { status });
      dispatch(orderSlice.actions.updateOrderStatusLocally({ orderId, status: response.data.status }));
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  }
);

export const cancelOrder = createAsyncThunk(
  'order/cancelOrder',
  async (
    payload: string | { orderId: string; email?: string; phone?: string },
    { rejectWithValue }
  ) => {
    try {
      const orderId = typeof payload === 'string' ? payload : payload.orderId;
      const data = typeof payload === 'string' ? {} : { email: payload.email, phone: payload.phone };
      
      const response = await api.put(`/orders/${orderId}/cancel`, data);
      return response.data;
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Không thể hủy đơn hàng';
      alert(`Lỗi: ${errorMsg}`);
      return rejectWithValue(errorMsg);
    }
  }
);

export const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    addOrderLocally: (state, action: PayloadAction<Order>) => {
      state.orders.unshift(action.payload);
    },
    updateOrderStatusLocally: (state, action: PayloadAction<{ orderId: string; status: Order['status'] }>) => {
      const { orderId, status } = action.payload;
      const order = state.orders.find((o) => o.id === orderId || (o as any)._id === orderId);
      if (order) {
        order.status = status;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.orders = action.payload;
      })
      .addCase(fetchAllOrders.fulfilled, (state, action) => {
        state.orders = action.payload;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        const updatedOrder = action.payload;
        const id = updatedOrder.id || updatedOrder._id;
        const order = state.orders.find((o) => o.id === id || (o as any)._id === id);
        if (order) {
          order.status = 'cancelled';
          if (updatedOrder.history) {
            (order as any).history = updatedOrder.history;
          }
        }
      });
  }
});

export const { addOrderLocally, updateOrderStatusLocally } = orderSlice.actions;
export default orderSlice.reducer;

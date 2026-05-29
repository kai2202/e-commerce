import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { User, Address } from '../types';
import api from '../utils/api';

interface AuthState {
  currentUser: User | null;
  token: string | null;
  users: User[];
}

const loadUser = (): User | null => {
  const saved = localStorage.getItem('ecom_curr_user');
  return saved ? JSON.parse(saved) : null;
};

const loadToken = (): string | null => {
  return localStorage.getItem('ecom_token') || null;
};

const initialState: AuthState = {
  currentUser: loadUser(),
  token: loadToken(),
  users: [],
};

const saveAuth = (user: User | null, token: string | null) => {
  if (user) localStorage.setItem('ecom_curr_user', JSON.stringify(user));
  else localStorage.removeItem('ecom_curr_user');
  
  if (token) localStorage.setItem('ecom_token', token);
  else localStorage.removeItem('ecom_token');
};

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: any, { dispatch }) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, ...userData } = response.data;
      dispatch(authSlice.actions.setCredentials({ user: userData, token }));
      return { success: true, message: 'Đăng nhập thành công!', role: userData.role };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Lỗi kết nối đến máy chủ!' 
      };
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async ({ email, password, name, phone }: any, { dispatch }) => {
    try {
      const response = await api.post('/auth/register', { email, password, name, phone });
      const { token, ...userData } = response.data;
      dispatch(authSlice.actions.setCredentials({ user: userData, token }));
      return { success: true, message: 'Đăng ký tài khoản thành công!' };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Lỗi kết nối đến máy chủ!' 
      };
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { dispatch }) => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error', error);
    }
    dispatch(authSlice.actions.clearCredentials());
  }
);

export const restoreSession = createAsyncThunk(
  'auth/restoreSession',
  async (_, { dispatch }) => {
    // Only restore session if there's a token/user stored in localStorage (prevents unnecessary 401 errors for guests)
    const hasToken = localStorage.getItem('ecom_token');
    const hasUser = localStorage.getItem('ecom_curr_user');

    if (!hasToken && !hasUser) {
      dispatch(authSlice.actions.clearCredentials());
      return;
    }

    try {
      const response = await api.post('/auth/refresh');
      const { token, ...userData } = response.data;
      dispatch(authSlice.actions.setCredentials({ user: userData, token }));
    } catch (error) {
      // Clear credentials if token has expired or session is invalid on the server
      dispatch(authSlice.actions.clearCredentials());
    }
  }
);

export const fetchUsers = createAsyncThunk(
  'auth/fetchUsers',
  async (_, { dispatch }) => {
    try {
      const response = await api.get('/auth/users');
      dispatch(authSlice.actions.setUsers(response.data));
    } catch (error) {
      console.error('Error fetching users', error);
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'auth/updateUserProfile',
  async (profileData: { name: string; phone: string; avatar: string; password?: string }, { dispatch }) => {
    try {
      const response = await api.put('/users/profile', profileData);
      dispatch(authSlice.actions.setProfile(response.data));
      return { success: true, message: 'Cập nhật hồ sơ thành công!' };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Lỗi cập nhật hồ sơ!'
      };
    }
  }
);

export const saveAddress = createAsyncThunk(
  'auth/saveAddress',
  async (addressData: Omit<Address, 'id'>, { dispatch }) => {
    try {
      const response = await api.post('/users/address', addressData);
      dispatch(authSlice.actions.setAddresses(response.data));
      return { success: true, message: 'Lưu địa chỉ thành công!' };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Lỗi lưu địa chỉ!'
      };
    }
  }
);

export const updateAddress = createAsyncThunk(
  'auth/updateAddress',
  async ({ id, address }: { id: string; address: Omit<Address, 'id'> }, { dispatch }) => {
    try {
      const response = await api.put(`/users/address/${id}`, address);
      dispatch(authSlice.actions.setAddresses(response.data));
      return { success: true, message: 'Cập nhật địa chỉ thành công!' };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Lỗi cập nhật địa chỉ!'
      };
    }
  }
);

export const deleteAddress = createAsyncThunk(
  'auth/deleteAddress',
  async (id: string, { dispatch }) => {
    try {
      const response = await api.delete(`/users/address/${id}`);
      dispatch(authSlice.actions.setAddresses(response.data));
      return { success: true, message: 'Xóa địa chỉ thành công!' };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Lỗi xóa địa chỉ!'
      };
    }
  }
);

export const googleRegisterAction = createAsyncThunk(
  'auth/googleRegister',
  async ({ token }: { token: string }, { dispatch }) => {
    try {
      const response = await api.post('/auth/google-register', { token });
      const data = response.data;
      if (data.success && data.exists && !data.isProfileIncomplete) {
        const { token: officialToken, user } = data;
        dispatch(authSlice.actions.setCredentials({ user, token: officialToken }));
      }
      return { success: true, data };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Đăng ký bằng Google thất bại!'
      };
    }
  }
);

export const completePhoneAction = createAsyncThunk(
  'auth/completePhone',
  async ({ phone, password, tempToken }: { phone: string; password: string; tempToken: string }, { dispatch }) => {
    try {
      const response = await api.put('/auth/update-phone', { phone, password }, {
        headers: {
          Authorization: `Bearer ${tempToken}`
        }
      });
      const { token, user } = response.data;
      dispatch(authSlice.actions.setCredentials({ user, token }));
      return { success: true, message: 'Đăng ký tài khoản thành công!' };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Cập nhật số điện thoại thất bại!'
      };
    }
  }
);

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.currentUser = action.payload.user;
      state.token = action.payload.token;
      saveAuth(state.currentUser, state.token);
    },
    clearCredentials: (state) => {
      state.currentUser = null;
      state.token = null;
      saveAuth(null, null);
    },
    refreshAccessToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      saveAuth(state.currentUser, state.token);
    },
    setUsers: (state, action: PayloadAction<User[]>) => {
      state.users = action.payload;
    },
    setProfile: (state, action: PayloadAction<User>) => {
      if (!state.currentUser) return;
      state.currentUser = {
        ...state.currentUser,
        ...action.payload
      };
      saveAuth(state.currentUser, state.token);
    },
    setAddresses: (state, action: PayloadAction<Address[]>) => {
      if (!state.currentUser) return;
      state.currentUser.addresses = action.payload;
      saveAuth(state.currentUser, state.token);
    },
    // The following reducers should eventually be moved to backend API calls as well,
    // but we keep them here temporarily to not break the UI if it relies on synchronous updates.
    updateProfile: (state, action: PayloadAction<{ name: string; phone: string; avatar: string }>) => {
      if (!state.currentUser) return;
      const { name, phone, avatar } = action.payload;
      state.currentUser = { ...state.currentUser, name, phone, avatar };
      saveAuth(state.currentUser, state.token);
    },
    addAddress: (state, action: PayloadAction<Omit<Address, 'id'>>) => {
      if (!state.currentUser) return;
      const newAddr: Address = {
        ...action.payload,
        id: `addr-${Date.now()}`,
      };
      state.currentUser.addresses.push(newAddr);
      saveAuth(state.currentUser, state.token);
    },
    editAddress: (state, action: PayloadAction<{ id: string; address: Omit<Address, 'id'> }>) => {
      if (!state.currentUser) return;
      const { id, address } = action.payload;
      const index = state.currentUser.addresses.findIndex((addr) => addr.id === id);
      if (index !== -1) {
        state.currentUser.addresses[index] = { ...address, id };
        saveAuth(state.currentUser, state.token);
      }
    },
    deleteAddress: (state, action: PayloadAction<string>) => {
      if (!state.currentUser) return;
      state.currentUser.addresses = state.currentUser.addresses.filter((addr) => addr.id !== action.payload);
      saveAuth(state.currentUser, state.token);
    },
    setDefaultAddress: (state, action: PayloadAction<string>) => {
      if (!state.currentUser) return;
      state.currentUser.addresses.forEach((addr) => {
        addr.isDefault = addr.id === action.payload;
      });
      saveAuth(state.currentUser, state.token);
    },
    toggleUserActive: (state, action: PayloadAction<string>) => {
      const u = state.users.find((x) => x.id === action.payload);
      if (u && u.role !== 'admin') {
        u.active = !u.active;
      }
    },
    addUserByAdmin: (state, action: PayloadAction<Omit<User, 'id' | 'active' | 'joinedDate' | 'addresses'>>) => {
      const newUser: User = {
        ...action.payload,
        id: `usr-${Date.now()}`,
        active: true,
        joinedDate: new Date().toISOString().split('T')[0],
        addresses: [],
      };
      state.users.push(newUser);
    },
  },
});

export const { 
  setCredentials, 
  clearCredentials, 
  refreshAccessToken,
  setUsers, 
  setProfile,
  setAddresses,
  updateProfile, 
  addAddress, 
  editAddress, 
  setDefaultAddress, 
  toggleUserActive,
  addUserByAdmin
} = authSlice.actions;

export default authSlice.reducer;

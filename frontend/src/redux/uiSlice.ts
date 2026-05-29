import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  activeView: 'client' | 'admin';
  isAuthOpen: boolean;
  isCartOpen: boolean;
  isWishlistOpen: boolean;
  searchKeyword: string;
  selectedCategoryId: string | null;
  isAddedToBagOpen: boolean;
  addedToBagItem: {
    productId: string;
    name: string;
    image: string;
    brand: string;
    color: string;
    size: string;
    price: number;
    quantity: number;
  } | null;
  isAddedToFavoritesOpen: boolean;
  addedToFavoritesItem: {
    productId: string;
    name: string;
    image: string;
    brand: string;
    color?: string;
    size?: string;
    price: number;
  } | null;
}

const initialState: UiState = {
  activeView: 'client',
  isAuthOpen: false,
  isCartOpen: false,
  isWishlistOpen: false,
  searchKeyword: '',
  selectedCategoryId: null,
  isAddedToBagOpen: false,
  addedToBagItem: null,
  isAddedToFavoritesOpen: false,
  addedToFavoritesItem: null,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveView: (state, action: PayloadAction<'client' | 'admin'>) => {
      state.activeView = action.payload;
    },
    setAuthModalOpen: (state, action: PayloadAction<boolean>) => {
      state.isAuthOpen = action.payload;
    },
    setCartDrawerOpen: (state, action: PayloadAction<boolean>) => {
      state.isCartOpen = action.payload;
    },
    setWishlistDrawerOpen: (state, action: PayloadAction<boolean>) => {
      state.isWishlistOpen = action.payload;
    },
    setSearchKeyword: (state, action: PayloadAction<string>) => {
      state.searchKeyword = action.payload;
    },
    setSelectedCategoryId: (state, action: PayloadAction<string | null>) => {
      state.selectedCategoryId = action.payload;
    },
    setAddedToBagOpen: (state, action: PayloadAction<boolean>) => {
      state.isAddedToBagOpen = action.payload;
    },
    setAddedToBagItem: (state, action: PayloadAction<UiState['addedToBagItem']>) => {
      state.addedToBagItem = action.payload;
    },
    setAddedToFavoritesOpen: (state, action: PayloadAction<boolean>) => {
      state.isAddedToFavoritesOpen = action.payload;
    },
    setAddedToFavoritesItem: (state, action: PayloadAction<UiState['addedToFavoritesItem']>) => {
      state.addedToFavoritesItem = action.payload;
    },
  },
});

export const {
  setActiveView,
  setAuthModalOpen,
  setCartDrawerOpen,
  setWishlistDrawerOpen,
  setSearchKeyword,
  setSelectedCategoryId,
  setAddedToBagOpen,
  setAddedToBagItem,
  setAddedToFavoritesOpen,
  setAddedToFavoritesItem,
} = uiSlice.actions;
export default uiSlice.reducer;

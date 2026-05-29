import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Product, Category, Coupon, Banner, Review } from '../types';
import api from '../utils/api';

interface ShopState {
  products: Product[];
  categories: Category[];
  coupons: Coupon[];
  banners: Banner[];
  reviews: Review[];
  filters: {
    brands: string[];
    colors: string[];
    sizes: string[];
  };
  pagination?: {
    page: number;
    pages: number;
    totalProducts: number;
    limit: number;
  };
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
}

const initialState: ShopState = {
  products: [],
  categories: [],
  coupons: [],
  banners: [],
  reviews: [], // keep empty or mock if backend doesn't support reviews yet
  filters: {
    brands: [],
    colors: [],
    sizes: [],
  },
  pagination: undefined,
  status: 'idle',
};

// --- THUNKS ---
export const fetchProducts = createAsyncThunk<any, Record<string, any> | void>('shop/fetchProducts', async (params) => {
  const response = await api.get('/products', { params: params || undefined });
  return response.data;
});

export const fetchProductById = createAsyncThunk<any, string>(
  'shop/fetchProductById',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/products/${productId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi tải chi tiết sản phẩm');
    }
  }
);

export const fetchProductReviews = createAsyncThunk(
  'shop/fetchProductReviews',
  async (productId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/products/${productId}/reviews`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi tải đánh giá');
    }
  }
);

export const submitProductReview = createAsyncThunk(
  'shop/submitProductReview',
  async ({ productId, rating, comment }: { productId: string; rating: number; comment: string }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/products/${productId}/reviews`, { rating, comment });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi gửi đánh giá');
    }
  }
);

export const fetchProductFilters = createAsyncThunk('shop/fetchProductFilters', async () => {
  const response = await api.get('/products/filters');
  return response.data;
});

export const fetchCategories = createAsyncThunk('shop/fetchCategories', async () => {
  const response = await api.get('/categories');
  return response.data;
});

export const fetchCoupons = createAsyncThunk('shop/fetchCoupons', async () => {
  const response = await api.get('/promos/coupons');
  return response.data;
});

export const fetchBanners = createAsyncThunk('shop/fetchBanners', async () => {
  const response = await api.get('/promos/banners');
  return response.data;
});

// --- PRODUCT CRUD THUNKS (sync with MongoDB) ---
export const createProductAsync = createAsyncThunk(
  'shop/createProduct',
  async (payload: any, { rejectWithValue }) => {
    try {
      const response = await api.post('/products', payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi lưu sản phẩm');
    }
  }
);

export const updateProductAsync = createAsyncThunk(
  'shop/updateProduct',
  async ({ id, payload }: { id: string; payload: any }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/products/${id}`, payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi cập nhật sản phẩm');
    }
  }
);

export const deleteProductAsync = createAsyncThunk(
  'shop/deleteProduct',
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/products/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi xóa sản phẩm');
    }
  }
);

// --- CATEGORY CRUD THUNKS (sync with MongoDB) ---
export const createCategoryAsync = createAsyncThunk(
  'shop/createCategory',
  async (payload: any, { rejectWithValue }) => {
    try {
      const response = await api.post('/categories', payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi tạo danh mục');
    }
  }
);

export const updateCategoryAsync = createAsyncThunk(
  'shop/updateCategory',
  async ({ id, payload }: { id: string; payload: any }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/categories/${id}`, payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi cập nhật danh mục');
    }
  }
);

export const deleteCategoryAsync = createAsyncThunk(
  'shop/deleteCategory',
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/categories/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi xóa danh mục');
    }
  }
);

// --- BANNER CRUD THUNKS (sync with MongoDB) ---
export const createBannerAsync = createAsyncThunk(
  'shop/createBanner',
  async (payload: any, { rejectWithValue }) => {
    try {
      const response = await api.post('/promos/banners', payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi tạo banner');
    }
  }
);

export const updateBannerAsync = createAsyncThunk(
  'shop/updateBanner',
  async ({ id, payload }: { id: string; payload: any }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/promos/banners/${id}`, payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi cập nhật banner');
    }
  }
);

export const deleteBannerAsync = createAsyncThunk(
  'shop/deleteBanner',
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/promos/banners/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi xóa banner');
    }
  }
);

// --- COUPON CRUD THUNKS (sync with MongoDB) ---
export const createCouponAsync = createAsyncThunk(
  'shop/createCoupon',
  async (payload: any, { rejectWithValue }) => {
    try {
      const response = await api.post('/promos/coupons', payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi tạo mã giảm giá');
    }
  }
);

export const updateCouponAsync = createAsyncThunk(
  'shop/updateCoupon',
  async ({ id, payload }: { id: string; payload: any }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/promos/coupons/${id}`, payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi cập nhật mã giảm giá');
    }
  }
);

export const deleteCouponAsync = createAsyncThunk(
  'shop/deleteCoupon',
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/promos/coupons/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi xóa mã giảm giá');
    }
  }
);

export const shopSlice = createSlice({
  name: 'shop',
  initialState,
  reducers: {
    addProduct: (state, action: PayloadAction<Product>) => {
      state.products.unshift(action.payload);
    },
    editProduct: (state, action: PayloadAction<{ id: string; updatedProduct: Partial<Product> }>) => {
      const { id, updatedProduct } = action.payload;
      state.products = state.products.map((p) => (p.id === id || (p as any)._id === id ? { ...p, ...updatedProduct } : p));
    },
    deleteProduct: (state, action: PayloadAction<string>) => {
      state.products = state.products.filter((p) => p.id !== action.payload && (p as any)._id !== action.payload);
    },
    updateVariantStock: (state, action: PayloadAction<{ productId: string; variantId: string; newStock: number }>) => {
      const { productId, variantId, newStock } = action.payload;
      state.products = state.products.map((p) => {
        if (p.id !== productId && (p as any)._id !== productId) return p;
        return {
          ...p,
          variants: p.variants.map((v) => (v.id === variantId || (v as any)._id === variantId ? { ...v, stock: Math.max(0, newStock) } : v)),
        };
      });
    },
    addCategory: (state, action: PayloadAction<Category>) => {
      state.categories.push(action.payload);
    },
    editCategory: (state, action: PayloadAction<{ id: string; updatedCategory: Partial<Category> }>) => {
      const { id, updatedCategory } = action.payload;
      state.categories = state.categories.map((c) => (c.id === id || (c as any)._id === id ? { ...c, ...updatedCategory } : c));
    },
    deleteCategory: (state, action: PayloadAction<string>) => {
      state.categories = state.categories.filter((c) => c.id !== action.payload && (c as any)._id !== action.payload);
    },
    addCoupon: (state, action: PayloadAction<Coupon>) => {
      state.coupons.push(action.payload);
    },
    editCoupon: (state, action: PayloadAction<{ id: string; updatedCoupon: Partial<Coupon> }>) => {
      const { id, updatedCoupon } = action.payload;
      state.coupons = state.coupons.map((c) => (c.id === id || (c as any)._id === id ? { ...c, ...updatedCoupon } : c));
    },
    deleteCoupon: (state, action: PayloadAction<string>) => {
      state.coupons = state.coupons.filter((c) => c.id !== action.payload && (c as any)._id !== action.payload);
    },
    addBanner: (state, action: PayloadAction<Banner>) => {
      state.banners.push(action.payload);
    },
    editBanner: (state, action: PayloadAction<{ id: string; updatedBanner: Partial<Banner> }>) => {
      const { id, updatedBanner } = action.payload;
      state.banners = state.banners.map((b) => (b.id === id || (b as any)._id === id ? { ...b, ...updatedBanner } : b));
    },
    deleteBanner: (state, action: PayloadAction<string>) => {
      state.banners = state.banners.filter((b) => b.id !== action.payload && (b as any)._id !== action.payload);
    },
    submitReview: (state, action: PayloadAction<Review>) => {
      state.reviews.push(action.payload);
    },
    incrementCouponUsage: (state, action: PayloadAction<string>) => {
      const c = state.coupons.find((x) => x.code === action.payload);
      if (c) {
        c.usageCount = (c.usageCount || 0) + 1;
      }
    },
    decrementProductStock: (state, action: PayloadAction<{ productId: string; variantId: string; quantity: number }>) => {
      const { productId, variantId, quantity } = action.payload;
      const product = state.products.find((p) => p.id === productId || (p as any)._id === productId);
      if (product) {
        const variant = product.variants.find((v) => v.id === variantId || (v as any)._id === variantId);
        if (variant) {
          variant.stock = Math.max(0, variant.stock - quantity);
        }
      }
    },
    incrementProductStock: (state, action: PayloadAction<{ productId: string; variantId: string; quantity: number }>) => {
      const { productId, variantId, quantity } = action.payload;
      const product = state.products.find((p) => p.id === productId || (p as any)._id === productId);
      if (product) {
        const variant = product.variants.find((v) => v.id === variantId || (v as any)._id === variantId);
        if (variant) {
          variant.stock += quantity;
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const isQueryByIds = action.meta.arg && (action.meta.arg as any).ids;
        
        if (action.payload && Array.isArray(action.payload)) {
          const fetched = action.payload.map((item: any) => ({ ...item, id: item._id || item.id }));
          if (isQueryByIds) {
            fetched.forEach((item: any) => {
              const index = state.products.findIndex((p) => p.id === item.id);
              if (index !== -1) {
                state.products[index] = item;
              } else {
                state.products.push(item);
              }
            });
          } else {
            state.products = fetched;
            state.pagination = undefined;
          }
        } else if (action.payload && Array.isArray(action.payload.products)) {
          const fetched = action.payload.products.map((item: any) => ({ ...item, id: item._id || item.id }));
          if (isQueryByIds) {
            fetched.forEach((item: any) => {
              const index = state.products.findIndex((p) => p.id === item.id);
              if (index !== -1) {
                state.products[index] = item;
              } else {
                state.products.push(item);
              }
            });
          } else {
            state.products = fetched;
            state.pagination = {
              page: action.payload.page,
              pages: action.payload.pages,
              totalProducts: action.payload.totalProducts,
              limit: action.payload.limit
            };
          }
        }
      })
      .addCase(fetchProducts.rejected, (state) => {
        state.status = 'failed';
      })
      .addCase(fetchProductById.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const product = action.payload;
        if (product) {
          const enrichedProduct = { ...product, id: product._id || product.id };
          const index = state.products.findIndex((p) => p.id === enrichedProduct.id);
          if (index !== -1) {
            state.products[index] = enrichedProduct;
          } else {
            state.products.push(enrichedProduct);
          }
        }
      })
      .addCase(fetchProductById.rejected, (state) => {
        state.status = 'failed';
      })
      .addCase(fetchProductFilters.fulfilled, (state, action) => {
        state.filters = action.payload;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload.map((item: any) => ({ ...item, id: item._id || item.id }));
      })
      .addCase(fetchCoupons.fulfilled, (state, action) => {
        state.coupons = action.payload.map((item: any) => ({ ...item, id: item._id || item.id }));
      })
      .addCase(fetchBanners.fulfilled, (state, action) => {
        state.banners = action.payload.map((item: any) => ({ ...item, id: item._id || item.id }));
      })
      .addCase(fetchProductReviews.fulfilled, (state, action) => {
        state.reviews = action.payload.map((item: any) => ({ ...item, id: item._id || item.id }));
      })
      .addCase(submitProductReview.fulfilled, (state, action) => {
        const newReview = action.payload;
        const reviewWithId = { ...newReview, id: newReview._id || newReview.id };
        state.reviews.unshift(reviewWithId);

        // Recompute product rating and count in store
        const prodId = newReview.productId;
        const matchedProduct = state.products.find((p) => p.id === prodId || (p as any)._id === prodId);
        if (matchedProduct) {
          const productReviews = state.reviews.filter((r) => r.productId === prodId);
          const ratingSum = productReviews.reduce((sum, r) => sum + r.rating, 0);
          const ratingCount = productReviews.length;
          matchedProduct.rating = ratingCount > 0 ? Number((ratingSum / ratingCount).toFixed(1)) : 0;
          matchedProduct.reviewCount = ratingCount;
        }
      })
      // Product CRUD from MongoDB
      .addCase(createProductAsync.fulfilled, (state, action) => {
        const item = action.payload;
        state.products.unshift({ ...item, id: item._id || item.id });
      })
      .addCase(updateProductAsync.fulfilled, (state, action) => {
        const item = action.payload;
        const id = item._id || item.id;
        state.products = state.products.map((p) =>
          (p.id === id || (p as any)._id === id) ? { ...p, ...item, id } : p
        );
      })
      .addCase(deleteProductAsync.fulfilled, (state, action) => {
        const id = action.payload;
        state.products = state.products.filter((p) => p.id !== id && (p as any)._id !== id);
      })
      // Category CRUD from MongoDB
      .addCase(createCategoryAsync.fulfilled, (state, action) => {
        const item = action.payload;
        state.categories.push({ ...item, id: item._id || item.id });
      })
      .addCase(updateCategoryAsync.fulfilled, (state, action) => {
        const item = action.payload;
        const id = item._id || item.id;
        state.categories = state.categories.map((c) =>
          (c.id === id || (c as any)._id === id) ? { ...c, ...item, id } : c
        );
      })
      .addCase(deleteCategoryAsync.fulfilled, (state, action) => {
        const id = action.payload;
        state.categories = state.categories.filter((c) => c.id !== id && (c as any)._id !== id);
      })
      // Banner CRUD from MongoDB
      .addCase(createBannerAsync.fulfilled, (state, action) => {
        const item = action.payload;
        state.banners.push({ ...item, id: item._id || item.id });
      })
      .addCase(updateBannerAsync.fulfilled, (state, action) => {
        const item = action.payload;
        const id = item._id || item.id;
        state.banners = state.banners.map((b) =>
          (b.id === id || (b as any)._id === id) ? { ...b, ...item, id } : b
        );
      })
      .addCase(deleteBannerAsync.fulfilled, (state, action) => {
        const id = action.payload;
        state.banners = state.banners.filter((b) => b.id !== id && (b as any)._id !== id);
      })
      // Coupon CRUD from MongoDB
      .addCase(createCouponAsync.fulfilled, (state, action) => {
        const item = action.payload;
        state.coupons.push({ ...item, id: item._id || item.id });
      })
      .addCase(updateCouponAsync.fulfilled, (state, action) => {
        const item = action.payload;
        const id = item._id || item.id;
        state.coupons = state.coupons.map((c) =>
          (c.id === id || (c as any)._id === id) ? { ...c, ...item, id } : c
        );
      })
      .addCase(deleteCouponAsync.fulfilled, (state, action) => {
        const id = action.payload;
        state.coupons = state.coupons.filter((c) => c.id !== id && (c as any)._id !== id);
      });
  }
});

export const {
  addProduct,
  editProduct,
  deleteProduct,
  updateVariantStock,
  addCategory,
  editCategory,
  deleteCategory,
  addCoupon,
  editCoupon,
  deleteCoupon,
  addBanner,
  editBanner,
  deleteBanner,
  submitReview,
  incrementCouponUsage,
  decrementProductStock,
  incrementProductStock
} = shopSlice.actions;

export default shopSlice.reducer;

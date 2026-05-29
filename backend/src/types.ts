export interface Address {
  id: string;
  name: string;
  phone: string;
  label: string; // e.g. "Nhà riêng", "Văn phòng"
  street: string;
  city: string;
}

export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
  phone: string;
  avatar: string;
  role: 'admin' | 'staff_inventory' | 'customer';
  active: boolean;
  joinedDate: string;
  addresses: Address[];
}

export type VariantStock = {
  id: string;
  color: string;
  size: string;
  stock: number;
};

export interface Product {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  brand: string;
  originalPrice: number;
  discountPrice?: number;
  image: string[];
  colors: string[];
  sizes: string[];
  variants: VariantStock[]; // Detailed tracking for colors & sizes
  specs: { label: string; value: string }[];
  rating: number;
  reviewCount: number;
  salesCount: number;
  dateAdded: string;
  featured: boolean;
  promo: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  parentId?: string; // Support parent & child categories
}

export interface CartItem {
  id: string; // combination of productId_color_size
  productId: string;
  color: string;
  size: string;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  image: string;
  selectedColor: string;
  selectedSize: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  subTotal: number;
  shippingFee: number;
  discountAmount: number;
  couponCode?: string;
  total: number;
  paymentMethod: 'COD' | 'VNPAY' | 'MOMO' | 'CREDIT';
  shippingAddress: Address;
  courier: string;
  status: 'pending' | 'shipping' | 'completed' | 'cancelled';
  date: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number; // percentage (e.g. 10 for 10%) or fixed vnd (e.g. 50000)
  minOrder: number;
  expiryDate: string;
  active: boolean;
  usageLimit: number;
  usageCount: number;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  link: string;
  active: boolean;
}

export interface Review {
  id: string;
  orderId: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  images: string[];
  date: string;
}

/**
 * =============================================================================
 * SEED SCRIPT — E-Commerce Database
 * =============================================================================
 *
 * Seeds the MongoDB database with initial demo data IF each collection is empty.
 * Passwords are automatically hashed via the User model's pre-save middleware.
 *
 * Usage:
 *   npx ts-node src/scripts/seed.ts               → Seed only empty collections
 *   npx ts-node src/scripts/seed.ts --force        → Drop all data and re-seed
 *   npx ts-node src/scripts/seed.ts --only users   → Seed only specified collection
 *
 * Collections seeded:
 *   ✅ categories  — 4 product categories
 *   ✅ products    — 6 sample products (reference categoryId from DB)
 *   ✅ users       — admin, staff_inventory, customer (passwords bcrypt-hashed)
 *   ✅ coupons     — 2 active coupons
 *   ✅ banners     — 2 hero banners
 *   ❌ orders      — Not seeded (should come from real user activity)
 *   ❌ reviews     — Not seeded (should come from real user activity)
 * =============================================================================
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

// Import models (password auto-hashing is handled by User pre-save middleware)
import Category from '../models/Category';
import Product from '../models/Product';
import User from '../models/User';
import Coupon from '../models/Coupon';
import Banner from '../models/Banner';

const FORCE = process.argv.includes('--force');
const ONLY = (() => {
  const idx = process.argv.indexOf('--only');
  return idx !== -1 ? process.argv[idx + 1] : null;
})();

// ─── Color helpers for console output ─────────────────────────────────────────
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;

// =============================================================================
// SEED DATA
// =============================================================================

const CATEGORIES_DATA = [
  {
    name: 'Thiết Bị Điện Tử',
    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500&auto=format&fit=crop&q=80',
  },
  {
    name: 'Thời Trang Nam Nữ',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&auto=format&fit=crop&q=80',
  },
  {
    name: 'Phụ Kiện Cao Cấp',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80',
  },
  {
    name: 'Mỹ Phẩm & Chăm Sóc',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&auto=format&fit=crop&q=80',
  },
];

// Products are defined as a factory function because they need real Category ObjectIds
const buildProducts = (categoryIdMap: Record<string, string>) => [
  {
    name: 'iPhone 15 Pro Max 256GB',
    description:
      'iPhone 15 Pro Max nổi bật sở hữu khung viền titan mỏng nhẹ lý tưởng, nút tác vụ Action tiện lợi cùng con chip A17 Pro tối tân cho hiệu năng cực đỉnh. Camera zoom quang học 5X ấn tượng cùng thời lượng pin sử dụng đáng kinh ngạc lên đến 29 giờ.',
    categoryId: categoryIdMap['Thiết Bị Điện Tử'],
    brand: 'Apple',
    originalPrice: 34990000,
    discountPrice: 29990000,
    image: [
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&auto=format&fit=crop&q=80',
    ],
    colors: ['Titan tự nhiên', 'Xanh đen', 'Trắng tinh khôi'],
    sizes: ['256GB', '512GB'],
    variants: [
      { id: 'v1', color: 'Titan tự nhiên', size: '256GB', stock: 15 },
      { id: 'v2', color: 'Titan tự nhiên', size: '512GB', stock: 5 },
      { id: 'v3', color: 'Xanh đen', size: '256GB', stock: 12 },
      { id: 'v4', color: 'Xanh đen', size: '512GB', stock: 3 },
      { id: 'v5', color: 'Trắng tinh khôi', size: '256GB', stock: 0 },
    ],
    specs: [
      { key: 'Màn hình', value: 'Super Retina XDR OLED, 6.7 inches' },
      { key: 'Vi xử lý', value: 'Apple A17 Pro 3nm' },
      { key: 'Camera sau', value: 'Chính 48MP, Phụ 12MP & 12MP' },
      { key: 'Hệ điều hành', value: 'iOS 17' },
      { key: 'Trọng lượng', value: '221g' },
    ],
    rating: 4.8,
    reviewCount: 0,
    salesCount: 45,
    dateAdded: new Date('2026-05-10'),
    featured: true,
    promo: true,
  },
  {
    name: 'Tai Nghe Không Dây Bose QuietComfort Ultra',
    description:
      'Bose QuietComfort Ultra mang lại trải nghiệm âm thanh không gian đột phá cùng công nghệ khử tiếng ồn CustomTune đỉnh cao. Thiết kế sang trọng với chất liệu đệm tai siêu êm ái, hỗ trợ chế độ Nhận biết thế giới xung quanh (Aware Mode) linh hoạt.',
    categoryId: categoryIdMap['Thiết Bị Điện Tử'],
    brand: 'Bose',
    originalPrice: 10990000,
    discountPrice: 8990000,
    image: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80',
    ],
    colors: ['Đen nhám', 'Trắng cát vàng'],
    sizes: ['Tiêu chuẩn'],
    variants: [
      { id: 'v6', color: 'Đen nhám', size: 'Tiêu chuẩn', stock: 25 },
      { id: 'v7', color: 'Trắng cát vàng', size: 'Tiêu chuẩn', stock: 10 },
    ],
    specs: [
      { key: 'Kết nối', value: 'Bluetooth 5.3 aptX Adaptive' },
      { key: 'Thời lượng pin', value: 'Lên tới 24 giờ liên tục' },
      { key: 'Kháng nước', value: 'IPX4' },
      { key: 'Hỗ trợ sạc nhanh', value: 'Sạc 15 phút nghe 2.5 giờ' },
    ],
    rating: 4.7,
    reviewCount: 0,
    salesCount: 22,
    dateAdded: new Date('2026-04-15'),
    featured: true,
    promo: true,
  },
  {
    name: 'Áo Khoác Bomber Da Lộn Classic',
    description:
      'Chất liệu da lộn mềm mịn lót lụa cao cấp mang tới sự ấm áp và thời thượng. Thiết kế cổ điển với khóa kéo kim loại không rỉ sét, hoàn hảo cho cả nam và nữ trong mọi phong cách hàng ngày.',
    categoryId: categoryIdMap['Thời Trang Nam Nữ'],
    brand: 'UrbanStyle',
    originalPrice: 1200000,
    discountPrice: 850000,
    image: [
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&auto=format&fit=crop&q=80',
    ],
    colors: ['Nâu bò', 'Xám đen'],
    sizes: ['M', 'L', 'XL'],
    variants: [
      { id: 'v8', color: 'Nâu bò', size: 'M', stock: 20 },
      { id: 'v9', color: 'Nâu bò', size: 'L', stock: 35 },
      { id: 'v10', color: 'Nâu bò', size: 'XL', stock: 15 },
      { id: 'v11', color: 'Xám đen', size: 'M', stock: 10 },
      { id: 'v12', color: 'Xám đen', size: 'L', stock: 8 },
      { id: 'v13', color: 'Xám đen', size: 'XL', stock: 2 },
    ],
    specs: [
      { key: 'Chất liệu', value: '100% Da Lộn Phối Lụa Quai Chun' },
      { key: 'Xuất xứ', value: 'Việt Nam xuất khẩu' },
      { key: 'Hướng dẫn giặt', value: 'Giặt hấp khô chuyên dụng' },
    ],
    rating: 4.5,
    reviewCount: 0,
    salesCount: 50,
    dateAdded: new Date('2026-05-01'),
    featured: false,
    promo: true,
  },
  {
    name: 'Giày Thể Thao Sneaker Active Pro 2.0',
    description:
      'Đế giày bọt khí siêu nhẹ đàn hồi cực tốt, bọc vải dệt Knit cao cấp siêu thoáng khí, bảo vệ cổ chân bằng gót đệm đa lớp êm ái. Rất thích hợp cho chạy bộ dã ngoại hay đi bộ công sở.',
    categoryId: categoryIdMap['Thời Trang Nam Nữ'],
    brand: 'AeroStride',
    originalPrice: 2150000,
    discountPrice: 1590000,
    image: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=80',
    ],
    colors: ['Đỏ lửa', 'Xám xi măng'],
    sizes: ['39', '40', '41', '42'],
    variants: [
      { id: 'v14', color: 'Đỏ lửa', size: '40', stock: 8 },
      { id: 'v15', color: 'Đỏ lửa', size: '41', stock: 12 },
      { id: 'v16', color: 'Đỏ lửa', size: '42', stock: 4 },
      { id: 'v17', color: 'Xám xi măng', size: '39', stock: 18 },
      { id: 'v18', color: 'Xám xi măng', size: '40', stock: 14 },
      { id: 'v19', color: 'Xám xi măng', size: '41', stock: 22 },
    ],
    specs: [
      { key: 'Độ cao đế', value: '3.5 cm' },
      { key: 'Trọng lượng', value: '240g / chiếc' },
      { key: 'Công nghệ', value: 'AeroFoat Cushioning' },
    ],
    rating: 4.9,
    reviewCount: 0,
    salesCount: 120,
    dateAdded: new Date('2026-01-20'),
    featured: true,
    promo: false,
  },
  {
    name: 'Đồng Hồ Nam Thông Minh Slate Elite',
    description:
      'Thiết kế mặt tròn sang trọng mạ titan nhẵn mịn, kháng nước sâu 50m. Đồng hành đắc lực để đo lường nhịp tim, giấc ngủ, định vị GPS, và kết nối nhanh chóng thông báo cuộc gọi.',
    categoryId: categoryIdMap['Phụ Kiện Cao Cấp'],
    brand: 'Cronos',
    originalPrice: 5500000,
    discountPrice: 4200000,
    image: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80',
    ],
    colors: ['Đen không gian', 'Bạc hoàng gia'],
    sizes: ['42mm', '46mm'],
    variants: [
      { id: 'v20', color: 'Đen không gian', size: '42mm', stock: 12 },
      { id: 'v21', color: 'Đen không gian', size: '46mm', stock: 8 },
      { id: 'v22', color: 'Bạc hoàng gia', size: '42mm', stock: 6 },
      { id: 'v23', color: 'Bạc hoàng gia', size: '46mm', stock: 2 },
    ],
    specs: [
      { key: 'Chống nước', value: '5 ATM (50 mét)' },
      { key: 'Độ rộng dây', value: '22 mm tinh tế' },
      { key: 'Màn hình', value: 'AMOLED 1.4 inch sắc nét' },
    ],
    rating: 4.2,
    reviewCount: 0,
    salesCount: 38,
    dateAdded: new Date('2026-03-12'),
    featured: false,
    promo: true,
  },
  {
    name: 'Serum Dưỡng Thể Vitamin C Sáng Da',
    description:
      'Serum dưỡng thể chiết xuất từ nho đen và Vitamin C tinh khiết giúp hồi phục collagen tự nhiên của da, giảm hắc sắc tố, nuôi dưỡng làn da căng mọng tràn đầy sức sống chỉ sau 14 ngày sử dụng.',
    categoryId: categoryIdMap['Mỹ Phẩm & Chăm Sóc'],
    brand: 'NaturaBody',
    originalPrice: 450000,
    discountPrice: 380000,
    image: [
      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&auto=format&fit=crop&q=80',
    ],
    colors: ['Tự nhiên'],
    sizes: ['150ml', '250ml'],
    variants: [
      { id: 'v24', color: 'Tự nhiên', size: '150ml', stock: 45 },
      { id: 'v25', color: 'Tự nhiên', size: '250ml', stock: 30 },
    ],
    specs: [
      { key: 'Dung tích', value: '150ml / 250ml' },
      { key: 'Độ PH lý tưởng', value: '5.5 dịu nhẹ' },
      { key: 'Loại da phù hợp', value: 'Mọi loại da kể cả da mẫn cảm' },
    ],
    rating: 4.6,
    reviewCount: 0,
    salesCount: 88,
    dateAdded: new Date('2026-04-20'),
    featured: false,
    promo: false,
  },
];

// NOTE: Passwords will be automatically bcrypt-hashed by User model's pre-save hook.
const USERS_DATA = [
  {
    name: 'Nguyễn Quản Trị',
    email: 'admin@ecommerce.vn',
    password: process.env.SEED_ADMIN_PASSWORD || 'Admin@123456',
    phone: '0901234567',
    avatar: 'https://ui-avatars.com/api/?name=Admin&background=000000&color=D2FC38&size=128',
    role: 'admin' as const,
    active: true,
    addresses: [
      {
        name: 'Nguyễn Quản Trị',
        phone: '0901234567',
        label: 'Văn phòng chính',
        street: '123 Đường Lê Lợi, Phường Bến Thành, Quận 1',
        city: 'TP. Hồ Chí Minh',
        isDefault: true,
      },
    ],
  },
  {
    name: 'Trần Thủ Kho',
    email: 'kho@ecommerce.vn',
    password: process.env.SEED_STAFF_PASSWORD || 'Staff@123456',
    phone: '0987654321',
    avatar: 'https://ui-avatars.com/api/?name=Tran+Thu+Kho&background=1a1a1a&color=D2FC38&size=128',
    role: 'staff_inventory' as const,
    active: true,
    addresses: [
      {
        name: 'Kho Trung Chuyển',
        phone: '0987654321',
        label: 'Kho hàng',
        street: '456 Đường Nguyễn Văn Linh, Quận 7',
        city: 'TP. Hồ Chí Minh',
        isDefault: true,
      },
    ],
  },
  {
    name: 'Phạm Minh Quân',
    email: 'customer@ecommerce.vn',
    password: process.env.SEED_CUSTOMER_PASSWORD || 'Customer@123456',
    phone: '0912123123',
    avatar: 'https://ui-avatars.com/api/?name=Pham+Minh+Quan&background=2d2d2d&color=ffffff&size=128',
    role: 'customer' as const,
    active: true,
    addresses: [
      {
        name: 'Phạm Minh Quân',
        phone: '0912123123',
        label: 'Nhà riêng',
        street: '789 Đường Kim Mã, Quận Ba Đình',
        city: 'Hà Nội',
        isDefault: true,
      },
      {
        name: 'Phạm Minh Quân (Cty)',
        phone: '0900999888',
        label: 'Nơi làm việc',
        street: '15 Đường Nguyễn Huệ, Quận 1',
        city: 'TP. Hồ Chí Minh',
        isDefault: false,
      },
    ],
  },
];

const COUPONS_DATA = [
  {
    code: 'ECOM10',
    type: 'percent' as const,
    value: 10,
    minOrder: 500000,
    expiryDate: '2026-12-31',
    active: true,
    usageLimit: 100,
    usageCount: 0,
  },
  {
    code: 'GIAM100K',
    type: 'fixed' as const,
    value: 100000,
    minOrder: 1500000,
    expiryDate: '2026-12-31',
    active: true,
    usageLimit: 50,
    usageCount: 0,
  },
  {
    code: 'WELCOME20',
    type: 'percent' as const,
    value: 20,
    minOrder: 300000,
    expiryDate: '2026-12-31',
    active: true,
    usageLimit: 200,
    usageCount: 0,
  },
];

const BANNERS_DATA = [
  {
    title: 'SIÊU TIỆC ĐIỆN TỬ — APPLE WEEK',
    subtitle:
      'Nâng cấp iPhone 15 Pro Max ngay hôm nay. Ưu đãi giảm thẳng tới 5 triệu đồng, trả góp 0% lãi suất trong 12 tháng.',
    image:
      'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1400&auto=format&fit=crop&q=85',
    link: '/products?category=Thiết Bị Điện Tử',
    active: true,
  },
  {
    title: 'THỜI TRANG ĐÓN HÈ — PHONG CÁCH CHẤT',
    subtitle:
      'Bomber năng động, Sneaker bền bỉ cực sành điệu. Freeship Extra toàn quốc cho đơn từ 500K.',
    image:
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1400&auto=format&fit=crop&q=85',
    link: '/products?category=Thời Trang Nam Nữ',
    active: true,
  },
  {
    title: 'PHỤ KIỆN CAO CẤP — ĐẲNG CẤP BỀN BỈ',
    subtitle:
      'Đồng hồ thông minh, ví da, và kính thời trang đẳng cấp. Flash sale mỗi thứ Sáu hàng tuần.',
    image:
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1400&auto=format&fit=crop&q=85',
    link: '/products?category=Phụ Kiện Cao Cấp',
    active: false,
  },
];

// =============================================================================
// SEED FUNCTIONS
// =============================================================================

async function seedCategories(): Promise<Record<string, string>> {
  const label = 'categories';
  const shouldSeed = ONLY ? ONLY === label : true;
  if (!shouldSeed) return {};

  const count = await Category.countDocuments();
  if (count > 0 && !FORCE) {
    console.log(yellow(`  ⚠  ${label}: Đã có ${count} bản ghi, bỏ qua (dùng --force để ghi đè)`));
    // Return existing category name → id map
    const existingCats = await Category.find({});
    const map: Record<string, string> = {};
    existingCats.forEach((c: any) => { map[c.name] = c._id.toString(); });
    return map;
  }

  if (FORCE) {
    await Category.deleteMany({});
    console.log(dim(`     → Đã xóa tất cả ${label} cũ (--force)`));
  }

  const created = await Category.insertMany(CATEGORIES_DATA);
  const map: Record<string, string> = {};
  created.forEach((c: any) => { map[c.name] = c._id.toString(); });

  console.log(green(`  ✓  ${label}: Đã seed ${created.length} bản ghi`));
  created.forEach((c: any) => console.log(dim(`       • ${c.name} (${c._id})`)));

  return map;
}

async function seedProducts(categoryIdMap: Record<string, string>): Promise<void> {
  const label = 'products';
  const shouldSeed = ONLY ? ONLY === label : true;
  if (!shouldSeed) return;

  if (!categoryIdMap || Object.keys(categoryIdMap).length === 0) {
    console.log(red(`  ✗  ${label}: Không có categoryIdMap — chạy category seed trước`));
    return;
  }

  const count = await Product.countDocuments();
  if (count > 0 && !FORCE) {
    console.log(yellow(`  ⚠  ${label}: Đã có ${count} bản ghi, bỏ qua (dùng --force để ghi đè)`));
    return;
  }

  if (FORCE) {
    await Product.deleteMany({});
    console.log(dim(`     → Đã xóa tất cả ${label} cũ (--force)`));
  }

  const products = buildProducts(categoryIdMap);
  const created = await Product.insertMany(products);

  console.log(green(`  ✓  ${label}: Đã seed ${created.length} bản ghi`));
  created.forEach((p: any) => console.log(dim(`       • ${p.name} — ${p.brand} (${p._id})`)));
}

async function seedUsers(): Promise<void> {
  const label = 'users';
  const shouldSeed = ONLY ? ONLY === label : true;
  if (!shouldSeed) return;

  let seededCount = 0;

  for (const userData of USERS_DATA) {
    const existing = await User.findOne({ email: userData.email });

    if (existing && !FORCE) {
      console.log(yellow(`  ⚠  ${label}: User "${userData.email}" đã tồn tại, bỏ qua`));
      continue;
    }

    if (existing && FORCE) {
      await User.deleteOne({ email: userData.email });
      console.log(dim(`     → Đã xóa user "${userData.email}" (--force)`));
    }

    // Create user — password will be auto-hashed by the pre-save middleware
    await User.create(userData);
    seededCount++;
    console.log(green(`  ✓  ${label}: Tạo "${userData.email}" (role: ${userData.role}) — mật khẩu đã được bcrypt hash`));
  }

  if (seededCount === 0 && !FORCE) {
    console.log(yellow(`  ⚠  ${label}: Tất cả user đã tồn tại, không seed thêm`));
  }
}

async function seedCoupons(): Promise<void> {
  const label = 'coupons';
  const shouldSeed = ONLY ? ONLY === label : true;
  if (!shouldSeed) return;

  const count = await Coupon.countDocuments();
  if (count > 0 && !FORCE) {
    console.log(yellow(`  ⚠  ${label}: Đã có ${count} bản ghi, bỏ qua (dùng --force để ghi đè)`));
    return;
  }

  if (FORCE) {
    await Coupon.deleteMany({});
    console.log(dim(`     → Đã xóa tất cả ${label} cũ (--force)`));
  }

  const created = await Coupon.insertMany(COUPONS_DATA);
  console.log(green(`  ✓  ${label}: Đã seed ${created.length} bản ghi`));
  created.forEach((c: any) =>
    console.log(dim(`       • ${c.code} — ${c.type === 'percent' ? `-${c.value}%` : `-${c.value.toLocaleString('vi-VN')}₫`} (min: ${c.minOrder.toLocaleString('vi-VN')}₫)`))
  );
}

async function seedBanners(): Promise<void> {
  const label = 'banners';
  const shouldSeed = ONLY ? ONLY === label : true;
  if (!shouldSeed) return;

  const count = await Banner.countDocuments();
  if (count > 0 && !FORCE) {
    console.log(yellow(`  ⚠  ${label}: Đã có ${count} bản ghi, bỏ qua (dùng --force để ghi đè)`));
    return;
  }

  if (FORCE) {
    await Banner.deleteMany({});
    console.log(dim(`     → Đã xóa tất cả ${label} cũ (--force)`));
  }

  const created = await Banner.insertMany(BANNERS_DATA);
  console.log(green(`  ✓  ${label}: Đã seed ${created.length} bản ghi`));
  created.forEach((b: any) =>
    console.log(dim(`       • "${b.title}" — active: ${b.active}`))
  );
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('\n' + bold('━'.repeat(68)));
  console.log(bold('E-Commerce Database Seed Script'));
  if (FORCE) console.log(red('CHẾ ĐỘ --force: Tất cả dữ liệu cũ sẽ bị XÓA và seed lại!'));
  if (ONLY) console.log(yellow(`--only ${ONLY}: Chỉ seed collection này`));
  console.log(bold('━'.repeat(68)));

  // Connect to MongoDB
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce';
  console.log(dim(`\n  Kết nối tới: ${MONGO_URI.replace(/\/\/[^:]+:[^@]+@/, '//*****:*****@')}`));

  try {
    // Set DNS to avoid Atlas SRV resolution issues
    const dns = await import('dns');
    dns.setServers(['8.8.8.8', '8.8.4.4']);

    await mongoose.connect(MONGO_URI);
    console.log(green('  ✓  Kết nối MongoDB thành công\n'));
  } catch (error: any) {
    console.error(red(`  ✗  Lỗi kết nối MongoDB: ${error.message}`));
    process.exit(1);
  }

  try {
    // 1. Categories (must be seeded first — products reference them)
    const categoryIdMap = await seedCategories();

    // 2. Products (depend on categoryIdMap)
    await seedProducts(categoryIdMap);

    // 3. Users (independent, passwords auto-hashed by model)
    await seedUsers();

    // 4. Coupons (independent)
    await seedCoupons();

    // 5. Banners (independent)
    await seedBanners();

    console.log('\n' + bold('━'.repeat(68)));
    console.log(green(bold('  ✅ Seed hoàn tất!')));
    console.log(dim('  Orders & Reviews KHÔNG được seed — dữ liệu từ hoạt động thực tế.\n'));

    // Print login credentials summary
    console.log(bold('  🔑 Thông tin đăng nhập mẫu:'));
    console.log(`  ${'Email'.padEnd(30)} ${'Mật khẩu'.padEnd(20)} ${'Role'}`);
    console.log('  ' + '─'.repeat(65));
    USERS_DATA.forEach(u => {
      console.log(`  ${u.email.padEnd(30)} ${u.password.padEnd(20)} ${u.role}`);
    });
    console.log(bold('━'.repeat(68)) + '\n');

  } catch (error: any) {
    console.error(red(`\n  ✗  Lỗi trong quá trình seed: ${error.message}`));
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();

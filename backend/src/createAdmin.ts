/**
 * Script tạo tài khoản admin mặc định.
 * Chạy một lần: npx ts-node src/createAdmin.ts
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import User from './models/User';
import connectDB from './config/db';

const createDefaultAdmin = async () => {
  await connectDB();

  try {
    const existing = await User.findOne({ email: 'admin@ecommerce.vn' });

    if (existing) {
      console.log('✅ Tài khoản admin đã tồn tại trong database:');
      console.log(`   Email: ${existing.email}`);
      console.log(`   Role: ${existing.role}`);
    } else {
      const admin = await User.create({
        name: 'Quản Trị Viên',
        email: 'admin@ecommerce.vn',
        password: 'admin123',
        phone: '0901234567',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        role: 'admin',
        active: true,
        addresses: [],
      });

      console.log('🎉 Đã tạo tài khoản admin thành công!');
      console.log(`   Email: ${admin.email}`);
      console.log(`   Password: admin123`);
      console.log(`   Role: ${admin.role}`);
    }
  } catch (error) {
    console.error('❌ Lỗi tạo admin:', error);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
};

createDefaultAdmin();

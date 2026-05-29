"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Script tạo tài khoản admin mặc định.
 * Chạy một lần: npx ts-node src/createAdmin.ts
 */
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const User_1 = __importDefault(require("./models/User"));
const db_1 = __importDefault(require("./config/db"));
const createDefaultAdmin = async () => {
    await (0, db_1.default)();
    try {
        const existing = await User_1.default.findOne({ email: 'admin@ecommerce.vn' });
        if (existing) {
            console.log('✅ Tài khoản admin đã tồn tại trong database:');
            console.log(`   Email: ${existing.email}`);
            console.log(`   Role: ${existing.role}`);
        }
        else {
            const admin = await User_1.default.create({
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
    }
    catch (error) {
        console.error('❌ Lỗi tạo admin:', error);
    }
    finally {
        await mongoose_1.default.disconnect();
        process.exit();
    }
};
createDefaultAdmin();

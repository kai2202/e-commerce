"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const addressSchema = new mongoose_1.default.Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    label: { type: String },
    street: { type: String, required: true },
    city: { type: String, required: true },
    isDefault: { type: Boolean, default: false }
});
const userSchema = new mongoose_1.default.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    avatar: { type: String, default: '' },
    role: { type: String, enum: ['customer', 'admin', 'staff_inventory'], default: 'customer' },
    active: { type: Boolean, default: true },
    is_profile_incomplete: { type: Boolean, default: false },
    addresses: [addressSchema],
    wishlist: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Product' }]
}, {
    timestamps: true
});
const User = mongoose_1.default.model('User', userSchema);
exports.default = User;

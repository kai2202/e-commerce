"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const couponSchema = new mongoose_1.default.Schema({
    code: { type: String, required: true, unique: true },
    type: { type: String, enum: ['fixed', 'percent'], required: true },
    value: { type: Number, required: true },
    minOrder: { type: Number, default: 0 },
    expiryDate: { type: String, required: true },
    active: { type: Boolean, default: true },
    usageLimit: { type: Number, default: 0 },
    usageCount: { type: Number, default: 0 }
}, {
    timestamps: true
});
const Coupon = mongoose_1.default.model('Coupon', couponSchema);
exports.default = Coupon;

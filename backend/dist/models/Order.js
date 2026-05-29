"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const orderItemSchema = new mongoose_1.default.Schema({
    productId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    image: { type: String, required: true },
    selectedColor: { type: String, required: true },
    selectedSize: { type: String, required: true }
});
const orderSchema = new mongoose_1.default.Schema({
    id: { type: String, required: true },
    userId: { type: String, required: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String, required: true },
    items: [orderItemSchema],
    subTotal: { type: Number, required: true },
    shippingFee: { type: Number, required: true },
    discountAmount: { type: Number, required: true, default: 0 },
    couponCode: { type: String },
    total: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'shipping', 'completed', 'cancelled'], default: 'pending' },
    shippingAddress: {
        id: { type: String },
        name: { type: String, required: true },
        phone: { type: String, required: true },
        label: { type: String },
        street: { type: String, required: true },
        city: { type: String, required: true }
    },
    paymentMethod: { type: String, required: true },
    courier: { type: String },
    date: { type: String },
    history: [{
            status: { type: String, required: true },
            note: { type: String, required: true },
            date: { type: String, required: true }
        }]
}, {
    timestamps: true
});
const Order = mongoose_1.default.model('Order', orderSchema);
exports.default = Order;

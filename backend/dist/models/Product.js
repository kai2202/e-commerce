"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const variantSchema = new mongoose_1.default.Schema({
    id: { type: String, required: true },
    color: { type: String, required: true },
    size: { type: String, required: true },
    stock: { type: Number, required: true, default: 0 }
});
const productSchema = new mongoose_1.default.Schema({
    name: { type: String, required: true },
    brand: { type: String, required: true },
    categoryId: { type: String, required: true }, // referencing Category.id
    description: { type: String, required: true },
    originalPrice: { type: Number, required: true },
    discountPrice: { type: Number },
    image: [{ type: String }],
    colors: [{ type: String }],
    sizes: [{ type: String }],
    specs: [{
            key: { type: String },
            value: { type: String }
        }],
    variants: [variantSchema],
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    salesCount: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    promo: { type: Boolean, default: false },
    dateAdded: { type: String }
}, {
    timestamps: true
});
const Product = mongoose_1.default.model('Product', productSchema);
exports.default = Product;

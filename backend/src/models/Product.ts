import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema({
  id: { type: String, required: true },
  color: { type: String, required: true },
  size: { type: String, required: true },
  stock: { type: Number, required: true, default: 0 }
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: { type: String, required: true },
  categoryId: { type: String, ref: 'Category', required: true, index: true }, // referencing Category.id
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
  dateAdded: { type: Date, default: Date.now }
}, {
  timestamps: true
});

const Product = mongoose.model('Product', productSchema);
export default Product;

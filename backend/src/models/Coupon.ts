import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
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

const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;

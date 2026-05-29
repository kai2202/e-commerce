import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const addressSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  label: { type: String },
  street: { type: String, required: true },
  city: { type: String, required: true },
  isDefault: { type: Boolean, default: false }
});

addressSchema.set('toJSON', { virtuals: true });
addressSchema.set('toObject', { virtuals: true });

const cartItemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  productId: { type: String, ref: 'Product', required: true },
  color: { type: String, required: true },
  size: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 }
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, default: '' },
  password: { type: String, required: true },
  avatar: { type: String, default: '' },
  role: { type: String, enum: ['customer', 'admin', 'staff_inventory'], default: 'customer' },
  active: { type: Boolean, default: true },
  is_profile_incomplete: { type: Boolean, default: false },
  addresses: [addressSchema],
  cart: [cartItemSchema],
  wishlist: [{ type: String, ref: 'Product' }]
}, {
  timestamps: true
});

userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

// Auto-hash password before saving
userSchema.pre('save', async function () {
  const user = this as any;
  if (!user.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;


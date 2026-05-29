import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId: { type: String, ref: 'Product', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  image: { type: String, required: true },
  selectedColor: { type: String, required: true },
  selectedSize: { type: String, required: true }
});

const orderSchema = new mongoose.Schema({
  userId: { type: String, ref: 'User', required: false, default: 'guest', index: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhone: { type: String, required: true },
  items: [orderItemSchema],
  subTotal: { type: Number, required: true },
  shippingFee: { type: Number, required: true },
  discountAmount: { type: Number, required: true, default: 0 },
  couponCode: { type: String },
  total: { type: Number, required: true },
  isPaid: { type: Boolean, default: false },
  paymentStatus: { type: String, enum: ['unpaid', 'paid', 'failed'], default: 'unpaid', index: true },
  status: { type: String, enum: ['pending', 'shipping', 'completed', 'cancelled'], default: 'pending', index: true },
  shippingAddress: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    label: { type: String },
    street: { type: String, required: true },
    city: { type: String, required: true }
  },
  paymentMethod: { type: String, required: true },
  courier: { type: String },
  date: { type: Date, default: Date.now },
  history: [{
    status: { type: String, required: true },
    note: { type: String, required: true },
    date: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

const Order = mongoose.model('Order', orderSchema);
export default Order;

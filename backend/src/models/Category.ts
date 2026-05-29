import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String },
  parentId: { type: String, default: null } // for subcategories
}, {
  timestamps: true
});

const Category = mongoose.model('Category', categorySchema);
export default Category;

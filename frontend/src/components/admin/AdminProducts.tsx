import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useAppSelector, useAppDispatch } from '../../redux/hooks';
import { createProductAsync, updateProductAsync, deleteProductAsync, fetchProducts } from '../../redux/shopSlice';
import { Product, VariantStock } from '../../types';
import { Plus, Edit, Trash, Save, X, Star, ImagePlus, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../utils/api';

// ---------- Inline field error helper ----------
type FormErrors = {
  name?: string;
  brand?: string;
  category?: string;
  origPrice?: string;
  description?: string;
  defaultStock?: string;
};

// ---------- Price formatting helpers ----------
const formatPriceInput = (value: string) => {
  const cleanValue = value.replace(/\D/g, '');
  if (!cleanValue) return '';
  return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const parsePriceInput = (formattedValue: string) => {
  if (!formattedValue) return 0;
  return Number(formattedValue.replace(/\./g, '')) || 0;
};

// ---------- Input field component with inline error ----------
const Field = ({
  label, required, error, children,
}: { label: string; required?: boolean; error?: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-gray-400 font-bold mb-1 uppercase tracking-wider text-[10px]">
      {label}{required && ' *'}
    </label>
    {children}
    {error && (
      <p className="flex items-center gap-1 mt-1 text-red-500 text-[10px] font-bold">
        <AlertCircle className="h-3 w-3 shrink-0" />{error}
      </p>
    )}
  </div>
);

// ---------- Product Form Modal (rendered via Portal so overlay covers full viewport) ----------
interface ProductFormProps {
  isAddNew: boolean;
  editingProduct: Product | null;
  categories: any[];
  onClose: () => void;
  onSaved: () => void;
}

const ProductFormModal: React.FC<ProductFormProps> = ({ isAddNew, editingProduct, categories, onClose, onSaved }) => {
  const dispatch = useAppDispatch();

  const [formName, setFormName] = useState(editingProduct?.name ?? '');
  const [formBrand, setFormBrand] = useState(editingProduct?.brand ?? '');
  const [formCategory, setFormCategory] = useState(editingProduct?.categoryId ?? categories[0]?.id ?? '');
  const [formDesc, setFormDesc] = useState(editingProduct?.description ?? '');
  const [formOrigPrice, setFormOrigPrice] = useState<string>(editingProduct ? formatPriceInput(String(editingProduct.originalPrice)) : '');
  const [formDiscPrice, setFormDiscPrice] = useState<string>(editingProduct?.discountPrice != null ? formatPriceInput(String(editingProduct.discountPrice)) : '');
  const [formImages, setFormImages] = useState<string[]>(editingProduct ? [...editingProduct.image] : []);
  const [formSpecs, setFormSpecs] = useState<{ label: string; value: string }[]>(
    editingProduct && editingProduct.specs.length > 0
      ? editingProduct.specs.map((s) => ({ label: (s as any).label || (s as any).key || '', value: s.value }))
      : [{ label: '', value: '' }]
  );
  const [formFeatured, setFormFeatured] = useState(editingProduct?.featured ?? false);
  const [formPromo, setFormPromo] = useState(editingProduct?.promo ?? false);

  const [colorInput, setColorInput] = useState('');
  const [sizeInput, setSizeInput] = useState('');
  const [formColors, setFormColors] = useState<string[]>(editingProduct ? [...editingProduct.colors] : []);
  const [formSizes, setFormSizes] = useState<string[]>(editingProduct ? [...editingProduct.sizes] : []);
  const [formVariants, setFormVariants] = useState<VariantStock[]>(editingProduct ? [...editingProduct.variants] : []);

  // Local state for non-variant default stock
  const [formDefaultStock, setFormDefaultStock] = useState<string>(
    editingProduct && editingProduct.variants.length === 1 && editingProduct.variants[0].color === 'Mặc định'
      ? String(editingProduct.variants[0].stock)
      : editingProduct && editingProduct.variants.length > 0
      ? ''
      : '0'
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Validation ---
  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formName.trim()) newErrors.name = 'Vui lòng nhập tên sản phẩm';
    if (!formBrand.trim()) newErrors.brand = 'Vui lòng nhập thương hiệu';
    if (!formCategory) newErrors.category = 'Vui lòng chọn danh mục';
    if (!formDesc.trim()) newErrors.description = 'Vui lòng nhập mô tả sản phẩm';
    
    const price = parsePriceInput(formOrigPrice);
    if (!formOrigPrice || price <= 0) newErrors.origPrice = 'Giá gốc phải lớn hơn 0';
    
    // Nếu không tạo biến thể, bắt buộc phải nhập số lượng tồn kho mặc định
    if (formColors.length === 0 || formSizes.length === 0) {
      const stock = Number(formDefaultStock);
      if (!formDefaultStock.trim() || isNaN(stock) || stock < 0) {
        newErrors.defaultStock = 'Số lượng tồn kho phải là số và lớn hơn hoặc bằng 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearError = (field: keyof FormErrors) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // --- Image upload ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFormImages((prev) => [...prev, res.data.url]);
    } catch {
      setSaveMsg({ type: 'error', text: 'Upload ảnh thất bại. Vui lòng thử lại!' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = async (idx: number) => {
    const imgUrl = formImages[idx];
    setFormImages((prev) => prev.filter((_, i) => i !== idx));
    if (imgUrl && imgUrl.includes('/uploads/products/')) {
      const filename = imgUrl.split('/uploads/products/').pop();
      if (filename) {
        try { await api.delete(`/upload/${filename}`); } catch { /* silent */ }
      }
    }
  };

  // --- Variant builder ---
  const addColor = () => {
    const c = colorInput.trim();
    if (c && !formColors.includes(c)) setFormColors((p) => [...p, c]);
    setColorInput('');
  };

  const addSize = () => {
    const s = sizeInput.trim();
    if (s && !formSizes.includes(s)) setFormSizes((p) => [...p, s]);
    setSizeInput('');
  };

  const removeColor = (c: string) => {
    setFormColors((p) => p.filter((x) => x !== c));
    setFormVariants((p) => p.filter((v) => v.color !== c));
  };

  const removeSize = (s: string) => {
    setFormSizes((p) => p.filter((x) => x !== s));
    setFormVariants((p) => p.filter((v) => v.size !== s));
  };

  const generateVariantMatrix = () => {
    if (formColors.length === 0 || formSizes.length === 0) {
      setSaveMsg({ type: 'error', text: 'Nhập ít nhất 1 màu sắc và 1 size trước!' });
      return;
    }
    const matrix: VariantStock[] = [];
    formColors.forEach((color) => {
      formSizes.forEach((size) => {
        const existing = formVariants.find((v) => v.color === color && v.size === size);
        matrix.push({ id: existing?.id || `v-${color}-${size}-${Date.now()}`, color, size, stock: existing?.stock ?? 10 });
      });
    });
    setFormVariants(matrix);
    setSaveMsg(null);
  };

  const handleVariantStockChange = (idx: number, newStock: number) => {
    setFormVariants((prev) => {
      const copy = [...prev];
      copy[idx].stock = Math.max(0, newStock);
      return copy;
    });
  };

  // --- Submit ---
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    setSaveMsg(null);

    // Xử lý biến thể và tồn kho mặc định
    const hasVariants = formColors.length > 0 && formSizes.length > 0;
    const finalColors = hasVariants ? formColors : ['Mặc định'];
    const finalSizes = hasVariants ? formSizes : ['Tiêu chuẩn'];
    const finalVariants = hasVariants 
      ? formVariants 
      : [{
          id: editingProduct?.variants?.[0]?.id || `v-default-${Date.now()}`,
          color: 'Mặc định',
          size: 'Tiêu chuẩn',
          stock: Number(formDefaultStock) || 0
        }];

    const payload = {
      name: formName.trim(),
      brand: formBrand.trim(),
      categoryId: formCategory,
      description: formDesc.trim(),
      originalPrice: parsePriceInput(formOrigPrice),
      discountPrice: formDiscPrice ? parsePriceInput(formDiscPrice) : undefined,
      image: formImages,
      colors: finalColors,
      sizes: finalSizes,
      specs: formSpecs
        .filter((s) => s.label.trim() !== '' && s.value.trim() !== '')
        .map((s) => ({ key: s.label.trim(), value: s.value.trim() })),
      variants: finalVariants,
      featured: formFeatured,
      promo: formPromo,
      dateAdded: new Date().toISOString().split('T')[0],
      rating: editingProduct?.rating ?? 0,
      reviewCount: editingProduct?.reviewCount ?? 0,
      salesCount: editingProduct?.salesCount ?? 0,
    };

    try {
      if (isAddNew) {
        await dispatch(createProductAsync(payload)).unwrap();
        setSaveMsg({ type: 'success', text: 'Thêm sản phẩm thành công!' });
      } else if (editingProduct) {
        const dbId = (editingProduct as any)._id || editingProduct.id;
        await dispatch(updateProductAsync({ id: dbId, payload })).unwrap();
        setSaveMsg({ type: 'success', text: 'Cập nhật sản phẩm thành công!' });
      }
      setTimeout(() => { onSaved(); onClose(); }, 1000);
    } catch (err: any) {
      const errMsg = typeof err === 'string' ? err : (err.message || 'Kiểm tra kết nối máy chủ.');
      setSaveMsg({ type: 'error', text: `Lưu thất bại! ${errMsg}` });
    } finally {
      setIsSaving(false);
    }
  };



  const inputCls = (hasError?: string) =>
    `w-full rounded-lg border px-3.5 py-2 font-bold focus:outline-none transition ${
      hasError ? 'border-red-400 bg-red-50 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'
    }`;

  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-sm"
        onClick={() => !isSaving && onClose()}
      />

      {/* Modal box */}
      <div className="relative w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl border border-gray-100 z-10">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-100 px-6 py-4 sticky top-0 bg-white rounded-t-2xl z-10">
          <span className="text-sm font-black uppercase text-gray-700 tracking-wider">
            {isAddNew ? '✨ Thêm Sản Phẩm Mới' : '✏️ Chỉnh Sửa Sản Phẩm'}
          </span>
          <button onClick={() => !isSaving && onClose()} className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="p-6 space-y-5 text-xs">
          {/* Feedback banner */}
          {saveMsg && (
            <div className={`flex items-center gap-2 rounded-lg p-3 font-bold ${saveMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
              {saveMsg.type === 'success' ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
              {saveMsg.text}
            </div>
          )}

          {/* Row 1: Name + Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Tên sản phẩm" required error={errors.name}>
              <input
                type="text"
                value={formName}
                onChange={(e) => { setFormName(e.target.value); clearError('name'); }}
                placeholder="iPhone 15 Pro Max..."
                className={inputCls(errors.name)}
              />
            </Field>
            <Field label="Thương hiệu" required error={errors.brand}>
              <input
                type="text"
                value={formBrand}
                onChange={(e) => { setFormBrand(e.target.value); clearError('brand'); }}
                placeholder="Apple, Nike, Samsung..."
                className={inputCls(errors.brand)}
              />
            </Field>
          </div>

          {/* Row 2: Category + Prices */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Danh mục" required error={errors.category}>
              <select
                value={formCategory}
                onChange={(e) => { setFormCategory(e.target.value); clearError('category'); }}
                className={`${inputCls(errors.category)} px-3`}
              >
                <option value="">-- Chọn danh mục --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Giá gốc (VND)" required error={errors.origPrice}>
              <input
                type="text"
                value={formOrigPrice}
                onChange={(e) => { setFormOrigPrice(formatPriceInput(e.target.value)); clearError('origPrice'); }}
                placeholder="VD: 29.990.000"
                className={inputCls(errors.origPrice)}
              />
            </Field>
            <Field label="Giá khuyến mãi (VND)">
              <input
                type="text"
                value={formDiscPrice}
                onChange={(e) => setFormDiscPrice(formatPriceInput(e.target.value))}
                placeholder="Để trống nếu không KM"
                className={inputCls()}
              />
            </Field>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-gray-400 font-bold mb-2 uppercase tracking-wider text-[10px]">Ảnh sản phẩm</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formImages.map((img, idx) => (
                <div key={idx} className="relative group">
                  <img src={img} alt={`img-${idx}`} className="h-20 w-20 object-cover rounded-lg border border-gray-200" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="h-20 w-20 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50 transition cursor-pointer text-gray-400 hover:text-indigo-500 disabled:opacity-50"
              >
                {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
                <span className="text-[9px] mt-1 font-bold">{isUploading ? 'Đang tải...' : 'Thêm ảnh'}</span>
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageUpload} />
            <p className="text-[10px] text-gray-400">Chấp nhận: JPG, PNG, WebP. Tối đa 5MB/ảnh.</p>
          </div>

          {/* Description */}
          <Field label="Mô tả sản phẩm" required error={errors.description}>
            <textarea
              rows={3}
              value={formDesc}
              onChange={(e) => { setFormDesc(e.target.value); clearError('description'); }}
              placeholder="Mô tả tính năng, đặc điểm nổi bật..."
              className={`w-full rounded-lg border p-3 focus:outline-none resize-none transition text-gray-800 ${
                errors.description ? 'border-red-400 bg-red-50 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'
              }`}
            />
          </Field>

          {/* Default Stock (Only shown if no variants are set up) */}
          {(formColors.length === 0 || formSizes.length === 0) && (
            <div className="bg-indigo-50/40 border border-indigo-100 rounded-xl p-4 space-y-2">
              <span className="block text-indigo-750 font-black uppercase tracking-wider text-[10px]">📦 Tồn Kho Mặc Định</span>
              <Field label="Số lượng tồn kho (Tổng)" required error={errors.defaultStock}>
                <input
                  type="number"
                  min={0}
                  value={formDefaultStock}
                  onChange={(e) => { setFormDefaultStock(e.target.value); if (errors.defaultStock) setErrors(prev => ({ ...prev, defaultStock: undefined })); }}
                  placeholder="VD: 50"
                  className={`${inputCls(errors.defaultStock)} bg-white max-w-xs`}
                />
              </Field>
              <p className="text-[10px] text-gray-400">Sản phẩm này sẽ được lưu ở dạng phân loại mặc định (không có Màu sắc & Kích cỡ). Để tạo nhiều màu sắc/kích cỡ khác nhau, hãy sử dụng bảng **Biến Thể Sản Phẩm** bên dưới.</p>
            </div>
          )}

          {/* Variant Builder */}
          <div className="border border-gray-100 rounded-xl p-4 space-y-4 bg-gray-50/60">
            <span className="block text-gray-500 font-black uppercase tracking-wider text-[10px]">🎛️ Biến Thể Sản Phẩm (Màu × Size)</span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Colors */}
              <div>
                <label className="block text-gray-400 font-bold mb-1.5 text-[10px]">Màu sắc</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={colorInput}
                    onChange={(e) => setColorInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addColor())}
                    placeholder="Nhập màu, Enter để thêm..."
                    className="flex-grow rounded-lg border border-gray-200 px-3 py-1.5 focus:border-indigo-500 focus:outline-none"
                  />
                  <button type="button" onClick={addColor} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 text-[10px]">+ Thêm</button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {formColors.map((c) => (
                    <span key={c} className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full font-bold text-[10px]">
                      {c}
                      <button type="button" onClick={() => removeColor(c)}><X className="h-3 w-3 hover:text-red-500" /></button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Sizes */}
              <div>
                <label className="block text-gray-400 font-bold mb-1.5 text-[10px]">Kích cỡ / Phiên bản</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={sizeInput}
                    onChange={(e) => setSizeInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSize())}
                    placeholder="VD: M, L, 256GB..."
                    className="flex-grow rounded-lg border border-gray-200 px-3 py-1.5 focus:border-indigo-500 focus:outline-none"
                  />
                  <button type="button" onClick={addSize} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 text-[10px]">+ Thêm</button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {formSizes.map((s) => (
                    <span key={s} className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-bold text-[10px]">
                      {s}
                      <button type="button" onClick={() => removeSize(s)}><X className="h-3 w-3 hover:text-red-500" /></button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Generate button */}
            {formColors.length > 0 && formSizes.length > 0 && (
              <button
                type="button"
                onClick={generateVariantMatrix}
                className="flex items-center gap-2 rounded-lg bg-gray-800 text-white px-4 py-2 font-black text-[10px] hover:bg-gray-900 transition cursor-pointer"
              >
                <Save className="h-3.5 w-3.5" />
                Tạo Ma Trận ({formColors.length} màu × {formSizes.length} size = {formColors.length * formSizes.length} cặp)
              </button>
            )}

            {/* Variant stock grid */}
            {formVariants.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1">
                {formVariants.map((v, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg border border-gray-200 bg-white">
                    <div>
                      <span className="block font-bold text-gray-800 text-[11px]">{v.color}</span>
                      <span className="block text-[9.5px] text-gray-400">Size: {v.size}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-gray-400">Tồn:</span>
                      <input
                        type="number"
                        min={0}
                        value={v.stock}
                        onChange={(e) => handleVariantStockChange(idx, Number(e.target.value))}
                        className="w-14 text-center rounded border border-gray-200 py-1 font-bold text-gray-800 focus:outline-none focus:border-indigo-400"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Specs */}
          <div className="space-y-2">
            <span className="block text-gray-400 font-bold uppercase tracking-wider text-[10px]">Thông Số Kỹ Thuật</span>
            {formSpecs.map((spec, index) => (
              <div key={index} className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Thuộc tính (VD: RAM)"
                  value={spec.label}
                  onChange={(e) => {
                    const copy = [...formSpecs];
                    copy[index].label = e.target.value;
                    setFormSpecs(copy);
                  }}
                  className="w-2/5 rounded-lg border border-gray-200 px-3 py-1.5 focus:border-indigo-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Giá trị (VD: 8GB)"
                  value={spec.value}
                  onChange={(e) => {
                    const copy = [...formSpecs];
                    copy[index].value = e.target.value;
                    setFormSpecs(copy);
                  }}
                  className="flex-grow rounded-lg border border-gray-200 px-3 py-1.5 focus:border-indigo-500 focus:outline-none"
                />
                <button type="button" onClick={() => setFormSpecs((prev) => prev.filter((_, i) => i !== index))}
                  className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => setFormSpecs((prev) => [...prev, { label: '', value: '' }])}
              className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer">
              + Thêm thông số
            </button>
          </div>

          {/* Featured / Promo */}
          <div className="flex gap-6 border-t border-gray-100 pt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={formFeatured} onChange={(e) => setFormFeatured(e.target.checked)} className="h-4 w-4 rounded text-indigo-600" />
              <span className="font-bold text-gray-600">Sản phẩm nổi bật (Featured)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={formPromo} onChange={(e) => setFormPromo(e.target.checked)} className="h-4 w-4 rounded text-indigo-600" />
              <span className="font-bold text-gray-600">Đang khuyến mãi (Promo)</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={() => !isSaving && onClose()}
              disabled={isSaving}
              className="rounded-lg bg-white border border-gray-200 px-4 py-2 font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-white font-black hover:bg-indigo-700 shadow-sm transition disabled:opacity-60 cursor-pointer"
            >
              {isSaving ? <><Loader2 className="h-4 w-4 animate-spin" />Đang lưu...</> : <><Save className="h-4 w-4" />Lưu Sản Phẩm</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
};

// ==================== Main AdminProducts ====================
export const AdminProducts: React.FC = () => {
  const dispatch = useAppDispatch();
  const products = useAppSelector((state) => state.shop.products);
  const categories = useAppSelector((state) => state.shop.categories);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAddNew, setIsAddNew] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [filterQuery, setFilterQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    setCurrentPage(1);
  }, [filterQuery, filterCategory]);

  const formatVND = (num: number) => num.toLocaleString('vi-VN') + ' ₫';

  const handleOpenAddNew = () => {
    setIsAddNew(true);
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setIsAddNew(false);
    setEditingProduct(p);
    setIsFormOpen(true);
  };

  const handleDelete = async (p: Product) => {
    if (!window.confirm(`Xoá sản phẩm "${p.name}"?\nẢnh sản phẩm trên server cũng sẽ bị xoá vĩnh viễn.`)) return;
    const dbId = (p as any)._id || p.id;
    try {
      await dispatch(deleteProductAsync(dbId)).unwrap();
    } catch {
      alert('Xoá thất bại! Kiểm tra kết nối máy chủ.');
    }
  };

  const filteredProductsList = products.filter((p) => {
    const term = filterQuery.toLowerCase();
    if (filterCategory && p.categoryId !== filterCategory) return false;
    return p.name.toLowerCase().includes(term) || p.brand.toLowerCase().includes(term);
  });

  const totalPages = Math.ceil(filteredProductsList.length / itemsPerPage);
  const paginatedProductsList = filteredProductsList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 font-sans text-xs">

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-gray-150 rounded-xl p-4 shadow-xs">
        <div className="flex flex-wrap gap-2.5 flex-grow">
          <input
            type="text"
            placeholder="Tìm theo tên, thương hiệu..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 focus:border-indigo-500 focus:outline-none max-w-xs font-semibold"
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 font-bold focus:outline-none"
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleOpenAddNew}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 font-black text-white hover:bg-indigo-700 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Thêm Sản Phẩm Mới
        </button>
      </div>

      {/* Form modal via portal */}
      {isFormOpen && (
        <ProductFormModal
          isAddNew={isAddNew}
          editingProduct={editingProduct}
          categories={categories}
          onClose={() => setIsFormOpen(false)}
          onSaved={() => setIsFormOpen(false)}
        />
      )}

      {/* Products table */}
      <div className="bg-white border border-gray-150 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-gray-500">
            <thead className="bg-gray-50 text-[10.5px] text-gray-400 uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="py-3 px-4">Sản Phẩm</th>
                <th className="px-4">Hãng</th>
                <th className="px-4">Giá</th>
                <th className="px-4">Đánh Giá</th>
                <th className="px-4">Tồn Kho</th>
                <th className="px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
              {paginatedProductsList.length > 0 ? (
                paginatedProductsList.map((p) => {
                  const totalStock = p.variants.reduce((acc, v) => acc + v.stock, 0);
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {p.image[0] ? (
                            <img src={p.image[0]} alt={p.name} className="h-10 w-10 object-cover rounded-lg border border-gray-100 shrink-0" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="h-10 w-10 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-center shrink-0">
                              <ImagePlus className="h-4 w-4 text-gray-300" />
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-gray-900 block leading-tight line-clamp-1">{p.name}</span>
                            <span className="text-[10px] text-gray-400 block mt-0.5">
                              {p.promo && <span className="text-orange-500 font-bold mr-1">KM</span>}
                              {p.featured && <span className="text-indigo-500 font-bold mr-1">★ Nổi bật</span>}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 font-bold text-indigo-600">{p.brand}</td>
                      <td className="px-4">
                        <span className="font-bold text-gray-900 block">{formatVND(p.discountPrice ?? p.originalPrice)}</span>
                        {p.discountPrice !== undefined && (
                          <span className="text-[10px] text-gray-400 line-through">{formatVND(p.originalPrice)}</span>
                        )}
                      </td>
                      <td className="px-4">
                        <div className="flex items-center gap-1 font-bold text-amber-500">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          <span>{p.rating || 0}</span>
                        </div>
                      </td>
                      <td className="px-4">
                        <span className={`font-bold block ${totalStock <= 10 ? 'text-red-500' : 'text-gray-800'}`}>{totalStock} chiếc</span>
                        <span className="text-[9.5px] text-gray-400">({p.variants.length} phân loại)</span>
                      </td>
                      <td className="px-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1 px-2 border rounded-lg hover:bg-gray-100 text-gray-400 hover:text-indigo-600 transition text-[10px] font-bold cursor-pointer"
                          >
                            <Edit className="h-3.5 w-3.5 inline mr-0.5" />Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            className="p-1 px-2 border border-red-100 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-700 transition text-[10px] font-bold cursor-pointer"
                          >
                            <Trash className="h-3.5 w-3.5 inline mr-0.5" />Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    Chưa có sản phẩm nào. Bấm "Thêm Sản Phẩm Mới" để bắt đầu.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 bg-white px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="relative inline-flex items-center rounded-md border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="relative ml-3 inline-flex items-center rounded-md border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">
                  Hiển thị từ <span className="font-bold text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> đến{' '}
                  <span className="font-bold text-gray-900">
                    {Math.min(currentPage * itemsPerPage, filteredProductsList.length)}
                  </span>{' '}
                  trong <span className="font-bold text-gray-900">{filteredProductsList.length}</span> sản phẩm
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-2xs" aria-label="Pagination">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="relative inline-flex items-center rounded-l-md px-2 py-1.5 text-gray-400 ring-1 ring-inset ring-gray-200 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Trước
                  </button>
                  
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`relative inline-flex items-center px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ring-gray-200 focus:z-20 focus:outline-offset-0 cursor-pointer ${
                          currentPage === pageNum
                            ? 'z-10 bg-indigo-600 text-white ring-indigo-600'
                            : 'text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className="relative inline-flex items-center rounded-r-md px-2 py-1.5 text-gray-400 ring-1 ring-inset ring-gray-200 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sau
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '../../redux/hooks';
import { createCategoryAsync, updateCategoryAsync, deleteCategoryAsync } from '../../redux/shopSlice';
import { Category } from '../../types';
import { Plus, Edit, Trash, X, Save, Image, Tag, Folder, UploadCloud, Loader2, AlertCircle, Trash2 } from 'lucide-react';
import api from '../../utils/api';

export const AdminCategories: React.FC = () => {
  const dispatch = useAppDispatch();
  const categories = useAppSelector((state) => state.shop.categories);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAddNew, setIsAddNew] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form parameters
  const [formName, setFormName] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formParentId, setFormParentId] = useState<string | undefined>(undefined);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFormImage(res.data.url);
    } catch {
      setUploadError('Tải ảnh lên thất bại. Vui lòng thử lại!');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = async () => {
    const imgUrl = formImage;
    setFormImage('');
    if (imgUrl && imgUrl.includes('/uploads/products/')) {
      const filename = imgUrl.split('/uploads/products/').pop();
      if (filename) {
        try {
          await api.delete(`/upload/${filename}`);
        } catch {
          /* silent */
        }
      }
    }
  };

  const handleOpenAddNew = () => {
    setIsAddNew(true);
    setEditingCategory(null);
    setFormName('');
    setFormImage('');
    setFormParentId(undefined);
    setIsFormOpen(true);
    setUploadError(null);
  };

  const handleOpenEdit = (c: Category) => {
    setIsAddNew(false);
    setEditingCategory(c);
    setFormName(c.name);
    setFormImage(c.image);
    setFormParentId(c.parentId);
    setIsFormOpen(true);
    setUploadError(null);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) return;

    const payload = {
      name: formName,
      image: formImage,
      parentId: formParentId || undefined,
    };

    if (isAddNew) {
      dispatch(createCategoryAsync(payload));
    } else if (editingCategory) {
      dispatch(updateCategoryAsync({ id: editingCategory.id, payload }));
    }

    setIsFormOpen(false);
  };

  // Derive parent categories list
  const parentCategoriesList = categories.filter((c) => !c.parentId);

  return (
    <div className="space-y-6 font-sans text-xs">
      
      {/* Header bar */}
      <div className="flex justify-between items-center bg-white border border-gray-150 rounded-xl p-4 shadow-xs">
        <div>
          <h3 className="font-bold text-gray-800 uppercase tracking-widest text-[#1e293b] leading-tight flex items-center gap-1">
            <Folder className="h-4.5 w-4.5 text-indigo-600" />
            Phân Loại Danh Mục & Nhóm Hàng
          </h3>
          <p className="text-[10.5px] text-gray-400 font-medium">Sắp xếp các dòng sản phẩm của bạn theo nhóm danh mục cha và các nhóm con.</p>
        </div>

        <button
          onClick={handleOpenAddNew}
          className="flex items-center gap-1 rounded-lg bg-indigo-650 px-4 py-2 font-black text-white hover:bg-indigo-750 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Tạo Danh Mục Mới
        </button>
      </div>

      {/* CRUD Form overlay */}
      {isFormOpen && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setIsFormOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl p-6 border border-gray-150 z-10 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <span className="text-sm font-black uppercase text-gray-500 tracking-wider">
                {isAddNew ? 'Tạo danh mục mới' : 'Cập nhật danh mục'}
              </span>
              <button onClick={() => setIsFormOpen(false)} className="p-1 rounded-full text-gray-400 hover:bg-gray-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-400 font-bold mb-1 uppercase tracking-wider">Tên danh mục *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ví dụ: Đồ gia dụng"
                  className="w-full rounded-lg border border-gray-250 px-3.5 py-2 font-bold focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1 uppercase tracking-wider">Danh mục cha (Nếu là danh mục con)</label>
                <select
                  value={formParentId || ''}
                  onChange={(e) => setFormParentId(e.target.value || undefined)}
                  className="w-full rounded-lg border border-gray-250 px-3 py-2 font-bold"
                >
                  <option value="">Không có - Đây là danh mục gốc (cha)</option>
                  {parentCategoriesList
                    .filter((c) => !editingCategory || c.id !== editingCategory.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-2 uppercase tracking-wider">
                  Hình ảnh đại diện *
                </label>
                
                {/* Drag & Drop Area */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={async (e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file && file.type.startsWith('image/')) {
                      setIsUploading(true);
                      setUploadError(null);
                      try {
                        const formData = new FormData();
                        formData.append('image', file);
                        const res = await api.post('/upload', formData, {
                          headers: { 'Content-Type': 'multipart/form-data' },
                        });
                        setFormImage(res.data.url);
                      } catch {
                        setUploadError('Tải ảnh lên thất bại. Vui lòng thử lại!');
                      } finally {
                        setIsUploading(false);
                      }
                    }
                  }}
                  className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-4 transition min-h-[140px] text-center ${
                    formImage
                      ? 'border-indigo-200 bg-indigo-50/10'
                      : 'border-gray-350 hover:border-indigo-500 hover:bg-indigo-50/20'
                  }`}
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2 py-4">
                      <Loader2 className="h-8 w-8 animate-spin text-indigo-650" />
                      <span className="text-[10px] font-bold text-gray-500">Đang tải ảnh lên...</span>
                    </div>
                  ) : formImage ? (
                    <div className="relative w-full flex flex-col items-center gap-3">
                      <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-gray-150 shadow-sm bg-gray-50">
                        <img
                          src={formImage}
                          alt="Preview"
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1 text-[10px] font-extrabold text-indigo-650 bg-indigo-50 rounded hover:bg-indigo-100 transition cursor-pointer"
                        >
                          Thay đổi ảnh
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="px-2.5 py-1 text-[10px] font-extrabold text-red-500 bg-red-50 rounded hover:bg-red-100 transition flex items-center gap-0.5 cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                          Xóa
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="cursor-pointer py-4 flex flex-col items-center justify-center w-full h-full gap-2"
                    >
                      <div className="p-2.5 bg-gray-50 rounded-full border border-gray-100 text-gray-400 group-hover:text-indigo-500">
                        <UploadCloud className="h-6 w-6 text-indigo-500 animate-bounce" />
                      </div>
                      <div>
                        <span className="text-[10.5px] font-black text-gray-700 block">
                          Nhấp để tải lên hoặc kéo thả ảnh vào đây
                        </span>
                        <span className="text-[9.5px] text-gray-400 font-medium block mt-0.5">
                          Hỗ trợ JPG, PNG, WEBP tối đa 5MB
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>

                {uploadError && (
                  <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-red-500">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {uploadError}
                  </div>
                )}
                
                {/* Hidden input to enforce HTML5 validation if required */}
                <input
                  type="hidden"
                  required
                  value={formImage}
                  onChange={() => {}}
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-lg bg-white border border-gray-250 px-4 py-2 text-gray-500 font-bold hover:bg-gray-100"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-650 px-5 py-2 text-white font-black uppercase hover:bg-indigo-750 cursor-pointer"
                >
                  Lưu Lại
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Categories Cards grid view */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((cat) => {
          // Find out if it is parent or child
          const isChild = !!cat.parentId;
          const parentName = categories.find((c) => c.id === cat.parentId)?.name;

          return (
            <div key={cat.id} className="bg-white border border-gray-150 rounded-xl overflow-hidden p-4 flex gap-4 hover:shadow-md transition">
              {/* Category thumbnail */}
              <div className="h-16 w-16 overflow-hidden rounded-lg bg-gray-50 border shrink-0">
                <img src={cat.image} alt={cat.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              </div>

              {/* Informative info */}
              <div className="flex-grow flex flex-col justify-between">
                <div>
                  <span className="font-extrabold text-gray-900 block text-xs">{cat.name}</span>
                  <span className="text-[10px] text-gray-400 mt-1 block font-mono bg-gray-50 p-0.5 px-1 rounded inline-block">{cat.id}</span>
                  
                  {isChild && (
                    <span className="block text-[9.5px] text-indigo-650 bg-indigo-50 px-1.5 py-0.2 rounded font-bold mt-1.5 inline-block">
                      Con của: {parentName}
                    </span>
                  )}
                </div>

                <div className="flex gap-1.5 justify-end mt-2">
                  <button
                    onClick={() => handleOpenEdit(cat)}
                    className="p-1 px-2 border rounded hover:bg-gray-150 text-gray-400 hover:text-indigo-600 transition"
                  >
                    Sửa
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm('Chắc chắn xóa danh mục này?')) {
                        dispatch(deleteCategoryAsync(cat.id));
                      }
                    }}
                    className="p-1 px-2 border border-red-100 rounded hover:bg-red-50 text-red-400 hover:text-red-750 transition"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

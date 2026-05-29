import React, { useState, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '../../redux/hooks';
import { createCouponAsync, updateCouponAsync, deleteCouponAsync, createBannerAsync, updateBannerAsync, deleteBannerAsync } from '../../redux/shopSlice';
import { Coupon, Banner } from '../../types';
import { Plus, Edit, Trash, X, Save, Ticket, Image, Sparkles, UploadCloud, Loader2, AlertCircle, Trash2 } from 'lucide-react';
import api from '../../utils/api';

export const AdminPromotions: React.FC = () => {
  const dispatch = useAppDispatch();
  const coupons = useAppSelector((state) => state.shop.coupons);
  const banners = useAppSelector((state) => state.shop.banners);

  const [activePromTab, setActivePromTab] = useState<'coupons' | 'banners'>('coupons');

  // Coupon form triggers
  const [isCouponFormOpen, setIsCouponFormOpen] = useState(false);
  const [isCouponAdd, setIsCouponAdd] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const [formInCode, setFormInCode] = useState('');
  const [formInType, setFormInType] = useState<'percent' | 'fixed'>('percent');
  const [formInVal, setFormInVal] = useState(0);
  const [formInMinOrder, setFormInMinOrder] = useState(0);
  const [formInExpiry, setFormInExpiry] = useState('');
  const [formInActive, setFormInActive] = useState(true);

  // Banner form triggers
  const [isBannerFormOpen, setIsBannerFormOpen] = useState(false);
  const [isBannerAdd, setIsBannerAdd] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  const [formInTitle, setFormInTitle] = useState('');
  const [formInSubtitle, setFormInSubtitle] = useState('');
  const [formInImg, setFormInImg] = useState('');
  const [formInLink, setFormInLink] = useState('');
  const [formInBannerActive, setFormInBannerActive] = useState(true);

  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const [isImgUploading, setIsImgUploading] = useState(false);
  const [imgUploadError, setImgUploadError] = useState<string | null>(null);

  const handleBannerImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImgUploading(true);
    setImgUploadError(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFormInImg(res.data.url);
    } catch {
      setImgUploadError('Tải ảnh banner lên thất bại. Vui lòng thử lại!');
    } finally {
      setIsImgUploading(false);
      if (bannerFileInputRef.current) bannerFileInputRef.current.value = '';
    }
  };

  const handleRemoveBannerImage = async () => {
    const imgUrl = formInImg;
    setFormInImg('');
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

  const formatVND = (num: number) => {
    return num.toLocaleString('vi-VN') + ' ₫';
  };

  // 1. Coupon Submissions
  const handleOpenCouponAdd = () => {
    setIsCouponAdd(true);
    setEditingCoupon(null);
    setFormInCode('');
    setFormInType('percent');
    setFormInVal(10);
    setFormInMinOrder(200000);
    setFormInExpiry('2026-12-31');
    setFormInActive(true);
    setIsCouponFormOpen(true);
  };

  const handleOpenCouponEdit = (c: Coupon) => {
    setIsCouponAdd(false);
    setEditingCoupon(c);
    setFormInCode(c.code);
    setFormInType(c.type);
    setFormInVal(c.value);
    setFormInMinOrder(c.minOrder);
    setFormInExpiry(c.expiryDate);
    setFormInActive(c.active);
    setIsCouponFormOpen(true);
  };

  const handleCouponFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formInCode || formInVal <= 0) return;

    const payload = {
      code: formInCode.toUpperCase(),
      type: formInType,
      value: Number(formInVal),
      minOrder: Number(formInMinOrder),
      expiryDate: formInExpiry,
      active: formInActive,
      usageLimit: 100,
    };

    if (isCouponAdd) {
      dispatch(createCouponAsync(payload));
    } else if (editingCoupon) {
      dispatch(updateCouponAsync({ id: editingCoupon.id, payload }));
    }

    setIsCouponFormOpen(false);
  };

  // 2. Banner Submissions
  const handleOpenBannerAdd = () => {
    setIsBannerAdd(true);
    setEditingBanner(null);
    setFormInTitle('');
    setFormInSubtitle('');
    setFormInImg('');
    setFormInLink('');
    setFormInBannerActive(true);
    setIsBannerFormOpen(true);
    setImgUploadError(null);
  };

  const handleOpenBannerEdit = (b: Banner) => {
    setIsBannerAdd(false);
    setEditingBanner(b);
    setFormInTitle(b.title);
    setFormInSubtitle(b.subtitle || '');
    setFormInImg(b.image);
    setFormInLink(b.link);
    setFormInBannerActive(b.active);
    setIsBannerFormOpen(true);
    setImgUploadError(null);
  };

  const handleBannerFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formInTitle || !formInImg) return;

    const payload = {
      title: formInTitle,
      subtitle: formInSubtitle || '',
      image: formInImg,
      link: formInLink,
      active: formInBannerActive,
    };

    if (isBannerAdd) {
      dispatch(createBannerAsync(payload));
    } else if (editingBanner) {
      dispatch(updateBannerAsync({ id: editingBanner.id, payload }));
    }

    setIsBannerFormOpen(false);
  };

  return (
    <div className="space-y-6 font-sans text-xs">
      
      {/* Upper Navigation Prom Tabs */}
      <div className="flex border-b border-gray-150">
        <button
          onClick={() => setActivePromTab('coupons')}
          className={`flex items-center gap-1.5 py-3 px-4 text-xs font-bold uppercase tracking-wider transition border-b-2 cursor-pointer ${
            activePromTab === 'coupons' ? 'border-gray-950 text-gray-950' : 'border-transparent text-gray-400 hover:text-gray-700'
          }`}
        >
          <Ticket className="h-4 w-4" />
          Mã Giảm Giá (Coupons)
        </button>
        <button
          onClick={() => setActivePromTab('banners')}
          className={`flex items-center gap-1.5 py-3 px-4 text-xs font-bold uppercase tracking-wider transition border-b-2 cursor-pointer ${
            activePromTab === 'banners' ? 'border-gray-950 text-gray-950' : 'border-transparent text-gray-400 hover:text-gray-700'
          }`}
        >
          <Image className="h-4 w-4" />
          Banners Quảng Cáo Home
        </button>
      </div>

      {/* 1. COUPON PORTLET */}
      {activePromTab === 'coupons' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white border border-gray-150 rounded-xl p-4 shadow-xs">
            <div>
              <span className="font-bold text-gray-800 text-sm block">Quản lý mã giảm giá ưu đãi</span>
              <span className="text-[10.5px] text-gray-400 mt-1 block">Tạo mới, chỉnh sửa và quản lý các tham số mã chiết khấu.</span>
            </div>

            <button
              onClick={handleOpenCouponAdd}
              className="flex items-center gap-1 rounded-lg bg-indigo-650 px-4 py-2 font-black text-white hover:bg-indigo-750 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Tạo Mã Giảm Giá Mới
            </button>
          </div>

          {/* Coupon Form Modal */}
          {isCouponFormOpen && (
            <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setIsCouponFormOpen(false)} />
              <div className="relative w-full max-w-sm bg-white rounded-xl shadow-2xl p-6 border border-gray-150 z-10 space-y-4 text-xs">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <span className="text-xs font-black uppercase text-gray-500 tracking-wider">
                    {isCouponAdd ? 'Tạo mã voucher mới' : 'Cập nhật mã voucher'}
                  </span>
                  <button onClick={() => setIsCouponFormOpen(false)} className="p-1 rounded-full text-gray-400">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleCouponFormSubmit} className="space-y-4 font-medium">
                  <div>
                    <label className="block text-gray-400 font-bold mb-1 uppercase tracking-wider">Mã Giảm Giá *</label>
                    <input
                      type="text"
                      required
                      value={formInCode}
                      onChange={(e) => setFormInCode(e.target.value.toUpperCase())}
                      placeholder="Mã: ECOM20"
                      className="w-full rounded-lg border border-gray-250 px-3.5 py-2 font-bold focus:border-indigo-505 uppercase"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-400 font-bold mb-1 uppercase tracking-wider">Kiểu chiết khấu *</label>
                      <select
                        value={formInType}
                        onChange={(e) => setFormInType(e.target.value as any)}
                        className="w-full rounded-lg border border-gray-250 px-3 py-2 font-bold"
                      >
                        <option value="percent">Phần trăm (%)</option>
                        <option value="fixed">Số tiền cố định (VND)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-400 font-bold mb-1 uppercase tracking-wider">Mức Giảm Giá *</label>
                      <input
                        type="number"
                        required
                        value={formInVal}
                        onChange={(e) => setFormInVal(Number(e.target.value))}
                        className="w-full rounded-lg border border-gray-250 px-3.5 py-2 font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-400 font-bold mb-1 uppercase tracking-wider">Hạn mức đơn hàng tối thiểu (VND)</label>
                    <input
                      type="number"
                      required
                      value={formInMinOrder}
                      onChange={(e) => setFormInMinOrder(Number(e.target.value))}
                      className="w-full rounded-lg border border-gray-250 px-3.5 py-2 font-bold font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 font-bold mb-1 uppercase tracking-wider">Ngày hết hạn *</label>
                    <input
                      type="date"
                      required
                      value={formInExpiry}
                      onChange={(e) => setFormInExpiry(e.target.value)}
                      className="w-full rounded-lg border border-gray-250 px-3.5 py-2 font-bold"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-750 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={formInActive}
                      onChange={(e) => setFormInActive(e.target.checked)}
                      className="rounded border-gray-300 text-indigo-650"
                    />
                    <span>Kích hoạt mã chạy khả dụng ngay lúc này</span>
                  </label>

                  <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
                    <button
                      type="button"
                      onClick={() => setIsCouponFormOpen(false)}
                      className="rounded-lg bg-white border border-gray-250 px-4 py-2 text-gray-500 font-bold"
                    >
                      Bỏ qua
                    </button>
                    <button
                      type="submit"
                      className="rounded-lg bg-indigo-650 px-5 py-2 text-white font-black uppercase hover:bg-indigo-750"
                    >
                      Xác Nhận Lưu
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Coupons spread lists */}
          <div className="bg-white border border-gray-150 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-gray-500">
                <thead className="bg-gray-50 text-[10.5px] text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-4">Mã Voucher</th>
                    <th className="px-4">Kiểu và Số Giá trị giảm</th>
                    <th className="px-4">Mức đơn tối thiểu</th>
                    <th className="px-4">Số lượt đã dùng</th>
                    <th className="px-4">Ngày Hết Hạn</th>
                    <th className="px-4 text-right">Lựa chọn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                  {coupons.map((c) => {
                    const isExp = new Date(c.expiryDate).getTime() < Date.now();
                    
                    return (
                      <tr key={c.id} className="hover:bg-gray-55/40">
                        {/* Code string design */}
                        <td className="py-3.5 px-4">
                          <span className="font-black text-gray-900 block font-mono bg-amber-50 rounded p-1 px-2 border border-amber-150 inline-block text-center">{c.code}</span>
                        </td>

                        {/* Cost value reduction details */}
                        <td className="px-4">
                          {c.type === 'percent' ? (
                            <span className="font-bold text-indigo-650 block">Chiết khấu phẳng {c.value} %</span>
                          ) : (
                            <span className="font-bold text-indigo-650 block">Trừ trực tiếp {formatVND(c.value)}</span>
                          )}
                        </td>

                        {/* Minimum required orders */}
                        <td className="px-4">
                          <span className="font-bold font-mono">{formatVND(c.minOrder)}</span>
                        </td>

                        {/* Usages statistics counters */}
                        <td className="px-4">
                          <span className="font-bold text-gray-800">{c.usageCount} lượt áp dụng</span>
                        </td>

                        {/* Expiry dates */}
                        <td className="px-4">
                          <span className={`font-semibold ${isExp ? 'text-red-500 line-through' : 'text-gray-900'}`}>{c.expiryDate}</span>
                          {isExp && <span className="text-[10px] text-red-500 block font-normal mt-0.5">(Đã qúa hạn)</span>}
                        </td>

                        {/* Action buttons */}
                        <td className="px-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleOpenCouponEdit(c)}
                              className="p-1 px-2.5 border rounded-lg hover:bg-gray-100 text-gray-400 hover:text-indigo-600 transition"
                            >
                              Sửa
                            </button>
                            <button
                              onClick={() => {
                              if (window.confirm('Xác nhận xóa mã giảm giá này khỏi hệ thống?')) {
                                  dispatch(deleteCouponAsync(c.id));
                                }
                              }}
                              className="p-1 px-2.5 border border-red-100 rounded-lg hover:bg-red-55 text-red-400 hover:text-red-750 transition"
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. HOME BANNERS PORTLET */}
      {activePromTab === 'banners' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white border border-gray-150 rounded-xl p-4 shadow-xs">
            <div>
              <span className="font-bold text-gray-800 text-sm block">Quản lý Banners trang chủ chiến dịch</span>
              <span className="text-[10.5px] text-gray-400 mt-1 block">Xoay chuyển các nội dung trượt và chiến mã quảng cáo hiển thị.</span>
            </div>

            <button
              onClick={handleOpenBannerAdd}
              className="flex items-center gap-1 rounded-lg bg-indigo-650 px-4 py-2 font-black text-white hover:bg-indigo-750 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Tạo Banner Quảng Cáo Mới
            </button>
          </div>

          {/* Banner Form Modal */}
          {isBannerFormOpen && (
            <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setIsBannerFormOpen(false)} />
              <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl p-6 border border-gray-150 z-10 space-y-4 text-xs font-medium">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <span className="text-xs font-black uppercase text-gray-500 tracking-wider">
                    {isBannerAdd ? 'Tạo Banner slide mới' : 'Cập nhật Banner slide'}
                  </span>
                  <button onClick={() => setIsBannerFormOpen(false)} className="p-1 rounded-full text-gray-400">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleBannerFormSubmit} className="space-y-4">
                  <div>
                    <label className="block text-gray-400 font-bold mb-1 uppercase tracking-wider">Tiêu Đề Lớn Banner *</label>
                    <input
                      type="text"
                      required
                      value={formInTitle}
                      onChange={(e) => setFormInTitle(e.target.value)}
                      placeholder="BLACK FRIDAY - GIẢM ĐẬM"
                      className="w-full rounded-lg border border-gray-250 px-3.5 py-2 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 font-bold mb-1 uppercase tracking-wider">Ghi Chú Phụ / Nội dung slogan</label>
                    <input
                      type="text"
                      value={formInSubtitle}
                      onChange={(e) => setFormInSubtitle(e.target.value)}
                      placeholder="Ưu đãi đón chào mùa cưới..."
                      className="w-full rounded-lg border border-gray-250 px-3.5 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 font-bold mb-2 uppercase tracking-wider">
                      Hình Ảnh Đại Diện Cover (Banner) *
                    </label>
                    
                    {/* Drag & Drop Area */}
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={async (e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file && file.type.startsWith('image/')) {
                          setIsImgUploading(true);
                          setImgUploadError(null);
                          try {
                            const formData = new FormData();
                            formData.append('image', file);
                            const res = await api.post('/upload', formData, {
                              headers: { 'Content-Type': 'multipart/form-data' },
                            });
                            setFormInImg(res.data.url);
                          } catch {
                            setImgUploadError('Tải ảnh banner thất bại. Vui lòng thử lại!');
                          } finally {
                            setIsImgUploading(false);
                          }
                        }
                      }}
                      className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-4 transition min-h-[150px] text-center ${
                        formInImg
                          ? 'border-indigo-200 bg-indigo-50/10'
                          : 'border-gray-350 hover:border-indigo-500 hover:bg-indigo-50/20'
                      }`}
                    >
                      {isImgUploading ? (
                        <div className="flex flex-col items-center gap-2 py-4">
                          <Loader2 className="h-8 w-8 animate-spin text-indigo-650" />
                          <span className="text-[10px] font-bold text-gray-500">Đang tải ảnh banner lên...</span>
                        </div>
                      ) : formInImg ? (
                        <div className="relative w-full flex flex-col items-center gap-3">
                          <div className="relative w-full aspect-[21/9] overflow-hidden rounded-lg border border-gray-150 shadow-sm bg-gray-50 max-h-[120px]">
                            <img
                              src={formInImg}
                              alt="Banner Preview"
                              className="h-full w-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => bannerFileInputRef.current?.click()}
                              className="px-2.5 py-1 text-[10px] font-extrabold text-indigo-650 bg-indigo-50 rounded hover:bg-indigo-100 transition cursor-pointer"
                            >
                              Thay đổi ảnh
                            </button>
                            <button
                              type="button"
                              onClick={handleRemoveBannerImage}
                              className="px-2.5 py-1 text-[10px] font-extrabold text-red-500 bg-red-50 rounded hover:bg-red-100 transition flex items-center gap-0.5 cursor-pointer"
                            >
                              <Trash2 className="h-3 w-3" />
                              Xóa
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => bannerFileInputRef.current?.click()}
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
                              Hỗ trợ JPG, PNG, WEBP tối đa 5MB (Khuyến nghị tỷ lệ rộng 1200x500)
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Hidden file input */}
                      <input
                        ref={bannerFileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleBannerImageUpload}
                      />
                    </div>

                    {imgUploadError && (
                      <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-red-500">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {imgUploadError}
                      </div>
                    )}
                    
                    {/* Hidden input to enforce HTML5 validation if required */}
                    <input
                      type="hidden"
                      required
                      value={formInImg}
                      onChange={() => {}}
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 font-bold mb-1 uppercase tracking-wider">Mã phân tách hoặc liên kết click điều hướng (Link)</label>
                    <input
                      type="text"
                      value={formInLink}
                      onChange={(e) => setFormInLink(e.target.value)}
                      placeholder="e.g. cat-elec (hoặc mã danh mục để lọc)"
                      className="w-full rounded-lg border border-gray-250 px-3.5 py-2"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-750 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={formInBannerActive}
                      onChange={(e) => setFormInBannerActive(e.target.checked)}
                      className="rounded border-gray-300 text-indigo-650"
                    />
                    <span>Kích cho hiển thị Banner này trượt trên trang chủ</span>
                  </label>

                  <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
                    <button
                      type="button"
                      onClick={() => setIsBannerFormOpen(false)}
                      className="rounded-lg bg-white border border-gray-250 px-4 py-2 text-gray-500 font-bold"
                    >
                      Bỏ qua
                    </button>
                    <button
                      type="submit"
                      className="rounded-lg bg-indigo-650 px-5 py-2 text-white font-black uppercase hover:bg-indigo-750"
                    >
                      Xác Nhận Thiết Lập
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Banners split grid listings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {banners.map((ban) => (
              <div key={ban.id} className="bg-white border border-gray-150 rounded-xl overflow-hidden shadow-xs hover:border-indigo-600 transition flex flex-col justify-between">
                <div className="relative aspect-[31/15] bg-gray-50">
                  <img src={ban.image} alt={ban.title} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  
                  {ban.active ? (
                    <span className="absolute left-3 top-3 bg-green-500 text-white rounded px-2 py-0.5 text-[9px] uppercase font-bold">
                      Hiển thị trượt
                    </span>
                  ) : (
                    <span className="absolute left-3 top-3 bg-red-400 text-white rounded px-2 py-0.5 text-[9px] uppercase font-bold">
                      Ẩn băng rôn
                    </span>
                  )}
                </div>

                <div className="p-4 space-y-3 flex-grow flex flex-col justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm text-gray-950 block">{ban.title}</h4>
                    <p className="text-[11px] text-gray-400 leading-normal block mt-1.5">{ban.subtitle}</p>
                    {ban.link && <p className="text-[10px] text-indigo-600 mt-2 font-mono">Chuyển hướng: {ban.link}</p>}
                  </div>

                  <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
                    <button
                      onClick={() => handleOpenBannerEdit(ban)}
                      className="p-1 px-3 border rounded text-gray-500 hover:bg-gray-100 font-bold transition"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Xác nhận xóa banner này khỏi danh sách?')) {
                          dispatch(deleteBannerAsync(ban.id));
                        }
                      }}
                      className="p-1 px-3 border border-red-100 text-red-400 hover:bg-red-54/40 rounded font-bold transition"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

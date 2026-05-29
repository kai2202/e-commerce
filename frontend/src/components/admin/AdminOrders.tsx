import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../redux/hooks';
import { updateOrderStatus, fetchAllOrders } from '../../redux/orderSlice';
import { fetchProducts } from '../../redux/shopSlice';
import { Order } from '../../types';
import { Package, Search, Filter, CheckCircle, Clock, XCircle, ChevronDown, Save, Eye, Printer, X } from 'lucide-react';

export const AdminOrders: React.FC = () => {
  const dispatch = useAppDispatch();
  const orders = useAppSelector((state) => state.order.orders);
  
  const [activeTab, setActiveTab] = useState<Order['status'] | 'all'>('all');
  const [filterQuery, setFilterQuery] = useState('');
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    dispatch(fetchAllOrders());
  }, [dispatch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, filterQuery]);

  const formatVND = (num: number) => {
    return num.toLocaleString('vi-VN') + ' ₫';
  };

  const handleStatusTransition = (orderId: string, currentStatus: Order['status'], action: 'approve' | 'deliver' | 'cancel') => {
    const doUpdate = (newStatus: Order['status']) => {
      dispatch(updateOrderStatus({ orderId, status: newStatus }))
        .unwrap()
        .then((res) => {
          if (res.success) {
            // Luôn đồng bộ lại cả đơn hàng và sản phẩm từ DB
            dispatch(fetchAllOrders());
            dispatch(fetchProducts());
          }
        });
    };

    if (action === 'approve') {
      doUpdate('shipping');
    } else if (action === 'deliver') {
      doUpdate('completed');
    } else if (action === 'cancel') {
      if (window.confirm('Xác nhận hủy đơn hàng này?')) {
        doUpdate('cancelled');
      }
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    if (activeTab !== 'all' && o.status !== activeTab) return false;
    
    if (filterQuery) {
      const q = filterQuery.toLowerCase();
      const inId = o.id.toLowerCase().includes(q);
      const inName = o.customerName.toLowerCase().includes(q);
      const inPhone = o.customerPhone.includes(q);
      if (!inId && !inName && !inPhone) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 font-sans text-xs">
      
      {/* Printed Invoice Popout Modal Simulator */}
      {printingOrder && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setPrintingOrder(null)} />
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl p-6.5 border border-gray-150 z-10 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Control buttons */}
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 noprint">
              <span className="text-xs font-black uppercase text-gray-500 tracking-wider">Mẫu In Phiếu Giao Nhận Hàng</span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="flex items-center gap-1 bg-gray-900 text-white rounded px-3 py-1 text-xs font-bold hover:bg-gray-800"
                >
                  <Printer className="h-3.5 w-3.5" />
                  In Phiếu
                </button>
                <button onClick={() => setPrintingOrder(null)} className="p-1 rounded-full text-gray-400 hover:bg-gray-100">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Print Target Sheet layout */}
            <div id="invoice-print-sheet" className="p-4 bg-white text-gray-900 border border-gray-100 rounded-lg space-y-6">
              <div className="text-center space-y-1">
                <h4 className="text-sm font-black uppercase tracking-widest text-indigo-700">TỔNG CÔNG TY E-MARKET VIỆT NAM</h4>
                <p className="text-[10px] text-gray-400">Địa chỉ: 123 Lê Lợi, Bến Thành, Quận 1, TP Hồ Chí Minh — SĐT: 0901234567</p>
                <div className="border-b-2 border-dashed border-gray-400 my-4"></div>
                <h3 className="text-base font-black uppercase tracking-wider">HÓA ĐƠN GIAO KIÊM SỐ PHIẾU NHẬN HÀNG</h3>
                <p className="text-[10px] text-gray-400 mt-1">SỐ ĐƠN: <b>{printingOrder.id}</b> — ĐẶT NGÀY: <b>{new Date(printingOrder.date).toLocaleString('vi-VN')}</b></p>
              </div>

              {/* Shipping info */}
              <div className="space-y-1 border border-gray-150 p-3 rounded text-[11px] font-medium leading-relaxed">
                <div className="grid grid-cols-4">
                  <span className="font-bold text-gray-500">Người nhận:</span>
                  <span className="col-span-3 font-bold text-gray-905">{printingOrder?.customerName}</span>
                </div>
                <div className="grid grid-cols-4">
                  <span className="font-bold text-gray-500">Điện thoại:</span>
                  <span className="col-span-3 font-mono font-bold text-gray-905">{printingOrder?.customerPhone}</span>
                </div>
                <div className="grid grid-cols-4 col-span-3">
                  <span className="font-bold text-gray-500 text-left">Địa chỉ giao:</span>
                  <span className="col-span-3 text-gray-800 font-bold">{printingOrder?.shippingAddress.street}, {printingOrder?.shippingAddress.city}</span>
                </div>
                <div className="grid grid-cols-4 col-span-3">
                  <span className="font-bold text-gray-500 text-left">Nhà vận chuyển:</span>
                  <span className="col-span-3 text-gray-800 font-bold">{printingOrder?.courier}</span>
                </div>
              </div>

              {/* Items lists */}
              <div className="space-y-3">
                <table className="w-full text-xs text-left">
                  <thead className="border-b border-gray-300 uppercase tracking-widest text-[9px] text-gray-400">
                    <tr>
                      <th className="py-2">Tên Mặt Hàng</th>
                      <th className="text-center">Số lượng</th>
                      <th className="text-center">Màu/Size</th>
                      <th className="text-right">Đơn giá</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {printingOrder?.items.map((it, idx) => (
                      <tr key={idx} className="text-gray-900 text-[10.5px]">
                        <td className="py-2.5 font-bold">{it.name}</td>
                        <td className="text-center">{it.quantity}</td>
                        <td className="text-center">{it.selectedColor} - {it.selectedSize}</td>
                        <td className="text-right font-bold">{formatVND(it.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Calculations footer details */}
              <div className="border-t-2 border-dashed border-gray-400 pt-4 space-y-1.5 text-xs text-right">
                <div className="flex justify-between font-medium">
                  <span className="text-gray-400">Tạm tính:</span>
                  <span>{formatVND(printingOrder.subTotal)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-gray-400">Phí vận chuyển:</span>
                  <span>{printingOrder.shippingFee === 0 ? 'Miễn phí' : formatVND(printingOrder.shippingFee)}</span>
                </div>
                {printingOrder.discountAmount > 0 && (
                  <div className="flex justify-between font-bold text-red-500">
                    <span>Khấu trừ mã giảm giá ( {printingOrder.couponCode} ):</span>
                    <span>-{formatVND(printingOrder.discountAmount)}</span>
                  </div>
                )}
                <div className="border-t border-gray-300 pt-2 flex justify-between font-black text-sm">
                  <span>TỔNG DOANH SỐ QUY KHÁCH TRẢ:</span>
                  <span className="text-rose-600 font-black">{formatVND(printingOrder.total)}</span>
                </div>
              </div>

              {/* Barcode Mockups and bottom signoffs */}
              <div className="flex flex-col items-center justify-center pt-8 border-t border-gray-150 space-y-2">
                {/* Simulated vertical line barcode lines */}
                <div className="flex gap-0.5 h-10 items-stretch bg-white px-2">
                  {Array.from({ length: 28 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="bg-black shrink-0"
                      style={{ width: `${(idx % 3 === 0) ? '3px' : (idx % 2 === 0) ? '1px' : '2px'}` }}
                    />
                  ))}
                </div>
                <span className="text-[9px] font-mono tracking-widest uppercase text-gray-400 block">{printingOrder.id}</span>
                <span className="text-[10px] italic text-gray-500 block text-center mt-3">Xin chân thành cảm ơn quý khách hàng đã ủng hộ chúng tôi!</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Orders stats summary tab row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white border border-gray-150 rounded-xl p-4 shadow-xs">
        
        {/* Status filtering Tabs selectors */}
        <div className="flex flex-wrap gap-1 bg-gray-50 p-1 rounded-lg">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'pending', label: 'Chờ xử lý' },
            { id: 'shipping', label: 'Đang vận chuyển' },
            { id: 'completed', label: 'Đã hoàn tất' },
            { id: 'cancelled', label: 'Đã hủy' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`px-3 py-1.5 rounded text-xs font-semibold cursor-pointer transition ${
                activeTab === item.id ? 'bg-white text-gray-900 shadow-xs ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Search Input filter by code/customer name */}
        <div className="relative max-w-xs w-full self-start sm:self-auto">
          <input
            type="text"
            placeholder="Tìm theo: Đơn hàng, Tên khách..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-250 py-1.5 pl-3 pr-8 font-semibold"
          />
          <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-gray-400" />
        </div>
      </div>

      {/* Primary orders spreadsheet database grid */}
      <div className="bg-white border border-gray-150 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-gray-500">
            <thead className="bg-gray-50 text-[10.5px] text-gray-400 uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="py-3 px-4">Đơn Hàng</th>
                <th className="px-4">Khách Hàng</th>
                <th className="px-4">Ngày Đặt Đơn</th>
                <th className="px-4">Số Thành Tiền</th>
                <th className="px-4">Trạng Thái</th>
                <th className="px-4 text-right">Lựa Chọn Xử Lý</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-705">
              {paginatedOrders.length > 0 ? (
                paginatedOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-gray-50/50">
                    {/* Code ID and quantity summary */}
                    <td className="py-3.5 px-4">
                      <span className="font-extrabold text-indigo-705 block">{ord.id}</span>
                      <span className="text-[10px] text-gray-400 block mt-0.5">{ord.items.length} mặt hàng khác nhau</span>
                    </td>

                    {/* Customer basic contact */}
                    <td className="px-4 leading-normal">
                      <span className="font-bold text-gray-900 block">{ord.customerName}</span>
                      <span className="text-[10px] text-gray-400 block font-mono mt-0.5">{ord.customerPhone}</span>
                    </td>

                    {/* Timestamp */}
                    <td className="px-4">
                      <span className="text-gray-800">{new Date(ord.date).toLocaleDateString('vi-VN')}</span>
                      <span className="text-[10px] text-gray-400 block mt-0.5 font-mono">{new Date(ord.date).toLocaleTimeString('vi-VN')}</span>
                    </td>

                    {/* Cost totals */}
                    <td className="px-4">
                      <span className="font-extrabold text-rose-500 block">{formatVND(ord.total)}</span>
                      <span className="text-[9.5px] text-gray-400 block font-semibold uppercase">{ord.paymentMethod}</span>
                    </td>

                    {/* Status badges */}
                    <td className="px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        ord.status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-250' :
                        ord.status === 'shipping' ? 'bg-indigo-50 text-indigo-600 border border-indigo-250' :
                        ord.status === 'completed' ? 'bg-green-50 text-green-600 border border-green-250' :
                        'bg-red-50 text-red-650 border border-red-250'
                      }`}>
                        {ord.status === 'pending' ? 'HÀNG ĐỢI DUYỆT' :
                         ord.status === 'shipping' ? 'ĐANG GIAO' :
                         ord.status === 'completed' ? 'ĐÃ HOÀN TẤT' : 'ĐÃ HỦY'}
                      </span>
                    </td>

                    {/* Process switches and actions */}
                    <td className="px-4 text-right">
                      <div className="flex gap-1.5 justify-end">
                        {/* Print Invoice trigger */}
                        <button
                          onClick={() => setPrintingOrder(ord)}
                          className="p-1 px-2 border rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 transition cursor-pointer"
                        >
                          <Printer className="h-3.5 w-3.5 inline mr-0.5" />
                          Phiếu In
                        </button>

                        {/* Transition button from Pending -> Shipping */}
                        {ord.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusTransition((ord as any)._id || ord.id, ord.status, 'approve')}
                              className="p-1 px-2 border border-green-200 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 font-bold transition cursor-pointer"
                            >
                              Duyệt Đơn
                            </button>
                            <button
                              onClick={() => handleStatusTransition((ord as any)._id || ord.id, ord.status, 'cancel')}
                              className="p-1 px-2 border border-red-150 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 font-bold transition cursor-pointer"
                            >
                              Hủy Đơn
                            </button>
                          </>
                        )}

                        {/* Transition from Shipping -> Completed */}
                        {ord.status === 'shipping' && (
                          <button
                            onClick={() => handleStatusTransition((ord as any)._id || ord.id, ord.status, 'deliver')}
                            className="p-1 px-2 border border-indigo-200 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-650 font-bold transition cursor-pointer"
                          >
                            Xác Nhận Đã Giao
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    Không ghi nhận vận chuyển đơn hàng nào phù hợp với bộ lọc hiện thời.
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
                    {Math.min(currentPage * itemsPerPage, filteredOrders.length)}
                  </span>{' '}
                  trong <span className="font-bold text-gray-900">{filteredOrders.length}</span> đơn hàng
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

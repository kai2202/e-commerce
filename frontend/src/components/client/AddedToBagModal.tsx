import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../redux/hooks';
import { setAddedToBagOpen } from '../../redux/uiSlice';
import { X, Check } from 'lucide-react';

export const AddedToBagModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const isOpen = useAppSelector((state) => state.ui.isAddedToBagOpen);
  const item = useAppSelector((state) => state.ui.addedToBagItem);
  const cart = useAppSelector((state) => state.cart.cart);

  const cartTotalQty = cart.reduce((sum, i) => sum + i.quantity, 0);

  const handleClose = () => {
    dispatch(setAddedToBagOpen(false));
  };

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        dispatch(setAddedToBagOpen(false));
      }, 7000); // Auto close after 7s
      return () => clearTimeout(timer);
    }
  }, [isOpen, dispatch]);

  if (!isOpen || !item) return null;

  const formatVND = (num: number) => {
    return num.toLocaleString('vi-VN') + ' ₫';
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center md:justify-end items-center md:items-start p-4 bg-black/40 animate-fade-in">
      {/* Backdrop close triggers click outside */}
      <div className="fixed inset-0" onClick={handleClose} />

      {/* Main Nike Popup Container */}
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 flex flex-col space-y-4 animate-scale-up z-10 md:mt-16 md:mr-16">
        
        {/* Header: Tick and Close X */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-green-600 flex items-center justify-center text-white shrink-0">
              <Check className="h-3 w-3 stroke-[3]" />
            </div>
            <span className="font-display text-xs font-black uppercase tracking-wider text-black">Added to Bag</span>
          </div>
          <button
            onClick={handleClose}
            className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-50 hover:bg-gray-150 transition cursor-pointer text-gray-500 hover:text-black focus:outline-none"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Product Information Grid */}
        <div className="flex gap-4 items-start pt-2">
          {/* Product Image */}
          <div className="h-20 w-20 bg-gray-50 overflow-hidden shrink-0 border border-gray-100 rounded-lg">
            <img 
              src={item.image} 
              alt={item.name} 
              className="h-full w-full object-cover" 
              referrerPolicy="no-referrer" 
            />
          </div>

          {/* Texts Info */}
          <div className="flex-grow min-w-0">
            <h4 className="font-display text-xs font-black uppercase tracking-tight text-black line-clamp-1 leading-snug">
              {item.name}
            </h4>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mt-0.5">
              {item.brand}
            </span>
            <span className="text-[10.5px] text-gray-500 font-medium block mt-1 leading-none">
              Size: {item.size} • {item.color}
            </span>
            <span className="text-xs font-black font-display text-black block mt-2">
              {formatVND(item.price)}
            </span>
          </div>
        </div>

        {/* Action Buttons Stack (Nike rounded-full styling) */}
        <div className="flex flex-col gap-2 pt-2">
          {/* Button View Bag */}
          <button
            type="button"
            onClick={() => {
              handleClose();
              navigate('/cart');
            }}
            className="w-full h-12 rounded-full border border-gray-300 hover:border-black bg-white transition cursor-pointer font-display text-[10.5px] font-black uppercase tracking-widest text-black flex items-center justify-center"
          >
            View Bag ({cartTotalQty})
          </button>

          {/* Button Checkout */}
          <button
            type="button"
            onClick={() => {
              handleClose();
              navigate('/checkout');
            }}
            className="w-full h-12 rounded-full bg-black hover:bg-black/90 text-white transition cursor-pointer font-display text-[10.5px] font-black uppercase tracking-widest flex items-center justify-center shadow-sm"
          >
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

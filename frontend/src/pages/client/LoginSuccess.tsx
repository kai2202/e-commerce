import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch } from '../../redux/hooks';
import { setCredentials } from '../../redux/authSlice';
import { setAuthModalOpen } from '../../redux/uiSlice';
import { Loader2, AlertTriangle } from 'lucide-react';

export const LoginSuccess: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const isProfileIncomplete = searchParams.get('isProfileIncomplete');
    const tempToken = searchParams.get('tempToken');

    if (isProfileIncomplete === 'true' && tempToken) {
      localStorage.setItem('ecom_temp_token', tempToken);
      dispatch(setAuthModalOpen(true));
      navigate('/');
      return;
    }

    const token = searchParams.get('token');
    const userString = searchParams.get('user');

    if (!token || !userString) {
      setErrorMsg('Thiếu thông tin xác thực đăng nhập từ hệ thống.');
      return;
    }

    try {
      const user = JSON.parse(decodeURIComponent(userString));
      
      // Dispatch to Redux (stores user data & token, which also updates localStorage via slice)
      dispatch(setCredentials({ user, token }));
      
      // Close the Auth modal if open
      dispatch(setAuthModalOpen(false));

      // Show success briefly, then redirect
      const timer = setTimeout(() => {
        if (user.role === 'admin' || user.role === 'staff_inventory') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      }, 1500);

      return () => clearTimeout(timer);
    } catch (err) {
      console.error('Failed to parse user query param:', err);
      setErrorMsg('Dữ liệu người dùng không hợp lệ.');
    }
  }, [dispatch, navigate, searchParams]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-[#FDFBF7] px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-xl">
        {errorMsg ? (
          <div className="space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Đăng Nhập Thất Bại</h2>
            <p className="text-sm text-gray-500">{errorMsg}</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 transition cursor-pointer"
            >
              Quay lại Trang Chủ
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="relative mx-auto flex h-16 w-16 items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-gray-800">Đăng Nhập Thành Công!</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Đang thiết lập phiên đăng nhập và đồng bộ hóa giỏ hàng của bạn. Vui lòng đợi trong giây lát...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

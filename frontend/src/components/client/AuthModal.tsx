import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../redux/hooks';
import { login as loginAction, register as registerAction, googleRegisterAction, completePhoneAction } from '../../redux/authSlice';
import { setAuthModalOpen } from '../../redux/uiSlice';
import { X, Lock, Mail, User as UserIcon, Phone, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AuthModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.isAuthOpen);
  const onClose = () => dispatch(setAuthModalOpen(false));
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'complete-phone'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [completePassword, setCompletePassword] = useState('');
  const [completeConfirmPassword, setCompleteConfirmPassword] = useState('');
  const [tempToken, setTempToken] = useState<string | null>(null);
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const switchMode = (newMode: typeof mode) => {
    setMode(newMode);
    setErrorMsg('');
    setSuccessMsg('');
  };

  useEffect(() => {
    if (isOpen && mode === 'register') {
      const renderGoogleBtn = () => {
        const google = (window as any).google;
        if (google?.accounts?.id) {
          google.accounts.id.initialize({
            client_id: "799038862187-imu2fur77kd8kn4f5vd500c391n4rg9v.apps.googleusercontent.com",
            callback: (response: any) => {
              handleGoogleSignup(response.credential);
            }
          });
          google.accounts.id.renderButton(
            document.getElementById("google-signup-btn"),
            { theme: "outline", size: "large", width: 320 }
          );
        }
      };

      if ((window as any).google?.accounts?.id) {
        renderGoogleBtn();
      } else {
        const interval = setInterval(() => {
          if ((window as any).google?.accounts?.id) {
            renderGoogleBtn();
            clearInterval(interval);
          }
        }, 100);
        return () => clearInterval(interval);
      }
    }
  }, [isOpen, mode]);

  useEffect(() => {
    if (isOpen) {
      const savedTempToken = localStorage.getItem('ecom_temp_token');
      if (savedTempToken) {
        setTempToken(savedTempToken);
        setMode('complete-phone');
        localStorage.removeItem('ecom_temp_token');
      }
    } else {
      setPhone('');
      setCompletePassword('');
      setCompleteConfirmPassword('');
      setTempToken(null);
      setMode('login');
    }
  }, [isOpen]);

  const handleGoogleSignup = (credential: string) => {
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    dispatch(googleRegisterAction({ token: credential }))
      .unwrap()
      .then((res) => {
        setIsLoading(false);
        if (res.success) {
          const data = res.data;
          if (data.exists && !data.isProfileIncomplete) {
            setSuccessMsg('Đăng nhập thành công!');
            setTimeout(() => {
              onClose();
              if (data.user.role === 'admin' || data.user.role === 'staff_inventory') {
                navigate('/admin');
              }
            }, 1000);
          } else if (data.isProfileIncomplete) {
            setTempToken(data.token);
            setMode('complete-phone');
          } else {
            setSuccessMsg('Đăng ký tài khoản thành công!');
            setTimeout(() => onClose(), 1000);
          }
        } else {
          setErrorMsg(res.message);
        }
      })
      .catch(() => {
        setIsLoading(false);
        setErrorMsg('Lỗi kết nối. Vui lòng thử lại!');
      });
  };

  const handleCompletePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!phone) {
      setErrorMsg('Vui lòng nhập số điện thoại!');
      return;
    }

    if (!completePassword) {
      setErrorMsg('Vui lòng đặt mật khẩu tài khoản!');
      return;
    }

    if (completePassword.length < 6) {
      setErrorMsg('Mật khẩu phải có ít nhất 6 ký tự!');
      return;
    }

    if (completePassword !== completeConfirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không trùng khớp!');
      return;
    }

    if (!tempToken) {
      setErrorMsg('Phiên đăng ký đã hết hạn. Vui lòng thử lại!');
      setMode('register');
      return;
    }

    setIsLoading(true);
    dispatch(completePhoneAction({ phone, password: completePassword, tempToken }))
      .unwrap()
      .then((res) => {
        setIsLoading(false);
        if (res.success) {
          setSuccessMsg('Đăng ký tài khoản thành công!');
          setTimeout(() => {
            onClose();
            setPhone('');
            setCompletePassword('');
            setCompleteConfirmPassword('');
            setTempToken(null);
            setMode('login');
          }, 1000);
        } else {
          setErrorMsg(res.message);
        }
      })
      .catch(() => {
        setIsLoading(false);
        setErrorMsg('Lỗi kết nối. Vui lòng thử lại!');
      });
  };

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !password) {
      setErrorMsg('Vui lòng nhập đầy đủ thông tin!');
      return;
    }

    setIsLoading(true);
    dispatch(loginAction({ email, password }))
      .unwrap()
      .then((res) => {
        if (res.success) {
          setSuccessMsg(res.message);
          setTimeout(() => {
            onClose();
            setEmail('');
            setPassword('');
            setIsLoading(false);
            if (res.role === 'admin' || res.role === 'staff_inventory') {
              navigate('/admin');
            }
          }, 1000);
        } else {
          setErrorMsg(res.message);
          setIsLoading(false);
        }
      })
      .catch(() => {
        setErrorMsg('Lỗi kết nối đến máy chủ. Vui lòng thử lại!');
        setIsLoading(false);
      });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !password || !name || !phone) {
      setErrorMsg('Vui lòng điền đầy đủ các trường thông tin!');
      return;
    }

    setIsLoading(true);
    dispatch(registerAction({ email, password, name, phone }))
      .unwrap()
      .then((res) => {
        if (res.success) {
          setSuccessMsg(res.message);
          setTimeout(() => {
            onClose();
            setName('');
            setPhone('');
            setEmail('');
            setPassword('');
            setIsLoading(false);
          }, 1000);
        } else {
          setErrorMsg(res.message);
          setIsLoading(false);
        }
      })
      .catch(() => {
        setErrorMsg('Lỗi kết nối đến máy chủ. Vui lòng thử lại!');
        setIsLoading(false);
      });
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email) {
      setErrorMsg('Vui lòng nhập email của bạn!');
      return;
    }

    setSuccessMsg('Một hướng dẫn lấy lại mật khẩu đã được gửi đến email của bạn.');
    setTimeout(() => {
      setMode('login');
      setEmail('');
    }, 2500);
  };

  const handleGoogleLogin = () => {
    const apiBaseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    window.location.href = `${apiBaseURL}/auth/google`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />
      
      {/* Modal Box */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl transition-all border border-gray-100">
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-gray-100 px-6">
          <h3 className="font-sans text-lg font-semibold text-gray-900">
            {mode === 'login' && 'Đăng Nhập Tài Khoản'}
            {mode === 'register' && 'Đăng Ký Tài Khoản'}
            {mode === 'forgot' && 'Khôi Phục Mật Khẩu'}
            {mode === 'complete-phone' && 'Bổ Sung Số Điện Thoại'}
          </h3>
          <button 
            onClick={onClose} 
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-600">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Địa Chỉ Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4.5 w-4.5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-gray-500">Mật Khẩu</label>
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="text-xs font-medium text-indigo-600 hover:underline"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4.5 w-4.5 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 transition duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
              </button>

              <div className="text-center text-xs text-gray-500">
                Chưa có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="font-semibold text-indigo-600 hover:underline"
                >
                  Đăng ký ngay
                </button>
              </div>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink mx-4 text-gray-400 text-xs font-medium">Hoặc tiếp tục với</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-2.5 rounded-lg border border-gray-200 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition duration-150 cursor-pointer shadow-2xs"
                >
                  <svg className="h-4.5 w-4.5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.9h6.6c-.28 1.5-1.11 2.76-2.39 3.62v3h3.86c2.26-2.09 3.56-5.17 3.56-8.77z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.86-3c-1.08.72-2.45 1.16-4.1 1.16-3.15 0-5.81-2.13-6.76-5.01H1.36v3.1A11.98 11.98 0 0 0 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.24 14.24a7.19 7.19 0 0 1 0-4.48v-3.1H1.36a11.98 11.98 0 0 0 0 10.68l3.88-3.1z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43A11.96 11.96 0 0 0 12 0 11.98 11.98 0 0 0 1.36 6.66l3.88 3.1c.95-2.88 3.61-5.01 6.76-5.01z"
                    />
                  </svg>
                  Đăng nhập bằng tài khoản Google
                </button>
              </div>
            </form>
          )}

          {mode === 'register' && (
            <div className="space-y-6 flex flex-col items-center">
              <p className="text-xs text-gray-500 text-center leading-relaxed">
                Để đảm bảo tính bảo mật và nhanh chóng, chúng tôi chỉ hỗ trợ đăng ký tài khoản mới bằng tài khoản Google.
              </p>
              
              <div className="w-full flex justify-center py-2">
                <div id="google-signup-btn"></div>
              </div>

              <div className="text-center text-xs text-gray-500 w-full border-t border-gray-100 pt-4">
                Đã có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="font-semibold text-indigo-600 hover:underline"
                >
                  Đăng nhập ngay
                </button>
              </div>
            </div>
          )}

          {mode === 'complete-phone' && (
            <form onSubmit={handleCompletePhoneSubmit} className="space-y-4">
              <p className="text-xs text-gray-500 leading-relaxed">
                Chào mừng bạn! Vui lòng nhập số điện thoại và thiết lập mật khẩu để hoàn tất việc kích hoạt tài khoản của bạn.
              </p>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Số Điện Thoại</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4.5 w-4.5 text-gray-400" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0912xxxxxx"
                    className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Mật Khẩu Mới</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4.5 w-4.5 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={completePassword}
                    onChange={(e) => setCompletePassword(e.target.value)}
                    placeholder="•••••••• (Tối thiểu 6 ký tự)"
                    className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Xác Nhận Mật Khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4.5 w-4.5 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={completeConfirmPassword}
                    onChange={(e) => setCompleteConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 transition duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Đang xử lý...' : 'Hoàn tất đăng ký'}
              </button>
            </form>
          )}

          {mode === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-4">
              <p className="text-xs text-gray-500 leading-relaxed">
                Nhập email của bạn và chúng tôi sẽ gửi hướng dẫn khôi phục mật khẩu trong giây lát.
              </p>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Địa Chỉ Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4.5 w-4.5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 transition duration-150 cursor-pointer"
              >
                Gửi Yêu Cầu
              </button>

              <div className="text-center text-xs text-gray-500">
                Quay lại{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="font-semibold text-indigo-600 hover:underline"
                >
                  Đăng nhập
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

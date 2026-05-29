import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw, Home, ChevronDown, ChevronRight, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  isGlobal?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });
    // Có thể mở rộng để log lỗi lên backend ở đây nếu cần thiết
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { isGlobal } = this.props;
      const errorMsg = this.state.error?.toString() || 'Đã xảy ra lỗi không xác định.';
      const componentStack = this.state.errorInfo?.componentStack || '';

      const content = (
        <div className="flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto">
          {/* Icon Section */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-red-100 rounded-full blur-xl opacity-70 animate-pulse"></div>
            <div className="relative bg-white p-4 rounded-full shadow-md border border-red-50">
              <ShieldAlert className="h-16 w-16 text-red-500" />
            </div>
          </div>

          {/* Heading */}
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#1A1A1A] mb-3">
            Ốp! Đã xảy ra sự cố hệ thống
          </h2>
          <p className="text-gray-600 mb-8 max-w-md">
            Một phần của ứng dụng đã gặp lỗi không mong muốn trong quá trình xử lý dữ liệu. Chúng tôi rất tiếc vì sự bất tiện này.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8 w-full sm:w-auto">
            <button
              onClick={this.handleReset}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#E07A5F] hover:bg-[#d06e53] text-white font-medium rounded-lg transition-all shadow-sm hover:shadow active:scale-95"
            >
              <RefreshCw className="h-4 w-4" />
              Thử tải lại ứng dụng
            </button>
            <button
              onClick={this.handleGoHome}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-[#1A1A1A] font-medium rounded-lg transition-all shadow-sm hover:shadow active:scale-95"
            >
              <Home className="h-4 w-4 text-gray-500" />
              Quay về Trang chủ
            </button>
          </div>

          {/* Technical Details Toggle */}
          <div className="w-full text-left bg-white border border-gray-100 rounded-lg shadow-sm overflow-hidden">
            <button
              onClick={() => this.setState({ showDetails: !this.state.showDetails })}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100/80 transition-colors border-b border-gray-100 font-medium text-sm text-gray-700"
            >
              <span className="flex items-center gap-2">
                <AlertOctagon className="h-4 w-4 text-amber-500" />
                Chi tiết kỹ thuật (Dành cho nhà phát triển)
              </span>
              {this.state.showDetails ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
            </button>

            {this.state.showDetails && (
              <div className="p-4 bg-gray-900 text-gray-300 font-mono text-xs overflow-auto max-h-60 leading-relaxed selection:bg-gray-700 selection:text-white">
                <p className="text-red-400 font-bold mb-2 break-all">{errorMsg}</p>
                <pre className="whitespace-pre-wrap">{componentStack}</pre>
              </div>
            )}
          </div>
        </div>
      );

      if (isGlobal) {
        return (
          <div className="min-h-screen w-screen bg-[#FDFBF7] flex items-center justify-center p-4">
            {content}
          </div>
        );
      }

      return (
        <div className="py-12 bg-[#FDFBF7] rounded-xl border border-gray-100 my-6 shadow-sm">
          {content}
        </div>
      );
    }

    return this.props.children;
  }
}

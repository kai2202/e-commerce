import { VNPay, HashAlgorithm } from 'vnpay';

// Khởi tạo instance VNPay từ thư viện chính thức
const vnpay = new VNPay({
  tmnCode: process.env.VNP_TMN_CODE!,
  secureSecret: process.env.VNP_HASH_SECRET!,
  vnpayHost: 'https://sandbox.vnpayment.vn',
  testMode: true,                        // Sandbox/test environment
  hashAlgorithm: HashAlgorithm.SHA512,   // Thuật toán băm chữ ký
  enableLog: false,                      // Tắt log (ignoreLogger)
});


/**
 * Tạo URL thanh toán VNPAY bằng thư viện chính thức
 */
export const createVnpayPaymentUrl = (req: any, orderId: string, amount: number): string => {
  // Lấy và chuẩn hóa IP address sang định dạng IPv4 để tránh lỗi cổng thanh toán
  let ipAddr = req.headers['x-forwarded-for'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    '127.0.0.1';

  if (Array.isArray(ipAddr)) {
    ipAddr = ipAddr[0];
  }
  
  if (ipAddr.includes('::ffff:')) {
    ipAddr = ipAddr.split('::ffff:')[1];
  } else if (ipAddr === '::1') {
    ipAddr = '127.0.0.1';
  }

  return vnpay.buildPaymentUrl({
    vnp_Amount: amount, // Thư viện vnpay tự động nhân 100 để đổi sang xu/xu xuởng theo chuẩn VNPAY
    vnp_IpAddr: ipAddr,
    vnp_TxnRef: orderId,
    vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
    vnp_ReturnUrl: process.env.VNP_RETURN_URL!,
  });
};

/**
 * Xác thực chữ ký số (Checksum) trả về từ VNPAY bằng thư viện chính thức
 */
export const verifyVnpaySignature = (queryParams: any): boolean => {
  try {
    // Thư viện tự động lọc vnp_SecureHash, sắp xếp và băm kiểm tra chữ ký số
    const result = vnpay.verifyReturnUrl(queryParams);
    return result.isVerified;
  } catch (error) {
    return false;
  }
};

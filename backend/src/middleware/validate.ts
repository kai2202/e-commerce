import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

/**
 * Middleware trung gian để kiểm tra kết quả xác thực.
 * Nếu có lỗi, trả về mã trạng thái 400 cùng cấu trúc { message, errors }.
 */
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorArray = errors.array();
    return res.status(400).json({
      message: errorArray[0].msg, // Thông báo lỗi đầu tiên để hiển thị trên UI
      errors: errorArray          // Danh sách đầy đủ lỗi chi tiết
    });
  }
  next();
};

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

// Middleware xử lý lỗi toàn cục
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.status || err.statusCode || 500;

  // Ghi log lỗi chi tiết qua Winston
  logger.error(
    `${req.method} ${req.originalUrl} - Mã lỗi ${statusCode} - ${err.stack || err.message}`
  );

  // Trả về JSON chuẩn hóa cho client
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Lỗi hệ thống xảy ra ở máy chủ.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

console.log('Starting server...');
import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import morgan from 'morgan';
import connectDB from './config/db';
import logger from './utils/logger';
import { errorHandler } from './middleware/errorMiddleware';

dotenv.config();

// Capture Uncaught Exceptions & Unhandled Rejections
process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}\nStack: ${error.stack}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason: any) => {
  logger.error(`Unhandled Rejection: ${reason?.message || reason}\nStack: ${reason?.stack}`);
});

// Startup Environment Variables Validation
const REQUIRED_ENV_VARS = [
  'MONGO_URI',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'SESSION_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_CALLBACK_URL',
  'FRONTEND_URL',
  'VNP_TMN_CODE',
  'VNP_HASH_SECRET',
  'VNP_URL',
  'VNP_RETURN_URL'
];

const validateEnv = () => {
  const missing = REQUIRED_ENV_VARS.filter(envVar => !process.env[envVar]);
  if (missing.length > 0) {
    console.error('❌ LỖI KHỞI ĐỘNG: Thiếu các biến môi trường bắt buộc sau:');
    missing.forEach(envVar => console.error(`   - ${envVar}`));
    console.error('Ứng dụng dừng hoạt động để bảo vệ an toàn hệ thống.');
    process.exit(1);
  }
};

validateEnv();

connectDB();

const app = express();

// Configure Morgan request logging with Winston stream
const morganMiddleware = morgan(
  process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
  {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  }
);
app.use(morganMiddleware);

// Dynamic CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce',
    collectionName: 'sessions',
    ttl: 5 * 60 // 5 minutes in seconds
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 5 * 60 * 1000 // 5 minutes
  }
}));

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import productRoutes from './routes/productRoutes';
import orderRoutes from './routes/orderRoutes';
import categoryRoutes from './routes/categoryRoutes';
import promoRoutes from './routes/promoRoutes';
import uploadRoutes from './routes/uploadRoutes';
import { googleLogin, googleCallback } from './controllers/authController';

app.get('/auth/google', googleLogin);
app.get('/auth/google/callback', googleCallback);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/promos', promoRoutes);
app.use('/api/upload', uploadRoutes);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/uploads/products', express.static(path.join(__dirname, '../uploads/products')));

app.get('/api', (req, res) => {
  res.send('E-commerce API is running...');
});

// Global Error Handler Middleware (must be registered after all routes)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

import express from 'express';
import { authUser, registerUser, getUsers, refreshUser, logoutUser, googleLogin, googleCallback, googleRegister, updatePhone } from '../controllers/authController';
import { protect, admin } from '../middleware/authMiddleware';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validate';

const router = express.Router();

// Định nghĩa regex cho số điện thoại di động Việt Nam
const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Tên không được để trống'),
    body('email').trim().isEmail().withMessage('Email không hợp lệ').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Mật khẩu phải chứa ít nhất 6 ký tự'),
    body('phone').trim().matches(phoneRegex).withMessage('Số điện thoại không hợp lệ (phải gồm 10 chữ số tại Việt Nam)'),
    validateRequest
  ],
  registerUser
);

router.post(
  '/login',
  [
    body('email').trim().isEmail().withMessage('Email không hợp lệ').normalizeEmail(),
    body('password').notEmpty().withMessage('Mật khẩu không được để trống'),
    validateRequest
  ],
  authUser
);

router.post('/refresh', refreshUser);
router.post('/logout', logoutUser);
router.get('/users', protect, admin, getUsers);
router.get('/google', googleLogin);
router.get('/google/callback', googleCallback);
router.post('/google-register', googleRegister);

router.put(
  '/update-phone',
  [
    body('phone').trim().matches(phoneRegex).withMessage('Số điện thoại không hợp lệ (phải gồm 10 chữ số tại Việt Nam)'),
    body('password').isLength({ min: 6 }).withMessage('Mật khẩu phải chứa ít nhất 6 ký tự'),
    validateRequest
  ],
  updatePhone
);

export default router;


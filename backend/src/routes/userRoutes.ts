import express from 'express';
import { getUserProfile, updateUserProfile, addAddress, updateAddress, deleteAddress, getCartAndWishlist, syncCartAndWishlist } from '../controllers/userController';
import { protect } from '../middleware/authMiddleware';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validate';

const router = express.Router();

const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;

router.route('/profile')
  .get(protect, getUserProfile)
  .put(
    protect,
    [
      body('name').optional().trim().notEmpty().withMessage('Tên không được để trống'),
      body('phone').optional({ checkFalsy: true }).trim().matches(phoneRegex).withMessage('Số điện thoại không hợp lệ (phải gồm 10 chữ số tại Việt Nam)'),
      body('password').optional({ checkFalsy: true }).isLength({ min: 6 }).withMessage('Mật khẩu mới phải chứa ít nhất 6 ký tự'),
      validateRequest
    ],
    updateUserProfile
  );

router.route('/address')
  .post(
    protect,
    [
      body('name').trim().notEmpty().withMessage('Tên người nhận không được để trống'),
      body('phone').trim().matches(phoneRegex).withMessage('Số điện thoại không hợp lệ (phải gồm 10 chữ số tại Việt Nam)'),
      body('street').trim().notEmpty().withMessage('Địa chỉ chi tiết không được để trống'),
      body('city').trim().notEmpty().withMessage('Tỉnh/Thành phố không được để trống'),
      validateRequest
    ],
    addAddress
  );

router.route('/address/:id')
  .put(
    protect,
    [
      body('name').optional().trim().notEmpty().withMessage('Tên người nhận không được để trống'),
      body('phone').optional().trim().matches(phoneRegex).withMessage('Số điện thoại không hợp lệ (phải gồm 10 chữ số tại Việt Nam)'),
      body('street').optional().trim().notEmpty().withMessage('Địa chỉ chi tiết không được để trống'),
      body('city').optional().trim().notEmpty().withMessage('Tỉnh/Thành phố không được để trống'),
      validateRequest
    ],
    updateAddress)
  .delete(protect, deleteAddress);

router.route('/cart-wishlist')
  .get(protect, getCartAndWishlist)
  .put(protect, syncCartAndWishlist);

export default router;


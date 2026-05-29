import express from 'express';
import { addOrderItems, getOrderById, updateOrderStatus, getMyOrders, getOrders, cancelOrder, vnpayReturn, vnpayIpn } from '../controllers/orderController';
import { protect, optionalProtect, staffOrAdmin } from '../middleware/authMiddleware';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validate';

const router = express.Router();

const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;

router.route('/')
  .post(
    optionalProtect,
    [
      body('items').isArray({ min: 1 }).withMessage('Giỏ hàng không được để trống'),
      body('totalAmount').isFloat({ min: 0 }).withMessage('Tạm tính phải là số lớn hơn hoặc bằng 0'),
      body('shippingFee').isFloat({ min: 0 }).withMessage('Phí giao hàng phải là số lớn hơn hoặc bằng 0'),
      body('finalAmount').isFloat({ min: 0 }).withMessage('Tổng cộng phải là số lớn hơn hoặc bằng 0'),
      body('shippingAddress').isObject().withMessage('Địa chỉ giao hàng không hợp lệ'),
      body('shippingAddress.name').trim().notEmpty().withMessage('Tên người nhận không được để trống'),
      body('shippingAddress.phone').trim().matches(phoneRegex).withMessage('Số điện thoại người nhận không hợp lệ (phải gồm 10 chữ số tại Việt Nam)'),
      body('shippingAddress.street').trim().notEmpty().withMessage('Địa chỉ giao hàng không được để trống'),
      body('shippingAddress.city').trim().notEmpty().withMessage('Tỉnh/Thành phố giao hàng không được để trống'),
      body('paymentMethod').trim().notEmpty().withMessage('Phương thức thanh toán không được để trống'),
      body('customerEmail')
        .if((value: any, { req }: any) => !req.user)
        .isEmail().withMessage('Email khách vãng lai không hợp lệ (phải đúng định dạng email)'),
      validateRequest
    ],
    addOrderItems
  )
  .get(protect, staffOrAdmin, getOrders);

router.route('/myorders').get(protect, getMyOrders);

router.route('/vnpay_return').get(optionalProtect, vnpayReturn);
router.route('/vnpay_ipn').get(optionalProtect, vnpayIpn);

router.route('/:id').get(optionalProtect, getOrderById);
router.route('/:id/status').put(protect, staffOrAdmin, updateOrderStatus);
router.route('/:id/cancel').put(optionalProtect, cancelOrder);

export default router;


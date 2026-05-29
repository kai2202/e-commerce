import express from 'express';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct, getProductFilters } from '../controllers/productController';
import { getProductReviews, createProductReview } from '../controllers/reviewController';
import { protect, staffOrAdmin } from '../middleware/authMiddleware';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validate';

const router = express.Router();

const productValidationRules = [
  body('name').trim().notEmpty().withMessage('Tên sản phẩm không được để trống'),
  body('brand').trim().notEmpty().withMessage('Thương hiệu không được để trống'),
  body('categoryId').trim().notEmpty().withMessage('Danh mục không được để trống'),
  body('originalPrice').isFloat({ min: 0 }).withMessage('Giá gốc phải là số lớn hơn hoặc bằng 0'),
  body('discountPrice').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('Giá khuyến mãi phải là số lớn hơn hoặc bằng 0'),
  body('description').trim().notEmpty().withMessage('Mô tả sản phẩm không được để trống'),
  validateRequest
];

router.route('/')
  .get(getProducts)
  .post(protect, staffOrAdmin, productValidationRules, createProduct);

router.get('/filters', getProductFilters);

router.route('/:productId/reviews')
  .get(getProductReviews)
  .post(protect, createProductReview);

router.route('/:id')
  .get(getProductById)
  .put(protect, staffOrAdmin, productValidationRules, updateProduct)
  .delete(protect, staffOrAdmin, deleteProduct);

export default router;


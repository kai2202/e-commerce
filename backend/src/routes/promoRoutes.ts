import express from 'express';
import { 
  getCoupons, createCoupon, updateCoupon, deleteCoupon,
  getBanners, createBanner, updateBanner, deleteBanner 
} from '../controllers/promoController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

// Coupons
router.route('/coupons')
  .get(getCoupons)
  .post(protect, admin, createCoupon);

router.route('/coupons/:id')
  .put(protect, admin, updateCoupon)
  .delete(protect, admin, deleteCoupon);

// Banners
router.route('/banners')
  .get(getBanners)
  .post(protect, admin, createBanner);

router.route('/banners/:id')
  .put(protect, admin, updateBanner)
  .delete(protect, admin, deleteBanner);

export default router;

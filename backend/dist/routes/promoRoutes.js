"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const promoController_1 = require("../controllers/promoController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Coupons
router.route('/coupons')
    .get(promoController_1.getCoupons)
    .post(authMiddleware_1.protect, authMiddleware_1.admin, promoController_1.createCoupon);
router.route('/coupons/:id')
    .put(authMiddleware_1.protect, authMiddleware_1.admin, promoController_1.updateCoupon)
    .delete(authMiddleware_1.protect, authMiddleware_1.admin, promoController_1.deleteCoupon);
// Banners
router.route('/banners')
    .get(promoController_1.getBanners)
    .post(authMiddleware_1.protect, authMiddleware_1.admin, promoController_1.createBanner);
router.route('/banners/:id')
    .put(authMiddleware_1.protect, authMiddleware_1.admin, promoController_1.updateBanner)
    .delete(authMiddleware_1.protect, authMiddleware_1.admin, promoController_1.deleteBanner);
exports.default = router;

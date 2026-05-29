"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBanner = exports.updateBanner = exports.createBanner = exports.getBanners = exports.deleteCoupon = exports.updateCoupon = exports.createCoupon = exports.getCoupons = void 0;
const Coupon_1 = __importDefault(require("../models/Coupon"));
const Banner_1 = __importDefault(require("../models/Banner"));
// --- COUPON CONTROLLERS ---
const getCoupons = async (req, res) => {
    try {
        const coupons = await Coupon_1.default.find({});
        res.json(coupons);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getCoupons = getCoupons;
const createCoupon = async (req, res) => {
    try {
        const coupon = new Coupon_1.default(req.body);
        const createdCoupon = await coupon.save();
        res.status(201).json(createdCoupon);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.createCoupon = createCoupon;
const updateCoupon = async (req, res) => {
    try {
        const coupon = await Coupon_1.default.findById(req.params.id);
        if (coupon) {
            Object.assign(coupon, req.body);
            const updatedCoupon = await coupon.save();
            res.json(updatedCoupon);
        }
        else {
            res.status(404).json({ message: 'Coupon not found' });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateCoupon = updateCoupon;
const deleteCoupon = async (req, res) => {
    try {
        const coupon = await Coupon_1.default.findById(req.params.id);
        if (coupon) {
            await Coupon_1.default.deleteOne({ _id: coupon._id });
            res.json({ message: 'Coupon removed' });
        }
        else {
            res.status(404).json({ message: 'Coupon not found' });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteCoupon = deleteCoupon;
// --- BANNER CONTROLLERS ---
const getBanners = async (req, res) => {
    try {
        const banners = await Banner_1.default.find({});
        res.json(banners);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getBanners = getBanners;
const createBanner = async (req, res) => {
    try {
        const banner = new Banner_1.default(req.body);
        const createdBanner = await banner.save();
        res.status(201).json(createdBanner);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.createBanner = createBanner;
const updateBanner = async (req, res) => {
    try {
        const banner = await Banner_1.default.findById(req.params.id);
        if (banner) {
            Object.assign(banner, req.body);
            const updatedBanner = await banner.save();
            res.json(updatedBanner);
        }
        else {
            res.status(404).json({ message: 'Banner not found' });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateBanner = updateBanner;
const deleteBanner = async (req, res) => {
    try {
        const banner = await Banner_1.default.findById(req.params.id);
        if (banner) {
            await Banner_1.default.deleteOne({ _id: banner._id });
            res.json({ message: 'Banner removed' });
        }
        else {
            res.status(404).json({ message: 'Banner not found' });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteBanner = deleteBanner;

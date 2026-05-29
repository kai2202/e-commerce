import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Review from '../models/Review';
import Product from '../models/Product';
import Order from '../models/Order';

// @desc    Get all reviews for a product
// @route   GET /api/products/:productId/reviews
// @access  Public
export const getProductReviews = async (req: Request, res: Response) => {
  try {
    const productId = req.params.productId as string;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      res.status(400).json({ message: 'ID sản phẩm không hợp lệ!' });
      return;
    }

    const reviews = await Review.find({ productId }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    console.error('getProductReviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a product review
// @route   POST /api/products/:productId/reviews
// @access  Private
export const createProductReview = async (req: Request, res: Response) => {
  try {
    const productId = req.params.productId as string;
    const { rating, comment } = req.body;
    
    // @ts-ignore
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: 'Yêu cầu đăng nhập để gửi đánh giá!' });
      return;
    }

    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ message: 'Điểm đánh giá phải từ 1 đến 5 sao!' });
      return;
    }

    if (!comment || !comment.trim()) {
      res.status(400).json({ message: 'Nội dung đánh giá không được để trống!' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      res.status(400).json({ message: 'ID sản phẩm không hợp lệ!' });
      return;
    }

    const product = await Product.findById(productId);
    if (!product) {
      res.status(404).json({ message: 'Sản phẩm không tồn tại!' });
      return;
    }

    // Kiểm tra xem người dùng đã đánh giá sản phẩm này chưa
    const alreadyReviewed = await Review.findOne({
      productId,
      userId: user._id
    });

    if (alreadyReviewed) {
      res.status(400).json({ message: 'Bạn đã gửi đánh giá cho sản phẩm này rồi!' });
      return;
    }

    // Kiểm tra đơn hàng xem người dùng đã mua sản phẩm này chưa (Verified Purchase)
    // Tìm một Order completed có chứa productId này của user
    const hasCompletedOrder = await Order.findOne({
      userId: user._id.toString(),
      status: 'completed',
      'items.productId': productId
    });

    const verifiedPurchase = !!hasCompletedOrder;

    const review = new Review({
      productId,
      userId: user._id,
      userName: user.name || 'Khách hàng',
      userAvatar: user.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
      rating: Number(rating),
      comment: comment.trim(),
      verifiedPurchase
    });

    const createdReview = await review.save();

    // Tính toán lại rating trung bình và tổng số lượng đánh giá cho sản phẩm
    const reviews = await Review.find({ productId });
    const ratingSum = reviews.reduce((sum, r) => sum + r.rating, 0);
    const ratingCount = reviews.length;
    const avgRating = ratingCount > 0 ? Number((ratingSum / ratingCount).toFixed(1)) : 0;

    await Product.findByIdAndUpdate(productId, {
      rating: avgRating,
      reviewCount: ratingCount
    });

    res.status(201).json(createdReview);
  } catch (error: any) {
    console.error('createProductReview error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

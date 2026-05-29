"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrders = exports.getMyOrders = exports.updateOrderStatus = exports.getOrderById = exports.addOrderItems = void 0;
const Order_1 = __importDefault(require("../models/Order"));
const Product_1 = __importDefault(require("../models/Product"));
const User_1 = __importDefault(require("../models/User"));
// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = async (req, res) => {
    try {
        const { items, totalAmount, shippingFee, discount, finalAmount, shippingAddress, paymentMethod, courier } = req.body;
        // @ts-ignore
        const user = req.user;
        if (!user) {
            res.status(401).json({ message: 'Yêu cầu đăng nhập để mua hàng!' });
            return;
        }
        if (items && items.length === 0) {
            res.status(400).json({ message: 'No order items' });
            return;
        }
        else {
            // Đồng bộ số điện thoại chính của user nếu số điện thoại hiện tại là mặc định
            const finalPhone = shippingAddress.phone || user.phone || '0900000000';
            if (user && (!user.phone || user.phone === '0000000000' || user.phone === 'N/A' || user.phone === 'Google Login')) {
                const dbUser = await User_1.default.findById(user._id);
                if (dbUser) {
                    dbUser.phone = finalPhone;
                    await dbUser.save();
                }
            }
            // Map đúng 100% các thuộc tính theo schema của Order.ts để tránh lỗi ValidationError
            const order = new Order_1.default({
                id: `ord-${Date.now()}`,
                userId: user._id.toString(),
                customerName: user.name || 'Khách hàng',
                customerEmail: user.email || 'customer@ecommerce.vn',
                customerPhone: finalPhone,
                items: items.map((item) => ({
                    productId: item.productId,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    image: item.image || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=150&auto=format&fit=crop&q=80',
                    selectedColor: item.selectedColor || 'Mặc định',
                    selectedSize: item.selectedSize || 'Tiêu chuẩn'
                })),
                subTotal: totalAmount,
                shippingFee: shippingFee || 0,
                discountAmount: discount || 0,
                total: finalAmount,
                paymentMethod,
                courier: courier || 'Giao Hàng Nhanh (GHN)',
                shippingAddress: {
                    id: shippingAddress.id || `addr-${Date.now()}`,
                    name: shippingAddress.name || user.name || 'Khách hàng',
                    phone: shippingAddress.phone || user.phone || '0900000000',
                    label: shippingAddress.label || 'Nhà riêng',
                    street: shippingAddress.street || shippingAddress.address || 'Địa chỉ mặc định',
                    city: shippingAddress.city || 'Thành phố mặc định'
                },
                status: 'pending',
                date: new Date().toISOString(),
                history: [{
                        status: 'pending',
                        note: 'Đơn hàng được đặt thành công bởi khách hàng',
                        date: new Date().toLocaleString('vi-VN')
                    }]
            });
            const createdOrder = await order.save();
            res.status(201).json(createdOrder);
        }
    }
    catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.addOrderItems = addOrderItems;
// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
    try {
        const orderId = req.params.id;
        let order = null;
        if (/^[0-9a-fA-F]{24}$/.test(orderId)) {
            order = await Order_1.default.findById(orderId);
        }
        if (!order) {
            order = await Order_1.default.findOne({ id: orderId });
        }
        if (order) {
            res.json(order);
        }
        else {
            res.status(404).json({ message: 'Order not found' });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getOrderById = getOrderById;
// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Staff
const updateOrderStatus = async (req, res) => {
    try {
        const orderId = req.params.id;
        const { status } = req.body;
        // 1. Kiểm tra sự tồn tại của đơn hàng (hỗ trợ cả ObjectId và custom String ID)
        let order = null;
        if (/^[0-9a-fA-F]{24}$/.test(orderId)) {
            order = await Order_1.default.findById(orderId);
        }
        if (!order) {
            order = await Order_1.default.findOne({ id: orderId });
        }
        if (!order) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng!' });
        }
        // 2. Nếu admin duyệt đơn hàng (chuyển trạng thái sang shipping)
        if (status === 'shipping') {
            // Đơn hàng bắt buộc phải ở trạng thái pending
            if (order.status !== 'pending') {
                return res.status(400).json({
                    message: `Không thể duyệt đơn hàng! Đơn hàng đang ở trạng thái "${order.status}" (không phải "pending").`
                });
            }
            // 3. Thực hiện trừ tồn kho sản phẩm trong database
            for (const item of order.items) {
                const product = await Product_1.default.findById(item.productId);
                if (product) {
                    const colorKey = item.selectedColor || 'Mặc định';
                    const sizeKey = item.selectedSize || 'Tiêu chuẩn';
                    // Tìm biến thể tương ứng
                    const variant = product.variants.find((v) => v.color === colorKey && v.size === sizeKey);
                    if (variant) {
                        // Kiểm tra số lượng tồn kho còn đủ hay không
                        if (variant.stock < item.quantity) {
                            return res.status(400).json({
                                message: `Lỗi duyệt đơn! Sản phẩm "${product.name}" (Màu: ${colorKey}, Size: ${sizeKey}) chỉ còn tồn ${variant.stock} chiếc, không đủ số lượng ${item.quantity} trong đơn hàng!`
                            });
                        }
                        variant.stock = Math.max(0, variant.stock - item.quantity);
                        product.salesCount = (product.salesCount || 0) + item.quantity;
                        product.markModified('variants');
                        await product.save();
                    }
                }
            }
            // 4. Thêm một dòng ghi chú lịch sử duyệt đơn hàng bởi Admin
            const currentTime = new Date().toLocaleString('vi-VN');
            const adminNote = `Đơn hàng được duyệt bởi Admin ngày ${currentTime}`;
            if (!order.history) {
                order.history = [];
            }
            order.history.push({
                status: 'shipping',
                note: adminNote,
                date: currentTime
            });
        }
        else {
            // Cập nhật log lịch sử cho các trạng thái khác (completed, cancelled)
            const currentTime = new Date().toLocaleString('vi-VN');
            let note = `Đơn hàng được cập nhật trạng thái sang "${status}" ngày ${currentTime}`;
            if (status === 'cancelled') {
                note = `Đơn hàng đã bị hủy ngày ${currentTime}`;
            }
            else if (status === 'completed') {
                note = `Đơn hàng đã giao thành công và hoàn tất ngày ${currentTime}`;
            }
            if (!order.history) {
                order.history = [];
            }
            order.history.push({
                status: status,
                note: note,
                date: currentTime
            });
        }
        // 5. Cập nhật trạng thái
        order.status = status;
        const updatedOrder = await order.save();
        // 6. Trả về response thành công
        res.status(200).json(updatedOrder);
    }
    catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.updateOrderStatus = updateOrderStatus;
// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
    try {
        // @ts-ignore
        const orders = await Order_1.default.find({ userId: req.user._id.toString() });
        res.json(orders);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getMyOrders = getMyOrders;
// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Staff
const getOrders = async (req, res) => {
    try {
        const orders = await Order_1.default.find({});
        res.json(orders);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getOrders = getOrders;

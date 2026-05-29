import { Request, Response } from 'express';
import Order from '../models/Order';
import Product from '../models/Product';
import User from '../models/User';
import { createVnpayPaymentUrl, verifyVnpaySignature } from '../utils/vnpay';
import logger from '../utils/logger';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const addOrderItems = async (req: Request, res: Response) => {
  try {
    const { items, totalAmount, shippingFee, discount, finalAmount, shippingAddress, paymentMethod, courier, customerEmail } = req.body;
    
    // @ts-ignore
    const user = req.user;

    if (items && items.length === 0) {
      res.status(400).json({ message: 'No order items' });
      return;
    }

    // 1. Giai đoạn Pre-check: Duyệt qua tất cả mặt hàng để kiểm tra hàng trong kho
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        res.status(400).json({ message: `Sản phẩm với ID ${item.productId} không tồn tại!` });
        return;
      }
      const color = item.selectedColor || 'Mặc định';
      const size = item.selectedSize || 'Tiêu chuẩn';

      const variant = product.variants.find(
        (v: any) => v.color === color && v.size === size
      );

      if (!variant) {
        res.status(400).json({
          message: `Biến thể (Màu: ${color}, Size: ${size}) của sản phẩm "${product.name}" không tồn tại!`
        });
        return;
      }

      if (variant.stock < item.quantity) {
        res.status(400).json({
          message: `Sản phẩm "${product.name}" (Màu: ${color}, Size: ${size}) không đủ số lượng trong kho! Hiện chỉ còn ${variant.stock} sản phẩm.`
        });
        return;
      }
    }

    // 2. Giai đoạn Atomic Updates: Trừ kho nguyên tử từng mặt hàng
    const updatedItems: { productId: string; color: string; size: string; quantity: number }[] = [];

    try {
      for (const item of items) {
        const color = item.selectedColor || 'Mặc định';
        const size = item.selectedSize || 'Tiêu chuẩn';

        const updateResult = await Product.updateOne(
          {
            _id: item.productId,
            variants: {
              $elemMatch: {
                color: color,
                size: size,
                stock: { $gte: item.quantity }
              }
            }
          },
          {
            $inc: {
              "variants.$[elem].stock": -item.quantity,
              salesCount: item.quantity
            }
          },
          {
            arrayFilters: [
              {
                "elem.color": color,
                "elem.size": size
              }
            ]
          }
        );

        if (updateResult.modifiedCount === 0) {
          throw new Error(`Đã có sự thay đổi về tồn kho cho sản phẩm "${item.name}". Vui lòng thử lại!`);
        }

        updatedItems.push({
          productId: item.productId,
          color,
          size,
          quantity: item.quantity
        });
      }
    } catch (err: any) {
      // Tự động Rollback hoàn trả kho hàng nếu có bất kỳ lỗi/tranh chấp nào xảy ra giữa chừng
      for (const rolled of updatedItems) {
        await Product.updateOne(
          {
            _id: rolled.productId
          },
          {
            $inc: {
              "variants.$[elem].stock": rolled.quantity,
              salesCount: -rolled.quantity
            }
          },
          {
            arrayFilters: [
              {
                "elem.color": rolled.color,
                "elem.size": rolled.size
              }
            ]
          }
        );
      }
      res.status(400).json({ message: err.message || 'Lỗi khi cập nhật kho hàng!' });
      return;
    }

    // Đồng bộ số điện thoại chính của user nếu số điện thoại hiện tại là mặc định
    const finalPhone = shippingAddress.phone || (user && user.phone) || '0900000000';
    if (user && (!user.phone || user.phone === '0000000000' || user.phone === 'N/A' || user.phone === 'Google Login')) {
      const dbUser = await User.findById(user._id);
      if (dbUser) {
        dbUser.phone = finalPhone;
        await dbUser.save();
      }
    }

    const finalEmail = user ? (user.email || 'customer@ecommerce.vn') : (customerEmail || 'guest@ecommerce.vn');
    const finalCustomerName = user ? (user.name || 'Khách hàng') : (shippingAddress.name || 'Khách vãng lai');

    // Map đúng 100% các thuộc tính theo schema của Order.ts để tránh lỗi ValidationError
    const order = new Order({
      userId: user ? user._id.toString() : 'guest',
      customerName: finalCustomerName,
      customerEmail: finalEmail,
      customerPhone: finalPhone,
      items: items.map((item: any) => ({
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
        name: shippingAddress.name || finalCustomerName,
        phone: shippingAddress.phone || finalPhone,
        label: shippingAddress.label || 'Nhà riêng',
        street: shippingAddress.street || shippingAddress.address || 'Địa chỉ mặc định',
        city: shippingAddress.city || 'Thành phố mặc định'
      },
      status: 'pending',
      date: new Date(),
      history: [{
        status: 'pending',
        note: user ? 'Đơn hàng được đặt thành công bởi khách hàng' : 'Đơn hàng vãng lai được đặt thành công',
        date: new Date()
      }]
    });

    const createdOrder = await order.save();

    if (paymentMethod === 'VNPAY') {
      // Tự động huỷ các đơn VNPAY cũ đang bị treo (pending + unpaid) của user này
      // Xử lý trường hợp mất mạng / đóng tab giữa chừng trước khi VNPAY có thể gọi return URL
      if (user) {
        const abandonedOrders = await Order.find({
          userId: user._id.toString(),
          paymentMethod: 'VNPAY',
          paymentStatus: 'unpaid',
          status: 'pending',
          _id: { $ne: createdOrder._id } // Không bao gồm đơn vừa tạo
        });

        for (const abandonedOrder of abandonedOrders) {
          // Hoàn trả kho hàng cho đơn treo
          for (const item of abandonedOrder.items) {
            const color = item.selectedColor || 'Mặc định';
            const size = item.selectedSize || 'Tiêu chuẩn';
            await Product.updateOne(
              { _id: item.productId },
              {
                $inc: {
                  'variants.$[elem].stock': item.quantity,
                  salesCount: -item.quantity
                }
              },
              {
                arrayFilters: [{ 'elem.color': color, 'elem.size': size }]
              }
            );
          }

          // Đánh dấu đơn treo là đã bị huỷ
          abandonedOrder.status = 'cancelled';
          abandonedOrder.paymentStatus = 'failed';
          abandonedOrder.history.push({
            status: 'cancelled',
            note: 'Đơn hàng VNPAY bị huỷ tự động do phiên thanh toán trước đó không hoàn tất (mất kết nối hoặc đóng trang).',
            date: new Date()
          });
          await abandonedOrder.save();
          logger.info(`Auto-cancelled abandoned VNPAY order ${abandonedOrder._id} for user ${user._id}`);
        }
      }

      const paymentUrl = createVnpayPaymentUrl(req, createdOrder._id.toString(), createdOrder.total);
      res.status(201).json({
        success: true,
        order: createdOrder,
        paymentUrl
      });
    } else {
      res.status(201).json(createdOrder);
    }
  } catch (error: any) {
    console.error('Order creation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req: Request | any, res: Response) => {
  try {
    const orderId = req.params.id as string;
    let order = null;
    if (/^[0-9a-fA-F]{24}$/.test(orderId)) {
      order = await Order.findById(orderId);
    }
    if (!order) {
      order = await Order.findOne({ id: orderId });
    }

    if (order) {
      const user = req.user;

      // 1. Nếu là Admin hoặc Staff, cho phép truy cập đầy đủ
      if (user && (user.role === 'admin' || user.role === 'staff_inventory')) {
        res.json(order);
        return;
      }

      // 2. Nếu đơn hàng thuộc về một khách hàng có tài khoản
      if (order.userId !== 'guest') {
        if (user && order.userId === user._id.toString()) {
          res.json(order);
        } else {
          res.status(403).json({ message: 'Bạn không có quyền truy cập thông tin đơn hàng này!' });
        }
        return;
      }

      // 3. Nếu là đơn hàng vãng lai (guest)
      const reqEmail = req.query.email || req.body.email;
      const reqPhone = req.query.phone || req.query.telephone || req.body.phone;

      if (reqEmail && reqPhone && 
          reqEmail.toString().toLowerCase() === order.customerEmail.toLowerCase() && 
          reqPhone.toString() === order.customerPhone) {
        res.json(order);
      } else {
        res.status(403).json({ message: 'Thông tin xác thực (Email/Số điện thoại) không khớp với đơn hàng vãng lai này!' });
      }
    } else {
      res.status(404).json({ message: 'Không tìm thấy đơn hàng!' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Staff
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const orderId = req.params.id as string;
    const { status } = req.body;

    // 1. Kiểm tra sự tồn tại của đơn hàng (hỗ trợ cả ObjectId và custom String ID)
    let order = null;
    if (/^[0-9a-fA-F]{24}$/.test(orderId)) {
      order = await Order.findById(orderId);
    }
    if (!order) {
      order = await Order.findOne({ id: orderId });
    }

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng!' });
    }

    // 2. Cập nhật lịch sử và thay đổi kho hàng theo trạng thái mới
    if (status === 'shipping') {
      // Đơn hàng bắt buộc phải ở trạng thái pending
      if (order.status !== 'pending') {
        return res.status(400).json({ 
          message: `Không thể duyệt đơn hàng! Đơn hàng đang ở trạng thái "${order.status}" (không phải "pending").` 
        });
      }

      // Thêm một dòng ghi chú lịch sử duyệt đơn hàng bởi Admin
      const currentTime = new Date().toLocaleString('vi-VN');
      const adminNote = `Đơn hàng được duyệt bởi Admin ngày ${currentTime}`;
      
      if (!order.history) {
        order.history = [] as any;
      }

      order.history.push({
        status: 'shipping',
        note: adminNote,
        date: new Date()
      });
    } else if (status === 'cancelled') {
      // Chỉ thực hiện hoàn kho nếu đơn hàng hiện tại chưa bị hủy
      if (order.status !== 'cancelled') {
        for (const item of order.items) {
          const color = item.selectedColor || 'Mặc định';
          const size = item.selectedSize || 'Tiêu chuẩn';

          await Product.updateOne(
            {
              _id: item.productId
            },
            {
              $inc: {
                "variants.$[elem].stock": item.quantity,
                salesCount: -item.quantity
              }
            },
            {
              arrayFilters: [
                {
                  "elem.color": color,
                  "elem.size": size
                }
              ]
            }
          );
        }
      }

      const currentTime = new Date().toLocaleString('vi-VN');
      const note = `Đơn hàng đã bị hủy ngày ${currentTime}. Hệ thống đã tự động hoàn trả số lượng hàng vào kho.`;

      if (!order.history) {
        order.history = [] as any;
      }

      order.history.push({
        status: 'cancelled',
        note: note,
        date: new Date()
      });
    } else {
      // Cập nhật log lịch sử cho các trạng thái khác (completed, v.v.)
      const currentTime = new Date().toLocaleString('vi-VN');
      let note = `Đơn hàng được cập nhật trạng thái sang "${status}" ngày ${currentTime}`;
      if (status === 'completed') {
        note = `Đơn hàng đã giao thành công và hoàn tất ngày ${currentTime}`;
      }

      if (!order.history) {
        order.history = [] as any;
      }

      order.history.push({
        status: status as string,
        note: note,
        date: new Date()
      });
    }

    // 5. Cập nhật trạng thái
    order.status = status;
    const updatedOrder = await order.save();

    // 6. Trả về response thành công
    res.status(200).json(updatedOrder);

  } catch (error: any) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const orders = await Order.find({ userId: req.user._id.toString() }).sort({ date: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Staff
export const getOrders = async (req: Request, res: Response) => {
  try {
    const orders = await Order.find({}).sort({ date: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Cancel order by customer
// @route   PUT /api/orders/:id/cancel
// @access  Private
export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const orderId = req.params.id as string;
    
    // @ts-ignore
    const user = req.user;

    let order = null;
    if (/^[0-9a-fA-F]{24}$/.test(orderId)) {
      order = await Order.findById(orderId);
    }
    if (!order) {
      order = await Order.findOne({ id: orderId });
    }

    if (!order) {
      res.status(404).json({ message: 'Không tìm thấy đơn hàng!' });
      return;
    }

    // Kiểm tra quyền sở hữu đơn hàng
    if (order.userId !== 'guest') {
      if (!user || order.userId !== user._id.toString()) {
        res.status(403).json({ message: 'Bạn không có quyền hủy đơn hàng này!' });
        return;
      }
    } else {
      // Guest order verification
      const reqEmail = req.body.email || req.query.email;
      const reqPhone = req.body.phone || req.query.phone;
      if (!reqEmail || !reqPhone || 
          reqEmail.toString().toLowerCase() !== order.customerEmail.toLowerCase() || 
          reqPhone.toString() !== order.customerPhone) {
        res.status(403).json({ message: 'Thông tin Email hoặc Số điện thoại xác thực không khớp với đơn hàng vãng lai này!' });
        return;
      }
    }

    // Chỉ được hủy ở trạng thái pending
    if (order.status !== 'pending') {
      res.status(400).json({ message: 'Đơn hàng đã được xử lý hoặc giao đi, không thể hủy!' });
      return;
    }

    // Hoàn kho hàng nguyên tử cho các sản phẩm
    for (const item of order.items) {
      const color = item.selectedColor || 'Mặc định';
      const size = item.selectedSize || 'Tiêu chuẩn';

      await Product.updateOne(
        {
          _id: item.productId
        },
        {
          $inc: {
            "variants.$[elem].stock": item.quantity,
            salesCount: -item.quantity
          }
        },
        {
          arrayFilters: [
            {
              "elem.color": color,
              "elem.size": size
            }
          ]
        }
      );
    }

    // Cập nhật trạng thái
    order.status = 'cancelled';
    const currentTime = new Date().toLocaleString('vi-VN');
    const note = user 
      ? `Đơn hàng đã tự động hủy bởi Khách hàng ngày ${currentTime}. Hệ thống đã tự động hoàn trả số lượng hàng vào kho.`
      : `Đơn hàng vãng lai đã tự động hủy ngày ${currentTime}. Hệ thống đã tự động hoàn trả số lượng hàng vào kho.`;

    if (!order.history) {
      order.history = [] as any;
    }

    order.history.push({
      status: 'cancelled',
      note,
      date: new Date()
    });

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error: any) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Hàm phụ xử lý trạng thái thanh toán và hoàn trả tồn kho VNPAY
 */
const processVnpayPayment = async (queryParams: any): Promise<{ success: boolean; orderId: string; code: string; message: string }> => {
  const isValidSignature = verifyVnpaySignature(queryParams);
  if (!isValidSignature) {
    return { success: false, orderId: '', code: '97', message: 'Signature verification failed' };
  }

  const orderId = queryParams.vnp_TxnRef;
  const responseCode = queryParams.vnp_ResponseCode;

  const order = await Order.findById(orderId);
  if (!order) {
    return { success: false, orderId, code: '01', message: 'Order not found' };
  }

  // Nếu đơn hàng đã được xác nhận thanh toán rồi
  if (order.isPaid || order.paymentStatus === 'paid') {
    return { success: true, orderId, code: '02', message: 'Order already paid' };
  }

  if (order.status === 'cancelled') {
    return { success: false, orderId, code: '04', message: 'Order already cancelled' };
  }

  if (responseCode === '00') {
    // Thanh toán thành công!
    order.isPaid = true;
    order.paymentStatus = 'paid';
    
    order.history.push({
      status: order.status,
      note: `Thanh toán thành công qua cổng VNPAY. Mã GD: ${queryParams.vnp_TransactionNo}`,
      date: new Date()
    });
    
    await order.save();
    return { success: true, orderId, code: '00', message: 'Confirm success' };
  } else {
    // Thanh toán thất bại hoặc bị hủy bởi khách hàng
    order.paymentStatus = 'failed';
    order.status = 'cancelled';
    
    order.history.push({
      status: 'cancelled',
      note: `Thanh toán qua cổng VNPAY thất bại hoặc bị hủy. Mã phản hồi: ${responseCode}`,
      date: new Date()
    });
    
    await order.save();

    // Tự động rollback kho hàng
    for (const item of order.items) {
      const color = item.selectedColor || 'Mặc định';
      const size = item.selectedSize || 'Tiêu chuẩn';

      await Product.updateOne(
        { _id: item.productId },
        {
          $inc: {
            "variants.$[elem].stock": item.quantity,
            salesCount: -item.quantity
          }
        },
        {
          arrayFilters: [
            { "elem.color": color, "elem.size": size }
          ]
        }
      );
    }
    
    return { success: false, orderId, code: '00', message: 'Confirm success (payment failed, rolled back stock)' };
  }
};

/**
 * Controller xử lý khi người dùng quay về trình duyệt từ VNPAY (Return URL)
 * VNPAY gọi thẳng endpoint này, backend xác thực chữ ký và redirect về frontend
 */
export const vnpayReturn = async (req: Request, res: Response) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  try {
    const result = await processVnpayPayment(req.query);
    
    if (result.success && result.code === '00') {
      // Thanh toán thành công → redirect về trang thành công
      return res.redirect(`${frontendUrl}/checkout?vnp_status=success&orderId=${encodeURIComponent(result.orderId)}`);
    } else {
      // Thanh toán thất bại / chữ ký sai → redirect về trang thất bại
      const reason = encodeURIComponent(result.message || 'payment_failed');
      return res.redirect(`${frontendUrl}/checkout?vnp_status=failed&orderId=${encodeURIComponent(result.orderId)}&reason=${reason}`);
    }
  } catch (error: any) {
    logger.error(`VNPAY return handler error: ${error.message}`);
    return res.redirect(`${frontendUrl}/checkout?vnp_status=error`);
  }
};


/**
 * Controller xử lý Webhook IPN từ VNPAY gọi ngầm (server-to-server)
 */
export const vnpayIpn = async (req: Request, res: Response) => {
  try {
    const result = await processVnpayPayment(req.query);
    
    if (result.code === '97') {
      return res.status(200).json({ RspCode: '97', Message: 'Invalid checksum' });
    }
    if (result.code === '01') {
      return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
    }
    if (result.code === '02' || result.code === '04') {
      return res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });
    }
    if (result.code === '00') {
      return res.status(200).json({ RspCode: '00', Message: 'Confirm success' });
    }
    
    return res.status(200).json({ RspCode: '99', Message: 'Input required data' });
  } catch (error: any) {
    logger.error(`VNPAY IPN handler error: ${error.message}`);
    res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
  }
};

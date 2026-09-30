const Payment = require('../models/Payment');
const Order = require('../models/Order');
const Table = require('../models/Table');
const MenuItem = require('../models/MenuItem');
const InventoryHistory = require('../models/InventoryHistory');
const SystemSettings = require('../models/SystemSettings');

// @desc Process cash payment for an existing order
// @route POST /api/payments
// @access Private (Admin or Cashier)
exports.processPayment = async (req, res, next) => {
  try {
    const { orderId, amountPaid } = req.body;

    if (!orderId || amountPaid === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Order ID and amount paid are required.'
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'This order has already been paid for.'
      });
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot process payment for a cancelled order.'
      });
    }

    const cashReceived = Number(amountPaid);
    if (cashReceived < order.total) {
      return res.status(400).json({
        success: false,
        message: `Amount paid ($${cashReceived.toFixed(2)}) is less than total amount ($${order.total.toFixed(2)}).`
      });
    }

    const change = Math.round((cashReceived - order.total) * 100) / 100;
    const transactionId = `TXN-${Date.now().toString().slice(-8)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const payment = await Payment.create({
      transactionId,
      order: order._id,
      orderNumber: order.orderNumber,
      cashier: req.user._id,
      cashierName: req.user.fullName || req.user.username,
      total: order.total,
      amountPaid: cashReceived,
      change,
      paymentMethod: 'cash',
      date: new Date()
    });

    // Update order status
    order.paymentStatus = 'paid';
    order.status = 'completed';
    await order.save();

    // Free up table if dine-in
    if (order.table) {
      await Table.findByIdAndUpdate(order.table, {
        status: 'available',
        currentOrder: null
      });
    }

    // Deduct stock for all items
    for (const item of order.items) {
      const mItem = await MenuItem.findById(item.menuItem);
      if (mItem) {
        const oldStock = mItem.stockQuantity;
        const newStock = Math.max(0, oldStock - item.quantity);
        mItem.stockQuantity = newStock;
        await mItem.save();

        await InventoryHistory.create({
          menuItem: mItem._id,
          itemName: mItem.name,
          type: 'sale',
          quantityChange: -item.quantity,
          previousStock: oldStock,
          newStock: newStock,
          reason: `Order ${order.orderNumber} payment completed`,
          user: req.user._id,
          userName: req.user.fullName
        });
      }
    }

    const settings = (await SystemSettings.findOne()) || {};

    return res.status(201).json({
      success: true,
      message: 'Payment processed successfully.',
      payment,
      order,
      receipt: {
        restaurantName: settings.restaurantName || 'Royal Burgundy Restaurant',
        address: settings.address || '',
        phone: settings.phone || '',
        currency: settings.currency || '$',
        headerMessage: settings.receiptHeader || '',
        footerMessage: settings.receiptFooter || '',
        transactionId: payment.transactionId,
        orderNumber: order.orderNumber,
        orderType: order.orderType,
        tableNumber: order.tableNumber,
        cashierName: payment.cashierName,
        date: payment.date,
        items: order.items,
        subtotal: order.subtotal,
        discount: order.discount,
        tax: order.tax,
        total: order.total,
        amountPaid: payment.amountPaid,
        change: payment.change
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get receipt details for an order
// @route GET /api/payments/receipt/:orderNumber
// @access Private (Admin or Cashier)
exports.getReceipt = async (req, res, next) => {
  try {
    const { orderNumber } = req.params;

    const order = await Order.findOne({ orderNumber }).populate('cashier', 'fullName username');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    const payment = await Payment.findOne({ order: order._id });
    const settings = (await SystemSettings.findOne()) || {};

    return res.status(200).json({
      success: true,
      receipt: {
        restaurantName: settings.restaurantName || 'Royal Burgundy Restaurant',
        address: settings.address || '',
        phone: settings.phone || '',
        currency: settings.currency || '$',
        headerMessage: settings.receiptHeader || '',
        footerMessage: settings.receiptFooter || '',
        transactionId: payment ? payment.transactionId : 'N/A (Unpaid)',
        orderNumber: order.orderNumber,
        orderType: order.orderType,
        tableNumber: order.tableNumber,
        cashierName: order.cashierName,
        date: payment ? payment.date : order.createdAt,
        items: order.items,
        subtotal: order.subtotal,
        discount: order.discount,
        tax: order.tax,
        total: order.total,
        amountPaid: payment ? payment.amountPaid : 0,
        change: payment ? payment.change : 0,
        paymentStatus: order.paymentStatus
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get payment transaction history
// @route GET /api/payments
// @access Private (Admin or Cashier)
exports.getPayments = async (req, res, next) => {
  try {
    const { cashierId, date, search, page = 1, limit = 50 } = req.query;
    let query = {};

    if (cashierId) {
      query.cashier = cashierId;
    }

    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ transactionId: regex }, { orderNumber: regex }, { cashierName: regex }];
    }

    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const totalCount = await Payment.countDocuments(query);

    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      count: payments.length,
      totalCount,
      currentPage: Number(page),
      totalPages: Math.ceil(totalCount / Number(limit)),
      payments
    });
  } catch (error) {
    next(error);
  }
};

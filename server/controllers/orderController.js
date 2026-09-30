const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Table = require('../models/Table');
const Payment = require('../models/Payment');
const InventoryHistory = require('../models/InventoryHistory');
const SystemSettings = require('../models/SystemSettings');

// Helper to generate unique order number: ORD-YYYYMMDD-XXXX
const generateOrderNumber = async () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const countToday = await Order.countDocuments({
    createdAt: { $gte: startOfDay }
  });

  const sequence = String(countToday + 1).padStart(4, '0');
  return `ORD-${dateStr}-${sequence}`;
};

// @desc Create a new order
// @route POST /api/orders
// @access Private (Admin or Cashier)
exports.createOrder = async (req, res, next) => {
  try {
    const { orderType, tableId, items, discount = 0, notes = '', immediatePayment = false, amountPaid = 0 } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item.'
      });
    }

    // Validate table if dine-in
    let tableObj = null;
    let tableNumberLabel = 'Takeaway';

    if (orderType === 'dine-in') {
      if (!tableId) {
        return res.status(400).json({
          success: false,
          message: 'Table selection is required for Dine-in orders.'
        });
      }

      tableObj = await Table.findById(tableId);
      if (!tableObj) {
        return res.status(404).json({
          success: false,
          message: 'Selected table was not found.'
        });
      }

      tableNumberLabel = tableObj.tableNumber;
    }

    // Verify stock and validate items
    const orderItems = [];
    let calculatedSubtotal = 0;

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItemId || item.menuItem);
      if (!menuItem) {
        return res.status(404).json({
          success: false,
          message: `Menu item with ID ${item.menuItemId || item.menuItem} was not found.`
        });
      }

      if (!menuItem.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `Item "${menuItem.name}" is currently marked unavailable.`
        });
      }

      const qty = Number(item.quantity);
      if (qty <= 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid quantity for "${menuItem.name}".`
        });
      }

      // Check stock
      if (menuItem.stockQuantity < qty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${menuItem.name}". Available: ${menuItem.stockQuantity}, Requested: ${qty}.`
        });
      }

      const itemSubtotal = menuItem.price * qty;
      calculatedSubtotal += itemSubtotal;

      orderItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: qty,
        subtotal: itemSubtotal
      });
    }

    // Settings for tax
    const settings = (await SystemSettings.findOne()) || { taxRate: 0 };
    const taxRate = settings.taxRate || 0;
    const numDiscount = Math.max(0, Number(discount) || 0);

    const discountedSubtotal = Math.max(0, calculatedSubtotal - numDiscount);
    const taxAmount = (discountedSubtotal * taxRate) / 100;
    const finalTotal = Math.round((discountedSubtotal + taxAmount) * 100) / 100;

    const orderNumber = await generateOrderNumber();

    const order = await Order.create({
      orderNumber,
      cashier: req.user._id,
      cashierName: req.user.fullName || req.user.username,
      orderType: orderType === 'takeaway' ? 'takeaway' : 'dine-in',
      table: tableObj ? tableObj._id : null,
      tableNumber: tableNumberLabel,
      items: orderItems,
      subtotal: calculatedSubtotal,
      discount: numDiscount,
      tax: taxAmount,
      total: finalTotal,
      status: immediatePayment ? 'completed' : 'pending',
      paymentStatus: immediatePayment ? 'paid' : 'unpaid',
      notes
    });

    let paymentRecord = null;

    // Handle immediate cash payment if submitted during POS checkout
    if (immediatePayment) {
      const numPaid = Number(amountPaid);
      if (numPaid < finalTotal) {
        return res.status(400).json({
          success: false,
          message: `Cash amount paid ($${numPaid.toFixed(2)}) is less than total ($${finalTotal.toFixed(2)}).`
        });
      }

      const change = Math.round((numPaid - finalTotal) * 100) / 100;
      const transactionId = `TXN-${Date.now().toString().slice(-8)}-${Math.floor(1000 + Math.random() * 9000)}`;

      paymentRecord = await Payment.create({
        transactionId,
        order: order._id,
        orderNumber: order.orderNumber,
        cashier: req.user._id,
        cashierName: req.user.fullName || req.user.username,
        total: finalTotal,
        amountPaid: numPaid,
        change,
        paymentMethod: 'cash',
        date: new Date()
      });

      // Deduct inventory stock & record inventory history
      for (const item of orderItems) {
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
            reason: `Order ${order.orderNumber} checkout`,
            user: req.user._id,
            userName: req.user.fullName
          });
        }
      }

      // If dine-in, table was occupied during dining but now completed & paid
      if (tableObj) {
        tableObj.status = 'available';
        tableObj.currentOrder = null;
        await tableObj.save();
      }
    } else {
      // If pending order for a table, set table status to occupied
      if (tableObj) {
        tableObj.status = 'occupied';
        tableObj.currentOrder = order._id;
        await tableObj.save();
      }
    }

    return res.status(201).json({
      success: true,
      message: immediatePayment ? 'Order completed and paid.' : 'Order placed successfully.',
      order,
      payment: paymentRecord
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get all orders with search and filtering
// @route GET /api/orders
// @access Private (Admin or Cashier)
exports.getAllOrders = async (req, res, next) => {
  try {
    const { status, cashierId, date, search, orderType, limit = 100, page = 1 } = req.query;
    let query = {};

    // If Cashier role and not requesting all, can optionally filter their own, or show all
    if (cashierId) {
      query.cashier = cashierId;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (orderType && orderType !== 'all') {
      query.orderType = orderType;
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ orderNumber: searchRegex }, { tableNumber: searchRegex }, { cashierName: searchRegex }];
    }

    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      query.createdAt = { $gte: startOfDay, $lte: endOfDay };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const totalCount = await Order.countDocuments(query);

    const orders = await Order.find(query)
      .populate('cashier', 'username fullName role')
      .populate('table', 'tableNumber capacity')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      count: orders.length,
      totalCount,
      currentPage: Number(page),
      totalPages: Math.ceil(totalCount / Number(limit)),
      orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get single order by ID
// @route GET /api/orders/:id
// @access Private (Admin or Cashier)
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('cashier', 'username fullName phone')
      .populate('table', 'tableNumber capacity status');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    // Also fetch associated payment if paid
    let payment = null;
    if (order.paymentStatus === 'paid') {
      payment = await Payment.findOne({ order: order._id });
    }

    return res.status(200).json({
      success: true,
      order,
      payment
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update order status (Cancel or Complete)
// @route PATCH /api/orders/:id/status
// @access Private (Admin or Cashier)
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['pending', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be pending, completed, or cancelled.'
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    if (order.status === 'completed' && status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel an order that has already been completed.'
      });
    }

    // If changing to cancelled, free up table
    if (status === 'cancelled') {
      if (order.table) {
        await Table.findByIdAndUpdate(order.table, {
          status: 'available',
          currentOrder: null
        });
      }
    }

    // If changing to completed, free up table
    if (status === 'completed') {
      if (order.table) {
        await Table.findByIdAndUpdate(order.table, {
          status: 'available',
          currentOrder: null
        });
      }
    }

    order.status = status;
    await order.save();

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${status}.`,
      order
    });
  } catch (error) {
    next(error);
  }
};

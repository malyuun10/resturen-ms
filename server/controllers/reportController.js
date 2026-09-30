const Order = require('../models/Order');
const Payment = require('../models/Payment');
const MenuItem = require('../models/MenuItem');
const Table = require('../models/Table');
const User = require('../models/User');
const InventoryHistory = require('../models/InventoryHistory');
const SystemSettings = require('../models/SystemSettings');

// Helper to get date boundaries
const getDateRange = (startDateStr, endDateStr) => {
  let start, end;
  if (startDateStr) {
    start = new Date(startDateStr);
    start.setHours(0, 0, 0, 0);
  } else {
    start = new Date();
    start.setHours(0, 0, 0, 0);
  }

  if (endDateStr) {
    end = new Date(endDateStr);
    end.setHours(23, 59, 59, 999);
  } else {
    end = new Date();
    end.setHours(23, 59, 59, 999);
  }

  return { start, end };
};

// @desc Dashboard Overview Summary
// @route GET /api/reports/dashboard-summary
// @access Private/Admin
exports.getDashboardSummary = async (req, res, next) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const settings = (await SystemSettings.findOne()) || { lowStockThreshold: 10 };
    const threshold = settings.lowStockThreshold || 10;

    // Today's Orders & Sales
    const todayOrders = await Order.find({
      createdAt: { $gte: todayStart, $lte: todayEnd }
    });

    const todayOrdersCount = todayOrders.length;
    const todayCompleted = todayOrders.filter((o) => o.status === 'completed');
    const todaySales = todayCompleted.reduce((acc, curr) => acc + curr.total, 0);

    // Total Menu Items
    const totalMenuItems = await MenuItem.countDocuments();

    // Tables
    const availableTables = await Table.countDocuments({ status: 'available' });
    const occupiedTables = await Table.countDocuments({ status: 'occupied' });

    // Low stock items
    const lowStockItemsCount = await MenuItem.countDocuments({
      stockQuantity: { $lte: threshold }
    });

    // Total revenue all time
    const completedOrdersAllTime = await Order.find({ status: 'completed' }, 'total');
    const totalRevenue = completedOrdersAllTime.reduce((acc, curr) => acc + curr.total, 0);

    // Popular menu items (Top 5 all time or this month)
    const productAggregation = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.menuItem',
          name: { $first: '$items.name' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 }
    ]);

    // Cashier activity today
    const cashierStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: todayStart, $lte: todayEnd },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$cashier',
          cashierName: { $first: '$cashierName' },
          orderCount: { $sum: 1 },
          totalSales: { $sum: '$total' }
        }
      },
      { $sort: { totalSales: -1 } }
    ]);

    // Recent orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('cashier', 'fullName username');

    // Past 7 days sales trend
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const weeklyTrend = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalSales: { $sum: '$total' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return res.status(200).json({
      success: true,
      data: {
        todaySales: Math.round(todaySales * 100) / 100,
        todayOrdersCount,
        totalMenuItems,
        availableTables,
        occupiedTables,
        lowStockItemsCount,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        popularItems: productAggregation,
        cashierActivityToday: cashierStats,
        recentOrders,
        weeklyTrend
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc Daily Sales Report
// @route GET /api/reports/daily
// @access Private/Admin
exports.getDailyReport = async (req, res, next) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const orders = await Order.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ createdAt: -1 });

    const totalOrders = orders.length;
    const completedOrders = orders.filter((o) => o.status === 'completed');
    const cancelledOrders = orders.filter((o) => o.status === 'cancelled');
    const pendingOrders = orders.filter((o) => o.status === 'pending');

    const totalSales = completedOrders.reduce((sum, o) => sum + o.total, 0);
    const totalTax = completedOrders.reduce((sum, o) => sum + (o.tax || 0), 0);
    const totalDiscount = completedOrders.reduce((sum, o) => sum + (o.discount || 0), 0);

    // Hourly breakdown
    const hourlyBreakdown = {};
    for (let h = 0; h < 24; h++) {
      const label = `${String(h).padStart(2, '0')}:00`;
      hourlyBreakdown[label] = { hour: label, sales: 0, orders: 0 };
    }

    completedOrders.forEach((o) => {
      const orderHour = new Date(o.createdAt).getHours();
      const label = `${String(orderHour).padStart(2, '0')}:00`;
      if (hourlyBreakdown[label]) {
        hourlyBreakdown[label].sales += o.total;
        hourlyBreakdown[label].orders += 1;
      }
    });

    return res.status(200).json({
      success: true,
      reportDate: startOfDay.toISOString().slice(0, 10),
      summary: {
        totalSales: Math.round(totalSales * 100) / 100,
        totalOrders,
        completedCount: completedOrders.length,
        cancelledCount: cancelledOrders.length,
        pendingCount: pendingOrders.length,
        totalTax: Math.round(totalTax * 100) / 100,
        totalDiscount: Math.round(totalDiscount * 100) / 100
      },
      hourly: Object.values(hourlyBreakdown),
      orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc Weekly Sales Report
// @route GET /api/reports/weekly
// @access Private/Admin
exports.getWeeklyReport = async (req, res, next) => {
  try {
    const { startDate } = req.query;
    let start = startDate ? new Date(startDate) : new Date();
    if (!startDate) {
      start.setDate(start.getDate() - 6);
    }
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    const orders = await Order.find({
      createdAt: { $gte: start, $lte: end },
      status: 'completed'
    });

    const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = orders.length;

    // Daily breakdown
    const daysMap = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const dateKey = d.toISOString().slice(0, 10);
      daysMap[dateKey] = {
        date: dateKey,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        sales: 0,
        orders: 0
      };
    }

    orders.forEach((o) => {
      const key = new Date(o.createdAt).toISOString().slice(0, 10);
      if (daysMap[key]) {
        daysMap[key].sales += o.total;
        daysMap[key].orders += 1;
      }
    });

    return res.status(200).json({
      success: true,
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      summary: {
        totalSales: Math.round(totalSales * 100) / 100,
        totalOrders,
        averageOrderValue: totalOrders > 0 ? Math.round((totalSales / totalOrders) * 100) / 100 : 0
      },
      dailyBreakdown: Object.values(daysMap)
    });
  } catch (error) {
    next(error);
  }
};

// @desc Monthly Sales Report
// @route GET /api/reports/monthly
// @access Private/Admin
exports.getMonthlyReport = async (req, res, next) => {
  try {
    const { year, month } = req.query;
    const now = new Date();
    const targetYear = year ? Number(year) : now.getFullYear();
    const targetMonth = month ? Number(month) - 1 : now.getMonth();

    const start = new Date(targetYear, targetMonth, 1, 0, 0, 0, 0);
    const end = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

    const orders = await Order.find({
      createdAt: { $gte: start, $lte: end }
    });

    const completed = orders.filter((o) => o.status === 'completed');
    const cancelled = orders.filter((o) => o.status === 'cancelled');

    const totalSales = completed.reduce((sum, o) => sum + o.total, 0);

    // Aggregate by day of the month
    const daysInMonth = end.getDate();
    const daysList = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(targetYear, targetMonth, day);
      const dateKey = dayDate.toISOString().slice(0, 10);
      daysList.push({
        date: dateKey,
        day,
        sales: 0,
        orders: 0
      });
    }

    completed.forEach((o) => {
      const dayNum = new Date(o.createdAt).getDate();
      if (daysList[dayNum - 1]) {
        daysList[dayNum - 1].sales += o.total;
        daysList[dayNum - 1].orders += 1;
      }
    });

    return res.status(200).json({
      success: true,
      year: targetYear,
      month: targetMonth + 1,
      summary: {
        totalSales: Math.round(totalSales * 100) / 100,
        totalOrders: orders.length,
        completedCount: completed.length,
        cancelledCount: cancelled.length,
        revenue: Math.round(totalSales * 100) / 100
      },
      dailyBreakdown: daysList
    });
  } catch (error) {
    next(error);
  }
};

// @desc Cashier Activity & Sales Report
// @route GET /api/reports/cashier
// @access Private/Admin
exports.getCashierReport = async (req, res, next) => {
  try {
    const { startDate, endDate, cashierId } = req.query;
    const { start, end } = getDateRange(startDate, endDate);

    let matchStage = {
      createdAt: { $gte: start, $lte: end }
    };

    if (cashierId && cashierId !== 'all') {
      const mongoose = require('mongoose');
      matchStage.cashier = new mongoose.Types.ObjectId(cashierId);
    }

    const cashierReport = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$cashier',
          cashierName: { $first: '$cashierName' },
          totalOrders: { $sum: 1 },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          totalCollected: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$total', 0] }
          }
        }
      },
      { $sort: { totalCollected: -1 } }
    ]);

    return res.status(200).json({
      success: true,
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      cashiers: cashierReport
    });
  } catch (error) {
    next(error);
  }
};

// @desc Product / Menu Item Sales Performance Report
// @route GET /api/reports/products
// @access Private/Admin
exports.getProductReport = async (req, res, next) => {
  try {
    const { startDate, endDate, categoryId } = req.query;
    const { start, end } = getDateRange(startDate, endDate);

    const productStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: 'completed'
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.menuItem',
          name: { $first: '$items.name' },
          price: { $first: '$items.price' },
          quantitySold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' },
          orderOccurrences: { $sum: 1 }
        }
      },
      { $sort: { quantitySold: -1 } }
    ]);

    return res.status(200).json({
      success: true,
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      products: productStats
    });
  } catch (error) {
    next(error);
  }
};

// @desc Inventory Report (Stock status, valuation, low stock)
// @route GET /api/reports/inventory
// @access Private/Admin
exports.getInventoryReport = async (req, res, next) => {
  try {
    const settings = (await SystemSettings.findOne()) || { lowStockThreshold: 10 };
    const threshold = settings.lowStockThreshold || 10;

    const items = await MenuItem.find()
      .populate('category', 'name')
      .sort({ stockQuantity: 1 });

    let totalValuation = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    const processedItems = items.map((item) => {
      const stockVal = item.price * item.stockQuantity;
      totalValuation += stockVal;

      let status = 'In Stock';
      if (item.stockQuantity <= 0) {
        status = 'Out of Stock';
        outOfStockCount++;
      } else if (item.stockQuantity <= threshold) {
        status = 'Low Stock';
        lowStockCount++;
      }

      return {
        _id: item._id,
        name: item.name,
        category: item.category ? item.category.name : 'Uncategorized',
        price: item.price,
        stockQuantity: item.stockQuantity,
        stockStatus: status,
        inventoryValue: Math.round(stockVal * 100) / 100
      };
    });

    const recentMovements = await InventoryHistory.find()
      .sort({ createdAt: -1 })
      .limit(20);

    return res.status(200).json({
      success: true,
      threshold,
      summary: {
        totalItems: items.length,
        totalValuation: Math.round(totalValuation * 100) / 100,
        lowStockCount,
        outOfStockCount
      },
      items: processedItems,
      recentMovements
    });
  } catch (error) {
    next(error);
  }
};

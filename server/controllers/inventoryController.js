const MenuItem = require('../models/MenuItem');
const InventoryHistory = require('../models/InventoryHistory');
const SystemSettings = require('../models/SystemSettings');

// @desc Get current inventory status with stock level classifications
// @route GET /api/inventory
// @access Private/Admin
exports.getInventory = async (req, res, next) => {
  try {
    const { search, category, status } = req.query;
    let query = {};

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      query.name = new RegExp(search.trim(), 'i');
    }

    const settings = (await SystemSettings.findOne()) || { lowStockThreshold: 10 };
    const threshold = settings.lowStockThreshold || 10;

    if (status === 'low') {
      query.stockQuantity = { $gt: 0, $lte: threshold };
    } else if (status === 'out') {
      query.stockQuantity = { $lte: 0 };
    } else if (status === 'in') {
      query.stockQuantity = { $gt: threshold };
    }

    const items = await MenuItem.find(query)
      .populate('category', 'name')
      .sort({ stockQuantity: 1 }); // Sort lowest stock first to highlight alerts

    const inventoryItems = items.map((item) => {
      let stockStatus = 'In Stock';
      if (item.stockQuantity <= 0) {
        stockStatus = 'Out of Stock';
      } else if (item.stockQuantity <= threshold) {
        stockStatus = 'Low Stock';
      }

      return {
        _id: item._id,
        name: item.name,
        category: item.category ? item.category.name : 'Uncategorized',
        categoryId: item.category ? item.category._id : null,
        price: item.price,
        stockQuantity: item.stockQuantity,
        stockStatus,
        isAvailable: item.isAvailable,
        updatedAt: item.updatedAt
      };
    });

    const lowStockCount = await MenuItem.countDocuments({
      stockQuantity: { $gt: 0, $lte: threshold }
    });
    const outOfStockCount = await MenuItem.countDocuments({
      stockQuantity: { $lte: 0 }
    });
    const totalItems = await MenuItem.countDocuments();

    return res.status(200).json({
      success: true,
      threshold,
      summary: {
        totalItems,
        lowStockCount,
        outOfStockCount,
        inStockCount: totalItems - lowStockCount - outOfStockCount
      },
      items: inventoryItems
    });
  } catch (error) {
    next(error);
  }
};

// @desc Adjust stock (Restock or Reduce stock)
// @route POST /api/inventory/adjust
// @access Private/Admin
exports.adjustStock = async (req, res, next) => {
  try {
    const { menuItemId, action, quantity, reason } = req.body;

    if (!menuItemId || !action || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Menu item, adjustment action, and quantity are required.'
      });
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive number.'
      });
    }

    const item = await MenuItem.findById(menuItemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found.'
      });
    }

    const oldStock = item.stockQuantity;
    let newStock = oldStock;
    let type = 'adjustment';
    let qtyChange = 0;

    if (action === 'restock') {
      type = 'restock';
      qtyChange = qty;
      newStock = oldStock + qty;
    } else if (action === 'reduce') {
      type = 'adjustment';
      if (qty > oldStock) {
        return res.status(400).json({
          success: false,
          message: `Cannot reduce by ${qty}. Current stock is only ${oldStock}.`
        });
      }
      qtyChange = -qty;
      newStock = oldStock - qty;
    } else if (action === 'set') {
      type = 'adjustment';
      qtyChange = qty - oldStock;
      newStock = qty;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be "restock", "reduce", or "set".'
      });
    }

    item.stockQuantity = newStock;
    await item.save();

    const historyRecord = await InventoryHistory.create({
      menuItem: item._id,
      itemName: item.name,
      type,
      quantityChange: qtyChange,
      previousStock: oldStock,
      newStock,
      reason: reason ? reason.trim() : (action === 'restock' ? 'Manual Restock' : 'Stock Adjustment'),
      user: req.user._id,
      userName: req.user.fullName || req.user.username
    });

    return res.status(200).json({
      success: true,
      message: `Stock for "${item.name}" updated successfully to ${newStock}.`,
      item,
      historyRecord
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get inventory movement history logs
// @route GET /api/inventory/history
// @access Private/Admin
exports.getInventoryHistory = async (req, res, next) => {
  try {
    const { menuItemId, type, search, page = 1, limit = 50 } = req.query;
    let query = {};

    if (menuItemId) {
      query.menuItem = menuItemId;
    }

    if (type && type !== 'all') {
      query.type = type;
    }

    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ itemName: regex }, { reason: regex }, { userName: regex }];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const totalCount = await InventoryHistory.countDocuments(query);

    const history = await InventoryHistory.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      count: history.length,
      totalCount,
      currentPage: Number(page),
      totalPages: Math.ceil(totalCount / Number(limit)),
      history
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get items with low stock alerts
// @route GET /api/inventory/low-stock
// @access Private/Admin
exports.getLowStockAlerts = async (req, res, next) => {
  try {
    const settings = (await SystemSettings.findOne()) || { lowStockThreshold: 10 };
    const threshold = settings.lowStockThreshold || 10;

    const lowStockItems = await MenuItem.find({
      stockQuantity: { $lte: threshold }
    })
      .populate('category', 'name')
      .sort({ stockQuantity: 1 });

    return res.status(200).json({
      success: true,
      threshold,
      count: lowStockItems.length,
      items: lowStockItems
    });
  } catch (error) {
    next(error);
  }
};

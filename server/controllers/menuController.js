const MenuItem = require('../models/MenuItem');
const Category = require('../models/Category');
const InventoryHistory = require('../models/InventoryHistory');
const SystemSettings = require('../models/SystemSettings');

// @desc Get all menu items (search, category filter, stock status)
// @route GET /api/menu
// @access Public / Authenticated
exports.getMenuItems = async (req, res, next) => {
  try {
    const { category, search, stockStatus, availableOnly } = req.query;
    let query = {};

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { description: searchRegex }];
    }

    if (availableOnly === 'true') {
      query.isAvailable = true;
    }

    const settings = (await SystemSettings.findOne()) || { lowStockThreshold: 10 };
    const threshold = settings.lowStockThreshold || 10;

    if (stockStatus === 'low') {
      query.stockQuantity = { $gt: 0, $lte: threshold };
    } else if (stockStatus === 'out') {
      query.stockQuantity = { $lte: 0 };
    } else if (stockStatus === 'in') {
      query.stockQuantity = { $gt: threshold };
    }

    const items = await MenuItem.find(query)
      .populate('category', 'name isActive')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: items.length,
      threshold,
      items
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get single menu item by ID
// @route GET /api/menu/:id
// @access Public / Authenticated
exports.getMenuItemById = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id).populate('category', 'name');
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found.'
      });
    }

    return res.status(200).json({
      success: true,
      item
    });
  } catch (error) {
    next(error);
  }
};

// @desc Create menu item (Admin only)
// @route POST /api/menu
// @access Private/Admin
exports.createMenuItem = async (req, res, next) => {
  try {
    const { name, category, description, price, stockQuantity, isAvailable, image } = req.body;

    if (!name || !category || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide item name, category, and price.'
      });
    }

    const catExists = await Category.findById(category);
    if (!catExists) {
      return res.status(400).json({
        success: false,
        message: 'Selected category does not exist.'
      });
    }

    const cleanName = name.trim();
    const existing = await MenuItem.findOne({
      name: { $regex: new RegExp(`^${cleanName}$`, 'i') }
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A menu item with the name "${cleanName}" already exists.`
      });
    }

    const initialStock = Number(stockQuantity) || 0;

    const item = await MenuItem.create({
      name: cleanName,
      category,
      description: description ? description.trim() : '',
      price: Number(price),
      stockQuantity: initialStock,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      image: image || ''
    });

    // Record initial inventory history
    if (initialStock > 0) {
      await InventoryHistory.create({
        menuItem: item._id,
        itemName: item.name,
        type: 'initial',
        quantityChange: initialStock,
        previousStock: 0,
        newStock: initialStock,
        reason: 'Initial stock on item creation',
        user: req.user ? req.user._id : null,
        userName: req.user ? req.user.fullName : 'Admin'
      });
    }

    await item.populate('category', 'name');

    return res.status(201).json({
      success: true,
      message: 'Menu item created successfully.',
      item
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update menu item (Admin only)
// @route PUT /api/menu/:id
// @access Private/Admin
exports.updateMenuItem = async (req, res, next) => {
  try {
    const { name, category, description, price, stockQuantity, isAvailable, image } = req.body;

    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found.'
      });
    }

    if (name) {
      const cleanName = name.trim();
      const existing = await MenuItem.findOne({
        _id: { $ne: req.params.id },
        name: { $regex: new RegExp(`^${cleanName}$`, 'i') }
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Another menu item named "${cleanName}" already exists.`
        });
      }
      item.name = cleanName;
    }

    if (category) {
      const catExists = await Category.findById(category);
      if (!catExists) {
        return res.status(400).json({
          success: false,
          message: 'Selected category does not exist.'
        });
      }
      item.category = category;
    }

    if (description !== undefined) item.description = description.trim();
    if (price !== undefined) item.price = Number(price);
    if (isAvailable !== undefined) item.isAvailable = isAvailable;
    if (image !== undefined) item.image = image;

    // If stock changed directly in edit form
    if (stockQuantity !== undefined && Number(stockQuantity) !== item.stockQuantity) {
      const oldStock = item.stockQuantity;
      const newStock = Number(stockQuantity);
      const diff = newStock - oldStock;
      item.stockQuantity = newStock;

      await InventoryHistory.create({
        menuItem: item._id,
        itemName: item.name,
        type: 'adjustment',
        quantityChange: diff,
        previousStock: oldStock,
        newStock: newStock,
        reason: 'Manual stock adjustment in menu editor',
        user: req.user ? req.user._id : null,
        userName: req.user ? req.user.fullName : 'Admin'
      });
    }

    await item.save();
    await item.populate('category', 'name');

    return res.status(200).json({
      success: true,
      message: 'Menu item updated successfully.',
      item
    });
  } catch (error) {
    next(error);
  }
};

// @desc Quick toggle availability (Admin only)
// @route PATCH /api/menu/:id/toggle-availability
// @access Private/Admin
exports.toggleAvailability = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found.'
      });
    }

    item.isAvailable = !item.isAvailable;
    await item.save();

    return res.status(200).json({
      success: true,
      message: `Menu item ${item.isAvailable ? 'enabled' : 'disabled'} successfully.`,
      item
    });
  } catch (error) {
    next(error);
  }
};

// @desc Delete menu item (Admin only)
// @route DELETE /api/menu/:id
// @access Private/Admin
exports.deleteMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found.'
      });
    }

    await MenuItem.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Menu item deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

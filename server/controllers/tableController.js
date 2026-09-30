const Table = require('../models/Table');

// @desc Get all tables
// @route GET /api/tables
// @access Public / Authenticated
exports.getTables = async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const tables = await Table.find(query)
      .populate('currentOrder', 'orderNumber total status items createdAt')
      .sort({ tableNumber: 1 });

    return res.status(200).json({
      success: true,
      count: tables.length,
      tables
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get single table
// @route GET /api/tables/:id
// @access Public / Authenticated
exports.getTableById = async (req, res, next) => {
  try {
    const table = await Table.findById(req.params.id).populate(
      'currentOrder',
      'orderNumber total status items cashierName createdAt'
    );
    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found.'
      });
    }

    return res.status(200).json({
      success: true,
      table
    });
  } catch (error) {
    next(error);
  }
};

// @desc Create table (Admin only)
// @route POST /api/tables
// @access Private/Admin
exports.createTable = async (req, res, next) => {
  try {
    const { tableNumber, capacity, status } = req.body;

    if (!tableNumber) {
      return res.status(400).json({
        success: false,
        message: 'Table number is required.'
      });
    }

    const cleanNumber = tableNumber.trim();
    const existing = await Table.findOne({
      tableNumber: { $regex: new RegExp(`^${cleanNumber}$`, 'i') }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Table "${cleanNumber}" already exists.`
      });
    }

    const table = await Table.create({
      tableNumber: cleanNumber,
      capacity: Number(capacity) || 4,
      status: status || 'available'
    });

    return res.status(201).json({
      success: true,
      message: 'Table created successfully.',
      table
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update table details (Admin only)
// @route PUT /api/tables/:id
// @access Private/Admin
exports.updateTable = async (req, res, next) => {
  try {
    const { tableNumber, capacity, status } = req.body;

    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found.'
      });
    }

    if (tableNumber) {
      const cleanNumber = tableNumber.trim();
      const existing = await Table.findOne({
        _id: { $ne: req.params.id },
        tableNumber: { $regex: new RegExp(`^${cleanNumber}$`, 'i') }
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Another table with number "${cleanNumber}" already exists.`
        });
      }
      table.tableNumber = cleanNumber;
    }

    if (capacity !== undefined) table.capacity = Number(capacity);
    if (status !== undefined) table.status = status;

    await table.save();

    return res.status(200).json({
      success: true,
      message: 'Table updated successfully.',
      table
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update table status (Available, Occupied, Reserved)
// @route PATCH /api/tables/:id/status
// @access Private (Admin or Cashier)
exports.updateTableStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['available', 'occupied', 'reserved'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be available, occupied, or reserved.'
      });
    }

    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found.'
      });
    }

    table.status = status;
    if (status === 'available') {
      table.currentOrder = null;
    }

    await table.save();

    return res.status(200).json({
      success: true,
      message: `Table status updated to ${status}.`,
      table
    });
  } catch (error) {
    next(error);
  }
};

// @desc Delete table (Admin only)
// @route DELETE /api/tables/:id
// @access Private/Admin
exports.deleteTable = async (req, res, next) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found.'
      });
    }

    if (table.status === 'occupied') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete an occupied table with an active order.'
      });
    }

    await Table.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Table deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

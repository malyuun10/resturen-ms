const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const Table = require('../models/Table');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const InventoryHistory = require('../models/InventoryHistory');
const SystemSettings = require('../models/SystemSettings');

const backupsDir = path.join(__dirname, '../backups');

// Ensure backups directory exists
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

// @desc Create a local database backup JSON snapshot
// @route POST /api/backup/create
// @access Private/Admin
exports.createBackup = async (req, res, next) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `restaurant-backup-${timestamp}.json`;
    const filePath = path.join(backupsDir, filename);

    // Collect data across all collections
    const [
      users,
      categories,
      menuItems,
      tables,
      orders,
      payments,
      inventoryHistory,
      systemSettings
    ] = await Promise.all([
      User.find().lean(),
      Category.find().lean(),
      MenuItem.find().lean(),
      Table.find().lean(),
      Order.find().lean(),
      Payment.find().lean(),
      InventoryHistory.find().lean(),
      SystemSettings.find().lean()
    ]);

    const backupData = {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      createdByName: req.user ? req.user.fullName : 'Admin',
      counts: {
        users: users.length,
        categories: categories.length,
        menuItems: menuItems.length,
        tables: tables.length,
        orders: orders.length,
        payments: payments.length,
        inventoryHistory: inventoryHistory.length
      },
      collections: {
        users,
        categories,
        menuItems,
        tables,
        orders,
        payments,
        inventoryHistory,
        systemSettings
      }
    };

    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf-8');
    const stats = fs.statSync(filePath);

    return res.status(201).json({
      success: true,
      message: 'Local database backup created successfully.',
      backup: {
        filename,
        createdAt: backupData.createdAt,
        sizeBytes: stats.size,
        sizeFormatted: `${(stats.size / 1024).toFixed(2)} KB`,
        counts: backupData.counts
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc List all available local database backups
// @route GET /api/backup/list
// @access Private/Admin
exports.listBackups = async (req, res, next) => {
  try {
    if (!fs.existsSync(backupsDir)) {
      return res.status(200).json({ success: true, backups: [] });
    }

    const files = fs.readdirSync(backupsDir).filter((file) => file.endsWith('.json'));

    const backups = files
      .map((filename) => {
        const filePath = path.join(backupsDir, filename);
        const stats = fs.statSync(filePath);
        return {
          filename,
          createdAt: stats.birthtime || stats.mtime,
          sizeBytes: stats.size,
          sizeFormatted: `${(stats.size / 1024).toFixed(2)} KB`
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.status(200).json({
      success: true,
      count: backups.length,
      backups
    });
  } catch (error) {
    next(error);
  }
};

// @desc Restore local database from chosen backup file
// @route POST /api/backup/restore
// @access Private/Admin
exports.restoreBackup = async (req, res, next) => {
  try {
    const { filename } = req.body;

    if (!filename) {
      return res.status(400).json({
        success: false,
        message: 'Backup filename is required.'
      });
    }

    const cleanFilename = path.basename(filename);
    const filePath = path.join(backupsDir, cleanFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Backup file not found.'
      });
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const backupData = JSON.parse(fileContent);

    if (!backupData.collections) {
      return res.status(400).json({
        success: false,
        message: 'Invalid backup file structure.'
      });
    }

    const {
      users = [],
      categories = [],
      menuItems = [],
      tables = [],
      orders = [],
      payments = [],
      inventoryHistory = [],
      systemSettings = []
    } = backupData.collections;

    // Clear existing collections safely and restore
    if (categories.length > 0) {
      await Category.deleteMany({});
      await Category.insertMany(categories);
    }

    if (menuItems.length > 0) {
      await MenuItem.deleteMany({});
      await MenuItem.insertMany(menuItems);
    }

    if (tables.length > 0) {
      await Table.deleteMany({});
      await Table.insertMany(tables);
    }

    if (orders.length > 0) {
      await Order.deleteMany({});
      await Order.insertMany(orders);
    }

    if (payments.length > 0) {
      await Payment.deleteMany({});
      await Payment.insertMany(payments);
    }

    if (inventoryHistory.length > 0) {
      await InventoryHistory.deleteMany({});
      await InventoryHistory.insertMany(inventoryHistory);
    }

    if (systemSettings.length > 0) {
      await SystemSettings.deleteMany({});
      await SystemSettings.insertMany(systemSettings);
    }

    // Preserve users or restore users
    if (users.length > 0) {
      await User.deleteMany({});
      await User.insertMany(users);
    }

    return res.status(200).json({
      success: true,
      message: `Database successfully restored from ${cleanFilename}.`,
      restoredCounts: {
        categories: categories.length,
        menuItems: menuItems.length,
        tables: tables.length,
        orders: orders.length,
        payments: payments.length,
        inventoryHistory: inventoryHistory.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc Download a backup file
// @route GET /api/backup/download/:filename
// @access Private/Admin
exports.downloadBackup = async (req, res, next) => {
  try {
    const cleanFilename = path.basename(req.params.filename);
    const filePath = path.join(backupsDir, cleanFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Backup file not found.'
      });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${cleanFilename}"`);
    res.setHeader('Content-Type', 'application/json');
    return res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
};

// @desc Delete a backup file
// @route DELETE /api/backup/:filename
// @access Private/Admin
exports.deleteBackup = async (req, res, next) => {
  try {
    const cleanFilename = path.basename(req.params.filename);
    const filePath = path.join(backupsDir, cleanFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Backup file not found.'
      });
    }

    fs.unlinkSync(filePath);

    return res.status(200).json({
      success: true,
      message: `Backup file ${cleanFilename} deleted successfully.`
    });
  } catch (error) {
    next(error);
  }
};

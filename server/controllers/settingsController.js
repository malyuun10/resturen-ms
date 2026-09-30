const SystemSettings = require('../models/SystemSettings');

// @desc Get system settings (public / authenticated)
// @route GET /api/settings
// @access Public / Authenticated
exports.getSettings = async (req, res, next) => {
  try {
    let settings = await SystemSettings.findOne();

    if (!settings) {
      settings = await SystemSettings.create({
        restaurantName: 'Royal Burgundy Restaurant',
        address: '123 Gourmet Boulevard, Food District',
        phone: '+1 (555) 123-4567',
        email: 'contact@royalburgundy.local',
        currency: '$',
        taxRate: 5,
        receiptHeader: 'Welcome to Royal Burgundy Restaurant & Lounge!',
        receiptFooter: 'Thank you for your visit! Please join us again soon.',
        lowStockThreshold: 10
      });
    }

    return res.status(200).json({
      success: true,
      settings
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update system settings (Admin only)
// @route PUT /api/settings
// @access Private/Admin
exports.updateSettings = async (req, res, next) => {
  try {
    const {
      restaurantName,
      address,
      phone,
      email,
      currency,
      taxRate,
      receiptHeader,
      receiptFooter,
      lowStockThreshold
    } = req.body;

    let settings = await SystemSettings.findOne();

    if (!settings) {
      settings = new SystemSettings();
    }

    if (restaurantName !== undefined) settings.restaurantName = restaurantName.trim();
    if (address !== undefined) settings.address = address.trim();
    if (phone !== undefined) settings.phone = phone.trim();
    if (email !== undefined) settings.email = email.trim();
    if (currency !== undefined) settings.currency = currency.trim() || '$';
    if (taxRate !== undefined) settings.taxRate = Math.max(0, Number(taxRate) || 0);
    if (receiptHeader !== undefined) settings.receiptHeader = receiptHeader.trim();
    if (receiptFooter !== undefined) settings.receiptFooter = receiptFooter.trim();
    if (lowStockThreshold !== undefined)
      settings.lowStockThreshold = Math.max(1, Number(lowStockThreshold) || 10);

    await settings.save();

    return res.status(200).json({
      success: true,
      message: 'System settings updated successfully.',
      settings
    });
  } catch (error) {
    next(error);
  }
};

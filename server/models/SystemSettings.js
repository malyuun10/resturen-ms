const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema(
  {
    restaurantName: {
      type: String,
      default: 'Royal Burgundy Restaurant'
    },
    address: {
      type: String,
      default: '123 Gourmet Way, Culinary City'
    },
    phone: {
      type: String,
      default: '+1 (555) 019-2834'
    },
    email: {
      type: String,
      default: 'contact@royalburgundy.local'
    },
    currency: {
      type: String,
      default: '$'
    },
    taxRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    receiptHeader: {
      type: String,
      default: 'Welcome to Royal Burgundy Restaurant'
    },
    receiptFooter: {
      type: String,
      default: 'Thank you for your visit! Please come again.'
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
      min: 1
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);

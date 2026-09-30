const mongoose = require('mongoose');

const inventoryHistorySchema = new mongoose.Schema(
  {
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true
    },
    itemName: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['sale', 'restock', 'adjustment', 'initial'],
      required: true
    },
    quantityChange: {
      type: Number,
      required: true
    },
    previousStock: {
      type: Number,
      required: true
    },
    newStock: {
      type: Number,
      required: true
    },
    reason: {
      type: String,
      default: ''
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    userName: {
      type: String,
      default: 'System'
    }
  },
  {
    timestamps: true
  }
);

inventoryHistorySchema.index({ menuItem: 1 });
inventoryHistorySchema.index({ createdAt: -1 });

module.exports = mongoose.model('InventoryHistory', inventoryHistorySchema);

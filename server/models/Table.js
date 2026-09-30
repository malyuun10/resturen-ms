const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema(
  {
    tableNumber: {
      type: String,
      required: [true, 'Table number or identifier is required'],
      unique: true,
      trim: true
    },
    capacity: {
      type: Number,
      required: [true, 'Table capacity is required'],
      default: 4,
      min: [1, 'Capacity must be at least 1']
    },
    status: {
      type: String,
      enum: ['available', 'occupied', 'reserved'],
      default: 'available'
    },
    currentOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Table', tableSchema);

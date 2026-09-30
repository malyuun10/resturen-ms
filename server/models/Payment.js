const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true
    },
    orderNumber: {
      type: String,
      required: true
    },
    cashier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    cashierName: {
      type: String,
      required: true
    },
    total: {
      type: Number,
      required: true,
      min: 0
    },
    amountPaid: {
      type: Number,
      required: true,
      min: 0
    },
    change: {
      type: Number,
      required: true,
      default: 0
    },
    paymentMethod: {
      type: String,
      enum: ['cash'],
      default: 'cash'
    },
    date: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ cashier: 1 });
paymentSchema.index({ orderNumber: 1 });

module.exports = mongoose.model('Payment', paymentSchema);

const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  onetimePasscode: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OneTimeCode' // references the OTP document
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'expired', 'cancelled'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Transaction', transactionSchema);

const mongoose = require('mongoose');

const oneTimeCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    minlength: 6,
    maxlength: 6
  },
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 900  // Automatically delete after 15 minutes (900 seconds)
  }
});

module.exports = mongoose.model('OneTimeCode', oneTimeCodeSchema);

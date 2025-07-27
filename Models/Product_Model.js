const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true,
    trim: true
  },

  brand: {
    type: String,
    trim: true
  },

  size: {
    type: String,
    trim: true
  },

  condition: {
    type: String,
    default: 'used'
  },

  images: {
    type: [String],
    required: true
  },

  colors: {
    type: [String],
    default: []
  },

  description: {
    type: String,
    trim: true,
    default: 'No description provided.'
  },

  tags: {
    type: [String],
    default: []
  },

  cost: {
    type: Number,
    required: true,
    min: 0
  },

  status: {
    type: String,
    enum: ['available', 'sold'],
    default: 'available'
  },

  category: {
    type: String,
    required: true,
    trim: true
  },

  carbonFootprint: { // also known as CO2
    type: Number, // in kilograms (kg CO2e)
    default: null
  },

  waterUsage: {
    type: Number, 
    default: null
  },

  owner: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: false,
      trim: true
    }
  },

  customer: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: {
      type: String,
      trim: true
    }
  }

}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);

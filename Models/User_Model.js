const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },

  lastName: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  phone: {
    type: String,
    trim: true
  },

  address: {
    type: String,
    trim: true,
    default: ''
  },

  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false
  },

  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    default: 'other'
  },

  dateOfBirth: {
    type: Date
  },

  profilePhoto: {
    type: String,
    default: ''
  },

  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },

  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],

  notifications: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notification'
  }],

  // 🌍 Sustainability / engagement tracking
  points: {
    type: Number,
    default: 0
  },
  waterSaved: {
    type: Number, // in liters
    default: 0
  },
  co2Saved: {
    type: Number, // in grams or kg
    default: 0
  },
  totalSwaps:{
    type:Number,
    default:0
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Add password comparison method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

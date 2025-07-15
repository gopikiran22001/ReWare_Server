const express = require('express');
const router = express.Router();
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

// Middleware
const upload = require('../MiddleWare/multer'); // Multer config
const cloudinaryUpload = require('../MiddleWare/upload_profile_picture'); // Single image uploader
const validateUserFields = require('../MiddleWare/validateUserFields');

// Models
const User = require('../Models/User');

// Middleware to parse cookies
router.use(cookieParser());
router.use(express.json())

// POST /api/register
router.post(
  '/register',
  upload.single('profile'),         // Handle single file upload from field name "profile"
  cloudinaryUpload,                 // Upload file to Cloudinary, set req.imageUrl
  validateUserFields,              // Validate fields (name, email, etc.)
  async (req, res) => {
    try {
      const { email } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      // Create new user
      const user = new User({
        ...req.body,
        profilePhoto: req.imageUrl || '', // fallback if no image uploaded
      });

      await user.save();

      // Generate JWT
      const token = jwt.sign(
        { _id: user._id, name: `${user.firstName} ${user.lastName}` },
        process.env.JWT_SECRET,
        { expiresIn: '3d' }
      );

      // Set token in HTTP-only cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Respond with user data (exclude password)
      const { password, ...userData } = user.toObject();

      res.status(201).json({
        message: 'User registered successfully',
        user: userData
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// POST /api/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = jwt.sign(
      { _id: user._id, name: `${user.firstName} ${user.lastName}` },
      process.env.JWT_SECRET,
      { expiresIn: '3d' }
    );

    // Set HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3 * 24 * 60 * 60 * 1000 // 3 days
    });

    const { password: _, ...userData } = user.toObject();

    res.status(200).json({
      message: 'Login successful',
      user: userData
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});


module.exports = router;

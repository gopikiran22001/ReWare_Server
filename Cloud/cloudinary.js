// cloudinary.js
require('dotenv').config();

const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'dplp1r0f0',
  api_key: '139891497934468',
  api_secret: process.env.CLOUDINARY_API_KEY,
});

module.exports = cloudinary;

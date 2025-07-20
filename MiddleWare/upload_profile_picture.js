const fs = require('fs').promises;
const cloudinary = require('../Cloud/cloudinary');

const cloudinaryUploadSingle = async (req, res, next) => {
  try {
    const file = req.file;

    // If no file is uploaded, skip to next middleware
    if (!file) return next();

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'profile_photos',
      use_filename: true,
      unique_filename: false,
      resource_type: 'image',
    });

    // Attach uploaded image URL to request
    req.profilePhoto = result.secure_url;

    // Delete temp file
    await fs.unlink(file.path);

    next(); // Continue to controller
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    return res.status(500).json({
      error: 'Profile photo upload failed',
      details: error.message
    });
  }
};

module.exports = cloudinaryUploadSingle;

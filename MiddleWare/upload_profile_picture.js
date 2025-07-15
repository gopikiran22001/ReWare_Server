const fs = require('fs').promises;
const cloudinary = require('../Cloud/cloudinary');

const cloudinaryUploadSingle = async (req, res, next) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'profile_photos',
      use_filename: true,
      unique_filename: false,
      resource_type: 'image',
    });

    // Attach URL to request
    req.imageUrl = result.secure_url;
    await fs.unlink(req.file.path); // remove local temp file
    next(); // proceed to controller
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    return res.status(500).json({ error: 'Profile photo upload failed', details: error.message });
  }
};

module.exports = cloudinaryUploadSingle;

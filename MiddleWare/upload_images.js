const fs = require('fs').promises;
const cloudinary = require('../Cloud/cloudinary');

const cloudinaryUploadMultiple = async (req, res, next) => {
  try {
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadPromises = files.map(file =>
      cloudinary.uploader.upload(file.path, {
        folder: 'product_images',
        use_filename: true,
        unique_filename: false,
        resource_type: 'image',
      })
    );

    const uploadResults = await Promise.all(uploadPromises);

    // Attach URLs to request object for later use
    req.imageUrls = uploadResults.map(result => result.secure_url);

    // Clean up temp files
    await Promise.all(files.map(file => fs.unlink(file.path)));

    next(); // continue to route handler
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    return res.status(500).json({ error: 'Image upload failed', details: error.message });
  }
};

module.exports = cloudinaryUploadMultiple;

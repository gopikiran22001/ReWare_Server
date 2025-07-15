const express = require('express');
const router = express.Router();
const cookieParser = require('cookie-parser');
const upload = require('../MiddleWare/multer'); // multer config
const cloudinaryUploadMultiple = require('../MiddleWare/upload_images');
const attachOwnerFromJWT = require('../MiddleWare/Attach_Owner');
const validateProductFields = require('../MiddleWare/Product_Validate');
const Product = require('../Models/Product_Model');

// Required to read cookies
router.use(cookieParser());
router.use(express.json());

// Route: POST /api/add-product
router.post(
  '/add-product',
  upload.array('images'),               
  cloudinaryUploadMultiple,                                       
  attachOwnerFromJWT,                      
  validateProductFields,                   
  async (req, res) => {
    try {
      const product = new Product({
        ...req.body,
        images: req.imageUrls
      });

      await product.save();

      res.status(201).json({
        message: 'Product created successfully',
        product
      });
    } catch (err) {
      console.error('Error saving product:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

module.exports = router;

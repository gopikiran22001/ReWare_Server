const express = require('express');
const router = express.Router();
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
router.use(cookieParser());
router.use(express.json());
const upload = require('../MiddleWare/multer'); // multer config
const cloudinaryUploadMultiple = require('../MiddleWare/upload_images');
const Authentication = require('../MiddleWare/Authentication');
const attachOwnerFromJWT = require('../MiddleWare/Attach_Owner');
const validateProductFields = require('../MiddleWare/Product_Validate');
const Product = require('../Models/Product_Model');



// GET /api/products
router.get(
  '/',
  async (req, res) => {
    try {
      const products = await Product.find().select('-customer -createdAt -updatedAt').sort({ createdAt: -1 }); // Newest first
      res.status(200).json({ products });
    } catch (error) {
      console.error('Error fetching products:', error.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

// Route: POST /api/add-product
router.post(
  '/',
  Authentication,
  upload.array('images'),
  cloudinaryUploadMultiple,
  attachOwnerFromJWT,
  validateProductFields,
  async (req, res) => {
    try {
      // console.log(req)
      const mlData = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(
          {
            brand: req.body.brand,
            category: req.body.category
          }
        )
      });


      const data = await mlData.json();
      // console.log(data)

      const product = new Product({
        ...req.body,
        images: req.imageUrls,
        carbonFootprint: data.co2_emissions,
        waterUsage: data.water_consumption,
        owner: {
          _id: req.owner._id,
          name: req.owner.name
        },
        customer: {}
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

router.delete(
  '/',
  Authentication,
  attachOwnerFromJWT,
  async (req, res) => {
    try {
      const { productId } = req.query;


      if (!productId || productId.length !== 24) {
        return res.status(400).json({ error: 'Invalid product ID' });
      }

      const product = await Product.findById(productId);

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Check ownership
      if (product.owner._id.toString() !== req.owner._id.toString()) {
        return res.status(403).json({ error: 'Unauthorized to delete this product' });
      }

      await Product.findByIdAndDelete(productId);

      res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
      console.error('Error deleting product:', error.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Route: GET /api/products/search?search=yourQuery
router.get(
  '/search',
  async (req, res) => {
    try {
      const { searchQuery } = req.query;

      if (!searchQuery) {
        return res.status(400).json({ error: 'Search query is required' });
      }

      // Case-insensitive search on 'title' and 'description' fields
      const products = await Product.find({
        $or: [
          { title: { $regex: searchQuery, $options: 'i' } },
          { description: { $regex: searchQuery, $options: 'i' } }
        ]
      }).select('-customer -createdAt -updatedAt').sort({ createdAt: -1 });

      res.status(200).json({ products });
    } catch (error) {
      console.error('Search error:', error.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

router.get(
  '/my-products',
  Authentication,
  attachOwnerFromJWT,
  async (req, res) => {
    try {
      const myProducts = await Product.find({ owner: req.owner.id }).sort({ createdAt: -1 });
      res.json({ products: myProducts });
    } catch (error) {
      console.error('Error fetching my products:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

router.get(
  '/byId',
  async (req, res) => {
    try {
      const { productId } = req.query;

      if (!productId) {
        return res.status(400).json({ error: 'Search query is required' });
      }

      // Case-insensitive search on 'title' and 'description' fields
      const product = await Product.findById(productId).select('-customer -createdAt -updatedAt').sort({ createdAt: -1 });
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.status(200).json({ products });
    } catch (error) {
      console.error('Search error:', error.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  });


module.exports = router;

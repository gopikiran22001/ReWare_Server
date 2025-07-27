const express = require('express');
const cookieParser = require('cookie-parser');
const router = express.Router();
const Request = require('../Models/Request_Model');
const Authentication = require('../MiddleWare/Authentication');
const attachOwnerFromJWT = require('../MiddleWare/Attach_Owner');
const Product = require('../Models/Product_Model');
const Notification = require('../Models/Notification_Model');

router.use(cookieParser());
router.use(express.json());

router.get(
  '/all',
  Authentication,
  attachOwnerFromJWT,
  async (req, res) => {
    try {
      const userId = req.owner._id;

      const requests = await Request.find({
        $or: [{ owner: userId }, { customer: userId }]
      }).sort({ createdAt: -1 }); // latest first

      if (!requests) {
        return res.status(404).json({ message: 'No requests found' });
      }

      res.status(200).json(requests);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

router.get(
  '/',
  Authentication,
  attachOwnerFromJWT,
  async (req, res) => {
    try {
      const userId = req.owner._id;
      const requestId = req.query.requestId;

      const request = await Request.findOne({
        _id: requestId,
        $or: [{ owner: userId }, { customer: userId }]
      });

      if (!request) {
        return res.status(404).json({ message: 'Request not found or access denied' });
      }

      res.status(200).json(request);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

router.post(
  '/',
  Authentication,
  attachOwnerFromJWT,
  async (req, res) => {
    try {
      const customerId = req.owner._id; // logged-in user as customer
      const { productId } = req.body;

      if (!productId) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      const newRequest = new Request({
        owner: product.owner._id,
        customer: customerId,
        product: productId,
        status: 'pending', // default status, customize as needed
      });

      await newRequest.save();

      const newNotification = new Notification({
        userId: product.owner._id,
        header: "New Request Received",
        message: `You have received a new request for your product ${product.name}`,
        type: 'system',
        link: {
          _id: newRequest._id,
          type: 'request'
        },
        createdAt: new Date()
      });

      await newNotification.save();


      res.status(201).json({ message: 'Request created successfully', request: newRequest._id });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

router.put(
  '/accept',
  Authentication,
  attachOwnerFromJWT,
  async (req, res) => {
    try {
      const userId = req.owner._id;
      const { requestId } = req.query;

      const request = await Request.findById(requestId);

      if (!request) {
        return res.status(404).json({ message: 'Request not found' });
      }

      // Ensure the logged-in user is the owner of the product
      if (request.owner.toString() !== userId.toString()) {
        return res.status(403).json({ message: 'Unauthorized: Not the product owner' });
      }
      if (request.status !== 'pending') {
        return res.status(400).json({ message: 'Request already processed' });
      }
      const product = await Product.findById(request.product);
      if (!product || product.owner.toString() !== userId.toString() || product.status === 'available') {
        return res.status(400).json({ message: 'Invalid product or ownership mismatch' });
      }

      const existingTransaction = await Transaction.findOne({
        product: request.product,
        status: 'pending'
      });

      if (existingTransaction) {
        return res.status(409).json({
          message: 'A pending transaction already exists for this product',
          transactionId: existingTransaction._id
        });
      }

      const transaction = await Transaction.create({
        customer: request.customer,
        owner: request.owner,
        product: request.product,
        status: 'pending',
      });

      const newNotification = new Notification({
        userId: request.customer,
        header: "Request Accepted",
        message: `Your request for ${product.name} has been accepted.`,
        type: 'system',
        link: {
          _id: request._id,
          type: 'request'
        },
        createdAt: new Date()
      });

      await newNotification.save();

      // Update Request with transaction and accepted status
      request.transactionId = transaction._id;
      request.status = 'accepted';
      await request.save();

      res.status(200).json({
        message: 'Request accepted and transaction created',
        transactionId: transaction._id
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);


router.put(
  '/reject',
  Authentication,
  attachOwnerFromJWT,
  async (req, res) => {
    try {
      const userId = req.owner._id;
      const { requestId } = req.query;

      const request = await Request.findById(requestId);

      if (!request) {
        return res.status(404).json({ message: 'Request not found' });
      }

      // Ensure the logged-in user is the owner of the product
      if (request.owner.toString() !== userId.toString()) {
        return res.status(403).json({ message: 'Unauthorized: Not the product owner' });
      }
      if (request.status !== 'pending') {
        return res.status(400).json({ message: 'Request already processed' });
      }
      const product = await Product.findById(request.product);
      if (!product || product.owner.toString() !== userId.toString()) {
        return res.status(400).json({ message: 'Invalid product or ownership mismatch' });
      }

      const newNotification = new Notification({
        userId: request.customer,
        header: "Request Rejected",
        message: `Your request for ${product.name} has been rejected.`,
        type: 'system',
        link: {
          _id: request._id,
          type: 'request'
        },
        createdAt: new Date()
      });

      await newNotification.save();

      request.status = 'rejected';
      await request.save();

      res.status(200).json({
        message: 'Request Rejected'
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);


router.put(
  '/cancel',
  Authentication,
  attachOwnerFromJWT,
  async (req, res) => {
    try {
      const userId = req.owner._id;
      const { requestId } = req.query;

      const request = await Request.findById(requestId);

      if (!request) {
        return res.status(404).json({ message: 'Request not found' });
      }

      // Ensure the logged-in user is the owner of the product
      if (request.customer.toString() !== userId.toString()) {
        return res.status(403).json({ message: 'Unauthorized: Not the product owner' });
      }
      if (request.status !== 'pending') {
        return res.status(400).json({ message: 'Request already processed' });
      }
      const product = await Product.findById(request.product);
      if (!product || product.owner.toString() !== userId.toString()) {
        return res.status(400).json({ message: 'Invalid product or ownership mismatch' });
      }

      const newNotification = new Notification({
        userId: request.customer,
        header: "Request Canceled",
        message: `The Request for ${product.name} has been Canceled.`,
        type: 'system',
        link: {
          _id: request._id,
          type: 'request'
        },
        createdAt: new Date()
      });

      await newNotification.save();

      request.status = 'cancelled';
      await request.save();

      res.status(200).json({
        message: 'Request Rejected'
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

module.exports = router;
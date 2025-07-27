const express = require('express');
const cookieParser = require('cookie-parser');
const router = express.Router();
const Authentication = require('../MiddleWare/Authentication');
const attachOwnerFromJWT = require('../MiddleWare/Attach_Owner');
const Request = require('../Models/Request_Model');
const Product = require('../Models/Product_Model');
const Transaction = require('../Models/Transaction_Model');
const User = require('../Models/User_Model');
const OneTimeCode = require('../Models/OTP_Model');

router.use(cookieParser());
router.use(express.json());

// Helper function to generate a 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

router.get(
  '/',
  Authentication,
  attachOwnerFromJWT,
  async (req, res) => {
    try {
      const userId = req.owner._id;

      const transactions = await Transaction.find({
        $or: [
          { owner: userId },
          { customer: userId }
        ]
      }).select('-onetimePasscode');

      res.status(200).json({ transactions });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });


// Route to accept a transaction (customer generates OTP, owner confirms with it)
router.put(
  '/',
  Authentication,
  attachOwnerFromJWT,
  async (req, res) => {
    try {
      const userId = req.owner._id;
      const { transactionId, onetimePasscode } = req.body;

      const transaction = await Transaction.findById(transactionId);
      if (!transaction || transaction.status !== 'pending') {
        return res.status(400).json({ message: 'Invalid or already processed transaction' });
      }

      // Step 1: CUSTOMER generates OTP
      if (transaction.customer.toString() === userId.toString()) {
        let OTP = await OneTimeCode.findById(transaction.onetimePasscode);
        if (!OTP) {
          const newCode = generateOTP();
          const otpDoc = await OneTimeCode.create({
            transaction: transactionId,
            onetimePasscode: newCode
          });
          transaction.onetimePasscode = otpDoc._id;
          await transaction.save();
          OTP = otpDoc;
        }
        return res.status(200).json({ message: 'OTP generated', otpId: OTP._id });
      }

      // Step 2: OWNER verifies OTP and finalizes transaction
      if (transaction.owner.toString() === userId.toString()) {
        const otpDoc = await OneTimeCode.findById(onetimePasscode);

        if (!otpDoc || otpDoc.transaction.toString() !== transactionId.toString()) {
          return res.status(400).json({ message: 'Invalid or mismatched OTP' });
        }

        const product = await Product.findById(transaction.product);
        if (!product || product.status !== 'available') {
          return res.status(400).json({ message: 'Product not available' });
        }

        const customer = await User.findById(transaction.customer);
        const owner = await User.findById(transaction.owner);

        if (!customer || customer.points < product.cost) {
          return res.status(400).json({ message: 'Customer has insufficient points' });
        }

        if (!owner || owner._id.toString() !== product.owner._id.toString()) {
          return res.status(400).json({ message: 'Ownership mismatch' });
        }

        // Transfer points and update product
        customer.points -= product.cost;
        customer.totalSwaps += 1;

        owner.points += product.cost;
        owner.totalSwaps += 1;

        product.status = 'sold';
        product.customer = {
          _id: customer._id,
          name: `${customer.firstName} ${customer.lastName}`
        };

        transaction.status = 'accepted';

        const newNotification1 = new Notification({
          userId: customer._id,
          header: "Transaction Completed",
          message: `The transaction for ${product.name} has been Completed.`,
          type: 'system',
          link: {
            _id: newRequest._id,
            type: 'request'
          },
          createdAt: new Date()
        });



        const newNotification2 = new Notification({
          userId: owner._id,
          header: "Transaction Completed",
          message: `The transaction for ${product.name} has been Completed.`,
          type: 'system',
          link: {
            _id: newRequest._id,
            type: 'request'
          },
          createdAt: new Date()
        });


        // Save all updates
        await Promise.all([
          product.save(),
          customer.save(),
          owner.save(),
          transaction.save(),
          newNotification1.save(),
          newNotification2.save()
        ]);

        return res.status(200).json({ message: 'Exchange successful' });
      }

      return res.status(403).json({ message: 'Unauthorized: Not part of this transaction' });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);


router.delete(
  '/',
  Authentication,
  attachOwnerFromJWT,
  async (req, res) => {
    try {
      const userId = req.owner._id;
      const { transactionId } = req.body;

      const transaction = await Transaction.findById(transactionId);
      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }

      // Only allow cancel if status is still pending
      if (transaction.status !== 'pending') {
        return res.status(400).json({ message: 'Only pending transactions can be cancelled' });
      }

      // Only owner or customer can cancel
      const isOwner = transaction.owner.toString() === userId.toString();
      const isCustomer = transaction.customer.toString() === userId.toString();

      if (!isOwner && !isCustomer) {
        return res.status(403).json({ message: 'Unauthorized to cancel this transaction' });
      }

      // Optionally, mark product as available again
      const product = await Product.findById(transaction.product);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      product.status = 'available';

      const newNotification = new Notification({
        userId: isOwner ? transaction.customer : transaction.owner,
        header: "Transaction Canceled",
        message: `The transaction for ${product.name} has been canceled.`,
        type: 'system',
        link: {
          _id: newRequest._id,
          type: 'request'
        },
        createdAt: new Date()
      });

      await newNotification.save();

      // Cancel the transaction
      transaction.status = 'cancelled';
      await transaction.save();
      await product.save();

      return res.status(200).json({ message: 'Transaction cancelled successfully' });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);


module.exports = router;

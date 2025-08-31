const express = require('express');
const cookieParser = require('cookie-parser');
const router = express.Router();
const Authentication = require('../MiddleWare/Authentication');
const attachOwnerFromJWT = require('../MiddleWare/Attach_Owner');
const Notification = require('../Models/Notification_Model');
const Product = require('../Models/Product_Model');
const Request = require('../Models/Request_Model');
const Transaction = require('../Models/Transaction_Model');


router.use(cookieParser());
router.use(express.json());

router.get(
    '/',
    Authentication,
    attachOwnerFromJWT,
    async (req, res) => {
        try {
            const userId = req.owner._id;
            const notifications = await Notification.find({ userId })
                .sort({ createdAt: -1 });
            res.status(200).json(notifications);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
);

router.get(
    '/:notificationId',
    Authentication,
    attachOwnerFromJWT,
    async (req, res) => {
        try {
            const { notificationId } = req.params;

            if (!mongoose.Types.ObjectId.isValid(notificationId)) {
                return res.status(400).json({ error: 'Invalid notification ID' });
            }

            const notification = await Notification.findById(notificationId)
                .populate('userId', 'firstName lastName')
                .populate('productId')
                .lean();

            if (!notification) {
                return res.status(404).json({ error: 'Notification not found' });
            }

            if (notification.userId._id.toString() !== req.owner._id.toString()) {
                return res.status(403).json({ error: 'Unauthorized to view this notification' });
            }

            let detailedNotification = { ...notification };


            if (notification.link?._id && notification.link?.type) {
                const productPromise = Product.findById(notification.productId)
                    .select('-customer -createdAt -updatedAt')
                    .lean();

                let linkedPromise;

                if (notification.link.type === 'request') {
                    linkedPromise = Request.findById(notification.link._id)
                        .select('-transactionId -createdAt')
                        .lean();
                } else if (notification.link.type === 'transaction') {
                    linkedPromise = Transaction.findById(notification.link._id)
                        .select('-onetimePasscode -createdAt')
                        .lean();
                }

                const [product, linkedData] = await Promise.all([productPromise, linkedPromise]);

                detailedNotification.productDetails = product;

                if (notification.link.type === 'request') {
                    detailedNotification.requestDetails = linkedData;
                } else if (notification.link.type === 'transaction') {
                    detailedNotification.transactionDetails = linkedData;
                }
            }

            res.status(200).json(detailedNotification);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
);

module.exports = router;
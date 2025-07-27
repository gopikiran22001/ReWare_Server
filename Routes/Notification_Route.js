const express = require('express');
const cookieParser = require('cookie-parser');
const router = express.Router();
const Authentication = require('../MiddleWare/Authentication');
const attachOwnerFromJWT = require('../MiddleWare/Attach_Owner');
const Notification = require('../Models/Notification_Model');

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
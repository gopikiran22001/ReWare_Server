// models/Notification.js

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: true,
    },
    header: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product' // Reference to the User model
    },
    type: {
        type: String,
        enum: ['message', 'request', 'transaction', 'alert', 'system'], // You can customize these
        default: 'system',
    },
    read: {
        type: Boolean,
        default: false,
    },
    link: {
        _id: {
            type: mongoose.Schema.Types.ObjectId,
            default: null
        },
        type: {
            type: String,
            default: null
        }
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model('Notification', notificationSchema);

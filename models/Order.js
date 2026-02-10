const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        unique: true,
        default: function () {
            return 'SVL-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
        }
    },
    customerDetails: {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true },
        email: { type: String, required: true }
    },
    items: [{
        planName: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, default: 1 }
    }],
    totalPrice: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'],
        default: 'Pending'
    },
    paymentMethod: {
        type: String,
        default: 'cod'
    },
    firebaseUid: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    deliveredAt: {
        type: Date,
        default: null
    }
});

module.exports = mongoose.model('Order', orderSchema);

import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    userEmail: { type: String },
    items: [
        {
            id: String,
            name: String,
            price: Number,
            quantity: Number,
        }
    ],
    totalAmount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['razorpay', 'cod', 'gpay', 'phonepe', 'upi'], required: true },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    customer: {
        name: String,
        phone: String,
        address: String,
    },
    // Order lifecycle
    status: { type: String, default: 'processing' },
    orderStatus: { type: String, default: 'Placed' },

    // Delivery
    deliveryPersonId: { type: String, default: '' },
    deliveryStatus: { type: String, default: '' },
    deliveredAt: { type: Date },

    // History log
    statusHistory: [{
        status: String,
        updatedBy: String,
        role: String,
        timestamp: { type: Date, default: Date.now }
    }],

    coupon: { type: String },
    subtotal: { type: Number },
    discount: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);

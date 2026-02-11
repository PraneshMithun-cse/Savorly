const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    price: { type: Number, required: true },
    billingPeriod: { type: String, default: '/week' },
    description: { type: String },
    features: [{ type: String }],
    image: { type: String },
    infoContent: [{ type: String }], // For the rotating text
    isPopular: { type: Boolean, default: false },
    badgeColor: { type: String, default: 'silver' } // class name for badge style
}, { timestamps: true });

module.exports = mongoose.model('Plan', planSchema);

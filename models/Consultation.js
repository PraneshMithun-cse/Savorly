const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    program: {
        type: String,
        required: true,
        enum: ['90-day', '120-day', 'other'], // 'other' for flexibility
        default: '90-day'
    },
    preferredTime: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Completed', 'Cancelled'],
        default: 'Pending'
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Consultation', consultationSchema);

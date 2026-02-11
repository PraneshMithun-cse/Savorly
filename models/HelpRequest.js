const mongoose = require('mongoose');

const helpRequestSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    userName: { type: String },
    userEmail: { type: String },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['Open', 'In Progress', 'Resolved'], default: 'Open' },
    adminResponse: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('HelpRequest', helpRequestSchema);

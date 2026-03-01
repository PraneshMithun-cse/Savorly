import mongoose from 'mongoose';

const AddressSchema = new mongoose.Schema({
    label: { type: String, default: 'Home' },
    name: String,
    phone: String,
    doorNo: String,
    apartment: String,
    street: String,
    line1: String, // Area / Colony
    landmark: String,
    city: String,
    state: String,
    pincode: String
});

const UserSchema = new mongoose.Schema({
    firebaseUid: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    name: { type: String },
    profilePic: { type: String },
    role: { type: String, default: 'user' },
    phone: { type: String },
    addresses: [AddressSchema]
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);

import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
    userEmail: { type: String, required: true },
    userName: { type: String, required: true },
    userPhone: { type: String, default: 'Not Provided' },
    slotName: { type: String, required: true },
    spaceId: { type: Number, required: true },
    carNumber: { type: String, required: true },
    carModel: { type: String, required: true },
    startMs: { type: Number, required: true },
    endMs: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ['Active', 'Completed', 'Cancelled'], default: 'Active' },
    paymentMethod: { type: String, enum: ['UPI', 'Wallet', 'Pay at Counter', 'Card'], required: true },
    paymentStatus: { type: String, enum: ['Pending', 'Verified'], required: true },
    entryTime: { type: Date },
    exitTime: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

export const Booking = mongoose.model('Booking', bookingSchema);

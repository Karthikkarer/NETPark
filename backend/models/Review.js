import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    email: { type: String, required: true },
    phone: { type: String, required: true },
    transactionId: { type: String, required: false },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

export const Review = mongoose.model('Review', reviewSchema);

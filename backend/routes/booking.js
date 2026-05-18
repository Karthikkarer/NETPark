import express from 'express';
import { Booking } from '../models/Booking.js';
import { ParkingSlot } from '../models/ParkingSlot.js';
import { User } from '../models/User.js';
import { Transaction } from '../models/Transaction.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, async (req, res) => {
    let { slotId, startTime, endTime, totalAmount, paymentMethod } = req.body;

    if (paymentMethod === 'Wallet') {
        const user = await User.findById(req.user.id);
        if (user.walletBalance < totalAmount) {
            return res.status(400).json({ error: 'Insufficient wallet balance' });
        }
        // Deduct
        user.walletBalance -= totalAmount;
        await user.save();
        await Transaction.create({ userId: user._id, amount: totalAmount, type: 'debit', description: 'Booking slot paid via wallet' });
    }

    // Update slot status
    const slot = await ParkingSlot.findById(slotId);
    slot.isAvailable = false;
    await slot.save();

    const booking = await Booking.create({
        userId: req.user.id,
        slotId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        totalAmount,
        paymentMethod
    });

    res.status(201).json({ message: 'Booking successful', booking });
});

router.get('/my-bookings', protect, async (req, res) => {
    // Check the model ref is strictly "ParkingSlot" in the populate
    const bookings = await Booking.find({ userId: req.user.id }).populate('slotId');
    res.json(bookings);
});

router.get('/all', protect, adminOnly, async (req, res) => {
    const bookings = await Booking.find({}).populate('slotId userId');
    res.json(bookings);
});

export default router;

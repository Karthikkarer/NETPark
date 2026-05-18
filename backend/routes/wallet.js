import express from 'express';
import { User } from '../models/User.js';
import { Transaction } from '../models/Transaction.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/add-money', protect, async (req, res) => {
    const { amount, description } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

    const user = await User.findById(req.user.id);
    user.walletBalance += amount;
    await user.save();

    const transaction = await Transaction.create({
        userId: user._id,
        amount,
        type: 'credit',
        description: description || 'Wallet Deposit'
    });

    res.json({ message: 'Money added successfully', balance: user.walletBalance, transaction });
});

router.get('/balance', protect, async (req, res) => {
    const user = await User.findById(req.user.id);
    res.json({ balance: user.walletBalance });
});

router.get('/transactions', protect, async (req, res) => {
    const transactions = await Transaction.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ transactions });
});

export default router;

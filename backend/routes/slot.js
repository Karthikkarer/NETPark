import express from 'express';
import { ParkingSlot } from '../models/ParkingSlot.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
    const slots = await ParkingSlot.find({});
    res.json(slots);
});

router.post('/', protect, adminOnly, async (req, res) => {
    try {
        const slot = await ParkingSlot.create(req.body);
        res.status(201).json(slot);
    } catch (err) {
        console.error("SLOT CREATION ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', protect, adminOnly, async (req, res) => {
    const slot = await ParkingSlot.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(slot);
});

router.delete('/:id', protect, adminOnly, async (req, res) => {
    await ParkingSlot.findByIdAndDelete(req.params.id);
    res.json({ message: 'Slot deleted successfully' });
});

router.post('/toggle-ai', protect, adminOnly, async (req, res) => {
    try {
        const { isAiEnabled } = req.body;
        await ParkingSlot.updateMany({}, { isAiEnabled });
        res.json({ message: `Global AI Pricing ${isAiEnabled ? 'Enabled' : 'Disabled'}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Mock AI endpoint for smart recommendation
router.post('/smart-recommend', async (req, res) => {
    const { lat, lng, time } = req.body;
    // Mock logic: return a randomly selected "best" available slot
    const slots = await ParkingSlot.find({ isAvailable: true });
    if (slots.length === 0) return res.status(404).json({ error: 'No slots available' });

    // Pick a random available slot to simulate AI suggestion
    const bestSlot = slots[Math.floor(Math.random() * slots.length)];
    res.json({ suggestion: bestSlot, reason: 'AI suggested closest and least crowded location based on current demand.' });
});

export default router;

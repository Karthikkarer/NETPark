import express from 'express';
import { ParkingSlot } from '../models/ParkingSlot.js';

const router = express.Router();

// Mock function to simulate AI prediction/recommendation
function simulateAILogic(slots) {
    if (!slots || slots.length === 0) return [];

    // Prioritize slots that are available, cheapest, and perhaps have good reviews or closer to the user 
    // In a real scenario, this would call a Python microservice with an ML Model
    const scoredSlots = slots.map(slot => {
        let score = 100;
        if (slot.isOccupied) score -= 1000;
        score -= slot.pricePerHour * 0.5; // cheaper is better
        if (slot.type === 'VIP') score += 10;
        
        return {
            ...slot.toObject(),
            aiScore: score,
            aiReason: score > 50 ? 'Recommended (Best Price & Available)' : 'Alternative'
        };
    });

    // Sort by AI Score descending
    scoredSlots.sort((a, b) => b.aiScore - a.aiScore);

    return scoredSlots.slice(0, 3); // Return top 3 suggestions
}

router.get('/recommend', async (req, res) => {
    try {
        const slots = await ParkingSlot.find({ isOccupied: false });
        
        const recommendations = simulateAILogic(slots);

        res.json({
            message: "AI Smart Parking Recommendations",
            suggestions: recommendations
        });
    } catch (err) {
        console.error("AI Route Error:", err);
        res.status(500).json({ error: "Failed to generate AI recommendations" });
    }
});

// Dynamic pricing calculation based on occupancy
router.get('/dynamic-pricing', async (req, res) => {
    try {
        const totalSlots = await ParkingSlot.countDocuments();
        const occupiedSlots = await ParkingSlot.countDocuments({ isOccupied: true });

        const occupancyRate = totalSlots > 0 ? (occupiedSlots / totalSlots) : 0;
        
        // If occupancy is > 80%, increase price by 50%
        // If occupancy is > 50%, increase price by 20%
        let surgeMultiplier = 1.0;
        if (occupancyRate > 0.8) surgeMultiplier = 1.5;
        else if (occupancyRate > 0.5) surgeMultiplier = 1.2;

        res.json({
            occupancyRate: (occupancyRate * 100).toFixed(2) + '%',
            surgeMultiplier,
            message: `Demand is ${occupancyRate > 0.8 ? 'High' : occupancyRate > 0.5 ? 'Moderate' : 'Low'}. Prices are adjusted by ${surgeMultiplier}x.`
        });
    } catch (err) {
        console.error("Pricing Engine Error:", err);
        res.status(500).json({ error: "Failed to calculate dynamic pricing" });
    }
});

export default router;

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import bookingRoutes from './routes/booking.js';
import walletRoutes from './routes/wallet.js';
import slotRoutes from './routes/slot.js';
import aiRoutes from './routes/ai.js';
import alprRoutes from './routes/alpr.js';
import { ParkingSlot } from './models/ParkingSlot.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// API Health Check Route
app.get('/', (req, res) => {
    res.status(200).json({ 
        message: 'NETPark API Server is Live & Running! 🚀', 
        status: 'Operational', 
        endpoints: ['/api/auth', '/api/bookings', '/api/slots', '/api/wallet', '/api/alpr']
    });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/alpr', alprRoutes);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/netpark';

const seedDefaultSlots = async () => {
    try {
        const initialHubliBranches = [
            { locationName: 'NETPark Vidya Nagar', slotNumber: 'Hubli', isAvailable: true, bikePrice: 30, carPrice: 50, coordinates: { lat: 15.366138, lng: 75.118796 } },
            { locationName: 'NETPark Gokul Road', slotNumber: 'Hubli', isAvailable: true, bikePrice: 20, carPrice: 40, coordinates: { lat: 15.350735, lng: 75.106196 } },
            { locationName: 'NETPark Keshwapur', slotNumber: 'Hubli', isAvailable: true, bikePrice: 15, carPrice: 30, coordinates: { lat: 15.360716, lng: 75.124945 } },
            { locationName: 'NETPark Hosur Road', slotNumber: 'Hubli', isAvailable: true, bikePrice: 25, carPrice: 45, coordinates: { lat: 15.362352, lng: 75.117154 } },
            { locationName: 'NETPark Navanagar', slotNumber: 'Hubli', isAvailable: true, bikePrice: 20, carPrice: 35, coordinates: { lat: 15.398652, lng: 75.062716 } }
        ];

        for (const branch of initialHubliBranches) {
            const exists = await ParkingSlot.findOne({ locationName: branch.locationName });
            if (!exists) {
                await ParkingSlot.create(branch);
                console.log(`Auto-seeded slot: ${branch.locationName}`);
            }
        }
    } catch (e) {
        console.error("Auto-seeding default slots failed", e);
    }
};

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        seedDefaultSlots();
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB. The database operations will fail.');
    });

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

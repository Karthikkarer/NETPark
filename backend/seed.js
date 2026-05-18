import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ParkingSlot } from './models/ParkingSlot.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/netpark';

const initialHubliBranches = [
    { locationName: 'NETPark Vidya Nagar', slotNumber: 'Hubli', isAvailable: true, bikePrice: 30, carPrice: 50, coordinates: { lat: 15.366138, lng: 75.118796 } },
    { locationName: 'NETPark Gokul Road', slotNumber: 'Hubli', isAvailable: true, bikePrice: 20, carPrice: 40, coordinates: { lat: 15.350735, lng: 75.106196 } },
    { locationName: 'NETPark Keshwapur', slotNumber: 'Hubli', isAvailable: true, bikePrice: 15, carPrice: 30, coordinates: { lat: 15.360716, lng: 75.124945 } },
    { locationName: 'NETPark Hosur Road', slotNumber: 'Hubli', isAvailable: true, bikePrice: 25, carPrice: 45, coordinates: { lat: 15.362352, lng: 75.117154 } },
    { locationName: 'NETPark Navanagar', slotNumber: 'Hubli', isAvailable: true, bikePrice: 20, carPrice: 35, coordinates: { lat: 15.398652, lng: 75.062716 } }
];

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('Connected to MongoDB');
        for (const branch of initialHubliBranches) {
            const exists = await ParkingSlot.findOne({ locationName: branch.locationName });
            if (!exists) {
                await ParkingSlot.create(branch);
                console.log(`Created ${branch.locationName}`);
            }
        }
        console.log('Seeding complete');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB', error);
        process.exit(1);
    });

import mongoose from 'mongoose';

const slotSchema = new mongoose.Schema({
    locationName: { type: String, required: true },
    slotNumber: { type: String, default: 'General' },
    isAvailable: { type: Boolean, default: true },
    bikePrice: { type: Number, required: true },
    carPrice: { type: Number, required: true },
    carSpaces: { type: Number, default: 10 },
    bikeSpaces: { type: Number, default: 5 },
    isAiEnabled: { type: Boolean, default: true },
    coordinates: {
        lat: { type: Number },
        lng: { type: Number }
    }
});

export const ParkingSlot = mongoose.model('ParkingSlot', slotSchema);

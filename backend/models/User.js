import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  adminStatus: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' }, 
  isMasterAdmin: { type: Boolean, default: false },
  walletBalance: { type: Number, default: 500 }, 
  branchAddress: { type: String },
  isBlocked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', userSchema);

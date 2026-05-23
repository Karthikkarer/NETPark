import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { OTPVerification } from '../models/OTP_Verification.js';
import { Booking } from '../models/Booking.js';
import { Review } from '../models/Review.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Proper SMTP Connection Logic 
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.SMTP_EMAIL, 
        pass: process.env.SMTP_PASSWORD
    }
});

// AUTO-SEED MASTER ADMIN ON STARTUP
const seedMasterAdmin = async () => {
    try {
        const masterEmail = "begurshatershivaraj@gmail.com";
        const masterPass = "Shivaraj#12345";
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(masterPass, salt);

        const existing = await User.findOne({ email: masterEmail });
        if (!existing) {
            const master = new User({
                name: "Shivaraj Master Admin",
                email: masterEmail,
                phone: "9999999999",
                password: hashedPassword,
                role: 'admin',
                adminStatus: 'Approved',
                isMasterAdmin: true,
                walletBalance: 999999
            });
            await master.save();
            console.log('--- MASTER ADMIN SYSTEM SEEDED ---');
        } else {
            // Force Sync: Update master admin password if it's mismatched or for reliability
            existing.password = hashedPassword;
            existing.role = 'admin';
            existing.isMasterAdmin = true;
            existing.adminStatus = 'Approved';
            await existing.save();
            console.log('--- MASTER ADMIN SECURITY RE-SYNCED ---');
        }
    } catch (e) {
        console.error("Master Seeding Failed", e);
    }
};
seedMasterAdmin();

const isStrongPassword = (password) => {
    const minLength = 7;
    const hasAlpha = /[a-zA-Z]/.test(password);
    const hasNum = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    return password.length >= minLength && hasAlpha && hasNum && hasSpecial;
};

router.post('/register', async (req, res) => {
    try {
        const { name, email, phone, password, role, branchAddress } = req.body;
        
        if (!isStrongPassword(password)) {
            return res.status(400).json({ error: 'SECURITY_WEAKNESS: Password must be at least 7 characters and contain alpha, numeric, and special characters.' });
        }

        const isJoiningAsAdmin = role === 'admin';

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new User({
            name,
            email,
            phone,
            password: hashedPassword,
            role: role || 'user',
            adminStatus: isJoiningAsAdmin ? 'Pending' : 'Approved',
            walletBalance: 500, // Bonus for sign up
            branchAddress: isJoiningAsAdmin ? branchAddress : undefined
        });

        await user.save();
        
        const message = isJoiningAsAdmin 
            ? 'Admin registration sent! Waiting for Master Admin approval (24hr SLA).' 
            : 'User registered successfully';
            
        res.status(201).json({ message });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email.toLowerCase().trim();
        const masterEmail = "begurshatershivaraj@gmail.com";
        const masterPass = "Shivaraj#12345";

        console.log(`[LOGIN ATTEMPT]: ${normalizedEmail}`);

        // MASTER ADMIN ELITE BYPASS & AUTO-HEAL
        if (normalizedEmail === masterEmail && password === masterPass) {
            console.log("--- MASTER ELITE BYPASS ACTIVATED ---");
            let user = await User.findOne({ email: masterEmail });
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(masterPass, salt);

            if (!user) {
                user = new User({
                    name: "Shivaraj Master Admin",
                    email: masterEmail,
                    phone: "9999999999",
                    password: hashedPassword,
                    role: 'admin',
                    adminStatus: 'Approved',
                    isMasterAdmin: true
                });
            } else {
                user.password = hashedPassword;
                user.role = 'admin';
                user.isMasterAdmin = true;
                user.adminStatus = 'Approved';
            }
            await user.save();

            // INSTANT AUTHORIZATION FOR MASTER
            const token = jwt.sign({ id: user._id, role: user.role, isMaster: true }, process.env.JWT_SECRET || 'secret123', { expiresIn: '1d' });
            return res.json({ 
                message: 'Master Login successful', 
                token, 
                user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, isMaster: true, walletBalance: user.walletBalance } 
            });
        }

        const user = await User.findOne({ email: normalizedEmail });
        if (!user) return res.status(400).json({ error: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

        if (user.isBlocked) {
            return res.status(403).json({ error: 'ACCOUNT_SUSPENDED: Your access to the NETPark Gateway has been administratively revoked.' });
        }

        // Admin Security Check
        if (user.role === 'admin' && !user.isMasterAdmin) {
            if (user.adminStatus === 'Pending') {
                return res.status(401).json({ error: 'Your request is pending. It will be accepted in 24 hours.' });
            }
            if (user.adminStatus === 'Rejected') {
                return res.status(401).json({ error: 'You are not eligible. If any query contact begurshatershivaraj@gmail.com' });
            }
        }

        const token = jwt.sign({ id: user._id, role: user.role, isMaster: user.isMasterAdmin }, process.env.JWT_SECRET || 'secret123', { expiresIn: '1d' });

        res.json({ 
            message: 'Login successful', 
            token, 
            user: { 
                id: user._id, 
                name: user.name, 
                email: user.email, 
                phone: user.phone,
                role: user.role, 
                isMaster: user.isMasterAdmin,
                walletBalance: user.walletBalance 
            } 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin Approval Routes
router.post('/admin/approve', async (req, res) => {
    try {
        const { adminId, masterEmail } = req.body;
        const master = await User.findOne({ email: masterEmail });
        if (!master || !master.isMasterAdmin) {
            return res.status(403).json({ error: 'Only Master Admin can perform this action' });
        }
        
        const adminUser = await User.findById(adminId);
        if (!adminUser) return res.status(404).json({ error: 'Admin not found' });
        
        adminUser.adminStatus = 'Approved';
        await adminUser.save();
        res.json({ message: `Admin ${adminUser.name} has been approved.` });
    } catch (e) {
        res.status(500).json({ error: 'Failed to approve admin' });
    }
});

router.post('/admin/reject', async (req, res) => {
    try {
        const { adminId, masterEmail } = req.body;
        const master = await User.findOne({ email: masterEmail });
        if (!master || !master.isMasterAdmin) {
            return res.status(403).json({ error: 'Only Master Admin can perform this action' });
        }
        
        const adminUser = await User.findById(adminId);
        if (!adminUser) return res.status(404).json({ error: 'Admin not found' });
        
        adminUser.adminStatus = 'Rejected';
        await adminUser.save();
        res.json({ message: `Admin ${adminUser.name} has been rejected.` });
    } catch (e) {
        res.status(500).json({ error: 'Failed to reject admin' });
    }
});

router.put('/profile', async (req, res) => {
    try {
        const { userId, name, phone, branchAddress, password } = req.body;
        console.log('[PROFILE UPDATE REQUEST]:', { userId, name, phone, hasPassword: !!password });
        
        const user = await User.findById(userId);
        if (!user) {
            console.log('[PROFILE UPDATE ERROR]: User not found:', userId);
            return res.status(404).json({ error: 'User not found' });
        }
        
        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (branchAddress && user.role === 'admin') user.branchAddress = branchAddress;
        
        if (password) {
            console.log('[PASSWORD UPDATE ATTEMPT]: password length =', password.length);
            if (!isStrongPassword(password)) {
                console.log('[PASSWORD UPDATE REJECTED]: fails strength test');
                return res.status(400).json({ error: 'SECURITY_WEAKNESS: Password must be at least 7 characters and contain alpha, numeric, and special characters.' });
            }
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
            console.log('[PASSWORD UPDATE HASHED & ASSIGNED]');
        }
        
        await user.save();
        console.log('[PROFILE SAVED SUCCESS]: name =', user.name, 'email =', user.email);
        
        res.json({ 
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                branchAddress: user.branchAddress,
                role: user.role,
                isMaster: user.isMasterAdmin,
                walletBalance: user.walletBalance
            }
        });
    } catch (e) {
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

router.post('/send-otp', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        await OTPVerification.deleteMany({ email });
        const newOTP = new OTPVerification({ email, otp });
        await newOTP.save();

        if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD && process.env.SMTP_EMAIL !== 'your-email@gmail.com') {
            try {
                await transporter.sendMail({
                    from: `"NETPark Authentic Gateway" <${process.env.SMTP_EMAIL}>`, // Sends exactly as 'NETPark' name
                    to: email,
                    subject: 'NETPark - Your Secure Authentication Code',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 2px solid #FFB703; border-radius: 12px; background-color: #0A1128; color: #FFF;">
                            <h2 style="color: #FFB703; text-align: center; font-size: 28px; font-weight: 900; letter-spacing: 2px; margin-bottom: 5px;">NETPARK</h2>
                            <p style="color: #ccc; text-align: center; font-size: 14px; margin-top: 0;">Secure Parking Verification</p>
                            
                            <p style="color: #ddd; font-size: 16px; margin-top: 30px;">Hello,</p>
                            <p style="color: #ddd; font-size: 16px; line-height: 1.5;">You recently requested a secure One-Time Password to gain access to your NETPark ecosystem account. Use the code below to log in:</p>
                            
                            <div style="margin: 30px 0; padding: 20px; background: #3A0CA3; text-align: center; font-size: 36px; font-weight: bold; letter-spacing: 12px; color: #FFF; border-radius: 8px; border: 1px solid #FFB703; box-shadow: 0 0 15px rgba(255,183,3,0.2);">
                                ${otp}
                            </div>
                            
                            <p style="color: #ddd; font-size: 14px;">This cryptographic key will securely expire in exactly 5 minutes.</p>
                            
                            <hr style="border: 0; border-top: 1px solid rgba(255,183,3,0.2); margin: 30px 0;">
                            <footer style="font-size: 11px; color: #777; text-align: center;">© 2026 NETPark Technologies. Automated message, do not reply directly.</footer>
                        </div>
                    `
                });
                console.log(`[SMTP SUCCESS] Premium HTML Email OTP officially dispatched to ${email}`);
            } catch (smtpErr) {
                console.error(`[SMTP OFFLINE]: Google Credentials Failed! Did not send email. Raw local OTP: ${otp}`);
            }
        } else {
            console.warn(`[SMTP OFFLINE]: No valid .env SMTP_EMAIL found! Did not send email. Raw local OTP: ${otp}`);
        }

        res.json({ message: 'OTP sent successfully to ' + email });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error sending OTP' });
    }
});

router.post('/verify-otp-login', async (req, res) => {
    try {
        const { email, otp } = req.body;
        const record = await OTPVerification.findOne({ email, otp });
        
        if (!record) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }
        
        await OTPVerification.deleteMany({ email });
        
        let user = await User.findOne({ email });
        
        if (user && user.isBlocked) {
            return res.status(403).json({ error: 'ACCOUNT_SUSPENDED: Your access to the NETPark Gateway has been administratively revoked.' });
        }

        if (!user) {
            const { name, phone, password } = req.body;
            const hashedPassword = await bcrypt.hash(password || Math.random().toString(36).slice(-8), 10);
            
            user = new User({ 
                email, 
                name: name || email.split('@')[0], 
                phone: phone || "Not Provided",
                password: hashedPassword,
                walletBalance: 500, 
                role: 'user' 
            });
            await user.save();
        } else {
            // Hotfix: If the user already existed but never had a phone initialized, seamlessly update their DB profile.
            if (req.body.phone && (!user.phone || user.phone === 'Not Provided')) {
                user.phone = req.body.phone;
                await user.save();
            }
        }

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secret123', { expiresIn: '1d' });

        res.json({ 
            message: 'OTP Login successful', 
            token, 
            user: { 
                id: user._id, 
                name: user.name, 
                email: user.email, 
                phone: user.phone,
                role: user.role, 
                isMaster: user.isMasterAdmin,
                walletBalance: user.walletBalance 
            } 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/users', async (req, res) => {
    try {
        const users = await User.find({}, '-password');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'Server error fetching users' });
    }
});

router.get('/bookings', async (req, res) => {
    try {
        const bookings = await Booking.find().sort({ createdAt: -1 });
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ error: 'Server error fetching bookings' });
    }
});

router.post('/verify-cash', async (req, res) => {
    try {
        const { bookingId } = req.body;
        const booking = await Booking.findById(bookingId);
        if (!booking) return res.status(404).json({ error: 'Booking not found' });
        
        booking.paymentStatus = 'Verified';
        if (!booking.entryTime) {
            booking.entryTime = new Date();
        }
        await booking.save();
        
        res.json({ message: 'Terminal formally Authorized and verified successfully!', booking });
    } catch (err) {
        res.status(500).json({ error: 'Server error parsing terminal authorization' });
    }
});

router.post('/toggle-block', async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        user.isBlocked = !user.isBlocked;
        await user.save();
        
        res.json({ message: `User mathematically ${user.isBlocked ? 'Blocked' : 'Unblocked'}`, user });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GLOBAL SYNCHRONOUS LOCK ENGINE FOR BOOKING CLASHES
global.activeLocks = global.activeLocks || [];

router.get('/active-locks', (req, res) => {
    // Purge naturally expired sessions based on live metrics
    const now = Date.now();
    global.activeLocks = global.activeLocks.filter(lock => lock.endMs > now);
    res.json(global.activeLocks);
});

// Formal Route for Booking Receipts and Warning Automation
router.post('/send-booking-receipt', async (req, res) => {
    try {
        const { email, name, phone, slotName, duration, amount, lat, lng, branchId, spaceId, startMs, endMs, carNumber, carModel, paymentMethod, paymentStatus } = req.body;
        const validName = name || 'Valued Client';
        const validEmail = email || process.env.SMTP_EMAIL;

        let finalPhone = phone;
        if (!finalPhone) {
            const userRec = await User.findOne({ email: validEmail });
            if (userRec && userRec.phone) {
                finalPhone = userRec.phone;
            }
        }

        // Check if pre-booking date exceeds the 3-day limit
        const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        if (startMs > now + threeDaysMs + 5 * 60 * 1000) {
            return res.status(400).json({ error: 'OUT_OF_BOUNDS', message: 'ERROR: Pre-booking is restricted to a maximum of 3 days in advance. Please select an earlier date.' });
        }

        // -- ADVANCED CLASH PROTECTION ALGORITHM (Date/Time Window Bounds) --
        if (branchId !== undefined && spaceId !== undefined) {
            // Check if this is an extension of an existing booking
            const existingBooking = await Booking.findOne({
                userEmail: validEmail,
                spaceId: spaceId,
                carNumber: carNumber,
                endMs: startMs,
                status: 'Active'
            });

            if (existingBooking) {
                console.log('[BOOKING EXTENSION DETECTED]: updating booking ID =', existingBooking._id);
                existingBooking.endMs = endMs;
                existingBooking.totalAmount += amount;
                await existingBooking.save();

                // Update active memory lock
                global.activeLocks = global.activeLocks.map(lock => {
                    if (lock.branchId === branchId && lock.spaceId === spaceId && lock.bookedByEmail === validEmail) {
                        return { ...lock, endMs };
                    }
                    return lock;
                });
                console.log('[BOOKING EXTENSION SUCCESS]: ID =', existingBooking._id);
            } else {
                // Sweep memory clean of expired boundaries
                global.activeLocks = global.activeLocks.filter(lock => lock.endMs > Date.now());
                
                const isCurrentlyLocked = global.activeLocks.find(l => 
                    l.branchId === branchId && 
                    l.spaceId === spaceId &&
                    ((startMs >= l.startMs && startMs < l.endMs) || 
                     (endMs > l.startMs && endMs <= l.endMs) ||
                     (startMs <= l.startMs && endMs >= l.endMs))
                );
                
                if (isCurrentlyLocked) {
                    return res.status(409).json({ error: 'ALREADY_BOOKED', message: 'ERROR: This space was aggressively reserved by another user for that exact Time window. Please select a different space or adjust your Date!' });
                }
                // Secure the lock globally into the future bounds
                global.activeLocks.push({ branchId, spaceId, startMs, endMs, bookedByEmail: validEmail });
                
                // Permanently persist this transaction in the central MongoDB Ledger
                const newBooking = new Booking({
                    userEmail: validEmail,
                    userName: validName,
                    userPhone: finalPhone || 'Not Provided',
                    slotName: slotName || `Zone-${branchId}`,
                    spaceId,
                    carNumber,
                    carModel: carModel || 'Not Provided',
                    startMs,
                    endMs,
                    totalAmount: amount,
                    paymentMethod: paymentMethod || 'Wallet',
                    paymentStatus: paymentStatus || 'Verified'
                });
                await newBooking.save();
            }
        }
        // ------------------------------------------
        
        const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;

        if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
            try {
                // 1. Instant Booking Receipt Pipeline
                await transporter.sendMail({
                    from: `"NETPark Authentic Gateway" <${process.env.SMTP_EMAIL}>`,
                    to: validEmail,
                subject: `NETPark: Booking Confirmed for ${slotName}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 2px solid #00f5d4; border-radius: 12px; background-color: #0A1128; color: #FFF;">
                        <h2 style="color: #00f5d4; text-align: center; margin-bottom: 5px;">NETPARK BOOKING SECURED</h2>
                        <p style="color: #ccc; text-align: center;">Transaction Successful</p>
                        <p style="color: #ddd;">Thank you <b>${validName}</b>,</p>
                        <p style="color: #ddd;">Your immersive secure parking module at <b>${slotName}</b> has been actively reserved for ${duration} minute(s).</p>
                        
                        <div style="margin: 20px 0; padding: 15px; border-left: 4px solid #FFB703; background: rgba(0,0,0,0.4);">
                            <p style="margin: 0;"><b>Total Paid:</b> ₹${amount}</p>
                            <p style="margin: 5px 0 0 0; color: #aaa;">Status: Active & Locked</p>
                        </div>
                        
                        <div style="text-align: center; margin-top: 30px;">
                            <a href="${mapsLink}" style="display: inline-block; padding: 15px 30px; background: #FFB703; color: #000; text-decoration: none; font-weight: bold; border-radius: 8px;">Navigate to Destination Hub</a>
                        </div>
                    </div>
                `
            });
            console.log(`[SMTP SUCCESS] Receipt emailed to ${validEmail}`);

            // 2. Precise Atomic Scheduled Automation Engine
            // Calculate absolute target point (End Time - 10 Mins) and subtract current server time.
            const exactTimeoutMs = (endMs - (10 * 60 * 1000)) - Date.now(); 
            
            if (exactTimeoutMs > 0) {
                setTimeout(async () => {
                    try {
                        await transporter.sendMail({
                            from: `"NETPark Authentic Gateway" <${process.env.SMTP_EMAIL}>`,
                            to: validEmail,
                            subject: `⚠️ NETPark: 10 Minutes Remaining at ${slotName}`,
                            html: `
                                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 2px solid #f15bb5; border-radius: 12px; background-color: #0A1128; color: #FFF;">
                                    <h2 style="color: #f15bb5; text-align: center;">SESSION EXPIRING SOON</h2>
                                    <p style="color: #ddd;">Hello <b>${validName}</b>,</p>
                                    <p style="color: #ddd;">This is a premium automated sensor warning. Your reserved session at <b>${slotName}</b> is going to expire locally within exactly <b>10 minutes</b>.</p>
                                    <p style="color: #ddd;"><strong>Please pick your car ${carNumber ? `(${carNumber})` : ''}</strong> from the parking space soon.</p>
                                    <p style="color: #ccc; margin-top: 20px;">If you want to continue accessing this secure space, please open the NETPark Hub terminal and extend your duration immediately.</p>
                                    <hr style="border: 0; border-top: 1px solid rgba(255,183,3,0.2); margin: 30px 0;">
                                    <p style="font-size: 11px; color: #777; text-align: center;">NETPark AI Automation Engine.</p>
                                </div>
                            `
                        });
                        console.log(`[SMTP AUTOMATIC] 10 min warning processed for ${validEmail}`);
                    } catch (e) {
                         console.error('[SMTP AUTOMATIC] Warning failure', e);
                    }
                }, exactTimeoutMs);
            }

            // 3. Post-Booking Review Automation (+1 Hour after End Time)
            const exactReviewTimeoutMs = (endMs + (60 * 60 * 1000)) - Date.now();
            if (exactReviewTimeoutMs > 0) {
                setTimeout(async () => {
                    try {
                        const reviewLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/submit-review?email=${encodeURIComponent(validEmail)}&phone=${encodeURIComponent(finalPhone || '')}&txn=${newBooking._id}&slot=${encodeURIComponent(slotName || '')}`;
                        await transporter.sendMail({
                            from: `"NETPark Authentic Gateway" <${process.env.SMTP_EMAIL}>`,
                            to: validEmail,
                            subject: `NETPark: Rate your experience at ${slotName}`,
                            html: `
                                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 2px solid #00f5d4; border-radius: 12px; background-color: #0A1128; color: #FFF; text-align: center;">
                                    <h2 style="color: #00f5d4; margin-bottom: 5px;">HOW WAS YOUR STAY?</h2>
                                    <p style="color: #ccc;">Your reservation at ${slotName} has officially concluded.</p>
                                    <p style="color: #ddd; margin: 20px 0;">We hope you had a flawless integration. Please take a moment to provide a star rating and leave a brief review for the administrators to ensure quality.</p>
                                    <a href="${reviewLink}" style="display: inline-block; padding: 15px 30px; background: #FFB703; color: #000; text-decoration: none; font-weight: bold; border-radius: 8px;">Submit Feedback</a>
                                    <p style="font-size: 11px; color: #777; margin-top: 30px;">NETPark AI Automation Engine.</p>
                                </div>
                            `
                        });
                        console.log(`[SMTP AUTOMATIC] Review request sent to ${validEmail}`);
                    } catch (e) {
                         console.error('[SMTP AUTOMATIC] Review failure', e);
                    }
                }, exactReviewTimeoutMs);
            }
            } catch (smtpCrash) {
                console.error("Non-fatal physical SMTP failure intercepted while sending receipts. The Booking is still registered natively inside MongoDB.", smtpCrash);
            }
        }
        res.json({ message: 'Receipt dispatched to processing pipeline' });
    } catch(err) {
        console.error(err);
        res.status(500).json({ error: 'Server error processing receipt' });
    }
});

router.post('/submit-review', async (req, res) => {
    try {
        const { email, phone, transactionId, rating, comment } = req.body;
        const newReview = new Review({ email, phone, transactionId, rating, comment });
        await newReview.save();
        res.json({ message: 'Review successfully submitted to Database' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save review' });
    }
});

router.get('/reviews', async (req, res) => {
    try {
        const reviews = await Review.find().sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

export default router;

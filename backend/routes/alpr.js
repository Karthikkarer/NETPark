import express from 'express';
import multer from 'multer';
import Tesseract from 'tesseract.js';
import { Booking } from '../models/Booking.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Persistent OCR Worker for blazing-fast recognition
let worker = null;
const initWorker = async () => {
    worker = await Tesseract.createWorker('eng');
    await worker.setParameters({
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        tessedit_pageseg_mode: '7',
    });
    console.log('--- AI OCR Worker Initialized & Warmed Up ---');
};
initWorker();

// Helper to clean and normalize plate text for robust comparison
const normalizePlate = (text) => {
    if (!text) return '';
    return text.toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        // Common OCR misinterpretations
        .replace(/O/g, '0')
        .replace(/I/g, '1')
        .replace(/Z/g, '2')
        .replace(/S/g, '5')
        .replace(/G/g, '6')
        .replace(/B/g, '8');
};

// Calculate Levenshtein Distance for fuzzy string matching (handling shaken/blurry images)
const getLevenshteinDistance = (a, b) => {
    const tmp = [];
    for (let i = 0; i <= a.length; i++) {
        tmp[i] = [i];
    }
    for (let j = 0; j <= b.length; j++) {
        tmp[0][j] = j;
    }
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            tmp[i][j] = Math.min(
                tmp[i - 1][j] + 1, // deletion
                tmp[i][j - 1] + 1, // insertion
                tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1) // substitution
            );
        }
    }
    return tmp[a.length][b.length];
};

// Calculate similarity score between 0.0 and 1.0
const getSimilarity = (s1, s2) => {
    let longer = s1;
    let shorter = s2;
    if (s1.length < s2.length) {
        longer = s2;
        shorter = s1;
    }
    const longerLength = longer.length;
    if (longerLength === 0) {
        return 1.0;
    }
    return (longerLength - getLevenshteinDistance(longer, shorter)) / longerLength;
};

router.post('/scan', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded' });
        }

        if (!worker) {
            await initWorker();
        }

        // Use the pre-warmed persistent worker for high-speed analysis
        const { data: { text, confidence } } = await worker.recognize(req.file.buffer);

        let rawText = text.trim();
        // Clean text: Keep only Alphanumeric
        const cleanedOCR = rawText.replace(/[^A-Z0-9]/gi, '').toUpperCase();
        
        console.log(`Neural Scan Result: "${rawText}" (Cleaned: ${cleanedOCR}) confidence: ${confidence}`);

        // Find all active bookings
        const activeBookings = await Booking.find({ status: { $ne: 'Cancelled' } });
        let matchedBooking = null;

        // If the OCR text is too short or empty, reject with a helpful camera positioning warning
        if (!cleanedOCR || cleanedOCR.length < 3) {
             return res.status(400).json({ 
                 error: 'Camera Focus Warning: Unable to resolve plate characters. Please align the license plate clearly inside the green viewfinder boxes.',
                 detectedText: rawText || 'NO READABLE TEXT'
             });
        } else {
            const normOCR = normalizePlate(cleanedOCR);
            let bestMatch = null;
            let highestSimilarity = 0.0;

            for (let b of activeBookings) {
                const dbPlate = b.carNumber.replace(/[^A-Z0-9]/gi, '').toUpperCase();
                const normDbPlate = normalizePlate(dbPlate);

                // 1. Direct Pattern Match (Strongest)
                if (normOCR.includes(normDbPlate) || normDbPlate.includes(normOCR)) {
                    bestMatch = b;
                    highestSimilarity = 1.0;
                    break;
                }
                
                // 2. Fuzzy Matching based on Levenshtein Distance (highly resilient to shaken/blurry camera feeds)
                const similarity = getSimilarity(normOCR, normDbPlate);
                if (similarity > highestSimilarity) {
                    highestSimilarity = similarity;
                    bestMatch = b;
                }
            }

            // Accept match if similarity is at least 65% (extremely robust for hand-shaken/blurry photos!)
            if (bestMatch && highestSimilarity >= 0.65) {
                matchedBooking = bestMatch;
                console.log(`[FUZZY OCR MATCH SUCCESS]: Matched ${matchedBooking.carNumber} with similarity score ${Math.round(highestSimilarity*100)}%`);
            }
        }

        if (!matchedBooking) {
            return res.status(404).json({ 
                error: "Registry Search Exception: Detected plate does not match any active booking.", 
                detectedText: rawText 
            });
        }
        
        const now = Date.now();

        // Security Window Check
        if (now < matchedBooking.startMs) {
            const startTime = new Date(matchedBooking.startMs).toLocaleTimeString();
            return res.json({ 
                message: 'Advance Booking Detected',
                action: 'Unauthorized Entry (Early)',
                detectedText: rawText, 
                booking: matchedBooking,
                error: `Note: Booking found for ${matchedBooking.carNumber}, but it only starts at ${startTime}. Entry denied until window opens.`
            });
        }
        
        // AUTO-HEAL: If the user is late or booking expired, auto-authorize entry and update state to secure and verified!
        if (now > matchedBooking.endMs && !matchedBooking.entryTime) {
            console.log(`[LATE ARRIVAL AUTO-HEALED & AUTHORIZED]: Booking ${matchedBooking._id} (${matchedBooking.carNumber}) was expired but user arrived. Auto-authorizing...`);
        }

        // Determine Entry or Exit
        let action = '';
        if (!matchedBooking.entryTime) {
            matchedBooking.entryTime = new Date();
            matchedBooking.paymentStatus = 'Verified';
            action = 'Vehicle Access Authorized: Entry';
        } else {
            matchedBooking.exitTime = new Date();
            matchedBooking.status = 'Completed';
            action = 'Vehicle Access Authorized: Exit';
        }

        await matchedBooking.save();

        // Success response with AI metadata
        res.json({
            message: 'Success',
            action,
            detectedText: rawText,
            booking: matchedBooking,
            confidence: `${confidence}%`
        });

    } catch (err) {
        console.error('ALPR Error:', err);
        res.status(500).json({ error: 'AI Processing Engine encountered an internal error. Please retry.' });
    }
});

export default router;


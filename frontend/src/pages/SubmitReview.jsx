import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Star, Send, CheckCircle, Car } from 'lucide-react';
import axios from 'axios';
const getBaseURL = () => {
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
    return 'http://localhost:5000/api';
};

const api = axios.create({ baseURL: getBaseURL() });

export default function SubmitReview() {
    const [searchParams] = useSearchParams();
    const email = searchParams.get('email');
    const phone = searchParams.get('phone');
    const txn = searchParams.get('txn');
    const slot = searchParams.get('slot') || 'NETPark Facility';

    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/auth/submit-review', { email, phone, transactionId: txn, rating, comment });
            setSubmitted(true);
        } catch (err) {
            alert('Failed to submit review');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#050510] text-center p-5 font-sans">
                <div className="bg-[#0A1128] p-10 rounded-2xl border border-royal-gold shadow-[0_0_40px_rgba(255,183,3,0.15)] w-full max-w-md">
                    <CheckCircle size={60} color="#00f5d4" className="mx-auto mb-5 drop-shadow-[0_0_15px_rgba(0,245,212,0.8)]" />
                    <h2 className="text-2xl font-bold text-white mb-2">Thank you!</h2>
                    <p className="text-gray-400">Your review has been securely transmitted to NETPark Administration.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#050510] p-5 font-sans">
            <form onSubmit={handleSubmit} className="bg-[#0A1128] p-8 md:p-10 rounded-2xl border border-royal-purple shadow-[0_0_40px_rgba(58,12,163,0.3)] w-full max-w-lg">
                <div className="flex flex-col items-center justify-center mb-8">
                    <div className="flex items-center gap-3 text-3xl font-black tracking-widest uppercase text-royal-gold">
                        <Car size={36} className="text-royal-gold" />
                        NETPARK
                    </div>
                </div>

                <h2 className="text-xl font-bold text-royal-gold mb-2 border-b border-white/10 pb-3 text-center">How was your parking experience?</h2>
                <p className="text-gray-400 text-sm mb-6 text-center">Location: <span className="text-white font-semibold">{slot}</span></p>

                <div className="mb-8 flex justify-center gap-3">
                    {[1, 2, 3, 4, 5].map(num => (
                        <Star 
                            key={num} 
                            size={45} 
                            onClick={() => setRating(num)} 
                            fill={num <= rating ? '#FFB703' : 'transparent'} 
                            color={num <= rating ? '#FFB703' : '#555'} 
                            className="cursor-pointer transition-all hover:scale-110 drop-shadow-[0_0_10px_rgba(255,183,3,0.2)]"
                        />
                    ))}
                </div>

                <div className="mb-6">
                    <label className="block text-sm text-gray-400 mb-2 font-semibold">Your Feedback</label>
                    <textarea 
                        required 
                        value={comment} 
                        onChange={e => setComment(e.target.value)} 
                        rows="4" 
                        placeholder="Tell us what you liked or what we can improve..."
                        className="w-full bg-[#050510]/80 border border-royal-purple/50 rounded-lg p-4 text-gray-200 focus:outline-none focus:border-royal-gold focus:ring-1 focus:ring-royal-gold transition-all"
                    />
                </div>

                <div className="text-xs text-gray-500 mb-8 flex justify-between bg-black/40 p-4 rounded-lg border border-white/5">
                    <div className="flex flex-col gap-1">
                        <span className="text-gray-400">Account:</span>
                        <span className="font-mono text-white">{email}</span>
                    </div>
                    <div className="flex flex-col gap-1 text-right">
                        <span className="text-gray-400">Phone:</span>
                        <span className="font-mono text-white">{phone || 'Not Provided'}</span>
                    </div>
                </div>

                <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-royal-purple to-[#4c1d95] hover:to-royal-purple shadow-lg border border-royal-purple/50 text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100">
                    {loading ? 'Transmitting...' : 'Submit Review'} <Send size={18} />
                </button>
            </form>
        </div>
    );
}

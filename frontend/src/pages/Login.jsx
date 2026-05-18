import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, LockKeyhole, Mail, User, Phone, ShieldCheck, CheckCircle2, KeyRound, Eye, EyeOff } from 'lucide-react';
import api from '../api';

export default function Login() {
    const [isLogin, setIsLogin] = useState(true);
    const [step, setStep] = useState(1); // 1 = Entry Form, 2 = OTP Verification
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    
    const navigate = useNavigate();

    const handleInitialSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        if (!isLogin && password !== confirmPassword) {
            setErrorMsg('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            // Verify credentials first for login attempts
            if (isLogin) {
                await api.post('/auth/login', { email, password });
            }
            
            // Send OTP securely through the Express Backend API
            await api.post('/auth/send-otp', { email });
            setSuccessMsg('OTP Code dispatched to your Email!');
            setStep(2); // Move to OTP Phase
        } catch (err) {
            console.error(err);
            setErrorMsg(err.response?.data?.error || 'Failed to trigger verification code.');
        } finally {
            setLoading(false);
        }
    };

    const handleOTPVerify = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setLoading(true);

        try {
            // Note: Our backend endpoint automatically registers them if they don't exist yet, acting as a universal secure entry
            const res = await api.post('/auth/verify-otp-login', { email, otp, name, phone, password });
            
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            
            setSuccessMsg('Authentication Successful! Redirecting...');
            
            setTimeout(() => {
                if (res.data.user.role === 'admin') {
                    navigate('/admin');
                } else {
                    navigate('/dashboard');
                }
            }, 1000);
            
        } catch (err) {
            console.error(err);
            setErrorMsg(err.response?.data?.error || 'Invalid OTP Code.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#050510] relative overflow-hidden font-sans">
            {/* Background Ambient Glows */}
            <div className="absolute -top-[10%] -left-[10%] w-[500px] h-[500px] bg-royal-purple rounded-full opacity-20 blur-[100px] mix-blend-screen z-0" />
            <div className="absolute -bottom-[10%] -right-[10%] w-[600px] h-[600px] bg-royal-gold rounded-full opacity-10 blur-[120px] z-0" />

            <AnimatePresence mode="wait">
                <motion.div
                    key="login-card"
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="w-full max-w-[450px] bg-[#0A1128]/80 backdrop-blur-xl border border-royal-gold/40 shadow-[0_0_40px_rgba(255,183,3,0.15)] rounded-2xl p-10 z-10 mx-4"
                >
                    {/* Header */}
                    <div className="flex flex-col items-center justify-center mb-8">
                        <div className="flex items-center gap-3 text-3xl font-black tracking-widest uppercase text-royal-gold">
                            <Car size={36} className="text-royal-gold" />
                            NETPARK
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-gray-400 text-sm font-medium">
                            <ShieldCheck size={16} /> Secure Portal Gateway
                        </div>
                    </div>

                    {/* Alerts */}
                    <AnimatePresence>
                        {errorMsg && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-red-500/10 border-l-4 border-red-500 text-red-200 p-3 rounded-md mb-6 text-sm">
                                {errorMsg}
                            </motion.div>
                        )}
                        {successMsg && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-emerald-500/10 border-l-4 border-emerald-500 text-emerald-200 p-3 rounded-md mb-6 text-sm flex items-center gap-2">
                                <CheckCircle2 size={16} /> {successMsg}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {step === 1 ? (
                        <motion.div key="step-1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            {/* Toggle */}
                            <div className="flex bg-[#050510] rounded-lg p-1 mb-6 border border-white/5">
                                <button
                                    onClick={() => { setIsLogin(true); setErrorMsg(''); }}
                                    className={`flex-1 py-2 rounded-md text-sm font-bold transition-all duration-300 ${isLogin ? 'bg-royal-purple text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Login
                                </button>
                                <button
                                    onClick={() => { setIsLogin(false); setErrorMsg(''); }}
                                    className={`flex-1 py-2 rounded-md text-sm font-bold transition-all duration-300 ${!isLogin ? 'bg-royal-purple text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Sign Up
                                </button>
                            </div>

                            <form onSubmit={handleInitialSubmit} className="space-y-4">
                                {!isLogin && (
                                    <>
                                        <div className="relative">
                                            <User className="absolute top-1/2 -translate-y-1/2 left-4 text-royal-gold" size={18} />
                                            <input
                                                type="text"
                                                placeholder="Full Name"
                                                required
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="w-full bg-[#050510]/80 border border-royal-gold/50 rounded-lg py-3 pl-12 pr-4 text-gray-200 focus:outline-none focus:border-royal-gold focus:ring-1 focus:ring-royal-gold transition-all"
                                            />
                                        </div>

                                        <div className="relative">
                                            <Phone className="absolute top-1/2 -translate-y-1/2 left-4 text-royal-gold" size={18} />
                                            <input
                                                type="tel"
                                                placeholder="Phone Number"
                                                required
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                className="w-full bg-[#050510]/80 border border-royal-gold/50 rounded-lg py-3 pl-12 pr-4 text-gray-200 focus:outline-none focus:border-royal-gold focus:ring-1 focus:ring-royal-gold transition-all"
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="relative">
                                    <Mail className="absolute top-1/2 -translate-y-1/2 left-4 text-royal-gold" size={18} />
                                    <input
                                        type="email"
                                        placeholder="Email Address"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-[#050510]/80 border border-royal-gold/50 rounded-lg py-3 pl-12 pr-4 text-gray-200 focus:outline-none focus:border-royal-gold focus:ring-1 focus:ring-royal-gold transition-all"
                                    />
                                </div>

                                <div className="relative">
                                    <LockKeyhole className="absolute top-1/2 -translate-y-1/2 left-4 text-royal-gold" size={18} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder={isLogin ? "Password" : "Create Strong Password"}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-[#050510]/80 border border-royal-gold/50 rounded-lg py-3 pl-12 pr-12 text-gray-200 focus:outline-none focus:border-royal-gold focus:ring-1 focus:ring-royal-gold transition-all"
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute top-1/2 -translate-y-1/2 right-4 text-gray-400 hover:text-royal-gold transition-colors focus:outline-none"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>

                                {!isLogin && (
                                    <div className="relative">
                                        <LockKeyhole className="absolute top-1/2 -translate-y-1/2 left-4 text-royal-gold" size={18} />
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="Confirm Password"
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full bg-[#050510]/80 border border-royal-gold/50 rounded-lg py-3 pl-12 pr-12 text-gray-200 focus:outline-none focus:border-royal-gold focus:ring-1 focus:ring-royal-gold transition-all"
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute top-1/2 -translate-y-1/2 right-4 text-gray-400 hover:text-royal-gold transition-colors focus:outline-none"
                                            aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                                        >
                                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full mt-6 bg-gradient-to-r from-royal-purple to-[#4c1d95] hover:to-royal-purple text-white font-bold py-3.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] border border-royal-purple/50 shadow-lg disabled:opacity-50 disabled:hover:scale-100"
                                >
                                    {loading ? 'Processing...' : (isLogin ? 'Secure Login' : 'Create Account')} 
                                    {!loading && <ShieldCheck size={18} />}
                                </button>
                            </form>
                        </motion.div>
                    ) : (
                        <motion.div key="step-2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                            <div className="mb-6 text-center">
                                <h3 className="text-xl font-bold text-white mb-2">Verification Required</h3>
                                <p className="text-gray-400 text-sm">We've sent a secure 6-digit OTP to <span className="text-royal-gold font-medium">{email}</span></p>
                            </div>

                            <form onSubmit={handleOTPVerify} className="space-y-6">
                                <div className="relative">
                                    <KeyRound className="absolute top-1/2 -translate-y-1/2 left-4 text-royal-gold" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Enter OTP Code"
                                        required
                                        maxLength={6}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="w-full bg-[#050510]/80 border-2 border-royal-gold rounded-lg py-4 pl-12 pr-4 text-center text-xl tracking-[0.5em] text-royal-gold font-bold focus:outline-none focus:shadow-[0_0_20px_rgba(255,183,3,0.3)] transition-all"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || otp.length < 5}
                                    className="w-full bg-royal-gold hover:bg-yellow-400 text-black font-bold py-3.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] shadow-[0_0_15px_rgba(255,183,3,0.4)] disabled:opacity-50 disabled:hover:scale-100"
                                >
                                    {loading ? 'Verifying...' : 'Authenticate & Enter'}
                                </button>

                                <div className="text-center">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="text-sm text-gray-400 hover:text-white transition-colors"
                                    >
                                        ← Back to Login
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

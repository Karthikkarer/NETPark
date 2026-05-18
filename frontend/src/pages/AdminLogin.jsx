import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Mail, Lock, Key, ArrowRight, UserPlus, Eye, EyeOff } from 'lucide-react';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [isSignup, setIsSignup] = useState(false);
    const [adminType, setAdminType] = useState('admin'); // 'admin' or 'master'
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [branchAddress, setBranchAddress] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setError('');
        
        // Master Admin specific check if in Master Tab (Case-Insensitive)
        if (adminType === 'master' && email.toLowerCase() !== 'begurshatershivaraj@gmail.com') {
            setError('ACCESS_DENIED: Master Admin login restricted to primary security account.');
            return;
        }

        setLoading(true);
        try {
            // First verify credentials for login
            const normalizedEmail = email.toLowerCase();
            if (!isSignup) {
                await api.post('/auth/login', { email: normalizedEmail, password });
            }
            
            await api.post('/auth/send-otp', { email: normalizedEmail });
            setOtpSent(true);
        } catch (err) {
            setError(err.response?.data?.error || 'Authentication Failed');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyAndLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const normalizedEmail = email.toLowerCase();
            const res = await api.post('/auth/verify-otp-login', { email: normalizedEmail, otp });
            const { token, user } = res.data;

            if (user.role !== 'admin') {
                setError('ACCESS_DENIED: These credentials do not have Administrative Clearance.');
                return;
            }

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            navigate('/admin');
        } catch (err) {
            setError(err.response?.data?.error || 'OTP Verification Failed');
        } finally {
            setLoading(false);
        }
    };

    const isStrongPassword = (pass) => {
        return pass.length >= 7 && /[a-zA-Z]/.test(pass) && /[0-9]/.test(pass) && /[^A-Za-z0-9]/.test(pass);
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');
        if (!isStrongPassword(password)) {
            setError('SECURITY_WEAKNESS: Password must be min 7 characters with alpha, numeric, and special characters.');
            return;
        }
        setLoading(true);
        try {
            const res = await api.post('/auth/register', { name, email, phone, password, role: 'admin', branchAddress });
            alert(res.data.message);
            setIsSignup(false);
        } catch (err) {
            setError(err.response?.data?.error || 'Registration Failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#0A1128', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'Inter, sans-serif' }}>
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ width: '100%', maxWidth: '450px', background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '24px', padding: '40px' }}
            >
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <div style={{ width: '64px', height: '64px', background: adminType === 'master' ? 'linear-gradient(135deg, #00f5d4, #00bbf9)' : 'linear-gradient(135deg, #FFB703, #FB8500)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 16px rgba(0,0,0,0.3)' }}>
                        <ShieldCheck size={32} color="#0A1128" />
                    </div>
                    <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: '800', margin: '0 0 10px 0', letterSpacing: '-0.5px' }}>NETPark Admin</h1>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>Administrative Gateway & Registry Access</p>
                </div>

                {!otpSent && !isSignup && (
                    <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '4px', marginBottom: '30px' }}>
                        <button 
                            onClick={() => setAdminType('admin')}
                            style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '10px', background: adminType === 'admin' ? '#FFB703' : 'transparent', color: adminType === 'admin' ? '#0A1128' : '#fff', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s ease' }}
                        >
                            Standard Admin
                        </button>
                        <button 
                            onClick={() => { setAdminType('master'); setEmail('begurshatershivaraj@gmail.com'); }}
                            style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '10px', background: adminType === 'master' ? '#00f5d4' : 'transparent', color: adminType === 'master' ? '#0A1128' : '#fff', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s ease' }}
                        >
                            Master Admin
                        </button>
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {!otpSent ? (
                        <motion.form 
                            key={isSignup ? 'signup' : 'login'}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            onSubmit={isSignup ? handleSignup : handleSendOTP}
                        >
                            {isSignup && (
                                <>
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Full Name</label>
                                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px', color: '#fff', outline: 'none' }} placeholder="Admin Name" />
                                    </div>
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Phone Number</label>
                                        <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} required style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px', color: '#fff', outline: 'none' }} placeholder="+91 ..." />
                                    </div>
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Working Branch Address</label>
                                        <input type="text" value={branchAddress} onChange={(e) => setBranchAddress(e.target.value)} required style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px', color: '#fff', outline: 'none' }} placeholder="e.g. MG Road Branch" />
                                    </div>
                                </>
                            )}
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Email Address</label>
                                <div style={{ position: 'relative' }}>
                                    <Mail style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} size={18} />
                                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px 14px 14px 44px', color: '#fff', outline: 'none' }} placeholder="admin@netpark.com" />
                                </div>
                            </div>
                            <div style={{ marginBottom: '30px' }}>
                                <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Secure Password</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} size={18} />
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        value={password} 
                                        onChange={(e) => setPassword(e.target.value)} 
                                        required 
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px 44px 14px 44px', color: '#fff', outline: 'none' }} 
                                        placeholder="••••••••" 
                                    />
                                    <div 
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'rgba(255,255,255,0.3)' }}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ background: 'rgba(231, 76, 60, 0.1)', border: '1px solid #e74c3c', color: '#e74c3c', padding: '12px', borderRadius: '12px', marginBottom: '20px', fontSize: '13px', textAlign: 'center' }}>
                                    {error}
                                </motion.div>
                            )}

                            <button type="submit" disabled={loading} style={{ width: '100%', background: adminType === 'master' ? 'linear-gradient(135deg, #00f5d4, #00bbf9)' : 'linear-gradient(135deg, #FFB703, #FB8500)', color: '#0A1128', padding: '16px', borderRadius: '12px', border: 'none', fontWeight: '800', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}>
                                {loading ? 'Securing Access...' : (isSignup ? 'Apply for Admin Access' : 'Authenticate & Send OTP')} <ArrowRight size={20} />
                            </button>

                            <button type="button" onClick={() => { setIsSignup(!isSignup); setError(''); }} style={{ width: '100%', background: 'transparent', color: 'rgba(255,255,255,0.5)', padding: '12px', marginTop: '10px', border: 'none', cursor: 'pointer', fontSize: '13px' }}>
                                {isSignup ? 'Already have access? Log in' : 'New Administrator? Request access'}
                            </button>
                        </motion.form>
                    ) : (
                        <motion.form 
                            key="otp"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            onSubmit={handleVerifyAndLogin}
                        >
                            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                                <div style={{ width: '50px', height: '50px', background: 'rgba(255, 183, 3, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
                                    <Key size={24} color="#FFB703" />
                                </div>
                                <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: '700', margin: '0 0 5px 0' }}>Verify Identity</h2>
                                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>Enter the 6-digit code sent to your email</p>
                            </div>

                            <div style={{ marginBottom: '30px' }}>
                                <input type="text" maxLength="6" value={otp} onChange={(e) => setOtp(e.target.value)} required style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid #FFB703', borderRadius: '12px', padding: '16px', color: '#fff', outline: 'none', textAlign: 'center', fontSize: '24px', letterSpacing: '8px', fontWeight: 'bold' }} placeholder="000000" />
                            </div>

                            {error && (
                                <div style={{ background: 'rgba(231, 76, 60, 0.1)', border: '1px solid #e74c3c', color: '#e74c3c', padding: '12px', borderRadius: '12px', marginBottom: '20px', fontSize: '13px', textAlign: 'center' }}>
                                    {error}
                                </div>
                            )}

                            <button type="submit" disabled={loading} style={{ width: '100%', background: 'linear-gradient(135deg, #00f5d4, #00bbf9)', color: '#0A1128', padding: '16px', borderRadius: '12px', border: 'none', fontWeight: '800', fontSize: '16px', cursor: 'pointer' }}>
                                {loading ? 'Verifying...' : 'Unlock Admin Dashboard'}
                            </button>

                            <button type="button" onClick={() => setOtpSent(false)} style={{ width: '100%', background: 'transparent', color: 'rgba(255,255,255,0.5)', padding: '12px', marginTop: '10px', border: 'none', cursor: 'pointer', fontSize: '13px' }}>
                                Incorrect email? Go back
                            </button>
                        </motion.form>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default AdminLogin;

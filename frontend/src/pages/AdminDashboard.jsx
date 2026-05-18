import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, BarChart3, Users, User, Settings, Plus, LayoutGrid, LogOut, FileText, Wallet, Key, ShieldAlert, Sun, Moon, Search, MessageSquare, Star, Camera, ShieldCheck } from 'lucide-react';
import api from '../api';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const loggedUser = JSON.parse(localStorage.getItem('user') || '{}');

    React.useEffect(() => {
        if (!loggedUser || loggedUser.role !== 'admin') {
            navigate('/admin-login');
        }
    }, [navigate]);

    const [users, setUsers] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [reviews, setReviews] = useState([]);
    const [isLightMode, setIsLightMode] = useState(localStorage.getItem('theme') === 'light');
    const [isScanning, setIsScanning] = useState(false);
    const [alprResult, setAlprResult] = useState(null);
    const videoRef = React.useRef(null);
    const canvasRef = React.useRef(null);
    const [isCameraActive, setIsCameraActive] = useState(false);

    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileName, setProfileName] = useState(loggedUser.name || '');
    const [profilePhone, setProfilePhone] = useState(loggedUser.phone || '');
    const [profileBranch, setProfileBranch] = useState(loggedUser.branchAddress || '');
    const [profileLoading, setProfileLoading] = useState(false);

    const [dbSlots, setDbSlots] = useState([]);
    const [showAddSlotModal, setShowAddSlotModal] = useState(false);
    const [globalAiEnabled, setGlobalAiEnabled] = useState(true);
    const [newSlotData, setNewSlotData] = useState({ locationName: '', slotNumber: '', bikePrice: '', carPrice: '', coordinates: '', carSpaces: '10', bikeSpaces: '5', isAiEnabled: true });


    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setProfileLoading(true);
        try {
            const res = await api.put('/auth/profile', {
                userId: loggedUser.id,
                name: profileName,
                phone: profilePhone,
                branchAddress: profileBranch
            });
            localStorage.setItem('user', JSON.stringify(res.data.user)); // Update local context reference
            // Reassign to current in-memory object so tab immediately refreshes without full reload
            Object.assign(loggedUser, res.data.user);
            setIsEditingProfile(false);
            alert('Profile successfully updated!');
        } catch (err) {
            alert('Failed to update profile details.');
        } finally {
            setProfileLoading(false);
        }
    };

    const toggleTheme = () => {
        const newTheme = !isLightMode;
        setIsLightMode(newTheme);
        if (newTheme) {
            document.documentElement.classList.add('light-mode');
            localStorage.setItem('theme', 'light');
        } else {
            document.documentElement.classList.remove('light-mode');
            localStorage.setItem('theme', 'dark');
        }
    };

    React.useEffect(() => {
        if (isLightMode) document.documentElement.classList.add('light-mode');
        else document.documentElement.classList.remove('light-mode');
    }, [isLightMode]);

    const activeBookingsCount = bookings.filter(b => b.startMs <= Date.now() && b.endMs > Date.now()).length;
    const totalRevenue = bookings.filter(b => b.paymentStatus === 'Verified').reduce((acc, curr) => acc + (parseFloat(curr.totalAmount) || 0), 0);

    const stats = [
        { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, color: 'var(--royal-gold)', icon: <Wallet /> },
        { label: 'Active Bookings', value: activeBookingsCount, color: '#00f5d4', icon: <Car /> },
        { label: 'Total Native Users', value: users.length, color: '#f15bb5', icon: <Users /> },
        { label: 'Cloud Infrastructure Slots', value: `${activeBookingsCount}/50`, color: 'var(--text-light)', icon: <LayoutGrid /> }
    ];

    const currentLiveBookings = bookings.filter(b => b.startMs <= Date.now() && b.endMs > Date.now() && b.entryTime);

    const combinedSlots = dbSlots.map(s => ({
        id: s._id,
        name: s.locationName,
        loc: s.slotNumber,
        bikePrice: s.bikePrice,
        carPrice: s.carPrice,
        carSpaces: s.carSpaces || 10,
        bikeSpaces: s.bikeSpaces || 5
    }));

    const liveSlots = combinedSlots.map(branch => {
        const activeInBranch = currentLiveBookings.filter(b => b.slotName === branch.name).length;
        const totalSpaces = branch.carSpaces + branch.bikeSpaces;
        const available = Math.max(0, totalSpaces - activeInBranch);
        return {
            ...branch,
            occupiedCount: activeInBranch,
            status: available <= 0 ? `Full (0/${totalSpaces})` : `Available (${available}/${totalSpaces})`
        };
    });

    React.useEffect(() => {
        const fetchNetworkStats = async () => {
            try {
                const resUsers = await api.get('/auth/users').catch(() => ({ data: [] }));
                const resBookings = await api.get('/auth/bookings').catch(() => ({ data: [] }));
                const resReviews = await api.get('/auth/reviews').catch(() => ({ data: [] }));
                const resSlots = await api.get('/slots').catch(() => ({ data: [] }));
                setUsers(resUsers.data);
                setBookings(resBookings.data);
                setReviews(resReviews.data);
                setDbSlots(resSlots.data);
                
                // Set global toggle state if any slots have AI disabled
                if (resSlots.data.length > 0) {
                    setGlobalAiEnabled(resSlots.data.some(s => s.isAiEnabled !== false));
                }
            } catch (e) {
                console.error("Admin Matrix Fetch Failed", e);
            } finally {
                setLoadingUsers(false);
            }
        };
        fetchNetworkStats();
        // Enable live-sync of bookings/users every 5 seconds for robust real-time updates
        const interval = setInterval(fetchNetworkStats, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleGlobalAiToggle = async () => {
        try {
            const token = localStorage.getItem('token');
            const newState = !globalAiEnabled;
            await api.post('/slots/toggle-ai', { isAiEnabled: newState }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setGlobalAiEnabled(newState);
            setDbSlots(prev => prev.map(s => ({ ...s, isAiEnabled: newState })));
            alert(`Global AI Pricing successfully ${newState ? 'Enabled' : 'Disabled'} for all slots!`);
        } catch (e) {
            console.error("Failed to toggle global AI", e);
            alert("Failed to toggle global AI pricing.");
        }
    };

    const handlePricingChange = async (slotId, field, value) => {
        // Optimistic UI update
        setDbSlots(prev => prev.map(s => s._id === slotId ? { ...s, [field]: value } : s));
        
        try {
            const token = localStorage.getItem('token');
            const slot = dbSlots.find(s => s._id === slotId);
            const updatePayload = {
                isAiEnabled: slot.isAiEnabled,
                carPrice: Number(slot.carPrice),
                bikePrice: Number(slot.bikePrice)
            };
            // Apply the new value for the specific field
            updatePayload[field] = field === 'isAiEnabled' ? value : Number(value);
            
            await api.put(`/slots/${slotId}`, updatePayload, { headers: { Authorization: `Bearer ${token}` } });
        } catch (e) {
            console.error("Failed to auto-save pricing", e);
        }
    };

    const handleAddSlotSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const [lat, lng] = newSlotData.coordinates.split(',').map(n => Number(n.trim()));
            const res = await api.post('/slots', {
                locationName: newSlotData.locationName,
                slotNumber: newSlotData.slotNumber,
                bikePrice: Number(newSlotData.bikePrice),
                carPrice: Number(newSlotData.carPrice),
                carSpaces: Number(newSlotData.carSpaces || 10),
                bikeSpaces: Number(newSlotData.bikeSpaces || 5),
                isAiEnabled: newSlotData.isAiEnabled,
                coordinates: {
                    lat: lat || 0,
                    lng: lng || 0
                }
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDbSlots([...dbSlots, res.data]);
            setShowAddSlotModal(false);
            setNewSlotData({ locationName: '', slotNumber: '', bikePrice: '', carPrice: '', coordinates: '' });
            alert('Slot successfully added to the database!');
        } catch (err) {
            console.error(err);
            alert('Failed to add slot to database. You might not have administrative privileges or the data is invalid.');
        }
    };

    const handleDeleteSlot = async (slotId) => {
        if (!window.confirm('Are you sure you want to delete this slot?')) return;
        try {
            const token = localStorage.getItem('token');
            await api.delete(`/slots/${slotId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDbSlots(dbSlots.filter(s => s._id !== slotId));
        } catch (err) {
            console.error(err);
            alert('Failed to delete slot.');
        }
    };

    const toggleUserBlock = async (userId) => {
        try {
            await api.post('/auth/toggle-block', { userId });
            setUsers(users.map(u => u._id === userId ? { ...u, isBlocked: !u.isBlocked } : u));
        } catch (e) {
            alert('Failed to execute block sequence.');
        }
    };

    const verifyCashPayment = async (bookingId) => {
        try {
            const res = await api.post('/auth/verify-cash', { bookingId });
            setBookings(bookings.map(b => b._id === bookingId ? { ...b, paymentStatus: 'Verified', entryTime: res.data.booking.entryTime } : b));
        } catch (e) {
            alert('Failed to directly authorize terminal sync.');
        }
    };

    const startCamera = async () => {
        try {
            // Requesting HD resolution for better AI OCR precision
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } 
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setIsCameraActive(true);
            setAlprResult(null);
        } catch (err) {
            alert('Failed to access camera: ' + err.message);
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
        setIsCameraActive(false);
    };

    // Automatically stop camera if we leave the tab
    React.useEffect(() => {
        if (activeTab !== 'alpr') {
            stopCamera();
        }
    }, [activeTab]);

    const handleAdminAction = async (adminId, action) => {
        try {
            const res = await api.post(`/auth/admin/${action}`, { adminId, masterEmail: loggedUser.email });
            alert(res.data.message);
            const resUsers = await api.get('/auth/users');
            setUsers(resUsers.data);
        } catch (e) {
            alert('Action blocked by system security protocols.');
        }
    };

    const renderMasterControls = () => {
        const pendingAdmins = users.filter(u => u.role === 'admin' && u.adminStatus === 'Pending');
        const approvedAdmins = users.filter(u => u.role === 'admin' && u.adminStatus === 'Approved' && !u.isMasterAdmin);

        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 style={{ color: 'var(--royal-gold)', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}><ShieldCheck /> Master Governance Hub</h2>
                
                <div className="card" style={{ marginBottom: '30px' }}>
                    <h3 style={{ color: '#00f5d4', marginBottom: '20px' }}>Access Requests (Verification Queue)</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-color)', color: '#aaa', fontSize: '13px', textAlign: 'left' }}>
                                    <th style={{ padding: '15px' }}>Name</th>
                                    <th style={{ padding: '15px' }}>Email</th>
                                    <th style={{ padding: '15px' }}>Mobile Number</th>
                                    <th style={{ padding: '15px' }}>Working Branch</th>
                                    <th style={{ padding: '15px' }}>Request Timestamp</th>
                                    <th style={{ padding: '15px' }}>Action Hub</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingAdmins.map(admin => (
                                    <tr key={admin._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#fff', fontSize: '14px' }}>
                                        <td style={{ padding: '15px' }}>{admin.name}</td>
                                        <td style={{ padding: '15px' }}>{admin.email}</td>
                                        <td style={{ padding: '15px' }}>{admin.phone || 'Not Provided'}</td>
                                        <td style={{ padding: '15px' }}>{admin.branchAddress || 'Not Provided'}</td>
                                        <td style={{ padding: '15px' }}>{new Date(admin.createdAt).toLocaleString()}</td>
                                        <td style={{ padding: '15px', display: 'flex', gap: '10px' }}>
                                            <button onClick={() => handleAdminAction(admin._id, 'approve')} style={{ background: '#00f5d4', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Authorize Entry</button>
                                            <button onClick={() => handleAdminAction(admin._id, 'reject')} style={{ background: 'transparent', color: '#f15bb5', border: '1px solid #f15bb5', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>Reject Access</button>
                                        </td>
                                    </tr>
                                ))}
                                {pendingAdmins.length === 0 && <tr><td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#555' }}>No pending administrative requests found in the registry.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="card">
                    <h3 style={{ color: 'var(--royal-gold)', marginBottom: '20px' }}>Authorized Administrative Squad</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-color)', color: '#aaa', fontSize: '13px', textAlign: 'left' }}>
                                    <th style={{ padding: '15px' }}>Name</th>
                                    <th style={{ padding: '15px' }}>Email</th>
                                    <th style={{ padding: '15px' }}>Mobile Number</th>
                                    <th style={{ padding: '15px' }}>Working Branch</th>
                                    <th style={{ padding: '15px' }}>Security Status</th>
                                    <th style={{ padding: '15px' }}>Command</th>
                                </tr>
                            </thead>
                            <tbody>
                                {approvedAdmins.map(admin => (
                                    <tr key={admin._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#fff', fontSize: '14px' }}>
                                        <td style={{ padding: '15px' }}>{admin.name}</td>
                                        <td style={{ padding: '15px' }}>{admin.email}</td>
                                        <td style={{ padding: '15px' }}>{admin.phone || 'Not Provided'}</td>
                                        <td style={{ padding: '15px' }}>{admin.branchAddress || 'Not Provided'}</td>
                                        <td style={{ padding: '15px' }}>
                                            <span style={{ color: admin.isBlocked ? '#f15bb5' : '#00f5d4' }}>{admin.isBlocked ? 'ACCESS_REVOKED' : 'OPERATIONAL'}</span>
                                        </td>
                                        <td style={{ padding: '15px' }}>
                                            <button onClick={() => toggleUserBlock(admin._id)} style={{ padding: '6px 14px', background: 'rgba(255,183,3,0.1)', border: '1px solid #FFB703', color: '#FFB703', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                                                {admin.isBlocked ? 'Restore Clearance' : 'Revoke Clearance'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </motion.div>
        );
    };

    const captureAndScan = async () => {
        if (!videoRef.current || !canvasRef.current || isScanning) return;
        
        setIsScanning(true);
        setAlprResult(null);
        
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        const videoWidth = video.videoWidth || 1280;
        const videoHeight = video.videoHeight || 720;
        
        // Focus on the central 70% width and 45% height where the license plate is aligned
        const cropWidth = videoWidth * 0.70;
        const cropHeight = videoHeight * 0.45;
        const cropX = (videoWidth - cropWidth) / 2;
        const cropY = (videoHeight - cropHeight) / 2;
        
        canvas.width = 640;
        canvas.height = 320;
        const ctx = canvas.getContext('2d');
        
        // Apply professional image pre-processing to ensure crystal-clear black-on-white text
        ctx.filter = 'grayscale(100%) contrast(170%) brightness(115%)';
        
        // Draw the cropped center portion of the video to the canvas (zoomed close-up of plate)
        ctx.drawImage(
            video, 
            cropX, cropY, cropWidth, cropHeight, // Source crop
            0, 0, canvas.width, canvas.height    // Destination full canvas
        );
        
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));
        const formData = new FormData();
        formData.append('image', blob, `terminal_capture.jpg`);

        try {
            const response = await api.post('/alpr/scan', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            if (response.data && response.data.booking) {
                // Flash effect to simulate camera shutter
                if (videoRef.current) {
                    videoRef.current.style.filter = 'brightness(3)';
                    setTimeout(() => { if(videoRef.current) videoRef.current.style.filter = ''; }, 100);
                }

                setAlprResult(response.data);
                
                // INSTANT GLOBAL SYNC: Force-update the local booking state
                // This will automatically change "Authorize Terminal" to "Secure & Verified" in all tabs
                setBookings(currentBookings => 
                    currentBookings.map(b => b._id === response.data.booking._id ? { ...response.data.booking } : b)
                );

                setIsScanning(false);
                return true; 
            }
        } catch (err) {
            const errData = err.response?.data;
            setAlprResult({ 
                error: errData?.error || 'Registry Mismatch: No valid booking found for this vehicle.', 
                detectedText: errData?.detectedText || 'N/A'
            });
        } finally {
            setIsScanning(false);
        }
        return false;
    };

    // Autonomous loop removed as per request for strict "Photo Click" authorization

    const renderTransactions = (dataList) => {
        const listToMap = dataList || bookings;
        return (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '20px' }}>
            <thead>
                <tr style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--royal-gold)' }}>
                    <th style={{ padding: '15px' }}>Transaction ID</th>
                    <th style={{ padding: '15px' }}>Terminal Context</th>
                    <th style={{ padding: '15px' }}>Car & Slot Context</th>
                    <th style={{ padding: '15px' }}>Pricing & Window</th>
                    <th style={{ padding: '15px' }}>Terminal Auth</th>
                </tr>
            </thead>
            <tbody>
                {listToMap.length === 0 && !loadingUsers && <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center' }}>No transactions recorded matching this specific time parameter.</td></tr>}
                {listToMap.map((txn, i) => {
                    const s = new Date(txn.startMs).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                    const e = new Date(txn.endMs).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                    
                    const dynamicPhone = (txn.userPhone && txn.userPhone !== 'Not Provided') 
                        ? txn.userPhone 
                        : (users.find(u => u.email === txn.userEmail)?.phone || 'Not Provided');
                        
                    return (
                        <tr key={txn._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '15px', fontSize: '12px', color: '#999' }}>{txn._id.slice(-6).toUpperCase()}</td>
                            <td style={{ padding: '15px' }}>
                                <div>{txn.userName}</div>
                                <div style={{ fontSize: '12px', color: '#888' }}>{dynamicPhone}</div>
                                <div style={{ fontSize: '11px', color: '#aaa', textTransform: 'uppercase', marginTop: '2px' }}>{txn.paymentMethod}</div>
                            </td>
                            <td style={{ padding: '15px' }}>
                                <div style={{ fontWeight: 'bold', color: '#fff' }}>{txn.carNumber}</div>
                                {txn.carModel && txn.carModel !== 'Not Provided' && (
                                    <div style={{ fontSize: '12px', color: 'var(--royal-gold)', marginTop: '2px', fontWeight: 'bold' }}>Model: {txn.carModel}</div>
                                )}
                                <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>{txn.slotName} • Space: {txn.spaceId !== undefined ? (txn.spaceId < 10 ? `C-${txn.spaceId + 1}` : `B-${txn.spaceId - 9}`) : 'N/A'}</div>
                            </td>
                            <td style={{ padding: '15px' }}>
                                <div style={{ color: 'var(--royal-gold)', fontWeight: 'bold' }}>₹{txn.totalAmount}</div>
                                <div style={{ fontSize: '11px', color: '#aaa' }}>{s} - {e}</div>
                                <div style={{ fontSize: '11px', color: '#888', marginTop: '2px', fontWeight: 'bold' }}>{new Date(txn.startMs).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                            </td>
                            <td style={{ padding: '15px' }}>
                                {txn.entryTime ? (
                                    <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '12px', background: 'rgba(0, 245, 212, 0.2)', color: '#00f5d4' }}>
                                        Secure & Verified
                                    </span>
                                ) : (
                                    <button className="btn-gold" style={{ padding: '6px 12px', fontSize: '12px', background: '#FFB703', color: '#000', border: 'none', fontWeight: 'bold', borderRadius: '4px' }} onClick={() => verifyCashPayment(txn._id)}>
                                        Authorize Terminal
                                    </button>
                                )}
                            </td>
                        </tr>
                    )
                })}
            </tbody>
        </table>
        );
    };

    return (
        <div style={{ minHeight: '100vh', width: '100%', display: 'flex', boxSizing: 'border-box' }}>
            {/* Sidebar */}
            <div style={{ width: '280px', background: 'rgba(10, 17, 40, 0.95)', borderRight: '1px solid var(--border-color)', padding: '30px 20px', display: 'flex', flexDirection: 'column' }}>
                <div className="brand" style={{ marginBottom: '50px' }}>
                    <Car color="var(--royal-gold)" /> <span style={{ fontSize: '20px' }}>NETPark Admin</span>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '15px', flex: 1 }}>
                    <button className={`btn-primary ${activeTab === 'overview' ? '' : 'inactive'}`} style={{ textAlign: 'left', background: activeTab === 'overview' ? '' : 'transparent', border: activeTab === 'overview' ? '' : 'none', color: activeTab === 'overview' ? '#fff' : '#aaa' }} onClick={() => setActiveTab('overview')}>
                        <BarChart3 size={18} style={{ marginRight: '10px', verticalAlign: 'middle' }} /> Overview Hub
                    </button>
                    <button className={`btn-primary ${activeTab === 'profile' ? '' : 'inactive'}`} style={{ textAlign: 'left', background: activeTab === 'profile' ? '' : 'transparent', border: activeTab === 'profile' ? '' : 'none', color: activeTab === 'profile' ? '#fff' : '#aaa' }} onClick={() => setActiveTab('profile')}>
                        <User size={18} style={{ marginRight: '10px', verticalAlign: 'middle' }} /> My Profile
                    </button>
                    <button className={`btn-primary ${activeTab === 'slots' ? '' : 'inactive'}`} style={{ textAlign: 'left', background: activeTab === 'slots' ? '' : 'transparent', border: activeTab === 'slots' ? '' : 'none', color: activeTab === 'slots' ? '#fff' : '#aaa' }} onClick={() => setActiveTab('slots')}>
                        <LayoutGrid size={18} style={{ marginRight: '10px', verticalAlign: 'middle' }} /> Slot Management
                    </button>
                    <button className={`btn-primary ${activeTab === 'users' ? '' : 'inactive'}`} style={{ textAlign: 'left', background: activeTab === 'users' ? '' : 'transparent', border: activeTab === 'users' ? '' : 'none', color: activeTab === 'users' ? '#fff' : '#aaa' }} onClick={() => setActiveTab('users')}>
                        <Users size={18} style={{ marginRight: '10px', verticalAlign: 'middle' }} /> User Directory
                    </button>
                    <button className={`btn-primary ${activeTab === 'finance' ? '' : 'inactive'}`} style={{ textAlign: 'left', background: activeTab === 'finance' ? '' : 'transparent', border: activeTab === 'finance' ? '' : 'none', color: activeTab === 'finance' ? '#fff' : '#aaa' }} onClick={() => setActiveTab('finance')}>
                        <Wallet size={18} style={{ marginRight: '10px', verticalAlign: 'middle' }} /> Bookings & Finance
                    </button>
                    <button className={`btn-primary ${activeTab === 'intel' ? '' : 'inactive'}`} style={{ textAlign: 'left', background: activeTab === 'intel' ? '' : 'transparent', border: activeTab === 'intel' ? '' : 'none', color: activeTab === 'intel' ? '#fff' : '#aaa', display: 'flex', alignItems: 'center' }} onClick={() => setActiveTab('intel')}>
                        <Settings size={18} style={{ marginRight: '10px', verticalAlign: 'middle' }} /> AI Pricing System
                    </button>
                    <button className={`btn-primary ${activeTab === 'search' ? '' : 'inactive'}`} style={{ textAlign: 'left', background: activeTab === 'search' ? '' : 'transparent', border: activeTab === 'search' ? '' : 'none', color: activeTab === 'search' ? '#fff' : '#aaa', display: 'flex', alignItems: 'center' }} onClick={() => setActiveTab('search')}>
                        <Search size={18} style={{ marginRight: '10px', verticalAlign: 'middle' }} /> Global Search
                    </button>
                    <button className={`btn-primary ${activeTab === 'alpr' ? '' : 'inactive'}`} style={{ textAlign: 'left', background: activeTab === 'alpr' ? '' : 'transparent', border: activeTab === 'alpr' ? '' : 'none', color: activeTab === 'alpr' ? '#fff' : '#aaa', display: 'flex', alignItems: 'center' }} onClick={() => setActiveTab('alpr')}>
                        <Camera size={18} style={{ marginRight: '10px', verticalAlign: 'middle' }} /> AI Scanner
                    </button>

                    {loggedUser.isMaster && (
                        <button className={`btn-primary ${activeTab === 'master' ? '' : 'inactive'}`} style={{ textAlign: 'left', background: activeTab === 'master' ? '' : 'transparent', border: activeTab === 'master' ? '' : 'none', color: activeTab === 'master' ? '#fff' : '#aaa', display: 'flex', alignItems: 'center' }} onClick={() => setActiveTab('master')}>
                            <ShieldCheck size={18} style={{ marginRight: '10px', verticalAlign: 'middle' }} /> Master Controls
                        </button>
                    )}
                </nav>

                <button 
                    className="btn-primary" 
                    style={{ marginTop: 'auto', display: 'flex', justifyContent: 'center', gap: '10px', background: 'rgba(241, 91, 181, 0.1)', border: '1px solid #f15bb5', color: '#f15bb5', fontWeight: 'bold' }} 
                    onClick={() => { localStorage.clear(); navigate('/admin-login'); }}
                >
                    <LogOut size={18} /> Terminate & Secure Exit
                </button>
            </div>

            {/* Main Content */}
            <div style={{ flex: 1, padding: '40px', overflowY: 'auto', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '20px', right: '40px', zIndex: 100 }}>
                    <button style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-light)', padding: '10px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease' }} onClick={toggleTheme}>
                        {isLightMode ? <Moon size={20} color="var(--royal-purple)" /> : <Sun size={20} color="var(--royal-gold)" />}
                    </button>
                </div>
                <AnimatePresence mode="wait">
                    {activeTab === 'profile' && (
                        <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="card" style={{ minHeight: '600px', maxWidth: '600px', margin: '0 auto' }}>
                            <h2 style={{ color: 'var(--royal-gold)', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <User /> Administrative Profile Details
                            </h2>
                            {!isEditingProfile ? (
                                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '30px' }}>
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '5px' }}>Full Name</label>
                                        <div style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>{loggedUser.name}</div>
                                    </div>
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '5px' }}>Email Address</label>
                                        <div style={{ color: '#fff', fontSize: '16px' }}>{loggedUser.email}</div>
                                    </div>
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '5px' }}>Mobile Number</label>
                                        <div style={{ color: '#fff', fontSize: '16px' }}>{loggedUser.phone || 'Not Provided'}</div>
                                    </div>
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '5px' }}>Working Branch Address</label>
                                        <div style={{ color: '#00f5d4', fontSize: '16px', fontWeight: 'bold' }}>{loggedUser.branchAddress || 'Not Provided'}</div>
                                    </div>
                                    <div style={{ marginBottom: '30px', display: 'flex', gap: '20px' }}>
                                        <div>
                                            <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '5px' }}>Security Clearance Level</label>
                                            <span style={{ background: loggedUser.isMaster ? 'linear-gradient(135deg, #00f5d4, #00bbf9)' : 'rgba(255,183,3,0.2)', color: loggedUser.isMaster ? '#000' : '#FFB703', padding: '4px 12px', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px' }}>
                                                {loggedUser.isMaster ? 'MASTER ADMIN' : 'STANDARD ADMIN'}
                                            </span>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsEditingProfile(true)} className="btn-gold" style={{ padding: '12px 24px', fontWeight: 'bold', width: '100%' }}>
                                        Edit Profile Configurations
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleProfileUpdate} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '30px' }}>
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Full Name</label>
                                        <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} required style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '14px', color: '#fff', outline: 'none' }} />
                                    </div>
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Email Address (Non-Editable)</label>
                                        <input type="email" value={loggedUser.email} disabled style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '14px', color: '#777', outline: 'none', cursor: 'not-allowed' }} />
                                    </div>
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Mobile Number</label>
                                        <input type="text" value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} required style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '14px', color: '#fff', outline: 'none' }} />
                                    </div>
                                    <div style={{ marginBottom: '30px' }}>
                                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginBottom: '8px', fontWeight: '500' }}>Working Branch Address</label>
                                        <input type="text" value={profileBranch} onChange={(e) => setProfileBranch(e.target.value)} required style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '14px', color: '#fff', outline: 'none' }} />
                                    </div>
                                    <div style={{ display: 'flex', gap: '15px' }}>
                                        <button type="button" onClick={() => setIsEditingProfile(false)} disabled={profileLoading} style={{ flex: 1, padding: '14px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                                            Cancel
                                        </button>
                                        <button type="submit" disabled={profileLoading} style={{ flex: 1, padding: '14px', background: 'var(--royal-gold)', border: 'none', color: '#000', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                                            {profileLoading ? 'Saving...' : 'Save Updates'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'overview' && (
                        <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <h1 style={{ margin: '0 0 30px 0', color: 'var(--royal-gold)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <BarChart3 /> Analytics Dashboard
                            </h1>

                            {/* Stats Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                                {stats.map((stat, i) => (
                                    <motion.div
                                        key={i}
                                        className="card"
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: i * 0.1 }}
                                        style={{ textAlign: 'center', position: 'relative', overflow: 'hidden' }}
                                    >
                                        <div style={{ position: 'absolute', top: -10, right: -10, opacity: 0.1, transform: 'scale(4)' }}>
                                            {stat.icon}
                                        </div>
                                        <h3 style={{ color: stat.color, margin: '0 0 10px 0', fontSize: '36px', fontWeight: '900' }}>{stat.value}</h3>
                                        <p style={{ margin: 0, color: '#bbb', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>{stat.label}</p>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="card" style={{ minHeight: '300px' }}>
                                <h2 style={{ margin: '0 0 20px 0', color: 'var(--text-light)' }}>Recent System Activity</h2>
                                {renderTransactions(bookings.slice(0, 5))}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'slots' && (
                        <motion.div key="slots" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="card" style={{ minHeight: '600px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h2 style={{ margin: 0 }}><LayoutGrid size={24} style={{ verticalAlign: 'middle', marginRight: '10px', color: 'var(--royal-gold)' }} /> Manage Locations & Slots</h2>
                                <button className="btn-gold" style={{ padding: '8px 15px', display: 'flex', gap: '8px', alignItems: 'center' }} onClick={() => setShowAddSlotModal(true)}><Plus size={16} /> Add Slot</button>
                            </div>

                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--royal-text)', background: 'rgba(255,255,255,0.05)' }}>
                                        <th style={{ padding: '15px' }}>Slot Name</th>
                                        <th style={{ padding: '15px' }}>Location</th>
                                        <th style={{ padding: '15px' }}>Status</th>
                                        <th style={{ padding: '15px' }}>Prices (Bike / Car)</th>
                                        <th style={{ padding: '15px' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {liveSlots.map((row, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '15px', fontWeight: 'bold' }}>{row.name}</td>
                                            <td style={{ padding: '15px' }}>{row.loc}</td>
                                            <td style={{ padding: '15px' }}>
                                                <span style={{ fontWeight: 'bold', padding: '5px 10px', borderRadius: '4px', background: row.occupiedCount >= (row.carSpaces + row.bikeSpaces) ? 'rgba(241, 91, 181, 0.2)' : 'rgba(0, 245, 212, 0.2)', color: row.occupiedCount >= (row.carSpaces + row.bikeSpaces) ? '#f15bb5' : '#00f5d4' }}>
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '15px', color: 'var(--royal-gold)' }}>₹{row.bikePrice} / ₹{row.carPrice} hr</td>
                                            <td style={{ padding: '15px' }}>
                                                <button onClick={() => handleDeleteSlot(row.id)} style={{ background: 'none', border: '1px solid #f15bb5', color: '#f15bb5', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <AnimatePresence>
                                {showAddSlotModal && (
                                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <motion.div 
                                            initial={{ opacity: 0, y: 20 }} 
                                            animate={{ opacity: 1, y: 0 }} 
                                            exit={{ opacity: 0, y: -20 }}
                                            style={{ background: 'rgba(10, 17, 40, 0.95)', border: '1px solid var(--royal-gold)', borderRadius: '12px', padding: '30px', width: '500px', maxWidth: '90%', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}
                                        >
                                            <h3 style={{ color: 'var(--royal-gold)', marginBottom: '20px' }}>Register New Slot Location</h3>
                                            <form onSubmit={handleAddSlotSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                                                <div>
                                                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginBottom: '8px' }}>Slot / Location Name</label>
                                                    <input type="text" required value={newSlotData.locationName} onChange={(e) => setNewSlotData({...newSlotData, locationName: e.target.value})} placeholder="e.g. NETPark Airport Road" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px', color: '#fff', outline: 'none' }} />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginBottom: '8px' }}>Address / Area</label>
                                                    <input type="text" value={newSlotData.slotNumber} onChange={(e) => setNewSlotData({...newSlotData, slotNumber: e.target.value})} placeholder="e.g. Airport Road, Hubli" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px', color: '#fff', outline: 'none' }} />
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                                    <div>
                                                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginBottom: '8px' }}>Bike Price (₹ / hr)</label>
                                                        <input type="number" required min="0" value={newSlotData.bikePrice} onChange={(e) => setNewSlotData({...newSlotData, bikePrice: e.target.value})} placeholder="e.g. 20" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px', color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
                                                    </div>
                                                    <div>
                                                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginBottom: '8px' }}>Car Price (₹ / hr)</label>
                                                        <input type="number" required min="0" value={newSlotData.carPrice} onChange={(e) => setNewSlotData({...newSlotData, carPrice: e.target.value})} placeholder="e.g. 40" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px', color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
                                                    </div>
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                                    <div>
                                                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginBottom: '8px' }}>Number of Bike Spaces</label>
                                                        <input type="number" required min="1" value={newSlotData.bikeSpaces} onChange={(e) => setNewSlotData({...newSlotData, bikeSpaces: e.target.value})} placeholder="e.g. 5" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px', color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
                                                    </div>
                                                    <div>
                                                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginBottom: '8px' }}>Number of Car Spaces</label>
                                                        <input type="number" required min="1" value={newSlotData.carSpaces} onChange={(e) => setNewSlotData({...newSlotData, carSpaces: e.target.value})} placeholder="e.g. 10" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px', color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginBottom: '8px' }}>Coordinates</label>
                                                    <input type="text" required value={newSlotData.coordinates} onChange={(e) => setNewSlotData({...newSlotData, coordinates: e.target.value})} placeholder="e.g. 15.366138, 75.118796" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px', color: '#fff', outline: 'none' }} />
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                    <div>
                                                        <label style={{ display: 'block', color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>Enable AI Dynamic Pricing</label>
                                                        <span style={{ fontSize: '11px', color: '#aaa' }}>If OFF, Custom Price is strictly enforced without AI multipliers.</span>
                                                    </div>
                                                    <div onClick={() => setNewSlotData({...newSlotData, isAiEnabled: !newSlotData.isAiEnabled})} style={{ width: '50px', height: '26px', background: newSlotData.isAiEnabled ? '#00f5d4' : '#444', borderRadius: '15px', position: 'relative', cursor: 'pointer', transition: '0.3s' }}>
                                                        <div style={{ width: '20px', height: '20px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '3px', left: newSlotData.isAiEnabled ? '27px' : '3px', transition: '0.3s' }} />
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                                                    <button type="button" onClick={() => setShowAddSlotModal(false)} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
                                                    <button type="submit" style={{ flex: 1, padding: '12px', background: '#00f5d4', border: 'none', color: '#000', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Add</button>
                                                </div>
                                            </form>
                                        </motion.div>
                                    </div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}

                    {activeTab === 'users' && (
                        <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="card" style={{ minHeight: '600px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h2 style={{ margin: 0 }}><Users size={24} style={{ verticalAlign: 'middle', marginRight: '10px', color: 'var(--royal-gold)' }} /> User Directory & Wallets</h2>
                                <button className="btn-primary" style={{ padding: '8px 15px', display: 'flex', gap: '8px', alignItems: 'center' }}><Key size={16} /> Block/Unblock DB</button>
                            </div>

                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.05)', color: 'var(--royal-gold)' }}>
                                        <th style={{ padding: '15px' }}>Database ID</th>
                                        <th style={{ padding: '15px' }}>Name</th>
                                        <th style={{ padding: '15px' }}>Email</th>
                                        <th style={{ padding: '15px' }}>Role</th>
                                        <th style={{ padding: '15px' }}>Wallet Balance</th>
                                        <th style={{ padding: '15px' }}>Security Override</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingUsers ? <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center' }}>Synchronizing DB...</td></tr> : users.map((row, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: row.isBlocked ? 'rgba(241, 91, 181, 0.05)' : 'transparent' }}>
                                            <td style={{ padding: '15px', color: '#999', fontSize: '12px' }}>{row._id}</td>
                                            <td style={{ padding: '15px' }}>{row.name} {row.isBlocked && <ShieldAlert size={14} color="#f15bb5" style={{verticalAlign:'middle', marginLeft: '5px'}}/>}</td>
                                            <td style={{ padding: '15px' }}>{row.email}</td>
                                            <td style={{ padding: '15px', textTransform: 'capitalize' }}>{row.role}</td>
                                            <td style={{ padding: '15px', fontWeight: 'bold' }}>₹{row.walletBalance?.toFixed(2) || '0.00'}</td>
                                            <td style={{ padding: '15px' }}>
                                                <button onClick={() => toggleUserBlock(row._id)} style={{ background: row.isBlocked ? '#00f5d4' : '#f15bb5', color: '#000', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}>
                                                    {row.isBlocked ? 'Unblock' : 'Suspend'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </motion.div>
                    )}

                    {activeTab === 'finance' && (
                        <motion.div key="finance" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ minHeight: '600px' }}>
                            <div className="card" style={{ marginBottom: '30px' }}>
                                <h2 style={{ margin: '0 0 20px 0', color: '#00f5d4' }}><Car size={24} style={{ verticalAlign: 'middle', marginRight: '10px' }} /> Live Present Vehicles (Parked Now)</h2>
                                {renderTransactions(
                                    bookings
                                        .filter(b => b.startMs <= Date.now() && b.endMs > Date.now() && !b.exitTime && b.status !== 'Cancelled')
                                        .sort((x, y) => x.startMs - y.startMs)
                                )}
                            </div>
                            
                            <div className="card" style={{ marginBottom: '30px' }}>
                                <h2 style={{ margin: '0 0 20px 0', color: '#f15bb5' }}><LayoutGrid size={24} style={{ verticalAlign: 'middle', marginRight: '10px' }} /> Pre-Booked (Arriving Later)</h2>
                                {renderTransactions(
                                    bookings
                                        .filter(b => b.startMs > Date.now() && !b.exitTime && b.status !== 'Cancelled')
                                        .sort((x, y) => x.startMs - y.startMs)
                                )}
                            </div>

                            <div className="card">
                                <h2 style={{ margin: '0 0 20px 0', color: 'var(--royal-gold)' }}><FileText size={24} style={{ verticalAlign: 'middle', marginRight: '10px' }} /> Transaction History (Completed)</h2>
                                {renderTransactions(
                                    bookings
                                        .filter(b => b.endMs <= Date.now() || b.exitTime || b.status === 'Cancelled')
                                        .sort((x, y) => y.endMs - x.endMs)
                                )}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'intel' && (
                        <motion.div key="intel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="card" style={{ minHeight: '600px' }}>
                            <h2 style={{ margin: '0 0 20px 0' }}><Settings size={24} style={{ verticalAlign: 'middle', marginRight: '10px', color: 'var(--royal-gold)' }} /> Dynamic Pricing Engine</h2>
                            <p style={{ color: '#aaa' }}>The AI Pricing Engine automatically regulates slot pricing based on real-time occupancy and pre-booked event density.</p>
                            
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', marginTop: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 5px 0', color: '#fff', fontSize: '16px' }}>Master Override: Global AI Pricing</h3>
                                    <span style={{ fontSize: '13px', color: '#aaa' }}>Force strictly enforce custom static pricing globally across all parking slots.</span>
                                </div>
                                <div onClick={handleGlobalAiToggle} style={{ width: '60px', height: '30px', background: globalAiEnabled ? '#00f5d4' : '#444', borderRadius: '15px', position: 'relative', cursor: 'pointer', transition: '0.3s' }}>
                                    <div style={{ width: '24px', height: '24px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '3px', left: globalAiEnabled ? '33px' : '3px', transition: '0.3s' }} />
                                </div>
                            </div>

                            <div style={{ background: 'rgba(0,0,0,0.5)', padding: '20px', borderRadius: '12px', marginTop: '30px', opacity: globalAiEnabled ? 1 : 0.4, transition: '0.3s', pointerEvents: globalAiEnabled ? 'auto' : 'none' }}>
                                <h3>Current Multipliers active (Live)</h3>
                                <div style={{ display: 'flex', gap: '30px', marginTop: '15px' }}>
                                    <div>
                                        <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#aaa' }}>High Demand Hour (12PM - 4PM)</p>
                                        <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#f15bb5' }}>1.5x</span>
                                    </div>
                                    <div>
                                        <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#aaa' }}>Weekend Surcharge (Sat/Sun)</p>
                                        <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--royal-gold)' }}>1.2x</span>
                                    </div>
                                    <div>
                                        <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#aaa' }}>Empty Slot Threshold (&lt;20% full)</p>
                                        <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#00f5d4' }}>0.8x</span>
                                    </div>
                                </div>
                            </div>

                            <h3 style={{ margin: '40px 0 20px 0', color: '#00f5d4' }}>Base Pricing Configuration</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {dbSlots.map(slot => (
                                    <div key={slot._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '20px', borderRadius: '12px' }}>
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ margin: '0 0 5px 0', color: '#fff', fontSize: '16px' }}>{slot.locationName}</h4>
                                            <span style={{ color: '#aaa', fontSize: '13px' }}>{slot.slotNumber || 'Hubli'}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.5)', padding: '8px 12px', borderRadius: '8px' }}>
                                                <span style={{ fontSize: '12px', fontWeight: 'bold', color: slot.isAiEnabled ? '#00f5d4' : '#aaa' }}>AI PRICING</span>
                                                <div onClick={() => handlePricingChange(slot._id, 'isAiEnabled', !slot.isAiEnabled)} style={{ width: '40px', height: '20px', background: slot.isAiEnabled ? '#00f5d4' : '#f15bb5', borderRadius: '10px', position: 'relative', cursor: 'pointer', transition: '0.3s' }}>
                                                    <div style={{ width: '16px', height: '16px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: slot.isAiEnabled ? '22px' : '2px', transition: '0.3s' }} />
                                                </div>
                                                <span style={{ fontSize: '12px', fontWeight: 'bold', color: !slot.isAiEnabled ? '#f15bb5' : '#aaa' }}>CUSTOM</span>
                                            </div>
                                            
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <label style={{ fontSize: '11px', color: '#aaa', marginBottom: '5px' }}>Car (₹/hr)</label>
                                                <input type="number" value={slot.carPrice} onChange={(e) => handlePricingChange(slot._id, 'carPrice', e.target.value)} style={{ width: '60px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px', color: '#fff', borderRadius: '6px', textAlign: 'center' }} />
                                            </div>
                                            
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <label style={{ fontSize: '11px', color: '#aaa', marginBottom: '5px' }}>Bike (₹/hr)</label>
                                                <input type="number" value={slot.bikePrice} onChange={(e) => handlePricingChange(slot._id, 'bikePrice', e.target.value)} style={{ width: '60px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px', color: '#fff', borderRadius: '6px', textAlign: 'center' }} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'search' && (
                        <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ minHeight: '600px' }}>
                            <div className="card" style={{ marginBottom: '30px' }}>
                                <h1 style={{ margin: '0 0 20px 0', color: 'var(--royal-gold)', display: 'flex', alignItems: 'center', gap: '10px' }}><Search /> Search Registry</h1>
                                <input 
                                    type="text" 
                                    placeholder="Search by Vehicle Number, Name, or Transaction ID..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{ width: '100%', padding: '15px', borderRadius: '8px', border: '2px solid var(--border-color)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '16px' }}
                                />
                            </div>
                            
                            {searchQuery.trim().length > 0 ? (
                                <>
                                    <div className="card" style={{ marginBottom: '30px' }}>
                                        <h2 style={{ margin: '0 0 20px 0', color: '#00f5d4' }}><Car size={18} style={{ verticalAlign: 'middle', marginRight: '10px' }} /> Live Matches</h2>
                                        {renderTransactions(
                                            bookings
                                                .filter(b => b.startMs <= Date.now() && b.endMs > Date.now() && !b.exitTime && b.status !== 'Cancelled' && (b.carNumber?.toLowerCase().includes(searchQuery.toLowerCase()) || b.userName?.toLowerCase().includes(searchQuery.toLowerCase()) || b._id?.toLowerCase().includes(searchQuery.toLowerCase())))
                                                .sort((x, y) => x.startMs - y.startMs)
                                        )}
                                    </div>

                                    <div className="card" style={{ marginBottom: '30px' }}>
                                        <h2 style={{ margin: '0 0 20px 0', color: '#f15bb5' }}><LayoutGrid size={18} style={{ verticalAlign: 'middle', marginRight: '10px' }} /> Pre-Booked Matches</h2>
                                        {renderTransactions(
                                            bookings
                                                .filter(b => b.startMs > Date.now() && !b.exitTime && b.status !== 'Cancelled' && (b.carNumber?.toLowerCase().includes(searchQuery.toLowerCase()) || b.userName?.toLowerCase().includes(searchQuery.toLowerCase()) || b._id?.toLowerCase().includes(searchQuery.toLowerCase())))
                                                .sort((x, y) => x.startMs - y.startMs)
                                        )}
                                    </div>

                                    <div className="card">
                                        <h2 style={{ margin: '0 0 20px 0', color: 'var(--royal-gold)' }}><FileText size={18} style={{ verticalAlign: 'middle', marginRight: '10px' }} /> Historical Matches</h2>
                                        {renderTransactions(
                                            bookings
                                                .filter(b => (b.endMs <= Date.now() || b.exitTime || b.status === 'Cancelled') && (b.carNumber?.toLowerCase().includes(searchQuery.toLowerCase()) || b.userName?.toLowerCase().includes(searchQuery.toLowerCase()) || b._id?.toLowerCase().includes(searchQuery.toLowerCase())))
                                                .sort((x, y) => y.endMs - x.endMs)
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div style={{ textAlign: 'center', color: '#aaa', marginTop: '50px' }}>
                                    <Search size={48} style={{ opacity: 0.2, marginBottom: '15px' }} />
                                    <p>Start typing above to search the global registry...</p>
                                </div>
                            )}
                        </motion.div>
                    )}



                    {activeTab === 'alpr' && (
                        <motion.div key="alpr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="card" style={{ minHeight: '600px' }}>
                            <h2 style={{ margin: '0 0 20px 0', color: 'var(--royal-gold)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Camera /> AI Number Plate Recognition (ALPR)
                            </h2>
                            <div style={{ marginBottom: '30px' }}>
                                <p style={{ color: '#aaa', marginBottom: '20px' }}>Livestream the vehicle's license plate directly through the web camera. The AI will cross-verify current time constraints and authenticate.</p>
                                
                                <div style={{ display: isCameraActive || isScanning ? 'inline-block' : 'none', background: '#000', padding: '10px', borderRadius: '12px', position: 'relative', overflow: 'hidden' }}>
                                    <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', maxWidth: '500px', borderRadius: '8px', marginBottom: '15px', border: '2px solid #333' }}></video>
                                    
                                    {/* AI Scanning Overlay */}
                                    <AnimatePresence>
                                        {(isCameraActive || isScanning) && (
                                            <motion.div 
                                                initial={{ opacity: 0 }} 
                                                animate={{ opacity: 1 }} 
                                                exit={{ opacity: 0 }}
                                                style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', height: 'calc(100% - 75px)', pointerEvents: 'none', border: '1px solid rgba(0, 245, 212, 0.3)', borderRadius: '8px' }}
                                            >
                                                {/* Corner markers */}
                                                <div style={{ position: 'absolute', top: 10, left: 10, width: 20, height: 20, borderTop: '2px solid #00f5d4', borderLeft: '2px solid #00f5d4' }} />
                                                <div style={{ position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderTop: '2px solid #00f5d4', borderRight: '2px solid #00f5d4' }} />
                                                <div style={{ position: 'absolute', bottom: 10, left: 10, width: 20, height: 20, borderBottom: '2px solid #00f5d4', borderLeft: '2px solid #00f5d4' }} />
                                                <div style={{ position: 'absolute', bottom: 10, right: 10, width: 20, height: 20, borderBottom: '2px solid #00f5d4', borderRight: '2px solid #00f5d4' }} />
                                                
                                                {/* Scanning laser line */}
                                                {isScanning && (
                                                    <motion.div 
                                                        animate={{ top: ['0%', '100%', '0%'] }} 
                                                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                                        style={{ position: 'absolute', left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, #00f5d4, transparent)', zIndex: 10, boxShadow: '0 0 10px #00f5d4' }}
                                                    />
                                                )}

                                                <div style={{ position: 'absolute', bottom: '20px', left: '0', right: '0', textAlign: 'center' }}>
                                                    <span style={{ background: 'rgba(0,0,0,0.7)', color: 'var(--royal-gold)', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                         Registry Capture Interface Ready
                                                    </span>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button onClick={captureAndScan} className="btn-gold" style={{ flex: 1, padding: '15px', fontWeight: 'bold', fontSize: '15px' }} disabled={isScanning}>
                                            {isScanning ? 'Synchronizing Registry...' : 'Capture & Authorize Vehicle'}
                                        </button>
                                        {!isScanning && (
                                            <button onClick={stopCamera} style={{ padding: '12px 20px', background: '#333', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                                                Close
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {!isCameraActive && !isScanning && (
                                    <button onClick={startCamera} className="btn-gold" style={{ padding: '12px 24px', fontWeight: 'bold' }}>
                                        Open Camera for Scan
                                    </button>
                                )}
                            </div>
                            {alprResult && (
                                <div style={{ background: 'rgba(0,0,0,0.4)', padding: '20px', borderRadius: '12px', border: alprResult.error ? '1px solid #f15bb5' : '1px solid #00f5d4' }}>
                                    <h3 style={{ margin: '0 0 15px 0', color: alprResult.action ? '#00f5d4' : '#f15bb5' }}>
                                        {alprResult.action ? `Result: ${alprResult.action}` : 'Scan Failed'}
                                    </h3>
                                    <div style={{ marginBottom: '10px' }}>
                                        <strong style={{ color: '#fff' }}>Detected Text Context:</strong> 
                                        <span style={{ marginLeft: '10px', color: '#ccc', fontFamily: 'monospace', background: '#222', padding: '4px 8px', borderRadius: '4px' }}>{alprResult.detectedText}</span>
                                    </div>
                                    {alprResult.booking && !alprResult.error && (
                                        <motion.div 
                                            initial={{ scale: 0.9, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            style={{ marginTop: '15px', padding: '20px', background: 'linear-gradient(135deg, rgba(0, 245, 212, 0.1), rgba(0,0,0,0.4))', borderRadius: '12px', border: '1px solid #00f5d4' }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                                <h3 style={{ margin: 0, color: '#00f5d4', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <ShieldAlert size={20} /> Registry Clearance Authorized
                                                </h3>
                                                <span style={{ fontSize: '12px', background: '#00f5d4', color: '#000', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>ENTRY GRANTED</span>
                                            </div>

                                            <p style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>{alprResult.booking.carNumber} • {alprResult.booking.carModel}</p>
                                            
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                                                <p style={{ margin: 0, color: '#aaa' }}><strong>Authorized User:</strong> {alprResult.booking.userName}</p>
                                                <p style={{ margin: 0, color: '#aaa' }}><strong>Terminal Slot:</strong> {alprResult.booking.slotName}</p>
                                                <p style={{ margin: 0, color: 'var(--royal-gold)', fontWeight: 'bold' }}>Secure Entry Synchronized Globally</p>
                                            </div>
                                        </motion.div>
                                    )}

                                    {alprResult.booking && alprResult.error && (
                                        <motion.div 
                                            initial={{ scale: 0.9, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            style={{ marginTop: '15px', padding: '20px', background: 'rgba(241, 91, 181, 0.1)', borderRadius: '12px', border: '1px solid #f15bb5' }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                                <h3 style={{ margin: 0, color: '#f15bb5', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <ShieldAlert size={20} /> Security Access Denied
                                                </h3>
                                                <span style={{ fontSize: '12px', background: '#f15bb5', color: '#000', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>UNAUTHORIZED</span>
                                            </div>
                                            <p style={{ margin: '0 0 10px 0', color: '#fff' }}><strong>Vehicle:</strong> {alprResult.booking.carNumber} ({alprResult.booking.carModel})</p>
                                            <p style={{ margin: 0, color: '#f15bb5', fontWeight: 'bold', fontSize: '14px' }}>{alprResult.error}</p>
                                        </motion.div>
                                    )}
                                    
                                    {alprResult.error && !alprResult.booking && (
                                        <p style={{ margin: '15px 0 0 0', color: '#f15bb5', fontWeight: 'bold', background: 'rgba(241, 91, 181, 0.1)', padding: '10px', borderRadius: '8px' }}>{alprResult.error}</p>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'master' && loggedUser.isMaster && (
                        <motion.div key="master" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            {renderMasterControls()}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

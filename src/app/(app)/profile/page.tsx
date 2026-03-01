'use client';
import { useState, useEffect } from 'react';

const FIREBASE_CONFIG = {
    apiKey: "AIzaSyAbOyzOi3xqyXNLWrmkL7pqMrxk_opjW1I",
    authDomain: "savorly-d2e63.firebaseapp.com",
    projectId: "savorly-d2e63",
    storageBucket: "savorly-d2e63.firebasestorage.app",
    messagingSenderId: "820941077673",
    appId: "1:820941077673:web:feffe61f09d5970c477db8",
    measurementId: "G-E3YQ1VSL75"
};

function ensureFirebaseInit() {
    const fb = (window as any).firebase;
    if (fb && !fb.apps.length) {
        try { fb.initializeApp(FIREBASE_CONFIG); } catch (e) { /* already init */ }
    }
    return fb && fb.apps.length > 0;
}

interface OrderItem {
    planName: string;
    quantity: number;
    price: number;
}

interface Order {
    orderId: string;
    timestamp: string;
    status: string;
    totalPrice: number;
    items: OrderItem[];
    paymentStatus?: string;
}

interface UserInfo {
    displayName: string;
    email: string;
    photoURL: string | null;
    uid: string;
}

export default function ProfilePage() {
    const [user, setUser] = useState<UserInfo | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [authChecked, setAuthChecked] = useState(false);
    const [showHelpModal, setShowHelpModal] = useState(false);
    const [helpSubject, setHelpSubject] = useState('Order Issue');
    const [helpMessage, setHelpMessage] = useState('');

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;

        const initAuth = () => {
            if (typeof window !== 'undefined' && (window as any).firebase) {
                ensureFirebaseInit();
                const fb = (window as any).firebase;
                if (fb.apps.length > 0 && fb.auth) {
                    unsubscribe = fb.auth().onAuthStateChanged(async (firebaseUser: any) => {
                        if (firebaseUser) {
                            setUser({
                                displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                                email: firebaseUser.email || '',
                                photoURL: firebaseUser.photoURL || null,
                                uid: firebaseUser.uid
                            });
                            setAuthChecked(true);

                            // Fetch orders
                            try {
                                const token = await firebaseUser.getIdToken();
                                const res = await fetch('/api/orders/my', {
                                    headers: { 'Authorization': `Bearer ${token}` }
                                });
                                if (res.ok) {
                                    const data = await res.json();
                                    setOrders(data.orders || []);
                                }
                            } catch (err) {
                                console.error('Error fetching orders:', err);
                            } finally {
                                setLoading(false);
                            }
                        } else {
                            window.location.href = '/login?redirect=/profile';
                        }
                    });
                    return true;
                }
            }
            return false;
        };

        if (!initAuth()) {
            const interval = setInterval(() => {
                if (initAuth()) clearInterval(interval);
            }, 200);
            const timeout = setTimeout(() => {
                clearInterval(interval);
                if (!unsubscribe) window.location.href = '/login?redirect=/profile';
            }, 5000);
            return () => {
                clearInterval(interval);
                clearTimeout(timeout);
                if (unsubscribe) unsubscribe();
            };
        }

        return () => { if (unsubscribe) unsubscribe(); };
    }, []);

    const handleLogout = () => {
        if (typeof window !== 'undefined' && (window as any).firebase) {
            (window as any).firebase.auth().signOut().then(() => {
                localStorage.removeItem('savourlyUser');
                localStorage.removeItem('savourlyAuthToken');
                window.location.href = '/';
            });
        }
    };

    const handleHelpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = await (window as any).firebase.auth().currentUser?.getIdToken();
            const res = await fetch('/api/help', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + (token || '')
                },
                body: JSON.stringify({ subject: helpSubject, message: helpMessage })
            });
            if (res.ok) {
                alert('Help request submitted! We will contact you shortly.');
                setShowHelpModal(false);
                setHelpMessage('');
            } else {
                alert('Failed to submit request.');
            }
        } catch (err) {
            console.error(err);
            alert('Error submitting request.');
        }
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'U';
    };

    const getStatusStyle = (status: string) => {
        const s = status.toLowerCase().replace(/ /g, '-');
        const colors: Record<string, { bg: string; color: string }> = {
            'processing': { bg: '#dbeafe', color: '#1e40af' },
            'placed': { bg: '#fef3c7', color: '#92400e' },
            'preparing': { bg: '#dbeafe', color: '#1e40af' },
            'out-for-delivery': { bg: '#fce7f3', color: '#9d174d' },
            'delivered': { bg: '#d1fae5', color: '#065f46' },
            'cancelled': { bg: '#fee2e2', color: '#991b1b' },
        };
        return colors[s] || { bg: '#f3f4f6', color: '#374151' };
    };

    // Loading spinner
    if (!authChecked) {
        return (
            <>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f7f8fa' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ width: 48, height: 48, border: '4px solid #e0e0e0', borderTopColor: '#00C9A7', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                        <p style={{ color: '#666', fontSize: 14 }}>Loading profile...</p>
                        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <nav className="navbar profile-nav" style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '16px 5%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="nav-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, width: '100%', maxWidth: 800, margin: '0 auto' }}>
                    <a href="/" className="logo" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#111', fontWeight: 700, fontSize: 18 }}>
                        <img src="/assets/images/savourly-logo-new.png" alt="Savourly" style={{ height: 32 }} />
                        <span className="hide-on-mobile">Savourly</span>
                    </a>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, alignItems: 'center' }}>
                        <a href="/" className="hide-on-mobile" style={{ color: '#6b7280', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Home</a>
                        <a href="/#plans" className="hide-on-mobile" style={{ color: '#6b7280', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Plans</a>
                        <button onClick={handleLogout} style={{ background: 'none', border: '1px solid #ef4444', color: '#ef4444', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Logout</button>
                    </div>
                </div>
            </nav>

            <div className="container" style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
                {/* Profile Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                    <div>
                        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>My Profile</h1>
                        <p style={{ color: '#6b7280', fontSize: 14 }}></p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {user?.photoURL ? (
                            <img src={user.photoURL} alt="Profile" referrerPolicy="no-referrer"
                                style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid #00C9A7' }} />
                        ) : (
                            <div style={{
                                width: 48, height: 48, borderRadius: '50%',
                                background: 'linear-gradient(135deg, #00C9A7, #00e6be)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontWeight: 700, fontSize: 18
                            }}>
                                {getInitials(user?.displayName || 'U')}
                            </div>
                        )}
                        <div style={{ fontSize: 15, fontWeight: 600 }}>{user?.displayName || 'User'}</div>
                    </div>
                </div>

                {/* Section Title */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <span style={{ fontSize: 18, fontWeight: 700 }}>Order History</span>
                    <button onClick={() => setShowHelpModal(true)}
                        style={{ background: 'none', border: '1px solid #e5e7eb', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#6b7280' }}>
                        Need Help?
                    </button>
                </div>

                {/* Orders List */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
                        <div style={{ width: 36, height: 36, border: '3px solid #e5e7eb', borderTopColor: '#00C9A7', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                        Loading orders...
                        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                    </div>
                ) : orders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
                        No orders yet. <a href="/#plans" style={{ color: '#00C9A7' }}>Order now!</a>
                    </div>
                ) : (
                    orders.map(order => {
                        const statusStyle = getStatusStyle(order.status);
                        return (
                            <div key={order.orderId} style={{
                                background: '#fff', borderRadius: 16, padding: 20, marginBottom: 16,
                                border: '1px solid #e5e7eb', transition: 'box-shadow 0.2s'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                                    <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
                                        <div style={{ fontWeight: 700, fontSize: 15, color: '#00C9A7', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>#{order.orderId}</div>
                                        <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
                                            {new Date(order.timestamp).toLocaleDateString('en-IN', {
                                                day: 'numeric', month: 'short', year: 'numeric'
                                            })}
                                        </div>
                                    </div>
                                    <span style={{
                                        flexShrink: 0, display: 'inline-block', padding: '4px 12px', borderRadius: 20,
                                        fontSize: 12, fontWeight: 600, textTransform: 'uppercase',
                                        letterSpacing: '0.3px', background: statusStyle.bg, color: statusStyle.color
                                    }}>
                                        {order.status}
                                    </span>
                                </div>
                                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 12, marginBottom: 12 }}>
                                    {order.items.map((item, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}>
                                            <span>{item.quantity || 1}x {item.planName || 'Item'}</span>
                                            <span style={{ color: '#6b7280', fontWeight: 600 }}>₹{((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}</span>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e5e7eb', paddingTop: 12, fontWeight: 700, fontSize: 16 }}>
                                    <span>Total</span>
                                    <span style={{ color: '#00C9A7' }}>₹{(order.totalPrice || 0).toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Help Modal */}
            {showHelpModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, padding: 20
                }} onClick={() => setShowHelpModal(false)}>
                    <div style={{
                        background: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 480,
                        boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Help & Support</h2>
                            <button onClick={() => setShowHelpModal(false)}
                                style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#6b7280' }}>×</button>
                        </div>
                        <form onSubmit={handleHelpSubmit}>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Subject</label>
                                <select value={helpSubject} onChange={e => setHelpSubject(e.target.value)}
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14 }}>
                                    <option value="Order Issue">Order Issue</option>
                                    <option value="Payment Problem">Payment Problem</option>
                                    <option value="Subscription Question">Subscription Question</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Message</label>
                                <textarea value={helpMessage} onChange={e => setHelpMessage(e.target.value)}
                                    rows={4} placeholder="Describe your issue..." required
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, resize: 'vertical' }} />
                            </div>
                            <button type="submit"
                                style={{ width: '100%', padding: '12px', background: '#00C9A7', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                                Submit Request
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

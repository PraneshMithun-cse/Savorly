'use client';
import { useState, useEffect, useCallback } from 'react';

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
    if (fb && !fb.apps.length) { try { fb.initializeApp(FIREBASE_CONFIG); } catch (e) { /* */ } }
    return fb && fb.apps.length > 0;
}

interface OrderItem { name: string; price: number; quantity: number; }
interface Order {
    _id: string; orderId: string;
    customer: { name?: string; phone?: string; address?: string };
    items: OrderItem[]; totalAmount: number; orderStatus: string;
    deliveryStatus: string; paymentMethod: string; paymentStatus: string;
    createdAt: string; deliveredAt?: string;
}

type Tab = 'new' | 'active' | 'completed';

export default function DeliveryPartnerPage() {
    const [authChecked, setAuthChecked] = useState(false);
    const [token, setToken] = useState('');
    const [userName, setUserName] = useState('');
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('new');
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        let unsub: (() => void) | undefined;
        const init = () => { if (typeof window !== 'undefined' && (window as any).firebase) { ensureFirebaseInit(); const fb = (window as any).firebase; if (fb.apps.length > 0 && fb.auth) { unsub = fb.auth().onAuthStateChanged(async (user: any) => { if (user) { const t = await user.getIdToken(); setToken(t); setUserName(user.displayName || user.email?.split('@')[0] || 'Partner'); try { const res = await fetch('/api/delivery/orders', { headers: { 'Authorization': `Bearer ${t}` } }); if (res.status === 403) { window.location.href = '/'; return; } setAuthChecked(true); } catch { window.location.href = '/'; } } else { window.location.href = '/login?redirect=/delivery-partner'; } }); return true; } } return false; };
        if (!init()) { const i = setInterval(() => { if (init()) clearInterval(i); }, 200); const t = setTimeout(() => { clearInterval(i); if (!unsub) window.location.href = '/login?redirect=/delivery-partner'; }, 5000); return () => { clearInterval(i); clearTimeout(t); if (unsub) unsub(); }; }
        return () => { if (unsub) unsub(); };
    }, []);

    const fetchOrders = useCallback(async () => { if (!token) return; try { const res = await fetch('/api/delivery/orders', { headers: { 'Authorization': `Bearer ${token}` } }); if (res.ok) { const d = await res.json(); setOrders(d.orders || []); } } catch (e) { console.error(e); } finally { setLoading(false); } }, [token]);
    useEffect(() => { if (authChecked && token) fetchOrders(); }, [authChecked, token, fetchOrders]);
    useEffect(() => { if (!authChecked || !token) return; const i = setInterval(fetchOrders, 15000); return () => clearInterval(i); }, [authChecked, token, fetchOrders]);

    const updateStatus = async (orderId: string, status: string) => {
        if (updatingId) return;
        if (status === 'Delivered' && !confirm('Confirm this order has been delivered?')) return;
        setUpdatingId(orderId);
        try { const res = await fetch(`/api/delivery/orders/${orderId}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ status }) }); if (res.ok) fetchOrders(); else { const d = await res.json(); alert(d.error || 'Failed'); } } catch { alert('Network error'); } finally { setUpdatingId(null); }
    };

    const openMaps = (address: string) => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}&travelmode=driving`, '_blank');

    const filtered = orders.filter(o => {
        if (activeTab === 'new') return !o.deliveryStatus || o.deliveryStatus === 'Assigned' || (!['Picked Up', 'On The Way', 'Delivered', 'Failed Delivery'].includes(o.deliveryStatus));
        if (activeTab === 'active') return ['Picked Up', 'On The Way'].includes(o.deliveryStatus);
        return ['Delivered', 'Failed Delivery'].includes(o.deliveryStatus);
    });

    const todayDeliveries = orders.filter(o => o.deliveryStatus === 'Delivered' && o.deliveredAt && new Date(o.deliveredAt).toDateString() === new Date().toDateString()).length;
    const newCount = orders.filter(o => !o.deliveryStatus || o.deliveryStatus === 'Assigned' || (!['Picked Up', 'On The Way', 'Delivered', 'Failed Delivery'].includes(o.deliveryStatus))).length;
    const activeCount = orders.filter(o => ['Picked Up', 'On The Way'].includes(o.deliveryStatus)).length;

    const statusFlow: Record<string, string[]> = { '': ['Picked Up'], 'Assigned': ['Picked Up'], 'Picked Up': ['On The Way'], 'On The Way': ['Delivered', 'Failed Delivery'] };
    const statusMeta: Record<string, { color: string; bg: string; label: string }> = {
        '': { color: '#1D4ED8', bg: '#EFF6FF', label: 'New' },
        'Assigned': { color: '#1D4ED8', bg: '#EFF6FF', label: 'Assigned' },
        'Picked Up': { color: '#B45309', bg: '#FFFBEB', label: 'Picked Up' },
        'On The Way': { color: '#7C3AED', bg: '#F5F3FF', label: 'On The Way' },
        'Delivered': { color: '#047857', bg: '#ECFDF5', label: 'Delivered' },
        'Failed Delivery': { color: '#B91C1C', bg: '#FEF2F2', label: 'Failed' },
    };
    const payMethodLabels: Record<string, string> = { 'cod': 'Cash on Delivery', 'upi': 'UPI', 'razorpay': 'Online', 'gpay': 'Google Pay', 'phonepe': 'PhonePe' };
    const payStatusLabels: Record<string, { label: string; color: string }> = { 'paid': { label: 'Paid', color: '#047857' }, 'pending': { label: 'Pending', color: '#B45309' }, 'failed': { label: 'Failed', color: '#B91C1C' } };

    const getInitials = (n: string) => n ? n.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2) : 'U';

    if (!authChecked) return (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f8fafc' }}>
            <div style={{ width: 44, height: 44, border: '3px solid #e2e8f0', borderTopColor: '#00C9A7', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: '#94a3b8', marginTop: 16, fontSize: 14 }}>Verifying access...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
    );

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                @keyframes spin { to { transform: rotate(360deg) } }
                @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Inter', -apple-system, sans-serif; background: #f8fafc; -webkit-font-smoothing: antialiased; }
                .order-card { background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; margin-bottom: 12px; animation: fadeUp 0.3s ease; }
                .act-btn { flex: 1; padding: 13px; border-radius: 12px; border: none; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; justify-content: center; gap: 8px; }
                .act-btn:disabled { opacity: 0.5; cursor: not-allowed; }
                .tab-btn { flex: 1; padding: 13px 0; border: none; background: none; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.15s; position: relative; display: flex; align-items: center; justify-content: center; gap: 6px; color: #94a3b8; }
                .tab-btn::after { content: ''; position: absolute; bottom: 0; left: 25%; right: 25%; height: 2px; border-radius: 2px 2px 0 0; background: transparent; transition: all 0.15s; }
                .tab-btn.active { color: #00C9A7; }
                .tab-btn.active::after { background: #00C9A7; }
            `}</style>

            <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', paddingBottom: 80 }}>
                {/* HEADER */}
                <header style={{ background: 'linear-gradient(135deg, #00C9A7, #00A88E)', padding: '22px 20px 26px', color: '#fff', borderRadius: '0 0 24px 24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                            </div>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.02em' }}>Savorly Delivery</div>
                                <div style={{ fontSize: 13, opacity: 0.85, fontWeight: 500 }}>Hi, {userName}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.9 }}>{isOnline ? 'Online' : 'Offline'}</span>
                            <div onClick={() => setIsOnline(!isOnline)} style={{ width: 48, height: 26, borderRadius: 13, cursor: 'pointer', background: isOnline ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.15)', position: 'relative', transition: 'background 0.3s' }}>
                                <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: isOnline ? 25 : 3, transition: 'left 0.3s', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }} />
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                        {[
                            { label: 'Deliveries', value: String(todayDeliveries) },
                            { label: 'Earnings', value: `₹${todayDeliveries * 30}` },
                            { label: 'Rating', value: '4.8' },
                        ].map((s, i) => (
                            <div key={i} style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: '12px 10px', textAlign: 'center' }}>
                                <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em' }}>{s.value}</div>
                                <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 500 }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </header>

                {/* TABS */}
                <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, zIndex: 50 }}>
                    {([
                        { key: 'new' as Tab, label: 'New', count: newCount },
                        { key: 'active' as Tab, label: 'Active', count: activeCount },
                        { key: 'completed' as Tab, label: 'Completed', count: 0 },
                    ]).map(tab => (
                        <button key={tab.key} className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`} onClick={() => setActiveTab(tab.key)}>
                            {tab.label}
                            {tab.count > 0 && <span style={{ background: activeTab === tab.key ? '#00C9A7' : '#94a3b8', color: '#fff', fontSize: 10, padding: '1px 6px', borderRadius: 8, fontWeight: 700, minWidth: 18, textAlign: 'center' }}>{tab.count}</span>}
                        </button>
                    ))}
                </div>

                {/* ORDERS */}
                <div style={{ padding: '12px 16px' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>
                            <div style={{ width: 36, height: 36, border: '3px solid #e2e8f0', borderTopColor: '#00C9A7', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                            <div style={{ fontSize: 14, fontWeight: 500 }}>Loading orders...</div>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 48 }}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" style={{ margin: '0 auto 12px', display: 'block' }}><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" /></svg>
                            <div style={{ fontWeight: 700, fontSize: 15, color: '#334155', marginBottom: 4 }}>
                                {activeTab === 'new' ? 'No new orders' : activeTab === 'active' ? 'No active deliveries' : 'No completed orders'}
                            </div>
                            <div style={{ fontSize: 13, color: '#94a3b8' }}>
                                {activeTab === 'new' ? 'New assignments will appear here' : activeTab === 'active' ? 'Pick up an order to begin' : 'Your completed deliveries show here'}
                            </div>
                        </div>
                    ) : (
                        filtered.map((order, idx) => {
                            const meta = statusMeta[order.deliveryStatus] || statusMeta[''];
                            const nextSteps = statusFlow[order.deliveryStatus] || [];
                            const custName = order.customer?.name || 'Customer';
                            const hasAddress = !!order.customer?.address;
                            const payMethod = payMethodLabels[order.paymentMethod] || order.paymentMethod;
                            const payStat = payStatusLabels[order.paymentStatus] || payStatusLabels['pending'];

                            return (
                                <div key={order._id} className="order-card" style={{ animationDelay: `${idx * 0.04}s` }}>
                                    {/* Card Header */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid #f8fafc' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <span style={{ fontWeight: 800, color: '#00C9A7', fontSize: 14 }}>#{order.orderId}</span>
                                            <span style={{ color: '#e2e8f0' }}>|</span>
                                            <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
                                                {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <span style={{ padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: meta.bg, color: meta.color }}>
                                            {meta.label}
                                        </span>
                                    </div>

                                    <div style={{ padding: '14px 18px' }}>
                                        {/* Customer + Amount */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: '#475569' }}>{getInitials(custName)}</div>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{custName}</div>
                                                    {order.customer?.phone && (
                                                        <a href={`tel:${order.customer.phone}`} style={{ fontSize: 13, color: '#64748b', textDecoration: 'none' }}>{order.customer.phone}</a>
                                                    )}
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: 800, fontSize: 18, color: '#0f172a' }}>₹{order.totalAmount.toLocaleString('en-IN')}</div>
                                                <div style={{ fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                                                    <span style={{ color: payStat.color }}>{payStat.label}</span>
                                                    <span style={{ color: '#cbd5e1' }}>·</span>
                                                    <span style={{ color: '#94a3b8' }}>{payMethod}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Address */}
                                        {hasAddress && (
                                            <div style={{ background: '#f8fafc', borderRadius: 12, padding: '10px 14px', marginBottom: 12, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                                <span style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, fontWeight: 500 }}>{order.customer?.address}</span>
                                            </div>
                                        )}

                                        {/* Items */}
                                        <div style={{ marginBottom: 14 }}>
                                            <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Order Items</div>
                                            {order.items.map((item, i) => (
                                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
                                                    <span style={{ color: '#475569', fontWeight: 500 }}>{item.quantity || 1}x {item.name}</span>
                                                    <span style={{ fontWeight: 600, color: '#64748b' }}>₹{((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Navigate Button */}
                                        {hasAddress && !['Delivered', 'Failed Delivery'].includes(order.deliveryStatus) && (
                                            <button onClick={() => openMaps(order.customer!.address!)}
                                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: '#1D4ED8', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'background 0.15s', marginBottom: nextSteps.length > 0 ? 10 : 0 }}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>
                                                Navigate to Address
                                            </button>
                                        )}

                                        {/* Status Action Buttons */}
                                        {nextSteps.length > 0 && (
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                {nextSteps.map(status => {
                                                    const isDel = status === 'Delivered';
                                                    const isFail = status === 'Failed Delivery';
                                                    return (
                                                        <button key={status} onClick={() => updateStatus(order._id, status)} disabled={updatingId === order._id}
                                                            className="act-btn" style={{ background: isDel ? '#10B981' : isFail ? '#fff' : '#00C9A7', color: isFail ? '#B91C1C' : '#fff', border: isFail ? '2px solid #FECACA' : 'none' }}>
                                                            {updatingId === order._id ? <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                                                                : <>
                                                                    {isDel && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>}
                                                                    {isFail && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>}
                                                                    {!isDel && !isFail && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>}
                                                                    {status === 'Picked Up' ? 'Mark Picked Up' : status === 'On The Way' ? 'Start Delivery' : status === 'Delivered' ? 'Mark Delivered' : 'Failed Delivery'}
                                                                </>}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Completed Status */}
                                        {order.deliveryStatus === 'Delivered' && (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', borderRadius: 12, background: '#ECFDF5' }}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                                <span style={{ fontWeight: 700, color: '#047857', fontSize: 14 }}>Delivered Successfully</span>
                                            </div>
                                        )}
                                        {order.deliveryStatus === 'Failed Delivery' && (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', borderRadius: 12, background: '#FEF2F2' }}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B91C1C" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                                                <span style={{ fontWeight: 700, color: '#B91C1C', fontSize: 14 }}>Delivery Failed</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* BOTTOM NAV */}
                <nav style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, background: '#fff', borderTop: '1px solid #f1f5f9', display: 'flex', padding: '6px 0 env(safe-area-inset-bottom, 6px)', zIndex: 50 }}>
                    {[
                        { label: 'Home', active: true, action: () => { }, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg> },
                        { label: 'History', active: false, action: () => setActiveTab('completed'), icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg> },
                        { label: 'Earnings', active: false, action: () => { }, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg> },
                        { label: 'Sign Out', active: false, action: () => { (window as any).firebase?.auth().signOut(); localStorage.clear(); window.location.href = '/login'; }, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg> },
                    ].map((nav, i) => (
                        <button key={i} onClick={nav.action} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer', color: nav.active ? '#00C9A7' : '#94a3b8', fontSize: 10, fontWeight: nav.active ? 700 : 500, padding: '6px 0' }}>
                            {nav.icon}
                            {nav.label}
                        </button>
                    ))}
                </nav>
            </div>
        </>
    );
}

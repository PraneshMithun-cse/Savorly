'use client';
import React, { useState, useEffect, useCallback } from 'react';

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

interface OrderItem { id?: string; name: string; price: number; quantity: number; }
interface Order {
    _id: string; orderId: string; userId: string; userEmail: string;
    items: OrderItem[]; totalAmount: number; paymentMethod: string;
    paymentStatus: string; orderStatus: string; deliveryPersonId: string;
    deliveryStatus: string; statusHistory: any[];
    customer: { name?: string; phone?: string; address?: string };
    createdAt: string;
}
interface DeliveryUser { id: string; name: string; email: string; }
interface RoleUser { id: string; email: string; name: string; role: string; addedAt: string; }
interface Stats { todayRevenue: number; todayOrders: number; pending: number; todayDelivered: number; totalOrders: number; }
type Tab = 'dashboard' | 'orders' | 'settings';
const STATUSES = ['Placed', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];

// --- SVG Icon Components ---
const Icon = ({ d, size = 18, color = 'currentColor' }: { d: string; size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);
const DashboardIcon = () => <Icon d="M3 3h7v9H3V3zM14 3h7v5H14V3zM14 12h7v9H14V12zM3 16h7v5H3V16z" />;
const OrdersIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" /></svg>;
const SettingsIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06A1.65 1.65 0 0015 19.4a1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>;
const LogoutIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>;
const RefreshIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 4v6h-6" /><path d="M1 20v-6h6" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" /></svg>;

export default function AdminPage() {
    const [token, setToken] = useState('');
    const [authChecked, setAuthChecked] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('dashboard');
    const [currentTime, setCurrentTime] = useState('');
    const [orders, setOrders] = useState<Order[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [deliveryUsers, setDeliveryUsers] = useState<DeliveryUser[]>([]);
    const [roleUsers, setRoleUsers] = useState<RoleUser[]>([]);
    const [statusFilter, setStatusFilter] = useState('all');
    const [paymentFilter, setPaymentFilter] = useState('all');
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [assigningId, setAssigningId] = useState<string | null>(null);
    const [newEmail, setNewEmail] = useState('');
    const [newRole, setNewRole] = useState<'admin' | 'delivery'>('admin');
    const [settingRole, setSettingRole] = useState(false);
    const [clearingOrders, setClearingOrders] = useState(false);
    const [userName, setUserName] = useState('Admin');
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

    useEffect(() => { const tick = () => setCurrentTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })); tick(); const i = setInterval(tick, 1000); return () => clearInterval(i); }, []);

    useEffect(() => {
        let unsub: (() => void) | undefined;
        const init = () => { if (typeof window !== 'undefined' && (window as any).firebase) { ensureFirebaseInit(); const fb = (window as any).firebase; if (fb.apps.length > 0 && fb.auth) { unsub = fb.auth().onAuthStateChanged(async (user: any) => { if (user) { const t = await user.getIdToken(); setToken(t); setUserName(user.displayName || user.email?.split('@')[0] || 'Admin'); try { const res = await fetch('/api/admin/orders', { headers: { 'Authorization': `Bearer ${t}` } }); if (res.status === 403) { alert('Access denied. Admin credentials required.'); window.location.href = '/'; return; } setAuthChecked(true); } catch { window.location.href = '/'; } } else { window.location.href = '/login?redirect=/admin'; } }); return true; } } return false; };
        if (!init()) { const i = setInterval(() => { if (init()) clearInterval(i); }, 200); const t = setTimeout(() => { clearInterval(i); if (!unsub) window.location.href = '/login?redirect=/admin'; }, 5000); return () => { clearInterval(i); clearTimeout(t); if (unsub) unsub(); }; }
        return () => { if (unsub) unsub(); };
    }, []);

    const fetchOrders = useCallback(async () => { if (!token) return; try { const p = new URLSearchParams(); if (statusFilter !== 'all') p.set('status', statusFilter); if (paymentFilter !== 'all') p.set('payment', paymentFilter); const res = await fetch(`/api/admin/orders?${p}`, { headers: { 'Authorization': `Bearer ${token}` } }); if (res.ok) { const d = await res.json(); setOrders(d.orders || []); } } catch (e) { console.error(e); } }, [token, statusFilter, paymentFilter]);
    const fetchStats = useCallback(async () => { if (!token) return; try { const res = await fetch('/api/orders/stats', { headers: { 'Authorization': `Bearer ${token}` } }); if (res.ok) setStats(await res.json()); } catch (e) { console.error(e); } }, [token]);
    const fetchDeliveryUsers = useCallback(async () => { if (!token) return; try { const res = await fetch('/api/admin/delivery-users', { headers: { 'Authorization': `Bearer ${token}` } }); if (res.ok) { const d = await res.json(); setDeliveryUsers(d.deliveryUsers || []); } } catch (e) { console.error(e); } }, [token]);
    const fetchRoleUsers = useCallback(async () => { if (!token) return; try { const res = await fetch('/api/admin/settings/roles', { headers: { 'Authorization': `Bearer ${token}` } }); if (res.ok) { const d = await res.json(); setRoleUsers(d.users || []); } } catch (e) { console.error(e); } }, [token]);

    useEffect(() => { if (authChecked && token) Promise.all([fetchOrders(), fetchStats(), fetchDeliveryUsers(), fetchRoleUsers()]).finally(() => setLoading(false)); }, [authChecked, token, fetchOrders, fetchStats, fetchDeliveryUsers, fetchRoleUsers]);
    useEffect(() => { if (!authChecked || !token) return; const i = setInterval(() => { fetchOrders(); fetchStats(); }, 30000); return () => clearInterval(i); }, [authChecked, token, fetchOrders, fetchStats]);

    const updateOrderStatus = async (id: string, status: string) => { setUpdatingId(id); try { const res = await fetch(`/api/admin/orders/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ status }) }); if (res.ok) { fetchOrders(); fetchStats(); } else { const d = await res.json(); alert(d.error || 'Failed'); } } catch { alert('Network error'); } finally { setUpdatingId(null); } };
    const assignDelivery = async (id: string, dpId: string) => { if (!dpId) return; setAssigningId(id); try { const res = await fetch(`/api/admin/orders/${id}/assign`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ deliveryPersonId: dpId }) }); if (res.ok) fetchOrders(); else { const d = await res.json(); alert(d.error || 'Failed'); } } catch { alert('Network error'); } finally { setAssigningId(null); } };
    const handleAddRole = async (e: React.FormEvent) => { e.preventDefault(); if (!newEmail.trim()) return; setSettingRole(true); try { const res = await fetch('/api/admin/settings/roles', { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ email: newEmail.trim(), role: newRole }) }); const d = await res.json(); if (res.ok) { setNewEmail(''); fetchRoleUsers(); fetchDeliveryUsers(); } else alert(d.error || 'Failed'); } catch { alert('Network error'); } finally { setSettingRole(false); } };
    const handleRemoveRole = async (email: string) => { if (!confirm(`Remove elevated role from ${email}?`)) return; try { await fetch('/api/admin/settings/roles', { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ email, role: 'user' }) }); fetchRoleUsers(); fetchDeliveryUsers(); } catch { alert('Network error'); } };
    const handleClearOrders = async () => { if (!confirm('This will permanently delete ALL orders. Continue?')) return; if (!confirm('This cannot be undone. Confirm again.')) return; setClearingOrders(true); try { const res = await fetch('/api/admin/orders/clear', { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }); if (res.ok) { fetchOrders(); fetchStats(); } else { const d = await res.json(); alert(d.error || 'Failed'); } } catch { alert('Network error'); } finally { setClearingOrders(false); } };
    const handleRefresh = () => { setLoading(true); Promise.all([fetchOrders(), fetchStats(), fetchDeliveryUsers()]).finally(() => setLoading(false)); };

    const SB: Record<string, { bg: string; c: string; dot: string }> = { 'Placed': { bg: '#FFF7ED', c: '#C2410C', dot: '#F97316' }, 'Confirmed': { bg: '#EFF6FF', c: '#1D4ED8', dot: '#3B82F6' }, 'Preparing': { bg: '#F5F3FF', c: '#6D28D9', dot: '#8B5CF6' }, 'Out for Delivery': { bg: '#FDF2F8', c: '#BE185D', dot: '#EC4899' }, 'Delivered': { bg: '#ECFDF5', c: '#047857', dot: '#10B981' }, 'Cancelled': { bg: '#FEF2F2', c: '#B91C1C', dot: '#EF4444' } };
    const PB: Record<string, { bg: string; c: string; label: string }> = { 'paid': { bg: '#ECFDF5', c: '#047857', label: 'Paid' }, 'failed': { bg: '#FEF2F2', c: '#B91C1C', label: 'Failed' }, 'pending': { bg: '#FFFBEB', c: '#B45309', label: 'Pending' } };
    const payMethodLabels: Record<string, string> = { 'cod': 'Cash on Delivery', 'upi': 'UPI Payment', 'razorpay': 'Online Payment', 'gpay': 'Google Pay', 'phonepe': 'PhonePe' };

    const getInitials = (n: string) => n ? n.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2) : 'U';
    const deliveredCount = orders.filter(o => o.orderStatus === 'Delivered').length;
    const outCount = orders.filter(o => o.orderStatus === 'Out for Delivery').length;
    const pendingCount = orders.filter(o => ['Placed', 'Confirmed', 'Preparing'].includes(o.orderStatus)).length;
    const cancelledCount = orders.filter(o => o.orderStatus === 'Cancelled').length;

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
                @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Inter', -apple-system, sans-serif; background: #f8fafc; color: #0f172a; -webkit-font-smoothing: antialiased; }
                .sidebar-link { display: flex; align-items: center; gap: 12px; padding: 11px 16px; border-radius: 10px; color: #64748b; text-decoration: none; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.15s; border: none; background: none; width: 100%; text-align: left; }
                .sidebar-link:hover { background: #f1f5f9; color: #334155; }
                .sidebar-link.active { background: #00C9A7; color: #fff; font-weight: 600; box-shadow: 0 2px 8px rgba(0,201,167,0.25); }
                .card { background: #fff; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden; animation: fadeIn 0.25s ease; }
                .card-header { display: flex; justify-content: space-between; align-items: center; padding: 18px 22px; border-bottom: 1px solid #f1f5f9; }
                .stat-card { background: #fff; border-radius: 14px; padding: 22px; border: 1px solid #e2e8f0; transition: box-shadow 0.2s; }
                .stat-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.05); }
                .pill { display: inline-flex; align-items: center; gap: 5px; padding: 4px 12px; border-radius: 100px; font-size: 12px; font-weight: 600; white-space: nowrap; }
                .dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
                .table-row { transition: background 0.1s; }
                .table-row:hover { background: #fafbfc; }
                .btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 9px 18px; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; border: none; }
                .btn-primary { background: #00C9A7; color: #fff; }
                .btn-primary:hover { background: #00b396; }
                .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
                .btn-outline { background: #fff; color: #475569; border: 1px solid #e2e8f0; }
                .btn-outline:hover { background: #f8fafc; border-color: #cbd5e1; }
                .btn-danger-fill { background: #ef4444; color: #fff; }
                .btn-danger-fill:hover { background: #dc2626; }
                .btn-danger-fill:disabled { opacity: 0.5; cursor: not-allowed; }
                .sel { appearance: none; padding: 7px 30px 7px 12px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 13px; font-weight: 500; color: #334155; background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E") right 10px center no-repeat; cursor: pointer; transition: border-color 0.15s; }
                .sel:focus { outline: none; border-color: #00C9A7; box-shadow: 0 0 0 2px rgba(0,201,167,0.1); }
                .sel:disabled { opacity: 0.5; cursor: not-allowed; }
                .input { padding: 9px 14px; border-radius: 10px; border: 1px solid #e2e8f0; font-size: 14px; color: #334155; transition: border-color 0.15s; }
                .input:focus { outline: none; border-color: #00C9A7; box-shadow: 0 0 0 2px rgba(0,201,167,0.1); }
                .th { padding: 12px 18px; text-align: left; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; white-space: nowrap; }
                .td { padding: 14px 18px; font-size: 13px; vertical-align: middle; }
                .chip { display: inline-flex; align-items: center; gap: 4px; padding: 2px 10px; border-radius: 100px; font-size: 11px; font-weight: 600; text-transform: capitalize; letter-spacing: 0.02em; }
            `}</style>

            <div style={{ display: 'flex', minHeight: '100vh' }}>
                {/* SIDEBAR */}
                <aside style={{ width: 250, background: '#fff', borderRight: '1px solid #e2e8f0', padding: '24px 14px 20px', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36, paddingLeft: 10 }}>
                        <img src="/assets/images/savourly-logo-new.png" alt="Savorly" style={{ height: 28 }} />
                        <div>
                            <div style={{ fontWeight: 800, fontSize: 16, color: '#0f172a', letterSpacing: '-0.02em' }}>Savorly</div>
                            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Admin Panel</div>
                        </div>
                    </div>

                    <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                        <button className={`sidebar-link ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}><DashboardIcon /> Dashboard</button>
                        <button className={`sidebar-link ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
                            <OrdersIcon /> Orders
                            {orders.length > 0 && <span style={{ marginLeft: 'auto', background: activeTab === 'orders' ? 'rgba(255,255,255,0.25)' : '#00C9A7', color: '#fff', padding: '1px 7px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{orders.length}</span>}
                        </button>
                        <button className={`sidebar-link ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}><SettingsIcon /> Settings</button>
                    </nav>

                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 14, marginTop: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', marginBottom: 8 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#00C9A7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13 }}>{getInitials(userName)}</div>
                            <div><div style={{ fontSize: 13, fontWeight: 600 }}>{userName}</div><div style={{ fontSize: 11, color: '#94a3b8' }}>Administrator</div></div>
                        </div>
                        <button onClick={() => { (window as any).firebase?.auth().signOut(); localStorage.clear(); window.location.href = '/login'; }} className="sidebar-link" style={{ color: '#ef4444', fontSize: 13 }}><LogoutIcon /> Sign Out</button>
                    </div>
                </aside>

                {/* MAIN */}
                <main style={{ flex: 1, marginLeft: 250, padding: '24px 32px' }}>
                    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                        <div>
                            <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 2 }}>
                                {activeTab === 'dashboard' ? 'Dashboard' : activeTab === 'orders' ? 'Order Management' : 'Settings'}
                            </h1>
                            <p style={{ color: '#94a3b8', fontSize: 14 }}>
                                {activeTab === 'dashboard' ? `Welcome back, ${userName}` : activeTab === 'orders' ? `${orders.length} total orders` : 'Manage access and data'}
                            </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ background: '#f1f5f9', padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#64748b', fontVariantNumeric: 'tabular-nums' }}>{currentTime}</span>
                            <button onClick={handleRefresh} className="btn btn-primary" style={{ fontSize: 13 }}><RefreshIcon /> Refresh</button>
                        </div>
                    </header>

                    {/* DASHBOARD */}
                    {activeTab === 'dashboard' && (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                                {[
                                    { label: 'Total Revenue', value: stats ? `₹${stats.todayRevenue.toLocaleString('en-IN')}` : '—', accent: '#10b981', sub: stats?.todayOrders ? `from ${stats.todayOrders} orders` : '' },
                                    { label: 'Active Orders', value: stats?.pending ?? '—', accent: '#f59e0b', sub: `${orders.length} total` },
                                    { label: 'In Progress', value: pendingCount + outCount, accent: '#6366f1', sub: outCount > 0 ? `${outCount} in transit` : 'none in transit' },
                                    { label: 'Delivered', value: stats?.todayDelivered ?? '—', accent: '#00C9A7', sub: deliveredCount > 0 ? `${Math.round((deliveredCount / Math.max(orders.length, 1)) * 100)}% completion` : '0% completion' },
                                ].map((s, i) => (
                                    <div key={i} className="stat-card">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                            <div style={{ width: 40, height: 40, borderRadius: 10, background: s.accent + '12', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.accent }} />
                                            </div>
                                            {s.sub && <span style={{ fontSize: 11, fontWeight: 500, color: '#94a3b8' }}>{s.sub}</span>}
                                        </div>
                                        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{s.label}</div>
                                        <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em' }}>{s.value}</div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: 16 }}>
                                <div className="card">
                                    <div className="card-header">
                                        <h2 style={{ fontSize: 15, fontWeight: 700 }}>Recent Orders</h2>
                                        <button onClick={() => setActiveTab('orders')} className="btn btn-outline" style={{ fontSize: 12, padding: '5px 12px' }}>View All</button>
                                    </div>
                                    {loading ? <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}><div style={{ width: 28, height: 28, border: '3px solid #e2e8f0', borderTopColor: '#00C9A7', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 10px' }} />Loading...</div>
                                        : orders.length === 0 ? <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8', fontSize: 14 }}>No orders yet</div>
                                            : (
                                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                    <thead><tr>{['Order', 'Customer', 'Items', 'Amount', 'Payment', 'Status'].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
                                                    <tbody>
                                                        {orders.slice(0, 5).map(o => {
                                                            const sb = SB[o.orderStatus] || SB['Placed'];
                                                            const pb = PB[o.paymentStatus] || PB['pending'];
                                                            const name = o.customer?.name || o.userEmail?.split('@')[0] || 'Customer';
                                                            return (
                                                                <tr key={o._id} className="table-row" style={{ borderBottom: '1px solid #f8fafc' }}>
                                                                    <td className="td"><span style={{ fontWeight: 700, color: '#00C9A7', fontSize: 13 }}>#{o.orderId}</span></td>
                                                                    <td className="td">
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                            <div style={{ width: 30, height: 30, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#475569', flexShrink: 0 }}>{getInitials(name)}</div>
                                                                            <span style={{ fontWeight: 500, fontSize: 13 }}>{name}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="td" style={{ color: '#64748b', fontSize: 12 }}>{o.items.map(i => `${i.quantity}x ${i.name}`).join(', ').substring(0, 30)}</td>
                                                                    <td className="td" style={{ fontWeight: 700 }}>₹{o.totalAmount.toLocaleString('en-IN')}</td>
                                                                    <td className="td">
                                                                        <span className="pill" style={{ background: pb.bg, color: pb.c }}>{pb.label}</span>
                                                                        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{payMethodLabels[o.paymentMethod] || o.paymentMethod}</div>
                                                                    </td>
                                                                    <td className="td"><span className="pill" style={{ background: sb.bg, color: sb.c }}><span className="dot" style={{ background: sb.dot }} />{o.orderStatus}</span></td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            )}
                                </div>

                                <div className="card" style={{ padding: 20 }}>
                                    <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 18 }}>Delivery Overview</h2>
                                    {[
                                        { label: 'Out for Delivery', count: outCount, color: '#F97316' },
                                        { label: 'Delivered', count: deliveredCount, color: '#10B981' },
                                        { label: 'Pending', count: pendingCount, color: '#6366F1' },
                                        { label: 'Cancelled', count: cancelledCount, color: '#EF4444' },
                                    ].map((item, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < 3 ? '1px solid #f1f5f9' : 'none' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                                                <span style={{ fontSize: 14, color: '#475569' }}>{item.label}</span>
                                            </div>
                                            <span style={{ fontSize: 18, fontWeight: 800 }}>{item.count}</span>
                                        </div>
                                    ))}
                                    <div style={{ marginTop: 16, background: '#f0fdfa', borderRadius: 10, padding: 16, textAlign: 'center' }}>
                                        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>Total Orders</div>
                                        <div style={{ fontSize: 32, fontWeight: 800, color: '#00C9A7' }}>{orders.length}</div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* ORDERS */}
                    {activeTab === 'orders' && (
                        <div className="card">
                            <div className="card-header" style={{ flexWrap: 'wrap', gap: 10 }}>
                                <h2 style={{ fontSize: 15, fontWeight: 700 }}>All Orders</h2>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="sel"><option value="all">All Statuses</option>{STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select>
                                    <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)} className="sel" style={{ minWidth: 90 }}><option value="all">All Payments</option>{['paid', 'pending', 'failed'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}</select>
                                    <span style={{ fontSize: 13, color: '#94a3b8' }}>{orders.length} result{orders.length !== 1 ? 's' : ''}</span>
                                </div>
                            </div>
                            {loading ? <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}><div style={{ width: 28, height: 28, border: '3px solid #e2e8f0', borderTopColor: '#00C9A7', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 10px' }} />Loading...</div>
                                : orders.length === 0 ? <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>No orders found</div>
                                    : (
                                        <div style={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                <thead><tr style={{ background: '#fafbfc' }}>{['Order ID', 'Customer', 'Items', 'Total', 'Payment', 'Status', 'Delivery Partner', 'Date', ''].map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
                                                <tbody>
                                                    {orders.map(o => {
                                                        const sb = SB[o.orderStatus] || SB['Placed'];
                                                        const pb = PB[o.paymentStatus] || PB['pending'];
                                                        const name = o.customer?.name || o.userEmail?.split('@')[0] || 'Customer';
                                                        const isExp = expandedOrder === o._id;
                                                        const dp = deliveryUsers.find(u => u.id === o.deliveryPersonId);
                                                        return (
                                                            <React.Fragment key={o._id}>
                                                                <tr className="table-row" style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }} onClick={() => setExpandedOrder(isExp ? null : o._id)}>
                                                                    <td className="td"><span style={{ fontWeight: 700, color: '#00C9A7' }}>#{o.orderId}</span></td>
                                                                    <td className="td">
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                            <div style={{ width: 30, height: 30, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#475569' }}>{getInitials(name)}</div>
                                                                            <div><div style={{ fontWeight: 600, fontSize: 13 }}>{name}</div>{o.customer?.phone && <div style={{ fontSize: 11, color: '#94a3b8' }}>{o.customer.phone}</div>}</div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="td" style={{ color: '#64748b', fontSize: 12, maxWidth: 150 }}>{o.items.map((it, idx) => <div key={idx}>{it.quantity}x {it.name}</div>)}</td>
                                                                    <td className="td" style={{ fontWeight: 700, fontSize: 14 }}>₹{o.totalAmount.toLocaleString('en-IN')}</td>
                                                                    <td className="td">
                                                                        <span className="pill" style={{ background: pb.bg, color: pb.c }}>{pb.label}</span>
                                                                        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{payMethodLabels[o.paymentMethod] || o.paymentMethod}</div>
                                                                    </td>
                                                                    <td className="td"><span className="pill" style={{ background: sb.bg, color: sb.c }}><span className="dot" style={{ background: sb.dot }} />{o.orderStatus}</span></td>
                                                                    <td className="td" onClick={e => e.stopPropagation()}>
                                                                        {o.deliveryPersonId && dp ? (
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                                <div style={{ width: 24, height: 24, borderRadius: 6, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#047857' }}>{getInitials(dp.name)}</div>
                                                                                <span style={{ fontSize: 12, fontWeight: 600, color: '#047857' }}>{dp.name}</span>
                                                                            </div>
                                                                        ) : (
                                                                            <select className="sel" style={{ minWidth: 120, fontSize: 12, padding: '5px 26px 5px 10px' }} disabled={assigningId === o._id} defaultValue="" onChange={e => assignDelivery(o._id, e.target.value)}>
                                                                                <option value="" disabled>Assign partner</option>
                                                                                {deliveryUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                                                                {deliveryUsers.length === 0 && <option disabled>No partners</option>}
                                                                            </select>
                                                                        )}
                                                                    </td>
                                                                    <td className="td">
                                                                        <div style={{ fontSize: 12, fontWeight: 500 }}>{new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                                                                        <div style={{ fontSize: 10, color: '#94a3b8' }}>{new Date(o.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                                                                    </td>
                                                                    <td className="td" onClick={e => e.stopPropagation()}>
                                                                        <select className="sel" style={{ minWidth: 130, fontSize: 12, padding: '5px 26px 5px 10px', fontWeight: 600, color: sb.c, background: `${sb.bg} url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E") right 10px center no-repeat`, borderColor: sb.dot + '30' }}
                                                                            disabled={updatingId === o._id || ['Delivered', 'Cancelled'].includes(o.orderStatus)}
                                                                            value={o.orderStatus} onChange={e => updateOrderStatus(o._id, e.target.value)}>
                                                                            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                                                        </select>
                                                                    </td>
                                                                </tr>
                                                                {isExp && (
                                                                    <tr><td colSpan={9} style={{ padding: 0 }}><div style={{ background: '#fafbfc', padding: '14px 22px', borderBottom: '1px solid #e2e8f0' }}>
                                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, fontSize: 13 }}>
                                                                            <div><div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Delivery Address</div><p>{o.customer?.address || 'Not provided'}</p></div>
                                                                            <div><div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Email</div><p>{o.userEmail}</p></div>
                                                                            <div><div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Placed At</div><p>{new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p></div>
                                                                        </div>
                                                                    </div></td></tr>
                                                                )}
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                        </div>
                    )}

                    {/* SETTINGS */}
                    {activeTab === 'settings' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div className="card">
                                <div className="card-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                                    <h2 style={{ fontSize: 15, fontWeight: 700 }}>Role Management</h2>
                                    <p style={{ fontSize: 13, color: '#94a3b8' }}>Grant admin or delivery access by email</p>
                                </div>
                                <div style={{ padding: 20 }}>
                                    <form onSubmit={handleAddRole} style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                                        <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="email@example.com" required className="input" style={{ flex: 1 }} />
                                        <select value={newRole} onChange={e => setNewRole(e.target.value as any)} className="sel" style={{ minWidth: 100 }}><option value="admin">Admin</option><option value="delivery">Delivery</option></select>
                                        <button type="submit" disabled={settingRole} className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>{settingRole ? '...' : 'Add Role'}</button>
                                    </form>
                                    {roleUsers.length === 0 ? <div style={{ textAlign: 'center', padding: 28, color: '#94a3b8', fontSize: 14 }}>No roles configured</div>
                                        : <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            {roleUsers.map(u => (
                                                <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, border: '1px solid #f1f5f9', background: '#fafbfc' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <div style={{ width: 32, height: 32, borderRadius: 8, background: u.role === 'admin' ? '#F5F3FF' : '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: u.role === 'admin' ? '#7C3AED' : '#047857' }}>{getInitials(u.name)}</div>
                                                        <div><div style={{ fontSize: 13, fontWeight: 600 }}>{u.email}</div><span className="chip" style={{ background: u.role === 'admin' ? '#F5F3FF' : '#ECFDF5', color: u.role === 'admin' ? '#7C3AED' : '#047857', marginTop: 2 }}>{u.role}</span></div>
                                                    </div>
                                                    <button onClick={() => handleRemoveRole(u.email)} className="btn btn-outline" style={{ color: '#ef4444', borderColor: '#fecaca', fontSize: 12, padding: '5px 12px' }}>Remove</button>
                                                </div>
                                            ))}
                                        </div>}
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div className="card" style={{ border: '1px solid #fecaca' }}>
                                    <div className="card-header" style={{ background: '#FEF2F2', borderBottom: '1px solid #fecaca', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                                        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#DC2626' }}>Danger Zone</h2>
                                        <p style={{ fontSize: 13, color: '#B91C1C' }}>Irreversible operations</p>
                                    </div>
                                    <div style={{ padding: 20 }}>
                                        <div style={{ background: '#FEF2F2', borderRadius: 12, padding: 18, border: '1px solid #FECACA' }}>
                                            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#991B1B', marginBottom: 4 }}>Clear All Orders</h3>
                                            <p style={{ fontSize: 13, color: '#B91C1C', marginBottom: 14, lineHeight: 1.5 }}>Permanently delete all {orders.length} orders. This cannot be reversed.</p>
                                            <button onClick={handleClearOrders} disabled={clearingOrders} className="btn btn-danger-fill">{clearingOrders ? 'Clearing...' : 'Clear All Orders'}</button>
                                        </div>
                                    </div>
                                </div>
                                <div className="card" style={{ padding: 20 }}>
                                    <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Quick Stats</h2>
                                    {[
                                        { label: 'Total Orders', value: orders.length },
                                        { label: 'Admin Users', value: roleUsers.filter(u => u.role === 'admin').length },
                                        { label: 'Delivery Partners', value: roleUsers.filter(u => u.role === 'delivery').length },
                                        { label: 'Revenue Today', value: stats ? `₹${stats.todayRevenue.toLocaleString('en-IN')}` : '—' },
                                    ].map((item, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 3 ? '1px solid #f1f5f9' : 'none', fontSize: 14 }}>
                                            <span style={{ color: '#64748b' }}>{item.label}</span>
                                            <span style={{ fontWeight: 700 }}>{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </>
    );
}

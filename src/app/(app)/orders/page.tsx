'use client';
import { useState, useEffect } from 'react';
import Script from 'next/script';

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
  paymentMethod?: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initAuth = () => {
      if (typeof window !== 'undefined' && (window as any).firebase) {
        const fb = (window as any).firebase;
        if (fb.auth) {
          unsubscribe = fb.auth().onAuthStateChanged(async (user: any) => {
            if (user) {
              setAuthChecked(true);
              try {
                const token = await user.getIdToken();
                const response = await fetch('/api/orders/my', {
                  headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Failed to fetch orders');
                const data = await response.json();
                setOrders(data.orders || []);
              } catch (err) {
                console.error('Error loading orders:', err);
                setError('Unable to load orders. Please check your connection.');
              } finally {
                setLoading(false);
              }
            } else {
              window.location.href = '/login?redirect=/orders';
            }
          });
          return true;
        }
      }
      return false;
    };

    if (!initAuth()) {
      const interval = setInterval(() => { if (initAuth()) clearInterval(interval); }, 200);
      const timeout = setTimeout(() => {
        clearInterval(interval);
        if (!unsubscribe) window.location.href = '/login?redirect=/orders';
      }, 5000);
      return () => { clearInterval(interval); clearTimeout(timeout); if (unsubscribe) unsubscribe(); };
    }
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  const statusConfig: Record<string, { bg: string; color: string; icon: string }> = {
    'processing': { bg: '#EFF6FF', color: '#1D4ED8', icon: '⟳' },
    'placed': { bg: '#FEF3C7', color: '#92400E', icon: '✓' },
    'preparing': { bg: '#DBEAFE', color: '#1E40AF', icon: '🍳' },
    'out for delivery': { bg: '#FCE7F3', color: '#9D174D', icon: '→' },
    'delivered': { bg: '#D1FAE5', color: '#065F46', icon: '✓' },
    'cancelled': { bg: '#FEE2E2', color: '#991B1B', icon: '✕' },
  };

  const getStatusStyle = (status: string) => {
    const s = status.toLowerCase();
    return statusConfig[s] || { bg: '#F3F4F6', color: '#374151', icon: '•' };
  };

  const getPaymentLabel = (method?: string) => {
    if (!method) return 'N/A';
    const map: Record<string, string> = {
      'cod': 'Cash on Delivery', 'razorpay': 'Online', 'upi': 'UPI',
      'gpay': 'Google Pay', 'phonepe': 'PhonePe'
    };
    return map[method.toLowerCase()] || method;
  };

  return (
    <>
      <Script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js" strategy="beforeInteractive" />
      <Script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js" strategy="beforeInteractive" />

      <style>{`
                .orders-page {
                    min-height: 100vh;
                    background: #0a0a0a;
                    color: #f1f5f9;
                    font-family: 'Inter', -apple-system, sans-serif;
                }
                .orders-nav {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 20px 24px;
                    background: rgba(15,15,15,0.95);
                    border-bottom: 1px solid rgba(255,255,255,0.06);
                    position: sticky;
                    top: 0;
                    z-index: 100;
                    backdrop-filter: blur(12px);
                }
                .orders-nav a {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 40px;
                    height: 40px;
                    border-radius: 12px;
                    background: rgba(255,255,255,0.06);
                    color: #94a3b8;
                    text-decoration: none;
                    transition: all 0.2s;
                }
                .orders-nav a:hover { background: rgba(255,255,255,0.1); color: #fff; }
                .orders-nav h1 {
                    font-size: 20px;
                    font-weight: 700;
                    color: #f1f5f9;
                    margin: 0;
                }
                .orders-container {
                    max-width: 780px;
                    margin: 0 auto;
                    padding: 24px 16px 60px;
                }
                .orders-count {
                    font-size: 14px;
                    color: #64748b;
                    margin-bottom: 20px;
                    padding: 0 4px;
                }
                .order-card {
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 16px;
                    margin-bottom: 16px;
                    overflow: hidden;
                    transition: border-color 0.2s;
                }
                .order-card:hover { border-color: rgba(0,201,167,0.3); }
                .order-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    padding: 20px 20px 0;
                    gap: 12px;
                    flex-wrap: wrap;
                }
                .order-id {
                    font-size: 13px;
                    color: #64748b;
                    font-family: 'JetBrains Mono', monospace;
                    letter-spacing: 0.02em;
                    word-break: break-all;
                }
                .order-date {
                    font-size: 13px;
                    color: #94a3b8;
                    margin-top: 4px;
                }
                .status-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 5px 14px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: capitalize;
                    white-space: nowrap;
                    flex-shrink: 0;
                }
                .order-items-list {
                    padding: 16px 20px;
                    list-style: none;
                    margin: 0;
                }
                .order-items-list li {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px 0;
                    border-bottom: 1px solid rgba(255,255,255,0.04);
                    font-size: 14px;
                }
                .order-items-list li:last-child { border-bottom: none; }
                .item-name { color: #e2e8f0; font-weight: 500; }
                .item-qty { color: #64748b; font-size: 12px; margin-left: 6px; }
                .item-price { color: #00C9A7; font-weight: 600; }
                .order-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 14px 20px;
                    background: rgba(255,255,255,0.02);
                    border-top: 1px solid rgba(255,255,255,0.06);
                    flex-wrap: wrap;
                    gap: 8px;
                }
                .payment-info {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 13px;
                }
                .payment-method { color: #94a3b8; }
                .payment-status {
                    padding: 2px 10px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 600;
                    text-transform: uppercase;
                }
                .payment-paid { background: rgba(0,201,167,0.15); color: #00C9A7; }
                .payment-pending { background: rgba(251,191,36,0.15); color: #FBBF24; }
                .payment-failed { background: rgba(239,68,68,0.15); color: #EF4444; }
                .order-total-amount {
                    font-size: 18px;
                    font-weight: 700;
                    color: #f1f5f9;
                }
                .order-total-amount span { color: #00C9A7; }
                .empty-orders {
                    text-align: center;
                    padding: 80px 20px;
                }
                .empty-icon {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.04);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 24px;
                }
                .empty-orders h2 {
                    font-size: 20px;
                    font-weight: 700;
                    color: #e2e8f0;
                    margin-bottom: 8px;
                }
                .empty-orders p {
                    color: #64748b;
                    font-size: 15px;
                    margin-bottom: 28px;
                    line-height: 1.5;
                }
                .browse-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 14px 32px;
                    border-radius: 12px;
                    background: #00C9A7;
                    color: #fff;
                    font-weight: 700;
                    font-size: 15px;
                    text-decoration: none;
                    transition: all 0.2s;
                }
                .browse-btn:hover { background: #00b396; transform: translateY(-1px); }
                .loading-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 80px 20px;
                    gap: 16px;
                }
                .spinner {
                    width: 36px;
                    height: 36px;
                    border: 3px solid rgba(255,255,255,0.08);
                    border-top-color: #00C9A7;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
                .error-state {
                    text-align: center;
                    padding: 60px 20px;
                }
                .error-state h2 { color: #EF4444; font-size: 18px; margin-bottom: 8px; }
                .error-state p { color: #94a3b8; margin-bottom: 20px; }
                .retry-btn {
                    padding: 12px 28px;
                    border-radius: 12px;
                    background: rgba(255,255,255,0.06);
                    color: #f1f5f9;
                    border: 1px solid rgba(255,255,255,0.1);
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 14px;
                    text-decoration: none;
                    display: inline-block;
                }
                .retry-btn:hover { background: rgba(255,255,255,0.1); }

                @media (max-width: 640px) {
                    .orders-nav { padding: 16px; }
                    .orders-nav h1 { font-size: 18px; }
                    .orders-container { padding: 16px 12px 40px; }
                    .order-top { padding: 16px 16px 0; }
                    .order-items-list { padding: 12px 16px; }
                    .order-footer { padding: 12px 16px; }
                    .order-total-amount { font-size: 16px; }
                    .status-badge { font-size: 11px; padding: 4px 10px; }
                }
            `}</style>

      <div className="orders-page">
        <div className="orders-nav">
          <a href="/">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </a>
          <h1>My Orders</h1>
        </div>

        <div className="orders-container">
          {(!authChecked || loading) ? (
            <div className="loading-state">
              <div className="spinner" />
              <span style={{ color: '#64748b', fontSize: 14 }}>Loading your orders...</span>
            </div>
          ) : error ? (
            <div className="error-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.5" style={{ marginBottom: 16 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <h2>Something went wrong</h2>
              <p>{error}</p>
              <a href="/orders" className="retry-btn">Try Again</a>
            </div>
          ) : orders.length === 0 ? (
            <div className="empty-orders">
              <div className="empty-icon">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 01-8 0" />
                </svg>
              </div>
              <h2>No orders yet</h2>
              <p>Browse our meal plans and place your first order to get started!</p>
              <a href="/#plans" className="browse-btn">
                Browse Plans
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          ) : (
            <>
              <div className="orders-count">{orders.length} order{orders.length !== 1 ? 's' : ''}</div>
              {orders.map(order => {
                const ss = getStatusStyle(order.status);
                return (
                  <div className="order-card" key={order.orderId}>
                    <div className="order-top">
                      <div>
                        <div className="order-id">#{order.orderId.substring(0, 12)}</div>
                        <div className="order-date">
                          {new Date(order.timestamp).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </div>
                      </div>
                      <span className="status-badge" style={{ background: ss.bg, color: ss.color }}>
                        {ss.icon} {order.status}
                      </span>
                    </div>

                    <ul className="order-items-list">
                      {order.items.map((item, i) => (
                        <li key={i}>
                          <span>
                            <span className="item-name">{item.planName || 'Item'}</span>
                            <span className="item-qty">× {item.quantity || 1}</span>
                          </span>
                          <span className="item-price">
                            ₹{((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className="order-footer">
                      <div className="payment-info">
                        <span className="payment-method">{getPaymentLabel(order.paymentMethod)}</span>
                        <span className={`payment-status ${order.paymentStatus === 'paid' ? 'payment-paid' :
                            order.paymentStatus === 'failed' ? 'payment-failed' : 'payment-pending'
                          }`}>
                          {order.paymentStatus || 'pending'}
                        </span>
                      </div>
                      <div className="order-total-amount">
                        <span>₹{(order.totalPrice || 0).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </>
  );
}

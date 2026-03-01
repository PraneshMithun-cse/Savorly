'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';

export default function CartPage() {
    const router = useRouter();

    // Auth State
    const [currentUserUid, setCurrentUserUid] = useState<string | null>(null);
    const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
    const [userName, setUserName] = useState<string>('');
    const [authChecked, setAuthChecked] = useState(false);

    // Cart State
    const [cart, setCart] = useState<any[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Coupon State
    const COUPONS: Record<string, { discount: number; type: 'percent' | 'flat'; description: string }> = {
        'SAVE10': { discount: 10, type: 'percent', description: '10% off' },
        'SAVE20': { discount: 20, type: 'percent', description: '20% off' },
        'FLAT100': { discount: 100, type: 'flat', description: '₹100 off' },
        'WELCOME': { discount: 15, type: 'percent', description: '15% off' }
    };
    const [couponInput, setCouponInput] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
    const [couponMessage, setCouponMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    // Address State
    const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string | number | null>(null);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [isSavingAddress, setIsSavingAddress] = useState(false);

    // New Address Form State
    const [addrForm, setAddrForm] = useState({
        label: 'Home',
        name: '',
        phone: '',
        house: '',
        apartment: '',
        street: '',
        road: '',
        pincode: '',
        city: '',
        state: 'Tamil Nadu',
        landmark: ''
    });

    // Payment State
    const [selectedPayment, setSelectedPayment] = useState('cod');
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    // Order Success Overlay
    const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
    const [orderId, setOrderId] = useState('');
    const orderPlacedRef = useRef(false);

    // Load Cart from localStorage on mount
    useEffect(() => {
        const localCart = JSON.parse(localStorage.getItem('savourlyCart') || '[]');
        setCart(localCart);

        const localSelectedLocation = JSON.parse(localStorage.getItem('savourlySelectedLocation') || 'null');
        if (localSelectedLocation) {
            setSelectedAddressId(localSelectedLocation.id);
        }

        setIsLoaded(true);
    }, []);

    // Firebase Auth Listener + Auth Guard
    useEffect(() => {
        let unsubscribe: (() => void) | undefined;
        const initAuth = () => {
            if (typeof window !== 'undefined' && (window as any).firebase) {
                const fb = (window as any).firebase;
                if (fb.auth) {
                    unsubscribe = fb.auth().onAuthStateChanged(async (user: any) => {
                        if (user) {
                            setCurrentUserUid(user.uid);
                            setCurrentUserEmail(user.email);
                            setUserName(user.displayName || '');
                            setAddrForm(prev => ({ ...prev, name: user.displayName || '' }));
                            setAuthChecked(true);
                            fetchSavedAddresses(user.uid);
                        } else {
                            // Not authenticated — redirect to login (skip if order was just placed)
                            if (!orderPlacedRef.current) {
                                window.location.href = '/login?redirect=/cart';
                            }
                        }
                    });
                    return true;
                }
            }
            return false;
        };

        // Firebase SDK may load async — poll for it
        if (!initAuth()) {
            const interval = setInterval(() => {
                if (initAuth()) clearInterval(interval);
            }, 200);
            // Timeout after 5 seconds — redirect to login if Firebase never loads
            const timeout = setTimeout(() => {
                clearInterval(interval);
                if (!unsubscribe && !orderPlacedRef.current) {
                    window.location.href = '/login?redirect=/cart';
                }
            }, 5000);
            return () => {
                clearInterval(interval);
                clearTimeout(timeout);
                if (unsubscribe) unsubscribe();
            };
        }

        return () => { if (unsubscribe) unsubscribe(); };
    }, []);

    const fetchSavedAddresses = async (uid: string) => {
        try {
            const res = await fetch(`/api/user/addresses?uid=${uid}`);
            if (res.ok) {
                const data = await res.json();
                const addrs = data.addresses || [];
                setSavedAddresses(addrs);
                localStorage.setItem('savourlyAddresses', JSON.stringify(addrs));

                if (addrs.length === 0) {
                    setShowAddressForm(true);
                } else {
                    let hasValidMatch = false;
                    const currentSelected = localStorage.getItem('savourlySelectedLocation');
                    if (currentSelected) {
                        try {
                            const parsed = JSON.parse(currentSelected);
                            if (addrs.some((a: any) => a._id === parsed.id || a.id === parsed.id)) {
                                hasValidMatch = true;
                            } else {
                                const matchingStr = addrs.find((a: any) => {
                                    const l1 = [a.doorNo, a.apartment, a.street].filter(Boolean).join(', ');
                                    const l2 = [a.line1, a.city, a.pincode].filter(Boolean).join(', ');
                                    const p = [l1, l2, (a.landmark ? `(Near ${a.landmark})` : '')].filter(Boolean).join(', ');
                                    return p === parsed.full || a.label === parsed.display;
                                });
                                if (matchingStr) {
                                    hasValidMatch = true;
                                    const id = matchingStr._id || matchingStr.id;
                                    setSelectedAddressId(id);
                                    parsed.id = id;
                                    localStorage.setItem('savourlySelectedLocation', JSON.stringify(parsed));
                                }
                            }
                        } catch (e) { }
                    }

                    if (!hasValidMatch) {
                        const latest = addrs[addrs.length - 1]; // select the newest
                        const id = latest._id || latest.id;
                        setSelectedAddressId(id);
                        const line1 = [latest.doorNo, latest.apartment, latest.street].filter(Boolean).join(', ');
                        const line2 = [latest.line1, latest.city, latest.pincode].filter(Boolean).join(', ');
                        const parts = [line1, line2, latest.landmark ? `(Near ${latest.landmark})` : ''].filter(Boolean);
                        localStorage.setItem('savourlySelectedLocation', JSON.stringify({
                            type: 'saved', id, display: latest.label, full: parts.join(', ')
                        }));
                    }
                }
            }
        } catch (e) {
            console.error("Failed to fetch address:", e);
        }
    };

    // Cart Operations
    const saveCart = (newCart: any[]) => {
        setCart(newCart);
        localStorage.setItem('savourlyCart', JSON.stringify(newCart));
    };

    const updateQuantity = (index: number, change: number) => {
        const newCart = [...cart];
        if (!newCart[index].quantity) newCart[index].quantity = 1;
        newCart[index].quantity += change;

        if (newCart[index].quantity <= 0) {
            removeItem(index);
            return;
        }
        saveCart(newCart);
    };

    const removeItem = (index: number) => {
        const newCart = [...cart];
        newCart.splice(index, 1);
        saveCart(newCart);
        showToast('Item removed from cart');
    };

    // Totals Calculations
    const subtotal = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    let discount = 0;
    if (appliedCoupon && COUPONS[appliedCoupon]) {
        const c = COUPONS[appliedCoupon];
        discount = c.type === 'percent' ? Math.round(subtotal * c.discount / 100) : c.discount;
    }
    const total = subtotal - discount;

    // Coupon Operations
    const applyCoupon = () => {
        const code = couponInput.trim().toUpperCase();
        if (!code) {
            setCouponMessage({ text: 'Please enter a coupon code', type: 'error' });
            return;
        }
        if (COUPONS[code]) {
            setAppliedCoupon(code);
            setCouponInput('');
            setCouponMessage({ text: 'Coupon applied successfully!', type: 'success' });
            setTimeout(() => setCouponMessage(null), 3000);
        } else {
            setCouponMessage({ text: 'Invalid coupon code', type: 'error' });
            setTimeout(() => setCouponMessage(null), 3000);
        }
    };

    const removeCoupon = () => {
        setAppliedCoupon(null);
        setCouponMessage(null);
    };

    // Address Operations
    const handleAddressFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setAddrForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const setAddressLabel = (label: string) => {
        setAddrForm(prev => ({ ...prev, label }));
    };

    const saveAddress = async () => {
        // Basic validation
        if (!addrForm.name || !addrForm.phone || !addrForm.house || !addrForm.street || !addrForm.road || !addrForm.pincode || !addrForm.city) {
            showToast('Please fill all required address fields');
            return;
        }

        setIsSavingAddress(true);
        const newAddr = {
            id: Date.now(),
            label: addrForm.label,
            name: addrForm.name,
            doorNo: addrForm.house,
            apartment: addrForm.apartment,
            street: addrForm.street,
            line1: addrForm.road,
            line2: '',
            landmark: addrForm.landmark,
            city: addrForm.city,
            state: addrForm.state,
            pincode: addrForm.pincode,
            phone: addrForm.phone
        };

        if (currentUserUid) {
            try {
                const res = await fetch('/api/user/addresses', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ uid: currentUserUid, address: newAddr })
                });
                if (res.ok) {
                    localStorage.removeItem('savourlySelectedLocation'); // Force fetchSavedAddresses to pick DB version
                    await fetchSavedAddresses(currentUserUid);
                }
            } catch (e) {
                console.error("Failed to save to DB", e);
            }
        } else {
            const localAddresses = JSON.parse(localStorage.getItem('savourlyAddresses') || '[]');
            localAddresses.push(newAddr);
            localStorage.setItem('savourlyAddresses', JSON.stringify(localAddresses));
            setSavedAddresses(localAddresses);

            setSelectedAddressId(newAddr.id);
            const addressLine1 = [newAddr.doorNo, newAddr.apartment, newAddr.street].filter(Boolean).join(', ');
            const addressLine2 = [newAddr.line1, newAddr.city, newAddr.pincode].filter(Boolean).join(', ');
            const parts = [addressLine1, addressLine2, (newAddr.landmark ? `(Near ${newAddr.landmark})` : '')].filter(Boolean);

            localStorage.setItem('savourlySelectedLocation', JSON.stringify({
                type: 'saved',
                id: newAddr.id,
                display: newAddr.label,
                full: parts.join(', ')
            }));
        }

        setIsSavingAddress(false);
        setShowAddressForm(false);
    };

    const selectAddress = (addr: any) => {
        const id = addr._id || addr.id;
        setSelectedAddressId(id);

        const addressLine1 = [addr.doorNo, addr.apartment, addr.street].filter(Boolean).join(', ');
        const addressLine2 = [addr.line1, addr.city, addr.pincode].filter(Boolean).join(', ');
        const parts = [addressLine1, addressLine2, (addr.landmark ? `(Near ${addr.landmark})` : '')].filter(Boolean);

        localStorage.setItem('savourlySelectedLocation', JSON.stringify({
            type: 'saved',
            id: id,
            display: addr.label,
            full: parts.join(', ')
        }));
        setShowAddressForm(false);
    };

    const deleteAddress = async (id: string | number, e: React.MouseEvent) => {
        e.stopPropagation();

        // Optimistic UI update
        const previousAddresses = [...savedAddresses];
        const newAddresses = savedAddresses.filter(a => (a.id !== id && a._id !== id));
        setSavedAddresses(newAddresses);
        localStorage.setItem('savourlyAddresses', JSON.stringify(newAddresses));

        if (selectedAddressId === id) {
            if (newAddresses.length > 0) {
                selectAddress(newAddresses[0]);
            } else {
                setSelectedAddressId(null);
                localStorage.removeItem('savourlySelectedLocation');
            }
        }

        if (currentUserUid && typeof id === 'string' && id.length > 15) {
            try {
                const res = await fetch('/api/user/addresses', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ uid: currentUserUid, addressId: id })
                });
                if (res.ok) {
                    showToast('Address deleted');
                } else {
                    // Revert if failed
                    setSavedAddresses(previousAddresses);
                    showToast('Failed to delete address');
                }
            } catch (e) {
                console.error("Failed to delete from DB", e);
                setSavedAddresses(previousAddresses);
                showToast('Failed to delete address');
            }
        } else {
            showToast('Address deleted');
        }
    };

    const detectLocation = () => {
        showToast('Detecting location...');
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    let response;
                    try {
                        response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, { headers: { 'Accept-Language': 'en-US,en' } });
                    } catch (e) {
                        // Retry once: Some mobile browsers drop the first network request right after the geolocation prompt
                        await new Promise(r => setTimeout(r, 1000));
                        response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, { headers: { 'Accept-Language': 'en-US,en' } });
                    }
                    if (!response || !response.ok) throw new Error('Network response was not ok');

                    const data = await response.json();

                    setAddrForm(prev => ({
                        ...prev,
                        city: data.address?.city || data.address?.town || data.address?.village || prev.city,
                        state: data.address?.state || prev.state,
                        pincode: data.address?.postcode || prev.pincode,
                        road: data.address?.suburb || data.address?.neighbourhood || data.address?.road || prev.road,
                        street: data.address?.road || prev.street
                    }));
                    showToast('Location Detected');
                } catch (err: any) {
                    showToast('Failed to fetch address details: ' + (err.message || ''));
                }
            }, (error) => {
                // error.code = 1 (PERMISSION_DENIED), 2 (POSITION_UNAVAILABLE), 3 (TIMEOUT)
                if (error.code === 1) {
                    showToast('Location access denied. Please enable permissions.');
                } else if (error.code === 3) {
                    showToast('Location request timed out. Trying again...');
                    // Fallback retry could go here, but usually a second click suffices if we log it
                } else {
                    showToast('Unable to detect location. ' + error.message);
                }
                console.error("Geolocation error:", error);
            }, { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 });
        } else {
            showToast('Geolocation not supported by this browser');
        }
    };

    // Toast Utility
    const showToast = (message: string) => {
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
            background: #1f2937; color: white; padding: 12px 24px;
            border-radius: 8px; font-size: 14px; font-weight: 500;
            z-index: 10000; animation: slideUp 0.3s ease;
        `;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'slideDown 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    };

    // Checkout
    const generateInternalOrderId = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let id = 'ORD-';
        for (let i = 0; i < 8; i++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return id;
    };

    const getAuthToken = useCallback(async () => {
        if (typeof window === 'undefined') return '';
        const fb = (window as any).firebase;
        const user = fb?.auth?.().currentUser;
        if (!user) return '';
        try {
            return await user.getIdToken();
        } catch {
            return '';
        }
    }, []);

    const handleCheckout = async () => {
        if (cart.length === 0) {
            showToast('Your cart is empty!');
            return;
        }

        if (!selectedAddressId && savedAddresses.length > 0) {
            showToast('Please select a delivery address');
            return;
        } else if (savedAddresses.length === 0) {
            showToast('Please add a delivery address');
            setShowAddressForm(true);
            return;
        }

        const selectedAddr = savedAddresses.find(a => (a.id === selectedAddressId || a._id === selectedAddressId));
        if (!selectedAddr) {
            showToast('Selected address not found');
            return;
        }

        setIsCheckingOut(true);

        const addressLine1 = [selectedAddr.doorNo, selectedAddr.apartment, selectedAddr.street].filter(Boolean).join(', ');
        const addressLine2 = [selectedAddr.line1, selectedAddr.city, selectedAddr.pincode].filter(Boolean).join(', ');
        const fullAddress = [addressLine1, addressLine2, (selectedAddr.landmark ? `(Near ${selectedAddr.landmark})` : '')].filter(Boolean).join(', ');

        const orderData = {
            items: cart.map(item => ({
                id: item.id || item._id,
                name: item.name,
                price: item.price,
                quantity: item.quantity || 1
            })),
            totalAmount: total,
            subtotal: subtotal,
            discount: discount,
            coupon: appliedCoupon,
            paymentMethod: selectedPayment,
            userId: currentUserUid || 'guest',
            userEmail: currentUserEmail || '',
            customer: {
                name: selectedAddr.name || userName || 'Guest',
                phone: selectedAddr.phone,
                address: fullAddress
            }
        };

        try {
            const token = await getAuthToken();
            if (!token) {
                showToast('Session expired. Please log in again.');
                setIsCheckingOut(false);
                window.location.href = '/login?redirect=/cart';
                return;
            }

            const createRes = await fetch('/api/orders/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(orderData)
            });

            if (!createRes.ok) {
                const errData = await createRes.json();
                throw new Error(errData.error || 'Order creation failed');
            }

            const apiResponse = await createRes.json();

            if (selectedPayment === 'cod') {
                const internalOrderId = apiResponse.id || generateInternalOrderId();
                const localOrder = {
                    ...orderData,
                    id: internalOrderId,
                    paymentId: 'cod_' + Date.now(),
                    payment: 'cod',
                    timestamp: new Date().toISOString()
                };

                // Add to local storage for guest tracking if needed
                const orders = JSON.parse(localStorage.getItem('savourlyOrders') || '[]');
                orders.push(localOrder);
                localStorage.setItem('savourlyOrders', JSON.stringify(orders));

                setCart([]);
                localStorage.removeItem('savourlyCart');
                setOrderId(internalOrderId);
                setShowSuccessOverlay(true);
                orderPlacedRef.current = true;

                setTimeout(() => {
                    window.location.href = '/';
                }, 4000);
                return;
            }

            // Razorpay flow
            if (typeof window !== 'undefined' && (window as any).Razorpay) {
                const options = {
                    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_SDiRFPP28IeoVs',
                    amount: apiResponse.amount,
                    currency: apiResponse.currency,
                    name: 'Savourly',
                    description: 'Healthy Meal Plan Order',
                    image: '/assets/images/savourly-logo-new.png',
                    order_id: apiResponse.id,
                    prefill: {
                        name: selectedAddr.name || userName || 'Guest',
                        contact: selectedAddr.phone || '',
                        email: currentUserEmail || ''
                    },
                    notes: {
                        address: fullAddress
                    },
                    theme: { color: '#00C9A7' },
                    handler: async function (response: any) {
                        try {
                            const verifyToken = await getAuthToken();
                            if (!verifyToken) {
                                showToast('Session expired. Please log in again.');
                                setIsCheckingOut(false);
                                return;
                            }

                            const verifyRes = await fetch('/api/payment/verify', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${verifyToken}`
                                },
                                body: JSON.stringify({
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature,
                                    dbOrderId: apiResponse.dbOrderId
                                })
                            });

                            if (verifyRes.ok) {
                                setCart([]);
                                localStorage.removeItem('savourlyCart');
                                setOrderId(response.razorpay_order_id);
                                setShowSuccessOverlay(true);
                                orderPlacedRef.current = true;
                                setTimeout(() => { window.location.href = '/'; }, 4000);
                            } else {
                                showToast('Payment verification failed. Please contact support.');
                                setIsCheckingOut(false);
                            }
                        } catch (err) {
                            showToast('Payment verification failed. Please contact support.');
                            setIsCheckingOut(false);
                        }
                    },
                    modal: {
                        ondismiss: function () {
                            showToast('Payment cancelled');
                            setIsCheckingOut(false);
                        }
                    }
                };
                const rzp = new (window as any).Razorpay(options);
                rzp.on('payment.failed', function (response: any) {
                    showToast('Payment failed: ' + (response.error.description || 'Unknown error'));
                    setIsCheckingOut(false);
                });
                rzp.open();
            } else {
                showToast('Payment gateway not loaded. Please refresh.');
                setIsCheckingOut(false);
            }
        } catch (error: any) {
            console.error('Order creation failed:', error);
            showToast(error.message || 'Could not create order. Please try again.');
            setIsCheckingOut(false);
        }
    };

    // Show loading while checking auth
    if (!isLoaded || !authChecked) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f4f8' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, border: '4px solid #e0e0e0', borderTopColor: '#00C9A7', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                <p style={{ color: '#666', fontSize: 14 }}>Checking authentication...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
        </div>
    );

    return (
        <>
            <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
            <style>{`
                @keyframes slideUp { from { opacity: 0; transform: translateX(-50%) translateY(20px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
                @keyframes slideDown { from { opacity: 1; transform: translateX(-50%) translateY(0); } to { opacity: 0; transform: translateX(-50%) translateY(20px); } }
                @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
                @keyframes scaleIn { from { opacity: 0; transform: scale(0.8) } to { opacity: 1; transform: scale(1) } }
                @keyframes checkPop { from { transform: scale(0) rotate(-45deg) } to { transform: scale(1) rotate(0deg) } }
            `}</style>

            <nav className="navbar">
                <div className="nav-container">
                    <a href="/" className="logo"><img src="/assets/images/savourly-logo-new.png" alt="Savourly" className="logo-img" /></a>
                    <div className="nav-actions">
                        <a href="/" className="btn btn-outline">← Back to Shop</a>
                    </div>
                </div>
            </nav>

            <main className="cart-page">
                <div className="cart-container">
                    {cart.length > 0 ? (
                        <>
                            <div className="cart-header">
                                <h1 className="cart-title">Your Cart</h1>
                                <p className="cart-subtitle">{cart.length} item{cart.length > 1 ? 's' : ''} in your cart</p>
                            </div>

                            <div className="cart-content" style={{ display: 'grid' }}>
                                <div className="cart-items-section">
                                    <div className="cart-items-list">
                                        {cart.map((item, index) => (
                                            <div className="cart-item" key={index}>
                                                <img src={item.image} alt={item.name} className="cart-item-image" />
                                                <div className="cart-item-details">
                                                    <div className="cart-item-name">{item.name}</div>
                                                    <div className="cart-item-description">Fresh meals delivered weekly</div>
                                                    <div className="cart-item-price">₹{item.price.toLocaleString('en-IN')} <span>/week</span></div>
                                                </div>
                                                <div className="quantity-controls">
                                                    <button className="qty-btn" onClick={() => updateQuantity(index, -1)}>−</button>
                                                    <span className="qty-value">{item.quantity || 1}</span>
                                                    <button className="qty-btn" onClick={() => updateQuantity(index, 1)}>+</button>
                                                </div>
                                                <button className="remove-item-btn" onClick={() => removeItem(index)}>
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Delivery Address Section */}
                                    <div className="delivery-address-section">
                                        <h3 className="section-heading">Delivery Address</h3>

                                        <div className="saved-address-cards">
                                            {savedAddresses.map((addr) => {
                                                const docId = addr._id || addr.id;
                                                const isSelected = selectedAddressId === docId || selectedAddressId === addr.id || selectedAddressId === addr._id;
                                                let icon = '📍';
                                                if (addr.label === 'Home') icon = '🏠';
                                                if (addr.label === 'Work') icon = '🏢';

                                                // Home page sets line1/line2. Cart page sets doorNo/apartment/street/line1.
                                                // We must fallback so both types render correctly.
                                                const addressLine1 = [addr.doorNo, addr.apartment, addr.street || addr.line1].filter(Boolean).join(', ');
                                                const addressLine2 = [addr.line2, addr.city, addr.pincode].filter(Boolean).join(', ');

                                                return (
                                                    <div key={docId} className={`address-card ${isSelected ? 'selected' : ''}`} onClick={() => selectAddress(addr)}>
                                                        <div className="address-card-header">
                                                            <div className="address-label">{icon} {addr.label}</div>
                                                            <div className="address-actions-wrapper" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                                <button className="delete-address-btn" onClick={(e) => deleteAddress(docId, e)} title="Delete Address" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', marginRight: '4px' }}>
                                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                                                                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                                                    </svg>
                                                                </button>
                                                                {isSelected && <div className="address-check">✓</div>}
                                                            </div>
                                                        </div>
                                                        <div className="address-details" style={{ marginTop: '8px' }}>
                                                            <strong>{addressLine1}</strong><br />{addressLine2}
                                                        </div>
                                                        <div className="address-phone" style={{ marginTop: '4px', fontSize: '12px', color: '#6b7280' }}>
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px', verticalAlign: 'text-bottom' }}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.05 12.05 0 0 0 .57 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.05 12.05 0 0 0 2.81.57A2 2 0 0 1 22 16.92z" /></svg>
                                                            {addr.phone}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {!showAddressForm && (
                                            <button className="add-new-address-btn" type="button" onClick={() => setShowAddressForm(true)} style={{ display: 'flex' }}>
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                                                </svg>
                                                Add New Address
                                            </button>
                                        )}

                                        {showAddressForm && (
                                            <div className="inline-address-form" style={{ display: 'block' }}>
                                                <div className="address-form-header">
                                                    <h4>Add Delivery Address</h4>
                                                    <button type="button" className="use-location-btn" onClick={detectLocation}>
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <circle cx="12" cy="12" r="3" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
                                                        </svg>
                                                        Use My Location
                                                    </button>
                                                </div>
                                                <div className="address-form-grid">
                                                    <div className="form-field">
                                                        <label>Name *</label>
                                                        <input type="text" name="name" value={addrForm.name} onChange={handleAddressFormChange} placeholder="Your full name" required />
                                                    </div>
                                                    <div className="form-field">
                                                        <label>Contact Number *</label>
                                                        <input type="tel" name="phone" value={addrForm.phone} onChange={handleAddressFormChange} placeholder="+91 XXXXX XXXXX" required />
                                                    </div>
                                                    <div className="form-field">
                                                        <label>Door / Flat No. *</label>
                                                        <input type="text" name="house" value={addrForm.house} onChange={handleAddressFormChange} placeholder="e.g. 12A" required />
                                                    </div>
                                                    <div className="form-field">
                                                        <label>Apartment Name (Optional)</label>
                                                        <input type="text" name="apartment" value={addrForm.apartment} onChange={handleAddressFormChange} placeholder="e.g. Sunshine Apartments" />
                                                    </div>
                                                    <div className="form-field">
                                                        <label>Street Name *</label>
                                                        <input type="text" name="street" value={addrForm.street} onChange={handleAddressFormChange} placeholder="e.g. 4th Cross Street" required />
                                                    </div>
                                                    <div className="form-field">
                                                        <label>Area / Colony *</label>
                                                        <input type="text" name="road" value={addrForm.road} onChange={handleAddressFormChange} placeholder="e.g. Koramangala" required />
                                                    </div>
                                                    <div className="form-field">
                                                        <label>Pincode *</label>
                                                        <input type="text" name="pincode" value={addrForm.pincode} onChange={handleAddressFormChange} placeholder="e.g. 560001" maxLength={6} required />
                                                    </div>
                                                    <div className="form-field">
                                                        <label>City *</label>
                                                        <input type="text" name="city" value={addrForm.city} onChange={handleAddressFormChange} placeholder="e.g. Chennai" required />
                                                    </div>
                                                    <div className="form-field">
                                                        <label>State</label>
                                                        <select name="state" value={addrForm.state} onChange={handleAddressFormChange}>
                                                            <option value="Tamil Nadu">Tamil Nadu</option>
                                                            <option value="Karnataka">Karnataka</option>
                                                            <option value="Kerala">Kerala</option>
                                                            <option value="Andhra Pradesh">Andhra Pradesh</option>
                                                            <option value="Telangana">Telangana</option>
                                                            <option value="Maharashtra">Maharashtra</option>
                                                            <option value="Delhi">Delhi</option>
                                                            <option value="Other">Other</option>
                                                        </select>
                                                    </div>
                                                    <div className="form-field">
                                                        <label>Nearby Famous Place (optional)</label>
                                                        <input type="text" name="landmark" value={addrForm.landmark} onChange={handleAddressFormChange} placeholder="e.g. Near City Mall" />
                                                    </div>
                                                </div>
                                                <div className="address-label-picker">
                                                    <span>Save as</span>
                                                    <div className="label-options">
                                                        <button type="button" className={`label-btn ${addrForm.label === 'Home' ? 'active' : ''}`} onClick={() => setAddressLabel('Home')}>🏠 Home</button>
                                                        <button type="button" className={`label-btn ${addrForm.label === 'Work' ? 'active' : ''}`} onClick={() => setAddressLabel('Work')}>🏢 Work</button>
                                                        <button type="button" className={`label-btn ${addrForm.label === 'Other' ? 'active' : ''}`} onClick={() => setAddressLabel('Other')}>📍 Other</button>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                                    <button type="button" className="save-address-btn" onClick={saveAddress} disabled={isSavingAddress} style={{ flex: 1 }}>
                                                        {isSavingAddress ? 'Saving...' : 'Save Address and Continue'}
                                                    </button>
                                                    {savedAddresses.length > 0 && (
                                                        <button type="button" className="save-address-btn" onClick={() => setShowAddressForm(false)} style={{ background: 'transparent', color: '#111', border: '1px solid #ddd', flex: 0.3 }}>
                                                            Cancel
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Payment Methods Section */}
                                    <div className="payment-methods-section">
                                        <h3 className="section-heading">Payment Method</h3>
                                        <div className="payment-options">
                                            <label className={`payment-option ${selectedPayment === 'cod' ? 'active' : ''}`} onClick={() => setSelectedPayment('cod')}>
                                                <input type="radio" readOnly checked={selectedPayment === 'cod'} />
                                                <div className="payment-icon">💵</div>
                                                <div className="payment-info">
                                                    <strong>Cash on Delivery</strong>
                                                    <span>Pay when you receive</span>
                                                </div>
                                                <div className="payment-check">✓</div>
                                            </label>
                                            <label className={`payment-option ${selectedPayment === 'upi' ? 'active' : ''}`} onClick={() => setSelectedPayment('upi')}>
                                                <input type="radio" readOnly checked={selectedPayment === 'upi'} />
                                                <div className="payment-icon upi-icon">
                                                    <svg viewBox="0 0 24 24" width="28" height="28">
                                                        <rect width="24" height="24" rx="4" fill="#fff" />
                                                        <path fill="#097939" d="M4 8h4l6 8H8L4 8z" />
                                                        <path fill="#ED752E" d="M10 8h4l6 8h-4l-6-8z" />
                                                    </svg>
                                                </div>
                                                <div className="payment-info">
                                                    <strong>Online Payment</strong>
                                                    <span>Pay via UPI, Cards, NetBanking</span>
                                                </div>
                                                <div className="payment-check">✓</div>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Summary Section */}
                                <div className="order-summary-section">
                                    <div className="order-summary-card">
                                        <h2 className="summary-title">Order Summary</h2>

                                        {/* Coupon Section */}
                                        <div className="coupon-section">
                                            {!appliedCoupon ? (
                                                <div className="coupon-input-wrapper" style={{ display: 'flex' }}>
                                                    <input type="text" className="coupon-input" placeholder="Enter coupon code" value={couponInput} onChange={e => setCouponInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && applyCoupon()} />
                                                    <button className="coupon-apply-btn" onClick={applyCoupon}>Apply</button>
                                                </div>
                                            ) : (
                                                <div className="coupon-applied" style={{ display: "block" }}>
                                                    <span className="coupon-tag">
                                                        <span>{appliedCoupon} - {COUPONS[appliedCoupon].description}</span>
                                                        <button className="remove-coupon" onClick={removeCoupon}>×</button>
                                                    </span>
                                                </div>
                                            )}
                                            {couponMessage && (
                                                <p className={`coupon-message ${couponMessage.type}`}>{couponMessage.text}</p>
                                            )}
                                        </div>

                                        <div className="summary-divider"></div>

                                        <div className="summary-row">
                                            <span>Subtotal</span>
                                            <span>₹{subtotal.toLocaleString('en-IN')}</span>
                                        </div>
                                        {discount > 0 && (
                                            <div className="summary-row discount-row" style={{ display: "flex" }}>
                                                <span>Discount</span>
                                                <span className="discount-amount">-₹{discount.toLocaleString('en-IN')}</span>
                                            </div>
                                        )}
                                        <div className="summary-row">
                                            <span>Delivery</span>
                                            <span className="free-delivery">FREE</span>
                                        </div>

                                        <div className="summary-divider"></div>

                                        <div className="summary-row total-row">
                                            <span>Total</span>
                                            <span className="total-amount">₹{total.toLocaleString('en-IN')}</span>
                                        </div>
                                        <p className="per-week-text">per week</p>

                                        <button className={`checkout-btn-main ${selectedPayment !== 'cod' ? selectedPayment : ''}`} onClick={handleCheckout} disabled={isCheckingOut}>
                                            <span>{isCheckingOut ? 'Processing...' : (selectedPayment === 'cod' ? 'Proceed to Payment' : 'Pay with Online')}</span>
                                            {!isCheckingOut && (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                                </svg>
                                            )}
                                        </button>

                                        <div className="secure-checkout">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                                <path d="M7 11V7a5 5 0 0110 0v4" />
                                            </svg>
                                            <span>Secure Checkout</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="empty-cart" style={{ display: 'block' }}>
                            <div className="empty-cart-icon">
                                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <circle cx="9" cy="21" r="1" />
                                    <circle cx="20" cy="21" r="1" />
                                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                                </svg>
                            </div>
                            <h2>Your cart is empty</h2>
                            <p>Looks like you haven't added any meal plans yet.</p>
                            <a href="/#plans" className="btn btn-primary">Browse Meal Plans</a>
                        </div>
                    )}
                </div>
            </main>

            <footer className="cart-footer">
                <p>© 2024 Savourly. All rights reserved.</p>
            </footer>

            {showSuccessOverlay && (
                <div id="orderSuccessOverlay">
                    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.3s ease' }}>
                        <div style={{ background: '#fff', borderRadius: '24px', padding: '52px 44px', textAlign: 'center', maxWidth: '440px', width: '90%', boxShadow: '0 32px 80px rgba(0,0,0,0.3)', animation: 'scaleIn 0.45s cubic-bezier(0.34,1.56,0.64,1)' }}>
                            <div style={{ width: '88px', height: '88px', borderRadius: '50%', background: 'linear-gradient(135deg, #00C9A7, #00e6be)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', animation: 'checkPop 0.5s 0.35s both', boxShadow: '0 8px 24px rgba(0,201,167,0.4)' }}>
                                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>
                            <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#111', marginBottom: '10px', letterSpacing: '-0.5px' }}>
                                Order Placed! 🎉
                            </h2>
                            <p style={{ color: '#00C9A7', fontWeight: 700, fontSize: '17px', lineHeight: 1.5, background: 'linear-gradient(135deg, #f0fdf9, #e6fff9)', padding: '14px 20px', borderRadius: '12px', border: '1.5px solid rgba(0,201,167,0.25)', display: 'block', margin: '0 0 16px', letterSpacing: '0.01em' }}>
                                Order placed, journey of eating healthy begins 🥗
                            </p>
                            <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '6px' }}>
                                Order ID: <strong style={{ color: '#374151' }}>{orderId}</strong>
                            </p>
                            <p style={{ color: '#b0b7c3', fontSize: '12px', marginTop: '16px' }}>
                                Redirecting to home page in a few seconds...
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

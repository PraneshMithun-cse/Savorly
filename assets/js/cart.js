// ============================================
// CART PAGE JAVASCRIPT
// Handles cart operations, coupons, and checkout
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Get cart from localStorage
    let cart = JSON.parse(localStorage.getItem('savourlyCart')) || [];

    // Coupon codes
    const COUPONS = {
        'SAVE10': { discount: 10, type: 'percent', description: '10% off' },
        'SAVE20': { discount: 20, type: 'percent', description: '20% off' },
        'FLAT100': { discount: 100, type: 'flat', description: '₹100 off' },
        'WELCOME': { discount: 15, type: 'percent', description: '15% off' }
    };

    let appliedCoupon = null;

    // DOM Elements
    const cartItemsList = document.getElementById('cartItemsList');
    const cartSubtitle = document.getElementById('cartSubtitle');
    const emptyCart = document.getElementById('emptyCart');
    const cartContent = document.querySelector('.cart-content');
    const subtotalAmount = document.getElementById('subtotalAmount');
    const discountRow = document.getElementById('discountRow');
    const discountAmount = document.getElementById('discountAmount');
    const totalAmount = document.getElementById('totalAmount');
    const couponInput = document.getElementById('couponInput');
    const applyCouponBtn = document.getElementById('applyCouponBtn');
    const couponMessage = document.getElementById('couponMessage');
    const couponApplied = document.getElementById('couponApplied');
    const appliedCouponCode = document.getElementById('appliedCouponCode');
    const removeCouponBtn = document.getElementById('removeCouponBtn');
    const checkoutBtnMain = document.getElementById('checkoutBtnMain');

    // Initialize cart display
    renderCart();

    // ============================================
    // AUTO-FILL SAVED ADDRESS & USER INFO
    // ============================================
    // ============================================
    // SMART ADDRESS SECTION (Redesign)
    // ============================================

    // DOM Elements
    const savedAddressCards = document.getElementById('savedAddressCards');
    const addNewAddressBtn = document.getElementById('addNewAddressBtn');
    const inlineAddressForm = document.getElementById('inlineAddressForm');
    const saveCartAddressBtn = document.getElementById('saveCartAddressBtn');
    const cartUseLocationBtn = document.getElementById('cartUseLocationBtn');
    const cartLabelOptions = document.getElementById('cartLabelOptions');

    // State
    let cartSelectedLabel = 'Home';

    function renderDeliverySection() {
        const savedAddresses = JSON.parse(localStorage.getItem('savourlyAddresses')) || [];
        const selectedLocation = JSON.parse(localStorage.getItem('savourlySelectedLocation'));

        // 1. Render Saved Address Cards
        if (savedAddresses.length > 0) {
            savedAddressCards.innerHTML = '';

            savedAddresses.forEach(addr => {
                const card = document.createElement('div');
                card.className = `address-card ${selectedLocation?.id === addr.id ? 'selected' : ''}`;
                card.dataset.id = addr.id;

                // Icon based on label
                let icon = '📍';
                if (addr.label === 'Home') icon = '🏠';
                if (addr.label === 'Work') icon = '🏢';

                card.innerHTML = `
                    <div class="address-card-header">
                        <div class="address-label">${icon} ${addr.label}</div>
                        <div class="address-check">✓</div>
                    </div>
                    <div class="address-details">
                        <strong>${addr.doorNo ? addr.doorNo + ', ' : ''}${addr.line1}</strong><br>
                        ${addr.line2 ? addr.line2 + ', ' : ''}${addr.city} - ${addr.pincode}
                    </div>
                    <div class="address-phone">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.05 12.05 0 0 0 .57 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.05 12.05 0 0 0 2.81.57A2 2 0 0 1 22 16.92z"/></svg>
                        ${addr.phone}
                    </div>
                `;

                // Selection Logic
                card.addEventListener('click', () => {
                    selectAddress(addr);
                });

                // Auto-select logic if matches selectedLocation (or fallback to last used)
                if (selectedLocation?.id === addr.id) {
                    selectAddress(addr);
                }

                savedAddressCards.appendChild(card);
            });

            // If no address selected but we have saved ones, select the last one
            if (!selectedLocation && savedAddresses.length > 0) {
                selectAddress(savedAddresses[savedAddresses.length - 1]);
            }

            addNewAddressBtn.style.display = 'flex';
            inlineAddressForm.style.display = 'none';

        } else {
            // No saved addresses -> Show form immediately
            savedAddressCards.innerHTML = '';
            addNewAddressBtn.style.display = 'none';
            inlineAddressForm.style.display = 'block';

            // Auto-fill Name from Firebase if available
            if (typeof firebase !== 'undefined' && firebase.auth) {
                const user = firebase.auth().currentUser;
                if (user && document.getElementById('cartAddrName')) {
                    document.getElementById('cartAddrName').value = user.displayName || '';
                }
            }
        }
    }

    function selectAddress(addr) {
        // Visual selection
        document.querySelectorAll('.address-card').forEach(c => c.classList.remove('selected'));
        const card = document.querySelector(`.address-card[data-id="${addr.id}"]`);
        if (card) card.classList.add('selected');

        // Update Hidden Fields for Checkout
        document.getElementById('userName').value = document.getElementById('cartAddrName')?.value || 'Guest'; // Fallback
        document.getElementById('userPhone').value = addr.phone;

        // Construct full address string
        const parts = [
            addr.doorNo, addr.line1, addr.line2, addr.landmark, addr.city, addr.state, addr.pincode
        ].filter(Boolean);
        const uniqueParts = [...new Set(parts)]; // Simple dedupe
        document.getElementById('userAddress').value = uniqueParts.join(', ');

        // Persist selection
        localStorage.setItem('savourlySelectedLocation', JSON.stringify({
            type: 'saved',
            id: addr.id,
            display: addr.label,
            full: document.getElementById('userAddress').value
        }));

        // Hide form if open
        inlineAddressForm.style.display = 'none';
        addNewAddressBtn.style.display = 'flex';
    }

    // Toggle Add Address Form
    addNewAddressBtn?.addEventListener('click', () => {
        addNewAddressBtn.style.display = 'none';
        inlineAddressForm.style.display = 'block';
        // Auto-fill name again just in case
        if (typeof firebase !== 'undefined' && firebase.auth) {
            const user = firebase.auth().currentUser;
            if (user) document.getElementById('cartAddrName').value = user.displayName || '';
        }
    });

    // Label Selection
    cartLabelOptions?.addEventListener('click', (e) => {
        if (e.target.classList.contains('label-btn')) {
            document.querySelectorAll('#cartLabelOptions .label-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            cartSelectedLabel = e.target.dataset.label;
        }
    });

    // Use My Location (GPS)
    cartUseLocationBtn?.addEventListener('click', () => {
        const btn = cartUseLocationBtn;
        const originalText = btn.innerHTML;
        btn.innerHTML = 'Detecting...';

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await response.json();

                    document.getElementById('cartAddrCity').value = data.address.city || data.address.town || '';
                    document.getElementById('cartAddrState').value = data.address.state || 'Tamil Nadu';
                    document.getElementById('cartAddrPincode').value = data.address.postcode || '';
                    document.getElementById('cartAddrRoad').value = data.address.road || data.address.suburb || '';

                    btn.innerHTML = '✓ Location Detected';
                    setTimeout(() => { btn.innerHTML = originalText; }, 2000);
                } catch (err) {
                    btn.innerHTML = '❌ Failed';
                    setTimeout(() => { btn.innerHTML = originalText; }, 2000);
                }
            });
        }
    });

    // Save New Address
    saveCartAddressBtn?.addEventListener('click', () => {
        // Basic Validation
        const required = ['cartAddrName', 'cartAddrPhone', 'cartAddrHouse', 'cartAddrRoad', 'cartAddrPincode', 'cartAddrCity'];
        let isValid = true;
        required.forEach(id => {
            const el = document.getElementById(id);
            if (!el.value.trim()) {
                el.style.borderColor = 'red';
                isValid = false;
            } else {
                el.style.borderColor = '';
            }
        });

        if (!isValid) return;

        const newAddr = {
            id: Date.now(),
            label: cartSelectedLabel,
            doorNo: document.getElementById('cartAddrHouse').value,
            line1: document.getElementById('cartAddrRoad').value,
            line2: '',
            landmark: document.getElementById('cartAddrLandmark').value,
            city: document.getElementById('cartAddrCity').value,
            state: document.getElementById('cartAddrState').value,
            pincode: document.getElementById('cartAddrPincode').value,
            phone: document.getElementById('cartAddrPhone').value
        };

        // Save to localStorage
        const savedAddresses = JSON.parse(localStorage.getItem('savourlyAddresses')) || [];
        savedAddresses.push(newAddr);
        localStorage.setItem('savourlyAddresses', JSON.stringify(savedAddresses));

        // Re-render and auto-select
        renderDeliverySection();
    });

    // Initial Render
    renderDeliverySection();

    // Apply coupon button
    applyCouponBtn?.addEventListener('click', applyCoupon);

    // Apply coupon on Enter key
    couponInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            applyCoupon();
        }
    });

    // Remove coupon
    removeCouponBtn?.addEventListener('click', removeCoupon);

    // Checkout button
    checkoutBtnMain?.addEventListener('click', handleCheckout);

    // Payment method handling
    const paymentOptions = document.querySelectorAll('.payment-option');
    const upiInputSection = document.getElementById('upiInputSection');
    let selectedPayment = 'cod';

    // Payment method labels for button O(1) lookup
    const paymentLabels = {
        'cod': 'Proceed to Payment',
        'gpay': 'Pay with Google Pay',
        'phonepe': 'Pay with PhonePe',
        'upi': 'Pay with UPI'
    };

    // Initialize payment method handlers
    paymentOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Remove active from all O(n) but n is always 4
            paymentOptions.forEach(o => o.classList.remove('active'));
            option.classList.add('active');

            // Update selected payment
            selectedPayment = option.dataset.method;

            // Update button text and style
            updateCheckoutButton(selectedPayment);

            // Show/hide UPI input
            if (upiInputSection) {
                upiInputSection.style.display = selectedPayment === 'upi' ? 'block' : 'none';
            }
        });
    });

    // Update checkout button based on payment method
    function updateCheckoutButton(method) {
        if (!checkoutBtnMain) return;

        // Remove all payment classes
        checkoutBtnMain.classList.remove('gpay', 'phonepe', 'upi');

        // Add appropriate class and update text
        const btnText = checkoutBtnMain.querySelector('span');
        if (btnText) {
            btnText.textContent = paymentLabels[method] || 'Proceed to Payment';
        }

        // Add style class for non-COD payments
        if (method !== 'cod') {
            checkoutBtnMain.classList.add(method);
        }
    }


    // Render cart items
    function renderCart() {
        if (cart.length === 0) {
            showEmptyCart();
            return;
        }

        hideEmptyCart();

        cartSubtitle.textContent = `${cart.length} item${cart.length > 1 ? 's' : ''} in your cart`;

        cartItemsList.innerHTML = cart.map((item, index) => `
            <div class="cart-item" data-index="${index}">
                <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-description">Fresh meals delivered weekly</div>
                    <div class="cart-item-price">₹${item.price.toLocaleString('en-IN')} <span>/week</span></div>
                </div>
                <div class="quantity-controls">
                    <button class="qty-btn qty-minus" data-index="${index}">−</button>
                    <span class="qty-value">${item.quantity || 1}</span>
                    <button class="qty-btn qty-plus" data-index="${index}">+</button>
                </div>
                <button class="remove-item-btn" data-index="${index}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                    </svg>
                </button>
            </div>
        `).join('');

        // Add event listeners for quantity and remove buttons
        document.querySelectorAll('.qty-plus').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                updateQuantity(index, 1);
            });
        });

        document.querySelectorAll('.qty-minus').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                updateQuantity(index, -1);
            });
        });

        document.querySelectorAll('.remove-item-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                removeItem(index);
            });
        });

        updateTotals();
    }

    // Update quantity
    function updateQuantity(index, change) {
        if (!cart[index].quantity) {
            cart[index].quantity = 1;
        }

        cart[index].quantity += change;

        if (cart[index].quantity <= 0) {
            removeItem(index);
            return;
        }

        saveCart();
        renderCart();
    }

    // Remove item
    function removeItem(index) {
        cart.splice(index, 1);
        saveCart();
        renderCart();

        // Show toast notification
        showToast('Item removed from cart');
    }

    // Save cart to localStorage
    function saveCart() {
        localStorage.setItem('savourlyCart', JSON.stringify(cart));
    }

    // Calculate subtotal
    function calculateSubtotal() {
        return cart.reduce((sum, item) => {
            const qty = item.quantity || 1;
            return sum + (item.price * qty);
        }, 0);
    }

    // Calculate discount
    function calculateDiscount(subtotal) {
        if (!appliedCoupon) return 0;

        const coupon = COUPONS[appliedCoupon];
        if (!coupon) return 0;

        if (coupon.type === 'percent') {
            return Math.round(subtotal * coupon.discount / 100);
        } else {
            return coupon.discount;
        }
    }

    // Update totals display
    function updateTotals() {
        const subtotal = calculateSubtotal();
        const discount = calculateDiscount(subtotal);
        const total = subtotal - discount;

        subtotalAmount.textContent = `₹${subtotal.toLocaleString('en-IN')}`;

        if (discount > 0) {
            discountRow.style.display = 'flex';
            discountAmount.textContent = `-₹${discount.toLocaleString('en-IN')}`;
        } else {
            discountRow.style.display = 'none';
        }

        totalAmount.textContent = `₹${total.toLocaleString('en-IN')}`;
    }

    // Apply coupon
    function applyCoupon() {
        const code = couponInput.value.trim().toUpperCase();

        if (!code) {
            showCouponMessage('Please enter a coupon code', 'error');
            return;
        }

        if (COUPONS[code]) {
            appliedCoupon = code;
            couponInput.value = '';
            couponInput.disabled = true;
            applyCouponBtn.disabled = true;

            // Show applied coupon tag
            couponApplied.style.display = 'block';
            appliedCouponCode.textContent = `${code} - ${COUPONS[code].description}`;

            showCouponMessage('Coupon applied successfully!', 'success');
            updateTotals();

            // Hide input wrapper
            document.querySelector('.coupon-input-wrapper').style.display = 'none';
        } else {
            showCouponMessage('Invalid coupon code', 'error');
            couponInput.classList.add('shake');
            setTimeout(() => couponInput.classList.remove('shake'), 500);
        }
    }

    // Remove coupon
    function removeCoupon() {
        appliedCoupon = null;
        couponInput.value = '';
        couponInput.disabled = false;
        applyCouponBtn.disabled = false;
        couponApplied.style.display = 'none';
        couponMessage.textContent = '';
        couponMessage.className = 'coupon-message';
        document.querySelector('.coupon-input-wrapper').style.display = 'flex';
        updateTotals();
    }

    // Show coupon message
    function showCouponMessage(message, type) {
        couponMessage.textContent = message;
        couponMessage.className = `coupon-message ${type}`;

        if (type === 'error') {
            setTimeout(() => {
                couponMessage.textContent = '';
                couponMessage.className = 'coupon-message';
            }, 3000);
        }
    }

    // Show empty cart
    function showEmptyCart() {
        if (cartContent) cartContent.style.display = 'none';
        if (emptyCart) emptyCart.style.display = 'block';
    }

    // Hide empty cart
    function hideEmptyCart() {
        if (cartContent) cartContent.style.display = 'grid';
        if (emptyCart) emptyCart.style.display = 'none';
    }

    // Handle checkout
    async function handleCheckout() {
        if (cart.length === 0) {
            showToast('Your cart is empty!');
            return;
        }

        // Get user details
        const userName = document.getElementById('userName')?.value.trim();
        const userPhone = document.getElementById('userPhone')?.value.trim();
        const userAddress = document.getElementById('userAddress')?.value.trim();
        const upiId = document.getElementById('upiId')?.value.trim();

        // Validate user details
        if (!userName) {
            showToast('Please enter your name');
            document.getElementById('userName')?.focus();
            return;
        }
        if (!userPhone || userPhone.length < 10) {
            showToast('Please enter a valid phone number');
            document.getElementById('userPhone')?.focus();
            return;
        }
        if (!userAddress) {
            showToast('Please enter your delivery address');
            document.getElementById('userAddress')?.focus();
            return;
        }
        if (selectedPayment === 'upi' && !upiId) {
            showToast('Please enter your UPI ID');
            document.getElementById('upiId')?.focus();
            return;
        }

        const subtotal = calculateSubtotal();
        const discount = calculateDiscount(subtotal);
        const total = subtotal - discount;

        // Get payment method name
        const paymentMethodNames = {
            'cod': 'Cash on Delivery',
            'gpay': 'Google Pay',
            'phonepe': 'PhonePe',
            'upi': `UPI (${upiId})`
        };

        // Prepare order data for API
        const orderData = {
            customerDetails: {
                name: userName,
                phone: userPhone,
                address: userAddress,
                email: ''
            },
            items: cart.map(item => ({
                planName: item.name,
                price: item.price,
                quantity: item.quantity || 1
            })),
            totalPrice: total,
            paymentMethod: selectedPayment
        };

        // Disable checkout button to prevent double-click
        if (checkoutBtnMain) {
            checkoutBtnMain.disabled = true;
            const btnText = checkoutBtnMain.querySelector('span');
            if (btnText) btnText.textContent = 'Placing Order...';
        }

        try {
            // Try to get Firebase token for authenticated API request
            let token = localStorage.getItem('savourlyAuthToken');

            // If firebase is available, get a fresh token
            if (typeof firebase !== 'undefined' && firebase.auth) {
                const user = firebase.auth().currentUser;
                if (user) {
                    token = await user.getIdToken(true);
                    localStorage.setItem('savourlyAuthToken', token);
                    orderData.customerDetails.email = user.email;
                }
            }

            if (token) {
                // POST to backend API
                const response = await fetch('/api/orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(orderData)
                });

                if (response.ok) {
                    const result = await response.json();

                    // Also save to localStorage for order tracking page
                    const localOrder = {
                        id: result.order.orderId,
                        items: cart,
                        customer: { name: userName, phone: userPhone, address: userAddress },
                        payment: selectedPayment,
                        subtotal,
                        discount,
                        total,
                        coupon: appliedCoupon,
                        timestamp: result.order.timestamp
                    };
                    const orders = JSON.parse(localStorage.getItem('savourlyOrders')) || [];
                    orders.push(localOrder);
                    localStorage.setItem('savourlyOrders', JSON.stringify(orders));

                    // Clear cart and show success
                    cart = [];
                    saveCart();
                    showOrderSuccess(result.order.orderId);
                    return;
                } else {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to place order');
                }
            } else {
                // No token — user not logged in, prompt to login
                showToast('Please log in to place an order');
                setTimeout(() => {
                    window.location.href = 'signin.html';
                }, 1500);
                return;
            }
        } catch (error) {
            console.error('Order error:', error);

            // Fallback to localStorage-only order
            const fallbackOrder = {
                id: 'ORD' + Date.now(),
                items: cart,
                customer: { name: userName, phone: userPhone, address: userAddress },
                payment: selectedPayment,
                subtotal,
                discount,
                total,
                coupon: appliedCoupon,
                timestamp: new Date().toISOString()
            };
            const orders = JSON.parse(localStorage.getItem('savourlyOrders')) || [];
            orders.push(fallbackOrder);
            localStorage.setItem('savourlyOrders', JSON.stringify(orders));

            cart = [];
            saveCart();
            showOrderSuccess(fallbackOrder.id);
        }
    }

    // Order success overlay
    function showOrderSuccess(orderId) {
        const overlay = document.createElement('div');
        overlay.id = 'orderSuccessOverlay';
        overlay.innerHTML = `
            <div style="
                position: fixed; inset: 0; z-index: 10000;
                background: rgba(0,0,0,0.7); backdrop-filter: blur(8px);
                display: flex; align-items: center; justify-content: center;
                animation: fadeIn 0.3s ease;
            ">
                <div style="
                    background: #fff; border-radius: 20px; padding: 48px 40px;
                    text-align: center; max-width: 420px; width: 90%;
                    box-shadow: 0 24px 80px rgba(0,0,0,0.25);
                    animation: scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1);
                ">
                    <div style="
                        width: 80px; height: 80px; border-radius: 50%;
                        background: linear-gradient(135deg, #00C9A7, #00e6be);
                        display: flex; align-items: center; justify-content: center;
                        margin: 0 auto 20px; animation: checkPop 0.5s 0.3s both;
                    ">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                    </div>
                    <h2 style="font-size: 24px; font-weight: 800; color: #111; margin-bottom: 8px;">
                        Order Placed! 🎉
                    </h2>
                    <p style="color: #6b7280; font-size: 15px; margin-bottom: 6px;">
                        Your order has been placed successfully.
                    </p>
                    <p style="
                        color: #00C9A7; font-weight: 700; font-size: 16px;
                        background: #f0fdf9; padding: 8px 16px; border-radius: 8px;
                        display: inline-block; margin-bottom: 20px;
                    ">
                        ${orderId}
                    </p>
                    <p style="color: #9ca3af; font-size: 13px;">
                        Redirecting to home page...
                    </p>
                </div>
            </div>
        `;

        // Add animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
            @keyframes scaleIn { from { opacity: 0; transform: scale(0.85) } to { opacity: 1; transform: scale(1) } }
            @keyframes checkPop { from { transform: scale(0) } to { transform: scale(1) } }
        `;
        document.head.appendChild(style);
        document.body.appendChild(overlay);

        // Redirect to home after 4 seconds
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 4000);
    }


    // Toast notification

    function showToast(message) {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--gray-800);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            z-index: 10000;
            animation: slideUp 0.3s ease;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideDown 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideUp {
            from { opacity: 0; transform: translateX(-50%) translateY(20px); }
            to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes slideDown {
            from { opacity: 1; transform: translateX(-50%) translateY(0); }
            to { opacity: 0; transform: translateX(-50%) translateY(20px); }
        }
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }
        .shake { animation: shake 0.3s ease; }
    `;
    document.head.appendChild(style);
});
